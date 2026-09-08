import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search as SearchIcon,
  X as XIcon,
  Sparkles,
  FileText,
  ChevronRight,
  Clock,
  Scan,
  Receipt,
  User,
  Activity,
  ArrowRight,
  Filter,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { Routes } from '../../../app/navigation/routes';
import { formatINR } from '../../../core/utils/currency';

interface SearchDocItem {
  id: string;
  claimId: string;
  title: string;
  category: 'claims' | 'reports' | 'bills' | 'scans' | 'notes';
  categoryLabel: string;
  docType: string;
  date: string;
  patient: string;
  snippet: string;
  score: number; // 0 to 1
  route: string;
  params?: Record<string, any>;
  tags: string[];
}

const CORPUS_DATA: SearchDocItem[] = [
  {
    id: 's-1',
    claimId: 'a4f1c9e2',
    title: 'Discharge Summary · Cardiology',
    category: 'reports',
    categoryLabel: 'Discharge Summary',
    docType: 'PDF · 4 pages',
    date: '16 Aug 2026',
    patient: 'R. Menon (54M)',
    snippet: 'Patient admitted with acute chest pain; underwent primary PCI with drug-eluting stent to LAD. Post-procedure recovery in CCU was uneventful.',
    score: 0.94,
    route: Routes.OcrParsedFields,
    params: { claimId: 'a4f1c9e2' },
    tags: ['angioplasty', 'stent', 'lad', 'cardiology', 'pci', 'ccu', 'chest pain'],
  },
  {
    id: 's-2',
    claimId: 'a4f1c9e2',
    title: 'Hospital Final Bill & Breakdown',
    category: 'bills',
    categoryLabel: 'Hospital Bill',
    docType: 'JPG · 2 pages',
    date: '16 Aug 2026',
    patient: 'R. Menon (54M)',
    snippet: 'Itemised hospital tariff: OT charges ₹18,700, Drug-eluting stent ₹78,000, Cath-lab consumables ₹7,100, CCU room charges ₹32,000.',
    score: 0.89,
    route: Routes.ClaimDetail,
    params: { claimId: 'a4f1c9e2' },
    tags: ['charges', 'bill', 'ot', 'stent', 'consumables', 'tariff', 'angioplasty'],
  },
  {
    id: 's-3',
    claimId: 'a4f1c9e2',
    title: 'Cardiac MRI & Angiography Report',
    category: 'scans',
    categoryLabel: 'Radiology Scan',
    docType: 'PDF · 3 pages',
    date: '14 Aug 2026',
    patient: 'R. Menon (54M)',
    snippet: 'Regional wall motion abnormality observed with hypokinesia of anterior and anteroseptal walls. LVEF estimated at 42%. Linked ICD-10: I21.9, I50.9.',
    score: 0.86,
    route: Routes.ScanAnalyzer,
    params: { claimId: 'a4f1c9e2' },
    tags: ['mri', 'angiography', 'hypokinesia', 'lvef', 'scan', 'i21.9', 'i50.9'],
  },
  {
    id: 's-4',
    claimId: 'a4f1c9e2',
    title: 'AI Brain Verdict & Risk Assessment',
    category: 'claims',
    categoryLabel: 'AI Assessment',
    docType: 'Analysis · 11 Rules',
    date: '16 Aug 2026',
    patient: 'R. Menon (54M)',
    snippet: 'Overall rejection risk: 58% (Medium). 7 of 11 deterministic validation rules passed. R011 fraud signal cleared. Readiness score: 75%.',
    score: 0.91,
    route: Routes.BrainPreview,
    params: { claimId: 'a4f1c9e2' },
    tags: ['risk', 'brain', 'validation', 'fraud', 'readiness', 'rules', 'r011'],
  },
  {
    id: 's-5',
    claimId: '7b03d15a',
    title: 'Orthopaedic Arthroscopy Discharge Report',
    category: 'reports',
    categoryLabel: 'Discharge Summary',
    docType: 'PDF · 3 pages',
    date: '10 Aug 2026',
    patient: 'S. Iyer (42F)',
    snippet: 'Elective right knee arthroscopic partial meniscectomy performed under spinal anaesthesia. Mobilised with knee brace on post-op day 1.',
    score: 0.82,
    route: Routes.ClaimDetail,
    params: { claimId: '7b03d15a' },
    tags: ['orthopaedics', 'knee', 'arthroscopy', 'meniscus', 'iyer', 'anaesthesia'],
  },
  {
    id: 's-6',
    claimId: 'a4f1c9e2',
    title: '12-Lead ECG & Troponin-I Lab Test',
    category: 'reports',
    categoryLabel: 'Laboratory Report',
    docType: 'PDF · 1 page',
    date: '12 Aug 2026',
    patient: 'R. Menon (54M)',
    snippet: 'ST segment elevation in leads V1–V4. Serum Troponin-I elevated at 4.2 ng/mL indicating acute myocardial necrosis. CK-MB 48 U/L.',
    score: 0.79,
    route: Routes.DocumentGrid,
    params: { claimId: 'a4f1c9e2' },
    tags: ['ecg', 'troponin', 'lab', 'stemi', 'leads', 'ck-mb', 'necrosis'],
  },
  {
    id: 's-7',
    claimId: '3f8a1d6c',
    title: 'Laparoscopic Appendectomy Claim',
    category: 'claims',
    categoryLabel: 'Surgical Claim',
    docType: 'Active · Validated',
    date: '18 Aug 2026',
    patient: 'P. Nair (29M)',
    snippet: 'Acute appendicitis; laparoscopic surgical excision completed without intra-operative complication. Hospitalised for 2 days at Sunrise Multispecialty.',
    score: 0.74,
    route: Routes.ClaimDetail,
    params: { claimId: '3f8a1d6c' },
    tags: ['appendix', 'appendectomy', 'surgery', 'laparoscopy', 'nair', 'sunrise'],
  },
  {
    id: 's-8',
    claimId: 'a4f1c9e2',
    title: 'Pre-authorisation Approval Certificate',
    category: 'notes',
    categoryLabel: 'Insurance Document',
    docType: 'PDF · 2 pages',
    date: '12 Aug 2026',
    patient: 'R. Menon (54M)',
    snippet: 'Sample Health TPA initial cashless approval for ₹1,50,000 under policy SAMPLE-PH-77421. Final claim filed as reimbursement for balance ₹34,500.',
    score: 0.77,
    route: Routes.DocumentGrid,
    params: { claimId: 'a4f1c9e2' },
    tags: ['preauth', 'tpa', 'policy', 'cashless', 'approval', 'menon'],
  },
];

