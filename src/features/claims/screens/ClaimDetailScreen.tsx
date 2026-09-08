import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { claimsApi, transformBackendClaim } from '../services/claimsApi';
import { formatINR } from '../../../core/utils/currency';
import { Routes } from '../../../app/navigation/routes';
import {
  ArrowLeft,
  Download,
  Trash2,
  Check,
  ChevronRight,
} from 'lucide-react-native';

export const ClaimDetailScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const claimId = route?.params?.claimId || 'a4f1c9e2-7d30-4b8e-91cf-6ea2b40d7715';
  const { claims, indexClaim, deleteClaim, addOrUpdateClaim } = useClaimsStore();
  const [activeTab, setActiveTab] = useState<'Summary' | 'Expenses' | 'Services'>('Summary');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [liveExpenses, setLiveExpenses] = useState<{ category: string; amount: number }[] | null>(null);

  const claim = claims.find(c => c.id === claimId || c.id.startsWith(claimId)) || claims[0];

  useEffect(() => {
    // Fetch latest claim details & preview from backend
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
    const fileUrl = claimsApi.getClaimFileUrl(claim.id);
    showToast(`Downloading original: ${claim.id.slice(0, 8)}...`);
  };

  const handleIndex = () => {
    indexClaim(claim.id);
    showToast('Claim indexed for full-text and vector search');
  };

  const handleDelete = () => {
    Alert.alert(
      `Delete claim ${claim.id.slice(0, 8)}?`,
      'Removes the claim, its documents, parsed fields and results. The audit log keeps a record of the deletion.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete claim',
          style: 'destructive',
          onPress: () => {
            deleteClaim(claim.id);
            navigation.navigate(Routes.ClaimsTab);
          },
        },
      ]
    );
  };

  const isComplete = claim.status === 'complete';
  const isSubmitted = claim.status === 'submitted';
  const isFailed = claim.status === 'FAILED';

  const statusBg = isFailed
    ? colors.redSoft
    : isSubmitted
    ? colors.greenSoft
    : colors.amberSoft;

  const statusColor = isFailed
    ? colors.red
    : isSubmitted
    ? colors.green
    : colors.amber;

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

  const expenses = liveExpenses || claim.expenses || defaultExpenses;
  const totalExpense = expenses.reduce((acc, item) => acc + item.amount, 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* App Bar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.ink} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.ink }]}>Claim detail</Text>

        <View style={styles.appBarActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleDownload} activeOpacity={0.7}>
            <Download size={19} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleDelete} activeOpacity={0.7}>
            <Trash2 size={19} color={colors.ink} />
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
                  {claim.status.toUpperCase()} · step {claim.step}
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
              ) : (
                <View style={[styles.pill, { backgroundColor: colors.surface2 }]}>
                  <Text style={[styles.pillText, { color: colors.muted }]}>Not indexed</Text>
                </View>
              )}
            </View>

            {/* Patient Header */}
              <TouchableOpacity
                style={styles.patientRow}
                onPress={() => navigation.navigate(Routes.PatientProfile, { claimId: claim.id })}
                activeOpacity={0.7}
              >
                <Text style={[styles.patientName, { color: colors.ink }]}>
                  {claim.who} · {claim.age || 54} · {claim.gender || 'Male'}
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
                      <Check size={12} color="#ffffff" strokeWidth={3} />
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
            {!claim.indexed && (
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: colors.line }]}
                onPress={handleIndex}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionBtnText, { color: colors.brandDark }]}>
                  Index for search
                </Text>
              </TouchableOpacity>
            )}

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

          {/* Tabs Selector */}
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
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <View style={styles.kvRow}>
                <Text style={[styles.kvKey, { color: colors.muted }]}>Policy number</Text>
                <Text style={[styles.kvVal, styles.mono, { color: colors.ink }]}>
                  {claim.policyNo || 'SAMPLE-PH-77421'}
                </Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={[styles.kvKey, { color: colors.muted }]}>Insurer / TPA</Text>
                <Text style={[styles.kvVal, { color: colors.ink }]}>
                  {claim.tpa || 'Sample Health TPA'}
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
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
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
                  ep: 'Risk, fraud & readiness breakdown',
                },
                {
                  title: 'Documents',
                  route: Routes.DocumentGrid,
                  ep: 'Attached claim documents and reports',
                },
                {
                  title: 'OCR & parsed fields',
                  route: Routes.OcrParsedFields,
                  ep: 'Visual document reader & field editor',
                },
                {
                  title: 'Scan analysis',
                  route: Routes.ScanAnalyzer,
                  ep: 'Radiology, CT & ultrasound findings',
                },
                {
                  title: 'Medical coding',
                  route: Routes.MedicalCoding,
                  ep: 'ICD-10 diagnostic & CPT codes',
                },
                {
                  title: 'Audit trail',
                  route: Routes.AuditTrail,
                  ep: 'Activity log & state history',
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
                    <Text style={[styles.serviceEp, { color: colors.muted }]}>
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
            onPress={() => navigation.navigate(Routes.ChatTab)}
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
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarActions: {
    flexDirection: 'row',
    gap: 4,
  },
  scrollContent: {
    padding: 13,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 13,
    marginBottom: 11,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 99,
  },
  pillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  patientBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
  },
  patientBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subMeta: {
    fontSize: 11.5,
  },
  claimIdText: {
    fontSize: 10.5,
    marginTop: 5,
  },
  horizontalTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 6,
  },
  hStep: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '500',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 11,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 11,
    gap: 3,
    marginBottom: 11,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabBtnOn: {
    shadowColor: '#102030',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f6',
  },
  kvKey: {
    fontSize: 12,
  },
  kvVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  mono: {
    fontFamily: 'monospace',
  },
  expHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  expHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  expHeaderSub: {
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  totalRow: {
    borderTopWidth: 2,
    marginTop: 4,
    borderBottomWidth: 0,
    paddingTop: 8,
  },
  totalKey: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalVal: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  servicesCard: {
    padding: 0,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 13,
    gap: 10,
  },
  serviceTitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  serviceEp: {
    fontSize: 10,
    marginTop: 2,
  },
  toast: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 74,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 11.5,
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 9,
  },
  outlineBtn: {
    flex: 0.42,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 0.58,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
