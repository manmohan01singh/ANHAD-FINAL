/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * iOS SPIRITUAL COMPANION — JavaScript Engine
 * 
 * Philosophy:
 * - Changes feel auto-saved (no explicit save buttons)
 * - Motion is breathing, not animation
 * - One focus at a time
 * - Grandma can use it without learning
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════════

    const STORAGE_KEY = 'ios_companion_state';

    const defaultState = {
        reminders: {
            amritvela: {
                id: 'amritvela',
                name: 'Amritvela',
                time: '04:00',
                enabled: true,
                days: [0, 1, 2, 3, 4, 5, 6], // All days
                sound: 'peaceful-bells',
                haptic: false
            },
            rehras: {
                id: 'rehras',
                name: 'Rehras Sahib',
                time: '18:30',
                enabled: true,
                days: [0, 1, 2, 3, 4, 5, 6],
                sound: 'peaceful-bells',
                haptic: false
            },
            sohila: {
                id: 'sohila',
                name: 'Sohila Sahib',
                time: '21:30',
                enabled: false,
                days: [0, 1, 2, 3, 4, 5, 6],
                sound: 'peaceful-bells',
                haptic: true
            }
        },
        customReminders: [],
        settings: {
            preReminderMinutes: 5,
            neverMissMode: false,
            notificationsEnabled: false
        },
        ui: {
            swipeHintShown: false
        }
    };

    let state = loadState();
    let currentEditBani = null;

    // ═══════════════════════════════════════════════════════════════════════════
    // STORAGE
    // ═══════════════════════════════════════════════════════════════════════════

    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to handle new properties
                return deepMerge(defaultState, parsed);
            }
        } catch (e) {
            console.warn('Failed to load state:', e);
        }
        return JSON.parse(JSON.stringify(defaultState));
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('Failed to save state:', e);
        }
    }

    function deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DOM ELEMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        updateGreeting();
        updateCards();
        updateNextPath();
        initCarousel();
        initEventListeners();
        checkNotificationPermission();

        // Show swipe hint if first time
        if (!state.ui.swipeHintShown) {
            showSwipeHint();
        } else {
            hideSwipeHint();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GREETING — Time-aware, personal
    // ═══════════════════════════════════════════════════════════════════════════

    function updateGreeting() {
        const hour = new Date().getHours();
        const greetingEl = $('#greetingText');

        let greeting;
        if (hour >= 3 && hour < 6) {
            greeting = 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ'; // Amritvela time - Gurmukhi greeting
        } else if (hour >= 6 && hour < 12) {
            greeting = 'Good Morning';
        } else if (hour >= 12 && hour < 17) {
            greeting = 'Good Afternoon';
        } else if (hour >= 17 && hour < 21) {
            greeting = 'Good Evening';
        } else {
            greeting = 'Good Night';
        }

        greetingEl.textContent = greeting;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UPDATE CARDS — Sync with state
    // ═══════════════════════════════════════════════════════════════════════════

    function updateCards() {
        const reminders = state.reminders;

        Object.keys(reminders).forEach(baniId => {
            const reminder = reminders[baniId];
            const card = $(`.focus-card[data-bani="${baniId}"]`);
            if (!card) return;

            const timeEl = card.querySelector('.focus-time');
            const statusEl = card.querySelector('.focus-status');
            const statusText = card.querySelector('.status-text');

            // Update time display
            timeEl.textContent = formatTime12Hour(reminder.time);

            // Update status
            statusEl.dataset.enabled = reminder.enabled;
            statusText.textContent = reminder.enabled ? 'Enabled' : 'Off';
        });
    }

    function updateNextPath() {
        const now = new Date();
        let nextReminder = null;
        let nextTime = null;

        // Find the next upcoming enabled reminder
        Object.values(state.reminders).forEach(reminder => {
            if (!reminder.enabled) return;

            const [hours, minutes] = reminder.time.split(':').map(Number);
            const reminderTime = new Date(now);
            reminderTime.setHours(hours, minutes, 0, 0);

            // If time has passed today, check tomorrow
            if (reminderTime <= now) {
                reminderTime.setDate(reminderTime.getDate() + 1);
            }

            if (!nextTime || reminderTime < nextTime) {
                nextTime = reminderTime;
                nextReminder = reminder;
            }
        });

        const nextTimeEl = $('#nextTime');
        const pathHintEl = $('#pathHint');

        if (nextReminder) {
            nextTimeEl.textContent = formatTime12Hour(nextReminder.time);
            pathHintEl.innerHTML = `Your next path begins at <span id="nextTime">${formatTime12Hour(nextReminder.time)}</span>`;
        } else {
            pathHintEl.textContent = 'No reminders scheduled';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CAROUSEL — Swipe between cards
    // ═══════════════════════════════════════════════════════════════════════════

    function initCarousel() {
        const carousel = $('#focusCarousel');
        const dots = $$('.dot');

        carousel.addEventListener('scroll', () => {
            const scrollLeft = carousel.scrollLeft;
            const cardWidth = 280 + 16; // card width + gap
            const index = Math.round(scrollLeft / cardWidth);

            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });

            // Hide swipe hint after first scroll
            if (!state.ui.swipeHintShown) {
                hideSwipeHint();
                state.ui.swipeHintShown = true;
                saveState();
            }
        });

        // Click on dots to navigate
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.dataset.index);
                const cardWidth = 280 + 16;
                carousel.scrollTo({
                    left: index * cardWidth,
                    behavior: 'smooth'
                });
            });
        });
    }

    function showSwipeHint() {
        const hint = $('#swipeHint');
        if (hint) hint.classList.remove('hidden');
    }

    function hideSwipeHint() {
        const hint = $('#swipeHint');
        if (hint) hint.classList.add('hidden');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════════════

    function initEventListeners() {
        // Back button
        $('#backBtn').addEventListener('click', () => {
            window.location.href = '../index.html';
        });

        // Settings button
        $('#settingsBtn').addEventListener('click', openSettings);

        // Card clicks
        $$('.focus-card').forEach(card => {
            card.addEventListener('click', () => {
                const baniId = card.dataset.bani;
                openDetail(baniId);
            });
        });

        // Custom reminders button
        $('#customRemindersBtn').addEventListener('click', openCustomScreen);

        // Detail screen
        $('#detailClose').addEventListener('click', closeDetail);
        $('#detailBackdrop').addEventListener('click', closeDetail);

        // Settings screen
        $('#settingsClose').addEventListener('click', closeSettings);
        $('#settingsBackdrop').addEventListener('click', closeSettings);

        // Custom screen
        $('#customClose').addEventListener('click', closeCustomScreen);
        $('#customBackdrop').addEventListener('click', closeCustomScreen);
        $('#addCustomBtn').addEventListener('click', addCustomReminder);

        // Time input
        $('#timeInput').addEventListener('change', handleTimeChange);

        // Days pills
        $$('.day-pill').forEach(pill => {
            pill.addEventListener('click', handleDayToggle);
        });

        // Main toggle
        $('#mainToggle').addEventListener('change', handleMainToggle);

        // Haptic toggle
        $('#hapticToggle').addEventListener('change', handleHapticToggle);

        // Settings toggles
        $('#enableNotifBtn').addEventListener('click', requestNotificationPermission);
        $('#preReminderSelect').addEventListener('change', handlePreReminderChange);
        $('#neverMissToggle').addEventListener('change', handleNeverMissToggle);

        // Sound option (future: implement sound picker)
        $('#soundOption').addEventListener('click', () => {
            showToast('Sound picker coming soon');
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DETAIL SCREEN — iOS Alarm-style edit
    // ═══════════════════════════════════════════════════════════════════════════

    function openDetail(baniId) {
        currentEditBani = baniId;
        const reminder = state.reminders[baniId];

        if (!reminder) return;

        // Update detail screen with reminder data
        $('#detailTitle').textContent = reminder.name;
        $('#timeInput').value = reminder.time;
        updateTimeDisplay(reminder.time);

        // Update days
        updateDaysPills(reminder.days);
        updateDaysSummary(reminder.days);

        // Update toggles
        $('#hapticToggle').checked = reminder.haptic;
        $('#mainToggle').checked = reminder.enabled;
        updateToggleLabel(reminder.enabled);

        // Sound value
        $('#soundValue').textContent = formatSoundName(reminder.sound);

        // Open sheet
        openSheet('detailScreen');
    }

    function closeDetail() {
        closeSheet('detailScreen');
        currentEditBani = null;
    }

    function handleTimeChange(e) {
        if (!currentEditBani) return;

        const time = e.target.value;
        state.reminders[currentEditBani].time = time;
        updateTimeDisplay(time);
        saveAndUpdate();

        // Subtle feedback
        showToast('Time updated');
    }

    function updateTimeDisplay(time) {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;

        $('#timeHour').textContent = displayHours;
        $('#timeMinute').textContent = minutes.toString().padStart(2, '0');
        $('#timePeriod').textContent = period;
    }

    function handleDayToggle(e) {
        if (!currentEditBani) return;

        const pill = e.target.closest('.day-pill');
        const day = parseInt(pill.dataset.day);
        const reminder = state.reminders[currentEditBani];

        const index = reminder.days.indexOf(day);
        if (index > -1) {
            // Don't allow removing all days
            if (reminder.days.length === 1) {
                showToast('At least one day required');
                return;
            }
            reminder.days.splice(index, 1);
            pill.classList.remove('active');
        } else {
            reminder.days.push(day);
            reminder.days.sort((a, b) => a - b);
            pill.classList.add('active');
        }

        updateDaysSummary(reminder.days);
        saveState();
    }

    function updateDaysPills(days) {
        $$('.day-pill').forEach(pill => {
            const day = parseInt(pill.dataset.day);
            pill.classList.toggle('active', days.includes(day));
        });
    }

    function updateDaysSummary(days) {
        const summaryEl = $('#daysSummary');

        if (days.length === 7) {
            summaryEl.textContent = 'Every day';
        } else if (days.length === 0) {
            summaryEl.textContent = 'Never';
        } else if (arraysEqual(days, [1, 2, 3, 4, 5])) {
            summaryEl.textContent = 'Weekdays';
        } else if (arraysEqual(days, [0, 6])) {
            summaryEl.textContent = 'Weekends';
        } else {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            summaryEl.textContent = days.map(d => dayNames[d]).join(', ');
        }
    }

    function handleMainToggle(e) {
        if (!currentEditBani) return;

        const enabled = e.target.checked;
        state.reminders[currentEditBani].enabled = enabled;
        updateToggleLabel(enabled);
        saveAndUpdate();

        showToast(enabled ? 'Reminder enabled' : 'Reminder disabled');

        // Schedule/unschedule notification
        if (enabled) {
            scheduleReminder(currentEditBani);
        }
    }

    function updateToggleLabel(enabled) {
        $('#toggleLabel').textContent = enabled ? 'Reminder Active' : 'Reminder Off';
    }

    function handleHapticToggle(e) {
        if (!currentEditBani) return;

        state.reminders[currentEditBani].haptic = e.target.checked;
        saveState();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SETTINGS SCREEN
    // ═══════════════════════════════════════════════════════════════════════════

    function openSettings() {
        // Update UI to reflect current state
        $('#preReminderSelect').value = state.settings.preReminderMinutes.toString();
        $('#neverMissToggle').checked = state.settings.neverMissMode;

        updateNotificationUI();

        openSheet('settingsScreen');
    }

    function closeSettings() {
        closeSheet('settingsScreen');
    }

    function handlePreReminderChange(e) {
        state.settings.preReminderMinutes = parseInt(e.target.value);
        saveState();
    }

    function handleNeverMissToggle(e) {
        state.settings.neverMissMode = e.target.checked;
        saveState();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CUSTOM REMINDERS SCREEN
    // ═══════════════════════════════════════════════════════════════════════════

    function openCustomScreen() {
        renderCustomList();
        openSheet('customScreen');
    }

    function closeCustomScreen() {
        closeSheet('customScreen');
    }

    function renderCustomList() {
        const list = $('#customList');
        const empty = $('#customEmpty');
        const customs = state.customReminders;

        if (customs.length === 0) {
            list.innerHTML = '';
            empty.style.display = 'flex';
            return;
        }

        empty.style.display = 'none';
        list.innerHTML = customs.map(reminder => `
            <div class="custom-item" data-id="${reminder.id}">
                <div class="custom-item-info">
                    <span class="custom-item-name">${reminder.name}</span>
                    <span class="custom-item-time">${formatTime12Hour(reminder.time)}</span>
                </div>
                <label class="ios-toggle">
                    <input type="checkbox" ${reminder.enabled ? 'checked' : ''} onchange="toggleCustomReminder('${reminder.id}', this.checked)">
                    <span class="toggle-track"></span>
                </label>
            </div>
        `).join('');
    }

    function addCustomReminder() {
        const name = prompt('Reminder name (e.g., Simran, Mool Mantar):');
        if (!name || name.trim() === '') return;

        const time = prompt('Time (24h format, e.g., 05:00):') || '05:00';

        const newReminder = {
            id: 'custom_' + Date.now(),
            name: name.trim(),
            time: time,
            enabled: true,
            days: [0, 1, 2, 3, 4, 5, 6],
            sound: 'peaceful-bells',
            haptic: false
        };

        state.customReminders.push(newReminder);
        saveState();
        renderCustomList();
        showToast('Reminder added');
    }

    // Global function for toggle
    window.toggleCustomReminder = function (id, enabled) {
        const reminder = state.customReminders.find(r => r.id === id);
        if (reminder) {
            reminder.enabled = enabled;
            saveState();
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // SHEET MANAGEMENT — Smooth transitions
    // ═══════════════════════════════════════════════════════════════════════════

    function openSheet(screenId) {
        document.body.classList.add('sheet-open');
        const screen = $(`#${screenId}`);
        screen.classList.add('open');
        screen.setAttribute('aria-hidden', 'false');
    }

    function closeSheet(screenId) {
        const screen = $(`#${screenId}`);
        screen.classList.remove('open');
        screen.setAttribute('aria-hidden', 'true');

        // Small delay before unlocking scroll
        setTimeout(() => {
            if (!$('.detail-screen.open, .settings-screen.open, .custom-screen.open')) {
                document.body.classList.remove('sheet-open');
            }
        }, 350);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function checkNotificationPermission() {
        if (!('Notification' in window)) {
            state.settings.notificationsEnabled = false;
            saveState();
            return;
        }

        state.settings.notificationsEnabled = Notification.permission === 'granted';
        saveState();
        updateNotificationUI();
    }

    function updateNotificationUI() {
        const btn = $('#enableNotifBtn');
        const note = $('#notifNote');

        if (!('Notification' in window)) {
            btn.textContent = 'Not Supported';
            btn.classList.add('disabled');
            btn.disabled = true;
            note.textContent = 'Your browser does not support notifications.';
            return;
        }

        if (Notification.permission === 'granted') {
            btn.textContent = 'Enabled';
            btn.classList.add('disabled');
            btn.disabled = true;
            note.textContent = 'You will receive reminders for your spiritual practice.';
        } else if (Notification.permission === 'denied') {
            btn.textContent = 'Blocked';
            btn.classList.add('disabled');
            btn.disabled = true;
            note.textContent = 'Notifications are blocked. Please enable them in your browser settings.';
        } else {
            btn.textContent = 'Enable';
            btn.classList.remove('disabled');
            btn.disabled = false;
            note.textContent = 'Notifications are required for reminders to work.';
        }
    }

    async function requestNotificationPermission() {
        if (!('Notification' in window)) {
            showToast('Notifications not supported');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            state.settings.notificationsEnabled = permission === 'granted';
            saveState();
            updateNotificationUI();

            if (permission === 'granted') {
                showToast('Notifications enabled');
                // Schedule all enabled reminders
                Object.keys(state.reminders).forEach(baniId => {
                    if (state.reminders[baniId].enabled) {
                        scheduleReminder(baniId);
                    }
                });
            }
        } catch (e) {
            console.error('Notification permission error:', e);
            showToast('Could not enable notifications');
        }
    }

    function scheduleReminder(baniId) {
        // In a real app, this would use the Notification API with timing
        // For now, we'll just confirm scheduling
        console.log(`Scheduled reminder for ${baniId}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TOAST — Subtle feedback
    // ═══════════════════════════════════════════════════════════════════════════

    let toastTimeout;

    function showToast(message) {
        const toast = $('#toast');
        const text = $('#toastText');

        text.textContent = message;
        toast.classList.add('show');

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    function formatTime12Hour(time24) {
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    function formatSoundName(soundId) {
        const sounds = {
            'peaceful-bells': 'Peaceful Bells',
            'gentle-chimes': 'Gentle Chimes',
            'morning-flute': 'Morning Flute',
            'silent': 'Silent'
        };
        return sounds[soundId] || 'Default';
    }

    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        const sortedA = [...a].sort();
        const sortedB = [...b].sort();
        return sortedA.every((val, i) => val === sortedB[i]);
    }

    function saveAndUpdate() {
        saveState();
        updateCards();
        updateNextPath();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZE
    // ═══════════════════════════════════════════════════════════════════════════

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
