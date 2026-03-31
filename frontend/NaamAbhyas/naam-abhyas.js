/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NAAM ABHYAS - Hourly Spiritual Practice Reminder System
 * ─────────────────────────────────────────────────────────────────────────────
 * Core Application Logic for Gurbani Radio PWA
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════════════
   CONFIGURATION
═══════════════════════════════════════════════════════════════════════════════ */

const NAAM_CONFIG = {
    STORAGE_KEYS: {
        CONFIG: 'naam_abhyas_config',
        HISTORY: 'naam_abhyas_history',
        SCHEDULE: 'naam_abhyas_schedule'
    },

    DEFAULTS: {
        enabled: false,
        duration: 2, // minutes
        activeHours: {
            start: 5,
            end: 22
        },
        notifications: {
            hourStart: true,
            preReminder: true,
            preReminderMinutes: 2,
            sound: 'gentle-bell',
            vibration: true,
            soundEnabled: true
        },
        autoStartTimer: false,
        theme: 'system'
    },

    ACHIEVEMENTS: [
        { id: 'first_session', name: 'First Step', description: 'Complete your first Naam Abhyas', icon: '🏅', condition: 'completedSessions >= 1' },
        { id: 'streak_5', name: 'Getting Started', description: '5-hour streak', icon: '⚡', condition: 'currentStreak >= 5' },
        { id: 'streak_10', name: 'Dedicated Seeker', description: '10-hour streak', icon: '🔥', condition: 'currentStreak >= 10' },
        { id: 'streak_24', name: 'Perfect Day', description: '24-hour streak', icon: '🌟', condition: 'currentStreak >= 24' },
        { id: 'sessions_10', name: 'Devoted', description: '10 sessions completed', icon: '📿', condition: 'completedSessions >= 10' },
        { id: 'sessions_50', name: 'Regular Practice', description: '50 sessions completed', icon: '🎯', condition: 'completedSessions >= 50' },
        { id: 'sessions_100', name: 'Centurion', description: '100 sessions completed', icon: '💯', condition: 'completedSessions >= 100' },
        { id: 'sessions_500', name: 'Devoted Soul', description: '500 sessions completed', icon: '👑', condition: 'completedSessions >= 500' },
        { id: 'time_30min', name: 'Half Hour', description: '30 minutes in Naam Abhyas', icon: '⏰', condition: 'totalTimeSeconds >= 1800' },
        { id: 'time_1hour', name: 'Hour of Devotion', description: '1 hour in Naam Abhyas', icon: '🕐', condition: 'totalTimeSeconds >= 3600' },
        { id: 'time_5hours', name: 'Deep Practice', description: '5 hours in Naam Abhyas', icon: '🙏', condition: 'totalTimeSeconds >= 18000' }
    ],

    WISDOM_QUOTES: [
        { gurmukhi: "ਨਾਮ ਜਪਤ ਅਘ ਕੋਟਿ ਉਤਾਰੇ", translation: "Chanting the Naam, millions of sins are erased", source: "Sri Guru Granth Sahib Ji, Ang 289" },
        { gurmukhi: "ਜਪਿ ਮਨ ਮੇਰੇ ਗੋਵਿੰਦ ਕੀ ਬਾਣੀ", translation: "O my mind, chant the Word of the Lord", source: "Sri Guru Granth Sahib Ji, Ang 192" },
        { gurmukhi: "ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖ ਪਾਵਉ", translation: "Meditating, meditating, meditating, I find peace", source: "Sri Guru Granth Sahib Ji, Ang 262" },
        { gurmukhi: "ਮਨ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ ਆਪਣਾ ਮੂਲੁ ਪਛਾਣੁ", translation: "O my mind, you are the embodiment of Light - recognize your origin", source: "Sri Guru Granth Sahib Ji, Ang 441" },
        { gurmukhi: "ਹਰਿ ਕਾ ਨਾਮੁ ਜਪਿ ਦਿਨਸੁ ਰਾਤਿ", translation: "Chant the Lord's Name, day and night", source: "Sri Guru Granth Sahib Ji, Ang 185" },
        { gurmukhi: "ਨਾਮ ਬਿਨਾ ਸਭੁ ਜਗੁ ਕਮਲਾਨਾ", translation: "Without the Naam, the whole world is insane", source: "Sri Guru Granth Sahib Ji, Ang 366" },
        { gurmukhi: "ਏਕੋ ਨਾਮੁ ਹੁਕਮੁ ਹੈ ਨਾਨਕ ਸਤਿਗੁਰਿ ਦੀਆ ਬੁਝਾਇ", translation: "The One Name is the Lord's Command; the True Guru has given understanding", source: "Sri Guru Granth Sahib Ji, Ang 72" },
        { gurmukhi: "ਗੁਰਮੁਖਿ ਨਾਮੁ ਜਪਹੁ ਮਨ ਮੇਰੇ", translation: "O my mind, chant the Naam as Gurmukh", source: "Sri Guru Granth Sahib Ji, Ang 560" }
    ]
};

/* ═══════════════════════════════════════════════════════════════════════════════
   THEME ENGINE
═══════════════════════════════════════════════════════════════════════════════ */

class NaamAbhyasThemeEngine {
    constructor() {
        this.currentTheme = localStorage.getItem('naamAbhyas_theme') || 'system';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupSystemThemeListener();
        this.bindThemeButtons();
    }

    applyTheme(theme) {
        const htmlEl = document.documentElement;
        document.body.classList.remove('theme-light', 'theme-dark');

        let actualTheme = theme;
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            actualTheme = prefersDark ? 'dark' : 'light';
        }

        document.body.classList.add(`theme-${actualTheme}`);
        htmlEl.setAttribute('data-theme', actualTheme);

        this.updateActiveButton(theme);
        localStorage.setItem('naamAbhyas_theme', theme);
        this.currentTheme = theme;

        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            const isDark = actualTheme === 'dark';
            metaThemeColor.setAttribute('content', isDark ? '#0a0a14' : '#FFF5E6');
        }
    }

    setupSystemThemeListener() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.currentTheme === 'system') {
                this.applyTheme('system');
            }
        });
    }

    bindThemeButtons() {
        // Both data-theme buttons and original radio inputs
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyTheme(btn.dataset.theme);
            });
        });

        // Handle the radio buttons in the settings modal
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
            });
        });
    }

    updateActiveButton(theme) {
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
        // Sync radio buttons
        const radio = document.querySelector(`input[name="theme"][value="${theme}"]`);
        if (radio) radio.checked = true;
    }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SCHEDULE MANAGER
═══════════════════════════════════════════════════════════════════════════════ */

class ScheduleManager {
    constructor(appInstance) {
        this.app = appInstance;
        this.REFRESH_TIMES = [0, 12]; // Hours: midnight and noon
        this.checkAndRefresh();
        this.setupAutoRefresh();
    }

    checkAndRefresh() {
        const lastRefresh = localStorage.getItem('schedule_lastRefresh');
        const now = new Date();

        if (!lastRefresh || this.needsRefresh(new Date(lastRefresh), now)) {
            this.refreshSchedule();
        }
    }

    needsRefresh(lastRefresh, now) {
        const lastDate = lastRefresh.toDateString();
        const nowDate = now.toDateString();

        if (lastDate !== nowDate) return true;

        const lastHour = lastRefresh.getHours();
        const nowHour = now.getHours();

        for (const refreshHour of this.REFRESH_TIMES) {
            if (lastHour < refreshHour && nowHour >= refreshHour) {
                return true;
            }
        }
        return false;
    }

    refreshSchedule() {
        console.log('📅 ScheduleManager: Refreshing today\'s schedule...');
        this.app.generateDailySchedule();
        localStorage.setItem('schedule_lastRefresh', new Date().toISOString());
    }

    setupAutoRefresh() {
        // Check every hour
        setInterval(() => this.checkAndRefresh(), 60 * 60 * 1000);
    }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   NAAM ABHYAS MAIN CLASS
═══════════════════════════════════════════════════════════════════════════════ */

class NaamAbhyas {
    constructor() {
        this.config = this.loadConfig();
        this.history = this.loadHistory();
        this.currentSchedule = {};
        this.activeTimer = null;
        this.countdownInterval = null;
        this.hourlyRefreshTimeout = null;
        this.isInitialized = false;

        // Component instances
        this.timerEngine = null;
        this.notificationEngine = null;
        this.statsTracker = null;
        this.audioManager = null;
        this.themeEngine = null;
        this.scheduleManager = null;
        this.ritualEngine = null; // Sacred micro-commitment ritual system
        this.disciplineMetrics = null; // Product-minded KPI tracking
    }

    /* ═════════════════════════════════════════════════════════════════════════
       INITIALIZATION
    ═════════════════════════════════════════════════════════════════════════ */

    async init() {
        try {
            console.log('🙏 Initializing Naam Abhyas...');

            // Initialize components
            this.initializeComponents();

            // Bind event listeners
            this.bindEvents();

            // Load initial state
            this.loadInitialState();

            // Initialize engines
            this.themeEngine = new NaamAbhyasThemeEngine();
            this.scheduleManager = new ScheduleManager(this);

            // Apply theme (initial sync)
            this.themeEngine.applyTheme(this.config.theme);

            // Initialize UI
            this.updateUI();

            // If enabled, start the system
            if (this.config.enabled) {
                await this.enable();
            }

            // Hide loading screen
            this.hideLoadingScreen();

            // NOTE: Welcome modal removed from here - it will show via triggerSessionAlert
            // when an actual session time is reached (notification -> popup -> timer flow)

            this.isInitialized = true;
            console.log('✅ Naam Abhyas initialized successfully');

            // Setup Service Worker message listener for background notifications
            this.setupServiceWorkerListener();

            // Check for auto-start from notification (when user clicks "Start Now" on a notification)
            this.checkAutoStart();

        } catch (error) {
            console.error('❌ Failed to initialize Naam Abhyas:', error);
            this.showToast('Failed to initialize. Please refresh.', 'error');
        }
    }

