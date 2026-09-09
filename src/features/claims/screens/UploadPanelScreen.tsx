import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useUploadStore, UploadFileItem } from '../../../state/useUploadStore';
import { usePipelineStore } from '../../../state/usePipelineStore';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { useAuthStore } from '../../../state/useAuthStore';
import { Routes } from '../../../app/navigation/routes';
import {
  ArrowLeft,
  UploadCloud,
  Camera,
  Image as ImageIcon,
  FileText,
  Smartphone,
  X,
  FileCode,
} from 'lucide-react-native';

const DOCTYPES = [
  'discharge_summary',
  'hospital_bill',
  'pharmacy_bill',
  'scan_report',
  'policy_card',
  'id_proof',
  'other',
];

const LAT: Record<string, string> = {
  digital: '2–5 s',
  scanned: '15–30 s',
  jpg: '5–15 s',
  docx: '1–2 s',
};

export const UploadPanelScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const {
    files,
    eventLogs,
    claimType,
    uploading,
    addFile,
    addRealFile,
    removeFile,
    clearFiles,
    setDocType,
    setClaimType,
    uploadToBackend,
  } = useUploadStore();
  const { startPipeline } = usePipelineStore();
  const { addOrUpdateClaim } = useClaimsStore();

  const [selectedDocTypePicker, setSelectedDocTypePicker] = useState<string | null>(null);

  const hasFiles = files.length > 0;
  const isReady = hasFiles && files.every(f => f.status === 'ready') && !uploading;

  const handleStartPipeline = async () => {
    if (!hasFiles || uploading) return;

    // Trigger real backend upload
    const auth = useAuthStore.getState();
    const { claimId } = await uploadToBackend({
      policyId: auth.policyNumber || 'P-0007401',
      patientId: auth.userId || 'ec78998a-0228-434a-84f4-e08b4b7417e2',
    });

    // Register active new claim in claims store
    addOrUpdateClaim({
      id: claimId,
      who: files[0]?.name ? `Processing ${files[0].name}...` : 'Processing claim...',
      dept: 'General Medicine',
      amt: 184500,
      status: 'running',
      step: 'ocr',
      indexed: false,
      claimType: claimType,
    });

    startPipeline(
      files.map(f => ({
        name: f.name,
        docType: f.docType,
        kind: f.kind,
      })),
      claimId
    );

    navigation.navigate(Routes.WorkflowPipeline);
  };

  const handleAddDefaultSample = () => {
    addFile('Discharge_Summary.pdf|digital|discharge_summary|0.96');
    setTimeout(() => addFile('Hospital_Bill.jpg|jpg|hospital_bill|0.93'), 150);
    setTimeout(() => addFile('Policy_Card.pdf|scanned|policy_card|0.90'), 300);
  };

  const handlePickFiles = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.csv,.xlsx';
      input.onchange = (e: any) => {
        const selected = e.target.files;
        if (selected && selected.length > 0) {
          for (let i = 0; i < selected.length; i++) {
            const f = selected[i];
            addRealFile({
              name: f.name,
              size: f.size,
              type: f.type,
              blob: f,
            });
          }
        }
      };
      input.click();
    } else {
      addFile('Lab_Report.pdf|digital|lab_report|0.91');
    }
  };

  const handleDropZonePress = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      handlePickFiles();
    } else {
      handleAddDefaultSample();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* App Bar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.ink }]}>Upload panel</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Dropzone Card */}
          <TouchableOpacity
            style={[styles.dropZone, { backgroundColor: colors.surface, borderColor: colors.line }]}
            onPress={handleDropZonePress}
            activeOpacity={0.8}
          >
            <UploadCloud size={34} color={colors.muted} strokeWidth={1.7} />
            <Text style={[styles.dropTitle, { color: colors.ink }]}>Drop claim documents here</Text>
            <Text style={[styles.dropSubtitle, { color: colors.muted }]}>
              {Platform.OS === 'web' ? 'Click to browse files · PDF, images, docs' : 'PDF · images · Word · Excel · CSV'}
            </Text>
          </TouchableOpacity>

          {/* 4 Source Buttons Grid */}
          <View style={styles.srcGrid}>
            <TouchableOpacity
              style={[styles.srcBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => addFile('Discharge_Summary.pdf|digital|discharge_summary|0.96')}
              activeOpacity={0.75}
            >
              <Camera size={18} color={colors.muted} strokeWidth={1.8} />
              <Text style={[styles.srcText, { color: colors.muted }]}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.srcBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => addFile('Hospital_Bill.jpg|jpg|hospital_bill|0.93')}
              activeOpacity={0.75}
            >
              <ImageIcon size={18} color={colors.muted} strokeWidth={1.8} />
              <Text style={[styles.srcText, { color: colors.muted }]}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.srcBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={handlePickFiles}
              activeOpacity={0.75}
            >
              <FileText size={18} color={colors.muted} strokeWidth={1.8} />
              <Text style={[styles.srcText, { color: colors.muted }]}>Files</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.srcBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => addFile('Screenshot_2026-09-07.png|jpg|pharmacy_bill|0.81')}
              activeOpacity={0.75}
            >
              <Smartphone size={18} color={colors.muted} strokeWidth={1.8} />
              <Text style={[styles.srcText, { color: colors.muted }]}>Screenshot</Text>
            </TouchableOpacity>
          </View>

          {/* Attached Header */}
          <View style={styles.secRow}>
            <Text style={[styles.secTitle, { color: colors.ink }]}>
              Attached <Text style={[styles.secCount, { color: colors.muted }]}>({files.length})</Text>
            </Text>
            {hasFiles && (
              <TouchableOpacity onPress={clearFiles} activeOpacity={0.7}>
                <Text style={[styles.clearBtn, { color: colors.brandDark }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Attached Files List */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {!hasFiles ? (
              <View style={styles.emptyFiles}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  No documents yet — tap a source above.
                </Text>
              </View>
            ) : (
              files.map((file, idx) => {
                const isLast = idx === files.length - 1;
                const isPickerOpen = selectedDocTypePicker === file.id;

                return (
                  <View
                    key={file.id}
                    style={[
                      styles.fileItem,
                      !isLast && { borderBottomWidth: 1, borderBottomColor: colors.line2 },
                    ]}
                  >
                    <View style={styles.fileRowMain}>
                      <View style={[styles.thumb, { backgroundColor: colors.brandSoft }]}>
                        <FileCode size={18} color={colors.brandDark} />
                      </View>

                      <View style={styles.fileDetails}>
                        <Text style={[styles.fileName, { color: colors.ink }]} numberOfLines={1}>
                          {file.name}
                        </Text>
                        <Text style={[styles.fileMeta, { color: colors.muted }]}>
                          {file.size} · est. {LAT[file.kind] || '5 s'} ·{' '}
                          <Text
                            style={{
                              color:
                                file.status === 'ready'
                                  ? colors.green
                                  : file.status === 'failed'
                                  ? colors.red
                                  : colors.brandDark,
                              fontWeight: '600',
                            }}
                          >
                            {file.status}
                          </Text>
                        </Text>

                        {/* Doc Type Selector */}
                        <View style={styles.docTypeRow}>
                          <Text style={[styles.docTypeLabel, { color: colors.muted }]}>doc_type</Text>
                          <TouchableOpacity
                            style={[
                              styles.docTypeBadge,
                              { backgroundColor: colors.surface2, borderColor: colors.line },
                            ]}
                            onPress={() =>
                              setSelectedDocTypePicker(isPickerOpen ? null : file.id)
                            }
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.docTypeText, { color: colors.brandDark }]}>
                              {file.docType}
                            </Text>
                          </TouchableOpacity>
                          <Text style={[styles.docTypeConf, { color: colors.muted }]}>
                            {file.conf.toFixed(2)}
                          </Text>
                        </View>

                        {/* Progress Bar */}
                        <View style={[styles.progTrack, { backgroundColor: colors.line }]}>
                          <View
                            style={[
                              styles.progFill,
                              {
                                width: `${file.pct}%`,
                                backgroundColor:
                                  file.status === 'failed' ? colors.red : colors.brand,
                              },
                            ]}
                          />
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.rmBtn}
                        onPress={() => removeFile(file.id)}
                        activeOpacity={0.7}
                      >
                        <X size={16} color={colors.muted} />
                      </TouchableOpacity>
                    </View>

                    {/* Doc Type Picker Dropdown Chips */}
                    {isPickerOpen && (
                      <View style={styles.pickerGrid}>
                        {DOCTYPES.map(dt => (
                          <TouchableOpacity
                            key={dt}
                            style={[
                              styles.pickerChip,
                              {
                                backgroundColor:
                                  file.docType === dt ? colors.brandSoft : colors.surface2,
                                borderColor: file.docType === dt ? colors.brand : colors.line,
                              },
                            ]}
                            onPress={() => {
                              setDocType(file.id, dt);
                              setSelectedDocTypePicker(null);
                            }}
                          >
                            <Text
                              style={[
                                styles.pickerChipText,
                                {
                                  color: file.docType === dt ? colors.brandDark : colors.ink,
                                  fontWeight: file.docType === dt ? '700' : '500',
                                },
                              ]}
                            >
                              {dt}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          <Text style={[styles.noteText, { color: colors.muted }]}>
            Each file gets an auto-detected <Text style={styles.mono}>doc_type</Text> with confidence — override it if the router got it wrong.
          </Text>

          {/* Activity Log Section */}
          <View style={styles.secRow}>
            <Text style={[styles.secTitle, { color: colors.ink }]}>Upload activity log</Text>
            <Text style={[styles.logFileName, { color: colors.muted }]}>claim_uploads.txt</Text>
          </View>

          <View style={[styles.card, styles.logCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {eventLogs.length === 0 ? (
              <Text style={[styles.emptyLogText, { color: colors.muted }]}>
                Events appear as files are received.
              </Text>
            ) : (
              eventLogs.slice(0, 5).map((log, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.logRow,
                    idx < Math.min(eventLogs.length, 5) - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.line2,
                    },
                  ]}
                >
                  <Text style={[styles.logTime, { color: colors.muted }]}>{log.time}</Text>
                  <Text
                    style={[
                      styles.logEvent,
                      { color: log.isError ? colors.red : colors.brandDark },
                    ]}
                  >
                    {log.event}
                  </Text>
                  <Text style={[styles.logDetail, { color: colors.muted }]} numberOfLines={1}>
                    {log.detail}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Claim Type Section */}
          <View style={styles.secRow}>
            <Text style={[styles.secTitle, { color: colors.ink }]}>Claim type</Text>
          </View>

          <View style={styles.claimTypeRow}>
            {(['Reimbursement', 'Cashless', 'Pre-authorisation'] as const).map(type => {
              const isSelected = claimType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: isSelected ? colors.brandSoft : colors.surface,
                      borderColor: isSelected ? colors.brand : colors.line,
                    },
                  ]}
                  onPress={() => setClaimType(type)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      {
                        color: isSelected ? colors.brandDark : colors.ink,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Sticky Bottom Actions Bar */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.line }]}
            onPress={() => navigation.navigate(Routes.ChatTab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.outlineBtnText, { color: colors.brandDark }]}>Back to chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.brand, opacity: isReady ? 1 : 0.5 },
            ]}
            onPress={handleStartPipeline}
            disabled={!isReady}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{uploading ? 'Uploading…' : 'Start pipeline'}</Text>
          </TouchableOpacity>
        </View>
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
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  scrollContent: {
    padding: 13,
    paddingBottom: 24,
  },
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 22,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dropTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 8,
  },
  dropSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  srcGrid: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 14,
  },
  srcBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  srcText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  secRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
  },
  secTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  secCount: {
    fontSize: 11.5,
    fontWeight: '400',
  },
  clearBtn: {
    fontSize: 12,
    fontWeight: '600',
  },
  logFileName: {
    fontFamily: 'monospace',
    fontSize: 10.5,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  emptyFiles: {
    paddingVertical: 22,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
  fileItem: {
    padding: 11,
  },
  fileRowMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  thumb: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  fileMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  docTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  docTypeLabel: {
    fontSize: 11,
  },
  docTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  docTypeText: {
    fontFamily: 'monospace',
    fontSize: 10.5,
    fontWeight: '600',
  },
  docTypeConf: {
    fontSize: 10.5,
  },
  progTrack: {
    height: 4,
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 8,
  },
  progFill: {
    height: '100%',
    borderRadius: 99,
  },
  rmBtn: {
    padding: 4,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eef2f6',
  },
  pickerChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  pickerChipText: {
    fontSize: 10.5,
  },
  noteText: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 12,
    marginHorizontal: 2,
  },
  mono: {
    fontFamily: 'monospace',
  },
  logCard: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    maxHeight: 130,
  },
  emptyLogText: {
    fontSize: 11.5,
    paddingVertical: 10,
    textAlign: 'center',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 5,
  },
  logTime: {
    fontFamily: 'monospace',
    fontSize: 9.5,
  },
  logEvent: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: '700',
  },
  logDetail: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    flex: 1,
  },
  claimTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 11.5,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 9,
  },
  outlineBtn: {
    flex: 0.38,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 0.62,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
