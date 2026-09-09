import React, { useState, useEffect } from 'react';
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
import { Routes } from '../../../app/navigation/routes';
import { VALIDATION_RULES, ValidationRule } from '../../../mocks/rules.mock';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { claimsApi, BackendClaimPreview, BackendClaimValidationRule } from '../../claims/services/claimsApi';
import {
  ArrowLeft,
  AlertTriangle,
  Check,
  X as XIcon,
  ChevronRight,
  ChevronDown,
} from 'lucide-react-native';

export const ValidationRulesScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const claimId = route?.params?.claimId || 'a4f1c9e2';

  const cachedPreview = useClaimsStore(s => s.claimPreviews[claimId]);
  const [preview, setPreview] = useState<BackendClaimPreview | null>(route?.params?.preview || cachedPreview || null);
  const [rerunning, setRerunning] = useState(false);

  useEffect(() => {
    if (!preview && claimId) {
      claimsApi.getClaimPreview(claimId).then(res => {
        if (res) {
          setPreview(res);
          useClaimsStore.getState().setClaimPreview(claimId, res);
        }
      }).catch(() => null);
    }
  }, [claimId]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'ok' | 'warn' | 'bad'>('all');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  // Formulate rules from real backend preview or fallback to mocks
  const rawValidations: BackendClaimValidationRule[] = Array.isArray(preview?.validations) ? preview.validations : [];

  const inferCategory = (name: string): 'completeness' | 'date logic' | 'coding validity' | 'fraud risk' => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('date') || lower.includes('admission') || lower.includes('discharge') || lower.includes('window')) {
      return 'date logic';
    }
    if (lower.includes('code') || lower.includes('icd') || lower.includes('cpt') || lower.includes('diagnosis')) {
      return 'coding validity';
    }
    if (lower.includes('fraud') || lower.includes('velocity') || lower.includes('identity')) {
      return 'fraud risk';
    }
    return 'completeness';
  };

  const rules: ValidationRule[] = rawValidations.length > 0
    ? rawValidations.map((v, idx) => ({
        code: `R${String(idx + 1).padStart(3, '0')}`,
        title: v.rule_name,
        category: inferCategory(v.rule_name),
        status: v.passed ? 'ok' : (v.severity === 'warning' ? 'warn' : 'bad'),
        detail: v.message || (v.passed ? 'Verified against claim documents.' : 'Validation condition not satisfied.'),
      }))
    : VALIDATION_RULES;

  const passedCount = rules.filter(r => r.status === 'ok').length;
  const warnCount = rules.filter(r => r.status === 'warn').length;
  const failCount = rules.filter(r => r.status === 'bad').length;
  const totalCount = rules.length || 11;

  const passedPct = Math.round((passedCount / totalCount) * 100);
  const warnPct = Math.round((warnCount / totalCount) * 100);
  const failPct = Math.max(0, 100 - passedPct - warnPct);

  const filteredRules = rules.filter(rule => {
    if (activeFilter === 'all') return true;
    return rule.status === activeFilter;
  });

  const handleRerun = async () => {
    setRerunning(true);
    try {
      if (claimId && claimId.length > 20) {
        await claimsApi.getClaimValidation(claimId);
        const updated = await claimsApi.getClaimPreview(claimId);
        if (updated) {
          setPreview(updated);
          useClaimsStore.getState().setClaimPreview(claimId, updated);
        }
      }
    } catch {
      // ignore
    } finally {
      setRerunning(false);
    }
  };

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

        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.title, { color: colors.ink }]}>Validation</Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>Claim {claimId.slice(0, 8)}</Text>
        </View>

        <View style={[styles.pillBadge, { backgroundColor: failCount === 0 ? colors.greenSoft : colors.amberSoft }]}>
          <Text style={[styles.pillText, { color: failCount === 0 ? colors.green : colors.amber }]}>
            {passedCount} / {totalCount}
          </Text>
        </View>
      </View>

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.passedHeaderRow}>
              <Text style={[styles.bigNum, { color: colors.ink }]}>{passedCount}</Text>
              <Text style={[styles.bigNumSub, { color: colors.muted }]}>of {totalCount} rules passed</Text>
            </View>

            {/* Segmented Bar */}
            <View style={styles.segBar}>
              <View style={[styles.segPiece, { width: `${passedPct}%`, backgroundColor: colors.green }]} />
              <View style={[styles.segPiece, { width: `${warnPct}%`, backgroundColor: colors.amber }]} />
              <View style={[styles.segPiece, { width: `${failPct}%`, backgroundColor: colors.red }]} />
            </View>

            <View style={styles.segLabelsRow}>
              <Text style={[styles.segLabel, { color: colors.muted }]}>{passedCount} passed</Text>
              <Text style={[styles.segLabel, { color: colors.muted }]}>{warnCount} warnings</Text>
              <Text style={[styles.segLabel, { color: colors.muted }]}>{failCount} failed</Text>
            </View>
          </View>

          {/* Provenance Banner */}
          <View style={[styles.banner, { backgroundColor: colors.amberSoft }]}>
            <AlertTriangle size={16} color={colors.amber} style={{ marginTop: 2 }} />
            <Text style={[styles.bannerText, { color: colors.amber }]}>
              Deterministic rules evaluate policy guidelines, date chronological sequences, sub-limit caps, and required hospital invoices.
            </Text>
          </View>

          {/* Filter Chips */}
          <View style={styles.chipsRow}>
            {[
              { key: 'all', label: `All (${totalCount})` },
              { key: 'ok', label: `Passed (${passedCount})` },
              { key: 'warn', label: `Warnings (${warnCount})` },
              { key: 'bad', label: `Failed (${failCount})` },
            ].map(f => {
              const isSelected = activeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.brandSoft : colors.surface,
                      borderColor: isSelected ? colors.brand : colors.line,
                    },
                  ]}
                  onPress={() => setActiveFilter(f.key as any)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: isSelected ? colors.brandDark : colors.ink,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Rules List Card */}
          <View style={[styles.card, styles.listCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {filteredRules.map((rule, idx) => {
              const isLast = idx === filteredRules.length - 1;
              const isExpanded = expandedCode === rule.code;

              return (
                <View
                  key={rule.code}
                  style={[
                    styles.ruleContainer,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.line2 },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.ruleRow}
                    onPress={() => setExpandedCode(isExpanded ? null : rule.code)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.codeTag, { backgroundColor: colors.surface2 }]}>
                      <Text style={[styles.codeTagText, styles.mono, { color: colors.muted }]}>
                        {rule.code}
                      </Text>
                    </View>

                    <View style={styles.ruleInfo}>
                      <Text style={[styles.ruleTitle, { color: colors.ink }]}>{rule.title}</Text>
                      <Text style={[styles.ruleCategory, { color: colors.muted }]}>
                        {rule.category}
                      </Text>
                    </View>

                    {rule.status === 'ok' ? (
                      <Check size={16} color={colors.green} strokeWidth={2.6} />
                    ) : rule.status === 'bad' ? (
                      <XIcon size={16} color={colors.red} strokeWidth={2.6} />
                    ) : (
                      <AlertTriangle size={15} color={colors.amber} strokeWidth={2.4} />
                    )}

                    {isExpanded ? (
                      <ChevronDown size={16} color={colors.muted} style={{ marginLeft: 4 }} />
                    ) : (
                      <ChevronRight size={16} color={colors.muted} style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>

                  {/* Expanded Rule Details */}
                  {isExpanded && (
                    <View style={[styles.ruleDetailBox, { backgroundColor: colors.surface2 }]}>
                      <Text style={[styles.ruleDetailText, { color: colors.ink }]}>
                        {rule.detail}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Sticky Bottom Actions Bar */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.line }]}
            onPress={handleRerun}
            disabled={rerunning}
            activeOpacity={0.7}
          >
            {rerunning ? (
              <ActivityIndicator size="small" color={colors.brandDark} />
            ) : (
              <Text style={[styles.outlineBtnText, { color: colors.brandDark }]}>Re-run</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.brand }]}
            onPress={() => navigation.navigate(Routes.BrainPreview, { claimId, preview })}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Back to Brain</Text>
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
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 99,
  },
  pillText: {
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
    padding: 13,
    marginBottom: 11,
  },
  listCard: {
    padding: 0,
  },
  passedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  bigNum: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  bigNumSub: {
    fontSize: 12,
  },
  segBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 8,
  },
  segPiece: {
    height: '100%',
  },
  segLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  segLabel: {
    fontSize: 11,
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
  chipsRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 11,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 99,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11.5,
  },
  ruleContainer: {
    overflow: 'hidden',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 13,
    gap: 10,
  },
  codeTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeTagText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  mono: {
    fontFamily: 'monospace',
  },
  ruleInfo: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  ruleCategory: {
    fontSize: 11,
    marginTop: 2,
  },
  ruleDetailBox: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginHorizontal: 13,
    marginBottom: 10,
    borderRadius: 8,
  },
  ruleDetailText: {
    fontSize: 11.5,
    lineHeight: 16,
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
