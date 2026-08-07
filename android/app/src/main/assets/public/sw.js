/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD - SERVICE WORKER v5.1.0 — Aggressive Auto-Update
 * iOS/Android Optimized with Persistent Background Notifications
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ iOS 16.4+ Web Push Support
 * ✅ Android Native Notifications
 * ✅ Periodic Background Sync
 * ✅ Automatic Updates via Version Polling
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const CACHE_VERSION = 'anhad-v10.11.0'; // v10.11.0: Fixed dark mode cards, settings panel lag, and nitnem font change
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const DATA_CACHE = `${CACHE_VERSION}-data`;

// Files to cache immediately
const STATIC_FILES = [
  './',
  'Homepage/ios-homepage.html',
  'Homepage/ios-homepage.css',
  'Homepage/ios-homepage.js',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'version.json',
  'css/nav-glass.css',
  'pwa-register.js',
  'enhanced-functionality.js',
  'js/audio-core.js',
  'lib/global-alarm-system.js',

  // Assets - Icons (CRITICAL: All manifest icons must be listed for cache bust)
  'assets/icon-72x72.png',
  'assets/icon-96x96.png',
  'assets/icon-128x128.png',
  'assets/icon-144x144.png',
  'assets/icon-152x152.png',
  'assets/icon-192x192.png',
  'assets/icon-384x384.png',
  'assets/icon-512x512.png',
  'assets/icon-1024x1024.png',
  'assets/apple-touch-icon.png',
  'assets/favicon-16x16.png',
  'assets/favicon-32x32.png',

  // Audio files for alarms
  'Audio/audio1.mp3',
  'Audio/audio2.mp3',
  'Audio/audio3.mpeg',
  'Audio/audio4.mpeg',
  'Audio/audio5.mpeg',
  'Audio/audio6.mpeg',

  // CSS
  'css/install-button.css',
  'css/anhad-core.css',
  'js/anhad-core.js',
  'offline.html',

  // Library files
  'lib/unified-storage.js',
  'lib/banidb.js',
  'lib/notifications.js',
  'lib/sehajPaathProgress.js',
  'lib/native-notifications.js',
  'lib/ios-android-notifications.js',
  'lib/alarm-persistence.js',
  'lib/keep-alive-worker.js',
  'lib/user-stats.js',
  'lib/share-card.js',
  'lib/smart-back.js',
  'lib/gurbani-db.js',
  'lib/global-mini-player.js',
  'css/global-mini-player.css',

  // Offline-First Gurbani Cache Modules
  'lib/gurbani-local-db.js',
  'lib/gurbani-download-manager.js',
  'lib/bani-cache-optimizer.js',
  'lib/optimized-image-loader.js',
  'lib/sehaj-paath-cache.js',
  'lib/hukamnama-cache.js',

  // Dashboard
  'Dashboard/dashboard.html',

  // Favorites
  'Favorites/favorites.html',

  // Nitnem v2.1 - RENOVATED MODULE (iOS 26++ Design)
  'nitnem/index.html',
  'nitnem/reader.html',
  'nitnem/css/main.css',
  'nitnem/css/category.css',
  'nitnem/css/reader.css',
  'nitnem/js/bani-metadata.js',
  'nitnem/js/banidb-api.js',
  'nitnem/js/hub-app.js',
  'nitnem/js/reader-engine.js',
  'nitnem/data/bani-catalog.json',
  'nitnem/category/nitnem.html',
  'nitnem/category/sggs.html',
  'nitnem/category/dasam.html',
  'nitnem/category/favorites.html',

  // Nitnem legacy files (preserved for backwards compatibility)
  'nitnem/japji-sahib.html',
  'nitnem/jaap-sahib.html',
  'nitnem/anand-sahib.html',
  'nitnem/rehras-sahib.html',
  'nitnem/sohila-sahib.html',
  'nitnem/chaupai-sahib.html',
  'nitnem/tav-prasad-savaiye.html',
  'nitnem/css/nitnem.css',
  'nitnem/css/themes.css',
  'nitnem/css/liquid-glass.css',
  'nitnem/css/setting-panel.css',
  'nitnem/bani-setting-panel.js',
  'nitnem/bani-style.css',

  // NitnemTracker
  'NitnemTracker/nitnem-tracker.html',
  'NitnemTracker/nitnem-tracker.css',
  'NitnemTracker/nitnem-tracker.js',
  'NitnemTracker/components/mala-counter.js',
  'NitnemTracker/components/statistics-engine.js',
  'NitnemTracker/components/streak-engine.js',
  'NitnemTracker/components/report-generator.js',
  'NitnemTracker/data/banis.json',
  'NitnemTracker/data/achievements.json',
  'NitnemTracker/data/maryada-schedule.json',

  // NaamAbhyas
  'NaamAbhyas/naam-abhyas.html',
  'NaamAbhyas/naam-abhyas.css',
  'NaamAbhyas/naam-abhyas.js',
  'NaamAbhyas/naam-abhyas-widget.js',
  'NaamAbhyas/components/ritual-engine.js',
  'NaamAbhyas/components/ritual-overlay.css',
  'NaamAbhyas/components/discipline-metrics.js',
  'NaamAbhyas/components/notification-engine.js',
  'NaamAbhyas/components/audio-manager.js',
  'NaamAbhyas/components/stats-tracker.js',
  'NaamAbhyas/components/timer-engine.js',
  'NaamAbhyas/data/quotes.json',

  // SehajPaath
  'SehajPaath/sehaj-paath.html',
  'SehajPaath/reader.html',
  'SehajPaath/sehaj-paath.css',
  'SehajPaath/sehaj-paath.js',

  // Calendar
  'Calendar/GurpurabCalendar-ios.html',
  'Calendar/gurpurab-calendar-ios.css',
  'Calendar/gurpurab-calendar-ios.js',
  'Calendar/gurupurab-reminders.js',
  'Calendar/nanakshahi-calendar.js',

  // Hukamnama
  'Hukamnama/daily-hukamnama.html',
  'Hukamnama/daily-hukamnama.css',
  'Hukamnama/daily-hukamnama.js',
  'Hukamnama/optical-glass-physics.js',

  // Reminders
  'reminders/smart-reminders-v7.html',
  'reminders/smart-reminders-v7.css',
  'reminders/smart-reminders-v7.js',
  'reminders/smart-reminders-ui.js',
  'reminders/alarm.html',
  'reminders/css/alarm.css',
  'reminders/js/alarm.js',
  'reminders/js/alarm-controller.js',
  'reminders/js/reliable-alarm.js',
  'reminders/js/bg-alarm.js',
  'reminders/js/nitnem-sync.js',

  // PERF FIX: Virtual-live engine and drift UI (precached for offline/instant radio)
  'lib/anhad-audio-singleton.js',
  'lib/useVirtualLive.js',
  'components/LiveDriftBanner.js',

  // Gurbani Radio player files (Correct production player assets)
  'GurbaniRadio/gurbani-radio-amritvela.html',
  'GurbaniRadio/gurbani-radio-darbar.html',
  'GurbaniRadio/gurbani-radio.html',
  'GurbaniRadio/gurbani-radio.js',
  'GurbaniRadio/gurbani-radio-ios.css',
  'GurbaniRadio/gurbani-radio.css',
  'GurbaniRadio/ios17-player.css',
  'GurbaniRadio/ios17-player.js',
  'GurbaniRadio/stream-library.js',

  // Notes
  'Notes/notes.html',
  'Notes/notes-app.css',
  'Notes/notes-manager.js',
  'Notes/notes-ui.js',
  'Notes/notes-integration.js',

  // Guru Portraits (precached for instant, offline load)
  'guruimages/guruamardasji.jpeg',
  'guruimages/guruangaddevsahebji.jpeg',
  'guruimages/guruarjanddevsahebji.jpeg',
  'guruimages/gurugobindsinghsahebji.jpeg',
  'guruimages/gurugranthsahebji.jpeg',
  'guruimages/guruhargobindsahebji.jpeg',
  'guruimages/guruharkrishansahebji.jpeg',
  'guruimages/guruharraisahebji.jpeg',
  'guruimages/gurunanakdevsahebji.jpeg',
  'guruimages/gururamdassahebji.jpeg',
  'guruimages/gurutegbahadursahebji.jpeg',

  // Background WebP Layers (precached for instant, offline load)
  'assets/Darbar-sahib-AMRITVELA.webp',
  'assets/HUKAMNAMA-SAHIB.webp',
  'assets/bangla-sahib.webp',
  'assets/darbar-sahib-day-bg.webp',
  'assets/darbar-sahib-day.webp',
  'assets/darbar-sahib-evening-bg.webp',
  'assets/darbar-sahib-evening.webp',
  'assets/darbar-sahib-morning-bg.webp',
  'assets/darbar-sahib-night-bg.webp',
  'assets/ikonkar_guru-gobind-singh.webp',
  'assets/dasam-granth-transparent.webp',
  'assets/sarbloh-granth-transparent.webp',
  'assets/sggs-transparent.webp',
  'assets/nishan-logo.webp',
  'assets/waheguru-simran-cover.png',

  // Ultra-Compressed WebP Hero Card Images (Instant Loading)
  'assets/HERO CARD IMAGES/morning-darbar-sahib.webp',
  'assets/HERO CARD IMAGES/morning-amritvela-kirtan.webp',
  'assets/HERO CARD IMAGES/morning-waheguru-simran.webp',
  'assets/HERO CARD IMAGES/day-darbar-sahib.webp',
  'assets/HERO CARD IMAGES/day-amritvela-kirtan.webp',
  'assets/HERO CARD IMAGES/day-waheguru-simran.webp',
  'assets/HERO CARD IMAGES/evening-darbar-sahib.webp',
  'assets/HERO CARD IMAGES/evening-amritvela-kirtan.webp',
  'assets/HERO CARD IMAGES/evening-waheguru-simran.webp',
  'assets/HERO CARD IMAGES/night-darbar-sahib.webp',
  'assets/HERO CARD IMAGES/night-amritvela-kirtan.webp',
  'assets/HERO CARD IMAGES/night-waheguru-simran.webp'
];

