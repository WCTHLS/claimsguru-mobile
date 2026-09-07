import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useAuthStore } from '../../../state/useAuthStore';
import { UserRole } from '../../../core/rbac/permissions';

export const ProfileSettingsScreen = ({ navigation }: any) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { role, setRole, userName, userEmail } = useAuthStore();
  const [biometric, setBiometric] = React.useState(true);

  const roles: UserRole[] = ['viewer', 'submitter', 'reviewer', 'admin'];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Profile Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, alignItems: 'center' }]}>
        <View style={[styles.avatar, { backgroundColor: colors.brandSoft }]}>
          <Text style={[styles.avatarText, { color: colors.brandDark }]}>SA</Text>
        </View>
        <Text style={[styles.userName, { color: colors.ink }]}>{userName}</Text>
        <Text style={[styles.userEmail, { color: colors.muted }]}>{userEmail}</Text>

        {/* Role Switcher */}
        <Text style={[styles.sectionLabel, { color: colors.muted, marginTop: 14 }]}>Switch Active Role (RBAC)</Text>
        <View style={[styles.roleSeg, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
          {roles.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, role === r && { backgroundColor: colors.brand }]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.roleBtnText, { color: role === r ? '#fff' : colors.muted }]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Settings Options */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, gap: 14 }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.settingLabel, { color: colors.ink }]}>Dark Theme</Text>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: colors.brand }} />
        </View>

        <View style={styles.rowBetween}>
          <Text style={[styles.settingLabel, { color: colors.ink }]}>Biometric Unlock</Text>
          <Switch value={biometric} onValueChange={setBiometric} trackColor={{ true: colors.brand }} />
        </View>

        <View style={styles.rowBetween}>
          <Text style={[styles.settingLabel, { color: colors.ink }]}>Scrub PHI before LLM</Text>
          <View style={[styles.pill, { backgroundColor: colors.greenSoft }]}>
            <Text style={[styles.pillText, { color: colors.green }]}>Always on</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { fontSize: 20, fontWeight: '700' },
  userName: { fontSize: 16, fontWeight: '700' },
  userEmail: { fontSize: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  roleSeg: { flexDirection: 'row', borderRadius: 10, padding: 3, borderWidth: 1, marginTop: 6, width: '100%' },
  roleBtn: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 8 },
  roleBtnText: { fontSize: 11, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { fontSize: 13.5, fontWeight: '600' },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  pillText: { fontSize: 10.5, fontWeight: '700' },
});
