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
        // ALWAYS follow the global theme from anhad_theme key
        const globalTheme = localStorage.getItem('anhad_theme');
        this.currentTheme = globalTheme || 'light';

        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupSystemThemeListener();
        this.bindThemeButtons();

        // Listen for global theme changes (same-page dispatches)
        window.addEventListener('themechange', (e) => {
            if (e.detail && e.detail.theme) {
                this.currentTheme = e.detail.theme;
                this.applyTheme(e.detail.theme);
            }
        });

        // Listen for cross-tab theme changes via localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'anhad_theme' && e.newValue) {
                this.currentTheme = e.newValue;
                this.applyTheme(e.newValue);
            }
        });

        // Auto-refresh for 'auto' time-based mode (check every minute)
        // Gated behind document visibility to save background CPU cycles
        setInterval(() => {
            if (this.currentTheme === 'auto' && !document.hidden) {
                this.applyTheme('auto');
            }
        }, 60000);
    }

    applyTheme(theme) {
        const htmlEl = document.documentElement;
        document.body.classList.remove('theme-light', 'theme-dark');

        // Resolve actual theme: 'system' uses global anhad_theme first, then prefers-color-scheme
        let actualTheme = theme;
        if (theme === 'auto') {
            // 'auto' = time-based: light 6AM-6PM, dark otherwise
            const hour = new Date().getHours();
            actualTheme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
        } else if (theme === 'system') {
            const stored = localStorage.getItem('anhad_theme');
            if (stored && stored !== 'system') {
                actualTheme = stored;
            } else {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                actualTheme = prefersDark ? 'dark' : 'light';
            }
        }

        // Apply classes and attributes
        document.body.classList.add(`theme-${actualTheme}`);
        htmlEl.setAttribute('data-theme', actualTheme);

        // Also apply the dark/light classes that the global theme system uses
        if (actualTheme === 'dark') {
            htmlEl.classList.add('dark', 'dark-mode');
            htmlEl.style.colorScheme = 'dark';
        } else if (theme !== 'system' || actualTheme !== 'dark') {
            // Only remove if we are explicitly setting light or if system is light
            htmlEl.classList.remove('dark', 'dark-mode');
            htmlEl.style.colorScheme = 'light';
        }

        this.updateActiveButton(theme);
        // Save to global key so other pages stay in sync
        localStorage.setItem('anhad_theme', theme);
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

        // Sound preview state
        this.isPreviewPlaying = false;
        this.previewAudio = null;
        this.previewTimeout = null;

        // SAFETY: Force hide loading screen after 10 seconds no matter what
        setTimeout(() => {
            if (!this.isInitialized) {
                console.warn('⚠️ Force hiding loading screen after timeout');
                this.hideLoadingScreen();
            }
        }, 10000);
    }

    /* ═════════════════════════════════════════════════════════════════════════
       INITIALIZATION
    ═════════════════════════════════════════════════════════════════════════ */
    async init() {
        try {
            console.log('🙏 Initializing Naam Abhyas...');

            // Capture auto-start params from URL (notification click) BEFORE cleaning URL
            try {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('autoStart') === 'true') {
                    this._capturedAutoStartParams = {
                        autoStart: true,
                        hour: urlParams.get('hour'),
                        minute: urlParams.get('minute')
                    };
                    window.history.replaceState({}, '', window.location.pathname);
                    console.log('[NaamAbhyas] 📩 Captured auto-start params from notification:', this._capturedAutoStartParams);
                } else {
                    // Fallback: check localStorage for pending launch (cold-start bridge)
                    try {
                        var pendingRaw = localStorage.getItem('anhad_pending_naam_launch');
                        if (pendingRaw) {
                            var pending = JSON.parse(pendingRaw);
                            if (pending && pending.autoStart && (Date.now() - (pending.timestamp || 0)) < 15000) {
                                this._capturedAutoStartParams = {
                                    autoStart: true,
                                    hour: pending.hour,
                                    minute: pending.minute
                                };
                                localStorage.removeItem('anhad_pending_naam_launch');
                                console.log('[NaamAbhyas] 📩 Captured auto-start from localStorage fallback:', this._capturedAutoStartParams);
                            } else {
                                localStorage.removeItem('anhad_pending_naam_launch');
                            }
                        }
                    } catch (e) {}
                }
            } catch (e) {
                console.error('❌ URL param capture failed:', e);
            }

            // Phase 1: CRITICAL PATH - Must complete fast
            try {
                this.config = this.loadConfig();
                this.history = this.loadHistory();
            } catch (e) {
                console.error('❌ Config/History loading failed:', e);
            }

            // Initialize core UI first
            try {
                this.themeEngine = new NaamAbhyasThemeEngine();
                this.themeEngine.applyTheme(this.themeEngine.currentTheme);
            } catch (e) {
                console.error('❌ Theme init failed:', e);
            }

            // Generate schedule early (needed for UI)
            try {
                this.generateDailySchedule();
            } catch (e) {
                console.error('❌ Schedule generation failed:', e);
            }

            // Show UI immediately
            try {
                this.updateUI();
            } catch (e) {
                console.error('❌ UI update failed:', e);
            }

            // Load initial UI state
            try {
                this.loadInitialState();
            } catch (e) {
                console.error('❌ Initial state loading failed:', e);
            }

            // Bind event listeners IMMEDIATELY
            try {
                this.bindEvents();
            } catch (e) {
                console.error('❌ Event binding failed:', e);
            }

            // Notification Engine init
            try {
                if (typeof NotificationEngine !== 'undefined') {
                    this.notificationEngine = new NotificationEngine();
                }
            } catch (e) {
                console.error('❌ NotificationEngine init failed:', e);
            }

            // If already enabled, start countdown and schedule notifications
            if (this.config.enabled) {
                try {
                    this.startCountdownUpdates();
                    this.scheduleUpcomingNotifications();
                } catch (e) {
                    console.error('❌ Failed to start enabled state features:', e);
                }
            }

            // HIDE LOADING SCREEN NOW
            this.hideLoadingScreen();
            this.isInitialized = true;
            console.log('✅ Naam Abhyas core initialized');

            // Phase 2: DEFERRED - Non-critical operations
            const initDeferred = () => {
                console.log('🔄 Running deferred initialization...');

                try {
                    this.initializeComponents(); // Now includes RitualEngine
                    this.scheduleManager = new ScheduleManager(this);
                } catch (e) {
                    console.error('❌ Deferred initialization failed:', e);
                }

                this.executeAutoStart();
                this.checkForMissedSessions();
            };

            if ('requestIdleCallback' in window) {
                requestIdleCallback(initDeferred, { timeout: 500 });
            } else {
                setTimeout(initDeferred, 100);
            }

        } catch (error) {
            console.error('❌ CRITICAL: Failed to initialize Naam Abhyas:', error);
            this.hideLoadingScreen();
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

        // ═══ Fix 4: foreground alarm event from capacitor-notifications-global ═══
        // When the user is already on this page and a Naam alarm fires,
        // the global script dispatches this event so we handle it natively.
        window.addEventListener('naamAbhyasAlarmFired', (evt) => {
            const { hour } = evt.detail || {};
            const hourNum = parseInt(hour);
            const session = (this.currentSchedule && this.currentSchedule[hourNum])
                || (this.currentSchedule && this.currentSchedule[new Date().getHours()]);
            if (session) this.triggerSessionAlert(session);
        });

        // ═══ CRITICAL FIX: Handle notification click when already on page (prevents freeze) ═══
        window.addEventListener('naamAbhyasNotificationClick', (evt) => {
            console.log('[NaamAbhyas] 🔔 Notification clicked while on page, triggering session');
            const { hour, minute, autoStart } = evt.detail || {};
            
            if (autoStart) {
                this._capturedAutoStartParams = {
                    autoStart: true,
                    hour: hour,
                    minute: minute
                };
                this.executeAutoStart();
            }
        });
    }


    /**
     * ═══ BUG 7 FIX: Execute auto-start using params captured on critical path ═══
     * Uses this._capturedAutoStartParams instead of reading URL (which is already cleaned).
     * Called from deferred init after ritualEngine is ready.
     * Includes retry if ritualEngine isn't initialized yet.
     */
    executeAutoStart() {
        const params = this._capturedAutoStartParams;
        if (!params || !params.autoStart) return;

        // Clear captured params to prevent re-execution
        this._capturedAutoStartParams = null;

        console.log('[NaamAbhyas] 🚀 Executing auto-start from notification click:', params);

        // Get the current session or use the provided hour/minute
        const hour = parseInt(params.hour) || new Date().getHours();
        const minute = parseInt(params.minute) || new Date().getMinutes();

        // Find the matching session or create one
        let targetSession = this.currentSchedule[hour];
        if (!targetSession) {
            targetSession = this.getNextScheduledSession() || {
                hour: hour,
                startMinute: minute,
                startTime: this.formatTime12h(hour, minute),
                status: 'pending'
            };
        }

        // Start meditation — retry up to 3 times if ritualEngine isn't ready
        const startSession = (retryCount) => {
            if (this.ritualEngine) {
                console.log('[NaamAbhyas] ✅ RitualEngine ready, triggering session');
                this.ritualEngine.triggerScheduledSession(targetSession, this.config.duration || 2);
            } else if (retryCount > 0) {
                console.log(`[NaamAbhyas] ⏳ RitualEngine not ready, retrying in 500ms (${retryCount} left)`);
                setTimeout(() => startSession(retryCount - 1), 500);
            } else {
                console.warn('[NaamAbhyas] ❌ RitualEngine never initialized, using fallback');
                this.startMeditation();
            }
        };

        // Small delay for UI to settle, then start
        setTimeout(() => startSession(3), 300);
    }

    /**
     * Legacy checkAutoStart — kept for backward compatibility but now just delegates
     */
    checkAutoStart() {
        // URL params are now captured on critical path (this._capturedAutoStartParams)
        // This method is only called if something invokes it directly
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('autoStart') === 'true') {
            this._capturedAutoStartParams = {
                autoStart: true,
                hour: urlParams.get('hour'),
                minute: urlParams.get('minute')
            };
            window.history.replaceState({}, '', window.location.pathname);
            this.executeAutoStart();
        }
    }

    initializeComponents() {
        // Initialize Timer Engine
        if (typeof TimerEngine !== 'undefined') {
            this.timerEngine = new TimerEngine();
        }

        // NotificationEngine already initialized on critical path in init()
        // Only create if not already done (safety fallback)
        if (!this.notificationEngine && typeof NotificationEngine !== 'undefined') {
            this.notificationEngine = new NotificationEngine();
        }

        // Initialize Stats Tracker
        if (typeof StatsTracker !== 'undefined') {
            this.statsTracker = new StatsTracker(this.history);
        }

        // Initialize Audio Manager & preload key sounds
        if (typeof AudioManager !== 'undefined') {
            this.audioManager = new AudioManager();
            // Preload notification + session sounds on first user interaction
            const preloadOnce = () => {
                if (this.audioManager) {
                    this.audioManager.initAudioContext();
                    this.audioManager.preloadAll();
                }
                document.removeEventListener('click', preloadOnce);
                document.removeEventListener('touchstart', preloadOnce);
            };
            document.addEventListener('click', preloadOnce, { once: true });
            document.addEventListener('touchstart', preloadOnce, { once: true });
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
            if (!document.hidden) {
                this.updateHeaderClock();
            }
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
                if (window.navigateTo) window.navigateTo('../index.html'); else window.location.href = '../index.html';
            });
        }

        // Main toggle
        const toggle = document.getElementById('naamAbhyasToggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                if (e.target.checked) this.enable();
                else this.disable();
            });
        }

        // ─── Duration: custom number input + preset buttons ───────────────────
        const durationInput = document.getElementById('durationCustomInput');
        if (durationInput) {
            durationInput.addEventListener('change', (e) => {
                let val = parseInt(e.target.value);
                if (val < 2) val = 2;
                if (val > 60) val = 60;
                e.target.value = val;
                this.config.duration = val;
                this.saveConfig();
                this.regenerateSchedule(true);
                this.updateUI();
                this._updateActivePreset(val);
            });
        }

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mins = parseInt(btn.dataset.min);
                if (durationInput) durationInput.value = mins;
                this.config.duration = mins;
                this.saveConfig();
                this.regenerateSchedule(true);
                this.updateUI();
                this._updateActivePreset(mins);
                this.showToast(`Duration: ${mins}m`, 'success');
            });
        });

        // ─── Quick Action Cards ──────────────────────────────────────────────
        const startNowBtn = document.getElementById('startNowBtn');
        if (startNowBtn) {
            startNowBtn.addEventListener('click', () => {
                if (this.ritualEngine) {
                    this.ritualEngine.triggerManualSession(this.config.duration || 2, false);
                } else {
                    this.startMeditation(this.config.duration || 2);
                }
            });
        }

        const quickNaamBtn = document.getElementById('quickNaamBtn');
        if (quickNaamBtn) {
            quickNaamBtn.addEventListener('click', () => {
                if (this.ritualEngine) {
                    this.ritualEngine.triggerManualSession(0.5, false); // 30 seconds
                } else {
                    this.startMeditation(0.5);
                }
            });
        }

        const deepModeBtn = document.getElementById('deepModeBtn');
        if (deepModeBtn) {
            deepModeBtn.addEventListener('click', () => {
                if (this.ritualEngine) {
                    this.ritualEngine.triggerManualSession(11, false); // 11 minutes
                } else {
                    this.startMeditation(11);
                }
            });
        }

        const viewFullStatsBtn = document.getElementById('viewFullStatsBtn');
        if (viewFullStatsBtn) {
            viewFullStatsBtn.addEventListener('click', () => {
                this.showStatsPanel();
            });
        }

        const closeStatsBtn = document.getElementById('closeStatsBtn');
        if (closeStatsBtn) {
            closeStatsBtn.addEventListener('click', () => {
                this.hideStatsPanel();
            });
        }

        const statsPanelBackdrop = document.getElementById('statsPanelBackdrop');
        if (statsPanelBackdrop) {
            statsPanelBackdrop.addEventListener('click', () => {
                this.hideStatsPanel();
            });
        }

        // ─── Modals: Session Alert (Ready / Silent / Skip) ─────────────────────
        const alertStartNowBtn = document.getElementById('alertStartNowBtn');
        const alertSilentBtn = document.getElementById('alertSilentBtn');
        const skipSessionBtn = document.getElementById('skipSessionBtn');

        if (alertStartNowBtn) {
            alertStartNowBtn.addEventListener('click', () => {
                this.hideAlertModal();
                if (this.ritualEngine) {
                    const session = this.currentAlertSession || this.getNextScheduledSession();
                    this.ritualEngine.triggerScheduledSession(session, this.config.duration);
                } else {
                    this.startMeditation();
                }
            });
        }

        if (alertSilentBtn) {
            alertSilentBtn.addEventListener('click', () => {
                this.hideAlertModal();
                if (this.ritualEngine) {
                    const session = this.currentAlertSession || this.getNextScheduledSession();
                    // Trigger with silent flag
                    this.ritualEngine.triggerScheduledSession(session, this.config.duration, true);
                }
            });
        }

        if (skipSessionBtn) {
            skipSessionBtn.addEventListener('click', () => {
                this.hideAlertModal();
                this.skipCurrentSession();
            });
        }

        // ─── Modals: Meditation Overlay (Present / Silent / Skip) ──────────────
        const medPresentBtn = document.getElementById('medPresentBtn');
        const medSilentBtn = document.getElementById('medSilentBtn');
        const skipMeditationBtn = document.getElementById('skipMeditationBtn');

        if (medPresentBtn) {
            medPresentBtn.addEventListener('click', () => {
                // Flash effect for presence acknowledgment
                medPresentBtn.classList.add('acknowledging');
                setTimeout(() => medPresentBtn.classList.remove('acknowledging'), 500);
                if (this.ritualEngine) this.ritualEngine.recordPresence();
            });
        }

        if (medSilentBtn) {
            medSilentBtn.addEventListener('click', () => {
                const isMuted = medSilentBtn.dataset.muted === 'true';
                const nextMuted = !isMuted;
                medSilentBtn.dataset.muted = nextMuted;

                const icon = document.getElementById('silentBtnIcon');
                const label = document.getElementById('silentBtnLabel');

                if (nextMuted) {
                    if (icon) icon.textContent = '🔇';
                    if (label) label.textContent = 'Muted';
                    medSilentBtn.classList.add('muted-active');
                    if (this.audioManager) this.audioManager.mute();
                } else {
                    if (icon) icon.textContent = '🔊';
                    if (label) label.textContent = 'Silent';
                    medSilentBtn.classList.remove('muted-active');
                    if (this.audioManager) this.audioManager.unmute();
                }
            });
        }

        if (skipMeditationBtn) {
            skipMeditationBtn.addEventListener('click', () => {
                this.endMeditationEarly();
            });
        }

        // ─── Modals: Completion ──────────────────────────────────────────────
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.hideCompletionModal();
            });
        }

        // ─── Other Controls ──────────────────────────────────────────────────
        this.bindToggle('hourStartNotification', 'notifications.hourStart');
        this.bindToggle('vibrationEnabled', 'notifications.vibration');
        this.bindToggle('soundEnabled', 'notifications.soundEnabled');

        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => this.hideSettingsModal());
        }

        const settingsPageBtn = document.getElementById('settingsPageBtn');
        if (settingsPageBtn) {
            settingsPageBtn.addEventListener('click', () => this.showSettingsModal());
        }

        const previewSoundBtn = document.getElementById('previewSoundBtn');
        if (previewSoundBtn) {
            previewSoundBtn.addEventListener('click', () => {
                this.playIosChime('notification');
                this.showToast('Testing notification chime... 🙏', 'info');
            });
        }

        const wisdomRefreshBtn = document.getElementById('wisdomRefreshBtn');
        if (wisdomRefreshBtn) {
            wisdomRefreshBtn.addEventListener('click', () => {
                this.showNewWisdom();
            });
        }

        // Initialize wisdom on load
        this.initWisdom();

        // Bind Spiritual Sync Hub events
        const syncNitnem = document.getElementById('syncNitnemItem');
        const syncGpt = document.getElementById('syncGptItem');
        const syncSangat = document.getElementById('syncSangatItem');

        if (syncNitnem) {
            syncNitnem.addEventListener('click', () => {
                if (window.navigateTo) window.navigateTo('../NitnemTracker/nitnem-tracker.html');
                else window.location.href = '../NitnemTracker/nitnem-tracker.html';
            });
        }
        if (syncGpt) {
            syncGpt.addEventListener('click', () => {
                if (window.navigateTo) window.navigateTo('../GurbaniGPT/index.html');
                else window.location.href = '../GurbaniGPT/index.html';
            });
        }
        if (syncSangat) {
            syncSangat.addEventListener('click', () => {
                if (window.navigateTo) window.navigateTo('../sadhsangat-live/index.html');
                else window.location.href = '../sadhsangat-live/index.html';
            });
        }
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

        // ═══ FIX BUG 1: Sync UI state with persisted config.enabled ═══
        // The HTML hardcodes "Currently disabled" and doesn't add/remove 
        // the disabled-state class on body. Fix: sync on every load.
        const statusText = document.getElementById('toggleStatusText');
        if (this.config.enabled) {
            document.body.classList.remove('disabled-state');
            if (statusText) statusText.textContent = 'Active';
        } else {
            document.body.classList.add('disabled-state');
            if (statusText) statusText.textContent = 'Currently disabled';
        }

        // Set theme radio
        const themeRadio = document.querySelector(`input[name="theme"][value="${this.config.theme}"]`);
        if (themeRadio) {
            themeRadio.checked = true;
        }

        // Set duration custom input and sync presets
        const durationInput = document.getElementById('durationCustomInput');
        if (durationInput) {
            durationInput.value = this.config.duration || 2;
            this._updateActivePreset(this.config.duration);
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
        // Request notification permission FIRST before enabling
        if ('Notification' in window && Notification.permission === 'default') {
            console.log('[NaamAbhyas] 🔔 Requesting notification permission...');
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                this.showToast('⚠️ Notifications blocked. Alarms may not work when app is closed.', 'warning');
                console.warn('[NaamAbhyas] ⚠️ Notification permission denied');
                // Continue anyway - user can still use the app
            } else {
                console.log('[NaamAbhyas] ✅ Notification permission granted');
            }
        }

        this.config.enabled = true;
        this.saveConfig();

        // Update UI state
        document.body.classList.remove('disabled-state');
        const statusText = document.getElementById('toggleStatusText');
        if (statusText) {
            statusText.textContent = 'Active';
        }

        // Generate schedule for today
        this.generateDailySchedule();

        // ═══ BUG 2 FIX: Persist schedule to dedicated key for global scheduler sync ═══
        // The global scheduler (capacitor-notifications-global.js) runs on EVERY page,
        // not just naam-abhyas.html. It reads from 'naam_abhyas_schedule' to get correct times.
        try {
            localStorage.setItem('naam_abhyas_schedule', JSON.stringify(this.currentSchedule));
            console.log('[NaamAbhyas] 💾 Schedule persisted to naam_abhyas_schedule for cross-page sync');
        } catch (e) { /* storage full, non-critical */ }

        // Start countdown updates
        this.startCountdownUpdates();

        // Schedule hourly refresh
        this.scheduleHourlyRefresh();

        // ═══ SCHEDULE NOTIFICATIONS for upcoming sessions ═══
        this.scheduleUpcomingNotifications();

        // ═══ CAPACITOR-NATIVE: Schedule batch hourly notifications (works when app is closed) ═══
        if (this.notificationEngine && this.notificationEngine.scheduleCapacitorHourlyBatch) {
            console.log('[NaamAbhyas] 📅 Passing currentSchedule to notification engine:', Object.keys(this.currentSchedule).length, 'hours');
            this.notificationEngine.scheduleCapacitorHourlyBatch({
                enabled: true,
                startHour: this.config.activeHours?.start || 5,
                endHour: this.config.activeHours?.end || 22,
                currentSchedule: this.currentSchedule,
                activeHours: this.config.activeHours
            });
        }

        // ═══ REGISTER PERIODIC BACKGROUND SYNC for reliable background alarms ═══
        await this.registerPeriodicBackgroundSync();

        // Update all UI
        this.updateUI();

        this.showToast('Naam Abhyas enabled! 🙏', 'success');
    }

    /**
     * Register periodic background sync to wake Service Worker for alarm checks
     * ENHANCED: Multiple wake strategies for maximum reliability
     * This is critical for background alarm reliability when app is closed
     */
    async registerPeriodicBackgroundSync() {
        if (!('serviceWorker' in navigator)) {
            console.log('[NaamAbhyas] Service Worker not supported, skipping periodic sync');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // ═══ STRATEGY 1: PeriodicSync API (Chrome/Edge) ═══
            if ('periodicSync' in registration) {
                try {
                    // Register for Naam Abhyas alarm checks every minute minimum
                    await registration.periodicSync.register('anhad-notification-check', {
                        minInterval: 60 * 1000 // 1 minute minimum
                    });
                    console.log('[NaamAbhyas] ✅ Periodic background sync registered (alarms will fire even when closed!)');
                } catch (syncErr) {
                    console.warn('[NaamAbhyas] PeriodicSync registration failed:', syncErr);
                }
            } else {
                console.log('[NaamAbhyas] Periodic sync not supported, using fallback strategies');
            }

            // ═══ STRATEGY 2: Store alarms in IndexedDB for SW to check on wake ═══
            await this.saveAlarmsToIndexedDB();

            // ═══ STRATEGY 3: Send wake-up interval to SW ═══
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SET_ALARM_CHECK_INTERVAL',
                    interval: 60000 // Check every minute
                });
                console.log('[NaamAbhyas] ✅ Sent alarm check interval to Service Worker');
            }

        } catch (err) {
            console.warn('[NaamAbhyas] Failed to register periodic sync:', err);
            // Continue - alarms will still work via IndexedDB when SW wakes for other reasons
        }
    }

    /**
     * Save current alarm schedule to IndexedDB for Service Worker access
     * This allows SW to check alarms even when app is closed
     */
    async saveAlarmsToIndexedDB() {
        try {
            if (!('indexedDB' in window)) {
                console.log('[NaamAbhyas] IndexedDB not supported');
                return;
            }

            const DB_NAME = 'GurbaniRadioSW';
            const DB_VERSION = 2;
            const STORE_NAME = 'notification_schedule';

            // Open database
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('scheduledTime', 'scheduledTime', { unique: false });
                    store.createIndex('fired', 'fired', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);

                // Cursor-based deletion: clean up only old Naam Abhyas keys starting with 'naam_'
                const cursorRequest = store.openCursor();
                cursorRequest.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        const key = cursor.key;
                        if (typeof key === 'string' && key.startsWith('naam_')) {
                            cursor.delete();
                        }
                        cursor.continue();
                    } else {
                        // All previous Naam alarms cleared. Now write the new upcoming alarms.
                        const now = new Date();
                        const today = now.toLocaleDateString('en-CA');

                        Object.entries(this.currentSchedule).forEach(([hour, session]) => {
                            const hourNum = parseInt(hour);
                            const scheduledTime = new Date();
                            scheduledTime.setHours(hourNum, session.startMinute, 0, 0);

                            // Only schedule future alarms
                            if (scheduledTime > now) {
                                store.put({
                                    id: `naam_${hour}_${session.startMinute}`,
                                    title: '🙏 ਨਾਮ ਅਭਿਆਸ | Naam Abhyas',
                                    body: `Leave all work. Remember Vaheguru for ${this.config.duration || 2} minutes.`,
                                    scheduledTime: scheduledTime.getTime(),
                                    hour: hourNum,
                                    startMinute: session.startMinute,
                                    duration: this.config.duration || 2,
                                    fired: false,
                                    createdAt: Date.now(),
                                    data: {
                                        hour: hourNum,
                                        startMinute: session.startMinute,
                                        duration: this.config.duration || 2
                                    },
                                    tag: `naam-abhyas-${today}-${hour}`
                                });
                            }
                        });
                        console.log('[NaamAbhyas] ✅ Alarms saved to IndexedDB (notification_schedule) for SW access');
                    }
                };
            };

            request.onerror = (event) => {
                console.error('[NaamAbhyas] IndexedDB error:', event.target.error);
            };
        } catch (err) {
            console.warn('[NaamAbhyas] Failed to save alarms to IndexedDB:', err);
        }
    }

    /**
     * Check for missed sessions while app was closed
     * Shows notification for any sessions that were missed
     */
    checkForMissedSessions() {
        if (!this.config.enabled) return;

        const now = new Date();
        const today = now.toDateString();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        let missedCount = 0;
        const missedSessions = [];

        Object.entries(this.currentSchedule).forEach(([hour, session]) => {
            const hourNum = parseInt(hour);
            const sessionEndMinute = session.endMinute || session.startMinute + (this.config.duration || 2);

            // Check if session has ended and is still pending
            const isPastSession = hourNum < currentHour || (hourNum === currentHour && currentMinute >= sessionEndMinute);

            if (isPastSession && session.status === 'pending') {
                missedCount++;
                missedSessions.push({
                    hour: hourNum,
                    startTime: session.startTime
                });
            }
        });

        if (missedCount > 0) {
            console.log(`[NaamAbhyas] Detected ${missedCount} missed sessions while app was closed`);

            // Show notification about missed sessions
            const message = missedCount === 1
                ? `You missed 1 Naam Abhyas session at ${missedSessions[0].startTime}`
                : `You missed ${missedCount} Naam Abhyas sessions today`;

            this.showToast(message, 'warning');

            // Update streak (mark as missed)
            if (this.history && this.history.statistics) {
                this.history.currentStreak = 0;
                this.saveHistory();
            }
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

            // Schedule for current hour (if session is still upcoming) and future sessions
            const isFutureHour = hourNum > currentHour;
            const isCurrentHourUpcoming = hourNum === currentHour && session.startMinute > now.getMinutes();
            if ((isFutureHour || isCurrentHourUpcoming) && session.status === 'pending') {
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

        if (this.notificationEngine && this.notificationEngine.scheduleCapacitorHourlyBatch) {
            this.notificationEngine.scheduleCapacitorHourlyBatch({
                enabled: this.config.enabled,
                startHour: this.config.activeHours?.start || 5,
                endHour: this.config.activeHours?.end || 22,
                currentSchedule: this.currentSchedule,
                activeHours: this.config.activeHours
            });
        }

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
            const spiritualMessages = [
                'ਸਬ ਕੰਮ ਛੱਡੋ, ਵਾਹਿਗੁਰੂ ਜੀ ਦਾ ਸਿਮਰਨ ਕਰੋ',
                'This moment is sacred. Meditate on Naam for ' + (this.config.duration || 2) + ' minutes.',
                'ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖ ਪਾਵਉ — Remember the Name and find peace',
                'Your soul is calling. Pause and connect with Vaheguru Ji.',
                'ਜਪਿ ਮਨ ਸਤਿ ਨਾਮੁ ਸਦਾ ਸਤਿ ਨਾਮੁ — Chant the True Name always',
                'Be still. Breathe. Remember Vaheguru for ' + (this.config.duration || 2) + ' sacred minutes.',
                'ਤੂੰ ਮੇਰਾ ਪਿਤਾ ਤੂੰਹੈ ਮੇਰਾ ਮਾਤਾ — You are my Father, You are my Mother'
            ];
            const body = spiritualMessages[Math.floor(Math.random() * spiritualMessages.length)];

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
            // ═══ ENHANCED: Use CapacitorNotifications wrapper for better reliability ═══
            if (window.CapacitorNotifications?.isCapacitorAvailable?.()) {
                window.CapacitorNotifications.scheduleNotification({
                    id: notificationId,
                    title: title,
                    body: body,
                    scheduledTime: scheduledTime,
                    icon: '/assets/icon-192x192.png',
                    badge: '/assets/icon-72x72.png',
                    tag: notificationPayload.tag,
                    requireInteraction: true,
                    data: notificationPayload.data
                }).then(() => {
                    console.log(`[NaamAbhyas] ✅ CAPACITOR notification scheduled for ${session.startTime} (works when closed!)`);
                }).catch(err => {
                    console.warn('[NaamAbhyas] Capacitor notification failed:', err);
                });
            } else if (window.NativeNotifications?.isNativePlatform?.()) {
                // Fallback to old NativeNotifications API
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

            // 3. FALLBACK SYSTEM - Works without Service Worker (setTimeout + localStorage)
            if (window.fallbackAlarmSystem) {
                window.fallbackAlarmSystem.scheduleAlarm({
                    id: notificationId,
                    title: title,
                    body: body,
                    scheduledTime: scheduledTime.getTime(),
                    tag: notificationPayload.tag,
                    icon: '/assets/icon-192x192.png',
                    badge: '/assets/icon-72x72.png',
                    data: notificationPayload.data
                });
                console.log(`[NaamAbhyas] ✅ FALLBACK alarm scheduled for ${session.startTime} (no SW needed!)`);
            }

            // 4. ELECTRON DESKTOP - Works when minimized to system tray!
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
            // ═══ PRE-NOTIFICATION: Schedule 30 seconds BEFORE the session ═══
            // This gives user a humble Nimrata warning so they can finish work
            const preNotifTime = new Date(scheduledTime.getTime() - 30000);
            if (preNotifTime > new Date()) {
                const preNimrataMessages = [
                    'ਨਾਮ ਅਭਿਆਸ ਦਾ ਸਮਾਂ ਆ ਰਿਹਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਸਾਰੇ ਕੰਮ ਛੱਡ ਦਿਓ \uD83D\uDE4F',
                    'Waheguru Ji is calling in 30 seconds. Please wrap up, dear Gurmukh. \uD83C\uDF38',
                    'ਵਾਹਿਗੁਰੂ ਜੀ ਦਾ ਸਿਮਰਨ ਥੋੜੀ ਦੇਰ ਵਿੱਚ ਸ਼ੁਰੂ ਹੋਵੇਗਾ। ਤਿਆਰ ਹੋ ਜਾਓ \u262C',
                    '30 seconds remain. Please leave all work and prepare for Naam Simran. \uD83D\uDE4F',
                    'ਬੱਸ 30 ਸਕਿੰਟ ਬਚੇ ਹਨ। ਮਨ ਨੂੰ ਸ਼ਾਂਤ ਕਰੋ। ਵਾਹਿਗੁਰੂ \u262C'
                ];
                const preBody = preNimrataMessages[Math.floor(Math.random() * preNimrataMessages.length)];
                const preNotifId = 'naam_pre30_' + hour + '_' + session.startMinute;
                const preTitle = '\uD83C\uDF38 ਨਾਮ ਅਭਿਆਸ ਆ ਰਿਹਾ ਹੈ | Naam Abhyas Coming';

                // Schedule via Capacitor or Fallback Alarm
                if (window.CapacitorNotifications && window.CapacitorNotifications.isCapacitorAvailable && window.CapacitorNotifications.isCapacitorAvailable()) {
                    window.CapacitorNotifications.scheduleNotification({
                        id: preNotifId, title: preTitle, body: preBody,
                        scheduledTime: preNotifTime, icon: '/assets/icon-192x192.png',
                        tag: 'naam-abhyas-pre-' + today + '-' + hour,
                        data: { url: '/NaamAbhyas/naam-abhyas.html', type: 'naamAbhyasPre', hour: hour }
                    }).catch(function (e) { console.warn('[NaamAbhyas] Pre-notification Capacitor failed:', e); });
                }
                if (window.fallbackAlarmSystem) {
                    window.fallbackAlarmSystem.scheduleAlarm({
                        id: preNotifId, title: preTitle, body: preBody,
                        scheduledTime: preNotifTime.getTime(),
                        tag: 'naam-abhyas-pre-' + today + '-' + hour,
                        data: { url: '/NaamAbhyas/naam-abhyas.html', type: 'naamAbhyasPre' }
                    });
                }
                console.log('[NaamAbhyas] ✅ PRE-notification scheduled 30s before ' + session.startTime);
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

        // ═══ CAPACITOR-NATIVE: Cancel all hourly notifications ═══
        if (this.notificationEngine && this.notificationEngine.cancelCapacitorBatch) {
            this.notificationEngine.cancelCapacitorBatch();
        }

        try {
            localStorage.removeItem('naam_abhyas_schedule');
            localStorage.removeItem('naam_abhyas_native_schedule_v2');
            localStorage.setItem('naam_abhyas_disabled_at', String(Date.now()));
        } catch (e) { /* non-critical */ }

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

    applyTheme(themeName) {
        const theme = themeName || this.config.theme || 'system';
        document.documentElement.setAttribute('data-theme', theme);

        if (this.themeEngine) {
            this.themeEngine.applyTheme(theme);
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
        const duration = this.config.duration || 2; // Duration in minutes

        // Calculate spacing based on duration
        // 2 min duration = 20 min spacing, 3 min = 30 min spacing, 5 min = 40 min spacing
        const spacingMinutes = duration <= 2 ? 20 : (duration <= 3 ? 30 : 40);

        console.log(`📅 Generating schedule: duration=${duration}min, spacing=${spacingMinutes}min`);

        // Check if we already have a schedule for today
        // ═══ MIGRATION: Detect old fixed-interval schedule and force-regenerate ═══
        // Old schedules had all sessions at same minute (e.g., 5:40, 6:40, 7:40).
        // New random schedules have varied minutes. Detect the old format and clear it.
        if (this.history.scheduleHistory && this.history.scheduleHistory[today]) {
            const existing = this.history.scheduleHistory[today];
            const sessionMinutes = Object.keys(existing)
                .filter(k => k !== '_duration' && k !== '_spacing' && existing[k] && typeof existing[k].startMinute === 'number')
                .map(k => existing[k].startMinute);
            const allSame = sessionMinutes.length > 2 && sessionMinutes.every(m => m === sessionMinutes[0]);
            if (allSame) {
                console.log('📅 Detected old fixed-interval schedule — clearing for random regeneration');
                delete this.history.scheduleHistory[today];
            }
        }

        if (this.history.scheduleHistory && this.history.scheduleHistory[today]) {
            // Check if duration changed - if so, regenerate
            const existingDuration = this.history.scheduleHistory[today]._duration;
            if (existingDuration && existingDuration !== duration) {
                console.log(`📅 Duration changed from ${existingDuration} to ${duration}, regenerating schedule`);
                this.currentSchedule = this.generateDurationBasedSchedule(startHour, endHour, spacingMinutes, duration);
                this.history.scheduleHistory[today] = this.currentSchedule;
                this.saveHistory();
            } else {
                this.currentSchedule = this.history.scheduleHistory[today];
                console.log('📅 Using existing schedule for today');

                // Cleanup sessions outside current active hours
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
                        this.currentSchedule[hour] = this.generateRandomTimeForHour(hour, duration);
                        cleaned = true;
                    }
                }

                if (cleaned) {
                    this.history.scheduleHistory[today] = this.currentSchedule;
                    this.saveHistory();
                }
            }

            // Ensure refresher count exists for today
            if (typeof this.history.dailyRefreshes === 'undefined') {
                this.history.dailyRefreshes = {};
            }
            if (typeof this.history.dailyRefreshes[today] === 'undefined') {
                this.history.dailyRefreshes[today] = 0;
            }
        } else {
            // Generate new schedule based on duration
            this.currentSchedule = this.generateDurationBasedSchedule(startHour, endHour, spacingMinutes, duration);

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

        // ═══ BUG 2 FIX: Always persist to dedicated key for global scheduler ═══
        try {
            localStorage.setItem('naam_abhyas_schedule', JSON.stringify(this.currentSchedule));
        } catch (e) { /* non-critical */ }
    }

    /**
     * Generate schedule with one TRULY RANDOM time per active hour.
     * ═══ FIXED: Old version used fixed intervals (n:00, n:20, n:40).
     *            New version assigns random minutes (e.g. 6:32, 7:14, 8:51).
     * Each active hour [startHour, endHour] gets exactly one session
     * at a random minute between 3 and 57 (avoids very start/end of hour).
     */
    generateDurationBasedSchedule(startHour, endHour, spacingMinutes, duration) {
        const schedule = {};
        let sessionIndex = 0;

        for (let hour = startHour; hour <= endHour; hour++) {
            // Random minute between 3 and 57 for natural-feeling times
            // This avoids :00 and :59 which feel too "on the hour"
            const randomMinute = 3 + Math.floor(Math.random() * 55); // 3–57

            schedule[hour] = {
                hour: hour,
                startMinute: randomMinute,
                endMinute: Math.min(59, randomMinute + duration),
                startTime: this.formatTime12h(hour, randomMinute),
                endTime: this.formatTime12h(hour, randomMinute + duration),
                duration: duration,
                status: 'pending',
                index: sessionIndex++
            };

            console.log(`📅 Session ${sessionIndex}: ${schedule[hour].startTime} (random minute: ${randomMinute})`);
        }

        // Store duration for change detection
        schedule._duration = duration;
        schedule._spacing = spacingMinutes; // kept for compatibility

        return schedule;
    }

    regenerateSchedule(forceRefresh = false) {
        const today = this.getTodayString();

        // Force clear today's schedule to ensure random times
        if (this.history.scheduleHistory && this.history.scheduleHistory[today]) {
            delete this.history.scheduleHistory[today];
            console.log('📅 Cleared cached schedule for today');
        }

        // Also clear global schedule cache
        localStorage.removeItem('naam_abhyas_schedule');

        // 1. Check Refresh Limit (bypass if forceRefresh is true)
        if (!this.history.dailyRefreshes) {
            this.history.dailyRefreshes = {};
        }

        const refreshesUsed = this.history.dailyRefreshes[today] || 0;
        const REFRESH_LIMIT = 10; // Strict limit: 1 refresh per day

        if (!forceRefresh && refreshesUsed >= REFRESH_LIMIT) {
            this.showToast('Daily refresh limit reached (10/day)', 'info');
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
        const REFRESH_LIMIT = 10;

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

        // Generate purely random minute between 0 and 59 for completely random times
        const randomMinute = Math.floor(Math.random() * 60);

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

        // Safety: if hour/startMinute are missing (stale data), treat as no session
        if (nextSession.hour === undefined || nextSession.startMinute === undefined) {
            console.warn('[NaamAbhyas] calculateNextSession: session missing hour/startMinute, falling back to tomorrow');
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

        // ═══ 30-SECOND PRE-ALERT: Show humble Nimrata banner when <=30s remain ═══
        const nextSession = this.getNextScheduledSession();
        if (nextSession && diff > 0 && diff <= 30000) {
            const preKey = 'pre_' + nextSession.hour + '_' + nextSession.startMinute;
            if (!this._preAlertShownFor || this._preAlertShownFor !== preKey) {
                this._preAlertShownFor = preKey;
                setTimeout(() => { if (this._preAlertShownFor === preKey) this._preAlertShownFor = null; }, 35000);
                this.showNimrataPreAlert(nextSession, Math.ceil(diff / 1000));
            }
        } else if (diff > 30000 && this._preAlertShownFor) {
            this._preAlertShownFor = null;
        }

        // Clear trigger guard if we're waiting for a new session
        if (nextSession) {
            const sessionKey = `${nextSession.hour}_${nextSession.startMinute}`;
            if (this.sessionAlertTriggeredFor && this.sessionAlertTriggeredFor !== sessionKey) {
                this.sessionAlertTriggeredFor = null;
            }
        }

        // Update display (with null-safety for DOM elements)
        const timeEl = document.getElementById('nextSessionTime');
        const countdownEl = document.getElementById('countdownValue');
        const subtitleEl = document.getElementById('nextSessionSubtitle');

        if (nextSession) {
            if (timeEl) timeEl.textContent = nextSession.startTime || '--:--';
            if (countdownEl) countdownEl.textContent = this.formatCountdown(diff);
            if (subtitleEl) subtitleEl.textContent = `${nextSession.startTime} - ${nextSession.endTime}`;
        } else {
            // Tomorrow's session
            const startHour = this.config.activeHours.start || 5;
            if (timeEl) timeEl.textContent = this.formatTime12h(startHour, 0);
            if (countdownEl) countdownEl.textContent = this.formatCountdown(diff);
            if (subtitleEl) subtitleEl.textContent = 'Starting fresh tomorrow morning';
        }
    }

    formatCountdown(milliseconds) {
        // Safety: handle NaN or negative values gracefully
        if (!Number.isFinite(milliseconds) || milliseconds < 0) {
            return '--';
        }
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
        if (!this.config.enabled) {
            return null;
        }
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
                // ═══ FIX BUG 2 (safety): Ensure `hour` property always exists ═══
                // Sessions from older schedules or generateDurationBasedSchedule()
                // may not have the `hour` property. Inject it from the key.
                if (session.hour === undefined) {
                    session.hour = hour;
                }

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


    /* ═════════════════════════════════════════════════════════════════════════
       SESSION HANDLING
    ═════════════════════════════════════════════════════════════════════════ */


    /**
     * Show a humble in-app Nimrata banner 30 seconds before a session.
     * Fires a soft top-of-screen banner with Gurmukhi and English messages.
     */
    showNimrataPreAlert(session, secondsLeft) {
        const msgs = [
            'ਨਾਮ ਅਭਿਆਸ ਦਾ ਸਮਾਂ ਆ ਰਿਹਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਸਾਰੇ ਕੰਮ ਛੱਡ ਦਿਓ \uD83D\uDE4F',
            'ਵਾਹਿਗੁਰੂ ਜੀ ਦਾ ਸਿਮਰਨ ਥੋੜੀ ਦੇਰ ਵਿੱਚ ਸ਼ੁਰੂ ਹੋਵੇਗਾ। ਤਿਆਰ ਹੋ ਜਾਓ \u2741',
            'Please leave all work, dear Gurmukh. Naam Abhyas begins in ' + secondsLeft + ' seconds. \uD83D\uDE4F',
            'ਬੱਸ ' + secondsLeft + ' ਸਕਿੰਟ ਬਚੇ ਹਨ। ਮਨ ਨੂੰ ਸ਼ਾਂਤ ਕਰੋ। ਵਾਹਿਗੁਰੂ \u2741',
            '30 seconds remain. Please wrap up and prepare your heart for Simran. \uD83C\uDF38',
            'ਨਾਮ ਜਪਣ ਦਾ ਵੇਲਾ ਆਉਂਦਾ ਹੈ। ਹਰ ਕੰਮ ਛੱਡ ਕੇ ਤਿਆਰ ਹੋ ਜਾਓ \uD83D\uDE4F'
        ];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];

        // Show as a top-positioned Nimrata banner (8 seconds — give user time to read)
        this.showToast('\uD83C\uDF38 ' + msg, 'nimrata', 8000);

        // Gentle single vibration — loving nudge, not startling
        if (this.config.notifications && this.config.notifications.vibration && navigator.vibrate) {
            navigator.vibrate([80]);
        }

        console.log('[NaamAbhyas] \uD83C\uDF38 Nimrata pre-alert shown for', session.startTime, '(' + secondsLeft + 's remaining)');
    }

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

        const spiritualBodies = [
            'ਸਬ ਕੰਮ ਛੱਡੋ, ਵਾਹਿਗੁਰੂ ਜੀ ਦਾ ਸਿਮਰਨ ਕਰੋ ☙',
            'Your soul is calling. Connect with Vaheguru for ' + (this.config.duration || 2) + ' sacred minutes. 🙏',
            'ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖ ਪਾਵਉ — Meditate and find eternal peace ✙',
            'Be still. Breathe. Remember the One. ' + (this.config.duration || 2) + ' minutes of Naam. ☬'
        ];
        const randomBody = spiritualBodies[Math.floor(Math.random() * spiritualBodies.length)];
        this.showBrowserNotification('🙏 ਨਾਮ ਅਭਿਆਸ ਦਾ ਸਮਾਂ | Naam Abhyas', {
            body: randomBody,
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

        // ═══ FIX BUG 4: Respect autoStartTimer setting ═══
        // If auto-start is enabled, skip the alert modal and start the session directly
        if (this.config.autoStartTimer) {
            console.log('[NaamAbhyas] ⚡ Auto-start enabled — starting meditation directly');
            if (this.ritualEngine) {
                this.ritualEngine.triggerScheduledSession(session, this.config.duration || 2);
            } else {
                this.startMeditation();
            }
            return;
        }

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

        // Auto-play Vaheguru Jaap in background
        if (this.audioManager) {
            this.audioManager.playAmbient(0.25).catch(e => console.log('Vaheguru Jaap failed:', e));
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

        // Stop Vaheguru Jaap
        if (this.audioManager) {
            this.audioManager.stopAmbient();
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

        // Stop Vaheguru Jaap
        if (this.audioManager) {
            this.audioManager.stopAmbient();
        }

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

        // ─── DUPLICATE GUARD ─────────────────────────────────────────────────
        // For scheduled sessions (not extra), reject a second completion for the
        // same hour on the same date. This prevents double-counting when a user
        // taps a notification twice, or the alarm re-fires before the first record
        // is written.
        if (!session.isExtra && session.status === 'completed' && session.hour !== undefined) {
            const alreadyRecorded = this.history.sessions.some(s =>
                s.date === session.date &&
                s.hour === session.hour &&
                !s.isExtra &&
                s.status === 'completed'
            );
            if (alreadyRecorded) {
                console.warn(`[NaamAbhyas] Duplicate session for hour ${session.hour} on ${session.date} — suppressed.`);
                return;
            }
        }
        // ─────────────────────────────────────────────────────────────────────

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

        if (session.status === 'completed' && typeof this._syncToNitemTracker === 'function') {
            this._syncToNitemTracker(session);
        }
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
        this.updateSyncHub();
    }

    updateSyncHub() {
        const nitnemProgressEl = document.getElementById('syncNitnemProgress');
        if (nitnemProgressEl && window.UnifiedStats) {
            try {
                const todayStats = window.UnifiedStats.getTodayStats();
                const totalBanis = 7;
                const completedCount = todayStats.nitnemBanis ? todayStats.nitnemBanis.length : 0;

                if (todayStats.nitnemComplete || completedCount >= totalBanis) {
                    nitnemProgressEl.textContent = 'All daily prayers completed! 🌅';
                } else if (completedCount > 0) {
                    nitnemProgressEl.textContent = `${completedCount} of ${totalBanis} prayers done today`;
                } else {
                    nitnemProgressEl.textContent = 'No prayers completed yet today';
                }
            } catch (e) {
                console.warn('[SyncHub] Failed to fetch Nitnem progress from UnifiedStats:', e);
                nitnemProgressEl.textContent = 'Tap to open tracker & view progress';
            }
        }
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
        const today = this.getTodayString();

        let html = '';

        // Group 1: Hourly Reminders
        html += `<div class="timeline-section-header">Hourly Reminders</div>`;
        html += `<div class="timeline-scheduled-list">`;
        let scheduledHtml = '';

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

            scheduledHtml += `
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

        if (!scheduledHtml) {
            scheduledHtml = '<div class="schedule-empty"><p>No scheduled sessions configured</p></div>';
        }
        html += scheduledHtml;
        html += `</div>`;

        // Group 2: Manual Practice (Extra Devotion)
        const todaysExtraCompleted = this.history.sessions.filter(s => s.date === today && s.isExtra && s.status === 'completed');

        html += `<div class="timeline-section-header extra-header">Extra Simran Sessions</div>`;
        html += `<div class="timeline-extra-list">`;
        if (todaysExtraCompleted.length > 0) {
            todaysExtraCompleted.forEach(s => {
                const startedTime = s.startedAt ? new Date(s.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : s.startTime || '';
                const durationText = s.duration ? `${Math.round(s.duration / 60)} min` : `${this.config.duration} min`;
                html += `
                    <div class="schedule-item completed extra-session-item">
                        <div class="schedule-status completed">✓</div>
                        <div class="schedule-time">
                            <div class="schedule-time-value">${startedTime}</div>
                            <div class="schedule-time-range">Manual session completed</div>
                        </div>
                        <div class="schedule-hour duration-badge" style="font-size: 11px; opacity: 0.8; font-weight: 600; background: rgba(255, 149, 0, 0.15); color: #FF9500; padding: 4px 8px; border-radius: 8px;">${durationText}</div>
                    </div>
                `;
            });
        } else {
            html += `<div class="schedule-empty"><p style="font-size:12px; color:rgba(255,255,255,0.4)">No extra sessions completed today yet.</p></div>`;
        }
        html += `</div>`;

        if (!this.config.enabled) {
            container.innerHTML = '<div class="schedule-empty"><p>Enable Naam Abhyas to see your schedule</p></div>';
        } else {
            container.innerHTML = html;
        }
    }

    _oldRenderScheduleTimeline() {
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

            // Performance: Instead of hiding canvas (which causes reflow), 
            // we just pause the starfield animation if it exists
            const starsField = document.getElementById('starsField');
            if (starsField) starsField.style.animationPlayState = 'paused';
        }
    }

    hideSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            // FIXED: Don't resume background animations since we're not hiding them
            // const canvas = document.getElementById('cosmosCanvas');
            // if (canvas) canvas.style.display = '';
            // const starsField = document.getElementById('starsField');
            // if (starsField) starsField.style.animationPlayState = '';
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

        // Generate last 7 days bar chart details
        let weekBarsHtml = '';
        const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const todayDate = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(todayDate.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLabel = daysOfWeek[d.getDay()];

            // Count completed sessions for this dateStr
            const sessionsForDay = this.history.sessions.filter(s => s.date === dateStr && s.status === 'completed');
            const completedCount = sessionsForDay.length;

            // Generate bar height (assume max 5 sessions or relative height)
            const percent = Math.min(100, Math.max(0, completedCount * 20));
            weekBarsHtml += `
                <div class="week-bar-col">
                    <div class="week-bar">
                        <div class="week-bar-fill" style="height: ${percent}%"></div>
                    </div>
                    <span class="week-bar-day">${dayLabel}</span>
                </div>
            `;
        }

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
                <h3 class="stats-section-title">7-Day Activity</h3>
                <div class="week-bars">
                    ${weekBarsHtml}
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
        // Route through AudioManager for proper preloading & AudioContext support
        if (this.audioManager) {
            this.audioManager.play(soundName).catch(e => console.log('AudioManager play failed:', e));
        } else {
            // Fallback: create audio element directly
            const audio = new Audio(`assets/sounds/${soundName}.mp3`);
            audio.play().catch(e => console.log('Audio play failed:', e));
        }
    }

    /**
     * Toggle sound preview (play/stop)
     */
    toggleSoundPreview() {
        if (this.isPreviewPlaying) {
            this.stopSoundPreview();
        } else {
            this.playSoundPreview();
        }
    }

    /**
     * Play sound preview
     */
    playSoundPreview() {
        const soundName = this.config.notifications.sound;
        if (!soundName) return;

        // Clean up any existing audio first
        if (this.previewAudio) {
            this.previewAudio.pause();
            this.previewAudio = null;
        }

        // Create new audio for preview
        this.previewAudio = new Audio(`assets/sounds/${soundName}.mp3`);
        this.previewAudio.loop = true;

        // Set state BEFORE playing to prevent race conditions
        this.isPreviewPlaying = true;
        this.updatePreviewButtonState(true);

        this.previewAudio.play().then(() => {
            console.log('[NaamAbhyas] Sound preview playing:', soundName);
        }).catch(e => {
            console.log('Preview play failed:', e);
            this.isPreviewPlaying = false;
            this.updatePreviewButtonState(false);
            this.previewAudio = null;
        });

        // Auto-stop after 5 seconds
        if (this.previewTimeout) clearTimeout(this.previewTimeout);
        this.previewTimeout = setTimeout(() => {
            if (this.isPreviewPlaying) {
                this.stopSoundPreview();
            }
        }, 5000);
    }

    /**
     * Stop sound preview
     */
    stopSoundPreview() {
        if (this.previewAudio) {
            this.previewAudio.pause();
            this.previewAudio = null;
        }

        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
            this.previewTimeout = null;
        }

        this.isPreviewPlaying = false;
        this.updatePreviewButtonState(false);
        console.log('[NaamAbhyas] Sound preview stopped');
    }

    /**
     * Update preview button UI state
     */
    updatePreviewButtonState(isPlaying) {
        const btn = document.getElementById('previewSoundBtn');
        if (!btn) return;

        const playIcon = btn.querySelector('.play-icon');
        const stopIcon = btn.querySelector('.stop-icon');

        if (playIcon) playIcon.style.display = isPlaying ? 'none' : 'block';
        if (stopIcon) stopIcon.style.display = isPlaying ? 'block' : 'none';

        btn.classList.toggle('playing', isPlaying);
        btn.setAttribute('aria-label', isPlaying ? 'Stop preview' : 'Preview sound');
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
            icon: '/assets/icon-192x192.png',
            badge: '/assets/icon-72x72.png',
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
            // Avoid forced synchronous layout (forced reflow) via rAF nesting
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    card.style.animation = 'wisdomAppear 0.6s ease-out';
                });
            });
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

    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ',
            nimrata: '🌸'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
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
function initNaamAbhyas() {
    if (window.naamAbhyas && typeof window.naamAbhyas.init === 'function') {
        window.naamAbhyas.init();
    } else {
        window.naamAbhyas = new NaamAbhyas();
        window.naamAbhyas.init();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNaamAbhyas);
} else {
    initNaamAbhyas();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NaamAbhyas;
}

/**
 * ═══ HELPER METHODS FOR PREMIUM OVERHAUL ═══
 */

NaamAbhyas.prototype._updateActivePreset = function (mins) {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.min) === mins);
    });
};

NaamAbhyas.prototype.showCompletionModal = function (stats) {
    const modal = document.getElementById('completionModal');
    if (!modal) return;

    // Rotating high-spirit blessings
    const blessings = [
        "Millions of sins erased. You are purified.",
        "The mind is stilled. The soul is awake.",
        "You walked with the Guru for these moments.",
        "A peaceful heart is a sacred temple.",
        "Simran is the only true wealth. You are rich today.",
        "ਧੰਨੁ ਧੰਨੁ ਤੂ ਮੇਰੇ ਸਤਿਗੁਰਾ... Blessed are you, O True Guru."
    ];
    const randomBlessing = blessings[Math.floor(Math.random() * blessings.length)];

    const blessingEl = document.getElementById('completionBlessing');
    if (blessingEl) blessingEl.textContent = randomBlessing;

    // Update stats
    if (stats) {
        if (document.getElementById('compDuration')) document.getElementById('compDuration').textContent = `${stats.duration}m`;
        if (document.getElementById('compStreak')) document.getElementById('compStreak').textContent = stats.streak;
        if (document.getElementById('compToday')) document.getElementById('compToday').textContent = `${stats.today}/${stats.goal}`;
    }

    modal.classList.add('active');
    this.playIosChime('completion');
};

NaamAbhyas.prototype.playIosChime = function (type) {
    if (!this.config.notifications.soundEnabled) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'completion') {
            // Harmonic high-pitch bell
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.8);
        } else {
            // Standard iOS-like "tnnn"
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(660, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
        }
    } catch (e) { console.warn('Audio API chime failed', e); }
};

NaamAbhyas.prototype._syncToNitemTracker = function (sessionData) {
    try {
        const today = this.getTodayString();

        // ── 1. Save to nitnem_tracker_data (DashboardAnalytics format) ──
        const trackerData = JSON.parse(localStorage.getItem('nitnem_tracker_data') || '{}');
        if (!trackerData[today]) trackerData[today] = { naam_abhyas: 0, sessions: [] };
        trackerData[today].naam_abhyas = (trackerData[today].naam_abhyas || 0) + 1;
        trackerData[today].sessions.push({
            time: new Date().toLocaleTimeString(),
            duration: sessionData.duration,
            isScheduled: sessionData.isScheduled
        });
        localStorage.setItem('nitnem_tracker_data', JSON.stringify(trackerData));

        // ── 2. Persist to canonical naamAbhyas_sessions key ──
        // global-alarm-system.js and other readers use this key.
        const existingSessions = JSON.parse(localStorage.getItem('naamAbhyas_sessions') || '[]');
        existingSessions.push({
            date: today,
            timestamp: new Date().toISOString(),
            duration: sessionData.duration || 0,
            count: sessionData.count || 0,
            isScheduled: !!sessionData.isScheduled
        });
        // Keep last 365 sessions only
        if (existingSessions.length > 365) existingSessions.splice(0, existingSessions.length - 365);
        localStorage.setItem('naamAbhyas_sessions', JSON.stringify(existingSessions));

        // ── 3. Update AnhadStats streak (if available) ──
        if (window.AnhadStats && typeof window.AnhadStats.addNitnemCompleted === 'function') {
            window.AnhadStats.addNitnemCompleted(1);
        }

        // ── 4. Broadcast to other tabs + global alarm system ──
        window.dispatchEvent(new CustomEvent('naamAbhyasSessionComplete', { detail: sessionData }));
        window.dispatchEvent(new CustomEvent('naamAbhyasComplete', { detail: sessionData }));

        console.log('[NaamAbhyas] ✅ Session saved and synced:', {
            date: today, duration: sessionData.duration
        });
    } catch (e) { console.error('[NaamAbhyas] Nitnem sync failed', e); }
};

