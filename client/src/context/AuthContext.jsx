import { createContext, useState, useContext, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext(null);

// Helper to convert VAPID public key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    API.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Subscribe to push notifications when user changes
  useEffect(() => {
    if (user) {
      subscribeUser();
    }
  }, [user]);

  const subscribeUser = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Push] Browser does not support Web Push notifications.');
      return;
    }

    try {
      // 1. Register Service Worker directly to bypass existing registration conflicts
      console.log('[Push] Registering Service Worker...');
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('[SW] Service Worker registered:', registration);

      await navigator.serviceWorker.ready;

      // 2. Request Permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[Push] Permission not granted.');
        return;
      }

      // 3. Fetch VAPID key
      const { data } = await API.get('/notifications/vapid-key');
      if (!data.publicKey) {
        console.warn('[Push] VAPID public key is missing on the server.');
        return;
      }

      // 4. Get or create subscription, verifying VAPID key freshness
      let subscription = await registration.pushManager.getSubscription();
      const currentServerKey = urlBase64ToUint8Array(data.publicKey);

      if (subscription) {
        const existingKey = subscription.options.applicationServerKey;
        let keyMatches = false;
        if (existingKey) {
          const existingUint8 = new Uint8Array(existingKey);
          if (existingUint8.length === currentServerKey.length) {
            keyMatches = true;
            for (let i = 0; i < existingUint8.length; i++) {
              if (existingUint8[i] !== currentServerKey[i]) {
                keyMatches = false;
                break;
              }
            }
          }
        } else {
          keyMatches = true; // Fallback if browser doesn't expose it
        }

        if (!keyMatches) {
          console.log('[Push] VAPID key mismatch detected. Unsubscribing to force renewal...');
          await subscription.unsubscribe().catch(e => console.warn('[Push] Error unsubscribing:', e));
          subscription = null;
        }
      }

      if (!subscription) {
        console.log('[Push] Subscribing with new VAPID key...');
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: currentServerKey,
        });
      }

      // 5. Send subscription parameters to server
      const subscriptionJson = subscription.toJSON();
      await API.post('/notifications/subscribe', subscriptionJson);
      console.log('[Push] Subscription synchronized with server.');
    } catch (err) {
      console.error('[Push] Failed to register push subscription:', err);
    }
  };

  const unsubscribeUser = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      // Notify backend to remove subscription
      await API.post('/notifications/unsubscribe', { endpoint: subscription.endpoint }).catch(() => {});

      // Local browser unsubscribe
      await subscription.unsubscribe();
      console.log('[Push] Subscriptions cleaned up.');
    } catch (err) {
      console.error('[Push] Failed to unsubscribe:', err);
    }
  };

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await unsubscribeUser();
      await API.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);