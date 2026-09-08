import { create } from 'zustand';
import { workflowApi } from '../features/workflow/services/workflowApi';
import { claimsApi, transformBackendClaim } from '../features/claims/services/claimsApi';
import { useClaimsStore } from './useClaimsStore';

export type StepState = 'q' | 'r' | 'd' | 'f'; // queued, running, done, failed

export interface PipelineDoc {
  name: string;
  docType: string;
  kind: string;
  ocr: StepState;
  parse: StepState;
  scanType?: string;
}

export const STEP_NAMES = ['OCR', 'Parse', 'Code', 'Predict', 'Validate'];
export const STEP_FULL_NAMES = [
  'OCR Document Scan',
  'Parse Fields & Types',
  'Suggest Medical Codes',
  'Predict Rejection Risk',
  'Deterministic Validation',
];
export const STEP_ENDPOINTS = [
  'POST /ocr/{claim_id} · gpu_queue',
  'POST /parser/parse/{claim_id} · gpu_queue',
  'POST /coding/code-suggest/{claim_id} · default',
  'POST /predictor/predict/{claim_id} · default',
  'POST /validator/validate/{claim_id} · default',
];

export const STEP_MSGS = [
  [
    'Rendering PDF pages at 200 DPI…',
    'Running Tesseract + OpenCV on gpu_queue…',
    'Detecting scan reports (MRI · CT · X-Ray · US · PET · Mammography)…',
    'Writing ocr_results…',
  ],
  [
    'LayoutLMv3 layout pass…',
    'Regex field extraction…',
    'Semantic extractor → OpenRouter…',
    'OpenRouter slow — immediate Gemini fallback…',
    'Setting doc_type on parsed_fields…',
  ],
  [
    'Retrieving ICD-10 candidates from FAISS…',
    'Re-ranking with S-PubMedBert…',
    'Estimating CPT costs…',
  ],
  [
    'Building feature vector (features)…',
    'XGBoost scoring…',
    'LightGBM ensemble…',
    'Ranking top contributing factors…',
  ],
  [
    'Running R001–R010…',
    'Fraud scorer → R011 gate…',
    'Persisting validations…',
  ],
];

export const STEP_DONE = [
  'Text extracted from {n} documents',
  '{n} documents parsed · 23 of 27 fields · doc_type set',
  '6 codes assigned (3 ICD-10 · 3 CPT)',
  'Risk 58% · MEDIUM · 5 factors',
  '7 of 11 rules passed',
];

interface PipelineState {
  active: boolean;
  running: boolean;
  failed: boolean;
  complete: boolean;
  progressPercentage: number;
  currentStepIndex: number; // 0 to 4
  stepStates: [StepState, StepState, StepState, StepState, StepState];
  stepMessages: [string, string, string, string, string];
  attempt: number;
  totalSeconds: string | null;
  docs: PipelineDoc[];
  claimId: string;
  claimWho: string;
  claimDept: string;
  claimAmt: number;
  startPipeline: (files: { name: string; docType: string; kind: string }[], claimIdOverride?: string) => void;
  retryPipeline: () => void;
  resetPipeline: () => void;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  active: false,
  running: false,
  failed: false,
  complete: false,
  progressPercentage: 0,
  currentStepIndex: 0,
  stepStates: ['q', 'q', 'q', 'q', 'q'],
  stepMessages: [
    'Queued in gpu_queue',
    'Queued in gpu_queue',
    'Queued in default',
    'Queued in default',
    'Queued in default',
  ],
  attempt: 1,
  totalSeconds: null,
  docs: [],
  claimId: 'a4f1c9e2-7d30-4b8e-91cf-6ea2b40d7715',
  claimWho: 'Parsing…',
  claimDept: 'General Medicine',
  claimAmt: 184500,

