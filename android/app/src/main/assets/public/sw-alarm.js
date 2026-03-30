/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SERVICE WORKER - ALARM HANDLER v2.0
 * 
 * Handles:
 * ✅ Background alarm scheduling
 * ✅ Push notifications with actions
 * ✅ Snooze functionality
 * ✅ Cross-tab communication
 * ✅ Offline alarm persistence
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const SW_VERSION = '2.0.0';
const CACHE_NAME = `gurbani-alarm-v${SW_VERSION}`;

// Audio files to cache for offline use
const AUDIO_FILES = [
    '/Audio/audio1.mp3',
    '/Audio/audio2.mp3',
    '/Audio/audio3.mpeg',
    '/Audio/audio4.mpeg',
    '/Audio/audio5.mpeg',
    '/Audio/audio6.mpeg'
];

// Icon paths
const ICONS = {
    main: '/assets/alarm-icon.png',
    badge: '/assets/badge.png'
};

// Scheduled alarms storage
const scheduledAlarms = new Map();

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE WORKER LIFECYCLE
// ══════════════════════════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
    console.log(`[SW Alarm] Installing v${SW_VERSION}`);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(AUDIO_FILES))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    console.log(`[SW Alarm] Activating v${SW_VERSION}`);

    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key.startsWith('gurbani-alarm-') && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

// ══════════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLING
// ══════════════════════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
    const { type, data } = event.data;

    switch (type) {
        case 'SCHEDULE_ALARMS':
            scheduleAlarms(data.alarms);
            break;

        case 'SCHEDULE_ALARM':
            scheduleAlarm(data.alarm);
            break;

        case 'CANCEL_ALARM':
            cancelAlarm(data.alarmId);
            break;

        case 'SNOOZE_ALARM':
            snoozeAlarm(data.alarmId, data.minutes);
            break;

        case 'CHECK_ALARMS':
            checkAndTriggerAlarms();
            break;

        case 'GET_STATUS':
            event.ports[0]?.postMessage({
                version: SW_VERSION,
                scheduledCount: scheduledAlarms.size,
                alarms: Array.from(scheduledAlarms.keys())
            });
            break;
    }
});

// ══════════════════════════════════════════════════════════════════════════════
// ALARM SCHEDULING
// ══════════════════════════════════════════════════════════════════════════════

function scheduleAlarms(alarms) {
    console.log(`[SW Alarm] Scheduling ${alarms.length} alarms`);

    // Clear existing
    scheduledAlarms.forEach((alarm, id) => {
        if (alarm.timeoutId) clearTimeout(alarm.timeoutId);
    });
    scheduledAlarms.clear();

    // Schedule each
    alarms.forEach(alarm => {
        if (alarm.enabled) {
            scheduleAlarm(alarm);
        }
    });
}

function scheduleAlarm(alarm) {
    const delay = calculateDelay(alarm.time, alarm.days);

    if (delay <= 0 || delay > 24 * 60 * 60 * 1000) {
        return; // Invalid delay
    }

    const timeoutId = setTimeout(() => {
        triggerAlarm(alarm);

        // Reschedule for next occurrence
        scheduleAlarm(alarm);
    }, delay);

    scheduledAlarms.set(alarm.id, {
        ...alarm,
        timeoutId,
        scheduledFor: new Date(Date.now() + delay)
    });

    console.log(`[SW Alarm] ${alarm.label} scheduled for ${new Date(Date.now() + delay).toLocaleTimeString()}`);
}

function cancelAlarm(alarmId) {
    const alarm = scheduledAlarms.get(alarmId);
    if (alarm && alarm.timeoutId) {
        clearTimeout(alarm.timeoutId);
        scheduledAlarms.delete(alarmId);
        console.log(`[SW Alarm] ${alarmId} cancelled`);
    }
}

function snoozeAlarm(alarmId, minutes = 5) {
    console.log(`[SW Alarm] Snoozing ${alarmId} for ${minutes} minutes`);

    const alarm = scheduledAlarms.get(alarmId);
    if (!alarm) return;

    // Cancel current timeout
    if (alarm.timeoutId) clearTimeout(alarm.timeoutId);

    // Schedule snooze
    const delay = minutes * 60 * 1000;
    const timeoutId = setTimeout(() => {
        triggerAlarm(alarm);
    }, delay);

    scheduledAlarms.set(alarmId + '_snooze', {
        ...alarm,
        timeoutId,
        isSnooze: true,
        scheduledFor: new Date(Date.now() + delay)
    });
}

