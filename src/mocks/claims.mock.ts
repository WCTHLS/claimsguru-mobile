export interface ClaimItem {
  id: string;
  who: string;
  dept: string;
  amt: number;
  status: 'complete' | 'submitted' | 'running' | 'FAILED';
  step: 'ocr' | 'parse' | 'code' | 'predict' | 'validate' | '—';
  indexed: boolean;
  rules?: string;
  error?: string;
  admissionDate?: string;
  dischargeDate?: string;
  hospital?: string;
  diagnosis?: string;
  doctor?: string;
  policyNo?: string;
}

export const INITIAL_CLAIMS: ClaimItem[] = [
  {
    id: 'a4f1c9e2-7d30-4b8e-91cf-6ea2b40d7715',
    who: 'R. Menon',
    dept: 'Cardiology',
    amt: 184500,
    status: 'complete',
    step: 'validate',
    indexed: true,
    rules: '7/11',
    admissionDate: '12 Aug 2026',
    dischargeDate: '16 Aug 2026',
    hospital: 'Sunrise Multispecialty',
    diagnosis: 'Acute coronary syndrome',
    doctor: 'Dr. P. Rangan',
    policyNo: 'SAMPLE-PH-77421',
  },
  {
    id: '7b03d15a-1c44-4f0a-8e2b-3d9a6c15e0f2',
    who: 'S. Iyer',
    dept: 'Orthopaedics',
    amt: 62300,
    status: 'submitted',
    step: 'validate',
    indexed: true,
    rules: '11/11',
    admissionDate: '01 May 2026',
    dischargeDate: '03 May 2026',
    hospital: 'Apollo Spectra',
    diagnosis: 'Meniscus repair',
    doctor: 'Dr. A. Sharma',
    policyNo: 'SAMPLE-PH-99214',
  },
  {
    id: '2e6f8b41-9a7d-4c3e-b1f5-8c0d2e4a6b93',
    who: 'A. Bose',
    dept: 'Nephrology',
    amt: 241000,
    status: 'running',
    step: 'parse',
    indexed: false,
    admissionDate: '05 Sep 2026',
    hospital: 'Fortis Healthcare',
    diagnosis: 'Renal Calculi',
    doctor: 'Dr. K. Das',
    policyNo: 'SAMPLE-PH-33418',
  },
  {
    id: '9c25a7d0-4e1b-4a8f-9d6c-1f3e5b7a9c02',
    who: 'K. Nair',
    dept: 'Oncology',
    amt: 508750,
    status: 'FAILED',
    step: 'ocr',
    indexed: false,
    error: 'soft time limit exceeded (OCR 15 min)',
    hospital: 'Max Healthcare',
    policyNo: 'SAMPLE-PH-88120',
  },
];
