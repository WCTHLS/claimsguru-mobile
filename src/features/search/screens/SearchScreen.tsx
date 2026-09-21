import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Platform,
  Keyboard,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search as SearchIcon,
  X as XIcon,
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

export const SearchScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { claims, loadClaims, loading, refreshing, claimPreviews, fetchClaimPreview } = useClaimsStore();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'claims' | 'reports' | 'bills' | 'scans'>('all');

  useEffect(() => {
    loadClaims();
  }, []);

  useEffect(() => {
    if (claims.length > 0) {
      claims.forEach(c => {
        if (!claimPreviews[c.id]) {
          fetchClaimPreview(c.id).catch(() => {});
        }
      });
    }
  }, [claims, claimPreviews]);

  const handleSearch = () => {
    Keyboard.dismiss();
  };

  const handleClearQuery = () => {
    setQuery('');
  };

  // Generate real search corpus from live backend claims and fetched documents
  const fullCorpus = useMemo(() => {
    const items: SearchDocItem[] = [];

    claims.forEach(c => {
      const preview = claimPreviews[c.id];
      const patientDisplay = c.who ? `${c.who}${c.age ? ` (${c.age}${c.gender ? c.gender[0] : ''})` : ''}` : 'Patient';

      // 1. Primary claim record
      items.push({
        id: `claim-${c.id}`,
        claimId: c.id,
        title: `Claim: ${c.who || 'Claim'} · ${c.dept || 'Medical'}`,
        category: 'claims',
        categoryLabel: 'Active Claim',
        docType: `${c.claimType || 'Reimbursement'} · ${c.status}`,
        date: c.admissionDate || c.dischargeDate || 'Recent',
        patient: patientDisplay,
        snippet: `${c.diagnosis || 'Diagnosis'} at ${c.hospital || 'Hospital'}. Treating doctor: ${c.doctor || 'Attending physician'}. Amount: ${formatINR(c.amt)}. Policy: ${c.policyNo || '—'}.`,
        score: 0.95,
        route: Routes.ClaimDetail,
        params: { claimId: c.id },
        tags: [
          c.who,
          c.dept,
          c.diagnosis,
          c.hospital,
          c.doctor,
          c.policyNo,
          c.id,
          c.id.slice(0, 8),
          c.status,
          c.claimType,
        ].filter(Boolean).map(s => String(s).toLowerCase()),
      });

      // 2. Real documents attached to the claim
      if (preview?.documents && Array.isArray(preview.documents)) {
        preview.documents.forEach((doc, idx) => {
          const lowerName = (doc.file_name || '').toLowerCase();
          const lowerType = (doc.doc_type || '').toLowerCase();
          let cat: 'reports' | 'bills' | 'scans' | 'notes' = 'reports';
          let label = 'Medical Document';

          if (lowerName.includes('bill') || lowerName.includes('invoice') || lowerType.includes('bill')) {
            cat = 'bills';
            label = 'Hospital Bill';
          } else if (
            lowerName.includes('scan') ||
            lowerName.includes('mri') ||
            lowerName.includes('ct') ||
            lowerName.includes('xray') ||
            lowerName.includes('x-ray') ||
            lowerType.includes('scan')
          ) {
            cat = 'scans';
            label = 'Radiology Scan';
          } else if (lowerName.includes('discharge') || lowerType.includes('discharge')) {
            cat = 'reports';
            label = 'Discharge Summary';
          }

          items.push({
            id: `doc-${c.id}-${doc.id || idx}`,
            claimId: c.id,
            title: doc.display_title || doc.file_name || `Document #${idx + 1}`,
            category: cat,
            categoryLabel: label,
            docType: doc.doc_type || (doc.file_name?.includes('.') ? doc.file_name.split('.').pop()?.toUpperCase() || 'FILE' : 'PDF'),
            date: c.admissionDate || c.dischargeDate || 'Recent',
            patient: patientDisplay,
            snippet: doc.ocr_text
              ? doc.ocr_text.slice(0, 160).replace(/\s+/g, ' ') + '…'
              : `Attached file ${doc.file_name || 'document'} for claim #${c.id.slice(0, 8)}.`,
            score: 0.9,
            route: Routes.ClaimDetail,
            params: { claimId: c.id },
            tags: [
              doc.file_name,
              doc.display_title,
              doc.doc_type,
              c.who,
              c.hospital,
              c.doctor,
              c.diagnosis,
              c.id,
            ].filter(Boolean).map(s => String(s).toLowerCase()),
          });
        });
      }

      // 3. Real ICD codes if available
      if (preview?.icd_codes && Array.isArray(preview.icd_codes)) {
        preview.icd_codes.forEach((code, idx) => {
          items.push({
            id: `icd-${c.id}-${code.code}-${idx}`,
            claimId: c.id,
            title: `ICD-10: ${code.code} · ${code.description}`,
            category: 'reports',
            categoryLabel: 'Diagnostic Code',
            docType: 'ICD-10',
            date: c.admissionDate || 'Recent',
            patient: patientDisplay,
            snippet: `Medical diagnosis code ${code.code}: ${code.description}. Associated with ${c.who}'s claim #${c.id.slice(0, 8)}.`,
            score: 0.88,
            route: Routes.ClaimDetail,
            params: { claimId: c.id },
            tags: [
              code.code,
              code.description,
              c.who,
              c.hospital,
              c.id,
            ].filter(Boolean).map(s => String(s).toLowerCase()),
          });
        });
      }

      // 4. Real Expenses if available
      if (preview?.expenses && Array.isArray(preview.expenses)) {
        preview.expenses.forEach((exp, idx) => {
          items.push({
            id: `exp-${c.id}-${idx}`,
            claimId: c.id,
            title: `Expense: ${exp.category} (${formatINR(exp.amount)})`,
            category: 'bills',
            categoryLabel: 'Itemised Tariff',
            docType: 'Expense Breakdown',
            date: c.admissionDate || 'Recent',
            patient: patientDisplay,
            snippet: `${exp.description || exp.category}: ${formatINR(exp.amount)} charged at ${c.hospital || 'Hospital'}. Claim #${c.id.slice(0, 8)}.`,
            score: 0.85,
            route: Routes.ClaimDetail,
            params: { claimId: c.id },
            tags: [
              exp.category,
              exp.description,
              c.who,
              c.hospital,
              c.id,
            ].filter(Boolean).map(s => String(s).toLowerCase()),
          });
        });
      }
    });

    return items;
  }, [claims, claimPreviews]);

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
        if (!q) return 0;
        const aTitleMatch = a.title.toLowerCase().includes(q) ? 1 : 0;
        const bTitleMatch = b.title.toLowerCase().includes(q) ? 1 : 0;
        return bTitleMatch - aTitleMatch;
      });
  }, [fullCorpus, query, activeCategory]);

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
              {filteredResults.length} {filteredResults.length === 1 ? 'record' : 'records'}
            </Text>
          </View>
        </View>

        {/* Search Input Row with 1 Text Field & Search Button */}
        <View style={styles.searchBarRow}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
            <SearchIcon size={18} color={colors.muted} style={styles.searchIcon} />
            <TextInput
              style={[styles.input, { color: colors.ink }]}
              placeholder="Search claims, OCR text, ICD-10, doctor…"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
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
          <TouchableOpacity
            style={[styles.searchBtn, { backgroundColor: colors.brand }]}
            onPress={handleSearch}
            activeOpacity={0.8}
          >
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
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
        {/* Search Results List */}
        <FlatList
          data={filteredResults}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadClaims(true)}
              tintColor={colors.brand}
              colors={[colors.brand]}
            />
          }
          ListHeaderComponent={
            query.length >= 2 ? (
              <View style={styles.resultsInfoRow}>
                <Text style={[styles.resultsInfoText, { color: colors.muted }]}>
                  Results for{' '}
                  <Text style={{ fontWeight: '700', color: colors.ink }}>"{query}"</Text>
                </Text>
                <Text style={[styles.timingText, { color: colors.muted }]}>
                  {filteredResults.length} found
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              {loading && claims.length === 0 ? (
                <>
                  <ActivityIndicator size="large" color={colors.brand} style={{ marginBottom: 12 }} />
                  <Text style={[styles.emptyTitle, { color: colors.ink }]}>Loading claims…</Text>
                  <Text style={[styles.emptySub, { color: colors.muted }]}>
                    Fetching real claims from ClaimsGuru backend
                  </Text>
                </>
              ) : (
                <>
                  <SearchIcon size={36} color={colors.muted} style={{ opacity: 0.6, marginBottom: 8 }} />
                  <Text style={[styles.emptyTitle, { color: colors.ink }]}>
                    {query.trim() ? 'No matching records found' : 'No claims available'}
                  </Text>
                  <Text style={[styles.emptySub, { color: colors.muted }]}>
                    {query.trim()
                      ? `No claims or documents match "${query.trim()}". Try another keyword or clear search.`
                      : 'No claims found in your account. Upload claim documents in the Chat tab or pull down to refresh.'}
                  </Text>
                </>
              )}
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

                <View style={[styles.categoryPill, { backgroundColor: colors.surface2 }]}>
                  <Text style={[styles.categoryPillText, { color: colors.muted }]}>
                    {item.categoryLabel}
                  </Text>
                </View>
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
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchBtn: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 10,
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

});
