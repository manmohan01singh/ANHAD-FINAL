/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD - SERVICE WORKER v3.0.0
 * iOS/Android Optimized with Persistent Background Notifications
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ iOS 16.4+ Web Push Support
 * ✅ Android Native Notifications
 * ✅ Periodic Background Sync
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const CACHE_VERSION = 'anhad-v3.8.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const DATA_CACHE = `${CACHE_VERSION}-data`;

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/pwa-register.js',
  '/enhanced-functionality.js',
  '/js/audio-core.js',
  '/lib/global-alarm-system.js',

  // Assets
  // Removed missing SVG files: favicon.svg, khanda-authentic.svg

  // Audio files for alarms
  '/Audio/audio1.mp3',
  '/Audio/audio2.mp3',
  '/Audio/audio3.mpeg',
  '/Audio/audio4.mpeg',
  '/Audio/audio5.mpeg',
  '/Audio/audio6.mpeg',

  // CSS
  '/css/ios-glass.css',
  '/css/unified-glass-system.css',
  '/css/anhad-install.css',
  '/css/ios-liquid-glass.css',
  '/css/anhad-core.css',
  '/js/anhad-core.js',
  '/offline.html',

  // Library files
  '/lib/unified-storage.js',
  '/lib/banidb.js',
  '/lib/notifications.js',
  '/lib/sehajPaathProgress.js',
  '/lib/native-notifications.js',
  '/lib/ios-android-notifications.js',
  '/lib/alarm-persistence.js',
  '/lib/keep-alive-worker.js',
  '/lib/global-theme.js',
  '/lib/user-stats.js',
  '/lib/share-card.js',
  '/lib/smart-back.js',
  '/lib/gurbani-db.js',
  '/lib/global-mini-player.js',
  '/css/global-mini-player.css',
  
  // Offline-First Gurbani Cache Modules
  '/lib/gurbani-local-db.js',
  '/lib/gurbani-download-manager.js',
  '/lib/bani-cache-optimizer.js',
  '/lib/optimized-image-loader.js',
  '/lib/sehaj-paath-cache.js',
  '/lib/hukamnama-cache.js',

  // Dashboard
  '/Dashboard/dashboard.html',

  // Favorites
  '/Favorites/favorites.html',

  // Nitnem v2.1 - RENOVATED MODULE (iOS 26++ Design)
  '/nitnem/index.html',
  '/nitnem/indexbani.html',
  '/nitnem/reader.html',
  '/nitnem/css/main.css',
  '/nitnem/css/category.css',
  '/nitnem/css/reader.css',
  '/nitnem/js/bani-metadata.js',
  '/nitnem/js/banidb-api.js',
  '/nitnem/js/hub-app.js',
  '/nitnem/js/reader-engine.js',
  '/nitnem/data/bani-catalog.json',
  '/nitnem/category/nitnem.html',
  '/nitnem/category/sggs.html',
  '/nitnem/category/dasam.html',
  '/nitnem/category/favorites.html',

  // Nitnem legacy files (preserved for backwards compatibility)
  '/nitnem/japji-sahib.html',
  '/nitnem/jaap-sahib.html',
  '/nitnem/anand-sahib.html',
  '/nitnem/rehras-sahib.html',
  '/nitnem/sohila-sahib.html',
  '/nitnem/chaupai-sahib.html',
  '/nitnem/tav-prasad-savaiye.html',
  '/nitnem/css/nitnem.css',
  '/nitnem/css/themes.css',
  '/nitnem/css/liquid-glass.css',
  '/nitnem/css/setting-panel.css',
  '/nitnem/bani-setting-panel.js',
  '/nitnem/bani-style.css',

  // NitnemTracker
  '/NitnemTracker/nitnem-tracker.html',
  '/NitnemTracker/nitnem-tracker.css',
  '/NitnemTracker/nitnem-tracker.js',
  '/NitnemTracker/components/mala-counter.js',
  '/NitnemTracker/components/statistics-engine.js',
  '/NitnemTracker/components/streak-engine.js',
  '/NitnemTracker/components/report-generator.js',
  '/NitnemTracker/data/banis.json',
  '/NitnemTracker/data/achievements.json',
  '/NitnemTracker/data/maryada-schedule.json',

  // NaamAbhyas
  '/NaamAbhyas/naam-abhyas.html',
  '/NaamAbhyas/naam-abhyas.css',
  '/NaamAbhyas/naam-abhyas.js',
  '/NaamAbhyas/naam-abhyas-widget.js',
  '/NaamAbhyas/components/ritual-engine.js',
  '/NaamAbhyas/components/ritual-overlay.css',
  '/NaamAbhyas/components/discipline-metrics.js',
  '/NaamAbhyas/components/notification-engine.js',
  '/NaamAbhyas/components/audio-manager.js',
  '/NaamAbhyas/components/stats-tracker.js',
  '/NaamAbhyas/components/timer-engine.js',
  '/NaamAbhyas/data/quotes.json',

  // SehajPaath
  '/SehajPaath/sehaj-paath.html',
  '/SehajPaath/reader.html',
  '/SehajPaath/sehaj-paath.css',
  '/SehajPaath/sehaj-paath.js',

  // Calendar
  '/Calendar/Gurupurab-Calendar.html',
  '/Calendar/gurpurab-calendar.css',
  '/Calendar/gurpurab-calendar.js',
  '/Calendar/gurupurab-reminders.js',
  '/Calendar/nanakshahi-calendar.js',

  // Hukamnama
  '/Hukamnama/daily-hukamnama.html',
  '/Hukamnama/daily-hukamnama.css',
  '/Hukamnama/daily-hukamnama.js',
  '/Hukamnama/optical-glass-physics.js',

  // Reminders
  '/reminders/smart-reminders.html',
  '/reminders/smart-reminders-v6.css',
  '/reminders/smart-reminders-v6.js',
  '/reminders/smart-reminders-ui.js',
  '/reminders/alarm.html',
  '/reminders/css/alarm.css',
  '/reminders/js/alarm.js',
  '/reminders/js/alarm-controller.js',
  '/reminders/js/reliable-alarm.js',
  '/reminders/js/bg-alarm.js',
  '/reminders/js/nitnem-sync.js',

  // Gurbani Radio — Phase 11 rebuild
  '/GurbaniRadio/gurbani-radio-new.html',
  '/GurbaniRadio/gurbani-radio-new.css',
  '/GurbaniRadio/gurbani-radio-new.js',

  // Notes
  '/Notes/notes.html',
  '/Notes/notes-app.css',
  '/Notes/notes-manager.js',
  '/Notes/notes-ui.js',
  '/Notes/notes-integration.js'
];