// Data URLs that need special caching
const DATA_URLS = [
  'data/gurpurab-events.json',
  'data/guru-purabs.json',
  'NitnemTracker/data/banis.json',
  'NitnemTracker/data/achievements.json'
];

const INSTALL_PRECACHE_FILES = [
  './',
  'Homepage/ios-homepage.html',
  'Homepage/ios-homepage.css',
  'Homepage/ios-homepage.js',
  'index.html',
  'manifest.json',
  'offline.html',
  'pwa-register.js',
  'css/theme-variables.css',
  'css/nav-glass.css',
  'css/anhad-core.css',
  'js/anhad-core.js',
  'assets/icon-192x192.png',
  'assets/icon-512x512.png',
  'assets/apple-touch-icon.png',
  'assets/app-logo.webp',
  'assets/HERO CARD IMAGES/morning-darbar-sahib.avif',
  'assets/HERO CARD IMAGES/day-darbar-sahib.avif',
  'assets/HERO CARD IMAGES/evening-darbar-sahib.avif',
  'assets/HERO CARD IMAGES/night-darbar-sahib.avif'
];

// IndexedDB for notification scheduling (Service Worker scope)
const DB_NAME = 'GurbaniRadioSW';
const DB_VERSION = 2;
const STORES = {
  NOTIFICATION_SCHEDULE: 'notification_schedule',
  ALARM_STATE: 'alarm_state'
};

// In-memory timer storage
const timers = new Map();

// Recurring alarm schedules (merged from sw-alarm.js)
const scheduledAlarms = new Map();

