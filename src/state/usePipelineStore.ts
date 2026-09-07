import { create } from 'zustand';

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
  '{n} documents parsed · 20 of 24 fields · doc_type set',
  '6 codes assigned (3 ICD-10 · 3 CPT)',
  'Risk 58% · MEDIUM · 5 factors',
  '7 of 11 rules passed',
];

interface PipelineState {
  active: boolean;
  running: boolean;
  failed: boolean;
  complete: boolean;
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
  startPipeline: (files: { name: string; docType: string; kind: string }[]) => void;
  retryPipeline: () => void;
  resetPipeline: () => void;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
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
  claimId: '3f8a1d6c-52b4-4e7a-9c11-0d5e2ab77104',
  claimWho: 'Parsing…',
  claimDept: 'General Medicine',
  claimAmt: 145000,

  startPipeline: files => {
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
      currentStepIndex: 0,
      stepStates: ['r', 'q', 'q', 'q', 'q'],
      stepMessages: initialMessages,
      attempt: 1,
      totalSeconds: null,
      docs,
      claimId: '3f8a1d6c-52b4-4e7a-9c11-0d5e2ab77104',
      claimWho: 'Parsing…',
      claimDept: 'General Medicine',
      claimAmt: 145000,
    });

    const docCount = docs.length;

    // Step 0: OCR
    let msgIdx = 0;
    const ocrTimer = setInterval(() => {
      msgIdx = (msgIdx + 1) % STEP_MSGS[0].length;
      set(state => {
        const msgs = [...state.stepMessages] as [string, string, string, string, string];
        msgs[0] = STEP_MSGS[0][msgIdx];
        return { stepMessages: msgs };
      });
    }, 600);

    setTimeout(() => {
      clearInterval(ocrTimer);
      set(state => {
        const msgs = [...state.stepMessages] as [string, string, string, string, string];
        msgs[0] = STEP_DONE[0].replace('{n}', String(docCount));
        msgs[1] = STEP_MSGS[1][0];
        return {
          docs: state.docs.map(d => ({ ...d, ocr: 'd' })),
          stepStates: ['d', 'r', 'q', 'q', 'q'],
          stepMessages: msgs,
          currentStepIndex: 1,
        };
      });

      // Step 1: Parse
      let parseMsgIdx = 0;
      const parseTimer = setInterval(() => {
        parseMsgIdx = (parseMsgIdx + 1) % STEP_MSGS[1].length;
        set(state => {
          const msgs = [...state.stepMessages] as [string, string, string, string, string];
          msgs[1] = STEP_MSGS[1][parseMsgIdx];
          return { stepMessages: msgs };
        });
      }, 600);

      setTimeout(() => {
        clearInterval(parseTimer);
        set(state => {
          const msgs = [...state.stepMessages] as [string, string, string, string, string];
          msgs[1] = STEP_DONE[1].replace('{n}', String(docCount));
          msgs[2] = STEP_MSGS[2][0];
          return {
            docs: state.docs.map(d => ({ ...d, parse: 'd' })),
            stepStates: ['d', 'd', 'r', 'q', 'q'],
            stepMessages: msgs,
            currentStepIndex: 2,
            claimWho: 'R. Menon',
          };
        });

        // Step 2: Code
        setTimeout(() => {
          set(state => {
            const msgs = [...state.stepMessages] as [string, string, string, string, string];
            msgs[2] = STEP_DONE[2];
            msgs[3] = STEP_MSGS[3][0];
            return {
              stepStates: ['d', 'd', 'd', 'r', 'q'],
              stepMessages: msgs,
              currentStepIndex: 3,
            };
          });

          // Step 3: Predict
          setTimeout(() => {
            set(state => {
              const msgs = [...state.stepMessages] as [string, string, string, string, string];
              msgs[3] = STEP_DONE[3];
              msgs[4] = STEP_MSGS[4][0];
              return {
                stepStates: ['d', 'd', 'd', 'd', 'r'],
                stepMessages: msgs,
                currentStepIndex: 4,
              };
            });

            // Step 4: Validate
            setTimeout(() => {
              set(state => {
                const msgs = [...state.stepMessages] as [string, string, string, string, string];
                msgs[4] = STEP_DONE[4];
                return {
                  stepStates: ['d', 'd', 'd', 'd', 'd'],
                  stepMessages: msgs,
                  currentStepIndex: 4,
                  running: false,
                  complete: true,
                  totalSeconds: '4.2',
                  claimWho: 'R. Menon',
                };
              });
            }, 1200);
          }, 1200);
        }, 1200);
      }, 1600);
    }, 1600);
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
