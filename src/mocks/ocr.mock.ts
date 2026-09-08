export interface FieldSegment {
  l?: string; // label prefix
  t?: string; // extracted text
  f?: string; // field key
  raw?: string; // raw text override for raw view
}

export type PageContent =
  | { h: string; sub?: undefined; r?: undefined; p?: undefined }
  | { sub: string; h?: undefined; r?: undefined; p?: undefined }
  | { r: number; h?: undefined; sub?: undefined; p?: undefined }
  | { p: string; h?: undefined; sub?: undefined; r?: undefined }
  | (string | FieldSegment)[];

export interface ParsedField {
  k: string; // key
  g: string; // group
  v: string | null; // value
  c: number; // confidence 0-1
  s: 'regex' | 'layoutlm' | 'llm' | 'manual'; // source
  pg: number; // page
  req?: boolean;
  warn?: string;
  note?: string;
}

export interface OcrDocument {
  key: string;
  name: string;
  file: string;
  kind: 'digital' | 'jpg' | 'scanned' | 'docx';
  engine: string;
  dpi: string;
  conf: number;
  secs: number;
  scan?: boolean;
  flag?: string;
  tags: string[];
  pages: PageContent[][];
  fields: ParsedField[];
}

export const INITIAL_OCR_DOCS: OcrDocument[] = [
  {
    key: 'discharge_summary',
    name: 'Discharge summary',
    file: 'Discharge_Summary.pdf',
    kind: 'digital',
    engine: 'pdfplumber text layer · no OCR pass needed',
    dpi: '—',
    conf: 0.99,
    secs: 3.2,
    tags: [
      'doc_type: discharge_summary · 0.96',
      'LayoutLMv3 + regex',
      'semantic: OpenRouter → Gemini',
    ],
    pages: [
      [
        { h: 'Sunrise Multispecialty Hospital' },
        { sub: 'Discharge Summary · Cardiology · IP No. 26/08/4471' },
        { r: 1 },
        [
          { l: 'Patient name: ' },
          { t: 'R. Menon', f: 'patient_name' },
          '   ',
          { l: 'Age / Sex: ' },
          { t: '54', f: 'age' },
          ' / ',
          { t: 'Male', f: 'sex' },
        ],
        [
          { l: 'Policy no.: ' },
          { t: 'SAMPLE-PH-77421', f: 'policy_number' },
          '   ',
          { l: 'TPA: ' },
          'Sample Health TPA',
        ],
        [
          { l: 'Date of admission: ' },
          { t: '12-Aug-2026', f: 'admission_date' },
          '   ',
          { l: 'Date of discharge: ' },
          { t: '16-Aug-2026', f: 'discharge_date' },
        ],
        [
          { l: 'Room: ' },
          'Single private   ',
          { l: 'Consultant: ' },
          'Dr. P. Rangan, DM (Cardiology)',
        ],
        { r: 1 },
        {
          p: 'Presenting complaint: retrosternal chest pain on exertion for two days, radiating to the left arm, associated with sweating.',
        },
        {
          p: 'Past history: type 2 diabetes mellitus (8 yrs), essential hypertension (5 yrs). No prior cardiac events.',
        },
      ],
      [
        { h: 'Clinical course' },
        { r: 1 },
        [
          { l: 'Final diagnosis: ' },
          {
            t: 'Acute coronary syndrome',
            f: 'primary_diagnosis',
            raw: 'Acute coronary syndrom e',
          },
        ],
        [
          { l: 'Procedure: ' },
          { t: 'Primary PCI with drug-eluting stent to LAD', f: 'procedure' },
        ],
        {
          p: 'ECG showed ST elevation in V1–V4. Troponin I elevated. Taken up for emergency angiography which revealed 90% proximal LAD lesion; treated with a 3.0 × 18 mm DES. Post-procedure monitored in CCU for 48 hours.',
        },
        {
          p: 'Uneventful recovery. Mobilised on day 3. Haemodynamically stable at discharge.',
        },
      ],
      [
        { h: 'Investigations' },
        { r: 1 },
        {
          p: 'Hb 13.1 g/dL · TLC 8,400 · Platelets 2.1 L · Creatinine 0.9 mg/dL · HbA1c 7.4% · LDL 128 mg/dL',
        },
        {
          p: 'Echo: EF 48%, regional wall motion abnormality — anterior wall. Mild LVH. No pericardial effusion.',
        },
        { p: 'Cardiac MRI: see attached report (MRI_Cardiac_Report.pdf).' },
      ],
      [
        { h: 'Discharge advice' },
        { r: 1 },
        {
          p: 'Tab. Aspirin 75 mg OD · Tab. Ticagrelor 90 mg BD · Tab. Atorvastatin 80 mg HS · Tab. Metformin 500 mg BD. Review in OPD after 6 weeks.',
        },
        { r: 1 },
        [
          { l: 'Treating doctor: ' },
          { t: 'Dr. P. Rangan', f: 'treating_doctor' },
        ],
        [
          { l: 'Pre-authorisation no.: ' },
          { t: '____________', f: 'preauth_reference', raw: '_ _ _ _' },
        ],
        { sub: 'Signature & hospital seal' },
      ],
    ],
    fields: [
      { k: 'patient_name', g: 'Patient', v: 'R. Menon', c: 0.97, s: 'layoutlm', pg: 1 },
      { k: 'age', g: 'Patient', v: '54', c: 0.95, s: 'regex', pg: 1 },
      { k: 'sex', g: 'Patient', v: 'Male', c: 0.96, s: 'regex', pg: 1 },
      { k: 'policy_number', g: 'Policy', v: 'SAMPLE-PH-77421', c: 0.88, s: 'regex', pg: 1 },
      { k: 'admission_date', g: 'Admission', v: '12 Aug 2026', c: 0.94, s: 'regex', pg: 1 },
      { k: 'discharge_date', g: 'Admission', v: '16 Aug 2026', c: 0.93, s: 'regex', pg: 1 },
      {
        k: 'primary_diagnosis',
        g: 'Clinical',
        v: 'Acute coronary syndrome',
        c: 0.71,
        s: 'llm',
        pg: 2,
        note: 'OCR read “syndrom e” — corrected by semantic extractor',
      },
      {
        k: 'procedure',
        g: 'Clinical',
        v: 'Primary PCI with drug-eluting stent to LAD',
        c: 0.9,
        s: 'llm',
        pg: 2,
      },
      { k: 'treating_doctor', g: 'Admission', v: 'Dr. P. Rangan', c: 0.92, s: 'layoutlm', pg: 4 },
      {
        k: 'preauth_reference',
        g: 'Pre-authorisation',
        v: null,
        c: 0.12,
        s: 'llm',
        pg: 4,
        req: true,
        note: 'Blank on the form — drives R009 and +18 risk',
      },
    ],
  },
  {
    key: 'hospital_bill',
    name: 'Hospital bill',
    file: 'Hospital_Bill.jpg',
    kind: 'jpg',
    engine: 'Tesseract + OpenCV · EasyOCR fallback',
    dpi: '—',
    conf: 0.89,
    secs: 9.4,
    tags: ['doc_type: hospital_bill · 0.93', '8 expense categories'],
    pages: [
      [
        { h: 'Sunrise Multispecialty Hospital' },
        { sub: 'Final Bill · GSTIN ' },
        [
          { l: 'Hospital: ' },
          { t: 'Sunrise Multispecialty', f: 'hospital_name' },
          '   ',
          { l: 'Reg. no.: ' },
          { t: 'SAMPLE-HOSP-0192', f: 'hospital_registration_no', raw: 'SAMPLE-H0SP-O192' },
        ],
        [
          { l: 'Bill no.: ' },
          { t: 'FB/26/08/2211', f: 'bill_number' },
          '   ',
          { l: 'Bill date: ' },
          { t: '16-Aug-2026', f: 'bill_date' },
        ],
        [
          { l: 'GSTIN: ' },
          { t: '(illegible)', f: 'gst_number', raw: '29AA###8C1Z%' },
        ],
        { r: 1 },
        { p: 'Room & nursing (4 days) …………… 32,000.00' },
        { p: 'Consultation …………………………… 14,500.00' },
        { p: 'Pharmacy ………………………………… 21,300.00' },
        { p: 'Surgery / procedure ………………… 78,000.00' },
        { p: 'OT charges …………………………… 18,700.00' },
        { p: 'Anaesthesia ………………………………… 9,400.00' },
        { p: 'Consumables ……………………………… 7,100.00' },
        { p: 'Nursing ……………………………………… 3,500.00' },
        { r: 1 },
        [
          { l: 'Grand total: ' },
          { t: 'Rs. 1,84,500.00', f: 'total_billed' },
        ],
      ],
    ],
    fields: [
      { k: 'hospital_name', g: 'Provider', v: 'Sunrise Multispecialty', c: 0.96, s: 'layoutlm', pg: 1 },
      {
        k: 'hospital_registration_no',
        g: 'Provider',
        v: null,
        c: 0.41,
        s: 'regex',
        pg: 1,
        req: true,
        note: 'OCR confused 0/O — needs manual read',
      },
      { k: 'bill_number', g: 'Bill', v: 'FB/26/08/2211', c: 0.91, s: 'regex', pg: 1 },
      { k: 'bill_date', g: 'Bill', v: '16 Aug 2026', c: 0.93, s: 'regex', pg: 1 },
      {
        k: 'gst_number',
        g: 'Bill',
        v: null,
        c: 0.31,
        s: 'regex',
        pg: 1,
        req: true,
        note: 'Illegible on scan',
      },
      { k: 'total_billed', g: 'Bill', v: 'Rs. 1,84,500', c: 0.95, s: 'regex', pg: 1 },
    ],
  },
  {
    key: 'policy_card',
    name: 'Policy card',
    file: 'Policy_Card.pdf',
    kind: 'scanned',
    engine: 'PaddleOCR · scanned PDF rendered at 200 DPI',
    dpi: '200',
    conf: 0.86,
    secs: 22.7,
    tags: ['doc_type: policy_card · 0.90', 'OCR_ENABLE_PADDLE_OCR'],
    pages: [
      [
        { h: 'Sample Health TPA' },
        { sub: 'Health insurance ID card' },
        { r: 1 },
        [{ l: 'Member: ' }, 'R. Menon (Self)'],
        [{ l: 'Policy no.: ' }, { t: 'SAMPLE-PH-77421', f: 'policy_number' }],
        [{ l: 'Insurer / TPA: ' }, { t: 'Sample Health TPA', f: 'insurer_tpa' }],
        [{ l: 'Sum insured: ' }, { t: 'Rs. 5,00,000', f: 'sum_insured' }],
        [{ l: 'Policy period: ' }, { t: '01-Apr-2026 to 31-Mar-2027', f: 'policy_period' }],
        { sub: 'Cashless helpline printed on reverse' },
      ],
    ],
    fields: [
      { k: 'policy_number', g: 'Policy', v: 'SAMPLE-PH-77421', c: 0.9, s: 'regex', pg: 1 },
      { k: 'insurer_tpa', g: 'Policy', v: 'Sample Health TPA', c: 0.88, s: 'layoutlm', pg: 1 },
      { k: 'sum_insured', g: 'Policy', v: 'Rs. 5,00,000', c: 0.86, s: 'regex', pg: 1 },
      { k: 'policy_period', g: 'Policy', v: '01 Apr 2026 – 31 Mar 2027', c: 0.84, s: 'regex', pg: 1 },
    ],
  },
  {
    key: 'scan_report',
    name: 'MRI report',
    file: 'MRI_Cardiac_Report.pdf',
    kind: 'digital',
    engine: 'pdfplumber · scan analyzer triggered',
    dpi: '—',
    conf: 0.98,
    secs: 4.1,
    scan: true,
    tags: ['doc_type: scan_report · 0.74', 'scan_analyses: MRI · MODERATE'],
    pages: [
      [
        { h: 'Cardiac MRI report' },
        { sub: 'Radiology · 14-Aug-2026' },
        { r: 1 },
        [{ l: 'Modality: ' }, { t: 'MRI', f: 'scan_type' }],
        {
          p: 'Findings: mild left ventricular hypertrophy. Regional wall motion abnormality of the anterior wall consistent with recent infarction. No pericardial effusion. Valve morphology unremarkable.',
        },
        [{ l: 'Impression: ' }, { t: 'Moderate — anterior wall motion abnormality', f: 'findings_severity' }],
      ],
    ],
    fields: [
      { k: 'scan_type', g: 'Scan', v: 'MRI', c: 0.99, s: 'regex', pg: 1 },
      {
        k: 'findings_severity',
        g: 'Scan',
        v: 'MODERATE',
        c: 0.82,
        s: 'llm',
        pg: 1,
        note: 'Severity classified by scan analyzer',
      },
    ],
  },
  {
    key: 'pharmacy_bill',
    name: 'Pharmacy bill',
    file: 'Pharmacy_Bill.xlsx',
    kind: 'docx',
    engine: 'openpyxl · direct cell parsing',
    dpi: '—',
    conf: 1.0,
    secs: 1.1,
    flag: 'R004',
    tags: ['doc_type: pharmacy_bill · 0.81', 'R004 failed · bill date before admission'],
    pages: [
      [
        { h: 'Sunrise Pharmacy' },
        { sub: 'Cash memo' },
        { r: 1 },
        [{ l: 'Bill date: ' }, { t: '11-Aug-2026', f: 'bill_date' }],
        [{ l: 'Policy no.: ' }, { t: 'SAMPLE-PH-77412', f: 'policy_number' }],
        {
          p: 'Ticagrelor 90 mg × 60 · Atorvastatin 80 mg × 30 · Aspirin 75 mg × 30 · Heparin 5000 IU × 6 · Contrast media × 2',
        },
        [{ l: 'Total: ' }, { t: 'Rs. 21,300.00', f: 'pharmacy_total' }],
        [{ l: 'Pharmacy reg. no.: ' }, { t: '(not printed)', f: 'pharmacy_registration' }],
      ],
    ],
    fields: [
      {
        k: 'bill_date',
        g: 'Bill',
        v: '11 Aug 2026',
        c: 1.0,
        s: 'regex',
        pg: 1,
        warn: 'one day before admission — R004',
      },
      {
        k: 'policy_number',
        g: 'Policy',
        v: 'SAMPLE-PH-77412',
        c: 1.0,
        s: 'regex',
        pg: 1,
        warn: 'differs from policy card (…77421) — cross-document check',
      },
      { k: 'pharmacy_total', g: 'Bill', v: 'Rs. 21,300', c: 1.0, s: 'regex', pg: 1 },
      {
        k: 'pharmacy_registration',
        g: 'Bill',
        v: null,
        c: 0,
        s: 'regex',
        pg: 1,
        req: true,
        note: 'Not printed on cash memo',
      },
    ],
  },
  {
    key: 'id_proof',
    name: 'ID proof',
    file: 'ID_Proof.jpg',
    kind: 'jpg',
    engine: 'Tesseract + OpenCV · PHI scrubbed before LLM',
    dpi: '—',
    conf: 0.91,
    secs: 6.8,
    tags: ['doc_type: id_proof · 0.95', 'KYC matched'],
    pages: [
      [
        { h: 'Government of India' },
        { sub: 'Identity card (sample)' },
        { r: 1 },
        [{ l: 'Name: ' }, 'R. Menon'],
        [{ l: 'DOB: ' }, '18/04/1972'],
        [{ l: 'ID no.: ' }, { t: 'XXXX XXXX 4417', f: 'id_number' }],
        { sub: 'Masked at OCR time — libs/utils/phi.py' },
      ],
    ],
    fields: [
      {
        k: 'id_number',
        g: 'Identity',
        v: '•••• •••• 4417',
        c: 0.91,
        s: 'regex',
        pg: 1,
        note: 'Masked — PHI never reaches the LLM',
      },
    ],
  },
];
