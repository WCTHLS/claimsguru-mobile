import React, { useState, useEffect } from 'react';
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
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  Image as ImageIcon,
  FileText,
  Smartphone,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Upload,
  Pencil,
  Sun,
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
  Check,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useChatStore } from '../../../state/useChatStore';
import { useUploadStore, UploadFileItem } from '../../../state/useUploadStore';
import { usePipelineStore } from '../../../state/usePipelineStore';
import { useAuthStore } from '../../../state/useAuthStore';
import { fetchUserProfile } from '../../../core/api/authApi';
import { Routes } from '../../../app/navigation/routes';
import { UserAvatar } from '../../../core/components/UserAvatar';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
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
  { id: 'chat', g: 'Chat', nav: Routes.ChatTab, n: 'Chat', d: 'AI claims assistant & document Q&A', iconName: 'message-square' },
  { id: 'sessions', g: 'Chat', nav: Routes.SessionsTab, n: 'History', d: 'Conversation history & saved sessions', iconName: 'clock' },
  { id: 'claims', g: 'Claims', nav: Routes.ClaimsTab, n: 'Claims', d: 'Active & processed claims list', iconName: 'file-text' },
  { id: 'upload', g: 'Claims', nav: Routes.UploadPanel, n: 'Upload', d: 'Camera · gallery · files · screenshot', iconName: 'upload' },
  { id: 'processing', g: 'Claims', nav: Routes.WorkflowPipeline, n: 'Workflow', d: 'OCR → Parse → Code → Predict → Validate', iconName: 'layers' },
  { id: 'detail', g: 'Claims', nav: Routes.ClaimDetail, n: 'Claim detail', d: 'Summary, expense breakdown & actions', iconName: 'file-text', params: { claimId: 'a4f1c9e2' } },
  { id: 'brainpreview', g: 'AI Brain', nav: Routes.BrainPreview, n: 'AI Brain', d: 'KPI strip, risk verdict & readiness', iconName: 'cpu', params: { claimId: 'a4f1c9e2' } },
  { id: 'risk', g: 'AI Brain', nav: Routes.RiskDetail, n: 'Risk', d: 'Rejection probability & top risk drivers', iconName: 'activity', params: { claimId: 'a4f1c9e2' } },
  { id: 'fraud', g: 'AI Brain', nav: Routes.FraudDetail, n: 'Fraud', d: '6 signal families · hybrid risk score', iconName: 'shield-alert', params: { claimId: 'a4f1c9e2' } },
  { id: 'validation', g: 'AI Brain', nav: Routes.ValidationRules, n: 'Validation', d: 'R001–R011 deterministic rules checklist', iconName: 'check-square', params: { claimId: 'a4f1c9e2' } },
  { id: 'coding', g: 'AI Brain', nav: Routes.MedicalCoding, n: 'Coding', d: 'ICD-10 & CPT procedure code review', iconName: 'code', params: { claimId: 'a4f1c9e2' } },
  { id: 'docs', g: 'Documents', nav: Routes.DocumentGrid, n: 'Documents', d: 'Manage & inspect attached files', iconName: 'folder', params: { claimId: 'a4f1c9e2' } },
  { id: 'ocr', g: 'Documents', nav: Routes.OcrParsedFields, n: 'OCR & fields', d: 'Visual document reader & field editor', iconName: 'scan', params: { claimId: 'a4f1c9e2' } },
  { id: 'scan', g: 'Documents', nav: Routes.ScanAnalyzer, n: 'Scan analyzer', d: 'MRI, CT, X-Ray radiology analyzer', iconName: 'file-search', params: { claimId: 'a4f1c9e2' } },
  { id: 'patient', g: 'Patient', nav: Routes.PatientProfile, n: 'Patient', d: 'Demographics, policy & KYC details', iconName: 'user' },
  { id: 'activity', g: 'Patient', nav: Routes.PatientActivity, n: 'Activity', d: 'Audit history & state change diffs', iconName: 'clock' },
  { id: 'search', g: 'Other', nav: Routes.SearchTab, n: 'Search', d: 'Full-text & semantic vector search', iconName: 'search' },
  { id: 'submit', g: 'Other', nav: Routes.Submission, n: 'Submission', d: 'Payer submission & IRDAI claim forms', iconName: 'send', params: { claimId: 'a4f1c9e2' } },
  { id: 'audit', g: 'Other', nav: Routes.AuditTrail, n: 'Audit trail', d: 'User action logs & state snapshots', iconName: 'list-filter', params: { claimId: 'a4f1c9e2' } },
  { id: 'profile', g: 'Other', nav: Routes.ProfileSettings, n: 'Profile', d: 'User roles, preferences & settings', iconName: 'settings' },
  { id: 'ops', g: 'Other', nav: Routes.OpsConsole, n: 'Ops console', d: 'Service health & queue performance', iconName: 'terminal', perm: 'ops' },
];

