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
  Download,
  Trash2,
  LayoutGrid,
  Check,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';

export const ClaimDetailScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const claimId = route?.params?.claimId || '3f8a1d6c-52b4-4e7a-9c11-0d5e2ab77104';
  const { claims, indexClaim, deleteClaim, addOrUpdateClaim } = useClaimsStore();
  const [activeTab, setActiveTab] = useState<'Summary' | 'Expenses' | 'Services'>('Summary');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [liveExpenses, setLiveExpenses] = useState<{ category: string; amount: number }[] | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const claim = claims.find(c => c.id === claimId || c.id.startsWith(claimId)) || claims[0] || {
    id: claimId,
    who: 'R. Menon',
    dept: 'Cardiology',
    amt: 184500,
    status: 'complete',
    step: 'validate',
    indexed: false,
    policyNo: 'SAMPLE-PH-77421',
    hospital: 'Sunrise Multispecialty',
    doctor: 'Dr. P. Rangan',
    diagnosis: 'Acute coronary syndrome',
    age: 54,
    gender: 'Male',
    admissionDate: '12 Aug 2026',
    dischargeDate: '16 Aug 2026',
    days: 4,
    claimType: 'Reimbursement',
    fieldsParsed: '23 of 27',
  };

  useEffect(() => {
    if (claimId && claimId.length > 20) {
      Promise.all([
        claimsApi.getClaimDetail(claimId).catch(() => null),
        claimsApi.getClaimPreview(claimId).catch(() => null),
      ]).then(([backendData, previewData]) => {
        if (backendData && backendData.id) {
          const transformed = transformBackendClaim(backendData, previewData);
          addOrUpdateClaim(transformed);
        }
        if (previewData && previewData.expenses && previewData.expenses.length > 0) {
          const formatted = previewData.expenses.map((e: any) => ({
            category: e.category || 'Medical expense',
            amount: Math.round(e.amount || 0),
          }));
          setLiveExpenses(formatted);
        }
      }).catch(err => {
        console.log('[ClaimDetailScreen] Backend claim detail unavailable:', err?.message || err);
      });
    }
  }, [claimId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDownload = () => {
    showToast(`GET /ingress/claims/${claim.id.slice(0, 8)}.../file → Discharge_Summary.pdf`);
  };

  const handleIndex = () => {
    indexClaim(claim.id);
    showToast('POST /search/index/… → indexed for full-text + vector search');
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

  const isFailed = claim.status === 'FAILED';
  const statusBg = isFailed ? colors.redSoft : colors.amberSoft;
  const statusColor = isFailed ? colors.red : colors.amber;

  const defaultExpenses = [
    { category: 'Room', amount: 32000 },
    { category: 'Consultation', amount: 14500 },
    { category: 'Pharmacy', amount: 21300 },
    { category: 'Surgery', amount: 78000 },
    { category: 'OT', amount: 18700 },
    { category: 'Anaesthesia', amount: 9400 },
    { category: 'Consumables', amount: 7100 },
    { category: 'Nursing', amount: 3500 },
  ];

  const expenses = liveExpenses || defaultExpenses;
  const totalExpense = expenses.reduce((acc, item) => acc + item.amount, 0);

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
          <TouchableOpacity style={styles.iconBtn} onPress={handleDownload} activeOpacity={0.7}>
            <Download size={19} color={colors.ink} />
          </TouchableOpacity>

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
                  COMPLETE · step {claim.step || 'validate'}
                </Text>
              </View>

              <View style={[styles.pill, { backgroundColor: colors.surface2 }]}>
                <Text style={[styles.pillText, { color: colors.muted }]}>
                  {claim.claimType || 'Reimbursement'}
                </Text>
              </View>

              <View style={[styles.pill, { backgroundColor: claim.indexed ? colors.greenSoft : colors.surface2 }]}>
                <Text style={[styles.pillText, { color: claim.indexed ? colors.green : colors.muted }]}>
                  {claim.indexed ? 'Indexed · searchable' : 'Not indexed'}
                </Text>
              </View>
            </View>

            {/* Patient Header */}
            <TouchableOpacity
              style={styles.patientRow}
              onPress={() => navigation.navigate(Routes.PatientProfile, { claimId: claim.id })}
              activeOpacity={0.7}
            >
              <Text style={[styles.patientName, { color: colors.ink }]}>
                {claim.who || 'R. Menon'} · {claim.age || 54} · {claim.gender || 'Male'}
              </Text>
              <View style={[styles.patientBadge, { backgroundColor: colors.brandSoft }]}>
                <Text style={[styles.patientBadgeText, { color: colors.brandDark }]}>
                  Patient ›
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={[styles.subMeta, { color: colors.muted }]}>
              {claim.hospital || 'Sunrise Multispecialty'} · admitted {claim.admissionDate || '12 Aug 2026'} · {claim.days || 4} days
            </Text>

            <Text style={[styles.claimIdText, styles.mono, { color: colors.muted }]}>
              {claim.id}
            </Text>

            {/* 5-Step Horizontal Tracker */}
            <View style={styles.horizontalTrack}>
              {['OCR', 'Parse', 'Code', 'Predict', 'Validate'].map((step, idx) => {
                const isLast = idx === 4;
                return (
                  <React.Fragment key={step}>
                    <View style={[styles.hStep, { backgroundColor: colors.brand, borderColor: colors.brand }]}>
                      <Check size={11} color="#ffffff" strokeWidth={3.2} />
                    </View>
                    {!isLast && <View style={[styles.hBar, { backgroundColor: colors.brand }]} />}
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

          {/* Action Buttons Row */}
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.line }]}
              onPress={handleIndex}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionBtnText, { color: colors.brandDark }]}>
                Index for search
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.line }]}
              onPress={handleDownload}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionBtnText, { color: colors.brandDark }]}>
                Download original
              </Text>
            </TouchableOpacity>
          </View>

          {/* 3 Segmented Tabs */}
          <View style={[styles.tabsContainer, { backgroundColor: colors.surface2 }]}>
            {(['Summary', 'Expenses', 'Services'] as const).map(tab => {
              const isSelected = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabBtn,
                    isSelected && [styles.tabBtnOn, { backgroundColor: colors.surface }],
                  ]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabBtnText,
                      {
                        color: isSelected ? colors.brandDark : colors.muted,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tab 1: Summary */}
          {activeTab === 'Summary' && (
            <View style={[styles.card, styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <View style={styles.kvRow}>
                <Text style={[styles.kvKey, { color: colors.muted }]}>Policy number</Text>
                <Text style={[styles.kvVal, styles.mono, { color: colors.ink }]}>
                  {claim.policyNo || 'SAMPLE-PH-77421'}
                </Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={[styles.kvKey, { color: colors.muted }]}>Insurer / TPA</Text>
                <Text style={[styles.kvVal, { color: colors.ink }]}>
                  Sample Health TPA
                </Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={[styles.kvKey, { color: colors.muted }]}>Admission</Text>
                <Text style={[styles.kvVal, { color: colors.ink }]}>
                  {claim.admissionDate || '12 Aug 2026'}
                </Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={[styles.kvKey, { color: colors.muted }]}>Discharge</Text>
                <Text style={[styles.kvVal, { color: colors.ink }]}>
                  {claim.dischargeDate || '16 Aug 2026'}
                </Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={[styles.kvKey, { color: colors.muted }]}>Primary diagnosis</Text>
                <Text style={[styles.kvVal, { color: colors.ink }]}>
                  {claim.diagnosis || 'Acute coronary syndrome'}
                </Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={[styles.kvKey, { color: colors.muted }]}>Treating doctor</Text>
                <Text style={[styles.kvVal, { color: colors.ink }]}>
                  {claim.doctor || 'Dr. P. Rangan'}
                </Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={[styles.kvKey, { color: colors.muted }]}>Amount claimed</Text>
                <Text style={[styles.kvVal, { color: colors.ink }]}>
                  {formatINR(claim.amt || 184500)}
                </Text>
              </View>

              <View style={[styles.kvRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.kvKey, { color: colors.muted }]}>Fields parsed</Text>
                <Text style={[styles.kvVal, { color: colors.ink }]}>
                  {claim.fieldsParsed || '23 of 27'}
                </Text>
              </View>
            </View>
          )}

          {/* Tab 2: Expenses */}
          {activeTab === 'Expenses' && (
            <View style={[styles.card, styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <View style={styles.expHeaderRow}>
                <Text style={[styles.expHeaderTitle, { color: colors.ink }]}>
                  {expenses.length} expense categories
                </Text>
                <Text style={[styles.expHeaderSub, { color: colors.muted }]}>Sample amounts</Text>
              </View>

              {expenses.map((item, idx) => (
                <View key={idx} style={styles.kvRow}>
                  <Text style={[styles.kvKey, { color: colors.muted }]}>{item.category}</Text>
                  <Text style={[styles.kvVal, { color: colors.ink }]}>
                    {formatINR(item.amount)}
                  </Text>
                </View>
              ))}

              <View style={[styles.kvRow, styles.totalRow, { borderTopColor: colors.line }]}>
                <Text style={[styles.totalKey, { color: colors.ink }]}>Total</Text>
                <Text style={[styles.totalVal, { color: colors.ink }]}>
                  {formatINR(totalExpense)}
                </Text>
              </View>
            </View>
          )}

          {/* Tab 3: Services */}
          {activeTab === 'Services' && (
            <View style={[styles.card, styles.servicesCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              {[
                {
                  title: 'AI Brain Preview',
                  route: Routes.BrainPreview,
                  ep: '/submission/claims/{id}/preview',
                },
                {
                  title: 'Documents',
                  route: Routes.DocumentGrid,
                  ep: '/ingress/claims/{id}/documents',
                },
                {
                  title: 'OCR & parsed fields',
                  route: Routes.OcrParsedFields,
                  ep: '/ocr · /parser',
                },
                {
                  title: 'Scan analysis',
                  route: Routes.ScanAnalyzer,
                  ep: 'scan_analyses',
                },
                {
                  title: 'Medical coding',
                  route: Routes.MedicalCoding,
                  ep: '/coding/code-suggest/{id}',
                },
                {
                  title: 'Audit trail',
                  route: Routes.AuditTrail,
                  ep: '/ingress/claims/{id}/audit',
                },
              ].map((svc, idx, arr) => (
                <TouchableOpacity
                  key={svc.title}
                  style={[
                    styles.serviceRow,
                    idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line2 },
                  ]}
                  onPress={() => {
                    navigation.navigate(svc.route as any, { claimId: claim.id });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.serviceTitle, { color: colors.ink }]}>{svc.title}</Text>
                    <Text style={[styles.serviceEp, styles.mono, { color: colors.muted }]}>
                      {svc.ep}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.muted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  actionBtnRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 11,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 11,
    padding: 3,
    gap: 3,
    marginBottom: 11,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabBtnOn: {
    shadowColor: '#102030',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 12,
  },
  summaryCard: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  kvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9.5,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f6',
  },
  kvKey: {
    fontSize: 12.2,
  },
  kvVal: {
    fontSize: 12.2,
    fontWeight: '700',
    textAlign: 'right',
  },
  expHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f6',
  },
  expHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  expHeaderSub: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  totalRow: {
    borderTopWidth: 2,
    marginTop: 4,
    borderBottomWidth: 0,
  },
  totalKey: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  servicesCard: {
    padding: 0,
    overflow: 'hidden',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  serviceTitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  serviceEp: {
    fontSize: 10.5,
    marginTop: 2,
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
