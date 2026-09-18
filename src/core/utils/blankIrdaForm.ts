import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { BLANK_IRDA_PDF_BASE64 } from '../assets/blankIrdaPdfBase64';

export const BLANK_IRDA_PDF_FILENAME = 'IRDAI_Standard_Blank_Claim_Form.pdf';

/**
 * Returns a blob URL for Web environments (Chrome/Safari/Edge) to render
 * directly inside the native PDF viewer iframe.
 * On Native Mobile (Android/iOS), returns empty url to prevent huge data URI crashes.
 */
export const getBlankModernPdfBlob = (): { url: string; filename: string; blob?: Blob } => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const binaryString = window.atob(BLANK_IRDA_PDF_BASE64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      return { url, filename: BLANK_IRDA_PDF_FILENAME, blob };
    } catch (e) {
      console.warn('[blankIrdaForm] Error creating blob URL from base64:', e);
    }
  }

  return {
    url: '',
    filename: BLANK_IRDA_PDF_FILENAME,
  };
};

/**
 * Saves the base64 PDF into the local device filesystem for native download or sharing.
 */
export const getBlankModernPdfFileUri = async (): Promise<string> => {
  const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
  const fileUri = `${dir}${BLANK_IRDA_PDF_FILENAME}`;
  await FileSystem.writeAsStringAsync(fileUri, BLANK_IRDA_PDF_BASE64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return fileUri;
};

export function getBlankIrdaFormHtml(): string {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const currentDateTime = `${currentDate}, ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=2.0" />
  <title>IRDA Standard Health Insurance Claim Form (Blank 10-Page Template)</title>
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      background-color: #525659;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", Helvetica, Arial, sans-serif;
      color: #0f172a;
      font-size: 9pt;
      line-height: 1.4;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    /* PDF Viewer Top Controls Bar (Matching Chrome/Edge PDF Toolbar) */
    .pdf-viewer-bar {
      position: sticky;
      top: 0;
      z-index: 999;
      background: #323639;
      color: #f1f5f9;
      height: 38px;
      padding: 0 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #202224;
      font-size: 11px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }
    .pdf-bar-left {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 500;
    }
    .pdf-page-indicator {
      background: #202224;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    .pdf-bar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .pdf-bar-btn {
      background: transparent;
      border: none;
      color: #cbd5e1;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    /* Pages Container */
    .pages-wrapper {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      padding: 10px 8px 30px 8px;
    }

    /* Individual Page (A4 Sheet Card) */
    .page-sheet {
      width: 100%;
      background: #ffffff;
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.35);
      border-radius: 2px;
      margin-bottom: 14px;
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
    }
    .page-content {
      padding: 18px 16px 20px 16px;
      min-height: 720px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Page Running Header / Footer */
    .doc-page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    .doc-page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 5px;
      margin-top: 14px;
    }

    /* Cover Page */
    .cover-sheet {
      background: linear-gradient(155deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%);
      color: #ffffff;
      padding: 24px 18px 20px 18px;
      min-height: 640px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .cover-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 9.5pt;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.95;
    }
    .cover-brand-sep {
      opacity: 0.5;
      font-size: 12pt;
      line-height: 1;
      margin: 0 1px;
    }
    .cover-title {
      margin-top: 24px;
      font-size: 22pt;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .cover-title .accent {
      color: #fde68a;
    }
    .cover-subtitle {
      margin-top: 10px;
      font-size: 9pt;
      line-height: 1.45;
      opacity: 0.88;
      max-width: 95%;
    }
    .cover-summary {
      margin-top: 24px;
      background: rgba(255,255,255,0.09);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 10px;
      padding: 14px 12px;
    }
    .cover-summary h3 {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #fde68a;
      margin: 0 0 10px 0;
      font-weight: 700;
    }
    .cover-summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .cover-summary-item {
      background: rgba(255,255,255,0.06);
      border-radius: 6px;
      padding: 6px 8px;
    }
    .cover-summary-item .k {
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      opacity: 0.75;
    }
    .cover-summary-item .v {
      font-size: 9pt;
      font-weight: 600;
      margin-top: 2px;
    }
    .cover-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      opacity: 0.85;
      border-top: 1px solid rgba(255,255,255,0.15);
      padding-top: 12px;
      margin-top: 24px;
    }
    .cover-badge {
      display: inline-block;
      background: #fde68a;
      color: #0c4a6e;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* Part Banner */
    .part-banner {
      background: #f8fafc;
      border-left: 4px solid #0369a1;
      padding: 8px 12px;
      margin-bottom: 12px;
      border-radius: 0 6px 6px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .part-b-banner {
      border-left-color: #059669;
    }
    .part-banner .label {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #0369a1;
      font-weight: 700;
    }
    .part-b-banner .label {
      color: #059669;
    }
    .part-banner h2 {
      font-size: 11pt;
      color: #0f172a;
      margin: 2px 0 0 0;
      font-weight: 700;
    }
    .part-banner .right {
      font-size: 7.5pt;
      color: #64748b;
      text-align: right;
    }

    /* Notice Box */
    .notice {
      background: #eff6ff;
      border: 1px dashed #93c5fd;
      border-radius: 6px;
      padding: 7px 10px;
      font-size: 7.5pt;
      color: #1e40af;
      margin-bottom: 12px;
      line-height: 1.4;
    }

    /* Section Styles */
    .section {
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .section-head {
      background: #f1f5f9;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .section-head .num {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #0369a1;
      color: #ffffff;
      font-size: 7.5pt;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .part-b-head .num {
      background: #059669;
    }
    .section-head .title {
      font-size: 8.5pt;
      font-weight: 700;
      color: #0f172a;
    }
    .section-head .sub {
      margin-left: auto;
      font-size: 7pt;
      color: #64748b;
    }
    .section-body {
      padding: 8px 10px;
    }

    /* Grids & Fields */
    .grid {
      display: grid;
      gap: 7px 10px;
    }
    .cols-2 { grid-template-columns: repeat(2, 1fr); }
    .cols-3 { grid-template-columns: repeat(3, 1fr); }
    .cols-4 { grid-template-columns: repeat(4, 1fr); }

    .field {
      display: flex;
      flex-direction: column;
    }
    .field .k {
      font-size: 6.8pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #64748b;
      margin-bottom: 3px;
    }
    .field .v {
      font-size: 8.5pt;
      color: #0f172a;
      border-bottom: 1px dotted #cbd5e1;
      min-height: 19px;
      padding-bottom: 1px;
    }
    input.v {
      border: none;
      border-bottom: 1px dotted #94a3b8;
      background: transparent;
      outline: none;
      width: 100%;
      font-family: inherit;
      font-size: 8.5pt;
      padding: 1px 0;
    }

    /* Radio / Checkboxes */
    .choice-row {
      display: flex;
      gap: 12px;
      align-items: center;
      min-height: 19px;
    }
    .choice-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 7.5pt;
      color: #334155;
    }
    .checkbox-box {
      width: 12px;
      height: 12px;
      border: 1.2px solid #94a3b8;
      border-radius: 2px;
      display: inline-block;
    }
    .radio-circle {
      width: 12px;
      height: 12px;
      border: 1.2px solid #94a3b8;
      border-radius: 50%;
      display: inline-block;
    }

    /* Write-in Lines */
    .pen-line {
      border-bottom: 1px dotted #cbd5e1;
      height: 18px;
      margin-bottom: 4px;
    }

    /* Table Styles */
    table.form-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
    }
    table.form-table th {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 5px 6px;
      font-size: 6.8pt;
      text-transform: uppercase;
      color: #475569;
      font-weight: 700;
      text-align: left;
    }
    table.form-table td {
      border: 1px solid #e2e8f0;
      padding: 6px;
      color: #1e293b;
    }
    .table-empty-row {
      height: 26px;
    }

    /* Signatures */
    .sign-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 14px;
    }
    .sign-box {
      flex: 1;
      border-top: 1.5px dashed #0369a1;
      padding-top: 4px;
      text-align: center;
    }
    .part-b-sign {
      border-top-color: #059669;
    }
    .sign-label {
      font-size: 7pt;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
  </style>
</head>
<body>

  <!-- Top PDF Toolbar -->
  <div class="pdf-viewer-bar">
    <div class="pdf-bar-left">
      <span style="font-weight: 700; color: #fff;">IRDAI_Standard_Blank_Claim_Form.pdf</span>
      <span class="pdf-page-indicator">1 / 10</span>
    </div>
    <div class="pdf-bar-actions">
      <span style="font-size: 10px; color: #94a3b8; font-weight: 600;">OFFICIAL BLANK TEMPLATE (10 PAGES)</span>
    </div>
  </div>

  <div class="pages-wrapper">

    <!-- ================= PAGE 1: COVER PAGE ================= -->
    <div class="page-sheet cover-sheet">
      <div>
        <div class="cover-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <path d="m9 12 2 2 4-4"></path>
          </svg>
          <span>ClaimsGuru</span>
          <span class="cover-brand-sep">·</span>
          <span style="font-weight: 600; letter-spacing: 0.1em;">IRDAI Standard</span>
        </div>

        <h1 class="cover-title">Health Insurance<br /><span class="accent">Claim Form</span></h1>

        <p class="cover-subtitle">
          Official IRDAI Standard Health Insurance Reimbursement Claim Form (Part A &amp; Part B).
          All 10 pages formatted with blank fields for manual pen-fill and physical submission.
        </p>

        <div class="cover-summary">
          <h3>Claim Summary (Blank)</h3>
          <div class="cover-summary-grid">
            <div class="cover-summary-item">
              <div class="k">Insured / Patient</div>
              <div class="v">—</div>
            </div>
            <div class="cover-summary-item">
              <div class="k">Policy Number</div>
              <div class="v">—</div>
            </div>
            <div class="cover-summary-item">
              <div class="k">Hospital Name</div>
              <div class="v">—</div>
            </div>
            <div class="cover-summary-item">
              <div class="k">Total Claim Amount</div>
              <div class="v">₹ —</div>
            </div>
            <div class="cover-summary-item">
              <div class="k">Date of Admission</div>
              <div class="v">—</div>
            </div>
            <div class="cover-summary-item">
              <div class="k">Date of Discharge</div>
              <div class="v">—</div>
            </div>
          </div>
        </div>
      </div>

      <div class="cover-footer">
        <div>Generated ${currentDate} · Document ID: <strong>IRDAI-BLANK-10P</strong></div>
        <div><span class="cover-badge">Page 1 of 10</span></div>
      </div>
    </div>


    <!-- ================= PAGE 2: INSTRUCTIONS & GUIDELINES ================= -->
    <div class="page-sheet">
      <div class="page-content">
        <div>
          <div class="doc-page-header">
            <span>IRDAI Standard Health Insurance Claim Form</span>
            <span>General Guidelines &amp; Instructions</span>
          </div>

          <div class="part-banner">
            <div>
              <div class="label">Instructions</div>
              <h2>Guidelines for Completion of Claim Form</h2>
            </div>
            <div class="right">IRDAI Standard<br /><strong>General Info</strong></div>
          </div>

          <div class="notice">
            <strong>Important:</strong> Please read all instructions carefully before filling out this form. Incomplete or illegible submissions may lead to processing delays or query generation.
          </div>

          <section class="section">
            <div class="section-head">
              <div class="num">1</div>
              <div class="title">General Instructions</div>
            </div>
            <div class="section-body" style="font-size: 7.8pt; line-height: 1.5; color: #334155;">
              <p>• The form consists of two parts: <strong>Part A</strong> (to be completed and signed by the Insured) and <strong>Part B</strong> (to be completed, certified, and sealed by the Hospital).</p>
              <p style="margin-top: 6px;">• Please write in capital letters using a black or blue ballpoint pen. Do not overwrite or use correction fluid.</p>
              <p style="margin-top: 6px;">• A separate claim form must be submitted for each individual patient and each separate hospitalization episode.</p>
              <p style="margin-top: 6px;">• All original bills, payment receipts, discharge summaries, and investigation reports must be annexed to this claim.</p>
            </div>
          </section>

          <section class="section">
            <div class="section-head">
              <div class="num">2</div>
              <div class="title">Mandatory Document Checklist for Reimbursement</div>
            </div>
            <div class="section-body">
              <div class="grid cols-2" style="font-size: 7.5pt;">
                <div class="choice-item"><span class="checkbox-box"></span> Duly filled and signed Claim Form (Part A &amp; B)</div>
                <div class="choice-item"><span class="checkbox-box"></span> Original Discharge Summary / Card</div>
                <div class="choice-item"><span class="checkbox-box"></span> Original Hospital Final Bill with breakup</div>
                <div class="choice-item"><span class="checkbox-box"></span> Original Payment Receipts with receipt numbers</div>
                <div class="choice-item"><span class="checkbox-box"></span> All Diagnostic &amp; Lab Investigation Reports</div>
                <div class="choice-item"><span class="checkbox-box"></span> Doctor's prescriptions for medicines &amp; tests</div>
                <div class="choice-item"><span class="checkbox-box"></span> Copy of Health Card / Policy Schedule</div>
                <div class="choice-item"><span class="checkbox-box"></span> Cancelled Cheque / Bank Passbook Copy</div>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-head">
              <div class="num">3</div>
              <div class="title">Submission Deadlines</div>
            </div>
            <div class="section-body" style="font-size: 7.8pt; line-height: 1.5; color: #334155;">
              <p>• <strong>Hospitalisation Claims:</strong> Within 15 to 30 days from date of discharge as per policy terms.</p>
              <p style="margin-top: 4px;">• <strong>Post-hospitalisation Expenses:</strong> Within 15 days after completion of post-hospitalisation treatment window (typically 60 to 90 days).</p>
            </div>
          </section>
        </div>

        <div class="doc-page-footer">
          <span>Blank Template</span>
          <span>Page 2 of 10</span>
        </div>
      </div>
    </div>


    <!-- ================= PAGE 3: PART A - SECTION A & B ================= -->
    <div class="page-sheet">
      <div class="page-content">
        <div>
          <div class="doc-page-header">
            <span>IRDAI Standard Health Insurance Claim Form</span>
            <span>${currentDateTime}</span>
          </div>

          <div class="part-banner">
            <div>
              <div class="label">Part A</div>
              <h2>To Be Filled by the Insured</h2>
            </div>
            <div class="right">Sections A &amp; B<br /><strong>Policy &amp; History</strong></div>
          </div>

          <!-- Section A -->
          <section class="section">
            <div class="section-head">
              <div class="num">A</div>
              <div class="title">Details of Primary Insured</div>
            </div>
            <div class="section-body">
              <div class="grid cols-2">
                <div class="field">
                  <label class="k">Policy Number *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Certificate / Card No.</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Name of Insurance Company *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">TPA Name</label>
                  <input class="v" type="text" />
                </div>
                <div class="field" style="grid-column: span 2;">
                  <label class="k">Primary Insured Full Name *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field" style="grid-column: span 2;">
                  <label class="k">Residential Address</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">City &amp; State</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Pin Code</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Mobile Number *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Email Address</label>
                  <input class="v" type="text" />
                </div>
              </div>
            </div>
          </section>

          <!-- Section B -->
          <section class="section">
            <div class="section-head">
              <div class="num">B</div>
              <div class="title">Details of Insurance History</div>
            </div>
            <div class="section-body">
              <div class="field" style="margin-bottom: 8px;">
                <label class="k">Currently covered by any other Mediclaim / Health Insurance?</label>
                <div class="choice-row">
                  <div class="choice-item"><span class="radio-circle"></span> Yes</div>
                  <div class="choice-item"><span class="radio-circle"></span> No</div>
                </div>
              </div>
              <div class="grid cols-2">
                <div class="field">
                  <label class="k">Other Company Name</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Other Policy No.</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Sum Insured (₹)</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Have you ever lodged a claim with them?</label>
                  <div class="choice-row">
                    <div class="choice-item"><span class="radio-circle"></span> Yes</div>
                    <div class="choice-item"><span class="radio-circle"></span> No</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="doc-page-footer">
          <span>Blank Template</span>
          <span>Page 3 of 10</span>
        </div>
      </div>
    </div>


    <!-- ================= PAGE 4: PART A - SECTION C & D ================= -->
    <div class="page-sheet">
      <div class="page-content">
        <div>
          <div class="doc-page-header">
            <span>IRDAI Standard Health Insurance Claim Form</span>
            <span>${currentDateTime}</span>
          </div>

          <div class="part-banner">
            <div>
              <div class="label">Part A</div>
              <h2>To Be Filled by the Insured</h2>
            </div>
            <div class="right">Sections C &amp; D<br /><strong>Patient &amp; Hospitalisation</strong></div>
          </div>

          <!-- Section C -->
          <section class="section">
            <div class="section-head">
              <div class="num">C</div>
              <div class="title">Details of Insured Person Hospitalized</div>
            </div>
            <div class="section-body">
              <div class="grid cols-2">
                <div class="field" style="grid-column: span 2;">
                  <label class="k">Patient Full Name *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Gender *</label>
                  <div class="choice-row">
                    <div class="choice-item"><span class="radio-circle"></span> Male</div>
                    <div class="choice-item"><span class="radio-circle"></span> Female</div>
                    <div class="choice-item"><span class="radio-circle"></span> Other</div>
                  </div>
                </div>
                <div class="field">
                  <label class="k">Age &amp; Date of Birth</label>
                  <input class="v" type="text" placeholder="DD / MM / YYYY" />
                </div>
                <div class="field">
                  <label class="k">Relationship to Primary Insured *</label>
                  <div class="choice-row">
                    <div class="choice-item"><span class="radio-circle"></span> Self</div>
                    <div class="choice-item"><span class="radio-circle"></span> Spouse</div>
                    <div class="choice-item"><span class="radio-circle"></span> Child</div>
                    <div class="choice-item"><span class="radio-circle"></span> Parent</div>
                  </div>
                </div>
                <div class="field">
                  <label class="k">Occupation</label>
                  <input class="v" type="text" />
                </div>
              </div>
            </div>
          </section>

          <!-- Section D -->
          <section class="section">
            <div class="section-head">
              <div class="num">D</div>
              <div class="title">Details of Hospitalization</div>
            </div>
            <div class="section-body">
              <div class="grid cols-2">
                <div class="field" style="grid-column: span 2;">
                  <label class="k">Name of Hospital where Admitted *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Room Category Occupied</label>
                  <input class="v" type="text" placeholder="e.g. Twin Sharing / Single / ICU" />
                </div>
                <div class="field">
                  <label class="k">Hospitalization Reason</label>
                  <div class="choice-row">
                    <div class="choice-item"><span class="radio-circle"></span> Illness</div>
                    <div class="choice-item"><span class="radio-circle"></span> Injury</div>
                    <div class="choice-item"><span class="radio-circle"></span> Maternity</div>
                  </div>
                </div>
                <div class="field">
                  <label class="k">Date of Admission (DD/MM/YYYY) *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Time of Admission</label>
                  <input class="v" type="text" placeholder="HH : MM" />
                </div>
                <div class="field">
                  <label class="k">Date of Discharge (DD/MM/YYYY) *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Time of Discharge</label>
                  <input class="v" type="text" placeholder="HH : MM" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="doc-page-footer">
          <span>Blank Template</span>
          <span>Page 4 of 10</span>
        </div>
      </div>
    </div>


    <!-- ================= PAGE 5: PART A - SECTION E, F, G ================= -->
    <div class="page-sheet">
      <div class="page-content">
        <div>
          <div class="doc-page-header">
            <span>IRDAI Standard Health Insurance Claim Form</span>
            <span>${currentDateTime}</span>
          </div>

          <div class="part-banner">
            <div>
              <div class="label">Part A</div>
              <h2>To Be Filled by the Insured</h2>
            </div>
            <div class="right">Sections E, F &amp; G<br /><strong>Claim, Bills &amp; Bank</strong></div>
          </div>

          <!-- Section E -->
          <section class="section">
            <div class="section-head">
              <div class="num">E</div>
              <div class="title">Details of Claimed Expenses</div>
            </div>
            <div class="section-body">
              <div class="grid cols-2">
                <div class="field">
                  <label class="k">Pre-Hospitalization Expenses</label>
                  <input class="v" type="text" placeholder="₹ —" />
                </div>
                <div class="field">
                  <label class="k">Hospitalization Expenses</label>
                  <input class="v" type="text" placeholder="₹ —" />
                </div>
                <div class="field">
                  <label class="k">Post-Hospitalization Expenses</label>
                  <input class="v" type="text" placeholder="₹ —" />
                </div>
                <div class="field">
                  <label class="k">Ambulance Charges</label>
                  <input class="v" type="text" placeholder="₹ —" />
                </div>
                <div class="field" style="grid-column: span 2;">
                  <label class="k">Total Claim Amount Claimed (in INR) *</label>
                  <input class="v" type="text" placeholder="₹ —" style="font-weight: 700; font-size: 10pt;" />
                </div>
              </div>
            </div>
          </section>

          <!-- Section F -->
          <section class="section">
            <div class="section-head">
              <div class="num">F</div>
              <div class="title">Details of Bills Enclosed (Summary)</div>
            </div>
            <div class="section-body">
              <table class="form-table">
                <thead>
                  <tr>
                    <th style="width: 25px;">#</th>
                    <th>Bill Number</th>
                    <th>Bill Date</th>
                    <th>Issued By</th>
                    <th style="text-align: right;">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="table-empty-row"><td>1.</td><td></td><td></td><td></td><td style="text-align: right;">—</td></tr>
                  <tr class="table-empty-row"><td>2.</td><td></td><td></td><td></td><td style="text-align: right;">—</td></tr>
                  <tr class="table-empty-row"><td>3.</td><td></td><td></td><td></td><td style="text-align: right;">—</td></tr>
                  <tr class="table-empty-row"><td>4.</td><td></td><td></td><td></td><td style="text-align: right;">—</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Section G -->
          <section class="section">
            <div class="section-head">
              <div class="num">G</div>
              <div class="title">Details of Primary Insured's Bank Account</div>
            </div>
            <div class="section-body">
              <div class="grid cols-2">
                <div class="field">
                  <label class="k">Bank Name *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Branch Name</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Bank Account Number *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">IFSC Code *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Account Type</label>
                  <div class="choice-row">
                    <div class="choice-item"><span class="radio-circle"></span> Savings</div>
                    <div class="choice-item"><span class="radio-circle"></span> Current</div>
                  </div>
                </div>
                <div class="field">
                  <label class="k">PAN Number</label>
                  <input class="v" type="text" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="doc-page-footer">
          <span>Blank Template</span>
          <span>Page 5 of 10</span>
        </div>
      </div>
    </div>


    <!-- ================= PAGE 6: PART A - SECTION H (DECLARATION) ================= -->
    <div class="page-sheet">
      <div class="page-content">
        <div>
          <div class="doc-page-header">
            <span>IRDAI Standard Health Insurance Claim Form</span>
            <span>${currentDateTime}</span>
          </div>

          <div class="part-banner">
            <div>
              <div class="label">Part A</div>
              <h2>To Be Filled by the Insured</h2>
            </div>
            <div class="right">Section H<br /><strong>Declaration</strong></div>
          </div>

          <!-- Section H -->
          <section class="section">
            <div class="section-head">
              <div class="num">H</div>
              <div class="title">Declaration by the Insured</div>
            </div>
            <div class="section-body">
              <p style="font-size: 8pt; color: #334155; line-height: 1.5; text-align: justify; margin: 0 0 10px 0;">
                I hereby declare that the details given in this claim form are true and correct to the best of my knowledge and belief.
                If I have made any false or untrue statement, suppression or concealment of any material fact, my right to claim
                reimbursement shall be completely forfeited.
              </p>
              <p style="font-size: 8pt; color: #334155; line-height: 1.5; text-align: justify; margin: 0 0 10px 0;">
                I also consent and authorise the TPA / insurance company to seek necessary medical information / records from any hospital /
                medical practitioner who has attended on the person against whom this claim is made. I confirm having read and understood
                the terms and conditions governing the claim submission.
              </p>

              <div class="sign-row" style="margin-top: 50px;">
                <div class="sign-box">
                  <div class="pen-line" style="height: 28px;"></div>
                  <div class="sign-label">Signature of the Insured / Claimant</div>
                </div>
                <div class="sign-box">
                  <div class="pen-line" style="height: 28px;"></div>
                  <div class="sign-label">Place &amp; Date</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="doc-page-footer">
          <span>Blank Template</span>
          <span>Page 6 of 10</span>
        </div>
      </div>
    </div>


    <!-- ================= PAGE 7: PART B - SECTION A & B ================= -->
    <div class="page-sheet">
      <div class="page-content">
        <div>
          <div class="doc-page-header">
            <span>IRDAI Standard Health Insurance Claim Form</span>
            <span>${currentDateTime}</span>
          </div>

          <div class="part-banner part-b-banner">
            <div>
              <div class="label">Part B</div>
              <h2>To Be Filled by the Hospital</h2>
            </div>
            <div class="right">Sections A &amp; B<br /><strong>Hospital &amp; Patient</strong></div>
          </div>

          <!-- Section A (Hospital) -->
          <section class="section">
            <div class="section-head part-b-head">
              <div class="num">A</div>
              <div class="title">Details of Hospital</div>
            </div>
            <div class="section-body">
              <div class="grid cols-2">
                <div class="field" style="grid-column: span 2;">
                  <label class="k">Name of Hospital *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Hospital ID / ROHINI Code</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Hospital Type</label>
                  <div class="choice-row">
                    <div class="choice-item"><span class="radio-circle"></span> Network</div>
                    <div class="choice-item"><span class="radio-circle"></span> Non-Network</div>
                  </div>
                </div>
                <div class="field">
                  <label class="k">Registration No. with State Authority</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Hospital PAN</label>
                  <input class="v" type="text" />
                </div>
                <div class="field" style="grid-column: span 2;">
                  <label class="k">Address &amp; Location</label>
                  <input class="v" type="text" />
                </div>
              </div>
            </div>
          </section>

          <!-- Section B (Patient Admitted) -->
          <section class="section">
            <div class="section-head part-b-head">
              <div class="num">B</div>
              <div class="title">Details of Patient Admitted</div>
            </div>
            <div class="section-body">
              <div class="grid cols-2">
                <div class="field">
                  <label class="k">Patient Name *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">IP / Admission Registration No. *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Date of Admission (DD/MM/YYYY) *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Time of Admission</label>
                  <input class="v" type="text" placeholder="HH : MM" />
                </div>
                <div class="field">
                  <label class="k">Date of Discharge (DD/MM/YYYY) *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Time of Discharge</label>
                  <input class="v" type="text" placeholder="HH : MM" />
                </div>
                <div class="field">
                  <label class="k">Type of Admission</label>
                  <div class="choice-row">
                    <div class="choice-item"><span class="radio-circle"></span> Emergency</div>
                    <div class="choice-item"><span class="radio-circle"></span> Planned</div>
                    <div class="choice-item"><span class="radio-circle"></span> Day Care</div>
                  </div>
                </div>
                <div class="field">
                  <label class="k">Status at Discharge</label>
                  <div class="choice-row">
                    <div class="choice-item"><span class="radio-circle"></span> Cured</div>
                    <div class="choice-item"><span class="radio-circle"></span> Relieved</div>
                    <div class="choice-item"><span class="radio-circle"></span> LAMA</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="doc-page-footer">
          <span>Blank Template</span>
          <span>Page 7 of 10</span>
        </div>
      </div>
    </div>


    <!-- ================= PAGE 8: PART B - SECTION C, D, E (AILMENT & DECLARATION) ================= -->
    <div class="page-sheet">
      <div class="page-content">
        <div>
          <div class="doc-page-header">
            <span>IRDAI Standard Health Insurance Claim Form</span>
            <span>${currentDateTime}</span>
          </div>

          <div class="part-banner part-b-banner">
            <div>
              <div class="label">Part B</div>
              <h2>To Be Filled by the Hospital</h2>
            </div>
            <div class="right">Sections C, D &amp; E<br /><strong>Diagnosis &amp; Cert</strong></div>
          </div>

          <!-- Section C -->
          <section class="section">
            <div class="section-head part-b-head">
              <div class="num">C</div>
              <div class="title">Details of Ailment Diagnosed (Primary &amp; Additional)</div>
            </div>
            <div class="section-body">
              <div class="field" style="margin-bottom: 6px;">
                <label class="k">Primary Diagnosis with ICD-10 Code *</label>
                <input class="v" type="text" placeholder="Diagnosis description / ICD-10 Code" />
              </div>
              <div class="field" style="margin-bottom: 6px;">
                <label class="k">Secondary / Additional Diagnosis</label>
                <input class="v" type="text" />
              </div>
              <div class="field">
                <label class="k">Procedures Performed with ICD-10 PCS Codes</label>
                <input class="v" type="text" />
              </div>
            </div>
          </section>

          <!-- Section D -->
          <section class="section">
            <div class="section-head part-b-head">
              <div class="num">D</div>
              <div class="title">Treating Doctor &amp; Surgery Details</div>
            </div>
            <div class="section-body">
              <div class="grid cols-2">
                <div class="field">
                  <label class="k">Name of Treating Doctor *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Doctor Medical Reg. No. *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Was Surgery Performed?</label>
                  <div class="choice-row">
                    <div class="choice-item"><span class="radio-circle"></span> Yes</div>
                    <div class="choice-item"><span class="radio-circle"></span> No</div>
                  </div>
                </div>
                <div class="field">
                  <label class="k">Pre-Authorization Obtained?</label>
                  <div class="choice-row">
                    <div class="choice-item"><span class="radio-circle"></span> Yes</div>
                    <div class="choice-item"><span class="radio-circle"></span> No</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Section E -->
          <section class="section">
            <div class="section-head part-b-head">
              <div class="num">E</div>
              <div class="title">Hospital Declaration</div>
            </div>
            <div class="section-body">
              <p style="font-size: 8pt; color: #334155; line-height: 1.45; text-align: justify; margin: 0 0 8px 0;">
                We hereby certify that the information provided in Part B of this form, including the
                diagnosis, procedures performed, and itemised expenses, is true and accurate. The patient
                named above was admitted to and treated at our facility for the period stated, and the
                charges levied are in accordance with our standard tariff applicable to all patients.
              </p>
              <div class="sign-row" style="margin-top: 30px;">
                <div class="sign-box part-b-sign">
                  <div class="pen-line" style="height: 24px;"></div>
                  <div class="sign-label">Signature &amp; Seal of Hospital Authority</div>
                </div>
                <div class="sign-box part-b-sign">
                  <div class="pen-line" style="height: 24px;"></div>
                  <div class="sign-label">Place &amp; Date</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="doc-page-footer">
          <span>Blank Template</span>
          <span>Page 8 of 10</span>
        </div>
      </div>
    </div>


    <!-- ================= PAGE 9: HOSPITAL EXPENSE SCHEDULE (PART 1 - ROWS 1-22) ================= -->
    <div class="page-sheet">
      <div class="page-content">
        <div>
          <div class="doc-page-header">
            <span>IRDAI Standard Health Insurance Claim Form</span>
            <span>Hospital Expense Schedule (Part 1)</span>
          </div>

          <div class="part-banner part-b-banner">
            <div>
              <div class="label">Itemized Bills</div>
              <h2>Hospital Expenses Schedule (Rows 1 – 22)</h2>
            </div>
            <div class="right">Pen-Fill Table<br /><strong>Page 9 of 10</strong></div>
          </div>

          <table class="form-table" style="font-size: 7pt;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="width: 28px; text-align: center;">#</th>
                <th style="width: 70px;">Bill Date</th>
                <th style="width: 80px;">Bill / Inv No.</th>
                <th>Item Description / Expense Head</th>
                <th style="width: 85px; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">1.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">2.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">3.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">4.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">5.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">6.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">7.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">8.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">9.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">10.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">11.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">12.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">13.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">14.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">15.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">16.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">17.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">18.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">19.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">20.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">21.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">22.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
            </tbody>
          </table>
        </div>

        <div class="doc-page-footer">
          <span>Blank Template · Schedule Part 1</span>
          <span>Page 9 of 10</span>
        </div>
      </div>
    </div>


    <!-- ================= PAGE 10: HOSPITAL EXPENSE SCHEDULE (PART 2 - ROWS 23-31) & TOTALS ================= -->
    <div class="page-sheet">
      <div class="page-content">
        <div>
          <div class="doc-page-header">
            <span>IRDAI Standard Health Insurance Claim Form</span>
            <span>Hospital Expense Schedule (Part 2) &amp; Summary</span>
          </div>

          <div class="part-banner part-b-banner">
            <div>
              <div class="label">Itemized Bills</div>
              <h2>Hospital Expenses Schedule (Rows 23 – 31) &amp; Totals</h2>
            </div>
            <div class="right">Final Page<br /><strong>Page 10 of 10</strong></div>
          </div>

          <table class="form-table" style="font-size: 7pt; margin-bottom: 12px;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="width: 28px; text-align: center;">#</th>
                <th style="width: 70px;">Bill Date</th>
                <th style="width: 80px;">Bill / Inv No.</th>
                <th>Item Description / Expense Head</th>
                <th style="width: 85px; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">23.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">24.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">25.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">26.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">27.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">28.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">29.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">30.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
<tr class="table-empty-row"><td style="text-align: center; color: #94a3b8;">31.</td><td></td><td></td><td></td><td style="text-align: right; color: #94a3b8;">Rs.</td></tr>
              <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #cbd5e1;">
                <td colspan="4" style="text-align: right; font-size: 8pt; padding: 7px;">TOTAL HOSPITAL EXPENSES CLAIMED:</td>
                <td style="text-align: right; font-size: 9pt; color: #0f172a; padding: 7px;">₹ —</td>
              </tr>
            </tbody>
          </table>

          <section class="section">
            <div class="section-head part-b-head">
              <div class="num">✓</div>
              <div class="title">Hospital Verification &amp; Final Certification</div>
            </div>
            <div class="section-body">
              <p style="font-size: 7.5pt; color: #334155; line-height: 1.4; margin: 0 0 8px 0;">
                Certified that the hospital bill items detailed in Rows 1 through 31 above reflect the actual services rendered and medications administered to the patient during the hospitalisation period.
              </p>
              <div class="sign-row" style="margin-top: 24px;">
                <div class="sign-box part-b-sign">
                  <div class="pen-line" style="height: 24px;"></div>
                  <div class="sign-label">Hospital Billing In-Charge</div>
                </div>
                <div class="sign-box part-b-sign">
                  <div class="pen-line" style="height: 24px;"></div>
                  <div class="sign-label">Medical Superintendent / Seal</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="doc-page-footer">
          <span>Blank Template · Schedule Part 2</span>
          <span>Page 10 of 10</span>
        </div>
      </div>
    </div>

  </div>
</body>
</html>`;
}
