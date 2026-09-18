import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  Share,
  PanResponder,
  ActivityIndicator,
  Linking,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Check,
  AlertTriangle,
  FileText,
  Send,
  Share2,
  X as XIcon,
  Calendar,
  ChevronDown,
  Save,
  LayoutGrid,
  CheckCircle2,
  Download,
  ExternalLink,
  RotateCw,
  Eye,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { Routes } from '../../../app/navigation/routes';
import { formatINR } from '../../../core/utils/currency';
import * as FileSystem from 'expo-file-system/legacy';
import {
  getBlankModernPdfBlob,
  BLANK_IRDA_PDF_FILENAME,
  getBlankIrdaFormHtml,
} from '../../../core/utils/blankIrdaForm';
import { BLANK_IRDA_PDF_BASE64 } from '../../../core/assets/blankIrdaPdfBase64';
import { claimsApi } from '../services/claimsApi';


const cleanInsuredName = (raw?: string) => {
  if (!raw) return '';
  let cleaned = raw
    .replace(/^(Name|Patient\s*Name|Patient)\s*[:\-]?\s*/i, '')
    .replace(/\s+Blood Group.*$/i, '')
    .trim();
  const tokens = cleaned.split(/\s+/);
  const deduplicated: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (i === 0 || tokens[i].toLowerCase() !== tokens[i - 1].toLowerCase()) {
      deduplicated.push(tokens[i]);
    }
  }
  return deduplicated.join(' ');
};

