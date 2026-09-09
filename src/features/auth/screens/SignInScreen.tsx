import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { Routes } from '../../../app/navigation/routes';
import { isEntraEnabled, getEntraMobileConfig } from '../../../core/config/authConfig';
import { loginWithPassword, completeEntraAuthCode, syncEntraUser } from '../../../core/api/authApi';

export const SignInScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const [identifier, setIdentifier] = useState('patient@example.com');
  const [password, setPassword] = useState('samplepass');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [entraLoading, setEntraLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Feature flag for Microsoft Entra External ID (CIAM) - defaults to false
  const [useEntra, setUseEntra] = useState<boolean>(() => isEntraEnabled());

  useEffect(() => {
    setUseEntra(isEntraEnabled());

    const handleDeepLink = async (event: { url: string }) => {
      if (!event?.url) return;
      const urlStr = event.url;
      if (!urlStr.includes('auth/callback') && !urlStr.includes('code=') && !urlStr.includes('error=')) {
        return;
      }

      setEntraLoading(true);
      setErrorMessage(null);

      try {
        let code: string | null = null;
        let error: string | null = null;
        let errorDesc: string | null = null;

        const queryIndex = urlStr.indexOf('?');
        if (queryIndex !== -1) {
          const queryString = urlStr.slice(queryIndex + 1).split('#')[0];
          const params = new URLSearchParams(queryString);
          code = params.get('code');
          error = params.get('error');
          errorDesc = params.get('error_description');
        }

        if (error) {
          throw new Error(errorDesc || 'Microsoft Entra authentication was cancelled or access was denied.');
        }

        if (!code) {
          throw new Error('Authentication response did not contain an authorization code.');
        }

        // Exchange authorization code for token and verify in backend database
        await completeEntraAuthCode(code);

        // ONLY upon successful verification, proceed into the app
        navigation.replace('MainTabs');
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Microsoft Entra authentication verification failed.'
        );
      } finally {
        setEntraLoading(false);
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      sub.remove();
    };
  }, [navigation]);

  const handlePasswordSubmit = async () => {
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter your email address and password.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await loginWithPassword({
        username: identifier.trim(),
        password,
      });
      navigation.replace('MainTabs');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEntraSignIn = async () => {
    setEntraLoading(true);
    setErrorMessage(null);

    try {
      const config = getEntraMobileConfig();
      if (!config.clientId || !config.authority) {
        throw new Error(
          'Microsoft Entra External ID configuration is missing Client ID or Authority in .env.'
        );
      }

      const authorizeUrl = `${config.authority}/oauth2/v2.0/authorize?client_id=${encodeURIComponent(
        config.clientId
      )}&response_type=code&redirect_uri=${encodeURIComponent(
        config.redirectUri
      )}&response_mode=query&scope=${encodeURIComponent(config.scopes)}&prompt=select_account`;

      const canOpen = await Linking.canOpenURL(authorizeUrl).catch(() => false);
      if (!canOpen && Platform.OS !== 'web') {
        throw new Error('Unable to open browser for Microsoft Entra login.');
      }

      await Linking.openURL(authorizeUrl);
      // Wait for OAuth callback. DO NOT navigate to MainTabs here!
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to connect to Microsoft Entra External ID.'
      );
    } finally {
      setEntraLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandBox}>
          <View style={[styles.logoIcon, { backgroundColor: colors.brand }]}>
            <ShieldCheck size={36} color="#ffffff" strokeWidth={2.2} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.ink }]}>ClaimsGuru</Text>
          <Text style={[styles.brandTagline, { color: colors.muted }]}>
            Smarter Claims. Faster Care.
          </Text>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeBox}>
          <Text style={[styles.welcomeTitle, { color: colors.ink }]}>
            Welcome to ClaimsGuru
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.muted }]}>
            {useEntra
              ? 'Select your portal to continue with Microsoft Entra External ID.'
              : 'Sign in to your ClaimsGuru workspace to continue.'}
          </Text>
        </View>

        {/* Error Banner */}
        {errorMessage ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.redSoft, borderColor: colors.red }]}>
            <Text style={[styles.errorBannerText, { color: colors.red }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Main Authentication Flow */}
        {useEntra ? (
          /* ========================================================================= */
          /* Microsoft Entra External ID (CIAM) Flow */
          /* ========================================================================= */
          <View style={styles.entraContainer}>
            {/* Continue as Patient Card */}
            <TouchableOpacity
              style={[
                styles.entraCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.brand,
                },
              ]}
              onPress={handleEntraSignIn}
              disabled={entraLoading}
              activeOpacity={0.85}
            >
              <View style={styles.entraCardLeft}>
                <View style={[styles.avatarIconBox, { backgroundColor: colors.brandSoft }]}>
                  <User size={24} color={colors.brandDark} />
                </View>
                <View style={styles.entraCardTextCol}>
                  <View style={styles.entraBadgeRow}>
                    <Text style={[styles.entraCardTitle, { color: colors.ink }]}>
                      Continue as Patient
                    </Text>
                    <View style={[styles.rolePill, { backgroundColor: colors.brandSoft, borderColor: colors.brand }]}>
                      <Text style={[styles.rolePillText, { color: colors.brandDark }]}>Submitter</Text>
                    </View>
                  </View>
                  <Text style={[styles.entraCardSub, { color: colors.muted }]}>
                    Sign in to track and submit insurance claims
                  </Text>
                </View>
              </View>

              <View style={[styles.entraCardArrow, { backgroundColor: colors.brandSoft }]}>
                {entraLoading ? (
                  <ActivityIndicator size="small" color={colors.brandDark} />
                ) : (
                  <ArrowRight size={18} color={colors.brandDark} />
                )}
              </View>
            </TouchableOpacity>

            {/* Entra Security Badge */}
            <View style={styles.securityBadgeRow}>
              <ShieldCheck size={14} color={colors.brand} />
              <Text style={[styles.securityBadgeText, { color: colors.muted }]}>
                Secured by Microsoft Entra External ID (CIAM)
              </Text>
            </View>

            {/* Entra Sign-up Prompt */}
            <View style={styles.signupPromptRow}>
              <Text style={[styles.signupPrompt, { color: colors.muted }]}>
                New patient to ClaimsGuru?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate(Routes.SignUp)}>
                <Text style={[styles.signupLink, { color: colors.brandDark }]}>Create an account</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ========================================================================= */
          /* Local Email + Password Authentication (Default Flow) */
          /* ========================================================================= */
          <View style={styles.localContainer}>
            {/* Email / Username Field */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.ink }]}>
                Email Address or Mobile Number
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface, borderColor: colors.line },
                ]}
              >
                <Mail size={18} color={colors.muted} style={styles.inputLeadingIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.ink }]}
                  placeholder="e.g. john@example.com or 9876543210"
                  placeholderTextColor={colors.muted}
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="username"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.formGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={[styles.label, { color: colors.ink }]}>Password</Text>
                <TouchableOpacity onPress={() => {}}>
                  <Text style={[styles.forgotLink, { color: colors.brandDark }]}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface, borderColor: colors.line },
                ]}
              >
                <Lock size={18} color={colors.muted} style={styles.inputLeadingIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.ink, paddingRight: 40 }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.muted} />
                  ) : (
                    <Eye size={18} color={colors.muted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.primarySubmitBtn,
                { backgroundColor: colors.brand },
                submitting && { opacity: 0.8 },
              ]}
              onPress={handlePasswordSubmit}
              disabled={submitting}
              activeOpacity={0.88}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.primarySubmitBtnText}>Sign In to Patient Portal</Text>
                  <ArrowRight size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            {/* SSO Section */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
              <Text style={[styles.dividerText, { color: colors.muted }]}>Or sign in with</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
            </View>

            <View style={styles.ssoGrid}>
              <TouchableOpacity
                style={[styles.ssoBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
                onPress={handlePasswordSubmit}
              >
                <Text style={[styles.ssoBtnText, { color: colors.ink }]}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ssoBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
                onPress={handlePasswordSubmit}
              >
                <Text style={[styles.ssoBtnText, { color: colors.ink }]}>Microsoft</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ssoBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
                onPress={handlePasswordSubmit}
              >
                <Text style={[styles.ssoBtnText, { color: colors.ink }]}>Apple</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ssoBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}
                onPress={handlePasswordSubmit}
              >
                <Text style={[styles.ssoBtnText, { color: colors.ink }]}>SAML</Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signupPromptRow}>
              <Text style={[styles.signupPrompt, { color: colors.muted }]}>
                New to ClaimsGuru?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate(Routes.SignUp)}>
                <Text style={[styles.signupLink, { color: colors.brandDark }]}>Create an account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={[styles.footerBox, { borderTopColor: colors.line }]}>
          <View style={styles.footerRow}>
            <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.footerText, { color: colors.muted }]}>
              All systems operational · IRDAI · ISO 27001 · HIPAA aligned
            </Text>
          </View>
          <Text style={[styles.footerSubText, { color: colors.muted }]}>
            © 2026 WaferWire Cloud Technologies · ClaimsGuru v1.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 36,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 22,
  },
  logoIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 14,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  welcomeBox: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 13.5,
    marginTop: 6,
    lineHeight: 19,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
  },
  entraContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  entraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  entraCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  avatarIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entraCardTextCol: {
    flex: 1,
  },
  entraBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entraCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rolePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  entraCardSub: {
    fontSize: 11.5,
    marginTop: 3,
    lineHeight: 16,
  },
  entraCardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  securityBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 18,
  },
  securityBadgeText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  localContainer: {
    marginBottom: 10,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 13,
    paddingHorizontal: 12,
    height: 48,
  },
  inputLeadingIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  primarySubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primarySubmitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ssoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  ssoBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ssoBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  signupPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  signupPrompt: {
    fontSize: 13,
  },
  signupLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerBox: {
    borderTopWidth: 1,
    paddingTop: 18,
    alignItems: 'center',
    gap: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footerSubText: {
    fontSize: 10.5,
    opacity: 0.85,
  },
});
