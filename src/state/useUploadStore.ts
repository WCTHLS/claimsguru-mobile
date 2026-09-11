import { create } from 'zustand';
import { claimsApi } from '../features/claims/services/claimsApi';
import { useAuthStore } from './useAuthStore';

export interface UploadFileItem {
  id: string;
  name: string;
  kind: 'digital' | 'scanned' | 'jpg' | 'docx';
  docType: string;
  conf: number;
  size: string;
  status: 'uploading' | 'ready' | 'failed';
  pct: number;
  fileBlob?: any;
  uri?: string;
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
  uploading: boolean;

  addFile: (spec: string) => void;
  addRealFile: (file: { name: string; size?: number; type?: string; blob?: any; uri?: string }) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setDocType: (id: string, docType: string) => void;
  setClaimType: (type: 'Reimbursement' | 'Cashless' | 'Pre-authorisation') => void;
  logEvent: (event: string, detail: string, isError?: boolean) => void;
  uploadToBackend: (options?: { policyId?: string; patientId?: string }) => Promise<{ claimId: string; taskId?: string }>;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  files: [],
  eventLogs: [],
  claimType: 'Reimbursement',
  uploading: false,

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
    }, 150);
  },

  addRealFile: file => {
    let docType = 'discharge_summary';
    const lower = file.name.toLowerCase();
    if (lower.includes('bill') || lower.includes('invoice') || lower.includes('receipt')) docType = 'hospital_bill';
    else if (lower.includes('card') || lower.includes('policy') || lower.includes('insurance')) docType = 'policy_card';
    else if (lower.includes('lab') || lower.includes('test') || lower.includes('report') || lower.includes('pathology')) docType = 'lab_report';
    else if (lower.includes('presc') || lower.includes('rx') || lower.includes('med')) docType = 'prescription';
    else if (lower.includes('discharge') || lower.includes('summary')) docType = 'discharge_summary';
    else if (lower.includes('scan') || lower.includes('xray') || lower.includes('mri') || lower.includes('ct')) docType = 'scan_report';
    else if (lower.includes('id') || lower.includes('aadhaar') || lower.includes('pan') || lower.includes('passport')) docType = 'id_proof';
    else docType = 'other';

    const sizeStr = file.size
      ? file.size < 1024 * 1024
        ? `${Math.max(1, Math.round(file.size / 1024))} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : '1.2 MB';

    let kind: 'digital' | 'scanned' | 'jpg' | 'docx' = 'digital';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) {
      kind = 'jpg';
    } else if (lower.endsWith('.doc') || lower.endsWith('.docx')) {
      kind = 'docx';
    } else if (lower.includes('scan')) {
      kind = 'scanned';
    } else {
      kind = 'digital';
    }

    const existing = get().files.find(f => f.name === file.name);
    if (existing) {
      set(state => ({
        files: state.files.map(f =>
          f.id === existing.id
            ? { ...f, fileBlob: file.blob, uri: file.uri, size: sizeStr, status: 'ready', pct: 100 }
            : f
        ),
      }));
      get().logEvent('FILE_UPDATED', `${file.name} replaced`);
      return;
    }

    const newFile: UploadFileItem = {
      id: Math.random().toString(36).substring(7),
      name: file.name,
      kind,
      docType,
      conf: 0.94,
      size: sizeStr,
      status: 'uploading',
      pct: 0,
      fileBlob: file.blob,
      uri: file.uri,
    };

    get().logEvent('UPLOAD_START', file.name);
    set(state => ({ files: [...state.files, newFile] }));
    get().logEvent('FILE_RECEIVED', `${file.name} · routed → ${newFile.docType}`);

    let p = 0;
    const interval = setInterval(() => {
      p += 35;
      if (p >= 100) {
        clearInterval(interval);
        set(state => ({
          files: state.files.map(f => (f.name === file.name ? { ...f, pct: 100, status: 'ready' } : f)),
        }));
        get().logEvent('UPLOAD_SUCCESS', file.name);
      } else {
        set(state => ({
          files: state.files.map(f => (f.name === file.name ? { ...f, pct: p } : f)),
        }));
      }
    }, 100);
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

  uploadToBackend: async options => {
    const { files, claimType } = get();
    set({ uploading: true });
    get().logEvent('UPLOAD_START', `Initiating claim with ${files.length} documents...`);

    const filePayloads = files.map(f => {
      let resolvedType = f.fileBlob?.type;
      if (!resolvedType) {
        const lower = f.name.toLowerCase();
        if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) resolvedType = 'image/jpeg';
        else if (lower.endsWith('.png')) resolvedType = 'image/png';
        else resolvedType = 'application/pdf';
      }
      return {
        name: f.name,
        type: resolvedType,
        blob: f.fileBlob,
        uri: f.uri,
      };
    });

    try {
      const auth = useAuthStore.getState();
      const res = await claimsApi.uploadClaim(filePayloads, {
        policyId: options?.policyId || auth.policyNumber || 'P-0007401',
        patientId: options?.patientId || auth.userId || '181c3248-94a5-426f-8aca-92adcf0ff765',
        email: auth.userEmail || 'sample@gmail.com',
        force: true,
      });

      const claimId = res.claim_id || res.id;
      get().logEvent('UPLOAD_SUCCESS', `Claim ${claimId.slice(0, 8)} created · status: ${res.status}`);
      set({ uploading: false });
      return { claimId, taskId: res.task_id || undefined };
    } catch (err: any) {
      console.warn('[useUploadStore] Backend upload failed:', err);
      get().logEvent('UPLOAD_FAILURE', `Upload error: ${err?.message || 'Error'}`, true);
      set({ uploading: false });
      throw err;
    }
  },
}));
