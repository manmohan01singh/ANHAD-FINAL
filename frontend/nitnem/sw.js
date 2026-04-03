// ANHAD Service Worker - Cache Control
const CACHE_NAME = 'anhad-v1.0.1'; // Change version on every deploy
const urlsToCache = [
  '/',
  '/index.html',
  '/nitnem/index.html',
  '/nitnem/reader.html',
  '/css/anhad-core.css',
  '/css/claymorphism-system.css',
  '/css/mobile-lock.css',
  '/js/anhad-core.js',
  '/lib/global-theme.js'
];

// Install - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Update cache with fresh response
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request);
      })
  );
});