// PERF: In-memory dedup set for fired notifications (keyed by 'id_date')
// Replaces the MessageChannel round-trip per notification per sync check.
const _shownToday = new Set();
let _shownTodayDate = '';
function _hasShownToday(id) {
  const today = new Date().toLocaleDateString('en-CA');
  if (today !== _shownTodayDate) {
    _shownToday.clear();
    _shownTodayDate = today;
  }
  return _shownToday.has(id + '_' + today);
}
function _markShownToday(id) {
  const today = new Date().toLocaleDateString('en-CA');
  _shownToday.add(id + '_' + today);
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTALL EVENT - Cache static files but DON'T skip waiting automatically
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static files');
        // Cache files individually to handle failures gracefully
        return Promise.allSettled(
          INSTALL_PRECACHE_FILES.map(file => {
            // Force fetch from network, bypassing HTTP cache
            const request = new Request(file, { cache: 'no-cache' });
            return cache.add(request).catch(() => {
              // Silently ignore cache failures — expected for missing/optional files
              // or when SW base path doesn't match dev server path
              return null;
            });
          })
        );
      })
      .then(() => {
        // Cache data files
        return caches.open(DATA_CACHE).then(cache => {
          return Promise.allSettled(
            DATA_URLS.map(url => {
              const request = new Request(url, { cache: 'no-cache' });
              return cache.add(request).catch(() => null);
            })
          );
        });
      })
      .then(() => {
        console.log('[SW] Pre-caching complete - skipping waiting');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Installation failed:', err);
      })
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVATE EVENT - Clean old caches, claim clients, enable Navigation Preload
// Navigation Preload: browser fetches the navigation resource in parallel with
// SW boot, eliminating the ~100-400ms latency on Android Chrome.
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating - clearing old caches for fresh update...');

  event.waitUntil(
    caches.keys()
      .then(keys => {
        const expectedCaches = [STATIC_CACHE, DYNAMIC_CACHE, DATA_CACHE];

        return Promise.all(
          keys.map(key => {
            if (!expectedCaches.includes(key)) {
              console.log(`[SW] Deleting old cache: ${key}`);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Old caches cleared, claiming clients');
        return self.clients.claim();
      })
      .then(async () => {
        // PERF: Enable Navigation Preload so the browser starts fetching the
        // navigation resource immediately, in parallel with SW startup.
        // This removes SW boot latency from navigation request timing.
        if (self.registration.navigationPreload) {
          await self.registration.navigationPreload.enable();
          console.log('[SW] Navigation Preload enabled');
        }
      })
      .then(() => {
        console.log('[SW] Notifying all clients about update completion');
        // Notify all clients that update is complete
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_UPDATE_COMPLETE',
              version: CACHE_VERSION,
              timestamp: Date.now()
            });
          });
        });
      })
      .catch(err => {
        console.error('[SW] Activation failed:', err);
      })
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// FETCH EVENT - Stale-While-Revalidate for navigations & radio API,
// Network-First for Bani/Hukamnama APIs, Cache-First for static assets.
// Navigation Preload: consume the preload response if available so we don't
// re-fetch the document the browser already started fetching in parallel.
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http
  if (!url.protocol.startsWith('http')) return;

  // NEVER cache sw.js or service-worker.js — browser handles this
  if (url.pathname.endsWith('/sw.js') || url.pathname.endsWith('/service-worker.js')) {
    return;
  }

  // NEVER cache version.json — always go to network for instant update detection
  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response(JSON.stringify({ version: '0.0.0' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // PERF FIX: Radio/Simran live-position API: StaleWhileRevalidate so the radio page
  // PERF FIX: Radio/Simran live-position API — also handle localhost API (dev mode)
  const isRadioApi = (url.hostname.includes('onrender.com') || url.hostname === '127.0.0.1' || url.hostname === 'localhost') &&
    (url.pathname.includes('/api/radio') || url.pathname.includes('/api/simran'));
  if (isRadioApi) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // NEVER cache other /api/ calls — always network-only so state changes propagate immediately
  if (url.pathname.includes('/api/') || url.hostname.includes('onrender.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 1. ONLINE KIRTAN (LIVE STREAMS) -> NETWORK ONLY
  // Detect live audio stream requests (r2.dev webm files, icecast, shoutcast, etc.)
  // IMPORTANT: use .includes('/Audio/') not .startsWith('/Audio/') because SW scope prefix
  // makes paths like /ANHAD-FINAL/frontend/Audio/audio1.mp3 (not /Audio/audio1.mp3)
  const isLiveStream = (
    url.hostname.includes('r2.dev') ||
    url.hostname.includes('listen.samayam') ||
    url.hostname.includes('icecast') ||
    url.hostname.includes('shoutcast') ||
    url.hostname.includes('streaming') ||
    url.pathname.match(/\.m3u8$|\.ts$/) ||
    (url.pathname.match(/\.(mp3|aac|ogg|webm)$/) && !url.pathname.includes('/Audio/'))
  );

  if (isLiveStream) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. HUKAMNAMA & API CALLS -> NETWORK FIRST with Cache Fallback
  // Once fetched, the API result is saved in the cache. If offline, it is loaded from the cache.
  const isApiOrHukamnama = (
    url.hostname.includes('api.banidb.com') ||
    url.hostname.includes('api.gurbaninow.com') ||
    url.pathname.includes('/hukamnama')
  );

  if (isApiOrHukamnama) {
    event.respondWith(networkFirst(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return new Response(JSON.stringify({ error: 'offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }));
    return;
  }

  // 3. HTML NAVIGATION REQUESTS -> STALE-WHILE-REVALIDATE
  // Serve cached HTML immediately (feels instant), then fetch fresh version in
  // background so the next navigation gets updated content.
  // Navigation Preload: if the browser already started fetching, use that response.
  if (event.request.mode === 'navigate') {
    event.respondWith(navigateWithPreload(event).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    }));
    return;
  }

  // 4. ALL OTHER STATIC ASSETS (IMAGES, CSS, JS, AUDIO) -> CACHE FIRST (Offline-first)
  // Serve from cache immediately; if not found in cache, fetch from network and cache it.
  event.respondWith(cacheFirst(event.request).catch(async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }));
});

/**
 * NAVIGATE WITH PRELOAD
 * Uses the Navigation Preload response if available (parallel fetch the browser
 * already started), otherwise falls back to staleWhileRevalidate.
 * This is the fastest possible navigation strategy — zero SW-boot overhead.
 */
async function navigateWithPreload(event) {
  try {
    // Try to use the Navigation Preload response (browser fetched this in parallel)
    const preloadResponse = await event.preloadResponse;
    if (preloadResponse && preloadResponse.ok) {
      // Cache the preload response for next time
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(event.request, preloadResponse.clone()).catch(() => null);
      return preloadResponse;
    }
  } catch (e) {
    // preloadResponse not available or failed — fall through to SWR
  }
  return staleWhileRevalidate(event.request);
}

// Keep dynamic cache bounded. 150 entries is more than enough for all app pages
// and recently visited assets, while preventing unbounded storage growth.
const DYNAMIC_CACHE_MAX = 150;

async function evictDynamicCache(cache) {
  const keys = await cache.keys();
  if (keys.length > DYNAMIC_CACHE_MAX) {
    const toDelete = keys.slice(0, keys.length - DYNAMIC_CACHE_MAX);
    await Promise.all(toDelete.map(k => cache.delete(k)));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  // Only return cache if it's a valid response (not a stale 503/error response)
  if (cached && cached.ok) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone());
      evictDynamicCache(cache); // fire-and-forget eviction
    } else if (cached) {
      // Server returned error but we have a (possibly stale) cached copy — use it
      return cached;
    }
    return response;
  } catch (error) {
    // Network failed — try cached even if it was an error response
    if (cached) return cached;
    // For navigation requests serve the offline page; for assets return 503
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) return offlinePage;
      const fallback = await caches.match('/index.html');
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * STALE-WHILE-REVALIDATE strategy
 * Returns cached version immediately (fast), but updates cache in background.
 * This is the KEY strategy for instant auto-updates in PWAs:
 * - User gets instant page load from cache
 * - Fresh version is fetched in background and stored
 * - Next page load serves the updated version
 * - Combined with version.json polling, the page auto-reloads within seconds
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);

  // If cached entry is a bad response (503/error), delete it and go network-first
  if (cached && !cached.ok) {
    cache.delete(request).catch(() => null);
  }

  // Always fetch fresh in background
  const networkPromise = fetch(request).then(response => {
    if (response && response.ok) {
      try {
        cache.put(request, response.clone());
      } catch (e) {
        // Silently handle clone errors for already-consumed response bodies
      }
    }
    return response;
  }).catch(() => null);

  // If we have a cached version, return it immediately.
  // FIX: `networkPromise` alone is a no-op statement — must call .catch() to
  // attach a handler and actually keep the Promise alive for background execution.
  if (cached) {
    networkPromise.catch(() => null); // fire-and-forget; updates cache in background
    return cached;
  }

  // No cache — must wait for network
  const networkResponse = await networkPromise;
  if (networkResponse) return networkResponse;

  // Last resort fallback
  if (request.mode === 'navigate') {
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) return offlinePage;
    const fallback = await caches.match('/index.html');
    if (fallback) return fallback;
  }
  return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLER - For skip waiting and other commands
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received - activating new service worker');
    self.skipWaiting();
  }

  // VERSION_CHECK: Client polls this to detect if SW version changed
  if (event.data?.type === 'VERSION_CHECK') {
    event.ports?.[0]?.postMessage({
      type: 'VERSION_RESPONSE',
      version: CACHE_VERSION,
      timestamp: Date.now()
    });
  }

  if (event.data?.type === 'FORCE_CACHE_CLEAR') {
    console.log('[SW] FORCE_CACHE_CLEAR received - clearing all caches');
    event.waitUntil(
      caches.keys().then(keys => {
        return Promise.all(keys.map(key => {
          console.log(`[SW] Force deleting cache: ${key}`);
          return caches.delete(key);
        }));
      })
    );
  }

  if (event.data?.type === 'SCHEDULE_NOTIFICATION' && event.data.payload) {
    // Save to IndexedDB for background persistence (critical for closed-tab reliability)
    saveAlarmToDB(event.data.payload);
    // Also schedule in-memory for immediate response
    scheduleNotification(event.data.payload);
  }

  // Handle CLEAR_NAAM_ALARMS message from client when disabling Naam Abhyas
  if (event.data?.type === 'CLEAR_NAAM_ALARMS') {
    clearAllNaamAlarms();
  }

  if (event.data?.type === 'CANCEL_NOTIFICATION' && event.data.payload?.id) {
    cancelNotification(event.data.payload.id);
  }

  if (event.data?.type === 'SET_ALARMS' && Array.isArray(event.data.alarms)) {
    console.log('[SW] Received SET_ALARMS with', event.data.alarms.length, 'alarms');
    event.data.alarms.forEach(alarm => {
      const notifPayload = {
        id: alarm.id,
        title: alarm.title,
        body: alarm.type === 'naamAbhyas'
          ? 'Leave all work. Remember Vaheguru. ਵਾਹਿਗੁਰੂ'
          : `Time for ${alarm.title}`,
        scheduledTime: getNextAlarmTime(alarm.time),
        data: {
          url: alarm.type === 'naamAbhyas'
            ? '/NaamAbhyas/naam-abhyas.html?autoStart=true'
            : `/reminders/alarm.html?id=${alarm.id}&title=${encodeURIComponent(alarm.title)}`,
          type: alarm.type,
          alarmData: alarm.data
        },
        tag: alarm.type === 'naamAbhyas' ? `naam-abhyas-${alarm.id}` : `smart-reminder-${alarm.id}`,
        requireInteraction: true,
        actions: alarm.type === 'naamAbhyas'
          ? [{ action: 'start', title: '🙏 Start' }, { action: 'snooze', title: 'Snooze' }]
          : [{ action: 'open', title: 'Open' }, { action: 'snooze', title: 'Snooze' }]
      };
      scheduleNotification(notifPayload);
    });
  }

  // Handle PWA installation - register all alarms from localStorage
  if (event.data?.type === 'PWA_INSTALLED') {
    console.log('[SW] PWA installed, checking for persisted alarms...');
    // Alarms are now persisted in 'pwa_scheduled_alarms' localStorage key by pwa-register.js
    // We'll check them on the next periodic sync
    checkAndFireScheduledNotifications();
  }

  // ── Alarm scheduling messages (merged from sw-alarm.js) ──
  const { type: msgType, data: msgData } = event.data || {};

  if (msgType === 'SCHEDULE_ALARMS' && Array.isArray(msgData?.alarms)) {
    scheduleAlarms(msgData.alarms);
  }

  if (msgType === 'SCHEDULE_ALARM' && msgData?.alarm) {
    scheduleAlarm(msgData.alarm);
  }

  if (msgType === 'CANCEL_ALARM' && msgData?.alarmId) {
    cancelAlarm(msgData.alarmId);
  }

  if (msgType === 'SNOOZE_ALARM' && msgData?.alarmId) {
    snoozeAlarm(msgData.alarmId, msgData.minutes ?? 5);
  }

  if (msgType === 'CHECK_ALARMS') {
    checkAndTriggerAlarms();
  }

  if (msgType === 'GET_STATUS') {
    event.ports[0]?.postMessage({
      version: CACHE_VERSION,
      scheduledCount: scheduledAlarms.size,
      alarms: Array.from(scheduledAlarms.keys())
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND SYNC - For data synchronization
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tracker-data') {
    event.waitUntil(syncTrackerData());
  }
});

async function syncTrackerData() {
  // Sync any pending tracker data when online
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_COMPLETE' });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERIODIC BACKGROUND SYNC - For persistent notifications even when app is closed
// This is the KEY feature for iOS/Android persistent notifications
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);

  if (event.tag === 'anhad-notification-check') {
    event.waitUntil(
      Promise.all([
        checkAndFireScheduledNotifications(),
        checkNaamAbhyasSchedule(),
        checkRandomSpiritualNotifications()
      ])
    );
  }

  if (event.tag === 'anhad-daily-reminders') {
    event.waitUntil(scheduleDailyReminders());
  }

  // Handle one-time sync registrations
  if (event.tag === 'anhad-alarm-sync') {
    event.waitUntil(checkAndFireScheduledNotifications());
  }
});

