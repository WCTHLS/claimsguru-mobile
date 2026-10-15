import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  X as XIcon,
  ChevronRight,
  Trash2,
  ShieldCheck,
  Clock,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNotificationStore, AppNotification } from '../../state/useNotificationStore';
import { Routes } from '../../app/navigation/routes';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Recent';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    if (diffMs < 0) return 'Just now';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  } catch {
    return 'Recent';
  }
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotificationStore();

  const handleNotificationPress = (item: AppNotification) => {
    markAsRead(item.id);
    if (item.claimId) {
      onClose();
      setTimeout(() => {
        navigation.navigate(Routes.ClaimDetail, { claimId: item.claimId });
      }, 200);
    }
  };

  const renderIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'approved':
        return <CheckCircle2 size={18} color="#10b981" strokeWidth={2.2} />;
      case 'settled':
        return <ShieldCheck size={18} color="#10b981" strokeWidth={2.2} />;
      case 'docs_requested':
        return <AlertTriangle size={18} color="#f59e0b" strokeWidth={2.2} />;
      case 'rejected':
        return <AlertCircle size={18} color="#ef4444" strokeWidth={2.2} />;
      case 'validation':
        return <FileText size={18} color="#0d9488" strokeWidth={2.2} />;
      default:
        return <Bell size={18} color="#0d9488" strokeWidth={2.2} />;
    }
  };

  const getIconBg = (type: AppNotification['type']) => {
    switch (type) {
      case 'approved':
      case 'settled':
        return isDark ? '#064e3b' : '#ecfdf5';
      case 'docs_requested':
        return isDark ? '#451a03' : '#fffbeb';
      case 'rejected':
        return isDark ? '#450a0a' : '#fef2f2';
      case 'validation':
      default:
        return isDark ? '#134e4a' : '#f0fdfa';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.line,
              paddingTop: Math.max(insets.top, 14),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

          {/* Sheet Header */}
          <View style={[styles.header, { borderBottomColor: colors.line }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.bellCircle, { backgroundColor: colors.brandSoft }]}>
                <Bell size={18} color={colors.brandDark} strokeWidth={2.4} />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.title, { color: colors.ink }]}>Notifications</Text>
                  {unreadCount > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: colors.brandSoft }]}>
                      <Text style={[styles.unreadBadgeText, { color: colors.brandDark }]}>
                        {unreadCount} new
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  Live push alerts & claim status updates
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.surface2 }]}
                  onPress={markAllAsRead}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <CheckCheck size={16} color={colors.brandDark} />
                  <Text style={[styles.actionBtnText, { color: colors.brandDark }]}>Read all</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.surface2 }]}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <XIcon size={18} color={colors.ink} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications Scroll List */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface2 }]}>
                  <Bell size={36} color={colors.muted} strokeWidth={1.5} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.ink }]}>No notifications yet</Text>
                <Text style={[styles.emptySub, { color: colors.muted }]}>
                  You're all caught up! Push updates for reviewer decisions, documents requested, and approvals will appear here.
                </Text>
              </View>
            ) : (
              notifications.map((item) => {
                const iconBg = getIconBg(item.type);
                const shortClaimId = item.claimId ? item.claimId.slice(0, 8).toUpperCase() : null;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.card,
                      {
                        backgroundColor: !item.read ? (isDark ? '#1a2e2b' : '#f0fdfa') : colors.surface,
                        borderColor: !item.read ? colors.brand : colors.line,
                      },
                    ]}
                    onPress={() => handleNotificationPress(item)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.typeIconBox, { backgroundColor: iconBg }]}>
                        {renderIcon(item.type)}
                      </View>

                      <View style={{ flex: 1, marginRight: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={[styles.cardTitle, { color: colors.ink }]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.brand }]} />}
                        </View>

                        <Text style={[styles.cardTime, { color: colors.muted }]}>
                          <Clock size={11} color={colors.muted} style={{ marginRight: 3 }} />
                          {formatRelativeTime(item.createdAt)}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.cardMessage, { color: colors.ink }]} numberOfLines={3}>
                      {item.message}
                    </Text>

                    {item.claimId && (
                      <View style={styles.cardFooter}>
                        <View style={[styles.claimPill, { backgroundColor: colors.surface2 }]}>
                          <Text style={[styles.claimPillText, { color: colors.brandDark }]}>
                            #{shortClaimId}
                          </Text>
                          <ChevronRight size={12} color={colors.brandDark} />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Footer with Clear All */}
          {notifications.length > 0 && (
            <View style={[styles.footer, { borderTopColor: colors.line }]}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={clearAll}
                activeOpacity={0.7}
              >
                <Trash2 size={15} color={colors.muted} />
                <Text style={[styles.clearBtnText, { color: colors.muted }]}>Clear notification history</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '84%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  unreadBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unreadBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    gap: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 6,
  },
  cardTime: {
    fontSize: 10.5,
    marginTop: 2,
  },
  cardMessage: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 6,
  },
  claimPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  claimPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 28,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 10,
    alignItems: 'center',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
