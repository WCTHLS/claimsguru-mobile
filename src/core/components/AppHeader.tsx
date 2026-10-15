import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../../state/useAuthStore';
import { useNotificationStore } from '../../state/useNotificationStore';
import { UserAvatar } from './UserAvatar';
import { NotificationModal } from './NotificationModal';
import { Routes } from '../../app/navigation/routes';

interface AppHeaderProps {
  navigation: any;
  rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ navigation, rightAction }) => {
  const { colors, isDark } = useTheme();
  const { userName, gender } = useAuthStore();
  const { unreadCount, loadNotifications } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <>
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

          {/* Small Bell Notification Icon near Avatar */}
          <TouchableOpacity
            style={[
              styles.bellBtn,
              {
                backgroundColor: colors.surface2,
                borderColor: colors.line,
              },
            ]}
            onPress={() => setShowNotifications(true)}
            accessibilityLabel="Notifications"
            activeOpacity={0.7}
          >
            <Bell size={17} color={colors.ink} strokeWidth={2} />
            {unreadCount > 0 && (
              <View
                style={[
                  unreadCount > 1 ? styles.badgePill : styles.badgeDot,
                  { backgroundColor: colors.red, borderColor: colors.surface },
                ]}
              >
                {unreadCount > 1 && (
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>

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

      {/* Slide-up Notification History Modal */}
      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        navigation={navigation}
      />
    </>
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
    gap: 10,
  },
  bellBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    position: 'absolute',
    top: 5,
    right: 5,
  },
  badgePill: {
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    paddingHorizontal: 3,
    borderWidth: 1.5,
    position: 'absolute',
    top: 2,
    right: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
    lineHeight: 10,
  },
  avatarBtn: {},
});
