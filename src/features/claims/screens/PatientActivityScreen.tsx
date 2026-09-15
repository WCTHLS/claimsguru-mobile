import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Info, Clock, ShieldCheck, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useAuthStore } from '../../../state/useAuthStore';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { claimsApi, BackendAuditEvent } from '../services/claimsApi';
import { UserAvatar } from '../../../core/components/UserAvatar';
import { Routes } from '../../../app/navigation/routes';

interface TimelineEvent {
  id?: string;
  claimId: string;
  shortClaimId: string;
  created_at?: string;
  day: string;
  t: string;
  ev: string;
  cat: 'upload' | 'pipeline' | 'review' | 'submission' | 'chat';
  who: string;
  d: string;
  dot: 'ok' | 'warn' | 'bad' | 'info' | 'vio';
  diff?: [string, string];
  nav?: string;
  arg?: string;
  raw?: any;
}

interface TimelineDayGroup {
  day: string;
  items: TimelineEvent[];
}

function formatDayHeader(dateStr?: string): string {
  if (!dateStr) return 'TODAY';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'TODAY';
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) return 'TODAY';

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return 'YESTERDAY';

    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return 'TODAY';
  }
}

function formatHM(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
  } catch {
    return '—';
  }
}

function mapBackendAuditEvent(ev: BackendAuditEvent, claimId: string): TimelineEvent {
  const action = (ev.action || 'EVENT').toUpperCase();
  const meta = ev.metadata || {};

  let cat: TimelineEvent['cat'] = 'pipeline';
  if (action.includes('UPLOAD') || action.includes('DOCUMENT') || action.includes('FILE') || action.includes('INGRESS')) {
    cat = 'upload';
  } else if (action.includes('SUBMISSION') || action.includes('CLAIM') || action.includes('TPA') || action.includes('PAYER') || action.includes('SENT')) {
    cat = 'submission';
  } else if (action.includes('REVIEW') || action.includes('EDIT') || action.includes('FEEDBACK') || action.includes('CORRECT')) {
    cat = 'review';
  } else if (action.includes('CHAT') || action.includes('QUERY')) {
    cat = 'chat';
  }

  let dot: TimelineEvent['dot'] = 'info';
  if (
    action.includes('PASS') ||
    action.includes('SUCCESS') ||
    action.includes('APPROVED') ||
    action.includes('COMPLETE') ||
    action.includes('OK') ||
    action.includes('VALIDATED')
  ) {
    dot = 'ok';
  } else if (
    action.includes('FAIL') ||
    action.includes('REJECT') ||
    action.includes('ERROR') ||
    action.includes('HIGH')
  ) {
    dot = 'bad';
  } else if (
    action.includes('WARN') ||
    action.includes('PENDING') ||
    action.includes('RISK') ||
    action.includes('FLAG')
  ) {
    dot = 'warn';
  } else if (
    action.includes('EDIT') ||
    action.includes('FEEDBACK') ||
    action.includes('UPDATE') ||
    action.includes('CODE')
  ) {
    dot = 'vio';
  }

  let d = '';
  if (meta.reason) {
    d = meta.reason;
  } else if (meta.old_status && meta.new_status) {
    d = `Status: ${meta.old_status} → ${meta.new_status}`;
  } else if (meta.desc || meta.description) {
    d = meta.desc || meta.description;
  } else if (meta.message) {
    d = meta.message;
  } else if (meta.total_processing_seconds !== undefined) {
    d = `Pipeline finished in ${Number(meta.total_processing_seconds).toFixed(1)}s`;
  } else if (typeof meta === 'string') {
    d = meta;
  } else {
    d = action.replace(/_/g, ' ').toLowerCase();
    d = d.charAt(0).toUpperCase() + d.slice(1);
  }

  let diff: [string, string] | undefined = undefined;
  if (Array.isArray(meta.diff) && meta.diff.length === 2) {
    diff = [String(meta.diff[0]), String(meta.diff[1])];
  } else if (meta.before !== undefined && meta.after !== undefined) {
    diff = [String(meta.before), String(meta.after)];
  } else if (meta.old_status && meta.new_status) {
    diff = [String(meta.old_status), String(meta.new_status)];
  }

  let nav: string | undefined = undefined;
  if (action.includes('VALIDAT')) nav = Routes.ValidationRules;
  else if (action.includes('PREDICT') || action.includes('RISK')) nav = Routes.RiskDetail;
  else if (action.includes('FRAUD')) nav = Routes.FraudDetail;
  else if (action.includes('CODE')) nav = Routes.MedicalCoding;
  else if (action.includes('UPLOAD') || action.includes('DOCUMENT')) nav = Routes.DocumentGrid;
  else if (action.includes('SUBMISSION')) nav = Routes.Submission;
  else if (action.includes('CHAT')) nav = Routes.ChatTab;

  return {
    id: ev.id,
    claimId,
    shortClaimId: claimId.slice(0, 8),
    created_at: ev.created_at,
    day: formatDayHeader(ev.created_at),
    t: formatHM(ev.created_at),
    ev: action,
    cat,
    who: ev.actor || 'system',
    d,
    dot,
    diff,
    nav,
    raw: ev,
  };
}

