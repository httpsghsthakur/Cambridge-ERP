// Service Worker for native Web Push Notifications

self.addEventListener('push', (event) => {
  let data = { title: 'New Notification', message: 'You have a new update.' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      // Fallback if data is raw text
      data = { title: 'New Notification', message: event.data.text() };
    }
  }

  const options = {
    body: data.message || data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: '/notifications', // will redirect to role basePath + /notifications in click handler
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Find active window of our app, focus it, or open a new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Find if a window is already open
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // If not open, open a new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
