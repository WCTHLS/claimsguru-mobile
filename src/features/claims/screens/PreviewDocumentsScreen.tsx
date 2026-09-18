import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator,
  Linking,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Minus,
  Plus,
  Maximize2,
  FileCheck,
  Stethoscope,
  FileText,
  FileSearch,
  ExternalLink,
  RefreshCw,
  Eye,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { formatINR } from '../../../core/utils/currency';
import { API_BASE_URL } from '../../../core/api/config';
import {
  INITIAL_OCR_DOCS,
  OcrDocument,
} from '../../../mocks/ocr.mock';

const getDocIcon = (key?: string) => {
  if (!key || typeof key !== 'string') return FileText;
  const lower = key.toLowerCase();
  if (lower.includes('discharge')) return ShieldCheck || FileText;
  if (lower.includes('bill') || lower.includes('invoice') || lower.includes('receipt')) return FileCheck || FileText;
  if (lower.includes('lab') || lower.includes('scan') || lower.includes('diagnostic')) return Stethoscope || FileText;
  return FileSearch || FileText;
};

export const PreviewDocumentsScreen = ({ route, navigation }: any) => {
  const { colors, isDark } = useTheme();
  const claimId = route?.params?.claimId || 'a4f1c9e2';
  const initialDocKey = route?.params?.docKey;

  const cachedClaim = useClaimsStore(s => s.claims.find(c => c.id === claimId || c.id.startsWith(claimId)));
  const cachedPreview = useClaimsStore(s => s.claimPreviews[claimId]);
  const fetchClaimPreview = useClaimsStore(s => s.fetchClaimPreview);

  // Fetch real claim preview on mount if not yet cached
  useEffect(() => {
    if (claimId && !cachedPreview) {
      fetchClaimPreview(claimId);
    }
  }, [claimId, cachedPreview, fetchClaimPreview]);

  const patientDisplayName = cachedPreview?.parsed_fields?.patient_name || cachedPreview?.summary?.patient_name || cachedClaim?.who || 'Vivek Thakur Blood Group O-';
  const hospitalDisplayName = cachedPreview?.parsed_fields?.hospital_name || (cachedPreview?.summary as any)?.hospital_name || cachedPreview?.summary?.hospital || cachedClaim?.hospital || 'Government Medical College & Hospital';
  const policyNum = cachedClaim?.policyNo || 'HP7338613484';
  const billedTotalFormatted = formatINR(cachedPreview?.billed_total || cachedClaim?.amt || 84765.51);

  // Fallback classified documents list
  const fallbackDocs = useMemo<OcrDocument[]>(() => {
    return [
      {
        key: 'discharge_summary',
        name: `Discharge Summary - ${patientDisplayName}`,
        file: 'Discharge_Summary_Signed.pdf',
        kind: 'digital',
        engine: 'Tesseract OCR + LayoutLMv3 semantic classification',
        dpi: '300 DPI',
        conf: 0.99,
        secs: 2.1,
        size: '1.8 MB',
        badge: 'PDF',
        cls: 0.98,
        tags: ['doc_type: discharge_summary', 'verified', 'medical_report'],
        pages: INITIAL_OCR_DOCS[0]?.pages || [],
        fields: INITIAL_OCR_DOCS[0]?.fields || [],
      },
      {
        key: 'insurance_form',
        name: 'Reimbursement Claim Form (National Insurance)',
        file: 'National_Insurance_Claim_Form.pdf',
        kind: 'digital',
        engine: 'pdfplumber structured form extraction',
        dpi: '300 DPI',
        conf: 0.99,
        secs: 1.4,
        size: '2.4 MB',
        badge: 'FORM',
        cls: 0.99,
        tags: ['doc_type: insurance_form', 'irdai_standard', 'verified'],
        pages: INITIAL_OCR_DOCS[1]?.pages || [],
        fields: INITIAL_OCR_DOCS[1]?.fields || [],
      },
      {
        key: 'hospital_bill',
        name: `Hospital Bill - ${hospitalDisplayName}`,
        file: 'Hospital_Final_Tax_Invoice.pdf',
        kind: 'digital',
        engine: 'TableNet itemized tabular extraction',
        dpi: '300 DPI',
        conf: 0.97,
        secs: 1.9,
        size: '1.2 MB',
        badge: 'BILL',
        cls: 0.96,
        tags: ['doc_type: hospital_bill', 'gstin_verified'],
        pages: INITIAL_OCR_DOCS[1]?.pages || [],
        fields: INITIAL_OCR_DOCS[1]?.fields || [],
      },
      {
        key: 'lab_report',
        name: 'Lab Investigation Report (Biochemistry & Blood)',
        file: 'Clinical_Pathology_Report.pdf',
        kind: 'digital',
        engine: 'LayoutLMv3 clinical panel extractor',
        dpi: '300 DPI',
        conf: 0.96,
        secs: 1.1,
        size: '890 KB',
        badge: 'LAB',
        cls: 0.95,
        tags: ['doc_type: lab_report', 'pathology'],
        pages: INITIAL_OCR_DOCS[0]?.pages || [],
        fields: INITIAL_OCR_DOCS[0]?.fields || [],
      },
      {
        key: 'pharmacy_bill',
        name: 'Pharmacy Itemized Bill & Consumables',
        file: 'Pharmacy_Tax_Invoice.pdf',
        kind: 'digital',
        engine: 'OCR regex medicine itemizer',
        dpi: '300 DPI',
        conf: 0.92,
        secs: 1.5,
        size: '760 KB',
        badge: 'RX',
        cls: 0.93,
        tags: ['doc_type: pharmacy_bill'],
        pages: INITIAL_OCR_DOCS[4]?.pages || [],
        fields: INITIAL_OCR_DOCS[4]?.fields || [],
      },
      {
        key: 'scan_report',
        name: 'Radiology / Chest CT Scan Report',
        file: 'Chest_High_Res_CT_Scan.pdf',
        kind: 'digital',
        engine: 'DICOM / Radiology Vision Model',
        dpi: '600 DPI',
        conf: 0.91,
        secs: 3.4,
        size: '5.6 MB',
        badge: 'SCAN',
        cls: 0.91,
        scan: true,
        scanData: INITIAL_OCR_DOCS[3]?.scanData,
        tags: ['doc_type: scan_report', 'radiology'],
        pages: INITIAL_OCR_DOCS[3]?.pages || [],
        fields: INITIAL_OCR_DOCS[3]?.fields || [],
      },
      {
        key: 'policy_card',
        name: 'Health Insurance Policy Schedule',
        file: 'National_Health_Policy_Schedule.pdf',
        kind: 'digital',
        engine: 'pdfplumber policy validator',
        dpi: '300 DPI',
        conf: 0.99,
        secs: 1.2,
        size: '620 KB',
        badge: 'POLICY',
        cls: 0.99,
        tags: ['doc_type: policy_card', 'kyc_verified'],
        pages: INITIAL_OCR_DOCS[2]?.pages || [],
        fields: INITIAL_OCR_DOCS[2]?.fields || [],
      },
      {
        key: 'aadhaar_card',
        name: 'Aadhaar Card / Government Photo ID',
        file: 'Aadhaar_Card_UIDAI_Masked.pdf',
        kind: 'digital',
        engine: 'UIDAI QR & demographic OCR reader',
        dpi: '300 DPI',
        conf: 0.98,
        secs: 1.0,
        size: '410 KB',
        badge: 'ID',
        cls: 0.98,
        tags: ['doc_type: aadhaar_card', 'kyc_cleared'],
        pages: INITIAL_OCR_DOCS[5]?.pages || [],
        fields: INITIAL_OCR_DOCS[5]?.fields || [],
      },
    ];
  }, [patientDisplayName, hospitalDisplayName]);

  // Merge real documents from backend if present, else fallback
  const effectiveDocs = useMemo(() => {
    const backendDocs = cachedPreview?.documents || cachedClaim?.documents;
    if (backendDocs && backendDocs.length > 0) {
      return backendDocs.map((d: any, idx: number) => ({
        id: d.id || d.document_id || `doc-${idx}`,
        key: d.doc_type || d.key || `doc_${idx}`,
        name: d.display_title || d.original_filename || d.file_name || `Document ${idx + 1}`,
        file_name: d.file_name || d.original_filename || `document_${idx + 1}.pdf`,
        doc_type: d.doc_type || 'document',
        page_count: d.page_count || (d.pages ? d.pages.length : 1),
        pages: d.pages || [],
        file_url: d.file_url || d.url || null,
      }));
    }
    return fallbackDocs.map((d, idx) => ({
      id: d.key,
      key: d.key,
      name: d.name,
      file_name: d.file,
      doc_type: d.key,
      page_count: d.pages?.length || 1,
      pages: [`/claims/${claimId}/documents/${d.key}/pages/1/image`],
      file_url: null,
    }));
  }, [cachedPreview?.documents, cachedClaim?.documents, fallbackDocs, claimId]);

  const initialDocIdx = useMemo(() => {
    if (!initialDocKey) return 0;
    const found = effectiveDocs.findIndex(
      d => d.key === initialDocKey || d.id === initialDocKey || d.key.includes(initialDocKey) || initialDocKey.includes(d.key)
    );
    return found !== -1 ? found : 0;
  }, [initialDocKey, effectiveDocs]);

  const [activeDocIdx, setActiveDocIdx] = useState(initialDocIdx);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const scaleRef = useRef<number>(1);
  scaleRef.current = scale;
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const panOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  panOffsetRef.current = panOffset;

  const [isPinching, setIsPinching] = useState<boolean>(false);
  const isPinchingRef = useRef<boolean>(false);
  isPinchingRef.current = isPinching;

  const [imgLoading, setImgLoading] = useState<boolean>(true);
  const [imgError, setImgError] = useState<boolean>(false);
  const [useFormFallback, setUseFormFallback] = useState<boolean>(false);

  // 2-finger pinch-to-zoom & pan gesture handler (Native iOS & Android)
  const panResponder = useMemo(() => {
    let initialDist: number | null = null;
    let initialScale = 1;
    let lastTap = 0;
    let startPanX = 0;
    let startPanY = 0;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt) => {
        return evt.nativeEvent.touches.length >= 2 || (scaleRef.current > 1.05 && evt.nativeEvent.touches.length === 1);
      },
      onMoveShouldSetPanResponderCapture: (evt) => {
        return evt.nativeEvent.touches.length >= 2;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const now = Date.now();
        if (now - lastTap < 320) {
          // Double tap: toggle zoom between 100% and 200%
          const nextScale = scaleRef.current > 1.2 ? 1 : 2;
          setScale(nextScale);
          setPanOffset({ x: 0, y: 0 });
          lastTap = 0;
          return;
        }
        lastTap = now;

        startPanX = panOffsetRef.current.x;
        startPanY = panOffsetRef.current.y;

        if (evt.nativeEvent.touches.length >= 2) {
          setIsPinching(true);
          const [t0, t1] = evt.nativeEvent.touches;
          initialDist = Math.hypot(t0.pageX - t1.pageX, t0.pageY - t1.pageY);
          initialScale = scaleRef.current;
        } else {
          initialDist = null;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length >= 2) {
          const [t0, t1] = evt.nativeEvent.touches;
          const currentDist = Math.hypot(t0.pageX - t1.pageX, t0.pageY - t1.pageY);

          if (!initialDist || initialDist <= 0) {
            initialDist = currentDist;
            initialScale = scaleRef.current;
            setIsPinching(true);
            return;
          }

          const ratio = currentDist / initialDist;
          const targetScale = Math.min(Math.max(initialScale * ratio, 0.7), 4.0);
          setScale(Number(targetScale.toFixed(2)));
        } else if (evt.nativeEvent.touches.length === 1 && scaleRef.current > 1.05 && !isPinchingRef.current) {
          // 1-finger pan when zoomed in
          setPanOffset({
            x: startPanX + gestureState.dx,
            y: startPanY + gestureState.dy,
          });
        }
      },
      onPanResponderRelease: () => {
        setIsPinching(false);
        initialDist = null;
        if (scaleRef.current < 0.95) {
          setScale(1);
          setPanOffset({ x: 0, y: 0 });
        } else if (scaleRef.current > 3.5) {
          setScale(3.5);
        }
      },
      onPanResponderTerminate: () => {
        setIsPinching(false);
        initialDist = null;
      },
    });
  }, []);

  // Web & Mobile Browser non-passive multi-touch listener
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    let touchStartDist = 0;
    let touchStartScale = 1;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        touchStartDist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        touchStartScale = scaleRef.current;
        setIsPinching(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartDist > 0) {
        e.preventDefault();
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const currentDist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const ratio = currentDist / touchStartDist;
        const newScale = Math.min(Math.max(touchStartScale * ratio, 0.7), 4.0);
        setScale(Number(newScale.toFixed(2)));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        touchStartDist = 0;
        setIsPinching(false);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        const zoomStep = 0.08;
        setScale(prev => Math.min(Math.max(Number((prev + (delta > 0 ? zoomStep : -zoomStep)).toFixed(2)), 0.7), 4.0));
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    if (initialDocKey && effectiveDocs.length > 0) {
      const found = effectiveDocs.findIndex(
        d => d.key === initialDocKey || d.id === initialDocKey || d.key.includes(initialDocKey) || initialDocKey.includes(d.key)
      );
      if (found !== -1) {
        setActiveDocIdx(found);
      }
    }
  }, [initialDocKey, effectiveDocs]);

  const activeDoc = effectiveDocs[activeDocIdx] || effectiveDocs[0];
  const pageCount = Math.max(1, activeDoc?.page_count || (activeDoc?.pages ? activeDoc.pages.length : 1));

  // Reset image status on document or page change
  useEffect(() => {
    setImgLoading(true);
    setImgError(false);
  }, [activeDocIdx, pageIndex]);

  // Resolve direct image / document URL for the selected document & page
  const resolvedImageUrl = useMemo(() => {
    if (!activeDoc) return null;
    const cleanBase = API_BASE_URL.replace(/\/+$/, '');

    if (activeDoc.pages && activeDoc.pages.length > 0) {
      const pageStr = activeDoc.pages[pageIndex] || activeDoc.pages[0];
      if (pageStr) {
        if (pageStr.startsWith('http')) return pageStr;
        return `${cleanBase}/ingress${pageStr.startsWith('/') ? '' : '/'}${pageStr}`;
      }
    }

    if (activeDoc.file_url) {
      if (activeDoc.file_url.startsWith('http')) return activeDoc.file_url;
      return `${cleanBase}/ingress${activeDoc.file_url.startsWith('/') ? '' : '/'}${activeDoc.file_url}`;
    }

    if (claimId && activeDoc.id && activeDoc.id !== 'doc_default') {
      return `${cleanBase}/ingress/claims/${claimId}/documents/${activeDoc.id}/pages/${pageIndex + 1}/image`;
    }

    if (claimId) {
      return `${cleanBase}/ingress/claims/${claimId}/file?view=true`;
    }

    return null;
  }, [activeDoc, claimId, pageIndex]);

  const handleSelectDoc = (idx: number) => {
    setActiveDocIdx(idx);
    setPageIndex(0);
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
    setUseFormFallback(false);
  };

  const handlePrev = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    } else if (activeDocIdx > 0) {
      setActiveDocIdx(activeDocIdx - 1);
      setPageIndex(0);
      setScale(1);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleNext = () => {
    if (pageIndex < pageCount - 1) {
      setPageIndex(pageIndex + 1);
    } else if (activeDocIdx < effectiveDocs.length - 1) {
      setActiveDocIdx(activeDocIdx + 1);
      setPageIndex(0);
      setScale(1);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleOpenExternal = () => {
    if (resolvedImageUrl) {
      Linking.openURL(resolvedImageUrl).catch(() => {});
    }
  };

  // Fallback Renderers
  const renderFallbackView = () => {
    const key = activeDoc?.key || '';
    if (key.includes('discharge')) return renderDischargeSummaryFallback();
    if (key.includes('bill') || key.includes('invoice')) return renderHospitalBillFallback();
    if (key.includes('lab')) return renderLabReportFallback();
    if (key.includes('pharmacy')) return renderPharmacyBillFallback();
    if (key.includes('scan')) return renderScanReportFallback();
    if (key.includes('policy')) return renderPolicyScheduleFallback();
    if (key.includes('aadhaar') || key.includes('id')) return renderAadhaarFallback();
    return renderClaimFormFallback();
  };

  const renderClaimFormFallback = () => (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <Text style={styles.formHeaderCompany}>NATIONAL INSURANCE CO. LTD.</Text>
        <Text style={styles.formHeaderTitle}>REIMBURSEMENT CLAIM FORM</Text>
        <Text style={styles.formHeaderSub}>FOR INSURED USE ONLY — BLOCK LETTERS</Text>
        <View style={styles.formHeaderDivider} />
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionBanner}><Text style={styles.sectionBannerText}>A. POLICY &amp; INSURED DETAILS</Text></View>
        <View style={styles.tableGrid}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCellLabel, { flex: 0.3 }]}><Text style={styles.cellLabelText}>Insured Name</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.3 }]}><Text style={styles.cellValText}>Anita Thakur</Text></View>
            <View style={[styles.tableCellLabel, { flex: 0.22 }]}><Text style={styles.cellLabelText}>Insurer</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.38 }]}><Text style={styles.cellValText}>National Insurance</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.tableCellLabel, { flex: 0.3 }]}><Text style={styles.cellLabelText}>Policy Number</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.3 }]}><Text style={[styles.cellValText, styles.mono]}>{policyNum}</Text></View>
            <View style={[styles.tableCellLabel, { flex: 0.22 }]}><Text style={styles.cellLabelText}>TPA Name</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.38 }]}><Text style={styles.cellValText}>Park Mediclaim TPA</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.tableCellLabel, { flex: 0.3 }]}><Text style={styles.cellLabelText}>Aadhaar</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.3 }]}><Text style={[styles.cellValText, styles.mono]}>XXXX XXXX 3831</Text></View>
            <View style={[styles.tableCellLabel, { flex: 0.22 }]}><Text style={styles.cellLabelText}>Sum Insured</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.38 }]}><Text style={styles.cellValText}>₹20,00,000/-</Text></View>
          </View>
          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.tableCellLabel, { flex: 0.3 }]}><Text style={styles.cellLabelText}>PAN Card</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.3 }]}><Text style={[styles.cellValText, styles.mono]}>OIKDT2016N</Text></View>
            <View style={[styles.tableCellLabel, { flex: 0.22 }]}><Text style={styles.cellLabelText}>Policy Type</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.38 }]}><Text style={styles.cellValText}>Arogya Sanjeevani</Text></View>
          </View>
        </View>
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionBanner}><Text style={styles.sectionBannerText}>B. PATIENT INFORMATION</Text></View>
        <View style={styles.tableGrid}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCellLabel, { flex: 0.3 }]}><Text style={styles.cellLabelText}>Patient Name</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.38 }]}><Text style={[styles.cellValText, { fontWeight: '700' }]}>{patientDisplayName}</Text></View>
            <View style={[styles.tableCellLabel, { flex: 0.18 }]}><Text style={styles.cellLabelText}>Blood</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.14 }]}><Text style={[styles.cellValText, { fontWeight: '700', color: colors.red }]}>O-</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.tableCellLabel, { flex: 0.3 }]}><Text style={styles.cellLabelText}>DOB</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.3 }]}><Text style={styles.cellValText}>08/10/1967</Text></View>
            <View style={[styles.tableCellLabel, { flex: 0.22 }]}><Text style={styles.cellLabelText}>Mobile</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.38 }]}><Text style={[styles.cellValText, styles.mono]}>+919582959495</Text></View>
          </View>
          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.tableCellLabel, { flex: 0.3 }]}><Text style={styles.cellLabelText}>Relation</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.24 }]}><Text style={styles.cellValText}>Spouse</Text></View>
            <View style={[styles.tableCellLabel, { flex: 0.18 }]}><Text style={styles.cellLabelText}>Address</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.48 }]}><Text style={styles.cellValText} numberOfLines={1}>H.No. 88, Saxena Rd, Siwan</Text></View>
          </View>
        </View>
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionBanner}><Text style={styles.sectionBannerText}>C. HOSPITALIZATION &amp; EXPENSES</Text></View>
        <View style={styles.tableGrid}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCellLabel, { flex: 0.3 }]}><Text style={styles.cellLabelText}>Hospital Name</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.7 }]}><Text style={styles.cellValText} numberOfLines={1}>{hospitalDisplayName}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.tableCellLabel, { flex: 0.3 }]}><Text style={styles.cellLabelText}>Admission</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.35 }]}><Text style={[styles.cellValText, styles.mono]}>{cachedClaim?.admissionDate || '07/02/2024'}</Text></View>
            <View style={[styles.tableCellLabel, { flex: 0.15 }]}><Text style={styles.cellLabelText}>Disch</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.2 }]}><Text style={[styles.cellValText, styles.mono]}>{cachedClaim?.dischargeDate || '22/02/2024'}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.tableCellLabel, { flex: 0.3 }]}><Text style={styles.cellLabelText}>Diagnosis</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.7 }]}><Text style={[styles.cellValText, { fontWeight: '700', color: '#15803d' }]}>{cachedClaim?.diagnosis || 'Hypothyroidism Chronic Type 2 Pulmon'}</Text></View>
          </View>
          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.tableCellLabel, { flex: 0.3 }]}><Text style={styles.cellLabelText}>Billed Total</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.7 }]}><Text style={[styles.cellValText, { fontWeight: '800', fontSize: 13, color: '#0d9488' }]}>{billedTotalFormatted}</Text></View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderDischargeSummaryFallback = () => (
    <View style={styles.formContainer}>
      <View style={[styles.hospitalDocHeader, { borderBottomColor: '#0f766e' }]}>
        <Text style={styles.hospitalHeaderName}>{hospitalDisplayName.toUpperCase()}</Text>
        <Text style={styles.hospitalHeaderDept}>DEPARTMENT OF PULMONOLOGY &amp; CRITICAL CARE</Text>
        <Text style={styles.hospitalHeaderDocType}>CLINICAL DISCHARGE SUMMARY</Text>
      </View>
      <View style={[styles.medBox, { borderColor: '#cbd5e1' }]}>
        <View style={styles.medBoxTitleRow}><Text style={styles.medBoxTitle}>PATIENT RECORD</Text></View>
        <View style={styles.tableGrid}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCellLabel, { flex: 0.3 }]}><Text style={styles.cellLabelText}>Patient</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.4 }]}><Text style={[styles.cellValText, { fontWeight: '700' }]}>{patientDisplayName}</Text></View>
            <View style={[styles.tableCellLabel, { flex: 0.15 }]}><Text style={styles.cellLabelText}>Blood</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.15 }]}><Text style={[styles.cellValText, { color: colors.red, fontWeight: '700' }]}>O-</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.tableCellLabel, { flex: 0.3 }]}><Text style={styles.cellLabelText}>IPD / UHID</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.7 }]}><Text style={[styles.cellValText, styles.mono]}>GMCH-IPD-89421 · 59 Y / M</Text></View>
          </View>
          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.tableCellLabel, { flex: 0.3 }]}><Text style={styles.cellLabelText}>Dates</Text></View>
            <View style={[styles.tableCellVal, { flex: 0.7 }]}><Text style={[styles.cellValText, styles.mono]}>{cachedClaim?.admissionDate || '07/02/2024'} to {cachedClaim?.dischargeDate || '22/02/2024'}</Text></View>
          </View>
        </View>
      </View>
      <View style={[styles.clinicalCard, { backgroundColor: '#f0fdf4', borderColor: '#86efac', marginTop: 8 }]}>
        <Text style={[styles.clinicalCardLabel, { color: '#166534' }]}>PRIMARY CLINICAL DIAGNOSIS</Text>
        <Text style={[styles.clinicalCardValue, { color: '#14532d' }]}>
          {cachedClaim?.diagnosis || 'Acute Exacerbation of COPD with Chronic Respiratory Failure Type 2 & Hypothyroidism'}
        </Text>
      </View>
    </View>
  );

  const renderHospitalBillFallback = () => (
    <View style={styles.formContainer}>
      <View style={[styles.hospitalDocHeader, { borderBottomColor: '#2563eb' }]}>
        <Text style={[styles.hospitalHeaderName, { color: '#1e3a8a' }]}>{hospitalDisplayName.toUpperCase()}</Text>
        <Text style={styles.hospitalHeaderDept}>INPATIENT FINAL TAX INVOICE</Text>
      </View>
      <View style={styles.billTotalRow}>
        <Text style={styles.billTotalLabel}>TOTAL BILLED AMOUNT (INR)</Text>
        <Text style={styles.billTotalValue}>{billedTotalFormatted}</Text>
      </View>
    </View>
  );

  const renderLabReportFallback = () => (
    <View style={styles.formContainer}>
      <View style={[styles.hospitalDocHeader, { borderBottomColor: '#7c3aed' }]}>
        <Text style={[styles.hospitalHeaderName, { color: '#581c87' }]}>CENTRAL CLINICAL PATHOLOGY LABORATORY</Text>
        <Text style={styles.hospitalHeaderDept}>INVESTIGATION &amp; BIOCHEMISTRY REPORT</Text>
      </View>
      <View style={[styles.clinicalCard, { backgroundColor: '#fdf4ff', borderColor: '#f0abfc', marginTop: 8 }]}>
        <Text style={[styles.clinicalCardLabel, { color: '#86198f' }]}>KEY PARAMETER FINDINGS</Text>
        <Text style={[styles.clinicalCardValue, { color: '#701a75' }]}>TSH: 12.80 µIU/mL (HIGH) · FT4: 0.62 ng/dL (LOW) · TLC: 11,400 /µL</Text>
      </View>
    </View>
  );

  const renderPharmacyBillFallback = () => (
    <View style={styles.formContainer}>
      <View style={[styles.hospitalDocHeader, { borderBottomColor: '#059669' }]}>
        <Text style={[styles.hospitalHeaderName, { color: '#065f46' }]}>CENTRAL HOSPITAL PHARMACY</Text>
        <Text style={styles.hospitalHeaderDept}>DISPENSING TAX INVOICE</Text>
      </View>
      <View style={styles.billTotalRow}>
        <Text style={styles.billTotalLabel}>TOTAL PHARMACY CHARGES</Text>
        <Text style={styles.billTotalValue}>₹16,840.51</Text>
      </View>
    </View>
  );

  const renderScanReportFallback = () => (
    <View style={styles.formContainer}>
      <View style={[styles.hospitalDocHeader, { borderBottomColor: '#d97706' }]}>
        <Text style={[styles.hospitalHeaderName, { color: '#92400e' }]}>DEPARTMENT OF RADIODIAGNOSIS</Text>
        <Text style={styles.hospitalHeaderDept}>HRCT CHEST SCAN REPORT</Text>
      </View>
      <View style={[styles.clinicalCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a', marginTop: 8 }]}>
        <Text style={[styles.clinicalCardLabel, { color: '#92400e' }]}>RADIOLOGICAL IMPRESSION</Text>
        <Text style={[styles.clinicalCardValue, { color: '#78350f' }]}>Bilateral centrilobular emphysema with acute bronchiolitic changes.</Text>
      </View>
    </View>
  );

  const renderPolicyScheduleFallback = () => (
    <View style={styles.formContainer}>
      <View style={[styles.hospitalDocHeader, { borderBottomColor: '#4338ca' }]}>
        <Text style={[styles.hospitalHeaderName, { color: '#312e81' }]}>NATIONAL INSURANCE COMPANY LIMITED</Text>
        <Text style={styles.hospitalHeaderDept}>POLICY SCHEDULE — AROGYA SANJEEVANI</Text>
      </View>
      <View style={styles.billTotalRow}>
        <Text style={styles.billTotalLabel}>SUM INSURED</Text>
        <Text style={styles.billTotalValue}>₹20,00,000.00</Text>
      </View>
    </View>
  );

  const renderAadhaarFallback = () => (
    <View style={styles.formContainer}>
      <View style={[styles.hospitalDocHeader, { borderBottomColor: '#ea580c' }]}>
        <Text style={[styles.hospitalHeaderName, { color: '#c2410c' }]}>GOVERNMENT OF INDIA (UIDAI)</Text>
        <Text style={styles.hospitalHeaderDept}>AADHAAR IDENTIFICATION DOCUMENT</Text>
      </View>
      <View style={styles.billTotalRow}>
        <Text style={styles.billTotalLabel}>AADHAAR NUMBER</Text>
        <Text style={styles.billTotalValue}>XXXX XXXX 3831</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Top App Bar matching AI Brain Preview: <  Preview Documents     [↗] */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={colors.ink} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.ink }]} numberOfLines={1}>
          Preview Documents
        </Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleOpenExternal}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ExternalLink size={19} color={colors.muted} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* 1. Multi-Document Carousel Bar */}
      <View style={[styles.docCarouselContainer, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <Text style={[styles.docCarouselTitle, { color: colors.muted }]}>
          DOCUMENTS ({effectiveDocs.length}):
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.docChipsScroll}
        >
          {effectiveDocs.map((doc, idx) => {
            const isSel = idx === activeDocIdx;
            const DocIcon = getDocIcon(doc.key || doc.name);
            return (
              <TouchableOpacity
                key={`preview_chip_${doc.id || doc.key || idx}_${idx}`}
                style={[
                  styles.docChip,
                  isSel
                    ? { backgroundColor: colors.brandSoft, borderColor: colors.brand }
                    : { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
                onPress={() => handleSelectDoc(idx)}
                activeOpacity={0.7}
              >
                <View style={{ flexShrink: 0 }}>
                  <DocIcon size={14} color={isSel ? colors.brandDark : colors.muted} strokeWidth={2.2} />
                </View>
                <Text
                  style={[
                    styles.docChipText,
                    {
                      color: isSel ? colors.brandDark : colors.ink,
                      fontWeight: isSel ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {doc.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. Control Toolbar: Page navigation & Zoom */}
      <View style={[styles.toolbarRow, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        {/* Page Switcher */}
        <View style={styles.pageControlsGroup}>
          <TouchableOpacity
            style={[styles.toolbarNavBtn, { borderColor: colors.line }]}
            onPress={handlePrev}
            disabled={pageIndex === 0 && activeDocIdx === 0}
          >
            <ChevronLeft size={16} color={pageIndex === 0 && activeDocIdx === 0 ? colors.muted : colors.ink} />
          </TouchableOpacity>
          <Text style={[styles.pageLabel, { color: colors.ink }]}>
            Page <Text style={[styles.pageNumberBox, { borderColor: colors.line, backgroundColor: colors.surface2 }]}>{pageIndex + 1}</Text> of {pageCount}
          </Text>
          <TouchableOpacity
            style={[styles.toolbarNavBtn, { borderColor: colors.line }]}
            onPress={handleNext}
            disabled={pageIndex >= pageCount - 1 && activeDocIdx >= effectiveDocs.length - 1}
          >
            <ChevronRight size={16} color={pageIndex >= pageCount - 1 && activeDocIdx >= effectiveDocs.length - 1 ? colors.muted : colors.ink} />
          </TouchableOpacity>
        </View>

        {/* Zoom Controls & Mode Toggle */}
        <View style={styles.zoomControlsGroup}>
          <TouchableOpacity
            style={[styles.zoomBtn, { borderColor: colors.line }]}
            onPress={() => setScale(prev => Math.max(0.7, Number((prev - 0.25).toFixed(2))))}
            disabled={scale <= 0.7}
          >
            <Minus size={14} color={scale <= 0.7 ? colors.muted : colors.ink} />
          </TouchableOpacity>
          <Text style={[styles.zoomPercentText, { color: colors.muted }]}>
            {Math.round(scale * 100)}%
          </Text>
          <TouchableOpacity
            style={[styles.zoomBtn, { borderColor: colors.line }]}
            onPress={() => setScale(prev => Math.min(3.5, Number((prev + 0.25).toFixed(2))))}
            disabled={scale >= 3.5}
          >
            <Plus size={14} color={scale >= 3.5 ? colors.muted : colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.zoomBtn, { borderColor: colors.line, marginLeft: 2 }]}
            onPress={() => {
              setScale(1);
              setPanOffset({ x: 0, y: 0 });
            }}
          >
            <Maximize2 size={13} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.zoomBtn,
              {
                borderColor: useFormFallback ? colors.brand : colors.line,
                backgroundColor: useFormFallback ? colors.brandSoft : 'transparent',
                marginLeft: 2,
              },
            ]}
            onPress={() => setUseFormFallback(prev => !prev)}
          >
            <Eye size={13} color={useFormFallback ? colors.brandDark : colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Document Preview Canvas: preview in the same window with pinch-to-zoom */}
      <ScrollView
        style={[styles.container, { backgroundColor: isDark ? colors.bg : '#f1f5f9' }]}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator
        scrollEnabled={!isPinching && scale <= 1.05}
        minimumZoomScale={1}
        maximumZoomScale={4}
      >
        <View style={styles.canvasWrapper} {...panResponder.panHandlers}>
          {useFormFallback || imgError ? (
            /* Rendered Document Form View */
            <View
              style={[
                styles.paperCanvas,
                {
                  backgroundColor: '#ffffff',
                  borderColor: colors.line,
                  transform: [
                    { translateX: panOffset.x },
                    { translateY: panOffset.y },
                    { scale },
                  ],
                },
              ]}
            >
              {imgError && (
                <View style={styles.noticeBar}>
                  <Text style={styles.noticeText}>
                    Showing rendered document content. Tap eye icon or retry to load image file.
                  </Text>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => {
                      setImgLoading(true);
                      setImgError(false);
                      setUseFormFallback(false);
                    }}
                  >
                    <RefreshCw size={12} color={colors.brandDark} />
                    <Text style={[styles.retryBtnText, { color: colors.brandDark }]}>Reload Image</Text>
                  </TouchableOpacity>
                </View>
              )}
              {renderFallbackView()}
            </View>
          ) : (
            /* Actual Document Image View */
            <View
              style={[
                styles.imageCanvasCard,
                {
                  backgroundColor: '#ffffff',
                  borderColor: colors.line,
                  transform: [
                    { translateX: panOffset.x },
                    { translateY: panOffset.y },
                    { scale },
                  ],
                },
              ]}
            >
              {imgLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.brand} />
                  <Text style={[styles.loadingText, { color: colors.muted }]}>
                    Loading uploaded document…
                  </Text>
                </View>
              )}

              {resolvedImageUrl && (
                <Image
                  source={{ uri: resolvedImageUrl }}
                  style={[
                    styles.actualDocImage,
                    imgLoading ? { opacity: 0 } : { opacity: 1 },
                  ]}
                  resizeMode="contain"
                  onLoad={() => {
                    setImgLoading(false);
                    setImgError(false);
                  }}
                  onError={() => {
                    setImgLoading(false);
                    setImgError(true);
                  }}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  appBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  appBarTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
    textAlign: 'left',
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Multi-Document Carousel Bar
  docCarouselContainer: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  docCarouselTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  docChipsScroll: {
    flexDirection: 'row',
    gap: 7,
    paddingBottom: 2,
  },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
    maxWidth: 260,
    overflow: 'hidden',
    flexShrink: 0,
  },
  docChipText: {
    fontSize: 12,
    flexShrink: 1,
  },

  // Toolbar
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  pageControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  toolbarNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  pageNumberBox: {
    fontWeight: '800',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  zoomControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomPercentText: {
    fontSize: 11,
    fontWeight: '600',
    width: 38,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Scroll Container & Document Canvas
  container: {
    flex: 1,
  },
  scrollInner: {
    padding: 12,
    paddingBottom: 48,
    alignItems: 'center',
  },
  canvasWrapper: {
    width: '100%',
    maxWidth: 640,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { touchAction: 'none' as any } : {}),
  },

  // Actual Image Document Card
  imageCanvasCard: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    minHeight: 520,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actualDocImage: {
    width: '100%',
    height: 600,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },

  // Fallback Notice Bar
  noticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 10,
    gap: 8,
  },
  noticeText: {
    fontSize: 10,
    color: '#166534',
    flex: 1,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  retryBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Paper Canvas for Structured Document
  paperCanvas: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    minHeight: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  formContainer: {
    flex: 1,
  },

  // Form Headers
  formHeader: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  formHeaderCompany: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b21a8',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  formHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#581c87',
    marginTop: 2,
    textAlign: 'center',
  },
  formHeaderSub: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1e1b4b',
    marginTop: 2,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  formHeaderDivider: {
    width: '100%',
    height: 2,
    backgroundColor: '#7c3aed',
    marginTop: 6,
  },

  // Hospital Documents Header
  hospitalDocHeader: {
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 2,
  },
  hospitalHeaderName: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0f766e',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  hospitalHeaderDept: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#042f2e',
    marginTop: 2,
    textAlign: 'center',
  },
  hospitalHeaderDocType: {
    fontSize: 12,
    fontWeight: '900',
    color: '#115e59',
    marginTop: 3,
    letterSpacing: 0.3,
  },

  // Form Section & Table Grids
  formSection: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    overflow: 'hidden',
  },
  sectionBanner: {
    backgroundColor: '#6b21a8',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sectionBannerText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tableGrid: {
    backgroundColor: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableCellLabel: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 6,
    paddingVertical: 5,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  cellLabelText: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },
  tableCellVal: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 5,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  cellValText: {
    fontSize: 9.5,
    color: '#0f172a',
    fontWeight: '600',
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Medical Card & Blocks
  medBox: {
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 6,
  },
  medBoxTitleRow: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  medBoxTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.4,
  },
  clinicalCard: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 9,
    marginTop: 8,
  },
  clinicalCardLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  clinicalCardValue: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },

  // Bill Total
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  billTotalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#115e59',
  },
  billTotalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f766e',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
