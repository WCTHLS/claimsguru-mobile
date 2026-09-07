export interface ValidationRule {
  code: string;
  category: 'completeness' | 'date logic' | 'coding validity' | 'fraud risk';
  title: string;
  status: 'ok' | 'warn' | 'bad';
  detail: string;
}

export const VALIDATION_RULES: ValidationRule[] = [
  { code: 'R001', category: 'completeness', title: 'Mandatory fields present', status: 'ok', detail: 'All required fields were extracted by the parser.' },
  { code: 'R002', category: 'completeness', title: 'Patient identity matches policy', status: 'ok', detail: 'Name and date of birth agree with the policy record.' },
  { code: 'R003', category: 'date logic', title: 'Admission precedes discharge', status: 'ok', detail: '12 Aug 2026 precedes 16 Aug 2026.' },
  { code: 'R004', category: 'date logic', title: 'Bill date within admission window', status: 'bad', detail: 'The pharmacy bill is dated 11 Aug 2026 — one day before admission.' },
  { code: 'R005', category: 'coding validity', title: 'Diagnosis code resolves', status: 'ok', detail: 'ICD-10 code maps to an active entry in the dictionary.' },
  { code: 'R006', category: 'coding validity', title: 'Procedure consistent with diagnosis', status: 'ok', detail: 'CPT and ICD-10 pairing is clinically consistent.' },
  { code: 'R007', category: 'completeness', title: 'Claimed amount within sum insured', status: 'ok', detail: 'Rs. 1,84,500 is below the Rs. 5,00,000 sum insured.' },
  { code: 'R008', category: 'completeness', title: 'Sub-limits respected', status: 'warn', detail: 'Pharmacy spend exceeds the sub-limit by Rs. 4,300.' },
  { code: 'R009', category: 'completeness', title: 'Pre-authorisation reference present', status: 'bad', detail: 'No pre-authorisation reference was found in any document.' },
  { code: 'R010', category: 'coding validity', title: 'Provider in network', status: 'ok', detail: 'Sunrise Multispecialty is an empanelled network provider.' },
  { code: 'R011', category: 'fraud risk', title: 'Fraud risk below threshold', status: 'warn', detail: 'Fraud scorer returned MEDIUM — manual review suggested.' },
];