export const PatientActivityScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { userName, gender, userEmail, policyNumber } = useAuthStore();
  const { claims, loadClaims } = useClaimsStore();

  // Initial claim filter: route param if specified, otherwise 'all'
  const initialFilter = route?.params?.claimId ? route.params.claimId : 'all';
  const [selectedClaimFilter, setSelectedClaimFilter] = useState<string>(initialFilter);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'upload' | 'pipeline' | 'review' | 'submission' | 'chat'>('all');
  const [openDiffIdx, setOpenDiffIdx] = useState<string | null>(null);

  const [eventsByClaim, setEventsByClaim] = useState<Record<string, TimelineEvent[]>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's claims on mount if store is empty
  useEffect(() => {
    if (claims.length === 0) {
      loadClaims();
    }
  }, []);

  // Fetch real audit logs for all known claims from the backend
  const fetchAllAuditLogs = useCallback(async (isRefresh = false) => {
    const claimsToFetch = claims.length > 0 ? claims : [];
    if (claimsToFetch.length === 0) {
      // If store is still empty, load claims first
      await loadClaims(isRefresh);
    }

    const targetList = useClaimsStore.getState().claims;
    if (targetList.length === 0) {
      setEventsByClaim({});
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const results: Record<string, TimelineEvent[]> = {};

      // Query audit endpoint in parallel for each real claim
      await Promise.all(
        targetList.map(async (c) => {
          try {
            const auditRes = await claimsApi.getClaimAudit(c.id);
            const rawEvents = auditRes?.audit_trail || [];
            results[c.id] = rawEvents.map(ev => mapBackendAuditEvent(ev, c.id));
          } catch {
            results[c.id] = [];
          }
        })
      );

      setEventsByClaim(results);
    } catch (err: any) {
      console.warn('[PatientActivityScreen] Error fetching audit trail:', err?.message || err);
      setError(err?.message || 'Failed to fetch audit events from server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [claims, loadClaims]);

  useEffect(() => {
    fetchAllAuditLogs();
  }, [claims.length, fetchAllAuditLogs]);

  // Combine and sort events
  const allEventsCombined = useMemo(() => {
    const combined: TimelineEvent[] = [];
    Object.values(eventsByClaim).forEach(list => {
      combined.push(...list);
    });

    // Deduplicate by event id if present
    const seen = new Set<string>();
    const deduped: TimelineEvent[] = [];
    combined.forEach(e => {
      const key = e.id ? e.id : `${e.claimId}-${e.day}-${e.t}-${e.ev}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(e);
      }
    });

    // Strict chronological sort (newest first)
    deduped.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    return deduped;
  }, [eventsByClaim]);

  // Filter events by selected claim and category
  const filteredEvents = useMemo(() => {
    let list = allEventsCombined;

    // Filter by specific claim if not 'all'
    if (selectedClaimFilter !== 'all') {
      list = list.filter(e => e.claimId === selectedClaimFilter || e.claimId.toLowerCase().startsWith(selectedClaimFilter.toLowerCase()));
    }

    // Filter by category
    if (activeCategoryFilter !== 'all') {
      list = list.filter(e => e.cat === activeCategoryFilter);
    }

    return list;
  }, [allEventsCombined, selectedClaimFilter, activeCategoryFilter]);

  // Group filtered events by day header preserving chronological order
  const dayGroups: TimelineDayGroup[] = useMemo(() => {
    const groups: TimelineDayGroup[] = [];
    const groupMap = new Map<string, TimelineEvent[]>();

    filteredEvents.forEach(e => {
      if (!groupMap.has(e.day)) {
        groupMap.set(e.day, []);
        groups.push({ day: e.day, items: groupMap.get(e.day)! });
      }
      groupMap.get(e.day)!.push(e);
    });

    return groups;
  }, [filteredEvents]);

  // Total count for current filter
  const totalEventsCount = filteredEvents.length;

  // Selected claim object (if a specific claim is selected)
  const currentClaimObj = claims.find(c => c.id === selectedClaimFilter);
  const displayPatientName = currentClaimObj?.who && currentClaimObj.who !== 'Sample' ? currentClaimObj.who : userName;
  const displayPolicyNo = currentClaimObj?.policyNo || policyNumber || 'P-0007000';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* App Bar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color={colors.ink} />
        </TouchableOpacity>

        <View style={styles.appBarCenter}>
          <Text style={[styles.appBarTitle, { color: colors.ink }]}>Patient activity</Text>
          <Text style={[styles.appBarSub, { color: colors.muted }]} numberOfLines={1}>
            {selectedClaimFilter === 'all'
              ? `All claims (${claims.length})`
              : `Claim ${selectedClaimFilter.slice(0, 8)}`}
          </Text>
        </View>

        <View style={[styles.countPill, { backgroundColor: colors.brandSoft }]}>
          <Text style={[styles.countPillText, { color: colors.brandDark }]}>
            {totalEventsCount} events
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollInner}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAllAuditLogs(true)}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
      >
        {/* Patient Profile Card (without nested claim selector) */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <UserAvatar size={44} name={displayPatientName} gender={gender} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.patientTitle, { color: colors.ink }]} numberOfLines={1}>
                  {displayPatientName}
                </Text>
                <ShieldCheck size={15} color={colors.green} />
              </View>
              <Text style={[styles.patientSub, { color: colors.muted }]}>
                {displayPolicyNo ? `Policy ${displayPolicyNo} · ` : ''}{userEmail}
              </Text>
            </View>
          </View>
        </View>

        {/* Claim Selector Row with 'All' option */}
        <View style={styles.claimPickerRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.claimChipsScroll}
          >
            {/* 'All' Option */}
            <TouchableOpacity
              style={[
                styles.claimChip,
                {
                  backgroundColor: selectedClaimFilter === 'all' ? colors.brandSoft : colors.surface,
                  borderColor: selectedClaimFilter === 'all' ? colors.brand : colors.line,
                },
              ]}
              onPress={() => setSelectedClaimFilter('all')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.claimChipText,
                  {
                    color: selectedClaimFilter === 'all' ? colors.brandDark : colors.ink,
                    fontWeight: selectedClaimFilter === 'all' ? '700' : '500',
                  },
                ]}
              >
                All
              </Text>
              {allEventsCombined.length > 0 && (
                <View
                  style={[
                    styles.miniBadge,
                    { backgroundColor: selectedClaimFilter === 'all' ? colors.brand : colors.surface2 },
                  ]}
                >
                  <Text
                    style={[
                      styles.miniBadgeText,
                      { color: selectedClaimFilter === 'all' ? '#ffffff' : colors.muted },
                    ]}
                  >
                    {allEventsCombined.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Individual Claim Pills */}
            {claims.map(c => {
              const isSelected = selectedClaimFilter === c.id;
              const shortId = c.id.slice(0, 8);
              const amtStr = c.amt ? `₹${Number(c.amt).toLocaleString('en-IN')}` : '';
              const countForThisClaim = eventsByClaim[c.id]?.length || 0;

              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.claimChip,
                    {
                      backgroundColor: isSelected ? colors.brandSoft : colors.surface,
                      borderColor: isSelected ? colors.brand : colors.line,
                    },
                  ]}
                  onPress={() => setSelectedClaimFilter(c.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.claimChipText,
                      {
                        color: isSelected ? colors.brandDark : colors.ink,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {shortId}
                  </Text>
                  {amtStr ? (
                    <Text
                      style={[
                        styles.claimChipAmt,
                        { color: isSelected ? colors.brandDark : colors.muted },
                      ]}
                    >
                      {amtStr}
                    </Text>
                  ) : null}
                  {countForThisClaim > 0 && (
                    <View
                      style={[
                        styles.miniBadge,
                        { backgroundColor: isSelected ? colors.brand : colors.surface2 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.miniBadgeText,
                          { color: isSelected ? '#ffffff' : colors.muted },
                        ]}
                      >
                        {countForThisClaim}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsScroll}
        >
          {(['all', 'upload', 'pipeline', 'review', 'submission', 'chat'] as const).map(f => {
            const isSel = activeCategoryFilter === f;
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
                  styles.categoryChip,
                  {
                    backgroundColor: isSel ? colors.brandSoft : colors.surface,
                    borderColor: isSel ? colors.brand : colors.line,
                  },
                ]}
                onPress={() => setActiveCategoryFilter(f)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color: isSel ? colors.brandDark : colors.ink,
                      fontWeight: isSel ? '700' : '500',
                    },
                  ]}
                >
                  {labels[f]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Loading Spinner */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.brand} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Loading live audit records from server...
            </Text>
          </View>
        )}

        {/* Error Banner */}
        {!loading && error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.surface, borderColor: colors.red }]}>
            <AlertCircle size={18} color={colors.red} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.errorTitle, { color: colors.red }]}>Failed to load audit events</Text>
              <Text style={[styles.errorText, { color: colors.muted }]}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => fetchAllAuditLogs(true)}
              >
                <RefreshCw size={13} color={colors.brandDark} />
                <Text style={[styles.retryBtnText, { color: colors.brandDark }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && dayGroups.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Clock size={36} color={colors.brand} style={{ marginBottom: 12, opacity: 0.8 }} />
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>No Activity Events</Text>
            <Text style={[styles.emptySub, { color: colors.muted }]}>
              {selectedClaimFilter === 'all'
                ? 'No audit events found across your claims. All mutations, uploads, validations, and reviews will appear here live.'
                : `No recorded audit logs found for Claim ${selectedClaimFilter.slice(0, 8)}.`}
            </Text>
            <TouchableOpacity
              style={[styles.refreshActionBtn, { backgroundColor: colors.brandSoft }]}
              onPress={() => fetchAllAuditLogs(true)}
            >
              <RefreshCw size={14} color={colors.brandDark} />
              <Text style={[styles.refreshActionBtnText, { color: colors.brandDark }]}>Refresh Live Data</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Real Timeline Rendered by Day */}
        {!loading &&
          dayGroups.map(group => {
            return (
              <View key={group.day} style={styles.dayBlock}>
                {/* Day Header */}
                <Text style={[styles.dayHeaderTitle, { color: colors.muted }]}>
                  {group.day}
                </Text>

                {/* Day Items */}
                {group.items.map((item, idx) => {
                  const diffKey = `${group.day}-${item.claimId}-${item.t}-${item.ev}-${idx}`;
                  const isDiffOpen = openDiffIdx === diffKey;

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

                  return (
                    <View key={diffKey} style={styles.timelineRow}>
                      {/* Left Rail & Dot */}
                      <View style={styles.railContainer}>
                        <View style={[styles.dot, { backgroundColor: dotColor, borderColor: colors.bg }]} />
                        {idx < group.items.length - 1 && (
                          <View style={[styles.rail, { backgroundColor: colors.line }]} />
                        )}
                      </View>

                      {/* Right Event Card */}
                      <TouchableOpacity
                        style={[
                          styles.eventCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.line,
                          },
                        ]}
                        onPress={() => {
                          if (item.diff) {
                            setOpenDiffIdx(isDiffOpen ? null : diffKey);
                          } else if (item.nav) {
                            navigation.navigate(item.nav, {
                              claimId: item.claimId,
                              docKey: item.arg,
                            });
                          }
                        }}
                        activeOpacity={item.diff || item.nav ? 0.7 : 1}
                      >
                        {/* Header: Action name, optional Claim tag in 'All' view, and actor */}
                        <View style={styles.eventHeaderRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                            <Text style={[styles.evCode, { color: colors.brandDark }]} numberOfLines={1}>
                              {item.ev}
                            </Text>
                            {selectedClaimFilter === 'all' && (
                              <View style={[styles.claimBadge, { backgroundColor: colors.surface2 }]}>
                                <Text style={[styles.claimBadgeText, { color: colors.muted }]}>
                                  {item.shortClaimId}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.whoText, { color: colors.muted }]}>{item.who}</Text>
                        </View>

                        {/* Description */}
                        <Text style={[styles.descText, { color: colors.ink }]}>{item.d}</Text>

                        {/* Footer: Time and Action / Nav Prompt */}
                        <View style={styles.eventFooterRow}>
                          <Text style={[styles.timeText, { color: colors.muted }]}>
                            {item.t}
                            {item.diff ? ' · tap for before / after' : ''}
                          </Text>
                          {item.nav && (
                            <View style={styles.viewDetailsRow}>
                              <Text style={[styles.viewDetailsText, { color: colors.brandDark }]}>View details</Text>
                              <ChevronRight size={13} color={colors.brandDark} />
                            </View>
                          )}
                        </View>

                        {/* Expandable Before / After Diff */}
                        {isDiffOpen && item.diff && (
                          <View style={[styles.diffBox, { borderTopColor: colors.line2 }]}>
                            <Text style={[styles.diffLabel, { color: colors.muted }]}>BEFORE</Text>
                            <Text style={[styles.diffBefore, { color: colors.red }]}>{item.diff[0]}</Text>
                            <Text style={[styles.diffLabel, { color: colors.muted }]}>AFTER</Text>
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

        {/* Footer Info Banner */}
        <View style={[styles.footerBanner, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Info size={16} color={colors.muted} style={{ marginTop: 2 }} />
          <Text style={[styles.footerBannerText, { color: colors.muted }]}>
            Activity logs are pulled live from the audit service (/submission/claims/id/audit) ensuring strict HIPAA compliance and tamper-proof tracking.
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
    paddingHorizontal: 13,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  appBarCenter: { flex: 1, marginHorizontal: 10 },
  appBarTitle: { fontSize: 16, fontWeight: '700' },
  appBarSub: { fontSize: 11, marginTop: 1 },
  countPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  countPillText: { fontSize: 11, fontWeight: '700' },
  content: { flex: 1 },
  scrollInner: { padding: 13, paddingBottom: 32 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    marginBottom: 10,
  },
  patientTitle: { fontSize: 15, fontWeight: '700' },
  patientSub: { fontSize: 11.5, marginTop: 2 },
  claimPickerRow: {
    marginBottom: 8,
  },
  claimChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 2,
  },
  claimChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  claimChipText: { fontSize: 12 },
  claimChipAmt: { fontSize: 11 },
  miniBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  miniBadgeText: { fontSize: 10, fontWeight: '700' },
  categoryChipsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 4,
    marginBottom: 8,
  },
  categoryChip: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 99,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 11.5 },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: { fontSize: 12 },
  errorBanner: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  errorTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  errorText: { fontSize: 11.5, lineHeight: 16 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  retryBtnText: { fontSize: 12, fontWeight: '600' },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginVertical: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 12.5, textAlign: 'center', lineHeight: 18, marginBottom: 14 },
  refreshActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  refreshActionBtnText: { fontSize: 12, fontWeight: '600' },
  dayBlock: { marginTop: 10 },
  dayHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
    position: 'relative',
    marginBottom: 10,
  },
  railContainer: {
    width: 14,
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 14,
    zIndex: 1,
  },
  rail: {
    position: 'absolute',
    left: 6,
    top: 26,
    bottom: -10,
    width: 2,
  },
  eventCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1,
    padding: 11,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    fontWeight: '700',
  },
  claimBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  claimBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  whoText: { fontSize: 10.5 },
  descText: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  eventFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  timeText: { fontSize: 10.5 },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: { fontSize: 11, fontWeight: '600' },
  diffBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  diffLabel: {
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
    marginBottom: 2,
  },
  diffBefore: {
    fontSize: 11.5,
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  diffAfter: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  footerBanner: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  footerBannerText: { flex: 1, fontSize: 11.5, lineHeight: 16 },
});
