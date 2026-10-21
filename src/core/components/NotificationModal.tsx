import React, { useEffect } from 'react';
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
  ChevronLeft,
  Trash2,
  ShieldCheck,
  Clock,
  ArrowRight,
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

/**
 * Extracts a clean primary title and claim tag from potentially concatenated backend strings.
 * e.g. "Document Requested · Claim #3ee54638" -> title: "Document Requested", tag: "3EE54638"
 */
function parseNotificationTitle(rawTitle: string, claimId?: string): { title: string; tag: string | null } {
  let title = (rawTitle || 'ClaimsGuru Update').trim();
  let tag = claimId ? claimId.slice(0, 8).toUpperCase() : null;

  if (title.includes(' · Claim #')) {
    const parts = title.split(' · Claim #');
    title = parts[0].trim();
    if (!tag && parts[1]) {
      tag = parts[1].replace(/\.+$/, '').trim().toUpperCase();
    }
  } else if (title.includes(' · #')) {
    const parts = title.split(' · #');
    title = parts[0].trim();
    if (!tag && parts[1]) {
      tag = parts[1].replace(/\.+$/, '').trim().toUpperCase();
    }
  }

  return { title, tag };
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
    loadNotifications,
  } = useNotificationStore();

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const handleNotificationPress = (item: AppNotification) => {
    markAsRead(item.id);
    if (item.claimId) {
      try {
        const { useClaimsStore } = require('../../state/useClaimsStore');
        const claimExists = useClaimsStore.getState().claims.some(
          (c: any) =>
            c.id === item.claimId ||
            (c.id && item.claimId && (c.id.startsWith(item.claimId.slice(0, 8)) || item.claimId.startsWith(c.id.slice(0, 8))))
        );
        if (claimExists) {
          onClose();
          setTimeout(() => {
            navigation.navigate(Routes.ClaimDetail, { claimId: item.claimId });
          }, 200);
        }
      } catch {
        onClose();
        setTimeout(() => {
          navigation.navigate(Routes.ClaimDetail, { claimId: item.claimId });
        }, 200);
      }
    }
  };

  const renderIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'approved':
        return <CheckCircle2 size={19} color="#10b981" strokeWidth={2.3} />;
      case 'settled':
        return <ShieldCheck size={19} color="#10b981" strokeWidth={2.3} />;
      case 'docs_requested':
        return <AlertTriangle size={19} color="#f59e0b" strokeWidth={2.3} />;
      case 'rejected':
        return <AlertCircle size={19} color="#ef4444" strokeWidth={2.3} />;
      case 'validation':
        return <FileText size={19} color="#0d9488" strokeWidth={2.3} />;
      default:
        return <Bell size={19} color="#0d9488" strokeWidth={2.3} />;
    }
  };

  const getTypeTheme = (type: AppNotification['type']) => {
    switch (type) {
      case 'approved':
      case 'settled':
        return {
          bg: isDark ? '#064e3b' : '#ecfdf5',
          border: isDark ? '#047857' : '#a7f3d0',
          text: '#059669',
          tag: 'APPROVED',
        };
      case 'docs_requested':
        return {
          bg: isDark ? '#451a03' : '#fffbeb',
          border: isDark ? '#b45309' : '#fde68a',
          text: '#d97706',
          tag: 'ACTION NEEDED',
        };
      case 'rejected':
        return {
          bg: isDark ? '#450a0a' : '#fef2f2',
          border: isDark ? '#b91c1c' : '#fecaca',
          text: '#dc2626',
          tag: 'REJECTED',
        };
      case 'validation':
        return {
          bg: isDark ? '#134e4a' : '#f0fdfa',
          border: isDark ? '#0f766e' : '#99f6e4',
          text: '#0d9488',
          tag: 'AI AUDIT',
        };
      default:
        return {
          bg: isDark ? '#1e293b' : '#f1f5f9',
          border: isDark ? '#334155' : '#e2e8f0',
          text: colors.muted,
          tag: null,
        };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.line,
              paddingTop: 8,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
          onPress={(e) => e.stopPropagation?.()}
        >
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

          {/* Top Sheet Drag Pill */}
          <View style={styles.dragHandleWrap}>
            <View style={[styles.dragHandle, { backgroundColor: colors.line2 }]} />
          </View>

          {/* Sheet Header with Back "<" Button and Clean Title */}
          <View style={[styles.header, { borderBottomColor: colors.line }]}>
            <View style={styles.headerLeft}>
              {/* 👈 Clean Back "<" Button */}
              <TouchableOpacity
                style={[styles.backBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityLabel="Go back"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeft size={20} color={colors.ink} strokeWidth={2.4} />
              </TouchableOpacity>

              {/* Header Title with Unread Count Badge */}
              <View style={styles.headerTextWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.title, { color: colors.ink }]}>Notifications</Text>
                  {unreadCount > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: colors.brandSoft, borderColor: colors.brand + '30' }]}>
                      <Text style={[styles.unreadBadgeText, { color: colors.brandDark }]}>
                        {unreadCount} new
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
                  Live alerts &amp; claim status updates
                </Text>
              </View>
            </View>

            {/* Header Right Actions: Read all & Close */}
            <View style={styles.headerRight}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.brandSoft, borderColor: colors.brand + '30' }]}
                  onPress={markAllAsRead}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <CheckCheck size={14} color={colors.brandDark} />
                  <Text style={[styles.actionBtnText, { color: colors.brandDark }]}>Read all</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityLabel="Close notifications"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <XIcon size={16} color={colors.ink} strokeWidth={2.2} />
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
                  <Bell size={34} color={colors.muted} strokeWidth={1.7} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.ink }]}>No new notifications</Text>
                <Text style={[styles.emptySub, { color: colors.muted }]}>
                  No claims are currently being processed. Live updates, validations, and reviewer decisions will appear here as claims progress.
                </Text>
              </View>
            ) : (
              notifications.map((item) => {
                const typeTheme = getTypeTheme(item.type);
                const { title: cleanTitle, tag: shortClaimTag } = parseNotificationTitle(item.title, item.claimId);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.card,
                      {
                        backgroundColor: !item.read ? (isDark ? '#142c28' : '#f0fdfa') : colors.surface,
                        borderColor: !item.read ? colors.brand : colors.line,
                      },
                    ]}
                    onPress={() => handleNotificationPress(item)}
                    activeOpacity={0.8}
                  >
                    {/* Top Row: Type Icon + Title + Status Tag + Unread Indicator */}
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.typeIconBox, { backgroundColor: typeTheme.bg, borderColor: typeTheme.border }]}>
                        {renderIcon(item.type)}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.cardTitleRow}>
                          <Text style={[styles.cardTitle, { color: colors.ink }]} numberOfLines={1}>
                            {cleanTitle}
                          </Text>
                          {typeTheme.tag && (
                            <View style={[styles.statusTag, { backgroundColor: typeTheme.bg, borderColor: typeTheme.border }]}>
                              <Text style={[styles.statusTagText, { color: typeTheme.text }]}>
                                {typeTheme.tag}
                              </Text>
                            </View>
                          )}
                          {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.brand }]} />}
                        </View>

                        <View style={styles.metaRow}>
                          <Clock size={11} color={colors.muted} style={{ marginRight: 3 }} />
                          <Text style={[styles.cardTime, { color: colors.muted }]}>
                            {formatRelativeTime(item.createdAt)}
                          </Text>
                          {shortClaimTag && (
                            <>
                              <Text style={[styles.metaDot, { color: colors.muted }]}>•</Text>
                              <Text style={[styles.metaClaim, { color: colors.muted }]}>
                                Claim #{shortClaimTag}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Notification Message */}
                    <Text style={[styles.cardMessage, { color: colors.ink }]} numberOfLines={3}>
                      {item.message}
                    </Text>

                    {/* Bottom Action Strip: Tap to View Claim */}
                    {item.claimId && (
                      <View style={[styles.cardFooter, { borderTopColor: colors.line2 }]}>
                        <Text style={[styles.cardActionText, { color: colors.brandDark }]}>
                          Tap to view claim
                        </Text>
                        <View style={[styles.claimPill, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
                          <Text style={[styles.claimPillText, { color: colors.ink }]}>
                            #{shortClaimTag || item.claimId.slice(0, 8).toUpperCase()}
                          </Text>
                          <ChevronRight size={13} color={colors.muted} strokeWidth={2.2} />
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
                style={[styles.clearBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                onPress={clearAll}
                activeOpacity={0.7}
              >
                <Trash2 size={13} color={colors.muted} />
                <Text style={[styles.clearBtnText, { color: colors.muted }]}>Clear notification history</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
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
    height: '82%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    overflow: 'hidden',
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  unreadBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 7,
    borderWidth: 1,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    gap: 11,
    paddingBottom: 16,
  },
  card: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  typeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '750' as any,
    flexShrink: 1,
    letterSpacing: -0.1,
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardTime: {
    fontSize: 11,
  },
  metaDot: {
    fontSize: 11,
    marginHorizontal: 5,
  },
  metaClaim: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardMessage: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  cardActionText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  claimPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  claimPillText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 28,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
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
    paddingBottom: 4,
    alignItems: 'center',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
});
