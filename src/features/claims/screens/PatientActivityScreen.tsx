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
import { ChevronLeft, Info, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useAuthStore } from '../../../state/useAuthStore';
import { Routes } from '../../../app/navigation/routes';

interface TimelineEvent {
  t: string;
  ev: string;
  cat: 'upload' | 'pipeline' | 'review' | 'submission' | 'chat';
  who: string;
  d: string;
  dot: 'ok' | 'warn' | 'bad' | 'info' | 'vio';
  diff?: [string, string];
  nav?: string;
}

interface TimelineDay {
  day: string;
  items: TimelineEvent[];
}

export const PatientActivityScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { userName } = useAuthStore();

  const getInitials = (name?: string) => {
    if (!name || !name.trim() || name.toLowerCase() === 'sample' || name.toLowerCase() === 'unknown' || name.toLowerCase().includes('sample@')) {
      return 'JD';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  const initials = getInitials(userName);

  const [activeFilter, setActiveFilter] = useState<'all' | 'upload' | 'pipeline' | 'review' | 'submission' | 'chat'>('all');
  const [openDiffIdx, setOpenDiffIdx] = useState<string | null>(null);

  const TIMELINE_DATA: TimelineDay[] = [
    {
      day: 'Today · 7 Sep 2026',
      items: [
        {
          t: '09:26',
          ev: 'FIELD_EDIT',
          cat: 'review',
          who: 'Shaikh Azhar · reviewer',
          d: 'primary_diagnosis corrected on a4f1c9e2',
          dot: 'vio',
          diff: ['Acute coronary syndrom', 'Acute coronary syndrome'],
        },
        {
          t: '09:22',
          ev: 'VALIDATION_RUN',
          cat: 'pipeline',
          who: 'system',
          d: '7 of 11 rules passed · R004, R009 failed',
          dot: 'warn',
          nav: Routes.ValidationRules,
        },
        {
          t: '09:21',
          ev: 'CODE_FEEDBACK',
          cat: 'review',
          who: 'Shaikh Azhar · reviewer',
          d: 'ICD-10 I10 rejected by reviewer',
          dot: 'vio',
          diff: ['I10 · Essential hypertension · confidence 0.72', 'I10 removed from claim code set'],
        },
        {
          t: '09:18',
          ev: 'CHAT_QUERY',
          cat: 'chat',
          who: 'Shaikh Azhar · reviewer',
          d: '“Why is the risk medium?” · PHI scrubbed: none',
          dot: 'info',
          nav: Routes.ChatTab,
        },
      ],
    },
    {
      day: '18 Aug 2026',
      items: [
        {
          t: '14:02',
          ev: 'FRAUD_ASSESSED',
          cat: 'pipeline',
          who: 'system',
          d: 'MEDIUM · velocity flag · feeds R011',
          dot: 'warn',
          nav: Routes.FraudDetail,
        },
        {
          t: '14:01',
          ev: 'PREDICT_COMPLETE',
          cat: 'pipeline',
          who: 'system',
          d: 'Rejection risk 58% · MEDIUM · 5 factors',
          dot: 'warn',
          nav: Routes.RiskDetail,
        },
        {
          t: '13:59',
          ev: 'CODE_COMPLETE',
          cat: 'pipeline',
          who: 'system',
          d: '6 codes assigned · 3 ICD-10 · 3 CPT',
          dot: 'info',
          nav: Routes.MedicalCoding,
        },
        {
          t: '13:58',
          ev: 'SCAN_ANALYSED',
          cat: 'pipeline',
          who: 'system',
          d: 'MRI detected · findings MODERATE',
          dot: 'info',
          nav: Routes.ScanAnalyzer,
        },
        {
          t: '13:57',
          ev: 'PARSE_COMPLETE',
          cat: 'pipeline',
          who: 'system',
          d: '23 of 27 fields · doc_type set on 3 documents',
          dot: 'info',
          nav: Routes.OcrParsedFields,
        },
        {
          t: '13:54',
          ev: 'UPLOAD_SUCCESS',
          cat: 'upload',
          who: 'hospital desk · submitter',
          d: '3 documents received · 4.3 MB',
          dot: 'ok',
          nav: Routes.DocumentGrid,
        },
      ],
    },
    {
      day: '3 May 2026',
      items: [
        {
          t: '11:40',
          ev: 'SUBMISSION_SENT',
          cat: 'submission',
          who: 'ops@sample-tpa.in · submitter',
          d: '7b03d15a · payer generic · TPA PDF + IRDAI form (modern)',
          dot: 'ok',
          nav: Routes.Submission,
        },
        {
          t: '11:31',
          ev: 'VALIDATION_RUN',
          cat: 'pipeline',
          who: 'system',
          d: '11 of 11 rules passed',
          dot: 'ok',
          nav: Routes.ValidationRules,
        },
      ],
    },
  ];

  let totalEvents = 0;
  TIMELINE_DATA.forEach(d => {
    totalEvents += d.items.filter(i => activeFilter === 'all' || i.cat === activeFilter).length;
  });

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
        <Text style={[styles.appBarTitle, { color: colors.ink }]}>Patient activity</Text>
        <View style={[styles.countPill, { backgroundColor: colors.surface2 }]}>
          <Text style={[styles.countPillText, { color: colors.muted }]}>{totalEvents} events</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollInner}>
        {/* User Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.avatarMini, { backgroundColor: colors.brandSoft }]}>
              <Text style={[styles.avatarMiniText, { color: colors.brandDark }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.patientTitle, { color: colors.ink }]}>{userName}</Text>
              <Text style={[styles.patientSub, { color: colors.muted }]}>
                Verified Patient · last activity today
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'upload', 'pipeline', 'review', 'submission', 'chat'] as const).map(f => {
            const isSel = activeFilter === f;
            const labels = {
              all: 'All',
              upload: 'Uploads',
              pipeline: 'Pipeline',
              review: 'Reviews',
              submission: 'Submissions',
              chat: 'Chat',
            };
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSel ? colors.brandSoft : colors.surface,
                    borderColor: isSel ? colors.brand : colors.line,
                  },
                ]}
                onPress={() => setActiveFilter(f)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSel ? colors.brandDark : colors.ink, fontWeight: isSel ? '700' : '500' },
                  ]}
                >
                  {labels[f]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Timeline */}
        {TIMELINE_DATA.map(group => {
          const items = group.items.filter(i => activeFilter === 'all' || i.cat === activeFilter);
          if (items.length === 0) return null;

          return (
            <View key={group.day} style={styles.timelineGroup}>
              <Text style={[styles.dayHeader, { color: colors.muted }]}>{group.day}</Text>

              {items.map((item, idx) => {
                const dotColor =
                  item.dot === 'ok'
                    ? colors.green
                    : item.dot === 'warn'
                    ? colors.amber
                    : item.dot === 'bad'
                    ? colors.red
                    : item.dot === 'vio'
                    ? colors.violet
                    : colors.brand;

                const diffKey = `${group.day}-${idx}`;
                const isDiffOpen = openDiffIdx === diffKey;

                return (
                  <View key={idx} style={styles.timelineRow}>
                    <View style={styles.railContainer}>
                      <View style={[styles.timelineDot, { backgroundColor: dotColor }]} />
                      {idx < items.length - 1 && (
                        <View style={[styles.timelineRail, { backgroundColor: colors.line }]} />
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.itemContentCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
                      onPress={() => {
                        if (item.diff) {
                          setOpenDiffIdx(isDiffOpen ? null : diffKey);
                        } else if (item.nav) {
                          navigation.navigate(item.nav);
                        }
                      }}
                      activeOpacity={item.diff || item.nav ? 0.7 : 1}
                    >
                      <View style={styles.itemHeader}>
                        <Text style={[styles.itemEventText, { color: colors.brandDark }]}>{item.ev}</Text>
                        <Text style={[styles.itemWhoText, { color: colors.muted }]}>{item.who}</Text>
                      </View>
                      <Text style={[styles.itemDesc, { color: colors.ink }]}>{item.d}</Text>
                      <Text style={[styles.itemTime, { color: colors.muted }]}>
                        {item.t} {item.diff && '· tap for before/after'}
                      </Text>

                      {/* Before / After Diff */}
                      {isDiffOpen && item.diff && (
                        <View style={[styles.diffBox, { borderTopColor: colors.line2 }]}>
                          <Text style={[styles.diffLabel, { color: colors.muted }]}>Before</Text>
                          <Text style={[styles.diffBefore, { color: colors.red }]}>{item.diff[0]}</Text>
                          <Text style={[styles.diffLabel, { color: colors.muted }]}>After</Text>
                          <Text style={[styles.diffAfter, { color: colors.green }]}>{item.diff[1]}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          );
        })}

        <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.line, marginTop: 14 }]}>
          <Info size={16} color={colors.muted} style={{ marginTop: 2 }} />
          <Text style={[styles.bannerText, { color: colors.muted }]}>
            UPLOAD_* names are the app's real log events. Tap review entries to view before/after snapshot diffs.
          </Text>
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
  countPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  countPillText: { fontSize: 10, fontWeight: '700' },
  content: { flex: 1 },
  scrollInner: { padding: 13, paddingBottom: 24 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  avatarMini: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarMiniText: { fontSize: 13, fontWeight: '700' },
  patientTitle: { fontSize: 13.5, fontWeight: '700' },
  patientSub: { fontSize: 11, marginTop: 1 },
  filterScroll: { flexDirection: 'row', gap: 6, paddingBottom: 10 },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 11.5 },
  timelineGroup: { marginTop: 8 },
  dayHeader: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  timelineRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  railContainer: { width: 14, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 12 },
  timelineRail: { width: 2, flex: 1, marginTop: 4 },
  itemContentCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemEventText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  itemWhoText: { fontSize: 10.5 },
  itemDesc: { fontSize: 12, marginTop: 4 },
  itemTime: { fontSize: 10.5, marginTop: 3 },
  diffBox: { marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  diffLabel: { fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase' },
  diffBefore: { fontSize: 11.5, textDecorationLine: 'line-through', marginBottom: 4 },
  diffAfter: { fontSize: 11.5, fontWeight: '600' },
  banner: {
    flexDirection: 'row',
    gap: 8,
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerText: { flex: 1, fontSize: 11.5, lineHeight: 16 },
});
