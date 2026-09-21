import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Calendar,
  ShieldCheck,
  Check,
  CheckCircle2,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { Routes } from '../../../app/navigation/routes';
import { registerPatient } from '../../../core/api/authApi';

const INSURERS = [
  'Star Health',
  'HDFC ERGO',
  'ICICI Lombard',
  'Care Health',
  'Niva Bupa',
  'Bajaj Allianz',
];

export const SignUpScreen = ({ navigation }: any) => {
  const { colors } = useTheme();

  // Personal Info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');

  // Insurance Info
  const [insurer, setInsurer] = useState('Star Health');
  const [policyNumber, setPolicyNumber] = useState('P-0007401');
  const [sumInsured, setSumInsured] = useState('500000');

  const [agree, setAgree] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleDobChange = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 8);
    if (raw.length <= 2) {
      setDob(raw);
    } else if (raw.length <= 4) {
      setDob(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setDob(`${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)}`);
    }
  };

  const handleRegister = async () => {
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    if (!firstName.trim()) {
      setErrorMessage('Please enter your first name.');
      return;
    }

    if (!agree) {
      setErrorMessage('Please accept the Terms of Service to continue.');
      return;
    }

    setSubmitting(true);

    try {
      await registerPatient({
        username: cleanEmail,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        dob: dob.trim() || undefined,
        gender,
        policy: policyNumber.trim() || undefined,
        sumInsured: sumInsured.trim() || undefined,
      });

      setToastMsg('Account created successfully!');
      setTimeout(() => {
        setToastMsg(null);
        navigation.replace('MainTabs');
      }, 1200);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Registration failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* App Bar */}
      <View
        style={[
          styles.appBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.line },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.ink }]}>Create Patient Account</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollInner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: colors.brandSoft }]}>
          <ShieldCheck size={18} color={colors.brandDark} style={{ marginTop: 2 }} />
          <Text style={[styles.bannerText, { color: colors.brandDark }]}>
            Self-service patient registration. Your profile and insurance details will be securely saved.
          </Text>
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View style={[styles.errorBox, { backgroundColor: colors.redSoft, borderColor: colors.red }]}>
            <Text style={[styles.errorText, { color: colors.red }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Account Credentials Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.ink }]}>
            Login Credentials
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.ink }]}>Email Address *</Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface2, borderColor: colors.line },
              ]}
            >
              <Mail size={16} color={colors.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.ink }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.ink }]}>Password *</Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface2, borderColor: colors.line },
              ]}
            >
              <Lock size={16} color={colors.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.ink, paddingRight: 36 }]}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIconBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={16} color={colors.muted} />
                ) : (
                  <Eye size={16} color={colors.muted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.ink }]}>Confirm Password *</Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface2, borderColor: colors.line },
              ]}
            >
              <Lock size={16} color={colors.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.ink }]}
                placeholder="Re-enter password"
                placeholderTextColor={colors.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Personal Details Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.ink }]}>
            Personal Details
          </Text>

          <View style={styles.rowTwoCols}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.ink }]}>First Name *</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
              >
                <User size={16} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.ink }]}
                  placeholder="First name"
                  placeholderTextColor={colors.muted}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.ink }]}>Last Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.ink }]}
                  placeholder="Last name"
                  placeholderTextColor={colors.muted}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
          </View>

          <View style={styles.rowTwoCols}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.ink }]}>Mobile Phone</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
              >
                <Phone size={16} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.ink }]}
                  placeholder="9876543210"
                  placeholderTextColor={colors.muted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.ink }]}>Date of Birth</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
              >
                <Calendar size={16} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.ink }]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={colors.muted}
                  value={dob}
                  onChangeText={handleDobChange}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.ink }]}>Gender</Text>
            <View style={[styles.segBar, { backgroundColor: colors.surface2 }]}>
              {(['Male', 'Female', 'Other'] as const).map(g => {
                const isSel = gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.segBtn,
                      isSel && [styles.segBtnOn, { backgroundColor: colors.surface }],
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[
                        styles.segBtnText,
                        { color: isSel ? colors.brandDark : colors.muted },
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Insurance Details Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.ink }]}>
            Insurance Policy Details
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.ink }]}>Health Insurer</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.insurerScroll}>
              {INSURERS.map(ins => {
                const isSel = insurer === ins;
                return (
                  <TouchableOpacity
                    key={ins}
                    style={[
                      styles.insurerChip,
                      {
                        backgroundColor: isSel ? colors.brandSoft : colors.surface2,
                        borderColor: isSel ? colors.brand : colors.line,
                      },
                    ]}
                    onPress={() => setInsurer(ins)}
                  >
                    <Text
                      style={[
                        styles.insurerChipText,
                        { color: isSel ? colors.brandDark : colors.ink },
                      ]}
                    >
                      {ins}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.rowTwoCols}>
            <View style={[styles.inputGroup, { flex: 1.2 }]}>
              <Text style={[styles.label, { color: colors.ink }]}>Policy Number</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.ink }]}
                  placeholder="e.g. P-0007401"
                  placeholderTextColor={colors.muted}
                  value={policyNumber}
                  onChangeText={setPolicyNumber}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 0.9 }]}>
              <Text style={[styles.label, { color: colors.ink }]}>Sum Insured (₹)</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.ink }]}
                  placeholder="500000"
                  placeholderTextColor={colors.muted}
                  value={sumInsured}
                  onChangeText={setSumInsured}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Agreement Checkbox */}
        <TouchableOpacity
          style={styles.agreeRow}
          onPress={() => setAgree(!agree)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: agree ? colors.brand : colors.line,
                backgroundColor: agree ? colors.brand : 'transparent',
              },
            ]}
          >
            {agree ? <Check size={14} color="#ffffff" strokeWidth={3} /> : null}
          </View>
          <Text style={[styles.agreeText, { color: colors.muted }]}>
            I agree to the ClaimsGuru Terms of Service, Privacy Policy, and patient data consent.
          </Text>
        </TouchableOpacity>

        {/* Submit Actions */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.line }]}
            onPress={() => navigation.goBack()}
            disabled={submitting}
          >
            <Text style={[styles.cancelText, { color: colors.muted }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.brand },
              submitting && { opacity: 0.8 },
            ]}
            onPress={handleRegister}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Existing User Link */}
        <View style={styles.signinPromptRow}>
          <Text style={[styles.signinPrompt, { color: colors.muted }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate(Routes.SignIn)}>
            <Text style={[styles.signinLink, { color: colors.brandDark }]}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Toast */}
      {toastMsg ? (
        <View style={[styles.toast, { backgroundColor: colors.brandDark }]}>
          <CheckCircle2 size={18} color="#ffffff" />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}
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
  scrollInner: { padding: 16, paddingBottom: 36 },
  banner: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  bannerText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '500' },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { fontSize: 12.5, fontWeight: '600', lineHeight: 18 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: { marginBottom: 13 },
  label: { fontSize: 11.5, fontWeight: '700', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 10,
    height: 44,
  },
  inputIcon: { marginRight: 8 },
  eyeIconBtn: { position: 'absolute', right: 10, padding: 4 },
  input: {
    flex: 1,
    fontSize: 13.5,
    height: '100%',
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
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segBtnText: { fontSize: 12, fontWeight: '600' },
  insurerScroll: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  insurerChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    marginRight: 8,
  },
  insurerChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeText: {
    fontSize: 11.5,
    flex: 1,
    lineHeight: 16,
  },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  cancelBtn: {
    flex: 0.35,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 13.5, fontWeight: '600' },
  submitBtn: {
    flex: 0.65,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  signinPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinPrompt: { fontSize: 12.5 },
  signinLink: { fontSize: 12.5, fontWeight: '700' },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  toastText: { color: '#ffffff', fontSize: 13, fontWeight: '600', flex: 1 },
});
