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

const CACHE_VERSION = 'anhad-v3.0.1';
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
  '/assets/favicon.svg',
  '/assets/khanda-authentic.svg',

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

  // Library files
  '/lib/unified-storage.js',
  '/lib/banidb.js',
  '/lib/notifications.js',
  '/lib/sehajPaathProgress.js',
  '/lib/native-notifications.js',
  '/lib/ios-android-notifications.js',
  '/lib/alarm-persistence.js',
  '/lib/keep-alive-worker.js',

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
  '/SehajPaath/components/reader-engine.js',
  '/SehajPaath/components/progress-engine.js',
  '/SehajPaath/components/reminder-engine.js',
  '/SehajPaath/components/settings-engine.js',

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
  '/reminders/smart-reminders.css',
  '/reminders/smart-reminders.js',
  '/reminders/alarm.html',
  '/reminders/css/alarm.css',
  '/reminders/js/alarm.js',
  '/reminders/js/alarm-controller.js',
  '/reminders/js/reliable-alarm.js',
  '/reminders/js/bg-alarm.js',
  '/reminders/js/nitnem-sync.js',

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
            cache.add(file).catch(err => {
              // Silently ignore 404s for optional files
              if (!err.message?.includes('404')) {
                console.warn(`[SW] Cache failed for ${file}:`, err.message);
              }
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

  // Static assets - Cache first
  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline fallback if available
    const offlinePage = await caches.match('/index.html');
    if (offlinePage) return offlinePage;
    return new Response('Offline', { status: 503 });
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
    scheduleNotification(event.data.payload);
  }

  if (event.data?.type === 'CANCEL_NOTIFICATION' && event.data.payload?.id) {
    cancelNotification(event.data.payload.id);
  }

  if (event.data?.type === 'SET_ALARMS' && Array.isArray(event.data.alarms)) {
    event.data.alarms.forEach(alarm => scheduleNotification({
      id: alarm.id,
      title: alarm.title,
      body: `Time for ${alarm.title}`,
      scheduledTime: getNextAlarmTime(alarm.time),
      data: { url: `/reminders/alarm.html?id=${alarm.id}&title=${encodeURIComponent(alarm.title)}` },
      tag: `smart-reminder-${alarm.id}`,
      requireInteraction: true
    }));
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
    event.waitUntil(checkAndFireScheduledNotifications());
  }

  if (event.tag === 'anhad-daily-reminders') {
    event.waitUntil(scheduleDailyReminders());
  }
});

// Check scheduled notifications and fire any that are due
async function checkAndFireScheduledNotifications() {
  console.log('[SW] Checking scheduled notifications...');

  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];

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
      id: 'sohila',
      title: 'ਸੋਹਿਲਾ ਸਾਹਿਬ | Sohila Sahib',
      body: 'Time for night prayers before sleep - ਸੌਣ ਤੋਂ ਪਹਿਲਾਂ ਸੋਹਿਲਾ ਸਾਹਿਬ',
      hour: 21,
      minute: 30,
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
            url: notif.id === 'hukamnama' ? '/Hukamnama/daily-hukamnama.html' : '/reminders/smart-reminders.html',
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
    // Just close, already done above
    console.log('[SW] Notification dismissed:', data.id);
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

console.log('[SW] ANHAD Service Worker v3.0.0 loaded - iOS/Android optimized');