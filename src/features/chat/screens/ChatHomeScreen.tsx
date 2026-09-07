import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useChatStore } from '../../../state/useChatStore';
import { useUploadStore } from '../../../state/useUploadStore';
import { usePipelineStore } from '../../../state/usePipelineStore';
import { useAuthStore } from '../../../state/useAuthStore';

export const ChatHomeScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { messages, isStreaming, sendMessage, provider } = useChatStore();
  const { files, addFile } = useUploadStore();
  const { active, running, complete, stepStates, startPipeline } = usePipelineStore();
  const role = useAuthStore(state => state.role);
  const [input, setInput] = React.useState('');

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* App Bar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('ProfileSettings')}>
          <View style={[styles.avatar, { backgroundColor: colors.brandSoft }]}>
            <Text style={[styles.avatarText, { color: colors.brandDark }]}>SA</Text>
          </View>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.ink }]}>ClaimGPT</Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.brandSoft }]}>
          <Text style={[styles.roleBadgeText, { color: colors.brandDark }]}>{role}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
        {/* Upload Drawer Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>Upload Claim Documents</Text>
          <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
            {files.length} document{files.length === 1 ? '' : 's'} attached · routed to doc_type
          </Text>

          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.srcBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}
              onPress={() => addFile('Discharge_Summary.pdf|digital|discharge_summary|0.96')}
            >
              <Text style={[styles.srcBtnText, { color: colors.ink }]}>📷 Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.srcBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}
              onPress={() => addFile('Hospital_Bill.jpg|jpg|hospital_bill|0.93')}
            >
              <Text style={[styles.srcBtnText, { color: colors.ink }]}>🖼️ Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.srcBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}
              onPress={() => addFile('Policy_Card.pdf|scanned|policy_card|0.90')}
            >
              <Text style={[styles.srcBtnText, { color: colors.ink }]}>📄 Files</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.srcBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}
              onPress={() => addFile('MRI_Cardiac_Report.pdf|digital|scan_report|0.88')}
            >
              <Text style={[styles.srcBtnText, { color: colors.ink }]}>🔬 MRI Scan</Text>
            </TouchableOpacity>
          </View>

          {files.length > 0 && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.brand }]}
              onPress={() => {
                startPipeline(files);
                navigation.navigate('WorkflowPipeline');
              }}
            >
              <Text style={styles.primaryBtnText}>Start Pipeline ({files.length} docs)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Live Pipeline Card if Active */}
        {active && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardTitle, { color: colors.ink }]}>Workflow Runner</Text>
              <View style={[styles.pill, { backgroundColor: complete ? colors.greenSoft : colors.brandSoft }]}>
                <Text style={[styles.pillText, { color: complete ? colors.green : colors.brandDark }]}>
                  {complete ? 'COMPLETE' : 'RUNNING'}
                </Text>
              </View>
            </View>
            <Text style={[styles.tinyText, { color: colors.muted, marginVertical: 4 }]}>
              5-Step: OCR → Parse → Code → Predict → Validate
            </Text>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.brand }]}
              onPress={() => navigation.navigate('BrainPreview', { claimId: 'a4f1c9e2' })}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.brandDark }]}>Open AI Brain Preview ›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Starter Prompts */}
        {messages.length === 0 && (
          <View style={[styles.welcomeBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text style={[styles.welcomeTitle, { color: colors.ink }]}>Ask ClaimGPT anything</Text>
            <Text style={[styles.tinyText, { color: colors.muted, marginBottom: 10 }]}>
              Answers are grounded in indexed medical documents with client-side PHI scrubbing.
            </Text>
            {['Summarise this claim', 'What documents are missing?', 'Why is the risk medium?', 'Which rules failed?'].map(
              (prompt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.starterChip, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                  onPress={() => sendMessage(prompt)}
                >
                  <Text style={[styles.starterText, { color: colors.ink }]}>{prompt}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}

        {/* Chat History */}
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
            <Text style={[styles.chatText, { color: msg.sender === 'user' ? '#fff' : colors.ink }]}>{msg.text}</Text>
            {msg.scrubbedHits && (
              <Text style={styles.scrubText}>PHI scrubbed: {msg.scrubbedHits.join(', ')}</Text>
            )}
            {msg.sources && <Text style={[styles.sourceText, { color: colors.muted }]}>Sources: {msg.sources}</Text>}
          </View>
        ))}
      </ScrollView>

      {/* Message Composer */}
      <View style={[styles.composer, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface2, color: colors.ink, borderColor: colors.line }]}
          placeholder="Ask about this claim…"
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.brand }]} onPress={handleSend}>
          <Text style={styles.sendBtnText}>➔</Text>
        </TouchableOpacity>
      </View>
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
  avatarBtn: { marginRight: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '700', flex: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 14, gap: 12 },
  card: { padding: 14, borderRadius: 14, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  cardSubtitle: { fontSize: 11.5, marginTop: 2, marginBottom: 10 },
  actionGrid: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  srcBtn: { flex: 1, minWidth: '45%', padding: 9, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  srcBtnText: { fontSize: 11.5, fontWeight: '600' },
  primaryBtn: { paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  secondaryBtn: { paddingVertical: 9, borderRadius: 10, borderWidth: 1, alignItems: 'center', marginTop: 8 },
  secondaryBtnText: { fontSize: 12, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  pillText: { fontSize: 10.5, fontWeight: '700' },
  tinyText: { fontSize: 11.5 },
  welcomeBox: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
  welcomeTitle: { fontSize: 14, fontWeight: '700' },
  starterChip: { padding: 9, borderRadius: 10, borderWidth: 1 },
  starterText: { fontSize: 12 },
  chatBubble: { padding: 12, borderRadius: 14, maxWidth: '85%', marginBottom: 8 },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  assistantBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 2, borderWidth: 1 },
  chatText: { fontSize: 13, lineHeight: 18 },
  scrubText: { fontSize: 9.5, color: '#e0f2fe', marginTop: 4 },
  sourceText: { fontSize: 10, marginTop: 6 },
  composer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, gap: 8, alignItems: 'center' },
  input: { flex: 1, height: 42, borderRadius: 21, paddingHorizontal: 16, fontSize: 13, borderWidth: 1 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
