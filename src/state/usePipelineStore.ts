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

interface PipelineState {
  active: boolean;
  running: boolean;
  failed: boolean;
  complete: boolean;
  currentStepIndex: number; // 0 to 4 (OCR, Parse, Code, Predict, Validate)
  stepStates: [StepState, StepState, StepState, StepState, StepState];
  attempt: number;
  totalSeconds: string | null;
  docs: PipelineDoc[];
  claimId: string;
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
  attempt: 1,
  totalSeconds: null,
  docs: [],
  claimId: '3f8a1d6c-52b4-4e7a-9c11-0d5e2ab77104',

  startPipeline: files => {
    const docs: PipelineDoc[] = files.map(f => ({
      name: f.name,
      docType: f.docType,
      kind: f.kind,
      ocr: 'q',
      parse: 'q',
      scanType: f.name.toLowerCase().includes('mri') ? 'MRI' : undefined,
    }));

    set({
      active: true,
      running: true,
      failed: false,
      complete: false,
      currentStepIndex: 0,
      stepStates: ['r', 'q', 'q', 'q', 'q'],
      attempt: 1,
      totalSeconds: null,
      docs,
    });

    // Run simulation tick
    let step = 0;
    const runStep = () => {
      if (step === 0) {
        set(state => ({
          docs: state.docs.map(d => ({ ...d, ocr: 'd' })),
          stepStates: ['d', 'r', 'q', 'q', 'q'],
          currentStepIndex: 1,
        }));
        step++;
        setTimeout(runStep, 800);
      } else if (step === 1) {
        set(state => ({
          docs: state.docs.map(d => ({ ...d, parse: 'd' })),
          stepStates: ['d', 'd', 'r', 'q', 'q'],
          currentStepIndex: 2,
        }));
        step++;
        setTimeout(runStep, 800);
      } else if (step === 2) {
        set({ stepStates: ['d', 'd', 'd', 'r', 'q'], currentStepIndex: 3 });
        step++;
        setTimeout(runStep, 800);
      } else if (step === 3) {
        set({ stepStates: ['d', 'd', 'd', 'd', 'r'], currentStepIndex: 4 });
        step++;
        setTimeout(runStep, 800);
      } else if (step === 4) {
        set({
          stepStates: ['d', 'd', 'd', 'd', 'd'],
          running: false,
          complete: true,
          totalSeconds: '4.2',
        });
      }
    };

    setTimeout(runStep, 600);
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
      attempt: 1,
      totalSeconds: null,
      docs: [],
    }),
}));
