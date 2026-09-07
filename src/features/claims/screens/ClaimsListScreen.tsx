import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { formatINR } from '../../../core/utils/currency';

export const ClaimsListScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { claims, selectedClaimId, selectClaim, indexClaim } = useClaimsStore();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* App Bar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <Text style={[styles.title, { color: colors.ink }]}>Claims</Text>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.kpiVal, { color: colors.ink }]}>{claims.length}</Text>
          <Text style={[styles.kpiLabel, { color: colors.muted }]}>Total Claims</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.kpiVal, { color: colors.amber }]}>
            {claims.filter(c => c.status === 'running').length}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.muted }]}>In Pipeline</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.kpiVal, { color: colors.red }]}>
            {claims.filter(c => c.status === 'FAILED').length}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.muted }]}>FAILED</Text>
        </View>
      </View>

      {/* Claims List */}
      <FlatList
        data={claims}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.claimItem,
              { backgroundColor: colors.surface, borderColor: colors.line },
              selectedClaimId === item.id && { borderColor: colors.brand, borderWidth: 1.5 },
            ]}
            onPress={() => {
              selectClaim(item.id);
              navigation.navigate('BrainPreview', { claimId: item.id });
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.claimWho, { color: colors.ink }]}>
                {item.who} · {item.dept}
              </Text>
              <Text style={[styles.claimSub, { color: colors.muted }]}>
                {item.id.slice(0, 8)} · {formatINR(item.amt)} · step: {item.step}
              </Text>
            </View>

            <View style={styles.badgeContainer}>
              <View
                style={[
                  styles.pill,
                  {
                    backgroundColor:
                      item.status === 'complete'
                        ? colors.greenSoft
                        : item.status === 'FAILED'
                        ? colors.redSoft
                        : colors.amberSoft,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    {
                      color:
                        item.status === 'complete'
                          ? colors.green
                          : item.status === 'FAILED'
                          ? colors.red
                          : colors.amber,
                    },
                  ]}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  kpiRow: { flexDirection: 'row', padding: 12, gap: 8 },
  kpiCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  kpiVal: { fontSize: 18, fontWeight: '700' },
  kpiLabel: { fontSize: 10.5, marginTop: 2 },
  listContent: { padding: 12, gap: 10 },
  claimItem: { flexDirection: 'row', padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  claimWho: { fontSize: 14, fontWeight: '700' },
  claimSub: { fontSize: 11.5, marginTop: 3 },
  badgeContainer: { marginLeft: 10 },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  pillText: { fontSize: 10.5, fontWeight: '700' },
});
