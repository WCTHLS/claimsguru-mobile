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
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { Routes } from '../../../app/navigation/routes';
import { formatINR } from '../../../core/utils/currency';

export const SubmissionScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const claimId = route?.params?.claimId || 'a4f1c9e2';
  const { claims, addOrUpdateClaim } = useClaimsStore();

  const claim = claims.find(c => c.id === claimId || c.id.startsWith(claimId)) || claims[0];

  // Payer / Adapter state (default 'generic' as in reference prototype)
  const [payer, setPayer] = useState<'generic' | 'fhir' | 'x12'>('generic');
  const [showPayerModal, setShowPayerModal] = useState(false);

  // IRDAI Form Render Style (default 'legacy' as in screenshot, options: 'modern' | 'legacy' | 'blank')
  const [renderStyle, setRenderStyle] = useState<'modern' | 'legacy' | 'blank'>('legacy');

  // Part A vs Part B Tabs
  const [partTab, setPartTab] = useState<'a' | 'b'>('a');

  // Form Fields - Part A
  const [fPolicy, setFPolicy] = useState(claim.policyNo || 'SAMPLE-PH-77421');
  const [fName, setFName] = useState(claim.who || 'R. Menon');
  const [fDob, setFDob] = useState('18-04-1972');
  const [fAdmission, setFAdmission] = useState('12-08-2026');
  const [preAuthYes, setPreAuthYes] = useState(false); // Screenshot shows 'No' selected
  const [fRelation, setFRelation] = useState('Self');
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [fIllness, setFIllness] = useState(
    'Chest pain on exertion; admitted for angioplasty following an acute coronary event.'
  );

  // Form Fields - Part B
  const [fHospName, setFHospName] = useState(claim.hospital || 'Sunrise Multispecialty');
  const [fHospReg, setFHospReg] = useState('SAMPLE-HOSP-0192');
  const [fDischarge, setFDischarge] = useState('16-08-2026');
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

  const handlePreviewPdf = () => {
    setShowPdfModal(true);
  };

  const handleSharePdf = async () => {
    try {
      await Share.share({
        message: `IRDAI Claim Form Submission - Claim ${claim.id.slice(0, 8)} (${fName}) - Amount: ${formatINR(totalBilled)}`,
        title: `IRDAI_Claim_${claim.id.slice(0, 8)}.pdf`,
      });
    } catch {
      showToast('Document ready for sharing');
    }
  };

  const handleSubmitFinal = () => {
    setShowConfirmModal(false);
    const receiptCode = `IRDAI-${new Date().getFullYear()}-SUB-${Math.floor(10000 + Math.random() * 90000)}`;
    setSubmissionReceiptId(receiptCode);

    addOrUpdateClaim({
      id: claim.id,
      status: 'submitted',
    });

    setShowSuccessModal(true);
  };

  const getPayerLabel = () => {
    switch (payer) {
      case 'generic':
        return 'generic (default) · TPA PDF + IRDAI form';
      case 'fhir':
        return 'Sample Health TPA · FHIR R4';
      case 'x12':
        return 'Sample Insurer · X12 837P';
    }
  };

  const getSubmitButtonLabel = () => {
    switch (payer) {
      case 'generic':
        return 'Submit · generic';
      case 'fhir':
        return 'Submit · FHIR R4';
      case 'x12':
        return 'Submit · X12 837P';
    }
  };

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
        {/* Card 1: Payer · adapter */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Payer · adapter</Text>
          <TouchableOpacity
            style={[styles.selectBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}
            onPress={() => setShowPayerModal(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectBoxText, { color: colors.ink }]} numberOfLines={1}>
              {getPayerLabel()}
            </Text>
            <ChevronDown size={16} color={colors.muted} />
          </TouchableOpacity>

          <Text style={[styles.monoSubtext, { color: colors.muted }]}>
            SUBMISSION_DEFAULT_PAYER=generic · endpoints from FHIR_ENDPOINT / X12_ENDPOINT
          </Text>
        </View>

        {/* Card 2: IRDAI form render style (visible when payer === 'generic') */}
        {payer === 'generic' && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.secRow}>
              <Text style={[styles.secTitle, { color: colors.ink }]}>IRDAI form render style</Text>
              <Text style={[styles.rendererHdr, { color: colors.muted }]}>
                X-IRDA-Renderer: {renderStyle}
              </Text>
            </View>

            {/* 3-segment switcher: modern | legacy | blank (legacy active in screenshot) */}
            <View style={[styles.segGroup, { borderColor: colors.line }]}>
              {(['modern', 'legacy', 'blank'] as const).map((styleOpt) => {
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

            {/* Warning banner when legacy is active (matches screenshot) */}
            {renderStyle === 'legacy' && (
              <View style={[styles.bannerWarn, { backgroundColor: colors.amberSoft }]}>
                <AlertTriangle size={15} color={colors.amber} style={styles.bannerIcon} />
                <Text style={[styles.bannerWarnText, { color: colors.amber }]}>
                  modern_available: false — WeasyPrint libraries missing on the server. Falling back to the fpdf2 legacy renderer (X-IRDA-Renderer: legacy).
                </Text>
              </View>
            )}

            <Text style={[styles.subNote, { color: colors.muted }]}>
              modern = WeasyPrint with 70+ AcroForm widgets · legacy = fpdf2 fallback · blank = ?blank=1 template
            </Text>
          </View>
        )}

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

              {/* Two-column grid: Date of birth & Date of admission */}
              <View style={styles.grid2}>
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Date of birth</Text>
                  <View style={[styles.dateInpWrap, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                    <TextInput
                      style={[styles.dateInp, { color: colors.ink }]}
                      value={fDob}
                      onChangeText={setFDob}
                      placeholder="DD-MM-YYYY"
                      placeholderTextColor={colors.muted}
                    />
                    <Calendar size={15} color={colors.muted} />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Date of admission</Text>
                  <View style={[styles.dateInpWrap, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                    <TextInput
                      style={[styles.dateInp, { color: colors.ink }]}
                      value={fAdmission}
                      onChangeText={setFAdmission}
                      placeholder="DD-MM-YYYY"
                      placeholderTextColor={colors.muted}
                    />
                    <Calendar size={15} color={colors.muted} />
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

              {/* Two-column grid: Date of discharge & Room category */}
              <View style={styles.grid2}>
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Date of discharge</Text>
                  <View style={[styles.dateInpWrap, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                    <TextInput
                      style={[styles.dateInp, { color: colors.ink }]}
                      value={fDischarge}
                      onChangeText={setFDischarge}
                      placeholder="DD-MM-YYYY"
                      placeholderTextColor={colors.muted}
                    />
                    <Calendar size={15} color={colors.muted} />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Room category</Text>
                  <TouchableOpacity
                    style={[styles.selectBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                    onPress={() => setShowRoomModal(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.selectBoxText, { color: colors.ink }]} numberOfLines={1}>
                      {fRoomCategory}
                    </Text>
                    <ChevronDown size={15} color={colors.muted} />
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

      {/* Payer Selector Modal */}
      <Modal transparent visible={showPayerModal} animationType="fade" onRequestClose={() => setShowPayerModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPayerModal(false)}>
          <View style={[styles.pickerModalCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text style={[styles.pickerModalTitle, { color: colors.ink }]}>Select Payer Adapter</Text>
            {[
              { id: 'generic', title: 'generic (default) · TPA PDF + IRDAI form' },
              { id: 'fhir', title: 'Sample Health TPA · FHIR R4' },
              { id: 'x12', title: 'Sample Insurer · X12 837P' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.pickerOptionRow,
                  { borderBottomColor: colors.line2 },
                  payer === opt.id && { backgroundColor: colors.brandSoft },
                ]}
                onPress={() => {
                  setPayer(opt.id as any);
                  setShowPayerModal(false);
                  showToast(`Payer set to ${opt.id}`);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    { color: payer === opt.id ? colors.brandDark : colors.ink, fontWeight: payer === opt.id ? '700' : '500' },
                  ]}
                >
                  {opt.title}
                </Text>
                {payer === opt.id && <Check size={16} color={colors.brand} strokeWidth={2.6} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
              POST /submission/submit/{claim.id.slice(0, 8)} · payer {payer} (TPA PDF + IRDAI {renderStyle}). The submission is written to the submissions table and audited.
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.line }]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.brand }]}
                onPress={handleSubmitFinal}
              >
                <Text style={styles.modalConfirmText}>Submit</Text>
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
                  {payer === 'generic' ? 'IRDAI Electronic Portal' : payer.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.successActions}>
              <TouchableOpacity
                style={[styles.successOutlineBtn, { borderColor: colors.line }]}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.navigate(Routes.AuditTrail, { claimId: claim.id });
                }}
              >
                <Text style={[styles.successOutlineText, { color: colors.ink }]}>View Audit Log</Text>
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
        <SafeAreaView style={[styles.pdfModalContainer, { backgroundColor: colors.bg }]}>
          <View style={[styles.pdfAppBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
            <TouchableOpacity onPress={() => setShowPdfModal(false)} style={styles.pdfCloseBtn}>
              <XIcon size={20} color={colors.ink} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[styles.pdfTitle, { color: colors.ink }]}>IRDAI Claim Form</Text>
              <Text style={[styles.pdfSubTitle, { color: colors.muted }]}>
                Form Part A &amp; B · {fPolicy}
              </Text>
            </View>
            <TouchableOpacity onPress={handleSharePdf} style={styles.pdfShareBtn}>
              <Share2 size={18} color={colors.brandDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.pdfScroll} contentContainerStyle={styles.pdfScrollInner}>
            <View style={[styles.pdfPaper, { backgroundColor: '#ffffff', borderColor: '#d1d5db' }]}>
              <View style={styles.pdfHeader}>
                <Text style={styles.pdfDocTitle}>INSURANCE REGULATORY AND DEVELOPMENT AUTHORITY OF INDIA</Text>
                <Text style={styles.pdfDocSub}>HEALTH INSURANCE CLAIM FORM — PART A &amp; PART B</Text>
                <View style={styles.pdfDivider} />
                <View style={styles.pdfMetaRow}>
                  <Text style={styles.pdfMetaText}>Policy No: {fPolicy}</Text>
                  <Text style={styles.pdfMetaText}>TPA: Sample Health TPA</Text>
                  <Text style={styles.pdfMetaText}>Claim No: {claim.id.slice(0, 8)}</Text>
                </View>
              </View>

              <View style={styles.pdfSection}>
                <View style={styles.pdfSectionHeader}>
                  <Text style={styles.pdfSectionHeaderText}>SECTION A: DETAILS OF PRIMARY INSURED</Text>
                </View>
                <View style={styles.pdfGridRow}>
                  <View style={styles.pdfGridCol}>
                    <Text style={styles.pdfLabel}>Name of Insured:</Text>
                    <Text style={styles.pdfValue}>{fName}</Text>
                  </View>
                  <View style={styles.pdfGridCol}>
                    <Text style={styles.pdfLabel}>Date of Birth:</Text>
                    <Text style={styles.pdfValue}>{fDob}</Text>
                  </View>
                </View>
                <View style={styles.pdfGridRow}>
                  <View style={styles.pdfGridCol}>
                    <Text style={styles.pdfLabel}>Relationship:</Text>
                    <Text style={styles.pdfValue}>{fRelation}</Text>
                  </View>
                  <View style={styles.pdfGridCol}>
                    <Text style={styles.pdfLabel}>Pre-authorisation:</Text>
                    <Text style={styles.pdfValue}>{preAuthYes ? 'Yes (Obtained)' : 'No'}</Text>
                  </View>
                </View>
                <View style={styles.pdfGridRow}>
                  <View style={[styles.pdfGridCol, { flex: 1 }]}>
                    <Text style={styles.pdfLabel}>Diagnosis / Illness:</Text>
                    <Text style={styles.pdfValue}>{fIllness}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.pdfSection}>
                <View style={styles.pdfSectionHeader}>
                  <Text style={styles.pdfSectionHeaderText}>SECTION B: DETAILS OF HOSPITALIZATION</Text>
                </View>
                <View style={styles.pdfGridRow}>
                  <View style={styles.pdfGridCol}>
                    <Text style={styles.pdfLabel}>Hospital Name:</Text>
                    <Text style={styles.pdfValue}>{fHospName}</Text>
                  </View>
                  <View style={styles.pdfGridCol}>
                    <Text style={styles.pdfLabel}>Hospital Reg No:</Text>
                    <Text style={styles.pdfValue}>{fHospReg}</Text>
                  </View>
                </View>
                <View style={styles.pdfGridRow}>
                  <View style={styles.pdfGridCol}>
                    <Text style={styles.pdfLabel}>Date of Admission:</Text>
                    <Text style={styles.pdfValue}>{fAdmission}</Text>
                  </View>
                  <View style={styles.pdfGridCol}>
                    <Text style={styles.pdfLabel}>Date of Discharge:</Text>
                    <Text style={styles.pdfValue}>{fDischarge}</Text>
                  </View>
                </View>
                <View style={styles.pdfGridRow}>
                  <View style={styles.pdfGridCol}>
                    <Text style={styles.pdfLabel}>Treating Doctor:</Text>
                    <Text style={styles.pdfValue}>{fDoctor}</Text>
                  </View>
                  <View style={styles.pdfGridCol}>
                    <Text style={styles.pdfLabel}>Admission Type:</Text>
                    <Text style={styles.pdfValue}>{emergencyYes ? 'Emergency' : 'Planned'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.pdfSection}>
                <View style={styles.pdfSectionHeader}>
                  <Text style={styles.pdfSectionHeaderText}>SECTION C: DETAILS OF CLAIMED EXPENSES</Text>
                </View>
                <View style={styles.pdfTable}>
                  <View style={styles.pdfTableRowHeader}>
                    <Text style={[styles.pdfTableCell, { flex: 2, fontWeight: '700' }]}>Particulars</Text>
                    <Text style={[styles.pdfTableCell, { flex: 1, textAlign: 'right', fontWeight: '700' }]}>Amount</Text>
                  </View>
                  <View style={styles.pdfTableRow}>
                    <Text style={[styles.pdfTableCell, { flex: 2 }]}>Total Hospital Bill</Text>
                    <Text style={[styles.pdfTableCell, { flex: 1, textAlign: 'right' }]}>{formatINR(totalBilled)}</Text>
                  </View>
                  <View style={styles.pdfTableRow}>
                    <Text style={[styles.pdfTableCell, { flex: 2 }]}>Less: Non-payable items</Text>
                    <Text style={[styles.pdfTableCell, { flex: 1, textAlign: 'right' }]}>- {formatINR(nonPayable)}</Text>
                  </View>
                  <View style={[styles.pdfTableRow, { backgroundColor: '#f3f4f6' }]}>
                    <Text style={[styles.pdfTableCell, { flex: 2, fontWeight: '700' }]}>Total Payable</Text>
                    <Text style={[styles.pdfTableCell, { flex: 1, textAlign: 'right', fontWeight: '700', color: '#047857' }]}>
                      {formatINR(netPayable)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.pdfAttestBox}>
                <View style={styles.pdfStamp}>
                  <Text style={styles.pdfStampText}>DIGITALLY SIGNED</Text>
                  <Text style={styles.pdfStampSub}>{fName}</Text>
                  <Text style={styles.pdfStampDate}>{new Date().toLocaleDateString('en-IN')}</Text>
                </View>
                <View style={styles.pdfStamp}>
                  <Text style={styles.pdfStampText}>HOSPITAL SEAL</Text>
                  <Text style={styles.pdfStampSub}>{fHospName}</Text>
                  <Text style={styles.pdfStampDate}>ROHINI Verified</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.pdfFooter, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
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
        </SafeAreaView>
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
    gap: 9,
  },
  dateInpWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
  },
  dateInp: {
    flex: 1,
    fontSize: 13.5,
    padding: 0,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 11,
    borderWidth: 1,
  },
  selectBoxText: {
    fontSize: 13.5,
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
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  pdfCloseBtn: { padding: 6 },
  pdfShareBtn: { padding: 6 },
  pdfTitle: { fontSize: 14.5, fontWeight: '700' },
  pdfSubTitle: { fontSize: 11 },
  pdfScroll: { flex: 1 },
  pdfScrollInner: { padding: 13, paddingBottom: 24 },
  pdfPaper: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  pdfHeader: { alignItems: 'center', marginBottom: 12 },
  pdfDocTitle: { fontSize: 10.5, fontWeight: '800', textAlign: 'center', color: '#111827' },
  pdfDocSub: { fontSize: 9.5, fontWeight: '700', textAlign: 'center', color: '#4b5563', marginTop: 2 },
  pdfDivider: { height: 1, backgroundColor: '#e5e7eb', width: '100%', marginVertical: 7 },
  pdfMetaRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  pdfMetaText: { fontSize: 9, color: '#4b5563', fontWeight: '600' },
  pdfSection: { marginBottom: 11, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  pdfSectionHeader: { backgroundColor: '#f3f4f6', paddingVertical: 4, paddingHorizontal: 7 },
  pdfSectionHeaderText: { fontSize: 9.5, fontWeight: '800', color: '#1f2937' },
  pdfGridRow: { flexDirection: 'row', paddingHorizontal: 7, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  pdfGridCol: { flex: 1 },
  pdfLabel: { fontSize: 8.5, color: '#6b7280', fontWeight: '500' },
  pdfValue: { fontSize: 9.5, color: '#111827', fontWeight: '600', marginTop: 1 },
  pdfTable: { width: '100%' },
  pdfTableRowHeader: { flexDirection: 'row', paddingHorizontal: 7, paddingVertical: 4, backgroundColor: '#f9fafb', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  pdfTableRow: { flexDirection: 'row', paddingHorizontal: 7, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  pdfTableCell: { fontSize: 9, color: '#111827' },
  pdfAttestBox: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  pdfStamp: { alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#9ca3af', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 },
  pdfStampText: { fontSize: 8.5, fontWeight: '800', color: '#047857' },
  pdfStampSub: { fontSize: 8, color: '#374151', marginTop: 1 },
  pdfStampDate: { fontSize: 7.5, color: '#6b7280' },
  pdfFooter: { padding: 12, borderTopWidth: 1 },
  pdfFooterBtn: { height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pdfFooterBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
