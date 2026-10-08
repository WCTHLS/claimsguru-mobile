import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Upload,
  Pencil,
  Moon,
  User,
  Clock,
  LogOut,
  Paperclip,
  Send,
  LayoutGrid,
  Lock,
  UserPlus,
  MessageSquare,
  Layers,
  Cpu,
  Activity,
  ShieldAlert,
  CheckSquare,
  Code,
  Folder,
  Scan,
  FileSearch,
  Search,
  ListFilter,
  Settings,
  Terminal,
  Home,
  Check,
  X,
  Eye,
  AlertTriangle,
  UploadCloud,
  Sparkles,
  ShieldCheck,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useUploadStore, UploadFileItem } from '../../../state/useUploadStore';
import { usePipelineStore } from '../../../state/usePipelineStore';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { claimsApi } from '../../claims/services/claimsApi';
import { useAuthStore } from '../../../state/useAuthStore';
import { fetchUserProfile } from '../../../core/api/authApi';
import { Routes } from '../../../app/navigation/routes';
import { UserAvatar } from '../../../core/components/UserAvatar';
import { AppHeader } from '../../../core/components/AppHeader';
import { DuplicateClaimModal } from '../../../core/components/DuplicateClaimModal';
import { ClaimItem } from '../../../mocks/claims.mock';
import { UploadRequestedDocsModal } from '../../claims/components/UploadRequestedDocsModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental && !(global as any).nativeFabricUIManager) {
  try {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  } catch {}
}

export interface FeatureDef {
  id: string;
  g: string; // group
  nav: string; // route name in Routes
  n: string; // display name
  d: string; // description
  iconName: string;
  perm?: 'ops' | 'upload' | 'submit' | 'review' | 'delete' | 'settings' | 'index';
  params?: Record<string, any>;
}

export const ALL_FEATURES: FeatureDef[] = [
  { id: 'signin', g: 'Access', nav: Routes.SignIn, n: 'Sign in', d: 'Patient portal sign in · local & Entra', iconName: 'lock' },
  { id: 'signup', g: 'Access', nav: Routes.SignUp, n: 'Register', d: 'Patient account creation · insurance profile', iconName: 'user-plus' },
  { id: 'home', g: 'Main', nav: Routes.ChatTab, n: 'Home', d: 'Patient portal dashboard & claim uploads', iconName: 'home' },
  { id: 'sessions', g: 'Main', nav: Routes.SessionsTab, n: 'History', d: 'Audit history & activity events', iconName: 'clock' },
  { id: 'claims', g: 'Claims', nav: Routes.ClaimsTab, n: 'Claims', d: 'Active & processed claims list', iconName: 'file-text' },
  { id: 'docs', g: 'Claims', nav: Routes.DocumentGrid, n: 'Documents', d: 'All uploaded files across claims', iconName: 'folder' },
  { id: 'upload', g: 'Claims', nav: Routes.UploadPanel, n: 'Upload', d: 'Camera · gallery · files', iconName: 'upload' },
  { id: 'processing', g: 'Claims', nav: Routes.WorkflowPipeline, n: 'Workflow', d: 'OCR → Parse → Code → Predict → Validate', iconName: 'layers' },
  { id: 'detail', g: 'Claims', nav: Routes.ClaimDetail, n: 'Claim detail', d: 'Summary, policy info & diagnosis', iconName: 'file-text', params: { claimId: 'a4f1c9e2' } },
  { id: 'brainpreview', g: 'AI Brain', nav: Routes.BrainPreview, n: 'AI Brain', d: 'KPI strip, expenses, risk & readiness', iconName: 'cpu', params: { claimId: 'a4f1c9e2' } },
  { id: 'risk', g: 'AI Brain', nav: Routes.RiskDetail, n: 'Risk', d: 'Rejection probability & top risk drivers', iconName: 'activity', params: { claimId: 'a4f1c9e2' } },
  { id: 'fraud', g: 'AI Brain', nav: Routes.FraudDetail, n: 'Fraud', d: '6 signal families · hybrid risk score', iconName: 'shield-alert', params: { claimId: 'a4f1c9e2' } },
  { id: 'validation', g: 'AI Brain', nav: Routes.ValidationRules, n: 'Validation', d: 'R001–R011 deterministic rules checklist', iconName: 'check-square', params: { claimId: 'a4f1c9e2' } },
  { id: 'coding', g: 'AI Brain', nav: Routes.MedicalCoding, n: 'Coding', d: 'ICD-10 & CPT procedure code review', iconName: 'code', params: { claimId: 'a4f1c9e2' } },
  { id: 'patient', g: 'Patient', nav: Routes.PatientProfile, n: 'Patient', d: 'Demographics, policy & KYC details', iconName: 'user' },
  { id: 'activity', g: 'Patient', nav: Routes.PatientActivity, n: 'Activity', d: 'Audit history & state change diffs', iconName: 'clock' },
  { id: 'search', g: 'Other', nav: Routes.SearchTab, n: 'Search', d: 'Full-text & semantic vector search', iconName: 'search' },
  { id: 'submit', g: 'Other', nav: Routes.Submission, n: 'Submission', d: 'Payer submission & IRDAI claim forms', iconName: 'send' },
  { id: 'profile', g: 'Other', nav: Routes.ProfileSettings, n: 'Profile', d: 'User roles, preferences & settings', iconName: 'settings' },
];

const STEP_DATA = [
  { name: 'OCR', defaultMsg: 'Text extracted from claim documents' },
  { name: 'Parse', defaultMsg: 'Parsed patient, doctor, hospital & billing fields' },
  { name: 'Code', defaultMsg: 'ICD-10 & CPT medical codes suggested' },
  { name: 'Predict', defaultMsg: 'Risk rejection & anomaly probability scored' },
  { name: 'Validate', defaultMsg: 'Deterministic validation & compliance checks' },
];