    /**
     * Setup listener for Service Worker queries (for background notification support)
     * The SW may ask for schedule data when checking for due notifications
     */
    setupServiceWorkerListener() {
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, currentHour, currentMinute, today } = event.data || {};

            // Respond to schedule queries from service worker
            if (type === 'GET_NAAM_ABHYAS_SCHEDULE' && event.ports[0]) {
                const sessions = [];
                const schedule = this.currentSchedule || {};

                Object.entries(schedule).forEach(([hour, session]) => {
                    if (session && session.status === 'pending') {
                        sessions.push({
                            hour: parseInt(hour),
                            startMinute: session.startMinute,
                            duration: this.config.duration || 2,
                            notified: !!session.notified
                        });
                    }
                });

                event.ports[0].postMessage({
                    sessions,
                    enabled: this.config.enabled,
                    duration: this.config.duration
                });
            }

            // Handle notification-shown confirmation from SW
            if (type === 'NAAM_ABHYAS_NOTIFIED' && event.data.hour !== undefined) {
                const hour = event.data.hour;
                if (this.currentSchedule[hour]) {
                    this.currentSchedule[hour].notified = true;
                    // Trigger the session alert modal since notification was shown
                    this.triggerSessionAlert(this.currentSchedule[hour]);
                }
            }
        });
    }

    /**
     * Check URL params for auto-start request from notification click
     * Opens the session modal directly when user clicked "Start Now" from notification
     */
    checkAutoStart() {
        const urlParams = new URLSearchParams(window.location.search);
        const autoStart = urlParams.get('autoStart');

        if (autoStart === 'true') {
            console.log('[NaamAbhyas] 🚀 Auto-start requested from notification');

            // Clean up URL (remove params without reload)
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);

            // Get the current session or use the provided hour/minute
            const hour = parseInt(urlParams.get('hour')) || new Date().getHours();
            const minute = parseInt(urlParams.get('minute')) || new Date().getMinutes();

            // Find the matching session or the current one
            let targetSession = this.currentSchedule[hour];
            if (!targetSession) {
                targetSession = this.getNextScheduledSession() || {
                    hour: hour,
                    startMinute: minute,
                    startTime: this.formatTime12h(hour, minute),
                    status: 'pending'
                };
            }

            // Small delay to ensure everything is loaded, then show alert modal
            setTimeout(() => {
                this.triggerSessionAlert(targetSession);
            }, 500);
        }
    }

    initializeComponents() {
        // Initialize Timer Engine
        if (typeof TimerEngine !== 'undefined') {
            this.timerEngine = new TimerEngine();
        }

        // Initialize Notification Engine
        if (typeof NotificationEngine !== 'undefined') {
            this.notificationEngine = new NotificationEngine();
        }

        // Initialize Stats Tracker
        if (typeof StatsTracker !== 'undefined') {
            this.statsTracker = new StatsTracker(this.history);
        }

        // Initialize Audio Manager
        if (typeof AudioManager !== 'undefined') {
            this.audioManager = new AudioManager();
        }

        // Initialize Ritual Engine - Sacred Micro-Commitment System
        if (typeof RitualEngine !== 'undefined') {
            this.ritualEngine = new RitualEngine(this);
            console.log('🙏 Ritual Engine initialized - Sacred micro-commitment system active');
        }

        // Initialize Discipline Metrics - Product-minded KPI tracking
        if (typeof DisciplineMetrics !== 'undefined') {
            this.disciplineMetrics = new DisciplineMetrics(this.history);
            console.log('📊 Discipline Metrics initialized - KPI tracking active');
        }

        // Initialize Dynamic Island Header Clock
        this.initializeHeaderClock();
    }

    /**
     * Initialize the Dynamic Island header clock
     * Updates every second with current time
     */
    initializeHeaderClock() {
        this.updateHeaderClock();
        this.headerClockInterval = setInterval(() => {
            this.updateHeaderClock();
        }, 1000);
    }

    /**
     * Update the header clock display
     */
    updateHeaderClock() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            timeElement.textContent = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        }

        // Also update header streak count
        const streakElement = document.getElementById('headerStreakCount');
        if (streakElement && this.history && this.history.statistics) {
            streakElement.textContent = this.history.statistics.currentStreak || 0;
        }
    }

    bindEvents() {
        // Back button
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = '../index.html';
            });
        }

        // Main toggle
        const toggle = document.getElementById('naamAbhyasToggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.enable();
                } else {
                    this.disable();
                }
            });
        }

        // Theme selection handled by ThemeEngine

        // Duration options
        const durationOptions = document.querySelectorAll('input[name="duration"]');
        durationOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                this.config.duration = parseInt(e.target.value);
                this.saveConfig();
                this.showToast(`Duration set to ${this.config.duration} minutes`, 'success');
            });
        });

        // Active hours
        const startHour = document.getElementById('activeHoursStart');
        const endHour = document.getElementById('activeHoursEnd');

        if (startHour) {
            startHour.addEventListener('change', (e) => {
                this.config.activeHours.start = parseInt(e.target.value);
                this.saveConfig();
                this.regenerateSchedule();
            });
        }

        if (endHour) {
            endHour.addEventListener('change', (e) => {
                this.config.activeHours.end = parseInt(e.target.value);
                this.saveConfig();
                this.regenerateSchedule();
            });
        }

        // Notification toggles
        this.bindToggle('hourStartNotification', 'notifications.hourStart');
        this.bindToggle('preReminderNotification', 'notifications.preReminder');
        this.bindToggle('vibrationEnabled', 'notifications.vibration');
        this.bindToggle('soundEnabled', 'notifications.soundEnabled');
        this.bindToggle('autoStartTimer', 'autoStartTimer');

        // Sound selection
        const soundSelect = document.getElementById('notificationSound');
        if (soundSelect) {
            soundSelect.addEventListener('change', (e) => {
                this.config.notifications.sound = e.target.value;
                this.saveConfig();
            });
        }

        // Preview sound button
        const previewBtn = document.getElementById('previewSoundBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.playNotificationSound();
            });
        }

        // Refresh schedule button
        const refreshBtn = document.getElementById('refreshScheduleBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.regenerateSchedule();
                this.showToast('Schedule refreshed', 'success');
            });
        }

        // Session alert modal buttons (legacy alert modal)
        const alertStartNowBtn = document.getElementById('alertStartNowBtn');
        const skipSessionBtn = document.getElementById('skipSessionBtn');

        if (alertStartNowBtn) {
            alertStartNowBtn.addEventListener('click', () => {
                this.hideAlertModal();
                const session = this.currentAlertSession || this.getNextScheduledSession();
                // Use Ritual Engine for the sacred experience
                if (this.ritualEngine && session) {
                    // Use triggerScheduledSession so it's recorded as scheduled (not extra)
                    this.ritualEngine.triggerScheduledSession(session, this.config.duration || 2);
                } else if (this.ritualEngine) {
                    this.ritualEngine.triggerManualSession(this.config.duration || 2, true);
                } else {
                    this.startMeditation();
                }
            });
        }

        if (skipSessionBtn) {
            skipSessionBtn.addEventListener('click', () => {
                this.hideAlertModal();
                this.skipCurrentSession();
            });
        }

        // Meditation overlay
        const endEarlyBtn = document.getElementById('endEarlyBtn');
        if (endEarlyBtn) {
            endEarlyBtn.addEventListener('click', () => {
                this.endMeditationEarly();
            });
        }

        // Completion modal
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.hideCompletionModal();
            });
        }

        // Stats panel
        const viewStatsBtn = document.getElementById('viewFullStatsBtn');
        const statsPageBtn = document.getElementById('statsPageBtn');
        const closeStatsBtn = document.getElementById('closeStatsBtn');

        if (viewStatsBtn) {
            viewStatsBtn.addEventListener('click', () => this.showStatsPanel());
        }
        if (statsPageBtn) {
            statsPageBtn.addEventListener('click', () => this.showStatsPanel());
        }
        if (closeStatsBtn) {
            closeStatsBtn.addEventListener('click', () => this.hideStatsPanel());
        }

        // Settings modal
        const settingsPageBtn = document.getElementById('settingsPageBtn');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const settingsModalBackdrop = document.getElementById('settingsModalBackdrop');

        if (settingsPageBtn) {
            settingsPageBtn.addEventListener('click', () => this.showSettingsModal());
        }
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => this.hideSettingsModal());
        }
        if (settingsModalBackdrop) {
            settingsModalBackdrop.addEventListener('click', () => this.hideSettingsModal());
        }

        // Visibility change - resume when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.config.enabled) {
                this.updateCountdown();
                this.checkForMissedSessions();
            }
        });
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.config.theme === 'system') {
                this.applyTheme();
            }
        });

        // ═══ NEW MAGICAL FEATURES ═══

        // Wisdom quote refresh button
        const wisdomRefreshBtn = document.getElementById('wisdomRefreshBtn');
        if (wisdomRefreshBtn) {
            wisdomRefreshBtn.addEventListener('click', () => this.showNewWisdom());
        }

        // Quick action buttons - EXTRA sessions (not counted towards schedule)
        const startNowQuickBtn = document.getElementById('startNowBtn');
        if (startNowQuickBtn) {
            startNowQuickBtn.addEventListener('click', () => {
                // Use Ritual Engine with 2-minute EXTRA session
                if (this.ritualEngine) {
                    this.ritualEngine.triggerManualSession(2, true); // 2 min, isExtra=true
                } else {
                    this.startMeditation(2);
                }
            });
        }

        const quickNaamBtn = document.getElementById('quickNaamBtn');
        if (quickNaamBtn) {
            quickNaamBtn.addEventListener('click', () => {
                // Quick 30-second EXTRA session
                if (this.ritualEngine) {
                    this.ritualEngine.triggerManualSession(0.5, true); // 0.5 min (30s), isExtra=true
                } else {
                    this.startMeditation(0.5);
                }
            });
        }

        const deepModeBtn = document.getElementById('deepModeBtn');
        if (deepModeBtn) {
            deepModeBtn.addEventListener('click', () => {
                // Deep 11-minute EXTRA session
                if (this.ritualEngine) {
                    this.ritualEngine.triggerManualSession(11, true); // 11 min, isExtra=true
                } else {
                    this.startMeditation(11);
                }
            });
        }

        // Initialize wisdom on load
        this.initWisdom();
    }

    bindToggle(elementId, configPath) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('change', (e) => {
                this.setNestedConfig(configPath, e.target.checked);
                this.saveConfig();
            });
        }
    }

    setNestedConfig(path, value) {
        const keys = path.split('.');
        let obj = this.config;
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
    }

    loadInitialState() {
        // Set toggle state
        const toggle = document.getElementById('naamAbhyasToggle');
        if (toggle) {
            toggle.checked = this.config.enabled;
        }

        // Set theme radio
        const themeRadio = document.querySelector(`input[name="theme"][value="${this.config.theme}"]`);
        if (themeRadio) {
            themeRadio.checked = true;
        }

        // Set duration radio
        const durationRadio = document.querySelector(`input[name="duration"][value="${this.config.duration}"]`);
        if (durationRadio) {
            durationRadio.checked = true;
        }

        // Set active hours
        const startHour = document.getElementById('activeHoursStart');
        const endHour = document.getElementById('activeHoursEnd');
        if (startHour) startHour.value = this.config.activeHours.start;
        if (endHour) endHour.value = this.config.activeHours.end;

        // Set notification toggles
        this.setToggleState('hourStartNotification', this.config.notifications.hourStart);
        this.setToggleState('preReminderNotification', this.config.notifications.preReminder);
        this.setToggleState('vibrationEnabled', this.config.notifications.vibration);
        this.setToggleState('soundEnabled', this.config.notifications.soundEnabled);
        this.setToggleState('autoStartTimer', this.config.autoStartTimer);

        // Set sound selection
        const soundSelect = document.getElementById('notificationSound');
        if (soundSelect) {
            soundSelect.value = this.config.notifications.sound;
        }

        // Load today's schedule if exists
        const today = this.getTodayString();
        if (this.history.scheduleHistory && this.history.scheduleHistory[today]) {
            this.currentSchedule = this.history.scheduleHistory[today];
        }
    }

    setToggleState(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.checked = value;
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('appLoading');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    /* ═════════════════════════════════════════════════════════════════════════
       WELCOME MODAL
    ═════════════════════════════════════════════════════════════════════════ */

    showWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        if (!modal) return;

        // Populate stats from history
        const stats = this.getQuickStats();
        const welcomeStreak = document.getElementById('welcomeStreak');
        const welcomeToday = document.getElementById('welcomeToday');
        const welcomeTotal = document.getElementById('welcomeTotal');

        if (welcomeStreak) welcomeStreak.textContent = stats.streak || 0;
        if (welcomeToday) welcomeToday.textContent = stats.today || 0;
        if (welcomeTotal) welcomeTotal.textContent = stats.total || 0;

        // Show modal with animation
        modal.classList.add('active');

        // Bind welcome modal events
        this.bindWelcomeModalEvents();

        console.log('🙏 Welcome modal shown');
    }

    hideWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    bindWelcomeModalEvents() {
        const startBtn = document.getElementById('welcomeStartBtn');
        const dismissBtn = document.getElementById('welcomeDismissBtn');
        const backdrop = document.querySelector('#welcomeModal .welcome-backdrop');

        if (startBtn) {
            startBtn.onclick = () => {
                this.hideWelcomeModal();
                // Start a manual session
                setTimeout(() => {
                    if (this.ritualEngine) {
                        this.ritualEngine.triggerManualSession(this.config.duration || 2, true);
                    }
                }, 300);
            };
        }

        if (dismissBtn) {
            dismissBtn.onclick = () => {
                this.hideWelcomeModal();
            };
        }

        if (backdrop) {
            backdrop.onclick = () => {
                this.hideWelcomeModal();
            };
        }
    }

    getQuickStats() {
        const today = this.getTodayString();
        const todayHistory = (this.history.daily && this.history.daily[today]) || { completed: 0, total: 0 };

        return {
            streak: this.history.currentStreak || 0,
            today: todayHistory.completed || 0,
            total: this.history.totalCompleted || 0
        };
    }

    /* ═════════════════════════════════════════════════════════════════════════
       ENABLE/DISABLE SYSTEM
    ═════════════════════════════════════════════════════════════════════════ */

    async enable() {
        this.config.enabled = true;
        this.saveConfig();

        // Update UI state
        document.body.classList.remove('disabled-state');
        document.getElementById('toggleStatusText').textContent = 'Active';

        // Request notification permission
        if ('Notification' in window && Notification.permission !== 'granted') {
            await Notification.requestPermission();
        }

        // Generate schedule for today
        this.generateDailySchedule();

        // Start countdown updates
        this.startCountdownUpdates();

        // Schedule hourly refresh
        this.scheduleHourlyRefresh();

        // ═══ SCHEDULE NOTIFICATIONS for upcoming sessions ═══
        this.scheduleUpcomingNotifications();

        // ═══ REGISTER PERIODIC BACKGROUND SYNC for reliable background alarms ═══
        this.registerPeriodicBackgroundSync();

        // Update all UI
        this.updateUI();

        this.showToast('Naam Abhyas enabled! 🙏', 'success');
    }

    /**
     * Register periodic background sync to wake Service Worker for alarm checks
     * This is critical for background alarm reliability when app is closed
     */
    async registerPeriodicBackgroundSync() {
        if (!('serviceWorker' in navigator)) {
            console.log('[NaamAbhyas] Service Worker not supported, skipping periodic sync');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Check if periodicSync is supported
            if ('periodicSync' in registration) {
                // Register for Naam Abhyas alarm checks every minute minimum
                await registration.periodicSync.register('anhad-notification-check', {
                    minInterval: 60 * 1000 // 1 minute minimum
                });
                console.log('[NaamAbhyas] ✅ Periodic background sync registered (alarms will fire even when closed!)');
            } else {
                console.log('[NaamAbhyas] Periodic sync not supported, relying on IndexedDB + SW wake events');
            }
        } catch (err) {
            console.warn('[NaamAbhyas] Failed to register periodic sync:', err);
            // Continue - alarms will still work via IndexedDB when SW wakes for other reasons
        }
    }

    /**
     * Schedule notifications for all upcoming sessions
     * This ensures reminders work even when app is in background
     * Uses both local setTimeout AND Service Worker for maximum reliability
     */
    scheduleUpcomingNotifications() {
        // Local notification engine (setTimeout-based, works while page is open)
        if (this.notificationEngine) {
            this.notificationEngine.cancelAll();
        }

        const now = new Date();
        const today = now.toDateString();
        const currentHour = now.getHours();

        // Schedule notifications for each pending session
        Object.entries(this.currentSchedule).forEach(([hour, session]) => {
            const hourNum = parseInt(hour);

            // Only schedule future sessions
            if (hourNum > currentHour && session.status === 'pending') {
                // 1. Local notification engine (fallback, foreground only)
                if (this.notificationEngine) {
                    this.notificationEngine.scheduleSessionNotifications(
                        {
                            hour: hourNum,
                            startMinute: session.startMinute,
                            endMinute: session.endMinute,
                            startTime: session.startTime,
                            endTime: session.endTime
                        },
                        this.config.notifications
                    );
                }

                // 2. Service Worker notification (persistent, works in background)
                this.scheduleServiceWorkerNotification(session, hourNum, today);
            }
        });

        console.log('🔔 Scheduled notifications for upcoming sessions (local + SW)');
    }

    /**
     * Schedule a notification via Service Worker for persistent background delivery
     * AND native Capacitor notifications for mobile (works even when app is closed!)
     */
    scheduleServiceWorkerNotification(session, hour, today) {
        try {
            const scheduledTime = new Date();
            scheduledTime.setHours(hour, session.startMinute, 0, 0);

            // Only schedule if in the future
            if (scheduledTime <= new Date()) {
                return;
            }

            const notificationId = `naam_${hour}_${session.startMinute}`;
            const title = '🙏 ਨਾਮ ਅਭਿਆਸ ਦਾ ਸਮਾਂ';
            const body = `Leave all work. Remember Vaheguru for ${this.config.duration || 2} minutes.`;

            // Build notification payload
            const notificationPayload = {
                id: notificationId,
                title: title,
                body: body,
                scheduledTime: scheduledTime.getTime(),
                tag: `naam-abhyas-${today}-${hour}`,
                requireInteraction: true,
                actions: [
                    { action: 'start', title: '🙏 Start Now' },
                    { action: 'dismiss', title: 'Skip' }
                ],
                data: {
                    url: '/NaamAbhyas/naam-abhyas.html',
                    type: 'naamAbhyas',
                    hour: hour,
                    startMinute: session.startMinute
                }
            };

            // 1. NATIVE MOBILE (Capacitor) - Works when app is completely closed!
            if (window.NativeNotifications?.isNativePlatform()) {
                window.NativeNotifications.schedule({
                    id: notificationId,
                    title: title,
                    body: body,
                    at: scheduledTime,
                    recurring: false,
                    data: notificationPayload.data
                }).then(success => {
                    if (success) {
                        console.log(`[NaamAbhyas] ✅ NATIVE notification scheduled for ${session.startTime} (works when closed!)`);
                    }
                });
            }

            // 2. SERVICE WORKER (Web) - Works when browser tab is closed but browser is running
            this.scheduleViaSW(notificationPayload, session.startTime);

            // 3. ELECTRON DESKTOP - Works when minimized to system tray!
            if (window.electronAPI?.isElectron) {
                window.electronAPI.scheduleNotification({
                    id: notificationId,
                    title: title,
                    body: body,
                    scheduledTime: scheduledTime.getTime(),
                    url: '/NaamAbhyas/naam-abhyas.html'
                });
                console.log(`[NaamAbhyas] ✅ ELECTRON notification scheduled for ${session.startTime} (works in tray!)`);
            }
        } catch (error) {
            console.warn('[NaamAbhyas] Failed to schedule notification:', error);
        }
    }

    /**
     * Schedule notification via Service Worker
     * Uses controller if available, otherwise waits for SW ready
     */
    async scheduleViaSW(payload, sessionTime) {
        if (!('serviceWorker' in navigator)) {
            console.log('[NaamAbhyas] Service Worker not supported');
            return;
        }

        // ─── STEP 1: Persist to IndexedDB for background resilience ───
        try {
            await this.saveAlarmToIndexedDB(payload);
            console.log(`[NaamAbhyas] 💾 Alarm persisted to IndexedDB for ${sessionTime}`);
        } catch (dbError) {
            console.warn('[NaamAbhyas] Failed to save to IndexedDB:', dbError);
            // Continue - we'll still try the SW approach
        }

        // ─── STEP 2: Also notify Service Worker for immediate scheduling ───
        try {
            // Try using controller first (faster if available)
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SCHEDULE_NOTIFICATION',
                    payload: payload
                });
                console.log(`[NaamAbhyas] ✅ SW notification scheduled for ${sessionTime}`);
                return;
            }

            // Fallback: wait for SW to be ready
            const registration = await navigator.serviceWorker.ready;
            if (registration.active) {
                registration.active.postMessage({
                    type: 'SCHEDULE_NOTIFICATION',
                    payload: payload
                });
                console.log(`[NaamAbhyas] ✅ SW notification scheduled (via ready) for ${sessionTime}`);
            }
        } catch (error) {
            console.warn('[NaamAbhyas] Failed to schedule via SW:', error);
        }
    }

    /**
     * Save alarm to IndexedDB for Service Worker background access
     * This allows the SW to fire notifications even when the app is closed
     */
    async saveAlarmToIndexedDB(payload) {
        return new Promise((resolve, reject) => {
            const DB_NAME = 'GurbaniRadioSW';
            const DB_VERSION = 2;
            const STORE_NAME = 'notification_schedule';

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);

                // Create alarm entry
                const scheduledTime = payload.scheduledTime || Date.now();
                const alarmId = payload.id || `naam_${payload.data?.hour || 0}_${payload.data?.startMinute || 0}_${Date.now()}`;

                const entry = {
                    id: alarmId,
                    title: payload.title || '🙏 ਨਾਮ ਅਭਿਆਸ | Naam Abhyas',
                    body: payload.body || `Leave all work. Remember Vaheguru for ${payload.data?.duration || 2} minutes.`,
                    scheduledTime: scheduledTime,
                    hour: payload.data?.hour || 0,
                    startMinute: payload.data?.startMinute || 0,
                    duration: payload.data?.duration || 2,
                    fired: false,
                    createdAt: Date.now(),
                    data: payload.data || {},
                    tag: payload.tag || `naam-abhyas-${new Date().toLocaleDateString('en-CA')}-${payload.data?.hour || 0}`
                };

                const putRequest = store.put(entry);
                putRequest.onsuccess = () => {
                    db.close();
                    resolve();
                };
                putRequest.onerror = () => {
                    db.close();
                    reject(putRequest.error);
                };
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('scheduledTime', 'scheduledTime', { unique: false });
                    store.createIndex('fired', 'fired', { unique: false });
                }
            };
        });
    }

    disable() {
        this.config.enabled = false;
        this.saveConfig();

        // Update UI state
        document.body.classList.add('disabled-state');
        document.getElementById('toggleStatusText').textContent = 'Currently disabled';

        // Stop countdown updates
        this.stopCountdownUpdates();

        // Clear hourly refresh
        if (this.hourlyRefreshTimeout) {
            clearTimeout(this.hourlyRefreshTimeout);
        }

        // ═══ CLEAR INDEXEDDB ALARMS from Service Worker ═══
        this.clearSWAlarms();

        // Update UI
        this.updateUI();

        this.showToast('Naam Abhyas disabled', 'info');
    }

    /**
     * Clear all Naam Abhyas alarms from Service Worker IndexedDB
     * Called when disabling Naam Abhyas to prevent stale alarms
     */
    clearSWAlarms() {
        if (!('serviceWorker' in navigator)) return;

        try {
            // Notify Service Worker to clear all Naam alarms from IndexedDB
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CLEAR_NAAM_ALARMS'
                });
                console.log('[NaamAbhyas] Sent CLEAR_NAAM_ALARMS to SW');
            }
        } catch (err) {
            console.warn('[NaamAbhyas] Failed to clear SW alarms:', err);
        }
    }

    /* ═════════════════════════════════════════════════════════════════════════
       THEME MANAGEMENT
    ═════════════════════════════════════════════════════════════════════════ */

    applyTheme() {
        if (this.themeEngine) {
            this.themeEngine.applyTheme(this.config.theme || 'system');
        }
    }

    /* ═════════════════════════════════════════════════════════════════════════
       SCHEDULE GENERATION
    ═════════════════════════════════════════════════════════════════════════ */

    generateDailySchedule() {
        const now = new Date();
        const startHour = this.config.activeHours.start;
        const endHour = this.config.activeHours.end;
        const today = this.getTodayString();

        // Check if we already have a schedule for today
        if (this.history.scheduleHistory && this.history.scheduleHistory[today]) {
            this.currentSchedule = this.history.scheduleHistory[today];
            console.log('📅 Using existing schedule for today');

            // --- BUG FIX: Cleanup sessions outside current active hours ---
            let cleaned = false;
            Object.keys(this.currentSchedule).forEach(hour => {
                const hourNum = parseInt(hour);
                if (hourNum < startHour || hourNum > endHour) {
                    delete this.currentSchedule[hour];
                    cleaned = true;
                }
            });

            // Fill in missing hours if any
            for (let hour = startHour; hour <= endHour; hour++) {
                if (!this.currentSchedule[hour]) {
                    this.currentSchedule[hour] = this.generateRandomTimeForHour(hour);
                    cleaned = true;
                }
            }

            if (cleaned) {
                this.history.scheduleHistory[today] = this.currentSchedule;
                this.saveHistory();
            }
            // -------------------------------------------------------------

            // Ensure refresher count exists for today (migration for existing data)
            if (typeof this.history.dailyRefreshes === 'undefined') {
                this.history.dailyRefreshes = {};
            }
            if (typeof this.history.dailyRefreshes[today] === 'undefined') {
                this.history.dailyRefreshes[today] = 0;
            }
        } else {
            // Generate new schedule
            this.currentSchedule = {};

            console.log(`📅 Generating new schedule from ${startHour}:00 to ${endHour}:00`);

            for (let hour = startHour; hour <= endHour; hour++) {
                this.currentSchedule[hour] = this.generateRandomTimeForHour(hour);
            }

            // Save to history
            if (!this.history.scheduleHistory) {
                this.history.scheduleHistory = {};
            }
            this.history.scheduleHistory[today] = this.currentSchedule;

            // Initialize refresh count
            if (!this.history.dailyRefreshes) {
                this.history.dailyRefreshes = {};
            }
            this.history.dailyRefreshes[today] = 0;

            this.saveHistory();
        }

        this.renderScheduleTimeline();
        this.updateRefreshButtonState();
    }

    regenerateSchedule() {
        const today = this.getTodayString();

        // 1. Check Refresh Limit
        if (!this.history.dailyRefreshes) {
            this.history.dailyRefreshes = {};
        }

        const refreshesUsed = this.history.dailyRefreshes[today] || 0;
        const REFRESH_LIMIT = 1; // Strict limit: 1 refresh per day

        if (refreshesUsed >= REFRESH_LIMIT) {
            this.showToast('Daily refresh limit reached (1/day)', 'info');
            this.updateRefreshButtonState();
            return;
        }

        const now = new Date();
        const currentHour = now.getHours();
        const startHour = this.config.activeHours.start;
        const endHour = this.config.activeHours.end;

        // 2. Cleanup and Regenerate
        // Cleanup hours that are no longer active
        Object.keys(this.currentSchedule).forEach(hour => {
            const h = parseInt(hour);
            if (h < startHour || h > endHour) {
                delete this.currentSchedule[hour];
            }
        });

        // Regenerate future sessions
        let modifiedCount = 0;

        for (let hour = Math.max(startHour, currentHour + 1); hour <= endHour; hour++) {
            // Preservation check: If a future session was somehow already completed (unlikely but safe), skip it
            if (this.currentSchedule[hour] && this.currentSchedule[hour].status === 'completed') {
                continue;
            }

            this.currentSchedule[hour] = this.generateRandomTimeForHour(hour);
            modifiedCount++;
        }

        // Fill in missing hours that might have been skipped due to currentHour logic but are within active range
        for (let hour = startHour; hour <= endHour; hour++) {
            if (!this.currentSchedule[hour]) {
                this.currentSchedule[hour] = this.generateRandomTimeForHour(hour);
                modifiedCount++;
            }
        }

        if (modifiedCount === 0) {
            this.showToast('No future sessions to refresh', 'info');
            return;
        }

        // Increment refresh count
        this.history.dailyRefreshes[today] = refreshesUsed + 1;

        // Save to history
        if (!this.history.scheduleHistory) {
            this.history.scheduleHistory = {};
        }
        this.history.scheduleHistory[today] = this.currentSchedule;
        this.saveHistory();

        this.renderScheduleTimeline();
        this.updateNextSession();
        this.updateRefreshButtonState();

        const remaining = REFRESH_LIMIT - (refreshesUsed + 1);
        this.showToast(`Schedule updated. ${remaining} refreshes left today.`, 'success');
    }

    updateRefreshButtonState() {
        const refreshBtn = document.getElementById('refreshScheduleBtn');
        if (!refreshBtn) return;

        const today = this.getTodayString();
        const refreshesUsed = (this.history.dailyRefreshes && this.history.dailyRefreshes[today]) || 0;
        const REFRESH_LIMIT = 1;

        if (refreshesUsed >= REFRESH_LIMIT) {
            refreshBtn.classList.add('disabled');
            refreshBtn.style.opacity = '0.5';
            refreshBtn.style.cursor = 'not-allowed';
            refreshBtn.title = 'Daily refresh limit reached';
        } else {
            refreshBtn.classList.remove('disabled');
            refreshBtn.style.opacity = '1';
            refreshBtn.style.cursor = 'pointer';
            refreshBtn.title = 'Refresh future schedule';
        }
    }

    generateRandomTimeForHour(hour) {
        // Enforce active hours bounds check
        const startHour = this.config.activeHours.start || 5;
        const endHour = this.config.activeHours.end || 22;

        if (hour < startHour || hour > endHour) {
            console.warn(`[NaamAbhyas] Attempted to generate session for hour ${hour} which is outside active hours (${startHour}-${endHour})`);
            return null;
        }

        // Generate random minute between 5 and 53 (avoiding edges)
        const randomMinute = Math.floor(Math.random() * 48) + 5;

        return {
            hour: hour,
            startMinute: randomMinute,
            endMinute: randomMinute + this.config.duration,
            startTime: this.formatTime12h(hour, randomMinute),
            endTime: this.formatTime12h(hour, randomMinute + this.config.duration),
            status: 'pending' // pending, completed, skipped
        };
    }

    /**
     * Requirement: Issue 2 - Always calculate next valid session respecting active hours
     */
    calculateNextSession() {
        const now = new Date();
        let nextSession = this.getNextScheduledSession();

        // If no more sessions today, look for tomorrow's first
        if (!nextSession) {
            const startHour = this.config.activeHours.start || 5;
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(startHour, 0, 0, 0);
            return tomorrow;
        }

        const nextTime = new Date();
        nextTime.setHours(nextSession.hour, nextSession.startMinute, 0, 0);

        // Enforce active hours
        const nextHour = nextTime.getHours();
        const startHour = this.config.activeHours.start || 5;
        const endHour = this.config.activeHours.end || 22;

        if (nextHour < startHour) {
            nextTime.setHours(startHour, 0, 0, 0);
        } else if (nextHour >= endHour) {
            nextTime.setDate(nextTime.getDate() + 1);
            nextTime.setHours(startHour, 0, 0, 0);
        }

        return nextTime;
    }

    /* ═════════════════════════════════════════════════════════════════════════
       COUNTDOWN & SCHEDULING
    ═════════════════════════════════════════════════════════════════════════ */

    startCountdownUpdates() {
        // Update immediately
        this.updateCountdown();

        // Then update every second
        this.countdownInterval = setInterval(() => {
            this.updateCountdown();
        }, 1000);
    }

    stopCountdownUpdates() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    updateCountdown() {
        const nextTime = this.calculateNextSession();
        const now = new Date();
        const diff = nextTime - now;

        if (diff <= 0) {
            // Time to start!
            const nextSession = this.getNextScheduledSession();
            if (nextSession && !this.sessionAlertTriggeredFor) {
                // Guard: Track which session was triggered to prevent repeated alerts
                this.sessionAlertTriggeredFor = `${nextSession.hour}_${nextSession.startMinute}`;
                this.triggerSessionAlert(nextSession);

                // Reset the guard after the session window ends (duration + 1 minute buffer)
                const resetDelay = ((this.config.duration || 2) + 1) * 60 * 1000;
                setTimeout(() => {
                    this.sessionAlertTriggeredFor = null;
                }, resetDelay);
            }
            return;
        }

        // Clear trigger guard if we're waiting for a new session
        const nextSession = this.getNextScheduledSession();
        if (nextSession) {
            const sessionKey = `${nextSession.hour}_${nextSession.startMinute}`;
            if (this.sessionAlertTriggeredFor && this.sessionAlertTriggeredFor !== sessionKey) {
                this.sessionAlertTriggeredFor = null;
            }
        }

        // Update display
        if (nextSession) {
            document.getElementById('nextSessionTime').textContent = nextSession.startTime;
            document.getElementById('countdownValue').textContent = this.formatCountdown(diff);
            document.getElementById('nextSessionSubtitle').textContent = `${nextSession.startTime} - ${nextSession.endTime}`;
        } else {
            // Tomorrow's session
            const startHour = this.config.activeHours.start || 5;
            document.getElementById('nextSessionTime').textContent = this.formatTime12h(startHour, 0);
            document.getElementById('countdownValue').textContent = this.formatCountdown(diff);
            document.getElementById('nextSessionSubtitle').textContent = 'Starting fresh tomorrow morning';
        }
    }

    formatCountdown(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    getNextScheduledSession() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const startHour = this.config.activeHours.start;
        const endHour = this.config.activeHours.end;

        // First, mark any past sessions as missed (if they're still pending)
        for (let hour = startHour; hour < currentHour; hour++) {
            const session = this.currentSchedule[hour];
            if (session && session.status === 'pending') {
                session.status = 'missed';
                console.log(`[NaamAbhyas] Auto-marked hour ${hour} as missed`);
            }
        }

        // Check current hour - if session time has passed, mark as missed
        const currentHourSession = this.currentSchedule[currentHour];
        if (currentHourSession && currentHourSession.status === 'pending') {
            if (currentHourSession.startMinute + (this.config.duration || 2) < currentMinute) {
                // Session window has fully passed
                currentHourSession.status = 'missed';
                console.log(`[NaamAbhyas] Auto-marked current hour ${currentHour} as missed (session was at ${currentHourSession.startMinute})`);
            }
        }

        // Now search for next pending session
        for (let hour = currentHour; hour <= endHour; hour++) {
            const session = this.currentSchedule[hour];
            if (session && session.status === 'pending') {
                // For current hour, check if session hasn't started yet
                if (hour === currentHour) {
                    // Session is valid if its start time is in the future
                    if (session.startMinute > currentMinute) {
                        return session;
                    }
                    // Or if we're within the session window
                    if (session.startMinute <= currentMinute && currentMinute < session.startMinute + (this.config.duration || 2)) {
                        return session;
                    }
                } else {
                    // Future hour's session
                    return session;
                }
            }
        }

        return null;
    }

    scheduleHourlyRefresh() {
        const now = new Date();
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1, 0, 0, 0);
        const timeUntilNextHour = nextHour - now;

        this.hourlyRefreshTimeout = setTimeout(() => {
            this.onNewHour();
            // Schedule again
            this.scheduleHourlyRefresh();
        }, timeUntilNextHour);
    }

    onNewHour() {
        const now = new Date();
        const currentHour = now.getHours();

        // Check if we need a new day's schedule
        if (currentHour === 0) {
            this.generateDailySchedule();
        }

        // Update UI
        this.updateUI();
    }

    checkForMissedSessions() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const today = this.getTodayString();

        // Mark past sessions as skipped if not completed
        for (let hour = this.config.activeHours.start; hour < currentHour; hour++) {
            const session = this.currentSchedule[hour];
            if (session && session.status === 'pending') {
                session.status = 'skipped';

                // Record in history
                this.recordSession({
                    hour: hour,
                    startTime: session.startTime,
                    status: 'skipped',
                    skipReason: 'missed'
                });
            }
        }

        // Check current hour
        const currentSession = this.currentSchedule[currentHour];
        if (currentSession && currentSession.status === 'pending') {
            if (currentMinute > currentSession.endMinute) {
                currentSession.status = 'skipped';
                this.recordSession({
                    hour: currentHour,
                    startTime: currentSession.startTime,
                    status: 'skipped',
                    skipReason: 'missed'
                });
            }
        }

        this.saveHistory();
        this.renderScheduleTimeline();
    }

    /* ═════════════════════════════════════════════════════════════════════════
       SESSION HANDLING
    ═════════════════════════════════════════════════════════════════════════ */

    triggerSessionAlert(session) {
        console.log('[NaamAbhyas] 🔔 triggerSessionAlert called for session:', session);

        // Store session reference
        this.currentAlertSession = session;

        // 1. FIRST - Play sound and vibrate to get attention
        if (this.config.notifications?.soundEnabled) {
            this.playNotificationSound();
        }
        if (this.config.notifications?.vibration && navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }

        // 2. Show browser notification (works even in background via Service Worker)
        this.showBrowserNotification('🙏 Time for Naam Abhyas', {
            body: `Leave all work. Remember Vaheguru for ${this.config.duration || 2} minutes.`,
            tag: 'naam-abhyas-session',
            requireInteraction: true,
            data: {
                url: '/NaamAbhyas/naam-abhyas.html',
                type: 'naamAbhyas',
                hour: session.hour,
                startMinute: session.startMinute,
                timestamp: Date.now()
            }
        });

        // 3. Show the SESSION ALERT MODAL (user must click to start timer)
        // Flow: Notification → Popup → User clicks "Start Now" → Timer starts
        this.showAlertModal(session);

        console.log('[NaamAbhyas] ✅ Alert modal shown - waiting for user to click Start');
    }

    showAlertModal(session) {
        const modal = document.getElementById('sessionAlertModal');
        if (modal) {
            modal.classList.add('active');

            // Update message with correct duration
            const message = modal.querySelector('.alert-message');
            if (message) {
                message.innerHTML = `Leave all work. Close your eyes.<br>Remember Vaheguru for ${this.config.duration} minutes.`;
            }
        }

        // Store current session reference
        this.currentAlertSession = session;
    }

    hideAlertModal() {
        const modal = document.getElementById('sessionAlertModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async startMeditation() {
        const session = this.currentAlertSession || this.getNextScheduledSession();
        if (!session) return;

        // Mark session as in progress
        session.status = 'in_progress';
        session.startedAt = new Date().toISOString();

        // Show meditation overlay
        const overlay = document.getElementById('meditationOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }

        // Keep screen awake if possible
        await this.requestWakeLock();

        // Play start bell
        if (this.config.notifications.soundEnabled) {
            this.playSound('start-bell');
        }

        // Start timer
        const duration = this.config.duration * 60; // seconds
        let remaining = duration;

        const timerDisplay = document.getElementById('timerDisplay');
        const progressBar = document.getElementById('timerProgressBar');

        this.activeTimer = setInterval(() => {
            remaining--;

            // Update display
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            if (timerDisplay) {
                timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }

            // Update progress
            const progress = ((duration - remaining) / duration) * 100;
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }

            // Timer complete
            if (remaining <= 0) {
                this.completeMeditation(session);
            }
        }, 1000);
    }

    async completeMeditation(session) {
        // Clear timer
        if (this.activeTimer) {
            clearInterval(this.activeTimer);
            this.activeTimer = null;
        }

        // Release wake lock
        this.releaseWakeLock();

        // Play completion bell
        if (this.config.notifications.soundEnabled) {
            this.playSound('end-bell');
        }

        // Vibrate completion
        if (this.config.notifications.vibration && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }

        // Update session status
        session.status = 'completed';
        session.endedAt = new Date().toISOString();
        session.endedEarly = false;

        // Update schedule
        if (this.currentSchedule[session.hour]) {
            this.currentSchedule[session.hour].status = 'completed';
        }

        // Record in history
        this.recordSession({
            hour: session.hour,
            startTime: session.startTime,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            duration: this.config.duration * 60,
            status: 'completed',
            endedEarly: false
        });

        // Update streak
        this.updateStreak();

        // Hide meditation overlay
        const overlay = document.getElementById('meditationOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }

        // Show completion modal
        this.showCompletionModal();

        // Update UI
        this.updateUI();

        // Check achievements
        this.checkAchievements();
    }

    endMeditationEarly() {
        const session = this.currentAlertSession || { hour: new Date().getHours() };

        // Clear timer
        if (this.activeTimer) {
            clearInterval(this.activeTimer);
            this.activeTimer = null;
        }

        // Release wake lock
        this.releaseWakeLock();

        // Calculate actual duration
        const timerDisplay = document.getElementById('timerDisplay');
        let actualDuration = this.config.duration * 60;
        if (timerDisplay) {
            const [mins, secs] = timerDisplay.textContent.split(':').map(Number);
            const remaining = mins * 60 + secs;
            actualDuration = (this.config.duration * 60) - remaining;
        }

        // Update session
        session.status = 'completed';
        session.endedEarly = true;
        session.actualDuration = actualDuration;

        // Record
        this.recordSession({
            hour: session.hour,
            startTime: session.startTime,
            duration: actualDuration,
            status: 'completed',
            endedEarly: true
        });

        // Update streak
        this.updateStreak();

        // Hide overlay
        const overlay = document.getElementById('meditationOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }

        // Update UI
        this.updateUI();

        this.showToast('Session ended early', 'info');
    }

    skipCurrentSession() {
        const session = this.currentAlertSession || this.getNextScheduledSession();
        if (!session) return;

        // Update session status
        session.status = 'skipped';

        // Update schedule
        if (this.currentSchedule[session.hour]) {
            this.currentSchedule[session.hour].status = 'skipped';
        }

        // Record in history
        this.recordSession({
            hour: session.hour,
            startTime: session.startTime,
            status: 'skipped',
            skipReason: 'user_skip'
        });

        // Reset streak
        this.history.statistics.currentStreak = 0;
        this.saveHistory();

        // Update UI  
        this.updateUI();

        this.showToast('Session skipped', 'warning');
    }

    recordSession(sessionData) {
        const session = {
            id: `session_${Date.now()}`,
            date: this.getTodayString(),
            ...sessionData,
            recordedAt: new Date().toISOString()
        };

        this.history.sessions.push(session);

        // Initialize extra session tracking if needed
        if (!this.history.statistics.extraSessions) {
            this.history.statistics.extraSessions = 0;
        }
        if (!this.history.statistics.extraTimeSeconds) {
            this.history.statistics.extraTimeSeconds = 0;
        }

        // Update statistics based on session type
        if (session.status === 'completed') {
            this.history.statistics.totalSessions++;
            this.history.statistics.completedSessions++;
            this.history.statistics.totalTimeSeconds += session.duration || (this.config.duration * 60);

            // Track extra sessions separately
            if (session.isExtra) {
                this.history.statistics.extraSessions++;
                this.history.statistics.extraTimeSeconds += session.duration || (this.config.duration * 60);
            }
        } else {
            this.history.statistics.skippedSessions++;
        }

        // Calculate completion rate (only for scheduled sessions, not extra)
        const scheduledCompleted = this.history.statistics.completedSessions - (this.history.statistics.extraSessions || 0);
        const scheduledSkipped = this.history.statistics.skippedSessions;
        const scheduledTotal = scheduledCompleted + scheduledSkipped;
        this.history.statistics.completionRate = scheduledTotal > 0
            ? scheduledCompleted / scheduledTotal
            : 0;

        // Record to Discipline Metrics for enhanced KPI tracking
        if (this.disciplineMetrics) {
            this.disciplineMetrics.recordSession(session);
        }

        this.saveHistory();
    }

    updateStreak() {
        this.history.statistics.currentStreak++;

        if (this.history.statistics.currentStreak > this.history.statistics.longestStreak) {
            this.history.statistics.longestStreak = this.history.statistics.currentStreak;
        }

        this.saveHistory();
    }

    /* ═════════════════════════════════════════════════════════════════════════
       UI UPDATES
    ═════════════════════════════════════════════════════════════════════════ */

    updateUI() {
        this.updateNextSession();
        this.renderScheduleTimeline();
        this.updateStats();
        this.updateAchievements();
        this.updateProgressDots();
        this.updateRefreshButtonState();
    }

    updateNextSession() {
        const nextTime = this.calculateNextSession();
        const nextSession = this.getNextScheduledSession();
        const timeEl = document.getElementById('nextSessionTime');
        const subtitleEl = document.getElementById('nextSessionSubtitle');
        const countdownEl = document.getElementById('countdownValue');

        if (!nextSession) {
            const startHour = this.config.activeHours.start || 5;
            if (timeEl) timeEl.textContent = this.formatTime12h(startHour, 0);
            if (subtitleEl) subtitleEl.textContent = 'Great job! See you tomorrow morning 🌟';
            if (countdownEl) {
                const now = new Date();
                countdownEl.textContent = this.formatCountdown(nextTime - now);
            }
        } else {
            if (timeEl) timeEl.textContent = nextSession.startTime;
            if (subtitleEl) subtitleEl.textContent = `${nextSession.startTime} - ${nextSession.endTime}`;
        }
    }

    renderScheduleTimeline() {
        const container = document.getElementById('scheduleTimeline');
        if (!container) return;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        let html = '';

        for (let hour = this.config.activeHours.start; hour <= this.config.activeHours.end; hour++) {
            const session = this.currentSchedule[hour];
            if (!session) continue;

            let statusClass = 'pending';
            let statusIcon = '';

            if (session.status === 'completed') {
                statusClass = 'completed';
                statusIcon = '✓';
            } else if (session.status === 'skipped') {
                statusClass = 'skipped';
                statusIcon = '✗';
            } else if (hour === currentHour) {
                // Check if current hour session time has passed
                if (session.endMinute !== undefined && currentMinute > session.endMinute) {
                    statusClass = 'missed';
                    statusIcon = '✗';
                } else {
                    statusClass = 'current';
                    statusIcon = '●';
                }
            } else if (hour < currentHour) {
                // Past hour with pending status = MISSED
                statusClass = 'missed';
                statusIcon = '✗';
            } else {
                statusClass = 'upcoming';
            }

            html += `
                <div class="schedule-item ${statusClass}">
                    <div class="schedule-status ${statusClass}">${statusIcon}</div>
                    <div class="schedule-time">
                        <div class="schedule-time-value">${session.startTime}</div>
                        <div class="schedule-time-range">for ${this.config.duration} min</div>
                    </div>
                    <div class="schedule-hour">${hour}:00</div>
                </div>
            `;
        }

        if (!html) {
            html = '<div class="schedule-empty"><p>Enable Naam Abhyas to see your schedule</p></div>';
        }

        container.innerHTML = html;
    }

    updateProgressDots() {
        const container = document.getElementById('progressDots');
        if (!container) return;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        let completed = 0;
        let total = 0;
        let html = '';

        for (let hour = this.config.activeHours.start; hour <= this.config.activeHours.end; hour++) {
            const session = this.currentSchedule[hour];
            if (!session) continue;

            total++;
            let dotClass = 'progress-dot';

            if (session.status === 'completed') {
                dotClass += ' completed';
                completed++;
            } else if (session.status === 'skipped') {
                dotClass += ' skipped';
            } else if (hour === currentHour) {
                // Check if current hour session time has passed
                if (session.endMinute !== undefined && currentMinute > session.endMinute) {
                    dotClass += ' missed';
                } else {
                    dotClass += ' current';
                }
            } else if (hour < currentHour) {
                // Past hour with pending status = MISSED
                dotClass += ' missed';
            }

            html += `<div class="${dotClass}" title="${session.startTime}"></div>`;
        }

        container.innerHTML = html;

        // Update counts
        const completedEl = document.getElementById('completedCount');
        const totalEl = document.getElementById('totalCount');
        if (completedEl) completedEl.textContent = completed;
        if (totalEl) totalEl.textContent = total;
    }

    updateStats() {
        const stats = this.history.statistics;
        const today = this.getTodayString();

        // Today's completed
        const todaysSessions = this.history.sessions.filter(s =>
            s.date === today && s.status === 'completed'
        ).length;

        // Calculate expected sessions today
        const totalHoursToday = (this.config.activeHours.end - this.config.activeHours.start) + 1;
        const currentHour = new Date().getHours();
        const passedSlots = Math.max(0, Math.min(currentHour - this.config.activeHours.start + 1, totalHoursToday));

        // Update basic UI elements
        this.setTextContent('currentStreak', stats.currentStreak);
        this.setTextContent('todayCompleted', todaysSessions);
        this.setTextContent('longestStreak', stats.longestStreak || 0);

        // Format total time
        const totalMinutes = Math.floor(stats.totalTimeSeconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        this.setTextContent('totalTime', timeStr);

        // === ENHANCED DISCIPLINE DASHBOARD ===

        // Completion Rate Ring
        const completionRate = this.disciplineMetrics ?
            parseFloat(this.disciplineMetrics.getCompletionRate().toFixed(0)) :
            (stats.completionRate * 100).toFixed(0);

        this.setTextContent('completionRateValue', Math.round(completionRate));

        // Update ring visual
        const circumference = 2 * Math.PI * 40; // r=40
        const offset = circumference * (1 - completionRate / 100);
        const ringFill = document.getElementById('completionRingFill');
        if (ringFill) {
            ringFill.style.strokeDashoffset = offset;
        }

        // Today's Progress Bar
        const todayProgressValue = document.getElementById('todayProgressValue');
        const todayProgressFill = document.getElementById('todayProgressFill');
        if (todayProgressValue) {
            todayProgressValue.textContent = `${todaysSessions}/${passedSlots}`;
        }
        if (todayProgressFill) {
            const progressPercent = passedSlots > 0 ? (todaysSessions / passedSlots) * 100 : 0;
            todayProgressFill.style.width = `${progressPercent}%`;
        }

        // Weekly Stats
        if (this.disciplineMetrics) {
            const weeklySnapshot = this.disciplineMetrics.getWeeklySnapshot();
            this.setTextContent('weeklyMinutes', Math.round(weeklySnapshot.totalMinutes));
            this.setTextContent('perfectDaysCount', weeklySnapshot.perfectDays);
        } else {
            this.setTextContent('weeklyMinutes', totalMinutes);
            this.setTextContent('perfectDaysCount', 0);
        }

        // Perfect Day Indicator
        const perfectIndicator = document.getElementById('perfectDayIndicator');
        if (perfectIndicator) {
            const isPerfectPossible = passedSlots > 0 && todaysSessions === passedSlots;
            perfectIndicator.classList.toggle('hidden', !isPerfectPossible);
        }

        // Dashboard subtitle update
        const dashboardSubtitle = document.getElementById('dashboardSubtitle');
        if (dashboardSubtitle) {
            if (stats.currentStreak >= 5) {
                dashboardSubtitle.textContent = `🔥 ${stats.currentStreak} hour streak! Keep going!`;
            } else if (todaysSessions === passedSlots && passedSlots > 0) {
                dashboardSubtitle.textContent = '🌟 Perfect discipline today!';
            } else {
                dashboardSubtitle.textContent = 'Discipline thrives on visibility';
            }
        }
    }

    updateAchievements() {
        const unlockedCount = this.history.achievements ? this.history.achievements.length : 0;
        this.setTextContent('achievementsUnlocked', `${unlockedCount} unlocked`);

        // Update achievement badges
        const badges = document.querySelectorAll('.achievement-badge');
        badges.forEach(badge => {
            const id = badge.dataset.id;
            const isUnlocked = this.history.achievements &&
                this.history.achievements.find(a => a.id === id);

            if (isUnlocked) {
                badge.classList.remove('locked');
                badge.classList.add('unlocked');
            }
        });
    }

    setTextContent(elementId, text) {
        const el = document.getElementById(elementId);
        if (el) el.textContent = text;
    }

    /* ═════════════════════════════════════════════════════════════════════════
       MODALS
    ═════════════════════════════════════════════════════════════════════════ */

    showCompletionModal() {
        const modal = document.getElementById('completionModal');
        if (!modal) return;

        // Update stats in modal
        const stats = this.history.statistics;
        const today = this.getTodayString();
        const todaysSessions = this.history.sessions.filter(s =>
            s.date === today && s.status === 'completed'
        ).length;
        const totalHours = this.config.activeHours.end - this.config.activeHours.start + 1;

        this.setTextContent('compDuration', `${this.config.duration}:00`);
        this.setTextContent('compStreak', stats.currentStreak);
        this.setTextContent('compToday', `${todaysSessions}/${totalHours}`);

        // Next session info
        const nextSession = this.getNextScheduledSession();
        const nextInfo = document.getElementById('nextSessionInfo');
        if (nextInfo) {
            if (nextSession) {
                const timeUntil = this.calculateTimeUntil(nextSession.hour, nextSession.startMinute);
                nextInfo.textContent = `Next session: ${nextSession.startTime} (in ${timeUntil})`;
            } else {
                nextInfo.textContent = 'All sessions completed for today! 🎉';
            }
        }

        modal.classList.add('active');
    }

    hideCompletionModal() {
        const modal = document.getElementById('completionModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showStatsPanel() {
        const panel = document.getElementById('statsPanel');
        if (panel) {
            panel.classList.add('active');
            this.renderFullStats();
        }
    }

    hideStatsPanel() {
        const panel = document.getElementById('statsPanel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    showSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hideSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    renderFullStats() {
        const container = document.getElementById('statsPanelContent');
        if (!container) return;

        const stats = this.history.statistics;
        const today = this.getTodayString();

        // Get today's data
        const todaysSessions = this.history.sessions.filter(s => s.date === today);
        const todaysCompleted = todaysSessions.filter(s => s.status === 'completed').length;
        const todaysSkipped = todaysSessions.filter(s => s.status === 'skipped').length;

        // Get this week's data
        const weekStart = this.getWeekStart();
        const weekSessions = this.history.sessions.filter(s => new Date(s.date) >= weekStart);
        const weekCompleted = weekSessions.filter(s => s.status === 'completed').length;

        // Format total time
        const totalMinutes = Math.floor(stats.totalTimeSeconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;

        container.innerHTML = `
            <div class="stats-section">
                <h3 class="stats-section-title">Today</h3>
                <div class="stats-row">
                    <div class="stat-box">
                        <span class="stat-value-large">${todaysCompleted}</span>
                        <span class="stat-label-sm">Completed</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value-large">${todaysSkipped}</span>
                        <span class="stat-label-sm">Skipped</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value-large">${stats.currentStreak}</span>
                        <span class="stat-label-sm">Streak</span>
                    </div>
                </div>
            </div>
            
            <div class="stats-section">
                <h3 class="stats-section-title">This Week</h3>
                <div class="stats-row">
                    <div class="stat-box wide">
                        <span class="stat-value-large">${weekCompleted}</span>
                        <span class="stat-label-sm">Sessions</span>
                    </div>
                </div>
            </div>
            
            <div class="stats-section">
                <h3 class="stats-section-title">All Time</h3>
                <div class="stats-grid-panel">
                    <div class="stat-item-panel">
                        <span class="stat-icon-panel">🏆</span>
                        <span class="stat-value-panel">${stats.completedSessions}</span>
                        <span class="stat-label-panel">Total Sessions</span>
                    </div>
                    <div class="stat-item-panel">
                        <span class="stat-icon-panel">⏱️</span>
                        <span class="stat-value-panel">${hours}h ${mins}m</span>
                        <span class="stat-label-panel">Total Time</span>
                    </div>
                    <div class="stat-item-panel">
                        <span class="stat-icon-panel">🔥</span>
                        <span class="stat-value-panel">${stats.longestStreak}</span>
                        <span class="stat-label-panel">Best Streak</span>
                    </div>
                    <div class="stat-item-panel">
                        <span class="stat-icon-panel">📊</span>
                        <span class="stat-value-panel">${Math.round(stats.completionRate * 100)}%</span>
                        <span class="stat-label-panel">Completion Rate</span>
                    </div>
                </div>
            </div>
            
            <div class="stats-section">
                <h3 class="stats-section-title">Achievements</h3>
                <div class="achievements-full-grid">
                    ${this.renderAchievementsList()}
                </div>
            </div>
        `;
    }

    renderAchievementsList() {
        return NAAM_CONFIG.ACHIEVEMENTS.map(achievement => {
            const isUnlocked = this.history.achievements &&
                this.history.achievements.find(a => a.id === achievement.id);

            return `
                <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}">
                    <span class="achievement-icon-lg">${achievement.icon}</span>
                    <div class="achievement-info">
                        <span class="achievement-name">${achievement.name}</span>
                        <span class="achievement-desc">${achievement.description}</span>
                    </div>
                    ${isUnlocked ? '<span class="achievement-check">✓</span>' : ''}
                </div>
            `;
        }).join('');
    }

    /* ═════════════════════════════════════════════════════════════════════════
       ACHIEVEMENTS
    ═════════════════════════════════════════════════════════════════════════ */

    checkAchievements() {
        const stats = this.history.statistics;

        NAAM_CONFIG.ACHIEVEMENTS.forEach(achievement => {
            // Check if already unlocked
            if (this.history.achievements &&
                this.history.achievements.find(a => a.id === achievement.id)) {
                return;
            }

            // Evaluate condition
            let unlocked = false;
            try {
                // Simple condition evaluation
                const condition = achievement.condition
                    .replace('completedSessions', stats.completedSessions)
                    .replace('currentStreak', stats.currentStreak)
                    .replace('totalTimeSeconds', stats.totalTimeSeconds);

                unlocked = eval(condition);
            } catch (e) {
                console.error('Achievement condition error:', e);
            }

            if (unlocked) {
                this.unlockAchievement(achievement);
            }
        });
    }

    unlockAchievement(achievement) {
        if (!this.history.achievements) {
            this.history.achievements = [];
        }

        this.history.achievements.push({
            id: achievement.id,
            name: achievement.name,
            unlockedAt: new Date().toISOString()
        });

        this.saveHistory();

        // Show notification
        this.showToast(`🎉 Achievement Unlocked: ${achievement.name}`, 'success');

        // Update UI
        this.updateAchievements();
    }

    /* ═════════════════════════════════════════════════════════════════════════
       AUDIO & NOTIFICATIONS
    ═════════════════════════════════════════════════════════════════════════ */

    playNotificationSound() {
        this.playSound(this.config.notifications.sound);
    }

    playSound(soundName) {
        try {
            const audio = new Audio(`assets/sounds/${soundName}.mp3`);
            audio.volume = 0.7;
            audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (e) {
            console.log('Audio not available:', e);
        }
    }

    /**
     * Show browser notification using Service Worker for better background support
     * Falls back to basic Notification API if SW is unavailable
     */
    async showBrowserNotification(title, options = {}) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            console.log('[NaamAbhyas] Notification permission not granted');
            return;
        }

        const notificationOptions = {
            icon: '/assets/icons/icon-192x192.png',
            badge: '/assets/icons/icon-72x72.png',
            vibrate: [200, 100, 200, 100, 200],
            requireInteraction: true,
            tag: 'naam-abhyas-session',
            renotify: true,
            data: {
                url: '/NaamAbhyas/naam-abhyas.html',
                type: 'naamAbhyas',
                timestamp: Date.now()
            },
            actions: [
                { action: 'start', title: '🙏 Start Now' },
                { action: 'dismiss', title: 'Skip' }
            ],
            ...options
        };

        try {
            // PREFERRED: Use Service Worker registration for background notification support
            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                const registration = await navigator.serviceWorker.ready;
                if (registration.showNotification) {
                    await registration.showNotification(title, notificationOptions);
                    console.log('[NaamAbhyas] ✅ SW notification shown:', title);
                    return;
                }
            }

            // FALLBACK: Use basic Notification API (only works in foreground)
            new Notification(title, {
                icon: notificationOptions.icon,
                badge: notificationOptions.badge,
                body: options.body || '',
                tag: notificationOptions.tag,
                requireInteraction: notificationOptions.requireInteraction
            });
            console.log('[NaamAbhyas] ⚠️ Fallback notification shown (foreground only):', title);
        } catch (e) {
            console.error('[NaamAbhyas] Notification failed:', e);
        }
    }

    /* ═════════════════════════════════════════════════════════════════════════
       WAKE LOCK
    ═════════════════════════════════════════════════════════════════════════ */

    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake lock acquired');
            } catch (e) {
                console.log('Wake lock failed:', e);
            }
        }
    }

    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release();
            this.wakeLock = null;
            console.log('Wake lock released');
        }
    }

    /* ═════════════════════════════════════════════════════════════════════════
       STORAGE
    ═════════════════════════════════════════════════════════════════════════ */

    loadConfig() {
        try {
            const stored = localStorage.getItem(NAAM_CONFIG.STORAGE_KEYS.CONFIG);
            return stored ? { ...NAAM_CONFIG.DEFAULTS, ...JSON.parse(stored) } : { ...NAAM_CONFIG.DEFAULTS };
        } catch (e) {
            console.error('Failed to load config:', e);
            return { ...NAAM_CONFIG.DEFAULTS };
        }
    }

    saveConfig() {
        try {
            localStorage.setItem(NAAM_CONFIG.STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
        } catch (e) {
            console.error('Failed to save config:', e);
        }
    }

    loadHistory() {
        try {
            const stored = localStorage.getItem(NAAM_CONFIG.STORAGE_KEYS.HISTORY);
            return stored ? JSON.parse(stored) : this.getDefaultHistory();
        } catch (e) {
            console.error('Failed to load history:', e);
            return this.getDefaultHistory();
        }
    }

    saveHistory() {
        try {
            localStorage.setItem(NAAM_CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }

    getDefaultHistory() {
        return {
            sessions: [],
            statistics: {
                totalSessions: 0,
                completedSessions: 0,
                skippedSessions: 0,
                totalTimeSeconds: 0,
                currentStreak: 0,
                longestStreak: 0,
                completionRate: 0
            },
            achievements: [],
            scheduleHistory: {}
        };
    }

    /* ═════════════════════════════════════════════════════════════════════════
       UTILITY FUNCTIONS
    ═════════════════════════════════════════════════════════════════════════ */

    getTodayString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getWeekStart() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        return new Date(now.setDate(diff));
    }

    formatTime12h(hour, minute) {
        const h = hour % 12 || 12;
        const m = minute.toString().padStart(2, '0');
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${h}:${m} ${ampm}`;
    }

    calculateTimeUntil(targetHour, targetMinute) {
        const now = new Date();
        const target = new Date();
        target.setHours(targetHour, targetMinute, 0, 0);

        const diff = target - now;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    }

    /* ═══════════════════════════════════════════════════════════════════════════
       WISDOM QUOTES - Daily Inspiration
    ═══════════════════════════════════════════════════════════════════════════ */

    initWisdom() {
        this.currentWisdomIndex = Math.floor(Math.random() * NAAM_CONFIG.WISDOM_QUOTES.length);
        this.displayWisdom();
    }

    showNewWisdom() {
        this.currentWisdomIndex = (this.currentWisdomIndex + 1) % NAAM_CONFIG.WISDOM_QUOTES.length;

        const card = document.getElementById('wisdomCard');
        if (card) {
            card.style.animation = 'none';
            card.offsetHeight; // Trigger reflow
            card.style.animation = 'wisdomAppear 0.6s ease-out';
        }

        this.displayWisdom();

        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(10);
    }

    displayWisdom() {
        const wisdom = NAAM_CONFIG.WISDOM_QUOTES[this.currentWisdomIndex];
        if (!wisdom) return;

        const quoteEl = document.getElementById('wisdomQuote');
        const translationEl = document.getElementById('wisdomTranslation');
        const sourceEl = document.getElementById('wisdomSource');

        if (quoteEl) quoteEl.textContent = `"${wisdom.gurmukhi}"`;
        if (translationEl) translationEl.textContent = wisdom.translation;
        if (sourceEl) sourceEl.textContent = `— ${wisdom.source}`;
    }

    /* ═══════════════════════════════════════════════════════════════════════════
       CELEBRATION EFFECTS
    ═══════════════════════════════════════════════════════════════════════════ */

    showCelebration() {
        const container = document.querySelector('.meditation-container') || document.body;

        for (let i = 0; i < 30; i++) {
            const petal = document.createElement('div');
            petal.className = 'celebration-petal';
            petal.style.left = `${Math.random() * 100}%`;
            petal.style.animationDelay = `${Math.random() * 1.5}s`;
            petal.style.animationDuration = `${2 + Math.random() * 2}s`;
            container.appendChild(petal);

            setTimeout(() => petal.remove(), 4000);
        }

        // Celebration haptic
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 200]);
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   INITIALIZATION
═══════════════════════════════════════════════════════════════════════════════ */

// Global instance
window.naamAbhyas = null;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.naamAbhyas = new NaamAbhyas();
    window.naamAbhyas.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NaamAbhyas;
}
