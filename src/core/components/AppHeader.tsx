import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../../state/useAuthStore';
import { UserAvatar } from './UserAvatar';
import { Routes } from '../../app/navigation/routes';

interface AppHeaderProps {
  navigation: any;
  rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ navigation, rightAction }) => {
  const { colors, isDark } = useTheme();
  const { userName, gender } = useAuthStore();

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
      <View style={styles.headerLeft}>
        <Image
          source={
            isDark
              ? require('../../../assets/ClaimsGuruWhite_txt.png')
              : require('../../../assets/ClaimsGuruBlack_txt.png')
          }
          style={styles.headerLogo}
          resizeMode="contain"
          accessibilityLabel="ClaimsGuru"
        />
      </View>

      <View style={styles.headerRight}>
        {rightAction}
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => navigation.navigate(Routes.PatientProfile)}
          accessibilityLabel="Patient profile"
          activeOpacity={0.7}
        >
          <UserAvatar size={34} name={userName} gender={gender} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 124,
    height: 28,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarBtn: {},
});