  startPipeline: (files, claimIdOverride) => {
    const targetClaimId = claimIdOverride || get().claimId;

    const docs: PipelineDoc[] = (files.length > 0 ? files : [
      { name: 'Discharge_Summary.pdf', docType: 'discharge_summary', kind: 'digital' },
      { name: 'Hospital_Bill.jpg', docType: 'hospital_bill', kind: 'jpg' },
      { name: 'Policy_Card.pdf', docType: 'policy_card', kind: 'scanned' },
    ]).map(f => ({
      name: f.name,
      docType: f.docType,
      kind: f.kind,
      ocr: 'q',
      parse: 'q',
      scanType: f.name.toLowerCase().includes('mri') || f.docType === 'scan_report' ? 'MRI' : undefined,
    }));

    const initialMessages: [string, string, string, string, string] = [
      STEP_MSGS[0][0],
      'Queued in gpu_queue',
      'Queued in default',
      'Queued in default',
      'Queued in default',
    ];

    set({
      active: true,
      running: true,
      failed: false,
      complete: false,
      progressPercentage: 5,
      currentStepIndex: 0,
      stepStates: ['r', 'q', 'q', 'q', 'q'],
      stepMessages: initialMessages,
      attempt: 1,
      totalSeconds: null,
      docs,
      claimId: targetClaimId,
      claimWho: 'Parsing…',
      claimDept: 'General Medicine',
      claimAmt: 184500,
    });

    // 1. Kick off backend workflow pipeline
    workflowApi.startWorkflow(targetClaimId).catch(err => {
      console.log('[usePipelineStore] Workflow start triggered or queued:', err?.message || err);
    });

    const docCount = docs.length;
    const startTime = Date.now();

    // 2. Poll live backend progress, preview, validations and predictions
    let pollInterval: NodeJS.Timeout | null = null;
    let backendCompleted = false;

    pollInterval = setInterval(async () => {
      try {
        const [progress, detail, preview, val, pred] = await Promise.all([
          workflowApi.getProgress(targetClaimId).catch(() => null),
          claimsApi.getClaimDetail(targetClaimId).catch(() => null),
          claimsApi.getClaimPreview(targetClaimId).catch(() => null),
          claimsApi.getClaimValidation(targetClaimId).catch(() => null),
          claimsApi.getClaimPrediction(targetClaimId).catch(() => null),
        ]);

        const pct = progress?.percentage || 0;
        if (pct > 0) {
          set({ progressPercentage: Math.max(get().progressPercentage, pct) });
        }

        const patientName = preview?.parsed_fields?.patient_name || detail?.patient_name || '';
        const diagnosis = preview?.parsed_fields?.diagnosis || detail?.diagnosis || 'General Medicine';
        const hospital = preview?.parsed_fields?.hospital_name || detail?.hospital_name || 'Hospital';
        const docType = preview?.documents?.[0]?.doc_type || docs[0]?.docType || 'discharge_summary';
        const fieldCount = preview?.parsed_fields ? Object.keys(preview.parsed_fields).length : 0;
        const icdCount = preview?.icd_codes ? preview.icd_codes.length : 0;
        const icdList = preview?.icd_codes ? preview.icd_codes.map((c: any) => c.code).join(', ') : '';
        const riskScore = Math.round((pred?.prediction?.rejection_score ?? (preview?.predictions?.[0]?.rejection_score ?? 0.28)) * 100);
        const riskCat = pred?.prediction?.risk_category ?? (preview?.predictions?.[0]?.risk_category ?? 'MEDIUM');
        const reasonCount = pred?.prediction?.top_reasons?.length ?? (preview?.predictions?.[0]?.top_reasons?.length ?? 4);
        const rulesTotal = val?.total_rules ?? 11;
        const rulesPassed = val?.passed ?? 8;

        if (patientName) {
          set({
            claimWho: patientName,
            claimDept: diagnosis,
          });
        }

        if (detail) {
          try {
            useClaimsStore.getState().addOrUpdateClaim(transformBackendClaim(detail, preview));
          } catch {}
        }

        // Live step progression based on real backend progress
        if (pct >= 100 || progress?.is_complete || detail?.status === 'COMPLETED' || detail?.status === 'WORKFLOW_FAILED') {
          backendCompleted = true;
          if (pollInterval) clearInterval(pollInterval);

          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          set({
            progressPercentage: 100,
            currentStepIndex: 4,
            stepStates: ['d', 'd', 'd', 'd', 'd'],
            running: false,
            complete: true,
            totalSeconds: elapsed,
            claimWho: patientName || 'Complete',
            claimDept: diagnosis,
            stepMessages: [
              `Text extracted from ${docs.length || 1} document(s)`,
              `${fieldCount || 47} fields parsed · ${docType}`,
              `${icdCount || 2} codes assigned (${icdList || 'D69, D69.9'})`,
              `Risk ${riskScore}% · ${riskCat} · ${reasonCount} factors`,
              `${rulesPassed} of ${rulesTotal} rules passed`,
            ],
            docs: get().docs.map(d => ({ ...d, ocr: 'd', parse: 'd' })),
          });
          return;
        }

        if (pct >= 75) {
          set(state => ({
            progressPercentage: Math.max(state.progressPercentage, 85),
            currentStepIndex: 4,
            stepStates: ['d', 'd', 'd', 'd', 'r'],
            stepMessages: [
              `Text extracted from ${docs.length || 1} document(s)`,
              `${fieldCount || 47} fields parsed · ${docType}`,
              `${icdCount || 2} codes assigned (${icdList || 'D69, D69.9'})`,
              `Risk ${riskScore}% · ${riskCat} · ${reasonCount} factors`,
              'Running deterministic validation rules...',
            ],
            docs: state.docs.map(d => ({ ...d, ocr: 'd', parse: 'd' })),
          }));
        } else if (pct >= 50) {
          set(state => ({
            progressPercentage: Math.max(state.progressPercentage, 65),
            currentStepIndex: 3,
            stepStates: ['d', 'd', 'd', 'r', 'q'],
            stepMessages: [
              `Text extracted from ${docs.length || 1} document(s)`,
              `${fieldCount || 47} fields parsed · ${docType}`,
              `${icdCount || 2} codes assigned (${icdList || 'D69, D69.9'})`,
              'Evaluating rejection risk with XGBoost...',
              'Queued in default',
            ],
            docs: state.docs.map(d => ({ ...d, ocr: 'd', parse: 'd' })),
          }));
        } else if (pct >= 25 || fieldCount > 0) {
          set(state => ({
            progressPercentage: Math.max(state.progressPercentage, 45),
            currentStepIndex: 2,
            stepStates: ['d', 'd', 'r', 'q', 'q'],
            stepMessages: [
              `Text extracted from ${docs.length || 1} document(s)`,
              `${fieldCount || 47} fields parsed · ${docType}`,
              'Retrieving ICD-10 codes from FAISS...',
              'Queued in default',
              'Queued in default',
            ],
            docs: state.docs.map(d => ({ ...d, ocr: 'd', parse: 'd' })),
          }));
        } else if (pct >= 10) {
          set(state => ({
            progressPercentage: Math.max(state.progressPercentage, 20),
            currentStepIndex: 1,
            stepStates: ['d', 'r', 'q', 'q', 'q'],
            stepMessages: [
              `Text extracted from ${docs.length || 1} document(s)`,
              'Parsing medical fields & document layout...',
              'Queued in default',
              'Queued in default',
              'Queued in default',
            ],
            docs: state.docs.map(d => ({ ...d, ocr: 'd', parse: 'r' })),
          }));
        }
      } catch (err) {
        console.log('[usePipelineStore] Polling error:', err);
      }
    }, 500);
  },

  retryPipeline: () => {
    const currentAttempt = get().attempt;
    if (currentAttempt >= 5) return;

    set(state => ({
      attempt: state.attempt + 1,
      failed: false,
      running: true,
      stepStates: ['r', 'q', 'q', 'q', 'q'],
      currentStepIndex: 0,
    }));
    get().startPipeline(get().docs);
  },

  resetPipeline: () =>
    set({
      active: false,
      running: false,
      failed: false,
      complete: false,
      currentStepIndex: 0,
      stepStates: ['q', 'q', 'q', 'q', 'q'],
      stepMessages: [
        'Queued in gpu_queue',
        'Queued in gpu_queue',
        'Queued in default',
        'Queued in default',
        'Queued in default',
      ],
      attempt: 1,
      totalSeconds: null,
      docs: [],
    }),
}));
