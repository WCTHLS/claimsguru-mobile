import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  LayoutGrid,
  List,
  Check,
  Download,
  Plus,
  ArrowRight,
  X,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { Routes } from '../../../app/navigation/routes';
import { INITIAL_DOCUMENTS, DocumentItem } from '../../../mocks/documents.mock';

export const DocumentGridScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const claimId = route?.params?.claimId || 'a4f1c9e2';

  const [docs, setDocs] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [selectedDocId, setSelectedDocId] = useState<string>(docs[0]?.id || 'doc-1');
  const [filter, setFilter] = useState<'All' | 'Bills' | 'Reports' | 'ID proof'>('All');
  const [isGridView, setIsGridView] = useState(true);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2600);
  };

  const filteredDocs = docs.filter(d => {
    if (filter === 'All') return true;
    return d.category === filter;
  });

  const selectedDoc = docs.find(d => d.id === selectedDocId) || docs[0];

  const handleConfirmDelete = () => {
    if (!docToDelete) return;
    const toRemove = docToDelete;
    setDocs(prev => prev.filter(d => d.id !== toRemove.id));
    if (selectedDocId === toRemove.id) {
      const remaining = docs.filter(d => d.id !== toRemove.id);
      if (remaining.length > 0) setSelectedDocId(remaining[0].id);
    }
    setDocToDelete(null);
    showToast(`Removed ${toRemove.name}`);
  };

  const handleOpenDoc = () => {
    if (!selectedDoc) return;
    navigation.navigate(Routes.OcrParsedFields, {
      claimId,
      docKey: selectedDoc.ocrDocKey,
    });
  };

  const handleDownload = () => {
    if (!selectedDoc) return;
    showToast(`Downloading ${selectedDoc.name}.${selectedDoc.format.toLowerCase()}…`);
  };

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
        <Text style={[styles.appBarTitle, { color: colors.ink }]}>Documents</Text>
        <TouchableOpacity
          style={styles.viewToggleBtn}
          onPress={() => setIsGridView(!isGridView)}
        >
          {isGridView ? (
            <List size={19} color={colors.ink} />
          ) : (
            <LayoutGrid size={19} color={colors.ink} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollInner}>
        {/* Category Filters */}
        <View style={styles.filterRow}>
          {(['All', 'Bills', 'Reports', 'ID proof'] as const).map(f => {
            const isSel = filter === f;
            const count = f === 'All' ? docs.length : docs.filter(d => d.category === f).length;
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
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSel ? colors.brandDark : colors.ink, fontWeight: isSel ? '700' : '500' },
                  ]}
                >
                  {f} {f === 'All' && `(${docs.length})`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Documents Grid / List */}
        <View style={isGridView ? styles.gridContainer : styles.listContainer}>
          {filteredDocs.map((doc, idx) => {
            const isSelected = selectedDocId === doc.id;
            const statusColor =
              doc.status === 'ok'
                ? colors.green
                : doc.status === 'warn'
                ? colors.amber
                : colors.red;

            if (isGridView) {
              return (
                <TouchableOpacity
                  key={doc.id}
                  style={[
                    styles.gridCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isSelected ? colors.brand : colors.line,
                    },
                    isSelected && {
                      shadowColor: colors.brand,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 3,
                    },
                  ]}
                  onPress={() => setSelectedDocId(doc.id)}
                  activeOpacity={0.8}
                >
                  {/* Miniature Document Preview */}
                  <View style={[styles.docPreview, { backgroundColor: colors.surface2 }]}>
                    {/* Badge */}
                    <View style={[styles.formatBadge, { backgroundColor: colors.brand }]}>
                      <Text style={styles.formatBadgeText}>{doc.format}</Text>
                    </View>

                    {/* Tick if selected */}
                    {isSelected && (
                      <View style={[styles.tickBox, { backgroundColor: colors.brand }]}>
                        <Check size={11} color="#ffffff" strokeWidth={3} />
                      </View>
                    )}

                    {/* Document Mock Lines */}
                    <View style={[styles.mockLine, { width: '65%', backgroundColor: colors.line }]} />
                    <View style={[styles.mockLine, { width: '90%', backgroundColor: colors.line }]} />
                    <View style={[styles.mockLine, { width: '55%', backgroundColor: colors.line }]} />
                    <View style={[styles.mockLine, { width: '80%', backgroundColor: colors.line }]} />
                  </View>

                  {/* Card Bottom Meta */}
                  <View style={styles.cardMeta}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.cardTitle, { color: colors.ink }]} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <Text style={[styles.cardSub, { color: colors.muted }]} numberOfLines={1}>
                        {doc.docType}
                      </Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  </View>

                  {/* Delete X Icon */}
                  <TouchableOpacity
                    style={[styles.removeBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
                    onPress={() => setDocToDelete(doc)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={12} color={colors.muted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }

            // List View Row
            return (
              <TouchableOpacity
                key={doc.id}
                style={[
                  styles.listRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.brand : colors.line,
                  },
                ]}
                onPress={() => setSelectedDocId(doc.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.listIconBox, { backgroundColor: colors.surface2 }]}>
                  <FileText size={18} color={isSelected ? colors.brand : colors.muted} />
                  <View style={[styles.listBadge, { backgroundColor: colors.brand }]}>
                    <Text style={styles.listBadgeText}>{doc.format}</Text>
                  </View>
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.listTitle, { color: colors.ink }]}>{doc.name}</Text>
                  <Text style={[styles.listMeta, { color: colors.muted }]}>
                    {doc.docType} · {doc.pages} · {doc.size}
                  </Text>
                </View>

                <View style={[styles.statusDot, { backgroundColor: statusColor, marginRight: 8 }]} />

                {isSelected && (
                  <View style={[styles.listCheck, { backgroundColor: colors.brand }]}>
                    <Check size={12} color="#ffffff" strokeWidth={3} />
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.listRemoveBtn, { borderColor: colors.line }]}
                  onPress={() => setDocToDelete(doc)}
                >
                  <X size={13} color={colors.muted} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.helperNotice, { color: colors.muted }]}>
          Tap a card to select · × removes it · the download icon fetches the original file.
        </Text>
      </ScrollView>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <View style={[styles.toast, { backgroundColor: colors.navy }]}>
          <Check size={16} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.toastText} numberOfLines={2}>
            {toastMsg}
          </Text>
        </View>
      )}

      {/* Confirmation Modal for Document Removal */}
      <Modal
        transparent
        visible={docToDelete !== null}
        animationType="fade"
        onRequestClose={() => setDocToDelete(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDocToDelete(null)}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text style={[styles.modalTitle, { color: colors.ink }]}>
              Remove {docToDelete?.name}?
            </Text>
            <Text style={[styles.modalBody, { color: colors.muted }]}>
              Are you sure you want to remove {docToDelete?.name} from this claim?
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.line }]}
                onPress={() => setDocToDelete(null)}
              >
                <Text style={[styles.modalCancelText, { color: colors.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalDeleteBtn, { backgroundColor: colors.red }]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.modalDeleteText}>Remove document</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sticky Bottom Actions Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
        <TouchableOpacity
          style={[styles.btnAction, { borderColor: colors.line, flex: 0.3 }]}
          onPress={() => navigation.navigate(Routes.UploadPanel)}
        >
          <Text style={[styles.btnActionText, { color: colors.brandDark }]}>＋ Add</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnAction, { borderColor: colors.line, flex: 0.35 }]}
          onPress={handleDownload}
        >
          <Text style={[styles.btnActionText, { color: colors.brandDark }]}>Download</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: colors.brand, flex: 0.35 }]}
          onPress={handleOpenDoc}
        >
          <Text style={styles.btnPrimaryText}>Open</Text>
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
  viewToggleBtn: { padding: 6 },
  content: { flex: 1 },
  scrollInner: { padding: 13, paddingBottom: 24 },
  filterRow: {
    flexDirection: 'row',
    gap: 7,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 11.5 },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  gridCard: {
    width: '48.5%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  docPreview: {
    height: 88,
    padding: 10,
    gap: 6,
    position: 'relative',
    justifyContent: 'center',
  },
  formatBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  formatBadgeText: { color: '#ffffff', fontSize: 8.5, fontWeight: '800' },
  tickBox: {
    position: 'absolute',
    top: 7,
    left: 7,
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockLine: {
    height: 4.5,
    borderRadius: 3,
  },
  cardMeta: {
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: { fontSize: 12, fontWeight: '700' },
  cardSub: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  removeBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    gap: 8,
    marginBottom: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  listIconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  listBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  listBadgeText: { color: '#ffffff', fontSize: 7, fontWeight: '800' },
  listTitle: { fontSize: 13, fontWeight: '700' },
  listMeta: { fontSize: 11, marginTop: 1 },
  listCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listRemoveBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperNotice: {
    fontSize: 11.5,
    marginHorizontal: 2,
    marginBottom: 16,
  },
  toast: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 74,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  toastText: { color: '#ffffff', fontSize: 11.5, flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  modalBody: { fontSize: 12.5, lineHeight: 18, marginBottom: 16 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalCancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalCancelText: { fontSize: 12.5, fontWeight: '600' },
  modalDeleteBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  modalDeleteText: { color: '#ffffff', fontSize: 12.5, fontWeight: '700' },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 9,
  },
  btnAction: {
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActionText: { fontSize: 12.5, fontWeight: '600' },
  btnPrimary: {
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
