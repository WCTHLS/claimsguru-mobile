import { create } from 'zustand';
import { appStorage } from '../core/storage/appStorage';
import { API_BASE_URL } from '../core/api/config';
import { useAuthStore } from './useAuthStore';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  claimId?: string;
  type: 'approved' | 'settled' | 'docs_requested' | 'rejected' | 'validation' | 'info';
  read: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;

  loadNotifications: () => Promise<void>;
  addNotification: (notif: {
    id?: string;
    title: string;
    message: string;
    claimId?: string;
    type?: AppNotification['type'];
    createdAt?: string;
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  deleteNotificationsForClaim: (claimId: string) => void;
  pruneOrphanedClaimNotifications: (activeClaimIds: string[]) => void;
}

const STORAGE_KEY = 'cg_notifications_store';

function detectType(title?: string, message?: string, explicitType?: string): AppNotification['type'] {
  if (explicitType && ['approved', 'settled', 'docs_requested', 'rejected', 'validation', 'info'].includes(explicitType)) {
    return explicitType as AppNotification['type'];
  }
  const text = `${title || ''} ${message || ''}`.toLowerCase();
  if (text.includes('approved')) return 'approved';
  if (text.includes('settled') || text.includes('disbursed')) return 'settled';
  if (text.includes('document') || text.includes('action') || text.includes('upload')) return 'docs_requested';
  if (text.includes('reject') || text.includes('denied') || text.includes('failed')) return 'rejected';
  if (text.includes('validation') || text.includes('rule')) return 'validation';
  return 'info';
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  loadNotifications: async () => {
    set({ loading: true });
    try {
      // 1. Load cached notifications from local app storage
      const cached = await appStorage.getItem(STORAGE_KEY);
      let localItems: AppNotification[] = [];
      if (cached) {
        try {
          localItems = JSON.parse(cached);
        } catch {}
      }

      // 2. Fetch remote notifications from backend API
      const auth = useAuthStore.getState();
      const targetUser = auth.userEmail || auth.userId || '';
      const notifUrl = `${API_BASE_URL}/ingress/claims/notifications${targetUser ? `?patient_id=${encodeURIComponent(targetUser)}` : ''}`;

      let remoteItems: AppNotification[] = [];
      try {
        const res = await fetch(notifUrl);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data?.notifications) ? data.notifications : [];
          remoteItems = items.map((item: any) => ({
            id: String(item.id || item._id || Math.random()),
            title: item.title || 'ClaimsGuru Update',
            message: item.message || item.body || 'Status update received.',
            createdAt: item.created_at || new Date().toISOString(),
            claimId: item.claim_id || item.claimId,
            type: detectType(item.title, item.message, item.type),
            read: false,
          }));
        }
      } catch (err) {
        // Network errors handled gracefully, proceed with local
      }

      // 3. Merge remote & local preserving read status
      const existingMap = new Map<string, AppNotification>();
      localItems.forEach(n => existingMap.set(n.id, n));

      remoteItems.forEach(r => {
        if (!existingMap.has(r.id)) {
          existingMap.set(r.id, r);
        } else {
          // Keep existing read status but update text/claimId if refreshed
          const existing = existingMap.get(r.id)!;
          existingMap.set(r.id, {
            ...r,
            read: existing.read,
          });
        }
      });

      let merged = Array.from(existingMap.values());

      // 4. Cleanse legacy dummy seeds & orphaned notifications
      merged = merged.filter(n => {
        if (n.id === 'notif-val-ready' || n.id === 'notif-welcome') return false;
        const text = ((n.title || '') + ' ' + (n.message || '')).toLowerCase();
        if (text.includes('504fd1ad')) return false;
        return true;
      });

      // 5. Cross-check against active claims if claims are loaded
      try {
        const { useClaimsStore } = require('./useClaimsStore');
        const claimsState = useClaimsStore.getState();
        if (claimsState.backendConnected || (claimsState.claims && claimsState.claims.length > 0)) {
          const validPrefixes = new Set(
            (claimsState.claims || []).map((c: any) =>
              (c.id || '').trim().toLowerCase().replace(/^#/, '').replace(/-/g, '').slice(0, 8)
            ).filter(Boolean)
          );

          merged = merged.filter(n => {
            if (n.claimId) {
              const prefix = n.claimId.trim().toLowerCase().replace(/^#/, '').replace(/-/g, '').slice(0, 8);
              return validPrefixes.has(prefix);
            }
            const match = (n.title + ' ' + n.message).match(/#([a-fA-F0-9]{6,8})/);
            if (match && match[1]) {
              return validPrefixes.has(match[1].toLowerCase().slice(0, 8));
            }
            return true;
          });
        }
      } catch {}

      // Sort newest first
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const unreadCount = merged.filter(n => !n.read).length;
      await appStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

      set({
        notifications: merged,
        unreadCount,
        loading: false,
      });
    } catch (e) {
      set({ loading: false });
    }
  },

  addNotification: (notif) => {
    const state = get();
    const id = notif.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Avoid duplicate insertions
    if (state.notifications.some(n => n.id === id)) {
      return;
    }

    const newNotification: AppNotification = {
      id,
      title: notif.title,
      message: notif.message,
      createdAt: notif.createdAt || new Date().toISOString(),
      claimId: notif.claimId,
      type: detectType(notif.title, notif.message, notif.type),
      read: false,
    };

    const updated = [newNotification, ...state.notifications];
    const unreadCount = updated.filter(n => !n.read).length;

    set({ notifications: updated, unreadCount });
    appStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  markAsRead: (id: string) => {
    const updated = get().notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    const unreadCount = updated.filter(n => !n.read).length;
    set({ notifications: updated, unreadCount });
    appStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  markAllAsRead: () => {
    const updated = get().notifications.map(n => ({ ...n, read: true }));
    set({ notifications: updated, unreadCount: 0 });
    appStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
    appStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  deleteNotificationsForClaim: (claimId: string) => {
    if (!claimId) return;
    const cleanId = claimId.trim().toLowerCase().replace(/^#/, '');
    const prefix8 = cleanId.replace(/-/g, '').slice(0, 8);

    const isMatch = (n: AppNotification) => {
      // 1. Direct claimId match
      if (n.claimId) {
        const nId = n.claimId.trim().toLowerCase().replace(/^#/, '');
        if (nId === cleanId || (prefix8.length >= 6 && (nId.startsWith(prefix8) || cleanId.startsWith(nId.replace(/-/g, '').slice(0, 8))))) {
          return true;
        }
      }
      // 2. Mention in title or message (e.g. #504FD1AD or 504FD1AD)
      if (prefix8.length >= 6) {
        const titleLower = (n.title || '').toLowerCase();
        const msgLower = (n.message || '').toLowerCase();
        if (titleLower.includes(prefix8) || msgLower.includes(prefix8)) {
          return true;
        }
      }
      return false;
    };

    const remaining = get().notifications.filter(n => !isMatch(n));
    const unreadCount = remaining.filter(n => !n.read).length;

    set({ notifications: remaining, unreadCount });
    appStorage.setItem(STORAGE_KEY, JSON.stringify(remaining)).catch(() => {});
  },

  pruneOrphanedClaimNotifications: (activeClaimIds: string[]) => {
    const validPrefixes = new Set(
      activeClaimIds
        .map(id => (id || '').trim().toLowerCase().replace(/^#/, '').replace(/-/g, '').slice(0, 8))
        .filter(Boolean)
    );

    const isOrphan = (n: AppNotification) => {
      // Always remove legacy fake seeds
      if (n.id === 'notif-val-ready' || n.id === 'notif-welcome') return true;
      const text = ((n.title || '') + ' ' + (n.message || '')).toLowerCase();
      if (text.includes('504fd1ad')) return true;

      // If notification is tied to a specific claimId
      if (n.claimId) {
        const notifPrefix = n.claimId.trim().toLowerCase().replace(/^#/, '').replace(/-/g, '').slice(0, 8);
        return !validPrefixes.has(notifPrefix);
      }

      // If notification title or message explicitly mentions a claim ID (#XXXXXXXX)
      const match = (n.title + ' ' + n.message).match(/#([a-fA-F0-9]{6,8})/);
      if (match && match[1]) {
        return !validPrefixes.has(match[1].toLowerCase().slice(0, 8));
      }

      return false;
    };

    const remaining = get().notifications.filter(n => !isOrphan(n));
    const unreadCount = remaining.filter(n => !n.read).length;

    set({ notifications: remaining, unreadCount });
    appStorage.setItem(STORAGE_KEY, JSON.stringify(remaining)).catch(() => {});
  },
}));
