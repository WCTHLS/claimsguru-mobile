import { create } from 'zustand';

export interface UploadFileItem {
  id: string;
  name: string;
  kind: 'digital' | 'scanned' | 'jpg' | 'docx';
  docType: string;
  conf: number;
  size: string;
  status: 'uploading' | 'ready' | 'failed';
  pct: number;
}

export interface UploadEventLogItem {
  time: string;
  event: string;
  detail: string;
  isError?: boolean;
}

interface UploadState {
  files: UploadFileItem[];
  eventLogs: UploadEventLogItem[];
  claimType: 'Reimbursement' | 'Cashless' | 'Pre-authorisation';
  addFile: (spec: string) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setDocType: (id: string, docType: string) => void;
  setClaimType: (type: 'Reimbursement' | 'Cashless' | 'Pre-authorisation') => void;
  logEvent: (event: string, detail: string, isError?: boolean) => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  files: [],
  eventLogs: [],
  claimType: 'Reimbursement',
  addFile: (spec: string) => {
    const [name, kind, docType, confStr] = spec.split('|');
    const existing = get().files.find(f => f.name === name);
    if (existing) return;

    const newFile: UploadFileItem = {
      id: Math.random().toString(36).substring(7),
      name,
      kind: (kind as any) || 'digital',
      docType: docType || 'discharge_summary',
      conf: parseFloat(confStr) || 0.95,
      size: '1.4 MB',
      status: 'uploading',
      pct: 0,
    };

    get().logEvent('UPLOAD_START', name);
    set(state => ({ files: [...state.files, newFile] }));
    get().logEvent('FILE_RECEIVED', `${name} · routed → ${newFile.docType}`);

    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      if (p >= 100) {
        clearInterval(interval);
        set(state => ({
          files: state.files.map(f => (f.name === name ? { ...f, pct: 100, status: 'ready' } : f)),
        }));
        get().logEvent('UPLOAD_SUCCESS', name);
      } else {
        set(state => ({
          files: state.files.map(f => (f.name === name ? { ...f, pct: p } : f)),
        }));
      }
    }, 200);
  },
  removeFile: id => {
    const file = get().files.find(f => f.id === id);
    if (file) {
      get().logEvent('UPLOAD_REJECTED', `${file.name} · removed by user`, true);
    }
    set(state => ({ files: state.files.filter(f => f.id !== id) }));
  },
  clearFiles: () => set({ files: [] }),
  setDocType: (id, docType) =>
    set(state => ({
      files: state.files.map(f => (f.id === id ? { ...f, docType, conf: 1.0 } : f)),
    })),
  setClaimType: claimType => set({ claimType }),
  logEvent: (event, detail, isError) => {
    const d = new Date();
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    set(state => ({
      eventLogs: [{ time, event, detail, isError }, ...state.eventLogs],
    }));
  },
}));
