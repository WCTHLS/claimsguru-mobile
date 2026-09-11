import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { usePipelineStore } from '../../../state/usePipelineStore';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { workflowApi } from '../services/workflowApi';
import { claimsApi, transformBackendClaim } from '../../claims/services/claimsApi';
import { Routes } from '../../../app/navigation/routes';
import { GlobalBottomTabBar } from '../../../app/navigation/GlobalBottomTabBar';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  FileText,
  Check,
  X as XIcon,
  Info,
  AlertTriangle,
} from 'lucide-react-native';

const STEP_DATA = [
  { name: 'OCR', defaultMsg: 'Text extracted from 3 documents' },
  { name: 'Parse', defaultMsg: '3 documents parsed · 23 of 27 fields · doc_type set' },
  { name: 'Code', defaultMsg: '6 codes assigned (3 ICD-10 · 3 CPT)' },
  { name: 'Predict', defaultMsg: 'Risk 58% · MEDIUM · 5 factors' },
  { name: 'Validate', defaultMsg: '7 of 11 rules passed' },
];

export const WorkflowPipelineScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const {
    active,
    running,
    failed,
    complete,
    stepStates,
    stepMessages,
    attempt,
    totalSeconds,
    docs,
    claimId,
    retryPipeline,
  } = usePipelineStore();

  const { claims } = useClaimsStore();
  const [accordionOpen, setAccordionOpen] = useState(false);

  const activeClaimId = claimId || claims[0]?.id || '73cae928-5f39-4129-a4f2-f667e94f3f6a';
  const claimRecord = claims.find(c => c.id === activeClaimId) || claims[0];
  const docCount = docs.length > 0 ? docs.length : 3;

  useEffect(() => {
    if (activeClaimId && activeClaimId.length > 20) {
      Promise.all([
        claimsApi.getClaimDetail(activeClaimId).catch(() => null),
        claimsApi.getClaimPreview(activeClaimId).catch(() => null),
        claimsApi.getClaimValidation(activeClaimId).catch(() => null),
        claimsApi.getClaimPrediction(activeClaimId).catch(() => null),
        workflowApi.getProgress(activeClaimId).catch(() => null),
        workflowApi.getStatus(activeClaimId).catch(() => null),
      ]).then(([detail, preview, val, pred, progress, statusRes]) => {
        if (detail && detail.id) {
          const patientName = preview?.parsed_fields?.patient_name || detail.patient_name || '';
          const diagnosis = preview?.parsed_fields?.diagnosis || detail.diagnosis || 'Cardiology';
          const fieldCount = preview?.parsed_fields ? Object.keys(preview.parsed_fields).length : 23;
          const isDemo = activeClaimId === 'a4f1c9e2';
          const icdCount = preview ? (preview.icd_codes?.length ?? 0) : (isDemo ? 3 : 0);
          const cptCount = preview ? (preview.cpt_codes?.length ?? 0) : (isDemo ? 3 : 0);
          const riskScore = Math.round((pred?.prediction?.rejection_score ?? (preview?.predictions?.[0]?.rejection_score ?? 0.58)) * 100);
          const riskCat = pred?.prediction?.risk_category ?? (preview?.predictions?.[0]?.risk_category ?? 'MEDIUM');
          const reasonCount = pred?.prediction?.top_reasons?.length ?? (preview?.predictions?.[0]?.top_reasons?.length ?? 5);
          const rulesTotal = val?.total_rules ?? 11;
          const rulesPassed = val?.passed ?? 7;

          if (preview) {
            useClaimsStore.getState().setClaimPreview(activeClaimId, preview);
          }
          useClaimsStore.getState().addOrUpdateClaim(transformBackendClaim(detail, preview));

          let calcSeconds: string | null = null;
          if (detail.created_at && detail.updated_at) {
            const start = new Date(detail.created_at).getTime();
            const end = new Date(detail.updated_at).getTime();
            const diff = (end - start) / 1000;
            if (diff > 0 && diff < 3600) {
              calcSeconds = diff.toFixed(1);
            }
          }

          if (progress && (progress.is_complete || progress.percentage >= 100 || detail.status === 'COMPLETED')) {
            usePipelineStore.setState({
              complete: true,
              running: false,
              progressPercentage: 100,
              currentStepIndex: 4,
              stepStates: ['d', 'd', 'd', 'd', 'd'],
              totalSeconds: calcSeconds || usePipelineStore.getState().totalSeconds || '11.1',
              claimWho: patientName || 'R. Menon',
              claimDept: diagnosis,
              stepMessages: [
                `Text extracted from ${detail.documents?.length || docCount} documents`,
                `${detail.documents?.length || docCount} documents parsed · ${fieldCount} of 27 fields · doc_type set`,
                cptCount > 0
                  ? `${icdCount + cptCount} codes assigned (${icdCount} ICD-10 · ${cptCount} CPT)`
                  : `${icdCount} code${icdCount === 1 ? '' : 's'} assigned (${icdCount} ICD-10 · 0 CPT)`,
                `Risk ${riskScore}% · ${riskCat} · ${reasonCount} factors`,
                `${rulesPassed} of ${rulesTotal} rules passed`,
              ],
            });
          } else if (calcSeconds && !usePipelineStore.getState().running) {
            usePipelineStore.setState({ totalSeconds: calcSeconds });
          }
        }
      });
    }
  }, [activeClaimId]);

  const isCompleteState = complete || (!running && !failed && stepStates.every(s => s === 'd'));
  const isRunningState = running || (!complete && !failed && stepStates.some(s => s === 'r'));

  const statusLabel = failed
    ? 'FAILED'
    : isCompleteState
    ? 'COMPLETE'
    : isRunningState
    ? 'RUNNING'
    : 'IDLE';

  const statusBadgeStyle = failed
    ? { bg: colors.redSoft, text: colors.red }
    : isCompleteState
    ? { bg: colors.greenSoft, text: colors.green }
    : isRunningState
    ? { bg: colors.brandSoft, text: colors.brandDark }
    : { bg: colors.surface2, text: colors.muted };

  const handleOpenClaim = () => {
    navigation.navigate(Routes.ClaimDetail, { claimId: activeClaimId });
  };

  const perDocList = docs.length > 0
    ? docs
    : [
        {
          name: 'Discharge_Summary.pdf',
          docType: 'discharge_summary',
          ocr: 'd',
          parse: 'd',
        },
        {
          name: 'Hospital_Bill.jpg',
          docType: 'hospital_bill',
          ocr: 'd',
          parse: 'd',
        },
        {
          name: 'Policy_Card.pdf',
          docType: 'policy_card',
          ocr: 'd',
          parse: 'd',
        },
      ];

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

        <Text style={[styles.title, { color: colors.ink }]}>Workflow</Text>

        <View style={styles.appBarRight}>
          <View style={[styles.statusPill, { backgroundColor: statusBadgeStyle.bg }]}>
            <Text style={[styles.statusPillText, { color: statusBadgeStyle.text }]}>
              {statusLabel}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: Routes.AllFeaturesTab })}
            activeOpacity={0.7}
          >
            <LayoutGrid size={20} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Active Claim Header Card */}
          <View style={[styles.card, styles.claimCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={[styles.docThumb, { backgroundColor: colors.brandSoft }]}>
              <FileText size={18} color={colors.brandDark} />
            </View>
            <View style={styles.claimMetaCol}>
              <Text style={[styles.claimIdText, styles.mono, { color: colors.ink }]} numberOfLines={1}>
                {activeClaimId}
              </Text>
              <Text style={[styles.claimSubText, { color: colors.muted }]}>
                {docCount} documents · current_step: validate · attempt {attempt || 1}
              </Text>
            </View>
          </View>

          {/* Fail Banner if failed */}
          {failed && (
            <View style={[styles.failBanner, { backgroundColor: colors.redSoft }]}>
              <AlertTriangle size={16} color={colors.red} style={{ marginTop: 1 }} />
              <Text style={[styles.failBannerText, { color: colors.red }]}>
                soft time limit exceeded (OCR 15 min)
              </Text>
            </View>
          )}

          {/* 5-Stage Stepper Card */}
          <View style={[styles.card, styles.stepperCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {STEP_DATA.map((step, idx) => {
              const state = stepStates[idx] || (isCompleteState ? 'd' : idx === 0 ? 'r' : 'q');
              const isDone = state === 'd' || isCompleteState;
              const isRunning = !isCompleteState && state === 'r';
              const isFailed = state === 'f';
              const isLast = idx === STEP_DATA.length - 1;
              const stepDesc = stepMessages[idx] || step.defaultMsg;

              return (
                <View key={step.name} style={styles.stepRow}>
                  {/* Continuous Vertical Rail */}
                  {!isLast && (
                    <View
                      style={[
                        styles.rail,
                        { backgroundColor: isDone ? colors.brand : colors.line },
                      ]}
                    />
                  )}

                  {/* Circle Bullet */}
                  <View
                    style={[
                      styles.bullet,
                      {
                        backgroundColor: isDone
                          ? colors.brand
                          : isFailed
                          ? colors.red
                          : isRunning
                          ? colors.surface
                          : colors.surface,
                        borderColor: isDone || isRunning ? colors.brand : colors.line,
                      },
                      isRunning && {
                        shadowColor: colors.brand,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 2,
                      },
                    ]}
                  >
                    {isDone ? (
                      <Check size={13} color="#ffffff" strokeWidth={3} />
                    ) : isFailed ? (
                      <XIcon size={13} color="#ffffff" strokeWidth={3} />
                    ) : isRunning ? (
                      <ActivityIndicator size="small" color={colors.brand} />
                    ) : (
                      <Text style={[styles.bulletNum, { color: colors.muted }]}>{idx + 1}</Text>
                    )}
                  </View>

                  {/* Step Name & Description */}
                  <View style={styles.stepInfo}>
                    <Text style={[styles.stepTitle, { color: colors.ink }]}>{step.name}</Text>
                    <Text style={[styles.stepDesc, { color: isRunning ? colors.brandDark : colors.muted }]}>
                      {stepDesc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Per Document (isolation) Accordion */}
          <View style={[styles.card, styles.accordionCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setAccordionOpen(!accordionOpen)}
              activeOpacity={0.7}
            >
              <FileText size={16} color={colors.ink} />
              <Text style={[styles.accordionTitle, { color: colors.ink }]}>
                Per document (isolation)
              </Text>
              <View style={styles.accordionChevron}>
                {accordionOpen ? (
                  <ChevronDown size={16} color={colors.muted} />
                ) : (
                  <ChevronRight size={16} color={colors.muted} />
                )}
              </View>
            </TouchableOpacity>

            {accordionOpen && (
              <View style={[styles.accordionBody, { borderTopColor: colors.line2 }]}>
                {perDocList.map((doc, idx) => (
                  <View key={idx} style={[styles.perDocItem, idx < perDocList.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line2 }]}>
                    <View style={styles.perDocInfo}>
                      <Text style={[styles.perDocName, { color: colors.ink }]} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <Text style={[styles.perDocType, { color: colors.muted }]}>
                        {doc.docType}
                      </Text>
                    </View>
                    <View style={styles.perDocStatusRow}>
                      <Text style={[styles.perDocStage, { color: colors.muted }]}>OCR</Text>
                      <View style={[styles.statusDot, { backgroundColor: colors.green }]} />
                      <Text style={[styles.perDocStage, { color: colors.muted, marginLeft: 8 }]}>Parse</Text>
                      <View style={[styles.statusDot, { backgroundColor: colors.green }]} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Retry Card if failed */}
          {failed && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, padding: 14 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>Retry</Text>
                <Text style={{ fontSize: 11.5, color: colors.muted }}>
                  attempt <Text style={{ fontWeight: '700' }}>{attempt}</Text> of 5
                </Text>
              </View>
              <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.line, overflow: 'hidden', marginBottom: 12 }}>
                <View style={{ height: '100%', width: `${(attempt / 5) * 100}%`, backgroundColor: colors.brand }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 9 }}>
                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: colors.line, flex: 0.45 }]}
                  onPress={() => navigation.navigate(Routes.UploadPanel)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.outlineBtnText, { color: colors.brandDark }]}>Re-upload file</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: colors.brand, flex: 0.55 }]}
                  onPress={retryPipeline}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Stats / Timing Card */}
          <View style={[styles.card, styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.kvRow}>
              <Text style={[styles.kvKey, { color: colors.muted }]}>total_processing_seconds</Text>
              <Text style={[styles.kvVal, styles.mono, { color: colors.ink }]}>
                {totalSeconds ? `${totalSeconds} s` : isRunningState ? '0.1 s' : '—'}
              </Text>
            </View>

            <View style={styles.kvRow}>
              <Text style={[styles.kvKey, { color: colors.muted }]}>Queues</Text>
              <Text style={[styles.kvVal, { color: colors.ink }]}>gpu_queue → default</Text>
            </View>

            <View style={[styles.kvRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.kvKey, { color: colors.muted }]}>Search index</Text>
              <View style={[styles.indexPill, { backgroundColor: claimRecord?.indexed ? colors.greenSoft : colors.surface2 }]}>
                <Text
                  style={[
                    styles.indexPillText,
                    { color: claimRecord?.indexed ? colors.green : colors.muted },
                  ]}
                >
                  {claimRecord?.indexed ? 'indexed' : 'not indexed'}
                </Text>
              </View>
            </View>
          </View>

          {/* Time Limits Banner */}
          <View style={[styles.banner, { backgroundColor: colors.brandSoft }]}>
            <Info size={15} color={colors.brandDark} style={{ marginTop: 1 }} />
            <Text style={[styles.bannerText, { color: colors.brandDark }]}>
              Time limits: OCR 15 min soft / 20 hard · Parser 5 min · Coding 8 min / 10 min · Validator 5 min. Max 5 retries.
            </Text>
          </View>
        </ScrollView>

        {/* Sticky Bottom Actions Bar */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.line }]}
            onPress={() => navigation.navigate('MainTabs', { screen: Routes.ChatTab })}
            activeOpacity={0.7}
          >
            <Text style={[styles.outlineBtnText, { color: colors.brandDark }]}>Back to chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.brand }]}
            onPress={handleOpenClaim}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Open claim</Text>
          </TouchableOpacity>
        </View>

        {/* Shared Bottom Tab Bar */}
        <GlobalBottomTabBar navigation={navigation} activeTab="claims" />
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
  appBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 99,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 9,
  },
  scrollContent: {
    padding: 13,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 11,
  },
  claimCard: {
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  docThumb: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  claimMetaCol: {
    flex: 1,
    minWidth: 0,
  },
  claimIdText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  claimSubText: {
    fontSize: 11.5,
    marginTop: 2,
  },
  mono: {
    fontFamily: 'monospace',
  },
  failBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: 11,
    marginBottom: 11,
  },
  failBannerText: {
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  stepperCard: {
    padding: 14,
  },
  stepRow: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: 16,
  },
  rail: {
    position: 'absolute',
    left: 11,
    top: 24,
    bottom: 0,
    width: 2,
  },
  bullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  bulletNum: {
    fontSize: 10,
    fontWeight: '700',
  },
  stepInfo: {
    marginLeft: 12,
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepDesc: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  accordionCard: {
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 13,
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  accordionChevron: {
    marginLeft: 'auto',
  },
  accordionBody: {
    borderTopWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  perDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  perDocInfo: {
    flex: 1,
    marginRight: 10,
  },
  perDocName: {
    fontSize: 12,
    fontWeight: '600',
  },
  perDocType: {
    fontSize: 10.5,
    marginTop: 2,
  },
  perDocStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perDocStage: {
    fontSize: 10.5,
    marginRight: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statsCard: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  kvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f6',
  },
  kvKey: {
    fontSize: 12.5,
  },
  kvVal: {
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'right',
  },
  indexPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  indexPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 11,
    borderRadius: 11,
    marginBottom: 11,
  },
  bannerText: {
    fontSize: 11.5,
    lineHeight: 16,
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
});
