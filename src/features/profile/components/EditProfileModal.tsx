import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  X,
  User,
  Phone,
  Calendar,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useAuthStore } from '../../../state/useAuthStore';
import { updateUserProfile } from '../../../core/api/authApi';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const formatDobForInput = (raw?: string | null): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  // If YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
  }
  // If DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[1]}/${dmyMatch[2]}/${dmyMatch[3]}`;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return trimmed;
};

const formatDobForStorage = (dmy: string): string => {
  const parts = dmy.split('/');
  if (parts.length === 3 && parts[2]?.length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dmy;
};

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors, isDark } = useTheme();
  const {
    userName,
    userEmail,
    firstName: storedFirstName,
    lastName: storedLastName,
    phone: storedPhone,
    dob: storedDob,
    gender: storedGender,
  } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // Sync state whenever modal is opened
  useEffect(() => {
    if (visible) {
      setErrorMessage(null);
      setSuccessToast(false);
      setIsSaving(false);

      const resolvedName = userName || `${storedFirstName || ''} ${storedLastName || ''}`.trim();
      setName(resolvedName || '');
      setPhone(storedPhone ? storedPhone.replace(/\D/g, '').slice(0, 10) : '');
      setDob(formatDobForInput(storedDob));
      setGender((storedGender as 'Male' | 'Female' | 'Other') || 'Male');
    }
  }, [visible, userName, storedFirstName, storedLastName, storedPhone, storedDob, storedGender]);

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

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  const handleSave = async () => {
    setErrorMessage(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage('Full name is required.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone) {
      setErrorMessage('Mobile phone number is required.');
      return;
    }

    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    let resolvedDob = dob.trim();
    if (resolvedDob && resolvedDob.length > 0 && resolvedDob.length < 10) {
      setErrorMessage('Please enter a complete date of birth (DD/MM/YYYY).');
      return;
    }

    const storageDob = resolvedDob ? formatDobForStorage(resolvedDob) : null;

    setIsSaving(true);
    try {
      const parts = cleanName.split(/\s+/);
      const first = parts[0] || '';
      const last = parts.slice(1).join(' ') || '';

      await updateUserProfile({
        name: cleanName,
        firstName: first,
        lastName: last,
        phone: cleanPhone,
        dob: storageDob,
        gender,
      });

      setSuccessToast(true);
      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setSuccessToast(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheetContainer, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.line }]}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.ink }]}>Edit Profile</Text>
              <Text style={[styles.headerSub, { color: colors.muted }]}>
                Update your personal information
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surface2 }]}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Close"
            >
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Error Message */}
            {errorMessage && (
              <View
                style={[
                  styles.alertBox,
                  { backgroundColor: colors.redSoft, borderColor: colors.red },
                ]}
              >
                <AlertCircle size={16} color={colors.red} style={{ marginRight: 8 }} />
                <Text style={[styles.alertText, { color: colors.red }]}>{errorMessage}</Text>
              </View>
            )}

            {/* Success Toast */}
            {successToast && (
              <View
                style={[
                  styles.alertBox,
                  { backgroundColor: colors.greenSoft, borderColor: colors.green },
                ]}
              >
                <CheckCircle2 size={16} color={colors.green} style={{ marginRight: 8 }} />
                <Text style={[styles.alertText, { color: colors.green }]}>
                  Profile updated successfully!
                </Text>
              </View>
            )}

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.ink }]}>
                Full Name <Text style={{ color: colors.red }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
              >
                <User size={18} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.ink }]}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={colors.muted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Mobile Phone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.ink }]}>
                Mobile Phone <Text style={{ color: colors.red }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
              >
                <Phone size={18} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.ink }]}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={colors.muted}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.ink }]}>Date of Birth</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
              >
                <Calendar size={18} color={colors.muted} style={styles.inputIcon} />
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

            {/* Gender Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.ink }]}>Gender</Text>
              <View style={[styles.segBar, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                {(['Male', 'Female', 'Other'] as const).map(g => {
                  const isSelected = gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.segBtn,
                        isSelected && [
                          styles.segBtnActive,
                          {
                            backgroundColor: colors.surface,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 2,
                          },
                        ],
                      ]}
                      onPress={() => setGender(g)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.segBtnText,
                          {
                            color: isSelected ? colors.brandDark : colors.muted,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Email Address - READ ONLY / LOCKED */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.muted }]}>Email Address</Text>
                <View style={[styles.lockedBadge, { backgroundColor: isDark ? '#232b35' : '#f1f5f9' }]}>
                  <Lock size={11} color={colors.muted} style={{ marginRight: 3 }} />
                  <Text style={[styles.lockedBadgeText, { color: colors.muted }]}>Cannot be changed</Text>
                </View>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  styles.inputDisabled,
                  {
                    backgroundColor: isDark ? '#141a22' : '#f1f5f9',
                    borderColor: colors.line,
                  },
                ]}
              >
                <Mail size={18} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.muted }]}
                  value={userEmail || '—'}
                  editable={false}
                  selectTextOnFocus={false}
                />
                <Lock size={15} color={colors.muted} style={{ marginRight: 12 }} />
              </View>
              <Text style={[styles.helperNote, { color: colors.muted }]}>
                Your registered email is your unique login credential and cannot be edited.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.footer, { borderTopColor: colors.line, backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.line }]}
              onPress={onClose}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: colors.ink }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.brand },
                isSaving && { opacity: 0.7 },
              ]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: 460,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    flexGrow: 1,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 46,
  },
  inputDisabled: {
    opacity: 0.85,
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
    paddingRight: 12,
  },
  helperNote: {
    fontSize: 11,
    marginTop: 5,
    fontStyle: 'italic',
  },
  segBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  segBtnActive: {},
  segBtnText: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
