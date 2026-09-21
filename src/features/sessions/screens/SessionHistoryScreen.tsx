import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare, Clock, ChevronRight, History } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { Routes } from '../../../app/navigation/routes';

const SESSIONS = [
  { id: 's-9f1e', title: 'Risk review · claim a4f1c9e2', when: 'Today 09:18', count: 4 },
  { id: 's-7c02', title: 'Submission · claim 7b03d15a', when: '3 May', count: 2 },
  { id: 's-2ab8', title: 'General · IRDAI form questions', when: '28 Apr', count: 2 },
];

export const SessionHistoryScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Dynamic App Bar */}
        <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
          <View style={styles.titleRow}>
            <View style={[styles.headerIconWrap, { backgroundColor: colors.brandSoft }]}>
              <History size={18} color={colors.brandDark} />
            </View>
            <Text style={[styles.title, { color: colors.ink }]}>Conversation History</Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: colors.brandSoft }]}>
            <Text style={[styles.countBadgeText, { color: colors.brandDark }]}>
              {SESSIONS.length} {SESSIONS.length === 1 ? 'session' : 'sessions'}
            </Text>
          </View>
        </View>

        {/* Sessions List */}
        <FlatList
          data={SESSIONS}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 24, 40) },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.sessionCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => navigation.navigate(Routes.ChatTab)}
              activeOpacity={0.7}
            >
              <View style={[styles.sessionIconWrap, { backgroundColor: colors.brandSoft }]}>
                <MessageSquare size={17} color={colors.brandDark} />
              </View>

              <View style={styles.sessionBody}>
                <Text style={[styles.sessionTitle, { color: colors.ink }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.metaRow}>
                  <Clock size={12} color={colors.muted} style={{ marginRight: 4 }} />
                  <Text style={[styles.sessionMeta, { color: colors.muted }]}>
                    {item.when} · {item.count} messages
                  </Text>
                  <View style={[styles.idBadge, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                    <Text style={[styles.idBadgeText, { color: colors.muted }]}>{item.id}</Text>
                  </View>
                </View>
              </View>

              <ChevronRight size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        />
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
    height: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: 14,
    gap: 10,
  },
  sessionCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  sessionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionBody: {
    flex: 1,
    minWidth: 0,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionMeta: {
    fontSize: 11.5,
    marginRight: 8,
  },
  idBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  idBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});
