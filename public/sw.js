/* eslint-disable no-undef */
// Custom Service Worker for Push Notifications
// This extends the next-pwa generated service worker

// Listen for push events
self.addEventListener("push", function (event) {
  console.log("Push notification received:", event);

  let notificationData = {
    title: "FinsERP",
    body: "You have a new notification",
    icon: "/icon-192x192.png",
    badge: "/icon-144x144.png",
    tag: "finserp-notification",
    requireInteraction: false,
  };

  // Parse push notification data
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction || false,
        data: data.data || {}, // Custom data to pass to notification click handler
      };
    } catch (error) {
      console.error("Failed to parse push notification data:", error);
    }
  }

  // Show the notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      vibrate: [200, 100, 200], // Vibration pattern
      actions: [
        {
          action: "view",
          title: "View",
        },
        {
          action: "close",
          title: "Close",
        },
      ],
    })
  );
});

// Listen for notification click events
self.addEventListener("notificationclick", function (event) {
  console.log("Notification clicked:", event);

  event.notification.close();

  if (event.action === "close") {
    return;
  }

  // Default action or "view" action
  const urlToOpen = event.notification.data?.url || "/vehicle-bookings";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }

      // Open a new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Listen for notification close events
self.addEventListener("notificationclose", function (event) {
  console.log("Notification closed:", event);
});

// Import the next-pwa workbox if available
// This ensures compatibility with the existing PWA setup
if (typeof importScripts === "function") {
  try {
    importScripts("/workbox-*.js");
  } catch (error) {
    console.log("Workbox scripts not found, using standalone service worker");
  }
}
