export interface DocumentItem {
  id: string;
  name: string;
  format: 'PDF' | 'JPG' | 'XLS' | 'PNG';
  pages: string;
  status: 'ok' | 'warn' | 'bad';
  docType: string;
  size: string;
  date: string;
  category: 'Bills' | 'Reports' | 'ID proof';
  ocrDocKey: string;
}

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    name: 'Discharge summary',
    format: 'PDF',
    pages: '4 pages',
    status: 'ok',
    docType: 'discharge_summary',
    size: '1.4 MB',
    date: '16 Aug 2026',
    category: 'Reports',
    ocrDocKey: 'discharge_summary',
  },
  {
    id: 'doc-2',
    name: 'Hospital bill',
    format: 'JPG',
    pages: '2 pages',
    status: 'ok',
    docType: 'hospital_bill',
    size: '820 KB',
    date: '16 Aug 2026',
    category: 'Bills',
    ocrDocKey: 'hospital_bill',
  },
  {
    id: 'doc-3',
    name: 'Policy card',
    format: 'PDF',
    pages: '1 page',
    status: 'ok',
    docType: 'policy_card',
    size: '2.1 MB',
    date: '01 Apr 2026',
    category: 'ID proof',
    ocrDocKey: 'policy_card',
  },
  {
    id: 'doc-4',
    name: 'MRI report',
    format: 'PDF',
    pages: '3 pages',
    status: 'warn',
    docType: 'scan_report',
    size: '1.1 MB',
    date: '14 Aug 2026',
    category: 'Reports',
    ocrDocKey: 'scan_report',
  },
  {
    id: 'doc-5',
    name: 'Pharmacy bill',
    format: 'XLS',
    pages: '1 page',
    status: 'bad',
    docType: 'pharmacy_bill',
    size: '640 KB',
    date: '11 Aug 2026',
    category: 'Bills',
    ocrDocKey: 'pharmacy_bill',
  },
  {
    id: 'doc-6',
    name: 'ID proof',
    format: 'JPG',
    pages: '1 page',
    status: 'ok',
    docType: 'id_proof',
    size: '950 KB',
    date: '12 Aug 2026',
    category: 'ID proof',
    ocrDocKey: 'id_proof',
  },
];
