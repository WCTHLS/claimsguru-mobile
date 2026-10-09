import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useAuthStore } from '../../state/useAuthStore';
import { API_BASE_URL } from '../api/config';

export const NOTIFICATION_CHANNEL_ID = 'claimsguru_alerts';

/**
 * Checks whether the app is currently running inside the Expo Go app.
 * In modern Expo SDKs, remote FCM registration (getDevicePushTokenAsync)
 * is only supported in Development Builds (expo run:android) or Standalone builds.
 */
export function isRunningInExpoGo(): boolean {
  return (
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  );
}

/**
 * Configure foreground notification behavior:
 * Shows floating heads-up alert banner, plays sound, and sets app icon badge.
 * Only configured in development/standalone builds to avoid SDK 53 Expo Go warnings.
 */
if (!isRunningInExpoGo()) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    // Graceful fallback
  }
}

/**
 * Initialize notification channels on Android.
 * Android 8.0+ requires a channel with MAX importance to show the heads-up banner
 * (like WhatsApp, phone calls, and critical SMS alerts).
 */
export async function setupNotificationChannel(): Promise<void> {
  if (isRunningInExpoGo()) return;
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'ClaimsGuru Alerts',
        description: 'Instant alerts for claim approvals, settlements, and document requests',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0d9488',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        enableVibrate: true,
        enableLights: true,
      });
    } catch (e) {
      // Graceful fallback
    }
  }
}

export interface PushRegistrationResult {
  success: boolean;
  fcmToken?: string;
  expoToken?: string;
  isExpoGo?: boolean;
  error?: string;
}

/**
 * Register device for Push Notifications using Firebase Cloud Messaging (FCM).
 * Reads google-services.json for native Android credentials and returns registration token.
 */
export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  await setupNotificationChannel();

  if (!Device.isDevice && Platform.OS !== 'android') {
    console.log('[Push] Must use physical device for remote push notifications');
  }

  // 1. Check and request notification permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return {
      success: false,
      error: 'Permission not granted for push notifications.',
    };
  }

  // If running in Expo Go, remote push tokens (FCM) are not supported by the Expo Go client.
  // We skip token fetching to prevent the "use a development build instead" error banner,
  // while local heads-up notifications continue to work seamlessly.
  if (isRunningInExpoGo()) {
    console.log('[Push] Running in Expo Go client: local notifications and channels are active. Remote FCM requires a Development Build (npx expo run:android).');
    return {
      success: true,
      isExpoGo: true,
      fcmToken: 'expo-go-preview-client',
    };
  }

  let fcmToken: string | undefined;
  let expoToken: string | undefined;

  // 2. Obtain Native FCM Device Token in Development / Standalone Build
  try {
    const deviceTokenRes = await Notifications.getDevicePushTokenAsync();
    fcmToken = typeof deviceTokenRes?.data === 'string' ? deviceTokenRes.data : String(deviceTokenRes?.data || '');
    console.log('[FCM] Native Device Push Token:', fcmToken);
  } catch (err: any) {
    console.warn('[FCM] Could not get native device push token directly:', err?.message || err);
  }

  // 3. Obtain Expo Push Token as backup
  try {
    const expoPushRes = await Notifications.getExpoPushTokenAsync({
      projectId: '4c9bea21-e48d-4d54-bd81-ca45e9cb66ac',
    });
    expoToken = expoPushRes.data;
    console.log('[ExpoPush] Push Token:', expoToken);
  } catch (err: any) {
    console.warn('[ExpoPush] Could not get expo push token:', err?.message || err);
  }

  const activeToken = fcmToken || expoToken;

  if (activeToken) {
    // 4. Send token to ClaimsGuru backend
    await syncDeviceTokenWithBackend(activeToken, fcmToken, expoToken);
  }

  return {
    success: true,
    fcmToken,
    expoToken,
  };
}

/**
 * Synchronize device push tokens with the backend database.
 */
export async function syncDeviceTokenWithBackend(
  primaryToken: string,
  fcmToken?: string,
  expoToken?: string
): Promise<void> {
  try {
    const auth = useAuthStore.getState();
    const payload = {
      device_token: primaryToken,
      fcm_token: fcmToken || null,
      expo_token: expoToken || null,
      platform: Platform.OS,
      user_id: auth.userId || null,
      email: auth.userEmail || null,
    };

    const endpoint = `${API_BASE_URL}/ingress/notifications/register-token`;
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Best-effort sync
    });
  } catch (e) {
    console.warn('[Push] Failed to sync token with backend:', e);
  }
}

export interface SendPushNotificationOptions {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  subtitle?: string;
}

/**
 * Triggers an immediate system push notification banner on the device
 * with high priority, sound, and vibration (heads-up notification banner).
 */
export async function sendLocalPushNotification({
  title,
  body,
  data = {},
  subtitle,
}: SendPushNotificationOptions): Promise<string> {
  if (isRunningInExpoGo()) {
    console.log('[Push] Running in Expo Go client. Remote & native push notifications require the Development Build.');
    return 'expo-go-preview';
  }

  await setupNotificationChannel();

  try {
    try {
      Vibration.vibrate([0, 250, 150, 250]);
    } catch {}

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        subtitle,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#0d9488',
        ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
      } as any,
      trigger: null, // null means trigger immediately
    });
  } catch (err: any) {
    console.warn('[Push] Error scheduling notification:', err?.message || err);
    return 'error';
  }
}
