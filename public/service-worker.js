self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open("emergency-app-v1").then((cache) => {
      return cache.match(event.request).then((response) => {
        return (
          response ||
          fetch(event.request).then((networkResponse) => {
            if (
              event.request.method === "GET" &&
              event.request.url.startsWith(self.location.origin)
            ) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
        );
      });
    }),
  );
});
