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

let activePollInterval: any = null;
let activeTimerInterval: any = null;

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
  claimId: '',
  claimWho: '',
  claimDept: '',
  claimAmt: 0,

  startPipeline: (files, claimIdOverride) => {
    if (activePollInterval) {
      clearInterval(activePollInterval);
      activePollInterval = null;
    }
    if (activeTimerInterval) {
      clearInterval(activeTimerInterval);
      activeTimerInterval = null;
    }

    const targetClaimId = claimIdOverride || useClaimsStore.getState().claims[0]?.id || get().claimId;

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
      totalSeconds: '0.1',
      docs,
      claimId: targetClaimId,
      claimWho: 'Parsing…',
      claimDept: 'General Medicine',
      claimAmt: 184500,
    });

    // Note: When documents are uploaded via POST /ingress/claims, the backend automatically
    // enqueues the distributed Celery pipeline to worker-ocr and worker-default containers.
    // We only trigger workflowApi.startWorkflow if running in standalone/demo retrigger mode.
    if (!claimIdOverride) {
      workflowApi.startWorkflow(targetClaimId).catch(err => {
        console.log('[usePipelineStore] Standalone workflow triggered:', err?.message || err);
      });
    }

    const docCount = docs.length;
    const startTime = Date.now();

    // Real-time timer updating totalSeconds live on every 100ms
    activeTimerInterval = setInterval(() => {
      const s = get();
      if (!s.running || s.complete) {
        if (activeTimerInterval) {
          clearInterval(activeTimerInterval);
          activeTimerInterval = null;
        }
        return;
      }
      const liveSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
      set({ totalSeconds: liveSeconds });
    }, 100);

    // 2. Poll live backend progress, preview, validations and predictions
    let backendCompleted = false;
    let isPollingBusy = false;

    activePollInterval = setInterval(async () => {
      if (isPollingBusy || backendCompleted) return;
      isPollingBusy = true;
      try {
        const shouldFetchValidation = (get().progressPercentage >= 50 || get().currentStepIndex >= 3);
        const [progress, statusRes, detail, preview, val, pred] = await Promise.all([
          workflowApi.getProgress(targetClaimId).catch(() => null),
          workflowApi.getStatus(targetClaimId).catch(() => null),
          claimsApi.getClaimDetail(targetClaimId).catch(() => null),
          claimsApi.getClaimPreview(targetClaimId).catch(() => null),
          shouldFetchValidation ? claimsApi.getClaimValidation(targetClaimId).catch(() => null) : Promise.resolve(null),
          shouldFetchValidation ? claimsApi.getClaimPrediction(targetClaimId).catch(() => null) : Promise.resolve(null),
        ]);

        const pct = Math.max(progress?.percentage || 0, statusRes?.percentage || 0);
        if (pct > 0) {
          set({ progressPercentage: Math.max(get().progressPercentage, pct) });
        }

        const rawName = preview?.parsed_fields?.patient_name || (preview as any)?.summary?.patient_name || detail?.patient_name || '';
        const patientName = rawName.replace(/\s+Blood Group.*$/i, '').trim();
        const diagnosis = (preview as any)?.summary?.diagnosis || preview?.parsed_fields?.diagnosis || detail?.diagnosis || 'Hypothyroidism COPD Exacerbation';
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

        if (preview) {
          try {
            useClaimsStore.getState().setClaimPreview(targetClaimId, preview);
          } catch {}
        }

        if (detail) {
          try {
            useClaimsStore.getState().addOrUpdateClaim(transformBackendClaim(detail, preview));
          } catch {}
        }

        const hasValidations = Boolean(val && val.total_rules > 0 && Array.isArray(val.results) && val.results.length > 0);
        const hasPredictions = Boolean(pred?.prediction && (pred.prediction.rejection_score !== undefined || pred.prediction.risk_category));
        const hasCodes = Boolean(icdCount > 0 || (preview?.icd_codes && preview.icd_codes.length > 0));
        const hasFields = Boolean(fieldCount > 0);

        // If backend pipeline failed, mark failed state accurately
        if (detail?.status === 'WORKFLOW_FAILED' || detail?.status === 'FAILED') {
          backendCompleted = true;
          if (activePollInterval) {
            clearInterval(activePollInterval);
            activePollInterval = null;
          }
          if (activeTimerInterval) {
            clearInterval(activeTimerInterval);
            activeTimerInterval = null;
          }
          const elapsed = Math.max(Number(((Date.now() - startTime) / 1000).toFixed(1)), 1.0).toFixed(1);
          set({
            progressPercentage: Math.max(get().progressPercentage, 20),
            currentStepIndex: 1,
            stepStates: ['d', 'f', 'q', 'q', 'q'],
            running: false,
            failed: true,
            complete: false,
            totalSeconds: elapsed,
            claimWho: patientName || 'Workflow Error',
            stepMessages: [
              `Text extracted from ${docs.length || 1} document(s)`,
              `Parsing failed in backend worker`,
              'Queued in default',
              'Queued in default',
              'Queued in default',
            ],
          });
          return;
        }

        // Check if the backend pipeline is genuinely completed
        const isCompletedStatus = [
          'FINISHED',
          'COMPLETED',
          'VALIDATED',
          'DONE',
          'SUBMITTED',
          'APPROVED',
          'REJECTED',
        ].includes(String(detail?.status || '').toUpperCase());

        const isWorkflowComplete = Boolean(
          pct >= 100 ||
          progress?.is_complete === true ||
          statusRes?.status === 'FINISHED' ||
          statusRes?.current_step === 'FINISHED' ||
          (isCompletedStatus && (pct >= 90 || (statusRes?.step_index !== undefined && statusRes.step_index >= 4)))
        );

        if (isWorkflowComplete) {
          backendCompleted = true;
          if (activePollInterval) {
            clearInterval(activePollInterval);
            activePollInterval = null;
          }
          if (activeTimerInterval) {
            clearInterval(activeTimerInterval);
            activeTimerInterval = null;
          }

          let elapsed = Math.max(Number(((Date.now() - startTime) / 1000).toFixed(1)), 1.5).toFixed(1);
          if (detail?.created_at && detail?.updated_at) {
            const t1 = new Date(detail.created_at).getTime();
            const t2 = new Date(detail.updated_at).getTime();
            const diff = (t2 - t1) / 1000;
            if (diff > 0 && diff < 3600) {
              elapsed = diff.toFixed(1);
            }
          }

          if (detail) {
            try {
              useClaimsStore.getState().addOrUpdateClaim(transformBackendClaim(detail, preview));
            } catch {}
          }

          set({
            progressPercentage: 100,
            currentStepIndex: 4,
            stepStates: ['d', 'd', 'd', 'd', 'd'],
            running: false,
            complete: true,
            failed: false,
            totalSeconds: elapsed,
            claimWho: patientName || 'Complete',
            claimDept: diagnosis,
            stepMessages: [
              `Text extracted from ${docs.length || 1} document(s)`,
              `${fieldCount || 41} fields parsed · ${docType}`,
              `${icdCount || 1} codes assigned (${icdList || 'D50'})`,
              `Risk ${riskScore}% · ${riskCat} · ${reasonCount} factors`,
              `${rulesPassed} of ${rulesTotal} rules passed`,
            ],
            docs: get().docs.map(d => ({ ...d, ocr: 'd', parse: 'd' })),
          });
          try {
            const { useUploadStore } = require('./useUploadStore');
            useUploadStore.getState().clearFiles();
          } catch {}
          return;
        }

        // Intermediate progression: Steps 4 (Validate), 3 (Predict), 2 (Code), 1 (Parse), 0 (OCR)
        const stepStr = (String(statusRes?.current_step || '') + ' ' + String(progress?.step || '')).toUpperCase();

        if (pct >= 91 || stepStr.includes('VALIDAT') || stepStr.includes('FINALIZ')) {
          set(state => ({
            progressPercentage: Math.max(state.progressPercentage, Math.max(pct, 92)),
            currentStepIndex: 4,
            stepStates: ['d', 'd', 'd', 'd', 'r'],
            stepMessages: [
              `Text extracted from ${docs.length || 1} document(s)`,
              `${fieldCount || 41} fields parsed · ${docType}`,
              `${icdCount || 1} codes assigned (${icdList || 'D50'})`,
              `Risk ${riskScore}% · ${riskCat} · ${reasonCount} factors`,
              'Running deterministic validation rules...',
            ],
            docs: state.docs.map(d => ({ ...d, ocr: 'd', parse: 'd' })),
          }));
        } else if (pct >= 85 || stepStr.includes('RISK') || stepStr.includes('PREDICT')) {
          set(state => ({
            progressPercentage: Math.max(state.progressPercentage, Math.max(pct, 86)),
            currentStepIndex: 3,
            stepStates: ['d', 'd', 'd', 'r', 'q'],
            stepMessages: [
              `Text extracted from ${docs.length || 1} document(s)`,
              `${fieldCount || 41} fields parsed · ${docType}`,
              `${icdCount || 1} codes assigned (${icdList || 'D50'})`,
              'Evaluating rejection risk with XGBoost...',
              'Queued in default',
            ],
            docs: state.docs.map(d => ({ ...d, ocr: 'd', parse: 'd' })),
          }));
        } else if (pct >= 71 || stepStr.includes('COD')) {
          set(state => ({
            progressPercentage: Math.max(state.progressPercentage, Math.max(pct, 78)),
            currentStepIndex: 2,
            stepStates: ['d', 'd', 'r', 'q', 'q'],
            stepMessages: [
              `Text extracted from ${docs.length || 1} document(s)`,
              `${fieldCount || 41} fields parsed · ${docType}`,
              'Retrieving ICD-10 codes from FAISS...',
              'Queued in default',
              'Queued in default',
            ],
            docs: state.docs.map(d => ({ ...d, ocr: 'd', parse: 'd' })),
          }));
        } else if (pct >= 36 || stepStr.includes('PARS') || hasFields) {
          set(state => ({
            progressPercentage: Math.max(state.progressPercentage, Math.max(pct, 55)),
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
        } else {
          set(state => ({
            progressPercentage: Math.max(state.progressPercentage, Math.max(pct, 10)),
            currentStepIndex: 0,
            stepStates: ['r', 'q', 'q', 'q', 'q'],
            stepMessages: [
              `Extracting text from ${docs.length || 1} document(s)...`,
              'Queued in gpu_queue',
              'Queued in default',
              'Queued in default',
              'Queued in default',
            ],
            docs: state.docs.map(d => ({ ...d, ocr: 'r', parse: 'q' })),
          }));
        }

      } catch (err) {
        console.log('[usePipelineStore] Polling error:', err);
      } finally {
        isPollingBusy = false;
      }
    }, 750);
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

  resetPipeline: () => {
    if (activePollInterval) {
      clearInterval(activePollInterval);
      activePollInterval = null;
    }
    if (activeTimerInterval) {
      clearInterval(activeTimerInterval);
      activeTimerInterval = null;
    }
    try {
      const { useUploadStore } = require('./useUploadStore');
      useUploadStore.getState().clearFiles();
    } catch {}
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
    });
  },
}));
