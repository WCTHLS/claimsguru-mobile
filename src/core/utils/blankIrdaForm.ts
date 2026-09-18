import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { BLANK_IRDA_PDF_BASE64 } from '../assets/blankIrdaPdfBase64';

export const BLANK_IRDA_PDF_FILENAME = 'IRDAI_Standard_Blank_Claim_Form.pdf';

/**
 * Returns a blob URL for Web environments (Chrome/Safari/Edge) to render
 * directly inside the native PDF viewer iframe.
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
    url: `data:application/pdf;base64,${BLANK_IRDA_PDF_BASE64}`,
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
  <title>IRDA Standard Health Insurance Claim Form (Blank)</title>
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
      transition: background 0.15s, color 0.15s;
    }
    .pdf-bar-btn:hover {
      background: #474b4e;
      color: #ffffff;
    }

    /* Pages Container */
    .pages-wrapper {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      padding: 10px 8px 30px 8px;
    }

    /* Individual Page (A4 Aspect Ratio Sheet) */
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
      padding: 20px 18px 22px 18px;
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
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .doc-page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 16px;
    }

    /* ───────── Cover Page (Page 1) ───────── */
    .cover-sheet {
      background: linear-gradient(155deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%);
      color: #ffffff;
      padding: 26px 20px 22px 20px;
      min-height: 640px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .cover-sheet::after {
      content: "";
      position: absolute;
      right: -60px; bottom: -60px;
      width: 220px; height: 220px;
      background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%);
      pointer-events: none;
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
    .cover-brand-title {
      font-weight: 600;
      letter-spacing: 0.1em;
    }
    .cover-title {
      margin-top: 28px;
      font-size: 24pt;
      line-height: 1.1;
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
      opacity: 0.85;
      max-width: 95%;
    }
    .cover-summary {
      margin-top: 26px;
      background: rgba(255,255,255,0.08);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 12px;
      padding: 16px 14px;
    }
    .cover-summary h3 {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #fde68a;
      margin: 0 0 12px 0;
      font-weight: 700;
    }
    .cover-summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 14px;
    }
    .cover-summary-item .k {
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.72;
      font-weight: 600;
    }
    .cover-summary-item .v {
      font-size: 11pt;
      font-weight: 600;
      margin-top: 2px;
      word-break: break-word;
    }
    .cover-footer {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 7.5pt;
      opacity: 0.88;
      border-top: 1px solid rgba(255,255,255,0.14);
      padding-top: 12px;
    }
    .cover-badge {
      display: inline-block;
      padding: 3px 10px;
      background: rgba(251,191,36,0.18);
      border: 1px solid rgba(251,191,36,0.4);
      border-radius: 999px;
      color: #fde68a;
      font-size: 7pt;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    /* ───────── Banners & Section Cards ───────── */
    .part-banner {
      margin: 0 0 12px 0;
      padding: 10px 14px;
      background: linear-gradient(90deg, #0369a1 0%, #0284c7 100%);
      color: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .part-banner.part-b {
      background: linear-gradient(90deg, #134e4a 0%, #0d9488 100%);
    }
    .part-banner .label {
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      opacity: 0.85;
      font-weight: 600;
    }
    .part-banner h2 {
      font-size: 13pt;
      margin: 2px 0 0 0;
      letter-spacing: -0.01em;
      font-weight: 700;
    }
    .part-banner .right {
      text-align: right;
      font-size: 7.5pt;
      opacity: 0.9;
    }
    .part-banner .right strong {
      font-size: 9.5pt;
      display: block;
    }

    .notice {
      margin: 0 0 10px 0;
      padding: 6px 10px;
      border-left: 3px solid #f59e0b;
      background: #fffbeb;
      color: #78350f;
      font-size: 7.5pt;
      border-radius: 4px;
      line-height: 1.4;
    }

    /* Section card */
    .section {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 10px;
      overflow: hidden;
      background: white;
    }
    .section-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      border-bottom: 1px solid #e2e8f0;
    }
    .section-head .num {
      width: 20px; height: 20px;
      border-radius: 5px;
      background: #0369a1;
      color: white;
      font-weight: 700;
      font-size: 8.5pt;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .section-head.part-b-head .num {
      background: #0d9488;
    }
    .section-head .title {
      font-size: 9.5pt;
      font-weight: 600;
      color: #0f172a;
    }
    .section-head .sub {
      margin-left: auto;
      font-size: 7pt;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
    }
    .section-body {
      padding: 10px 10px;
    }

    /* Multi-column grid */
    .grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 8px;
    }
    .grid > .field {
      box-sizing: border-box;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .grid.cols-2 > .field { width: calc(50% - 4px); }
    .grid.cols-3 > .field { width: calc(33.333% - 5.5px); }
    .grid > .field.wide   { width: 100%; }
    .grid > .field.wide-2 { width: calc(66.666% - 4px); }

    .field .k {
      font-size: 7pt;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
      margin-bottom: 3px;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .field input.v,
    .field textarea.v {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 9.5pt;
      font-weight: 500;
      color: #0f172a;
      padding: 5px 7px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-bottom: 2px solid #94a3b8;
      border-radius: 3px;
      width: 100%;
      min-height: 28px;
      box-sizing: border-box;
      line-height: 1.3;
    }
    .field textarea.v {
      min-height: 48px;
      resize: vertical;
    }

    /* Choice row */
    .choice-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      margin-bottom: 5px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #0369a1;
      border-radius: 4px;
    }
    .choice-row .label {
      flex: 1;
      font-size: 8pt;
      color: #1e293b;
      font-weight: 500;
    }
    .choice-row .options {
      display: inline-flex;
      gap: 8px;
      align-items: center;
    }
    .choice-row label.opt {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 8pt;
      font-weight: 600;
      color: #334155;
      padding: 2px 8px;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 3px;
    }
    .choice-row input[type=radio] {
      width: 12px; height: 12px;
      margin: 0;
    }

    /* Checklist */
    .check-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px 8px;
      padding: 8px 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
    }
    .check {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 7.5pt;
      line-height: 1.3;
      padding: 4px 6px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      min-height: 26px;
    }
    .check input[type=checkbox] {
      width: 13px; height: 13px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .check .label {
      color: #334155;
      font-weight: 500;
    }

    /* Tables */
    table.modern {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 8pt;
      margin-top: 3px;
    }
    table.modern thead th {
      background: #0f172a;
      color: white;
      font-weight: 600;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 5px 8px;
      text-align: left;
    }
    table.modern thead th:first-child { border-top-left-radius: 4px; }
    table.modern thead th:last-child  { border-top-right-radius: 4px; text-align: right; }
    table.modern tbody td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      background: white;
    }
    table.modern tbody td.num,
    table.modern thead th.num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    table.modern tbody tr:nth-child(even) td {
      background: #f8fafc;
    }
    table.modern tfoot td {
      padding: 6px 8px;
      background: #f1f5f9;
      font-weight: 700;
      border-top: 2px solid #0369a1;
    }
    table.modern tfoot td.num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    table.modern .empty-row td {
      color: #94a3b8;
      font-style: italic;
      text-align: center;
      background: #fafafa;
      padding: 8px;
    }

    /* Signatures */
    .sign-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-top: 12px;
    }
    .sign-box {
      background: #fafbfc;
      border: 1px solid #e2e8f0;
      border-top: 2px solid #0369a1;
      border-radius: 0 0 5px 5px;
      padding: 6px 10px 10px 10px;
    }
    .sign-box.part-b-sign {
      border-top-color: #0d9488;
    }
    .sign-box input {
      width: 100%;
      height: 28px;
      border: none;
      border-bottom: 1px dashed #94a3b8;
      background: transparent;
      padding: 2px 2px;
      font-family: Helvetica, Arial, sans-serif;
      font-size: 11pt;
      font-style: italic;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .sign-box .sign-label {
      font-size: 7pt;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    }

    @media print {
      .pdf-viewer-bar {
        display: none !important;
      }
      .pages-wrapper {
        max-width: 100%;
        padding: 0;
      }
      .page-sheet {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
        break-after: page;
        min-height: 100vh;
      }
    }
  </style>
</head>
<body>

  <!-- PDF Viewer Top Bar -->
  <div class="pdf-viewer-bar">
    <div class="pdf-bar-left">
      <span class="pdf-page-indicator">1 / 5</span>
      <span style="opacity: 0.7; margin-left: 4px;">IRDAI Modern Blank Claim Form</span>
    </div>
    <div class="pdf-bar-actions">
      <button class="pdf-bar-btn" onclick="window.print()" title="Print / Save as PDF">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
      </button>
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
          <span class="cover-brand-title">IRDAI Standard</span>
        </div>

        <h1 class="cover-title">Health Insurance<br /><span class="accent">Claim Form</span></h1>

        <p class="cover-subtitle">
          A blank, print-ready rendition of the IRDAI Standard Reimbursement Claim Form (Part A &amp; Part B).
          All fields are blank for manual entry. Verify each field before submission.
        </p>

        <div class="cover-summary">
          <h3>Claim Summary</h3>
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
              <div class="k">Hospital</div>
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
        <div>
          Generated ${currentDate} · Document ID: <strong>IRDAI-BLANK</strong>
        </div>
        <div>
          <span class="cover-badge">Blank Template</span>
        </div>
      </div>
    </div>


    <!-- ================= PAGE 2: PART A ================= -->
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
            <div class="right">
              Sections A – H<br />
              <strong>Policy —</strong>
            </div>
          </div>

          <div class="notice">
            <strong>Blank Template:</strong> Duly complete each field, attach the required original bills and documents, and sign Section G before submitting to your insurer or TPA.
          </div>

          <!-- Section A -->
          <section class="section">
            <div class="section-head">
              <div class="num">A</div>
              <div class="title">Insurer / TPA Details</div>
              <div class="sub">Insurer / TPA</div>
            </div>
            <div class="section-body">
              <div class="grid cols-2">
                <div class="field">
                  <label class="k">Name of Insurance Company *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">TPA Name</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Policy / Health Card No. *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Member ID / UHID</label>
                  <input class="v" type="text" />
                </div>
              </div>
            </div>
          </section>

          <!-- Section B -->
          <section class="section">
            <div class="section-head">
              <div class="num">B</div>
              <div class="title">Insured / Policyholder</div>
              <div class="sub">Policy &amp; Insured</div>
            </div>
            <div class="section-body">
              <div class="grid cols-3">
                <div class="field">
                  <label class="k">Name of Insured *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Policy Period (From)</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Policy Period (To)</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Sum Insured</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Cumulative Bonus</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Contact Phone</label>
                  <input class="v" type="text" />
                </div>
                <div class="field wide-2">
                  <label class="k">Email</label>
                  <input class="v" type="text" />
                </div>
                <div class="field wide">
                  <label class="k">Address</label>
                  <textarea class="v" rows="2"></textarea>
                </div>
              </div>
            </div>
          </section>

          <!-- Section C -->
          <section class="section">
            <div class="section-head">
              <div class="num">C</div>
              <div class="title">Patient Details</div>
              <div class="sub">Patient Details</div>
            </div>
            <div class="section-body">
              <div class="grid cols-3">
                <div class="field">
                  <label class="k">Patient Name *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Date of Birth</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Gender</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Relationship to Insured</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Occupation</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">PAN</label>
                  <input class="v" type="text" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="doc-page-footer">
          <span>Blank Template</span>
          <span>Page 2 of 5</span>
        </div>
      </div>
    </div>


    <!-- ================= PAGE 3: PART A CONT. ================= -->
    <div class="page-sheet">
      <div class="page-content">
        <div>
          <div class="doc-page-header">
            <span>IRDAI Standard Health Insurance Claim Form</span>
            <span>${currentDateTime}</span>
          </div>

          <!-- Section D -->
          <section class="section">
            <div class="section-head">
              <div class="num">D</div>
              <div class="title">Hospitalisation Details</div>
              <div class="sub">Hospitalisation</div>
            </div>
            <div class="section-body">
              <div class="grid cols-3">
                <div class="field wide-2">
                  <label class="k">Hospital Name *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Hospital City / State</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Hospital Phone</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Date of Admission *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Time of Admission</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Date of Discharge *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Time of Discharge</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Length of Stay (Days)</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Room Category</label>
                  <input class="v" type="text" />
                </div>
              </div>

              <div style="margin-top: 10px; display: grid; gap: 6px;">
                <div class="choice-row">
                  <div class="label">Was hospitalisation due to an injury / accident?</div>
                  <div class="options">
                    <label class="opt"><input type="radio" name="d_is_accident" value="YES" /> Yes</label>
                    <label class="opt"><input type="radio" name="d_is_accident" value="NO" /> No</label>
                  </div>
                </div>
                <div class="choice-row">
                  <div class="label">Was hospitalisation due to maternity?</div>
                  <div class="options">
                    <label class="opt"><input type="radio" name="d_is_maternity" value="YES" /> Yes</label>
                    <label class="opt"><input type="radio" name="d_is_maternity" value="NO" /> No</label>
                  </div>
                </div>
                <div class="choice-row">
                  <div class="label">Did the patient undergo any surgical procedure?</div>
                  <div class="options">
                    <label class="opt"><input type="radio" name="d_is_surgery" value="YES" /> Yes</label>
                    <label class="opt"><input type="radio" name="d_is_surgery" value="NO" /> No</label>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Section E -->
          <section class="section">
            <div class="section-head">
              <div class="num">E</div>
              <div class="title">Claim Documents Submitted</div>
              <div class="sub">Checklist</div>
            </div>
            <div class="section-body">
              <div class="check-grid">
                <label class="check"><input type="checkbox" /><span class="label">Duly completed claim form</span></label>
                <label class="check"><input type="checkbox" /><span class="label">Original main hospital bill</span></label>
                <label class="check"><input type="checkbox" /><span class="label">Itemised hospital bill / break-up</span></label>
                <label class="check"><input type="checkbox" /><span class="label">Original payment receipts</span></label>
                <label class="check"><input type="checkbox" /><span class="label">Discharge / Death summary</span></label>
                <label class="check"><input type="checkbox" /><span class="label">Investigation reports</span></label>
                <label class="check"><input type="checkbox" /><span class="label">Pharmacy bills</span></label>
                <label class="check"><input type="checkbox" /><span class="label">Treating doctor's prescription</span></label>
                <label class="check"><input type="checkbox" /><span class="label">Indoor case papers</span></label>
                <label class="check"><input type="checkbox" /><span class="label">KYC documents (PAN / Aadhaar)</span></label>
                <label class="check"><input type="checkbox" /><span class="label">Cancelled cheque (NEFT)</span></label>
                <label class="check"><input type="checkbox" /><span class="label">FIR / MLC report (if applicable)</span></label>
                <label class="check"><input type="checkbox" /><span class="label">Implant invoice / sticker</span></label>
                <label class="check"><input type="checkbox" /><span class="label">Pre-authorisation letter (if cashless)</span></label>
              </div>
            </div>
          </section>
        </div>

        <div class="doc-page-footer">
          <span>Blank Template</span>
          <span>Page 3 of 5</span>
        </div>
      </div>
    </div>


    <!-- ================= PAGE 4: BANK & DECLARATION ================= -->
    <div class="page-sheet">
      <div class="page-content">
        <div>
          <div class="doc-page-header">
            <span>IRDAI Standard Health Insurance Claim Form</span>
            <span>${currentDateTime}</span>
          </div>

          <!-- Section F -->
          <section class="section">
            <div class="section-head">
              <div class="num">F</div>
              <div class="title">Bank Details for NEFT Payment</div>
              <div class="sub">Bank Details for NEFT</div>
            </div>
            <div class="section-body">
              <div class="grid cols-2">
                <div class="field">
                  <label class="k">Account Holder Name</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Bank Name</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Branch</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Account Number</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">IFSC Code</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">MICR Code</label>
                  <input class="v" type="text" />
                </div>
                <div class="field wide">
                  <label class="k">PAN of Account Holder</label>
                  <input class="v" type="text" />
                </div>
              </div>
            </div>
          </section>

          <!-- Section G -->
          <section class="section">
            <div class="section-head">
              <div class="num">G</div>
              <div class="title">Declaration by the Insured</div>
            </div>
            <div class="section-body">
              <p style="font-size: 8pt; color: #334155; line-height: 1.45; text-align: justify; margin: 0 0 8px 0;">
                I hereby declare that the information furnished above is true and correct to the best of
                my knowledge and belief. I understand that any false statement or concealment of material
                fact may render this claim inadmissible. I authorise the Company / TPA to seek any further
                medical or financial information necessary for processing this claim. I agree to receive
                the claim settlement amount through electronic fund transfer (NEFT) into the bank account
                provided in Section F.
              </p>
              <div class="sign-row">
                <div class="sign-box">
                  <input name="insured_signature" />
                  <div class="sign-label">Signature of Insured</div>
                </div>
                <div class="sign-box">
                  <input name="insured_place_date" />
                  <div class="sign-label">Place &amp; Date</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="doc-page-footer">
          <span>Blank Template</span>
          <span>Page 4 of 5</span>
        </div>
      </div>
    </div>


    <!-- ================= PAGE 5: PART B (HOSPITAL) ================= -->
    <div class="page-sheet">
      <div class="page-content">
        <div>
          <div class="doc-page-header">
            <span>IRDAI Standard Health Insurance Claim Form</span>
            <span>${currentDateTime}</span>
          </div>

          <div class="part-banner part-b">
            <div>
              <div class="label">Part B</div>
              <h2>To Be Filled by the Hospital</h2>
            </div>
            <div class="right">
              Sections A – E<br />
              <strong>Hospital —</strong>
            </div>
          </div>

          <!-- Section A (Part B) -->
          <section class="section">
            <div class="section-head part-b-head">
              <div class="num">A</div>
              <div class="title">Hospital Identification</div>
              <div class="sub">Provider Identification</div>
            </div>
            <div class="section-body">
              <div class="grid cols-2">
                <div class="field">
                  <label class="k">Hospital Name *</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Hospital Registration No.</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Phone</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Email</label>
                  <input class="v" type="text" />
                </div>
                <div class="field wide">
                  <label class="k">Address</label>
                  <textarea class="v" rows="2"></textarea>
                </div>
              </div>
            </div>
          </section>

          <!-- Section B (Part B) -->
          <section class="section">
            <div class="section-head part-b-head">
              <div class="num">B</div>
              <div class="title">Patient Clinical Details</div>
              <div class="sub">Clinical Information</div>
            </div>
            <div class="section-body">
              <div class="grid cols-2">
                <div class="field">
                  <label class="k">Treating Doctor</label>
                  <input class="v" type="text" />
                </div>
                <div class="field">
                  <label class="k">Doctor Registration No.</label>
                  <input class="v" type="text" />
                </div>
                <div class="field wide">
                  <label class="k">Department / Speciality</label>
                  <input class="v" type="text" />
                </div>
                <div class="field wide">
                  <label class="k">Provisional Diagnosis</label>
                  <textarea class="v" rows="2"></textarea>
                </div>
                <div class="field wide">
                  <label class="k">Final Diagnosis</label>
                  <textarea class="v" rows="2"></textarea>
                </div>
              </div>
            </div>
          </section>

          <!-- Section C (Part B) -->
          <section class="section">
            <div class="section-head part-b-head">
              <div class="num">C</div>
              <div class="title">Diagnosis &amp; Expense Breakdown</div>
              <div class="sub">ICD-10 / Bill</div>
            </div>
            <div class="section-body">
              <table class="modern" style="margin-bottom: 8px;">
                <thead>
                  <tr>
                    <th>ICD-10 / CPT Code</th>
                    <th>Clinical Description</th>
                    <th class="num" style="width: 25%;">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="empty-row">
                    <td colspan="3">No ICD-10 diagnosis codes recorded.</td>
                  </tr>
                </tbody>
              </table>

              <table class="modern">
                <thead>
                  <tr>
                    <th>Itemised Expense Head</th>
                    <th class="num" style="width: 38%;">Amount Claimed (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="empty-row">
                    <td colspan="2">No itemised expense lines available.</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total Claimed Amount</td>
                    <td class="num">₹ —</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <!-- Section E (Part B) -->
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
              <div class="sign-row">
                <div class="sign-box part-b-sign">
                  <input name="hospital_signature" />
                  <div class="sign-label">Signature &amp; Seal of Authorised Hospital Official</div>
                </div>
                <div class="sign-box part-b-sign">
                  <input name="hospital_place_date" />
                  <div class="sign-label">Place &amp; Date</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="doc-page-footer">
          <span>Blank Template</span>
          <span>Page 5 of 5</span>
        </div>
      </div>
    </div>

  </div>
</html>`;
}
