export interface CodeItem {
  code: string;
  desc: string;
  meta: string;
  confidence?: number;
}

export const ICD_CODES: CodeItem[] = [
  { code: 'I21.9', desc: 'Acute myocardial infarction, unspecified', meta: 'confidence 0.94', confidence: 0.94 },
  { code: 'E11.9', desc: 'Type 2 diabetes mellitus without complications', meta: 'confidence 0.91', confidence: 0.91 },
  { code: 'I10', desc: 'Essential (primary) hypertension', meta: 'confidence 0.72', confidence: 0.72 },
];

export const CPT_CODES: CodeItem[] = [
  { code: '92941', desc: 'Coronary angioplasty, acute MI', meta: 'est. Rs. 1,10,000' },
  { code: '93458', desc: 'Cardiac catheterisation with angiography', meta: 'est. Rs. 28,400' },
  { code: '99223', desc: 'Inpatient admission, high complexity', meta: 'est. Rs. 9,600' },
];

export const FRAUD_FAMILIES = [
  { family: 'duplicate', desc: 'No duplicate claim found for this policy in 90 days', status: 'ok' },
  { family: 'billing', desc: 'Billing pattern within normal range for this procedure', status: 'ok' },
  { family: 'provider', desc: 'Provider empanelled; no adverse history', status: 'ok' },
  { family: 'velocity', desc: '4 claims from this provider in 24 h — elevated', status: 'warn' },
  { family: 'coding', desc: 'Code combination is plausible for the diagnosis', status: 'ok' },
  { family: 'identity', desc: 'Identity match confirmed against policy record', status: 'ok' },
];
