import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import {
  isRunningInExpoGo,
  registerForPushNotificationsAsync,
  sendLocalPushNotification,
  setupNotificationChannel,
} from './notificationService';
import { useAuthStore } from '../../state/useAuthStore';
import { claimsApi } from '../../features/claims/services/claimsApi';
import { API_BASE_URL } from '../api/config';

export interface InAppBanner {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export function usePushNotifications(onNotificationTap?: (data: Record<string, any>) => void) {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [expoToken, setExpoToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [activeBanner, setActiveBanner] = useState<InAppBanner | null>(null);
  const bannerTimer = useRef<any>(null);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const prevStatusesRef = useRef<Map<string, string>>(new Map());
  const initialLoadedRef = useRef<boolean>(false);
  const { isAuthenticated, userEmail } = useAuthStore();

  const showBanner = (banner: InAppBanner) => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setActiveBanner(banner);
    bannerTimer.current = setTimeout(() => {
      setActiveBanner(null);
    }, 6000);
  };

  const dismissBanner = () => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setActiveBanner(null);
  };

  useEffect(() => {
    // If in Expo Go, skip native listeners to prevent SDK 53 push notification error
    if (isRunningInExpoGo()) {
      return;
    }

    setupNotificationChannel();

    // Register device token immediately on launch & whenever auth state changes
    registerForPushNotificationsAsync().then((res) => {
      if (res.fcmToken) setFcmToken(res.fcmToken);
      if (res.expoToken) setExpoToken(res.expoToken);
    });

    // 1. Listen for incoming notifications when app is in foreground
    try {
      notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
        setNotification(notif);
        const content = notif?.request?.content;
        if (content?.title) {
          showBanner({
            title: content.title,
            body: content.body || '',
            data: content.data as any,
          });
        }
      });
    } catch (e) {
      // Ignored in unsupported environments
    }

