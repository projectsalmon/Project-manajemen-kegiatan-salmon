import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification presentation handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export const CHANNEL_ID = 'kegiatan-kelurahan-notif';

export type NotificationNavigationTarget = {
  type: 'ACTIVITY' | 'ANNOUNCEMENT';
  id: string;
};

type NotificationResponseCallback = (target: NotificationNavigationTarget) => void;
let onNotificationResponseCallback: NotificationResponseCallback | null = null;
let pendingNotificationTarget: NotificationNavigationTarget | null = null;

/**
 * Register a listener for when user taps a notification in mobile tray
 */
export const setNotificationResponseHandler = (
  callback: NotificationResponseCallback
): (() => void) => {
  onNotificationResponseCallback = callback;
  if (pendingNotificationTarget) {
    const target = pendingNotificationTarget;
    pendingNotificationTarget = null;
    callback(target);
  }
  return () => {
    if (onNotificationResponseCallback === callback) {
      onNotificationResponseCallback = null;
    }
  };
};

/**
 * Listen for notification response (tap) events
 */
Notifications.addNotificationResponseReceivedListener((response) => {
  try {
    const data = response.notification.request.content.data as any;
    if (data && (data.type === 'ACTIVITY' || data.type === 'ANNOUNCEMENT') && data.id) {
      const target: NotificationNavigationTarget = { type: data.type, id: data.id };
      if (onNotificationResponseCallback) {
        onNotificationResponseCallback(target);
      } else {
        pendingNotificationTarget = target;
      }
    }
  } catch (err) {
    console.warn('Error handling notification response:', err);
  }
});

/**
 * Check if app was opened from cold start by tapping a notification
 */
export const checkColdStartNotification = async (): Promise<NotificationNavigationTarget | null> => {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      const data = response.notification.request.content.data as any;
      if (data && (data.type === 'ACTIVITY' || data.type === 'ANNOUNCEMENT') && data.id) {
        const target: NotificationNavigationTarget = { type: data.type, id: data.id };
        if (onNotificationResponseCallback) {
          onNotificationResponseCallback(target);
        } else {
          pendingNotificationTarget = target;
        }
        return target;
      }
    }
  } catch (e) {
    console.warn('Error checking cold start notification:', e);
  }
  return null;
};

/**
 * Initialize notification channels and request permissions
 */
export const initializeNotifications = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Notifikasi Kelurahan & Warga',
        description: 'Pemberitahuan resmi kegiatan, pengumuman, dan persetujuan ACC',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0369A1',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Error initializing notifications:', err);
    return false;
  }
};

/**
 * Trigger an immediate notification on the mobile status bar / tray
 */
export const triggerNotification = async (
  titleOrParams: string | { title: string; body: string; data?: Record<string, any> },
  bodyParam?: string,
  dataParam?: Record<string, any>
): Promise<void> => {
  try {
    let title = '';
    let body = '';
    let data: Record<string, any> = {};

    if (typeof titleOrParams === 'object') {
      title = titleOrParams.title;
      body = titleOrParams.body;
      data = titleOrParams.data || {};
    } else {
      title = titleOrParams;
      body = bodyParam || '';
      data = dataParam || {};
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        color: '#0369A1',
        badge: 1,
      },
      trigger: null, // immediate
    });
  } catch (err) {
    console.warn('Error triggering notification:', err);
  }
};
