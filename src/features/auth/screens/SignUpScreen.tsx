import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Info, Check } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';

export const SignUpScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [orgType, setOrgType] = useState<'Hospital' | 'TPA' | 'Insurer'>('Hospital');
  const [orgName, setOrgName] = useState('');
  const [tpaName, setTpaName] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!fullName.trim() || !workEmail.trim()) {
      setToastMsg('Please fill in name and work email');
      setTimeout(() => setToastMsg(null), 2500);
      return;
    }

    setToastMsg('Access request sent — admin will review role');
    setTimeout(() => {
      setToastMsg(null);
      navigation.goBack();
    }, 1500);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.ink }]}>Request access</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollInner} keyboardShouldPersistTaps="handled">
        <View style={[styles.banner, { backgroundColor: colors.brandSoft }]}>
          <Info size={16} color={colors.brandDark} style={{ marginTop: 2 }} />
          <Text style={[styles.bannerText, { color: colors.brandDark }]}>
            Sign-up with TPA onboarding. An organisation admin will approve your role in Keycloak.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Full name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface2, color: colors.ink, borderColor: colors.line }]}
              placeholder="Your name"
              placeholderTextColor={colors.muted}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Work email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface2, color: colors.ink, borderColor: colors.line }]}
              placeholder="you@hospital.in"
              placeholderTextColor={colors.muted}
              value={workEmail}
              onChangeText={setWorkEmail}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Organisation type</Text>
            <View style={[styles.segBar, { backgroundColor: colors.surface2 }]}>
              {(['Hospital', 'TPA', 'Insurer'] as const).map(t => {
                const isSel = orgType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.segBtn,
                      isSel && [styles.segBtnOn, { backgroundColor: colors.surface }],
                    ]}
                    onPress={() => setOrgType(t)}
                  >
                    <Text
                      style={[
                        styles.segBtnText,
                        { color: isSel ? colors.brandDark : colors.muted },
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Organisation name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface2, color: colors.ink, borderColor: colors.line }]}
              placeholder="e.g. Sunrise Multispecialty"
              placeholderTextColor={colors.muted}
              value={orgName}
              onChangeText={setOrgName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>TPA you work with</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface2, color: colors.ink, borderColor: colors.line }]}
              placeholder="e.g. Sample Health TPA"
              placeholderTextColor={colors.muted}
              value={tpaName}
              onChangeText={setTpaName}
            />
          </View>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.line }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.cancelText, { color: colors.muted }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.brand }]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitText}>Send request</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Toast */}
      {toastMsg && (
        <View style={[styles.toast, { backgroundColor: colors.navy }]}>
          <Check size={16} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.toastText} numberOfLines={2}>
            {toastMsg}
          </Text>
        </View>
      )}
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
  scrollInner: { padding: 14, paddingBottom: 24 },
  banner: {
    flexDirection: 'row',
    gap: 8,
    padding: 11,
    borderRadius: 12,
    marginBottom: 12,
  },
  bannerText: { flex: 1, fontSize: 11.5, lineHeight: 16 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  segBar: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    gap: 3,
  },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segBtnOn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segBtnText: { fontSize: 11.5, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 0.38,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: { fontSize: 13, fontWeight: '600' },
  submitBtn: {
    flex: 0.62,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: { color: '#ffffff', fontSize: 13.5, fontWeight: '700' },
  toast: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 30,
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
