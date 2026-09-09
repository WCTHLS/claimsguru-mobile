import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Eye, EyeOff, Info, ChevronRight, FileText } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useAuthStore } from '../../../state/useAuthStore';
import { fetchUserProfile } from '../../../core/api/authApi';
import { Routes } from '../../../app/navigation/routes';
import { formatINR } from '../../../core/utils/currency';

export const PatientProfileScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const {
    userName,
    userEmail,
    userId,
    policyNumber,
    phone,
    dob,
    gender,
    sumInsured,
  } = useAuthStore();

  const [isMasked, setIsMasked] = useState(true);
  const [activeTab, setActiveTab] = useState<'claims' | 'docs' | 'flags'>('claims');

  useEffect(() => {
    if (userEmail || userId) {
      fetchUserProfile(userId || userEmail).catch(() => {});
    }
  }, [userEmail, userId]);

  const getInitials = (name?: string) => {
    if (
      !name ||
      !name.trim() ||
      name.toLowerCase() === 'sample' ||
      name.toLowerCase() === 'unknown' ||
      name.toLowerCase().includes('sample@')
    ) {
      return 'JD';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  const initials = getInitials(userName);

  const maskVal = (type: 'policy' | 'phone' | 'email' | 'mrn' | 'dob', raw: string) => {
    if (!isMasked) return raw;
    if (type === 'policy') return '••••••••77421';
    if (type === 'phone') return '+91 ••••• •2345';
    if (type === 'email') return 'r•••••@sample.in';
    if (type === 'mrn') return 'MRN-••••17';
    if (type === 'dob') return '•• ••• 1972';
    return '••••••••';
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
        <Text style={[styles.appBarTitle, { color: colors.ink }]}>Patient profile</Text>
        <TouchableOpacity
          style={styles.maskBtn}
          onPress={() => setIsMasked(!isMasked)}
        >
          {isMasked ? <Eye size={19} color={colors.ink} /> : <EyeOff size={19} color={colors.brandDark} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollInner}>

        {/* Patient Identity Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, alignItems: 'center' }]}>
          <View style={[styles.avatarBox, { backgroundColor: colors.brandSoft }]}>
            <Text style={[styles.avatarText, { color: colors.brandDark }]}>{initials}</Text>
          </View>
          <Text style={[styles.patientName, { color: colors.ink }]}>{userName}</Text>
          <Text style={[styles.patientSub, { color: colors.muted }]}>
            {gender || 'Male'} · born {maskVal('dob', dob || '08 Jun 2000')}
          </Text>

          <View style={styles.pillsRow}>
            <View style={[styles.tagPill, { backgroundColor: colors.brandSoft }]}>
              <Text style={[styles.tagPillText, { color: colors.brandDark }]}>Self</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: colors.greenSoft }]}>
              <Text style={[styles.tagPillText, { color: colors.green }]}>KYC verified</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: colors.amberSoft }]}>
              <Text style={[styles.tagPillText, { color: colors.amber }]}>Fraud LOW</Text>
            </View>
          </View>
          <Text style={[styles.maskNote, { color: colors.muted }]}>
            {isMasked ? 'PHI masked · tap the eye to reveal' : 'PHI revealed · DOB, policy, phone, email, UID'}
          </Text>
        </View>

        {/* 3 KPIs */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text style={[styles.kpiVal, { color: colors.ink }]}>5</Text>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>Claims</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text style={[styles.kpiVal, { color: colors.ink }]}>3</Text>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>Approved</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text style={[styles.kpiVal, { color: colors.ink }]}>41%</Text>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>Avg. risk</Text>
          </View>
        </View>

        {/* Policy Details Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.sectionTitle, { color: colors.ink, marginBottom: 8 }]}>Policy</Text>
          <View style={styles.kvRow}>
            <Text style={[styles.kvKey, { color: colors.muted }]}>Policy number</Text>
            <Text style={[styles.kvVal, styles.mono, { color: colors.ink }]}>
              {maskVal('policy', policyNumber || 'P-0007401')}
            </Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={[styles.kvKey, { color: colors.muted }]}>Policy year</Text>
            <Text style={[styles.kvVal, { color: colors.ink }]}>Apr 2026 – Mar 2027</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={[styles.kvKey, { color: colors.muted }]}>Phone</Text>
            <Text style={[styles.kvVal, { color: colors.ink }]}>
              {maskVal('phone', phone || '+91 98450 12345')}
            </Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={[styles.kvKey, { color: colors.muted }]}>Email</Text>
            <Text style={[styles.kvVal, { color: colors.ink }]}>
              {maskVal('email', userEmail || 'sample@gmail.com')}
            </Text>
          </View>
          <View style={[styles.kvRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.kvKey, { color: colors.muted }]}>User ID</Text>
            <Text style={[styles.kvVal, styles.mono, { color: colors.ink }]}>
              {maskVal('mrn', userId ? `UID-${userId.slice(0, 8).toUpperCase()}` : 'UID-EC78998A')}
            </Text>
          </View>
        </View>

        {/* Sum Insured Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>Sum insured</Text>
            <Text style={[styles.sumSub, { color: colors.muted }]}>Rs. 2,22,700 of {formatINR(sumInsured || 500000)}</Text>
          </View>
          <View style={styles.segBar}>
            <View style={[styles.seg, { flex: 0.08, backgroundColor: colors.green }]} />
            <View style={[styles.seg, { flex: 0.37, backgroundColor: colors.amber }]} />
            <View style={[styles.seg, { flex: 0.55, backgroundColor: colors.line }]} />
          </View>
          <View style={styles.utilRow}>
            <Text style={[styles.utilItem, { color: colors.muted }]}>Approved: {formatINR(38200)}</Text>
            <Text style={[styles.utilItem, { color: colors.muted }]}>Pending: {formatINR(184500)}</Text>
          </View>
        </View>

        {/* Tabs: Claims / Documents / Flags */}
        <View style={[styles.tabBar, { backgroundColor: colors.surface2 }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'claims' && [styles.tabBtnOn, { backgroundColor: colors.surface }]]}
            onPress={() => setActiveTab('claims')}
          >
            <Text style={[styles.tabBtnText, { color: activeTab === 'claims' ? colors.brandDark : colors.muted }]}>Claims</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'docs' && [styles.tabBtnOn, { backgroundColor: colors.surface }]]}
            onPress={() => setActiveTab('docs')}
          >
            <Text style={[styles.tabBtnText, { color: activeTab === 'docs' ? colors.brandDark : colors.muted }]}>Documents</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'flags' && [styles.tabBtnOn, { backgroundColor: colors.surface }]]}
            onPress={() => setActiveTab('flags')}
          >
            <Text style={[styles.tabBtnText, { color: activeTab === 'flags' ? colors.brandDark : colors.muted }]}>Flags</Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Claims List */}
        {activeTab === 'claims' && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, padding: 0 }]}>
            {[
              { title: 'Cardiology · Rs. 1,84,500', sub: 'a4f1c9e2 · admitted 12 Aug 2026', status: 'complete', stColor: colors.amber },
              { title: 'Ophthalmology · Rs. 38,200', sub: '5d2e7f10 · 03 May 2026', status: 'submitted', stColor: colors.green },
              { title: 'General medicine · Rs. 24,100', sub: 'c81b3a44 · 18 Nov 2025', status: 'submitted', stColor: colors.green },
              { title: 'Orthopaedics · Rs. 91,000', sub: '0f9a6e27 · 22 Jun 2025 · identity mismatch', status: 'rejected', stColor: colors.red },
              { title: 'Diagnostics · Rs. 12,600', sub: '3b7d0c58 · 09 Jan 2025', status: 'submitted', stColor: colors.green },
            ].map((c, i, arr) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.claimItemRow,
                  i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line2 },
                ]}
                onPress={() => navigation.navigate(Routes.ClaimDetail, { claimId: 'a4f1c9e2' })}
              >
                <View style={[styles.claimIcon, { backgroundColor: colors.surface2 }]}>
                  <FileText size={16} color={colors.brandDark} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.claimItemTitle, { color: colors.ink }]}>{c.title}</Text>
                  <Text style={[styles.claimItemSub, { color: colors.muted }]}>{c.sub}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.surface2 }]}>
                  <Text style={[styles.statusBadgeText, { color: c.stColor }]}>{c.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tab 2: Documents */}
        {activeTab === 'docs' && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, padding: 0 }]}>
            {[
              { name: 'discharge_summary', count: 2, sub: '2 documents · latest 16 Aug 2026' },
              { name: 'hospital_bill', count: 4, sub: '4 documents' },
              { name: 'pharmacy_bill', count: 3, sub: '3 documents · one flagged by R004' },
              { name: 'scan_report', count: 2, sub: '2 documents · MRI, X-Ray' },
              { name: 'policy_card', count: 1, sub: '1 document · verified' },
            ].map((d, i, arr) => (
              <TouchableOpacity
                key={d.name}
                style={[
                  styles.docItemRow,
                  i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line2 },
                ]}
                onPress={() => navigation.navigate(Routes.DocumentGrid, { claimId: 'a4f1c9e2' })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.docItemName, styles.mono, { color: colors.ink }]}>{d.name}</Text>
                  <Text style={[styles.docItemSub, { color: colors.muted }]}>{d.sub}</Text>
                </View>
                <View style={[styles.countBadge, { backgroundColor: colors.surface2 }]}>
                  <Text style={[styles.countBadgeText, { color: colors.muted }]}>{d.count}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tab 3: Flags */}
        {activeTab === 'flags' && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text style={[styles.sectionTitle, { color: colors.ink, marginBottom: 8 }]}>Cross-claim signals</Text>
            <View style={styles.flagRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.green }]} />
              <Text style={[styles.flagText, { color: colors.ink }]}>
                <Text style={styles.mono}>duplicate</Text> — none across 5 claims
              </Text>
            </View>
            <View style={styles.flagRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.green }]} />
              <Text style={[styles.flagText, { color: colors.ink }]}>
                <Text style={styles.mono}>velocity</Text> — 2 claims in last 120 days
              </Text>
            </View>
            <View style={styles.flagRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.green }]} />
              <Text style={[styles.flagText, { color: colors.ink }]}>
                <Text style={styles.mono}>provider</Text> — 3 distinct empanelled providers
              </Text>
            </View>
            <View style={styles.flagRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.amber }]} />
              <Text style={[styles.flagText, { color: colors.ink }]}>
                <Text style={styles.mono}>identity</Text> — DOB mismatch on 0f9a6e27 (rejected 2025)
              </Text>
            </View>
            <View style={[styles.flagRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.red }]} />
              <Text style={[styles.flagText, { color: colors.ink }]}>
                Pre-authorisation missing on current claim (R009)
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
        <TouchableOpacity
          style={[styles.bottomOutlineBtn, { borderColor: colors.line }]}
          onPress={() => navigation.navigate(Routes.ChatTab)}
        >
          <Text style={[styles.bottomOutlineText, { color: colors.brandDark }]}>Ask ClaimsGuru</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomSolidBtn, { backgroundColor: colors.brand }]}
          onPress={() => navigation.navigate(Routes.PatientActivity)}
        >
          <Text style={styles.bottomSolidText}>Activity timeline</Text>
        </TouchableOpacity>
      </View>
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
  maskBtn: { padding: 6 },
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
    padding: 13,
    marginBottom: 12,
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { fontSize: 22, fontWeight: '700' },
  patientName: { fontSize: 16.5, fontWeight: '700' },
  patientSub: { fontSize: 12, marginTop: 2 },
  pillsRow: { flexDirection: 'row', gap: 6, marginVertical: 8 },
  tagPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  tagPillText: { fontSize: 10.5, fontWeight: '700' },
  maskNote: { fontSize: 11 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  kpiBox: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  kpiVal: { fontSize: 16, fontWeight: '700' },
  kpiLabel: { fontSize: 10.5, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700' },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f6',
  },
  kvKey: { fontSize: 12 },
  kvVal: { fontSize: 12, fontWeight: '600' },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  sumSub: { fontSize: 11 },
  segBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginVertical: 8 },
  seg: { height: '100%' },
  utilRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  utilItem: { fontSize: 11 },
  tabBar: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 11,
    gap: 3,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabBtnOn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: { fontSize: 12, fontWeight: '600' },
  claimItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  claimIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  claimItemTitle: { fontSize: 12.5, fontWeight: '600' },
  claimItemSub: { fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  docItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  docItemName: { fontSize: 12, fontWeight: '700' },
  docItemSub: { fontSize: 11, marginTop: 2 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countBadgeText: { fontSize: 10.5, fontWeight: '700' },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f6',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  flagText: { flex: 1, fontSize: 12 },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 9,
  },
  bottomOutlineBtn: {
    flex: 0.42,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomOutlineText: { fontSize: 13, fontWeight: '600' },
  bottomSolidBtn: {
    flex: 0.58,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSolidText: { color: '#ffffff', fontSize: 13.5, fontWeight: '700' },
});
