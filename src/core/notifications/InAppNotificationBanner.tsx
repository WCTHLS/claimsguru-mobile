import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Vibration,
} from 'react-native';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { InAppBanner } from './usePushNotifications';

interface InAppNotificationBannerProps {
  banner: InAppBanner;
  onDismiss: () => void;
  onPress: () => void;
}

export const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({
  banner,
  onDismiss,
  onPress,
}) => {
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Vibrate phone immediately when in-app banner fires
    try {
      Vibration.vibrate([0, 200, 100, 250]);
    } catch {}

    // Slide down animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [banner]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const isApproved =
    banner.title.toLowerCase().includes('approved') ||
    banner.title.toLowerCase().includes('settled');
  const isDocReq =
    banner.title.toLowerCase().includes('document') ||
    banner.title.toLowerCase().includes('action');
  const isRejected = banner.title.toLowerCase().includes('reject');

  const accentColor = isApproved
    ? '#10b981'
    : isDocReq
    ? '#f59e0b'
    : isRejected
    ? '#ef4444'
    : '#0d9488';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => {
          handleDismiss();
          onPress();
        }}
        style={[
          styles.bannerCard,
          {
            borderColor: accentColor,
          },
        ]}
      >
        {/* Accent indicator bar */}
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        <View style={styles.contentWrapper}>
          {/* Top header row */}
          <View style={styles.headerRow}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${accentColor}25` },
                ]}
              >
                {isApproved ? (
                  <CheckCircle2 size={16} color={accentColor} />
                ) : isDocReq ? (
                  <FileText size={16} color={accentColor} />
                ) : isRejected ? (
                  <AlertTriangle size={16} color={accentColor} />
                ) : (
                  <Bell size={16} color={accentColor} />
                )}
              </View>
              <Text style={styles.appName}>ClaimsGuru</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.timeText}>Just now</Text>
            </View>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                handleDismiss();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}
            >
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Title & Body */}
          <Text style={styles.titleText} numberOfLines={1}>
            {banner.title}
          </Text>
          <Text style={styles.bodyText} numberOfLines={3}>
            {banner.body}
          </Text>

          {/* Footer Call to action */}
          <View style={styles.footerRow}>
            <Text style={[styles.actionText, { color: accentColor }]}>
              Tap to view claim details
            </Text>
            <ChevronRight size={14} color={accentColor} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 99999,
    paddingTop: Platform.OS === 'android' ? 42 : 54,
    paddingHorizontal: 14,
  },
  bannerCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 20,
    flexDirection: 'row',
  },
  accentBar: {
    width: 5,
  },
  contentWrapper: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: 0.2,
  },
  dot: {
    fontSize: 10,
    color: '#64748b',
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  closeBtn: {
    padding: 2,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 3,
  },
  bodyText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
    marginTop: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
