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
  status: 'complete' | 'submitted' | 'approved' | 'rejected' | 'settled' | 'running' | 'FAILED';
  rawStatus?: string;
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
  documents?: any[];
  createdAt?: string;
  patientId?: string;
}

export const INITIAL_CLAIMS: ClaimItem[] = [];

