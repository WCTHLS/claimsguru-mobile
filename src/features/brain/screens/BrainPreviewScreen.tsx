import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { VALIDATION_RULES } from '../../../mocks/rules.mock';
import { formatINR } from '../../../core/utils/currency';

export const BrainPreviewScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const claimId = route?.params?.claimId || 'a4f1c9e2';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header Info */}
      <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.title, { color: colors.ink }]}>AI Brain Preview</Text>
          <View style={[styles.pill, { backgroundColor: colors.amberSoft }]}>
            <Text style={[styles.pillText, { color: colors.amber }]}>VALIDATED</Text>
          </View>
        </View>
        <Text style={[styles.claimTitle, { color: colors.ink }]}>R. Menon · Cardiology · {formatINR(184500)}</Text>
        <Text style={[styles.subText, { color: colors.muted }]}>Sunrise Multispecialty · {claimId}</Text>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.metricVal, { color: colors.amber }]}>58%</Text>
          <Text style={[styles.metricLabel, { color: colors.muted }]}>Rejection Risk</Text>
        </View>
        <View style={[styles.metricBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.metricVal, { color: colors.amber }]}>MED</Text>
          <Text style={[styles.metricLabel, { color: colors.muted }]}>Fraud Risk</Text>
        </View>
        <View style={[styles.metricBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.metricVal, { color: colors.green }]}>7 / 11</Text>
          <Text style={[styles.metricLabel, { color: colors.muted }]}>Rules Passed</Text>
        </View>
        <View style={[styles.metricBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.metricVal, { color: colors.brandDark }]}>75%</Text>
          <Text style={[styles.metricLabel, { color: colors.muted }]}>Readiness</Text>
        </View>
      </View>

      {/* Rejection Factors */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>Top Contributing Risk Factors</Text>
        <View style={styles.factorRow}>
          <Text style={[styles.dot, { color: colors.red }]}>●</Text>
          <Text style={[styles.factorText, { color: colors.ink }]}>Pre-authorisation reference absent</Text>
          <Text style={[styles.impactText, { color: colors.red }]}>+18</Text>
        </View>
        <View style={styles.factorRow}>
          <Text style={[styles.dot, { color: colors.amber }]}>●</Text>
          <Text style={[styles.factorText, { color: colors.ink }]}>Bill date precedes admission date (R004)</Text>
          <Text style={[styles.impactText, { color: colors.amber }]}>+11</Text>
        </View>
        <View style={styles.factorRow}>
          <Text style={[styles.dot, { color: colors.green }]}>●</Text>
          <Text style={[styles.factorText, { color: colors.ink }]}>Provider history clean & empanelled</Text>
          <Text style={[styles.impactText, { color: colors.green }]}>-9</Text>
        </View>
      </View>

      {/* Validation Rules Checklist */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>Deterministic Validation (R001–R011)</Text>
        {VALIDATION_RULES.map(rule => (
          <View key={rule.code} style={styles.ruleItem}>
            <Text style={[styles.ruleCode, { backgroundColor: colors.surface2, color: colors.muted }]}>
              {rule.code}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ruleTitle, { color: colors.ink }]}>{rule.title}</Text>
              <Text style={[styles.ruleCategory, { color: colors.muted }]}>{rule.category}</Text>
            </View>
            <Text style={{ color: rule.status === 'ok' ? colors.green : rule.status === 'warn' ? colors.amber : colors.red, fontWeight: '700' }}>
              {rule.status === 'ok' ? '✓' : rule.status === 'warn' ? '⚠' : '✗'}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  headerCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  claimTitle: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  subText: { fontSize: 11.5, marginTop: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  pillText: { fontSize: 10.5, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metricBox: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  metricVal: { fontSize: 15, fontWeight: '700' },
  metricLabel: { fontSize: 9.5, marginTop: 2 },
  sectionCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12, gap: 10 },
  sectionTitle: { fontSize: 13.5, fontWeight: '700', marginBottom: 4 },
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { fontSize: 14 },
  factorText: { flex: 1, fontSize: 12 },
  impactText: { fontSize: 12, fontWeight: '700' },
  ruleItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#e3e8ee' },
  ruleCode: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  ruleTitle: { fontSize: 12, fontWeight: '600' },
  ruleCategory: { fontSize: 10.5 },
});
