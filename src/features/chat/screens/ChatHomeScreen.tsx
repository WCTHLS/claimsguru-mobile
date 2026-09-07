import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useChatStore } from '../../../state/useChatStore';
import { useUploadStore } from '../../../state/useUploadStore';
import { usePipelineStore } from '../../../state/usePipelineStore';
import { useAuthStore } from '../../../state/useAuthStore';
import { UserRole, RoleDescriptions } from '../../../core/rbac/permissions';

export const ChatHomeScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { messages, isStreaming, sendMessage, provider, setProvider } = useChatStore();
  const { files, addFile } = useUploadStore();
  const { active, running, complete, stepStates, startPipeline } = usePipelineStore();
  const { role, setRole, userName, userEmail } = useAuthStore();

  const [input, setInput] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(true);
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);
  const [isProviderSheetOpen, setIsProviderSheetOpen] = useState(false);

  const handleSend = (textToSend?: string) => {
    const q = textToSend || input;
    if (q && q.trim()) {
      sendMessage(q.trim());
      setInput('');
    }
  };

  const handleStartPipeline = () => {
    if (files.length > 0) {
      startPipeline(files);
      navigation.navigate('WorkflowPipeline');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top App Bar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={[styles.avatarCircle, { backgroundColor: colors.brandSoft }]}
          onPress={() => setIsAccountSheetOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.avatarText, { color: colors.brandDark }]}>SA</Text>
        </TouchableOpacity>

        <Text style={[styles.appTitle, { color: colors.ink }]}>ClaimsGuru</Text>

        <View style={styles.appBarActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              useChatStore.getState().clearMessages();
            }}
          >
            <Text style={{ fontSize: 18, color: colors.ink }}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsProviderSheetOpen(true)}
          >
            <Text style={{ fontSize: 18, color: colors.ink }}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Context Strip */}
      <View style={styles.contextStrip}>
        <View style={[styles.pill, { backgroundColor: colors.brandSoft }]}>
          <Text style={[styles.pillText, { color: colors.brandDark }]}>
            Context · claim a4f1c9e2 · 6 docs
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: colors.surface2 }]}>
          <Text style={[styles.pillText, { color: colors.muted }]}>{provider}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: colors.greenSoft }]}>
          <Text style={[styles.pillText, { color: colors.green }]}>PHI scrub · always on</Text>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Collapsible Upload Claim Documents Accordion */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setIsUploadOpen(!isUploadOpen)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>☁️</Text>
            <Text style={[styles.accordionTitle, { color: colors.ink }]}>
              Upload claim documents
            </Text>
            <View style={[styles.countBadge, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.countBadgeText, { color: colors.muted }]}>
                {files.length} file{files.length === 1 ? '' : 's'}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.muted }]}>
              {isUploadOpen ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {isUploadOpen && (
            <View style={styles.accordionBody}>
              {/* 4 Source Buttons Grid */}
              <View style={styles.srcGrid}>
                <TouchableOpacity
                  style={[styles.srcCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
                  onPress={() => addFile('Discharge_Summary.pdf|digital|discharge_summary|0.96')}
                >
                  <Text style={styles.srcIcon}>📷</Text>
                  <Text style={[styles.srcLabel, { color: colors.ink }]}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.srcCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
                  onPress={() => addFile('Hospital_Bill.jpg|jpg|hospital_bill|0.93')}
                >
                  <Text style={styles.srcIcon}>🖼️</Text>
                  <Text style={[styles.srcLabel, { color: colors.ink }]}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.srcCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
                  onPress={() => addFile('Policy_Card.pdf|scanned|policy_card|0.90')}
                >
                  <Text style={styles.srcIcon}>📄</Text>
                  <Text style={[styles.srcLabel, { color: colors.ink }]}>Files</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.srcCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
                  onPress={() => addFile('Screenshot_2026-09-07.png|jpg|pharmacy_bill|0.81')}
                >
                  <Text style={styles.srcIcon}>📱</Text>
                  <Text style={[styles.srcLabel, { color: colors.ink }]}>Screenshot</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.helperNote, { color: colors.muted }]}>
                Camera · Gallery · Files · Screenshot — documents are routed to a doc_type automatically.
              </Text>

              {/* Upload Action Buttons */}
              <View style={styles.uploadBtnRow}>
                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: colors.line }]}
                  onPress={() => navigation.navigate('UploadPanel')}
                >
                  <Text style={[styles.outlineBtnText, { color: colors.brandDark }]}>
                    Expand panel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.fillBtn,
                    {
                      backgroundColor: files.length > 0 ? colors.brand : colors.line,
                      opacity: files.length > 0 ? 1 : 0.6,
                    },
                  ]}
                  disabled={files.length === 0}
                  onPress={handleStartPipeline}
                >
                  <Text style={[styles.fillBtnText, { color: files.length > 0 ? '#fff' : colors.muted }]}>
                    Start pipeline {files.length > 0 ? `(${files.length})` : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 2. Live Workflow Runner Card (If active) */}
        {active && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardHeading, { color: colors.ink }]}>Workflow Runner</Text>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: complete ? colors.greenSoft : colors.brandSoft },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: complete ? colors.green : colors.brandDark },
                  ]}
                >
                  {complete ? 'COMPLETE' : 'RUNNING'}
                </Text>
              </View>
            </View>
            <Text style={[styles.subNote, { color: colors.muted }]}>
              5-Step: OCR → Parse → Code → Predict → Validate
            </Text>
            <TouchableOpacity
              style={[styles.fullOutlineBtn, { borderColor: colors.brand }]}
              onPress={() => navigation.navigate('BrainPreview', { claimId: 'a4f1c9e2' })}
            >
              <Text style={[styles.fullOutlineBtnText, { color: colors.brandDark }]}>
                Open AI Brain Preview ›
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. Welcome / Chat Starters Box */}
        {messages.length === 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text style={[styles.welcomeGreeting, { color: colors.ink }]}>
              <Text style={{ fontWeight: '700' }}>Hi Shaikh — </Text>
              ask about any claim, or upload documents above to start a new one. Answers stream from the claim's indexed documents.
            </Text>

            {/* 2x2 Grid of Starters */}
            <View style={styles.startersGrid}>
              <TouchableOpacity
                style={[styles.starterBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                onPress={() => handleSend('Summarise this claim')}
              >
                <Text style={[styles.starterBoxText, { color: colors.ink }]}>
                  Summarise this claim
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.starterBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                onPress={() => handleSend('What documents are missing?')}
              >
                <Text style={[styles.starterBoxText, { color: colors.ink }]}>
                  What documents are missing?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.starterBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                onPress={() => handleSend('Why is the risk medium?')}
              >
                <Text style={[styles.starterBoxText, { color: colors.ink }]}>
                  Why is the risk medium?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.starterBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                onPress={() => handleSend('Which rules failed?')}
              >
                <Text style={[styles.starterBoxText, { color: colors.ink }]}>
                  Which rules failed?
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Suggestion Chips */}
        <View style={styles.chipsRow}>
          {['Summarise this claim', 'What documents are missing?', 'Why is the risk medium?'].map(
            (chip, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.chipPill, { borderColor: colors.line, backgroundColor: colors.surface }]}
                onPress={() => handleSend(chip)}
              >
                <Text style={[styles.chipText, { color: colors.ink }]}>{chip}</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {/* Chat History Stream */}
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.chatBubble,
              msg.sender === 'user'
                ? [styles.userBubble, { backgroundColor: colors.brand }]
                : [styles.assistantBubble, { backgroundColor: colors.surface, borderColor: colors.line }],
            ]}
          >
            <Text style={[styles.bubbleText, { color: msg.sender === 'user' ? '#fff' : colors.ink }]}>
              {msg.text}
            </Text>
            {msg.scrubbedHits && (
              <Text style={styles.scrubLabel}>
                PHI scrubbed: {msg.scrubbedHits.join(', ')}
              </Text>
            )}
            {msg.sources && (
              <Text style={[styles.sourceLabel, { color: colors.muted }]}>
                Sources: {msg.sources}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Floating Bottom Composer */}
      <View style={[styles.composerContainer, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => setIsUploadOpen(true)}
          >
            <Text style={{ fontSize: 20, color: colors.muted }}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink },
            ]}
            placeholder="Ask about this claim..."
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
          />

          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.brand }]}
            onPress={() => handleSend()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.phiFooterNote, { color: colors.muted }]}>
          PHI (SSN · phone · email · MRN · DOB · policy) is scrubbed before anything reaches an LLM — try typing an email address.
        </Text>
      </View>

      {/* Account / RBAC Bottom Sheet */}
      <Modal visible={isAccountSheetOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.line }]} />
            <Text style={[styles.sheetTitle, { color: colors.ink }]}>User Account & RBAC</Text>
            <Text style={[styles.subNote, { color: colors.muted, marginBottom: 12 }]}>
              Signed in as {userName} ({userEmail})
            </Text>

            <Text style={[styles.sectionHeading, { color: colors.muted }]}>Select Active Role</Text>
            <View style={[styles.roleSelectRow, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              {(['viewer', 'submitter', 'reviewer', 'admin'] as UserRole[]).map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleSelectBtn, role === r && { backgroundColor: colors.brand }]}
                  onPress={() => {
                    setRole(r);
                    setIsAccountSheetOpen(false);
                  }}
                >
                  <Text style={[styles.roleSelectBtnText, { color: role === r ? '#fff' : colors.muted }]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.roleExplain, { color: colors.muted }]}>
              {RoleDescriptions[role]}
            </Text>

            <TouchableOpacity
              style={[styles.sheetCloseBtn, { backgroundColor: colors.surface2 }]}
              onPress={() => setIsAccountSheetOpen(false)}
            >
              <Text style={[styles.sheetCloseBtnText, { color: colors.ink }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Provider Switcher Bottom Sheet */}
      <Modal visible={isProviderSheetOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.line }]} />
            <Text style={[styles.sheetTitle, { color: colors.ink }]}>LLM Provider</Text>
            <Text style={[styles.subNote, { color: colors.muted, marginBottom: 12 }]}>
              Switch active inference provider (GET /chat/providers)
            </Text>

            {['ollama · llama-3', 'OpenRouter · mistral-7b', 'Gemini 1.5 Pro (fallback)'].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.providerOption, { borderColor: colors.line }]}
                onPress={() => {
                  setProvider(p);
                  setIsProviderSheetOpen(false);
                }}
              >
                <Text style={[styles.providerOptionText, { color: colors.ink }]}>{p}</Text>
                {provider === p && <Text style={{ color: colors.brandDark, fontWeight: '700' }}>✓</Text>}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.sheetCloseBtn, { backgroundColor: colors.surface2, marginTop: 12 }]}
              onPress={() => setIsProviderSheetOpen(false)}
            >
              <Text style={[styles.sheetCloseBtnText, { color: colors.ink }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 13.5, fontWeight: '700' },
  appTitle: { fontSize: 17, fontWeight: '750', flex: 1, letterSpacing: -0.2 },
  appBarActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
  contextStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },
  pill: { paddingHorizontal: 9, paddingVertical: 3.5, borderRadius: 99 },
  pillText: { fontSize: 11, fontWeight: '700' },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 14, gap: 12, paddingBottom: 24 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    marginRight: 8,
  },
  countBadgeText: { fontSize: 11, fontWeight: '650' },
  chevron: { fontSize: 12 },
  accordionBody: { marginTop: 12 },
  srcGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  srcCard: {
    flex: 1,
    borderRadius: 11,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  srcIcon: { fontSize: 18 },
  srcLabel: { fontSize: 11, fontWeight: '600' },
  helperNote: {
    fontSize: 11,
    marginTop: 10,
    marginBottom: 12,
    lineHeight: 15,
  },
  uploadBtnRow: {
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
  outlineBtnText: { fontSize: 12.5, fontWeight: '700' },
  fillBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  fillBtnText: { fontSize: 12.5, fontWeight: '700' },
  cardHeading: { fontSize: 14, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subNote: { fontSize: 11.5, marginTop: 4 },
  fullOutlineBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 10,
  },
  fullOutlineBtnText: { fontSize: 12.5, fontWeight: '700' },
  welcomeGreeting: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  startersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  starterBox: {
    width: '48.5%',
    padding: 12,
    borderRadius: 11,
    borderWidth: 1,
    minHeight: 56,
    justifyContent: 'center',
  },
  starterBoxText: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
  chipText: { fontSize: 11.5 },
  chatBubble: {
    padding: 12,
    borderRadius: 14,
    maxWidth: '84%',
    marginBottom: 6,
  },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  assistantBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 2, borderWidth: 1 },
  bubbleText: { fontSize: 13, lineHeight: 18.5 },
  scrubLabel: { fontSize: 9.5, color: '#e0f2fe', marginTop: 4 },
  sourceLabel: { fontSize: 10, marginTop: 6 },
  composerContainer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachBtn: {
    padding: 6,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 13,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { color: '#fff', fontSize: 17, fontWeight: '700' },
  phiFooterNote: {
    fontSize: 10.5,
    marginTop: 6,
    lineHeight: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  sectionHeading: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 10 },
  roleSelectRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    marginTop: 6,
  },
  roleSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleSelectBtnText: { fontSize: 11.5, fontWeight: '700' },
  roleExplain: { fontSize: 11.5, marginTop: 8, lineHeight: 16 },
  providerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  providerOptionText: { fontSize: 13, fontWeight: '600' },
  sheetCloseBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  sheetCloseBtnText: { fontSize: 13, fontWeight: '700' },
});
