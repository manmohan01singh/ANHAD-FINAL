// Service Worker for Sadhsangat Live - Background Audio Support
const CACHE_NAME = 'sadhsangat-live-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Message event - handle keep-alive pings from main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'keepalive') {
    console.log('Service Worker: Keep-alive ping received');
    // Send response to confirm worker is alive
    event.ports[0]?.postMessage({ type: 'keepalive-response' });
    event.source?.postMessage({ type: 'keepalive-response' });
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
