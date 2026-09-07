import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { usePipelineStore } from '../../../state/usePipelineStore';

const STEP_NAMES = ['OCR Document Scan', 'Parse Fields & Types', 'Suggest Medical Codes', 'Predict Rejection Risk', 'Deterministic Validation'];

export const WorkflowPipelineScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { complete, failed, stepStates, attempt, totalSeconds, retryPipeline, resetPipeline } = usePipelineStore();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.title, { color: colors.ink }]}>Pipeline Execution</Text>
          <View
            style={[
              styles.pill,
              { backgroundColor: complete ? colors.greenSoft : failed ? colors.redSoft : colors.brandSoft },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { color: complete ? colors.green : failed ? colors.red : colors.brandDark },
              ]}
            >
              {complete ? 'COMPLETE' : failed ? 'FAILED' : 'RUNNING'}
            </Text>
          </View>
        </View>
        <Text style={[styles.subText, { color: colors.muted, marginTop: 4 }]}>
          Celery Queues: gpu_queue → default · attempt {attempt} of 5
        </Text>
        {totalSeconds && (
          <Text style={[styles.totalTime, { color: colors.brandDark }]}>
            total_processing_seconds: {totalSeconds}s
          </Text>
        )}
      </View>

      {/* Stepper */}
      <View style={[styles.stepperCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        {STEP_NAMES.map((name, i) => {
          const state = stepStates[i];
          const isDone = state === 'd';
          const isRunning = state === 'r';
          const isFailed = state === 'f';

          return (
            <View key={i} style={styles.stepRow}>
              <View
                style={[
                  styles.bullet,
                  {
                    backgroundColor: isDone
                      ? colors.brand
                      : isFailed
                      ? colors.red
                      : isRunning
                      ? colors.brandSoft
                      : colors.surface2,
                    borderColor: isDone || isRunning ? colors.brand : colors.line,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.bulletText,
                    { color: isDone || isFailed ? '#fff' : isRunning ? colors.brandDark : colors.muted },
                  ]}
                >
                  {isDone ? '✓' : isFailed ? '✗' : String(i + 1)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepName, { color: colors.ink }]}>{name}</Text>
                <Text style={[styles.stepStatus, { color: isRunning ? colors.brandDark : colors.muted }]}>
                  {isDone ? 'Finished' : isRunning ? 'Processing…' : isFailed ? 'Failed' : 'Queued'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Action CTA */}
      {complete && (
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.brand }]}
          onPress={() => navigation.navigate('BrainPreview', { claimId: 'a4f1c9e2' })}
        >
          <Text style={styles.primaryBtnText}>Open AI Brain Preview ›</Text>
        </TouchableOpacity>
      )}

      {failed && (
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.red }]}
          onPress={retryPipeline}
        >
          <Text style={styles.primaryBtnText}>Retry Step (Attempt {attempt + 1} of 5)</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  headerCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  subText: { fontSize: 11.5 },
  totalTime: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  pillText: { fontSize: 10.5, fontWeight: '700' },
  stepperCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14, gap: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bullet: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  bulletText: { fontSize: 11, fontWeight: '700' },
  stepName: { fontSize: 13, fontWeight: '650' },
  stepStatus: { fontSize: 11, marginTop: 1 },
  primaryBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 13.5, fontWeight: '700' },
});
