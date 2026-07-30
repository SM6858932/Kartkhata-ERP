import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

// OneSignal App ID - replace with your actual ID from OneSignal dashboard
const ONESIGNAL_APP_ID = '2e6c57cd-0aa2-46a2-b54e-24fc696ff85b';

export const PushNotificationService = {
  /**
   * Initialize push notifications
   * Call this on app startup after user login
   */
  async initialize(userId?: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only work on native platforms');
      return;
    }

    try {
      // Request permission
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Listen for registration
      PushNotifications.addListener('registration', (token: any) => {
        console.log('Push registration success, token:', token.value);
        // Send token to your backend to associate with user
        this.sendTokenToBackend(token.value, userId);
      });

      // Listen for incoming notifications (foreground)
      PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
        console.log('Push notification received:', notification);
      });

      // Listen for notification taps
      PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
        console.log('Push notification action performed:', action);
        // Handle notification tap
        this.handleNotificationTap(action);
      });

    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  },

  /**
   * Send device token to your backend
   */
  async sendTokenToBackend(token: string, userId?: string): Promise<void> {
    // TODO: Send to your Firebase backend
    // Example: await api.saveDeviceToken({ token, userId, platform: 'android' });
    console.log('Device token to send:', { token, userId, platform: 'android' });
  },

  /**
   * Handle notification tap
   */
  handleNotificationTap(action: any): void {
    const data = action.notification?.data || {};
    
    // Navigate based on notification type
    if (data.vendorId) {
      window.dispatchEvent(new CustomEvent('notification-tap', { 
        detail: { type: 'vendor', id: data.vendorId } 
      }));
    } else if (data.type === 'payment') {
      window.dispatchEvent(new CustomEvent('notification-tap', { 
        detail: { type: 'payments' } 
      }));
    }
  },

  /**
   * Unregister from push notifications
   */
  async unregister(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await PushNotifications.unregister();
    } catch (error) {
      console.error('Error unregistering push notifications:', error);
    }
  },

  /**
   * Get permission status
   */
  async getPermissionStatus(): Promise<string> {
    if (!Capacitor.isNativePlatform()) return 'unavailable';
    
    const permission = await PushNotifications.checkPermissions();
    return permission.receive;
  },
};
