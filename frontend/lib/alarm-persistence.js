/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD - ALARM PERSISTENCE SYSTEM v1.0.0
 * IndexedDB-based persistent alarm storage with Keep-Alive Worker integration
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ IndexedDB storage (survives browser restart)
 * ✅ Web Worker integration for background processing
 * ✅ Wake Lock API for Android
 * ✅ Audio context trick to prevent browser sleep
 * ✅ Notification API with proper tags
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════
    const DB_NAME = 'AnhadAlarmsDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'alarms';

    // ═══════════════════════════════════════════════════════════════════════════
    // ALARM PERSISTENCE CLASS
    // ═══════════════════════════════════════════════════════════════════════════
    class AlarmPersistence {
        constructor() {
            this.db = null;
            this.worker = null;
            this.wakeLock = null;
            this.audioContext = null;
            this.silentOscillator = null;
            this.isInitialized = false;

            this.init();
        }

        // ═══════════════════════════════════════════════════════════════════════
        // INITIALIZATION
        // ═══════════════════════════════════════════════════════════════════════
        async init() {
            try {
                // Initialize IndexedDB
                await this.initDB();

                // Initialize Web Worker
                this.initWorker();

                // Initialize Wake Lock (Android)
                this.initWakeLock();

                // Initialize Audio Keep-Alive
                this.initAudioKeepAlive();

                // Load alarms and sync to worker
                await this.syncAlarmsToWorker();

                // Listen for visibility changes
                this.setupVisibilityListener();

                // Listen for page show (iOS)
                this.setupPageShowListener();

                this.isInitialized = true;
                console.log('[AlarmPersistence] Initialized successfully');

            } catch (error) {
                console.error('[AlarmPersistence] Init error:', error);
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // INDEXEDDB SETUP
        // ═══════════════════════════════════════════════════════════════════════
        initDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = () => {
                    console.error('[AlarmPersistence] IndexedDB error');
                    reject(request.error);
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    console.log('[AlarmPersistence] IndexedDB opened');
                    resolve();
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                        store.createIndex('enabled', 'enabled', { unique: false });
                        store.createIndex('time', 'time', { unique: false });
                        store.createIndex('lastFired', 'lastFired', { unique: false });
                        console.log('[AlarmPersistence] Object store created');
                    }
                };
            });
        }

        // ═══════════════════════════════════════════════════════════════════════
        // WEB WORKER SETUP
        // ═══════════════════════════════════════════════════════════════════════
        initWorker() {
            try {
                this.worker = new Worker('/lib/keep-alive-worker.js');

                this.worker.onmessage = (event) => {
                    this.handleWorkerMessage(event.data);
                };

                this.worker.onerror = (error) => {
                    console.error('[AlarmPersistence] Worker error:', error);
                };

                console.log('[AlarmPersistence] Worker initialized');

            } catch (error) {
                console.warn('[AlarmPersistence] Worker not available:', error);
            }
        }

        handleWorkerMessage(data) {
            const { type, payload } = data || {};

            switch (type) {
                case 'FIRE_ALARM':
                    this.fireAlarm(payload);
                    break;

                case 'HEARTBEAT':
                    // Worker is alive
                    break;

                case 'PONG':
                    console.log('[AlarmPersistence] Worker responded');
                    break;
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // WAKE LOCK (ANDROID)
        // ═══════════════════════════════════════════════════════════════════════
        async initWakeLock() {
            if ('wakeLock' in navigator) {
                try {
                    this.wakeLock = await navigator.wakeLock.request('screen');

                    this.wakeLock.addEventListener('release', () => {
                        console.log('[AlarmPersistence] Wake lock released');
                        // Try to re-acquire
                        this.initWakeLock();
                    });

                    console.log('[AlarmPersistence] Wake lock acquired');

                } catch (error) {
                    console.warn('[AlarmPersistence] Wake lock not available:', error);
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // AUDIO KEEP-ALIVE (Prevents browser from sleeping)
        // ═══════════════════════════════════════════════════════════════════════
        initAudioKeepAlive() {
            try {
                // Create audio context
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();

                // Create silent oscillator
                this.silentOscillator = this.audioContext.createOscillator();
                this.silentOscillator.frequency.value = 0; // Silent

                // Create gain node with 0 volume
                const gainNode = this.audioContext.createGain();
                gainNode.gain.value = 0;

                // Connect: oscillator -> gain -> output
                this.silentOscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                // Start the oscillator (keeps audio context alive)
                this.silentOscillator.start();

                console.log('[AlarmPersistence] Audio keep-alive started');

            } catch (error) {
                console.warn('[AlarmPersistence] Audio keep-alive not available:', error);
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // VISIBILITY & PAGE SHOW LISTENERS
        // ═══════════════════════════════════════════════════════════════════════
        setupVisibilityListener() {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    console.log('[AlarmPersistence] Page visible - checking alarms');
                    this.checkMissedAlarms();
                    this.syncAlarmsToWorker();
                    this.initWakeLock();
                }
            });
        }

        setupPageShowListener() {
            window.addEventListener('pageshow', (event) => {
                if (event.persisted) {
                    console.log('[AlarmPersistence] Page restored from cache - checking alarms');
                    this.checkMissedAlarms();
                    this.syncAlarmsToWorker();
                }
            });
        }

        // ═══════════════════════════════════════════════════════════════════════
        // ALARM CRUD OPERATIONS
        // ═══════════════════════════════════════════════════════════════════════
        async getAllAlarms() {
            if (!this.db) return [];

            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        }

        async getAlarm(id) {
            if (!this.db) return null;

            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const request = store.get(id);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async saveAlarm(alarm) {
            if (!this.db || !alarm || !alarm.id) return false;

            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);

                // Add metadata
                alarm.updatedAt = Date.now();
                if (!alarm.createdAt) alarm.createdAt = Date.now();

                const request = store.put(alarm);

                request.onsuccess = () => {
                    // Sync to worker
                    if (this.worker) {
                        this.worker.postMessage({ type: 'ADD_ALARM', payload: alarm });
                    }
                    console.log('[AlarmPersistence] Alarm saved:', alarm.id);
                    resolve(true);
                };

                request.onerror = () => reject(request.error);
            });
        }

        async deleteAlarm(id) {
            if (!this.db) return false;

            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const request = store.delete(id);

                request.onsuccess = () => {
                    // Sync to worker
                    if (this.worker) {
                        this.worker.postMessage({ type: 'REMOVE_ALARM', payload: { id } });
                    }
                    console.log('[AlarmPersistence] Alarm deleted:', id);
                    resolve(true);
                };

                request.onerror = () => reject(request.error);
            });
        }

        async syncAlarmsToWorker() {
            if (!this.worker) return;

            try {
                const alarms = await this.getAllAlarms();
                this.worker.postMessage({ type: 'SET_ALARMS', payload: alarms });
                console.log('[AlarmPersistence] Synced', alarms.length, 'alarms to worker');
            } catch (error) {
                console.error('[AlarmPersistence] Sync error:', error);
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // FIRE ALARM
        // ═══════════════════════════════════════════════════════════════════════
        async fireAlarm(alarmData) {
            console.log('[AlarmPersistence] Firing alarm:', alarmData.id);

            // Show notification
            await this.showNotification(alarmData);

            // Play sound
            if (alarmData.sound !== false) {
                this.playAlarmSound(alarmData.sound);
            }

            // Vibrate
            if (alarmData.vibrate && 'vibrate' in navigator) {
                navigator.vibrate([200, 100, 200, 100, 400]);
            }

            // Update last fired time in DB
            const alarm = await this.getAlarm(alarmData.id);
            if (alarm) {
                alarm.lastFired = new Date().toISOString().split('T')[0];
                await this.saveAlarm(alarm);
            }

            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('alarmFired', { detail: alarmData }));

            // Open alarm page if in foreground
            if (document.visibilityState === 'visible' && alarmData.url) {
                // Use iframe or navigate based on preference
                this.showAlarmModal(alarmData);
            }
        }

        async showNotification(alarmData) {
            if (Notification.permission !== 'granted') {
                console.warn('[AlarmPersistence] Notification permission not granted');
                return;
            }

            const options = {
                body: alarmData.body || `Time for ${alarmData.title}`,
                icon: '/assets/icons/icon-192x192.png',
                badge: '/assets/icons/icon-72x72.png',
                tag: `anhad-alarm-${alarmData.id}`, // Use tag to update existing notifications
                renotify: true,
                requireInteraction: true, // Keep notification visible until user interacts
                vibrate: [200, 100, 200, 100, 400],
                silent: false,
                data: {
                    url: alarmData.url,
                    id: alarmData.id,
                    timestamp: Date.now()
                },
                actions: [
                    { action: 'open', title: '🙏 Open' },
                    { action: 'snooze', title: '😴 Snooze 5min' },
                    { action: 'dismiss', title: '✖️ Dismiss' }
                ]
            };

            try {
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    // Use service worker for background notifications
                    const registration = await navigator.serviceWorker.ready;
                    await registration.showNotification(alarmData.title || 'ANHAD Reminder', options);
                } else {
                    // Fallback to regular notification
                    new Notification(alarmData.title || 'ANHAD Reminder', options);
                }

                console.log('[AlarmPersistence] Notification shown');

            } catch (error) {
                console.error('[AlarmPersistence] Notification error:', error);
            }
        }

        playAlarmSound(soundId) {
            try {
                const soundMap = {
                    audio1: '/Audio/audio1.mp3',
                    audio2: '/Audio/audio2.mp3',
                    audio3: '/Audio/audio3.mpeg',
                    audio4: '/Audio/audio4.mpeg',
                    audio5: '/Audio/audio5.mpeg',
                    audio6: '/Audio/audio6.mpeg'
                };

                const soundUrl = soundMap[soundId] || soundMap.audio1;
                const audio = new Audio(soundUrl);
                audio.volume = 1.0;
                audio.loop = true;

                // Store reference for stopping later
                window.currentAlarmAudio = audio;

                audio.play().catch(err => {
                    console.warn('[AlarmPersistence] Audio playback failed:', err);
                });

                // Auto-stop after 5 minutes
                setTimeout(() => {
                    if (window.currentAlarmAudio === audio) {
                        audio.pause();
                        audio.currentTime = 0;
                    }
                }, 5 * 60 * 1000);

            } catch (error) {
                console.error('[AlarmPersistence] Sound error:', error);
            }
        }

        showAlarmModal(alarmData) {
            // Dispatch event for the global alarm system to handle
            window.dispatchEvent(new CustomEvent('showAlarmModal', { detail: alarmData }));
        }

        // ═══════════════════════════════════════════════════════════════════════
        // CHECK MISSED ALARMS
        // ═══════════════════════════════════════════════════════════════════════
        async checkMissedAlarms() {
            try {
                const alarms = await this.getAllAlarms();
                const now = new Date();
                const today = now.toISOString().split('T')[0];
                const currentMinutes = now.getHours() * 60 + now.getMinutes();

                for (const alarm of alarms) {
                    if (!alarm.enabled || alarm.lastFired === today) continue;

                    // Parse alarm time
                    const [hours, minutes] = alarm.time.split(':').map(Number);
                    const alarmMinutes = hours * 60 + minutes;

                    // Check if alarm was missed (within last 30 minutes)
                    const timeDiff = currentMinutes - alarmMinutes;
                    if (timeDiff > 0 && timeDiff <= 30) {
                        console.log('[AlarmPersistence] Missed alarm detected:', alarm.id);

                        // Show missed notification
                        await this.showNotification({
                            id: alarm.id,
                            title: `⏰ Missed: ${alarm.title || alarm.label}`,
                            body: `You missed your ${alarm.time} reminder`,
                            url: alarm.url || '/reminders/smart-reminders.html'
                        });

                        // Mark as fired
                        alarm.lastFired = today;
                        await this.saveAlarm(alarm);
                    }
                }

            } catch (error) {
                console.error('[AlarmPersistence] Check missed alarms error:', error);
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // MIGRATION FROM LOCALSTORAGE
        // ═══════════════════════════════════════════════════════════════════════
        async migrateFromLocalStorage() {
            try {
                // Check if already migrated
                if (localStorage.getItem('anhad_alarms_migrated') === 'true') return;

                // Get reminders from localStorage
                const remindersJson = localStorage.getItem('sr_reminders_v4');
                if (!remindersJson) return;

                const data = JSON.parse(remindersJson);
                const coreReminders = data.coreReminders || {};
                const customReminders = data.customReminders || [];

                // Migrate core reminders
                for (const [id, reminder] of Object.entries(coreReminders)) {
                    await this.saveAlarm({
                        id,
                        title: reminder.label || reminder.gurmukhi,
                        label: reminder.label,
                        gurmukhi: reminder.gurmukhi,
                        time: reminder.time,
                        enabled: reminder.enabled !== false,
                        sound: reminder.sound || 'audio1',
                        vibrate: reminder.vibrate !== false,
                        days: reminder.days || [0, 1, 2, 3, 4, 5, 6],
                        isCore: true
                    });
                }

                // Migrate custom reminders
                for (const reminder of customReminders) {
                    await this.saveAlarm({
                        id: reminder.id || `custom_${Date.now()}`,
                        title: reminder.label,
                        label: reminder.label,
                        time: reminder.time,
                        enabled: reminder.enabled !== false,
                        sound: reminder.sound || 'audio1',
                        vibrate: reminder.vibrate !== false,
                        days: reminder.days || [0, 1, 2, 3, 4, 5, 6],
                        isCore: false
                    });
                }

                localStorage.setItem('anhad_alarms_migrated', 'true');
                console.log('[AlarmPersistence] Migration complete');

            } catch (error) {
                console.error('[AlarmPersistence] Migration error:', error);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZE AND EXPORT
    // ═══════════════════════════════════════════════════════════════════════════
    window.AlarmPersistence = AlarmPersistence;
    window.alarmPersistence = new AlarmPersistence();

    // Migrate on first load
    setTimeout(() => {
        window.alarmPersistence.migrateFromLocalStorage();
    }, 2000);

})();
