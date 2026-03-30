/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SACRED ALARM - Premium Alarm System
 * Features: Never Miss Mode, Full Audio Loop, Background Support
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ══════════════════════════════════════════════════════════════════════════
    const CONFIG = {
        STORAGE_KEY: 'smart_reminders_v1',
        ALARM_LOG_KEY: 'nitnemTracker_alarmLog',
        PENDING_INTERACTIONS_KEY: 'pending_alarm_interactions',

        // Audio files with fallbacks
        AUDIO_FILES: {
            'audio1': '../Audio/audio1.mp3',
            'audio2': '../Audio/audio2.mp3',
            'audio3': '../Audio/audio3.mpeg',
            'audio4': '../Audio/audio4.mpeg',
            'audio5': '../Audio/audio5.mpeg',
            'audio6': '../Audio/audio6.mpeg'
        },

        // Default synth frequencies
        SYNTH_TONES: {
            'bell': 880,
            'chime': 660,
            'soft': 528,
            'deep': 196,
            'bright': 1046,
            'sacred': 604
        },

        // Normal mode: stops after this duration (seconds)
        NORMAL_MODE_DURATION: 120, // 2 minutes

        // Never Miss Mode: keeps repeating until stopped
        NEVER_MISS_LOOP_INTERVAL: 3000, // Re-trigger vibration every 3s

        // Animation intervals
        RIPPLE_INTERVAL: 500,
        PROGRESS_MAX_SECONDS: 300 // 5 minute max for progress ring
    };

    // ══════════════════════════════════════════════════════════════════════════
    // STATE
    // ══════════════════════════════════════════════════════════════════════════
    const State = {
        audio: null,
        audioContext: null,
        oscillator: null,
        gainNode: null,
        vibrationInterval: null,
        rippleInterval: null,
        elapsedInterval: null,
        normalModeTimeout: null,
        startTime: Date.now(),
        isNeverMissMode: false,
        isStopped: false,
        snoozeDuration: 10 // default minutes
    };

    // ══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════
    function init() {
        // Parse URL parameters
        const params = new URLSearchParams(window.location.search);
        const alarmId = params.get('id') || 'test';
        const alarmTitle = params.get('title') || 'Alarm';
        const toneId = params.get('tone') || 'audio1';
        const neverMiss = params.get('nevermiss') === 'true';

        // Load settings from storage
        loadSettings();

        // Set Never Miss Mode
        State.isNeverMissMode = neverMiss;

        // Update UI
        updateTitleDisplay(alarmTitle);
        updateTimeDisplay();
        setInterval(updateTimeDisplay, 1000);

        // Show Never Miss badge if active
        if (State.isNeverMissMode) {
            document.getElementById('neverMissBadge')?.classList.add('active');
        }

        // Update snooze button text
        document.getElementById('snoozeTime').textContent = `${State.snoozeDuration} minutes`;

        // Start elapsed time counter
        startElapsedCounter();

        // Start progress ring animation
        startProgressAnimation();

        // Start ripple animation
        startRippleAnimation();

        // Try to start alarm immediately
        startAlarm(toneId);

        // Bind button events
        document.getElementById('stopBtn')?.addEventListener('click', () => handleStop(alarmId));
        document.getElementById('snoozeBtn')?.addEventListener('click', () => handleSnooze(alarmId));

        // Tap overlay for autoplay policy
        const tapOverlay = document.getElementById('tapOverlay');
        tapOverlay?.addEventListener('click', () => {
            tapOverlay.classList.remove('active');
            startAlarm(toneId);
        });

        // Keep screen awake
        requestWakeLock();

        // Visibility change handler
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !State.isStopped) {
                // Ensure audio is playing when tab becomes visible again
                if (State.audio && State.audio.paused) {
                    State.audio.play().catch(() => { });
                }
            }
        });

        console.log('🔔 Sacred Alarm initialized', { alarmId, toneId, neverMiss });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SETTINGS
    // ══════════════════════════════════════════════════════════════════════════
    function loadSettings() {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                State.snoozeDuration = data.options?.snoozeMinutes || 10;
                State.isNeverMissMode = data.options?.neverMissMode || false;
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // UI UPDATES
    // ══════════════════════════════════════════════════════════════════════════
    function updateTitleDisplay(title) {
        const titleEl = document.getElementById('alarmTitle');
        const subtitleEl = document.getElementById('alarmSubtitle');

        if (titleEl) titleEl.textContent = title;
        if (subtitleEl) subtitleEl.textContent = 'Time for your spiritual practice';
    }

    function updateTimeDisplay() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12 || 12;
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;

        const timeEl = document.getElementById('currentTime');
        const periodEl = document.getElementById('currentPeriod');

        if (timeEl) timeEl.textContent = `${hours}:${minutesStr}`;
        if (periodEl) periodEl.textContent = period;
    }

    function startElapsedCounter() {
        State.startTime = Date.now();

        State.elapsedInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - State.startTime) / 1000);
            const elapsedEl = document.getElementById('elapsedTime');

            if (elapsedEl) {
                if (elapsed < 60) {
                    elapsedEl.textContent = `Ringing for ${elapsed} seconds`;
                } else {
                    const mins = Math.floor(elapsed / 60);
                    const secs = elapsed % 60;
                    elapsedEl.textContent = `Ringing for ${mins}m ${secs}s`;
                }
            }
        }, 1000);
    }

    function startProgressAnimation() {
        const progressFill = document.getElementById('progressFill');
        if (!progressFill) return;

        const circumference = 2 * Math.PI * 90; // radius = 90
        progressFill.style.strokeDasharray = circumference;
        progressFill.style.strokeDashoffset = circumference;

        const updateProgress = () => {
            const elapsed = (Date.now() - State.startTime) / 1000;
            const progress = Math.min(elapsed / CONFIG.PROGRESS_MAX_SECONDS, 1);
            const offset = circumference * (1 - progress);
            progressFill.style.strokeDashoffset = offset;

            if (!State.isStopped && progress < 1) {
                requestAnimationFrame(updateProgress);
            }
        };

        requestAnimationFrame(updateProgress);
    }

    function startRippleAnimation() {
        const container = document.getElementById('rippleContainer');
        if (!container) return;

        const createRipple = () => {
            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            container.appendChild(ripple);

            setTimeout(() => ripple.remove(), 2000);
        };

        createRipple();
        State.rippleInterval = setInterval(createRipple, CONFIG.RIPPLE_INTERVAL);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ALARM AUDIO
    // ══════════════════════════════════════════════════════════════════════════
    function startAlarm(toneId) {
        // Try to play audio file first
        if (CONFIG.AUDIO_FILES[toneId]) {
            playAudioFile(CONFIG.AUDIO_FILES[toneId]);
        } else if (CONFIG.SYNTH_TONES[toneId]) {
            playSynthTone(CONFIG.SYNTH_TONES[toneId]);
        } else {
            // Default to audio1
            playAudioFile(CONFIG.AUDIO_FILES['audio1']);
        }

        // Start vibration
        startVibration();

        // Set normal mode timeout if not in Never Miss Mode
        if (!State.isNeverMissMode) {
            State.normalModeTimeout = setTimeout(() => {
                stopAlarm();
                showTimeoutMessage();
            }, CONFIG.NORMAL_MODE_DURATION * 1000);
        }
    }

    function playAudioFile(path) {
        try {
            State.audio = new Audio(path);
            State.audio.loop = true;
            State.audio.volume = 1.0; // FULL VOLUME

            // Try to play
            const playPromise = State.audio.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('Audio autoplay blocked, showing tap overlay');
                    document.getElementById('tapOverlay')?.classList.add('active');
                });
            }

            // Handle audio errors - fallback to synth
            State.audio.onerror = () => {
                console.warn('Audio file failed, falling back to synth');
                playSynthTone(CONFIG.SYNTH_TONES['sacred']);
            };

        } catch (e) {
            console.error('Audio playback error:', e);
            playSynthTone(CONFIG.SYNTH_TONES['sacred']);
        }
    }

    function playSynthTone(frequency) {
        try {
            State.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            State.oscillator = State.audioContext.createOscillator();
            State.gainNode = State.audioContext.createGain();

            State.oscillator.connect(State.gainNode);
            State.gainNode.connect(State.audioContext.destination);

            State.oscillator.type = 'sine';
            State.oscillator.frequency.value = frequency;

            // Create pulsing effect
            const now = State.audioContext.currentTime;
            State.gainNode.gain.setValueAtTime(0, now);

            // Continuous pulse
            const createPulse = () => {
                if (State.isStopped || !State.audioContext) return;

                const t = State.audioContext.currentTime;
                State.gainNode.gain.cancelScheduledValues(t);
                State.gainNode.gain.setValueAtTime(0, t);
                State.gainNode.gain.linearRampToValueAtTime(0.5, t + 0.1);
                State.gainNode.gain.linearRampToValueAtTime(0.3, t + 0.5);
                State.gainNode.gain.linearRampToValueAtTime(0, t + 0.9);

                setTimeout(createPulse, 1000);
            };

            State.oscillator.start();
            createPulse();

        } catch (e) {
            console.error('Synth error:', e);
        }
    }

    function stopAudio() {
        if (State.audio) {
            State.audio.pause();
            State.audio.currentTime = 0;
            State.audio = null;
        }

        if (State.oscillator) {
            try { State.oscillator.stop(); } catch { }
            State.oscillator = null;
        }

        if (State.audioContext) {
            try { State.audioContext.close(); } catch { }
            State.audioContext = null;
        }

        State.gainNode = null;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // VIBRATION
    // ══════════════════════════════════════════════════════════════════════════
    function startVibration() {
        if (!navigator.vibrate) return;

        // Strong vibration pattern
        const vibratePattern = () => {
            navigator.vibrate([500, 200, 500, 200, 1000, 300, 500]);
        };

        vibratePattern();
        State.vibrationInterval = setInterval(vibratePattern, CONFIG.NEVER_MISS_LOOP_INTERVAL);
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
        State.isStopped = true;

        stopAudio();
        stopVibration();

        if (State.rippleInterval) {
            clearInterval(State.rippleInterval);
        }

        if (State.elapsedInterval) {
            clearInterval(State.elapsedInterval);
        }

        if (State.normalModeTimeout) {
            clearTimeout(State.normalModeTimeout);
        }

        releaseWakeLock();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HANDLERS
    // ══════════════════════════════════════════════════════════════════════════
    function handleStop(alarmId) {
        stopAlarm();
        saveInteraction(alarmId, 'responded');
        showSuccessScreen();
    }

    function handleSnooze(alarmId) {
        stopAlarm();
        saveInteraction(alarmId, 'snoozed');

        // Schedule snooze notification via service worker
        scheduleSnooze(alarmId, State.snoozeDuration);

        showSnoozeMessage();
    }

    function saveInteraction(alarmId, action) {
        try {
            const interaction = {
                alarmId: alarmId,
                action: action,
                timestamp: new Date().toISOString()
            };

            // Save for NitnemTracker to pick up
            const existing = JSON.parse(localStorage.getItem(CONFIG.PENDING_INTERACTIONS_KEY) || '[]');
            existing.push(interaction);
            localStorage.setItem(CONFIG.PENDING_INTERACTIONS_KEY, JSON.stringify(existing));

            // Also save to alarm log
            const today = new Date().toLocaleDateString('en-CA');
            const log = JSON.parse(localStorage.getItem(CONFIG.ALARM_LOG_KEY) || '{}');
            if (!log[today]) log[today] = {};
            log[today][alarmId] = { status: action, timestamp: new Date().toISOString() };
            localStorage.setItem(CONFIG.ALARM_LOG_KEY, JSON.stringify(log));

            // Dispatch event for any listening pages
            window.dispatchEvent(new CustomEvent('alarmInteraction', {
                detail: { alarmId, action, timestamp: new Date().toISOString() }
            }));

        } catch (e) {
            console.error('Error saving interaction:', e);
        }
    }

    function scheduleSnooze(alarmId, minutes) {
        try {
            // Tell service worker to schedule snooze
            if (navigator.serviceWorker?.controller) {
                const snoozeTime = Date.now() + (minutes * 60 * 1000);
                navigator.serviceWorker.controller.postMessage({
                    type: 'SCHEDULE_NOTIFICATION',
                    payload: {
                        id: `snooze_${alarmId}`,
                        title: 'Snooze Complete',
                        body: 'Your snoozed alarm is ringing again',
                        scheduledTime: snoozeTime,
                        tag: `snooze-${alarmId}`,
                        requireInteraction: true,
                        data: {
                            url: `./alarm.html?id=${alarmId}&title=Snoozed%20Alarm`
                        }
                    }
                });
            }
        } catch (e) {
            console.error('Snooze scheduling error:', e);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SUCCESS / MESSAGE SCREENS
    // ══════════════════════════════════════════════════════════════════════════
    function showSuccessScreen() {
        document.body.classList.add('alarm-stopped');

        const overlay = document.createElement('div');
        overlay.className = 'success-overlay';
        overlay.innerHTML = `
            <div class="success-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
            </div>
            <h2 class="success-title">ਵਾਹਿਗੁਰੂ!</h2>
            <p class="success-message">Alarm stopped. Time for Simran!</p>
            <a href="../index.html" class="success-link">Open App</a>
        `;

        document.body.appendChild(overlay);

        // Auto-redirect after 3 seconds
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 3000);
    }

    function showSnoozeMessage() {
        document.body.classList.add('alarm-stopped');

        const overlay = document.createElement('div');
        overlay.className = 'success-overlay';
        overlay.style.setProperty('--alarm-green', '#FF9F0A');
        overlay.innerHTML = `
            <div class="success-icon" style="background: #FF9F0A;">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM12 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                </svg>
            </div>
            <h2 class="success-title">Snoozed</h2>
            <p class="success-message">Alarm will ring again in ${State.snoozeDuration} minutes</p>
            <a href="../index.html" class="success-link">Open App</a>
        `;

        document.body.appendChild(overlay);

        setTimeout(() => {
            window.location.href = '../index.html';
        }, 3000);
    }

    function showTimeoutMessage() {
        document.body.classList.add('alarm-stopped');

        const overlay = document.createElement('div');
        overlay.className = 'success-overlay';
        overlay.innerHTML = `
            <div class="success-icon" style="background: #FF453A;">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
            </div>
            <h2 class="success-title">Alarm Expired</h2>
            <p class="success-message">The alarm stopped after ${CONFIG.NORMAL_MODE_DURATION / 60} minutes with no response</p>
            <a href="../index.html" class="success-link">Open App</a>
        `;

        document.body.appendChild(overlay);

        saveInteraction(new URLSearchParams(window.location.search).get('id') || 'unknown', 'missed');

        setTimeout(() => {
            window.location.href = '../index.html';
        }, 3000);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // WAKE LOCK
    // ══════════════════════════════════════════════════════════════════════════
    let wakeLock = null;

    async function requestWakeLock() {
        if (!('wakeLock' in navigator)) return;

        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock acquired');
        } catch (e) {
            console.log('Wake Lock failed:', e);
        }
    }

    function releaseWakeLock() {
        if (wakeLock) {
            wakeLock.release();
            wakeLock = null;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INIT
    // ══════════════════════════════════════════════════════════════════════════
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
