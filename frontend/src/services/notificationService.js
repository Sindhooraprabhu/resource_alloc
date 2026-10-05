const VAPID_PUBLIC_KEY = 'BEKPNFalg6ZSuvkecvg96U7rvT74vEyhLTLIajqXRF22LS0eS6XT5hWSicsd_Gpjd_sD7Te32xpmxHUutFWApgg';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const STORAGE_KEY = 'lifelink_notifications';
const MAX_STORED = 50;

export const notificationService = {
  isSupported: () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  async registerServiceWorker() {
    if (!this.isSupported()) return null;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  },

  async subscribeToPush() {
    if (!this.isSupported()) return null;

    try {
      const registration = await this.registerServiceWorker();
      if (!registration) return null;

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      const subscriptionData = subscription.toJSON();
      localStorage.setItem('pushSubscription', JSON.stringify(subscriptionData));
      console.log('Push subscription:', subscriptionData);

      return subscriptionData;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  },

  getStoredSubscription() {
    const stored = localStorage.getItem('pushSubscription');
    return stored ? JSON.parse(stored) : null;
  },

  async sendSubscriptionToBackend(emergencyId) {
    const subscription = this.getStoredSubscription();
    if (!subscription) return false;

    try {
      const response = await fetch(`/api/emergencies/${emergencyId}/push-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to send subscription to backend:', error);
      return false;
    }
  },

  storeNotification(notification) {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      stored.unshift({
        ...notification,
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        read: false
      });
      if (stored.length > MAX_STORED) stored.length = MAX_STORED;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  },

  getStoredNotifications() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  markAsRead(id) {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const updated = stored.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const updated = stored.map(n => ({ ...n, read: true }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  },

  setupPushListener(onNotification) {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
        this.storeNotification(event.data.notification);
        if (onNotification) onNotification(event.data.notification);
      }
    });

    navigator.serviceWorker.addEventListener('push', (event) => {
      if (event.data) {
        const notification = event.data.json();
        this.storeNotification(notification);
        if (onNotification) onNotification(notification);
      }
    });
  },

  requestPermission() {
    if (!('Notification' in window)) return Promise.resolve('denied');
    return Notification.requestPermission();
  },

  showLocalNotification(title, body, data = {}) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: data.tag || 'lifelink-notification',
        data,
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        if (data.url) window.location.href = data.url;
        notification.close();
      };

      return notification;
    }
    return null;
  }
};

export default notificationService;