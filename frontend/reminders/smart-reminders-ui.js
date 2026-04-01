/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMART REMINDERS UI CONTROLLER v5.0
 * 
 * This bridges the new iOS 28+ HTML with the existing alarm logic
 * Works with smart-reminders.js state and bg-alarm.js background system
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ══════════════════════════════════════════════════════════════════════════

    const CONFIG = {
        STORAGE_KEY: 'sr_reminders_v4',
        SETTINGS_KEY: 'sr_settings_v4',
        STATS_KEY: 'sr_stats_v4',
        AUDIO_BASE: '../Audio/',

        DEFAULT_REMINDERS: [
            { id: 'amritvela', title: 'Amritvela', titlePunjabi: 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ', time: '04:00', enabled: true, type: 'core', tone: 'waheguru-bell', days: [0, 1, 2, 3, 4, 5, 6], icon: 'sunrise' },
            { id: 'rehras', title: 'Rehras Sahib', titlePunjabi: 'ਰਹਿਰਾਸ ਸਾਹਿਬ', time: '18:30', enabled: true, type: 'core', tone: 'kirtan-gentle', days: [0, 1, 2, 3, 4, 5, 6], icon: 'sunset' },
            { id: 'sohila', title: 'Sohila Sahib', titlePunjabi: 'ਸੋਹਿਲਾ ਸਾਹਿਬ', time: '21:30', enabled: true, type: 'core', tone: 'peaceful-night', days: [0, 1, 2, 3, 4, 5, 6], icon: 'moon' }
        ],

        DEFAULT_SETTINGS: {
            snoozeEnabled: true,
            snoozeMinutes: 10,
            neverMissMode: false,
            preReminderMinutes: 5,
            quietHoursEnabled: false,
            quietStart: '22:00',
            quietEnd: '06:00'
        },

        TONES: [
            { id: 'waheguru-bell', name: 'Waheguru Bell', path: 'audio1.mp3' },
            { id: 'mool-mantar', name: 'Mool Mantar', path: 'audio2.mp3' },
            { id: 'kirtan-gentle', name: 'Kirtan', path: 'audio3.mpeg' },
            { id: 'peaceful-night', name: 'Peaceful', path: 'audio4.mpeg' }
        ]
    };

    // ══════════════════════════════════════════════════════════════════════════
    // STATE
    // ══════════════════════════════════════════════════════════════════════════

    const State = {
        reminders: [],
        settings: {},
        stats: { currentStreak: 0, totalCompleted: 0, totalMissed: 0 },
        scheduledTimeouts: new Map(),
        currentEditId: null,
        audioElement: null
    };

    // ══════════════════════════════════════════════════════════════════════════
    // DOM HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ══════════════════════════════════════════════════════════════════════════
    // STORAGE
    // ══════════════════════════════════════════════════════════════════════════

    const Storage = {
        get(key, fallback = null) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : fallback;
            } catch (e) {
                console.error('Storage get error:', e);
                return fallback;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage set error:', e);
                return false;
            }
        },

        loadReminders() {
            const stored = this.get(CONFIG.STORAGE_KEY);
            if (Array.isArray(stored) && stored.length > 0) {
                return stored;
            }
            // Initialize with defaults
            const defaults = JSON.parse(JSON.stringify(CONFIG.DEFAULT_REMINDERS));
            this.set(CONFIG.STORAGE_KEY, defaults);
            return defaults;
        },

        saveReminders() {
            return this.set(CONFIG.STORAGE_KEY, State.reminders);
        },

        loadSettings() {
            return { ...CONFIG.DEFAULT_SETTINGS, ...this.get(CONFIG.SETTINGS_KEY, {}) };
        },

        saveSettings() {
            return this.set(CONFIG.SETTINGS_KEY, State.settings);
        },

        loadStats() {
            return this.get(CONFIG.STATS_KEY, { currentStreak: 0, totalCompleted: 0, totalMissed: 0 });
        },

        saveStats() {
            return this.set(CONFIG.STATS_KEY, State.stats);
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ══════════════════════════════════════════════════════════════════════════

    const Utils = {
        formatTime12(time24) {
            if (!time24) return '--:--';
            const [h, m] = time24.split(':').map(Number);
            const period = h >= 12 ? 'PM' : 'AM';
            const hours = h % 12 || 12;
            return `${hours}:${m.toString().padStart(2, '0')} ${period}`;
        },

        formatDays(days) {
            if (!days || days.length === 0) return 'Never';
            if (days.length === 7) return 'Every day';
            if (JSON.stringify(days.sort()) === JSON.stringify([1, 2, 3, 4, 5])) return 'Weekdays';
            if (JSON.stringify(days.sort()) === JSON.stringify([0, 6])) return 'Weekends';
            const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return days.map(d => names[d]).join(', ');
        },

        getNextAlarmTime(reminder) {
            if (!reminder.enabled) return null;
            const now = new Date();
            const [h, m] = reminder.time.split(':').map(Number);
            const next = new Date(now);
            next.setHours(h, m, 0, 0);
            if (next <= now) next.setDate(next.getDate() + 1);
            return next;
        },

        getTimeUntil(date) {
            if (!date) return { hours: '--', minutes: '--', total: 0 };
            const now = new Date();
            const diff = date - now;
            if (diff <= 0) return { hours: '0', minutes: '0', total: 0 };
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return { hours, minutes: mins, total: diff };
        },

        haptic(type = 'light') {
            if (navigator.vibrate) {
                const patterns = { light: [10], medium: [20], success: [10, 30, 20] };
                navigator.vibrate(patterns[type] || [10]);
            }
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // TOAST NOTIFICATIONS
    // ══════════════════════════════════════════════════════════════════════════

    const Toast = {
        show(message, type = 'info') {
            const container = $('#toastContainer');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast toast--${type}`;
            toast.textContent = message;
            container.appendChild(toast);

            setTimeout(() => toast.remove(), 3000);
        },
        success(msg) { this.show(msg, 'success'); },
        error(msg) { this.show(msg, 'error'); },
        warning(msg) { this.show(msg, 'warning'); }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // UI RENDERING
    // ══════════════════════════════════════════════════════════════════════════

    const UI = {
        init() {
            this.updateActiveCount();
            this.updateHeroCard();
            this.updateReminderCards();
            this.updateCustomList();
            this.updateStats();
            this.updateWeekProgress();
            this.updateSettings();
            this.startCountdownTimer();
        },

        updateActiveCount() {
            const count = State.reminders.filter(r => r.enabled).length;
            const el = $('#activeCount');
            if (el) el.textContent = count;

            const pill = $('#statusPill');
            if (pill) {
                pill.querySelector('.status-count').textContent = `${count}/${State.reminders.length}`;
            }
        },

        updateHeroCard() {
            // Find next upcoming reminder
            let nextReminder = null;
            let nextTime = null;

            State.reminders.filter(r => r.enabled).forEach(r => {
                const time = Utils.getNextAlarmTime(r);
                if (time && (!nextTime || time < nextTime)) {
                    nextTime = time;
                    nextReminder = r;
                }
            });

            if (nextReminder) {
                const [h, m] = nextReminder.time.split(':').map(Number);
                const period = h >= 12 ? 'PM' : 'AM';
                const hours = h % 12 || 12;

                const heroTime = $('#heroTime');
                if (heroTime) {
                    heroTime.querySelector('.time-hours').textContent = hours;
                    heroTime.querySelector('.time-minutes').textContent = m.toString().padStart(2, '0');
                    heroTime.querySelector('.time-period').textContent = period;
                }

                const heroName = $('#heroName');
                if (heroName) {
                    const icons = { amritvela: '🌅', rehras: '🌇', sohila: '🌙' };
                    heroName.querySelector('.hero-emoji').textContent = icons[nextReminder.id] || '🔔';
                    heroName.querySelector('.hero-title').textContent = nextReminder.title;
                }

                // Update countdown
                this.updateCountdown(nextTime);
            }
        },

        updateCountdown(targetTime) {
            const countdown = Utils.getTimeUntil(targetTime);

            $('#countdownValue').textContent = countdown.hours;
            $('#countdownUnit').textContent = countdown.hours === 1 ? 'hour' : 'hours';

            // Update ring progress (24 hours = full circle)
            const fill = $('#countdownFill');
            if (fill) {
                const totalHours = countdown.hours + (countdown.minutes / 60);
                const progress = Math.max(0, 1 - (totalHours / 24));
                const circumference = 2 * Math.PI * 42;
                fill.style.strokeDashoffset = circumference * (1 - progress);
            }
        },

        startCountdownTimer() {
            setInterval(() => {
                const nextReminder = State.reminders.find(r => r.enabled);
                if (nextReminder) {
                    const nextTime = Utils.getNextAlarmTime(nextReminder);
                    this.updateCountdown(nextTime);
                }
            }, 60000);
        },

        updateReminderCards() {
            State.reminders.forEach(reminder => {
                const card = $(`.reminder-card[data-id="${reminder.id}"]`);
                if (!card) return;

                // Update toggle
                const toggle = card.querySelector('input[type="checkbox"]');
                if (toggle) toggle.checked = reminder.enabled;

                // Update time display
                const timeEl = card.querySelector('.reminder-time');
                if (timeEl) timeEl.textContent = Utils.formatTime12(reminder.time);

                // Update days
                const daysEl = card.querySelector('.reminder-days');
                if (daysEl) daysEl.textContent = Utils.formatDays(reminder.days);

                // Update title if Punjabi version exists
                if (reminder.titlePunjabi) {
                    const titleEl = card.querySelector('.reminder-title');
                    if (titleEl) titleEl.textContent = reminder.titlePunjabi;
                }
            });
        },

        updateCustomList() {
            const list = $('#customRemindersList');
            const empty = $('#customEmpty');

            const customs = State.reminders.filter(r => r.type === 'custom');

            if (customs.length === 0) {
                if (list) list.innerHTML = '';
                if (empty) empty.style.display = 'flex';
                return;
            }

            if (empty) empty.style.display = 'none';
            if (!list) return;

            list.innerHTML = customs.map(r => `
                <article class="reminder-card reminder-card--custom" data-id="${r.id}">
                    <div class="reminder-card-content">
                        <div class="reminder-header">
                            <div class="reminder-icon custom">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="16"/>
                                    <line x1="8" y1="12" x2="16" y2="12"/>
                                </svg>
                            </div>
                            <label class="reminder-toggle">
                                <input type="checkbox" ${r.enabled ? 'checked' : ''} onchange="SmartRemindersUI.toggleReminder('${r.id}', this.checked)">
                                <span class="toggle-track"><span class="toggle-thumb"></span></span>
                            </label>
                        </div>
                        <div class="reminder-body">
                            <h3 class="reminder-title">${r.title}</h3>
                            <time class="reminder-time">${Utils.formatTime12(r.time)}</time>
                        </div>
                        <div class="reminder-footer">
                            <span class="reminder-days">${Utils.formatDays(r.days)}</span>
                            <button class="reminder-edit-btn" onclick="SmartRemindersUI.openEdit('${r.id}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </article>
            `).join('');
        },

        updateStats() {
            $('#streakNumber').textContent = State.stats.currentStreak || 0;
            $('#completedCount').textContent = State.stats.totalCompleted || 0;
            $('#missedCount').textContent = State.stats.totalMissed || 0;

            const total = (State.stats.totalCompleted || 0) + (State.stats.totalMissed || 0);
            const rate = total > 0 ? Math.round((State.stats.totalCompleted / total) * 100) : 100;
            $('#successRate').textContent = `${rate}%`;
        },

        updateWeekProgress() {
            const container = $('#weekDays');
            if (!container) return;

            const today = new Date();
            const dayOfWeek = today.getDay();
            const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

            container.innerHTML = days.map((name, i) => {
                const isToday = i === dayOfWeek;
                const isPast = i < dayOfWeek;
                const completed = isPast; // Simplified - would check actual data

                return `
                    <div class="week-day ${isToday ? 'today' : ''} ${completed ? 'completed' : ''}">
                        <span class="week-day-name">${name}</span>
                        <div class="week-day-dot"></div>
                    </div>
                `;
            }).join('');
        },

        updateSettings() {
            const neverMiss = $('#neverMissToggle');
            if (neverMiss) neverMiss.checked = State.settings.neverMissMode || false;

            const snooze = $('#snoozeToggle');
            if (snooze) snooze.checked = State.settings.snoozeEnabled ?? true;

            const preReminder = $('#preReminderSelect');
            if (preReminder) preReminder.value = State.settings.preReminderMinutes || 5;
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // SHEET MANAGEMENT
    // ══════════════════════════════════════════════════════════════════════════

    const Sheet = {
        open(sheetId, backdropId) {
            const sheet = $(`#${sheetId}`);
            const backdrop = $(`#${backdropId}`);

            if (sheet) sheet.classList.add('open');
            if (backdrop) backdrop.classList.add('open');
            document.body.classList.add('sheet-open');
        },

        close(sheetId, backdropId) {
            const sheet = $(`#${sheetId}`);
            const backdrop = $(`#${backdropId}`);

            if (sheet) sheet.classList.remove('open');
            if (backdrop) backdrop.classList.remove('open');
            document.body.classList.remove('sheet-open');
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // ALARM SCHEDULING
    // ══════════════════════════════════════════════════════════════════════════

    const Scheduler = {
        rescheduleAll() {
            // Clear existing
            State.scheduledTimeouts.forEach(id => clearTimeout(id));
            State.scheduledTimeouts.clear();

            // Schedule enabled reminders
            State.reminders.filter(r => r.enabled).forEach(reminder => {
                this.schedule(reminder);
            });

            console.log(`[Scheduler] Scheduled ${State.scheduledTimeouts.size} alarms`);
        },

        schedule(reminder) {
            const nextTime = Utils.getNextAlarmTime(reminder);
            if (!nextTime) return;

            const delay = nextTime - new Date();
            if (delay <= 0) return;

            // Don't schedule if more than 24 hours away (will reschedule later)
            if (delay > 24 * 60 * 60 * 1000) return;

            const timeoutId = setTimeout(() => {
                this.fire(reminder);
            }, delay);

            State.scheduledTimeouts.set(reminder.id, timeoutId);
            console.log(`[Scheduler] ${reminder.title} scheduled for ${nextTime.toLocaleTimeString()}`);
        },

        fire(reminder) {
            console.log(`[Scheduler] 🔔 FIRING: ${reminder.title}`);

            // Play sound
            this.playSound(reminder.tone);

            // Show notification
            this.showNotification(reminder);

            // Vibrate
            if (navigator.vibrate) {
                navigator.vibrate([500, 200, 500, 200, 1000]);
            }

            // Update stats
            State.stats.totalCompleted = (State.stats.totalCompleted || 0) + 1;
            Storage.saveStats();
            UI.updateStats();

            // Reschedule for next occurrence
            this.schedule(reminder);
        },

        playSound(toneId) {
            try {
                const tone = CONFIG.TONES.find(t => t.id === toneId) || CONFIG.TONES[0];

                if (State.audioElement) {
                    State.audioElement.pause();
                }

                State.audioElement = new Audio(CONFIG.AUDIO_BASE + tone.path);
                State.audioElement.volume = 1;
                State.audioElement.play().catch(e => console.warn('Audio play error:', e));
            } catch (e) {
                console.error('Sound error:', e);
            }
        },

        async showNotification(reminder) {
            if (!('Notification' in window)) return;

            if (Notification.permission !== 'granted') {
                const result = await Notification.requestPermission();
                if (result !== 'granted') return;
            }

            const notif = new Notification(reminder.title, {
                body: `Time for ${reminder.title}`,
                icon: '/assets/icon-192.png',
                tag: reminder.id,
                requireInteraction: State.settings.neverMissMode
            });

            notif.onclick = () => {
                window.focus();
                notif.close();
            };
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ══════════════════════════════════════════════════════════════════════════

    const SmartRemindersUI = {
        // Toggle reminder on/off
        toggleReminder(id, enabled) {
            const reminder = State.reminders.find(r => r.id === id);
            if (!reminder) return;

            reminder.enabled = enabled;
            Storage.saveReminders();
            Scheduler.rescheduleAll();
            UI.updateActiveCount();
            UI.updateHeroCard();

            Utils.haptic('light');
            Toast.success(enabled ? 'Reminder enabled' : 'Reminder disabled');
        },

        // Toggle all reminders
        toggleAll() {
            const allEnabled = State.reminders.every(r => r.enabled);
            State.reminders.forEach(r => r.enabled = !allEnabled);

            Storage.saveReminders();
            Scheduler.rescheduleAll();
            UI.init();

            Utils.haptic('medium');
            Toast.success(allEnabled ? 'All reminders disabled' : 'All reminders enabled');
        },

        // Open edit sheet
        openEdit(id) {
            State.currentEditId = id;
            const reminder = State.reminders.find(r => r.id === id);
            if (!reminder) return;

            // Populate form
            $('#editReminderId').value = id;
            $('#editTime').value = reminder.time;
            $('#editEnabled').checked = reminder.enabled;
            $('#editTitle').textContent = `Edit ${reminder.title}`;

            // Update time display
            this.updateTimeDisplay('editTime');

            // Update days
            $$('#daysSelector .day-chip').forEach(chip => {
                const day = parseInt(chip.dataset.day);
                chip.classList.toggle('active', (reminder.days || []).includes(day));
            });
            this.updateDaysSummary();

            Sheet.open('editSheet', 'editBackdrop');
        },

        // Save edit
        saveEdit() {
            const id = $('#editReminderId').value;
            const reminder = State.reminders.find(r => r.id === id);
            if (!reminder) return;

            reminder.time = $('#editTime').value;
            reminder.enabled = $('#editEnabled').checked;

            // Get selected days
            reminder.days = [];
            $$('#daysSelector .day-chip.active').forEach(chip => {
                reminder.days.push(parseInt(chip.dataset.day));
            });

            Storage.saveReminders();
            Scheduler.rescheduleAll();
            UI.init();

            Sheet.close('editSheet', 'editBackdrop');
            Utils.haptic('success');
            Toast.success('Reminder updated');
        },

        // Cancel edit
        cancelEdit() {
            State.currentEditId = null;
            Sheet.close('editSheet', 'editBackdrop');
        },

        // Open settings
        openSettings() {
            this.checkNotificationStatus();
            Sheet.open('settingsSheet', 'settingsBackdrop');
        },

        // Close settings
        closeSettings() {
            Sheet.close('settingsSheet', 'settingsBackdrop');
        },

        // Open add custom
        openAddCustom() {
            $('#customName').value = '';
            $('#customTime').value = '05:00';
            this.updateTimeDisplay('customTime');

            $$('#customDaysSelector .day-chip').forEach(chip => {
                chip.classList.add('active');
            });

            Sheet.open('addSheet', 'addBackdrop');
        },

        // Save custom reminder
        saveCustom() {
            const name = $('#customName').value.trim();
            const time = $('#customTime').value;

            if (!name) {
                Toast.error('Please enter a name');
                return;
            }

            // Get selected days
            const days = [];
            $$('#customDaysSelector .day-chip.active').forEach(chip => {
                days.push(parseInt(chip.dataset.day));
            });

            if (days.length === 0) {
                Toast.error('Please select at least one day');
                return;
            }

            const newReminder = {
                id: 'custom_' + Date.now(),
                title: name,
                time: time,
                enabled: true,
                type: 'custom',
                tone: 'waheguru-bell',
                days: days
            };

            State.reminders.push(newReminder);
            Storage.saveReminders();
            Scheduler.rescheduleAll();
            UI.init();

            Sheet.close('addSheet', 'addBackdrop');
            Utils.haptic('success');
            Toast.success('Reminder added');
        },

        // Cancel add
        cancelAdd() {
            Sheet.close('addSheet', 'addBackdrop');
        },

        // Test reminder
        testReminder() {
            Utils.haptic('medium');
            Scheduler.playSound('waheguru-bell');
            Toast.success('Playing test sound...');

            setTimeout(() => {
                if (State.audioElement) State.audioElement.pause();
            }, 5000);
        },

        // Request notification permission
        async requestNotifications() {
            if (!('Notification' in window)) {
                Toast.error('Notifications not supported');
                return;
            }

            const result = await Notification.requestPermission();
            this.checkNotificationStatus();

            if (result === 'granted') {
                Toast.success('Notifications enabled!');
            } else {
                Toast.warning('Notifications blocked');
            }
        },

        // Check notification status
        checkNotificationStatus() {
            const status = $('#notifStatusText');
            const btn = $('#requestNotifBtn');

            if (!('Notification' in window)) {
                if (status) status.textContent = 'Not supported';
                if (btn) btn.disabled = true;
                return;
            }

            const perm = Notification.permission;
            if (status) {
                status.textContent = perm === 'granted' ? 'Enabled ✓' :
                    perm === 'denied' ? 'Blocked' : 'Not enabled';
            }
            if (btn) {
                btn.textContent = perm === 'granted' ? 'Enabled' : 'Enable';
                btn.disabled = perm === 'granted';
            }

            // Update hero button
            const heroBtn = $('#notifBtnText');
            if (heroBtn) {
                heroBtn.textContent = perm === 'granted' ? 'Enabled' : 'Enable';
            }
        },

        // Update time display
        updateTimeDisplay(inputId) {
            const input = $(`#${inputId}`);
            if (!input) return;

            const [h, m] = input.value.split(':').map(Number);
            const period = h >= 12 ? 'PM' : 'AM';
            const hours = h % 12 || 12;

            const prefix = inputId === 'customTime' ? 'custom' : 'edit';
            $(`#${prefix}Hour`).textContent = hours;
            $(`#${prefix}Minute`).textContent = m.toString().padStart(2, '0');
            $(`#${prefix}Period`).textContent = period;
        },

        // Toggle day selection
        toggleDay(event) {
            const chip = event.target.closest('.day-chip');
            if (!chip) return;

            // Ensure at least one day stays selected
            const selector = chip.closest('.days-selector');
            const activeCount = selector.querySelectorAll('.day-chip.active').length;

            if (chip.classList.contains('active') && activeCount <= 1) {
                Toast.warning('At least one day required');
                return;
            }

            chip.classList.toggle('active');
            Utils.haptic('light');
            this.updateDaysSummary();
        },

        // Update days summary
        updateDaysSummary() {
            const days = [];
            $$('#daysSelector .day-chip.active').forEach(chip => {
                days.push(parseInt(chip.dataset.day));
            });

            const summary = $('#daysSummary');
            if (summary) summary.textContent = Utils.formatDays(days);
        },

        // Select sound
        selectSound(el) {
            $$('.sound-option').forEach(opt => opt.classList.remove('active'));
            el.classList.add('active');
            Utils.haptic('light');
        },

        // Update setting
        updateSetting(key, value) {
            State.settings[key] = value;
            Storage.saveSettings();

            if (key === 'preReminderMinutes') {
                Scheduler.rescheduleAll();
            }
        },

        // Set theme
        setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('anhad_theme', theme);

            $$('.theme-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === theme);
            });

            Utils.haptic('light');
        },

        // Reset all
        resetAll() {
            if (confirm('Reset all reminders and settings?')) {
                localStorage.removeItem(CONFIG.STORAGE_KEY);
                localStorage.removeItem(CONFIG.SETTINGS_KEY);
                localStorage.removeItem(CONFIG.STATS_KEY);
                location.reload();
            }
        },

        // Go back
        goBack() {
            window.location.href = '../index.html';
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // EVENT BINDINGS
    // ══════════════════════════════════════════════════════════════════════════

    function bindEvents() {
        // Back button
        $('#backBtn')?.addEventListener('click', () => SmartRemindersUI.goBack());

        // Settings button
        $('#settingsBtn')?.addEventListener('click', () => SmartRemindersUI.openSettings());
        $('#settingsClose')?.addEventListener('click', () => SmartRemindersUI.closeSettings());
        $('#settingsBackdrop')?.addEventListener('click', () => SmartRemindersUI.closeSettings());

        // Hero buttons
        $('#testReminderBtn')?.addEventListener('click', () => SmartRemindersUI.testReminder());
        $('#enableNotifBtn')?.addEventListener('click', () => SmartRemindersUI.requestNotifications());

        // Toggle all
        $('#toggleAllBtn')?.addEventListener('click', () => SmartRemindersUI.toggleAll());

        // Core reminder toggles
        $$('.reminder-card input[type="checkbox"]').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const id = e.target.dataset.reminder || e.target.closest('.reminder-card')?.dataset.id;
                if (id) SmartRemindersUI.toggleReminder(id, e.target.checked);
            });
        });

        // Edit buttons
        $$('.reminder-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.edit || btn.closest('.reminder-card')?.dataset.id;
                if (id) SmartRemindersUI.openEdit(id);
            });
        });

        // Edit sheet
        $('#editCancel')?.addEventListener('click', () => SmartRemindersUI.cancelEdit());
        $('#editSave')?.addEventListener('click', () => SmartRemindersUI.saveEdit());
        $('#editBackdrop')?.addEventListener('click', () => SmartRemindersUI.cancelEdit());
        $('#editTime')?.addEventListener('change', () => SmartRemindersUI.updateTimeDisplay('editTime'));

        // Days selector
        $$('#daysSelector .day-chip').forEach(chip => {
            chip.addEventListener('click', (e) => SmartRemindersUI.toggleDay(e));
        });

        // Sound options
        $$('.sound-option').forEach(opt => {
            opt.addEventListener('click', () => SmartRemindersUI.selectSound(opt));
        });

        // Add custom
        $('#addCustomBtn')?.addEventListener('click', () => SmartRemindersUI.openAddCustom());
        $('#addCancel')?.addEventListener('click', () => SmartRemindersUI.cancelAdd());
        $('#addSave')?.addEventListener('click', () => SmartRemindersUI.saveCustom());
        $('#addBackdrop')?.addEventListener('click', () => SmartRemindersUI.cancelAdd());
        $('#customTime')?.addEventListener('change', () => SmartRemindersUI.updateTimeDisplay('customTime'));

        // Custom days selector
        $$('#customDaysSelector .day-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.target.closest('.day-chip').classList.toggle('active');
                Utils.haptic('light');
            });
        });

        // Settings
        $('#neverMissToggle')?.addEventListener('change', (e) => {
            SmartRemindersUI.updateSetting('neverMissMode', e.target.checked);
        });
        $('#snoozeToggle')?.addEventListener('change', (e) => {
            SmartRemindersUI.updateSetting('snoozeEnabled', e.target.checked);
        });
        $('#preReminderSelect')?.addEventListener('change', (e) => {
            SmartRemindersUI.updateSetting('preReminderMinutes', parseInt(e.target.value));
        });
        $('#quietHoursToggle')?.addEventListener('change', (e) => {
            SmartRemindersUI.updateSetting('quietHoursEnabled', e.target.checked);
        });
        $('#vibrationToggle')?.addEventListener('change', (e) => {
            SmartRemindersUI.updateSetting('vibrationEnabled', e.target.checked);
        });

        // Theme buttons
        $$('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => SmartRemindersUI.setTheme(btn.dataset.theme));
        });

        // Request notifications
        $('#requestNotifBtn')?.addEventListener('click', () => SmartRemindersUI.requestNotifications());

        // Reset
        $('#resetAllBtn')?.addEventListener('click', () => SmartRemindersUI.resetAll());

        // Scroll effects
        window.addEventListener('scroll', () => {
            const header = $('#appHeader');
            if (header) header.classList.toggle('scrolled', window.scrollY > 10);
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════

    function init() {
        console.log('[SmartRemindersUI] Initializing v5.0...');

        // Load data
        State.reminders = Storage.loadReminders();
        State.settings = Storage.loadSettings();
        State.stats = Storage.loadStats();

        // Apply saved theme
        const savedTheme = localStorage.getItem('anhad_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Initialize UI
        UI.init();

        // Bind events
        bindEvents();

        // Schedule alarms
        Scheduler.rescheduleAll();

        // Check notification status
        SmartRemindersUI.checkNotificationStatus();

        // Hide loader
        setTimeout(() => {
            const loader = $('#appLoading');
            if (loader) loader.classList.add('hidden');
        }, 600);

        console.log('[SmartRemindersUI] Initialized successfully!');
    }

    // Expose to global
    window.SmartRemindersUI = SmartRemindersUI;

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
