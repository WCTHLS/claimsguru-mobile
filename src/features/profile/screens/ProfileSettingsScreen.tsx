import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Shield,
  Bell,
  MessageSquare,
  FileText,
  Search,
  Clock,
  Moon,
  LogOut,
  Terminal,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useAuthStore } from '../../../state/useAuthStore';
import { Routes } from '../../../app/navigation/routes';
import { GlobalBottomTabBar } from '../../../app/navigation/GlobalBottomTabBar';

export const ProfileSettingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { role, userName, userEmail, policyNumber, organization } = useAuthStore();

  const [biometric, setBiometric] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Processing (admin) settings state
  const [secondaryOcr, setSecondaryOcr] = useState(true);
  const [easyOcr, setEasyOcr] = useState(false);
  const [paddleOcr, setPaddleOcr] = useState(true);
  const pdfRenderDpi = 200;

  // Active single role (default submitter)
  const currentRole = role || 'submitter';

  // Calculate initials from user name
  const getInitials = (name?: string) => {
    if (
      !name ||
      !name.trim() ||
      name.toLowerCase() === 'sample' ||
      name.toLowerCase() === 'unknown' ||
      name.toLowerCase().includes('sample@')
    ) {
      return 'JD';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  const initials = getInitials(userName);

  const handleSignOut = () => {
    useAuthStore.getState().signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: Routes.SignIn }],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronLeft size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.ink }]}>Profile & settings</Text>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {/* Avatar Circle */}
          <View style={[styles.avatar, { backgroundColor: isDark ? '#12302e' : '#e6f4f1' }]}>
            <Text style={[styles.avatarText, { color: isDark ? '#2dd4bf' : '#0d9488' }]}>{initials}</Text>
          </View>

          {/* User Name & Department */}
          <Text style={[styles.userName, { color: colors.ink }]}>{userName}</Text>
          <Text style={[styles.userDepartment, { color: colors.muted }]}>
            {userEmail}{policyNumber ? ` · Policy ${policyNumber}` : ''}
          </Text>

          {/* Role Badge - Single Role */}
          <View style={styles.rolesRow}>
            <View
              style={[
                styles.rolePill,
                { backgroundColor: isDark ? '#123028' : '#e6f7f0' },
              ]}
            >
              <Text
                style={[
                  styles.rolePillText,
                  { color: isDark ? '#34d399' : '#047857', fontWeight: '700' },
                ]}
              >
                {currentRole}
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Privacy */}
        <Text style={[styles.sectionHeading, { color: colors.ink }]}>Privacy</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {/* Item 1: Scrub PHI before LLM */}
          <View style={[styles.settingRow, { borderBottomColor: colors.line, borderBottomWidth: 1 }]}>
            <View style={styles.iconContainer}>
              <Lock size={18} color={colors.ink} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.ink }]}>Scrub PHI before LLM</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                SSN · phone · email · MRN · DOB · policy ·{'\n'}enforced server-side
              </Text>
            </View>
            <View style={[styles.badgeAlwaysOn, { backgroundColor: isDark ? '#123028' : '#e6f7f0' }]}>
              <Text style={[styles.badgeAlwaysOnText, { color: isDark ? '#34d399' : '#047857' }]}>Always on</Text>
            </View>
          </View>

          {/* Item 2: Biometric Unlock */}
          <View style={[styles.settingRow, { borderBottomColor: colors.line, borderBottomWidth: 1 }]}>
            <View style={styles.iconContainer}>
              <Shield size={18} color={colors.ink} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.ink }]}>Biometric unlock</Text>
            </View>
            <Switch
              value={biometric}
              onValueChange={setBiometric}
              trackColor={{ true: '#0d9488', false: '#cbd5e1' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Item 3: Push Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.iconContainer}>
              <Bell size={18} color={colors.ink} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.ink }]}>Push notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ true: '#0d9488', false: '#cbd5e1' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Section: Appearance (Dark mode toggle) */}
        <Text style={[styles.sectionHeading, { color: colors.ink }]}>Appearance</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.settingRow}>
            <View style={styles.iconContainer}>
              <Moon size={18} color={colors.ink} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.ink }]}>Dark mode</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ true: '#0d9488', false: '#cbd5e1' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Section: Processing (admin) */}
        <View style={styles.sectionHeadingRow}>
          <Text style={[styles.sectionHeading, { color: colors.ink }]}>
            Processing <Text style={{ color: colors.muted, fontWeight: '500' }}>(admin)</Text>
          </Text>
        </View>

        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {/* Item 1: Secondary OCR on PDF */}
          <View style={[styles.settingRow, { borderBottomColor: colors.line, borderBottomWidth: 1 }]}>
            <View style={styles.settingInfoNoIcon}>
              <Text style={[styles.settingTitle, { color: colors.ink }]}>Secondary OCR on PDF</Text>
              <Text style={[styles.codeSubtitle, { color: colors.muted }]}>
                OCR_ENABLE_SECONDARY_OCR_ON_PDF
              </Text>
            </View>
            <Switch
              value={secondaryOcr}
              onValueChange={setSecondaryOcr}
              trackColor={{ true: '#94a3b8', false: '#e2e8f0' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Item 2: EasyOCR engine */}
          <View style={[styles.settingRow, { borderBottomColor: colors.line, borderBottomWidth: 1 }]}>
            <View style={styles.settingInfoNoIcon}>
              <Text style={[styles.settingTitle, { color: colors.ink }]}>EasyOCR engine</Text>
              <Text style={[styles.codeSubtitle, { color: colors.muted }]}>
                OCR_EASYOCR_ENABLED
              </Text>
            </View>
            <Switch
              value={easyOcr}
              onValueChange={setEasyOcr}
              trackColor={{ true: '#94a3b8', false: '#e2e8f0' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Item 3: Paddle OCR */}
          <View style={[styles.settingRow, { borderBottomColor: colors.line, borderBottomWidth: 1 }]}>
            <View style={styles.settingInfoNoIcon}>
              <Text style={[styles.settingTitle, { color: colors.ink }]}>Paddle OCR</Text>
              <Text style={[styles.codeSubtitle, { color: colors.muted }]}>
                OCR_ENABLE_PADDLE_OCR
              </Text>
            </View>
            <Switch
              value={paddleOcr}
              onValueChange={setPaddleOcr}
              trackColor={{ true: '#94a3b8', false: '#e2e8f0' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Item 4: PDF render DPI */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfoNoIcon}>
              <Text style={[styles.settingTitle, { color: colors.ink }]}>PDF render DPI</Text>
              <Text style={[styles.codeSubtitle, { color: colors.muted }]}>
                OCR_PDF_RENDER_DPI
              </Text>
            </View>
            <View style={[styles.dpiBadge, { backgroundColor: isDark ? '#1e262f' : '#f1f5f9' }]}>
              <Text style={[styles.dpiBadgeText, { color: colors.ink }]}>{pdfRenderDpi}</Text>
            </View>
          </View>
        </View>

        {/* Links Card: Ops console (admin) & Conversation history */}
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.line, marginTop: 12 }]}>
          <TouchableOpacity
            style={[styles.linkRow, { borderBottomColor: colors.line, borderBottomWidth: 1 }]}
            onPress={() => navigation.navigate(Routes.OpsConsole)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Terminal size={18} color={colors.ink} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.ink }]}>Ops console</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                service health · queues · models
              </Text>
            </View>
            <View style={[styles.roleBadgeSmall, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.roleBadgeSmallText, { color: colors.muted }]}>admin</Text>
            </View>
            <ChevronRight size={16} color={colors.muted} style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('MainTabs', { screen: Routes.SessionsTab })}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Clock size={18} color={colors.ink} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.ink }]}>Conversation history</Text>
              <Text style={[styles.codeSubtitle, { color: colors.muted }]}>
                /chat/{'{session_id}'}/history
              </Text>
            </View>
            <ChevronRight size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Prototype Disclaimer */}
        <Text style={[styles.prototypeNote, { color: colors.muted }]}>
          ClaimsGuru prototype · sample data only
        </Text>

        {/* Sign out button matching prototype button.btn.out */}
        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: colors.line, backgroundColor: colors.surface }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <LogOut size={16} color={colors.red} style={{ marginRight: 8 }} />
          <Text style={[styles.signOutText, { color: colors.red }]}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Global Bottom Tab Bar matching app standard */}
      <GlobalBottomTabBar navigation={navigation} activeTab="all" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 16,
    paddingBottom: 24,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  userDepartment: {
    fontSize: 13,
    marginBottom: 14,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  rolePillText: {
    fontSize: 11.5,
  },
  sectionHeadingRow: {
    marginTop: 18,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
  },
  settingsCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  iconContainer: {
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 8,
  },
  settingInfoNoIcon: {
    flex: 1,
    paddingRight: 8,
  },
  settingTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  codeSubtitle: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  badgeAlwaysOn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeAlwaysOnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  dpiBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dpiBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  roleBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeSmallText: {
    fontSize: 10,
    fontWeight: '700',
  },
  prototypeNote: {
    textAlign: 'center',
    fontSize: 11.5,
    marginTop: 16,
    marginBottom: 12,
  },
  signOutBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  signOutText: {
    fontSize: 13.5,
    fontWeight: '650' as any,
  },
});
