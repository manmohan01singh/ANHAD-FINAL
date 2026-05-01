/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BACKGROUND ALARM SYSTEM - Global In-App Alarm Handler
 * Features: Never Miss Mode, Full Audio, Premium Modal, Nitnem Tracker Sync
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // Prevent duplicate execution
    if (window.BG_ALARM_RUNNING) return;
    window.BG_ALARM_RUNNING = true;

    // ══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ══════════════════════════════════════════════════════════════════════════
    const CONFIG = {
        STORAGE_KEY: 'smart_reminders_v1',
        ALARM_LOG_KEY: 'nitnemTracker_alarmLog',

        // Audio paths - detect subdirectory level
        AUDIO_BASE_PATH: (function () {
            const path = window.location.pathname;
            // Match common subdirectory patterns
            if (path.includes('/reminders/') ||
                path.includes('/NitnemTracker/') ||
                path.includes('/NaamAbhyas/') ||
                path.includes('/Hukamnama/') ||
                path.includes('/Calendar/') ||
                path.includes('/Notes/') ||
                path.includes('/SehajPaath/') ||
                path.includes('/GurbaniSearch/')) {
                return '../Audio/';
            }
            return 'Audio/';
        })(),

        AUDIO_FILES: {
            'audio1': 'audio1.mp3',
            'audio2': 'audio2.mp3',
            'audio3': 'audio3.mpeg',
            'audio4': 'audio4.mpeg',
            'audio5': 'audio5.mpeg',
            'audio6': 'audio6.mpeg'
        },

        // Check interval (every 10 seconds for real-time accuracy)
        CHECK_INTERVAL: 10000,

        // Normal mode duration (seconds before auto-stop)
        NORMAL_MODE_DURATION: 120,

        // Vibration patterns
        VIBRATION_PATTERN: [500, 200, 500, 200, 1000, 300, 500],
        VIBRATION_LOOP_INTERVAL: 3000
    };

    // ══════════════════════════════════════════════════════════════════════════
    // STATE
    // ══════════════════════════════════════════════════════════════════════════
    const State = {
        scheduled: new Map(),
        currentAudio: null,
        vibrationInterval: null,
        normalModeTimeout: null,
        currentModal: null,
        isNeverMissMode: false
    };

    // ══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════
    let checkInterval = null;

    function init() {
        console.log('🔔 Background Alarm System Initialized');

        // Schedule (standalone or if leader)
        if (!window.AnhadAlarmCoordinator || window.AnhadAlarmCoordinator.isLeader()) {
            checkAndSchedule();
        }

        // Re-check every 30 seconds for accuracy
        checkInterval = setInterval(() => {
            if (!window.AnhadAlarmCoordinator || window.AnhadAlarmCoordinator.isLeader()) {
                checkAndSchedule();
            }
        }, CONFIG.CHECK_INTERVAL);

        // Visibility change - check when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                if (!window.AnhadAlarmCoordinator || window.AnhadAlarmCoordinator.isLeader()) {
                    checkAndSchedule();
                }
                checkMissedAlarms();
            }
        });

        // Focus handler
        window.addEventListener('focus', () => {
            checkMissedAlarms();
        });

        // Listen for alarms from coordinator (non-leader tabs)
        if (window.AnhadAlarmCoordinator) {
            window.AnhadAlarmCoordinator.onAlarmFired((alarmId, reminder, isPreReminder) => {
                console.log('[BgAlarm] Received alarm from coordinator:', alarmId);
                if (window.AnhadAlarmCoordinator && !window.AnhadAlarmCoordinator.isLeader()) {
                    fireAlarm(reminder, isPreReminder, State.options || {});
                }
            });
        }

        // Pagehide cleanup
        window.addEventListener('pagehide', () => {
            console.log('[BgAlarm] Pagehide - clearing interval');
            if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
            }
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LOAD REMINDERS
    // ══════════════════════════════════════════════════════════════════════════
    function loadReminders() {
        try {
            // Try multiple storage keys for compatibility
            const keys = ['sr_reminders_v4', 'sr_reminders_v3', 'smart_reminders_v1'];
            let raw = null;

            for (const key of keys) {
                raw = localStorage.getItem(key);
                if (raw) break;
            }

            if (!raw) return null;

            const data = JSON.parse(raw);

            // Handle different data structures
            let reminders = [];
            if (Array.isArray(data)) {
                // v4 format - direct array
                reminders = data;
            } else if (data.core || data.custom) {
                // v1 format - object with core/custom
                if (data.core) {
                    Object.values(data.core).forEach(r => reminders.push(r));
                }
                if (Array.isArray(data.custom)) {
                    reminders.push(...data.custom);
                }
            }

            // Load settings separately for v4
            const settingsRaw = localStorage.getItem('sr_settings_v4');
            const settings = settingsRaw ? JSON.parse(settingsRaw) : (data.options || {});
            State.isNeverMissMode = settings?.neverMissMode || false;

            return { reminders, options: settings };
        } catch (e) {
            console.error('Error loading reminders:', e);
            return null;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CHECK AND SCHEDULE
    // ══════════════════════════════════════════════════════════════════════════
    function checkAndSchedule() {
        const data = loadReminders();
        if (!data || !data.reminders) return;

        const options = data.options || {};
        const allReminders = data.reminders;

        allReminders.forEach(rem => {
            if (!rem.enabled) return;

            // Calculate next occurrence
            let nextTime = getNextOccurrence(rem.time);
            if (!nextTime) return;

            // Quiet hours handling
            if (options.quietEnabled && isInQuietHours(nextTime, options)) {
                const quietEnd = getNextQuietEnd(nextTime, options);
                if (quietEnd) {
                    nextTime = quietEnd;
                }
            }

            // Schedule main alarm
            scheduleAlarm(rem, nextTime, false, options);

            // Schedule pre-reminder
            const preMinutes = Number(options.preReminderMinutes || 0);
            if (preMinutes > 0) {
                const preTime = new Date(nextTime.getTime() - preMinutes * 60 * 1000);
                if (preTime > new Date()) {
                    scheduleAlarm(rem, preTime, true, options);
                }
            }
        });
    }

    function scheduleAlarm(reminder, time, isPreReminder, options) {
        const delay = time.getTime() - Date.now();

        // Only schedule if in future and within 24 hours
        if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return;

        const keyType = isPreReminder ? 'PRE' : 'MAIN';
        const key = `${reminder.id}-${keyType}-${time.getTime()}`;

        // Already scheduled
        if (State.scheduled.has(key)) return;

        console.log(`⏰ Scheduling ${isPreReminder ? 'pre-' : ''}alarm: ${reminder.title} at ${time.toLocaleTimeString()}`);

        const timeoutId = setTimeout(() => {
            fireAlarm(reminder, isPreReminder, options);
            State.scheduled.delete(key);
        }, delay);

        State.scheduled.set(key, timeoutId);
    }

    function checkMissedAlarms() {
        const data = loadReminders();
        if (!data || !data.reminders) return;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const today = now.toLocaleDateString('en-CA');

        const allReminders = data.reminders;

        allReminders.forEach(rem => {
            if (!rem.enabled) return;

            const [h, m] = rem.time.split(':').map(Number);
            const reminderMinutes = h * 60 + m;

            // Check if should have fired in last 5 minutes
            const diff = currentMinutes - reminderMinutes;
            if (diff >= 0 && diff <= 5) {
                // Check if already responded today
                const log = JSON.parse(localStorage.getItem(CONFIG.ALARM_LOG_KEY) || '{}');
                if (!log[today]?.[rem.id]) {
                    console.log(`⚠️ Missed alarm detected: ${rem.title}`);
                    fireAlarm(rem, false, data.options || {});
                }
            }
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FIRE ALARM
    // ══════════════════════════════════════════════════════════════════════════
    function fireAlarm(reminder, isPreReminder, options) {
        console.log(`🔥 FIRING ${isPreReminder ? 'PRE-' : ''}ALARM:`, reminder.title);

        const tone = reminder.tone || 'audio1';
        const neverMiss = options.neverMissMode || false;

        if (!isPreReminder) {
            // Main Alarm: Full sound, continuous vibration
            playSound(tone, true, neverMiss);
            startVibration(neverMiss);

            // Auto-stop for normal mode
            if (!neverMiss) {
                State.normalModeTimeout = setTimeout(() => {
                    logMissedAlarm(reminder.id);
                    stopAlarm();
                }, CONFIG.NORMAL_MODE_DURATION * 1000);
            }
        } else {
            // Pre-reminder: Short sound, gentle vibration
            playSound(tone, false, false);
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        }

        // Show modal
        showAlarmModal(reminder, isPreReminder, options);

        // Show browser notification if page is hidden
        showBrowserNotification(reminder, isPreReminder);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // AUDIO STORAGE (IndexedDB for custom sounds)
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
                console.warn('[BgAlarm] AudioStorage error:', e);
                return null;
            }
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // AUDIO
    // ══════════════════════════════════════════════════════════════════════════
    async function playSound(toneId, loop = true, neverMiss = false) {
        stopAudio();

        let audioPath = null;

        try {
            // 1. Check built-in sounds
            if (CONFIG.AUDIO_FILES[toneId]) {
                audioPath = CONFIG.AUDIO_BASE_PATH + CONFIG.AUDIO_FILES[toneId];
            }
            // 2. Check if it's a direct path/URL
            else if (typeof toneId === 'string' && (toneId.includes('/') || toneId.startsWith('http'))) {
                audioPath = toneId;
            }
            // 3. Try custom sound from IndexedDB
            else {
                const blob = await AudioStorage.getAudio(toneId);
                if (blob) {
                    audioPath = URL.createObjectURL(blob);
                } else {
                    // Fallback to default
                    console.warn(`[BgAlarm] Tone '${toneId}' not found, using default`);
                    audioPath = CONFIG.AUDIO_BASE_PATH + CONFIG.AUDIO_FILES['audio1'];
                }
            }

            State.currentAudio = new Audio(audioPath);
            State.currentAudio.loop = loop;
            State.currentAudio.volume = 1.0;

            const playPromise = State.currentAudio.play();
            if (playPromise) {
                playPromise.catch(e => {
                    console.warn('[BgAlarm] Audio autoplay blocked:', e);
                });
            }

            // Never Miss: Force restart on end
            if (neverMiss && !loop) {
                State.currentAudio.onended = () => {
                    if (State.currentAudio) {
                        State.currentAudio.currentTime = 0;
                        State.currentAudio.play().catch(() => { });
                    }
                };
            }

        } catch (e) {
            console.error('[BgAlarm] Audio error:', e);
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
    // VIBRATION
    // ══════════════════════════════════════════════════════════════════════════
    function startVibration(neverMiss) {
        if (!navigator.vibrate) return;

        const vibrate = () => navigator.vibrate(CONFIG.VIBRATION_PATTERN);

        vibrate();
        State.vibrationInterval = setInterval(vibrate, CONFIG.VIBRATION_LOOP_INTERVAL);
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

        if (State.currentModal) {
            State.currentModal.style.opacity = '0';
            setTimeout(() => {
                if (State.currentModal) {
                    State.currentModal.remove();
                    State.currentModal = null;
                }
            }, 300);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ALARM MODAL
    // ══════════════════════════════════════════════════════════════════════════
    function showAlarmModal(reminder, isPreReminder, options) {
        // Remove existing modal
        const existing = document.getElementById('bg-alarm-overlay');
        if (existing) existing.remove();

        const snoozeMins = options.snoozeMinutes || 10;
        const neverMiss = options.neverMissMode || false;

        const modal = document.createElement('div');
        modal.id = 'bg-alarm-overlay';
        State.currentModal = modal;

        modal.innerHTML = `
            <style>
                #bg-alarm-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 99999;
                    background: rgba(0, 0, 0, 0.95);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
                    animation: bgAlarmFadeIn 0.4s ease;
                    padding: 24px;
                    box-sizing: border-box;
                }
                
                @keyframes bgAlarmFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes bgAlarmPulse {
                    0%, 100% { box-shadow: 0 0 0 0 ${isPreReminder ? 'rgba(48, 209, 88, 0.7)' : 'rgba(255, 159, 10, 0.7)'}; }
                    50% { box-shadow: 0 0 0 30px ${isPreReminder ? 'rgba(48, 209, 88, 0)' : 'rgba(255, 159, 10, 0)'}; }
                }
                
                @keyframes bgAlarmBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                
                @keyframes bgAlarmShake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-10deg); }
                    75% { transform: rotate(10deg); }
                }
                
                .bg-alarm-icon-wrapper {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    margin-bottom: 24px;
                }
                
                .bg-alarm-pulse-ring {
                    position: absolute;
                    inset: 0;
                    border: 2px solid ${isPreReminder ? '#30D158' : '#FF9F0A'};
                    border-radius: 50%;
                    animation: bgAlarmRingPulse 2s ease-out infinite;
                }
                
                .bg-alarm-pulse-ring.delay-1 { animation-delay: 0.4s; }
                .bg-alarm-pulse-ring.delay-2 { animation-delay: 0.8s; }
                
                @keyframes bgAlarmRingPulse {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                }
                
                .bg-alarm-icon {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 60px;
                    height: 60px;
                    background: ${isPreReminder ? 'linear-gradient(135deg, #30D158 0%, #28B14C 100%)' : 'linear-gradient(135deg, #FF9F0A 0%, #FF6B0A 100%)'};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    box-shadow: 0 8px 32px ${isPreReminder ? 'rgba(48, 209, 88, 0.4)' : 'rgba(255, 159, 10, 0.4)'};
                    animation: bgAlarmBounce 1s ease-in-out infinite;
                }
                
                .bg-alarm-icon svg {
                    animation: bgAlarmShake 0.5s ease-in-out infinite;
                }
                
                .bg-alarm-title {
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    text-align: center;
                }
                
                .bg-alarm-subtitle {
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 24px;
                    text-align: center;
                }
                
                .bg-alarm-never-miss {
                    display: ${neverMiss && !isPreReminder ? 'flex' : 'none'};
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(255, 69, 58, 0.2);
                    border: 1px solid rgba(255, 69, 58, 0.3);
                    border-radius: 100px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #FF453A;
                    margin-bottom: 32px;
                    animation: bgAlarmPulse 2s ease-in-out infinite;
                }
                
                .bg-alarm-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    width: 100%;
                    max-width: 320px;
                }
                
                .bg-alarm-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 18px 24px;
                    border: none;
                    border-radius: 16px;
                    font-size: 18px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.1s ease, filter 0.2s ease;
                }
                
                .bg-alarm-btn:active {
                    transform: scale(0.98);
                }
                
                .bg-alarm-btn-stop {
                    background: ${isPreReminder ? 'linear-gradient(135deg, #30D158 0%, #28B14C 100%)' : 'linear-gradient(135deg, #30D158 0%, #28B14C 100%)'};
                    color: white;
                    box-shadow: 0 8px 24px rgba(48, 209, 88, 0.35);
                }
                
                .bg-alarm-btn-snooze {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                }
                
                .bg-alarm-footer {
                    margin-top: 40px;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.3);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
            </style>
            
            <div class="bg-alarm-icon-wrapper">
                <div class="bg-alarm-pulse-ring"></div>
                <div class="bg-alarm-pulse-ring delay-1"></div>
                <div class="bg-alarm-pulse-ring delay-2"></div>
                <div class="bg-alarm-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                    </svg>
                </div>
            </div>
            
            <h1 class="bg-alarm-title">${reminder.title}</h1>
            <p class="bg-alarm-subtitle">${isPreReminder ? 'Coming up soon...' : 'Time for your spiritual practice'}</p>
            
            <div class="bg-alarm-never-miss">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
                <span>Never Miss Mode Active</span>
            </div>
            
            <div class="bg-alarm-buttons">
                <button id="bg-alarm-btn-stop" class="bg-alarm-btn bg-alarm-btn-stop">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                    ${isPreReminder ? 'Got it!' : 'Stop Alarm'}
                </button>
                
                ${!isPreReminder ? `
                    <button id="bg-alarm-btn-snooze" class="bg-alarm-btn bg-alarm-btn-snooze">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM12 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                        </svg>
                        Snooze (${snoozeMins} min)
                    </button>
                ` : ''}
            </div>
            
            <p class="bg-alarm-footer">Gurbani Radio</p>
        `;

        document.body.appendChild(modal);

        // Bind events
        modal.querySelector('#bg-alarm-btn-stop')?.addEventListener('click', () => {
            stopAlarm();
            logInteraction(reminder.id, isPreReminder ? 'acknowledged' : 'responded');
        });

        const snoozeBtn = modal.querySelector('#bg-alarm-btn-snooze');
        if (snoozeBtn) {
            snoozeBtn.addEventListener('click', () => {
                stopAlarm();
                logInteraction(reminder.id, 'snoozed');
                scheduleSnooze(reminder, snoozeMins);
            });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BROWSER NOTIFICATION
    // ══════════════════════════════════════════════════════════════════════════
    function showBrowserNotification(reminder, isPreReminder) {
        if (!document.hidden) return;
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;

        try {
            const notification = new Notification(
                isPreReminder ? `Upcoming: ${reminder.title}` : reminder.title,
                {
                    body: isPreReminder ? 'Starting soon...' : 'Time for your Paath',
                    icon: '../assets/favicon.svg',
                    badge: '../assets/favicon.svg',
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
    // LOGGING — with storage lock protection
    // ══════════════════════════════════════════════════════════════════════════
    function logInteraction(alarmId, action) {
        try {
            const today = new Date().toLocaleDateString('en-CA');
            const timestamp = new Date().toISOString();

            // Use storage lock for atomic update
            if (window.AnhadStorageLock) {
                window.AnhadStorageLock.withLock(CONFIG.ALARM_LOG_KEY, (existing) => {
                    const log = existing || {};
                    if (!log[today]) log[today] = {};
                    log[today][alarmId] = { status: action, timestamp };
                    return log;
                });
            } else {
                // Fallback without lock
                const log = JSON.parse(localStorage.getItem(CONFIG.ALARM_LOG_KEY) || '{}');
                if (!log[today]) log[today] = {};
                log[today][alarmId] = { status: action, timestamp };
                localStorage.setItem(CONFIG.ALARM_LOG_KEY, JSON.stringify(log));
            }

            // Dispatch event for NitnemTracker
            window.dispatchEvent(new CustomEvent('alarmInteraction', {
                detail: { alarmId, action, timestamp }
            }));

            // Broadcast to coordinator
            if (window.AnhadAlarmCoordinator) {
                window.AnhadAlarmCoordinator.acknowledgeAlarm(alarmId, action);
            }

            console.log(`📝 Alarm interaction logged: ${alarmId} - ${action}`);

        } catch (e) {
            console.error('Error logging interaction:', e);
        }
    }

    function logMissedAlarm(alarmId) {
        logInteraction(alarmId, 'missed');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SNOOZE SCHEDULING
    // ══════════════════════════════════════════════════════════════════════════
    function scheduleSnooze(reminder, minutes) {
        const snoozeTime = Date.now() + (minutes * 60 * 1000);

        // Schedule via timeout
        setTimeout(() => {
            const data = loadReminders();
            fireAlarm(reminder, false, data?.options || {});
        }, minutes * 60 * 1000);

        // Also try service worker
        if (navigator.serviceWorker?.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SCHEDULE_NOTIFICATION',
                payload: {
                    id: `snooze_${reminder.id}`,
                    title: reminder.title,
                    body: 'Your snoozed alarm is ringing!',
                    scheduledTime: snoozeTime,
                    tag: `snooze-${reminder.id}`,
                    requireInteraction: true,
                    data: { url: window.location.href }
                }
            });
        }

        console.log(`⏰ Snooze scheduled for ${minutes} minutes`);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════
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

    function isInQuietHours(date, options) {
        if (!options.quietStart || !options.quietEnd) return false;

        const start = timeToMinutes(options.quietStart);
        const end = timeToMinutes(options.quietEnd);
        const current = date.getHours() * 60 + date.getMinutes();

        if (start > end) {
            // Crosses midnight (e.g. 22:00 to 06:00)
            return current >= start || current < end;
        }

        return current >= start && current < end;
    }

    function getNextQuietEnd(date, options) {
        const [h, m] = String(options.quietEnd).split(':').map(Number);
        const target = new Date(date);
        target.setHours(h, m, 0, 0);

        if (target <= date) {
            target.setDate(target.getDate() + 1);
        }

        return target;
    }

    function timeToMinutes(timeStr) {
        const [h, m] = String(timeStr).split(':').map(Number);
        return h * 60 + m;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INIT
    // ══════════════════════════════════════════════════════════════════════════
    init();

})();
