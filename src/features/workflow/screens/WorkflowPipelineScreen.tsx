import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { usePipelineStore, STEP_NAMES, STEP_FULL_NAMES } from '../../../state/usePipelineStore';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { Routes } from '../../../app/navigation/routes';
import {
  ArrowLeft,
  FileText,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Info,
  Check,
  X as XIcon,
} from 'lucide-react-native';

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
    claimWho,
    retryPipeline,
  } = usePipelineStore();

  const { claims } = useClaimsStore();
  const [accordionOpen, setAccordionOpen] = useState(true);

  const statusLabel = failed
    ? 'FAILED'
    : complete
    ? 'COMPLETE'
    : running
    ? 'RUNNING'
    : active
    ? 'RUNNING'
    : 'IDLE';

  const statusBadge = {
    bg: failed
      ? colors.redSoft
      : complete
      ? colors.greenSoft
      : running || active
      ? colors.brandSoft
      : colors.surface2,
    text: failed
      ? colors.red
      : complete
      ? colors.green
      : running || active
      ? colors.brandDark
      : colors.muted,
  };

  const handleOpenClaim = () => {
    navigation.navigate(Routes.ClaimDetail, { claimId: claimId || 'a4f1c9e2' });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* App Bar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.ink} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.ink }]}>Workflow</Text>

        <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusBadge.text }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Empty / Idle State */}
          {!active && !running && !complete ? (
            <View style={[styles.card, styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>No pipeline running.</Text>
              <TouchableOpacity
                style={[styles.emptyUploadBtn, { borderColor: colors.brand, backgroundColor: colors.brandSoft }]}
                onPress={() => navigation.navigate(Routes.UploadPanel)}
                activeOpacity={0.7}
              >
                <Text style={[styles.emptyUploadBtnText, { color: colors.brandDark }]}>
                  Upload documents in chat
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Active Claim Info Card */}
              <View style={[styles.card, styles.claimHeaderCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <View style={[styles.thumb, { backgroundColor: colors.brandSoft }]}>
                  <FileText size={18} color={colors.brandDark} />
                </View>
                <View style={styles.claimHeaderInfo}>
                  <Text style={[styles.procId, { color: colors.ink }]} numberOfLines={1}>
                    {claimId}
                  </Text>
                  <Text style={[styles.procMeta, { color: colors.muted }]}>
                    {complete ? 'Complete' : 'Parsing…'} · {docs.length || 3} docs
                  </Text>
                </View>
              </View>

              {/* Fail Banner */}
              {failed && (
                <View style={[styles.banner, { backgroundColor: colors.redSoft }]}>
                  <AlertTriangle size={16} color={colors.red} style={{ marginTop: 1 }} />
                  <Text style={[styles.bannerText, { color: colors.red }]}>
                    soft time limit exceeded (OCR 15 min)
                  </Text>
                </View>
              )}

              {/* 5-Stage Stepper Card */}
              <View style={[styles.card, styles.stepperCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                {STEP_NAMES.map((name, i) => {
                  const state = stepStates[i];
                  const isDone = state === 'd';
                  const isRunning = state === 'r';
                  const isFailed = state === 'f';
                  const isLast = i === STEP_NAMES.length - 1;

                  return (
                    <View key={name} style={styles.stepItem}>
                      {/* Vertical connecting rail */}
                      {!isLast && (
                        <View
                          style={[
                            styles.stepRail,
                            { backgroundColor: isDone ? colors.brand : colors.line },
                          ]}
                        />
                      )}

                      {/* Bullet Circle */}
                      <View
                        style={[
                          styles.bullet,
                          {
                            backgroundColor: isDone
                              ? colors.brand
                              : isFailed
                              ? colors.red
                              : isRunning
                              ? colors.brandSoft
                              : colors.surface,
                            borderColor: isDone || isRunning ? colors.brand : colors.line,
                          },
                          isRunning && {
                            shadowColor: colors.brand,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.35,
                            shadowRadius: 4,
                            elevation: 2,
                          },
                        ]}
                      >
                        {isDone ? (
                          <Check size={14} color="#ffffff" strokeWidth={3} />
                        ) : isFailed ? (
                          <XIcon size={14} color="#ffffff" strokeWidth={3} />
                        ) : isRunning ? (
                          <ActivityIndicator size="small" color={colors.brandDark} />
                        ) : (
                          <Text style={[styles.bulletNum, { color: colors.muted }]}>
                            {i + 1}
                          </Text>
                        )}
                      </View>

                      {/* Step Text Info */}
                      <View style={styles.stepContent}>
                        <Text style={[styles.stepName, { color: colors.ink }]}>{name}</Text>
                        <Text
                          style={[
                            styles.stepMsg,
                            {
                              color: isRunning
                                ? colors.brandDark
                                : isFailed
                                ? colors.red
                                : colors.muted,
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {stepMessages[i]}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Per Document (isolation) Accordion */}
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => setAccordionOpen(!accordionOpen)}
                  activeOpacity={0.7}
                >
                  <FileText size={16} color={colors.ink} />
                  <Text style={[styles.accordionTitle, { color: colors.ink }]}>
                    Per document (isolation)
                  </Text>
                  <View style={{ marginLeft: 'auto' }}>
                    {accordionOpen ? (
                      <ChevronDown size={16} color={colors.muted} />
                    ) : (
                      <ChevronRight size={16} color={colors.muted} />
                    )}
                  </View>
                </TouchableOpacity>

                {accordionOpen && (
                  <View style={[styles.accordionInner, { borderTopColor: colors.line2 }]}>
                    {(docs.length > 0
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
                        ]
                    ).map((doc, idx) => (
                      <View key={idx} style={styles.perDocRow}>
                        <View style={styles.perDocInfo}>
                          <Text style={[styles.perDocName, { color: colors.ink }]} numberOfLines={1}>
                            {doc.name}
                          </Text>
                          <View style={styles.perDocPills}>
                            <View style={[styles.perDocBadge, { backgroundColor: colors.violetSoft }]}>
                              <Text style={[styles.perDocBadgeText, { color: colors.violet }]}>
                                {doc.docType}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.miniProgContainer}>
                          <View style={styles.miniProgRow}>
                            <Text style={[styles.miniProgLabel, { color: colors.muted }]}>OCR</Text>
                            <View style={[styles.miniBar, { backgroundColor: colors.line }]}>
                              <View
                                style={[
                                  styles.miniFill,
                                  {
                                    width: doc.ocr === 'd' ? '100%' : doc.ocr === 'r' ? '50%' : '0%',
                                    backgroundColor: colors.brand,
                                  },
                                ]}
                              />
                            </View>
                          </View>
                          <View style={styles.miniProgRow}>
                            <Text style={[styles.miniProgLabel, { color: colors.muted }]}>Parse</Text>
                            <View style={[styles.miniBar, { backgroundColor: colors.line }]}>
                              <View
                                style={[
                                  styles.miniFill,
                                  {
                                    width: doc.parse === 'd' ? '100%' : doc.parse === 'r' ? '50%' : '0%',
                                    backgroundColor: colors.brand,
                                  },
                                ]}
                              />
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Retry Card when Failed */}
              {failed && (
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                  <View style={styles.retryHeader}>
                    <Text style={[styles.retryTitle, { color: colors.ink }]}>Retry</Text>
                    <Text style={[styles.retrySub, { color: colors.muted }]}>
                      attempt <Text style={{ fontWeight: '700' }}>{attempt}</Text> of 5
                    </Text>
                  </View>

                  <View style={[styles.retryTrack, { backgroundColor: colors.line }]}>
                    <View
                      style={[
                        styles.retryFill,
                        { width: `${(attempt / 5) * 100}%`, backgroundColor: colors.brand },
                      ]}
                    />
                  </View>

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={[styles.subOutlineBtn, { borderColor: colors.line }]}
                      onPress={() => navigation.navigate(Routes.UploadPanel)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.subOutlineBtnText, { color: colors.brandDark }]}>
                        Re-upload file
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.subPrimaryBtn, { backgroundColor: colors.brand }]}
                      onPress={retryPipeline}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.subPrimaryBtnText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Total Card when Complete */}
              {complete && (
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                  <View style={styles.kvRow}>
                    <Text style={[styles.kvKey, { color: colors.muted }]}>total_processing_seconds</Text>
                    <Text style={[styles.kvVal, styles.mono, { color: colors.ink }]}>
                      {totalSeconds || '4.2'}s
                    </Text>
                  </View>
                  <View style={styles.kvRow}>
                    <Text style={[styles.kvKey, { color: colors.muted }]}>Queues</Text>
                    <Text style={[styles.kvVal, { color: colors.ink }]}>gpu_queue → default</Text>
                  </View>
                  <View style={[styles.kvRow, { borderBottomWidth: 0 }]}>
                    <Text style={[styles.kvKey, { color: colors.muted }]}>Search index</Text>
                    <Text style={[styles.kvVal, { color: colors.amber }]}>not indexed</Text>
                  </View>
                </View>
              )}

              {/* Time Limits Banner */}
              <View style={[styles.banner, { backgroundColor: colors.brandSoft }]}>
                <Info size={16} color={colors.brandDark} style={{ marginTop: 1 }} />
                <Text style={[styles.bannerText, { color: colors.brandDark }]}>
                  Time limits: OCR 15 min soft / 20 hard · Parser 5 min · Coding &amp; Risk 10 min · Validator 5 min. Max 5 retries.
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Sticky Bottom Actions Bar */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.line }]}
            onPress={() => navigation.navigate(Routes.ChatTab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.outlineBtnText, { color: colors.brandDark }]}>Back to chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                backgroundColor: colors.brand,
                opacity: complete || active ? 1 : 0.5,
              },
            ]}
            onPress={handleOpenClaim}
            disabled={!complete && !active}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Open claim</Text>
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
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 99,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scrollContent: {
    padding: 13,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 11,
    padding: 13,
  },
  emptyCard: {
    paddingVertical: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
  },
  emptyUploadBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: 1,
  },
  emptyUploadBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  claimHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimHeaderInfo: {
    flex: 1,
  },
  procId: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '600',
  },
  procMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  banner: {
    flexDirection: 'row',
    gap: 9,
    padding: 11,
    borderRadius: 12,
    alignItems: 'flex-start',
    marginBottom: 11,
  },
  bannerText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
  stepperCard: {
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    position: 'relative',
    paddingBottom: 16,
  },
  stepRail: {
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
  stepContent: {
    flex: 1,
    paddingTop: 1,
  },
  stepName: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  stepMsg: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  accordionTitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  accordionInner: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 9,
  },
  perDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  perDocInfo: {
    flex: 1,
  },
  perDocName: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  perDocPills: {
    flexDirection: 'row',
    marginTop: 3,
  },
  perDocBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  perDocBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  miniProgContainer: {
    width: 100,
    gap: 3,
  },
  miniProgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniProgLabel: {
    fontSize: 9,
    width: 28,
  },
  miniBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 2,
  },
  retryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  retryTitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  retrySub: {
    fontSize: 11,
  },
  retryTrack: {
    height: 6,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 10,
  },
  retryFill: {
    height: '100%',
    borderRadius: 99,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subOutlineBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
  },
  subOutlineBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subPrimaryBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  subPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
