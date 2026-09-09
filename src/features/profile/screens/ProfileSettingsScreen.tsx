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
  Lock,
  Shield,
  Bell,
  MessageSquare,
  FileText,
  Search,
  Clock,
  Moon,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useAuthStore } from '../../../state/useAuthStore';
import { Routes } from '../../../app/navigation/routes';
import { UserAvatar } from '../../../core/components/UserAvatar';

export const ProfileSettingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { role, userName, userEmail, policyNumber, organization, gender, setUserDetails } = useAuthStore();

  const [biometric, setBiometric] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Processing (admin) settings state
  const [secondaryOcr, setSecondaryOcr] = useState(true);
  const [easyOcr, setEasyOcr] = useState(false);
  const [paddleOcr, setPaddleOcr] = useState(true);
  const pdfRenderDpi = 200;

  // Active single role (default submitter)
  const currentRole = role || 'submitter';

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
          {/* Illustrated SVG Avatar (Automatically matches registered gender) */}
          <UserAvatar
            size={68}
            name={userName}
            gender={gender}
            style={{ marginBottom: 12 }}
          />

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
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View
        style={[
          styles.bottomTabBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.line,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('MainTabs', { screen: Routes.ChatTab })}
        >
          <MessageSquare size={20} color={colors.muted} />
          <Text style={[styles.tabLabel, { color: colors.muted }]}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('MainTabs', { screen: Routes.ClaimsTab })}
        >
          <FileText size={20} color={colors.muted} />
          <Text style={[styles.tabLabel, { color: colors.muted }]}>Claims</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('MainTabs', { screen: Routes.SearchTab })}
        >
          <Search size={20} color={colors.muted} />
          <Text style={[styles.tabLabel, { color: colors.muted }]}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('MainTabs', { screen: Routes.SessionsTab })}
        >
          <Clock size={20} color={colors.muted} />
          <Text style={[styles.tabLabel, { color: colors.muted }]}>History</Text>
        </TouchableOpacity>
      </View>
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
  avatarSwitcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 20,
    marginBottom: 12,
    gap: 4,
  },
  avatarSwitchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  avatarSwitchText: {
    fontSize: 12,
    fontWeight: '600',
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
  bottomTabBar: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 3,
  },
});
