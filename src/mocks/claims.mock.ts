export interface ExpenseItem {
  category: string;
  amount: number;
}

export interface ClaimItem {
  id: string;
  who: string;
  age?: number;
  gender?: string;
  dept: string;
  amt: number;
  status: 'complete' | 'submitted' | 'running' | 'FAILED';
  step: 'ocr' | 'parse' | 'code' | 'predict' | 'validate' | '—';
  indexed: boolean;
  rules?: string;
  error?: string;
  admissionDate?: string;
  dischargeDate?: string;
  days?: number;
  hospital?: string;
  diagnosis?: string;
  doctor?: string;
  policyNo?: string;
  tpa?: string;
  claimType?: string;
  fieldsParsed?: string;
  expenses?: ExpenseItem[];
}

export const INITIAL_CLAIMS: ClaimItem[] = [
  {
    id: 'a4f1c9e2-7d30-4b8e-91cf-6ea2b40d7715',
    who: 'R. Menon',
    age: 54,
    gender: 'Male',
    dept: 'Cardiology',
    amt: 184500,
    status: 'complete',
    step: 'validate',
    indexed: true,
    rules: '7/11',
    admissionDate: '12 Aug 2026',
    dischargeDate: '16 Aug 2026',
    days: 4,
    hospital: 'Sunrise Multispecialty',
    diagnosis: 'Acute coronary syndrome',
    doctor: 'Dr. P. Rangan',
    policyNo: 'SAMPLE-PH-77421',
    tpa: 'Sample Health TPA',
    claimType: 'Reimbursement',
    fieldsParsed: '20 of 24',
    expenses: [
      { category: 'Room', amount: 32000 },
      { category: 'Consultation', amount: 14500 },
      { category: 'Pharmacy', amount: 21300 },
      { category: 'Surgery', amount: 78000 },
      { category: 'OT', amount: 18700 },
      { category: 'Anaesthesia', amount: 9400 },
      { category: 'Consumables', amount: 7100 },
      { category: 'Nursing', amount: 3500 },
    ],
  },
  {
    id: '7b03d15a-1c44-4f0a-8e2b-3d9a6c15e0f2',
    who: 'S. Iyer',
    age: 42,
    gender: 'Female',
    dept: 'Orthopaedics',
    amt: 62300,
    status: 'submitted',
    step: 'validate',
    indexed: true,
    rules: '11/11',
    admissionDate: '01 May 2026',
    dischargeDate: '03 May 2026',
    days: 2,
    hospital: 'Apollo Spectra',
    diagnosis: 'Meniscus repair',
    doctor: 'Dr. A. Sharma',
    policyNo: 'SAMPLE-PH-99214',
    tpa: 'Direct Insurer',
    claimType: 'Cashless',
    fieldsParsed: '22 of 24',
    expenses: [
      { category: 'Room', amount: 12000 },
      { category: 'Consultation', amount: 5000 },
      { category: 'Pharmacy', amount: 8300 },
      { category: 'Surgery', amount: 25000 },
      { category: 'Consumables', amount: 12000 },
    ],
  },
  {
    id: '2e6f8b41-9a7d-4c3e-b1f5-8c0d2e4a6b93',
    who: 'A. Bose',
    age: 61,
    gender: 'Male',
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
    tpa: 'Sample Care TPA',
    claimType: 'Reimbursement',
    fieldsParsed: '12 of 24',
  },
  {
    id: '9c25a7d0-4e1b-4a8f-9d6c-1f3e5b7a9c02',
    who: 'K. Nair',
    age: 49,
    gender: 'Female',
    dept: 'Oncology',
    amt: 508750,
    status: 'FAILED',
    step: 'ocr',
    indexed: false,
    error: 'soft time limit exceeded (OCR 15 min)',
    hospital: 'Max Healthcare',
    policyNo: 'SAMPLE-PH-88120',
    tpa: 'Sample Health TPA',
    claimType: 'Pre-authorisation',
  },
];