export const ChatHomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { files, addFile, addRealFile, removeFile, clearFiles, uploadToBackend } = useUploadStore();
  const {
    active: pipelineActive,
    running: pipelineRunning,
    failed: pipelineFailed,
    complete: pipelineComplete,
    stepStates: pipelineStepStates,
    stepMessages: pipelineStepMessages,
    claimId: pipelineClaimId,
    progressPercentage: pipelineProgress,
    totalSeconds: pipelineSeconds,
    claimWho: pipelineClaimWho,
    attempt: pipelineAttempt,
    startPipeline,
    retryPipeline,
    resetPipeline,
  } = usePipelineStore();
  const { role, userName, userEmail, userId, signOut, gender, setUserDetails } = useAuthStore();

  useEffect(() => {
    if (userEmail || userId) {
      fetchUserProfile(userId || userEmail).catch(() => {});
    }
  }, [userEmail, userId]);

  // Reset any stale idle pipeline state when mounting Home screen
  useEffect(() => {
    if (!usePipelineStore.getState().running) {
      usePipelineStore.getState().resetPipeline();
    }
  }, []);

  // Once claim processing completes, clear the upload section of the previous claim's files
  useEffect(() => {
    if (pipelineComplete && files.length > 0) {
      clearFiles();
    }
  }, [pipelineComplete]);

  const getInitials = (name?: string) => {
    if (
      !name ||
      !name.trim() ||
      name.toLowerCase() === 'sample' ||
      name.toLowerCase() === 'unknown' ||
      name.toLowerCase().includes('sample@')
    ) {
      return 'JD';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  const userInitials = getInitials(userName);
  const firstName = userName && userName.toLowerCase() !== 'sample' ? userName.split(' ')[0] : 'Jhon';

  const [isCardExpanded, setIsCardExpanded] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [duplicateClaimId, setDuplicateClaimId] = useState<string | null>(null);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const { claims, selectClaim, loadClaims } = useClaimsStore();
  const [uploadModalClaim, setUploadModalClaim] = useState<ClaimItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [pipelineStarting, setPipelineStarting] = useState(false);

  useEffect(() => {
    loadClaims().catch(() => {});
  }, [userId, userEmail]);

  const actionRequiredClaims = (claims || []).filter(
    c => c.hasActionRequest || (c.rawStatus || '').toUpperCase() === 'DOCUMENTS_REQUESTED' || (c.status as any) === 'docs_requested'
  );
  const topActionClaim = actionRequiredClaims[0];

  const isPipelineRunning = Boolean(
    pipelineStarting ||
    pipelineRunning ||
    (!pipelineComplete && !pipelineFailed && pipelineStepStates.some(s => s === 'r'))
  );

  const isPipelineComplete = Boolean(pipelineComplete && !isPipelineRunning);

  // The Claim Processing section is ONLY rendered when a claim is actively being processed,
  // or was just processed in the current session.
  // When idle and no claim is running, this is FALSE so the home screen stays completely clean!
  const isClaimProcessingActive = Boolean(
    isPipelineRunning ||
    (isPipelineComplete && Boolean(pipelineClaimId) && (pipelineProgress >= 100 || pipelineStepStates.every(s => s === 'd'))) ||
    (pipelineFailed && Boolean(pipelineClaimId))
  );

  const activeProcessingClaimId = isClaimProcessingActive ? (pipelineClaimId || null) : null;
  const activeProcessingClaim = activeProcessingClaimId
    ? (claims || []).find(c => c.id === activeProcessingClaimId) || null
    : null;

  const processingStatusLabel = pipelineFailed
    ? 'FAILED'
    : isPipelineComplete
    ? 'COMPLETE'
    : isPipelineRunning
    ? 'RUNNING'
    : 'READY';

  const processingStatusBg = pipelineFailed
    ? colors.redSoft
    : isPipelineComplete
    ? colors.greenSoft
    : isPipelineRunning
    ? colors.brandSoft
    : colors.surface2;

  const processingStatusText = pipelineFailed
    ? colors.red
    : isPipelineComplete
    ? colors.green
    : isPipelineRunning
    ? colors.brandDark
    : colors.muted;


  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2800);
  };

  const handlePickFiles = async (accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.csv,.xlsx') => {
    if (pipelineComplete) {
      usePipelineStore.getState().resetPipeline();
      clearFiles();
    }
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = accept;
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
          showToast(`Attached ${selected.length} file${selected.length > 1 ? 's' : ''}`);
        }
      };
      input.click();
    } else {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          multiple: true,
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          for (const asset of result.assets) {
            addRealFile({
              name: asset.name,
              size: asset.size,
              type: asset.mimeType || 'application/pdf',
              uri: asset.uri,
            });
          }
          showToast(`Attached ${result.assets.length} file${result.assets.length > 1 ? 's' : ''}`);
        }
      } catch (err) {
        console.warn('[ChatHomeScreen] DocumentPicker error:', err);
      }
    }
  };

  const handlePickGallery = async () => {
    if (pipelineComplete) {
      usePipelineStore.getState().resetPipeline();
      clearFiles();
    }
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      handlePickFiles('image/*');
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Media library permission required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        for (const asset of result.assets) {
          const name = asset.fileName || `Photo_${Date.now()}.jpg`;
          addRealFile({
            name,
            size: asset.fileSize || 1024 * 1024,
            type: asset.mimeType || 'image/jpeg',
            uri: asset.uri,
          });
        }
        showToast(`Attached ${result.assets.length} photo${result.assets.length > 1 ? 's' : ''}`);
      }
    } catch (err) {
      console.warn('[ChatHomeScreen] Gallery picker error:', err);
    }
  };

  const handleCameraPick = async () => {
    if (pipelineComplete) {
      usePipelineStore.getState().resetPipeline();
      clearFiles();
    }
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.setAttribute('capture', 'environment');
      input.onchange = (e: any) => {
        const selected = e.target.files;
        if (selected && selected.length > 0) {
          for (let i = 0; i < selected.length; i++) {
            const f = selected[i];
            addRealFile({
              name: f.name || `camera_${Date.now()}.jpg`,
              size: f.size,
              type: f.type || 'image/jpeg',
              blob: f,
            });
          }
          showToast('Attached photo from camera');
        }
      };
      input.click();
    } else {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showToast('Camera permission required');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const name = asset.fileName || `Camera_Scan_${Date.now()}.jpg`;
          addRealFile({
            name,
            size: asset.fileSize || 1024 * 1024,
            type: asset.mimeType || 'image/jpeg',
            uri: asset.uri,
          });
          showToast('Attached photo from camera');
        }
      } catch (err) {
        console.warn('[ChatHomeScreen] Camera error:', err);
      }
    }
  };

  const toggleCard = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCardExpanded(!isCardExpanded);
  };

  const handleStartPipeline = async (force: boolean = false) => {
    if (files.length === 0) {
      showToast('Please upload claim documents first');
      return;
    }
    if (pipelineStarting && !force) return;

    if (force) {
      setIsReprocessing(true);
    } else {
      setPipelineStarting(true);
      showToast('Connecting to backend pipeline...');
    }

    try {
      const auth = useAuthStore.getState();
      const filesToProcess = files;

      // 1. Upload to backend /ingress/claims/ to get a real PostgreSQL claim
      const uploadRes = await claimsApi.uploadClaim(
        filesToProcess.map(f => ({
          name: f.name,
          type: f.fileBlob?.type || (f.kind === 'jpg' ? 'image/jpeg' : 'application/pdf'),
          blob: f.fileBlob,
          uri: f.uri,
        })),
        {
          policyId: auth.policyNumber || undefined,
          patientId: auth.userId || undefined,
          email: auth.userEmail || undefined,
          force,
        }
      );

      const targetClaimId = uploadRes.claim_id || uploadRes.id;

      // Check if backend detected an already completed duplicate claim
      if (!force && uploadRes.is_duplicate) {
        setPipelineStarting(false);
        setIsReprocessing(false);
        setDuplicateClaimId(targetClaimId);
        return;
      }

      setDuplicateClaimId(null);
      setIsReprocessing(false);

      // 2. Add or update claim in Claims store
      useClaimsStore.getState().addOrUpdateClaim({
        id: targetClaimId,
        who: 'Processing claim...',
        dept: 'General Medicine',
        amt: 184500,
        status: 'running',
        step: 'ocr',
        indexed: false,
        claimType: 'Reimbursement',
        policyNo: auth.policyNumber || 'P-0007401',
      });

      // 3. Start the real workflow on the backend and initiate pipeline store polling
      startPipeline(
        filesToProcess.map(f => ({
          name: f.name,
          docType: f.docType,
          kind: f.kind,
        })),
        targetClaimId
      );

      setPipelineStarting(false);
      showToast('Processing claim on Home page…');
    } catch (err: any) {
      console.warn('[ChatHomeScreen] Pipeline upload failed:', err);
      setPipelineStarting(false);
      setIsReprocessing(false);
      const errMsg = err?.message || 'Could not upload claim documents to backend.';
      Alert.alert('Upload Error', `${errMsg}\n\nPlease check connection or credentials and try again.`);
    }
  };

  const handleNavigateFeature = (feat: FeatureDef) => {
    if (feat.perm === 'ops' && role !== 'admin') {
      showToast(`Requires the admin role — you are signed in as ${role}`);
      return;
    }
    if (feat.nav === Routes.ChatTab) {
      showToast('Already on Home');
      return;
    }
    if (showFeaturesModal) {
      setShowFeaturesModal(false);
    }
    navigation.navigate(feat.nav, feat.params);
  };

  const renderFeatureIcon = (name: string, color: string, size = 16) => {
    switch (name) {
      case 'home':
        return <Home size={size} color={color} />;
      case 'lock':
        return <Lock size={size} color={color} />;
      case 'user-plus':
        return <UserPlus size={size} color={color} />;
      case 'message-square':
        return <MessageSquare size={size} color={color} />;
      case 'clock':
        return <Clock size={size} color={color} />;
      case 'file-text':
        return <FileText size={size} color={color} />;
      case 'upload':
        return <Upload size={size} color={color} />;
      case 'layers':
        return <Layers size={size} color={color} />;
      case 'cpu':
        return <Cpu size={size} color={color} />;
      case 'activity':
        return <Activity size={size} color={color} />;
      case 'shield-alert':
        return <ShieldAlert size={size} color={color} />;
      case 'check-square':
        return <CheckSquare size={size} color={color} />;
      case 'code':
        return <Code size={size} color={color} />;
      case 'folder':
        return <Folder size={size} color={color} />;
      case 'scan':
        return <Scan size={size} color={color} />;
      case 'file-search':
        return <FileSearch size={size} color={color} />;
      case 'user':
        return <User size={size} color={color} />;
      case 'search':
        return <Search size={size} color={color} />;
      case 'send':
        return <Send size={size} color={color} />;
      case 'list-filter':
        return <ListFilter size={size} color={color} />;
      case 'settings':
        return <Settings size={size} color={color} />;
      case 'terminal':
        return <Terminal size={size} color={color} />;
      default:
        return <LayoutGrid size={size} color={color} />;
    }
  };

  // Group features for the All Features Menu modal
  const featureGroups: { title: string; items: FeatureDef[] }[] = [];
  ALL_FEATURES.forEach(f => {
    let grp = featureGroups.find(g => g.title === f.g);
    if (!grp) {
      grp = { title: f.g, items: [] };
      featureGroups.push(grp);
    }
    grp.items.push(f);
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* Header Bar */}
      <AppHeader navigation={navigation} />

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} keyboardShouldPersistTaps="handled">
        {/* Upload Claim Documents Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <TouchableOpacity style={styles.cardHeader} onPress={toggleCard} activeOpacity={0.7}>
            <View style={styles.cardHeaderLeft}>
              <Upload size={18} color={colors.ink} style={{ marginRight: 8 }} />
              <Text style={[styles.cardTitle, { color: colors.ink }]}>Upload claim documents</Text>
              <View style={[styles.fileBadge, { backgroundColor: colors.surface2 }]}>
                <Text style={[styles.fileBadgeText, { color: colors.muted }]}>{files.length} {files.length === 1 ? 'file' : 'files'}</Text>
              </View>
              {files.length > 0 && (
                <TouchableOpacity
                  onPress={clearFiles}
                  style={{ marginLeft: 10, paddingHorizontal: 6, paddingVertical: 2 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ fontSize: 11.5, color: colors.muted, textDecorationLine: 'underline' }}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            {isCardExpanded ? <ChevronUp size={18} color={colors.muted} /> : <ChevronDown size={18} color={colors.muted} />}
          </TouchableOpacity>

          {isCardExpanded && (
            <View style={styles.cardContent}>
              {/* 3 Action Buttons Grid */}
              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={[styles.srcBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
                  onPress={handleCameraPick}
                  activeOpacity={0.75}
                >
                  <Camera size={18} color={colors.muted} style={{ marginBottom: 4 }} />
                  <Text style={[styles.srcBtnText, { color: colors.ink }]}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.srcBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
                  onPress={handlePickGallery}
                  activeOpacity={0.75}
                >
                  <ImageIcon size={18} color={colors.muted} style={{ marginBottom: 4 }} />
                  <Text style={[styles.srcBtnText, { color: colors.ink }]}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.srcBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
                  onPress={() => handlePickFiles('.pdf,.jpg,.jpeg,.png,.doc,.docx,.csv,.xlsx')}
                  activeOpacity={0.75}
                >
                  <FileText size={18} color={colors.muted} style={{ marginBottom: 4 }} />
                  <Text style={[styles.srcBtnText, { color: colors.ink }]}>Files</Text>
                </TouchableOpacity>
              </View>

              {/* Uploaded File List or Helper Subtitle */}
              {files.length > 0 ? (
                files.map((file: UploadFileItem) => {
                  const name = file.name;
                  const status = file.status || 'ready';

                  return (
                    <View key={file.id} style={[styles.fileRow, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                      <View style={styles.fileRowLeft}>
                        <View style={styles.docIconBox}>
                          <FileText size={16} color="#0d9488" />
                        </View>
                        <Text style={[styles.fileNameText, { color: colors.ink }]} numberOfLines={1} ellipsizeMode="middle">
                          {name}
                        </Text>
                      </View>

                      <View style={styles.fileRowRight}>
                        <View style={[styles.readyTag, { backgroundColor: '#e6f7f0' }]}>
                          <Text style={[styles.readyTagText, { color: '#047857' }]}>{status}</Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => removeFile(file.id)}
                          style={styles.fileRemoveBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessibilityLabel="Remove file"
                        >
                          <X size={14} color={colors.muted} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={[styles.uploadHelperText, { color: colors.muted }]}>
                  Camera · Gallery · Files — upload claim documents to enable pipeline.
                </Text>
              )}

              {/* Bottom Card Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[
                    styles.solidTealBtn,
                    {
                      flex: 1,
                      backgroundColor: files.length > 0 ? '#0d9488' : isDark ? '#1e293b' : '#e2e8f0',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    },
                    (pipelineStarting || files.length === 0) && { opacity: files.length === 0 ? 0.7 : 0.8 },
                  ]}
                  onPress={() => handleStartPipeline(false)}
                  disabled={files.length === 0 || pipelineStarting}
                  activeOpacity={0.8}
                >
                  {pipelineStarting ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.solidTealBtnText}>Starting pipeline…</Text>
                    </>
                  ) : (
                    <Text
                      style={[
                        styles.solidTealBtnText,
                        files.length === 0 && { color: isDark ? '#64748b' : '#94a3b8' },
                      ]}
                    >
                      Start pipeline
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Prominent Action Required Banner if ANY claim has requested documents */}
        {topActionClaim && (
          <View style={[styles.actionBannerCard, { backgroundColor: isDark ? '#2D2012' : '#FFFBEB', borderColor: colors.amber }]}>
            <View style={styles.actionBannerHeader}>
              <View style={[styles.actionIconCircle, { backgroundColor: colors.amberSoft }]}>
                <AlertTriangle size={17} color={colors.amber} />
              </View>
              <View style={styles.actionBannerTitles}>
                <View style={styles.actionTitleRow}>
                  <Text style={[styles.actionTitle, { color: isDark ? '#FDE68A' : '#78350F' }]}>
                    Action Required: Missing Documents
                  </Text>
                  <View style={[styles.actionPendingBadge, { backgroundColor: colors.amberSoft }]}>
                    <Text style={[styles.actionPendingBadgeText, { color: colors.amber }]}>
                      {actionRequiredClaims.length} Pending
                    </Text>
                  </View>
                </View>
                <Text style={[styles.actionSubtitle, { color: isDark ? '#FCD34D' : '#92400E' }]} numberOfLines={2}>
                  <Text style={{ fontWeight: '700' }}>{topActionClaim.who || 'Claim'}</Text>: {topActionClaim.tpaMessage || 'The insurance reviewer requested additional supporting documents before this claim can be approved.'}
                </Text>
              </View>
            </View>

            <View style={styles.actionBannerButtons}>
              <TouchableOpacity
                style={[styles.actionOpenBtn, { backgroundColor: colors.amber }]}
                onPress={() => setUploadModalClaim(topActionClaim)}
                activeOpacity={0.8}
              >
                <UploadCloud size={14} color="#ffffff" style={{ marginRight: 5 }} />
                <Text style={styles.actionOpenBtnText}>Upload Proofs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionViewBtn, { borderColor: colors.amber }]}
                onPress={() => {
                  selectClaim(topActionClaim.id);
                  navigation.navigate(Routes.ClaimDetail, { claimId: topActionClaim.id });
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionViewBtnText, { color: colors.amber }]}>View Details →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Claim Processing Section - ONLY when pipeline is active/running/completed/failed */}
        {isClaimProcessingActive ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.ink }]}>Claim Processing</Text>
              <View style={[styles.statusPill, { backgroundColor: processingStatusBg }]}>
                <Text style={[styles.statusPillText, { color: processingStatusText }]}>
                  {processingStatusLabel}
                </Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              {/* Claim Meta Header */}
              <View style={styles.claimMetaRow}>
                <View style={[styles.docThumb, { backgroundColor: colors.brandSoft }]}>
                  <FileText size={18} color={colors.brandDark} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.claimIdText, { color: colors.ink }]} numberOfLines={1}>
                    Claim {activeProcessingClaimId ? `#${activeProcessingClaimId.replace(/-/g, '').slice(0, 8).toUpperCase()}` : 'In Progress'}
                    {activeProcessingClaim?.who ? ` · ${activeProcessingClaim.who}` : ''}
                  </Text>
                  <Text style={[styles.claimSubText, { color: colors.muted }]}>
                    {isPipelineRunning
                      ? `Running live backend pipeline (${pipelineProgress}%)`
                      : isPipelineComplete
                      ? `Completed in ${pipelineSeconds ? `${pipelineSeconds}s` : '1.8s'}`
                      : pipelineFailed
                      ? 'Pipeline failed · tap retry to rerun'
                      : `${activeProcessingClaim?.diagnosis || 'Processing Details'} · ${activeProcessingClaim?.hospital || 'Hospital Record'}`}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={[styles.progressTrack, { backgroundColor: colors.line2 }]}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: pipelineFailed ? colors.red : isPipelineComplete ? colors.green : colors.brand,
                      width: `${isPipelineComplete ? 100 : Math.max(pipelineProgress, isPipelineRunning ? 20 : 10)}%`,
                    },
                  ]}
                />
              </View>

              {/* 5-Step Stepper Rail */}
              <View style={styles.stepperContainer}>
                {STEP_DATA.map((step, idx) => {
                  const state = pipelineStepStates[idx] || (isPipelineComplete ? 'd' : idx === 0 ? (isPipelineRunning ? 'r' : 'q') : 'q');
                  const isDone = state === 'd';
                  const isRunning = state === 'r';
                  const isFailed = state === 'f';
                  const isLast = idx === STEP_DATA.length - 1;
                  const stepDesc = pipelineStepMessages[idx] || step.defaultMsg;

                  return (
                    <View key={step.name} style={styles.stepRow}>
                      {!isLast && (
                        <View
                          style={[
                            styles.rail,
                            { backgroundColor: isDone ? colors.brand : colors.line },
                          ]}
                        />
                      )}

                      <View
                        style={[
                          styles.bullet,
                          {
                            backgroundColor: isDone
                              ? colors.brand
                              : isFailed
                              ? colors.red
                              : colors.surface,
                            borderColor: isDone || isRunning ? colors.brand : colors.line,
                          },
                        ]}
                      >
                        {isDone ? (
                          <Check size={12} color="#ffffff" strokeWidth={3} />
                        ) : isFailed ? (
                          <X size={12} color="#ffffff" strokeWidth={3} />
                        ) : isRunning ? (
                          <ActivityIndicator size="small" color={colors.brand} />
                        ) : (
                          <Text style={[styles.bulletNum, { color: colors.muted }]}>{idx + 1}</Text>
                        )}
                      </View>

                      <View style={styles.stepInfo}>
                        <Text style={[styles.stepTitle, { color: colors.ink }]}>{step.name}</Text>
                        <Text style={[styles.stepDesc, { color: isRunning ? colors.brandDark : colors.muted }]}>
                          {stepDesc}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Action Buttons */}
              <View style={styles.processingActionRow}>
                {activeProcessingClaimId && (
                  <TouchableOpacity
                    style={[styles.processingPrimaryBtn, { backgroundColor: colors.brand, flex: 1 }]}
                    onPress={() => {
                      selectClaim(activeProcessingClaimId);
                      navigation.navigate(Routes.ClaimDetail, { claimId: activeProcessingClaimId });
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.processingPrimaryBtnText}>View Claim Details →</Text>
                  </TouchableOpacity>
                )}

                {isPipelineComplete && (
                  <TouchableOpacity
                    style={[styles.processingOutlineBtn, { borderColor: colors.line, marginLeft: 8 }]}
                    onPress={() => resetPipeline()}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.processingOutlineBtnText, { color: colors.muted }]}>Dismiss</Text>
                  </TouchableOpacity>
                )}

                {pipelineFailed && (
                  <>
                    <TouchableOpacity
                      style={[styles.processingOutlineBtn, { borderColor: colors.red }]}
                      onPress={retryPipeline}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.processingOutlineBtnText, { color: colors.red }]}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.processingOutlineBtn, { borderColor: colors.line, marginLeft: 8 }]}
                      onPress={() => resetPipeline()}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.processingOutlineBtnText, { color: colors.muted }]}>Dismiss</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </>
        ) : (!claims || claims.length === 0) ? (
          /* Clean Mobile Onboarding Guide - Referenced from website 3-step flow */
          <View style={[styles.guideCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.guideHeader}>
              <View style={[styles.guideBadge, { backgroundColor: colors.brandSoft, borderColor: colors.line }]}>
                <Sparkles size={12} color={colors.brandDark} />
                <Text style={[styles.guideBadgeText, { color: colors.brandDark }]}>
                  AI-Powered Medical Claim Engine
                </Text>
              </View>
              <Text style={[styles.guideTitle, { color: colors.ink }]}>
                Audit &amp; Settle in 3 Steps
              </Text>
              <Text style={[styles.guideSubtitle, { color: colors.muted }]}>
                Upload hospital final bills or discharge summaries above to activate real-time OCR extraction and 1-click settlement reports.
              </Text>
            </View>

            <View style={styles.guideStepsList}>
              <View style={styles.guideStepRow}>
                <View style={[styles.guideStepNum, { backgroundColor: colors.brandSoft }]}>
                  <Text style={[styles.guideStepNumText, { color: colors.brandDark }]}>1</Text>
                </View>
                <View style={styles.guideStepContent}>
                  <Text style={[styles.guideStepTitle, { color: colors.ink }]}>Upload Claim Documents</Text>
                  <Text style={[styles.guideStepDesc, { color: colors.muted }]}>
                    Scan multi-page hospital bills, discharge summaries, or pharmacy receipts.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStepRow}>
                <View style={[styles.guideStepNum, { backgroundColor: isDark ? '#164e63' : '#e0f2fe' }]}>
                  <Text style={[styles.guideStepNumText, { color: isDark ? '#38bdf8' : '#0284c7' }]}>2</Text>
                </View>
                <View style={styles.guideStepContent}>
                  <Text style={[styles.guideStepTitle, { color: colors.ink }]}>Neural OCR &amp; Table Parsing</Text>
                  <Text style={[styles.guideStepDesc, { color: colors.muted }]}>
                    Auto-extracts patient demographics, admission dates, itemized billing lines &amp; codes.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStepRow}>
                <View style={[styles.guideStepNum, { backgroundColor: colors.greenSoft }]}>
                  <Text style={[styles.guideStepNumText, { color: colors.green }]}>3</Text>
                </View>
                <View style={styles.guideStepContent}>
                  <Text style={[styles.guideStepTitle, { color: colors.ink }]}>IRDAI Audit &amp; Settlement</Text>
                  <Text style={[styles.guideStepDesc, { color: colors.muted }]}>
                    Inspect compliance scoring, discrepancy checks, and instant TPA settlement reports.
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.guideFooter, { borderTopColor: colors.line2 }]}>
              <ShieldCheck size={14} color={colors.green} />
              <Text style={[styles.guideFooterText, { color: colors.muted }]}>
                256-Bit Encrypted · IRDAI Rule Compliant · HIPAA Ready
              </Text>
            </View>
          </View>
        ) : null}

        {/* Recent Claims Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: colors.ink }]}>Recent Claims</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs', { screen: Routes.ClaimsTab })}
            activeOpacity={0.7}
          >
            <Text style={[styles.sectionActionText, { color: colors.brandDark }]}>View all →</Text>
          </TouchableOpacity>
        </View>

        {claims && claims.length > 0 ? (
          <View style={[styles.recentClaimsCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {claims.slice(0, 3).map((claim, idx) => {
              const isLast = idx === Math.min(claims.length, 3) - 1;
              const isReq = Boolean(
                claim.hasActionRequest ||
                claim.status === 'docs_requested' ||
                (claim as any).rawStatus === 'DOCUMENTS_REQUESTED'
              );
              const isDone = claim.status === 'complete' || claim.status === 'approved' || claim.status === 'settled';
              const isFail = (claim as any).status === 'FAILED' || (claim as any).rawStatus?.includes('FAIL');

              const statusBg = isReq ? colors.amberSoft : isDone ? colors.greenSoft : isFail ? colors.redSoft : colors.brandSoft;
              const statusText = isReq ? colors.amber : isDone ? colors.green : isFail ? colors.red : colors.brandDark;
              const statusLabel = isReq ? 'DOCS REQ' : isDone ? 'COMPLETE' : isFail ? 'FAILED' : 'RUNNING';

              return (
                <TouchableOpacity
                  key={claim.id}
                  style={[
                    styles.recentClaimItem,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.line2 },
                  ]}
                  onPress={() => {
                    selectClaim(claim.id);
                    navigation.navigate(Routes.ClaimDetail, { claimId: claim.id });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.recentClaimThumb, { backgroundColor: isReq ? colors.amberSoft : colors.brandSoft }]}>
                    {isReq ? (
                      <AlertTriangle size={18} color={colors.amber} />
                    ) : (
                      <FileText size={18} color={colors.brandDark} />
                    )}
                  </View>

                  <View style={styles.recentClaimInfo}>
                    <Text style={[styles.recentClaimWho, { color: colors.ink }]} numberOfLines={1}>
                      {claim.who || 'Claim'} · {claim.dept || 'Medical'}
                    </Text>
                    <Text style={[styles.recentClaimMeta, { color: colors.muted }]} numberOfLines={1}>
                      #{claim.id.slice(0, 8)} · {claim.amt ? `₹${Number(claim.amt).toLocaleString('en-IN')}` : 'amount pending'}
                    </Text>
                  </View>

                  <View style={[styles.recentClaimBadge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.recentClaimBadgeText, { color: statusText }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyClaimsCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <FileText size={26} color={colors.muted} style={{ marginBottom: 6 }} />
            <Text style={[styles.emptyClaimsTitle, { color: colors.ink }]}>No claims uploaded yet</Text>
            <Text style={[styles.emptyClaimsSubtitle, { color: colors.muted }]}>
              Use the upload panel above to scan or attach medical bills and discharge summaries.
            </Text>
          </View>
        )}

      </ScrollView>

      {/* ALL FEATURES MODAL SHEET */}
      <Modal
        transparent
        visible={showFeaturesModal}
        animationType="slide"
        onRequestClose={() => setShowFeaturesModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowFeaturesModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheetContainer,
              { backgroundColor: colors.surface, maxHeight: '82%', paddingBottom: Math.max(insets.bottom + 16, 24) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetModalTitle, { color: colors.ink }]}>All Features ({ALL_FEATURES.length} screens)</Text>
            <Text style={[styles.sheetModalSub, { color: colors.muted }]}>
              Tap any feature to navigate directly. Active role: <Text style={{ fontWeight: '700', color: colors.brandDark }}>{role}</Text>
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
              {featureGroups.map(grp => (
                <View key={grp.title} style={styles.modalGroup}>
                  <Text style={[styles.modalGroupTitle, { color: colors.muted }]}>{grp.title}</Text>
                  <View style={[styles.modalGroupCard, { borderColor: colors.line, backgroundColor: colors.surface }]}>
                    {grp.items.map((feat, fIdx) => {
                      const isLocked = feat.perm === 'ops' && role !== 'admin';
                      return (
                        <TouchableOpacity
                          key={feat.id}
                          style={[
                            styles.modalFeatItem,
                            fIdx < grp.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line2 },
                          ]}
                          onPress={() => handleNavigateFeature(feat)}
                        >
                          <View
                            style={[
                              styles.modalFeatIconBox,
                              { backgroundColor: isLocked ? colors.surface2 : colors.brandSoft },
                            ]}
                          >
                            {renderFeatureIcon(feat.iconName, isLocked ? colors.muted : colors.brandDark, 16)}
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[styles.modalFeatName, { color: colors.ink }]}>{feat.n}</Text>
                            </View>
                            <Text style={[styles.modalFeatDesc, { color: colors.muted }]} numberOfLines={1}>
                              {feat.d}
                            </Text>
                          </View>
                          {isLocked ? (
                            <View style={[styles.pillBad, { backgroundColor: colors.redSoft }]}>
                              <Text style={[styles.pillBadText, { color: colors.red }]}>admin</Text>
                            </View>
                          ) : (
                            <ChevronRight size={16} color={colors.muted} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Profile Modal */}
      <Modal
        transparent={true}
        visible={showProfileModal}
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowProfileModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheetContainer,
              { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom + 16, 24) },
            ]}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetProfileHeader}>
              <UserAvatar
                size={46}
                name={userName}
                gender={gender}
                style={{ marginRight: 14 }}
              />
              <View style={styles.sheetProfileInfo}>
                <Text style={[styles.sheetUserName, { color: colors.ink }]}>{userName}</Text>
                <Text style={[styles.sheetUserEmail, { color: colors.muted }]}>
                  {userEmail} · realm claimgpt
                </Text>
              </View>
            </View>

            <View style={styles.sheetRoleRow}>
              <Text style={[styles.sheetRoleLabel, { color: colors.muted }]}>Active Role</Text>
              <View style={[styles.singleRoleBadge, { backgroundColor: isDark ? '#123028' : '#e6f7f0' }]}>
                <Text style={[styles.singleRoleText, { color: isDark ? '#34d399' : '#047857' }]}>
                  {role || 'reviewer'}
                </Text>
              </View>
            </View>

            <View style={[styles.sheetMenuCard, { borderColor: colors.line, backgroundColor: colors.surface }]}>
              <View style={[styles.sheetMenuItem, { borderBottomWidth: 1, borderBottomColor: colors.line }]}>
                <View style={styles.sheetMenuLeft}>
                  <Moon size={18} color={colors.ink} style={{ marginRight: 10 }} />
                  <Text style={[styles.sheetMenuText, { color: colors.ink }]}>Dark mode</Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ true: '#0d9488', false: '#cbd5e1' }}
                  thumbColor="#ffffff"
                />
              </View>

              <TouchableOpacity
                style={[styles.sheetMenuItem, { borderBottomWidth: 1, borderBottomColor: colors.line }]}
                onPress={() => {
                  setShowProfileModal(false);
                  navigation.navigate(Routes.ProfileSettings);
                }}
              >
                <View style={styles.sheetMenuLeft}>
                  <User size={18} color={colors.ink} style={{ marginRight: 10 }} />
                  <Text style={[styles.sheetMenuText, { color: colors.ink }]}>Profile & settings</Text>
                </View>
                <ChevronRight size={18} color={colors.muted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetMenuItem, { borderBottomWidth: 1, borderBottomColor: colors.line }]}
                onPress={() => {
                  setShowProfileModal(false);
                  navigation.navigate(Routes.SessionsTab);
                }}
              >
                <View style={styles.sheetMenuLeft}>
                  <Clock size={18} color={colors.ink} style={{ marginRight: 10 }} />
                  <Text style={[styles.sheetMenuText, { color: colors.ink }]}>Conversation history</Text>
                </View>
                <ChevronRight size={18} color={colors.muted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetMenuItem}
                onPress={() => {
                  setShowProfileModal(false);
                  signOut();
                  navigation.navigate(Routes.SignIn);
                }}
              >
                <View style={styles.sheetMenuLeft}>
                  <LogOut size={18} color="#ef4444" style={{ marginRight: 10 }} />
                  <Text style={[styles.sheetMenuText, { color: '#ef4444', fontWeight: '600' }]}>Sign out</Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Duplicate Claim Modal */}
      <DuplicateClaimModal
        visible={!!duplicateClaimId}
        onClose={() => {
          setDuplicateClaimId(null);
          setIsReprocessing(false);
          clearFiles();
        }}
        onViewExisting={() => {
          const targetId = duplicateClaimId;
          setDuplicateClaimId(null);
          setIsReprocessing(false);
          clearFiles();
          if (targetId) {
            navigation.navigate(Routes.ClaimDetail, { claimId: targetId });
          }
        }}
        onUploadAnyway={() => {
          handleStartPipeline(true);
        }}
        isReprocessing={isReprocessing}
      />

      {uploadModalClaim && (
        <UploadRequestedDocsModal
          visible={Boolean(uploadModalClaim)}
          claim={uploadModalClaim}
          navigation={navigation}
          onClose={() => setUploadModalClaim(null)}
          onSuccess={() => {
            setUploadModalClaim(null);
            loadClaims(true);
            navigation.navigate(Routes.WorkflowPipeline);
          }}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <View style={[styles.toast, { backgroundColor: colors.navy }]}>
          <Check size={16} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.toastText} numberOfLines={2}>
            {toastMsg}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  actionBannerCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 13,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionBannerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  actionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  actionBannerTitles: {
    flex: 1,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 3,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  actionPendingBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  actionPendingBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  actionBannerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 11,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(217, 119, 6, 0.25)',
  },
  actionOpenBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7.5,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  actionOpenBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionViewBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionViewBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarBtn: {},
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700' },
  headerLogo: {
    width: 124,
    height: 28,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 6 },
  contextBar: { paddingVertical: 8, paddingHorizontal: 14, borderBottomWidth: 1 },
  contextScroll: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contextBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  contextBadgeText: { fontSize: 11.5, fontWeight: '600' },
  contextBadgePlain: { paddingHorizontal: 6, paddingVertical: 4 },
  contextBadgePlainText: { fontSize: 11.5, fontWeight: '500' },
  contextBadgeGreen: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  contextBadgeGreenText: { fontSize: 11.5, fontWeight: '700' },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 14, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', marginRight: 8 },
  fileBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  fileBadgeText: { fontSize: 11, fontWeight: '600' },
  cardContent: { marginTop: 14 },
  actionGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  srcBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  srcBtnText: { fontSize: 11.5, fontWeight: '500' },
  uploadHelperText: {
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 16,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  fileRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 8 },
  docIconBox: { marginRight: 8, flexShrink: 0 },
  fileNameText: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  fileRowRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  fileRemoveBtn: {
    padding: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  purpleTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  purpleTagText: { fontSize: 11, fontWeight: '600' },
  readyTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  readyTagText: { fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 10 },
  outlineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  outlineBtnText: { fontSize: 13, fontWeight: '600' },
  solidTealBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  solidTealBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  // Claim Processing Stepper Styles
  claimMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  docThumb: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  claimIdText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  claimSubText: {
    fontSize: 11.5,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  stepperContainer: {
    paddingLeft: 4,
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: 16,
  },
  rail: {
    position: 'absolute',
    left: 11,
    top: 24,
    bottom: 0,
    width: 2,
  },
  bullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  bulletNum: {
    fontSize: 10,
    fontWeight: '700',
  },
  stepInfo: {
    marginLeft: 12,
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepDesc: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  processingActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  processingPrimaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  processingOutlineBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingOutlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 99,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },


  welcomeCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginVertical: 4 },
  welcomeText: { fontSize: 13.5, lineHeight: 19, marginBottom: 14 },
  promptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  promptGridBox: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  promptGridText: { fontSize: 12.5, fontWeight: '500', lineHeight: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionActionText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  recentClaimsCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recentClaimItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 13,
    gap: 11,
  },
  recentClaimThumb: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentClaimInfo: {
    flex: 1,
    minWidth: 0,
  },
  recentClaimWho: {
    fontSize: 13,
    fontWeight: '600',
  },
  recentClaimMeta: {
    fontSize: 11.5,
    marginTop: 2,
  },
  recentClaimBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 99,
  },
  recentClaimBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptyClaimsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyClaimsTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyClaimsSubtitle: {
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Onboarding Guide Styles
  guideCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 4,
  },
  guideHeader: {
    marginBottom: 14,
  },
  guideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 99,
    borderWidth: 1,
    marginBottom: 8,
  },
  guideBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  guideSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  guideStepsList: {
    gap: 12,
  },
  guideStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  guideStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  guideStepNumText: {
    fontSize: 12,
    fontWeight: '800',
  },
  guideStepContent: {
    flex: 1,
  },
  guideStepTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  guideStepDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  guideFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  guideFooterText: {
    fontSize: 10.5,
    fontWeight: '500',
  },

  // Modal Sheets
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetModalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  sheetModalSub: { fontSize: 12, marginBottom: 10 },
  modalGroup: { marginBottom: 12 },
  modalGroupTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
    marginLeft: 4,
  },
  modalGroupCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  modalFeatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  modalFeatIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFeatName: { fontSize: 13, fontWeight: '600' },
  modalFeatDesc: { fontSize: 11, marginTop: 1 },
  pillBad: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pillBadText: { fontSize: 9.5, fontWeight: '700' },

  sheetProfileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sheetAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sheetAvatarText: { fontSize: 16, fontWeight: '700' },
  sheetProfileInfo: { flex: 1 },
  sheetUserName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  sheetUserEmail: { fontSize: 12 },
  sheetRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sheetRoleLabel: { fontSize: 13, fontWeight: '600' },
  singleRoleBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  singleRoleText: { fontSize: 12, fontWeight: '700' },
  sheetMenuLeft: { flexDirection: 'row', alignItems: 'center' },
  sheetMenuCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginTop: 4 },
  sheetMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sheetMenuText: { fontSize: 13.5 },
  toast: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 80,
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
});
