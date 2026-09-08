import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { Routes } from '../../../app/navigation/routes';
import { VALIDATION_RULES } from '../../../mocks/rules.mock';
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  Shield,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  FileCode,
  FileText,
  Check,
  X as XIcon,
} from 'lucide-react-native';

export const BrainPreviewScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const claimId = route?.params?.claimId || 'a4f1c9e2';

  const [riskOpen, setRiskOpen] = useState(true);
  const [fraudOpen, setFraudOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);

  // Interactive checks for readiness
  const [readinessChecks, setReadinessChecks] = useState({
    c1: true,
    c2: true,
    c3: true,
    c4: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleRerun = () => {
    showToast('POST /validator/validate/… → 7 of 11 rules passed');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* App Bar matching Screen 9 */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.ink} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.ink }]}>AI Brain Preview</Text>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate(Routes.ChatTab)}
          activeOpacity={0.7}
        >
          <MessageSquare size={19} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 4 KPIs Row */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[styles.kpiVal, { color: colors.amber }]}>58%</Text>
              <Text style={[styles.kpiLabel, { color: colors.muted }]}>Risk</Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[styles.kpiVal, { color: colors.amber }]}>MED</Text>
              <Text style={[styles.kpiLabel, { color: colors.muted }]}>Fraud</Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[styles.kpiVal, { color: colors.ink }]}>7/11</Text>
              <Text style={[styles.kpiLabel, { color: colors.muted }]}>Rules</Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[styles.kpiVal, { color: colors.ink }]}>75%</Text>
              <Text style={[styles.kpiLabel, { color: colors.muted }]}>Ready</Text>
            </View>
          </View>

          {/* Verdict Card */}
          <View style={[styles.verdictCard, { backgroundColor: colors.amberSoft }]}>
            <Text style={[styles.verdictTitle, { color: colors.amber }]}>NEEDS REVIEW</Text>
            <Text style={[styles.verdictSub, { color: colors.amber }]}>
              2 rules failed · pre-authorisation missing · fraud MEDIUM
            </Text>
          </View>

          {/* Model Warning Banner */}
          <View style={[styles.banner, { backgroundColor: colors.amberSoft }]}>
            <AlertTriangle size={16} color={colors.amber} style={{ marginTop: 2 }} />
            <Text style={[styles.bannerText, { color: colors.amber }]}>
              <Text style={styles.mono}>xgb_rejection.json</Text> was auto-trained on synthetic data at predictor startup — treat the score as indicative.
            </Text>
          </View>

          {/* Accordion 1: Risk Assessment */}
          <View style={[styles.accCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <TouchableOpacity
              style={styles.accHeader}
              onPress={() => setRiskOpen(!riskOpen)}
              activeOpacity={0.7}
            >
              <Clock size={16} color={colors.ink} />
              <Text style={[styles.accTitle, { color: colors.ink }]}>Risk assessment</Text>
              <View style={[styles.pillBadge, { backgroundColor: colors.amberSoft }]}>
                <Text style={[styles.pillText, { color: colors.amber }]}>58% · MEDIUM</Text>
              </View>
              <View style={{ marginLeft: 'auto' }}>
                {riskOpen ? (
                  <ChevronDown size={16} color={colors.muted} />
                ) : (
                  <ChevronRight size={16} color={colors.muted} />
                )}
              </View>
            </TouchableOpacity>

            {riskOpen && (
              <View style={[styles.accInner, { borderTopColor: colors.line2 }]}>
                <View style={styles.factorRow}>
                  <View style={[styles.dot, { backgroundColor: colors.red }]} />
                  <Text style={[styles.factorText, { color: colors.ink }]}>
                    Pre-authorisation reference absent
                  </Text>
                  <Text style={[styles.factorVal, { color: colors.muted }]}>+18</Text>
                </View>

                <View style={styles.factorRow}>
                  <View style={[styles.dot, { backgroundColor: colors.amber }]} />
                  <Text style={[styles.factorText, { color: colors.ink }]}>
                    Bill date precedes admission date
                  </Text>
                  <Text style={[styles.factorVal, { color: colors.muted }]}>+11</Text>
                </View>

                <View style={styles.factorRow}>
                  <View style={[styles.dot, { backgroundColor: colors.amber }]} />
                  <Text style={[styles.factorText, { color: colors.ink }]}>
                    Pharmacy total above policy sub-limit
                  </Text>
                  <Text style={[styles.factorVal, { color: colors.muted }]}>+7</Text>
                </View>

                <View style={styles.factorRow}>
                  <View style={[styles.dot, { backgroundColor: colors.green }]} />
                  <Text style={[styles.factorText, { color: colors.ink }]}>
                    Provider history clean
                  </Text>
                  <Text style={[styles.factorVal, { color: colors.muted }]}>−9</Text>
                </View>

                <TouchableOpacity
                  style={[styles.accActionBtn, { borderColor: colors.line }]}
                  onPress={() => navigation.navigate(Routes.RiskDetail, { claimId })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.accActionBtnText, { color: colors.brandDark }]}>
                    Open risk detail
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Accordion 2: Fraud Assessment */}
          <View style={[styles.accCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <TouchableOpacity
              style={styles.accHeader}
              onPress={() => setFraudOpen(!fraudOpen)}
              activeOpacity={0.7}
            >
              <Shield size={16} color={colors.ink} />
              <Text style={[styles.accTitle, { color: colors.ink }]}>Fraud assessment</Text>
              <View style={[styles.pillBadge, { backgroundColor: colors.amberSoft }]}>
                <Text style={[styles.pillText, { color: colors.amber }]}>MEDIUM</Text>
              </View>
              <View style={{ marginLeft: 'auto' }}>
                {fraudOpen ? (
                  <ChevronDown size={16} color={colors.muted} />
                ) : (
                  <ChevronRight size={16} color={colors.muted} />
                )}
              </View>
            </TouchableOpacity>

            {fraudOpen && (
              <View style={[styles.accInner, { borderTopColor: colors.line2 }]}>
                <View style={styles.segBar}>
                  <View style={[styles.segPiece, { width: '34%', backgroundColor: colors.green }]} />
                  <View style={[styles.segPiece, { width: '33%', backgroundColor: colors.amber }]} />
                  <View style={[styles.segPiece, { width: '33%', backgroundColor: colors.red }]} />
                </View>

                <View style={styles.segLabelsRow}>
                  <Text style={[styles.segLabel, { color: colors.muted }]}>LOW</Text>
                  <Text style={[styles.segLabel, { color: colors.amber, fontWeight: '700' }]}>
                    MEDIUM
                  </Text>
                  <Text style={[styles.segLabel, { color: colors.muted }]}>HIGH</Text>
                </View>

                <View style={styles.factorRow}>
                  <View style={[styles.dot, { backgroundColor: colors.amber }]} />
                  <Text style={[styles.factorText, { color: colors.ink }]}>
                    <Text style={styles.mono}>velocity</Text> — 4 claims from this provider in 24 h
                  </Text>
                </View>

                <View style={styles.factorRow}>
                  <View style={[styles.dot, { backgroundColor: colors.green }]} />
                  <Text style={[styles.factorText, { color: colors.ink }]}>
                    <Text style={styles.mono}>duplicate · billing · provider · coding · identity</Text> — clear
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.accActionBtn, { borderColor: colors.line }]}
                  onPress={() => navigation.navigate(Routes.FraudDetail, { claimId })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.accActionBtnText, { color: colors.brandDark }]}>
                    Open fraud detail
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Accordion 3: Validation Rules */}
          <View style={[styles.accCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <TouchableOpacity
              style={styles.accHeader}
              onPress={() => setRulesOpen(!rulesOpen)}
              activeOpacity={0.7}
            >
              <CheckSquare size={16} color={colors.ink} />
              <Text style={[styles.accTitle, { color: colors.ink }]}>Validation rules</Text>
              <View style={[styles.pillBadge, { backgroundColor: colors.amberSoft }]}>
                <Text style={[styles.pillText, { color: colors.amber }]}>7 / 11</Text>
              </View>
              <View style={{ marginLeft: 'auto' }}>
                {rulesOpen ? (
                  <ChevronDown size={16} color={colors.muted} />
                ) : (
                  <ChevronRight size={16} color={colors.muted} />
                )}
              </View>
            </TouchableOpacity>

            {rulesOpen && (
              <View style={[styles.accInner, { borderTopColor: colors.line2 }]}>
                {VALIDATION_RULES.map(rule => {
                  const isOk = rule.status === 'ok';
                  const isWarn = rule.status === 'warn';
                  const iconColor = isOk ? colors.green : isWarn ? colors.amber : colors.red;

                  return (
                    <View key={rule.code} style={styles.ruleSummaryRow}>
                      <View style={[styles.ruleCodeBadge, { backgroundColor: colors.surface2 }]}>
                        <Text style={[styles.ruleCodeText, styles.mono, { color: colors.muted }]}>
                          {rule.code}
                        </Text>
                      </View>
                      <Text style={[styles.ruleSummaryText, { color: colors.ink }]} numberOfLines={1}>
                        {rule.title}
                      </Text>
                      <View style={{ marginLeft: 'auto' }}>
                        {isOk ? (
                          <Check size={14} color={iconColor} strokeWidth={2.5} />
                        ) : isWarn ? (
                          <AlertTriangle size={14} color={iconColor} strokeWidth={2.2} />
                        ) : (
                          <XIcon size={14} color={iconColor} strokeWidth={2.5} />
                        )}
                      </View>
                    </View>
                  );
                })}

                <TouchableOpacity
                  style={[styles.accActionBtn, { borderColor: colors.line }]}
                  onPress={() => navigation.navigate(Routes.ValidationRules, { claimId })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.accActionBtnText, { color: colors.brandDark }]}>
                    Open validation detail
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Accordion 4: Reimbursement Readiness */}
          <View style={[styles.accCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <TouchableOpacity
              style={styles.accHeader}
              onPress={() => setReadinessOpen(!readinessOpen)}
              activeOpacity={0.7}
            >
              <CheckSquare size={16} color={colors.ink} />
              <Text style={[styles.accTitle, { color: colors.ink }]}>Reimbursement readiness</Text>
              <View style={[styles.pillBadge, { backgroundColor: colors.surface2 }]}>
                <Text style={[styles.pillText, { color: colors.muted }]}>75%</Text>
              </View>
              <View style={{ marginLeft: 'auto' }}>
                {readinessOpen ? (
                  <ChevronDown size={16} color={colors.muted} />
                ) : (
                  <ChevronRight size={16} color={colors.muted} />
                )}
              </View>
            </TouchableOpacity>

            {readinessOpen && (
              <View style={[styles.accInner, { borderTopColor: colors.line2 }]}>
                {/* 75% Progress Bar */}
                <View style={[styles.progTrack, { backgroundColor: colors.line }]}>
                  <View style={[styles.progFill, { width: '75%', backgroundColor: colors.brand }]} />
                </View>

                {/* Checklist items */}
                <TouchableOpacity
                  style={styles.checkItem}
                  onPress={() => setReadinessChecks(p => ({ ...p, c1: !p.c1 }))}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkBox,
                      readinessChecks.c1
                        ? { backgroundColor: colors.brand, borderColor: colors.brand }
                        : { borderColor: colors.line, backgroundColor: colors.surface },
                    ]}
                  >
                    {readinessChecks.c1 && <Check size={11} color="#fff" strokeWidth={3} />}
                  </View>
                  <Text style={[styles.checkText, { color: colors.ink }]}>
                    Discharge summary classified
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkItem}
                  onPress={() => setReadinessChecks(p => ({ ...p, c2: !p.c2 }))}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkBox,
                      readinessChecks.c2
                        ? { backgroundColor: colors.brand, borderColor: colors.brand }
                        : { borderColor: colors.line, backgroundColor: colors.surface },
                    ]}
                  >
                    {readinessChecks.c2 && <Check size={11} color="#fff" strokeWidth={3} />}
                  </View>
                  <Text style={[styles.checkText, { color: colors.ink }]}>
                    Itemised hospital bill classified
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkItem}
                  onPress={() => setReadinessChecks(p => ({ ...p, c3: !p.c3 }))}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkBox,
                      readinessChecks.c3
                        ? { backgroundColor: colors.brand, borderColor: colors.brand }
                        : { borderColor: colors.line, backgroundColor: colors.surface },
                    ]}
                  >
                    {readinessChecks.c3 && <Check size={11} color="#fff" strokeWidth={3} />}
                  </View>
                  <Text style={[styles.checkText, { color: colors.ink }]}>
                    Policy card verified
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkItem}
                  onPress={() => setReadinessChecks(p => ({ ...p, c4: !p.c4 }))}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkBox,
                      readinessChecks.c4
                        ? { backgroundColor: colors.brand, borderColor: colors.brand }
                        : { borderColor: colors.line, backgroundColor: colors.surface },
                    ]}
                  >
                    {readinessChecks.c4 && <Check size={11} color="#fff" strokeWidth={3} />}
                  </View>
                  <Text style={[styles.checkText, { color: colors.ink }]}>
                    Pre-authorisation letter
                  </Text>
                  {!readinessChecks.c4 && (
                    <View style={[styles.pillBadge, { backgroundColor: colors.redSoft, marginLeft: 6 }]}>
                      <Text style={[styles.pillText, { color: colors.red }]}>Missing</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Text style={[styles.noteText, { color: colors.muted }]}>
                  Threshold 75%+ completeness. Cross-document check: policy number differs on the pharmacy bill.
                </Text>
              </View>
            )}
          </View>

          {/* Accordion 5: Documents Classified */}
          <View style={[styles.accCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <TouchableOpacity
              style={styles.accHeader}
              onPress={() => setDocsOpen(!docsOpen)}
              activeOpacity={0.7}
            >
              <FileText size={16} color={colors.ink} />
              <Text style={[styles.accTitle, { color: colors.ink }]}>Documents classified</Text>
              <View style={[styles.pillBadge, { backgroundColor: colors.surface2 }]}>
                <Text style={[styles.pillText, { color: colors.muted }]}>6</Text>
              </View>
              <View style={{ marginLeft: 'auto' }}>
                {docsOpen ? (
                  <ChevronDown size={16} color={colors.muted} />
                ) : (
                  <ChevronRight size={16} color={colors.muted} />
                )}
              </View>
            </TouchableOpacity>

            {docsOpen && (
              <View style={[styles.accInner, { borderTopColor: colors.line2 }]}>
                {[
                  { name: 'discharge_summary', conf: '0.96', status: 'ok' },
                  { name: 'hospital_bill', conf: '0.93', status: 'ok' },
                  { name: 'policy_card', conf: '0.90', status: 'ok' },
                  { name: 'scan_report', conf: '0.74', status: 'warn' },
                  { name: 'pharmacy_bill', conf: 'R004', status: 'bad' },
                  { name: 'id_proof', conf: '0.95', status: 'ok' },
                ].map((doc, idx) => {
                  const dotColor =
                    doc.status === 'ok' ? colors.green : doc.status === 'warn' ? colors.amber : colors.red;
                  return (
                    <View key={idx} style={styles.factorRow}>
                      <View style={[styles.dot, { backgroundColor: dotColor }]} />
                      <Text style={[styles.factorText, styles.mono, { color: colors.ink }]}>
                        {doc.name}
                      </Text>
                      <Text style={[styles.factorVal, { color: colors.muted }]}>{doc.conf}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Accordion 6: Medical Coding */}
          <View style={[styles.accCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <TouchableOpacity
              style={styles.accHeader}
              onPress={() => navigation.navigate(Routes.MedicalCoding, { claimId })}
              activeOpacity={0.7}
            >
              <FileCode size={16} color={colors.ink} />
              <Text style={[styles.accTitle, { color: colors.ink }]}>Medical coding</Text>
              <View style={[styles.pillBadge, { backgroundColor: colors.greenSoft }]}>
                <Text style={[styles.pillText, { color: colors.green }]}>6 codes</Text>
              </View>
              <View style={{ marginLeft: 'auto' }}>
                <ChevronRight size={16} color={colors.muted} />
              </View>
            </TouchableOpacity>
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
            onPress={handleRerun}
            activeOpacity={0.7}
          >
            <Text style={[styles.outlineBtnText, { color: colors.brandDark }]}>
              Re-run validation
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.brand }]}
            onPress={() => navigation.navigate(Routes.MedicalCoding, { claimId })}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Generate IRDAI form</Text>
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
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  scrollContent: {
    padding: 13,
    paddingBottom: 24,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 11,
  },
  kpiCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  kpiLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  verdictCard: {
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },
  verdictTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  verdictSub: {
    fontSize: 11.5,
    marginTop: 3,
    textAlign: 'center',
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
  mono: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  accCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  accHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 13,
  },
  accTitle: {
    fontSize: 13,
    fontWeight: '650' as any,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  pillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  accInner: {
    borderTopWidth: 1,
    paddingHorizontal: 13,
    paddingBottom: 13,
    paddingTop: 8,
    gap: 9,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  factorText: {
    flex: 1,
    fontSize: 12,
  },
  factorVal: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  segBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  segPiece: {
    height: '100%',
  },
  segLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  segLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  ruleSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 3,
  },
  ruleCodeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  ruleCodeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  ruleSummaryText: {
    flex: 1,
    fontSize: 12,
  },
  progTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progFill: {
    height: '100%',
    borderRadius: 3,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 5,
  },
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 12.2,
  },
  noteText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  accActionBtn: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accActionBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    bottom: 74,
    left: 14,
    right: 14,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
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
    flex: 0.44,
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
    flex: 0.56,
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
