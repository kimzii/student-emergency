const CACHE_VERSION = "emergency-app-v4";

self.addEventListener("install", () => {
  console.log("[Service Worker] Installing new version...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating new version...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_VERSION) {
              console.log("[Service Worker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Network-first strategy for better updates
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests and API calls
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses
        if (
          networkResponse.ok &&
          event.request.url.startsWith(self.location.origin)
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fall back to cache if network fails
        return caches.match(event.request);
      }),
  );
});

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push event received!");
  console.log("[Service Worker] Event data:", event.data);

  let data = {};
  let title = "Emergency Alert!";
  let body = "Your child has triggered an emergency alert!";

  try {
    if (event.data) {
      data = event.data.json();
      console.log("[Service Worker] Parsed push data:", JSON.stringify(data));
      title = data.title || title;
      body = data.body || body;
    }
  } catch (err) {
    console.error("[Service Worker] Error parsing push data:", err);
  }

  const options = {
    body: body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: "emergency-alert",
    requireInteraction: true,
    data: {
      url: data.url || "/parent/dashboard",
      lat: data.lat,
      lng: data.lng,
    },
  };

  console.log("[Service Worker] About to show notification:", title);

  // Always show a notification - this is required for push events
  const notificationPromise = self.registration
    .showNotification(title, options)
    .then(() => {
      console.log("[Service Worker] ✅ Notification shown successfully!");
      return true;
    })
    .catch((err) => {
      console.error("[Service Worker] ❌ Error showing notification:", err);
      // Fallback to simple notification
      return self.registration.showNotification("Alert!", {
        body: "You have a new notification",
      });
    });

  event.waitUntil(notificationPromise);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/parent/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If there's already a window open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});
