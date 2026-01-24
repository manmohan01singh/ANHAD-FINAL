/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RELIABLE ALARM SYSTEM v2.0 - Multiple Fallback Methods
 * 
 * Methods Used:
 * 1. Service Worker + Push API (Best - works in background)
 * 2. Web Notifications API (Good - needs active tab)
 * 3. setTimeout with visibility API (Fallback)
 * 4. BroadcastChannel for cross-tab alerts
 * 
 * Features:
 * ✅ Service Worker registration and messaging
 * ✅ IndexedDB storage for offline access
 * ✅ Web Locks API to prevent suspension
 * ✅ Notification with actions (Snooze/Dismiss)
 * ✅ Audio playback with wake lock
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // Prevent duplicate initialization
    if (window.ReliableAlarms) {
        console.log('⏰ Reliable Alarms already initialized');
        return;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ══════════════════════════════════════════════════════════════════════════
    const CONFIG = {
        swPath: '/sw-alarm.js',
        dbName: 'GurbaniAlarmsDB',
        dbVersion: 1,
        storeName: 'alarms',
        audioPath: '../Audio/',
        channelName: 'gurbani-alarm-channel',
        defaultAudio: 'audio1.mp3',
        iconPath: '../assets/alarm-icon.png',
        badgePath: '../assets/badge.png'
    };

    // ══════════════════════════════════════════════════════════════════════════
    // STATE
    // ══════════════════════════════════════════════════════════════════════════
    const State = {
        swRegistration: null,
        db: null,
        scheduledTimeouts: new Map(),
        broadcastChannel: null,
        audioElement: null,
        wakeLock: null,
        methods: []
    };

    // ══════════════════════════════════════════════════════════════════════════
    // INDEXEDDB STORAGE
    // ══════════════════════════════════════════════════════════════════════════
    async function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.dbName, CONFIG.dbVersion);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                State.db = request.result;
                console.log('💾 Alarm IndexedDB ready');
                resolve(State.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains(CONFIG.storeName)) {
                    const store = db.createObjectStore(CONFIG.storeName, { keyPath: 'id' });
                    store.createIndex('time', 'time', { unique: false });
                    store.createIndex('enabled', 'enabled', { unique: false });
                }
            };
        });
    }

    async function dbGet(id) {
        return new Promise((resolve, reject) => {
            const tx = State.db.transaction(CONFIG.storeName, 'readonly');
            const store = tx.objectStore(CONFIG.storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function dbGetAll() {
        return new Promise((resolve, reject) => {
            const tx = State.db.transaction(CONFIG.storeName, 'readonly');
            const store = tx.objectStore(CONFIG.storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function dbPut(alarm) {
        return new Promise((resolve, reject) => {
            const tx = State.db.transaction(CONFIG.storeName, 'readwrite');
            const store = tx.objectStore(CONFIG.storeName);
            const request = store.put(alarm);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function dbDelete(id) {
        return new Promise((resolve, reject) => {
            const tx = State.db.transaction(CONFIG.storeName, 'readwrite');
            const store = tx.objectStore(CONFIG.storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SERVICE WORKER
    // ══════════════════════════════════════════════════════════════════════════
    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Worker not supported');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.register(CONFIG.swPath, {
                scope: '/'
            });

            State.swRegistration = registration;
            State.methods.push('serviceWorker');

            // Handle messages from SW
            navigator.serviceWorker.addEventListener('message', (event) => {
                const { type, data } = event.data;

                switch (type) {
                    case 'ALARM_TRIGGER':
                        ReliableAlarms.triggerAlarm(data.alarm);
                        break;

                    case 'SNOOZE_ALARM':
                        ReliableAlarms.snoozeAlarm(data.alarmId, data.minutes);
                        break;

                    case 'DISMISS_ALARM':
                        ReliableAlarms.dismissAlarm(data.alarmId);
                        break;
                }
            });

            console.log('🔧 Service Worker registered');
            return registration;

        } catch (error) {
            console.error('SW registration failed:', error);
            return null;
        }
    }

    function sendToServiceWorker(type, data) {
        if (State.swRegistration && State.swRegistration.active) {
            State.swRegistration.active.postMessage({ type, data });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BROADCAST CHANNEL
    // ══════════════════════════════════════════════════════════════════════════
    function initBroadcastChannel() {
        try {
            State.broadcastChannel = new BroadcastChannel(CONFIG.channelName);
            State.methods.push('broadcastChannel');

            State.broadcastChannel.onmessage = (event) => {
                const { type, data } = event.data;

                switch (type) {
                    case 'ALARM_FIRED':
                        // Another tab fired an alarm - show UI
                        ReliableAlarms.handleAlarmFired(data);
                        break;

                    case 'ALARM_DISMISSED':
                        ReliableAlarms.stopAudio();
                        break;
                }
            };

            console.log('📡 Alarm BroadcastChannel ready');
        } catch (e) {
            console.warn('BroadcastChannel not supported');
        }
    }

    function broadcast(type, data) {
        if (State.broadcastChannel) {
            State.broadcastChannel.postMessage({ type, data });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // WEB LOCKS API (Keep Alive)
    // ══════════════════════════════════════════════════════════════════════════
    async function acquireWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                State.wakeLock = await navigator.wakeLock.request('screen');
                console.log('🔒 Wake Lock acquired');

                State.wakeLock.addEventListener('release', () => {
                    console.log('🔓 Wake Lock released');
                });
            } catch (e) {
                console.warn('Wake Lock failed:', e);
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TIME CALCULATIONS
    // ══════════════════════════════════════════════════════════════════════════
    function getNextOccurrence(time24, days = null) {
        const now = new Date();
        const [h, m] = time24.split(':').map(Number);

        let next = new Date();
        next.setHours(h, m, 0, 0);

        // If time has passed today, move to next valid day
        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }

        // If days specified, find next valid day
        if (days && days.length > 0 && days.length < 7) {
            let maxIterations = 7;
            while (maxIterations-- > 0) {
                if (days.includes(next.getDay())) {
                    break;
                }
                next.setDate(next.getDate() + 1);
            }
        }

        return next;
    }

    function getDelay(alarm) {
        const next = getNextOccurrence(alarm.time, alarm.days);
        return next.getTime() - Date.now();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // AUDIO MANAGER
    // ══════════════════════════════════════════════════════════════════════════
    async function playAlarmSound(tone, loop = true) {
        stopAudio();

        const audioFile = tone ? `${CONFIG.audioPath}${tone}.mp3` : `${CONFIG.audioPath}${CONFIG.defaultAudio}`;

        State.audioElement = new Audio(audioFile);
        State.audioElement.loop = loop;
        State.audioElement.volume = 1.0;

        try {
            await State.audioElement.play();
            console.log('🔊 Alarm audio playing');
        } catch (e) {
            console.error('Audio play failed:', e);
        }
    }

    function stopAudio() {
        if (State.audioElement) {
            State.audioElement.pause();
            State.audioElement.currentTime = 0;
            State.audioElement = null;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // NOTIFICATION MANAGER
    // ══════════════════════════════════════════════════════════════════════════
    async function requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    async function showNotification(alarm) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            console.warn('Notifications not enabled');
            return null;
        }

        const title = `🙏 ${alarm.label || 'Gurbani Reminder'}`;
        const body = alarm.gurmukhi
            ? `${alarm.gurmukhi} - ਸਮਾਂ ਹੋ ਗਿਆ`
            : `Time for ${alarm.label || 'your spiritual practice'}`;

        const options = {
            body,
            icon: CONFIG.iconPath,
            badge: CONFIG.badgePath,
            tag: `alarm-${alarm.id}`,
            requireInteraction: true,
            vibrate: [500, 200, 500, 200, 500],
            actions: [
                { action: 'snooze', title: '😴 Snooze 5min' },
                { action: 'dismiss', title: '✓ I\'m Up!' }
            ],
            data: {
                alarmId: alarm.id,
                url: `/reminders/alarm.html?id=${alarm.id}`
            }
        };

        try {
            const notification = new Notification(title, options);

            notification.onclick = () => {
                window.focus();
                notification.close();
                stopAudio();

                // Record as completed
                window.dispatchEvent(new CustomEvent('alarmSyncUpdate', {
                    detail: {
                        reminderId: alarm.id,
                        status: 'completed',
                        timestamp: new Date().toISOString()
                    }
                }));
            };

            return notification;
        } catch (e) {
            console.error('Notification error:', e);
            return null;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MAIN RELIABLE ALARMS CLASS
    // ══════════════════════════════════════════════════════════════════════════
    const ReliableAlarms = {
        // Initialize
        async init() {
            console.log('⏰ Initializing Reliable Alarm System...');

            // Initialize IndexedDB
            await initDB();

            // Register Service Worker
            await registerServiceWorker();

            // Initialize BroadcastChannel
            initBroadcastChannel();

            // Add setTimeout method (always available)
            State.methods.push('setTimeout');

            // Check notification permission
            if ('Notification' in window) {
                State.methods.push('notification');
            }

            // Request notification permission
            await requestNotificationPermission();

            // Schedule existing alarms
            await this.scheduleAll();

            // Set up visibility change handler
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.checkMissedAlarms();
                }
            });

            console.log(`✅ Reliable Alarms ready with methods: ${State.methods.join(', ')}`);
        },

        // Schedule all enabled alarms
        async scheduleAll() {
            // Clear existing timeouts
            State.scheduledTimeouts.forEach((timeout, id) => {
                clearTimeout(timeout);
            });
            State.scheduledTimeouts.clear();

            // Get alarms from localStorage (primary) or IndexedDB
            const storedReminders = localStorage.getItem('sr_reminders_v4');
            let alarms = [];

            if (storedReminders) {
                try {
                    const data = JSON.parse(storedReminders);

                    // Get core alarms
                    if (data.core) {
                        Object.values(data.core).forEach(alarm => {
                            if (alarm.enabled) alarms.push(alarm);
                        });
                    }

                    // Get custom alarms
                    if (data.custom) {
                        data.custom.forEach(alarm => {
                            if (alarm.enabled) alarms.push(alarm);
                        });
                    }
                } catch (e) {
                    console.error('Error parsing alarms:', e);
                }
            }

            // Also sync to IndexedDB
            for (const alarm of alarms) {
                await dbPut(alarm);
            }

            // Schedule each alarm
            alarms.forEach(alarm => this.scheduleAlarm(alarm));

            // Send to Service Worker
            sendToServiceWorker('SCHEDULE_ALARMS', { alarms });

            console.log(`📅 Scheduled ${alarms.length} alarms`);
        },

        // Schedule a single alarm
        scheduleAlarm(alarm) {
            const delay = getDelay(alarm);

            // Only schedule if within 24 hours
            if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
                const timeoutId = setTimeout(() => {
                    this.triggerAlarm(alarm);
                    State.scheduledTimeouts.delete(alarm.id);

                    // Reschedule for next day
                    this.scheduleAlarm(alarm);
                }, delay);

                State.scheduledTimeouts.set(alarm.id, timeoutId);

                const nextTime = new Date(Date.now() + delay);
                console.log(`📅 ${alarm.label} scheduled for ${nextTime.toLocaleTimeString()}`);
            }
        },

        // Trigger an alarm
        async triggerAlarm(alarm) {
            console.log(`🔔 ALARM: ${alarm.label}`);

            // Play sound
            await playAlarmSound(alarm.tone);

            // Show notification
            await showNotification(alarm);

            // Vibrate
            if (navigator.vibrate) {
                navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
            }

            // Broadcast to other tabs
            broadcast('ALARM_FIRED', { alarm });

            // Acquire wake lock to keep screen on
            await acquireWakeLock();

            // Open alarm popup if in foreground
            if (document.visibilityState === 'visible') {
                this.showAlarmModal(alarm);
            }

            // Dispatch event
            window.dispatchEvent(new CustomEvent('alarmTriggered', { detail: alarm }));
        },

        // Handle alarm fired from another source
        handleAlarmFired(data) {
            const { alarm } = data;
            playAlarmSound(alarm.tone);

            if (document.visibilityState === 'visible') {
                this.showAlarmModal(alarm);
            }
        },

        // Show alarm modal
        showAlarmModal(alarm) {
            // Create modal overlay
            const existing = document.getElementById('alarmModal');
            if (existing) existing.remove();

            const time = alarm.time?.split(':') || ['--', '--'];
            const hour = parseInt(time[0]);
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;

            const modal = document.createElement('div');
            modal.id = 'alarmModal';
            modal.innerHTML = `
                <div class="alarm-modal-backdrop" style="
                    position: fixed;
                    inset: 0;
                    z-index: 10000;
                    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 30%, #e94560 70%, #ffd460 100%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    text-align: center;
                    padding: 40px 20px;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                ">
                    <div class="pulse-rings" style="position: absolute; pointer-events: none;">
                        <div style="position: absolute; width: 200px; height: 200px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; animation: pulse-ring 1.5s infinite;"></div>
                        <div style="position: absolute; width: 200px; height: 200px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; animation: pulse-ring 1.5s infinite 0.5s;"></div>
                    </div>
                    
                    <div style="font-size: 80px; margin-bottom: 20px; filter: drop-shadow(0 0 30px rgba(255,255,255,0.5)); animation: gentle-pulse 2s infinite;">☬</div>
                    
                    <div style="font-size: 72px; font-weight: 200; letter-spacing: -4px; margin-bottom: 10px;">
                        ${displayHour.toString().padStart(2, '0')}:${time[1]} <span style="font-size: 28px;">${period}</span>
                    </div>
                    
                    <div style="font-size: 28px; font-weight: 500; margin-bottom: 10px;">${alarm.label || 'Reminder'}</div>
                    
                    ${alarm.gurmukhi ? `<div style="font-size: 20px; opacity: 0.8; margin-bottom: 40px;">${alarm.gurmukhi}</div>` : ''}
                    
                    <div style="display: flex; flex-direction: column; gap: 16px; width: 100%; max-width: 300px; margin-top: 40px;">
                        <button id="dismissAlarmBtn" style="
                            padding: 18px 40px;
                            border-radius: 50px;
                            font-size: 18px;
                            font-weight: 600;
                            cursor: pointer;
                            border: none;
                            background: rgba(255,255,255,0.95);
                            color: #1a1a2e;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                        ">✓ I'm Awake</button>
                        
                        <button id="snoozeAlarmBtn" style="
                            padding: 16px 40px;
                            border-radius: 50px;
                            font-size: 16px;
                            font-weight: 500;
                            cursor: pointer;
                            border: 1px solid rgba(255,255,255,0.3);
                            background: rgba(255,255,255,0.15);
                            color: white;
                            backdrop-filter: blur(10px);
                        ">😴 Snooze 5 Minutes</button>
                    </div>
                </div>
                
                <style>
                    @keyframes pulse-ring {
                        0% { transform: scale(1); opacity: 1; }
                        100% { transform: scale(2); opacity: 0; }
                    }
                    @keyframes gentle-pulse {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.1); opacity: 0.8; }
                    }
                </style>
            `;

            document.body.appendChild(modal);

            // Event listeners
            document.getElementById('dismissAlarmBtn').addEventListener('click', () => {
                this.dismissAlarm(alarm.id);
                modal.remove();
            });

            document.getElementById('snoozeAlarmBtn').addEventListener('click', () => {
                this.snoozeAlarm(alarm.id, 5);
                modal.remove();
            });
        },

        // Dismiss alarm
        dismissAlarm(alarmId) {
            console.log(`✓ Alarm ${alarmId} dismissed`);

            stopAudio();
            broadcast('ALARM_DISMISSED', { alarmId });

            // Release wake lock
            if (State.wakeLock) {
                State.wakeLock.release();
                State.wakeLock = null;
            }

            // Record as completed
            window.dispatchEvent(new CustomEvent('alarmSyncUpdate', {
                detail: {
                    reminderId: alarmId,
                    status: 'completed',
                    timestamp: new Date().toISOString()
                }
            }));

            // Show success feedback
            this.showSuccessAnimation();
        },

        // Snooze alarm
        snoozeAlarm(alarmId, minutes = 5) {
            console.log(`😴 Alarm ${alarmId} snoozed for ${minutes} minutes`);

            stopAudio();
            broadcast('ALARM_DISMISSED', { alarmId });

            // Release wake lock
            if (State.wakeLock) {
                State.wakeLock.release();
                State.wakeLock = null;
            }

            // Schedule snooze
            const delay = minutes * 60 * 1000;

            setTimeout(async () => {
                const alarm = await dbGet(alarmId);
                if (alarm) {
                    this.triggerAlarm(alarm);
                }
            }, delay);

            // Record as snoozed
            window.dispatchEvent(new CustomEvent('alarmSyncUpdate', {
                detail: {
                    reminderId: alarmId,
                    status: 'snoozed',
                    timestamp: new Date().toISOString()
                }
            }));
        },

        // Show success animation
        showSuccessAnimation() {
            const anim = document.createElement('div');
            anim.style.cssText = `
                position: fixed;
                inset: 0;
                z-index: 10001;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: rgba(52, 199, 89, 0.95);
                color: white;
                font-family: -apple-system, sans-serif;
                animation: fadeIn 0.3s ease;
            `;
            anim.innerHTML = `
                <div style="font-size: 80px; margin-bottom: 20px;">✓</div>
                <div style="font-size: 24px; font-weight: 600;">ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ!</div>
                <div style="font-size: 18px; margin-top: 10px; opacity: 0.9;">Progress recorded</div>
            `;

            document.body.appendChild(anim);

            setTimeout(() => {
                anim.style.animation = 'fadeIn 0.3s ease reverse';
                setTimeout(() => anim.remove(), 300);
            }, 1500);
        },

        // Check for missed alarms when tab becomes visible
        async checkMissedAlarms() {
            const alarms = await dbGetAll();
            const now = Date.now();

            alarms.forEach(alarm => {
                if (!alarm.enabled) return;

                const lastCheck = alarm.lastChecked || 0;
                const nextOccurrence = getNextOccurrence(alarm.time, alarm.days);

                // If alarm should have fired between last check and now
                if (nextOccurrence.getTime() < now && nextOccurrence.getTime() > lastCheck) {
                    console.log(`⚠️ Missed alarm detected: ${alarm.label}`);

                    // Show missed alarm notification
                    if (Notification.permission === 'granted') {
                        new Notification(`Missed: ${alarm.label}`, {
                            body: 'You may have missed this reminder',
                            icon: CONFIG.iconPath,
                            tag: `missed-${alarm.id}`
                        });
                    }
                }

                // Update last checked time
                alarm.lastChecked = now;
                dbPut(alarm);
            });
        },

        // Stop audio
        stopAudio,

        // Request permissions
        requestPermission: requestNotificationPermission,

        // Get state
        getState() {
            return {
                methods: State.methods,
                scheduledCount: State.scheduledTimeouts.size,
                hasServiceWorker: !!State.swRegistration
            };
        }
    };

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ReliableAlarms.init());
    } else {
        ReliableAlarms.init();
    }

    // Expose globally
    window.ReliableAlarms = ReliableAlarms;

})();