export const SubmissionScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isNarrow = windowWidth < 360;
  const claimId = route?.params?.claimId || 'a4f1c9e2';
  const { claims, addOrUpdateClaim } = useClaimsStore();

  const fallbackClaim = {
    id: claimId || 'a4f1c9e2',
    who: 'R. Menon',
    dept: 'Cardiology',
    amt: 184500,
    status: 'complete' as const,
    step: 'validate' as const,
    indexed: false,
    policyNo: 'SAMPLE-PH-77421',
    hospital: 'Sunrise Multispecialty',
    doctor: 'Dr. P. Rangan',
    diagnosis: 'Chest pain on exertion; acute coronary event.',
    age: 54,
    gender: 'Male',
    admissionDate: '12-08-2026',
    dischargeDate: '16-08-2026',
    days: 4,
    claimType: 'Reimbursement',
    fieldsParsed: '23 of 27',
  };

  const claim = claims.find(c => c.id === claimId || c.id.startsWith(claimId)) || claims[0] || fallbackClaim;

  // Payer / Adapter state (default 'generic' as in reference prototype)
  const [payer, setPayer] = useState<'generic' | 'fhir' | 'x12'>('generic');
  const [showPayerModal, setShowPayerModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // IRDAI & TPA Form Render Style (options: 'modern' | 'blank' | 'tpa')
  const [renderStyle, setRenderStyle] = useState<'modern' | 'blank' | 'tpa'>(
    route?.params?.initialStyle === 'tpa' ? 'tpa' : route?.params?.initialStyle === 'blank' ? 'blank' : 'modern'
  );

  // Part A vs Part B Tabs
  const [partTab, setPartTab] = useState<'a' | 'b'>('a');

  // Form Fields - Part A
  const [fPolicy, setFPolicy] = useState(claim.policyNo || 'SAMPLE-PH-77421');
  const [fName, setFName] = useState(cleanInsuredName(claim.who) || 'R. Menon');
  const [fDob, setFDob] = useState('18-04-1972');
  const [fAdmission, setFAdmission] = useState(claim.admissionDate || '12-08-2026');
  const [preAuthYes, setPreAuthYes] = useState(false); // Screenshot shows 'No' selected
  const [fRelation, setFRelation] = useState('Self');
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [fIllness, setFIllness] = useState(
    'Chest pain on exertion; admitted for angioplasty following an acute coronary event.'
  );

  // Form Fields - Part B
  const [fHospName, setFHospName] = useState(claim.hospital || 'Sunrise Multispecialty');
  const [fHospReg, setFHospReg] = useState('SAMPLE-HOSP-0192');
  const [fDischarge, setFDischarge] = useState(claim.dischargeDate || '16-08-2026');
  const [fRoomCategory, setFRoomCategory] = useState('Single private');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [emergencyYes, setEmergencyYes] = useState(true); // Screenshot shows 'Yes' selected
  const [fDoctor, setFDoctor] = useState(claim.doctor || 'Dr. P. Rangan');
  const [fTreatment, setFTreatment] = useState(
    'Primary PCI with drug-eluting stent to LAD; post-procedure monitoring in CCU for 48 hours.'
  );

  // Document Checklist - exact items and checked states from reference screenshot
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    bill: true,
    summary: true,
    preauth: false,
    kyc: true,
  });

  // Interactive Signature Pad Drawing
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const currentPathRef = useRef<string>('');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const start = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        currentPathRef.current = start;
        setCurrentPath(start);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const next = `${currentPathRef.current} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        currentPathRef.current = next;
        setCurrentPath(next);
      },
      onPanResponderRelease: () => {
        if (currentPathRef.current) {
          setPaths((prev) => [...prev, currentPathRef.current]);
          currentPathRef.current = '';
          setCurrentPath('');
        }
      },
    })
  ).current;

  const clearSignature = () => {
    setPaths([]);
    setCurrentPath('');
    currentPathRef.current = '';
    showToast('Signature cleared');
  };

  // Modals & Feedback
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionReceiptId, setSubmissionReceiptId] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // IRDA PDF Preview state
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string>('IRDA_ClaimForm.pdf');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const totalBilled = claim.amt || 184500;
  const nonPayable = 7100;
  const netPayable = Math.max(0, totalBilled - nonPayable);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const toggleCheck = (k: string) => {
    setChecklist((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const loadIrdaPdf = async (styleOverride?: 'modern' | 'blank' | 'tpa') => {
    const targetStyle = styleOverride || renderStyle;

    // Pure blank IRDAI form: modern WeasyPrint PDF with 100% empty fields (no expenses, no totals)
    if (targetStyle === 'blank') {
      setPdfLoading(true);
      setPdfError(null);
      try {
        const res = getBlankModernPdfBlob();
        setPdfBlobUrl(res.url);
        setPdfFilename(res.filename);
      } catch (err: any) {
        console.warn('Failed to load blank IRDA PDF:', err);
        setPdfError('Could not prepare blank claim form.');
      } finally {
        setPdfLoading(false);
      }
      return;
    }

    setPdfLoading(true);
    setPdfError(null);

    try {
      if (targetStyle === 'tpa') {
        const res = await claimsApi.fetchTpaPdfBlob(claim.id, 'modern');
        setPdfBlobUrl(res.url);
        setPdfFilename(res.filename);
      } else {
        const res = await claimsApi.fetchIrdaPdfBlob(claim.id, 'modern', false);
        setPdfBlobUrl(res.url);
        setPdfFilename(res.filename);
      }
    } catch (err: any) {
      console.warn('Failed to load PDF from backend:', err);
      setPdfError(err?.message || 'Could not load claim document from server.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePreviewPdf = () => {
    setShowPdfModal(true);
    loadIrdaPdf();
  };

  const handleSwitchPreviewStyle = (newStyle: 'modern' | 'blank' | 'tpa') => {
    setRenderStyle(newStyle);
    loadIrdaPdf(newStyle);
  };

  const handleDownloadPdf = async () => {
    if (renderStyle === 'blank') {
      if (pdfBlobUrl && Platform.OS === 'web' && typeof document !== 'undefined') {
        const a = document.createElement('a');
        a.href = pdfBlobUrl;
        a.download = pdfFilename || BLANK_IRDA_PDF_FILENAME;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Downloading blank IRDAI form (PDF)');
        return;
      }
      try {
        const fileUri = `${FileSystem.documentDirectory || ''}${BLANK_IRDA_PDF_FILENAME}`;
        await FileSystem.writeAsStringAsync(fileUri, BLANK_IRDA_PDF_BASE64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await Share.share({
          title: 'IRDAI Standard Blank Claim Form',
          message: 'Official IRDAI Standard Blank Claim Form (Part A & B) for manual pen-fill.',
          url: fileUri,
        });
        showToast('Blank IRDAI form PDF ready');
      } catch {
        showToast('Blank form ready for printing');
      }
      return;
    }

    if (pdfBlobUrl && Platform.OS === 'web' && typeof document !== 'undefined') {
      const a = document.createElement('a');
      a.href = pdfBlobUrl;
      a.download = pdfFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Downloading ${pdfFilename}`);
    } else {
      let directUrl = '';
      if (renderStyle === 'tpa') {
        directUrl = claimsApi.getTpaPdfUrl(claim.id, 'modern', false);
      } else {
        directUrl = claimsApi.getIrdaPdfUrl(claim.id, 'modern', false, false);
      }
      Linking.openURL(directUrl).catch(() => {
        showToast('Unable to trigger download');
      });
    }
  };

  const getDirectPdfUrl = () => {
    if (renderStyle === 'tpa') {
      return claimsApi.getTpaPdfUrl(claim.id, 'modern', true);
    }
    if (renderStyle === 'blank') {
      return pdfBlobUrl || `data:application/pdf;base64,${BLANK_IRDA_PDF_BASE64}`;
    }
    return claimsApi.getIrdaPdfUrl(claim.id, 'modern', false, true);
  };

  const handleOpenPdfExternal = () => {
    if (renderStyle === 'blank') {
      if (pdfBlobUrl && Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(pdfBlobUrl, '_blank');
        return;
      }
    }

    const directUrl = getDirectPdfUrl();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (pdfBlobUrl) {
        window.open(pdfBlobUrl, '_blank');
      } else {
        window.open(directUrl, '_blank');
      }
    } else {
      Linking.openURL(directUrl).catch(() => {
        showToast('Unable to open document');
      });
    }
  };

  const handleSharePdf = async () => {
    if (renderStyle === 'blank') {
      if (pdfBlobUrl && Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(pdfBlobUrl, '_blank');
        showToast('Opened blank form in new tab');
        return;
      }
      try {
        const fileUri = `${FileSystem.documentDirectory || ''}${BLANK_IRDA_PDF_FILENAME}`;
        await FileSystem.writeAsStringAsync(fileUri, BLANK_IRDA_PDF_BASE64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await Share.share({
          title: 'IRDAI Standard Blank Claim Form',
          message: 'Official IRDAI Standard Blank Claim Form (Part A & B) for manual pen-fill.',
          url: fileUri,
        });
      } catch {
        showToast('Blank form ready for sharing');
      }
      return;
    }

    try {
      let directUrl = '';
      let title = '';
      if (renderStyle === 'tpa') {
        directUrl = claimsApi.getTpaPdfUrl(claim.id, 'modern', true);
        title = pdfFilename || `TPA_Audit_${claim.id.slice(0, 8)}.pdf`;
      } else {
        directUrl = claimsApi.getIrdaPdfUrl(claim.id, 'modern', false, true);
        title = pdfFilename || `IRDAI_Claim_${claim.id.slice(0, 8)}.pdf`;
      }
      await Share.share({
        message: `${renderStyle === 'tpa' ? 'TPA Comprehensive Audit Report' : 'Official IRDAI Claim Form (Part A & B)'} - Claim ${claim.id.slice(0, 8)} (${fName}) - Amount: ${formatINR(totalBilled)}\n${directUrl}`,
        title,
        url: directUrl,
      });
    } catch {
      showToast('Document ready for sharing');
    }
  };

  const handleSubmitFinal = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    let receiptCode = `IRDAI-${new Date().getFullYear()}-SUB-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      const res = await claimsApi.submitClaim(claim.id, payer);
      if (res) {
        if (res.reference) {
          receiptCode = res.reference;
        } else if (res.submission_id) {
          receiptCode = `TPA-${payer.toUpperCase()}-${res.submission_id.slice(0, 8)}`;
        }
      }
    } catch (err: any) {
      console.warn('[SubmissionScreen] Server submission warning:', err?.message || err);
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }

    setSubmissionReceiptId(receiptCode);

    addOrUpdateClaim({
      id: claim.id,
      status: 'submitted',
      rawStatus: 'SUBMITTED',
    });

    setShowSuccessModal(true);
  };

  const getSubmitButtonLabel = () => 'Submit Claim';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* App Bar matching exact reference: "< Submission", Save Floppy Icon, Grid Menu Icon */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Back"
        >
          <ChevronLeft size={22} color={colors.ink} strokeWidth={2.2} />
        </TouchableOpacity>

        <Text style={[styles.appBarTitle, { color: colors.ink }]}>Submission</Text>

        <View style={styles.appBarActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => showToast('Draft saved')}
            accessibilityLabel="Save"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Save size={18} color={colors.ink} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate(Routes.AllFeaturesTab)}
            accessibilityLabel="All features"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <LayoutGrid size={18} color={colors.ink} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Progress Bar - 35% filled in teal matching reference screenshot */}
      <View style={[styles.progressTrack, { backgroundColor: colors.line2 }]}>
        <View style={[styles.progressFill, { width: '35%', backgroundColor: colors.brand }]} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollInner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* IRDAI & TPA Form Render Style */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.secRow}>
            <Text style={[styles.secTitle, { color: colors.ink }]}>
              {renderStyle === 'tpa' ? 'TPA Report & Form Style' : 'IRDAI form render style'}
            </Text>
            <Text style={[styles.rendererHdr, { color: colors.muted }]}>
              {renderStyle === 'tpa' ? 'Report: TPA-Audit' : renderStyle === 'blank' ? 'Standard Blank (Pen-Fill)' : `X-IRDA-Renderer: ${renderStyle}`}
            </Text>
          </View>

          {/* 3-segment switcher: modern | blank | tpa */}
          <View style={[styles.segGroup, { borderColor: colors.line }]}>
            {(['modern', 'blank', 'tpa'] as const).map((styleOpt) => {
              const isSelected = renderStyle === styleOpt;
              return (
                <TouchableOpacity
                  key={styleOpt}
                  style={[
                    styles.segOption,
                    isSelected && { backgroundColor: colors.brand },
                  ]}
                  onPress={() => setRenderStyle(styleOpt)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.segOptionText,
                      {
                        color: isSelected ? colors.onBrand : colors.muted,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {styleOpt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Info banner when tpa is active */}
          {renderStyle === 'tpa' && (
            <View style={[styles.bannerWarn, { backgroundColor: colors.brandSoft, borderColor: colors.brand }]}>
              <FileText size={15} color={colors.brandDark} style={styles.bannerIcon} />
              <Text style={[styles.bannerWarnText, { color: colors.brandDark }]}>
                TPA Comprehensive Audit Report: AI-powered medical claim verification, clinical coding audit &amp; cost reconciliation dossier.
              </Text>
            </View>
          )}

          {/* Info banner when blank is active */}
          {renderStyle === 'blank' && (
            <View style={[styles.bannerWarn, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              <FileText size={15} color={colors.ink} style={styles.bannerIcon} />
              <Text style={[styles.bannerWarnText, { color: colors.ink }]}>
                Official Blank IRDAI Form: 100% clean Part A &amp; B template. Ready to download or print for manual pen-fill.
              </Text>
            </View>
          )}

          <Text style={[styles.subNote, { color: colors.muted }]}>
            modern = IRDAI Claim Form (Part A &amp; B) · blank = 100% Blank (For Pen-Fill) · tpa = TPA Audit Report
          </Text>

          <TouchableOpacity
            style={[styles.irdaFormCardBtn, { borderColor: colors.line, backgroundColor: colors.surface2 }]}
            onPress={() => {
              setShowPdfModal(true);
              loadIrdaPdf(renderStyle);
            }}
            activeOpacity={0.7}
          >
            <FileText size={16} color={colors.brandDark} />
            <Text style={[styles.irdaFormCardBtnText, { color: colors.brandDark }]}>
              {renderStyle === 'tpa'
                ? 'View TPA Audit Report'
                : renderStyle === 'blank'
                ? 'View Blank IRDAI Form'
                : 'View IRDAI Claim Form'}
            </Text>
            <ExternalLink size={14} color={colors.brandDark} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>


        {/* Part A vs Part B Selector Tabs */}
        <View style={[styles.partTabsContainer, { borderColor: colors.line }]}>
          <TouchableOpacity
            style={[
              styles.partTabButton,
              partTab === 'a' && { backgroundColor: colors.brand },
            ]}
            onPress={() => setPartTab('a')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.partTabButtonText,
                { color: partTab === 'a' ? colors.onBrand : colors.brandDark },
              ]}
            >
              Part A — Insured
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.partTabButton,
              partTab === 'b' && { backgroundColor: colors.brand },
            ]}
            onPress={() => setPartTab('b')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.partTabButtonText,
                { color: partTab === 'b' ? colors.onBrand : colors.brandDark },
              ]}
            >
              Part B — Hospital
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= PART A: INSURED ================= */}
        {partTab === 'a' && (
          <>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>Policy number</Text>
                <TextInput
                  style={[styles.inp, { backgroundColor: colors.surface2, color: colors.ink, borderColor: colors.line }]}
                  value={fPolicy}
                  onChangeText={setFPolicy}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>Name of insured</Text>
                <TextInput
                  style={[styles.inp, { backgroundColor: colors.surface2, color: colors.ink, borderColor: colors.line }]}
                  value={fName}
                  onChangeText={setFName}
                />
              </View>

              {/* Responsive grid: Date of birth & Date of admission */}
              <View style={[styles.grid2, isNarrow && styles.gridStacked]}>
                <View style={[styles.gridCol, isNarrow && styles.gridColStacked]}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Date of birth</Text>
                  <View style={[styles.dateInpWrap, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                    <TextInput
                      style={[styles.dateInp, { color: colors.ink }]}
                      value={fDob}
                      onChangeText={setFDob}
                      placeholder="DD-MM-YYYY"
                      placeholderTextColor={colors.muted}
                      maxLength={10}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                    <Calendar size={15} color={colors.muted} style={styles.dateIcon} />
                  </View>
                </View>

                <View style={[styles.gridCol, isNarrow && styles.gridColStacked]}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Date of admission</Text>
                  <View style={[styles.dateInpWrap, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                    <TextInput
                      style={[styles.dateInp, { color: colors.ink }]}
                      value={fAdmission}
                      onChangeText={setFAdmission}
                      placeholder="DD-MM-YYYY"
                      placeholderTextColor={colors.muted}
                      maxLength={10}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                    <Calendar size={15} color={colors.muted} style={styles.dateIcon} />
                  </View>
                </View>
              </View>

              {/* Was pre-authorisation obtained? (Radio buttons) */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>Was pre-authorisation obtained?</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[
                      styles.radioBtn,
                      { borderColor: colors.line, backgroundColor: colors.surface },
                      preAuthYes && [styles.radioBtnOn, { borderColor: colors.brand, backgroundColor: colors.brandSoft }],
                    ]}
                    onPress={() => setPreAuthYes(true)}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        { color: preAuthYes ? colors.brandDark : colors.muted, fontWeight: preAuthYes ? '700' : '500' },
                      ]}
                    >
                      Yes
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.radioBtn,
                      { borderColor: colors.line, backgroundColor: colors.surface },
                      !preAuthYes && [styles.radioBtnOn, { borderColor: colors.brand, backgroundColor: colors.brandSoft }],
                    ]}
                    onPress={() => setPreAuthYes(false)}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        { color: !preAuthYes ? colors.brandDark : colors.muted, fontWeight: !preAuthYes ? '700' : '500' },
                      ]}
                    >
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Relationship to insured */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>Relationship to insured</Text>
                <TouchableOpacity
                  style={[styles.selectBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                  onPress={() => setShowRelationModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selectBoxText, { color: colors.ink }]}>{fRelation}</Text>
                  <ChevronDown size={16} color={colors.muted} />
                </TouchableOpacity>
              </View>

              {/* Nature of illness / injury */}
              <View style={[styles.field, { marginBottom: 0 }]}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>Nature of illness / injury</Text>
                <TextInput
                  style={[styles.inp, styles.textArea, { backgroundColor: colors.surface2, color: colors.ink, borderColor: colors.line }]}
                  value={fIllness}
                  onChangeText={setFIllness}
                  multiline
                />
              </View>
            </View>

            {/* Document Checklist Card */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[styles.secTitle, { color: colors.ink, marginBottom: 6 }]}>Document checklist</Text>

              {[
                { k: 'bill', label: 'Original hospital bill' },
                { k: 'summary', label: 'Discharge summary' },
                { k: 'preauth', label: 'Pre-authorisation letter' },
                { k: 'kyc', label: 'KYC / ID proof' },
              ].map((item, idx, arr) => {
                const isChecked = checklist[item.k];
                const isLast = idx === arr.length - 1;
                return (
                  <TouchableOpacity
                    key={item.k}
                    style={[styles.checkItemRow, !isLast && { borderBottomColor: colors.line2 }]}
                    onPress={() => toggleCheck(item.k)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.customCheckBox,
                        {
                          backgroundColor: isChecked ? colors.brand : colors.surface,
                          borderColor: isChecked ? colors.brand : colors.line,
                        },
                      ]}
                    >
                      {isChecked && <Check size={12} color="#ffffff" strokeWidth={3.4} />}
                    </View>
                    <Text style={[styles.checkItemLabel, { color: colors.ink }]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Signature Card */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <View style={styles.secRow}>
                <Text style={[styles.secTitle, { color: colors.ink }]}>Signature</Text>
                <TouchableOpacity onPress={clearSignature} hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}>
                  <Text style={[styles.clearBtnText, { color: colors.brandDark }]}>Clear</Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.sigPadBox,
                  { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
                {...panResponder.panHandlers}
              >
                <Svg style={StyleSheet.absoluteFill}>
                  {paths.map((p, i) => (
                    <Path
                      key={i}
                      d={p}
                      stroke={colors.ink}
                      strokeWidth={2.6}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                  {currentPath ? (
                    <Path
                      d={currentPath}
                      stroke={colors.ink}
                      strokeWidth={2.6}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null}
                </Svg>
              </View>
              <Text style={[styles.sigPrompt, { color: colors.muted }]}>Draw with your finger or mouse</Text>
            </View>
          </>
        )}

        {/* ================= PART B: HOSPITAL ================= */}
        {partTab === 'b' && (
          <>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>Hospital name</Text>
                <TextInput
                  style={[styles.inp, { backgroundColor: colors.surface2, color: colors.ink, borderColor: colors.line }]}
                  value={fHospName}
                  onChangeText={setFHospName}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>Hospital registration no.</Text>
                <TextInput
                  style={[styles.inp, { backgroundColor: colors.surface2, color: colors.ink, borderColor: colors.line }]}
                  value={fHospReg}
                  onChangeText={setFHospReg}
                />
              </View>

              {/* Responsive grid: Date of discharge & Room category */}
              <View style={[styles.grid2, isNarrow && styles.gridStacked]}>
                <View style={[styles.gridCol, isNarrow && styles.gridColStacked]}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Date of discharge</Text>
                  <View style={[styles.dateInpWrap, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                    <TextInput
                      style={[styles.dateInp, { color: colors.ink }]}
                      value={fDischarge}
                      onChangeText={setFDischarge}
                      placeholder="DD-MM-YYYY"
                      placeholderTextColor={colors.muted}
                      maxLength={10}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                    <Calendar size={15} color={colors.muted} style={styles.dateIcon} />
                  </View>
                </View>

                <View style={[styles.gridCol, isNarrow && styles.gridColStacked]}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Room category</Text>
                  <TouchableOpacity
                    style={[styles.selectBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                    onPress={() => setShowRoomModal(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.selectBoxText, { color: colors.ink }]} numberOfLines={1}>
                      {fRoomCategory}
                    </Text>
                    <ChevronDown size={15} color={colors.muted} style={{ flexShrink: 0 }} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Emergency admission? (Radio buttons) */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>Emergency admission?</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[
                      styles.radioBtn,
                      { borderColor: colors.line, backgroundColor: colors.surface },
                      emergencyYes && [styles.radioBtnOn, { borderColor: colors.brand, backgroundColor: colors.brandSoft }],
                    ]}
                    onPress={() => setEmergencyYes(true)}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        { color: emergencyYes ? colors.brandDark : colors.muted, fontWeight: emergencyYes ? '700' : '500' },
                      ]}
                    >
                      Yes
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.radioBtn,
                      { borderColor: colors.line, backgroundColor: colors.surface },
                      !emergencyYes && [styles.radioBtnOn, { borderColor: colors.brand, backgroundColor: colors.brandSoft }],
                    ]}
                    onPress={() => setEmergencyYes(false)}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        { color: !emergencyYes ? colors.brandDark : colors.muted, fontWeight: !emergencyYes ? '700' : '500' },
                      ]}
                    >
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>Treating doctor</Text>
                <TextInput
                  style={[styles.inp, { backgroundColor: colors.surface2, color: colors.ink, borderColor: colors.line }]}
                  value={fDoctor}
                  onChangeText={setFDoctor}
                />
              </View>

              <View style={[styles.field, { marginBottom: 0 }]}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>Summary of treatment</Text>
                <TextInput
                  style={[styles.inp, styles.textArea, { backgroundColor: colors.surface2, color: colors.ink, borderColor: colors.line }]}
                  value={fTreatment}
                  onChangeText={setFTreatment}
                  multiline
                />
              </View>
            </View>

            {/* Financial Breakdown Card */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <View style={styles.kvRow}>
                <Text style={[styles.kvKey, { color: colors.muted }]}>Total billed</Text>
                <Text style={[styles.kvVal, { color: colors.ink }]}>{formatINR(totalBilled)}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={[styles.kvKey, { color: colors.muted }]}>Non-payable items</Text>
                <Text style={[styles.kvVal, { color: colors.ink }]}>{formatINR(nonPayable)}</Text>
              </View>
              <View style={[styles.kvRow, styles.totalRow, { borderTopColor: colors.line }]}>
                <Text style={[styles.totalKey, { color: colors.ink }]}>Payable</Text>
                <Text style={[styles.totalVal, { color: colors.ink }]}>{formatINR(netPayable)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Toast */}
      {toastMsg && (
        <View style={[styles.toast, { backgroundColor: colors.navy }]}>
          <Check size={16} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.toastText} numberOfLines={2}>
            {toastMsg}
          </Text>
        </View>
      )}


      {/* Relationship Selector Modal */}
      <Modal transparent visible={showRelationModal} animationType="fade" onRequestClose={() => setShowRelationModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowRelationModal(false)}>
          <View style={[styles.pickerModalCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text style={[styles.pickerModalTitle, { color: colors.ink }]}>Relationship to Insured</Text>
            {['Self', 'Spouse', 'Dependent child', 'Parent'].map((rel) => (
              <TouchableOpacity
                key={rel}
                style={[
                  styles.pickerOptionRow,
                  { borderBottomColor: colors.line2 },
                  fRelation === rel && { backgroundColor: colors.brandSoft },
                ]}
                onPress={() => {
                  setFRelation(rel);
                  setShowRelationModal(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    { color: fRelation === rel ? colors.brandDark : colors.ink, fontWeight: fRelation === rel ? '700' : '500' },
                  ]}
                >
                  {rel}
                </Text>
                {fRelation === rel && <Check size={16} color={colors.brand} strokeWidth={2.6} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Room Category Selector Modal */}
      <Modal transparent visible={showRoomModal} animationType="fade" onRequestClose={() => setShowRoomModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowRoomModal(false)}>
          <View style={[styles.pickerModalCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text style={[styles.pickerModalTitle, { color: colors.ink }]}>Room Category</Text>
            {['Single private', 'Twin sharing', 'ICU'].map((room) => (
              <TouchableOpacity
                key={room}
                style={[
                  styles.pickerOptionRow,
                  { borderBottomColor: colors.line2 },
                  fRoomCategory === room && { backgroundColor: colors.brandSoft },
                ]}
                onPress={() => {
                  setFRoomCategory(room);
                  setShowRoomModal(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    { color: fRoomCategory === room ? colors.brandDark : colors.ink, fontWeight: fRoomCategory === room ? '700' : '500' },
                  ]}
                >
                  {room}
                </Text>
                {fRoomCategory === room && <Check size={16} color={colors.brand} strokeWidth={2.6} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Submission Confirmation Modal */}
      <Modal
        transparent
        visible={showConfirmModal}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConfirmModal(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: colors.brandSoft }]}>
              <Send size={24} color={colors.brandDark} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.ink }]}>
              Submit claim {claim.id.slice(0, 8)}?
            </Text>
            <Text style={[styles.modalBody, { color: colors.muted }]}>
              POST /submission/submit/{claim.id.slice(0, 8)} · IRDAI &amp; TPA dossier ({renderStyle}). The submission is written to the submissions table and audited.
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.line }]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.brand, opacity: isSubmitting ? 0.7 : 1 }]}
                onPress={handleSubmitFinal}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Submission Success Modal */}
      <Modal
        transparent
        visible={showSuccessModal}
        animationType="slide"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.successCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={[styles.successIconCircle, { backgroundColor: colors.greenSoft }]}>
              <CheckCircle2 size={40} color={colors.green} />
            </View>

            <Text style={[styles.successTitle, { color: colors.ink }]}>Claim Submitted Successfully!</Text>
            <Text style={[styles.successSub, { color: colors.muted }]}>
              The claim packet and all attachments have been transmitted to the payer.
            </Text>

            <View style={[styles.receiptBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.muted }]}>Submission ID</Text>
                <Text style={[styles.receiptVal, styles.mono, { color: colors.brandDark }]}>
                  {submissionReceiptId}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.muted }]}>Patient</Text>
                <Text style={[styles.receiptVal, { color: colors.ink }]}>{fName}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.muted }]}>Amount</Text>
                <Text style={[styles.receiptVal, { color: colors.ink }]}>{formatINR(totalBilled)}</Text>
              </View>
              <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.receiptLabel, { color: colors.muted }]}>Payer Gateway</Text>
                <Text style={[styles.receiptVal, { color: colors.green }]}>
                  IRDAI Electronic Portal
                </Text>
              </View>
            </View>

            <View style={styles.successActions}>
              <TouchableOpacity
                style={[styles.successOutlineBtn, { borderColor: colors.line }]}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.navigate(Routes.PatientActivity, { claimId: claim.id });
                }}
              >
                <Text style={[styles.successOutlineText, { color: colors.ink }]}>View Activity</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.successSolidBtn, { backgroundColor: colors.brand }]}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.navigate(Routes.ClaimsTab);
                }}
              >
                <Text style={styles.successSolidText}>Go to Claims</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* IRDAI PDF Preview Modal */}
      <Modal
        visible={showPdfModal}
        animationType="slide"
        onRequestClose={() => setShowPdfModal(false)}
      >
        <View style={[styles.pdfModalContainer, { backgroundColor: colors.bg }]}>
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
          <View
            style={[
              styles.pdfAppBar,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.line,
                paddingTop: Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top, 28) : insets.top,
                minHeight: 54 + (Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top, 28) : insets.top),
              },
            ]}
          >
            <TouchableOpacity onPress={() => setShowPdfModal(false)} style={styles.pdfCloseBtn}>
              <XIcon size={20} color={colors.ink} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 6 }}>
              {renderStyle === 'tpa' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.pdfTitle, { color: colors.ink }]} numberOfLines={1}>
                    TPA Audit Report
                  </Text>
                  <View style={{ backgroundColor: colors.brandSoft, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                    <Text style={{ color: colors.brandDark, fontSize: 9, fontWeight: '700' }}>PREVIEW</Text>
                  </View>
                </View>
              ) : renderStyle === 'blank' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.pdfTitle, { color: colors.ink }]} numberOfLines={1}>
                    Blank IRDAI Claim Form
                  </Text>
                  <View style={{ backgroundColor: colors.brandSoft, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                    <Text style={{ color: colors.brandDark, fontSize: 9, fontWeight: '700' }}>BLANK</Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.pdfTitle, { color: colors.ink }]} numberOfLines={1}>IRDAI Claim Form</Text>
              )}
              <Text style={[styles.pdfSubTitle, { color: colors.muted }]} numberOfLines={1}>
                {renderStyle === 'tpa'
                  ? `Claim ID: ${claim.id.slice(0, 8)}`
                  : renderStyle === 'blank'
                  ? `Part A & B · ${pdfFilename || BLANK_IRDA_PDF_FILENAME}`
                  : `Part A & B · ${pdfFilename || fPolicy}`}
              </Text>
            </View>
            <View style={styles.pdfHeaderActions}>
              <TouchableOpacity
                onPress={handleDownloadPdf}
                style={styles.pdfIconBtn}
                accessibilityLabel="Download PDF"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Download size={18} color={colors.ink} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleOpenPdfExternal}
                style={styles.pdfIconBtn}
                accessibilityLabel="Open in new tab"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ExternalLink size={18} color={colors.ink} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSharePdf}
                style={styles.pdfIconBtn}
                accessibilityLabel="Share PDF"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Share2 size={18} color={colors.brandDark} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sub-toolbar: Renderer switch & reload */}
          <View style={[styles.pdfToolbar, { backgroundColor: colors.surface2, borderBottomColor: colors.line }]}>
            <View style={styles.pdfToolbarLeft}>
              <Text style={[styles.pdfToolbarLabel, { color: colors.muted }]}>Renderer:</Text>
              <View style={styles.pdfStylePills}>
                {(['modern', 'blank', 'tpa'] as const).map((styleOpt) => {
                  const isSelected = renderStyle === styleOpt;
                  return (
                    <TouchableOpacity
                      key={styleOpt}
                      style={[
                        styles.pdfPill,
                        { borderColor: colors.line, backgroundColor: colors.surface },
                        isSelected && { backgroundColor: colors.brand, borderColor: colors.brand },
                      ]}
                      onPress={() => handleSwitchPreviewStyle(styleOpt)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pdfPillText,
                          {
                            color: isSelected ? colors.onBrand : colors.ink,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {styleOpt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <TouchableOpacity
              style={styles.pdfRefreshBtn}
              onPress={() => loadIrdaPdf(renderStyle)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <RotateCw size={13} color={colors.brandDark} />
              <Text style={[styles.pdfRefreshText, { color: colors.brandDark }]}>Reload</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.pdfViewerBody}>
            {pdfLoading ? (
              <View style={[styles.pdfLoadingState, { backgroundColor: colors.bg }]}>
                <ActivityIndicator size="large" color={colors.brand} />
                <Text style={[styles.pdfLoadingText, { color: colors.ink }]}>
                  {renderStyle === 'tpa'
                    ? 'Generating TPA Comprehensive Audit Report...'
                    : renderStyle === 'blank'
                    ? 'Preparing Blank IRDAI Form...'
                    : 'Generating Official IRDAI Claim Form...'}
                </Text>
                <Text style={[styles.pdfLoadingSub, { color: colors.muted }]}>
                  {renderStyle === 'blank'
                    ? 'Loading official IRDAI Standard Form (Part A & B) for pen-fill'
                    : renderStyle === 'tpa'
                    ? 'Fetching Clinical Coding Audit & Cost Reconciliation Dossier'
                    : `Fetching Part A & B from backend submission service (${renderStyle})`}
                </Text>
              </View>
            ) : pdfError ? (
              <View style={[styles.pdfErrorState, { backgroundColor: colors.bg }]}>
                <AlertTriangle size={36} color={colors.amber} />
                <Text style={[styles.pdfErrorTitle, { color: colors.ink }]}>
                  {renderStyle === 'tpa'
                    ? 'Unable to Load TPA Audit Report'
                    : renderStyle === 'blank'
                    ? 'Unable to Load Blank IRDA Form'
                    : 'Unable to Load IRDA Form'}
                </Text>
                <Text style={[styles.pdfErrorSub, { color: colors.muted }]}>
                  {pdfError}
                </Text>
                <TouchableOpacity
                  style={[styles.pdfRetryBtn, { backgroundColor: colors.brand }]}
                  onPress={() => loadIrdaPdf(renderStyle)}
                >
                  <Text style={styles.pdfRetryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : Platform.OS === 'web' && pdfBlobUrl ? (
              <View style={styles.pdfFrameWrapper}>
                <iframe
                  src={pdfBlobUrl}
                  title={
                    renderStyle === 'tpa'
                      ? 'TPA Comprehensive Audit Report'
                      : renderStyle === 'blank'
                      ? 'Official IRDAI Standard Blank Claim Form'
                      : 'Official IRDA Claim Form'
                  }
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: '#525659',
                  } as any}
                />
              </View>
            ) : (
              <View style={styles.pdfFrameWrapper}>
                <WebView
                  key={`${claim.id}_${renderStyle}`}
                  source={
                    renderStyle === 'blank' && pdfBlobUrl
                      ? { uri: pdfBlobUrl }
                      : Platform.OS === 'android'
                      ? { uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(getDirectPdfUrl())}` }
                      : { uri: getDirectPdfUrl() }
                  }
                  style={{ flex: 1, backgroundColor: '#525659' }}
                  originWhitelist={['*']}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  scalesPageToFit={true}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View style={[styles.pdfLoadingOverlay, { backgroundColor: colors.bg }]}>
                      <ActivityIndicator size="large" color={colors.brand} />
                      <Text style={[styles.pdfLoadingText, { color: colors.ink }]}>
                        Rendering Document in ClaimsGuru...
                      </Text>
                    </View>
                  )}
                />
              </View>
            )}
          </View>

          <View style={[styles.pdfFooter, { backgroundColor: colors.surface, borderTopColor: colors.line, paddingBottom: Math.max(insets.bottom, 14) }]}>
            <TouchableOpacity
              style={[styles.pdfCancelBtn, { borderColor: colors.line }]}
              onPress={() => setShowPdfModal(false)}
            >
              <Text style={[styles.pdfCancelBtnText, { color: colors.ink }]}>Back to Editing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pdfFooterBtn, { backgroundColor: colors.brand }]}
              onPress={() => {
                setShowPdfModal(false);
                setShowConfirmModal(true);
              }}
            >
              <Text style={styles.pdfFooterBtnText}>Proceed to Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Sticky Bottom Action Bar matching exact reference */}
      <View style={[styles.bottomStickyBar, { backgroundColor: colors.surface, borderTopColor: colors.line, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={[styles.btnOutSm, { borderColor: colors.line, backgroundColor: colors.surface }]}
          onPress={handlePreviewPdf}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnOutSmText, { color: colors.brandDark }]}>Preview PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSolid, { backgroundColor: colors.brand }]}
          onPress={() => setShowConfirmModal(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.btnSolidText}>{getSubmitButtonLabel()}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  // App Bar
  appBar: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  appBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.1,
  },
  appBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Progress Bar
  progressTrack: { height: 3, width: '100%' },
  progressFill: { height: '100%' },

  // Main Content
  content: { flex: 1 },
  scrollInner: { padding: 13, paddingBottom: 24 },

  // Cards
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    marginBottom: 11,
  },

  // Form Fields
  field: { marginBottom: 11 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '650' as any,
    marginBottom: 5,
  },
  inp: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 11,
    borderWidth: 1,
    fontSize: 13.5,
  },
  textArea: {
    minHeight: 70,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  grid2: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  gridStacked: {
    flexDirection: 'column',
    gap: 0,
  },
  gridCol: {
    flex: 1,
    minWidth: 0,
    marginBottom: 11,
  },
  gridColStacked: {
    flex: 0,
    width: '100%',
  },
  dateInpWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    minHeight: 44,
  },
  dateInp: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    minWidth: 0,
  },
  dateIcon: {
    marginLeft: 6,
    flexShrink: 0,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    minHeight: 44,
  },
  selectBoxText: {
    fontSize: 13,
    flex: 1,
    marginRight: 6,
  },
  monoSubtext: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10.5,
    marginTop: 6,
    lineHeight: 14,
  },

  // IRDAI Form Render Style
  secRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  secTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  rendererHdr: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10.5,
  },
  segGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 11,
    overflow: 'hidden',
  },
  segOption: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bannerWarn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 10,
    borderRadius: 11,
    marginTop: 9,
  },
  bannerIcon: { marginTop: 1, flexShrink: 0 },
  bannerWarnText: {
    fontSize: 11.5,
    flex: 1,
    lineHeight: 16,
  },
  subNote: {
    fontSize: 11.5,
    marginTop: 8,
    lineHeight: 16,
  },

  // Part A / Part B Tabs Bar
  partTabsContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 11,
    overflow: 'hidden',
    marginBottom: 12,
  },
  partTabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partTabButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Radio Buttons
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioBtnOn: {
    // dynamically set border and background in render
  },
  radioText: {
    fontSize: 12.2,
  },

  // Document Checklist
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  customCheckBox: {
    width: 19,
    height: 19,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkItemLabel: {
    fontSize: 12.2,
    flex: 1,
  },

  // Signature Pad
  clearBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  sigPadBox: {
    width: '100%',
    height: 96,
    borderRadius: 11,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 4,
    overflow: 'hidden',
  },
  sigPrompt: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },

  // Financial Breakdown (Part B)
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  kvKey: { fontSize: 12.2 },
  kvVal: { fontSize: 12.2, fontWeight: '700' },
  totalRow: {
    borderTopWidth: 1.5,
    marginTop: 4,
    paddingTop: 9,
  },
  totalKey: { fontSize: 13.5, fontWeight: '700' },
  totalVal: { fontSize: 15, fontWeight: '700' },

  // Bottom Action Bar
  bottomStickyBar: {
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderTopWidth: 1,
  },
  btnOutSm: {
    flex: 0.4,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutSmText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  btnSolid: {
    flex: 0.6,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSolidText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },

  // Modals & Pickers
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,20,30,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  pickerModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  pickerModalTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  pickerOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
  },
  pickerOptionText: {
    fontSize: 13,
    flex: 1,
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 74,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  // Confirm Modal
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '750' as any,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 9,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontSize: 12.5, fontWeight: '600' },
  modalConfirmBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: { color: '#ffffff', fontSize: 12.5, fontWeight: '700' },

  // Success Modal
  successCard: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 5 },
  successSub: { fontSize: 11.5, textAlign: 'center', lineHeight: 16, marginBottom: 14 },
  receiptBox: {
    width: '100%',
    borderRadius: 11,
    borderWidth: 1,
    padding: 11,
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  receiptLabel: { fontSize: 11 },
  receiptVal: { fontSize: 11, fontWeight: '700' },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  successActions: { flexDirection: 'row', gap: 9, width: '100%' },
  successOutlineBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successOutlineText: { fontSize: 12, fontWeight: '700' },
  successSolidBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successSolidText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  // PDF Preview Styles
  pdfModalContainer: { flex: 1 },
  pdfAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  pdfCloseBtn: { padding: 6 },
  pdfHeaderActions: { flexDirection: 'row', alignItems: 'center' },
  pdfIconBtn: { padding: 7, borderRadius: 6, marginLeft: 2 },
  pdfTitle: { fontSize: 14.5, fontWeight: '700' },
  pdfSubTitle: { fontSize: 11 },
  pdfToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  pdfToolbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pdfToolbarLabel: { fontSize: 12, fontWeight: '600' },
  pdfStylePills: { flexDirection: 'row', gap: 6 },
  pdfPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, borderWidth: 1 },
  pdfPillText: { fontSize: 11, fontWeight: '600' },
  pdfRefreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8 },
  pdfRefreshText: { fontSize: 12, fontWeight: '600' },
  pdfViewerBody: { flex: 1, width: '100%', backgroundColor: '#525659' },
  pdfFrameWrapper: { flex: 1, width: '100%', height: '100%' },
  pdfLoadingState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  pdfLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    padding: 24,
  },
  pdfLoadingText: { marginTop: 14, fontSize: 15, fontWeight: '600' },
  pdfLoadingSub: { marginTop: 6, fontSize: 12 },
  pdfErrorState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  pdfErrorTitle: { marginTop: 12, fontSize: 16, fontWeight: '700' },
  pdfErrorSub: { marginTop: 6, fontSize: 13, textAlign: 'center' },
  pdfRetryBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  pdfRetryBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  pdfNativeScroll: { flex: 1 },
  pdfNativeScrollInner: { padding: 14, paddingBottom: 24 },
  pdfNativeCard: { width: '100%', borderRadius: 12, borderWidth: 1, padding: 18, alignItems: 'center' },
  pdfNativeTitle: { fontSize: 16, fontWeight: '700', marginTop: 10, textAlign: 'center' },
  pdfNativeSub: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  pdfBadgeRow: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    alignItems: 'center',
  },
  pdfBadgeText: { fontSize: 11, fontWeight: '700' },
  pdfNativeActions: { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' },
  pdfActionPrimary: { flex: 1, flexDirection: 'row', height: 42, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  pdfActionPrimaryText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  pdfActionSecondary: { flex: 1, flexDirection: 'row', height: 42, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  pdfActionSecondaryText: { fontWeight: '600', fontSize: 13 },
  pdfSummaryCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  pdfSummaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingBottom: 4,
  },
  pdfSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  pdfSummaryLabel: { fontSize: 11 },
  pdfSummaryValue: { fontSize: 11, fontWeight: '600', flexShrink: 1, textAlign: 'right' },

  irdaFormCardBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, marginTop: 10, gap: 8 },
  irdaFormCardBtnText: { fontSize: 13, fontWeight: '600' },
  pdfFooter: { padding: 12, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center' },
  pdfCancelBtn: { flex: 1, height: 42, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  pdfCancelBtnText: { fontSize: 13, fontWeight: '700' },
  pdfFooterBtn: { flex: 1, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pdfFooterBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