// Check scheduled notifications and fire any that are due
async function checkAndFireScheduledNotifications() {
  // PERF FIX: Replaced per-notification MessageChannel round-trips (was blocking
  // the SW thread for up to 7 * N_clients * 100ms per periodic sync) with a
  // fast in-memory Set check that is O(1) and purely synchronous.

  // Quick Capacitor check — if any client URL contains 'capacitor://' skip SW notifs
  const clients = await self.clients.matchAll({ type: 'window' });
  const isCapacitor = clients.some(c => c.url && c.url.startsWith('capacitor://'));
  if (isCapacitor) return;

  const now = Date.now();
  const today = new Date().toLocaleDateString('en-CA');

  const spiritualNotifications = [
    {
      id: 'hukamnama_morning',
      title: '📜 ਅੱਜ ਦਾ ਹੁਕਮਨਾਮਾ | Ajj da Hukamnama',
      body: 'Ajj da Hukamnama Sahib read kr lya tuc? Je nhi ta hune kr skde ho',
      timeRanges: [[6, 10], [12, 14]], // 6-10 AM or 12-2 PM
      url: '/Hukamnama/daily-hukamnama.html',
      icon: '📜'
    },
    {
      id: 'nitnem_reminder',
      title: '🙏 ਨਿਤਨੇਮ ਯਾਦ | Nitnem Reminder',
      body: 'Nitnem da time hai ji. Aao Gurbani pdhiye',
      timeRanges: [[5, 9], [18, 20]], // 5-9 AM or 6-8 PM
      url: '/nitnem/index.html',
      icon: '🙏'
    },
    {
      id: 'kirtan_time',
      title: '🎵 ਕੀਰਤਨ ਸੁਣੋ | Kirtan Sunno',
      body: 'Kujh der Kirtan sun lo. Rabb di yaad ch lin karo',
      timeRanges: [[8, 12], [15, 19]], // 8 AM-12 PM or 3-7 PM
      url: '/GurbaniRadio/gurbani-radio.html',
      icon: '🎵'
    },
    {
      id: 'simran_reminder',
      title: '☬ ਵਾਹਿਗੁਰੂ ਸਿਮਰਨ | Vaheguru Simran',
      body: 'Waheguru Simran sun ke mn ko shant kro',
      timeRanges: [[7, 11], [13, 17], [20, 22]], // 7-11 AM, 1-5 PM, 8-10 PM
      url: '/GurbaniRadio/gurbani-radio.html?stream=simran',
      icon: '☬'
    },
    {
      id: 'gurpurab_reminder',
      title: '🌸 ਗੁਰਪੁਰਬ ਯਾਦ | Gurpurab Yaad',
      body: 'Ajj koi Gurpurab ya important din hai? Check kro',
      timeRanges: [[9, 12], [17, 20]], // 9 AM-12 PM or 5-8 PM
      url: '/index.html',
      icon: '🌸'
    },
    {
      id: 'guru_sikhya',
      title: '💎 ਗੁਰੂ ਦੀ ਸਿੱਖਿਆ | Guru di Sikhya',
      body: 'Ajj Guru Ji di ik sikhya yaad rakhiye',
      timeRanges: [[10, 14], [16, 21]], // 10 AM-2 PM or 4-9 PM
      url: '/index.html',
      icon: '💎'
    }
  ];

  // Check and fire spiritual notifications
  for (const notif of spiritualNotifications) {
    // Check if current time falls in any of the time ranges
    const currentHour = new Date().getHours();
    const inTimeRange = notif.timeRanges.some(([start, end]) => currentHour >= start && currentHour < end);
    
    if (!inTimeRange) continue;
    if (_hasShownToday(notif.id)) continue;

    // Random chance to fire (20% per check to avoid spam)
    if (Math.random() > 0.2) continue;

    try {
      await self.registration.showNotification(notif.title, {
        body: notif.body,
        icon: '/assets/icon-192x192.png',
        badge: '/assets/icon-72x72.png',
        tag: notif.id,
        data: { url: notif.url },
        requireInteraction: false,
        actions: [
          { action: 'open', title: 'Open' },
          { action: 'dismiss', title: 'Later' }
        ]
      });
      _markShownToday(notif.id);
      console.log(`[SW] Fired spiritual notification: ${notif.title}`);
    } catch (e) {
      console.error('[SW] Failed to show spiritual notification:', e);
    }
  }

  const defaultNotifications = [
    {
      id: 'amritvela',
      title: 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ | Amrit Vela',
      body: 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਸਚੁ ਨਾਉ ਵਡਿਆਈ ਵੀਚਾਰੁ॥ Wake up for Amrit Vela meditation',
      hour: 4, minute: 0,
      icon: 'assets/Darbar-sahib-AMRITVELA.webp'
    },
    {
      id: 'hukamnama',
      title: 'ਅੱਜ ਦਾ ਹੁਕਮਨਾਮਾ | Daily Hukamnama',
      body: 'Read today\'s sacred command from Sri Guru Granth Sahib Ji',
      hour: 6, minute: 0,
      icon: 'assets/icon-192x192.png'
    },
    {
      id: 'rehras',
      title: 'ਰਹਿਰਾਸ ਸਾਹਿਬ | Rehras Sahib',
      body: 'Time for evening prayers - ਸੰਝ ਦੀ ਬੰਦਗੀ ਦਾ ਸਮਾਂ',
      hour: 18, minute: 30,
      icon: 'assets/icon-192x192.png'
    },
    {
      id: 'nitnem_morning',
      title: 'ਨਿਤਨੇਮ ਦਾ ਸਮਾਂ | Nitnem Time',
      body: 'ਸਵੇਰ ਦੀ ਬਾਣੀ ਦਾ ਸਮਾਂ ਹੋ ਗਿਆ ਹੈ — Start your morning Nitnem',
      hour: 4, minute: 30,
      icon: 'assets/icon-192x192.png'
    },
    {
      id: 'kirtan',
      title: 'ਕੀਰਤਨ ਦਰਬਾਰ | Evening Kirtan',
      body: 'ਸ਼ਾਮ ਦੇ ਕੀਰਤਨ ਸੁਣੋ — Listen to evening kirtan and feel divine peace',
      hour: 17, minute: 0,
      icon: 'assets/Darbar-sahib-AMRITVELA.webp'
    },
    {
      id: 'sohila',
      title: 'ਸੋਹਿਲਾ ਸਾਹਿਬ | Sohila Sahib',
      body: 'Time for night prayers before sleep - ਸੌਣ ਤੋਂ ਪਹਿਲਾਂ ਸੋਹਿਲਾ ਸਾਹਿਬ',
      hour: 21, minute: 30,
      icon: 'assets/icon-192x192.png'
    },
    {
      id: 'nitnem_pending',
      title: 'ਨਿਤਨੇਮ ਬਾਕੀ | Nitnem Pending',
      body: 'ਅੱਜ ਦਾ ਨਿਤਨੇਮ ਅਜੇ ਬਾਕੀ ਹੈ — Complete your Nitnem before the day ends',
      hour: 19, minute: 0,
      icon: 'assets/icon-192x192.png'
    }
  ];

  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();

  for (const notif of defaultNotifications) {
    const notifTime = notif.hour * 60 + notif.minute;
    const currentTime = currentHour * 60 + currentMinute;
    const timeDiff = currentTime - notifTime;

    // Fire if within 0-15 minute window
    if (timeDiff >= 0 && timeDiff <= 15) {
      // O(1) in-memory check — no MessageChannel round-trips
      if (!_hasShownToday(notif.id)) {
        await self.registration.showNotification(notif.title, {
          body: notif.body,
          icon: notif.icon || 'assets/icon-192x192.png',
          badge: 'assets/icon-72x72.png',
          tag: `anhad-${notif.id}`,
          renotify: true,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 400],
          data: {
            url: notif.id === 'hukamnama' ? 'Hukamnama/daily-hukamnama.html'
              : notif.id === 'kirtan' ? 'index.html'
                : (notif.id === 'nitnem_morning' || notif.id === 'nitnem_pending') ? 'NitnemTracker/nitnem-tracker.html'
                  : 'reminders/smart-reminders-v7.html',
            id: notif.id,
            timestamp: now
          },
          actions: [
            { action: 'open', title: 'Open' },
            { action: 'snooze', title: 'Snooze 5min' }
          ]
        });

        _markShownToday(notif.id);
        // Inform open clients (fire-and-forget, no await)
        const shownKey = `anhad_${notif.id}_shown_${today}`;
        clients.forEach(c => c.postMessage({ type: 'NOTIFICATION_SHOWN', key: shownKey, id: notif.id }));
      }
    }
  }
}

