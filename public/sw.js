// Service Worker for Push Notifications and Offline Support
// Compatible with Next.js 15 - No dependencies required

const CACHE_NAME = "finserp-cache-v1";
const OFFLINE_URL = "/offline";

// Cache important assets during install
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/offline",
        "/manifest.json",
        "/icon-192x192.png",
        "/icon-512x512.png",
      ]).catch((error) => {
        console.error("Failed to cache during install:", error);
      });
    })
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Clean up old caches during activation
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all pages immediately
  return self.clients.claim();
});

// Handle fetch events with Network First strategy
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip chrome extension requests
  if (event.request.url.startsWith("chrome-extension://")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Try to get from cache if network fails
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }

          // Return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }

          return new Response("Offline", { status: 503 });
        });
      })
  );
});

// Listen for push events
self.addEventListener("push", (event) => {
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

      // Special handling for vehicle booking status changes
      if (data.data && data.data.type === 'vehicle_booking_status_changed') {
        const isEnabled = data.data.is_enabled;
        const action = data.data.action;

        notificationData = {
          title: data.title || `Vehicle Booking System ${action === 'enabled' ? 'Enabled' : 'Disabled'}`,
          body: data.body || data.message || notificationData.body,
          icon: isEnabled ? "/icon-192x192.png" : "/icon-warning.png",
          badge: "/icon-144x144.png",
          tag: "vehicle-booking-status",
          requireInteraction: !isEnabled, // Require interaction for disabled notifications
          data: data.data || {},
        };
      } else {
        // Default notification handling
        notificationData = {
          title: data.title || notificationData.title,
          body: data.body || data.message || notificationData.body,
          icon: data.icon || notificationData.icon,
          badge: data.badge || notificationData.badge,
          tag: data.tag || notificationData.tag,
          requireInteraction: data.requireInteraction || false,
          data: data.data || {},
        };
      }
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
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  if (event.action === "close") {
    return;
  }

  // Determine URL based on notification type
  let urlToOpen = "/vehicle-bookings"; // Default fallback

  if (event.notification.data) {
    if (event.notification.data.type === 'vehicle_booking_status_changed') {
      urlToOpen = event.notification.data.url || "/vehicle-bookings";
    } else if (event.notification.data.url) {
      urlToOpen = event.notification.data.url;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
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
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event);
});

// Handle messages from the client
self.addEventListener("message", (event) => {
  console.log("Message received in service worker:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
