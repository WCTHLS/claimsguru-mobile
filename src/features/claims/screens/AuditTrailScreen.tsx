import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Info, FileText } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';

export const AuditTrailScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const claimId = route?.params?.claimId || 'a4f1c9e2';

  const auditEvents = [
    { ev: 'FIELD_EDIT', who: 'reviewer', desc: 'primary_diagnosis updated', time: '09:26' },
    { ev: 'VALIDATION_RUN', who: 'system', desc: '7 of 11 passed', time: '09:22' },
    { ev: 'CODE_FEEDBACK', who: 'reviewer', desc: 'I10 rejected by user', time: '09:21' },
    { ev: 'PARSE_COMPLETE', who: 'system', desc: '23 of 27 fields · doc_type set', time: '09:14' },
    { ev: 'WORKFLOW_START', who: 'system', desc: 'pipeline queued · gpu_queue', time: '09:12' },
    { ev: 'UPLOAD_SUCCESS', who: 'ops@sample-tpa.in', desc: '3 documents received', time: '09:12' },
  ];

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
        <Text style={[styles.appBarTitle, { color: colors.ink }]}>Audit trail</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollInner}>
        <View style={[styles.banner, { backgroundColor: colors.brandSoft }]}>
          <Info size={16} color={colors.brandDark} style={{ marginTop: 2 }} />
          <Text style={[styles.bannerText, { color: colors.brandDark }]}>
            Every mutation is logged with user, action, and before/after state snapshots.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, padding: 0 }]}>
          {auditEvents.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.auditRow,
                idx < auditEvents.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line2 },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.surface2 }]}>
                <FileText size={16} color={colors.brandDark} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.eventText, { color: colors.ink }]}>{item.ev}</Text>
                <Text style={[styles.descText, { color: colors.muted }]}>
                  {item.who} · {item.desc}
                </Text>
              </View>
              <Text style={[styles.timeText, { color: colors.muted }]}>{item.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
  content: { flex: 1 },
  scrollInner: { padding: 13, paddingBottom: 24 },
  banner: {
    flexDirection: 'row',
    gap: 8,
    padding: 11,
    borderRadius: 12,
    marginBottom: 12,
  },
  bannerText: { flex: 1, fontSize: 11.5, lineHeight: 16 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  descText: { fontSize: 11.5, marginTop: 2 },
  timeText: { fontSize: 11 },
});