const SUGGESTED_QUERIES = [
  'angioplasty',
  'stent',
  'cardiology',
  'MRI scan',
  'R. Menon',
  'Discharge summary',
  'ICD I21.9',
  'Sunrise Multispecialty',
];

export const SearchScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { claims } = useClaimsStore();

  const [query, setQuery] = useState('angioplasty');
  const [mode, setMode] = useState<'text' | 'vector'>('text');
  const [activeCategory, setActiveCategory] = useState<'all' | 'claims' | 'reports' | 'bills' | 'scans'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'angioplasty',
    'R. Menon',
    'hospital bill',
  ]);

  const handleSelectSuggestion = (text: string) => {
    setQuery(text);
    if (!recentSearches.includes(text)) {
      setRecentSearches(prev => [text, ...prev.slice(0, 4)]);
    }
  };

  const handleClearQuery = () => {
    setQuery('');
  };

  // Combine static corpus with real-time claims store
  const fullCorpus = useMemo(() => {
    const claimsItems: SearchDocItem[] = claims.map(c => ({
      id: `claim-${c.id}`,
      claimId: c.id,
      title: `Claim: ${c.who} · ${c.dept}`,
      category: 'claims',
      categoryLabel: 'Active Claim',
      docType: `${c.claimType || 'Reimbursement'} · ${c.status}`,
      date: c.admissionDate || 'Aug 2026',
      patient: `${c.who} (${c.age || 50}${c.gender ? c.gender[0] : 'M'})`,
      snippet: `${c.diagnosis || 'Diagnosis recorded'} at ${c.hospital || 'Hospital'}. Treating doctor: ${c.doctor || 'Attending physician'}. Total claimed: ${formatINR(c.amt)}. Policy: ${c.policyNo || 'PH-77421'}.`,
      score: 0.95,
      route: Routes.ClaimDetail,
      params: { claimId: c.id },
      tags: [
        c.who.toLowerCase(),
        c.dept.toLowerCase(),
        (c.diagnosis || '').toLowerCase(),
        (c.hospital || '').toLowerCase(),
        (c.doctor || '').toLowerCase(),
        (c.policyNo || '').toLowerCase(),
      ],
    }));

    // Merge and deduplicate by id
    const map = new Map<string, SearchDocItem>();
    claimsItems.forEach(item => map.set(item.id, item));
    CORPUS_DATA.forEach(item => map.set(item.id, item));
    return Array.from(map.values());
  }, [claims]);

  // Filter and rank results
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    return fullCorpus
      .filter(item => {
        // Category filter
        if (activeCategory !== 'all' && item.category !== activeCategory) {
          return false;
        }

        // Query filter
        if (!q) return true;

        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSnippet = item.snippet.toLowerCase().includes(q);
        const matchPatient = item.patient.toLowerCase().includes(q);
        const matchTags = item.tags.some(t => t.includes(q));
        const matchClaimId = item.claimId.toLowerCase().includes(q);

        return matchTitle || matchSnippet || matchPatient || matchTags || matchClaimId;
      })
      .sort((a, b) => {
        if (mode === 'vector') {
          // Sort by similarity score in vector mode
          return b.score - a.score;
        }
        // In full-text mode: prioritize exact title matches first
        const aTitleMatch = a.title.toLowerCase().includes(q) ? 1 : 0;
        const bTitleMatch = b.title.toLowerCase().includes(q) ? 1 : 0;
        return bTitleMatch - aTitleMatch;
      });
  }, [fullCorpus, query, activeCategory, mode]);

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'claims':
        return <Activity size={15} color={colors.brandDark} />;
      case 'reports':
        return <FileText size={15} color={colors.brandDark} />;
      case 'bills':
        return <Receipt size={15} color={colors.amber} />;
      case 'scans':
        return <Scan size={15} color={colors.violet} />;
      default:
        return <FileText size={15} color={colors.muted} />;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* App Bar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <View style={styles.appBarHeaderRow}>
          <Text style={[styles.title, { color: colors.ink }]}>Search</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.brandSoft }]}>
            <Text style={[styles.countBadgeText, { color: colors.brandDark }]}>
              {filteredResults.length} matches
            </Text>
          </View>
        </View>

        {/* Search Mode Toggle */}
        <View style={[styles.modeToggleBar, { backgroundColor: colors.surface2 }]}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              mode === 'text' && [styles.modeBtnActive, { backgroundColor: colors.surface }],
            ]}
            onPress={() => setMode('text')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeBtnText,
                { color: mode === 'text' ? colors.brandDark : colors.muted },
              ]}
            >
              Full-text Search
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeBtn,
              mode === 'vector' && [styles.modeBtnActive, { backgroundColor: colors.surface }],
            ]}
            onPress={() => setMode('vector')}
            activeOpacity={0.7}
          >
            <View style={styles.vectorBtnContent}>
              <Sparkles size={13} color={mode === 'vector' ? colors.brandDark : colors.muted} />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: mode === 'vector' ? colors.brandDark : colors.muted },
                ]}
              >
                Semantic Vector
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Input Box */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
          <SearchIcon size={18} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={[styles.input, { color: colors.ink }]}
            placeholder="Search claims, OCR text, ICD-10, doctor…"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCapitalize="none"
            clearButtonMode="never"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClearQuery} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <XIcon size={16} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Horizontal Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {(
            [
              { id: 'all', label: 'All Results' },
              { id: 'claims', label: 'Claims' },
              { id: 'reports', label: 'Discharge Summaries' },
              { id: 'bills', label: 'Bills & Tariffs' },
              { id: 'scans', label: 'Radiology Scans' },
            ] as const
          ).map(cat => {
            const isSelected = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: isSelected ? colors.brandSoft : colors.surface,
                    borderColor: isSelected ? colors.brand : colors.line,
                  },
                ]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.catChipText,
                    {
                      color: isSelected ? colors.brandDark : colors.muted,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Quick Query Suggestions (when query is short) */}
        {query.length < 2 && (
          <View style={[styles.suggestionsBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.suggestionsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>Suggested Queries</Text>
              {recentSearches.length > 0 && (
                <TouchableOpacity onPress={() => setRecentSearches([])}>
                  <Text style={[styles.clearHistoryText, { color: colors.muted }]}>Clear history</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.chipsWrap}>
              {SUGGESTED_QUERIES.map(sug => (
                <TouchableOpacity
                  key={sug}
                  style={[styles.sugChip, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                  onPress={() => handleSelectSuggestion(sug)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sugChipText, { color: colors.ink }]}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Search Results List */}
        <FlatList
          data={filteredResults}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            query.length >= 2 ? (
              <View style={styles.resultsInfoRow}>
                <Text style={[styles.resultsInfoText, { color: colors.muted }]}>
                  {mode === 'vector' ? 'Vector similarity ranking' : 'Full-text matches'} for{' '}
                  <Text style={{ fontWeight: '700', color: colors.ink }}>"{query}"</Text>
                </Text>
                <Text style={[styles.timingText, { color: colors.muted }]}>18 ms</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <SearchIcon size={36} color={colors.muted} style={{ opacity: 0.6, marginBottom: 8 }} />
              <Text style={[styles.emptyTitle, { color: colors.ink }]}>No matching records found</Text>
              <Text style={[styles.emptySub, { color: colors.muted }]}>
                Try adjusting your search term or switch to Semantic Vector search mode for broader clinical matching.
              </Text>
              <View style={styles.emptySuggestionsRow}>
                {['angioplasty', 'cardiology', 'MRI'].map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.miniSugChip, { backgroundColor: colors.surface2 }]}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <Text style={[styles.miniSugText, { color: colors.brandDark }]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => {
                if (item.params) {
                  navigation.navigate(item.route as any, item.params);
                } else {
                  navigation.navigate(item.route as any);
                }
              }}
              activeOpacity={0.75}
            >
              {/* Card Header */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.surface2 }]}>
                    {renderCategoryIcon(item.category)}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.resultTitle, { color: colors.ink }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.docMeta, { color: colors.muted }]}>
                      {item.patient} · {item.docType} · {item.date}
                    </Text>
                  </View>
                </View>

                {mode === 'vector' ? (
                  <View style={[styles.scoreBadge, { backgroundColor: colors.brandSoft }]}>
                    <Sparkles size={11} color={colors.brandDark} />
                    <Text style={[styles.scoreBadgeText, { color: colors.brandDark }]}>
                      {Math.round(item.score * 100)}% match
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.categoryPill, { backgroundColor: colors.surface2 }]}>
                    <Text style={[styles.categoryPillText, { color: colors.muted }]}>
                      {item.categoryLabel}
                    </Text>
                  </View>
                )}
              </View>

              {/* Matched Snippet */}
              <Text style={[styles.resultSnippet, { color: colors.ink }]} numberOfLines={3}>
                {item.snippet}
              </Text>

              {/* Card Footer Actions */}
              <View style={[styles.cardFooter, { borderTopColor: colors.line2 }]}>
                <View style={styles.claimIdPill}>
                  <Text style={[styles.claimIdText, { color: colors.muted }]}>
                    Claim {item.claimId.slice(0, 8)}
                  </Text>
                </View>

                <View style={styles.openLink}>
                  <Text style={[styles.openLinkText, { color: colors.brandDark }]}>Open record</Text>
                  <ChevronRight size={14} color={colors.brandDark} />
                </View>
              </View>
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
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  appBarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modeToggleBar: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    marginBottom: 10,
    gap: 3,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  modeBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  vectorBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  categoryScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 11.5,
  },
  suggestionsBox: {
    margin: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  clearHistoryText: {
    fontSize: 11,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sugChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  sugChipText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  listContent: {
    padding: 12,
    paddingBottom: 28,
    gap: 10,
  },
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  resultsInfoText: {
    fontSize: 11.5,
  },
  timingText: {
    fontSize: 10.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  resultCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
    marginRight: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  docMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scoreBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  categoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  resultSnippet: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  claimIdPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  claimIdText: {
    fontSize: 10.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  openLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  openLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  emptySuggestionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniSugChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  miniSugText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
