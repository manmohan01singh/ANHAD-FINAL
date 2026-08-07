# Notifications Content JSON Integration Plan

**Date:** 2026-01-10  
**Status:** 🔄 REQUIRES IMPLEMENTATION

## Problem Identified ⚠️

Your beautiful `notifications-content.json` file with hundreds of spiritual messages (Kirtan Suno, Amritvela, Japji Sahib, etc.) is **NOT being used** by the service worker!

### Current Situation:
- ❌ Service worker has **hardcoded** notification messages
- ❌ `notifications-content.json` (2608 lines!) is only loaded in Settings page
- ❌ Users are NOT seeing the variety of beautiful spiritual messages

### What Should Happen:
- ✅ Service worker should load `notifications-content.json` on startup
- ✅ Pick random messages from appropriate categories
- ✅ Users get fresh, inspiring messages every time

---

## Solution: Dynamic Notification Loading

### Step 1: Cache notifications-content.json in Service Worker

Add to service worker install event:
```javascript
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        // ... existing cache items
        '/notifications-content.json'  // ADD THIS
      ]);
    })
  );
});
```

### Step 2: Load JSON on Service Worker Activation

```javascript
let NOTIFICATION_CONTENT = null;

async function loadNotificationContent() {
  if (NOTIFICATION_CONTENT) return NOTIFICATION_CONTENT;
  
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('/notifications-content.json');
    if (response) {
      NOTIFICATION_CONTENT = await response.json();
      console.log('[SW] Loaded notification content:', 
        Object.keys(NOTIFICATION_CONTENT.notifications).length, 'categories');
      return NOTIFICATION_CONTENT;
    }
  } catch (e) {
    console.error('[SW] Failed to load notification content:', e);
  }
  return null;
}

// Load on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(loadNotificationContent());
});
```

### Step 3: Update Spiritual Notifications to Use JSON

Replace hardcoded `spiritualNotifications` array with:

```javascript
async function getRandomSpiritualNotification(category, timeRanges) {
  const content = await loadNotificationContent();
  if (!content || !content.notifications[category]) {
    return null;
  }
  
  const messages = content.notifications[category];
  const randomIndex = Math.floor(Math.random() * messages.length);
  const notif = messages[randomIndex];
  
  return {
    id: `${category}_${randomIndex}`,
    title: notif.title,
    body: notif.body,
    emoji: notif.emoji,
    timeRanges: timeRanges,
    url: getCategoryURL(category),
    translation: notif.translation
  };
}

function getCategoryURL(category) {
  const urlMap = {
    'amritvela': '/index.html',
    'japji_sahib': '/nitnem/index.html',
    'jaap_sahib': '/nitnem/index.html',
    'tav_prasad_swaye': '/nitnem/index.html',
    'rehras_sahib': '/nitnem/index.html',
    'kirtan_sohila': '/nitnem/index.html',
    'hukamnama': '/Hukamnama/daily-hukamnama.html',
    'kirtan': '/GurbaniRadio/gurbani-radio.html',
    'simran': '/GurbaniRadio/gurbani-radio.html?stream=simran'
  };
  return urlMap[category] || '/index.html';
}
```

### Step 4: Update checkAndFireScheduledNotifications

```javascript
async function checkAndFireScheduledNotifications() {
  // ... existing Capacitor check ...
  
  // Define notification schedule with JSON categories
  const spiritualSchedule = [
    {
      category: 'amritvela',
      timeRanges: [[4, 6]],  // 4-6 AM
    },
    {
      category: 'japji_sahib',
      timeRanges: [[5, 9]],  // 5-9 AM
    },
    {
      category: 'jaap_sahib',
      timeRanges: [[5, 9]],  // 5-9 AM
    },
    {
      category: 'kirtan',
      timeRanges: [[8, 12], [15, 19]],  // 8AM-12PM or 3-7PM
    },
    {
      category: 'hukamnama',
      timeRanges: [[6, 10], [12, 14]],  // 6-10AM or 12-2PM
    },
    {
      category: 'rehras_sahib',
      timeRanges: [[17, 20]],  // 5-8 PM
    },
    {
      category: 'kirtan_sohila',
      timeRanges: [[21, 23]],  // 9-11 PM
    },
    {
      category: 'simran',
      timeRanges: [[7, 11], [13, 17], [20, 22]],  // Multiple times
    }
  ];

  const currentHour = new Date().getHours();

  // Fire spiritual notifications
  for (const schedule of spiritualSchedule) {
    const inTimeRange = schedule.timeRanges.some(([start, end]) => 
      currentHour >= start && currentHour < end
    );
    
    if (!inTimeRange) continue;
    if (_hasShownToday(`${schedule.category}_check`)) continue;

    // Random chance to fire (20% per check)
    if (Math.random() > 0.2) continue;

    const notif = await getRandomSpiritualNotification(
      schedule.category, 
      schedule.timeRanges
    );
    
    if (!notif) continue;

    try {
      await self.registration.showNotification(notif.title, {
        body: notif.body,
        icon: '/assets/icon-192x192.png',
        badge: '/assets/icon-72x72.png',
        tag: notif.id,
        data: { 
          url: notif.url,
          translation: notif.translation,
          category: schedule.category
        },
        requireInteraction: false,
        actions: [
          { action: 'open', title: 'Open' },
          { action: 'dismiss', title: 'Later' }
        ]
      });
      
      _markShownToday(`${schedule.category}_check`);
      console.log(`[SW] 🙏 Fired ${schedule.category}: ${notif.title}`);
    } catch (e) {
      console.error('[SW] Failed to show notification:', e);
    }
  }
}
```

---

## Benefits of This Implementation

✅ **Variety**: Users get different messages each time from your 2600+ line JSON  
✅ **Fresh Content**: No more repetitive hardcoded messages  
✅ **Easy Updates**: Just update JSON file, no code changes needed  
✅ **Scalability**: Add new categories/messages in JSON without touching service worker  
✅ **Translations**: Your JSON includes English translations for each message  
✅ **Emojis**: Beautiful emojis for each notification from JSON  

---

## Implementation Files to Modify

1. ✅ `frontend/sw.js` - Main service worker
2. ✅ `ios/App/App/public/sw.js` - iOS service worker
3. ✅ `android/app/src/main/assets/public/sw.js` - Android service worker

---

## Testing Plan

After implementation:

1. Clear service worker cache
2. Reload app to install new service worker
3. Wait for notification time windows
4. Verify messages are from JSON (check variety)
5. Check console logs for category names
6. Test on iOS/Android native apps

---

## Next Steps

Would you like me to:
1. ✅ Implement this in all 3 service worker files?
2. ✅ Update the cache list to include notifications-content.json?
3. ✅ Add better logging to see which messages fire?
4. ✅ Add configuration for notification frequency?

This will bring your beautiful notification content to life! 🙏✨