// Schedule daily reminders at midnight
async function scheduleDailyReminders() {
  console.log('[SW] Scheduling daily reminders...');

  // Re-check all notifications for the new day
  await checkAndFireScheduledNotifications();
  await checkNaamAbhyasSchedule();
  await checkRandomSpiritualNotifications();
}

// ═══════════════════════════════════════════════════════════════════════════════
// RANDOM SPIRITUAL NOTIFICATIONS CHECKER
// Reads from IndexedDB 'random_spiritual_notifs' store and fires any due ones
// ═══════════════════════════════════════════════════════════════════════════════
async function checkRandomSpiritualNotifications() {
  const DB_NAME = 'GurbaniRadioSW';
  const STORE_NAME = 'random_spiritual_notifs';

  try {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 3);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onupgradeneeded = (event) => {
        const d = event.target.result;
        if (!d.objectStoreNames.contains('notification_schedule')) {
          const ns = d.createObjectStore('notification_schedule', { keyPath: 'id' });
          ns.createIndex('scheduledTime', 'scheduledTime', { unique: false });
          ns.createIndex('fired', 'fired', { unique: false });
        }
        if (!d.objectStoreNames.contains(STORE_NAME)) {
          const rs = d.createObjectStore(STORE_NAME, { keyPath: 'id' });
          rs.createIndex('scheduledTime', 'scheduledTime', { unique: false });
          rs.createIndex('fired', 'fired', { unique: false });
        }
      };
    });

    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.close();
      return;
    }

    const now = Date.now();
    const firedIds = [];

    // Get all unfired notifications
    const notifs = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    for (const notif of notifs) {
      if (notif.fired) continue;
      const timeDiff = now - notif.scheduledTime;
      // Fire if within -1min to +20min window (generous to catch periodic sync gaps)
      if (timeDiff >= -60000 && timeDiff <= 1200000) {
        if (!_hasShownToday(notif.id)) {
          await self.registration.showNotification(notif.title, {
            body: notif.body,
            icon: notif.icon || 'assets/icon-192x192.png',
            badge: 'assets/icon-72x72.png',
            tag: notif.tag || `spiritual-${notif.id}`,
            renotify: true,
            requireInteraction: false,
            vibrate: [100, 50, 100],
            data: notif.data || { url: 'index.html', type: 'spiritualNudge' },
            actions: [
              { action: 'open', title: 'Open' },
              { action: 'dismiss', title: 'Later' }
            ]
          });
          _markShownToday(notif.id);
          firedIds.push(notif.id);
          console.log(`[SW] 🔔 Random spiritual notif fired: ${notif.id}`);
        }
      }
    }

    // Mark fired notifications in DB
    if (firedIds.length > 0) {
      const tx2 = db.transaction(STORE_NAME, 'readwrite');
      const store2 = tx2.objectStore(STORE_NAME);
      for (const id of firedIds) {
        const getReq = store2.get(id);
        getReq.onsuccess = () => {
          if (getReq.result) {
            getReq.result.fired = true;
            store2.put(getReq.result);
          }
        };
      }
    }

    db.close();
  } catch (e) {
    console.warn('[SW] checkRandomSpiritualNotifications failed:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAAM ABHYAS SPECIFIC NOTIFICATION CHECKER
// Checks localStorage for Naam Abhyas schedule and fires notifications
// ═══════════════════════════════════════════════════════════════════════════════
async function checkNaamAbhyasSchedule() {
  console.log('[SW] Checking Naam Abhyas schedule...');

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const today = now.toLocaleDateString('en-CA');

  // ─── STRATEGY 1: Try to get schedule from connected clients (most accurate) ───
  const clients = await self.clients.matchAll({ type: 'window' });

  if (clients.length > 0) {
    for (const client of clients) {
      try {
        const response = await new Promise((resolve) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = (e) => resolve(e.data);
          client.postMessage({
            type: 'GET_NAAM_ABHYAS_SCHEDULE',
            currentHour,
            currentMinute,
            today
          }, [channel.port2]);
          setTimeout(() => resolve(null), 500);
        });

        if (response?.sessions) {
          // Check each session from client
          for (const session of response.sessions) {
            await checkAndFireSession(session, today, currentHour, currentMinute, client);
          }
          return; // Successfully checked via client
        }
      } catch (e) {
        console.warn('[SW] Error checking Naam Abhyas with client:', e);
      }
    }
  }

  // ─── STRATEGY 2: Fallback to IndexedDB (works even when no clients open) ───
  console.log('[SW] No clients available, checking IndexedDB for alarms...');
  await checkAndFireAlarmsFromDB(today, currentHour, currentMinute);
}

/**
 * Check a single session and fire notification if due
 */
async function checkAndFireSession(session, today, currentHour, currentMinute, client) {
  const sessionTime = session.hour * 60 + session.startMinute;
  const currentTime = currentHour * 60 + currentMinute;
  const timeDiff = currentTime - sessionTime;

  // Fire if within 0-15 minute window and not already notified
  if (timeDiff >= 0 && timeDiff <= 15 && !session.notified) {
    await fireNaamNotification(session, today);

    // Notify client that notification was shown
    client.postMessage({
      type: 'NAAM_ABHYAS_NOTIFIED',
      hour: session.hour,
      today: today
    });
  }
}

/**
 * Check IndexedDB for pending alarms and fire them
 */
async function checkAndFireAlarmsFromDB(today, currentHour, currentMinute) {
  try {
    const pendingAlarms = await getPendingAlarmsFromDB();
    const currentTime = currentHour * 60 + currentMinute;

    console.log(`[SW] Found ${pendingAlarms.length} pending alarms in DB`);

    for (const alarm of pendingAlarms) {
      // Check if alarm is for today
      const alarmDate = new Date(alarm.scheduledTime);
      const alarmToday = alarmDate.toLocaleDateString('en-CA');

      if (alarmToday !== today) {
        continue; // Skip alarms for other days
      }

      const alarmTime = alarm.hour * 60 + alarm.startMinute;
      const timeDiff = currentTime - alarmTime;

      // Fire if within 0-15 minute window
      if (timeDiff >= 0 && timeDiff <= 15) {
        await fireNaamNotification({
          hour: alarm.hour,
          startMinute: alarm.startMinute,
          duration: alarm.duration || 2  // Fallback to 2 minutes if not specified
        }, today);

        // Mark as fired in DB
        await markAlarmAsFired(alarm.id);
      }
    }

    // Cleanup old alarms periodically
    await cleanupOldAlarms();
  } catch (e) {
    console.error('[SW] Error checking alarms from DB:', e);
  }
}

/**
 * Fire the actual Naam Abhyas notification
 */
async function fireNaamNotification(session, today) {
  await self.registration.showNotification('🙏 ਨਾਮ ਅਭਿਆਸ | Naam Abhyas', {
    body: `Leave all work. Remember Vaheguru for ${session.duration || 2} minutes.`,
    icon: '/assets/icon-192x192.png',
    badge: '/assets/icon-72x72.png',
    tag: `naam-abhyas-${today}-${session.hour}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 500],
    data: {
      url: 'NaamAbhyas/naam-abhyas.html?autoStart=true',
      type: 'naamAbhyas',
      hour: session.hour,
      startMinute: session.startMinute
    },
    actions: [
      { action: 'start', title: '🙏 Start Now' },
      { action: 'snooze', title: 'Snooze 5min' }
    ]
  });

  console.log(`[SW] 🔔 Naam Abhyas notification fired for hour ${session.hour}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATION HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'Time for your spiritual practice',
    icon: '/assets/icon-192x192.png',
    badge: '/assets/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'gurbani-reminder',
    renotify: true,
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Gurbani Radio', options)
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CLICK HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const notification = event.notification;
  const data = notification.data || {};

  notification.close();

  // Handle different actions
  if (action === 'snooze') {
    // Snooze for 5 minutes
    event.waitUntil(
      (async () => {
        const snoozeTime = Date.now() + (5 * 60 * 1000); // 5 minutes

        // Reschedule notification
        scheduleNotification({
          id: `${data.id || 'snooze'}-snoozed-${Date.now()}`,
          title: `⏰ ${notification.title}`,
          body: notification.body,
          scheduledTime: snoozeTime,
          data: data,
          tag: notification.tag,
          requireInteraction: true
        });

        // Notify user
        await self.registration.showNotification('Snoozed for 5 minutes', {
          body: `${notification.title} will remind you again`,
          icon: '/assets/icon-192x192.png',
          badge: '/assets/icon-72x72.png',
          tag: 'snooze-confirmation',
          silent: true
        });

        console.log('[SW] Notification snoozed:', data.id);
      })()
    );
    return;
  }

  if (action === 'dismiss') {
    if (data.alarmId) recordAlarmResponse(data.alarmId, 'completed');
    console.log('[SW] Notification dismissed:', data.id);
    return;
  }

  // Handle Naam Abhyas 'start' action - open page with auto-start param
  if (action === 'start' && data.type === 'naamAbhyas') {
    const startUrl = `/NaamAbhyas/naam-abhyas.html?autoStart=true&hour=${data.hour || ''}&minute=${data.startMinute || ''}`;
    event.waitUntil(
      self.clients.openWindow(startUrl).then(windowClient => {
        console.log('[SW] Naam Abhyas auto-start triggered');
        return windowClient;
      })
    );
    return;
  }

  // Default action (open) or notification body click
  const urlToOpen = data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientList => {
      // Check if already open
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);

        if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window
      return self.clients.openWindow(urlToOpen);
    })
  );
});


// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CLOSE HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data || {};
  if (data.alarmId) recordAlarmResponse(data.alarmId, 'missed');
});

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION SCHEDULING HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function scheduleNotification(entry) {
  if (!entry || !entry.id) return;

  const delay = entry.scheduledTime - Date.now();

  // If already past due, fire immediately
  if (delay <= 0) {
    return showNotification(entry);
  }

  // Clear existing timer
  if (timers.has(entry.id)) {
    clearTimeout(timers.get(entry.id));
  }

  // Max delay for setTimeout is ~24.8 days
  const MAX_DELAY_MS = 2147483647;
  if (delay > MAX_DELAY_MS) {
    console.log(`[SW] Notification ${entry.id} too far in future`);
    return;
  }

  const timerId = setTimeout(async () => {
    await showNotification(entry);

    // If it's a recurring alarm, schedule next occurrence
    if (entry.recurring) {
      const nextTime = entry.scheduledTime + (24 * 60 * 60 * 1000);
      scheduleNotification({ ...entry, scheduledTime: nextTime });
    }
  }, delay);

  timers.set(entry.id, timerId);
  console.log(`[SW] Scheduled ${entry.id} for ${new Date(entry.scheduledTime).toLocaleString()}`);
}

function cancelNotification(id) {
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
    timers.delete(id);
  }
}

