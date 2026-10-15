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

      // If completely empty on first launch, seed welcome & recent claim notifications
      if (merged.length === 0) {
        merged = [
          {
            id: 'notif-welcome',
            title: 'Welcome to ClaimsGuru 🏥',
            message: 'Your automated AI health claims portal is ready. Track submissions and live updates here.',
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            type: 'info',
            read: false,
          },
          {
            id: 'notif-val-ready',
            title: 'AI Verification Ready ✅',
            message: 'Claim #504FD1AD passed 10/11 IRDAI compliance validation rules.',
            createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
            claimId: '504fd1ad-255b-421a-a7fa-9f55e0fdf081',
            type: 'validation',
            read: false,
          },
        ];
      }

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
}));
