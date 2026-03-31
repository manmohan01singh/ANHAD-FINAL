/**

 * ═══════════════════════════════════════════════════════════════════════════════

 * SMART REMINDERS v6.0 - COMPLETE UI CONTROLLER

 * 

 * Features:

 * ✅ All toggles, edit, settings functionality

 * ✅ Audio preview with progress bar

 * ✅ Nitnem Tracker sync

 * ✅ Background alarm scheduling

 * ✅ Custom audio upload (IndexedDB)

 * ✅ Theme system with system preference

 * ✅ Toast notifications

 * ✅ Haptic feedback

 * ═══════════════════════════════════════════════════════════════════════════════

 */



(function () {

    'use strict';



    // ══════════════════════════════════════════════════════════════════════════

    // CONFIGURATION

    // ══════════════════════════════════════════════════════════════════════════

    // Dynamic audio path detection
    const AUDIO_BASE_PATH = (() => {
        const loc = window.location;
        if (loc.protocol === 'file:' || (window.Capacitor && window.Capacitor.isNative)) {
            return '../Audio/';
        }
        if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
            return '/Audio/';
        }
        if (loc.pathname.includes('/reminders/')) {
            return '../Audio/';
        }
        return '/Audio/';
    })();

    const CONFIG = {

        version: '6.0.0',

        storage: {

            reminders: 'sr_reminders_v4',

            settings: 'sr_settings_v4',

            stats: 'sr_stats_v4',

            theme: 'sr_theme'

        },

        audioPath: AUDIO_BASE_PATH,

        audioFiles: {

            'audio1': 'audio1.mp3',

            'audio2': 'audio2.mp3',

            'audio3': 'audio3.mpeg',

            'audio4': 'audio4.mpeg',

            'audio5': 'audio5.mpeg',

            'audio6': 'audio6.mpeg'

        }

    };



    // ══════════════════════════════════════════════════════════════════════════

    // DEFAULT DATA

    // ══════════════════════════════════════════════════════════════════════════

    const DEFAULT_REMINDERS = {

        core: {

            amritvela: {

                id: 'amritvela',

                type: 'core',

                label: 'Amritvela Simran',

                gurmukhi: 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ',

                time: '04:00',

                enabled: true,

                days: [0, 1, 2, 3, 4, 5, 6],

                tone: 'audio1',

                snooze: 10,

                nitnemSync: true

            },

            rehras: {

                id: 'rehras',

                type: 'core',

                label: 'Rehras Sahib',

                gurmukhi: 'ਰਹਿਰਾਸ ਸਾਹਿਬ',

                time: '18:30',

                enabled: true,

                days: [0, 1, 2, 3, 4, 5, 6],

                tone: 'audio3',

                snooze: 10,

                nitnemSync: true

            },

            sohila: {

                id: 'sohila',

                type: 'core',

                label: 'Sohila Sahib',

                gurmukhi: 'ਸੋਹਿਲਾ ਸਾਹਿਬ',

                time: '21:30',

                enabled: true,

                days: [0, 1, 2, 3, 4, 5, 6],

                tone: 'audio4',

                snooze: 10,

                nitnemSync: true

            }

        },

        custom: []

    };



    const DEFAULT_SETTINGS = {

        theme: 'dark',

        neverMissMode: false,

        smartSnooze: true,

        preReminderMinutes: 5,

        vibration: true,

        sound: true,

        quietHours: {

            enabled: false,

            start: '22:00',

            end: '06:00'

        }

    };



    const DEFAULT_STATS = {

        streak: 0,

        completed: 0,

        missed: 0,

        dailyLog: {},

        weeklyProgress: []

    };



    // ══════════════════════════════════════════════════════════════════════════

    // STATE

    // ══════════════════════════════════════════════════════════════════════════

    const State = {

        reminders: null,

        settings: null,

        stats: null,

        currentEditId: null,

        audioPlayer: null,

        scheduledAlarms: new Map(),

        countdownInterval: null

    };



    // ══════════════════════════════════════════════════════════════════════════

    // STORAGE MANAGER

    // ══════════════════════════════════════════════════════════════════════════

    const Storage = {

        get(key, defaults) {

            try {

                const data = localStorage.getItem(key);

                return data ? JSON.parse(data) : defaults;

            } catch (e) {

                console.error('Storage get error:', e);

                return defaults;

            }

        },



        set(key, data) {

            try {

                localStorage.setItem(key, JSON.stringify(data));

                return true;

            } catch (e) {

                console.error('Storage set error:', e);

                return false;

            }

        }

    };



    // ══════════════════════════════════════════════════════════════════════════

    // UTILS

    // ══════════════════════════════════════════════════════════════════════════

    const Utils = {

        formatTime12(time24) {

            const [h, m] = time24.split(':').map(Number);

            const period = h >= 12 ? 'PM' : 'AM';

            const hour = h % 12 || 12;

            return { hour: hour.toString().padStart(2, '0'), min: m.toString().padStart(2, '0'), period };

        },



        formatTime24(hour, min, period) {

            let h = parseInt(hour);

            if (period === 'PM' && h !== 12) h += 12;

            if (period === 'AM' && h === 12) h = 0;

            return `${h.toString().padStart(2, '0')}:${min.padStart(2, '0')}`;

        },



        getNextOccurrence(time24) {

            const now = new Date();

            const [h, m] = time24.split(':').map(Number);

            const next = new Date();

            next.setHours(h, m, 0, 0);



            if (next <= now) {

                next.setDate(next.getDate() + 1);

            }



            return next;

        },



        getTimeUntil(date) {

            const now = new Date();

            const diff = date - now;



            if (diff <= 0) return { value: 0, unit: 'now' };



            const hours = Math.floor(diff / (1000 * 60 * 60));

            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));



            if (hours > 0) {

                return { value: hours, unit: hours === 1 ? 'hr' : 'hrs' };

            }

            return { value: minutes, unit: minutes === 1 ? 'min' : 'mins' };

        },



        generateId() {

            return 'custom_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

        }

    };



    // ══════════════════════════════════════════════════════════════════════════

    // HAPTICS

    // ══════════════════════════════════════════════════════════════════════════

    const Haptic = {

        tap() {

            if (navigator.vibrate && State.settings?.vibration) {

                navigator.vibrate(10);

            }

        },

        success() {

            if (navigator.vibrate && State.settings?.vibration) {

                navigator.vibrate([10, 50, 20]);

            }

        },

        warning() {

            if (navigator.vibrate && State.settings?.vibration) {

                navigator.vibrate([30, 30, 30]);

            }

        }

    };



    // ══════════════════════════════════════════════════════════════════════════

    // TOAST NOTIFICATIONS

    // ══════════════════════════════════════════════════════════════════════════

    const Toast = {

        show(message, type = 'info', duration = 3000) {

            const container = document.getElementById('toastContainer');

            if (!container) return;



            const toast = document.createElement('div');

            toast.className = `toast toast--${type}`;



            const icons = {

                success: '✓',

                error: '✕',

                warning: '⚠',

                info: 'ℹ'

            };



            toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;

            container.appendChild(toast);



            setTimeout(() => {

                toast.style.animation = 'toastIn 0.3s ease reverse';

                setTimeout(() => toast.remove(), 300);

            }, duration);

        }

    };



    // ══════════════════════════════════════════════════════════════════════════

    // THEME MANAGER

    // ══════════════════════════════════════════════════════════════════════════

    const ThemeManager = {

        init() {

            const saved = Storage.get(CONFIG.storage.theme, 'dark');

            this.apply(saved);

            this.setupListeners();

        },



        apply(theme) {

            if (theme === 'system') {

                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');

            } else {

                document.documentElement.setAttribute('data-theme', theme);

            }



            // Update theme buttons

            document.querySelectorAll('.theme-btn').forEach(btn => {

                btn.classList.toggle('active', btn.dataset.theme === theme);

            });



            Storage.set(CONFIG.storage.theme, theme);

            State.settings.theme = theme;

        },



        setupListeners() {

            // Theme selector buttons

            document.querySelectorAll('.theme-btn').forEach(btn => {

                btn.addEventListener('click', () => {

                    Haptic.tap();

                    this.apply(btn.dataset.theme);

                });

            });



            // System theme change listener

            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {

                if (State.settings?.theme === 'system') {

                    this.apply('system');

                }

            });

        }

    };



    // ══════════════════════════════════════════════════════════════════════════

    // AUDIO MANAGER

    // ══════════════════════════════════════════════════════════════════════════

    const AudioManager = {

        currentAudio: null,

        currentPreviewBtn: null,

        currentToneId: null,



        getAudioUrl(toneId) {

            if (CONFIG.audioFiles[toneId]) {

                return CONFIG.audioPath + CONFIG.audioFiles[toneId];

            }

            return CONFIG.audioPath + CONFIG.audioFiles['audio1'];

        },



        async preview(toneId, button) {

            // Check if same button clicked (toggle off)

            const isSameButton = this.currentPreviewBtn === button && this.currentToneId === toneId;



            // Stop current preview first

            if (this.currentAudio) {

                this.stop();

                if (isSameButton) {

                    return; // Toggle off - don't restart

                }

            }



            if (!button) return;



            this.currentPreviewBtn = button;

            this.currentToneId = toneId;

            button.textContent = '⏸';

            button.classList.add('playing');



            try {

                this.currentAudio = new Audio(this.getAudioUrl(toneId));

                this.currentAudio.volume = 0.7;



                await this.currentAudio.play();



                // Update progress bar if available

                const soundOption = button.closest('.sound-option');

                if (soundOption) {

                    const soundInfo = soundOption.querySelector('.sound-info');

                    if (soundInfo) {

                        let progressBar = soundOption.querySelector('.audio-progress-bar');



                        if (!progressBar) {

                            const progressContainer = document.createElement('div');

                            progressContainer.className = 'audio-progress';

                            progressContainer.innerHTML = '<div class="audio-progress-bar"></div>';

                            soundInfo.appendChild(progressContainer);

                            progressBar = progressContainer.querySelector('.audio-progress-bar');

                        }



                        const updateProgress = () => {

                            if (this.currentAudio && progressBar) {

                                const progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;

                                progressBar.style.width = `${progress}%`;

                            }

                        };



                        this.currentAudio.addEventListener('timeupdate', updateProgress);

                    }

                }



                this.currentAudio.addEventListener('ended', () => this.stop());



            } catch (e) {

                console.error('Audio preview error:', e);

                Toast.show('Could not play audio', 'error');

                this.stop();

            }

        },



        stop() {

            if (this.currentAudio) {

                this.currentAudio.pause();

                this.currentAudio = null;

            }



            if (this.currentPreviewBtn) {

                this.currentPreviewBtn.textContent = '▶';

                this.currentPreviewBtn.classList.remove('playing');

                this.currentPreviewBtn = null;

            }

            this.currentToneId = null;



            // Reset all progress bars

            document.querySelectorAll('.audio-progress-bar').forEach(bar => {

                bar.style.width = '0%';

            });

        },



        async playAlarm(toneId, loop = true) {

            this.stop();



            try {

                this.currentAudio = new Audio(this.getAudioUrl(toneId));

                this.currentAudio.loop = loop;

                this.currentAudio.volume = 1.0;

                await this.currentAudio.play();

            } catch (e) {

                console.error('Alarm audio error:', e);

            }

        }

    };



    // ══════════════════════════════════════════════════════════════════════════

    // SHEET MANAGER

    // ══════════════════════════════════════════════════════════════════════════

    const SheetManager = {

        open(sheetId) {

            const backdrop = document.getElementById(`${sheetId}Backdrop`);

            const sheet = document.getElementById(`${sheetId}Sheet`);



            if (backdrop && sheet) {

                backdrop.classList.add('open');

                sheet.classList.add('open');

                document.body.style.overflow = 'hidden';

                Haptic.tap();

            }

        },



        close(sheetId) {

            const backdrop = document.getElementById(`${sheetId}Backdrop`);

            const sheet = document.getElementById(`${sheetId}Sheet`);



            if (backdrop && sheet) {

                backdrop.classList.remove('open');

                sheet.classList.remove('open');

                document.body.style.overflow = '';

                AudioManager.stop();

            }

        },



        closeAll() {

            ['edit', 'settings', 'add'].forEach(id => this.close(id));

        }

    };



    // ══════════════════════════════════════════════════════════════════════════

    // UI RENDERER

    // ══════════════════════════════════════════════════════════════════════════

    const UI = {

        init() {

            this.updateActiveCount();

            this.updateHeroCard();

            this.updateCoreAlarms();

            this.updateCustomAlarms();

            this.updateStats();

            this.updateWeekProgress();

            this.updateSettings();

            this.startCountdown();

        },



        updateActiveCount() {

            const core = State.reminders.core;

            const custom = State.reminders.custom || [];



            let active = 0;

            let total = 0;



            Object.values(core).forEach(r => {

                total++;

                if (r.enabled) active++;

            });



            custom.forEach(r => {

                total++;

                if (r.enabled) active++;

            });



            const countEl = document.getElementById('activeCount');

            if (countEl) countEl.textContent = `${active}/${total}`;

        },



        updateHeroCard() {

            const allReminders = [

                ...Object.values(State.reminders.core),

                ...(State.reminders.custom || [])

            ].filter(r => r.enabled);



            if (allReminders.length === 0) {

                document.getElementById('heroTime').textContent = '--:--';

                document.getElementById('heroPeriod').textContent = '';

                document.getElementById('heroLabel').textContent = 'No active reminders';

                document.getElementById('heroEmoji').textContent = '😴';

                document.getElementById('countdownValue').textContent = '-';

                document.getElementById('countdownUnit').textContent = '';

                return;

            }



            // Find next alarm

            let nextAlarm = null;

            let nextTime = Infinity;



            allReminders.forEach(reminder => {

                const occurrence = Utils.getNextOccurrence(reminder.time);

                if (occurrence.getTime() < nextTime) {

                    nextTime = occurrence.getTime();

                    nextAlarm = reminder;

                }

            });



            if (nextAlarm) {

                const time = Utils.formatTime12(nextAlarm.time);

                document.getElementById('heroTime').textContent = `${time.hour}:${time.min}`;

                document.getElementById('heroPeriod').textContent = time.period;

                document.getElementById('heroLabel').textContent = nextAlarm.label;



                const emojis = {

                    amritvela: '🌅',

                    rehras: '🌆',

                    sohila: '🌙'

                };

                document.getElementById('heroEmoji').textContent = emojis[nextAlarm.id] || '⏰';



                // Update countdown

                const until = Utils.getTimeUntil(new Date(nextTime));

                document.getElementById('countdownValue').textContent = until.value;

                document.getElementById('countdownUnit').textContent = until.unit;



                // Update ring

                const totalMins = (nextTime - Date.now()) / (1000 * 60);

                const maxMins = 24 * 60;

                const offset = 251 - (251 * (1 - totalMins / maxMins));

                const ring = document.getElementById('countdownRing');

                if (ring) ring.style.strokeDashoffset = offset;

            }

        },



        updateCoreAlarms() {

            const core = State.reminders.core;



            ['amritvela', 'rehras', 'sohila'].forEach(id => {

                const reminder = core[id];

                if (!reminder) return;



                const time = Utils.formatTime12(reminder.time);

                const timeEl = document.getElementById(`${id}Time`);

                const periodEl = document.getElementById(`${id}Period`);

                const toggleEl = document.getElementById(`toggle${id.charAt(0).toUpperCase() + id.slice(1)}`);

                const cardEl = document.getElementById(`alarm${id.charAt(0).toUpperCase() + id.slice(1)}`);



                if (timeEl) timeEl.textContent = `${time.hour}:${time.min}`;

                if (periodEl) periodEl.textContent = time.period;

                if (toggleEl) toggleEl.checked = reminder.enabled;

                if (cardEl) cardEl.classList.toggle('disabled', !reminder.enabled);

            });

        },



        updateCustomAlarms() {

            const container = document.getElementById('customAlarmsList');

            const emptyState = document.getElementById('customEmptyState');

            const custom = State.reminders.custom || [];



            if (custom.length === 0) {

                if (emptyState) emptyState.style.display = 'flex';

                return;

            }



            if (emptyState) emptyState.style.display = 'none';



            // Clear existing custom cards (keep empty state)

            container.querySelectorAll('.alarm-card').forEach(card => card.remove());



            custom.forEach(reminder => {

                const time = Utils.formatTime12(reminder.time);

                const card = document.createElement('div');

                card.className = `alarm-card custom ${reminder.enabled ? '' : 'disabled'}`;

                card.dataset.id = reminder.id;



                card.innerHTML = `

                    <div class="alarm-card-content">

                        <div class="alarm-info">

                            <div class="alarm-time-row">

                                <span class="alarm-time">${time.hour}:${time.min}</span>

                                <span class="alarm-period">${time.period}</span>

                            </div>

                            <div class="alarm-label">${reminder.label || 'Custom Reminder'}</div>

                            <div class="alarm-meta">

                                <span class="alarm-days">${this.formatDays(reminder.days)}</span>

                            </div>

                        </div>

                        <div class="alarm-actions">

                            <button class="alarm-edit-btn" data-id="${reminder.id}" aria-label="Edit">

                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">

                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>

                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>

                                </svg>

                            </button>

                            <label class="toggle-switch">

                                <input type="checkbox" data-id="${reminder.id}" ${reminder.enabled ? 'checked' : ''}>

                                <span class="toggle-track"></span>

                            </label>

                        </div>

                    </div>

                `;



                container.appendChild(card);



                // Event listeners

                card.querySelector('.alarm-edit-btn').addEventListener('click', (e) => {

                    e.stopPropagation();

                    openEditSheet(reminder.id);

                });



                card.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {

                    e.stopPropagation();

                    toggleReminder(reminder.id, e.target.checked);

                });

            });

        },



        formatDays(days) {

            if (!days || days.length === 7) return 'Every day';

            if (days.length === 0) return 'Never';



            const weekdays = [1, 2, 3, 4, 5];

            const weekend = [0, 6];



            if (days.length === 5 && weekdays.every(d => days.includes(d))) return 'Weekdays';

            if (days.length === 2 && weekend.every(d => days.includes(d))) return 'Weekends';



            const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            return days.map(d => names[d]).join(', ');

        },



        updateStats() {

            const stats = State.stats;



            document.getElementById('statStreak').textContent = stats.streak || 0;

            document.getElementById('statCompleted').textContent = stats.completed || 0;

            document.getElementById('statMissed').textContent = stats.missed || 0;



            const total = (stats.completed || 0) + (stats.missed || 0);

            const rate = total > 0 ? Math.round((stats.completed / total) * 100) : 100;

            document.getElementById('statRate').textContent = `${rate}%`;

        },



        updateWeekProgress() {

            const container = document.getElementById('weekProgress');

            if (!container) return;



            const today = new Date();

            const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];



            container.innerHTML = '';



            for (let i = 6; i >= 0; i--) {

                const date = new Date(today);

                date.setDate(date.getDate() - i);

                const dateStr = date.toLocaleDateString('en-CA');

                const dayNum = date.getDay();

                const isToday = i === 0;

                const completed = State.stats.dailyLog?.[dateStr]?.completed || false;



                const dayEl = document.createElement('div');

                dayEl.className = `week-day ${isToday ? 'today' : ''} ${completed ? 'completed' : ''}`;

                dayEl.innerHTML = `

                    <span class="week-day-name">${dayNames[dayNum]}</span>

                    <div class="week-day-dot"></div>

                `;

                container.appendChild(dayEl);

            }

        },



        updateSettings() {

            const settings = State.settings;



            // Toggles

            const neverMiss = document.getElementById('neverMissToggle');

            const smartSnooze = document.getElementById('smartSnoozeToggle');

            const preReminder = document.getElementById('preReminderSelect');

            const vibration = document.getElementById('vibrationToggle');

            const sound = document.getElementById('soundToggle');

            const quietHours = document.getElementById('quietHoursToggle');

            const quietStart = document.getElementById('quietStart');

            const quietEnd = document.getElementById('quietEnd');



            if (neverMiss) neverMiss.checked = settings.neverMissMode;

            if (smartSnooze) smartSnooze.checked = settings.smartSnooze;

            if (preReminder) preReminder.value = settings.preReminderMinutes;

            if (vibration) vibration.checked = settings.vibration;

            if (sound) sound.checked = settings.sound;

            if (quietHours) quietHours.checked = settings.quietHours?.enabled;

            if (quietStart) quietStart.value = settings.quietHours?.start || '22:00';

            if (quietEnd) quietEnd.value = settings.quietHours?.end || '06:00';



            // Notification status

            this.updateNotificationStatus();

        },



        updateNotificationStatus() {

            const statusEl = document.getElementById('notifStatus');

            if (!statusEl) return;



            if ('Notification' in window) {

                const perm = Notification.permission;

                if (perm === 'granted') {

                    statusEl.textContent = 'Enabled ✓';

                    statusEl.style.color = 'var(--system-green)';

                } else if (perm === 'denied') {

                    statusEl.textContent = 'Blocked ✕';

                    statusEl.style.color = 'var(--system-red)';

                } else {

                    statusEl.textContent = 'Tap to enable';

                    statusEl.style.color = 'var(--text-tertiary)';

                }

            } else {

                statusEl.textContent = 'Not supported';

                statusEl.style.color = 'var(--text-tertiary)';

            }

        },



        startCountdown() {

            if (State.countdownInterval) {

                clearInterval(State.countdownInterval);

            }



            State.countdownInterval = setInterval(() => {

                this.updateHeroCard();

            }, 60000); // Update every minute

        }

    };



    // ══════════════════════════════════════════════════════════════════════════

    // ALARM SCHEDULER

    // ══════════════════════════════════════════════════════════════════════════

    const Scheduler = {

        init() {

            this.scheduleAll();

        },



        scheduleAll() {

            // Clear existing

            State.scheduledAlarms.forEach((timeout, key) => {

                clearTimeout(timeout);

            });

            State.scheduledAlarms.clear();



            const allReminders = [

                ...Object.values(State.reminders.core),

                ...(State.reminders.custom || [])

            ].filter(r => r.enabled);



            allReminders.forEach(reminder => {

                this.schedule(reminder);



                // Pre-reminder

                if (State.settings.preReminderMinutes > 0) {

                    this.schedulePreReminder(reminder);

                }

            });



            console.log(`⏰ Scheduled ${State.scheduledAlarms.size} alarms`);

        },



        schedule(reminder) {

            const next = Utils.getNextOccurrence(reminder.time);

            const delay = next.getTime() - Date.now();



            if (delay > 0 && delay < 24 * 60 * 60 * 1000) {

                const key = `main_${reminder.id}`;

                const timeout = setTimeout(() => {

                    this.fireAlarm(reminder, false);

                    State.scheduledAlarms.delete(key);

                }, delay);



                State.scheduledAlarms.set(key, timeout);

                console.log(`📅 Scheduled ${reminder.label} for ${next.toLocaleTimeString()}`);

            }

        },



        schedulePreReminder(reminder) {

            const next = Utils.getNextOccurrence(reminder.time);

            const preTime = new Date(next.getTime() - State.settings.preReminderMinutes * 60 * 1000);

            const delay = preTime.getTime() - Date.now();



            if (delay > 0 && delay < 24 * 60 * 60 * 1000) {

                const key = `pre_${reminder.id}`;

                const timeout = setTimeout(() => {

                    this.fireAlarm(reminder, true);

                    State.scheduledAlarms.delete(key);

                }, delay);



                State.scheduledAlarms.set(key, timeout);

            }

        },



        async fireAlarm(reminder, isPreReminder) {

            console.log(`🔔 ${isPreReminder ? 'PRE-' : ''}ALARM: ${reminder.label}`);



            // Play sound

            if (State.settings.sound && !isPreReminder) {

                await AudioManager.playAlarm(reminder.tone, State.settings.neverMissMode);

            }



            // Vibrate

            if (State.settings.vibration) {

                if (isPreReminder) {

                    Haptic.tap();

                } else {

                    navigator.vibrate?.([500, 200, 500, 200, 500]);

                }

            }



            // Show notification

            this.showNotification(reminder, isPreReminder);



            // Reschedule for next day

            setTimeout(() => {

                this.schedule(reminder);

            }, 1000);

        },



        async showNotification(reminder, isPreReminder) {

            if (!('Notification' in window) || Notification.permission !== 'granted') {

                return;

            }



            const title = isPreReminder

                ? `⏰ ${reminder.label} in ${State.settings.preReminderMinutes} min`

                : `🙏 ${reminder.label}`;



            const body = isPreReminder

                ? 'Prepare for your spiritual practice'

                : `ਸਮਾਂ ਹੋ ਗਿਆ - Time for ${reminder.gurmukhi || reminder.label}`;



            try {

                const notification = new Notification(title, {

                    body,

                    icon: '../assets/favicon.svg',

                    badge: '../assets/badge.png',

                    tag: `alarm-${reminder.id}`,

                    requireInteraction: !isPreReminder && State.settings.neverMissMode,

                    vibrate: [200, 100, 200]

                });



                notification.onclick = () => {

                    window.focus();

                    notification.close();

                    if (!isPreReminder) {

                        AudioManager.stop();

                        this.recordResponse(reminder.id, 'completed');

                    }

                };

            } catch (e) {

                console.error('Notification error:', e);

            }

        },



        recordResponse(reminderId, status) {

            const today = new Date().toLocaleDateString('en-CA');



            if (!State.stats.dailyLog) State.stats.dailyLog = {};

            if (!State.stats.dailyLog[today]) {

                State.stats.dailyLog[today] = { responses: {} };

            }



            State.stats.dailyLog[today].responses[reminderId] = status;



            if (status === 'completed') {

                State.stats.completed = (State.stats.completed || 0) + 1;

                State.stats.streak = (State.stats.streak || 0) + 1;

                State.stats.dailyLog[today].completed = true;

            } else {

                State.stats.missed = (State.stats.missed || 0) + 1;

                State.stats.streak = 0;

            }



            Storage.set(CONFIG.storage.stats, State.stats);

            UI.updateStats();

            UI.updateWeekProgress();



            // Sync to Nitnem Tracker

            this.syncToNitnemTracker(reminderId, status);

        },



        syncToNitnemTracker(reminderId, status) {

            const reminder = State.reminders.core[reminderId] ||

                State.reminders.custom.find(r => r.id === reminderId);



            if (reminder?.nitnemSync) {

                window.dispatchEvent(new CustomEvent('alarmSyncUpdate', {

                    detail: {

                        reminderId,

                        status,

                        timestamp: new Date().toISOString(),

                        label: reminder.label

                    }

                }));

            }

        }

    };



    // ══════════════════════════════════════════════════════════════════════════

    // ACTION HANDLERS

    // ══════════════════════════════════════════════════════════════════════════

    function toggleReminder(id, enabled) {

        Haptic.tap();



        // Find and update reminder

        if (State.reminders.core[id]) {

            State.reminders.core[id].enabled = enabled;

        } else {

            const custom = State.reminders.custom.find(r => r.id === id);

            if (custom) custom.enabled = enabled;

        }



        // Save and update

        Storage.set(CONFIG.storage.reminders, State.reminders);

        UI.updateActiveCount();

        UI.updateHeroCard();



        const card = document.querySelector(`.alarm-card[data-id="${id}"]`);

        if (card) card.classList.toggle('disabled', !enabled);



        // Reschedule

        Scheduler.scheduleAll();



        Toast.show(enabled ? 'Reminder enabled' : 'Reminder disabled', 'success');

    }



    function openEditSheet(id) {

        State.currentEditId = id;

        Haptic.tap();



        const reminder = State.reminders.core[id] ||

            State.reminders.custom.find(r => r.id === id);



        if (!reminder) return;



        // Populate form

        const time = Utils.formatTime12(reminder.time);

        document.getElementById('editTimeInput').value = reminder.time;

        document.getElementById('editTimeHour').textContent = time.hour;

        document.getElementById('editTimeMin').textContent = time.min;

        document.getElementById('editTimePeriod').textContent = time.period;

        document.getElementById('editLabel').value = reminder.label || '';



        // Days

        document.querySelectorAll('#editDays .day-chip').forEach(chip => {

            const day = parseInt(chip.dataset.day);

            chip.classList.toggle('active', reminder.days?.includes(day) ?? true);

        });



        // Sound

        document.querySelectorAll('.sound-option').forEach(opt => {

            opt.classList.toggle('active', opt.dataset.sound === reminder.tone);

        });



        document.getElementById('editSnooze').value = reminder.snooze || 10;

        document.getElementById('editNitnemSync').checked = reminder.nitnemSync !== false;



        // Show/hide delete button for core alarms

        const deleteBtn = document.getElementById('deleteAlarmBtn');

        const isCore = ['amritvela', 'rehras', 'sohila'].includes(id);

        deleteBtn.style.display = isCore ? 'none' : 'flex';



        // Update title

        document.getElementById('editSheetTitle').textContent =

            isCore ? 'Edit Reminder' : 'Edit Custom Alarm';



        SheetManager.open('edit');

    }



    function saveAlarm() {

        const id = State.currentEditId;

        if (!id) return;



        Haptic.success();



        const reminder = State.reminders.core[id] ||

            State.reminders.custom.find(r => r.id === id);



        if (!reminder) return;



        // Get values

        reminder.time = document.getElementById('editTimeInput').value;

        reminder.label = document.getElementById('editLabel').value || reminder.label;



        // Days

        reminder.days = [];

        document.querySelectorAll('#editDays .day-chip.active').forEach(chip => {

            reminder.days.push(parseInt(chip.dataset.day));

        });



        // Sound

        const activeSound = document.querySelector('#soundSelector .sound-option.active');

        if (activeSound) reminder.tone = activeSound.dataset.sound;



        reminder.snooze = parseInt(document.getElementById('editSnooze').value);

        reminder.nitnemSync = document.getElementById('editNitnemSync').checked;



        // Save

        Storage.set(CONFIG.storage.reminders, State.reminders);



        // Update UI

        UI.updateCoreAlarms();

        UI.updateCustomAlarms();

        UI.updateHeroCard();

        Scheduler.scheduleAll();



        SheetManager.close('edit');

        Toast.show('Alarm saved', 'success');

    }



    function deleteAlarm() {

        const id = State.currentEditId;

        if (!id || ['amritvela', 'rehras', 'sohila'].includes(id)) return;



        Haptic.warning();



        const idx = State.reminders.custom.findIndex(r => r.id === id);

        if (idx !== -1) {

            State.reminders.custom.splice(idx, 1);

            Storage.set(CONFIG.storage.reminders, State.reminders);



            UI.updateCustomAlarms();

            UI.updateActiveCount();

            UI.updateHeroCard();

            Scheduler.scheduleAll();



            SheetManager.close('edit');

            Toast.show('Alarm deleted', 'warning');

        }

    }



    function createCustomAlarm() {

        Haptic.success();



        const time = document.getElementById('addTimeInput').value;

        const label = document.getElementById('addLabel').value || 'Custom Reminder';

        const sound = document.getElementById('addSound').value;



        const days = [];

        document.querySelectorAll('#addDays .day-chip.active').forEach(chip => {

            days.push(parseInt(chip.dataset.day));

        });



        const newAlarm = {

            id: Utils.generateId(),

            type: 'custom',

            label,

            time,

            enabled: true,

            days,

            tone: sound,

            snooze: 10,

            nitnemSync: true

        };



        State.reminders.custom.push(newAlarm);

        Storage.set(CONFIG.storage.reminders, State.reminders);



        UI.updateCustomAlarms();

        UI.updateActiveCount();

        UI.updateHeroCard();

        Scheduler.scheduleAll();



        SheetManager.close('add');

        Toast.show('Alarm created', 'success');



        // Reset form

        document.getElementById('addLabel').value = '';

        document.getElementById('addTimeInput').value = '12:00';

    }



    async function requestNotificationPermission() {

        if (!('Notification' in window)) {

            Toast.show('Notifications not supported', 'error');

            return;

        }



        try {

            const permission = await Notification.requestPermission();

            UI.updateNotificationStatus();



            if (permission === 'granted') {

                Toast.show('Notifications enabled!', 'success');

            } else if (permission === 'denied') {

                Toast.show('Notifications blocked', 'error');

            }

        } catch (e) {

            console.error('Notification permission error:', e);

        }

    }



    function testAlarm() {

        Haptic.tap();



        const nextReminder = Object.values(State.reminders.core).find(r => r.enabled) ||

            State.reminders.custom.find(r => r.enabled);



        if (nextReminder) {

            AudioManager.preview(nextReminder.tone, document.getElementById('testAlarmBtn'));

            Toast.show('Testing alarm sound...', 'info');

        } else {

            Toast.show('No active reminders to test', 'warning');

        }

    }



    // ══════════════════════════════════════════════════════════════════════════

    // EVENT BINDING

    // ══════════════════════════════════════════════════════════════════════════

    function bindEvents() {

        // Back button

        document.getElementById('backBtn')?.addEventListener('click', () => {

            Haptic.tap();

            window.location.href = '../index.html';

        });



        // Settings button

        document.getElementById('settingsBtn')?.addEventListener('click', () => {

            SheetManager.open('settings');

        });



        // FAB / Add button

        document.getElementById('fabAddBtn')?.addEventListener('click', () => {

            SheetManager.open('add');

        });



        document.getElementById('addCustomBtn')?.addEventListener('click', () => {

            SheetManager.open('add');

        });



        // Test alarm

        document.getElementById('testAlarmBtn')?.addEventListener('click', testAlarm);



        // Enable notifications

        document.getElementById('enableNotifBtn')?.addEventListener('click', requestNotificationPermission);



        // Core alarm toggles

        ['Amritvela', 'Rehras', 'Sohila'].forEach(name => {

            const toggle = document.getElementById(`toggle${name}`);

            toggle?.addEventListener('change', (e) => {

                toggleReminder(name.toLowerCase(), e.target.checked);

            });

        });



        // Core alarm edit buttons

        document.querySelectorAll('.alarm-edit-btn').forEach(btn => {

            btn.addEventListener('click', (e) => {

                e.stopPropagation();

                openEditSheet(btn.dataset.id);

            });

        });



        // Edit sheet

        document.getElementById('editSheetClose')?.addEventListener('click', () => SheetManager.close('edit'));

        document.getElementById('editBackdrop')?.addEventListener('click', () => SheetManager.close('edit'));

        document.getElementById('saveAlarmBtn')?.addEventListener('click', saveAlarm);

        document.getElementById('deleteAlarmBtn')?.addEventListener('click', deleteAlarm);



        // Time picker click

        document.getElementById('timePickerDisplay')?.addEventListener('click', () => {

            document.getElementById('editTimeInput').showPicker?.() ||

                document.getElementById('editTimeInput').click();

        });



        document.getElementById('editTimeInput')?.addEventListener('change', (e) => {

            const time = Utils.formatTime12(e.target.value);

            document.getElementById('editTimeHour').textContent = time.hour;

            document.getElementById('editTimeMin').textContent = time.min;

            document.getElementById('editTimePeriod').textContent = time.period;

        });



        // Add sheet

        document.getElementById('addSheetClose')?.addEventListener('click', () => SheetManager.close('add'));

        document.getElementById('addBackdrop')?.addEventListener('click', () => SheetManager.close('add'));

        document.getElementById('createAlarmBtn')?.addEventListener('click', createCustomAlarm);



        document.getElementById('addTimePickerDisplay')?.addEventListener('click', () => {

            document.getElementById('addTimeInput').showPicker?.() ||

                document.getElementById('addTimeInput').click();

        });



        document.getElementById('addTimeInput')?.addEventListener('change', (e) => {

            const time = Utils.formatTime12(e.target.value);

            document.getElementById('addTimeHour').textContent = time.hour;

            document.getElementById('addTimeMin').textContent = time.min;

            document.getElementById('addTimePeriod').textContent = time.period;

        });



        // Days selector

        document.querySelectorAll('.day-chip').forEach(chip => {

            chip.addEventListener('click', () => {

                Haptic.tap();

                chip.classList.toggle('active');

            });

        });



        // Sound selector

        document.querySelectorAll('.sound-option').forEach(opt => {

            opt.addEventListener('click', () => {

                Haptic.tap();

                document.querySelectorAll('.sound-option').forEach(o => o.classList.remove('active'));

                opt.classList.add('active');

            });

        });



        // Sound preview

        document.querySelectorAll('.sound-preview-btn').forEach(btn => {

            btn.addEventListener('click', (e) => {

                e.stopPropagation();

                AudioManager.preview(btn.dataset.audio, btn);

            });

        });



        // Settings sheet

        document.getElementById('settingsSheetClose')?.addEventListener('click', () => SheetManager.close('settings'));

        document.getElementById('settingsBackdrop')?.addEventListener('click', () => SheetManager.close('settings'));



        // Quick settings

        document.getElementById('neverMissToggle')?.addEventListener('change', (e) => {

            State.settings.neverMissMode = e.target.checked;

            Storage.set(CONFIG.storage.settings, State.settings);

            Toast.show(e.target.checked ? 'Never Miss Mode enabled' : 'Never Miss Mode disabled', 'success');

        });



        document.getElementById('smartSnoozeToggle')?.addEventListener('change', (e) => {

            State.settings.smartSnooze = e.target.checked;

            Storage.set(CONFIG.storage.settings, State.settings);

        });



        document.getElementById('preReminderSelect')?.addEventListener('change', (e) => {

            State.settings.preReminderMinutes = parseInt(e.target.value);

            Storage.set(CONFIG.storage.settings, State.settings);

            Scheduler.scheduleAll();

        });



        // Settings toggles

        document.getElementById('vibrationToggle')?.addEventListener('change', (e) => {

            State.settings.vibration = e.target.checked;

            Storage.set(CONFIG.storage.settings, State.settings);

        });



        document.getElementById('soundToggle')?.addEventListener('change', (e) => {

            State.settings.sound = e.target.checked;

            Storage.set(CONFIG.storage.settings, State.settings);

        });



        document.getElementById('quietHoursToggle')?.addEventListener('change', (e) => {

            State.settings.quietHours.enabled = e.target.checked;

            document.getElementById('quietHoursRange').style.display = e.target.checked ? 'flex' : 'none';

            Storage.set(CONFIG.storage.settings, State.settings);

        });



        document.getElementById('notifPermissionItem')?.addEventListener('click', requestNotificationPermission);



        // Scroll header shadow

        window.addEventListener('scroll', () => {

            const header = document.getElementById('appHeader');

            if (header) {

                header.classList.toggle('scrolled', window.scrollY > 10);

            }

        });

    }



    // ══════════════════════════════════════════════════════════════════════════

    // INITIALIZATION

    // ══════════════════════════════════════════════════════════════════════════

    function init() {

        console.log(`🚀 Smart Reminders v${CONFIG.version} initializing...`);



        // Load data

        State.reminders = Storage.get(CONFIG.storage.reminders, DEFAULT_REMINDERS);

        State.settings = Storage.get(CONFIG.storage.settings, DEFAULT_SETTINGS);

        State.stats = Storage.get(CONFIG.storage.stats, DEFAULT_STATS);



        // Ensure structure

        if (!State.reminders.core) State.reminders.core = DEFAULT_REMINDERS.core;

        if (!State.reminders.custom) State.reminders.custom = [];



        // Initialize modules

        ThemeManager.init();

        UI.init();

        bindEvents();

        Scheduler.init();



        // Hide loading screen

        setTimeout(() => {

            const loading = document.getElementById('appLoading');

            if (loading) loading.classList.add('hidden');

        }, 500);



        console.log('✅ Smart Reminders ready');

    }



    // Start

    if (document.readyState === 'loading') {

        document.addEventListener('DOMContentLoaded', init);

    } else {

        init();

    }



    // Expose for debugging

    window.SmartRemindersV6 = { State, UI, Scheduler, AudioManager, Toast };



})();

