// Service Worker for Push Notifications and Offline Support
// Compatible with Next.js 15 - No dependencies required

// Dynamic cache versioning - updated on each build
const CACHE_VERSION = "1762912671789"; // Will be replaced during build
const CACHE_NAME = `finserp-cache-${CACHE_VERSION}`;
const API_CACHE_NAME = `finserp-api-cache-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

// Helper to check if request is an API request
function isApiRequest(url) {
  try {
    const urlObj = new URL(url);
    // Check if it's an API endpoint (contains /api/ or matches API base URL pattern)
    return urlObj.pathname.includes("/api/") || urlObj.pathname.startsWith("/api");
  } catch {
    return false;
  }
}


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
          // Delete old caches from previous versions
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
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

// Handle fetch events with Network First for API (React Query manages caching), Network First for assets
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip chrome extension requests
  if (event.request.url.startsWith("chrome-extension://")) {
    return;
  }

  const request = event.request;
  const isApi = isApiRequest(request.url);

  if (isApi) {
    // Network First strategy for ALL API requests
    // Let React Query handle caching - it's designed for this and already configured properly
    // Service Worker only provides offline fallback
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((networkResponse) => {
            // Cache successful responses for offline fallback only
            if (networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              const headers = new Headers(responseToCache.headers);
              headers.set("sw-cache-date", Date.now().toString());
              const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers,
              });
              cache.put(request, cachedResponse);
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed - return cached response as offline fallback
            return cache.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                console.log("Offline: Using cached API response");
                return cachedResponse;
              }
              // No cache available
              return new Response(
                JSON.stringify({ error: "Offline", message: "No cached data available" }),
                {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                }
              );
            });
          });
      })
    );
  } else {
    // Network First strategy for static assets
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Try to get from cache if network fails
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }

            // Return offline page for navigation requests
            if (request.mode === "navigate") {
              return caches.match(OFFLINE_URL);
            }

            return new Response("Offline", { status: 503 });
          });
        })
    );
  }
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

        // Enhanced notification for booking status changes
        const statusTitle = isEnabled
          ? "Booking System Opened"
          : "Booking System Closed";

        const statusBody = isEnabled
          ? "Vehicle bookings are now open! You can create new bookings."
          : "Vehicle bookings are now closed. New bookings cannot be created at this time.";

        notificationData = {
          title: data.title || statusTitle,
          body: data.body || data.message || statusBody,
          icon: isEnabled ? "/icon-192x192.png" : "/icon-192x192.png",
          badge: "/icon-144x144.png",
          tag: "vehicle-booking-status",
          requireInteraction: !isEnabled, // Require interaction for disabled notifications
          data: {
            ...data.data,
            url: "/", // Navigate to dashboard when clicked
          },
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
      // Navigate to dashboard for booking status changes to show the banner
      urlToOpen = event.notification.data.url || "/";
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