// Data URLs that need special caching
const DATA_URLS = [
  '/data/gurpurab-events.json',
  '/data/guru-purabs.json',
  '/NitnemTracker/data/banis.json',
  '/NitnemTracker/data/achievements.json'
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

// ═══════════════════════════════════════════════════════════════════════════════
// INSTALL EVENT - Cache static files but DON'T skip waiting automatically
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static files');
        // Cache files individually to handle failures gracefully
        return Promise.allSettled(
          STATIC_FILES.map(file =>
            cache.add(file).catch(() => {
              // Silently ignore cache failures — expected for missing/optional files
              // or when SW base path doesn't match dev server path
              return null;
            })
          )
        );
      })
      .then(() => {
        // Cache data files
        return caches.open(DATA_CACHE).then(cache => {
          return Promise.allSettled(
            DATA_URLS.map(url => cache.add(url).catch(() => null))
          );
        });
      })
      .then(() => {
        console.log('[SW] Installation complete');
        // DON'T call skipWaiting() here - let user control when to update
      })
      .catch(err => {
        console.error('[SW] Installation failed:', err);
      })
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVATE EVENT - Clean old caches and claim clients
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== DATA_CACHE)
            .map(key => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// FETCH EVENT - Network first for API, Cache first for static
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http
  if (!url.protocol.startsWith('http')) return;

  // API requests - Network first
  if (url.hostname.includes('api.banidb.com') ||
    url.hostname.includes('api.gurbaninow.com')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Audio files - Cache but don't wait
  if (event.request.url.includes('/Audio/')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // CRITICAL FIX: Never cache r2.dev audio files (Amritvela streams) - always fetch fresh
  if (event.request.url.includes('r2.dev') && event.request.url.includes('.webm')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Static assets - Cache first
  event.respondWith(cacheFirst(event.request));
});

const DYNAMIC_CACHE_MAX = 200;

async function evictDynamicCache(cache) {
  const keys = await cache.keys();
  if (keys.length > DYNAMIC_CACHE_MAX) {
    const toDelete = keys.slice(0, keys.length - DYNAMIC_CACHE_MAX);
    await Promise.all(toDelete.map(k => cache.delete(k)));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone());
      evictDynamicCache(cache); // fire-and-forget eviction
    }
    return response;
  } catch (error) {
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
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLER - For skip waiting and other commands
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
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
        checkNaamAbhyasSchedule()
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
  console.log('[SW] Checking scheduled notifications...');

  const now = Date.now();
  const today = new Date().toLocaleDateString('en-CA');

  // Default daily notifications (like in the Gurbani Kirtan Darbar app)
  const defaultNotifications = [
    {
      id: 'amritvela',
      title: 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ | Amrit Vela',
      body: 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਸਚੁ ਨਾਉ ਵਡਿਆਈ ਵੀਚਾਰੁ॥ Wake up for Amrit Vela meditation',
      hour: 4,
      minute: 0,
      icon: '/assets/icons/icon-192x192.png'
    },
    {
      id: 'hukamnama',
      title: 'ਅੱਜ ਦਾ ਹੁਕਮਨਾਮਾ | Daily Hukamnama',
      body: 'Read today\'s sacred command from Sri Guru Granth Sahib Ji',
      hour: 6,
      minute: 0,
      icon: '/assets/icons/icon-192x192.png'
    },
    {
      id: 'rehras',
      title: 'ਰਹਿਰਾਸ ਸਾਹਿਬ | Rehras Sahib',
      body: 'Time for evening prayers - ਸੰਝ ਦੀ ਬੰਦਗੀ ਦਾ ਸਮਾਂ',
      hour: 18,
      minute: 30,
      icon: '/assets/icons/icon-192x192.png'
    },
    {
      id: 'nitnem_morning',
      title: 'ਨਿਤਨੇਮ ਦਾ ਸਮਾਂ | Nitnem Time',
      body: 'ਸਵੇਰ ਦੀ ਬਾਣੀ ਦਾ ਸਮਾਂ ਹੋ ਗਿਆ ਹੈ — Start your morning Nitnem',
      hour: 4,
      minute: 30,
      icon: '/assets/icons/icon-192x192.png'
    },
    {
      id: 'kirtan',
      title: 'ਕੀਰਤਨ ਦਰਬਾਰ | Evening Kirtan',
      body: 'ਸ਼ਾਮ ਦੇ ਕੀਰਤਨ ਸੁਣੋ — Listen to evening kirtan and feel divine peace',
      hour: 17,
      minute: 0,
      icon: '/assets/icons/icon-192x192.png'
    },
    {
      id: 'sohila',
      title: 'ਸੋਹਿਲਾ ਸਾਹਿਬ | Sohila Sahib',
      body: 'Time for night prayers before sleep - ਸੌਣ ਤੋਂ ਪਹਿਲਾਂ ਸੋਹਿਲਾ ਸਾਹਿਬ',
      hour: 21,
      minute: 30,
      icon: '/assets/icons/icon-192x192.png'
    },
    {
      id: 'nitnem_pending',
      title: 'ਨਿਤਨੇਮ ਬਾਕੀ | Nitnem Pending',
      body: 'ਅੱਜ ਦਾ ਨਿਤਨੇਮ ਅਜੇ ਬਾਕੀ ਹੈ — Complete your Nitnem before the day ends',
      hour: 19,
      minute: 0,
      icon: '/assets/icons/icon-192x192.png'
    }
  ];

  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();

  for (const notif of defaultNotifications) {
    const shownKey = `anhad_${notif.id}_shown_${today}`;

    // Check if it's time for this notification (within 15 min window)
    const notifTime = notif.hour * 60 + notif.minute;
    const currentTime = currentHour * 60 + currentMinute;
    const timeDiff = currentTime - notifTime;

    // Fire if within 0-15 minute window and not already shown today
    if (timeDiff >= 0 && timeDiff <= 15) {
      // Use a simple check via indexed clients
      const clients = await self.clients.matchAll();
      let alreadyShown = false;

      // Check with clients if notification was shown
      for (const client of clients) {
        try {
          const response = await new Promise((resolve) => {
            const channel = new MessageChannel();
            channel.port1.onmessage = (e) => resolve(e.data);
            client.postMessage({ type: 'CHECK_NOTIFICATION_SHOWN', key: shownKey }, [channel.port2]);
            setTimeout(() => resolve({ shown: false }), 100);
          });
          if (response.shown) {
            alreadyShown = true;
            break;
          }
        } catch (e) {
          // Ignore errors
        }
      }

      if (!alreadyShown) {
        await self.registration.showNotification(notif.title, {
          body: notif.body,
          icon: notif.icon || '/assets/icons/icon-192x192.png',
          badge: '/assets/icons/icon-72x72.png',
          tag: `anhad-${notif.id}`,
          renotify: true,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 400],
          data: {
            url: notif.id === 'hukamnama' ? '/Hukamnama/daily-hukamnama.html'
               : notif.id === 'kirtan' ? '/index.html'
               : (notif.id === 'nitnem_morning' || notif.id === 'nitnem_pending') ? '/NitnemTracker/nitnem-tracker.html'
               : '/reminders/smart-reminders.html',
            id: notif.id,
            timestamp: now
          },
          actions: [
            { action: 'open', title: 'Open' },
            { action: 'snooze', title: 'Snooze 5min' }
          ]
        });

        console.log(`[SW] Fired notification: ${notif.id}`);

        // Notify clients that notification was shown
        clients.forEach(client => {
          client.postMessage({ type: 'NOTIFICATION_SHOWN', key: shownKey, id: notif.id });
        });
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
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    tag: `naam-abhyas-${today}-${session.hour}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 500],
    data: {
      url: '/NaamAbhyas/naam-abhyas.html?autoStart=true',
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
    icon: '/assets/favicon.svg',
    badge: '/assets/favicon.svg',
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
          icon: '/assets/icons/icon-192x192.png',
          badge: '/assets/icons/icon-72x72.png',
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
      icon: entry.icon || '/assets/icons/icon-192x192.png',
      badge: entry.badge || '/assets/icons/icon-72x72.png',
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
      icon: '/assets/alarm-icon.png',
      badge: '/assets/badge.png',
      tag: `alarm-${alarm.id}`,
      requireInteraction: true,
      renotify: true,
      vibrate: [500, 200, 500, 200, 500, 200, 500],
      actions: [
        { action: 'dismiss', title: "✓ I'm Up!" },
        { action: 'snooze',  title: '😴 Snooze 5min' }
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

console.log('[SW] ANHAD Service Worker v3.0.0 loaded - iOS/Android optimized');

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