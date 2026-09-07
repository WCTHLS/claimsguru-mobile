import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';

const SEARCH_RESULTS = [
  { id: '1', title: 'Discharge summary · a4f1c9e2', snippet: '…primary PCI with drug-eluting stent to LAD…', score: '0.91' },
  { id: '2', title: 'Hospital bill · a4f1c9e2', snippet: '…OT charges for angioplasty procedure…', score: '0.84' },
  { id: '3', title: 'MRI report · a4f1c9e2', snippet: '…regional wall motion abnormality, anterior wall…', score: '0.77' },
];

export const SearchScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState('angioplasty');
  const [mode, setMode] = useState<'text' | 'vector'>('text');

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <Text style={[styles.title, { color: colors.ink }]}>Search Claims & Documents</Text>
      </View>

      <View style={styles.content}>
        {/* Mode Segment */}
        <View style={[styles.seg, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
          <TouchableOpacity
            style={[styles.segBtn, mode === 'text' && { backgroundColor: colors.surface }]}
            onPress={() => setMode('text')}
          >
            <Text style={[styles.segBtnText, { color: mode === 'text' ? colors.brandDark : colors.muted }]}>
              Full-text
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segBtn, mode === 'vector' && { backgroundColor: colors.surface }]}
            onPress={() => setMode('vector')}
          >
            <Text style={[styles.segBtnText, { color: mode === 'vector' ? colors.brandDark : colors.muted }]}>
              Semantic (FAISS)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.line, color: colors.ink }]}
          placeholder="e.g. angioplasty, stent, cardiology"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
        />

        {/* Results */}
        <FlatList
          data={SEARCH_RESULTS}
          keyExtractor={item => item.id}
          contentContainerStyle={{ gap: 10, marginTop: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => navigation.navigate('BrainPreview', { claimId: 'a4f1c9e2' })}
            >
              <Text style={[styles.resultTitle, { color: colors.ink }]}>{item.title}</Text>
              <Text style={[styles.resultSnippet, { color: colors.muted }]}>{item.snippet}</Text>
              {mode === 'vector' && (
                <View style={[styles.scorePill, { backgroundColor: colors.violetSoft }]}>
                  <Text style={[styles.scoreText, { color: colors.violet }]}>similarity {item.score}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  content: { padding: 14, flex: 1 },
  seg: { flexDirection: 'row', borderRadius: 10, padding: 3, borderWidth: 1, marginBottom: 12 },
  segBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segBtnText: { fontSize: 12.5, fontWeight: '700' },
  input: { height: 44, borderRadius: 11, paddingHorizontal: 14, borderWidth: 1, fontSize: 13.5 },
  resultCard: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 4 },
  resultTitle: { fontSize: 13.5, fontWeight: '700' },
  resultSnippet: { fontSize: 12 },
  scorePill: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  scoreText: { fontSize: 10.5, fontWeight: '700' },
});
