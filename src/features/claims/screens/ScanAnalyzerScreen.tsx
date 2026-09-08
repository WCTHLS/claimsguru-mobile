import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, FileText, Check, AlertTriangle, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { Routes } from '../../../app/navigation/routes';

export const ScanAnalyzerScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const claimId = route?.params?.claimId || 'a4f1c9e2';

  const MODALITIES = ['MRI', 'CT', 'X-Ray', 'Ultrasound', 'PET', 'Mammography'] as const;
  const [selectedModality, setSelectedModality] = useState<typeof MODALITIES[number]>('MRI');

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
        <Text style={[styles.appBarTitle, { color: colors.ink }]}>Scan analyzer</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollInner}>
        {/* Modality Chips */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Detected type</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalityScroll}>
          {MODALITIES.map(m => {
            const isSel = selectedModality === m;
            return (
              <TouchableOpacity
                key={m}
                style={[
                  styles.modalityChip,
                  {
                    backgroundColor: isSel ? colors.brandSoft : colors.surface,
                    borderColor: isSel ? colors.brand : colors.line,
                  },
                ]}
                onPress={() => setSelectedModality(m)}
              >
                <Text
                  style={[
                    styles.modalityChipText,
                    { color: isSel ? colors.brandDark : colors.ink, fontWeight: isSel ? '700' : '500' },
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Main Detected Report Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.reportHeaderRow}>
            <View style={[styles.reportIconBox, { backgroundColor: colors.brandSoft }]}>
              <FileText size={18} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.reportFileName, { color: colors.ink }]}>
                {selectedModality === 'MRI'
                  ? 'MRI_Cardiac_Report.pdf'
                  : `${selectedModality}_Scan_Report.pdf`}
              </Text>
              <Text style={[styles.reportSub, { color: colors.muted }]}>
                detected automatically during OCR
              </Text>
            </View>
            <View style={[styles.severityPill, { backgroundColor: colors.amberSoft }]}>
              <Text style={[styles.severityPillText, { color: colors.amber }]}>MODERATE</Text>
            </View>
          </View>

          {/* Extracted Findings Header */}
          <View style={styles.findingsHeader}>
            <Text style={[styles.subSectionTitle, { color: colors.ink }]}>Extracted findings</Text>
            <Text style={[styles.sampleBadge, { color: colors.muted }]}>Sample</Text>
          </View>

          {/* Findings List */}
          <View style={styles.findingsList}>
            <View style={[styles.findingRow, { borderBottomColor: colors.line2 }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.amber }]} />
              <Text style={[styles.findingText, { color: colors.ink }]}>
                Mild left ventricular hypertrophy
              </Text>
              <View style={[styles.findingPill, { backgroundColor: colors.amberSoft }]}>
                <Text style={[styles.findingPillText, { color: colors.amber }]}>Moderate</Text>
              </View>
            </View>

            <View style={[styles.findingRow, { borderBottomColor: colors.line2 }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.green }]} />
              <Text style={[styles.findingText, { color: colors.ink }]}>
                No pericardial effusion
              </Text>
              <View style={[styles.findingPill, { backgroundColor: colors.greenSoft }]}>
                <Text style={[styles.findingPillText, { color: colors.green }]}>Normal</Text>
              </View>
            </View>

            <View style={[styles.findingRow, { borderBottomColor: colors.line2 }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.red }]} />
              <Text style={[styles.findingText, { color: colors.ink }]}>
                Regional wall motion abnormality — anterior
              </Text>
              <View style={[styles.findingPill, { backgroundColor: colors.redSoft }]}>
                <Text style={[styles.findingPillText, { color: colors.red }]}>Severe</Text>
              </View>
            </View>

            <View style={[styles.findingRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.green }]} />
              <Text style={[styles.findingText, { color: colors.ink }]}>
                Valve morphology unremarkable
              </Text>
              <View style={[styles.findingPill, { backgroundColor: colors.greenSoft }]}>
                <Text style={[styles.findingPillText, { color: colors.green }]}>Normal</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Linked Medical Codes Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.subSectionTitle, { color: colors.ink, marginBottom: 10 }]}>
            Linked codes
          </Text>

          <View style={[styles.codeLinkRow, { borderBottomColor: colors.line2 }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.codeBadge, { backgroundColor: colors.surface2 }]}>
                  <Text style={[styles.codeBadgeText, { color: colors.muted }]}>I21.9</Text>
                </View>
                <Text style={[styles.codeLabelText, { color: colors.ink }]}>
                  supported by this scan
                </Text>
              </View>
            </View>
            <View style={[styles.linkPill, { backgroundColor: colors.greenSoft }]}>
              <Text style={[styles.linkPillText, { color: colors.green }]}>Strong</Text>
            </View>
          </View>

          <View style={[styles.codeLinkRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.codeBadge, { backgroundColor: colors.surface2 }]}>
                  <Text style={[styles.codeBadgeText, { color: colors.muted }]}>I50.9</Text>
                </View>
                <Text style={[styles.codeLabelText, { color: colors.ink }]}>
                  suggested addition
                </Text>
              </View>
            </View>
            <View style={[styles.linkPill, { backgroundColor: colors.amberSoft }]}>
              <Text style={[styles.linkPillText, { color: colors.amber }]}>Review</Text>
            </View>
          </View>
        </View>

        <View style={[styles.infoBanner, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.infoBannerText, { color: colors.muted }]}>
            Radiology findings are automatically extracted during the OCR pipeline via LayoutLM and vision models, then linked to ICD-10 diagnostic indices.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
        <TouchableOpacity
          style={[styles.bottomOutlineBtn, { borderColor: colors.line }]}
          onPress={() => navigation.navigate(Routes.OcrParsedFields, { claimId, docKey: 'scan_report' })}
        >
          <Text style={[styles.bottomOutlineText, { color: colors.brandDark }]}>Source doc</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomSolidBtn, { backgroundColor: colors.brand }]}
          onPress={() => navigation.navigate(Routes.MedicalCoding, { claimId })}
        >
          <Text style={styles.bottomSolidText}>Review coding</Text>
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
  content: { flex: 1 },
  scrollInner: { padding: 13, paddingBottom: 24 },
  sectionHeader: { marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700' },
  modalityScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  modalityChip: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1,
  },
  modalityChipText: { fontSize: 12 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    marginBottom: 12,
  },
  reportHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  reportIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportFileName: { fontSize: 13, fontWeight: '700' },
  reportSub: { fontSize: 11, marginTop: 1 },
  severityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  severityPillText: { fontSize: 10, fontWeight: '700' },
  findingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  subSectionTitle: { fontSize: 12.5, fontWeight: '700' },
  sampleBadge: { fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  findingsList: {},
  findingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  findingText: { flex: 1, fontSize: 12 },
  findingPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  findingPillText: { fontSize: 10, fontWeight: '700' },
  codeLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  codeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  codeLabelText: { fontSize: 12 },
  linkPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  linkPillText: { fontSize: 10.5, fontWeight: '700' },
  infoBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  infoBannerText: { fontSize: 11.5, lineHeight: 16 },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 9,
  },
  bottomOutlineBtn: {
    flex: 0.46,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomOutlineText: { fontSize: 13, fontWeight: '600' },
  bottomSolidBtn: {
    flex: 0.54,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSolidText: { color: '#ffffff', fontSize: 13.5, fontWeight: '700' },
});
