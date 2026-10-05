import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  FileText,
  UploadCloud,
  X,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { claimsApi, UploadFilePayload } from '../services/claimsApi';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { usePipelineStore } from '../../../state/usePipelineStore';
import { Routes } from '../../../app/navigation/routes';
import { ClaimItem } from '../../../mocks/claims.mock';

interface UploadRequestedDocsModalProps {
  visible: boolean;
  onClose: () => void;
  claimId?: string;
  claim?: ClaimItem | any;
  patientName?: string;
  reviewerMessage?: string;
  requestedDocs?: string[];
  insurerName?: string;
  navigation?: any;
  onSuccess?: () => void;
}

export const UploadRequestedDocsModal: React.FC<UploadRequestedDocsModalProps> = ({
  visible,
  onClose,
  claimId,
  claim,
  patientName,
  reviewerMessage,
  requestedDocs = [],
  insurerName,
  navigation,
  onSuccess,
}) => {
  const { colors, isDark } = useTheme();
  const { loadClaims } = useClaimsStore();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadFilePayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const effectiveClaimId = claimId || claim?.id || '';
  const effectivePatientName = patientName || claim?.who || '';
  const effectiveReviewerNote = (reviewerMessage || claim?.tpaMessage || '').trim();
  const effectiveRequestedDocs = (requestedDocs && requestedDocs.length > 0) ? requestedDocs : (claim?.tpaRequestedDocs || []);
  const effectiveInsurerName = insurerName || claim?.insuranceCompany || 'Insurer';

  const shortId = (effectiveClaimId || '').slice(0, 8).toUpperCase();
  const reviewerNote = effectiveReviewerNote ? effectiveReviewerNote : null;

  const handlePickDocument = async () => {
    setErrorMessage(null);

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.png,.jpg,.jpeg,.webp';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          await doUpload({
            name: file.name,
            type: file.type,
            blob: file,
          });
        }
      };
      input.click();
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await doUpload({
          name: asset.name,
          type: asset.mimeType || 'application/pdf',
          uri: asset.uri,
        });
      }
    } catch (err: any) {
      console.warn('[UploadRequestedDocsModal] DocumentPicker error:', err);
      setErrorMessage(err?.message || 'Failed to open document picker');
    }
  };

  const handlePickPhoto = async () => {
    setErrorMessage(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow photo gallery access to upload documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const name = asset.fileName || `RequestedDoc_${Date.now()}.jpg`;
        await doUpload({
          name,
          type: asset.mimeType || 'image/jpeg',
          uri: asset.uri,
        });
      }
    } catch (err: any) {
      console.warn('[UploadRequestedDocsModal] ImagePicker error:', err);
      setErrorMessage(err?.message || 'Failed to select image from library');
    }
  };

  const handleTakePhoto = async () => {
    setErrorMessage(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow camera access to photograph documents.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.85,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const name = asset.fileName || `Scan_${Date.now()}.jpg`;
        await doUpload({
          name,
          type: asset.mimeType || 'image/jpeg',
          uri: asset.uri,
        });
      }
    } catch (err: any) {
      console.warn('[UploadRequestedDocsModal] Camera error:', err);
      setErrorMessage(err?.message || 'Failed to open camera');
    }
  };

  const doUpload = async (fileObj: UploadFilePayload) => {
    if (!effectiveClaimId) return;
    setIsUploading(true);
    setSelectedFile(fileObj);
    setErrorMessage(null);

    try {
      await claimsApi.appendDocumentsToClaim(effectiveClaimId, [fileObj]);

      // Select active claim and update status in claims store
      useClaimsStore.getState().selectClaim(effectiveClaimId);
      useClaimsStore.getState().addOrUpdateClaim({
        id: effectiveClaimId,
        who: effectivePatientName || 'Processing claim...',
        status: 'running',
        step: 'ocr',
        hasActionRequest: false,
      });

      // Immediately initiate pipeline runner and real-time backend polling
      usePipelineStore.getState().startPipeline(
        [
          {
            name: fileObj.name,
            docType: 'requested_document',
            kind: fileObj.type?.includes('image') ? 'jpg' : 'digital',
          },
        ],
        effectiveClaimId
      );

      await loadClaims(true);
      setIsUploading(false);
      setSelectedFile(null);
      onClose();

      if (onSuccess) {
        onSuccess();
      } else if (navigation) {
        navigation.navigate(Routes.WorkflowPipeline);
      }
    } catch (err: any) {
      console.error('[UploadRequestedDocsModal] Upload failed:', err);
      setIsUploading(false);
      setErrorMessage(err?.message || 'Failed to upload document. Please try again.');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isUploading) onClose();
      }}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheetContainer, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.line }]}>
            <View style={styles.headerTitleWrap}>
              <View style={[styles.iconChip, { backgroundColor: colors.amberSoft }]}>
                <AlertTriangle size={18} color={colors.amber} />
              </View>
              <View style={styles.headerTexts}>
                <Text style={[styles.title, { color: colors.ink }]}>Upload Requested Docs</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  Claim #{shortId} {effectivePatientName ? `· ${effectivePatientName}` : ''}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              disabled={isUploading}
              style={[styles.closeBtn, { backgroundColor: colors.surface2 }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* Reviewer Note Banner */}
            <View style={[styles.alertBanner, { backgroundColor: isDark ? '#2D2012' : '#FFFBEB', borderColor: colors.amber }]}>
              <View style={styles.alertHeader}>
                <AlertTriangle size={15} color={colors.amber} />
                <Text style={[styles.alertHeading, { color: colors.amber }]}>
                  {effectiveInsurerName ? `${effectiveInsurerName.toUpperCase()} REQUEST` : 'INSURER DOCUMENT REQUEST'}
                </Text>
              </View>
              {reviewerNote && (
                <View style={[styles.noteBox, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.noteLabel, { color: colors.muted }]}>Reviewer Message:</Text>
                  <Text style={[styles.noteText, { color: colors.ink }]}>"{reviewerNote}"</Text>
                </View>
              )}
              {effectiveRequestedDocs && effectiveRequestedDocs.length > 0 && (
                <View style={styles.docsListWrap}>
                  <Text style={[styles.docsListTitle, { color: colors.ink }]}>Requested Items:</Text>
                  <View style={styles.chipRow}>
                    {effectiveRequestedDocs.map((item: string, idx: number) => (
                      <View key={idx} style={[styles.docChip, { backgroundColor: colors.amberSoft }]}>
                        <Text style={[styles.docChipText, { color: colors.amber }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Error Message */}
            {errorMessage && (
              <View style={[styles.errorBox, { backgroundColor: colors.redSoft }]}>
                <Text style={[styles.errorText, { color: colors.red }]}>{errorMessage}</Text>
              </View>
            )}

            {/* Uploading Spinner */}
            {isUploading && (
              <View style={[styles.loadingBox, { backgroundColor: colors.surface2 }]}>
                <ActivityIndicator size="large" color={colors.brand} />
                <Text style={[styles.loadingText, { color: colors.ink }]}>
                  Uploading {selectedFile?.name || 'document'}...
                </Text>
                <Text style={[styles.loadingSubtext, { color: colors.muted }]}>
                  Resuming AI verification and insurer review pipeline
                </Text>
              </View>
            )}

            {/* Upload Options */}
            {!isUploading && (
              <View style={styles.optionsWrap}>
                <Text style={[styles.sectionTitle, { color: colors.muted }]}>
                  SELECT HOW TO ADD DOCUMENT
                </Text>

                {/* Option 1: Camera */}
                <TouchableOpacity
                  style={[styles.optionCard, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                  onPress={handleTakePhoto}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, { backgroundColor: colors.brandSoft }]}>
                    <Camera size={22} color={colors.brandDark} />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionName, { color: colors.ink }]}>Take Photo</Text>
                    <Text style={[styles.optionDesc, { color: colors.muted }]}>
                      Capture paper document or bill using camera
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.muted} />
                </TouchableOpacity>

                {/* Option 2: Gallery */}
                <TouchableOpacity
                  style={[styles.optionCard, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                  onPress={handlePickPhoto}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#EDE9FE' }]}>
                    <ImageIcon size={22} color="#7C3AED" />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionName, { color: colors.ink }]}>Photo Library</Text>
                    <Text style={[styles.optionDesc, { color: colors.muted }]}>
                      Pick captured document photo from gallery
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.muted} />
                </TouchableOpacity>

                {/* Option 3: Document File (PDF) */}
                <TouchableOpacity
                  style={[styles.optionCard, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                  onPress={handlePickDocument}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, { backgroundColor: colors.greenSoft }]}>
                    <FileText size={22} color={colors.green} />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionName, { color: colors.ink }]}>Browse Files</Text>
                    <Text style={[styles.optionDesc, { color: colors.muted }]}>
                      Upload PDF, scan report, or discharge summary
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.muted} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconChip: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  scrollBody: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 18,
  },
  alertBanner: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  alertHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noteBox: {
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  noteLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  noteText: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  docsListWrap: {
    marginTop: 10,
  },
  docsListTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  docChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  docChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderRadius: 16,
    marginVertical: 10,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
  },
  loadingSubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  optionsWrap: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 11.5,
    lineHeight: 15,
  },
});
