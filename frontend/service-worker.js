const CACHE_NAME = 'anhad-pwa-v1';
const RUNTIME_CACHE = 'anhad-runtime-v1';

// Files to cache on install
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './css/theme-variables.css',
  './css/trendora-premium.css',
  './css/anhad-core.css',
  './css/desktop-responsive.css',
  './css/nav-glass.css',
  './css/scroll-performance-90fps.css',
  './js/anhad-core.js',
  './js/capacitor-bridge.js',
  './js/capacitor-init.js',
  './js/trendora-app.js',
  './lib/anhad-audio-singleton.js',
  './lib/capacitor-bridge.js',
  './lib/smart-back.js',
  './lib/state-preservation.js',
  './lib/global-theme.js',
  './assets/apple-touch-icon.png',
  './assets/favicon-32x32.png',
  './assets/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other protocols
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Cache hit - return cached response
        if (cachedResponse) {
          // Stale-while-revalidate: serve from cache, then update in background
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            // Update cache with fresh response
            if (networkResponse && networkResponse.status === 200) {
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
            return networkResponse;
          }).catch(() => {
            // If network fails, return cached response
            return cachedResponse;
          });
          
          return fetchPromise.catch(() => cachedResponse);
        }

        // Cache miss - fetch from network
        return fetch(event.request).then((networkResponse) => {
          // Cache valid responses
          if (networkResponse && networkResponse.status === 200) {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        });
      })
  );
});

// Background sync for updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  }
});

// Check for updates function
async function checkForUpdates() {
  try {
    const response = await fetch('./service-worker.js', { cache: 'no-cache' });
    const newVersion = await response.text();
    const currentVersion = await caches.open(CACHE_NAME).then(cache => 
      cache.match('./service-worker.js').then(r => r ? r.text() : null)
    );
    
    if (currentVersion && newVersion !== currentVersion) {
      console.log('[Service Worker] New version detected, triggering update');
      self.registration.update();
    }
  } catch (error) {
    console.error('[Service Worker] Update check failed:', error);
  }
}

// Periodic update check (every 30 minutes)
setInterval(() => {
  checkForUpdates();
}, 30 * 60 * 1000);

// Push notification handler (optional)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New update available',
      icon: './assets/pwa-icon-192.png',
      badge: './assets/app-logo-96.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || './'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'ANHAD Update', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || './')
  );
});

// Handle SKIP_WAITING message for immediate update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Loaded');
