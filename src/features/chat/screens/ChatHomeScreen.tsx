import React, { useState } from 'react';
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
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useChatStore } from '../../../state/useChatStore';
import { useUploadStore, UploadFileItem } from '../../../state/useUploadStore';
import { usePipelineStore } from '../../../state/usePipelineStore';
import { useAuthStore } from '../../../state/useAuthStore';
import { UserRole } from '../../../core/rbac/permissions';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const ChatHomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { messages, sendMessage } = useChatStore();
  const { files, addFile } = useUploadStore();
  const { active, startPipeline } = usePipelineStore();
  const { role, userName, userEmail, setRole, signOut } = useAuthStore();
  const firstName = userName ? userName.split(' ')[0] : 'Shaikh';

  const [input, setInput] = useState('');
  const [isCardExpanded, setIsCardExpanded] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const toggleCard = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCardExpanded(!isCardExpanded);
  };

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const handleStartPipeline = () => {
    startPipeline(files);
    sendMessage('Uploaded 1 document — start the pipeline');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => setShowProfileModal(true)}>
            <View style={[styles.avatar, { backgroundColor: '#e6f4f1' }]}>
              <Text style={[styles.avatarText, { color: '#0d9488' }]}>
                {firstName.substring(0, 2).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.ink }]}>ClaimGuru</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Pencil size={18} color={colors.ink} />
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
                  Context · claim 3f8a1d6c · {files.length} docs
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
                  onPress={() => navigation.navigate('WorkflowPipeline')}
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

        {/* Pipeline Run Output Card (Immediately below upload card) */}
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

      {/* Composer Input Area with Quick Action Pill Options directly above the input box */}
      <View style={[styles.composerContainer, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
        {/* Horizontal Quick Action Pills inside composer */}
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
          <TouchableOpacity style={styles.attachBtn}>
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

        {/* PHI Disclaimer */}
        <Text style={[styles.phiNoticeText, { color: colors.muted }]}>
          PHI (SSN · phone · email · MRN · DOB · policy) is scrubbed before anything reaches an LLM — try typing an email address.
        </Text>
      </View>

      {/* Profile & Active Role Bottom Sheet Modal */}
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
            {/* Top Handle Indicator */}
            <View style={styles.sheetHandle} />

            {/* Profile Info Header */}
            <View style={styles.sheetProfileHeader}>
              <View style={[styles.sheetAvatar, { backgroundColor: '#e6f4f1' }]}>
                <Text style={[styles.sheetAvatarText, { color: '#0d9488' }]}>
                  {firstName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.sheetProfileInfo}>
                <Text style={[styles.sheetUserName, { color: colors.ink }]}>{userName}</Text>
                <Text style={[styles.sheetUserEmail, { color: colors.muted }]}>
                  {userEmail} · realm claimgpt
                </Text>
              </View>
            </View>

            {/* Active Role - Only 1 role shown, default submitter */}
            <View style={styles.sheetRoleRow}>
              <Text style={[styles.sheetRoleLabel, { color: colors.muted }]}>
                Role
              </Text>
              <View style={[styles.singleRoleBadge, { backgroundColor: isDark ? '#123028' : '#e6f7f0' }]}>
                <Text style={[styles.singleRoleText, { color: isDark ? '#34d399' : '#047857' }]}>
                  {role || 'submitter'}
                </Text>
              </View>
            </View>

            {/* Menu Navigation Card */}
            <View style={[styles.sheetMenuCard, { borderColor: colors.line, backgroundColor: colors.surface }]}>
              {/* Dark Mode Toggle */}
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
                  navigation.navigate('ProfileSettings');
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
                  navigation.navigate('SessionsTab');
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBtn: {
    marginRight: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
  },
  contextBar: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  contextScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contextBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contextBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  contextBadgePlain: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  contextBadgePlainText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  contextBadgeGreen: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contextBadgeGreenText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 14,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  fileBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fileBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardContent: {
    marginTop: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  srcBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  srcBtnText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
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
  fileRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docIconBox: {
    marginRight: 8,
  },
  fileNameText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fileRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  purpleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  purpleTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  readyTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  readyTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  outlineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  solidTealBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  solidTealBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  welcomeCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 4,
  },
  welcomeText: {
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 14,
  },
  promptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  promptGridBox: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  promptGridText: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 16,
  },
  userBubbleWrapper: {
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  userBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    maxWidth: '85%',
  },
  userBubbleText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '500',
  },
  assistantCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 4,
  },
  assistantTitle: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  sourceText: {
    fontSize: 11,
    marginTop: 6,
  },
  pipelineCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 4,
  },
  pipelineHeader: {
    marginBottom: 10,
  },
  pipelineTitle: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  pipelineSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  progressSegments: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 10,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  pipelineDoneText: {
    fontSize: 12.5,
  },
  composerContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
  },
  composerPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachBtn: {
    padding: 6,
  },
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

  // Profile Modal Bottom Sheet Styles
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
  sheetProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sheetAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sheetProfileInfo: {
    flex: 1,
  },
  sheetUserName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  sheetUserEmail: {
    fontSize: 12,
  },
  sheetRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sheetRoleLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  singleRoleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  singleRoleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sheetMenuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetMenuCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  sheetMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sheetMenuText: {
    fontSize: 13.5,
  },
});
