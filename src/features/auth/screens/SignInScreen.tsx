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
  Image,
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
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { Routes } from '../../../app/navigation/routes';
import { isEntraEnabled, getEntraMobileConfig } from '../../../core/config/authConfig';
import {
  loginWithPassword,
  completeEntraAuthCode,
  loginWithEntraNative,
  startEntraPasswordReset,
  resendEntraPasswordResetCode,
  submitEntraPasswordReset,
} from '../../../core/api/authApi';

export const SignInScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [entraLoading, setEntraLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Feature flag for Microsoft Entra External ID (CIAM) - defaults to false
  const [useEntra, setUseEntra] = useState<boolean>(() => isEntraEnabled());

  // Forgot Password / SSPR State
  const [forgotMode, setForgotMode] = useState<'none' | 'request' | 'verify'>('none');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotContinuationToken, setForgotContinuationToken] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [forgotResendCountdown, setForgotResendCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (forgotResendCountdown > 0) {
      timer = setTimeout(() => setForgotResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [forgotResendCountdown]);

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
    setForgotSuccessMsg(null);

    try {
      if (useEntra) {
        // Native Microsoft Entra authentication: pass mail and password directly to Entra API
        await loginWithEntraNative({
          email: identifier.trim(),
          password,
        });
      } else {
        try {
          await loginWithPassword({
            username: identifier.trim(),
            password,
          });
        } catch (localErr: any) {
          const msg = localErr instanceof Error ? localErr.message : String(localErr);
          if (
            msg.toLowerCase().includes('microsoft entra') ||
            msg.toLowerCase().includes('web portal') ||
            msg.toLowerCase().includes('no account found')
          ) {
            // User was created via Microsoft Entra on Web Portal: authenticate natively via Entra!
            await loginWithEntraNative({
              email: identifier.trim(),
              password,
            });
          } else {
            throw localErr;
          }
        }
      }
      navigation.replace('MainTabs');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotRequest = async () => {
    const clean = forgotEmail.trim().toLowerCase();
    if (!clean) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }
    setForgotLoading(true);
    setErrorMessage(null);
    setForgotSuccessMsg(null);

    try {
      const res = await startEntraPasswordReset({ email: clean });
      setForgotContinuationToken(res.continuationToken);
      setForgotMode('verify');
      setForgotResendCountdown(30);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to send password reset code. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendForgotCode = async () => {
    if (!forgotContinuationToken) return;
    setForgotLoading(true);
    setErrorMessage(null);

    try {
      const res = await resendEntraPasswordResetCode({
        continuationToken: forgotContinuationToken,
      });
      setForgotContinuationToken(res.continuationToken);
      setForgotResendCountdown(30);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to resend code. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    const cleanCode = forgotCode.trim().replace(/\s+/g, '');
    if (!cleanCode) {
      setErrorMessage('Please enter the verification code sent to your email.');
      return;
    }
    if (!forgotNewPassword) {
      setErrorMessage('Please enter your new password.');
      return;
    }
    if (forgotNewPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }
    if (!forgotContinuationToken) {
      setErrorMessage('Password reset session expired. Please start over.');
      return;
    }

    setForgotLoading(true);
    setErrorMessage(null);

    try {
      const res = await submitEntraPasswordReset({
        continuationToken: forgotContinuationToken,
        code: cleanCode,
        newPassword: forgotNewPassword,
      });

      setForgotSuccessMsg(res.message || 'Password reset successfully! Please sign in with your new password.');
      setIdentifier(forgotEmail);
      setPassword(forgotNewPassword);
      setForgotMode('none');
      setForgotCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setForgotContinuationToken(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Password reset failed. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSsoSignIn = async (provider: string) => {
    if (provider === 'Microsoft' && useEntra) {
      // If user typed email & password, submit them natively
      if (identifier.trim() && password.trim()) {
        await handlePasswordSubmit();
        return;
      }
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await loginWithPassword({
        username: `${provider.toLowerCase()}.user@example.com`,
        password: 'ssopassword',
      });
      navigation.replace('MainTabs');
    } catch {
      navigation.replace('MainTabs');
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
          <Image
            source={require('../../../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
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
            Sign in to your ClaimsGuru workspace to continue.
          </Text>
        </View>

        {/* Success Banner */}
        {forgotSuccessMsg ? (
          <View style={[styles.successBanner, { backgroundColor: colors.brandSoft, borderColor: colors.brand }]}>
            <CheckCircle2 size={18} color={colors.brandDark} />
            <Text style={[styles.successBannerText, { color: colors.brandDark }]}>{forgotSuccessMsg}</Text>
          </View>
        ) : null}

        {/* Error Banner */}
        {errorMessage ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.redSoft, borderColor: colors.red }]}>
            <Text style={[styles.errorBannerText, { color: colors.red }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {forgotMode === 'none' ? (
          /* Standard Sign In Form */
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
                  placeholder="Enter email or mobile number"
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
                <TouchableOpacity
                  onPress={() => {
                    setErrorMessage(null);
                    setForgotSuccessMsg(null);
                    setForgotEmail(identifier.trim());
                    setForgotMode('request');
                  }}
                >
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
                  placeholder="Enter password"
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

            {/* Security Badge */}
            {useEntra ? (
              <View style={styles.securityBadgeRow}>
                <ShieldCheck size={14} color={colors.brand} />
                <Text style={[styles.securityBadgeText, { color: colors.muted }]}>
                  Secured Microsoft Entra Sign In
                </Text>
              </View>
            ) : null}

            {/* SSO Section */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
              <Text style={[styles.dividerText, { color: colors.muted }]}>Or sign in with</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
            </View>

            <View style={styles.ssoGrid}>
              <View
                style={[
                  styles.ssoBtn,
                  { backgroundColor: colors.surface, borderColor: colors.line, flexBasis: '100%' },
                ]}
              >
                <Text style={[styles.ssoBtnText, { color: colors.ink }]}>Google</Text>
              </View>
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
        ) : forgotMode === 'request' ? (
          /* Step 1 of Password Reset: Request Code */
          <View style={styles.localContainer}>
            <View style={styles.forgotCardHeader}>
              <Text style={[styles.forgotTitle, { color: colors.ink }]}>Reset Password</Text>
              <Text style={[styles.forgotSubtitle, { color: colors.muted }]}>
                Enter your registered email address to receive an 8-digit verification code.
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.ink }]}>Email Address</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <Mail size={18} color={colors.muted} style={styles.inputLeadingIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.ink }]}
                  placeholder="Enter your registered email"
                  placeholderTextColor={colors.muted}
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primarySubmitBtn,
                { backgroundColor: colors.brand },
                forgotLoading && { opacity: 0.8 },
              ]}
              onPress={handleForgotRequest}
              disabled={forgotLoading}
              activeOpacity={0.88}
            >
              {forgotLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.primarySubmitBtnText}>Send Verification Code</Text>
                  <ArrowRight size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToSignInBtn}
              onPress={() => {
                setForgotMode('none');
                setErrorMessage(null);
              }}
            >
              <ArrowLeft size={16} color={colors.brandDark} />
              <Text style={[styles.backToSignInText, { color: colors.brandDark }]}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Step 2 of Password Reset: Enter Code & New Password */
          <View style={styles.localContainer}>
            <View style={styles.forgotCardHeader}>
              <Text style={[styles.forgotTitle, { color: colors.ink }]}>Set New Password</Text>
              <Text style={[styles.forgotSubtitle, { color: colors.muted }]}>
                A verification code was sent to <Text style={{ fontWeight: '700', color: colors.ink }}>{forgotEmail}</Text>.
                Enter the code and choose your new password.
              </Text>
            </View>

            {/* OTP Code Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.ink }]}>Verification Code (8 Digits)</Text>
              <View
                style={[
                  styles.otpInputWrapper,
                  { backgroundColor: colors.surface2, borderColor: colors.brand },
                ]}
              >
                <TextInput
                  style={[styles.otpInput, { color: colors.ink }]}
                  placeholder="--------"
                  placeholderTextColor={colors.muted}
                  value={forgotCode}
                  onChangeText={setForgotCode}
                  keyboardType="number-pad"
                  maxLength={10}
                  autoFocus
                />
              </View>
            </View>

            {/* New Password */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.ink }]}>New Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <Lock size={18} color={colors.muted} style={styles.inputLeadingIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.ink, paddingRight: 40 }]}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.muted}
                  value={forgotNewPassword}
                  onChangeText={setForgotNewPassword}
                  secureTextEntry={!showForgotNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowForgotNewPassword(!showForgotNewPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showForgotNewPassword ? (
                    <EyeOff size={18} color={colors.muted} />
                  ) : (
                    <Eye size={18} color={colors.muted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.ink }]}>Confirm New Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <Lock size={18} color={colors.muted} style={styles.inputLeadingIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.ink }]}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.muted}
                  value={forgotConfirmPassword}
                  onChangeText={setForgotConfirmPassword}
                  secureTextEntry={!showForgotNewPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primarySubmitBtn,
                { backgroundColor: colors.brand },
                forgotLoading && { opacity: 0.8 },
              ]}
              onPress={handleForgotSubmit}
              disabled={forgotLoading}
              activeOpacity={0.88}
            >
              {forgotLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.primarySubmitBtnText}>Reset Password & Sign In</Text>
                  <ArrowRight size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            {/* Resend Code Button */}
            <TouchableOpacity
              style={styles.resendForgotRow}
              onPress={handleResendForgotCode}
              disabled={forgotResendCountdown > 0 || forgotLoading}
            >
              <RefreshCw size={14} color={forgotResendCountdown > 0 ? colors.muted : colors.brandDark} />
              <Text
                style={[
                  styles.resendForgotText,
                  { color: forgotResendCountdown > 0 ? colors.muted : colors.brandDark },
                ]}
              >
                {forgotResendCountdown > 0
                  ? `Resend code in ${forgotResendCountdown}s`
                  : 'Resend verification code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToSignInBtn}
              onPress={() => {
                setForgotMode('none');
                setErrorMessage(null);
              }}
            >
              <ArrowLeft size={16} color={colors.brandDark} />
              <Text style={[styles.backToSignInText, { color: colors.brandDark }]}>Cancel</Text>
            </TouchableOpacity>
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
  logoImage: {
    width: 72,
    height: 72,
    marginBottom: 4,
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  successBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  forgotCardHeader: {
    marginBottom: 16,
  },
  forgotTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  forgotSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  backToSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 6,
  },
  backToSignInText: {
    fontSize: 13,
    fontWeight: '600',
  },
  otpInputWrapper: {
    borderWidth: 1.5,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  otpInput: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
    width: '100%',
  },
  resendForgotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 6,
  },
  resendForgotText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});
