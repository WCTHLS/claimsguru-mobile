import React, { useState, useEffect } from 'react';
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
import { FRAUD_FAMILIES } from '../../../mocks/codes.mock';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { claimsApi, BackendClaimPreview } from '../../claims/services/claimsApi';
import { ArrowLeft } from 'lucide-react-native';

export const FraudDetailScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const claimId = route?.params?.claimId || 'a4f1c9e2';

  const cachedPreview = useClaimsStore(s => s.claimPreviews[claimId]);
  const [preview, setPreview] = useState<BackendClaimPreview | null>(route?.params?.preview || cachedPreview || null);

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

  const rawFraud = preview?.fraud_analysis?.risk_level || preview?.predictions?.[0]?.risk_category || 'MED';
  const isHigh = rawFraud.toUpperCase().includes('HIGH');
  const isLow = rawFraud.toUpperCase().includes('LOW');
  const fraudCategory = isHigh ? 'HIGH' : isLow ? 'LOW' : 'MEDIUM';
  const fraudColor = isHigh ? colors.red : isLow ? colors.green : colors.amber;
  const fraudSoftBg = isHigh ? colors.redSoft : isLow ? colors.greenSoft : colors.amberSoft;

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
          <Text style={[styles.title, { color: colors.ink }]}>Fraud assessment</Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>Claim {claimId.slice(0, 8)}</Text>
        </View>

        <View style={[styles.pillBadge, { backgroundColor: fraudSoftBg }]}>
          <Text style={[styles.pillText, { color: fraudColor }]}>{fraudCategory}</Text>
        </View>
      </View>

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hybrid Score Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.secRow}>
              <Text style={[styles.secTitle, { color: colors.ink }]}>Hybrid score</Text>
              <Text style={[styles.secMeta, { color: colors.muted }]}>
                10 rules + IsolationForest + synthetic LLM
              </Text>
            </View>

            {/* Segmented Risk Bar */}
            <View style={styles.segBar}>
              <View style={[styles.segPiece, { width: '34%', backgroundColor: isLow ? colors.green : colors.line }]} />
              <View style={[styles.segPiece, { width: '33%', backgroundColor: !isLow && !isHigh ? colors.amber : colors.line }]} />
              <View style={[styles.segPiece, { width: '33%', backgroundColor: isHigh ? colors.red : colors.line }]} />
            </View>

            <View style={styles.segLabelsRow}>
              <Text style={[styles.segLabel, { color: isLow ? colors.green : colors.muted, fontWeight: isLow ? '700' : '400' }]}>
                LOW
              </Text>
              <Text style={[styles.segLabel, { color: !isLow && !isHigh ? colors.amber : colors.muted, fontWeight: !isLow && !isHigh ? '700' : '400' }]}>
                MEDIUM
              </Text>
              <Text style={[styles.segLabel, { color: isHigh ? colors.red : colors.muted, fontWeight: isHigh ? '700' : '400' }]}>
                HIGH
              </Text>
            </View>
          </View>

          {/* Rule Families Header */}
          <View style={styles.secRow}>
            <Text style={[styles.secTitle, { color: colors.ink }]}>Rule families</Text>
            <Text style={[styles.sampleLabel, { color: colors.muted }]}>DETECTION SIGNALS</Text>
          </View>

          {/* Rule Families List Card */}
          <View style={[styles.card, styles.listCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {FRAUD_FAMILIES.map((item, idx) => {
              const isClear = isLow ? true : (item.family === 'velocity' ? false : item.status === 'ok');
              const isLast = idx === FRAUD_FAMILIES.length - 1;

              return (
                <View
                  key={item.family}
                  style={[
                    styles.ruleRow,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.line2 },
                  ]}
                >
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isClear ? colors.green : colors.amber },
                    ]}
                  />

                  <View style={styles.ruleInfo}>
                    <Text style={[styles.ruleFamily, styles.mono, { color: colors.ink }]}>
                      {item.family}
                    </Text>
                    <Text style={[styles.ruleDesc, { color: colors.muted }]}>{item.desc}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: isClear ? colors.greenSoft : colors.amberSoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: isClear ? colors.green : colors.amber },
                      ]}
                    >
                      {isClear ? 'CLEAR' : 'FLAG'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Sticky Bottom Actions Bar */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.line }]}
            onPress={() => navigation.navigate(Routes.ValidationRules, { claimId, preview })}
            activeOpacity={0.7}
          >
            <Text style={[styles.outlineBtnText, { color: colors.brandDark }]}>Validation</Text>
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
  secMeta: {
    fontSize: 11,
  },
  sampleLabel: {
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  segBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 6,
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
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 13,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ruleInfo: {
    flex: 1,
  },
  ruleFamily: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  ruleDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  mono: {
    fontFamily: 'monospace',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 99,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 9,
  },
  outlineBtn: {
    flex: 0.46,
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
    flex: 0.54,
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
