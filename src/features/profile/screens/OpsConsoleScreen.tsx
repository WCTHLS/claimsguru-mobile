import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, RotateCw, Check } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { MICROSERVICES, MicroServiceHealth } from '../../../mocks/ops.mock';

export const OpsConsoleScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.ink }]}>Ops console</Text>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => showToast('All 11 microservices healthy')}
        >
          <RotateCw size={18} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollInner}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Service health</Text>
          <Text style={[styles.sectionSub, { color: colors.muted }]}>11 / 11 healthy</Text>
        </View>

        {/* 3-Column Service Health Grid */}
        <View style={styles.serviceGrid}>
          {MICROSERVICES.map((svc: MicroServiceHealth) => (
            <View
              key={svc.name}
              style={[styles.serviceBox, { backgroundColor: colors.surface, borderColor: colors.line }]}
            >
              <View style={[styles.healthDot, { backgroundColor: colors.green }]} />
              <Text style={[styles.serviceName, { color: colors.ink }]}>{svc.name}</Text>
              <Text style={[styles.servicePort, { color: colors.muted }]}>
                {svc.port ? `:${svc.port} · ` : ''}{svc.note}
              </Text>
            </View>
          ))}
        </View>

        {/* Celery Queues */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Worker queues</Text>
          <Text style={[styles.sectionSub, { color: colors.muted }]}>3 active asynchronous queues</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.kvRow}>
            <Text style={[styles.kvKey, styles.mono, { color: colors.ink }]}>gpu_queue · OCR, Parse</Text>
            <Text style={[styles.kvVal, { color: colors.ink }]}>2 queued · 1 active</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={[styles.kvKey, styles.mono, { color: colors.ink }]}>default · Coding, Risk, Validation</Text>
            <Text style={[styles.kvVal, { color: colors.ink }]}>0 queued · 1 active</Text>
          </View>
          <View style={[styles.kvRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.kvKey, { color: colors.muted }]}>Throughput (1 GPU worker)</Text>
            <Text style={[styles.kvVal, { color: colors.ink }]}>~4–6 claims/min</Text>
          </View>
        </View>

        {/* Model Registry */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Model registry</Text>
          <Text style={[styles.sectionSub, styles.mono, { color: colors.muted }]}>models/</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, padding: 0 }]}>
          {[
            { name: 'xgb_rejection.json', desc: 'XGBoost · primary rejection model', status: 'synthetic', isWarn: true },
            { name: 'lgbm_rejection.txt', desc: 'LightGBM · secondary ensemble', status: 'synthetic', isWarn: true },
            { name: 'xgb_feature_importance.json', desc: 'explainability weights', status: 'loaded', isWarn: false },
          ].map((m, i, arr) => (
            <View
              key={m.name}
              style={[
                styles.modelRow,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line2 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.modelName, styles.mono, { color: colors.ink }]}>{m.name}</Text>
                <Text style={[styles.modelDesc, { color: colors.muted }]}>{m.desc}</Text>
              </View>
              <View
                style={[
                  styles.modelBadge,
                  { backgroundColor: m.isWarn ? colors.amberSoft : colors.greenSoft },
                ]}
              >
                <Text
                  style={[
                    styles.modelBadgeText,
                    { color: m.isWarn ? colors.amber : colors.green },
                  ]}
                >
                  {m.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Toast */}
      {toastMsg && (
        <View style={[styles.toast, { backgroundColor: colors.navy }]}>
          <Check size={16} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.toastText} numberOfLines={2}>
            {toastMsg}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  appBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 6 },
  appBarTitle: { fontSize: 16.5, fontWeight: '700' },
  refreshBtn: { padding: 6 },
  content: { flex: 1 },
  scrollInner: { padding: 13, paddingBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700' },
  sectionSub: { fontSize: 11 },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  serviceBox: {
    width: '31%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
  },
  healthDot: { width: 7, height: 7, borderRadius: 3.5, marginBottom: 4 },
  serviceName: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  servicePort: { fontSize: 9.5, marginTop: 2 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    marginBottom: 14,
    overflow: 'hidden',
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f6',
  },
  kvKey: { fontSize: 11.5 },
  kvVal: { fontSize: 11.5, fontWeight: '600' },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  modelName: { fontSize: 12, fontWeight: '700' },
  modelDesc: { fontSize: 11, marginTop: 2 },
  modelBadge: { paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 8 },
  modelBadgeText: { fontSize: 10, fontWeight: '700' },
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
  toastText: { color: '#ffffff', fontSize: 11.5, flex: 1 },
});
