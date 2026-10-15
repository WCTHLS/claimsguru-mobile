import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  Linking,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  X as XIcon,
  ChevronDown,
  Check,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Send,
  Download,
  ExternalLink,
  RotateCw,
  FileText,
  UploadCloud,
  Sparkles,
  Building2,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { claimsApi, TpaProviderItem } from '../services/claimsApi';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { useAuthStore } from '../../../state/useAuthStore';
import { Routes } from '../../../app/navigation/routes';

interface IrdaiSubmissionFlowModalProps {
  visible: boolean;
  onClose: () => void;
  claimId: string;
  claimData: {
    patientName?: string;
    policyNumber?: string;
    insurer?: string;
    totalAmount?: number;
  };
  navigation: any;
}

export const IrdaiSubmissionFlowModal: React.FC<IrdaiSubmissionFlowModalProps> = ({
  visible,
  onClose,
  claimId,
  claimData,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const auth = useAuthStore();
  const addOrUpdateClaim = useClaimsStore((s) => s.addOrUpdateClaim);

  // Flow step: 'pdf' | 'tpa' | 'success'
  const [step, setStep] = useState<'pdf' | 'tpa' | 'success'>('pdf');

  // PDF Preview State
  const [renderStyle, setRenderStyle] = useState<'modern' | 'blank' | 'tpa'>('modern');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string>('IRDAI_Claim_Form.pdf');
  const [pdfKey, setPdfKey] = useState(0);

  // TPA Submission State
  const [tpaList, setTpaList] = useState<TpaProviderItem[]>([]);
  const [selectedInsurer, setSelectedInsurer] = useState<string>(claimData.insurer || 'Star Health');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('star_health');
  const [showInlineTpaPicker, setShowInlineTpaPicker] = useState(false);
  const [policyId, setPolicyId] = useState<string>(claimData.policyNumber || '');
  const [policyFromOcr, setPolicyFromOcr] = useState<boolean>(Boolean(claimData.policyNumber));
  const [showUploadBox, setShowUploadBox] = useState<boolean>(!claimData.policyNumber);
  const [isUploadingPolicyDoc, setIsUploadingPolicyDoc] = useState(false);
  const [ocrSuccessBanner, setOcrSuccessBanner] = useState<string | null>(null);
  const [isSubmittingToPayer, setIsSubmittingToPayer] = useState(false);
  const [loadingTpas, setLoadingTpas] = useState(false);

  // Success State
  const [submissionReceiptId, setSubmissionReceiptId] = useState('');

  // Reset or initialize on open
  useEffect(() => {
    if (visible) {
      setStep('pdf');
      setRenderStyle('modern');
      setPdfError(null);
      setPdfKey((k) => k + 1);

      const pol = (claimData.policyNumber || auth.policyNumber || '').trim();
      setPolicyId(pol);
      setPolicyFromOcr(Boolean(pol && pol.length >= 4));
      setShowUploadBox(!pol);

      loadIrdaPdf('modern');
      loadTpas();
    }
  }, [visible, claimId, claimData.policyNumber]);

  const loadTpas = async () => {
    setLoadingTpas(true);
    try {
      const list = await claimsApi.fetchTpaList();
      if (list && list.length > 0) {
        setTpaList(list);
        const match = list.find((t) =>
          (claimData.insurer && t.name.toLowerCase().includes(claimData.insurer.toLowerCase())) ||
          (selectedInsurer && t.name.toLowerCase().includes(selectedInsurer.toLowerCase()))
        ) || list[0];
        if (match) {
          setSelectedOrgId(match.id);
          setSelectedInsurer(match.name);
        }
      }
    } catch (e) {
      console.warn('[IrdaiSubmissionFlowModal] Failed to load TPAs:', e);
    } finally {
      setLoadingTpas(false);
    }
  };

  const loadIrdaPdf = async (style: 'modern' | 'blank' | 'tpa' = renderStyle) => {
    setPdfLoading(true);
    setPdfError(null);
    try {
      if (style === 'tpa') {
        const res = await claimsApi.fetchTpaPdfBlob(claimId, 'modern');
        setPdfBlobUrl(res.url);
        setPdfFilename(res.filename);
      } else {
        const res = await claimsApi.fetchIrdaPdfBlob(claimId, 'modern', false);
        setPdfBlobUrl(res.url);
        setPdfFilename(res.filename);
      }
    } catch (err: any) {
      console.warn('[IrdaiSubmissionFlowModal] Failed to load PDF:', err);
      setPdfError(err?.message || 'Could not load claim document from server.');
    } finally {
      setPdfLoading(false);
    }
  };

  const getDirectPdfUrl = () => {
    if (renderStyle === 'tpa') {
      return claimsApi.getTpaPdfUrl(claimId, 'modern', true);
    }
    return claimsApi.getIrdaPdfUrl(claimId, 'modern', false, true);
  };

  const handleDownloadPdf = async () => {
    const directUrl = renderStyle === 'tpa'
      ? claimsApi.getTpaPdfUrl(claimId, 'modern', false)
      : claimsApi.getIrdaPdfUrl(claimId, 'modern', false, false);
    Linking.openURL(directUrl).catch(() => {});
  };

  const handleOpenPdfExternal = () => {
    const directUrl = getDirectPdfUrl();
    Linking.openURL(directUrl).catch(() => {});
  };

  const handlePickPolicyDoc = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const asset = res.assets[0];
      await runPolicyDocOcr({
        name: asset.name,
        type: asset.mimeType || 'application/pdf',
        uri: asset.uri,
      });
    } catch (e) {}
  };

  const handlePickPolicyPhoto = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const asset = res.assets[0];
      await runPolicyDocOcr({
        name: asset.fileName || 'policy_card_photo.jpg',
        type: asset.mimeType || 'image/jpeg',
        uri: asset.uri,
      });
    } catch (e) {}
  };

  const runPolicyDocOcr = async (fileObj: { name: string; type?: string; uri?: string; blob?: any }) => {
    setIsUploadingPolicyDoc(true);
    setOcrSuccessBanner(null);
    try {
      const res = await claimsApi.extractPolicyFromDoc(claimId, fileObj);
      if (res.success && (res.policy_id || res.insurer)) {
        if (res.policy_id) {
          setPolicyId(res.policy_id);
          setPolicyFromOcr(true);
        }
        if (res.insurer) {
          const matchedOrg = tpaList.find((t) =>
            t.name.toLowerCase().includes(res.insurer!.toLowerCase()) ||
            res.insurer!.toLowerCase().includes(t.name.toLowerCase())
          );
          if (matchedOrg) {
            setSelectedOrgId(matchedOrg.id);
            setSelectedInsurer(matchedOrg.name);
          }
        }
        setOcrSuccessBanner(
          `Extracted ${res.policy_id ? `Policy #${res.policy_id}` : ''} ${res.insurer ? `(${res.insurer})` : ''} from ${fileObj.name}`.trim()
        );
      }
    } catch (err: any) {
      console.warn('[IrdaiSubmissionFlowModal] OCR extraction error:', err);
    } finally {
      setIsUploadingPolicyDoc(false);
    }
  };

  const handleConfirmSubmitToTpa = async () => {
    if (!claimId || isSubmittingToPayer) return;
    if (!policyId.trim() || !selectedInsurer) return;

    setIsSubmittingToPayer(true);
    let receiptCode = `IRDAI-${new Date().getFullYear()}-SUB-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      const res = await claimsApi.submitClaim(claimId, selectedInsurer, policyId.trim(), selectedOrgId || undefined);
      if (res) {
        if (res.reference) {
          receiptCode = res.reference;
        } else if (res.submission_id) {
          receiptCode = `TPA-${selectedInsurer.replace(/\s+/g, '').toUpperCase().slice(0, 6)}-${res.submission_id.slice(0, 8)}`;
        }
      }
    } catch (err: any) {
      console.warn('[IrdaiSubmissionFlowModal] Server submission error:', err);
    } finally {
      setIsSubmittingToPayer(false);
    }

    setSubmissionReceiptId(receiptCode);

    addOrUpdateClaim({
      id: claimId,
      status: 'submitted',
      rawStatus: 'SUBMITTED',
      policyNo: (policyId || '').trim(),
    });

    setStep('success');
  };

  const formatINR = (amt?: number) => {
    if (!amt) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  if (!visible) return null;

  return (
    <>
      {/* 1. IRDAI PDF Preview Modal */}
      <Modal
        visible={visible && step === 'pdf'}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={[styles.pdfContainer, { backgroundColor: colors.bg }]}>
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

          {/* App Bar */}
          <View
            style={[
              styles.pdfAppBar,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.line,
                paddingTop: Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top, 28) : insets.top,
              },
            ]}
          >
            <TouchableOpacity onPress={onClose} style={styles.pdfCloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <XIcon size={20} color={colors.ink} />
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 6 }}>
              <Text style={[styles.pdfTitle, { color: colors.ink }]} numberOfLines={1}>
                {renderStyle === 'tpa' ? 'TPA Audit Report' : 'IRDAI Claim Form (Part A & B)'}
              </Text>
              <Text style={[styles.pdfSubtitle, { color: colors.muted }]}>
                {claimId ? `#${claimId.slice(0, 8).toUpperCase()}` : 'Live Preview'}
              </Text>
            </View>

            <View style={styles.pdfActionsRow}>
              <TouchableOpacity onPress={() => setPdfKey((k) => k + 1)} style={styles.pdfIconBtn}>
                <RotateCw size={17} color={colors.ink} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDownloadPdf} style={styles.pdfIconBtn}>
                <Download size={17} color={colors.ink} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpenPdfExternal} style={styles.pdfIconBtn}>
                <ExternalLink size={17} color={colors.ink} />
              </TouchableOpacity>
            </View>
          </View>

          {/* PDF Viewer Body */}
          <View style={styles.pdfBody}>
            {pdfLoading && (
              <View style={[styles.pdfLoadingOverlay, { backgroundColor: colors.bg }]}>
                <ActivityIndicator size="large" color={colors.brand} />
                <Text style={[styles.pdfLoadingText, { color: colors.ink }]}>
                  Generating official IRDAI document...
                </Text>
              </View>
            )}

            {pdfError ? (
              <View style={styles.pdfErrorContainer}>
                <Text style={[styles.pdfErrorText, { color: colors.red }]}>{pdfError}</Text>
                <TouchableOpacity
                  style={[styles.pdfRetryBtn, { backgroundColor: colors.brand }]}
                  onPress={() => loadIrdaPdf()}
                >
                  <Text style={styles.pdfRetryBtnText}>Retry Document Generation</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <WebView
                  key={pdfKey}
                  source={
                    Platform.OS === 'android'
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

          {/* Bottom Action Bar: [Close] and [Submit Claim to TPA] */}
          <View style={[styles.pdfFooter, { backgroundColor: colors.surface, borderTopColor: colors.line, paddingBottom: Math.max(insets.bottom, 14) }]}>
            <TouchableOpacity
              style={[styles.pdfCancelBtn, { borderColor: colors.line }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.pdfCancelBtnText, { color: colors.ink }]}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pdfSubmitBtn, { backgroundColor: colors.brand }]}
              onPress={() => setStep('tpa')}
              activeOpacity={0.85}
            >
              <Send size={15} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.pdfSubmitBtnText}>Submit Claim to TPA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. Submit Claim to Insurer / TPA Bottom Sheet Modal */}
      <Modal
        transparent
        visible={visible && step === 'tpa'}
        animationType="slide"
        onRequestClose={() => {
          if (!isSubmittingToPayer) setStep('pdf');
        }}
      >
        <TouchableOpacity
          style={styles.tpaModalBackdrop}
          activeOpacity={1}
          onPress={() => {
            if (!isSubmittingToPayer) {
              setShowInlineTpaPicker(false);
              setStep('pdf');
            }
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.tpaKbdWrap}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.tpaModalCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={(e) => e.stopPropagation?.()}
            >
              {/* Drag Handle */}
              <View style={[styles.tpaDragHandle, { backgroundColor: colors.line2 }]} />

              {/* Header */}
              <View style={[styles.tpaModalHeader, { borderBottomColor: colors.line }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                  <View style={[styles.tpaHeaderIconWrap, { backgroundColor: colors.brandSoft }]}>
                    <ShieldCheck size={20} color={colors.brandDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tpaModalTitle, { color: colors.ink }]} numberOfLines={1}>
                      Submit Claim to Insurer / TPA
                    </Text>
                    <Text style={[styles.tpaModalSubtitle, { color: colors.muted }]} numberOfLines={1}>
                      Select insurer and verify policy details
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    if (!isSubmittingToPayer) {
                      setShowInlineTpaPicker(false);
                      setStep('pdf');
                    }
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ padding: 4 }}
                >
                  <XIcon size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <ScrollView
                style={{ flexShrink: 1 }}
                contentContainerStyle={styles.tpaModalBody}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Insurer / TPA Picker */}
                <View>
                  <Text style={[styles.tpaFieldLabel, { color: colors.ink }]}>
                    Select Insurance Company / TPA <Text style={{ color: colors.red }}>*</Text>
                  </Text>

                  <TouchableOpacity
                    style={[styles.tpaSelectBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                    onPress={() => setShowInlineTpaPicker((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.tpaSelectBoxLeft}>
                      <Building2 size={17} color={colors.brandDark} style={{ marginRight: 8 }} />
                      <Text style={[styles.tpaSelectBoxText, { color: colors.ink }]} numberOfLines={1}>
                        {selectedInsurer || 'Select Insurance Provider'}
                      </Text>
                      {selectedOrgId ? (
                        <View style={[styles.tpaTypeBadge, { backgroundColor: colors.brandSoft, borderColor: colors.brand + '40' }]}>
                          <Text style={[styles.tpaTypeBadgeText, { color: colors.brandDark }]}>
                            {tpaList.find((t) => t.id === selectedOrgId)?.type || 'TPA'}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <ChevronDown
                      size={16}
                      color={colors.muted}
                      style={{ transform: [{ rotate: showInlineTpaPicker ? '180deg' : '0deg' }] }}
                    />
                  </TouchableOpacity>

                  {/* Inline list */}
                  {showInlineTpaPicker && (
                    <View style={[styles.inlineTpaPickerCard, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                      {loadingTpas ? (
                        <View style={{ padding: 14, alignItems: 'center' }}>
                          <ActivityIndicator size="small" color={colors.brandDark} />
                          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Loading insurers...</Text>
                        </View>
                      ) : tpaList.length > 0 ? (
                        tpaList.map((org) => {
                          const isSelected = selectedOrgId === org.id || selectedInsurer.toLowerCase() === org.name.toLowerCase();
                          return (
                            <TouchableOpacity
                              key={org.id}
                              style={[
                                styles.pickerOptionRow,
                                { borderBottomColor: colors.line2 },
                                isSelected && { backgroundColor: colors.brandSoft },
                              ]}
                              onPress={() => {
                                setSelectedOrgId(org.id);
                                setSelectedInsurer(org.name);
                                setShowInlineTpaPicker(false);
                              }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <Building2 size={15} color={isSelected ? colors.brandDark : colors.muted} style={{ marginRight: 8 }} />
                                <Text
                                  style={[
                                    styles.pickerOptionText,
                                    {
                                      color: isSelected ? colors.brandDark : colors.ink,
                                      fontWeight: isSelected ? '700' : '500',
                                    },
                                  ]}
                                >
                                  {org.name}
                                </Text>
                                <View style={[styles.tpaTypeBadge, { backgroundColor: isSelected ? colors.brandSoft : colors.surface, borderColor: colors.line }]}>
                                  <Text style={[styles.tpaTypeBadgeText, { color: isSelected ? colors.brandDark : colors.muted }]}>
                                    {org.type}
                                  </Text>
                                </View>
                              </View>
                              {isSelected && <Check size={16} color={colors.brand} strokeWidth={2.6} />}
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <View style={{ padding: 14, alignItems: 'center' }}>
                          <Text style={{ color: colors.muted, fontSize: 13 }}>No TPAs loaded from server.</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Policy ID Verification Card */}
                <View style={[styles.tpaCardBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                  <View style={styles.tpaCardHdrRow}>
                    <Text style={[styles.tpaFieldLabel, { color: colors.ink, marginBottom: 0, flexShrink: 1 }]}>
                      Policy Number / Health Card ID <Text style={{ color: colors.red }}>*</Text>
                    </Text>
                    {policyFromOcr ? (
                      <View style={[styles.tpaOcrBadge, { backgroundColor: colors.greenSoft, borderColor: colors.green + '40', flexShrink: 0 }]}>
                        <CheckCircle2 size={11} color={colors.green} />
                        <Text style={[styles.tpaOcrBadgeText, { color: colors.green }]}>
                          Auto-detected
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <TextInput
                    style={[
                      styles.tpaPolicyInput,
                      {
                        backgroundColor: colors.surface,
                        borderColor: policyFromOcr ? colors.green : colors.line,
                        color: colors.ink,
                        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                      },
                    ]}
                    value={policyId}
                    onChangeText={setPolicyId}
                    placeholder="e.g. P/161114/01/2024/002345"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="characters"
                  />

                  {policyFromOcr && (
                    <View>
                      <Text style={[styles.tpaPolicyHelpText, { color: colors.muted }]}>
                        Pre-filled from your uploaded claim documents. You can review or edit if necessary.
                      </Text>
                      <TouchableOpacity
                        style={styles.tpaRescanBtn}
                        onPress={() => setShowUploadBox(!showUploadBox)}
                        activeOpacity={0.7}
                      >
                        <Sparkles size={13} color={colors.brandDark} />
                        <Text style={[styles.tpaRescanBtnText, { color: colors.brandDark }]}>
                          {showUploadBox ? 'Hide document scanner' : 'Scan another card or policy document'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Upload Box */}
                  {(!policyFromOcr || showUploadBox) && (
                    <View style={{ marginTop: 10 }}>
                      <View style={styles.tpaOrDivider}>
                        <View style={[styles.tpaOrLine, { backgroundColor: colors.line }]} />
                        <Text style={[styles.tpaOrText, { color: colors.muted, backgroundColor: colors.surface2 }]}>
                          OR AUTO-EXTRACT
                        </Text>
                        <View style={[styles.tpaOrLine, { backgroundColor: colors.line }]} />
                      </View>

                      <View
                        style={[
                          styles.tpaUploadDashedBox,
                          {
                            borderColor: isUploadingPolicyDoc ? colors.brand : colors.line,
                            backgroundColor: isUploadingPolicyDoc ? colors.brandSoft : colors.surface,
                          },
                        ]}
                      >
                        {isUploadingPolicyDoc ? (
                          <View style={{ alignItems: 'center', paddingVertical: 6 }}>
                            <ActivityIndicator size="small" color={colors.brandDark} />
                            <Text style={[styles.tpaUploadTitle, { color: colors.brandDark }]}>
                              Running Fast OCR & Extracting Policy ID...
                            </Text>
                            <Text style={[styles.tpaUploadSub, { color: colors.muted }]}>
                              Scanning card / policy for insurer and policy number
                            </Text>
                          </View>
                        ) : (
                          <View style={{ alignItems: 'center', width: '100%' }}>
                            <UploadCloud size={28} color={colors.brandDark} />
                            <Text style={[styles.tpaUploadTitle, { color: colors.ink }]}>
                              Upload Health Card / Policy Document
                            </Text>
                            <Text style={[styles.tpaUploadSub, { color: colors.muted }]}>
                              Fast OCR will extract Policy ID & Insurer instantly
                            </Text>

                            <View style={styles.tpaUploadButtonsRow}>
                              <TouchableOpacity
                                style={[styles.tpaUploadMiniBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                                onPress={handlePickPolicyDoc}
                                activeOpacity={0.7}
                              >
                                <FileText size={14} color={colors.brandDark} />
                                <Text style={[styles.tpaUploadMiniBtnText, { color: colors.ink }]}>
                                  Browse File
                                </Text>
                              </TouchableOpacity>

                              {Platform.OS !== 'web' && (
                                <TouchableOpacity
                                  style={[styles.tpaUploadMiniBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                                  onPress={handlePickPolicyPhoto}
                                  activeOpacity={0.7}
                                >
                                  <Sparkles size={14} color={colors.brandDark} />
                                  <Text style={[styles.tpaUploadMiniBtnText, { color: colors.ink }]}>
                                    Photo Gallery
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* OCR Banner */}
                  {ocrSuccessBanner && (
                    <View style={[styles.tpaBannerSuccess, { backgroundColor: colors.greenSoft, borderColor: colors.green + '40' }]}>
                      <CheckCircle2 size={15} color={colors.green} />
                      <Text style={[styles.tpaBannerSuccessText, { color: colors.green }]} numberOfLines={2}>
                        {ocrSuccessBanner}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Routing Box */}
                <View style={[styles.tpaRoutingBox, { backgroundColor: colors.brandSoft, borderColor: colors.brand + '30' }]}>
                  <Clock size={16} color={colors.brandDark} style={{ marginTop: 2, flexShrink: 0 }} />
                  <Text style={[styles.tpaRoutingText, { color: colors.brandDark }]}>
                    <Text style={{ fontWeight: '700' }}>TPA Routing: </Text>
                    Claim documents will be submitted to the <Text style={{ fontWeight: '700' }}>{selectedInsurer}</Text> TPA adjudication queue. The claim is permanently linked to Policy ID <Text style={{ fontWeight: '700' }}>#{(policyId || '').trim() || 'N/A'}</Text>.
                  </Text>
                </View>
              </ScrollView>

              {/* Footer */}
              <View
                style={[
                  styles.tpaModalFooter,
                  {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.line,
                    paddingBottom: Math.max(insets.bottom, 16),
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.tpaCancelBtn, { borderColor: colors.line, backgroundColor: colors.surface2 }]}
                  onPress={() => {
                    setShowInlineTpaPicker(false);
                    setStep('pdf');
                  }}
                  disabled={isSubmittingToPayer}
                >
                  <Text style={[styles.tpaCancelText, { color: colors.ink }]}>Back to PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tpaSubmitBtn,
                    {
                      backgroundColor: colors.brand,
                      opacity: (!policyId.trim() || !selectedInsurer || isSubmittingToPayer) ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleConfirmSubmitToTpa}
                  disabled={!policyId.trim() || !selectedInsurer || isSubmittingToPayer}
                  activeOpacity={0.85}
                >
                  {isSubmittingToPayer ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Send size={15} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.tpaSubmitText}>Submit Claim to TPA</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* 3. Submission Success Modal */}
      <Modal
        transparent
        visible={visible && step === 'success'}
        animationType="fade"
        onRequestClose={onClose}
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
                <Text style={[styles.receiptVal, { color: colors.ink }]}>{claimData.patientName || 'Patient'}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.muted }]}>Policy ID</Text>
                <Text style={[styles.receiptVal, styles.mono, { color: colors.ink }]}>{policyId || 'N/A'}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.muted }]}>Amount</Text>
                <Text style={[styles.receiptVal, { color: colors.ink }]}>{formatINR(claimData.totalAmount)}</Text>
              </View>
              <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.receiptLabel, { color: colors.muted }]}>Payer Gateway</Text>
                <Text style={[styles.receiptVal, { color: colors.green }]}>
                  {selectedInsurer} TPA Adjudication
                </Text>
              </View>
            </View>

            <View style={styles.successActions}>
              <TouchableOpacity
                style={[styles.successOutlineBtn, { borderColor: colors.line }]}
                onPress={() => {
                  onClose();
                  navigation.navigate(Routes.PatientActivity, { claimId });
                }}
              >
                <Text style={[styles.successOutlineText, { color: colors.ink }]}>View Activity</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.successSolidBtn, { backgroundColor: colors.brand }]}
                onPress={() => {
                  onClose();
                  navigation.navigate(Routes.ClaimsTab);
                }}
              >
                <Text style={styles.successSolidText}>Go to Claims</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // PDF Preview styles
  pdfContainer: { flex: 1 },
  pdfAppBar: {
    height: 54,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  pdfCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfTitle: { fontSize: 14, fontWeight: '700' },
  pdfSubtitle: { fontSize: 10, marginTop: 1 },
  pdfActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pdfIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBody: { flex: 1, position: 'relative' },
  pdfLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pdfLoadingText: { marginTop: 12, fontSize: 13, fontWeight: '600' },
  pdfErrorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pdfErrorText: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  pdfRetryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  pdfRetryBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  pdfFooter: {
    padding: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pdfCancelBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfCancelBtnText: { fontSize: 13, fontWeight: '700' },
  pdfSubmitBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfSubmitBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  // TPA Modal styles
  tpaKbdWrap: { width: '100%', justifyContent: 'flex-end' },
  tpaModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  tpaModalCard: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tpaDragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  tpaModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tpaHeaderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tpaModalTitle: { fontSize: 15, fontWeight: '700' },
  tpaModalSubtitle: { fontSize: 11, marginTop: 1 },
  tpaModalBody: { padding: 16, paddingBottom: 24 },
  tpaFieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  tpaSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  tpaSelectBoxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  tpaSelectBoxText: { fontSize: 13.5, fontWeight: '600', flex: 1 },
  tpaTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  tpaTypeBadgeText: { fontSize: 9.5, fontWeight: '700' },
  inlineTpaPickerCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    maxHeight: 220,
    overflow: 'hidden',
  },
  pickerOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderBottomWidth: 0.5,
  },
  pickerOptionText: { fontSize: 13, flex: 1 },
  tpaCardBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 14,
  },
  tpaCardHdrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tpaOcrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  tpaOcrBadgeText: { fontSize: 10, fontWeight: '700', marginLeft: 4 },
  tpaPolicyInput: {
    height: 44,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13.5,
  },
  tpaPolicyHelpText: { fontSize: 11, marginTop: 6, lineHeight: 15 },
  tpaRescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  tpaRescanBtnText: { fontSize: 11.5, marginLeft: 5 },
  tpaOrDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  tpaOrLine: { flex: 1, height: 1 },
  tpaOrText: { fontSize: 10, letterSpacing: 0.8, paddingHorizontal: 8 },
  tpaUploadDashedBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpaUploadTitle: { fontSize: 13, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  tpaUploadSub: { fontSize: 11, marginTop: 3, textAlign: 'center', lineHeight: 15 },
  tpaUploadButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tpaUploadMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  tpaUploadMiniBtnText: { fontSize: 11.5, marginLeft: 5 },
  tpaBannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  tpaBannerSuccessText: { fontSize: 11.5, marginLeft: 6, flex: 1 },
  tpaRoutingBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  tpaRoutingText: { fontSize: 11.5, lineHeight: 16, flex: 1, marginLeft: 8 },
  tpaModalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  tpaCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpaCancelText: { fontSize: 13.5, fontWeight: '600' },
  tpaSubmitBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpaSubmitText: { fontSize: 13.5, fontWeight: '700', color: '#ffffff', marginLeft: 6 },

  // Success Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  successSub: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  receiptBox: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  receiptLabel: { fontSize: 12 },
  receiptVal: { fontSize: 12, fontWeight: '600' },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  successActions: { flexDirection: 'row', gap: 10, width: '100%' },
  successOutlineBtn: {
    flex: 1,
    height: 44,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successOutlineText: { fontSize: 13, fontWeight: '600' },
  successSolidBtn: {
    flex: 1,
    height: 44,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successSolidText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
