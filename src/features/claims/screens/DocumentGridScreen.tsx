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
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Download,
  FileText,
  Pencil,
  Minus,
  Plus,
  Check,
  X,
  RotateCw,
  ArrowRight,
  Trash2,
  AlertTriangle,
  Folder,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { Routes } from '../../../app/navigation/routes';
import {
  INITIAL_OCR_DOCS,
  OcrDocument,
  ParsedField,
  FieldSegment,
  PageContent,
} from '../../../mocks/ocr.mock';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  try {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  } catch {}
}

export const DocumentGridScreen = ({ route, navigation }: any) => {
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
  const [zoomLevel, setZoomLevel] = useState<number>(0); // 0: regular, 1: +1, 2: +2
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [fieldFilter, setFieldFilter] = useState<'all' | 'low' | 'miss' | 'edited'>('all');
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isRerunning, setIsRerunning] = useState(false);
  const [docToDelete, setDocToDelete] = useState<OcrDocument | null>(null);

  const activeDoc = docs[activeDocIdx] || docs[0];
  const pages = activeDoc.pages || [];
  const currentPageContent = pages[activePage] || [];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  };

  // Claim total fields count
  const claimFieldStats = React.useMemo(() => {
    let found = 0;
    let total = 0;
    docs.forEach(d => {
      d.fields.forEach(f => {
        total++;
        if (f.v != null) found++;
      });
    });
    return { found, total };
  }, [docs]);

  // Current doc fields count
  const docFieldStats = React.useMemo(() => {
    if (!activeDoc) return { found: 0, total: 0 };
    const found = activeDoc.fields.filter(f => f.v != null).length;
    return { found, total: activeDoc.fields.length };
  }, [activeDoc]);

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
    showToast(`Saved ${fieldKey}`);
  };

  const handleCancelEdit = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditingFieldKey(null);
  };

  const handleRerunOcr = () => {
    setIsRerunning(true);
    showToast(`POST /ocr/${claimId.slice(0, 8)}… queued on gpu_queue`);
    setTimeout(() => {
      setIsRerunning(false);
      showToast(`OCR complete · ${activeDoc.file} (${activeDoc.secs}s)`);
    }, 1800);
  };

  const handleAcceptFields = () => {
    let missingReq = 0;
    docs.forEach(d => {
      d.fields.forEach(f => {
        if (f.req && f.v == null) missingReq++;
      });
    });

    if (missingReq > 0) {
      showToast(`${missingReq} required field${missingReq > 1 ? 's' : ''} missing — continuing to coding`);
    } else {
      showToast('All required fields verified');
    }
    navigation.navigate(Routes.MedicalCoding, { claimId });
  };

  const handleConfirmDelete = () => {
    if (!docToDelete) return;
    const toRemove = docToDelete;
    const remaining = docs.filter(d => d.key !== toRemove.key);
    setDocs(remaining);
    if (activeDocIdx >= remaining.length) {
      setActiveDocIdx(Math.max(0, remaining.length - 1));
    }
    setDocToDelete(null);
    showToast(`Removed ${toRemove.name}`);
  };

  // Filtered fields for active document
  const filteredFields = activeDoc.fields.filter(f => {
    if (fieldFilter === 'all') return true;
    if (fieldFilter === 'low') return f.v != null && f.c < 0.85;
    if (fieldFilter === 'miss') return f.v == null;
    if (fieldFilter === 'edited') return f.s === 'manual';
    return true;
  });

  // Groups of fields
  const fieldGroups = React.useMemo(() => {
    const groups: { name: string; items: ParsedField[] }[] = [];
    filteredFields.forEach(f => {
      let grp = groups.find(g => g.name === f.g);
      if (!grp) {
        grp = { name: f.g, items: [] };
        groups.push(grp);
      }
      grp.items.push(f);
    });
    return groups;
  }, [filteredFields]);

  // Render highlighted segment on paper
  const renderSegment = (seg: string | FieldSegment, sIdx: number) => {
    if (typeof seg === 'string') {
      return (
        <Text key={`str-${sIdx}`} style={[styles.paperBodyText, { fontSize: 13 + zoomLevel }]}>
          {seg}
        </Text>
      );
    }

    if (seg.l) {
      return (
        <Text key={`lbl-${sIdx}`} style={[styles.paperLabelText, { fontSize: 13 + zoomLevel }]}>
          {seg.l}
        </Text>
      );
    }

    const fieldObj = activeDoc.fields.find(f => f.k === seg.f);
    const fieldIndex = activeDoc.fields.findIndex(f => f.k === seg.f) + 1;
    const isSelected = selectedFieldKey === seg.f;
    const isLow = fieldObj && fieldObj.c < 0.85;
    const isMissing = fieldObj && fieldObj.v == null;

    let highlightBg = colors.brandSoft;
    let borderBottomColor = colors.brand;
    if (isMissing) {
      highlightBg = '#fdecec';
      borderBottomColor = colors.red;
    } else if (isLow) {
      highlightBg = '#fdf1e0';
      borderBottomColor = colors.amber;
    }

    if (isSelected) {
      highlightBg = colors.brandSoft;
      borderBottomColor = colors.brandDark;
    }

    return (
      <TouchableOpacity
        key={`hl-${sIdx}`}
        onPress={() => seg.f && handleSelectField(seg.f, fieldObj?.pg)}
        activeOpacity={0.7}
        style={[
          styles.highlightSpan,
          {
            backgroundColor: highlightBg,
            borderBottomColor,
            borderBottomWidth: isSelected ? 2 : 1.5,
          },
        ]}
      >
        <Text
          style={[
            styles.highlightText,
            {
              fontSize: 13 + zoomLevel,
              color: isMissing ? colors.red : colors.ink,
              fontStyle: isMissing ? 'italic' : 'normal',
              fontWeight: isSelected ? '700' : '600',
            },
          ]}
        >
          {seg.t}
        </Text>
        {fieldIndex > 0 && (
          <View
            style={[
              styles.tagBadge,
              {
                backgroundColor: isMissing
                  ? colors.red
                  : isLow
                  ? colors.amber
                  : colors.brand,
              },
            ]}
          >
            <Text style={styles.tagBadgeText}>{fieldIndex}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
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
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollInner}>
        {/* Horizontal Document Selector Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.docChipsScroll}
        >
          {docs.map((doc, idx) => {
            const isSel = idx === activeDocIdx;
            const docFound = doc.fields.filter(f => f.v != null).length;
            const docTotal = doc.fields.length;
            const hasWarn = doc.flag || docFound < docTotal;

            return (
              <TouchableOpacity
                key={doc.key}
                style={[
                  styles.docChip,
                  {
                    backgroundColor: isSel ? colors.brandSoft : colors.surface,
                    borderColor: isSel
                      ? colors.brand
                      : hasWarn
                      ? colors.amber
                      : colors.line,
                  },
                ]}
                onPress={() => selectDoc(idx)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.docChipText,
                    {
                      color: isSel ? colors.brandDark : colors.ink,
                      fontWeight: isSel ? '700' : '500',
                    },
                  ]}
                >
                  {doc.name}
                </Text>
                <View
                  style={[
                    styles.docChipCountBadge,
                    {
                      backgroundColor: isSel ? colors.brand : colors.surface2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.docChipCountText,
                      { color: isSel ? '#ffffff' : colors.muted },
                    ]}
                  >
                    {docFound}/{docTotal}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.addDocChip, { backgroundColor: colors.surface, borderColor: colors.line }]}
            onPress={() => showToast('Attach document from camera, gallery, or files')}
            activeOpacity={0.7}
          >
            <Plus size={14} color={colors.brandDark} />
            <Text style={[styles.addDocChipText, { color: colors.brandDark }]}>Add</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Selected Document Info & Job Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.docIconBox, { backgroundColor: colors.brandSoft }]}>
              <FileText size={20} color={colors.brand} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.docCardTitle, { color: colors.ink }]} numberOfLines={1}>
                {activeDoc.file}
              </Text>
              <Text style={[styles.docCardSub, { color: colors.muted }]} numberOfLines={1}>
                {activeDoc.engine}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isRerunning ? colors.brandSoft : '#e6f5ef' }]}>
              <Text style={[styles.statusBadgeText, { color: isRerunning ? colors.brandDark : colors.green }]}>
                {isRerunning ? 'RUNNING' : 'COMPLETE'}
              </Text>
            </View>
          </View>

          {/* 4-Metric Stats Grid */}
          <View style={[styles.statsGrid, { backgroundColor: colors.surface2 }]}>
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: colors.ink }]}>{pages.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>pages</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: colors.ink }]}>{Math.round(activeDoc.conf * 100)}%</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>OCR conf.</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: colors.ink }]}>{activeDoc.secs}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>seconds</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: colors.ink }]}>{activeDoc.dpi}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>render DPI</Text>
            </View>
          </View>

          {/* Pills Row */}
          <View style={styles.metaPillsRow}>
            <View style={[styles.pill, { backgroundColor: colors.brandSoft }]}>
              <Text style={[styles.pillText, { color: colors.brandDark }]}>
                doc_type: {activeDoc.key} · {(activeDoc.cls || 0.95).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.pill, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.pillText, { color: colors.muted }]}>
                {activeDoc.badge || 'PDF'} · {activeDoc.size || '1.2 MB'}
              </Text>
            </View>
            {activeDoc.flag && (
              <View style={[styles.pill, { backgroundColor: '#fdecec' }]}>
                <Text style={[styles.pillText, { color: colors.red }]}>
                  {activeDoc.flag} failed
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons Row */}
          <View style={styles.docActionsRow}>
            <TouchableOpacity
              style={[styles.docActionBtn, { borderColor: colors.line }]}
              onPress={() => showToast(`Downloading ${activeDoc.file}…`)}
              activeOpacity={0.7}
            >
              <Text style={[styles.docActionBtnText, { color: colors.ink }]}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.docActionBtn, { borderColor: colors.line }]}
              onPress={() => setDocToDelete(activeDoc)}
              activeOpacity={0.7}
            >
              <Text style={[styles.docActionBtnText, { color: colors.ink }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan Analysis Card (When Document is a Radiology/Medical Scan) */}
        {activeDoc.scan && activeDoc.scanData && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.cardSectionTitle, { color: colors.ink }]}>Scan analysis</Text>
              <View style={[styles.severityPill, { backgroundColor: '#fdf1e0' }]}>
                <Text style={[styles.severityPillText, { color: colors.amber }]}>
                  {activeDoc.scanData.severity}
                </Text>
              </View>
            </View>

            {/* Modality Chips */}
            <View style={styles.modalityChipsRow}>
              {['MRI', 'CT', 'X-Ray', 'Ultrasound', 'PET', 'Mammography'].map(m => {
                const isSel = m === activeDoc.scanData?.type;
                return (
                  <View
                    key={m}
                    style={[
                      styles.modalityChip,
                      {
                        backgroundColor: isSel ? colors.brandSoft : colors.surface2,
                        borderColor: isSel ? colors.brand : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalityChipText,
                        { color: isSel ? colors.brandDark : colors.muted, fontWeight: isSel ? '700' : '500' },
                      ]}
                    >
                      {m}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Extracted Findings */}
            <View style={styles.findingsList}>
              {activeDoc.scanData.findings.map((f, fIdx) => (
                <View key={fIdx} style={[styles.findingRow, { borderBottomColor: colors.line2 }]}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          f.severity === 'ok' ? colors.green : f.severity === 'warn' ? colors.amber : colors.red,
                      },
                    ]}
                  />
                  <Text style={[styles.findingTitle, { color: colors.ink }]}>{f.title}</Text>
                  <View
                    style={[
                      styles.findingBadge,
                      {
                        backgroundColor:
                          f.severity === 'ok'
                            ? '#e6f5ef'
                            : f.severity === 'warn'
                            ? '#fdf1e0'
                            : '#fdecec',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.findingBadgeText,
                        {
                          color:
                            f.severity === 'ok'
                              ? colors.green
                              : f.severity === 'warn'
                              ? colors.amber
                              : colors.red,
                        },
                      ]}
                    >
                      {f.badge}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Linked Codes */}
            <Text style={[styles.linkedCodesTitle, { color: colors.muted }]}>Linked codes</Text>
            {activeDoc.scanData.codes.map((c, cIdx) => (
              <View key={cIdx} style={[styles.codeRow, { borderBottomColor: colors.line2 }]}>
                <View style={[styles.codeBox, { backgroundColor: colors.surface2 }]}>
                  <Text style={[styles.codeBoxText, { color: colors.ink }]}>{c.code}</Text>
                </View>
                <Text style={[styles.codeDescText, { color: colors.muted }]}>{c.description}</Text>
                <View
                  style={[
                    styles.findingBadge,
                    { backgroundColor: c.status === 'ok' ? '#e6f5ef' : '#fdf1e0' },
                  ]}
                >
                  <Text
                    style={[
                      styles.findingBadgeText,
                      { color: c.status === 'ok' ? colors.green : colors.amber },
                    ]}
                  >
                    {c.badge}
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.reviewCodingBtn, { borderColor: colors.line }]}
              onPress={() => navigation.navigate(Routes.MedicalCoding, { claimId })}
              activeOpacity={0.7}
            >
              <Text style={[styles.reviewCodingBtnText, { color: colors.brandDark }]}>
                Review coding →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Document Section: Layout / Raw OCR + Zoom Controls */}
        <View style={styles.viewerHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Document</Text>

          <View style={styles.viewerControlsRight}>
            {/* Layout vs Raw OCR Toggle */}
            <View style={[styles.segmentedToggle, { backgroundColor: colors.surface2 }]}>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  viewMode === 'layout' && [styles.segmentBtnActive, { backgroundColor: colors.surface }],
                ]}
                onPress={() => setViewMode('layout')}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    { color: viewMode === 'layout' ? colors.brandDark : colors.muted },
                  ]}
                >
                  Layout
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  viewMode === 'raw' && [styles.segmentBtnActive, { backgroundColor: colors.surface }],
                ]}
                onPress={() => setViewMode('raw')}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
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
              onPress={() => setZoomLevel(prev => Math.max(0, prev - 1))}
              disabled={zoomLevel === 0}
            >
              <Minus size={14} color={zoomLevel === 0 ? colors.muted : colors.ink} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.zoomBtn, { borderColor: colors.line }]}
              onPress={() => setZoomLevel(prev => Math.min(2, prev + 1))}
              disabled={zoomLevel === 2}
            >
              <Plus size={14} color={zoomLevel === 2 ? colors.muted : colors.ink} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Paper or Raw View Canvas */}
        {viewMode === 'layout' ? (
          <View
            style={[
              styles.paperCanvas,
              {
                backgroundColor: isDark ? colors.surface : '#ffffff',
                borderColor: colors.line,
              },
            ]}
          >
            {currentPageContent.map((contentItem, idx) => {
              if (Array.isArray(contentItem)) {
                return (
                  <View key={`line-${idx}`} style={styles.paperParagraphRow}>
                    {contentItem.map((seg, sIdx) => renderSegment(seg, sIdx))}
                  </View>
                );
              }

              if (contentItem.h) {
                return (
                  <Text
                    key={`h-${idx}`}
                    style={[styles.paperHeading, { color: colors.ink, fontSize: 14.5 + zoomLevel }]}
                  >
                    {contentItem.h}
                  </Text>
                );
              }

              if (contentItem.sub) {
                return (
                  <Text
                    key={`sub-${idx}`}
                    style={[styles.paperSubheading, { color: colors.muted, fontSize: 11.5 + zoomLevel }]}
                  >
                    {contentItem.sub}
                  </Text>
                );
              }

              if (contentItem.r) {
                return <View key={`rule-${idx}`} style={[styles.paperDivider, { backgroundColor: colors.line }]} />;
              }

              if (contentItem.p) {
                return (
                  <Text
                    key={`p-${idx}`}
                    style={[styles.paperParagraph, { color: colors.ink, fontSize: 12.5 + zoomLevel }]}
                  >
                    {contentItem.p}
                  </Text>
                );
              }

              return null;
            })}
          </View>
        ) : (
          <View style={styles.rawCanvas}>
            <Text style={styles.rawText}>
              {currentPageContent
                .map(contentItem => {
                  if (Array.isArray(contentItem)) {
                    return contentItem
                      .map(seg => {
                        if (typeof seg === 'string') return seg;
                        if (seg.l) return seg.l;
                        const f = activeDoc.fields.find(field => field.k === seg.f);
                        const c = f ? f.c : 1.0;
                        const raw = seg.raw || seg.t;
                        return `${raw} [${c.toFixed(2)}]`;
                      })
                      .join('');
                  }
                  if (contentItem.h) return contentItem.h.toUpperCase();
                  if (contentItem.sub) return contentItem.sub;
                  if (contentItem.r) return '----------------------------------------';
                  return contentItem.p || '';
                })
                .join('\n\n')}
            </Text>
          </View>
        )}

        {/* Page Switcher */}
        <View style={styles.pageNavRow}>
          <Text style={[styles.pageIndicatorText, { color: colors.ink }]}>
            Page {activePage + 1} / {pages.length}
          </Text>
          <View style={styles.pageBtnGroup}>
            <TouchableOpacity
              style={[styles.pageNavBtn, { borderColor: colors.line }]}
              onPress={() => setActivePage(p => Math.max(0, p - 1))}
              disabled={activePage === 0}
            >
              <ChevronLeft size={16} color={activePage === 0 ? colors.muted : colors.ink} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pageNavBtn, { borderColor: colors.line }]}
              onPress={() => setActivePage(p => Math.min(pages.length - 1, p + 1))}
              disabled={activePage >= pages.length - 1}
            >
              <ArrowRight size={16} color={activePage >= pages.length - 1 ? colors.muted : colors.ink} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Highlight Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: colors.brandSoft, borderColor: colors.brand }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>extracted</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#fdf1e0', borderColor: colors.amber }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>low confidence</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#fdecec', borderColor: colors.red }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>not found</Text>
          </View>
          <Text style={[styles.legendHint, { color: colors.muted }]}>tap highlight ↔ field</Text>
        </View>

        {/* Parsed Fields Section */}
        <View style={styles.fieldsSectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Parsed fields{' '}
            <Text style={{ fontSize: 12.5, fontWeight: 'normal', color: colors.muted }}>
              {docFieldStats.found} of {docFieldStats.total}
            </Text>
          </Text>
          <Text style={[styles.claimTotalText, { color: colors.muted }]}>
            claim: {claimFieldStats.found} of {claimFieldStats.total}
          </Text>
        </View>

        {/* Field Filter Chips */}
        <View style={styles.filterChipsRow}>
          {[
            { id: 'all', label: 'All' },
            { id: 'low', label: 'Low confidence' },
            { id: 'miss', label: 'Missing' },
            { id: 'edited', label: 'Edited' },
          ].map(flt => {
            const isSel = fieldFilter === flt.id;
            return (
              <TouchableOpacity
                key={flt.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSel ? colors.brandSoft : colors.surface,
                    borderColor: isSel ? colors.brand : colors.line,
                  },
                ]}
                onPress={() => setFieldFilter(flt.id as any)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSel ? colors.brandDark : colors.muted, fontWeight: isSel ? '700' : '500' },
                  ]}
                >
                  {flt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Grouped Fields Cards */}
        {fieldGroups.map(grp => (
          <View
            key={grp.name}
            style={[styles.fieldsGroupCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
          >
            <View style={[styles.groupHeaderRow, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.groupHeaderTitle, { color: colors.muted }]}>{grp.name}</Text>
              <Text style={[styles.groupHeaderCount, { color: colors.muted }]}>
                {grp.items.filter(f => f.v != null).length}/{grp.items.length}
              </Text>
            </View>

            {grp.items.map((fld, fIdx) => {
              const isSelected = selectedFieldKey === fld.k;
              const isEditing = editingFieldKey === fld.k;
              const isLow = fld.c < 0.85;
              const isMissing = fld.v == null;

              let barColor = colors.brand;
              if (isMissing) barColor = colors.red;
              else if (isLow) barColor = colors.amber;

              return (
                <View
                  key={fld.k}
                  style={[
                    styles.fieldRowWrap,
                    fIdx < grp.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line2 },
                    isSelected && { backgroundColor: colors.brandSoft },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.fieldRow}
                    onPress={() => handleSelectField(fld.k, fld.pg)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[styles.fieldKeyText, { color: colors.ink }]}>{fld.k}</Text>
                        {fld.req && fld.v == null && (
                          <View style={[styles.badgePill, { backgroundColor: '#fdecec' }]}>
                            <Text style={[styles.badgePillText, { color: colors.red }]}>required</Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={[
                          styles.fieldValText,
                          {
                            color: isMissing ? colors.red : colors.ink,
                            fontStyle: isMissing ? 'italic' : 'normal',
                          },
                        ]}
                      >
                        {fld.v || 'Not found'}
                      </Text>

                      <View style={styles.fieldMetaRow}>
                        <View style={[styles.sourcePill, { backgroundColor: colors.surface2 }]}>
                          <Text style={[styles.sourcePillText, { color: colors.muted }]}>{fld.s}</Text>
                        </View>
                        <Text style={[styles.pageMetaText, { color: colors.muted }]}>p.{fld.pg}</Text>
                        {fld.warn && (
                          <View style={[styles.badgePill, { backgroundColor: '#fdf1e0' }]}>
                            <Text style={[styles.badgePillText, { color: colors.amber }]}>{fld.warn}</Text>
                          </View>
                        )}
                        {fld.note && !fld.warn && (
                          <Text style={[styles.noteText, { color: colors.muted }]} numberOfLines={1}>
                            · {fld.note}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.confidenceBarCol}>
                      <View style={[styles.confBarTrack, { backgroundColor: colors.surface2 }]}>
                        <View
                          style={[
                            styles.confBarFill,
                            {
                              width: `${Math.round(fld.c * 100)}%`,
                              backgroundColor: barColor,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.confScoreText, { color: colors.muted }]}>
                        {fld.c.toFixed(2)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.editIconBtn}
                      onPress={() => handleStartEdit(fld)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Pencil size={15} color={colors.brandDark} />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Inline Field Editor */}
                  {isEditing && (
                    <View style={[styles.inlineEditBox, { backgroundColor: colors.brandSoft, borderColor: colors.line }]}>
                      <Text style={[styles.editHintText, { color: colors.muted }]}>
                        {fld.k} · {fld.v == null ? 'add value read from document' : 'correct extracted value'}
                      </Text>
                      <TextInput
                        style={[styles.editInput, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line }]}
                        value={editValue}
                        onChangeText={setEditValue}
                        placeholder="Type value…"
                        placeholderTextColor={colors.muted}
                        autoFocus
                      />
                      <View style={styles.editActionRow}>
                        <TouchableOpacity
                          style={[styles.cancelBtn, { borderColor: colors.line }]}
                          onPress={handleCancelEdit}
                        >
                          <Text style={[styles.cancelBtnText, { color: colors.ink }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.saveBtn, { backgroundColor: colors.brand }]}
                          onPress={() => handleSaveEdit(fld.k)}
                        >
                          <Text style={styles.saveBtnText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        <Text style={[styles.footerNoteText, { color: colors.muted }]}>
          Sources: regex layoutlm llm (OpenRouter → Gemini) manual. Field names are placeholders for the parser's real 20+ fields.
        </Text>
      </ScrollView>

      {/* Sticky Bottom Actions Bar */}
      <View
        style={[
          styles.stickyFooter,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.line,
            paddingBottom: Math.max(insets.bottom + 8, 16),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.footerBtnOutline, { borderColor: colors.line }]}
          onPress={handleRerunOcr}
          disabled={isRerunning}
        >
          {isRerunning ? (
            <RotateCw size={16} color={colors.brandDark} />
          ) : (
            <Text style={[styles.footerBtnOutlineText, { color: colors.brandDark }]}>Re-run OCR</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerBtnFilled, { backgroundColor: colors.brand }]}
          onPress={handleAcceptFields}
        >
          <Text style={styles.footerBtnFilledText}>Accept fields → Coding</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Document Modal */}
      <Modal
        visible={docToDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDocToDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.ink }]}>
              Remove {docToDelete?.name}?
            </Text>
            <Text style={[styles.modalBody, { color: colors.muted }]}>
              The document file will be detached from this claim; its OCR text and parsed fields will be dropped.
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.line }]}
                onPress={() => setDocToDelete(null)}
              >
                <Text style={[styles.modalCancelText, { color: colors.ink }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalDeleteBtn, { backgroundColor: colors.red }]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.modalDeleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast Bar */}
      {toastMsg && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastMessage}>{toastMsg}</Text>
        </View>
      )}
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
  scrollInner: {
    padding: 13,
    paddingBottom: 20,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  appBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Document Selector Chips
  docChipsScroll: {
    flexDirection: 'row',
    gap: 7,
    paddingBottom: 12,
  },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
  },
  docChipText: {
    fontSize: 12,
  },
  docChipCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
  },
  docChipCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  addDocChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
  },
  addDocChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Document Card
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  docIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  docCardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },

  // 4-Metric Grid
  statsGrid: {
    flexDirection: 'row',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 9.5,
    marginTop: 2,
  },

  // Meta Pills
  metaPillsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  docActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  docActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Scan Analysis
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  severityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  severityPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  modalityChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  modalityChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  modalityChipText: {
    fontSize: 10.5,
  },
  findingsList: {
    marginBottom: 10,
  },
  findingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  findingTitle: {
    flex: 1,
    fontSize: 12,
  },
  findingBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  findingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  linkedCodesTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  codeBox: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeBoxText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  codeDescText: {
    flex: 1,
    fontSize: 11.5,
  },
  reviewCodingBtn: {
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 10,
  },
  reviewCodingBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Document Viewer Controls
  viewerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  viewerControlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentedToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  segmentBtn: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 6,
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Paper Canvas
  paperCanvas: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    minHeight: 220,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  paperHeading: {
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  paperSubheading: {
    fontSize: 11,
    marginBottom: 8,
  },
  paperDivider: {
    height: 1,
    marginVertical: 8,
  },
  paperParagraphRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 6,
  },
  paperParagraph: {
    lineHeight: 18,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  paperBodyText: {
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  paperLabelText: {
    color: '#6b7a8c',
    fontWeight: '600',
  },
  highlightSpan: {
    borderRadius: 3,
    paddingHorizontal: 3,
    marginHorizontal: 1,
    position: 'relative',
    marginVertical: 1,
  },
  highlightText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  tagBadge: {
    position: 'absolute',
    top: -9,
    right: -7,
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagBadgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
  },

  // Raw OCR View
  rawCanvas: {
    backgroundColor: '#152238',
    borderRadius: 12,
    padding: 12,
    minHeight: 220,
    marginBottom: 8,
  },
  rawText: {
    color: '#d7e2ec',
    fontSize: 11,
    lineHeight: 17,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Page Switcher
  pageNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pageIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pageBtnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  pageNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 10.5,
  },
  legendHint: {
    fontSize: 10,
    marginLeft: 'auto',
  },

  // Fields Section
  fieldsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  claimTotalText: {
    fontSize: 11.5,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11.5,
  },

  // Grouped Fields Card
  fieldsGroupCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  groupHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  groupHeaderCount: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fieldRowWrap: {},
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  fieldKeyText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fieldValText: {
    fontSize: 12.5,
    marginTop: 2,
  },
  fieldMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  sourcePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sourcePillText: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pageMetaText: {
    fontSize: 10.5,
  },
  badgePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgePillText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  noteText: {
    fontSize: 10.5,
    flex: 1,
  },
  confidenceBarCol: {
    width: 44,
    alignItems: 'flex-end',
  },
  confBarTrack: {
    width: 42,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  confBarFill: {
    height: 4,
  },
  confScoreText: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  editIconBtn: {
    padding: 6,
  },

  // Inline Editor
  inlineEditBox: {
    padding: 10,
    borderTopWidth: 1,
  },
  editHintText: {
    fontSize: 10.5,
    marginBottom: 6,
  },
  editInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    marginBottom: 8,
  },
  editActionRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },

  footerNoteText: {
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 4,
    marginBottom: 12,
  },

  // Sticky Footer
  stickyFooter: {
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 13,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerBtnOutline: {
    flex: 0.42,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnOutlineText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerBtnFilled: {
    flex: 0.58,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnFilledText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal
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
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalDeleteBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    bottom: 85,
    left: 14,
    right: 14,
    backgroundColor: '#152238',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastMessage: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
