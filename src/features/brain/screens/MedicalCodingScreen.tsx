import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { Routes } from '../../../app/navigation/routes';
import { ICD_CODES, CPT_CODES, CodeItem } from '../../../mocks/codes.mock';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { claimsApi } from '../../claims/services/claimsApi';
import { apiClient } from '../../../core/api/client';
import {
  ArrowLeft,
  Info,
  ThumbsUp,
  ThumbsDown,
  Check,
} from 'lucide-react-native';

export const MedicalCodingScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const claimId = route?.params?.claimId || 'a4f1c9e2';

  const [activeTab, setActiveTab] = useState<'icd' | 'cpt'>('icd');
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [realIcdCodes, setRealIcdCodes] = useState<CodeItem[] | null>(null);
  const [realCptCodes, setRealCptCodes] = useState<CodeItem[] | null>(null);

  const formatCodesFromPreview = (preview: any) => {
    if (preview) {
      if (Array.isArray(preview.icd_codes)) {
        const formattedIcd: CodeItem[] = preview.icd_codes.map((c: any) => ({
          code: c.code,
          desc: c.description || 'Diagnostic code',
          meta: `confidence ${c.confidence ? c.confidence.toFixed(2) : '0.85'}`,
          confidence: c.confidence || 0.85,
        }));
        setRealIcdCodes(formattedIcd);
      }
      if (Array.isArray(preview.cpt_codes)) {
        const formattedCpt: CodeItem[] = preview.cpt_codes.map((c: any) => ({
          code: c.code,
          desc: c.description || 'Procedure code',
          meta: c.estimated_cost
            ? `est. ₹${Number(c.estimated_cost).toLocaleString('en-IN')}`
            : `confidence ${c.confidence ? c.confidence.toFixed(2) : '0.80'}`,
          confidence: c.confidence || 0.80,
        }));
        setRealCptCodes(formattedCpt);
      } else {
        setRealCptCodes([]);
      }
    }
  };

  useEffect(() => {
    const passedPreview = route?.params?.preview || useClaimsStore.getState().claimPreviews[claimId];
    if (passedPreview) {
      formatCodesFromPreview(passedPreview);
    }

    if (claimId) {
      claimsApi.getClaimPreview(claimId).then(preview => {
        if (preview) {
          formatCodesFromPreview(preview);
          useClaimsStore.getState().setClaimPreview(claimId, preview);
        }
      }).catch(err => {
        console.log('[MedicalCodingScreen] Error fetching codes:', err);
      });
    }
  }, [claimId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  const handleFeedback = (code: string, vote: 'up' | 'down') => {
    const action = vote === 'up' ? 'accept' : 'reject';
    setFeedback(prev => ({
      ...prev,
      [code]: prev[code] === vote ? (undefined as any) : vote,
    }));

    if (claimId && claimId.length > 20) {
      apiClient.post(`/submission/claims/${claimId}/code-feedback`, {
        code,
        action,
      }).then((res: any) => {
        showToast(res?.message || `Code ${code} recorded: ${action}`);
      }).catch(err => {
        showToast(`Recorded locally: ${code} (${action})`);
      });
    } else {
      showToast(`Code ${code} (${action})`);
    }
  };

  const isDemoClaim = !claimId || claimId === 'a4f1c9e2';
  const currentCodes = activeTab === 'icd'
    ? (realIcdCodes !== null ? realIcdCodes : (isDemoClaim ? ICD_CODES : []))
    : (realCptCodes !== null ? realCptCodes : (isDemoClaim ? CPT_CODES : []));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* App Bar matching Screen 13 */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.ink} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.title, { color: colors.ink }]}>Medical coding</Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>Claim {claimId.slice(0, 8)}</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <View style={[styles.banner, { backgroundColor: colors.brandSoft }]}>
            <Info size={16} color={colors.brandDark} style={{ marginTop: 2 }} />
            <Text style={[styles.bannerText, { color: colors.brandDark }]}>
              Accept or reject a code — feedback posts to <Text style={styles.mono}>/code-feedback</Text>. Requires the <Text style={{ fontWeight: '700' }}>reviewer</Text> role.
            </Text>
          </View>

          {/* Tab Selector Buttons */}
          <View style={[styles.tabsContainer, { backgroundColor: colors.surface2 }]}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'icd' && [styles.tabBtnOn, { backgroundColor: colors.surface }],
              ]}
              onPress={() => setActiveTab('icd')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color: activeTab === 'icd' ? colors.brandDark : colors.muted,
                    fontWeight: activeTab === 'icd' ? '700' : '500',
                  },
                ]}
              >
                ICD-10 diagnosis
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'cpt' && [styles.tabBtnOn, { backgroundColor: colors.surface }],
              ]}
              onPress={() => setActiveTab('cpt')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color: activeTab === 'cpt' ? colors.brandDark : colors.muted,
                    fontWeight: activeTab === 'cpt' ? '700' : '500',
                  },
                ]}
              >
                CPT procedures
              </Text>
            </TouchableOpacity>
          </View>

          {/* Codes List Card */}
          <View style={[styles.card, styles.listCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {currentCodes.length > 0 ? (
              currentCodes.map((item, idx) => {
                const isLast = idx === currentCodes.length - 1;
                const currentVote = feedback[item.code];

                return (
                  <View
                    key={item.code}
                    style={[
                      styles.codeRow,
                      !isLast && { borderBottomWidth: 1, borderBottomColor: colors.line2 },
                    ]}
                  >
                    <View style={[styles.codeTag, { backgroundColor: colors.surface2 }]}>
                      <Text style={[styles.codeTagText, styles.mono, { color: colors.muted }]}>
                        {item.code}
                      </Text>
                    </View>

                    <View style={styles.codeInfo}>
                      <Text style={[styles.codeDesc, { color: colors.ink }]} numberOfLines={1}>
                        {item.desc}
                      </Text>
                      <Text style={[styles.codeMeta, { color: colors.muted }]}>{item.meta}</Text>
                    </View>

                    {/* Feedback Buttons */}
                    <View style={styles.voteButtons}>
                      <TouchableOpacity
                        style={[
                          styles.voteBtn,
                          currentVote === 'up' && {
                            backgroundColor: colors.greenSoft,
                            borderColor: colors.green,
                          },
                        ]}
                        onPress={() => handleFeedback(item.code, 'up')}
                        activeOpacity={0.7}
                      >
                        <ThumbsUp
                          size={15}
                          color={currentVote === 'up' ? colors.green : colors.muted}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.voteBtn,
                          currentVote === 'down' && {
                            backgroundColor: colors.redSoft,
                            borderColor: colors.red,
                          },
                        ]}
                        onPress={() => handleFeedback(item.code, 'down')}
                        activeOpacity={0.7}
                      >
                        <ThumbsDown
                          size={15}
                          color={currentVote === 'down' ? colors.red : colors.muted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={{ padding: 22, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 18 }}>
                  {activeTab === 'cpt'
                    ? 'No CPT procedure codes extracted for this claim. CPT codes apply when surgical or procedural treatment is documented.'
                    : 'No ICD diagnostic codes extracted for this claim.'}
                </Text>
              </View>
            )}
          </View>

          {/* Note Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text style={[styles.noteText, { color: colors.muted }]}>
              Candidates retrieved from a FAISS index over ICD-10 (embedding <Text style={styles.mono}>pritamdeka/S-PubMedBert-MS-MARCO</Text>), then re-ranked; cost estimates come from the coding service.
            </Text>
          </View>
        </ScrollView>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <View style={[styles.toast, { backgroundColor: colors.navy }]}>
            <Check size={16} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.toastText} numberOfLines={2}>
              {toastMessage}
            </Text>
          </View>
        )}

        {/* Sticky Bottom Actions Bar */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.line }]}
            onPress={() => showToast('Opening scan evidence…')}
            activeOpacity={0.7}
          >
            <Text style={[styles.outlineBtnText, { color: colors.brandDark }]}>Scan evidence</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.brand }]}
            onPress={() => navigation.navigate(Routes.BrainPreview, { claimId })}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Back to Brain</Text>
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
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
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
  banner: {
    flexDirection: 'row',
    gap: 9,
    padding: 11,
    borderRadius: 12,
    alignItems: 'flex-start',
    marginBottom: 11,
  },
  bannerText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
  mono: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 11,
    gap: 3,
    marginBottom: 11,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabBtnOn: {
    shadowColor: '#102030',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 13,
    marginBottom: 11,
  },
  listCard: {
    padding: 0,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 13,
    gap: 10,
  },
  codeTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeTagText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  codeInfo: {
    flex: 1,
  },
  codeDesc: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  codeMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  voteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  toast: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 74,
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
  toastText: {
    color: '#ffffff',
    fontSize: 11.5,
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 9,
  },
  outlineBtn: {
    flex: 0.46,
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
    flex: 0.54,
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