async function showNotification(entry) {
  try {
    await self.registration.showNotification(entry.title || 'Gurbani Radio', {
      body: entry.body || '',
      tag: entry.tag || entry.id,
      icon: entry.icon || '/assets/icon-192x192.png',
      badge: entry.badge || '/assets/icon-72x72.png',
      requireInteraction: !!entry.requireInteraction,
      vibrate: [200, 100, 200, 100, 200],
      data: entry.data || {},
      actions: entry.actions || [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });

    console.log(`[SW] Notification shown: ${entry.title}`);
  } catch (e) {
    console.error('[SW] Notification error:', e);
  }
}

function getNextAlarmTime(timeStr) {
  if (!timeStr) return Date.now() + 60000;

  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const alarm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);

  if (alarm <= now) {
    alarm.setDate(alarm.getDate() + 1);
  }

  return alarm.getTime();
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECURRING ALARM FUNCTIONS (merged from sw-alarm.js)
// ═══════════════════════════════════════════════════════════════════════════════

function scheduleAlarms(alarms) {
  scheduledAlarms.forEach(a => { if (a.timeoutId) clearTimeout(a.timeoutId); });
  scheduledAlarms.clear();
  alarms.forEach(alarm => { if (alarm.enabled) scheduleAlarm(alarm); });
  console.log(`[SW] Scheduled ${scheduledAlarms.size} recurring alarms`);
}

function scheduleAlarm(alarm) {
  const delay = calculateDelay(alarm.time, alarm.days);
  if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return;

  const timeoutId = setTimeout(() => {
    triggerAlarm(alarm);
    scheduleAlarm(alarm); // auto-reschedule for next occurrence
  }, delay);

  scheduledAlarms.set(alarm.id, { ...alarm, timeoutId, scheduledFor: new Date(Date.now() + delay) });
  console.log(`[SW] ${alarm.label || alarm.id} → ${new Date(Date.now() + delay).toLocaleTimeString()}`);
}

function cancelAlarm(alarmId) {
  const alarm = scheduledAlarms.get(alarmId);
  if (alarm?.timeoutId) clearTimeout(alarm.timeoutId);
  scheduledAlarms.delete(alarmId);
}

function snoozeAlarm(alarmId, minutes = 5) {
  const alarm = scheduledAlarms.get(alarmId);
  if (!alarm) return;
  if (alarm.timeoutId) clearTimeout(alarm.timeoutId);
  const delay = minutes * 60 * 1000;
  const timeoutId = setTimeout(() => triggerAlarm(alarm), delay);
  scheduledAlarms.set(alarmId + '_snooze', {
    ...alarm, timeoutId, isSnooze: true, scheduledFor: new Date(Date.now() + delay)
  });
}

function calculateDelay(time24, days = null) {
  const now = new Date();
  const [h, m] = time24.split(':').map(Number);
  let next = new Date();
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  if (days && days.length > 0 && days.length < 7) {
    let i = 0;
    while (i++ < 7 && !days.includes(next.getDay())) next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

async function triggerAlarm(alarm) {
  console.log(`[SW] 🔔 Alarm: ${alarm.label || alarm.id}`);
  const title = `🙏 ${alarm.label || 'Gurbani Reminder'}`;
  const body = alarm.gurmukhi
    ? `${alarm.gurmukhi} — ਸਮਾਂ ਹੋ ਗਿਆ`
    : `Time for ${alarm.label || 'your spiritual practice'}`;
  try {
    await self.registration.showNotification(title, {
      body,
      icon: '/assets/icon-192x192.png',
      badge: '/assets/icon-72x72.png',
      tag: `alarm-${alarm.id}`,
      requireInteraction: true,
      renotify: true,
      vibrate: [500, 200, 500, 200, 500, 200, 500],
      actions: [
        { action: 'dismiss', title: "✓ I'm Up!" },
        { action: 'snooze', title: '😴 Snooze 5min' }
      ],
      data: { alarm, alarmId: alarm.id, url: `/reminders/alarm.html?id=${alarm.id}`, timestamp: Date.now() }
    });
  } catch (e) {
    console.error('[SW] Alarm notification error:', e);
  }
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(c => c.postMessage({ type: 'ALARM_TRIGGER', data: { alarm } }));
  if (clients.length === 0) self.clients.openWindow(`/reminders/alarm.html?id=${alarm.id}`);
}

async function recordAlarmResponse(alarmId, status) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(c => c.postMessage({
    type: 'ALARM_RESPONSE',
    data: { alarmId, status, timestamp: new Date().toISOString() }
  }));
}

function checkAndTriggerAlarms() {
  const now = new Date();
  scheduledAlarms.forEach((alarm, id) => {
    if (alarm.scheduledFor && alarm.scheduledFor <= now) {
      triggerAlarm(alarm);
      scheduledAlarms.delete(id);
    }
  });
}

// Fallback: check recurring alarms every minute in case setTimeout drifted
setInterval(checkAndTriggerAlarms, 60000);

console.log('[SW] ANHAD Service Worker v5.8.0 loaded - iOS/Android optimized');

// ═══════════════════════════════════════════════════════════════════════════════
// INDEXEDDB HELPERS - Naam Abhyas Alarm Persistence
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Open IndexedDB connection
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Store for Naam Abhyas scheduled alarms
      if (!db.objectStoreNames.contains(STORES.NOTIFICATION_SCHEDULE)) {
        const store = db.createObjectStore(STORES.NOTIFICATION_SCHEDULE, { keyPath: 'id' });
        store.createIndex('scheduledTime', 'scheduledTime', { unique: false });
        store.createIndex('fired', 'fired', { unique: false });
      }
      // Store for general alarm state
      if (!db.objectStoreNames.contains(STORES.ALARM_STATE)) {
        db.createObjectStore(STORES.ALARM_STATE, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Save Naam Abhyas alarm to IndexedDB
 * @param {Object} alarm - Alarm data
 * @returns {Promise<void>}
 */
async function saveAlarmToDB(alarm) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.NOTIFICATION_SCHEDULE, 'readwrite');
    const store = tx.objectStore(STORES.NOTIFICATION_SCHEDULE);

    const entry = {
      id: alarm.id || `naam_${alarm.hour}_${alarm.startMinute}_${Date.now()}`,
      title: alarm.title || '🙏 ਨਾਮ ਅਭਿਆਸ | Naam Abhyas',
      body: alarm.body || `Leave all work. Remember Vaheguru for ${alarm.duration || 2} minutes.`,
      scheduledTime: alarm.scheduledTime || new Date().getTime(),
      hour: alarm.hour,
      startMinute: alarm.startMinute,
      duration: alarm.duration || 2,
      fired: false,
      createdAt: Date.now(),
      data: alarm.data || {}
    };

    await new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log(`[SW] 💾 Alarm saved to IndexedDB: ${entry.id}`);
    db.close();
  } catch (e) {
    console.error('[SW] Failed to save alarm to IndexedDB:', e);
  }
}

/**
 * Get pending alarms from IndexedDB
 * @returns {Promise<Array>}
 */
async function getPendingAlarmsFromDB() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.NOTIFICATION_SCHEDULE, 'readonly');
    const store = tx.objectStore(STORES.NOTIFICATION_SCHEDULE);
    const index = store.index('fired');

    const alarms = await new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return alarms;
  } catch (e) {
    console.error('[SW] Failed to get alarms from IndexedDB:', e);
    return [];
  }
}

