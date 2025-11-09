// Service Worker for Push Notifications and Offline Support
// Compatible with Next.js 15 - No dependencies required

const CACHE_NAME = "finserp-cache-v1";
const API_CACHE_NAME = "finserp-api-cache-v1";
const OFFLINE_URL = "/offline";
const API_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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

// Helper to check if cached response is expired
function isCacheExpired(response) {
  if (!response) return true;
  
  const cacheDate = response.headers.get("sw-cache-date");
  if (!cacheDate) return true;
  
  const cacheTime = parseInt(cacheDate, 10);
  const now = Date.now();
  return (now - cacheTime) > API_CACHE_TTL;
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
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Clean up expired API cache entries
      return caches.open(API_CACHE_NAME).then((cache) => {
        return cache.keys().then((keys) => {
          return Promise.all(
            keys.map((key) => {
              return cache.match(key).then((response) => {
                if (isCacheExpired(response)) {
                  console.log("Deleting expired cache:", key.url);
                  return cache.delete(key);
                }
              });
            })
          );
        });
      });
    })
  );

  // Take control of all pages immediately
  return self.clients.claim();
});

// Handle fetch events with Cache First for API, Network First for assets
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
    // Cache First strategy for API requests
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          // Check if we have a valid (non-expired) cached response
          if (cachedResponse && !isCacheExpired(cachedResponse)) {
            // Return cached response immediately
            // Then update cache in background (stale-while-revalidate)
            fetch(request)
              .then((networkResponse) => {
                if (networkResponse.ok) {
                  // Clone and cache the fresh response
                  const responseToCache = networkResponse.clone();
                  // Add cache timestamp header
                  const headers = new Headers(responseToCache.headers);
                  headers.set("sw-cache-date", Date.now().toString());
                  const cachedResponse = new Response(responseToCache.body, {
                    status: responseToCache.status,
                    statusText: responseToCache.statusText,
                    headers: headers,
                  });
                  cache.put(request, cachedResponse);
                }
              })
              .catch(() => {
                // Network failed, but we already returned cached response
                console.log("Background fetch failed, using cached response");
              });

            return cachedResponse;
          }

          // No valid cache, fetch from network
          return fetch(request)
            .then((networkResponse) => {
              // Only cache successful responses
              if (networkResponse.ok) {
                const responseToCache = networkResponse.clone();
                // Add cache timestamp header
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
              // Network failed, try to return expired cache as fallback
              if (cachedResponse) {
                console.log("Network failed, returning expired cache as fallback");
                return cachedResponse;
              }
              // No cache at all, return error
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