export const ChatHomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { messages, sendMessage } = useChatStore();
  const { files, addFile, uploadToBackend } = useUploadStore();
  const { active, startPipeline } = usePipelineStore();
  const { role, userName, userEmail, userId, signOut, gender, setUserDetails } = useAuthStore();

  useEffect(() => {
    if (userEmail || userId) {
      fetchUserProfile(userId || userEmail).catch(() => {});
    }
  }, [userEmail, userId]);

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

  const [input, setInput] = useState('');
  const [isCardExpanded, setIsCardExpanded] = useState(true);
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2800);
  };

  const toggleCard = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCardExpanded(!isCardExpanded);
  };

  const toggleFeaturesCard = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFeaturesExpanded(!isFeaturesExpanded);
  };

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const handleStartPipeline = async () => {
    if (files.length > 0) {
      showToast('Starting pipeline upload...');
      try {
        const { claimId } = await uploadToBackend();
        startPipeline(files, claimId);
        sendMessage(`Uploaded ${files.length} document${files.length > 1 ? 's' : ''} — started pipeline for claim ${claimId.slice(0, 8)}`);
      } catch {
        startPipeline(files);
        sendMessage('Uploaded 1 document — start the pipeline');
      }
    } else {
      startPipeline(files);
      sendMessage('Uploaded 1 document — start the pipeline');
    }
  };

  const handleNavigateFeature = (feat: FeatureDef) => {
    if (feat.perm === 'ops' && role !== 'admin') {
      showToast(`Requires the admin role — you are signed in as ${role}`);
      return;
    }
    if (feat.nav === Routes.ChatTab) {
      showToast('Already on Chat Home');
      return;
    }
    if (showFeaturesModal) {
      setShowFeaturesModal(false);
    }
    navigation.navigate(feat.nav, feat.params);
  };

  const renderFeatureIcon = (name: string, color: string, size = 16) => {
    switch (name) {
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
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => setShowProfileModal(true)}>
            <UserAvatar size={34} name={userName} gender={gender} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.ink }]}>ClaimsGuru</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowFeaturesModal(true)}
            accessibilityLabel="All features"
          >
            <LayoutGrid size={19} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
            <Sun size={19} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status & Context Bar */}
      <View style={[styles.contextBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contextScroll}>
          {files.length > 0 && (
            <>
              <View style={[styles.contextBadge, { backgroundColor: '#e6f4f1' }]}>
                <Text style={[styles.contextBadgeText, { color: '#0d9488' }]}>
                  Context · claim a4f1c9e2 · {files.length} docs
                </Text>
              </View>
              <View style={[styles.contextBadgePlain]}>
                <Text style={[styles.contextBadgePlainText, { color: colors.muted }]}>ollama · llama-3</Text>
              </View>
            </>
          )}
          <View style={[styles.contextBadgeGreen, { backgroundColor: '#e6f7f0' }]}>
            <Text style={[styles.contextBadgeGreenText, { color: '#059669' }]}>PHI scrub · always on</Text>
          </View>
        </ScrollView>
      </View>

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
            </View>
            {isCardExpanded ? <ChevronUp size={18} color={colors.muted} /> : <ChevronDown size={18} color={colors.muted} />}
          </TouchableOpacity>

          {isCardExpanded && (
            <View style={styles.cardContent}>
              {/* 4 Action Buttons Grid */}
              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={[styles.srcBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
                  onPress={() => addFile('Discharge_Summary.pdf|digital|discharge_summary|0.96')}
                >
                  <Camera size={18} color={colors.muted} style={{ marginBottom: 4 }} />
                  <Text style={[styles.srcBtnText, { color: colors.ink }]}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.srcBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
                  onPress={() => addFile('Hospital_Bill.jpg|jpg|hospital_bill|0.93')}
                >
                  <ImageIcon size={18} color={colors.muted} style={{ marginBottom: 4 }} />
                  <Text style={[styles.srcBtnText, { color: colors.ink }]}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.srcBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
                  onPress={() => addFile('Policy_Card.pdf|scanned|policy_card|0.90')}
                >
                  <FileText size={18} color={colors.muted} style={{ marginBottom: 4 }} />
                  <Text style={[styles.srcBtnText, { color: colors.ink }]}>Files</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.srcBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
                  onPress={() => addFile('Screenshot_Claim.png|image|screenshot|0.88')}
                >
                  <Smartphone size={18} color={colors.muted} style={{ marginBottom: 4 }} />
                  <Text style={[styles.srcBtnText, { color: colors.ink }]}>Screenshot</Text>
                </TouchableOpacity>
              </View>

              {/* Uploaded File List or Helper Subtitle */}
              {files.length > 0 ? (
                files.map((file: UploadFileItem) => {
                  const name = file.name;
                  const docType = file.docType || 'policy_card';
                  const score = file.conf ? file.conf.toFixed(2) : '0.90';
                  const status = file.status || 'ready';

                  return (
                    <View key={file.id} style={[styles.fileRow, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                      <View style={styles.fileRowLeft}>
                        <View style={styles.docIconBox}>
                          <FileText size={16} color="#0d9488" />
                        </View>
                        <Text style={[styles.fileNameText, { color: colors.ink }]}>{name}</Text>
                      </View>

                      <View style={styles.fileRowRight}>
                        <View style={[styles.purpleTag, { backgroundColor: '#f3e8ff' }]}>
                          <Text style={[styles.purpleTagText, { color: '#7e22ce' }]}>{`${docType} - ${score}`}</Text>
                        </View>

                        <View style={[styles.readyTag, { backgroundColor: '#e6f7f0' }]}>
                          <Text style={[styles.readyTagText, { color: '#047857' }]}>{status}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={[styles.uploadHelperText, { color: colors.muted }]}>
                  Camera · Gallery · Files · Screenshot — documents are routed to a doc_type automatically.
                </Text>
              )}

              {/* Bottom Card Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: colors.line }]}
                  onPress={() => navigation.navigate(Routes.WorkflowPipeline)}
                >
                  <Text style={[styles.outlineBtnText, { color: '#0d9488' }]}>Expand panel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.solidTealBtn,
                    { backgroundColor: files.length > 0 ? '#0d9488' : '#71c5b8' },
                  ]}
                  onPress={handleStartPipeline}
                >
                  <Text style={styles.solidTealBtnText}>Start pipeline</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Pipeline Run Output Card */}
        {(active || messages.some(m => m.text.includes('pipeline'))) && (
          <View style={[styles.pipelineCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.pipelineHeader}>
              <Text style={[styles.pipelineTitle, { color: colors.ink }]}>
                Pipeline · claim <Text style={{ fontWeight: '700' }}>3f8a1d6c</Text>
              </Text>
              <Text style={[styles.pipelineSub, { color: colors.muted }]}>OCR → Parse → Code → Predict → Validate</Text>
            </View>

            {/* 5-Step Progress Indicators */}
            <View style={styles.progressSegments}>
              <View style={[styles.segment, { backgroundColor: '#0d9488' }]} />
              <View style={[styles.segment, { backgroundColor: '#0d9488' }]} />
              <View style={[styles.segment, { backgroundColor: '#0d9488' }]} />
              <View style={[styles.segment, { backgroundColor: '#0d9488' }]} />
              <View style={[styles.segment, { backgroundColor: '#0d9488' }]} />
            </View>

            <Text style={[styles.pipelineDoneText, { color: colors.ink }]}>
              Done in <Text style={{ fontWeight: '700' }}>5.4 s</Text> (total_processing_seconds). 20 of 24 fields
            </Text>
          </View>
        )}

        {/* ALL FEATURES CARD - COLLAPSIBLE 3-COLUMN GRID */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <TouchableOpacity style={styles.cardHeader} onPress={toggleFeaturesCard} activeOpacity={0.7}>
            <View style={styles.cardHeaderLeft}>
              <LayoutGrid size={18} color={colors.brand} style={{ marginRight: 8 }} />
              <Text style={[styles.cardTitle, { color: colors.ink }]}>All features</Text>
              <View style={[styles.fileBadge, { backgroundColor: colors.surface2 }]}>
                <Text style={[styles.fileBadgeText, { color: colors.muted }]}>23 screens</Text>
              </View>
            </View>
            {isFeaturesExpanded ? <ChevronUp size={18} color={colors.muted} /> : <ChevronDown size={18} color={colors.muted} />}
          </TouchableOpacity>

          {isFeaturesExpanded && (
            <View style={styles.featuresGridContainer}>
              <View style={styles.featuresGrid}>
                {ALL_FEATURES.map(feat => {
                  const isLocked = feat.perm === 'ops' && role !== 'admin';
                  return (
                    <TouchableOpacity
                      key={feat.id}
                      style={[
                        styles.featureTile,
                        { backgroundColor: colors.surface, borderColor: colors.line },
                        isLocked && { opacity: 0.65 },
                      ]}
                      onPress={() => handleNavigateFeature(feat)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.featureIconWrap,
                          { backgroundColor: isLocked ? colors.surface2 : colors.brandSoft },
                        ]}
                      >
                        {renderFeatureIcon(feat.iconName, isLocked ? colors.muted : colors.brandDark, 16)}
                      </View>
                      <Text style={[styles.featureTileName, { color: colors.ink }]} numberOfLines={1}>
                        {feat.n}
                      </Text>
                      {feat.perm && (
                        <View style={[styles.tileLockBadge, { backgroundColor: colors.surface2 }]}>
                          <Text style={[styles.tileLockText, { color: isLocked ? colors.red : colors.muted }]}>
                            {feat.perm}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.exploreBtn, { borderColor: colors.line }]}
                onPress={() => setShowFeaturesModal(true)}
              >
                <Text style={[styles.exploreBtnText, { color: colors.brandDark }]}>
                  View categorized directory ({ALL_FEATURES.length} features) →
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Welcome Starter Card */}
        <View style={[styles.welcomeCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.welcomeText, { color: colors.ink }]}>
            <Text style={{ fontWeight: '700' }}>Hi {firstName}</Text> — ask about any claim, or upload documents above to start a new one. Answers stream from the claim's indexed documents.
          </Text>

          {/* 2x2 Grid of Starter Prompt Boxes */}
          <View style={styles.promptGrid}>
            <TouchableOpacity
              style={[styles.promptGridBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}
              onPress={() => sendMessage('Summarise this claim')}
            >
              <Text style={[styles.promptGridText, { color: colors.ink }]}>Summarise this claim</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.promptGridBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}
              onPress={() => sendMessage('What documents are missing?')}
            >
              <Text style={[styles.promptGridText, { color: colors.ink }]}>What documents are missing?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.promptGridBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}
              onPress={() => sendMessage('Why is the risk medium?')}
            >
              <Text style={[styles.promptGridText, { color: colors.ink }]}>Why is the risk medium?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.promptGridBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}
              onPress={() => sendMessage('Which rules failed?')}
            >
              <Text style={[styles.promptGridText, { color: colors.ink }]}>Which rules failed?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Message Bubbles */}
        {messages.map(msg => (
          <React.Fragment key={msg.id}>
            {msg.sender === 'user' ? (
              <View style={styles.userBubbleWrapper}>
                <View style={[styles.userBubble, { backgroundColor: '#0d9488' }]}>
                  <Text style={styles.userBubbleText}>{msg.text}</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.assistantCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <Text style={[styles.assistantTitle, { color: colors.ink }]}>{msg.text}</Text>
                {msg.sources && <Text style={[styles.sourceText, { color: colors.muted }]}>Sources: {msg.sources}</Text>}
              </View>
            )}
          </React.Fragment>
        ))}
      </ScrollView>

      {/* Composer Input Area */}
      <View style={[styles.composerContainer, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.composerPillRow}
        >
          <TouchableOpacity
            style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.line }]}
            onPress={() => sendMessage('Summarise this claim')}
          >
            <Text style={[styles.suggestionChipText, { color: colors.ink }]}>Summarise this claim</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.line }]}
            onPress={() => sendMessage('What documents are missing?')}
          >
            <Text style={[styles.suggestionChipText, { color: colors.ink }]}>What documents are missing?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.line }]}
            onPress={() => sendMessage('Why is the risk medium?')}
          >
            <Text style={[styles.suggestionChipText, { color: colors.ink }]}>Why is the risk medium?</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => {
              setIsCardExpanded(true);
              showToast('Upload panel opened');
            }}
          >
            <Paperclip size={20} color={colors.muted} />
          </TouchableOpacity>

          <TextInput
            style={[styles.composerInput, { backgroundColor: colors.surface2, color: colors.ink, borderColor: colors.line }]}
            placeholder="Ask about this claim..."
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity
            style={[styles.sendCircleBtn, { backgroundColor: '#0d9488' }]}
            onPress={handleSend}
          >
            <Send size={16} color="#ffffff" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.phiNoticeText, { color: colors.muted }]}>
          PHI (SSN · phone · email · MRN · DOB · policy) is scrubbed before anything reaches an LLM.
        </Text>
      </View>

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
            <Text style={[styles.sheetModalTitle, { color: colors.ink }]}>All Features (23 screens)</Text>
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
              <UserAvatar size={58} name={userName} gender={gender} />
              <View style={styles.sheetProfileInfo}>
                <Text style={[styles.sheetUserName, { color: colors.ink }]}>{userName}</Text>
                <Text style={[styles.sheetUserEmail, { color: colors.muted }]}>
                  {userEmail} · realm claimgpt
                </Text>
                {/* Male/Female quick switcher */}
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 10,
                      backgroundColor: (!gender || gender.toLowerCase() === 'male') ? '#0284c7' : (isDark ? '#1e293b' : '#f1f5f9'),
                    }}
                    onPress={() => setUserDetails({ gender: 'Male' })}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontWeight: '600',
                        color: (!gender || gender.toLowerCase() === 'male') ? '#ffffff' : colors.muted,
                      }}
                    >
                      Male Avatar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 10,
                      backgroundColor: gender?.toLowerCase() === 'female' ? '#db2777' : (isDark ? '#1e293b' : '#f1f5f9'),
                    }}
                    onPress={() => setUserDetails({ gender: 'Female' })}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontWeight: '600',
                        color: gender?.toLowerCase() === 'female' ? '#ffffff' : colors.muted,
                      }}
                    >
                      Female Avatar
                    </Text>
                  </TouchableOpacity>
                </View>
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
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarBtn: { marginRight: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
    marginBottom: 12,
  },
  fileRowLeft: { flexDirection: 'row', alignItems: 'center' },
  docIconBox: { marginRight: 8 },
  fileNameText: { fontSize: 13, fontWeight: '600' },
  fileRowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  pipelineCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginVertical: 4 },
  pipelineHeader: { marginBottom: 10 },
  pipelineTitle: { fontSize: 14.5, fontWeight: '500' },
  pipelineSub: { fontSize: 11.5, marginTop: 2 },
  progressSegments: { flexDirection: 'row', gap: 6, marginVertical: 10 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  pipelineDoneText: { fontSize: 12.5 },

  // Features Grid Styles
  featuresGridContainer: { marginTop: 12 },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTile: {
    width: '31.3%',
    borderRadius: 11,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    position: 'relative',
    minHeight: 76,
    justifyContent: 'center',
  },
  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  featureTileName: {
    fontSize: 10.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  tileLockBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  tileLockText: { fontSize: 7.5, fontWeight: '800' },
  exploreBtn: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  exploreBtnText: { fontSize: 11.5, fontWeight: '700' },

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
  userBubbleWrapper: { alignItems: 'flex-end', marginVertical: 4 },
  userBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    maxWidth: '85%',
  },
  userBubbleText: { color: '#ffffff', fontSize: 13.5, fontWeight: '500' },
  assistantCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginVertical: 4 },
  assistantTitle: { fontSize: 13.5, lineHeight: 19 },
  sourceText: { fontSize: 11, marginTop: 6 },
  composerContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
  },
  composerPillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8 },
  suggestionChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  suggestionChipText: { fontSize: 12, fontWeight: '500' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attachBtn: { padding: 6 },
  composerInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 13.5,
    borderWidth: 1,
  },
  sendCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phiNoticeText: {
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
    paddingHorizontal: 8,
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
