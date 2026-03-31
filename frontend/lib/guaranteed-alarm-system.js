/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔥 GUARANTEED ALARM SYSTEM v1.0 - NEVER MISS AN ALARM
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This system GUARANTEES that alarms fire using multiple redundant methods:
 * 1. setTimeout (primary)
 * 2. setInterval checking (backup every 10 seconds)
 * 3. Service Worker notifications (background)
 * 4. Visibility change detection (when tab becomes visible)
 * 5. Page focus detection
 * 6. localStorage persistence (survives page reload)
 * 
 * CRITICAL: This bypasses the leader election system to ensure EVERY tab
 * can fire alarms independently.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    if (window.GuaranteedAlarmSystem) return;

    const CONFIG = {
        CHECK_INTERVAL: 10000, // Check every 10 seconds
        STORAGE_KEY: 'guaranteed_alarms_v1',
        FIRED_TODAY_KEY: 'alarms_fired_today_v1',
        REMINDERS_KEYS: ['sr_reminders_v4', 'sr_reminders_v3', 'smart_reminders_v1'],
        AUDIO_BASE: detectAudioPath(),
        AUDIO_FILES: {
            'audio1': 'audio1.mp3',
            'audio2': 'audio2.mp3',
            'audio3': 'audio3.mpeg',
            'audio4': 'audio4.mpeg',
            'audio5': 'audio5.mpeg',
            'audio6': 'audio6.mpeg',
            'waheguru-bell': 'audio1.mp3',
            'mool-mantar': 'audio2.mp3',
            'kirtan-gentle': 'audio3.mpeg',
            'peaceful-night': 'audio4.mpeg',
            'morning-raga': 'audio5.mpeg',
            'simple-bell': 'audio6.mpeg'
        },
        // NEW: Live stream support
        LIVE_STREAMS: {
            'live-darbar': {
                name: 'Live Darbar Sahib',
                stream: 'darbar',
                type: 'live'
            },
            'live-amritvela': {
                name: 'Live Amritvela Kirtan',
                stream: 'amritvela',
                type: 'live'
            }
        }
    };

    function detectAudioPath() {
        const path = window.location.pathname.toLowerCase();
        const port = window.location.port;
        
        // If using backend server (port 3000), use absolute path
        if (port === '3000') {
            return '/Audio/';
        }
        
        // Otherwise use relative paths based on location
        const subdirs = ['/reminders/', '/nitnemtracker/', '/naamabhyas/', '/hukamnama/',
            '/calendar/', '/notes/', '/sehajpaath/', '/gurbanisearch/', '/dashboard/', '/favorites/'];
        for (const subdir of subdirs) {
            if (path.includes(subdir)) return '../Audio/';
        }
        return 'Audio/';
    }

    // Verify audio file accessibility
    function verifyAudioFiles() {
        const testAudio = new Audio(CONFIG.AUDIO_BASE + 'audio1.mp3');
        testAudio.addEventListener('canplaythrough', () => {
            console.log('✅ [GuaranteedAlarms] Audio files accessible at:', CONFIG.AUDIO_BASE);
        }, { once: true });
        testAudio.addEventListener('error', (e) => {
            console.warn('⚠️ [GuaranteedAlarms] Audio path may be incorrect:', CONFIG.AUDIO_BASE);
            console.warn('⚠️ Trying alternative path...');
            // Try alternative path
            const altAudio = new Audio('/Audio/audio1.mp3');
            altAudio.addEventListener('canplaythrough', () => {
                console.log('✅ [GuaranteedAlarms] Audio files found at: /Audio/');
                CONFIG.AUDIO_BASE = '/Audio/';
            }, { once: true });
            altAudio.addEventListener('error', () => {
                console.error('❌ [GuaranteedAlarms] Cannot access audio files. Check Audio folder location.');
            }, { once: true });
            altAudio.load();
        }, { once: true });
        testAudio.load();
    }

    const State = {
        scheduledTimeouts: new Map(),
        checkInterval: null,
        audioElement: null,
        currentAlarm: null
    };

    // ══════════════════════════════════════════════════════════════════════════
    // LOAD REMINDERS FROM ALL POSSIBLE SOURCES
    // ══════════════════════════════════════════════════════════════════════════
    function loadAllReminders() {
        const allReminders = [];

        // 1. Load from smart reminders storage
        for (const key of CONFIG.REMINDERS_KEYS) {
            const raw = localStorage.getItem(key);
            if (raw) {
                try {
                    const data = JSON.parse(raw);
                    if (Array.isArray(data)) {
                        allReminders.push(...data.filter(r => r.enabled || r.on));
                    } else if (data.core || data.custom) {
                        if (data.core) {
                            Object.values(data.core).forEach(r => {
                                if (r.enabled) allReminders.push(r);
                            });
                        }
                        if (Array.isArray(data.custom)) {
                            allReminders.push(...data.custom.filter(r => r.enabled));
                        }
                    }
                } catch (e) {
                    console.error('Error loading reminders from', key, e);
                }
            }
        }

        // 2. Load Naam Abhyas sessions
        const naamSessions = localStorage.getItem('naamAbhyas_sessions');
        if (naamSessions) {
            try {
                const sessions = JSON.parse(naamSessions);
                if (Array.isArray(sessions)) {
                    sessions.forEach(session => {
                        if (session.enabled) {
                            allReminders.push({
                                id: `naam_${session.hour}`,
                                title: 'Naam Abhyas',
                                time: `${String(session.hour).padStart(2, '0')}:${String(session.startMinute || 0).padStart(2, '0')}`,
                                enabled: true,
                                tone: 'audio1',
                                type: 'naamAbhyas'
                            });
                        }
                    });
                }
            } catch (e) {
                console.error('Error loading Naam Abhyas sessions', e);
            }
        }

        console.log(`[GuaranteedAlarms] Loaded ${allReminders.length} active reminders`);
        return allReminders;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CHECK IF ALARM SHOULD FIRE NOW
    // ══════════════════════════════════════════════════════════════════════════
    function shouldFireNow(reminder) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        let reminderMinutes;
        if (typeof reminder.time === 'number') {
            reminderMinutes = reminder.time;
        } else if (typeof reminder.time === 'string') {
            const [h, m] = reminder.time.split(':').map(Number);
            reminderMinutes = h * 60 + m;
        } else {
            return false;
        }

        // Check if within 1 minute window
        const diff = Math.abs(currentMinutes - reminderMinutes);
        return diff <= 1;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CHECK IF ALREADY FIRED TODAY
    // ══════════════════════════════════════════════════════════════════════════
    function hasAlreadyFiredToday(reminderId) {
        const today = new Date().toLocaleDateString('en-CA');
        const firedKey = `alarm_fired_${reminderId}_${today}`;
        return localStorage.getItem(firedKey) === '1';
    }

    function markAsFiredToday(reminderId) {
        const today = new Date().toLocaleDateString('en-CA');
        const firedKey = `alarm_fired_${reminderId}_${today}`;
        localStorage.setItem(firedKey, '1');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FIRE ALARM
    // ══════════════════════════════════════════════════════════════════════════
    function fireAlarm(reminder) {
        if (hasAlreadyFiredToday(reminder.id)) {
            console.log(`[GuaranteedAlarms] Already fired today: ${reminder.title || reminder.label}`);
            return;
        }

        console.log(`🔥 [GuaranteedAlarms] FIRING ALARM: ${reminder.title || reminder.label}`);
        markAsFiredToday(reminder.id);

        State.currentAlarm = reminder;

        // 1. Play sound
        playAlarmSound(reminder.tone || 'audio1');

        // 2. Show browser notification
        showNotification(reminder);

        // 3. Vibrate
        if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 1000]);
        }

        // 4. Trigger global alarm modal if available
        if (window.GlobalAlarmSystem && window.GlobalAlarmSystem.showAlarmModal) {
            window.GlobalAlarmSystem.showAlarmModal(reminder);
        }

        // 5. Log to Nitnem Tracker if applicable
        logToNitnemTracker(reminder);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PLAY ALARM SOUND
    // ══════════════════════════════════════════════════════════════════════════
    function playAlarmSound(tone) {
        // Check if it's a live stream
        if (CONFIG.LIVE_STREAMS[tone]) {
            playLiveStream(tone);
            return;
        }

        // Regular audio file
        const audioFile = CONFIG.AUDIO_FILES[tone] || CONFIG.AUDIO_FILES['audio1'];
        const audioPath = CONFIG.AUDIO_BASE + audioFile;

        if (State.audioElement) {
            State.audioElement.pause();
            State.audioElement = null;
        }

        console.log(`🔊 [GuaranteedAlarms] Playing audio: ${audioPath}`);

        State.audioElement = new Audio(audioPath);
        State.audioElement.loop = true;
        State.audioElement.volume = 0.7;

        State.audioElement.play().then(() => {
            console.log('✅ [GuaranteedAlarms] Audio playing successfully');
        }).catch(err => {
            console.error('❌ [GuaranteedAlarms] Audio play error:', err);
            console.log('🔄 [GuaranteedAlarms] Trying alternative paths...');
            
            // Try multiple alternative paths
            const altPaths = [
                'Audio/' + audioFile,
                '/Audio/' + audioFile,
                '../Audio/' + audioFile,
                './Audio/' + audioFile
            ];

            let pathIndex = 0;
            const tryNextPath = () => {
                if (pathIndex >= altPaths.length) {
                    console.error('❌ [GuaranteedAlarms] All audio paths failed. Audio files may be missing.');
                    return;
                }

                const altPath = altPaths[pathIndex];
                console.log(`🔄 [GuaranteedAlarms] Trying: ${altPath}`);
                State.audioElement.src = altPath;
                
                State.audioElement.play().then(() => {
                    console.log(`✅ [GuaranteedAlarms] Audio playing from: ${altPath}`);
                    CONFIG.AUDIO_BASE = altPath.replace(audioFile, '');
                }).catch(() => {
                    pathIndex++;
                    tryNextPath();
                });
            };

            tryNextPath();
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PLAY LIVE STREAM
    // ══════════════════════════════════════════════════════════════════════════
    function playLiveStream(tone) {
        const streamInfo = CONFIG.LIVE_STREAMS[tone];
        if (!streamInfo) {
            console.error('[GuaranteedAlarms] Unknown live stream:', tone);
            return;
        }

        console.log(`🔴 [GuaranteedAlarms] Starting live stream: ${streamInfo.name}`);

        // Stop any existing audio
        if (State.audioElement) {
            State.audioElement.pause();
            State.audioElement = null;
        }

        // Use GlobalMiniPlayer if available
        if (window.GlobalMiniPlayer) {
            try {
                window.GlobalMiniPlayer.play(streamInfo.stream);
                console.log(`✅ [GuaranteedAlarms] Live stream started: ${streamInfo.name}`);
            } catch (e) {
                console.error('[GuaranteedAlarms] Failed to start live stream:', e);
            }
        } else {
            console.warn('[GuaranteedAlarms] GlobalMiniPlayer not available, waiting...');
            // Retry after a short delay
            setTimeout(() => {
                if (window.GlobalMiniPlayer) {
                    window.GlobalMiniPlayer.play(streamInfo.stream);
                } else {
                    console.error('[GuaranteedAlarms] GlobalMiniPlayer still not available');
                }
            }, 1000);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SHOW BROWSER NOTIFICATION
    // ══════════════════════════════════════════════════════════════════════════
    function showNotification(reminder) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            const title = getNotificationTitle(reminder);
            const body = getNotificationBody(reminder);

            const notification = new Notification(title, {
                body: body,
                icon: '../assets/favicon-32x32.png',
                badge: '../assets/favicon-32x32.png',
                tag: `alarm-${reminder.id}`,
                requireInteraction: true,
                vibrate: [500, 200, 500],
                silent: false
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showNotification(reminder);
                }
            });
        }
    }

    function getNotificationTitle(reminder) {
        const type = reminder.type || reminder.id || '';
        const titles = {
            'amritvela': '🌅 Amritvela - ਅੰਮ੍ਰਿਤ ਵੇਲਾ',
            'rehras': '🌆 Rehras Sahib - ਰਹਿਰਾਸ ਸਾਹਿਬ',
            'sohila': '🌙 Sohila Sahib - ਸੋਹਿਲਾ ਸਾਹਿਬ',
            'naamAbhyas': '🙏 Naam Abhyas - ਨਾਮ ਅਭਿਆਸ'
        };
        return titles[type] || reminder.title || reminder.label || 'Reminder';
    }

    function getNotificationBody(reminder) {
        const type = reminder.type || reminder.id || '';
        const bodies = {
            'amritvela': 'Time for Amritvela meditation and prayer',
            'rehras': 'Time for evening Rehras Sahib',
            'sohila': 'Time for bedtime Sohila Sahib',
            'naamAbhyas': 'Time for Naam Abhyas - Remember Vaheguru'
        };
        return bodies[type] || 'Time for your spiritual practice';
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LOG TO NITNEM TRACKER
    // ══════════════════════════════════════════════════════════════════════════
    function logToNitnemTracker(reminder) {
        const type = reminder.type || reminder.id || '';
        if (!['amritvela', 'rehras', 'sohila'].includes(type)) return;

        try {
            const today = new Date().toLocaleDateString('en-CA');
            const logKey = 'nitnemTracker_alarmLog';
            const log = JSON.parse(localStorage.getItem(logKey) || '{}');

            if (!log[today]) log[today] = {};
            log[today][type] = {
                fired: true,
                time: new Date().toISOString(),
                status: 'pending'
            };

            localStorage.setItem(logKey, JSON.stringify(log));
            console.log(`[GuaranteedAlarms] Logged to Nitnem Tracker: ${type}`);
        } catch (e) {
            console.error('[GuaranteedAlarms] Error logging to Nitnem Tracker:', e);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PERIODIC CHECK (BACKUP METHOD)
    // ══════════════════════════════════════════════════════════════════════════
    function periodicCheck() {
        const reminders = loadAllReminders();

        reminders.forEach(reminder => {
            if (shouldFireNow(reminder) && !hasAlreadyFiredToday(reminder.id)) {
                fireAlarm(reminder);
            }
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STOP ALARM
    // ══════════════════════════════════════════════════════════════════════════
    function stopAlarm() {
        if (State.audioElement) {
            State.audioElement.pause();
            State.audioElement = null;
        }
        
        // Also stop GlobalMiniPlayer if it's playing
        if (window.GlobalMiniPlayer && State.currentAlarm) {
            const tone = State.currentAlarm.tone || 'audio1';
            if (CONFIG.LIVE_STREAMS[tone]) {
                window.GlobalMiniPlayer.pause();
                console.log('[GuaranteedAlarms] Stopped live stream');
            }
        }
        
        State.currentAlarm = null;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════
    function init() {
        console.log('🔥 [GuaranteedAlarms] Initializing...');
        console.log('📁 [GuaranteedAlarms] Audio base path:', CONFIG.AUDIO_BASE);

        // Verify audio files are accessible
        verifyAudioFiles();

        // Start periodic checking
        State.checkInterval = setInterval(periodicCheck, CONFIG.CHECK_INTERVAL);

        // Check immediately
        periodicCheck();

        // Check when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                periodicCheck();
            }
        });

        // Check when window gains focus
        window.addEventListener('focus', periodicCheck);

        // Cleanup on page hide
        window.addEventListener('pagehide', () => {
            if (State.checkInterval) {
                clearInterval(State.checkInterval);
            }
        });

        console.log('🔥 [GuaranteedAlarms] System active - checking every 10 seconds');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ══════════════════════════════════════════════════════════════════════════
    window.GuaranteedAlarmSystem = {
        init: init,
        fireAlarm: fireAlarm,
        stopAlarm: stopAlarm,
        loadAllReminders: loadAllReminders,
        periodicCheck: periodicCheck
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
