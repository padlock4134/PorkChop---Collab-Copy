// PorkChop Service Worker
const CACHE_NAME = 'porkchop-v2';
const urlsToCache = [
  '/manifest.json',
  '/logo.png'
  // Removed root and index.html to prevent landing page caching issues
];

// Install event - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Fetch event - never cache root page, serve other cached assets when available
self.addEventListener('fetch', event => {
  // Never cache the landing page (root URL) to prevent stale content
  if (event.request.url.endsWith('/') || event.request.url.endsWith('/index.html')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For other assets, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