    // 2. Listen for user tapping on the system notification banner
    try {
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response?.notification?.request?.content?.data || {};
        if (onNotificationTap) {
          onNotificationTap(data);
        }
      });
    } catch (e) {
      // Ignored in unsupported environments
    }

    // 3. Real-time background poller for TPA Claim Actions (Approval, Rejection, Docs Requested)
    let isCancelled = false;
    const seenNotificationIds = new Set<string>();
    let isFirstNotificationPoll = true;

    const checkClaimStatusUpdates = async () => {
      if (isCancelled) return;
      const auth = useAuthStore.getState();
      const targetUser = auth.userEmail || auth.userId || '';

      // Check 1: Poll dedicated notifications API (/ingress/claims/notifications)
      try {
        const notifUrl = `${API_BASE_URL}/ingress/claims/notifications${targetUser ? `?patient_id=${encodeURIComponent(targetUser)}` : ''}`;
        const notifRes = await fetch(notifUrl);
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          const items = notifData?.notifications || [];

          if (isFirstNotificationPoll) {
            // Seed existing notifications, but if one was created in the last 60s, alert the user!
            const now = Date.now();
            for (const item of items) {
              seenNotificationIds.add(item.id);
              if (item.created_at) {
                const ageMs = now - new Date(item.created_at).getTime();
                if (ageMs >= 0 && ageMs < 60000) {
                  console.log(`[Push Notification] Fresh TPA event detected on open: ${item.title}`);
                  const notifTitle = item.title || 'ClaimsGuru: Claim Status Update';
                  const notifBody = item.message || 'Your claim status has been updated by the reviewer.';
                  showBanner({
                    title: notifTitle,
                    body: notifBody,
                    data: { claimId: item.claim_id, notificationId: item.id },
                  });
                  sendLocalPushNotification({
                    title: notifTitle,
                    body: notifBody,
                    data: { claimId: item.claim_id, notificationId: item.id },
                  }).catch(() => {});
                }
              }
            }
            isFirstNotificationPoll = false;
          } else {
            for (const item of items) {
              if (!seenNotificationIds.has(item.id)) {
                seenNotificationIds.add(item.id);
                console.log(`[Push Notification] New TPA event detected: ${item.title} - ${item.message}`);
                const notifTitle = item.title || 'ClaimsGuru: Claim Status Update';
                const notifBody = item.message || 'Your claim status has been updated by the reviewer.';
                showBanner({
                  title: notifTitle,
                  body: notifBody,
                  data: { claimId: item.claim_id, notificationId: item.id },
                });
                await sendLocalPushNotification({
                  title: notifTitle,
                  body: notifBody,
                  data: { claimId: item.claim_id, notificationId: item.id },
                });
              }
            }
          }
        }
      } catch (e) {
        // Silently continue
      }

      // Check 2: Poll claims list directly for status transitions (SUBMITTED -> APPROVED)
      try {
        const res = await claimsApi.getClaims();
        const claims = res?.claims || [];
        if (claims.length === 0) return;

        if (!initialLoadedRef.current) {
          claims.forEach((c) => prevStatusesRef.current.set(c.id, c.status));
          initialLoadedRef.current = true;
          return;
        }

        for (const claim of claims) {
          const oldStatus = prevStatusesRef.current.get(claim.id);
          const newStatus = claim.status;

          if (oldStatus && oldStatus !== newStatus) {
            console.log(`[Push Alert] Status changed for claim #${claim.id}: ${oldStatus} -> ${newStatus}`);
            prevStatusesRef.current.set(claim.id, newStatus);

            let title = '';
            let body = '';

            const shortId = claim.id.slice(0, 8).toUpperCase();
            const normalizedStatus = (claim.status || '').toLowerCase();
            const payer = claim.insuranceCompany || claim.tpa || 'your insurance provider';
            const amtStr = claim.amt ? ` for ₹${claim.amt.toLocaleString('en-IN')}` : '';

            if (normalizedStatus === 'approved') {
              title = 'ClaimsGuru: Claim Approved ✅';
              body = `Your cashless hospital claim (#${shortId})${amtStr} has been approved by ${payer}.`;
            } else if (normalizedStatus === 'settled') {
              title = 'ClaimsGuru: Claim Settled 💰';
              body = `Settlement disbursed for claim #${shortId} by ${payer}. Processing complete.`;
            } else if (normalizedStatus === 'docs_requested' || claim.hasActionRequest) {
              title = 'ClaimsGuru: Documents Requested 📄';
              body = claim.tpaMessage || `${payer} requested additional documents for claim #${shortId}. Tap to view requirements.`;
            } else if (normalizedStatus === 'rejected') {
              title = 'ClaimsGuru: Claim Update ⚠️';
              body = `Claim #${shortId} status has been updated to Rejected by ${payer}.`;
            }

            if (title && body) {
              showBanner({
                title,
                body,
                data: { claimId: claim.id, status: newStatus },
              });
              await sendLocalPushNotification({
                title,
                body,
                data: { claimId: claim.id, status: newStatus },
              });
            }
          } else {
            prevStatusesRef.current.set(claim.id, newStatus);
          }
        }
      } catch (err) {
        // Silently handle transient polling errors
      }
    };

    // Poll every 3 seconds for near-instant notification delivery
    const pollTimer = setInterval(checkClaimStatusUpdates, 3000);
    // Initial check
    checkClaimStatusUpdates();

    return () => {
      isCancelled = true;
      clearInterval(pollTimer);
      if (notificationListener.current?.remove) {
        notificationListener.current.remove();
      }
      if (responseListener.current?.remove) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, userEmail]);

  const sendTestNotification = async (customTitle?: string, customBody?: string) => {
    const title = customTitle || 'ClaimsGuru: Claim Approved ✅';
    const body =
      customBody ||
      'Your cashless hospital claim (#CG-8942) for ₹45,000 has been approved by Star Health.';
    const data = {
      type: 'CLAIM_STATUS_UPDATE',
      claimId: 'c3313984-2431-4a60-9586-371384e902af',
    };

    showBanner({ title, body, data });

    return await sendLocalPushNotification({
      title,
      body,
      data,
    });
  };

  return {
    fcmToken,
    expoToken,
    notification,
    activeBanner,
    dismissBanner,
    sendTestNotification,
  };
}
