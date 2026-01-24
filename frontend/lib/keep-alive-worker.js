/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD - KEEP ALIVE BACKGROUND WORKER v1.0.0
 * Prevents browser from sleeping and ensures alarms fire reliably
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This Web Worker runs in the background to:
 * ✅ Keep timers running when tab is inactive
 * ✅ Check scheduled alarms every second
 * ✅ Fire notifications even when browser throttles setTimeout
 * ✅ Sync with main thread via postMessage
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Alarm storage (mirrored from main thread)
let scheduledAlarms = [];
let lastCheckTime = Date.now();

// Check interval (1 second for high precision)
const CHECK_INTERVAL = 1000;

// Message handler from main thread
self.onmessage = function (event) {
    const { type, payload } = event.data || {};

    switch (type) {
        case 'SET_ALARMS':
            scheduledAlarms = payload || [];
            console.log('[KeepAlive Worker] Alarms updated:', scheduledAlarms.length);
            break;

        case 'ADD_ALARM':
            if (payload && payload.id) {
                // Remove existing alarm with same ID
                scheduledAlarms = scheduledAlarms.filter(a => a.id !== payload.id);
                scheduledAlarms.push(payload);
                console.log('[KeepAlive Worker] Alarm added:', payload.id);
            }
            break;

        case 'REMOVE_ALARM':
            if (payload && payload.id) {
                scheduledAlarms = scheduledAlarms.filter(a => a.id !== payload.id);
                console.log('[KeepAlive Worker] Alarm removed:', payload.id);
            }
            break;

        case 'GET_STATUS':
            self.postMessage({
                type: 'STATUS',
                payload: {
                    alarmCount: scheduledAlarms.length,
                    lastCheck: lastCheckTime,
                    uptime: Date.now() - startTime
                }
            });
            break;

        case 'PING':
            self.postMessage({ type: 'PONG', timestamp: Date.now() });
            break;
    }
};

// Start time for uptime tracking
const startTime = Date.now();

// Main check loop
function checkAlarms() {
    const now = Date.now();
    lastCheckTime = now;

    // Find alarms that should fire now
    const dueAlarms = scheduledAlarms.filter(alarm => {
        if (!alarm.enabled) return false;

        // Get next trigger time
        const triggerTime = getNextTriggerTime(alarm);

        // Check if it's time (within 2 second window)
        return triggerTime && (now >= triggerTime) && (now - triggerTime < 2000);
    });

    // Fire due alarms
    dueAlarms.forEach(alarm => {
        // Mark as fired for today to prevent duplicates
        const today = new Date().toISOString().split('T')[0];
        alarm.lastFired = today;

        // Notify main thread to fire the alarm
        self.postMessage({
            type: 'FIRE_ALARM',
            payload: {
                id: alarm.id,
                title: alarm.title || alarm.label,
                body: alarm.body || `Time for ${alarm.title || alarm.label}`,
                time: alarm.time,
                sound: alarm.sound,
                vibrate: alarm.vibrate !== false,
                url: alarm.url || '/reminders/alarm.html?id=' + alarm.id
            }
        });

        console.log('[KeepAlive Worker] Fired alarm:', alarm.id);
    });

    // Send heartbeat every 10 seconds
    if (now % 10000 < CHECK_INTERVAL) {
        self.postMessage({
            type: 'HEARTBEAT',
            timestamp: now,
            alarmCount: scheduledAlarms.length
        });
    }
}

// Calculate next trigger time for an alarm
function getNextTriggerTime(alarm) {
    if (!alarm.time) return null;

    const [hours, minutes] = alarm.time.split(':').map(Number);
    const now = new Date();
    const today = new Date().toISOString().split('T')[0];

    // Check if already fired today
    if (alarm.lastFired === today) {
        return null;
    }

    // Check if today is an active day
    const dayOfWeek = now.getDay();
    if (alarm.days && Array.isArray(alarm.days) && !alarm.days.includes(dayOfWeek)) {
        return null;
    }

    // Create trigger time for today
    const triggerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

    return triggerDate.getTime();
}

// Start the check loop
setInterval(checkAlarms, CHECK_INTERVAL);

// Initial check
checkAlarms();

console.log('[KeepAlive Worker] Started at', new Date().toLocaleString());
