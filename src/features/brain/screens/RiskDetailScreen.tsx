import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../../core/theme/ThemeContext';
import { Routes } from '../../../app/navigation/routes';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { claimsApi, BackendClaimPreview } from '../../claims/services/claimsApi';
import { ArrowLeft, AlertTriangle } from 'lucide-react-native';

export const RiskDetailScreen = ({ route, navigation }: any) => {
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

  // Risk calculation from real preview
  const rawRisk = preview?.predictions?.[0]?.rejection_score ?? preview?.summary?.risk_score;
  const riskPct = rawRisk !== undefined && rawRisk !== null
    ? Math.round(rawRisk <= 1 ? rawRisk * 100 : rawRisk)
    : 58;
  const riskCategory = preview?.predictions?.[0]?.risk_category || (riskPct > 60 ? 'High' : riskPct > 30 ? 'Medium' : 'Low');
  const riskGaugeColor = riskPct > 60 ? colors.red : riskPct > 30 ? colors.amber : colors.green;

  // Gauge calculations
  const radius = 54;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (circumference * (riskPct / 100));

  const topReasons = preview?.predictions?.[0]?.top_reasons || [];

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
          <Text style={[styles.title, { color: colors.ink }]}>Rejection risk</Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>Claim {claimId.slice(0, 8)}</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Provenance Banner */}
          <View style={[styles.banner, { backgroundColor: colors.amberSoft }]}>
            <AlertTriangle size={16} color={colors.amber} style={{ marginTop: 2 }} />
            <Text style={[styles.bannerText, { color: colors.amber }]}>
              Model provenance: <Text style={styles.mono}>xgb_rejection.json</Text> trained with cross-document discrepancy features, policy exclusions, and provider velocity patterns.
            </Text>
          </View>

          {/* Rejection Risk Gauge Card */}
          <View style={[styles.card, styles.gaugeCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text style={[styles.gaugeHeader, { color: colors.muted }]}>REJECTION RISK</Text>

            <View style={styles.gaugeContainer}>
              <Svg width={140} height={140} viewBox="0 0 140 140">
                {/* Background Track */}
                <Circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke={colors.line}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Colored Progress Arc */}
                <Circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke={riskGaugeColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={`${progressOffset}`}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                />
              </Svg>

              <View style={styles.gaugeCenterText}>
                <Text style={[styles.gaugePercent, { color: colors.ink }]}>{riskPct}%</Text>
                <Text style={[styles.gaugeSub, { color: colors.muted }]}>{riskCategory}</Text>
              </View>
            </View>

            {/* Model Tag Chips */}
            <View style={styles.modelTagsRow}>
              <View style={[styles.modelTag, { backgroundColor: colors.surface2 }]}>
                <Text style={[styles.modelTagText, styles.mono, { color: colors.muted }]}>
                  xgb_rejection.json
                </Text>
              </View>
              <View style={[styles.modelTag, { backgroundColor: colors.surface2 }]}>
                <Text style={[styles.modelTagText, styles.mono, { color: colors.muted }]}>
                  lgbm_rejection.txt
                </Text>
              </View>
              <View style={[styles.modelTag, { backgroundColor: colors.surface2 }]}>
                <Text style={[styles.modelTagText, { color: colors.muted }]}>
                  SHAP-weighted
                </Text>
              </View>
            </View>
          </View>

          {/* Top Contributing Factors Header */}
          <View style={styles.secRow}>
            <Text style={[styles.secTitle, { color: colors.ink }]}>Top contributing factors</Text>
            <Text style={[styles.secMeta, styles.mono, { color: colors.muted }]}>
              {topReasons.length ? `${topReasons.length} factors identified` : 'xgb_feature_importance.json'}
            </Text>
          </View>

          {/* Factors List Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {topReasons.length > 0 ? (
              topReasons.map((item, idx) => {
                const isNeg = (item.weight || 0) < 0;
                const dotColor = isNeg ? colors.green : (item.weight || 0) > 15 ? colors.red : colors.amber;
                const weightLabel = isNeg ? `${item.weight}` : `+${item.weight || 10}`;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.factorRow,
                      idx > 0 && { borderTopWidth: 1, borderTopColor: colors.line2 },
                    ]}
                  >
                    <View style={[styles.dot, { backgroundColor: dotColor }]} />
                    <Text style={[styles.factorText, { color: colors.ink }]}>
                      {item.reason}
                    </Text>
                    <Text style={[styles.factorVal, { color: colors.muted }]}>{weightLabel}</Text>
                  </View>
                );
              })
            ) : (
              <>
                <View style={styles.factorRow}>
                  <View style={[styles.dot, { backgroundColor: colors.red }]} />
                  <Text style={[styles.factorText, { color: colors.ink }]}>
                    Pre-authorisation reference absent
                  </Text>
                  <Text style={[styles.factorVal, { color: colors.muted }]}>+18</Text>
                </View>

                <View style={[styles.factorRow, { borderTopWidth: 1, borderTopColor: colors.line2 }]}>
                  <View style={[styles.dot, { backgroundColor: colors.amber }]} />
                  <Text style={[styles.factorText, { color: colors.ink }]}>
                    Bill date precedes admission date
                  </Text>
                  <Text style={[styles.factorVal, { color: colors.muted }]}>+11</Text>
                </View>

                <View style={[styles.factorRow, { borderTopWidth: 1, borderTopColor: colors.line2 }]}>
                  <View style={[styles.dot, { backgroundColor: colors.amber }]} />
                  <Text style={[styles.factorText, { color: colors.ink }]}>
                    Pharmacy total above policy sub-limit
                  </Text>
                  <Text style={[styles.factorVal, { color: colors.muted }]}>+7</Text>
                </View>

                <View style={[styles.factorRow, { borderTopWidth: 1, borderTopColor: colors.line2 }]}>
                  <View style={[styles.dot, { backgroundColor: colors.green }]} />
                  <Text style={[styles.factorText, { color: colors.ink }]}>
                    Provider history clean
                  </Text>
                  <Text style={[styles.factorVal, { color: colors.muted }]}>−9</Text>
                </View>

                <View style={[styles.factorRow, { borderTopWidth: 1, borderTopColor: colors.line2 }]}>
                  <View style={[styles.dot, { backgroundColor: colors.green }]} />
                  <Text style={[styles.factorText, { color: colors.ink }]}>
                    Diagnosis–procedure pairing consistent
                  </Text>
                  <Text style={[styles.factorVal, { color: colors.muted }]}>−6</Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>

        {/* Sticky Bottom Actions Bar */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.line }]}
            onPress={() => navigation.navigate(Routes.FraudDetail, { claimId, preview })}
            activeOpacity={0.7}
          >
            <Text style={[styles.outlineBtnText, { color: colors.brandDark }]}>Fraud</Text>
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
  scrollContent: {
    padding: 13,
    paddingBottom: 24,
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
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 13,
    marginBottom: 11,
  },
  gaugeCard: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  gaugeHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  gaugeContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  gaugeCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePercent: {
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  gaugeSub: {
    fontSize: 11,
    marginTop: 1,
  },
  modelTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    justifyContent: 'center',
  },
  modelTag: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 99,
  },
  modelTagText: {
    fontSize: 10.5,
  },
  secRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  secTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  secMeta: {
    fontSize: 10.5,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 9,
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
