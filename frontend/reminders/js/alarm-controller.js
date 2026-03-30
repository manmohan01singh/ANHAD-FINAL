/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SACRED ALARM CONTROLLER v3.0 - Production-Grade Alarm System
 * 
 * CRITICAL FEATURES:
 * - Persistent ringing until user interacts (Never Miss Mode)
 * - Full-screen alarm UI overlay
 * - Background execution via Service Worker
 * - Nitnem Tracker synchronization
 * - Snooze/Dismiss with logging
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // Prevent duplicate initialization
    if (window.AlarmController) return;

    // ══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ══════════════════════════════════════════════════════════════════════════
    const CONFIG = {
        // Support both old and new storage keys
        STORAGE_KEY_LEGACY: 'smart_reminders_v1',
        STORAGE_KEY_NEW: {
            reminders: 'sr_reminders_v4',
            settings: 'sr_settings_v4',
            appSettings: 'sr_app_settings_v4'
        },
        ALARM_LOG_KEY: 'nitnemTracker_alarmLog',
        PENDING_INTERACTIONS_KEY: 'pending_alarm_interactions',

        // Audio configuration
        AUDIO_BASE_PATH: getAudioBasePath(),
        AUDIO_FILES: {
            'waheguru-bell': 'audio1.mp3',
            'mool-mantar': 'audio2.mp3',
            'kirtan-gentle': 'audio3.mpeg',
            'peaceful-night': 'audio4.mpeg',
            'morning-raga': 'audio5.mpeg',
            'simple-bell': 'audio6.mpeg',
            'soft-chime': 'chime.mp3',
            'sacred-conch': 'conch.mp3',
            'audio1': 'audio1.mp3',
            'audio2': 'audio2.mp3',
            'audio3': 'audio3.mpeg',
            'audio4': 'audio4.mpeg',
            'audio5': 'audio5.mpeg',
            'audio6': 'audio6.mpeg'
        },

        // Timing
        CHECK_INTERVAL: 15000,           // Check every 15 seconds
        NORMAL_MODE_DURATION: 180,       // 3 minutes before auto-stop (non-never-miss)
        VIBRATION_LOOP_INTERVAL: 2500,   // Vibration repeat interval
        AUDIO_LOOP_GAP: 100,             // Small gap between audio loops

        // Vibration patterns
        VIBRATION_PATTERN: [500, 200, 500, 200, 1000, 300, 500, 200, 500],
        GENTLE_VIBRATION: [200, 100, 200]
    };

    function getAudioBasePath() {
        const path = window.location.pathname;
        if (path.includes('/reminders/')) {
            return '../Audio/';
        }
        return 'Audio/';
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ALARM STATE
    // ══════════════════════════════════════════════════════════════════════════
    const AlarmState = {
        isRinging: false,
        currentAlarm: null,
        isNeverMissMode: false,
        startTime: null,

        // Audio
        audioContext: null,
        audioElement: null,
        audioLoopInterval: null,

        // Timers
        vibrationInterval: null,
        normalModeTimeout: null,
        scheduledAlarms: new Map(),

        // UI
        overlayElement: null,

        // Wake lock
        wakeLock: null
    };

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
    // ALARM CONTROLLER CLASS
    // ══════════════════════════════════════════════════════════════════════════
    class AlarmController {
        constructor() {
            this.initialized = false;
        }

        // ══════════════════════════════════════════════════════════════════════
        // INITIALIZATION
        // ══════════════════════════════════════════════════════════════════════
        init() {
            if (this.initialized) return;

            console.log('🔔 [AlarmController] Initializing...');

            // Check for any scheduled alarms (only if leader)
            if (window.AnhadAlarmCoordinator?.isLeader()) {
                this.checkAndScheduleAlarms();
            }

            // Listen for coordinator leadership changes
            if (window.AnhadAlarmCoordinator) {
                window.AnhadAlarmCoordinator.onAlarmFired((alarmId, reminder, isPreReminder) => {
                    console.log('[AlarmController] Received alarm from coordinator:', alarmId);
                    if (!window.AnhadAlarmCoordinator.isLeader()) {
                        const data = this.loadReminders();
                        this.fireAlarm(reminder, isPreReminder, data?.options || {});
                    }
                });
            }

            // Periodic check for alarms (only leader schedules)
            this.checkInterval = setInterval(() => {
                if (window.AnhadAlarmCoordinator?.isLeader()) {
                    this.checkAndScheduleAlarms();
                }
            }, CONFIG.CHECK_INTERVAL);

            // Listen for visibility changes
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.checkMissedAlarms();
                    if (window.AnhadAlarmCoordinator?.isLeader()) {
                        this.checkAndScheduleAlarms();
                    }
                }
            });

            // Listen for window focus
            window.addEventListener('focus', () => {
                this.checkMissedAlarms();
            });

            // Pagehide cleanup
            window.addEventListener('pagehide', () => {
                console.log('[AlarmController] Pagehide - clearing interval');
                if (this.checkInterval) {
                    clearInterval(this.checkInterval);
                }
            });

            // Listen for alarm events from Service Worker
            if (navigator.serviceWorker) {
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data?.type === 'ALARM_FIRED') {
                        this.handleAlarmFromSW(event.data.payload);
                    }
                });
            }

            this.initialized = true;
            console.log('✅ [AlarmController] Ready');
        }

        // ══════════════════════════════════════════════════════════════════════
        // LOAD REMINDERS FROM STORAGE
        // ══════════════════════════════════════════════════════════════════════
        loadReminders() {
            try {
                // First try the NEW storage format (sr_reminders_v4)
                const newReminders = localStorage.getItem(CONFIG.STORAGE_KEY_NEW.reminders);
                const newSettings = localStorage.getItem(CONFIG.STORAGE_KEY_NEW.settings);

                if (newReminders) {
                    const reminders = JSON.parse(newReminders);
                    const settings = newSettings ? JSON.parse(newSettings) : {};

                    // New format: reminders is an array
                    AlarmState.isNeverMissMode = settings.neverMissMode || false;

                    return {
                        reminders: reminders, // Array of all reminders
                        options: {
                            neverMissMode: settings.neverMissMode || false,
                            preReminderMinutes: settings.preReminderMinutes || 0,
                            snoozeMinutes: settings.snoozeMinutes || 10,
                            quietHoursEnabled: settings.quietHoursEnabled || false,
                            quietStart: settings.quietHoursStart,
                            quietEnd: settings.quietHoursEnd
                        },
                        isNewFormat: true
                    };
                }

                // Fall back to LEGACY storage format (smart_reminders_v1)
                const legacyRaw = localStorage.getItem(CONFIG.STORAGE_KEY_LEGACY);
                if (legacyRaw) {
                    const data = JSON.parse(legacyRaw);
                    AlarmState.isNeverMissMode = data.options?.neverMissMode || false;
                    return data;
                }

                return null;
            } catch (e) {
                console.error('[AlarmController] Load error:', e);
                return null;
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // SCHEDULE ALL ALARMS
        // ══════════════════════════════════════════════════════════════════════
        checkAndScheduleAlarms() {
            const data = this.loadReminders();
            if (!data) return;

            const options = data.options || {};

            // Handle both formats
            let allReminders;
            if (data.isNewFormat) {
                // New format: data.reminders is an array
                allReminders = data.reminders || [];
            } else {
                // Legacy format: core/custom structure
                allReminders = [
                    ...Object.values(data.core || {}),
                    ...(data.custom || [])
                ];
            }

            allReminders.forEach(rem => {
                if (!rem.enabled) return;

                const nextTime = this.getNextOccurrence(rem.time);
                if (!nextTime) return;

                // Skip if in quiet hours
                if (options.quietHoursEnabled && this.isInQuietHours(nextTime, options)) {
                    return;
                }

                this.scheduleAlarm(rem, nextTime, false, options);

                // Pre-reminder
                const preMinutes = Number(options.preReminderMinutes || 0);
                if (preMinutes > 0) {
                    const preTime = new Date(nextTime.getTime() - preMinutes * 60 * 1000);
                    if (preTime > new Date()) {
                        this.scheduleAlarm(rem, preTime, true, options);
                    }
                }
            });
        }

        scheduleAlarm(reminder, time, isPreReminder, options) {
            const delay = time.getTime() - Date.now();

            // Only schedule if in future and within 24 hours
            if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return;

            const keyType = isPreReminder ? 'PRE' : 'MAIN';
            const key = `${reminder.id}-${keyType}`;

            // Clear existing
            if (AlarmState.scheduledAlarms.has(key)) {
                clearTimeout(AlarmState.scheduledAlarms.get(key));
            }

            console.log(`⏰ [AlarmController] Scheduling ${isPreReminder ? 'pre-' : ''}alarm: ${reminder.title} at ${time.toLocaleTimeString()}`);

            const timeoutId = setTimeout(() => {
                this.fireAlarm(reminder, isPreReminder, options);
                AlarmState.scheduledAlarms.delete(key);
            }, delay);

            AlarmState.scheduledAlarms.set(key, timeoutId);
        }

        // ══════════════════════════════════════════════════════════════════════
        // CHECK FOR MISSED ALARMS
        // ══════════════════════════════════════════════════════════════════════
        checkMissedAlarms() {
            const data = this.loadReminders();
            if (!data) return;

            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const today = now.toLocaleDateString('en-CA');

            // Handle both formats
            let allReminders;
            if (data.isNewFormat) {
                allReminders = data.reminders || [];
            } else {
                allReminders = [
                    ...Object.values(data.core || {}),
                    ...(data.custom || [])
                ];
            }

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
                        console.log(`⚠️ [AlarmController] Missed alarm detected: ${rem.title}`);
                        this.fireAlarm(rem, false, data.options || {});
                    }
                }
            });
        }

        handleAlarmFromSW(payload) {
            if (!payload) return;

            const reminder = {
                id: payload.alarmId || payload.id,
                title: payload.title,
                tone: payload.tone || 'waheguru-bell'
            };

            const data = this.loadReminders();
            this.fireAlarm(reminder, false, data?.options || {});
        }

        // ══════════════════════════════════════════════════════════════════════
        // FIRE ALARM - THE MAIN EVENT
        // ══════════════════════════════════════════════════════════════════════
        fireAlarm(reminder, isPreReminder = false, options = {}) {
            if (AlarmState.isRinging) {
                console.log('[AlarmController] Alarm already ringing, ignoring');
                return;
            }

            console.log(`🔥 [AlarmController] FIRING ${isPreReminder ? 'PRE-' : ''}ALARM:`, reminder.title);

            AlarmState.isRinging = true;
            AlarmState.currentAlarm = reminder;
            AlarmState.startTime = Date.now();

            const neverMiss = options.neverMissMode || false;
            const tone = reminder.tone || 'waheguru-bell';

            if (isPreReminder) {
                // Pre-reminder: Gentle notification
                this.playPreReminderSound(tone);
                this.gentleVibrate();
                this.showBrowserNotification(reminder, true);

                // Auto-dismiss after 10 seconds
                setTimeout(() => {
                    if (AlarmState.currentAlarm?.id === reminder.id) {
                        this.stopAlarm(false);
                    }
                }, 10000);

            } else {
                // Main alarm: FULL experience
                this.requestWakeLock();
                this.startPersistentAudio(tone, neverMiss);
                this.startVibration(neverMiss);
                this.showFullScreenAlarmUI(reminder, options);
                this.showBrowserNotification(reminder, false);

                // Normal mode timeout
                if (!neverMiss) {
                    AlarmState.normalModeTimeout = setTimeout(() => {
                        this.logInteraction(reminder.id, 'missed');
                        this.stopAlarm(true); // showComplete = true to show missed message
                    }, CONFIG.NORMAL_MODE_DURATION * 1000);
                }
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // AUDIO PLAYBACK - PERSISTENT
        // ══════════════════════════════════════════════════════════════════════
        async startPersistentAudio(toneId, loop = true) {
            this.stopAudio();

            let audioPath = null;

            try {
                // 1. Standard config
                if (CONFIG.AUDIO_FILES[toneId]) {
                    audioPath = CONFIG.AUDIO_BASE_PATH + CONFIG.AUDIO_FILES[toneId];
                }
                // 2. Direct path
                else if (typeof toneId === 'string' && (toneId.includes('/') || toneId.startsWith('http'))) {
                    audioPath = toneId;
                }
                // 3. Custom sound from DB
                else {
                    const blob = await AudioStorage.getAudio(toneId);
                    if (blob) {
                        audioPath = URL.createObjectURL(blob);
                    } else {
                        // Fallback
                        console.warn(`[AlarmController] Tone '${toneId}' not found, using default`);
                        audioPath = CONFIG.AUDIO_BASE_PATH + CONFIG.AUDIO_FILES['waheguru-bell'];
                    }
                }

                AlarmState.audioElement = new Audio(audioPath);
                AlarmState.audioElement.loop = loop;
                AlarmState.audioElement.volume = 1.0;
                AlarmState.audioElement.preload = 'auto';

                // Handle audio ending (for backup looping)
                AlarmState.audioElement.addEventListener('ended', () => {
                    if (AlarmState.isRinging && loop) {
                        AlarmState.audioElement.currentTime = 0;
                        AlarmState.audioElement.play().catch(() => { });
                    }
                });

                // Handle errors
                AlarmState.audioElement.addEventListener('error', (e) => {
                    console.warn('[AlarmController] Audio error, trying synth fallback');
                    this.playSynthFallback();
                });

                const playPromise = AlarmState.audioElement.play();
                if (playPromise) {
                    playPromise.catch(e => {
                        console.warn('[AlarmController] Audio autoplay blocked, synth fallback');
                        this.playSynthFallback();
                    });
                }

            } catch (e) {
                console.error('[AlarmController] Audio error:', e);
                this.playSynthFallback();
            }
        }

        playSynthFallback() {
            try {
                AlarmState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = AlarmState.audioContext.createOscillator();
                const gainNode = AlarmState.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(AlarmState.audioContext.destination);

                oscillator.type = 'sine';
                oscillator.frequency.value = 528; // Healing frequency

                // Pulsing effect
                const pulseGain = () => {
                    if (!AlarmState.isRinging || !AlarmState.audioContext) return;

                    const t = AlarmState.audioContext.currentTime;
                    gainNode.gain.cancelScheduledValues(t);
                    gainNode.gain.setValueAtTime(0, t);
                    gainNode.gain.linearRampToValueAtTime(0.4, t + 0.15);
                    gainNode.gain.linearRampToValueAtTime(0.2, t + 0.5);
                    gainNode.gain.linearRampToValueAtTime(0, t + 0.9);

                    setTimeout(pulseGain, 1000);
                };

                oscillator.start();
                pulseGain();

            } catch (e) {
                console.error('[AlarmController] Synth fallback failed:', e);
            }
        }

        async playPreReminderSound(toneId) {
            let audioPath = null;

            if (CONFIG.AUDIO_FILES[toneId]) {
                audioPath = CONFIG.AUDIO_BASE_PATH + CONFIG.AUDIO_FILES[toneId];
            } else if (typeof toneId === 'string' && (toneId.includes('/') || toneId.startsWith('http'))) {
                audioPath = toneId;
            } else {
                const blob = await AudioStorage.getAudio(toneId);
                audioPath = blob ? URL.createObjectURL(blob) : (CONFIG.AUDIO_BASE_PATH + CONFIG.AUDIO_FILES['waheguru-bell']);
            }

            try {
                const audio = new Audio(audioPath);
                audio.volume = 0.7;
                audio.play().catch(() => { });

                // Stop after 5 seconds
                setTimeout(() => {
                    audio.pause();
                    audio.currentTime = 0;
                }, 5000);
            } catch (e) {
                console.warn('[AlarmController] Pre-reminder audio failed');
            }
        }

        stopAudio() {
            if (AlarmState.audioElement) {
                AlarmState.audioElement.pause();
                AlarmState.audioElement.currentTime = 0;
                AlarmState.audioElement = null;
            }

            if (AlarmState.audioLoopInterval) {
                clearInterval(AlarmState.audioLoopInterval);
                AlarmState.audioLoopInterval = null;
            }

            if (AlarmState.audioContext) {
                try {
                    AlarmState.audioContext.close();
                } catch { }
                AlarmState.audioContext = null;
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // VIBRATION
        // ══════════════════════════════════════════════════════════════════════
        startVibration(loop = true) {
            if (!navigator.vibrate) return;

            const doVibrate = () => navigator.vibrate(CONFIG.VIBRATION_PATTERN);

            doVibrate();
            if (loop) {
                AlarmState.vibrationInterval = setInterval(doVibrate, CONFIG.VIBRATION_LOOP_INTERVAL);
            }
        }

        gentleVibrate() {
            if (navigator.vibrate) {
                navigator.vibrate(CONFIG.GENTLE_VIBRATION);
            }
        }

        stopVibration() {
            if (AlarmState.vibrationInterval) {
                clearInterval(AlarmState.vibrationInterval);
                AlarmState.vibrationInterval = null;
            }
            if (navigator.vibrate) {
                navigator.vibrate(0);
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // FULL-SCREEN ALARM UI
        // ══════════════════════════════════════════════════════════════════════
        showFullScreenAlarmUI(reminder, options) {
            // Remove any existing overlay
            this.removeAlarmUI();

            const snoozeMins = options.snoozeMinutes || 10;
            const neverMiss = options.neverMissMode || false;

            const overlay = document.createElement('div');
            overlay.id = 'sacred-alarm-overlay';
            overlay.className = 'sacred-alarm-overlay';
            AlarmState.overlayElement = overlay;

            overlay.innerHTML = this.getAlarmUIHTML(reminder, snoozeMins, neverMiss);

            // Inject CSS if not present
            if (!document.getElementById('sacred-alarm-styles')) {
                const styles = document.createElement('style');
                styles.id = 'sacred-alarm-styles';
                styles.textContent = this.getAlarmUICSS();
                document.head.appendChild(styles);
            }

            document.body.appendChild(overlay);

            // Animate in
            requestAnimationFrame(() => {
                overlay.classList.add('active');
            });

            // Bind events
            this.bindAlarmUIEvents(reminder, snoozeMins);

            // Update elapsed time
            this.startElapsedTimer();
        }

        getAlarmUIHTML(reminder, snoozeMins, neverMiss) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

            return `
                <div class="sa-backdrop"></div>
                <div class="sa-glow sa-glow-1"></div>
                <div class="sa-glow sa-glow-2"></div>
                <div class="sa-glow sa-glow-3"></div>
                
                <div class="sa-container">
                    <!-- Animated Bell Icon -->
                    <div class="sa-icon-wrapper">
                        <div class="sa-pulse-ring"></div>
                        <div class="sa-pulse-ring sa-delay-1"></div>
                        <div class="sa-pulse-ring sa-delay-2"></div>
                        <div class="sa-icon">
                            <svg viewBox="0 0 24 24" fill="white">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="sa-content">
                        <h1 class="sa-title">${this.escapeHtml(reminder.title)}</h1>
                        <p class="sa-subtitle">Time for your spiritual practice</p>
                        <div class="sa-time">
                            <span class="sa-time-value">${timeStr}</span>
                        </div>
                        <p class="sa-elapsed" id="sa-elapsed">Ringing for 0 seconds</p>
                    </div>

                    ${neverMiss ? `
                        <div class="sa-never-miss-badge">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                            <span>Never Miss Mode Active</span>
                        </div>
                    ` : ''}

                    <!-- Action Buttons -->
                    <div class="sa-actions">
                        <button id="sa-stop-btn" class="sa-btn sa-btn-stop" type="button">
                            <span class="sa-btn-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                </svg>
                            </span>
                            <span class="sa-btn-text">Stop Alarm</span>
                            <span class="sa-btn-subtext">I'm awake!</span>
                        </button>
                        
                        <button id="sa-snooze-btn" class="sa-btn sa-btn-snooze" type="button">
                            <span class="sa-btn-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM12 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                                </svg>
                            </span>
                            <span class="sa-btn-text">Snooze</span>
                            <span class="sa-btn-subtext">${snoozeMins} minutes</span>
                        </button>
                    </div>

                    <div class="sa-footer">
                        <span>ਵਾਹਿਗੁਰੂ</span>
                        <span>•</span>
                        <span>Gurbani Radio</span>
                    </div>
                </div>
            `;
        }

        getAlarmUICSS() {
            return `
                .sacred-alarm-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.4s cubic-bezier(0.23, 1, 0.32, 1), visibility 0.4s;
                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
                }

                .sacred-alarm-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }

                .sa-backdrop {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.92);
                    backdrop-filter: blur(30px) saturate(180%);
                    -webkit-backdrop-filter: blur(30px) saturate(180%);
                }

                .sa-glow {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(100px);
                    opacity: 0.4;
                    animation: sa-glow-pulse 4s ease-in-out infinite;
                }

                .sa-glow-1 {
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, #c9883a 0%, transparent 70%);
                    top: -150px;
                    left: -100px;
                }

                .sa-glow-2 {
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, #8b6bad 0%, transparent 70%);
                    bottom: -100px;
                    right: -80px;
                    animation-delay: -2s;
                }

                .sa-glow-3 {
                    width: 250px;
                    height: 250px;
                    background: radial-gradient(circle, #5db8c7 0%, transparent 70%);
                    top: 40%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    animation-delay: -4s;
                }

                @keyframes sa-glow-pulse {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.1); }
                }

                .sa-container {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 400px;
                    padding: 48px 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 24px;
                    text-align: center;
                    color: white;
                    animation: sa-container-enter 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                }

                @keyframes sa-container-enter {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .sa-icon-wrapper {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .sa-pulse-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border: 2px solid #c9883a;
                    border-radius: 50%;
                    animation: sa-pulse 2s ease-out infinite;
                }

                .sa-delay-1 { animation-delay: 0.4s; }
                .sa-delay-2 { animation-delay: 0.8s; }

                @keyframes sa-pulse {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                }

                .sa-icon {
                    width: 72px;
                    height: 72px;
                    background: linear-gradient(135deg, #c9883a 0%, #b07830 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 
                        0 8px 32px rgba(201, 136, 58, 0.4),
                        0 0 60px rgba(201, 136, 58, 0.2);
                    animation: sa-icon-bounce 1s ease-in-out infinite;
                }

                .sa-icon svg {
                    width: 36px;
                    height: 36px;
                    animation: sa-icon-shake 0.5s ease-in-out infinite;
                }

                @keyframes sa-icon-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }

                @keyframes sa-icon-shake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-12deg); }
                    75% { transform: rotate(12deg); }
                }

                .sa-content {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .sa-title {
                    font-size: 32px;
                    font-weight: 700;
                    margin: 0;
                    background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.8) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .sa-subtitle {
                    font-size: 16px;
                    color: rgba(255,255,255,0.6);
                    margin: 0;
                }

                .sa-time {
                    margin-top: 8px;
                }

                .sa-time-value {
                    font-size: 64px;
                    font-weight: 300;
                    letter-spacing: -1.5px;
                    font-family: -apple-system, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
                }

                .sa-elapsed {
                    font-size: 14px;
                    color: rgba(255,255,255,0.5);
                    margin: 0;
                    animation: sa-fade-pulse 2s ease-in-out infinite;
                }

                @keyframes sa-fade-pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }

                .sa-never-miss-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(201, 85, 77, 0.2);
                    border: 1px solid rgba(201, 85, 77, 0.4);
                    border-radius: 100px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #d97a74;
                    animation: sa-badge-pulse 2s ease-in-out infinite;
                }

                @keyframes sa-badge-pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(201, 85, 77, 0.4); }
                    50% { box-shadow: 0 0 0 12px rgba(201, 85, 77, 0); }
                }

                .sa-actions {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-top: 16px;
                }

                .sa-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px 24px;
                    border: none;
                    border-radius: 20px;
                    font-family: inherit;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
                }

                .sa-btn:active {
                    transform: scale(0.98);
                }

                .sa-btn-stop {
                    background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
                    color: white;
                    box-shadow: 0 8px 32px rgba(76, 175, 80, 0.35);
                }

                .sa-btn-stop:hover {
                    box-shadow: 0 12px 40px rgba(76, 175, 80, 0.45);
                    transform: translateY(-2px);
                }

                .sa-btn-snooze {
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: white;
                    backdrop-filter: blur(10px);
                }

                .sa-btn-snooze:hover {
                    background: rgba(255, 255, 255, 0.12);
                }

                .sa-btn-icon {
                    width: 48px;
                    height: 48px;
                    min-width: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    background: rgba(0, 0, 0, 0.2);
                }

                .sa-btn-icon svg {
                    width: 24px;
                    height: 24px;
                }

                .sa-btn-text {
                    display: block;
                    font-size: 18px;
                    font-weight: 600;
                }

                .sa-btn-subtext {
                    display: block;
                    font-size: 13px;
                    opacity: 0.7;
                    margin-top: 2px;
                }

                .sa-footer {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 24px;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.3);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                /* Success/Completion States */
                .sa-success-overlay {
                    position: absolute;
                    inset: 0;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 24px;
                    background: rgba(0, 0, 0, 0.95);
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.4s ease;
                }

                .sa-success-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }

                .sa-success-icon {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: sa-success-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }

                .sa-success-icon svg {
                    width: 50px;
                    height: 50px;
                    color: white;
                }

                @keyframes sa-success-pop {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }

                .sa-success-title {
                    font-size: 28px;
                    font-weight: 600;
                    color: white;
                    margin: 0;
                }

                .sa-success-message {
                    font-size: 16px;
                    color: rgba(255,255,255,0.7);
                    margin: 0;
                }

                /* Responsive */
                @media (max-height: 600px) {
                    .sa-container { padding: 24px 16px; gap: 16px; }
                    .sa-icon-wrapper { width: 80px; height: 80px; }
                    .sa-icon { width: 50px; height: 50px; }
                    .sa-icon svg { width: 24px; height: 24px; }
                    .sa-title { font-size: 24px; }
                    .sa-time-value { font-size: 36px; }
                    .sa-btn { padding: 16px 20px; }
                }

                /* Reduced motion */
                @media (prefers-reduced-motion: reduce) {
                    .sa-pulse-ring,
                    .sa-icon,
                    .sa-icon svg,
                    .sa-glow,
                    .sa-never-miss-badge {
                        animation: none !important;
                    }
                }
            `;
        }

        bindAlarmUIEvents(reminder, snoozeMins) {
            const stopBtn = document.getElementById('sa-stop-btn');
            const snoozeBtn = document.getElementById('sa-snooze-btn');

            stopBtn?.addEventListener('click', () => {
                this.logInteraction(reminder.id, 'responded');
                this.stopAlarm(true, 'stopped');
            });

            snoozeBtn?.addEventListener('click', () => {
                this.logInteraction(reminder.id, 'snoozed');
                this.scheduleSnooze(reminder, snoozeMins);
                this.stopAlarm(true, 'snoozed');
            });
        }

        startElapsedTimer() {
            const updateElapsed = () => {
                if (!AlarmState.isRinging) return;

                const elapsed = Math.floor((Date.now() - AlarmState.startTime) / 1000);
                const elapsedEl = document.getElementById('sa-elapsed');

                if (elapsedEl) {
                    if (elapsed < 60) {
                        elapsedEl.textContent = `Ringing for ${elapsed} seconds`;
                    } else {
                        const mins = Math.floor(elapsed / 60);
                        const secs = elapsed % 60;
                        elapsedEl.textContent = `Ringing for ${mins}m ${secs}s`;
                    }
                }

                requestAnimationFrame(updateElapsed);
            };

            requestAnimationFrame(updateElapsed);
        }

        removeAlarmUI() {
            if (AlarmState.overlayElement) {
                AlarmState.overlayElement.classList.remove('active');
                setTimeout(() => {
                    AlarmState.overlayElement?.remove();
                    AlarmState.overlayElement = null;
                }, 400);
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // STOP ALARM
        // ══════════════════════════════════════════════════════════════════════
        stopAlarm(showComplete = false, type = 'stopped') {
            console.log('[AlarmController] Stopping alarm...');

            this.stopAudio();
            this.stopVibration();
            this.releaseWakeLock();

            if (AlarmState.normalModeTimeout) {
                clearTimeout(AlarmState.normalModeTimeout);
                AlarmState.normalModeTimeout = null;
            }

            if (showComplete && AlarmState.overlayElement) {
                this.showCompletionState(type);
            } else {
                this.removeAlarmUI();
            }

            AlarmState.isRinging = false;
            AlarmState.currentAlarm = null;
        }

        showCompletionState(type) {
            const overlay = AlarmState.overlayElement;
            if (!overlay) return;

            const container = overlay.querySelector('.sa-container');
            if (!container) return;

            const colors = {
                stopped: { bg: '#4caf50', title: 'ਵਾਹਿਗੁਰੂ!', message: 'Time for Simran!' },
                snoozed: { bg: '#c9883a', title: 'Snoozed', message: 'Alarm will ring again soon' },
                missed: { bg: '#c9554d', title: 'Missed', message: 'The alarm timed out' }
            };

            const config = colors[type] || colors.stopped;

            const successOverlay = document.createElement('div');
            successOverlay.className = 'sa-success-overlay';
            successOverlay.innerHTML = `
                <div class="sa-success-icon" style="background: ${config.bg};">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        ${type === 'stopped'
                    ? '<polyline points="20 6 9 17 4 12"/>'
                    : type === 'snoozed'
                        ? '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'
                        : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
                }
                    </svg>
                </div>
                <h2 class="sa-success-title">${config.title}</h2>
                <p class="sa-success-message">${config.message}</p>
            `;

            container.appendChild(successOverlay);
            requestAnimationFrame(() => successOverlay.classList.add('active'));

            // Auto-close after 2 seconds
            setTimeout(() => {
                this.removeAlarmUI();
            }, 2000);
        }

        // ══════════════════════════════════════════════════════════════════════
        // BROWSER NOTIFICATION
        // ══════════════════════════════════════════════════════════════════════
        showBrowserNotification(reminder, isPreReminder) {
            if (!('Notification' in window)) return;
            if (Notification.permission !== 'granted') return;

            try {
                const notification = new Notification(
                    isPreReminder ? `Upcoming: ${reminder.title}` : reminder.title,
                    {
                        body: isPreReminder ? 'Coming up soon...' : 'Time for your Paath',
                        icon: '../assets/favicon.svg',
                        badge: '../assets/favicon.svg',
                        tag: `alarm-${reminder.id}`,
                        requireInteraction: !isPreReminder,
                        vibrate: CONFIG.VIBRATION_PATTERN
                    }
                );

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

            } catch (e) {
                console.warn('[AlarmController] Notification error:', e);
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // SNOOZE
        // ══════════════════════════════════════════════════════════════════════
        scheduleSnooze(reminder, minutes) {
            const snoozeTime = Date.now() + (minutes * 60 * 1000);

            // Local timeout
            setTimeout(() => {
                const data = this.loadReminders();
                this.fireAlarm(reminder, false, data?.options || {});
            }, minutes * 60 * 1000);

            // Also notify Service Worker
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
                        data: { alarmId: reminder.id }
                    }
                });
            }

            console.log(`⏰ [AlarmController] Snooze scheduled for ${minutes} minutes`);
        }

        // ══════════════════════════════════════════════════════════════════════
        // LOGGING — with storage lock protection
        // ══════════════════════════════════════════════════════════════════════
        logInteraction(alarmId, action) {
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

                // Pending interactions for Nitnem Tracker
                if (window.AnhadStorageLock) {
                    window.AnhadStorageLock.withLock(CONFIG.PENDING_INTERACTIONS_KEY, (existing) => {
                        const pending = existing || [];
                        pending.push({ alarmId, action, timestamp });
                        return pending;
                    });
                } else {
                    const pending = JSON.parse(localStorage.getItem(CONFIG.PENDING_INTERACTIONS_KEY) || '[]');
                    pending.push({ alarmId, action, timestamp });
                    localStorage.setItem(CONFIG.PENDING_INTERACTIONS_KEY, JSON.stringify(pending));
                }

                // Dispatch event
                window.dispatchEvent(new CustomEvent('alarmInteraction', {
                    detail: { alarmId, action, timestamp }
                }));

                // Broadcast to coordinator
                if (window.AnhadAlarmCoordinator) {
                    window.AnhadAlarmCoordinator.acknowledgeAlarm(alarmId, action);
                }

                console.log(`📝 [AlarmController] Logged: ${alarmId} - ${action}`);

            } catch (e) {
                console.error('[AlarmController] Log error:', e);
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // WAKE LOCK
        // ══════════════════════════════════════════════════════════════════════
        async requestWakeLock() {
            if (!('wakeLock' in navigator)) return;

            try {
                AlarmState.wakeLock = await navigator.wakeLock.request('screen');
                console.log('[AlarmController] Wake Lock acquired');
            } catch (e) {
                console.log('[AlarmController] Wake Lock failed:', e);
            }
        }

        releaseWakeLock() {
            if (AlarmState.wakeLock) {
                AlarmState.wakeLock.release();
                AlarmState.wakeLock = null;
            }
        }

        // ══════════════════════════════════════════════════════════════════════
        // UTILITY
        // ══════════════════════════════════════════════════════════════════════
        getNextOccurrence(timeStr) {
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

        isInQuietHours(date, options) {
            if (!options.quietStart || !options.quietEnd) return false;

            const start = this.timeToMinutes(options.quietStart);
            const end = this.timeToMinutes(options.quietEnd);
            const current = date.getHours() * 60 + date.getMinutes();

            if (start > end) {
                return current >= start || current < end;
            }

            return current >= start && current < end;
        }

        timeToMinutes(timeStr) {
            const [h, m] = String(timeStr).split(':').map(Number);
            return h * 60 + m;
        }

        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // ══════════════════════════════════════════════════════════════════════
        // PUBLIC API - Test alarm
        // ══════════════════════════════════════════════════════════════════════
        testAlarm(reminder = null) {
            const testReminder = reminder || {
                id: 'test',
                title: 'Test Alarm',
                tone: 'waheguru-bell'
            };

            const data = this.loadReminders();
            this.fireAlarm(testReminder, false, data?.options || { neverMissMode: false });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════
    const controller = new AlarmController();

    // Auto-init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => controller.init());
    } else {
        controller.init();
    }

    // Expose globally
    window.AlarmController = controller;

})();
