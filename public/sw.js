/**
 * Service Worker for PWA Support
 * Enables off-line caching and installable app functionality
 */

const CACHE_NAME = "wuroud-mart-v2";
const urlsToCache = [
  "/",
  "/index.html",
  "/products.html",
  "/admin.html",
  "/css/style.css",
  "/css/admin.css",
  "/js/config.js",
  "/js/utils.js",
  "/js/main.js",
  "/js/products.js",
  "/js/admin.js",
  "/manifest.json"
];

// Install event - cache files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Only cache successful responses
        if (
          !response ||
          response.status !== 200 ||
          response.type !== "basic"
        ) {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }).catch(() => {
      // Offline - serve a fallback or cached response
      return new Response(
        "Offline - This content is not available offline",
        { status: 503, statusText: "Service Unavailable" }
      );
    })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
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
});
