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
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { Routes } from '../../../app/navigation/routes';
import { useAuthStore } from '../../../state/useAuthStore';

export const SignInScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { signIn } = useAuthStore();
  const [username, setUsername] = useState('ops@sample-tpa.in');
  const [password, setPassword] = useState('samplepass');

  const handleSignIn = () => {
    signIn(username);
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandBox}>
          <View style={[styles.logoIcon, { backgroundColor: colors.brand }]}>
            <ShieldCheck size={32} color="#ffffff" />
          </View>
          <Text style={[styles.brandTitle, { color: colors.ink }]}>ClaimsGuru</Text>
          <Text style={[styles.brandTagline, { color: colors.muted }]}>
            Smarter Claims. Faster Care.
          </Text>
        </View>

        {/* SSO Button */}
        <TouchableOpacity
          style={[styles.ssoBtn, { backgroundColor: colors.brand }]}
          onPress={handleSignIn}
        >
          <Lock size={16} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.ssoBtnText}>Sign in with Keycloak SSO</Text>
        </TouchableOpacity>

        <Text style={[styles.ssoSub, { color: colors.muted }]}>
          Authorization Code + PKCE · realm claimgpt
        </Text>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
          <Text style={[styles.dividerText, { color: colors.muted }]}>or JWT fallback</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
        </View>

        {/* Fallback Form */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Username</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line }]}
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.outlineBtn, { borderColor: colors.brand }]}
          onPress={handleSignIn}
        >
          <Text style={[styles.outlineBtnText, { color: colors.brandDark }]}>Continue</Text>
        </TouchableOpacity>

        <View style={styles.signupPromptRow}>
          <Text style={[styles.signupPrompt, { color: colors.muted }]}>New organisation? </Text>
          <TouchableOpacity onPress={() => navigation.navigate(Routes.SignUp)}>
            <Text style={[styles.signupLink, { color: colors.brandDark }]}>Request access</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.roleNotice, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.roleNoticeText, { color: colors.muted }]}>
            Token roles: <Text style={{ fontWeight: '700', color: colors.ink }}>admin</Text> · <Text style={{ fontWeight: '700', color: colors.ink }}>reviewer</Text> · <Text style={{ fontWeight: '700', color: colors.ink }}>submitter</Text> · <Text style={{ fontWeight: '700', color: colors.ink }}>viewer</Text>.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 24, justifyContent: 'center' },
  brandBox: { alignItems: 'center', marginTop: 24, marginBottom: 28 },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  brandTitle: { fontSize: 24, fontWeight: '800', marginTop: 14, letterSpacing: -0.5 },
  brandTagline: { fontSize: 13, marginTop: 4 },
  ssoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 8,
  },
  ssoBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  ssoSub: { fontSize: 11, textAlign: 'center', marginBottom: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 11.5 },
  formGroup: { marginBottom: 12 },
  label: { fontSize: 11.5, fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
  },
  outlineBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  outlineBtnText: { fontSize: 13.5, fontWeight: '700' },
  signupPromptRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  signupPrompt: { fontSize: 12.5 },
  signupLink: { fontSize: 12.5, fontWeight: '700' },
  roleNotice: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleNoticeText: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
