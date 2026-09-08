import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { usePipelineStore } from '../../../state/usePipelineStore';
import { formatINR } from '../../../core/utils/currency';
import { FileText, Search, Plus } from 'lucide-react-native';
import { Routes } from '../../../app/navigation/routes';

export const ClaimsListScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { claims, selectClaim, loadClaims, refreshing, backendConnected } = useClaimsStore();
  const { running: pipelineRunning, claimId: pipelineClaimId } = usePipelineStore();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Running' | 'FAILED' | 'Needs index'>('All');

  useEffect(() => {
    loadClaims();
  }, []);

  const totalCount = claims.length;
  const inPipelineCount = claims.filter(c => c.status === 'running').length;
  const failedCount = claims.filter(c => c.status === 'FAILED').length;
  const indexedCount = claims.filter(c => c.indexed).length;

  const filteredClaims = claims.filter(c => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Running') return c.status === 'running';
    if (activeFilter === 'FAILED') return c.status === 'FAILED';
    if (activeFilter === 'Needs index') return !c.indexed;
    return true;
  });

  const handleClaimPress = (claim: (typeof claims)[0]) => {
    selectClaim(claim.id);
    if (claim.status === 'running' && pipelineRunning && pipelineClaimId === claim.id) {
      navigation.navigate(Routes.WorkflowPipeline);
    } else {
      navigation.navigate(Routes.ClaimDetail, { claimId: claim.id });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return {
          bg: colors.amberSoft,
          text: colors.amber,
          label: 'COMPLETE',
        };
      case 'submitted':
        return {
          bg: colors.greenSoft,
          text: colors.green,
          label: 'SUBMITTED',
        };
      case 'running':
        return {
          bg: colors.brandSoft,
          text: colors.brandDark,
          label: 'RUNNING',
        };
      case 'FAILED':
      default:
        return {
          bg: colors.redSoft,
          text: colors.red,
          label: 'FAILED',
        };
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top App Bar matching Screen 5 */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => navigation.navigate(Routes.ProfileSettings)}
          activeOpacity={0.7}
        >
          <View style={[styles.avatar, { backgroundColor: colors.brandSoft }]}>
            <Text style={[styles.avatarText, { color: colors.brandDark }]}>SA</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.ink }]}>Claims</Text>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate(Routes.SearchTab)}
          activeOpacity={0.7}
        >
          <Search size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadClaims(true)}
              tintColor={colors.brand}
              colors={[colors.brand]}
            />
          }
        >
          {/* 2x2 KPI Grid */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <Text style={[styles.kpiVal, { color: colors.ink }]}>{totalCount}</Text>
                <Text style={[styles.kpiLabel, { color: colors.muted }]}>Claims</Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <Text style={[styles.kpiVal, { color: colors.ink }]}>{inPipelineCount}</Text>
                <Text style={[styles.kpiLabel, { color: colors.muted }]}>In pipeline</Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <Text style={[styles.kpiVal, { color: colors.red }]}>{failedCount}</Text>
                <Text style={[styles.kpiLabel, { color: colors.muted }]}>FAILED</Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <Text style={[styles.kpiVal, { color: colors.ink }]}>{indexedCount}</Text>
                <Text style={[styles.kpiLabel, { color: colors.muted }]}>Indexed for search</Text>
              </View>
            </View>
          </View>

          {/* Filter Chips */}
          <View style={styles.chipsRow}>
            {(['All', 'Running', 'FAILED', 'Needs index'] as const).map(filter => {
              const isSelected = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.brandSoft : colors.surface,
                      borderColor: isSelected ? colors.brand : colors.line,
                    },
                  ]}
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
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Claims Card List */}
          <View style={[styles.cardList, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {filteredClaims.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>No claims match.</Text>
              </View>
            ) : (
              filteredClaims.map((claim, index) => {
                const badge = getStatusBadge(claim.status);
                const isLast = index === filteredClaims.length - 1;
                const shortId = claim.id.slice(0, 8);

                return (
                  <TouchableOpacity
                    key={claim.id}
                    style={[
                      styles.claimRow,
                      !isLast && { borderBottomWidth: 1, borderBottomColor: colors.line2 },
                    ]}
                    onPress={() => handleClaimPress(claim)}
                    activeOpacity={0.65}
                  >
                    <View style={[styles.thumb, { backgroundColor: colors.brandSoft }]}>
                      <FileText size={18} color={colors.brandDark} />
                    </View>

                    <View style={styles.claimInfo}>
                      <Text style={[styles.claimWho, { color: colors.ink }]} numberOfLines={1}>
                        {claim.who} · {claim.dept}
                      </Text>
                      <Text style={[styles.claimMeta, { color: colors.muted }]} numberOfLines={1}>
                        <Text style={styles.mono}>{shortId}</Text>
                        {' · '}
                        {claim.amt ? formatINR(claim.amt) : 'amount pending'}
                        {' · step: '}
                        <Text style={styles.mono}>{claim.step}</Text>
                        {!claim.indexed && (
                          <Text style={{ color: colors.amber }}> · not indexed</Text>
                        )}
                      </Text>
                    </View>

                    <View style={[styles.pillBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.pillText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Note from prototype */}
          <Text style={[styles.disclaimerNote, { color: colors.muted }]}>
            Only <Text style={styles.mono}>FAILED</Text> is a verified status literal; other labels are placeholders. <Text style={styles.mono}>current_step</Text> is real.
          </Text>
        </ScrollView>

        {/* Floating Action Button (+) */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.brand }]}
          onPress={() => navigation.navigate(Routes.UploadPanel)}
          activeOpacity={0.85}
        >
          <Plus size={26} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>
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
  avatarBtn: {
    padding: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 13,
    paddingBottom: 90,
  },
  kpiGrid: {
    gap: 9,
    marginBottom: 11,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 9,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  kpiVal: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  kpiLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
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
  cardList: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  claimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 13,
    gap: 11,
  },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimInfo: {
    flex: 1,
    minWidth: 0,
  },
  claimWho: {
    fontSize: 13,
    fontWeight: '600',
  },
  claimMeta: {
    fontSize: 11.5,
    marginTop: 2.5,
  },
  mono: {
    fontFamily: 'monospace',
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 99,
    alignSelf: 'center',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
  disclaimerNote: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 8,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
