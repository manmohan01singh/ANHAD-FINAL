// ANHAD Service Worker - INSTANT OFFLINE-FIRST CACHE
// Version must be changed on every deploy to force cache refresh
const CACHE_NAME = 'anhad-instant-v1.0.2';
const STATIC_CACHE = 'anhad-static-v1.0.2';
const BANI_CACHE = 'anhad-bani-v1.0.2';

// Critical resources that must be available instantly
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/nitnem/',
  '/nitnem/index.html',
  '/nitnem/reader.html',
  '/nitnem/japji-sahib.html',
  '/nitnem/jaap-sahib.html',
  '/nitnem/chaupai-sahib.html',
  '/nitnem/anand-sahib.html',
  '/nitnem/rehras-sahib.html',
  '/nitnem/sohila-sahib.html',
  '/nitnem/tav-prasad-savaiye.html',
  '/nitnem/category/sggs.html',
  '/nitnem/category/dasam.html',
  '/nitnem/category/nitnem.html',
  '/nitnem/category/sarbloh.html',
  '/nitnem/category/favorites.html',
  '/nitnem/js/offline-bani-data.js',
  '/nitnem/js/banidb-api.js',
  '/nitnem/js/reader-engine.js',
  '/nitnem/js/hub-app.js',
  '/nitnem/css/reader.css',
  '/nitnem/css/fonts.css',
  '/nitnem/bani-style.css',
  '/css/anhad-core.css',
  '/css/claymorphism-system.css',
  '/css/mobile-lock.css',
  '/js/anhad-core.js',
  '/lib/global-theme.js',
  '/lib/smart-back.js',
  '/lib/global-mini-player.js'
];

// Image assets that should be cached
const IMAGE_ASSETS = [
  '/assets/icons/guru-nanak-dev-ji.png',
  '/assets/icons/guru-angad-dev-ji.png',
  '/assets/icons/guru-amar-das-ji.png',
  '/assets/icons/guru-ramdas-ji.png',
  '/assets/icons/guru-arjan-dev-ji.png',
  '/assets/icons/guru-hargobind-ji.png',
  '/assets/icons/guru-harrai-ji.png',
  '/assets/icons/guru-harkrishan-ji.png',
  '/assets/icons/guru-tegh-bahadur-ji.png',
  '/assets/icons/guru-gobind-singh-ji.png',
  '/assets/sggs-transparent.webp',
  '/assets/icons/bg-nitnem.jpg'
];

// Google Fonts to cache
const FONT_URLS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Gurmukhi:wght@400;500;600;700&display=swap'
];

// Install - cache all critical assets aggressively
self.addEventListener('install', event => {
  console.log('[SW] Installing instant cache...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching critical assets...');
        return cache.addAll(CRITICAL_ASSETS.map(url => new Request(url, { cache: 'reload' })))
          .catch(err => {
            console.warn('[SW] Some critical assets failed to cache:', err);
            return Promise.resolve();
          });
      })
      .then(() => {
        // Cache images
        return caches.open(STATIC_CACHE).then(cache => {
          return Promise.all(
            IMAGE_ASSETS.map(url => 
              fetch(url, { cache: 'reload' })
                .then(response => {
                  if (response.ok) cache.put(url, response);
                })
                .catch(() => {})
            )
          );
        });
      })
      .then(() => {
        console.log('[SW] Critical assets cached');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Install failed:', err);
        return self.skipWaiting();
      })
  );
});

// Activate - claim clients immediately and clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating instant cache...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== BANI_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Claiming clients...');
      return self.clients.claim();
    })
  );
});

// Fetch - CACHE-FIRST strategy for instant loading
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;
  
  // Skip analytics and tracking
  if (url.hostname.includes('google-analytics') || 
      url.hostname.includes('analytics') ||
      url.hostname.includes('gtag')) return;
  
  // Strategy 1: BaniDB API requests - Stale-while-revalidate
  if (url.hostname.includes('banidb.com')) {
    event.respondWith(
      caches.open(BANI_CACHE).then(cache => {
        return cache.match(request).then(cached => {
          const fetchPromise = fetch(request)
            .then(response => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cached);
          
          return cached || fetchPromise;
        });
      })
    );
    return;
  }
  
  // Strategy 2: Static assets - Cache First (instant loading)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache => {
        return cache.match(request).then(cached => {
          if (cached) {
            refreshCache(cache, request);
            return cached;
          }
          
          return fetch(request)
            .then(response => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              return new Response('Offline', { 
                status: 503, 
                statusText: 'Service Unavailable'
              });
            });
        });
      })
    );
    return;
  }
  
  // Strategy 3: Navigation requests (HTML pages) - Network with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(request, response.clone());
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cached => {
            if (cached) return cached;
            return caches.match('/nitnem/index.html');
          });
        })
    );
    return;
  }
  
  // Strategy 4: Everything else - Cache first with network fallback
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        refreshCache(caches.open(STATIC_CACHE), request);
        return cached;
      }
      
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, clone);
          });
        }
        return response;
      }).catch(() => cached);
    })
  );
});

// Helper: Check if path is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.woff', '.woff2', '.ttf', '.svg'];
  return staticExtensions.some(ext => pathname.toLowerCase().endsWith(ext));
}

// Helper: Refresh cache in background
function refreshCache(cachePromise, request) {
  if (!navigator.onLine) return;
  
  Promise.resolve(cachePromise).then(cache => {
    fetch(request, { cache: 'reload' })
      .then(response => {
        if (response.ok) {
          cache.put(request, response);
        }
      })
      .catch(() => {});
  });
}

// Message handler for cache control
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    caches.keys().then(names => {
      return Promise.all(names.map(name => caches.delete(name)));
    });
  }
  
  if (event.data && event.data.action === 'cacheUrls') {
    const urls = event.data.urls;
    caches.open(STATIC_CACHE).then(cache => {
      urls.forEach(url => {
        fetch(url).then(response => {
          if (response.ok) cache.put(url, response);
        }).catch(() => {});
      });
    });
  }
});

// Background sync for offline reads
self.addEventListener('sync', event => {
  if (event.tag === 'sync-reads') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_READS' });
        });
      })
    );
  }
});

console.log('[SW] Instant offline-first service worker loaded');
