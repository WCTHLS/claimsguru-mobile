import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';

const SESSIONS = [
  { id: 's-9f1e', title: 'Risk review · claim a4f1c9e2', when: 'Today 09:18', count: 4 },
  { id: 's-7c02', title: 'Submission · claim 7b03d15a', when: '3 May', count: 2 },
  { id: 's-2ab8', title: 'General · IRDAI form questions', when: '28 Apr', count: 2 },
];

export const SessionHistoryScreen = ({ navigation }: any) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <Text style={[styles.title, { color: colors.ink }]}>Conversation History</Text>
      </View>

      <FlatList
        data={SESSIONS}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 14, gap: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.sessionCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
            onPress={() => navigation.navigate('ChatTab')}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.sessionTitle, { color: colors.ink }]}>{item.title}</Text>
              <Text style={[styles.sessionMeta, { color: colors.muted }]}>
                {item.when} · {item.count} messages · {item.id}
              </Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 16 }}>›</Text>
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
  sessionCard: { flexDirection: 'row', padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  sessionTitle: { fontSize: 13.5, fontWeight: '700' },
  sessionMeta: { fontSize: 11.5, marginTop: 3 },
});