/**
 * Mark alarm as fired in IndexedDB
 * @param {string} id - Alarm ID
 * @returns {Promise<void>}
 */
async function markAlarmAsFired(id) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.NOTIFICATION_SCHEDULE, 'readwrite');
    const store = tx.objectStore(STORES.NOTIFICATION_SCHEDULE);

    const alarm = await new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (alarm) {
      alarm.fired = true;
      alarm.firedAt = Date.now();
      await new Promise((resolve, reject) => {
        const request = store.put(alarm);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      console.log(`[SW] ✅ Alarm marked as fired: ${id}`);
    }

    db.close();
  } catch (e) {
    console.error('[SW] Failed to mark alarm as fired:', e);
  }
}

/**
 * Cleanup old fired alarms (older than 24 hours)
 * @returns {Promise<void>}
 */
async function cleanupOldAlarms() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.NOTIFICATION_SCHEDULE, 'readwrite');
    const store = tx.objectStore(STORES.NOTIFICATION_SCHEDULE);

    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    const allAlarms = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    let cleaned = 0;
    for (const alarm of allAlarms) {
      if (alarm.fired && alarm.firedAt && alarm.firedAt < cutoff) {
        await new Promise((resolve, reject) => {
          const request = store.delete(alarm.id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[SW] 🧹 Cleaned up ${cleaned} old alarms`);
    }

    db.close();
  } catch (e) {
    console.error('[SW] Failed to cleanup old alarms:', e);
  }
}

/**
 * Clear all Naam Abhyas alarms from IndexedDB
 * @returns {Promise<void>}
 */
async function clearAllNaamAlarms() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.NOTIFICATION_SCHEDULE, 'readwrite');
    const store = tx.objectStore(STORES.NOTIFICATION_SCHEDULE);

    const allAlarms = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    for (const alarm of allAlarms) {
      if (alarm.id && alarm.id.startsWith('naam_')) {
        await new Promise((resolve, reject) => {
          const request = store.delete(alarm.id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    }

    console.log('[SW] 🗑️ Cleared all Naam Abhyas alarms from DB');
    db.close();
  } catch (e) {
    console.error('[SW] Failed to clear Naam alarms:', e);
  }
}