function calculateDelay(time24, days = null) {
    const now = new Date();
    const [h, m] = time24.split(':').map(Number);

    let next = new Date();
    next.setHours(h, m, 0, 0);

    // If time passed, move to next day
    if (next <= now) {
        next.setDate(next.getDate() + 1);
    }

    // Find next valid day if days specified
    if (days && days.length > 0 && days.length < 7) {
        let iterations = 0;
        while (iterations++ < 7) {
            if (days.includes(next.getDay())) break;
            next.setDate(next.getDate() + 1);
        }
    }

    return next.getTime() - now.getTime();
}

// ══════════════════════════════════════════════════════════════════════════════
// ALARM TRIGGERING
// ══════════════════════════════════════════════════════════════════════════════

async function triggerAlarm(alarm) {
    console.log(`[SW Alarm] 🔔 Triggering: ${alarm.label}`);

    // Show notification
    await showNotification(alarm);

    // Notify all clients
    const clients = await self.clients.matchAll({ type: 'window' });

    clients.forEach(client => {
        client.postMessage({
            type: 'ALARM_TRIGGER',
            data: { alarm }
        });
    });

    // If no clients, open alarm page
    if (clients.length === 0) {
        self.clients.openWindow(`/reminders/alarm.html?id=${alarm.id}`);
    }
}

async function showNotification(alarm) {
    const title = `🙏 ${alarm.label || 'Gurbani Reminder'}`;

    const body = alarm.gurmukhi
        ? `${alarm.gurmukhi} - ਸਮਾਂ ਹੋ ਗਿਆ`
        : `Time for ${alarm.label || 'your spiritual practice'}`;

    const options = {
        body,
        icon: ICONS.main,
        badge: ICONS.badge,
        tag: `alarm-${alarm.id}`,
        requireInteraction: true,
        renotify: true,
        vibrate: [500, 200, 500, 200, 500, 200, 500],
        actions: [
            {
                action: 'dismiss',
                title: '✓ I\'m Up!'
            },
            {
                action: 'snooze',
                title: '😴 Snooze 5min'
            }
        ],
        data: {
            alarm,
            alarmId: alarm.id,
            url: `/reminders/alarm.html?id=${alarm.id}`,
            timestamp: Date.now()
        }
    };

    try {
        await self.registration.showNotification(title, options);
        console.log(`[SW Alarm] Notification shown for ${alarm.id}`);
    } catch (e) {
        console.error('[SW Alarm] Notification error:', e);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CLICK HANDLING
// ══════════════════════════════════════════════════════════════════════════════

self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;
    const data = notification.data;

    notification.close();

    if (action === 'snooze') {
        // Snooze for 5 minutes
        event.waitUntil(snoozeAlarm(data.alarmId, 5));

    } else if (action === 'dismiss') {
        // Record as completed
        event.waitUntil(recordAlarmResponse(data.alarmId, 'completed'));

    } else {
        // Default: open alarm page
        event.waitUntil(
            self.clients.matchAll({ type: 'window' })
                .then(clients => {
                    // Focus existing window if available
                    const existingClient = clients.find(c => c.url.includes('smart-reminders'));

                    if (existingClient) {
                        return existingClient.focus();
                    }

                    // Open alarm page
                    return self.clients.openWindow(data.url);
                })
        );
    }
});

self.addEventListener('notificationclose', (event) => {
    const data = event.notification.data;

    // Record as missed if dismissed without action
    if (!event.action) {
        recordAlarmResponse(data.alarmId, 'missed');
    }
});

// ══════════════════════════════════════════════════════════════════════════════
// RESPONSE RECORDING
// ══════════════════════════════════════════════════════════════════════════════

async function recordAlarmResponse(alarmId, status) {
    console.log(`[SW Alarm] Recording ${status} for ${alarmId}`);

    // Notify clients
    const clients = await self.clients.matchAll({ type: 'window' });

    clients.forEach(client => {
        client.postMessage({
            type: 'ALARM_RESPONSE',
            data: {
                alarmId,
                status,
                timestamp: new Date().toISOString()
            }
        });
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// PERIODIC ALARM CHECK (Fallback)
// ══════════════════════════════════════════════════════════════════════════════

function checkAndTriggerAlarms() {
    const now = new Date();

    scheduledAlarms.forEach((alarm, id) => {
        if (alarm.scheduledFor && alarm.scheduledFor <= now) {
            triggerAlarm(alarm);
            scheduledAlarms.delete(id);
        }
    });
}

// Check alarms every minute as fallback
const alarmCheckInterval = setInterval(checkAndTriggerAlarms, 60000);

// Cleanup on service worker termination (best effort)
self.addEventListener('beforeunload', () => {
    clearInterval(alarmCheckInterval);
});

// ══════════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATION (Future)
// ══════════════════════════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();

    if (data.type === 'ALARM') {
        event.waitUntil(triggerAlarm(data.alarm));
    }
});

console.log(`[SW Alarm] v${SW_VERSION} loaded`);
