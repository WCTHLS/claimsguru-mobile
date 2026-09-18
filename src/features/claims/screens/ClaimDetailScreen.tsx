import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { claimsApi, transformBackendClaim } from '../services/claimsApi';
import { formatINR } from '../../../core/utils/currency';
import { Routes } from '../../../app/navigation/routes';
import { GlobalBottomTabBar } from '../../../app/navigation/GlobalBottomTabBar';
import {
  ChevronLeft,
  Trash2,
  LayoutGrid,
  Check,
  AlertTriangle,
} from 'lucide-react-native';

export const ClaimDetailScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const claimId = route?.params?.claimId || '3f8a1d6c-52b4-4e7a-9c11-0d5e2ab77104';
  const { claims, deleteClaim, addOrUpdateClaim } = useClaimsStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const existingClaim = claims.find(c => c.id === claimId || c.id.startsWith(claimId));
  const fallbackClaim: any = {
    id: claimId,
    who: 'Sarita Tiwari',
    dept: 'Hypothyroidism COPD Exacerbation',
    amt: 37595,
    status: 'complete',
    step: 'validate',
    indexed: false,
    policyNo: 'P-0007401',
    hospital: 'Government Health City',
    doctor: 'Dr. Attending Physician',
    diagnosis: 'Hypothyroidism COPD Exacerbation',
    age: 42,
    gender: 'Female',
    admissionDate: '12 Feb 2024',
    dischargeDate: '15 Feb 2024',
    days: 3,
    claimType: 'Reimbursement',
    fieldsParsed: '36 fields',
  };

  const claim = existingClaim
    ? {
        ...fallbackClaim,
        ...existingClaim,
        who:
          existingClaim.who && !existingClaim.who.startsWith('Processing')
            ? existingClaim.who
            : fallbackClaim.who,
        hospital:
          existingClaim.hospital && existingClaim.hospital !== 'Sunrise Multispecialty'
            ? existingClaim.hospital
            : fallbackClaim.hospital,
        doctor:
          existingClaim.doctor && existingClaim.doctor !== 'Dr. P. Rangan'
            ? existingClaim.doctor
            : fallbackClaim.doctor,
        diagnosis:
          existingClaim.diagnosis && existingClaim.diagnosis !== 'Acute coronary syndrome'
            ? existingClaim.diagnosis
            : fallbackClaim.diagnosis,
        amt: existingClaim.amt && existingClaim.amt !== 184500 ? existingClaim.amt : fallbackClaim.amt,
        policyNo:
          existingClaim.policyNo && !existingClaim.policyNo.includes('SAMPLE')
            ? existingClaim.policyNo
            : fallbackClaim.policyNo,
      }
    : fallbackClaim;

  useEffect(() => {
    if (!claimId || claimId.length < 10) return;

    let isMounted = true;
    let pollTimer: any = null;

    const fetchClaimData = async () => {
      try {
        const [backendData, previewData] = await Promise.all([
          claimsApi.getClaimDetail(claimId).catch(() => null),
          claimsApi.getClaimPreview(claimId).catch(() => null),
        ]);

        if (!isMounted) return;

        if (backendData && backendData.id) {
          const transformed = transformBackendClaim(backendData, previewData);
          addOrUpdateClaim(transformed);

          const isFinished = [
            'COMPLETED',
            'FINISHED',
            'SUBMITTED',
            'APPROVED',
            'REJECTED',
            'FAILED',
          ].includes(String(backendData.status || '').toUpperCase());

          if (isFinished && previewData) {
            if (pollTimer) {
              clearInterval(pollTimer);
              pollTimer = null;
            }
          }
        }
      } catch (err: any) {
        console.log('[ClaimDetailScreen] Backend fetch error:', err?.message || err);
      }
    };

    fetchClaimData();
    pollTimer = setInterval(fetchClaimData, 1500);

    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [claimId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteClaim(claim.id);
      setIsDeleting(false);
      setShowDeleteModal(false);
      navigation.navigate('MainTabs', { screen: Routes.ClaimsTab });
    } catch (err) {
      console.warn('[ClaimDetailScreen] Delete error:', err);
      setIsDeleting(false);
      setShowDeleteModal(false);
      navigation.navigate('MainTabs', { screen: Routes.ClaimsTab });
    }
  };

  const st = (claim.status || '').toLowerCase();
  const rawSt = ((claim as any).rawStatus || '').toUpperCase();
  const isFailed = st === 'failed' || st === 'FAILED' || rawSt.includes('FAIL');
  const isApproved = st === 'approved' || st === 'settled' || rawSt === 'APPROVED' || rawSt === 'SETTLED';
  const isRejected = st === 'rejected' || rawSt === 'REJECTED';
  const isSubmitted = st === 'submitted' || rawSt === 'SUBMITTED';
  const isRunning = st === 'running' || rawSt === 'RUNNING' || rawSt === 'PROCESSING' || rawSt === 'UPLOADED';

  let statusBg = colors.greenSoft;
  let statusColor = colors.green;
  let statusLabel = 'COMPLETE';

  if (isApproved) {
    statusBg = colors.greenSoft;
    statusColor = colors.green;
    statusLabel = st === 'settled' || rawSt === 'SETTLED' ? 'SETTLED' : 'APPROVED';
  } else if (isRejected) {
    statusBg = colors.redSoft;
    statusColor = colors.red;
    statusLabel = 'REJECTED';
  } else if (isSubmitted) {
    statusBg = colors.brandSoft;
    statusColor = colors.brandDark;
    statusLabel = 'SUBMITTED';
  } else if (isFailed) {
    statusBg = colors.redSoft;
    statusColor = colors.red;
    statusLabel = 'FAILED';
  } else if (isRunning) {
    statusBg = colors.amberSoft;
    statusColor = colors.amber;
    statusLabel = 'PROCESSING';
  } else {
    statusBg = colors.greenSoft;
    statusColor = colors.green;
    statusLabel = 'COMPLETE';
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top App Bar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={colors.ink} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.ink }]}>Claim detail</Text>

        <View style={styles.appBarActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleDelete} activeOpacity={0.7}>
            <Trash2 size={19} color={colors.ink} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: Routes.AllFeaturesTab })}
            activeOpacity={0.7}
          >
            <LayoutGrid size={19} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Claim Header Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {/* Status Pills */}
            <View style={styles.pillsRow}>
              <View style={[styles.pill, { backgroundColor: statusBg }]}>
                <Text style={[styles.pillText, { color: statusColor }]}>
                  {statusLabel} · step {claim.step || (isRunning ? 'ocr' : 'validate')}
                </Text>
              </View>

              <View style={[styles.pill, { backgroundColor: colors.surface2 }]}>
                <Text style={[styles.pillText, { color: colors.muted }]}>
                  {claim.claimType || 'Reimbursement'}
                </Text>
              </View>

              {claim.indexed ? (
                <View style={[styles.pill, { backgroundColor: colors.greenSoft }]}>
                  <Text style={[styles.pillText, { color: colors.green }]}>
                    Indexed · searchable
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Patient Header */}
            <TouchableOpacity
              style={styles.patientRow}
              onPress={() => navigation.navigate(Routes.PatientProfile, { claimId: claim.id })}
              activeOpacity={0.7}
            >
              <Text style={[styles.patientName, { color: colors.ink }]}>
                {claim.who || 'Sarita Tiwari'} · {claim.age || 42} · {claim.gender || 'Female'}
              </Text>
              <View style={[styles.patientBadge, { backgroundColor: colors.brandSoft }]}>
                <Text style={[styles.patientBadgeText, { color: colors.brandDark }]}>
                  Patient ›
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={[styles.subMeta, { color: colors.muted }]}>
              {claim.hospital || 'Government Health City'} · admitted {claim.admissionDate || '12 Feb 2024'} · {claim.days || 3} days
            </Text>

            <Text style={[styles.claimIdText, styles.mono, { color: colors.muted }]}>
              {claim.id}
            </Text>

            {/* 5-Step Horizontal Tracker */}
            <View style={styles.horizontalTrack}>
              {['OCR', 'Parse', 'Code', 'Predict', 'Validate'].map((step, idx) => {
                const isLast = idx === 4;
                const stepIndices: Record<string, number> = { ocr: 0, parse: 1, code: 2, predict: 3, validate: 4 };
                const curIdx = isRunning ? (stepIndices[claim.step?.toLowerCase() || 'ocr'] ?? 0) : 4;
                const isDone = !isRunning || idx < curIdx;
                const isCurrent = isRunning && idx === curIdx;
                return (
                  <React.Fragment key={step}>
                    <View
                      style={[
                        styles.hStep,
                        {
                          backgroundColor: isDone ? colors.brand : isCurrent ? colors.brandSoft : colors.surface2,
                          borderColor: (isDone || isCurrent) ? colors.brand : colors.line,
                        },
                      ]}
                    >
                      {isDone ? (
                        <Check size={11} color="#ffffff" strokeWidth={3.2} />
                      ) : isCurrent ? (
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brand }} />
                      ) : null}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.hBar,
                          { backgroundColor: isDone ? colors.brand : colors.line },
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>

            <View style={styles.hLabels}>
              {['OCR', 'Parse', 'Code', 'Predict', 'Validate'].map(s => (
                <Text key={s} style={[styles.hLabelText, { color: colors.muted }]}>
                  {s}
                </Text>
              ))}
            </View>
          </View>

          {/* Summary Card */}
          <View style={[styles.card, styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={[styles.kvRow, { borderBottomColor: colors.line }]}>
              <Text style={[styles.kvKey, { color: colors.muted }]}>Policy number</Text>
              <Text style={[styles.kvVal, styles.mono, { color: colors.ink }]}>
                {claim.policyNo || 'P-0007401'}
              </Text>
            </View>

            <View style={[styles.kvRow, { borderBottomColor: colors.line }]}>
              <Text style={[styles.kvKey, { color: colors.muted }]}>Insurer / TPA</Text>
              <Text style={[styles.kvVal, { color: colors.ink }]}>
                {claim.hospital?.includes('Government') ? 'PMJAY / State TPA' : 'ClaimsGuru Health TPA'}
              </Text>
            </View>

            <View style={[styles.kvRow, { borderBottomColor: colors.line }]}>
              <Text style={[styles.kvKey, { color: colors.muted }]}>Admission</Text>
              <Text style={[styles.kvVal, { color: colors.ink }]}>
                {claim.admissionDate || '12 Feb 2024'}
              </Text>
            </View>

            <View style={[styles.kvRow, { borderBottomColor: colors.line }]}>
              <Text style={[styles.kvKey, { color: colors.muted }]}>Discharge</Text>
              <Text style={[styles.kvVal, { color: colors.ink }]}>
                {claim.dischargeDate || '15 Feb 2024'}
              </Text>
            </View>

            <View style={[styles.kvRow, { borderBottomColor: colors.line }]}>
              <Text style={[styles.kvKey, { color: colors.muted }]}>Primary diagnosis</Text>
              <Text style={[styles.kvVal, { color: colors.ink }]}>
                {claim.diagnosis || 'Hypothyroidism COPD Exacerbation'}
              </Text>
            </View>

            <View style={[styles.kvRow, { borderBottomColor: colors.line }]}>
              <Text style={[styles.kvKey, { color: colors.muted }]}>Treating doctor</Text>
              <Text style={[styles.kvVal, { color: colors.ink }]}>
                {claim.doctor || 'Dr. Attending Physician'}
              </Text>
            </View>

            <View style={[styles.kvRow, { borderBottomColor: colors.line }]}>
              <Text style={[styles.kvKey, { color: colors.muted }]}>Amount claimed</Text>
              <Text style={[styles.kvVal, { color: colors.ink }]}>
                {formatINR(claim.amt || 37595)}
              </Text>
            </View>

            <View style={[styles.kvRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.kvKey, { color: colors.muted }]}>Fields parsed</Text>
              <Text style={[styles.kvVal, { color: colors.ink }]}>
                {claim.fieldsParsed || '36 fields'}
              </Text>
            </View>
          </View>


        </ScrollView>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <View style={[styles.toast, { backgroundColor: colors.navy }]}>
            <Check size={16} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.toastText} numberOfLines={2}>
              {toastMessage}
            </Text>
          </View>
        )}

        {/* Sticky Bottom Actions Bar */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.line }]}
            onPress={() => navigation.navigate('MainTabs', { screen: Routes.ChatTab })}
            activeOpacity={0.7}
          >
            <Text style={[styles.outlineBtnText, { color: colors.brandDark }]}>Ask ClaimsGuru</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.brand }]}
            onPress={() => navigation.navigate(Routes.BrainPreview, { claimId: claim.id })}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>AI Brain Preview</Text>
          </TouchableOpacity>
        </View>

        {/* Shared Bottom Tab Bar */}
        <GlobalBottomTabBar navigation={navigation} activeTab="claims" />
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isDeleting) setShowDeleteModal(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={[styles.modalIconBox, { backgroundColor: colors.redSoft }]}>
              <Trash2 size={24} color={colors.red} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.ink }]}>Delete claim?</Text>

            <Text style={[styles.modalMessage, { color: colors.muted }]}>
              Are you sure you want to delete this claim?
            </Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.line, backgroundColor: colors.surface2 }]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.ink }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalDeleteBtn, isDeleting && { opacity: 0.7 }]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Trash2 size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.modalDeleteBtnText}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  appBar: {
    height: 52,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  backBtn: {
    padding: 4,
    marginRight: 6,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  appBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  scrollContent: {
    padding: 13,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 11,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
  },
  patientBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  patientBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  subMeta: {
    fontSize: 11.5,
    marginTop: 3,
  },
  claimIdText: {
    fontSize: 11,
    marginTop: 4,
  },
  mono: {
    fontFamily: 'monospace',
  },
  horizontalTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
  },
  hStep: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  hBar: {
    flex: 1,
    height: 2,
  },
  hLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  hLabelText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  summaryCard: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  kvRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  kvKey: {
    fontSize: 12.5,
    flexShrink: 0,
    maxWidth: '42%',
    lineHeight: 18,
  },
  kvVal: {
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    flexShrink: 1,
    lineHeight: 18,
  },

  toast: {
    position: 'absolute',
    bottom: 74,
    left: 14,
    right: 14,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 50,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 10,
  },
  outlineBtn: {
    flex: 0.44,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  outlineBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 0.56,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  modalDeleteBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalDeleteBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
