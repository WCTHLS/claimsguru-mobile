import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Download,
  FileText,
  Pencil,
  RotateCw,
  ArrowRight,
  Minus,
  Plus,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { Routes } from '../../../app/navigation/routes';
import {
  INITIAL_OCR_DOCS,
  OcrDocument,
  ParsedField,
  FieldSegment,
} from '../../../mocks/ocr.mock';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const OcrParsedFieldsScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const claimId = route?.params?.claimId || 'a4f1c9e2';
  const initialDocKey = route?.params?.docKey;

  const [docs, setDocs] = useState<OcrDocument[]>(INITIAL_OCR_DOCS);
  const initialDocIdx = initialDocKey
    ? Math.max(0, INITIAL_OCR_DOCS.findIndex(d => d.key === initialDocKey))
    : 0;

  const [activeDocIdx, setActiveDocIdx] = useState(initialDocIdx);
  const [activePage, setActivePage] = useState(0);
  const [viewMode, setViewMode] = useState<'layout' | 'raw'>('layout');
  const [zoomLevel, setZoomLevel] = useState<number>(0); // 0, 1, 2
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [fieldFilter, setFieldFilter] = useState<'all' | 'low' | 'miss' | 'edited'>('all');
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isRerunning, setIsRerunning] = useState(false);

  const activeDoc = docs[activeDocIdx] || docs[0];
  const pages = activeDoc.pages || [];
  const currentPageContent = pages[activePage] || [];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2800);
  };

  const selectDoc = (idx: number) => {
    setActiveDocIdx(idx);
    setActivePage(0);
    setSelectedFieldKey(null);
    setEditingFieldKey(null);
  };

  const handleSelectField = (key: string, pageNum?: number) => {
    setSelectedFieldKey(key);
    if (pageNum !== undefined && pageNum > 0 && pageNum <= pages.length) {
      setActivePage(pageNum - 1);
    }
  };

  const handleStartEdit = (field: ParsedField) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditingFieldKey(field.k);
    setEditValue(field.v || '');
    setSelectedFieldKey(field.k);
  };

  const handleSaveEdit = (fieldKey: string) => {
    if (!editValue.trim()) {
      showToast('Enter a value or cancel');
      return;
    }

    setDocs(prevDocs =>
      prevDocs.map((doc, dIdx) => {
        if (dIdx !== activeDocIdx) return doc;
        return {
          ...doc,
          fields: doc.fields.map(f => {
            if (f.k !== fieldKey) return f;
            return {
              ...f,
              v: editValue.trim(),
              c: 1.0,
              s: 'manual',
              warn: undefined,
              note: 'manually edited by reviewer',
            };
          }),
        };
      })
    );

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditingFieldKey(null);
    showToast(`Updated ${fieldKey} successfully`);
  };

  const handleRerunOcr = () => {
    setIsRerunning(true);
    showToast(`Re-running OCR on ${activeDoc.file}…`);
    setTimeout(() => {
      setIsRerunning(false);
      showToast(`OCR complete · ${activeDoc.file} · ${activeDoc.secs} s`);
    }, 1800);
  };

  const handleAcceptFields = () => {
    const missingReq = activeDoc.fields.filter(f => f.req && !f.v);
    if (missingReq.length > 0) {
      showToast(`${missingReq.length} required field(s) missing — continuing to Coding`);
    } else {
      showToast('All required fields verified');
    }
    navigation.navigate(Routes.MedicalCoding, { claimId });
  };

  // Filtered fields
  const filteredFields = activeDoc.fields.filter(f => {
    if (fieldFilter === 'low') return f.v !== null && f.c < 0.85;
    if (fieldFilter === 'miss') return f.v === null;
    if (fieldFilter === 'edited') return f.s === 'manual';
    return true;
  });

  // Group fields by group name
  const groups: string[] = [];
  filteredFields.forEach(f => {
    if (!groups.includes(f.g)) groups.push(f.g);
  });

  // Total fields counts
  const docExtractedCount = activeDoc.fields.filter(f => f.v !== null).length;
  let totalExtracted = 0;
  let totalFields = 0;
  docs.forEach(d => {
    totalFields += d.fields.length;
    totalExtracted += d.fields.filter(f => f.v !== null).length;
  });

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
        <Text style={[styles.appBarTitle, { color: colors.ink }]}>OCR & parsed fields</Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => showToast(`Downloading ${activeDoc.file}…`)}
        >
          <Download size={19} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollInner} keyboardShouldPersistTaps="handled">
        {/* Horizontal Document Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.docChipsScroll}>
          {docs.map((doc, idx) => {
            const foundCount = doc.fields.filter(f => f.v !== null).length;
            const isSelected = idx === activeDocIdx;
            const hasWarning = doc.flag || foundCount < doc.fields.length;

            return (
              <TouchableOpacity
                key={doc.key}
                style={[
                  styles.docChip,
                  {
                    backgroundColor: isSelected ? colors.brandSoft : colors.surface,
                    borderColor: isSelected ? colors.brand : hasWarning ? colors.amber : colors.line,
                  },
                ]}
                onPress={() => selectDoc(idx)}
              >
                <Text
                  style={[
                    styles.docChipText,
                    { color: isSelected ? colors.brandDark : colors.ink, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {doc.name}
                </Text>
                <View
                  style={[
                    styles.docChipBadge,
                    { backgroundColor: isSelected ? colors.brand : colors.surface2 },
                  ]}
                >
                  <Text
                    style={[
                      styles.docChipBadgeText,
                      { color: isSelected ? '#ffffff' : colors.muted },
                    ]}
                  >
                    {foundCount}/{doc.fields.length}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* OCR Job Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.jobHeader}>
            <View style={[styles.fileIconBox, { backgroundColor: colors.brandSoft }]}>
              <FileText size={18} color={colors.brand} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.fileName, { color: colors.ink }]} numberOfLines={1}>
                {activeDoc.file}
              </Text>
              <Text style={[styles.fileEngine, { color: colors.muted }]} numberOfLines={1}>
                {activeDoc.engine}
              </Text>
            </View>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: isRerunning ? colors.brandSoft : colors.greenSoft },
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  { color: isRerunning ? colors.brandDark : colors.green },
                ]}
              >
                {isRerunning ? 'RUNNING' : 'COMPLETE'}
              </Text>
            </View>
          </View>

          {/* 4-Metric Grid */}
          <View style={styles.metricGrid}>
            <View style={[styles.metricBox, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.metricVal, { color: colors.ink }]}>{pages.length}</Text>
              <Text style={[styles.metricSub, { color: colors.muted }]}>pages</Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.metricVal, { color: colors.ink }]}>
                {Math.round(activeDoc.conf * 100)}%
              </Text>
              <Text style={[styles.metricSub, { color: colors.muted }]}>OCR conf.</Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.metricVal, { color: colors.ink }]}>{activeDoc.secs}s</Text>
              <Text style={[styles.metricSub, { color: colors.muted }]}>seconds</Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.metricVal, { color: colors.ink }]}>{activeDoc.dpi}</Text>
              <Text style={[styles.metricSub, { color: colors.muted }]}>render DPI</Text>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            {activeDoc.tags.map((tag, tIdx) => (
              <View
                key={tIdx}
                style={[
                  styles.tagPill,
                  {
                    backgroundColor:
                      tIdx === 0
                        ? colors.brandSoft
                        : tag.includes('R0')
                        ? colors.redSoft
                        : colors.surface2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    {
                      color:
                        tIdx === 0
                          ? colors.brandDark
                          : tag.includes('R0')
                          ? colors.red
                          : colors.muted,
                    },
                  ]}
                >
                  {tag}
                </Text>
              </View>
            ))}

            {activeDoc.scan && (
              <TouchableOpacity
                style={[styles.scanBtn, { backgroundColor: colors.brandSoft, borderColor: colors.brand }]}
                onPress={() => navigation.navigate(Routes.ScanAnalyzer, { claimId })}
              >
                <Text style={[styles.scanBtnText, { color: colors.brandDark }]}>
                  Open scan analyzer →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Document Viewer Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Document</Text>

          <View style={styles.viewerControls}>
            {/* Layout vs Raw Mode Toggle */}
            <View style={[styles.toggleBar, { backgroundColor: colors.surface2 }]}>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  viewMode === 'layout' && [styles.toggleOptionOn, { backgroundColor: colors.surface }],
                ]}
                onPress={() => setViewMode('layout')}
              >
                <Text
                  style={[
                    styles.toggleOptionText,
                    { color: viewMode === 'layout' ? colors.brandDark : colors.muted },
                  ]}
                >
                  Layout
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  viewMode === 'raw' && [styles.toggleOptionOn, { backgroundColor: colors.surface }],
                ]}
                onPress={() => setViewMode('raw')}
              >
                <Text
                  style={[
                    styles.toggleOptionText,
                    { color: viewMode === 'raw' ? colors.brandDark : colors.muted },
                  ]}
                >
                  Raw OCR
                </Text>
              </TouchableOpacity>
            </View>

            {/* Zoom Controls */}
            <TouchableOpacity
              style={[styles.zoomBtn, { borderColor: colors.line }]}
              onPress={() => setZoomLevel(Math.max(0, zoomLevel - 1))}
            >
              <Minus size={14} color={colors.ink} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.zoomBtn, { borderColor: colors.line }]}
              onPress={() => setZoomLevel(Math.min(2, zoomLevel + 1))}
            >
              <Plus size={14} color={colors.ink} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Document Viewer Paper Box */}
        {viewMode === 'layout' ? (
          <View
            style={[
              styles.paperBox,
              {
                backgroundColor: isDark ? '#1b222c' : '#ffffff',
                borderColor: colors.line,
              },
            ]}
          >
            {currentPageContent.map((item, pIdx) => {
              if (Array.isArray(item)) {
                return (
                  <Text key={pIdx} style={[styles.paperLine, { fontSize: 12 + zoomLevel * 1.5 }]}>
                    {item.map((seg, sIdx) => {
                      if (typeof seg === 'string') {
                        return <Text key={sIdx} style={{ color: colors.ink }}>{seg}</Text>;
                      }
                      if (seg.l) {
                        return (
                          <Text key={sIdx} style={{ color: colors.muted, fontWeight: '600' }}>
                            {seg.l}
                          </Text>
                        );
                      }
                      if (seg.f) {
                        const field = activeDoc.fields.find(f => f.k === seg.f);
                        const isSelected = selectedFieldKey === seg.f;
                        const isMiss = !field || field.v === null;
                        const isLow = field && field.v !== null && field.c < 0.85;
                        const fieldIndex = activeDoc.fields.findIndex(f => f.k === seg.f) + 1;

                        return (
                          <Text
                            key={sIdx}
                            onPress={() => handleSelectField(seg.f!, activePage + 1)}
                            style={[
                              styles.highlightSpan,
                              {
                                backgroundColor: isSelected
                                  ? 'rgba(13,148,136,0.32)'
                                  : isMiss
                                  ? 'rgba(220,38,38,0.18)'
                                  : isLow
                                  ? 'rgba(180,83,9,0.18)'
                                  : 'rgba(13,148,136,0.15)',
                                color: isMiss ? colors.red : colors.ink,
                                fontWeight: '600',
                                textDecorationLine: 'underline',
                              },
                            ]}
                          >
                            {seg.t}
                            <Text style={styles.tagSup}> [{fieldIndex}]</Text>
                          </Text>
                        );
                      }
                      return null;
                    })}
                  </Text>
                );
              }
              if (item.h) {
                return (
                  <Text
                    key={pIdx}
                    style={[styles.paperHeader, { color: colors.ink, fontSize: 14 + zoomLevel * 1.5 }]}
                  >
                    {item.h}
                  </Text>
                );
              }
              if (item.sub) {
                return (
                  <Text
                    key={pIdx}
                    style={[styles.paperSub, { color: colors.muted, fontSize: 11 + zoomLevel }]}
                  >
                    {item.sub}
                  </Text>
                );
              }
              if (item.r) {
                return <View key={pIdx} style={[styles.paperRule, { backgroundColor: colors.line2 }]} />;
              }
              if (item.p) {
                return (
                  <Text
                    key={pIdx}
                    style={[styles.paperPara, { color: colors.ink, fontSize: 11.5 + zoomLevel }]}
                  >
                    {item.p}
                  </Text>
                );
              }
              return null;
            })}
          </View>
        ) : (
          /* Raw OCR Terminal View */
          <View style={[styles.rawBox, { backgroundColor: '#111827' }]}>
            {currentPageContent.map((item, pIdx) => {
              if (Array.isArray(item)) {
                return (
                  <Text key={pIdx} style={[styles.rawText, { fontSize: 11 + zoomLevel }]}>
                    {item.map((seg, sIdx) => {
                      if (typeof seg === 'string') return seg;
                      if (seg.l) return seg.l;
                      if (seg.f) {
                        const field = activeDoc.fields.find(f => f.k === seg.f);
                        const conf = field ? field.c.toFixed(2) : '1.00';
                        const text = seg.raw || seg.t || '';
                        return `${text} [${conf}] `;
                      }
                      return '';
                    })}
                  </Text>
                );
              }
              if (item.h) return <Text key={pIdx} style={styles.rawHeader}>{item.h.toUpperCase()}</Text>;
              if (item.sub) return <Text key={pIdx} style={styles.rawSub}>{item.sub}</Text>;
              if (item.r) return <Text key={pIdx} style={styles.rawRule}>----------------------------------------</Text>;
              if (item.p) return <Text key={pIdx} style={styles.rawPara}>{item.p}</Text>;
              return null;
            })}
          </View>
        )}

        {/* Page Navigation Controls */}
        <View style={styles.pageNavRow}>
          <Text style={[styles.pageNavText, { color: colors.ink }]}>
            Page {activePage + 1} / {pages.length}
          </Text>
          <View style={styles.pageNavBtns}>
            <TouchableOpacity
              style={[
                styles.pageNavBtn,
                { borderColor: colors.line, opacity: activePage === 0 ? 0.35 : 1 },
              ]}
              disabled={activePage === 0}
              onPress={() => setActivePage(activePage - 1)}
            >
              <ChevronLeft size={16} color={colors.ink} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.pageNavBtn,
                { borderColor: colors.line, opacity: activePage >= pages.length - 1 ? 0.35 : 1 },
              ]}
              disabled={activePage >= pages.length - 1}
              onPress={() => setActivePage(activePage + 1)}
            >
              <ArrowRight size={16} color={colors.ink} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'rgba(13,148,136,0.6)' }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>extracted</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'rgba(180,83,9,0.7)' }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>low conf.</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'rgba(220,38,38,0.7)' }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>not found</Text>
          </View>
          <Text style={[styles.legendHint, { color: colors.muted }]}>tap highlight ↔ field</Text>
        </View>

        {/* Parsed Fields Section Header */}
        <View style={styles.fieldsSectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>
              Parsed fields <Text style={[styles.titleSub, { color: colors.muted }]}>({docExtractedCount} of {activeDoc.fields.length})</Text>
            </Text>
            <Text style={[styles.claimTotalsText, { color: colors.muted }]}>
              claim total: {totalExtracted} of {totalFields} fields
            </Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChipsRow}>
          {(['all', 'low', 'miss', 'edited'] as const).map(f => {
            const labels = {
              all: 'All',
              low: 'Low confidence',
              miss: 'Missing',
              edited: 'Edited',
            };
            const isSel = fieldFilter === f;
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
                onPress={() => setFieldFilter(f)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSel ? colors.brandDark : colors.ink, fontWeight: isSel ? '700' : '500' },
                  ]}
                >
                  {labels[f]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Grouped Fields List */}
        <View style={[styles.fieldsCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {groups.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>No fields match this filter.</Text>
          ) : (
            groups.map(groupName => {
              const groupFields = filteredFields.filter(f => f.g === groupName);
              const groupFound = groupFields.filter(f => f.v !== null).length;

              return (
                <View key={groupName} style={styles.groupBlock}>
                  {/* Group Header */}
                  <View style={[styles.groupHeader, { backgroundColor: colors.surface2 }]}>
                    <Text style={[styles.groupHeaderText, { color: colors.muted }]}>{groupName}</Text>
                    <Text style={[styles.groupHeaderCount, { color: colors.muted }]}>
                      {groupFound}/{groupFields.length}
                    </Text>
                  </View>

                  {/* Group Field Rows */}
                  {groupFields.map(field => {
                    const isSelected = selectedFieldKey === field.k;
                    const isEditing = editingFieldKey === field.k;
                    const isMiss = field.v === null;
                    const barColor = isMiss
                      ? colors.red
                      : field.c >= 0.85
                      ? colors.brand
                      : colors.amber;

                    return (
                      <View key={field.k}>
                        <TouchableOpacity
                          style={[
                            styles.fieldRow,
                            isSelected && { backgroundColor: colors.brandSoft },
                            { borderBottomColor: colors.line2 },
                          ]}
                          onPress={() => handleSelectField(field.k, field.pg)}
                        >
                          <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                            <View style={styles.fieldKeyRow}>
                              <Text style={[styles.fieldKeyText, { color: colors.ink }]}>{field.k}</Text>
                              {field.req && isMiss && (
                                <View style={[styles.reqBadge, { backgroundColor: colors.redSoft }]}>
                                  <Text style={[styles.reqBadgeText, { color: colors.red }]}>required</Text>
                                </View>
                              )}
                            </View>

                            <Text
                              style={[
                                styles.fieldValueText,
                                {
                                  color: isMiss ? colors.red : colors.ink,
                                  fontStyle: isMiss ? 'italic' : 'normal',
                                },
                              ]}
                            >
                              {isMiss ? 'Not found' : field.v}
                            </Text>

                            {/* Meta & Pills */}
                            <View style={styles.fieldMetaRow}>
                              <View style={[styles.srcPill, { backgroundColor: colors.surface2 }]}>
                                <Text style={[styles.srcPillText, { color: colors.muted }]}>{field.s}</Text>
                              </View>
                              <Text style={[styles.pageMetaText, { color: colors.muted }]}>p.{field.pg}</Text>
                              {field.warn && (
                                <View style={[styles.warnPill, { backgroundColor: colors.amberSoft }]}>
                                  <Text style={[styles.warnPillText, { color: colors.amber }]}>{field.warn}</Text>
                                </View>
                              )}
                              {field.note && !field.warn && (
                                <Text style={[styles.noteText, { color: colors.muted }]} numberOfLines={1}>
                                  · {field.note}
                                </Text>
                              )}
                            </View>
                          </View>

                          {/* Confidence Indicator */}
                          <View style={styles.confCol}>
                            <View style={[styles.confTrack, { backgroundColor: colors.line }]}>
                              <View
                                style={[
                                  styles.confFill,
                                  { width: `${Math.round(field.c * 100)}%`, backgroundColor: barColor },
                                ]}
                              />
                            </View>
                            <Text style={[styles.confText, { color: colors.muted }]}>
                              {field.c.toFixed(2)}
                            </Text>
                          </View>

                          {/* Edit Pencil Action */}
                          <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => handleStartEdit(field)}
                          >
                            <Pencil size={14} color={colors.muted} />
                          </TouchableOpacity>
                        </TouchableOpacity>

                        {/* Inline Editor */}
                        {isEditing && (
                          <View style={[styles.inlineEditBox, { backgroundColor: colors.brandSoft }]}>
                            <Text style={[styles.editPromptText, { color: colors.brandDark }]}>
                              {field.k} · {isMiss ? 'add value read from document' : 'correct extracted value'}
                            </Text>
                            <TextInput
                              style={[
                                styles.editInput,
                                { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line },
                              ]}
                              value={editValue}
                              onChangeText={setEditValue}
                              placeholder="Type value…"
                              placeholderTextColor={colors.muted}
                              autoFocus
                            />
                            <View style={styles.editBtnRow}>
                              <TouchableOpacity
                                style={[styles.editCancelBtn, { borderColor: colors.line }]}
                                onPress={() => setEditingFieldKey(null)}
                              >
                                <Text style={[styles.editCancelText, { color: colors.muted }]}>Cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.editSaveBtn, { backgroundColor: colors.brand }]}
                                onPress={() => handleSaveEdit(field.k)}
                              >
                                <Text style={styles.editSaveText}>Save</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}
        </View>

        <Text style={[styles.footerDisclaimer, { color: colors.muted }]}>
          Sources: regex, layoutlm, llm (OpenRouter → Gemini), manual. Reviewer role can edit fields directly.
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

      {/* Sticky Bottom Actions Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
        <TouchableOpacity
          style={[styles.bottomOutlineBtn, { borderColor: colors.line }]}
          onPress={handleRerunOcr}
          disabled={isRerunning}
        >
          <RotateCw size={15} color={colors.brandDark} style={{ marginRight: 6 }} />
          <Text style={[styles.bottomOutlineText, { color: colors.brandDark }]}>
            {isRerunning ? 'Running…' : 'Re-run OCR'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomSolidBtn, { backgroundColor: colors.brand }]}
          onPress={handleAcceptFields}
        >
          <Text style={styles.bottomSolidText}>Accept fields → Coding</Text>
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
  actionBtn: { padding: 6 },
  content: { flex: 1 },
  scrollInner: { padding: 13, paddingBottom: 24 },
  docChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
  },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 20,
    borderWidth: 1,
  },
  docChipText: { fontSize: 12 },
  docChipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  docChipBadgeText: { fontSize: 9.5, fontWeight: '700' },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  fileIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: { fontSize: 13, fontWeight: '700' },
  fileEngine: { fontSize: 11, marginTop: 1 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  metricGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  metricBox: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricVal: { fontSize: 13.5, fontWeight: '700' },
  metricSub: { fontSize: 9.5, marginTop: 1 },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: { fontSize: 10, fontWeight: '600' },
  scanBtn: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  scanBtnText: { fontSize: 10, fontWeight: '700' },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  titleSub: { fontSize: 12, fontWeight: '500' },
  viewerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleBar: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: 8,
  },
  toggleOption: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleOptionOn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleOptionText: { fontSize: 11, fontWeight: '600' },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    minHeight: 180,
    marginBottom: 8,
  },
  paperHeader: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  paperSub: {
    marginBottom: 6,
  },
  paperRule: {
    height: 1,
    marginVertical: 8,
  },
  paperPara: {
    lineHeight: 18,
    marginBottom: 6,
  },
  paperLine: {
    lineHeight: 20,
    marginBottom: 4,
  },
  highlightSpan: {
    borderRadius: 3,
    paddingHorizontal: 2,
  },
  tagSup: {
    fontSize: 9,
    fontWeight: '700',
  },
  rawBox: {
    borderRadius: 12,
    padding: 12,
    minHeight: 180,
    marginBottom: 8,
  },
  rawHeader: {
    color: '#8ee6dc',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  rawSub: {
    color: '#9ca3af',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  rawRule: {
    color: '#4b5563',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 4,
  },
  rawPara: {
    color: '#e5e7eb',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
    marginBottom: 4,
  },
  rawText: {
    color: '#d1d5db',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
    marginBottom: 4,
  },
  pageNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pageNavText: { fontSize: 12, fontWeight: '600' },
  pageNavBtns: { flexDirection: 'row', gap: 6 },
  pageNavBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 10.5 },
  legendHint: { fontSize: 10.5, fontStyle: 'italic', marginLeft: 'auto' },
  fieldsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  claimTotalsText: { fontSize: 11, marginTop: 2 },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 11 },
  fieldsCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  emptyText: { padding: 18, textAlign: 'center', fontSize: 12 },
  groupBlock: {},
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  groupHeaderText: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase' },
  groupHeaderCount: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  fieldKeyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldKeyText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  reqBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  reqBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  fieldValueText: { fontSize: 13, marginTop: 2 },
  fieldMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  srcPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  srcPillText: { fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase' },
  pageMetaText: { fontSize: 10 },
  warnPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  warnPillText: { fontSize: 9.5, fontWeight: '700' },
  noteText: { fontSize: 10, flexShrink: 1 },
  confCol: { width: 44, alignItems: 'flex-end', marginRight: 6 },
  confTrack: { width: 40, height: 4, borderRadius: 2, overflow: 'hidden' },
  confFill: { height: '100%', borderRadius: 2 },
  confText: { fontSize: 9.5, marginTop: 2 },
  editBtn: { padding: 4 },
  inlineEditBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f6',
  },
  editPromptText: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    marginBottom: 8,
  },
  editBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  editCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editCancelText: { fontSize: 12, fontWeight: '600' },
  editSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editSaveText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  footerDisclaimer: {
    fontSize: 11,
    lineHeight: 15,
    marginHorizontal: 4,
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
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 9,
  },
  bottomOutlineBtn: {
    flex: 0.4,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomOutlineText: { fontSize: 13, fontWeight: '600' },
  bottomSolidBtn: {
    flex: 0.6,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSolidText: { color: '#ffffff', fontSize: 13.5, fontWeight: '700' },
});
