/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔔 GLOBAL ALARM SYSTEM v3.0 - Professional-Grade Cross-Page Alarm Handler
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ Works on ALL pages (Home, NaamAbhyas, NitnemTracker, etc.)
 * ✅ Background notifications via Service Worker
 * ✅ Cross-tab synchronization via BroadcastChannel
 * ✅ Real-time Naam Abhyas ↔ Nitnem Tracker sync
 * ✅ Premium iOS-style modal with animations
 * ✅ Never Miss Mode with persistent alarms
 * ✅ Haptic feedback on supported devices
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // Prevent duplicate initialization
    if (window.GLOBAL_ALARM_SYSTEM_ACTIVE) {
        console.log('🔔 Global Alarm System already active');
        return;
    }
    window.GLOBAL_ALARM_SYSTEM_ACTIVE = true;

    // ══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ══════════════════════════════════════════════════════════════════════════
    const CONFIG = {
        // Storage Keys
        REMINDERS_KEYS: ['sr_reminders_v4', 'sr_reminders_v3', 'smart_reminders_v1'],
        SETTINGS_KEY: 'sr_settings_v4',
        ALARM_LOG_KEY: 'nitnemTracker_alarmLog',
        NAAM_ABHYAS_LOG: 'naamAbhyas_sessions',

        // Audio Configuration
        AUDIO_BASE_PATH: detectAudioPath(),
        AUDIO_FILES: {
            'audio1': 'audio1.mp3',
            'audio2': 'audio2.mp3',
            'audio3': 'audio3.mpeg',
            'audio4': 'audio4.mpeg',
            'audio5': 'audio5.mpeg',
            'audio6': 'audio6.mpeg'
        },

        // Timing
        CHECK_INTERVAL: 5000,        // Check every 5 seconds
        NORMAL_MODE_DURATION: 120,   // 2 minutes before auto-stop
        PRE_REMINDER_MINUTES: 5,     // Pre-reminder before actual time

        // Vibration
        VIBRATION_PATTERN: [500, 200, 500, 200, 1000, 300, 500],
        VIBRATION_LOOP_MS: 3000,

        // BroadcastChannel name
        CHANNEL_NAME: 'gurbani-radio-alarms'
    };

    // Detect audio path based on current page location
    function detectAudioPath() {
        const path = window.location.pathname.toLowerCase();
        const subdirs = ['/reminders/', '/nitnemtracker/', '/naamabhyas/', '/hukamnama/',
            '/calendar/', '/notes/', '/sehajpaath/', '/gurbanisearch/'];

        for (const subdir of subdirs) {
            if (path.includes(subdir)) {
                return '../Audio/';
            }
        }
        return 'Audio/';
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ══════════════════════════════════════════════════════════════════════════
    const State = {
        scheduledAlarms: new Map(),
        currentAudio: null,
        vibrationInterval: null,
        normalModeTimeout: null,
        currentModal: null,
        isNeverMissMode: false,
        checkInterval: null,
        broadcastChannel: null,
        lastAlarmCheck: 0,
        firedAlarms: new Set() // Track fired alarms to prevent duplicates
    };

    // ══════════════════════════════════════════════════════════════════════════
    // BROADCAST CHANNEL FOR CROSS-TAB SYNC
    // ══════════════════════════════════════════════════════════════════════════
    function initBroadcastChannel() {
        try {
            State.broadcastChannel = new BroadcastChannel(CONFIG.CHANNEL_NAME);

            State.broadcastChannel.onmessage = (event) => {
                const { type, data } = event.data;

                switch (type) {
                    case 'ALARM_FIRED':
                        // Another tab fired alarm, suppress this one
                        State.firedAlarms.add(data.alarmKey);
                        break;

                    case 'ALARM_STOPPED':
                        // User stopped alarm in another tab
                        stopAlarmSilent();
                        break;

                    case 'NAAM_ABHYAS_UPDATE':
                        // Naam Abhyas session updated, sync to Nitnem Tracker
                        syncNaamAbhyasToTracker(data);
                        break;

                    case 'NITNEM_UPDATE':
                        // Nitnem completion updated
                        window.dispatchEvent(new CustomEvent('nitnemUpdate', { detail: data }));
                        break;

                    case 'REFRESH_ALARMS':
                        // Reload alarms from storage
                        scheduleAllAlarms();
                        break;
                }
            };

            console.log('📡 BroadcastChannel initialized for cross-tab sync');
        } catch (e) {
            console.warn('BroadcastChannel not supported:', e);
        }
    }

    function broadcast(type, data) {
        if (State.broadcastChannel) {
            try {
                State.broadcastChannel.postMessage({ type, data });
            } catch (e) {
                console.warn('Broadcast failed:', e);
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // NAAM ABHYAS ↔ NITNEM TRACKER SYNC
    // ══════════════════════════════════════════════════════════════════════════
    function syncNaamAbhyasToTracker(sessionData) {
        try {
            const today = new Date().toLocaleDateString('en-CA');

            // Load existing Nitnem log
            const nitnemLog = JSON.parse(localStorage.getItem('nitnemTracker_log') || '{}');

            if (!nitnemLog[today]) {
                nitnemLog[today] = { naamAbhyas: [] };
            }

            // Add Naam Abhyas session
            if (!nitnemLog[today].naamAbhyas) {
                nitnemLog[today].naamAbhyas = [];
            }

            // Avoid duplicates
            const exists = nitnemLog[today].naamAbhyas.some(
                s => s.timestamp === sessionData.timestamp
            );

            if (!exists) {
                nitnemLog[today].naamAbhyas.push(sessionData);
                localStorage.setItem('nitnemTracker_log', JSON.stringify(nitnemLog));

                console.log('✅ Naam Abhyas synced to Nitnem Tracker:', sessionData);

                // Notify any listening components
                window.dispatchEvent(new CustomEvent('naamAbhyasSynced', { detail: sessionData }));
            }
        } catch (e) {
            console.error('Naam Abhyas sync error:', e);
        }
    }

    // Listen for Naam Abhyas completions on this page
    function setupNaamAbhyasSync() {
        window.addEventListener('naamAbhyasComplete', (e) => {
            const sessionData = {
                count: e.detail?.count || 0,
                duration: e.detail?.duration || 0,
                timestamp: new Date().toISOString(),
                source: 'naamAbhyas'
            };

            // Sync locally
            syncNaamAbhyasToTracker(sessionData);

            // Broadcast to other tabs
            broadcast('NAAM_ABHYAS_UPDATE', sessionData);
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LOAD REMINDERS FROM STORAGE
    // ══════════════════════════════════════════════════════════════════════════
    function loadReminders() {
        try {
            let raw = null;

            // Try multiple storage keys
            for (const key of CONFIG.REMINDERS_KEYS) {
                raw = localStorage.getItem(key);
                if (raw) break;
            }

            if (!raw) {
                console.log('📋 No reminders found in storage');
                return null;
            }

            const data = JSON.parse(raw);
            let reminders = [];

            // Handle different data formats
            if (Array.isArray(data)) {
                reminders = data;
            } else if (data.core || data.custom) {
                if (data.core) {
                    Object.values(data.core).forEach(r => reminders.push(r));
                }
                if (Array.isArray(data.custom)) {
                    reminders.push(...data.custom);
                }
            }

            // Load settings
            const settingsRaw = localStorage.getItem(CONFIG.SETTINGS_KEY);
            const settings = settingsRaw ? JSON.parse(settingsRaw) : (data.options || {});
            State.isNeverMissMode = settings?.neverMissMode || false;

            return { reminders, settings };
        } catch (e) {
            console.error('Error loading reminders:', e);
            return null;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SCHEDULE ALL ALARMS
    // ══════════════════════════════════════════════════════════════════════════
    function scheduleAllAlarms() {
        const data = loadReminders();
        if (!data || !data.reminders) return;

        const now = Date.now();

        data.reminders.forEach(reminder => {
            if (!reminder.enabled) return;

            const nextTime = getNextOccurrence(reminder.time);
            if (!nextTime) return;

            // Schedule main alarm
            scheduleAlarm(reminder, nextTime, false, data.settings);

            // Schedule pre-reminder if configured
            const preMinutes = Number(data.settings?.preReminderMinutes || CONFIG.PRE_REMINDER_MINUTES);
            if (preMinutes > 0) {
                const preTime = new Date(nextTime.getTime() - preMinutes * 60 * 1000);
                if (preTime.getTime() > now) {
                    scheduleAlarm(reminder, preTime, true, data.settings);
                }
            }
        });

        // Also schedule via Service Worker for background support
        scheduleViaServiceWorker(data);
    }

    function scheduleAlarm(reminder, time, isPreReminder, settings) {
        const delay = time.getTime() - Date.now();

        // Only schedule if in future and within 24 hours
        if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return;

        const keyType = isPreReminder ? 'PRE' : 'MAIN';
        const key = `${reminder.id}-${keyType}-${time.getTime()}`;

        // Skip if already scheduled
        if (State.scheduledAlarms.has(key)) return;

        // Skip if already fired
        if (State.firedAlarms.has(key)) return;

        console.log(`⏰ Scheduling ${isPreReminder ? 'pre-' : ''}alarm: ${reminder.title || reminder.label} at ${time.toLocaleTimeString()}`);

        const timeoutId = setTimeout(() => {
            // Check if already fired by another tab
            if (State.firedAlarms.has(key)) return;

            State.firedAlarms.add(key);
            broadcast('ALARM_FIRED', { alarmKey: key });

            fireAlarm(reminder, isPreReminder, settings);
            State.scheduledAlarms.delete(key);
        }, delay);

        State.scheduledAlarms.set(key, timeoutId);
    }

    function scheduleViaServiceWorker(data) {
        if (!navigator.serviceWorker?.controller) return;

        data.reminders.forEach(reminder => {
            if (!reminder.enabled) return;

            const nextTime = getNextOccurrence(reminder.time);
            if (!nextTime) return;

            navigator.serviceWorker.controller.postMessage({
                type: 'SCHEDULE_NOTIFICATION',
                payload: {
                    id: `alarm_${reminder.id}`,
                    title: reminder.title || reminder.label || 'Reminder',
                    body: getAlarmBody(reminder),
                    scheduledTime: nextTime.getTime(),
                    tag: `gurbani-alarm-${reminder.id}`,
                    requireInteraction: true,
                    recurring: true,
                    data: {
                        url: window.location.href,
                        reminderId: reminder.id
                    }
                }
            });
        });
    }

    function getAlarmBody(reminder) {
        const type = reminder.type || reminder.id || '';
        const bodies = {
            'amritvela': 'ਅੰਮ੍ਰਿਤ ਵੇਲੇ ਦਾ ਸਮਾਂ - Time for Amritvela',
            'rehras': 'ਰਹਿਰਾਸ ਸਾਹਿਬ ਦਾ ਸਮਾਂ - Time for Rehras Sahib',
            'sohila': 'ਸੋਹਿਲਾ ਸਾਹਿਬ ਦਾ ਸਮਾਂ - Time for Sohila Sahib',
            'naamAbhyas': 'ਨਾਮ ਅਭਿਆਸ ਦਾ ਸਮਾਂ - Time for Naam Abhyas'
        };
        return bodies[type] || 'Time for your spiritual practice';
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CHECK FOR MISSED ALARMS
    // ══════════════════════════════════════════════════════════════════════════
    function checkMissedAlarms() {
        const data = loadReminders();
        if (!data || !data.reminders) return;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const today = now.toLocaleDateString('en-CA');

        const alarmLog = JSON.parse(localStorage.getItem(CONFIG.ALARM_LOG_KEY) || '{}');

        data.reminders.forEach(reminder => {
            if (!reminder.enabled) return;

            const [h, m] = (reminder.time || '00:00').split(':').map(Number);
            const reminderMinutes = h * 60 + m;

            // Check if should have fired in last 5 minutes
            const diff = currentMinutes - reminderMinutes;
            if (diff >= 0 && diff <= 5) {
                // Check if already responded today
                if (!alarmLog[today]?.[reminder.id]) {
                    console.log(`⚠️ Missed alarm detected: ${reminder.title || reminder.label}`);
                    fireAlarm(reminder, false, data.settings);
                }
            }
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FIRE ALARM 🔥
    // ══════════════════════════════════════════════════════════════════════════
    // ══════════════════════════════════════════════════════════════════════════
    // AUDIO STORAGE (IndexedDB)
    // ══════════════════════════════════════════════════════════════════════════
    const AudioStorage = {
        dbName: 'GurbaniAudioDB',
        storeName: 'custom_audio',
        db: null,

        async init() {
            if (this.db) return this.db;
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, 1);
                request.onerror = () => reject(request.error);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName);
                    }
                };
                request.onsuccess = (e) => {
                    this.db = e.target.result;
                    resolve(this.db);
                };
            });
        },

        async getAudio(id) {
            try {
                await this.init();
                return new Promise((resolve, reject) => {
                    const tx = this.db.transaction(this.storeName, 'readonly');
                    const store = tx.objectStore(this.storeName);
                    const request = store.get(id);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            } catch (e) {
                console.error('AudioStorage error:', e);
                return null;
            }
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // FIRE ALARM 🔥
    // ══════════════════════════════════════════════════════════════════════════
    async function fireAlarm(reminder, isPreReminder, settings = {}) {
        console.log(`🔥 FIRING ${isPreReminder ? 'PRE-' : ''}ALARM:`, reminder.title || reminder.label);

        const tone = reminder.tone || 'audio1';
        const neverMiss = settings?.neverMissMode || State.isNeverMissMode;

        // Play sound (Async now)
        if (!isPreReminder) {
            await playSound(tone, true, neverMiss);
            startVibration(neverMiss);

            // Auto-stop for normal mode
            if (!neverMiss) {
                State.normalModeTimeout = setTimeout(() => {
                    logAlarmInteraction(reminder.id, 'missed');
                    stopAlarm();
                }, CONFIG.NORMAL_MODE_DURATION * 1000);
            }
        } else {
            await playSound(tone, false, false);
            triggerHaptic('light');
        }

        // Show modal
        showPremiumAlarmModal(reminder, isPreReminder, settings);

        // Show browser notification if page is hidden
        showBrowserNotification(reminder, isPreReminder);

        // Trigger window wake if possible
        wakeScreen();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // AUDIO SYSTEM
    // ══════════════════════════════════════════════════════════════════════════
    async function playSound(toneId, loop = true, neverMiss = false) {
        stopAudio();

        let audioPath = null;
        let isBlob = false;

        try {
            // 1. Check Standard Config Map
            if (CONFIG.AUDIO_FILES[toneId]) {
                audioPath = CONFIG.AUDIO_BASE_PATH + CONFIG.AUDIO_FILES[toneId];
            }
            // 2. Check if text path (legacy support for full paths)
            else if (typeof toneId === 'string' && (toneId.includes('/') || toneId.startsWith('http'))) {
                audioPath = toneId;
            }
            // 3. Check IndexedDB for custom blob
            else {
                const blob = await AudioStorage.getAudio(toneId);
                if (blob) {
                    audioPath = URL.createObjectURL(blob);
                    isBlob = true;
                } else {
                    // Fallback to default
                    console.warn(`Audio tone '${toneId}' not found, using fallback.`);
                    audioPath = CONFIG.AUDIO_BASE_PATH + CONFIG.AUDIO_FILES['audio1'];
                }
            }

            State.currentAudio = new Audio(audioPath);
            State.currentAudio.loop = loop;
            State.currentAudio.volume = 1.0;

            const playPromise = State.currentAudio.play();
            if (playPromise) {
                playPromise.catch(e => {
                    console.warn('Audio autoplay blocked, trying unlock:', e);
                    // Try to unlock audio on user interaction
                    const unlock = () => {
                        if (State.currentAudio) {
                            State.currentAudio.play().catch(() => { });
                            document.removeEventListener('click', unlock);
                            document.removeEventListener('touchstart', unlock);
                            document.removeEventListener('keydown', unlock);
                        }
                    };
                    document.addEventListener('click', unlock, { once: true });
                    document.addEventListener('touchstart', unlock, { once: true });
                    document.addEventListener('keydown', unlock, { once: true });
                });
            }

            // Never Miss Mode: Restart if ended
            if (neverMiss && !loop) {
                State.currentAudio.onended = () => {
                    if (State.currentAudio) {
                        State.currentAudio.currentTime = 0;
                        State.currentAudio.play().catch(() => { });
                    }
                };
            }

        } catch (e) {
            console.error('Audio playback critical failure:', e);
            // Last resort fallback
            try {
                const fallbackPath = CONFIG.AUDIO_BASE_PATH + CONFIG.AUDIO_FILES['audio1'];
                State.currentAudio = new Audio(fallbackPath);
                State.currentAudio.loop = loop;
                State.currentAudio.play().catch(err => console.error('Fallback failed:', err));
            } catch (err2) {
                console.error('Even fallback failed', err2);
            }
        }
    }

    function stopAudio() {
        if (State.currentAudio) {
            State.currentAudio.pause();
            State.currentAudio.currentTime = 0;
            State.currentAudio = null;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // VIBRATION SYSTEM
    // ══════════════════════════════════════════════════════════════════════════
    function startVibration(continuous = false) {
        if (!navigator.vibrate) return;

        const vibrate = () => navigator.vibrate(CONFIG.VIBRATION_PATTERN);

        vibrate();

        if (continuous) {
            State.vibrationInterval = setInterval(vibrate, CONFIG.VIBRATION_LOOP_MS);
        }
    }

    function stopVibration() {
        if (State.vibrationInterval) {
            clearInterval(State.vibrationInterval);
            State.vibrationInterval = null;
        }
        if (navigator.vibrate) {
            navigator.vibrate(0);
        }
    }

    function triggerHaptic(style = 'medium') {
        if (!navigator.vibrate) return;

        const patterns = {
            light: [50],
            medium: [100, 50, 100],
            heavy: [200, 100, 200, 100, 200],
            success: [50, 50, 100],
            error: [300, 100, 300]
        };

        navigator.vibrate(patterns[style] || patterns.medium);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STOP ALARM
    // ══════════════════════════════════════════════════════════════════════════
    function stopAlarm() {
        stopAudio();
        stopVibration();

        if (State.normalModeTimeout) {
            clearTimeout(State.normalModeTimeout);
            State.normalModeTimeout = null;
        }

        closeModal();

        // Notify other tabs
        broadcast('ALARM_STOPPED', {});
    }

    function stopAlarmSilent() {
        stopAudio();
        stopVibration();

        if (State.normalModeTimeout) {
            clearTimeout(State.normalModeTimeout);
            State.normalModeTimeout = null;
        }

        closeModal();
    }

    function closeModal() {
        if (State.currentModal) {
            State.currentModal.style.opacity = '0';
            State.currentModal.style.transform = 'scale(0.95)';
            setTimeout(() => {
                if (State.currentModal) {
                    State.currentModal.remove();
                    State.currentModal = null;
                }
            }, 300);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PREMIUM iOS-STYLE ALARM MODAL
    // ══════════════════════════════════════════════════════════════════════════
    function showPremiumAlarmModal(reminder, isPreReminder, settings) {
        // Remove existing modal
        document.getElementById('global-alarm-overlay')?.remove();

        const snoozeMins = settings?.snoozeMinutes || 10;
        const neverMiss = settings?.neverMissMode || State.isNeverMissMode;

        const iconEmoji = getIconEmoji(reminder.icon || reminder.type);
        const gradientColor = isPreReminder
            ? 'linear-gradient(135deg, #30D158 0%, #28B14C 100%)'
            : getGradientForType(reminder.type || reminder.id);

        const modal = document.createElement('div');
        modal.id = 'global-alarm-overlay';
        State.currentModal = modal;

        modal.innerHTML = `
            <style>
                #global-alarm-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 999999;
                    background: linear-gradient(180deg, rgba(0,0,0,0.97) 0%, rgba(20,20,25,0.98) 100%);
                    backdrop-filter: blur(50px) saturate(200%);
                    -webkit-backdrop-filter: blur(50px) saturate(200%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
                    animation: alarmModalFadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                    padding: 24px;
                    box-sizing: border-box;
                    overflow: hidden;
                }
                
                @keyframes alarmModalFadeIn {
                    from { opacity: 0; transform: scale(1.1); }
                    to { opacity: 1; transform: scale(1); }
                }
                
                .alarm-ambient-glow {
                    position: absolute;
                    width: 400px;
                    height: 400px;
                    border-radius: 50%;
                    background: ${gradientColor};
                    opacity: 0.15;
                    filter: blur(100px);
                    animation: ambientPulse 3s ease-in-out infinite;
                }
                
                @keyframes ambientPulse {
                    0%, 100% { transform: scale(1); opacity: 0.15; }
                    50% { transform: scale(1.2); opacity: 0.25; }
                }
                
                .alarm-icon-container {
                    position: relative;
                    width: 140px;
                    height: 140px;
                    margin-bottom: 32px;
                    z-index: 1;
                }
                
                .alarm-pulse-ring {
                    position: absolute;
                    inset: -20px;
                    border: 2px solid;
                    border-image: ${gradientColor} 1;
                    border-radius: 50%;
                    animation: pulseRing 2s ease-out infinite;
                    opacity: 0;
                }
                
                .alarm-pulse-ring:nth-child(2) { animation-delay: 0.5s; }
                .alarm-pulse-ring:nth-child(3) { animation-delay: 1s; }
                
                @keyframes pulseRing {
                    0% { transform: scale(0.6); opacity: 0.8; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
                
                .alarm-icon-circle {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    background: ${gradientColor};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 64px;
                    box-shadow: 
                        0 20px 60px rgba(255, 159, 10, 0.4),
                        inset 0 2px 10px rgba(255,255,255,0.3);
                    animation: iconBounce 1.5s ease-in-out infinite;
                }
                
                @keyframes iconBounce {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    25% { transform: translateY(-8px) rotate(-5deg); }
                    75% { transform: translateY(-8px) rotate(5deg); }
                }
                
                .alarm-content {
                    text-align: center;
                    z-index: 1;
                    max-width: 320px;
                }
                
                .alarm-time {
                    font-size: 72px; /* Larger for better visibility */
                    font-weight: 300; /* Lighter weight akin to iOS Lock Screen */
                    letter-spacing: -1px;
                    background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.85) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 8px;
                    font-variant-numeric: tabular-nums;
                    font-family: -apple-system, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
                }
                
                .alarm-title {
                    font-size: 24px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    text-shadow: 0 2px 20px rgba(0,0,0,0.5);
                }
                
                .alarm-subtitle {
                    font-size: 16px;
                    color: rgba(255,255,255,0.6);
                    margin-bottom: 24px;
                }
                
                .alarm-never-miss-badge {
                    display: ${neverMiss && !isPreReminder ? 'inline-flex' : 'none'};
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(255, 69, 58, 0.15);
                    border: 1px solid rgba(255, 69, 58, 0.3);
                    border-radius: 100px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #FF453A;
                    margin-bottom: 32px;
                    animation: badgePulse 2s ease-in-out infinite;
                }
                
                @keyframes badgePulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 69, 58, 0.4); }
                    50% { box-shadow: 0 0 0 10px rgba(255, 69, 58, 0); }
                }
                
                .alarm-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    width: 100%;
                    max-width: 300px;
                    z-index: 1;
                }
                
                .alarm-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 18px 24px;
                    border: none;
                    border-radius: 16px;
                    font-size: 17px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                    -webkit-tap-highlight-color: transparent;
                }
                
                .alarm-btn:active {
                    transform: scale(0.96);
                }
                
                .alarm-btn-stop {
                    background: linear-gradient(135deg, #30D158 0%, #28A745 100%);
                    color: white;
                    box-shadow: 0 8px 30px rgba(48, 209, 88, 0.4);
                }
                
                .alarm-btn-stop:hover {
                    box-shadow: 0 12px 40px rgba(48, 209, 88, 0.5);
                }
                
                .alarm-btn-snooze {
                    background: rgba(255,255,255,0.08);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.15);
                    backdrop-filter: blur(10px);
                }
                
                .alarm-btn-snooze:hover {
                    background: rgba(255,255,255,0.12);
                }
                
                .alarm-footer {
                    position: absolute;
                    bottom: 40px;
                    font-size: 11px;
                    color: rgba(255,255,255,0.25);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-weight: 500;
                }
                
                .alarm-btn svg {
                    width: 20px;
                    height: 20px;
                }
            </style>
            
            <div class="alarm-ambient-glow"></div>
            
            <div class="alarm-icon-container">
                <div class="alarm-pulse-ring"></div>
                <div class="alarm-pulse-ring"></div>
                <div class="alarm-pulse-ring"></div>
                <div class="alarm-icon-circle">
                    <span>${iconEmoji}</span>
                </div>
            </div>
            
            <div class="alarm-content">
                <div class="alarm-time">${formatTime(reminder.time)}</div>
                <h1 class="alarm-title">${reminder.title || reminder.label || 'Reminder'}</h1>
                <p class="alarm-subtitle">${isPreReminder ? 'Starting soon...' : getAlarmBody(reminder)}</p>
                
                <div class="alarm-never-miss-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                    </svg>
                    <span>Never Miss Mode Active</span>
                </div>
            </div>
            
            <div class="alarm-buttons">
                <button id="alarm-btn-stop" class="alarm-btn alarm-btn-stop">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                    ${isPreReminder ? 'Got it!' : 'Stop Alarm'}
                </button>
                
                ${!isPreReminder ? `
                    <button id="alarm-btn-snooze" class="alarm-btn alarm-btn-snooze">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM12 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                        </svg>
                        Snooze (${snoozeMins} min)
                    </button>
                ` : ''}
            </div>
            
            <p class="alarm-footer">੧ੳਅ Gurbani Radio</p>
        `;

        document.body.appendChild(modal);

        // Bind events
        modal.querySelector('#alarm-btn-stop')?.addEventListener('click', () => {
            triggerHaptic('success');
            stopAlarm();
            logAlarmInteraction(reminder.id, isPreReminder ? 'acknowledged' : 'responded');
        });

        const snoozeBtn = modal.querySelector('#alarm-btn-snooze');
        if (snoozeBtn) {
            snoozeBtn.addEventListener('click', () => {
                triggerHaptic('medium');
                stopAlarm();
                logAlarmInteraction(reminder.id, 'snoozed');
                scheduleSnooze(reminder, snoozeMins);
            });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════
    function getIconEmoji(iconType) {
        const iconMap = {
            'sunrise': '🌅',
            'sunset': '🌇',
            'moon': '🌙',
            'bell': '🔔',
            'clock': '⏰',
            'star': '⭐',
            'heart': '❤️',
            'book': '📖',
            'music': '🎵',
            'custom': '🔔',
            'amritvela': '🌅',
            'rehras': '🌇',
            'sohila': '🌙',
            'naamAbhyas': '📿'
        };

        if (!iconType) return '🔔';
        if (iconType.length <= 2 || /\p{Emoji}/u.test(iconType)) return iconType;
        return iconMap[iconType.toLowerCase()] || '🔔';
    }

    function getGradientForType(type) {
        const gradients = {
            'amritvela': 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)',
            'rehras': 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
            'sohila': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'naamAbhyas': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'default': 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)'
        };
        return gradients[type] || gradients.default;
    }

    function formatTime(timeStr) {
        if (!timeStr) return '--:--';

        try {
            const [h, m] = timeStr.split(':').map(Number);
            const period = h >= 12 ? 'PM' : 'AM';
            const hour12 = h % 12 || 12;
            return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
        } catch {
            return timeStr;
        }
    }

    function getNextOccurrence(timeStr) {
        if (!timeStr) return null;

        const [h, m] = timeStr.split(':').map(Number);
        const now = new Date();
        const target = new Date(now);
        target.setHours(h, m, 0, 0);

        if (target <= now) {
            target.setDate(target.getDate() + 1);
        }

        return target;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LOGGING
    // ══════════════════════════════════════════════════════════════════════════
    function logAlarmInteraction(alarmId, action) {
        try {
            const today = new Date().toLocaleDateString('en-CA');
            const timestamp = new Date().toISOString();

            // Load existing log
            const log = JSON.parse(localStorage.getItem(CONFIG.ALARM_LOG_KEY) || '{}');

            if (!log[today]) log[today] = {};
            log[today][alarmId] = { status: action, timestamp };

            localStorage.setItem(CONFIG.ALARM_LOG_KEY, JSON.stringify(log));

            // Dispatch event for Nitnem Tracker
            window.dispatchEvent(new CustomEvent('alarmInteraction', {
                detail: { alarmId, action, timestamp }
            }));

            // Broadcast to other tabs
            broadcast('NITNEM_UPDATE', { alarmId, action, timestamp, date: today });

            console.log(`📝 Alarm logged: ${alarmId} - ${action}`);
        } catch (e) {
            console.error('Error logging alarm:', e);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SNOOZE
    // ══════════════════════════════════════════════════════════════════════════
    function scheduleSnooze(reminder, minutes) {
        const snoozeTime = Date.now() + (minutes * 60 * 1000);

        // Schedule locally
        setTimeout(() => {
            const data = loadReminders();
            fireAlarm(reminder, false, data?.settings || {});
        }, minutes * 60 * 1000);

        // Also schedule via service worker
        if (navigator.serviceWorker?.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SCHEDULE_NOTIFICATION',
                payload: {
                    id: `snooze_${reminder.id}_${snoozeTime}`,
                    title: reminder.title || reminder.label || 'Snoozed Reminder',
                    body: 'Your snoozed alarm is ringing!',
                    scheduledTime: snoozeTime,
                    tag: `snooze-${reminder.id}`,
                    requireInteraction: true,
                    data: { url: window.location.href }
                }
            });
        }

        console.log(`⏰ Snooze scheduled for ${minutes} minutes`);
        showToast(`Snoozed for ${minutes} minutes`, 'info');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BROWSER NOTIFICATION
    // ══════════════════════════════════════════════════════════════════════════
    function showBrowserNotification(reminder, isPreReminder) {
        if (document.visibilityState === 'visible') return;
        if (!('Notification' in window)) return;

        // Request permission if needed
        if (Notification.permission === 'default') {
            Notification.requestPermission();
            return;
        }

        if (Notification.permission !== 'granted') return;

        try {
            const notification = new Notification(
                isPreReminder ? `Coming Up: ${reminder.title || reminder.label}` : (reminder.title || reminder.label),
                {
                    body: getAlarmBody(reminder),
                    icon: '/assets/favicon.svg',
                    badge: '/assets/favicon.svg',
                    tag: `alarm-${reminder.id}`,
                    requireInteraction: !isPreReminder,
                    vibrate: [200, 100, 200]
                }
            );

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (e) {
            console.error('Notification error:', e);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SCREEN WAKE
    // ══════════════════════════════════════════════════════════════════════════
    async function wakeScreen() {
        try {
            if ('wakeLock' in navigator) {
                const wakeLock = await navigator.wakeLock.request('screen');
                setTimeout(() => wakeLock.release(), 30000);
            }
        } catch (e) {
            // Wake lock not available or denied
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TOAST NOTIFICATION
    // ══════════════════════════════════════════════════════════════════════════
    function showToast(message, type = 'info') {
        // Check if Toast is available globally
        if (window.Toast && typeof window.Toast[type] === 'function') {
            window.Toast[type](message);
            return;
        }

        // Fallback toast
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: rgba(30, 30, 35, 0.95);
            color: white;
            padding: 14px 24px;
            border-radius: 14px;
            font-family: -apple-system, sans-serif;
            font-size: 15px;
            font-weight: 500;
            z-index: 999998;
            backdrop-filter: blur(20px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            animation: toastSlide 0.3s ease;
        `;
        toast.textContent = message;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes toastSlide {
                from { transform: translateX(-50%) translateY(40px); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════
    function init() {
        console.log('🔔 Global Alarm System v3.0 Initializing...');

        // Initialize broadcast channel
        initBroadcastChannel();

        // Setup Naam Abhyas sync
        setupNaamAbhyasSync();

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            setTimeout(() => {
                Notification.requestPermission().then(permission => {
                    console.log('📬 Notification permission:', permission);
                });
            }, 2000);
        }

        // Schedule all alarms
        scheduleAllAlarms();

        // Check for missed alarms
        checkMissedAlarms();

        // Regular check interval — skip when SW is active (SW is single source of truth)
        if (!navigator.serviceWorker?.controller) {
            State.checkInterval = setInterval(() => {
                scheduleAllAlarms();
            }, CONFIG.CHECK_INTERVAL);
        }

        // Visibility change handler
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                scheduleAllAlarms();
                checkMissedAlarms();
            }
        });

        // Focus handler
        window.addEventListener('focus', () => {
            scheduleAllAlarms();
            checkMissedAlarms();
        });

        // Storage change handler (for sync across tabs)
        window.addEventListener('storage', (e) => {
            if (CONFIG.REMINDERS_KEYS.includes(e.key)) {
                console.log('📋 Reminders updated, rescheduling...');
                scheduleAllAlarms();
            }
        });

        console.log('✅ Global Alarm System Ready!');
        console.log(`   📍 Current page: ${window.location.pathname}`);
        console.log(`   🔊 Audio path: ${CONFIG.AUDIO_BASE_PATH}`);
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging
    window.GlobalAlarmSystem = {
        scheduleAllAlarms,
        checkMissedAlarms,
        loadReminders,
        fireAlarm: (reminderId) => {
            const data = loadReminders();
            const reminder = data?.reminders?.find(r => r.id === reminderId);
            if (reminder) fireAlarm(reminder, false, data.settings);
        },
        getState: () => State
    };

})();
