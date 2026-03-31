/* ═══════════════════════════════════════════════════════════════════════════════
   NITNEM TRACKER - PREMIUM iOS 26+ APPLICATION
   Part 1: Core System, State, Storage, Amritvela, Nitnem, Themes, UI
   ═══════════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 1: CONFIGURATION & CONSTANTS
   ───────────────────────────────────────────────────────────────────────────── */

const CONFIG = {
    // App Info
    APP_NAME: 'Nitnem Tracker',
    APP_VERSION: '1.0.0',

    // Storage Keys
    STORAGE_KEYS: {
        USER_DATA: 'nitnemTracker_userData',
        SETTINGS: 'nitnemTracker_settings',
        AMRITVELA_LOG: 'nitnemTracker_amritvelaLog',
        NITNEM_LOG: 'nitnemTracker_nitnemLog',
        MALA_LOG: 'nitnemTracker_malaLog',
        ALARM_LOG: 'nitnemTracker_alarmLog',
        STREAK_DATA: 'nitnemTracker_streakData',
        ACHIEVEMENTS: 'nitnemTracker_achievements',
        SELECTED_BANIS: 'nitnemTracker_selectedBanis',
        THEME: 'nitnemTracker_theme'
    },

    // Amritvela Time Slots (in hours, 24h format)
    AMRITVELA_SLOTS: {
        EXCELLENT: { start: 0, end: 4, label: 'Excellent', message: '🌟 ਬਹੁਤ ਵਧੀਆ! You woke up in true Amritvela!' },
        GOOD: { start: 4, end: 5, label: 'Good', message: '✨ ਵਧੀਆ! Great start to your spiritual day!' },
        OKAY: { start: 5, end: 6, label: 'Okay', message: '👍 Good effort! Try waking a bit earlier tomorrow.' },
        LATE: { start: 6, end: 24, label: 'Late', message: '🌅 You\'re here! Tomorrow, try to wake before 6 AM.' }
    },

    // Mala Settings
    MALA: {
        DEFAULT_BEADS: 108,
        BEAD_OPTIONS: [27, 54, 108],
        VIBRATION_PATTERNS: {
            light: [10],
            medium: [20],
            strong: [30, 10, 30]
        }
    },

    // Default Settings
    DEFAULT_SETTINGS: {
        theme: 'gradient',
        hapticEnabled: true,
        soundEnabled: true,
        autoWakeDetect: true,
        presentUntil: 7,
        beadsPerMala: 108,
        vibrationPattern: 'medium'
    },

    // Animation Durations (ms)
    ANIMATION: {
        FAST: 150,
        NORMAL: 300,
        SLOW: 500
    },

    // API Endpoints (for future use)
    API: {
        BANIS: './data/banis.json',
        ACHIEVEMENTS: './data/achievements.json',
        MARYADA: './data/maryada-schedule.json'
    }
};

// Time Period Constants
const TIME_PERIODS = {
    AMRITVELA: 'amritvela',
    REHRAS: 'rehras',
    SOHILA: 'sohila'
};

// Achievement IDs
const ACHIEVEMENT_IDS = {
    FIRST_AMRITVELA: 'first-amritvela',
    WEEK_STREAK: 'week-streak',
    MONTH_STREAK: 'month-streak',
    MALA_MASTER: 'mala-master',
    NITNEM_COMPLETE: 'nitnem-complete',
    PERFECT_WEEK: 'perfect-week'
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 2: UTILITY FUNCTIONS
   ───────────────────────────────────────────────────────────────────────────── */

const Utils = {
    /**
     * Generate unique ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Get today's date as YYYY-MM-DD string
     */
    getTodayString() {
        return new Date().toLocaleDateString('en-CA');
    },

    /**
     * Get current time as HH:MM string
     */
    getCurrentTimeString() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    },

    /**
     * Format time to 12-hour format
     */
    formatTime12h(hours, minutes) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const h = hours % 12 || 12;
        const m = minutes.toString().padStart(2, '0');
        return { hours: h, minutes: m, period };
    },

    /**
     * Get week number of the year
     */
    getWeekNumber(date = new Date()) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },

    /**
     * Get start and end of current week
     */
    getWeekRange(date = new Date()) {
        const curr = new Date(date);
        const first = curr.getDate() - curr.getDay();
        const last = first + 6;

        const start = new Date(curr.setDate(first));
        start.setHours(0, 0, 0, 0);

        const end = new Date(curr.setDate(last));
        end.setHours(23, 59, 59, 999);

        return { start, end };
    },

    /**
     * Get days in a month
     */
    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    },

    /**
     * Calculate streak from date array
     */
    calculateStreak(dates) {
        if (!dates || dates.length === 0) return 0;

        const sortedDates = [...dates].sort((a, b) => new Date(b) - new Date(a));
        const today = Utils.getTodayString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toLocaleDateString('en-CA');

        // Check if streak is active (today or yesterday)
        if (sortedDates[0] !== today && sortedDates[0] !== yesterdayString) {
            return 0;
        }

        let streak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
            const current = new Date(sortedDates[i]);
            const prev = new Date(sortedDates[i + 1]);
            const diffDays = (current - prev) / (1000 * 60 * 60 * 24);

            if (diffDays === 1) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Merge objects deeply
     */
    deepMerge(target, source) {
        const output = { ...target };
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                if (isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = Utils.deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;

        function isObject(item) {
            return item && typeof item === 'object' && !Array.isArray(item);
        }
    },

    /**
     * Format percentage
     */
    formatPercentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    },

    /**
     * Animate number counting
     */
    animateNumber(element, start, end, duration = 500) {
        const range = end - start;
        const startTime = performance.now();

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

            const current = Math.round(start + (range * easeProgress));
            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    },

    /**
     * Get ordinal suffix for number
     */
    getOrdinalSuffix(num) {
        const j = num % 10;
        const k = num % 100;
        if (j === 1 && k !== 11) return num + 'st';
        if (j === 2 && k !== 12) return num + 'nd';
        if (j === 3 && k !== 13) return num + 'rd';
        return num + 'th';
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 2.1: THEME ENGINE
   ───────────────────────────────────────────────────────────────────────────── */

class NitnemTrackerThemeEngine {
    constructor() {
        // ONLY light and dark themes as requested
        this.themes = ['light', 'dark'];
        
        // Sync with global theme first
        const globalTheme = localStorage.getItem('anhad_theme') || 'light';
        this.currentTheme = this.themes.includes(globalTheme) ? globalTheme : 'light';
        
        // Save synced theme to Nitnem storage
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, this.currentTheme);
        
        this.init();
    }

    init() {
        // Apply initial theme
        this.applyTheme(this.currentTheme);

        // Listen for global theme changes
        this.setupGlobalThemeSync();

        // Listen for DOM content loaded to setup UI
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.renderThemeSelector());
        } else {
            this.renderThemeSelector();
        }
    }

    setupGlobalThemeSync() {
        // Listen for storage changes (theme changes from other tabs/pages)
        window.addEventListener('storage', (e) => {
            if (e.key === 'anhad_theme' && e.newValue) {
                const newTheme = this.themes.includes(e.newValue) ? e.newValue : 'light';
                this.applyTheme(newTheme);
                console.log('🎨 Nitnem synced with global theme:', newTheme);
            }
        });

        // Listen for custom theme change events
        window.addEventListener('themechange', (e) => {
            if (e.detail?.theme) {
                const newTheme = this.themes.includes(e.detail.theme) ? e.detail.theme : 'light';
                this.applyTheme(newTheme);
                console.log('🎨 Nitnem theme changed via event:', newTheme);
            }
        });
    }

    applyTheme(themeName) {
        // Only allow light or dark
        if (!this.themes.includes(themeName)) themeName = 'light';

        this.currentTheme = themeName;

        // Apply to BOTH html and body for CSS selector compatibility
        document.documentElement.setAttribute('data-theme', themeName);
        document.body.setAttribute('data-theme', themeName);

        // Also add class for maximum compatibility
        document.documentElement.classList.remove('theme-light', 'theme-dark');
        document.documentElement.classList.add(`theme-${themeName}`);
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${themeName}`);

        // Save to both local and global storage
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, themeName);
        localStorage.setItem('anhad_theme', themeName);

        // Update UI if it exists
        this.updateActiveThemeButton();

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('nitnemThemeChanged', { detail: { theme: themeName } }));

        console.log(`[ThemeEngine] Applied theme: ${themeName}`);
    }

    renderThemeSelector() {
        const container = document.getElementById('themeOptions');
        if (!container) return;

        // Attach event listeners to buttons
        const buttons = container.querySelectorAll('.theme-option');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                if (theme) {
                    this.applyTheme(theme);

                    // Add haptic feedback if available
                    if (window.navigator.vibrate && CONFIG.DEFAULT_SETTINGS.hapticEnabled) {
                        window.navigator.vibrate(10);
                    }
                }
            });
        });

        this.updateActiveThemeButton();
    }

    updateActiveThemeButton() {
        const container = document.getElementById('themeOptions');
        if (!container) return;

        const buttons = container.querySelectorAll('.theme-option');
        buttons.forEach(btn => {
            if (btn.dataset.theme === this.currentTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}


/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 3: STORAGE MANAGER
   ───────────────────────────────────────────────────────────────────────────── */

const StorageManager = {
    /**
     * Initialize storage and sync with IndexedDB
     */
    async init() {
        // Wait for GurbaniStorage to be ready
        if (window.GurbaniStorage) {
            await window.GurbaniStorage.init();
            await this.syncFromIndexedDB();
        }
    },

    /**
     * Sync data from IndexedDB to localStorage (for startup)
     */
    async syncFromIndexedDB() {
        try {
            if (!window.GurbaniStorage || !window.GurbaniStorage.isReady) return;

            // Check if we have data in IndexedDB but not in localStorage
            const storedData = await window.GurbaniStorage.get('nitnemTracker', 'all_data');
            if (storedData) {
                // Restore each key
                Object.entries(CONFIG.STORAGE_KEYS).forEach(([name, key]) => {
                    if (storedData[name] && !localStorage.getItem(key)) {
                        localStorage.setItem(key, JSON.stringify(storedData[name]));
                    }
                });
            }

            // Also check for sync data from Smart Reminders
            const reminderSync = await window.GurbaniStorage.get('sync', 'reminder_to_nitnem');
            if (reminderSync) {
                // Store alarm data for the alarm obedience tracker
                this.save(CONFIG.STORAGE_KEYS.ALARM_LOG, {
                    ...this.load(CONFIG.STORAGE_KEYS.ALARM_LOG, {}),
                    syncedAlarms: reminderSync.alarms,
                    lastSync: reminderSync.lastSync
                });
            }
        } catch (error) {
            console.warn('IndexedDB sync error:', error);
        }
    },

    /**
     * Save data to localStorage AND IndexedDB
     */
    save(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(key, serialized);

            // Also persist to IndexedDB
            this.persistToIndexedDB();

            return true;
        } catch (error) {
            console.error(`Storage save error for ${key}:`, error);
            return false;
        }
    },

    /**
     * Load data from localStorage
     */
    load(key, defaultValue = null) {
        try {
            const serialized = localStorage.getItem(key);
            if (serialized === null) return defaultValue;

            // Try to parse as JSON, but if it fails and value looks like a plain string,
            // return it as-is (for backward compatibility with non-JSON storage like theme)
            try {
                return JSON.parse(serialized);
            } catch (parseError) {
                // If it's a simple string value (like "light" or "dark"), return it directly
                if (typeof serialized === 'string' && !serialized.startsWith('{') && !serialized.startsWith('[')) {
                    return serialized;
                }
                // Only log error for actual JSON parsing failures
                console.warn(`Storage: Non-JSON value for ${key}, returning raw value`);
                return serialized;
            }
        } catch (error) {
            console.error(`Storage load error for ${key}:`, error);
            return defaultValue;
        }
    },

    /**
     * Remove data from localStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            this.persistToIndexedDB();
            return true;
        } catch (error) {
            console.error(`Storage remove error for ${key}:`, error);
            return false;
        }
    },

    /**
     * Persist all data to IndexedDB with retry logic
     */
    _persistPending: false,
    _persistDebounceTimer: null,

    async persistToIndexedDB() {
        // Debounce multiple rapid calls
        if (this._persistDebounceTimer) {
            clearTimeout(this._persistDebounceTimer);
        }

        this._persistDebounceTimer = setTimeout(async () => {
            await this._doPersistToIndexedDB();
        }, 100);
    },

    async _doPersistToIndexedDB() {
        // Prevent concurrent persists
        if (this._persistPending) return;
        this._persistPending = true;

        try {
            // Check if GurbaniStorage is available
            if (!window.GurbaniStorage) {
                console.log('GurbaniStorage not available, using localStorage only');
                return;
            }

            // Ensure database is initialized
            if (!window.GurbaniStorage.isReady) {
                try {
                    await window.GurbaniStorage.init();
                } catch (initError) {
                    console.warn('GurbaniStorage init failed:', initError);
                    return;
                }
            }

            // Collect all data
            const allData = {};
            Object.entries(CONFIG.STORAGE_KEYS).forEach(([name, key]) => {
                const data = this.load(key);
                if (data !== null) {
                    allData[name] = data;
                }
            });

            // Save to IndexedDB with retry
            let retries = 2;
            while (retries > 0) {
                try {
                    await window.GurbaniStorage.set('nitnemTracker', 'all_data', allData);
                    break; // Success
                } catch (transactionError) {
                    retries--;
                    if (retries > 0) {
                        console.warn('IndexedDB transaction retry...', transactionError);
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } else {
                        throw transactionError;
                    }
                }
            }

            // Also sync completion data for Smart Reminders
            const amritvelaLog = this.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
            const nitnemLog = this.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});
            const malaLog = this.load(CONFIG.STORAGE_KEYS.MALA_LOG, {});
            const streakData = this.load(CONFIG.STORAGE_KEYS.STREAK_DATA, {});

            try {
                await window.GurbaniStorage.set('sync', 'nitnem_to_reminder', {
                    completions: {
                        amritvela: amritvelaLog,
                        nitnem: nitnemLog,
                        mala: malaLog,
                        streak: streakData
                    },
                    lastSync: Date.now()
                });
            } catch (syncError) {
                // Sync error is non-fatal
                console.warn('Sync data persist error (non-fatal):', syncError);
            }
        } catch (error) {
            // All IndexedDB errors are non-fatal - localStorage is primary
            console.warn('IndexedDB persist error (non-fatal):', error);
        } finally {
            this._persistPending = false;
        }
    },

    /**
     * Clear all app data
     */
    clearAll() {
        Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
            this.remove(key);
        });

        // Also clear from IndexedDB
        if (window.GurbaniStorage && window.GurbaniStorage.isReady) {
            window.GurbaniStorage.clear('nitnemTracker');
        }
    },

    /**
     * Export all data as JSON
     */
    exportData() {
        const data = {};
        Object.entries(CONFIG.STORAGE_KEYS).forEach(([name, key]) => {
            data[name] = this.load(key);
        });
        return JSON.stringify(data, null, 2);
    },

    /**
     * Import data from JSON
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            Object.entries(data).forEach(([name, value]) => {
                const key = CONFIG.STORAGE_KEYS[name];
                if (key && value !== null) {
                    this.save(key, value);
                }
            });
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    },

    /**
     * Get storage usage
     */
    getStorageUsage() {
        let total = 0;
        Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) total += item.length * 2; // UTF-16 characters
        });
        return {
            bytes: total,
            kb: (total / 1024).toFixed(2),
            mb: (total / (1024 * 1024)).toFixed(4)
        };
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 4: HAPTIC FEEDBACK MANAGER
   ───────────────────────────────────────────────────────────────────────────── */

const HapticManager = {
    isSupported: 'vibrate' in navigator,
    isEnabled: true,

    /**
     * Initialize haptic settings
     */
    init() {
        const settings = StorageManager.load(CONFIG.STORAGE_KEYS.SETTINGS, CONFIG.DEFAULT_SETTINGS);
        this.isEnabled = settings.hapticEnabled;
    },

    /**
     * Toggle haptic feedback
     */
    toggle(enabled) {
        this.isEnabled = enabled;
    },

    /**
     * Light impact feedback
     */
    light() {
        if (!this.isSupported || !this.isEnabled) return;
        navigator.vibrate(10);
    },

    /**
     * Medium impact feedback
     */
    medium() {
        if (!this.isSupported || !this.isEnabled) return;
        navigator.vibrate(20);
    },

    /**
     * Heavy impact feedback
     */
    heavy() {
        if (!this.isSupported || !this.isEnabled) return;
        navigator.vibrate([30, 10, 30]);
    },

    /**
     * Success feedback pattern
     */
    success() {
        if (!this.isSupported || !this.isEnabled) return;
        navigator.vibrate([10, 50, 20]);
    },

    /**
     * Error feedback pattern
     */
    error() {
        if (!this.isSupported || !this.isEnabled) return;
        navigator.vibrate([50, 30, 50, 30, 50]);
    },

    /**
     * Warning feedback pattern
     */
    warning() {
        if (!this.isSupported || !this.isEnabled) return;
        navigator.vibrate([30, 20, 30]);
    },

    /**
     * Mala bead tap feedback
     */
    malaTap() {
        if (!this.isSupported || !this.isEnabled) return;
        const settings = StorageManager.load(CONFIG.STORAGE_KEYS.SETTINGS, CONFIG.DEFAULT_SETTINGS);
        const pattern = CONFIG.MALA.VIBRATION_PATTERNS[settings.vibrationPattern] || [20];
        navigator.vibrate(pattern);
    },

    /**
     * Mala complete feedback
     */
    malaComplete() {
        if (!this.isSupported || !this.isEnabled) return;
        navigator.vibrate([50, 50, 50, 50, 100]);
    },

    /**
     * Selection change feedback
     */
    selection() {
        if (!this.isSupported || !this.isEnabled) return;
        navigator.vibrate(5);
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 5: SOUND MANAGER
   ───────────────────────────────────────────────────────────────────────────── */

const SoundManager = {
    isEnabled: true,
    audioContext: null,

    /**
     * Initialize sound settings
     */
    init() {
        const settings = StorageManager.load(CONFIG.STORAGE_KEYS.SETTINGS, CONFIG.DEFAULT_SETTINGS);
        this.isEnabled = settings.soundEnabled;

        // Create audio context on user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    },

    /**
     * Toggle sound
     */
    toggle(enabled) {
        this.isEnabled = enabled;
    },

    /**
     * Play a tone
     */
    playTone(frequency, duration, type = 'sine') {
        if (!this.isEnabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    },

    /**
     * Play success sound
     */
    success() {
        this.playTone(523.25, 0.1); // C5
        setTimeout(() => this.playTone(659.25, 0.1), 100); // E5
        setTimeout(() => this.playTone(783.99, 0.2), 200); // G5
    },

    /**
     * Play mala tap sound
     */
    malaTap() {
        this.playTone(880, 0.05); // A5
    },

    /**
     * Play mala complete sound
     */
    malaComplete() {
        this.playTone(523.25, 0.15);
        setTimeout(() => this.playTone(659.25, 0.15), 150);
        setTimeout(() => this.playTone(783.99, 0.15), 300);
        setTimeout(() => this.playTone(1046.50, 0.3), 450);
    },

    /**
     * Play notification sound
     */
    notification() {
        this.playTone(587.33, 0.1); // D5
        setTimeout(() => this.playTone(880, 0.15), 100); // A5
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 6: TOAST NOTIFICATION SYSTEM
   ───────────────────────────────────────────────────────────────────────────── */

const Toast = {
    container: null,
    queue: [],
    isProcessing: false,

    /**
     * Initialize toast container
     */
    init() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toastContainer';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    /**
     * Show toast notification
     */
    show({ title, message, type = 'info', duration = 3000 }) {
        this.queue.push({ title, message, type, duration });
        this.processQueue();
    },

    /**
     * Process toast queue
     */
    processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        const { title, message, type, duration } = this.queue.shift();

        const toast = this.createToastElement(title, message, type);
        this.container.appendChild(toast);

        // Trigger reflow for animation
        toast.offsetHeight;

        // Auto remove
        const autoRemove = setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        // Manual close
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn?.addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.removeToast(toast);
        });
    },

    /**
     * Create toast element
     */
    createToastElement(title, message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <span class="toast-title">${title}</span>
                ${message ? `<span class="toast-message">${message}</span>` : ''}
            </div>
            <button class="toast-close" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        `;

        return toast;
    },

    /**
     * Remove toast with animation
     */
    removeToast(toast) {
        toast.classList.add('exiting');

        setTimeout(() => {
            toast.remove();
            this.isProcessing = false;
            this.processQueue();
        }, CONFIG.ANIMATION.FAST);
    },

    // Convenience methods
    success(title, message) {
        HapticManager.success();
        this.show({ title, message, type: 'success' });
    },

    error(title, message) {
        HapticManager.error();
        this.show({ title, message, type: 'error' });
    },

    warning(title, message) {
        HapticManager.warning();
        this.show({ title, message, type: 'warning' });
    },

    info(title, message) {
        HapticManager.light();
        this.show({ title, message, type: 'info' });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 7: MODAL SYSTEM
   ───────────────────────────────────────────────────────────────────────────── */

const ModalManager = {
    activeModals: [],

    /**
     * Initialize modal system
     */
    init() {
        // Safety: Clear any stuck overflow from previous errors
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';

        // Close modal on backdrop click
        document.querySelectorAll('[data-close-modal]').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el || el.hasAttribute('data-close-modal')) {
                    const modal = el.closest('.modal-overlay');
                    if (modal) this.close(modal.id);
                }
            });
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModals.length > 0) {
                this.close(this.activeModals[this.activeModals.length - 1]);
            }
        });

        // Handle swipe to close
        this.initSwipeToClose();
    },

    /**
     * Initialize swipe to close functionality
     */
    initSwipeToClose() {
        document.querySelectorAll('.modal-container').forEach(container => {
            let startY = 0;
            let currentY = 0;
            let isDragging = false;

            container.addEventListener('touchstart', (e) => {
                // Only allow swipe if we are at the very top of the scroll
                const modalBody = e.target.closest('.modal-body');
                if (modalBody && modalBody.scrollTop > 5) { // Tolerance
                    return;
                }

                // Don't swipe if touching an interactive element
                if (e.target.closest('button, input, .bani-item, .category-header')) return;

                startY = e.touches[0].clientY;
                isDragging = true;
            }, { passive: true });

            container.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                currentY = e.touches[0].clientY;
                const diff = currentY - startY;

                if (diff > 0) {
                    container.style.transform = `translateY(${diff}px)`;
                    container.style.transition = 'none';
                }
            }, { passive: true });

            container.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;

                const diff = currentY - startY;
                container.style.transition = '';
                container.style.transform = '';

                if (diff > 150) {
                    const modal = container.closest('.modal-overlay');
                    if (modal) this.close(modal.id);
                }
            });
        });
    },

    /**
     * Open modal
     */
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        if (this.activeModals.includes(modalId)) return; // Prevent duplicates

        try {
            HapticManager.light();
        } catch (e) {
            // Haptic not available, continue
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.activeModals.push(modalId);

        // Focus first focusable element
        try {
            const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            focusable?.focus();
        } catch (e) {
            // Focus error, continue
        }

        // Dispatch event
        modal.dispatchEvent(new CustomEvent('modalOpened', { detail: { modalId } }));
    },

    /**
     * Close modal
     */
    close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        HapticManager.light();
        modal.classList.remove('active');

        const index = this.activeModals.indexOf(modalId);
        if (index > -1) this.activeModals.splice(index, 1);

        if (this.activeModals.length === 0) {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = ''; // Double safety
        }

        // Dispatch event
        modal.dispatchEvent(new CustomEvent('modalClosed', { detail: { modalId } }));
    },

    /**
     * Toggle modal
     */
    toggle(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        if (modal.classList.contains('active')) {
            this.close(modalId);
        } else {
            this.open(modalId);
        }
    },

    /**
     * Close all modals
     */
    closeAll() {
        [...this.activeModals].forEach(id => this.close(id));
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 8: THEME MANAGER
   ───────────────────────────────────────────────────────────────────────────── */

/* ThemeManager removed and replaced by NitnemTrackerThemeEngine */
;

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 9: HEADER & CLOCK MANAGER
   ───────────────────────────────────────────────────────────────────────────── */

const HeaderManager = {
    elements: {},
    clockInterval: null,

    /**
     * Initialize header
     */
    init() {
        // Cache elements
        this.elements = {
            header: document.getElementById('appHeader'),
            statusPill: document.getElementById('statusPill'),
            currentTime: document.getElementById('currentTime'),
            headerStreakCount: document.getElementById('headerStreakCount'),
            headerSubtitle: document.getElementById('headerSubtitle'),
            currentHour: document.getElementById('currentHour'),
            currentMinute: document.getElementById('currentMinute'),
            timePeriod: document.getElementById('timePeriod')
        };

        // Start clock
        this.startClock();

        // Setup scroll behavior
        this.setupScrollBehavior();

        // Update streak in header
        this.updateStreakDisplay();

        // Fix header layout styles
        this.fixHeaderLayout();
    },

    /**
     * Inject CSS to ensure correct header layout
     */
    fixHeaderLayout() {
        const style = document.createElement('style');
        style.innerHTML = `
            /* 1. Header Layout - Transparent Container */
            .app-header {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: auto;
                min-height: 120px; /* Space for Pill + Box */
                background: transparent; /* Remove full bar */
                pointer-events: none; /* Let clicks pass through empty areas */
                z-index: 1000;
                transition: transform 0.3s ease;
                padding-top: env(safe-area-inset-top);
            }

            .header-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                pointer-events: auto;
                position: relative;
                width: 100%;
                padding: 10px 16px;
            }

            /* 2. Status Pill (Black Streak Bar) - Top Center */
            #statusPill, .status-pill {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                background: rgba(0, 0, 0, 0.85); /* Black bar */
                color: #fff;
                border-radius: 20px;
                padding: 4px 16px;
                order: -1; /* At the very top */
                margin-bottom: 12px;
                z-index: 20;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            }

            /* 3. Small White Box (Title) - Middle Center */
            .header-title-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                
                /* Box Styles */
                background: #ffffff;
                padding: 8px 24px;
                border-radius: 16px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08); /* Shadow Gradient */
                width: auto;
                min-width: 140px;
                
                /* Reset Position */
                position: relative;
                left: auto;
                transform: none;
                order: 0; /* Below Pill */
                pointer-events: auto;
            }

            /* Dark Mode Support for Box */
            [data-theme="dark"] .header-title-section {
                background: #1c1c1e;
                border: 1px solid rgba(255,255,255,0.1);
            }

            /* Title Text */
            .header-title-section h1 {
                font-size: 0.95rem;
                font-weight: 600;
                color: #000000;
                margin: 0;
                opacity: 1;
            }
            [data-theme="dark"] .header-title-section h1 {
                color: #ffffff;
            }

            /* Hide Subtitle (Greeting) to keep box small and focused */
            #headerSubtitle {
                display: none;
            }

            /* 4. Buttons (Back & Actions) - Lowered to align with Box */
            .back-btn, .header-actions {
                position: absolute;
                top: 55px; /* Aligned with the White Box */
                pointer-events: auto;
                z-index: 30;
            }
            .back-btn { left: 16px; }
            .header-actions { right: 16px; }

            /* 5. Fix Add Bani Modal - Accordion Expansion */
            .category-banis {
                display: none; /* Hidden by default */
            }
            /* This fixes the 'not opening' issue by forcing display when expanded */
            .bani-category.expanded .category-banis {
                display: block !important;
                animation: slideDown 0.3s ease-out;
            }

            /* 6. Fix Strikethrough - Remove line from selected/completed banis GLOBALLY */
            .bani-select-item.selected .bani-select-name,
            .bani-select-item.selected .bani-select-english,
            .bani-item.completed .bani-name,
            .bani-item.completed .bani-name-english {
                text-decoration: none !important;
                position: relative;
                font-weight: 600;
            }
            .bani-item.completed .bani-name::after,
            .bani-item.completed .bani-name-english::after {
                content: none !important;
                display: none !important;
            }
            
            /* Green Highlight for Selected/Completed */
            .bani-select-item.selected,
            .bani-item.completed {
                background: rgba(52, 199, 89, 0.1) !important;
                border-left: 3px solid #34C759 !important;
            }

            /* 7. Half-Height Modals (Settings & Stats) */
            #settingsModal .modal-container, 
            #statsModal .modal-container {
                height: 55vh !important;
                max-height: 55vh !important;
                top: auto !important;
                bottom: 0 !important;
                border-top-left-radius: 24px;
                border-top-right-radius: 24px;
            }
            #settingsModal .modal-body,
            #statsModal .modal-body {
                overflow-y: auto;
                overscroll-behavior-y: contain;
                padding-bottom: 30px;
            }

            /* Disable Dynamic Island Overlay */
            body::before { display: none; }

            /* Hide on scroll */
            .app-header.header-hidden {
                transform: translateY(-100%);
            }
            
            /* Main Content Padding - clear the layout */
            .main-content {
                padding-top: 140px; 
            }

            /* Animation */
            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* 8. Fix Modal Content Scrolling & Dropdowns */
            .modal-display, .modal-body {
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
                overscroll-behavior-y: contain !important;
                max-height: 80vh; /* Safety cap */
            }

            .category-header {
                cursor: pointer !important;
                user-select: none !important;
                pointer-events: auto !important;
                padding: 16px !important;
                position: relative;
                z-index: 10;
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
            }
            
            .category-arrow {
                pointer-events: none; 
            }

            /* Grouped Badge Styles */
            .bani-badge {
                background: var(--ios-blue);
                color: white;
                font-size: 11px;
                font-weight: 700;
                padding: 2px 8px;
                border-radius: 12px;
                margin-left: 8px;
                display: inline-flex;
                align-items: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .bani-item.completed .bani-badge {
                background: #fff;
                color: var(--ios-green);
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Start real-time clock
     */
    startClock() {
        const updateClock = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();

            const formatted = Utils.formatTime12h(hours, minutes);

            if (this.elements.currentTime) {
                this.elements.currentTime.textContent = `${formatted.hours}:${formatted.minutes}`;
            }

            if (this.elements.currentHour) {
                this.elements.currentHour.textContent = formatted.hours.toString().padStart(2, '0');
            }

            if (this.elements.currentMinute) {
                this.elements.currentMinute.textContent = formatted.minutes;
            }

            if (this.elements.timePeriod) {
                this.elements.timePeriod.textContent = formatted.period;
            }

            // Update subtitle based on time
            this.updateSubtitle(hours);
        };

        updateClock();
        this.clockInterval = setInterval(updateClock, 1000);
    },

    /**
     * Update header subtitle based on time of day
     */
    updateSubtitle(hours) {
        let subtitle = 'Your Spiritual Journey';

        if (hours >= 3 && hours < 6) {
            subtitle = 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ | Amritvela Time';
        } else if (hours >= 6 && hours < 12) {
            subtitle = 'ਸ਼ੁਭ ਸਵੇਰ | Good Morning';
        } else if (hours >= 12 && hours < 17) {
            subtitle = 'ਸ਼ੁਭ ਦੁਪਹਿਰ | Good Afternoon';
        } else if (hours >= 17 && hours < 21) {
            subtitle = 'ਸ਼ੁਭ ਸ਼ਾਮ | Good Evening';
        } else {
            subtitle = 'ਸ਼ੁਭ ਰਾਤ | Good Night';
        }

        if (this.elements.headerSubtitle) {
            this.elements.headerSubtitle.textContent = subtitle;
        }
    },

    /**
     * Setup scroll behavior for header
     * Hide on scroll down, show on scroll up
     */
    setupScrollBehavior() {
        // Use window scroll instead of element scroll for better compatibility
        let lastScrollTop = window.scrollY || document.documentElement.scrollTop;
        let ticking = false;
        const scrollThreshold = 10;

        const updateHeader = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollDifference = scrollTop - lastScrollTop;

            // Only trigger if scrolled more than threshold
            if (Math.abs(scrollDifference) >= scrollThreshold) {
                if (scrollTop > lastScrollTop && scrollTop > 60) {
                    // Scrolling DOWN - hide header
                    if (this.elements.header) {
                        this.elements.header.classList.add('header-hidden');
                    }
                } else {
                    // Scrolling UP - show header
                    if (this.elements.header) {
                        this.elements.header.classList.remove('header-hidden');
                    }
                }
                lastScrollTop = scrollTop;
            }

            // Toggling scrolled style
            if (scrollTop > 20) {
                this.elements.header?.classList.add('scrolled');
            } else {
                this.elements.header?.classList.remove('scrolled');
            }

            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateHeader);
                ticking = true;
            }
        }, { passive: true });
    },


    /**
     * Update streak display in header
     */
    updateStreakDisplay() {
        // Logic to update streak count if element exists
        const streakData = StorageManager.load(CONFIG.STORAGE_KEYS.STREAK_DATA, { current: 0 });
        if (this.elements.headerStreakCount) {
            this.elements.headerStreakCount.textContent = streakData.current;
        }
    },

    /**
     * Cleanup
     */
    destroy() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 10: TAB BAR NAVIGATION
   ───────────────────────────────────────────────────────────────────────────── */

const TabBarManager = {
    activeTab: 'home',
    elements: {},

    /**
     * Initialize tab bar
     */
    init() {
        this.elements = {
            tabBar: document.getElementById('tabBar'),
            tabs: document.querySelectorAll('.tab-item'),
            mainContent: document.getElementById('mainContent')
        };

        this.setupEventListeners();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.elements.tabs?.forEach?.(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    },

    /**
     * Switch to tab
     */
    switchTab(tabName) {
        if (this.activeTab === tabName) {
            // Scroll to top if already on this tab
            this.scrollToSection(tabName);
            return;
        }

        HapticManager.selection();
        this.activeTab = tabName;

        // Update active states
        this.elements.tabs?.forEach?.(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Scroll to section
        this.scrollToSection(tabName);
    },

    /**
     * Scroll to section
     */
    scrollToSection(tabName) {
        const sectionMap = {
            home: 'amritvelaSection',
            nitnem: 'nitnemProgressSection',
            mala: 'malaSection',
            stats: 'streakSection'
        };

        const sectionId = sectionMap[tabName];
        if (!sectionId) return;

        const section = document.getElementById(sectionId);
        if (!section) return;

        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 11: AMRITVELA PRESENT SYSTEM
   ───────────────────────────────────────────────────────────────────────────── */

const AmritvelaManager = {
    elements: {},
    todayMarked: false,

    /**
     * Initialize Amritvela system
     */
    init() {
        // Cache elements
        this.elements = {
            section: document.getElementById('amritvelaSection'),
            status: document.getElementById('amritvelaStatus'),
            presentBtn: document.getElementById('presentBtn'),
            message: document.getElementById('amritvelaMessage'),
            timeProgressFill: document.getElementById('timeProgressFill'),
            streakDisplay: document.getElementById('amritvelaStreak'),
            thisWeekDisplay: document.getElementById('amritvelaThisWeek'),
            avgTimeDisplay: document.getElementById('amritvelaAvgTime'),
            timeSlots: document.querySelectorAll('.time-slot')
        };

        // Check if already marked today
        this.checkTodayStatus();

        // Update time-based UI
        this.updateTimeDisplay();
        setInterval(() => this.updateTimeDisplay(), 60000); // Update every minute

        // Setup event listeners
        this.setupEventListeners();

        // Load stats
        this.updateStats();
    },

    /**
     * Check if today is already marked
     */
    checkTodayStatus() {
        const log = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        const today = Utils.getTodayString();

        if (log[today]) {
            this.todayMarked = true;
            this.showMarkedState(log[today]);
        }
    },

    /**
     * Update time display and slot highlighting
     */
    updateTimeDisplay() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        // Calculate progress for time circle (6 AM = 100%)
        let progress = 0;
        if (hours < 6) {
            progress = ((hours * 60) + minutes) / (6 * 60);
        } else {
            progress = 1;
        }

        // Update progress circle
        if (this.elements.timeProgressFill) {
            const circumference = 2 * Math.PI * 45; // radius = 45
            const offset = circumference - (progress * circumference);
            this.elements.timeProgressFill.style.strokeDashoffset = offset;
        }

        // Highlight current time slot
        let currentSlot = 'late';
        if (hours < 4) currentSlot = 'before-4';
        else if (hours < 5) currentSlot = '4-5';
        else if (hours < 6) currentSlot = '5-6';

        if (this.elements.timeSlots?.forEach) {
            this.elements.timeSlots.forEach(slot => {
                slot.classList.toggle('active', slot.dataset.time === currentSlot);
            });
        }

        // Check if present button should be disabled
        const settings = StorageManager.load(CONFIG.STORAGE_KEYS.SETTINGS, CONFIG.DEFAULT_SETTINGS);
        const cutoffHour = settings.presentUntil || 7;

        if (hours >= cutoffHour && !this.todayMarked) {
            this.elements.presentBtn?.classList.add('disabled');
            this.showMessage('⏰', `Present marking is available until ${cutoffHour}:00 AM`);
        }
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.elements.presentBtn?.addEventListener('click', () => {
            if (!this.todayMarked && !this.elements.presentBtn.classList.contains('disabled')) {
                this.markPresent();
            }
        });
    },

    /**
     * Mark present for today
     */
    markPresent() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const today = Utils.getTodayString();

        // Determine time slot and message
        let slotInfo;
        if (hours < 4) {
            slotInfo = CONFIG.AMRITVELA_SLOTS.EXCELLENT;
        } else if (hours < 5) {
            slotInfo = CONFIG.AMRITVELA_SLOTS.GOOD;
        } else if (hours < 6) {
            slotInfo = CONFIG.AMRITVELA_SLOTS.OKAY;
        } else {
            slotInfo = CONFIG.AMRITVELA_SLOTS.LATE;
        }

        // Create log entry
        const entry = {
            date: today,
            time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
            slot: slotInfo.label.toLowerCase(),
            timestamp: now.toISOString()
        };

        // ═══ ENHANCED: Play time-based animation FIRST ═══
        this.playTimeBasedAnimation(hours);

        // Save to log
        const log = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        log[today] = entry;
        StorageManager.save(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, log);

        // Mark as done
        this.todayMarked = true;

        // Haptic feedback
        HapticManager.success();
        SoundManager.success();

        // Show marked state
        this.showMarkedState(entry);

        // Show message
        this.showMessage(this.getSlotEmoji(slotInfo.label), slotInfo.message);

        // Update stats
        this.updateStats();

        // ═══ ENHANCED: Broadcast update to all sections ═══
        this.broadcastAttendanceUpdate(entry);

        // Show toast
        Toast.success('ਹਾਜ਼ਰੀ ਲੱਗੀ!', `You woke up at ${entry.time} - ${slotInfo.label}`);

        // Animate button
        this.animateButton();
    },

    /**
     * Play time-based animation on present button
     */
    playTimeBasedAnimation(hours) {
        const presentBtn = this.elements.presentBtn;
        if (!presentBtn) return;

        // Get animation type based on time
        const animationType = this.getTimeAnimationType(hours);

        // Add animation classes
        presentBtn.classList.add('marking', animationType);

        // Create celebration particles
        this.createTimeParticles(animationType);

        // Remove animation classes after completion
        setTimeout(() => {
            presentBtn.classList.remove('marking', animationType);
        }, 2000);
    },

    /**
     * Get animation type based on hour
     */
    getTimeAnimationType(hours) {
        if (hours >= 3 && hours < 6) return 'amritvela-glow';   // Golden sunrise glow
        if (hours >= 6 && hours < 12) return 'morning-glow';    // Soft white/pink
        if (hours >= 12 && hours < 18) return 'afternoon-glow'; // Warm orange
        if (hours >= 18 && hours < 21) return 'evening-glow';   // Purple twilight
        return 'night-glow'; // Deep blue/silver
    },

    /**
     * Create celebration particles based on time
     */
    createTimeParticles(animationType) {
        const presentBtn = this.elements.presentBtn;
        if (!presentBtn) return;

        const rect = presentBtn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Color schemes for different times
        const colorSchemes = {
            'amritvela-glow': ['#FFD700', '#FFA500', '#FF8C00', '#FFDF00', '#F0E68C'],
            'morning-glow': ['#FFB6C1', '#FFC0CB', '#FFE4E1', '#FFFACD', '#FAFAD2'],
            'afternoon-glow': ['#FF8C00', '#FFA500', '#FF7F50', '#FF6347', '#FFD700'],
            'evening-glow': ['#9370DB', '#8A2BE2', '#9400D3', '#BA55D3', '#DDA0DD'],
            'night-glow': ['#4169E1', '#6495ED', '#87CEEB', '#B0C4DE', '#708090']
        };

        const colors = colorSchemes[animationType] || colorSchemes['amritvela-glow'];

        // Create particle container
        const container = document.createElement('div');
        container.className = 'particle-container';
        container.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY}px;
            pointer-events: none;
            z-index: 10000;
        `;
        document.body.appendChild(container);

        // Create 30 particles
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'time-particle';

            const angle = (Math.random() * 360) * (Math.PI / 180);
            const distance = 50 + Math.random() * 100;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            const size = 4 + Math.random() * 8;
            const color = colors[Math.floor(Math.random() * colors.length)];

            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                box-shadow: 0 0 ${size}px ${color};
                animation: particleBurst 1s ease-out forwards;
                --endX: ${endX}px;
                --endY: ${endY}px;
                animation-delay: ${Math.random() * 0.2}s;
            `;
            container.appendChild(particle);
        }

        // Cleanup after animation
        setTimeout(() => container.remove(), 1500);
    },

    /**
     * Broadcast attendance update to all sections
     */
    broadcastAttendanceUpdate(entry) {
        // Update Streak Manager
        StreakManager.checkAndUpdate();

        // Update Achievement Manager
        AchievementManager.checkAmritvela(entry);

        // Update Header streak display
        HeaderManager.updateStreakDisplay();

        // Update Reports if initialized
        if (typeof ReportsManager !== 'undefined' && ReportsManager.renderWeeklyReport) {
            try {
                ReportsManager.renderWeeklyReport();
            } catch (e) {
                console.log('Reports update deferred');
            }
        }

        // Dispatch custom event for cross-component sync
        window.dispatchEvent(new CustomEvent('attendanceMarked', {
            detail: entry,
            bubbles: true
        }));

        // Sync to IndexedDB
        StorageManager.persistToIndexedDB();
    },

    /**
     * Show marked state UI
     */
    showMarkedState(entry) {
        // Update button
        if (this.elements.presentBtn) {
            this.elements.presentBtn.classList.add('marked');
            this.elements.presentBtn.querySelector('.btn-text').textContent = 'Present ✓';
        }

        // Update status badge
        if (this.elements.status) {
            const badge = this.elements.status.querySelector('.status-badge');
            if (badge) {
                badge.className = `status-badge ${entry.slot}`;
                badge.textContent = entry.slot.charAt(0).toUpperCase() + entry.slot.slice(1);
            }
        }
    },

    /**
     * Show message
     */
    showMessage(icon, text) {
        if (!this.elements.message) return;

        const iconEl = this.elements.message.querySelector('.message-icon');
        const textEl = this.elements.message.querySelector('.message-text');

        if (iconEl) iconEl.textContent = icon;
        if (textEl) textEl.textContent = text;

        this.elements.message.classList.add('show');
    },

    /**
     * Get emoji for slot
     */
    getSlotEmoji(slot) {
        const emojis = {
            'Excellent': '🌟',
            'Good': '✨',
            'Okay': '👍',
            'Late': '🌅'
        };
        return emojis[slot] || '🙏';
    },

    /**
     * Animate button
     */
    animateButton() {
        if (!this.elements.presentBtn) return;

        this.elements.presentBtn.classList.add('ripple');
        setTimeout(() => {
            this.elements.presentBtn.classList.remove('ripple');
        }, 600);
    },

    /**
     * Update statistics
     */
    updateStats() {
        const log = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        const dates = Object.keys(log);

        // Calculate streak
        const streak = Utils.calculateStreak(dates);
        if (this.elements.streakDisplay) {
            Utils.animateNumber(this.elements.streakDisplay,
                parseInt(this.elements.streakDisplay.textContent) || 0,
                streak,
                500
            );
        }

        // This week count
        const { start, end } = Utils.getWeekRange();
        const thisWeekCount = dates.filter(d => {
            const date = new Date(d);
            return date >= start && date <= end;
        }).length;

        if (this.elements.thisWeekDisplay) {
            this.elements.thisWeekDisplay.textContent = `${thisWeekCount}/7`;
        }

        // Average wake time
        if (dates.length > 0) {
            const times = dates.slice(-7).map(d => {
                const time = log[d].time;
                const [h, m] = time.split(':').map(Number);
                return h * 60 + m;
            });
            const avgMinutes = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
            const avgHours = Math.floor(avgMinutes / 60);
            const avgMins = avgMinutes % 60;

            if (this.elements.avgTimeDisplay) {
                this.elements.avgTimeDisplay.textContent =
                    `${avgHours.toString().padStart(2, '0')}:${avgMins.toString().padStart(2, '0')}`;
            }
        }
    },

    /**
     * Get log data
     */
    getLog() {
        return StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 12: NITNEM PROGRESS SYSTEM
   ───────────────────────────────────────────────────────────────────────────── */

const NitnemManager = {
    elements: {},
    selectedBanis: {
        amritvela: [],
        rehras: [],
        sohila: []
    },
    completedToday: {
        amritvela: [],
        rehras: [],
        sohila: []
    },
    activePeriod: 'amritvela',
    allBanis: [],

    /**
     * Initialize Nitnem system
     */
    async init() {
        // Cache elements
        this.elements = {
            progressRing: document.getElementById('nitnemProgressRing'),
            progressPercent: document.getElementById('nitnemProgressPercent'),
            periodTabs: document.querySelectorAll('.period-tab'),
            baniListContainer: document.getElementById('baniListContainer'),
            amritvelaBaniList: document.getElementById('amritvelaBaniList'),
            rehrasBaniList: document.getElementById('rehrasBaniList'),
            sohilaBaniList: document.getElementById('sohilaBaniList'),
            addBaniBtn: document.getElementById('addBaniBtn'),
            completeAllBtn: document.getElementById('completeAllBtn'),
            amritvelaBaniCount: document.getElementById('amritvelaBaniCount'),
            rehrasBaniCount: document.getElementById('rehrasBaniCount'),
            sohilaBaniCount: document.getElementById('sohilaBaniCount')
        };

        // Load banis data
        await this.loadBanisData();

        // Load saved selections
        this.loadSelectedBanis();

        // Load today's progress
        this.loadTodayProgress();

        // Setup event listeners
        this.setupEventListeners();

        // Render bani lists
        this.renderAllLists();

        // Update progress
        this.updateProgress();

        // Initial reports update
        if (typeof EnhancedReports !== 'undefined') {
            EnhancedReports.updateReportsDisplay();
        }
    },

    /**
     * Load banis data from JSON
     */
    async loadBanisData() {
        try {
            const response = await fetch(CONFIG.API.BANIS);
            if (!response.ok) throw new Error('Failed to load banis');
            const data = await response.json();
            // Handle both object wrapper (banis.json) and flat array formats
            this.allBanis = data.banis || data;
        } catch (error) {
            console.error('Error loading banis:', error);
            // Use default banis if fetch fails
            this.allBanis = this.getDefaultBanis();
        }
    },

    /**
     * Get default banis (fallback)
     */
    getDefaultBanis() {
        return {
            nitnem: [
                { id: 'japji', nameGurmukhi: 'ਜਪੁਜੀ ਸਾਹਿਬ', nameEnglish: 'Japji Sahib', duration: '25 min', defaultPeriod: 'amritvela' },
                { id: 'jaap', nameGurmukhi: 'ਜਾਪ ਸਾਹਿਬ', nameEnglish: 'Jaap Sahib', duration: '15 min', defaultPeriod: 'amritvela' },
                { id: 'tav-prasad-savaiye', nameGurmukhi: 'ਤ੍ਵ ਪ੍ਰਸਾਦਿ ਸਵੱਯੇ', nameEnglish: 'Tav Prasad Savaiye', duration: '5 min', defaultPeriod: 'amritvela' },
                { id: 'chaupai', nameGurmukhi: 'ਚੌਪਈ ਸਾਹਿਬ', nameEnglish: 'Chaupai Sahib', duration: '7 min', defaultPeriod: 'amritvela' },
                { id: 'anand', nameGurmukhi: 'ਅਨੰਦ ਸਾਹਿਬ', nameEnglish: 'Anand Sahib', duration: '10 min', defaultPeriod: 'amritvela' },
                { id: 'rehras', nameGurmukhi: 'ਰਹਿਰਾਸ ਸਾਹਿਬ', nameEnglish: 'Rehras Sahib', duration: '25 min', defaultPeriod: 'rehras' },
                { id: 'sohila', nameGurmukhi: 'ਸੋਹਿਲਾ ਸਾਹਿਬ', nameEnglish: 'Sohila Sahib', duration: '7 min', defaultPeriod: 'sohila' }
            ],
            guruGranthSahib: [
                { id: 'sukhmani', nameGurmukhi: 'ਸੁਖਮਨੀ ਸਾਹਿਬ', nameEnglish: 'Sukhmani Sahib', duration: '90 min' },
                { id: 'asa-di-var', nameGurmukhi: 'ਆਸਾ ਦੀ ਵਾਰ', nameEnglish: 'Asa Di Var', duration: '45 min' },
                { id: 'dukh-bhanjani', nameGurmukhi: 'ਦੁੱਖ ਭੰਜਨੀ ਸਾਹਿਬ', nameEnglish: 'Dukh Bhanjani Sahib', duration: '20 min' }
            ],
            dasamGranth: [
                { id: 'benti-chaupai', nameGurmukhi: 'ਬੇਨਤੀ ਚੌਪਈ', nameEnglish: 'Benti Chaupai', duration: '10 min' },
                { id: 'akaal-ustat', nameGurmukhi: 'ਅਕਾਲ ਉਸਤਤ', nameEnglish: 'Akaal Ustat', duration: '30 min' }
            ]
        };
    },

    /**
     * Load saved bani selections
     */
    loadSelectedBanis() {
        const saved = StorageManager.load(CONFIG.STORAGE_KEYS.SELECTED_BANIS, null);

        if (saved) {
            this.selectedBanis = saved;
            // Migration: Ensure all banis have UIDs
            let modified = false;
            Object.keys(this.selectedBanis).forEach(period => {
                this.selectedBanis[period].forEach(bani => {
                    if (!bani.uid) {
                        bani.uid = Utils.generateId();
                        modified = true;
                    }
                });
            });

            if (modified) {
                this.saveSelectedBanis();
            }
        } else {
            // Set default banis
            this.setDefaultBanis();
        }
    },

    /**
     * Set default bani selections
     */
    setDefaultBanis() {
        if (this.allBanis.nitnem) {
            this.allBanis.nitnem.forEach(bani => {
                if (bani.defaultPeriod) {
                    const entry = { ...bani, uid: Utils.generateId() };
                    this.selectedBanis[bani.defaultPeriod].push(entry);
                }
            });
            this.saveSelectedBanis();
        }
    },

    /**
     * Save selected banis
     */
    saveSelectedBanis() {
        StorageManager.save(CONFIG.STORAGE_KEYS.SELECTED_BANIS, this.selectedBanis);
    },

    /**
     * Load today's progress
     */
    loadTodayProgress() {
        const today = Utils.getTodayString();
        const log = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});

        // Default structure with all periods
        const defaultProgress = {
            amritvela: [],
            rehras: [],
            sohila: []
        };

        if (log[today]) {
            // Merge with default to ensure all keys exist
            this.completedToday = {
                ...defaultProgress,
                ...log[today]
            };

            // Ensure each key is an array (fix corrupt data)
            Object.keys(defaultProgress).forEach(period => {
                if (!Array.isArray(this.completedToday[period])) {
                    this.completedToday[period] = [];
                }
            });
        } else {
            this.completedToday = defaultProgress;
        }
    },

    /**
     * Save today's progress
     */
    saveTodayProgress() {
        const today = Utils.getTodayString();
        const log = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});
        log[today] = this.completedToday;
        StorageManager.save(CONFIG.STORAGE_KEYS.NITNEM_LOG, log);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Period tabs
        this.elements.periodTabs?.forEach?.(tab => {
            tab.addEventListener('click', () => {
                const period = tab.dataset.period;
                this.switchPeriod(period);
            });
        });

        // Add bani button
        this.elements.addBaniBtn?.addEventListener('click', () => {
            BaniModal.open(this.activePeriod);
        });

        // Complete all button
        this.elements.completeAllBtn?.addEventListener('click', () => {
            this.completeAll();
        });

        // Mini add buttons
        document.querySelectorAll('.add-bani-mini-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const period = btn.dataset.period;
                BaniModal.open(period);
            });
        });
    },

    /**
     * Switch active period
     */
    switchPeriod(period) {
        if (this.activePeriod === period) return;

        HapticManager.selection();
        this.activePeriod = period;

        // Update tab states
        this.elements.periodTabs?.forEach?.(tab => {
            tab.classList.toggle('active', tab.dataset.period === period);
        });

        // Show corresponding list
        document.querySelectorAll('.bani-list').forEach(list => {
            list.classList.toggle('active', list.dataset.period === period);
        });
    },

    /**
     * Render all bani lists
     */
    renderAllLists() {
        Object.keys(this.selectedBanis).forEach(period => {
            this.renderBaniList(period);
        });
        this.updateCounts();
    },

    /**
     * Render bani list for a period
     */
    renderBaniList(period) {
        const listElement = this.elements[`${period}BaniList`];
        if (!listElement) return;

        const banis = this.selectedBanis[period];
        const completed = this.completedToday[period];

        if (banis.length === 0) {
            listElement.innerHTML = `
                <div class="bani-placeholder">
                    <p>No banis added yet</p>
                    <button class="add-bani-mini-btn" data-period="${period}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Add Bani
                    </button>
                </div>
            `;

            // Re-attach event listener
            listElement.querySelector('.add-bani-mini-btn')?.addEventListener('click', () => {
                BaniModal.open(period);
            });
            return;
        }

        // Group banis by ID
        const groups = {};
        banis.forEach(bani => {
            if (!groups[bani.id]) {
                groups[bani.id] = { ...bani, instances: [], completedCount: 0 };
            }
            groups[bani.id].instances.push(bani.uid);
            if (completed.includes(bani.uid)) {
                groups[bani.id].completedCount++;
            }
        });

        listElement.innerHTML = Object.values(groups).map(group => {
            const total = group.instances.length;
            const done = group.completedCount;
            const isFullyCompleted = done === total && total > 0;
            const isGroup = total > 1;

            let badgeHtml = '';
            if (isGroup) {
                badgeHtml = `<span class="bani-badge">${done}/${total}</span>`;
            }

            return `
            <div class="bani-item ${isFullyCompleted ? 'completed' : ''}" 
                 data-bani-id="${group.id}" data-period="${period}"
                 data-is-group="${isGroup}">
                <div class="bani-checkbox">
                    ${isFullyCompleted ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>` : ''}
                </div>
                <div class="bani-info">
                    <span class="bani-name">${group.nameGurmukhi} ${badgeHtml}</span>
                    <span class="bani-name-english">${group.nameEnglish}</span>
                </div>
                <span class="bani-duration">${group.duration}</span>
                <button class="bani-remove-btn" data-bani-id="${group.id}" aria-label="Remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `}).join('');

        // Attach event listeners
        listElement.querySelectorAll('.bani-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.bani-remove-btn')) return;
                this.toggleGroupCompletion(item.dataset.baniId, item.dataset.period);
            });
        });

        listElement.querySelectorAll('.bani-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // When removing from a group, remove one instance (prefer uncompleted)
                this.removeGroupInstance(btn.dataset.baniId, period);
            });
        });
    },

    /**
     * Toggle bani completion
     */
    /**
     * Toggle group completion (Sequential)
     */
    toggleGroupCompletion(baniId, period) {
        const instances = this.selectedBanis[period].filter(b => b.id === baniId);
        const completedUIDs = this.completedToday[period];

        // Find instances that are NOT yet completed
        const uncompleted = instances.filter(b => !completedUIDs.includes(b.uid));

        if (uncompleted.length > 0) {
            // Mark ONE as complete (First available)
            const target = uncompleted[0];
            this.completedToday[period].push(target.uid);
            HapticManager.success();
            SoundManager.success();
        } else {
            // All are completed -> Reset ALL for this group
            // Remove all UIDs belonging to this baniId from completed list
            instances.forEach(b => {
                const idx = this.completedToday[period].indexOf(b.uid);
                if (idx > -1) {
                    this.completedToday[period].splice(idx, 1);
                }
            });
            HapticManager.light();
        }

        this.saveTodayProgress();
        this.renderBaniList(period);
        this.updateProgress();
        this.updateCounts();
        
        // Dispatch event for dashboard updates
        window.dispatchEvent(new CustomEvent('nitnemUpdated', {
            detail: {
                period,
                baniId,
                completed: this.completedToday,
                selected: this.selectedBanis
            }
        }));

        // Check if all complete
        this.checkAllComplete();
    },

    /**
     * Remove one instance of a group
     */
    removeGroupInstance(baniId, period) {
        // Find last instance (LIFO for removal feels natural, or specific uid if we had it)
        const index = this.selectedBanis[period].findIndex(b => b.id === baniId);
        if (index === -1) return;

        const bani = this.selectedBanis[period][index];
        const uid = bani.uid;

        // Remove from selected
        this.selectedBanis[period].splice(index, 1);

        // Remove from completed if present
        const completedIndex = this.completedToday[period].indexOf(uid);
        if (completedIndex > -1) {
            this.completedToday[period].splice(completedIndex, 1);
            this.saveTodayProgress();
        }

        this.saveSelectedBanis();
        this.renderBaniList(period);
        this.updateCounts();
        this.updateProgress();

        HapticManager.light();
        Toast.info('Bani Removed', `${bani.nameEnglish} removed`);
    },

    /**
     * Complete all banis in active period (with animation)
     */
    async completeAll() {
        const banis = this.selectedBanis[this.activePeriod];
        if (banis.length === 0) return;

        const allCompleted = banis.every(b =>
            this.completedToday[this.activePeriod].includes(b.uid)
        );

        // Disable button during animation
        const btn = this.elements.completeAllBtn;
        if (btn) btn.disabled = true;

        if (allCompleted) {
            // Uncomplete all - instant
            this.completedToday[this.activePeriod] = [];
            HapticManager.light();
            this.renderBaniList(this.activePeriod);
        } else {
            // Animate completion one by one
            const listElement = this.elements[`${this.activePeriod}BaniList`];
            const items = listElement?.querySelectorAll('.bani-item:not(.completed)');

            for (let i = 0; i < banis.length; i++) {
                if (!this.completedToday[this.activePeriod].includes(banis[i].uid)) {
                    this.completedToday[this.activePeriod].push(banis[i].uid);

                    // Animate the corresponding item
                    const item = items ? items[i] : null;
                    if (item) {
                        await this.animateBaniCheck(item, i * 80);
                    }
                }
            }

            // Play celebration after all complete
            HapticManager.success();
            SoundManager.malaComplete();
            this.playCelebrationEffect();

            // Re-render to show completed state
            this.renderBaniList(this.activePeriod);
        }

        this.saveTodayProgress();
        this.updateProgress();
        this.updateCounts();
        this.checkAllComplete();
        
        // Dispatch event for dashboard updates
        window.dispatchEvent(new CustomEvent('nitnemUpdated', {
            detail: {
                period: this.activePeriod,
                completed: this.completedToday,
                selected: this.selectedBanis
            }
        }));

        if (btn) btn.disabled = false;
    },

    /**
     * Animate a single bani checkbox check
     */
    async animateBaniCheck(item, delay) {
        return new Promise(resolve => {
            setTimeout(() => {
                item.classList.add('checking');
                HapticManager.light();

                setTimeout(() => {
                    item.classList.add('completed');
                    item.classList.remove('checking');
                    resolve();
                }, 150);
            }, delay);
        });
    },

    /**
     * Play celebration particle effect
     */
    playCelebrationEffect() {
        // Create confetti burst container
        const container = document.createElement('div');
        container.className = 'celebration-burst';
        document.body.appendChild(container);

        const colors = ['#FFD700', '#34C759', '#FF9500', '#AF52DE', '#5AC8FA', '#FF2D55'];

        for (let i = 0; i < 40; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';
            const x = (Math.random() - 0.5) * 250;
            const y = (Math.random() - 0.5) * 250;
            particle.style.setProperty('--x', x + 'px');
            particle.style.setProperty('--y', y + 'px');
            particle.style.setProperty('--color', colors[Math.floor(Math.random() * colors.length)]);
            particle.style.animationDelay = Math.random() * 0.2 + 's';
            container.appendChild(particle);
        }

        // Cleanup after animation
        setTimeout(() => container.remove(), 1500);
    },

    /**
     * Add bani to period
     */
    addBani(bani, period) {
        // Allow duplicates - Generate Unique Instance ID (UID)
        const entry = { ...bani, uid: Utils.generateId() };

        this.selectedBanis[period].push(entry);
        this.saveSelectedBanis();
        this.renderBaniList(period);
        this.updateCounts();
        this.updateProgress();

        HapticManager.success();
        // Custom message for duplicates
        const count = this.selectedBanis[period].filter(b => b.id === bani.id).length;
        const extra = count > 1 ? ` (x${count})` : '';
        Toast.success('Bani Added', `${bani.nameEnglish}${extra} added to ${period}`);
        return true;
    },

    /**
     * Remove bani from period
     */
    removeBani(baniUid, period) {
        const index = this.selectedBanis[period].findIndex(b => b.uid === baniUid);
        if (index === -1) return;

        const bani = this.selectedBanis[period][index];
        this.selectedBanis[period].splice(index, 1);

        // Also remove from completed using UID
        const completedIndex = this.completedToday[period].indexOf(baniUid);
        if (completedIndex > -1) {
            this.completedToday[period].splice(completedIndex, 1);
            this.saveTodayProgress();
        }

        this.saveSelectedBanis();
        this.renderBaniList(period);
        this.updateCounts();
        this.updateProgress();

        HapticManager.light();
        Toast.info('Bani Removed', `${bani.nameEnglish} removed`);
    },

    /**
     * Update progress ring
     */
    updateProgress() {
        let totalBanis = 0;
        let completedBanis = 0;

        Object.keys(this.selectedBanis).forEach(period => {
            totalBanis += this.selectedBanis[period].length;
            completedBanis += this.completedToday[period].length;
        });

        const percentage = totalBanis > 0 ? Math.round((completedBanis / totalBanis) * 100) : 0;

        // Update progress ring
        if (this.elements.progressRing) {
            const circumference = 2 * Math.PI * 15; // radius = 15
            const offset = circumference - (percentage / 100) * circumference;
            this.elements.progressRing.style.strokeDashoffset = offset;
        }

        // Update percentage text
        if (this.elements.progressPercent) {
            this.elements.progressPercent.textContent = `${percentage}%`;
        }

        // --- BUG FIX: Update Global Reports ---
        if (typeof EnhancedReports !== 'undefined') {
            EnhancedReports.updateReportsDisplay();
        }
        // ------------------------------------

        // Update complete all button
        if (this.elements.completeAllBtn) {
            this.elements.completeAllBtn.disabled = this.selectedBanis[this.activePeriod].length === 0;
        }
    },

    /**
     * Update bani counts in tabs
     */
    updateCounts() {
        Object.keys(this.selectedBanis).forEach(period => {
            const total = this.selectedBanis[period].length;
            const completed = this.completedToday[period].length;
            const countElement = this.elements[`${period}BaniCount`];

            if (countElement) {
                if (total === 0) {
                    countElement.textContent = '—';
                    countElement.classList.add('empty');
                    countElement.classList.remove('complete');
                } else {
                    countElement.textContent = `${completed}/${total}`;
                    countElement.classList.remove('empty');
                    countElement.classList.toggle('complete', completed === total && total > 0);
                }
            }
        });
    },

    /**
     * Check if all banis are complete
     */
    checkAllComplete() {
        let totalBanis = 0;
        let completedBanis = 0;

        Object.keys(this.selectedBanis).forEach(period => {
            totalBanis += this.selectedBanis[period].length;
            completedBanis += this.completedToday[period].length;
        });

        if (totalBanis > 0 && completedBanis === totalBanis) {
            // All complete!
            StreakManager.checkAndUpdate();
            AchievementManager.checkNitnemComplete();
            CelebrationManager.show('nitnemComplete');
            
            // Sync to AnhadStats - mark full Nitnem day as complete
            if (window.AnhadStats) {
                window.AnhadStats.addNitnemCompleted(1);
                console.log('✅ Full Nitnem completed - synced to dashboard');
            }
        }
    },

    /**
     * Get today's completion status
     */
    getTodayStatus() {
        let total = 0;
        let completed = 0;

        Object.keys(this.selectedBanis).forEach(period => {
            total += this.selectedBanis[period].length;
            completed += this.completedToday[period].length;
        });

        return {
            total,
            completed,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
            isComplete: total > 0 && completed === total
        };
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 13: BANI MODAL
   ───────────────────────────────────────────────────────────────────────────── */

const BaniModal = {
    selectedBanis: [],
    targetPeriod: 'amritvela',
    elements: {},

    /**
     * Initialize bani modal
     */
    init() {
        this.elements = {
            modal: document.getElementById('addBaniModal'),
            searchInput: document.getElementById('baniSearchInput'),
            categories: document.getElementById('baniCategories'),
            periodButtons: document.querySelectorAll('[data-add-period]'),
            confirmBtn: document.getElementById('confirmAddBaniBtn')
        };

        this.setupEventListeners();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        this.elements.searchInput?.addEventListener('input', Utils.debounce((e) => {
            this.filterBanis(e.target.value);
        }, 300));

        // Period buttons
        this.elements.periodButtons?.forEach?.(btn => {
            btn.addEventListener('click', () => {
                this.selectPeriod(btn.dataset.addPeriod);
            });
        });

        // Confirm button
        this.elements.confirmBtn?.addEventListener('click', () => {
            this.confirmSelection();
        });

        // Category headers - delegated listener for robustness
        const categoryContainer = document.getElementById('baniCategories');
        if (categoryContainer) {
            categoryContainer.addEventListener('click', (e) => {
                const header = e.target.closest('.category-header');
                if (header) {
                    const category = header.closest('.bani-category');
                    if (category) {
                        category.classList.toggle('expanded');
                        HapticManager.selection();
                    }
                }
            });
        }

        // Modal events
        this.elements.modal?.addEventListener('modalOpened', () => {
            this.onOpen();
        });

        this.elements.modal?.addEventListener('modalClosed', () => {
            this.onClose();
        });
    },

    /**
     * Open modal
     */
    open(period = 'amritvela') {
        this.targetPeriod = period;
        this.selectedBanis = [];

        // Update period buttons
        this.elements.periodButtons?.forEach?.(btn => {
            btn.classList.toggle('active', btn.dataset.addPeriod === period);
        });

        // Render banis
        this.renderBanis();

        // Open modal
        ModalManager.open('addBaniModal');
    },

    /**
     * On modal open
     */
    onOpen() {
        // Focus search input
        setTimeout(() => {
            this.elements.searchInput?.focus();
        }, 300);
    },

    /**
     * On modal close
     */
    onClose() {
        // Clear search
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }

        // Clear selection
        this.selectedBanis = [];

        // Reset expansion - collapse all categories when modal closes
        document.querySelectorAll('.bani-category').forEach(cat => {
            cat.classList.remove('expanded');
        });
    },

    /**
     * Select period
     */
    selectPeriod(period) {
        this.targetPeriod = period;

        this.elements.periodButtons?.forEach?.(btn => {
            btn.classList.toggle('active', btn.dataset.addPeriod === period);
        });

        HapticManager.selection();
    },

    /**
     * Render banis in categories
     */
    renderBanis() {
        const allBanis = NitnemManager.allBanis;

        const categoryMap = {
            'nitnem': allBanis.nitnem || [],
            'guru-granth-sahib': allBanis.guruGranthSahib || [],
            'dasam-granth': allBanis.dasamGranth || [],
            'other': allBanis.other || []
        };

        Object.entries(categoryMap).forEach(([categoryId, banis]) => {
            const categoryEl = document.querySelector(`.bani-category[data-category="${categoryId}"]`);
            if (!categoryEl) return;

            const banisContainer = categoryEl.querySelector('.category-banis');
            if (!banisContainer) return;

            if (banis.length === 0) {
                banisContainer.innerHTML = '<p class="no-banis" style="padding:16px; color:var(--text-tertiary);">No banis available</p>';
                return;
            }

            banisContainer.innerHTML = banis.map(bani => `
                <div class="bani-select-item" data-bani-id="${bani.id}">
                    <div class="bani-select-checkbox">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <path d="M20 6L9 17l-5-5"/>
                        </svg>
                    </div>
                    <div class="bani-select-info">
                        <span class="bani-select-name">${bani.nameGurmukhi}</span>
                        <span class="bani-select-english">${bani.nameEnglish}</span>
                    </div>
                    <span class="bani-select-duration">${bani.duration}</span>
                </div>
            `).join('');

            // Force re-flow/paint to ensure expansion works
            categoryEl.classList.add('ready');

            // Attach click handlers for bani items
            banisContainer.querySelectorAll('.bani-select-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.toggleBaniSelection(item.dataset.baniId, item);
                });
            });
        });

        // Attach click handlers to category headers AFTER rendering
        document.querySelectorAll('.bani-category .category-header').forEach(header => {
            // Remove any existing listeners by cloning
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);

            newHeader.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const category = newHeader.closest('.bani-category');
                if (category) {
                    category.classList.toggle('expanded');
                    HapticManager.selection();
                }
            });
        });
    },

    /**
     * Toggle bani selection
     */
    toggleBaniSelection(baniId, element) {
        const index = this.selectedBanis.indexOf(baniId);

        if (index > -1) {
            this.selectedBanis.splice(index, 1);
            element.classList.remove('selected');
        } else {
            this.selectedBanis.push(baniId);
            element.classList.add('selected');
        }

        HapticManager.selection();

        // Update confirm button
        if (this.elements.confirmBtn) {
            const count = this.selectedBanis.length;
            this.elements.confirmBtn.textContent = count > 0
                ? `Add Selected (${count})`
                : 'Add Selected';
        }
    },

    /**
     * Filter banis by search
     */
    filterBanis(query) {
        const searchTerm = query.toLowerCase().trim();

        document.querySelectorAll('.bani-select-item').forEach(item => {
            const name = item.querySelector('.bani-select-name')?.textContent.toLowerCase() || '';
            const english = item.querySelector('.bani-select-english')?.textContent.toLowerCase() || '';

            const matches = name.includes(searchTerm) || english.includes(searchTerm);
            item.style.display = matches ? '' : 'none';
        });

        // Expand categories with matches
        if (searchTerm.length > 0) {
            document.querySelectorAll('.bani-category').forEach(cat => {
                const hasVisible = cat.querySelector('.bani-select-item:not([style*="none"])');
                cat.classList.toggle('expanded', !!hasVisible);
            });
        }
    },

    /**
     * Confirm selection and add banis
     */
    confirmSelection() {
        if (this.selectedBanis.length === 0) {
            Toast.warning('No Selection', 'Please select at least one bani');
            return;
        }

        const allBanis = NitnemManager.allBanis;
        const allBanisList = [
            ...(allBanis.nitnem || []),
            ...(allBanis.guruGranthSahib || []),
            ...(allBanis.dasamGranth || []),
            ...(allBanis.other || [])
        ];

        let added = 0;
        this.selectedBanis.forEach(baniId => {
            const bani = allBanisList.find(b => b.id === baniId);
            if (bani) {
                const success = NitnemManager.addBani(bani, this.targetPeriod);
                if (success) added++;
            }
        });

        ModalManager.close('addBaniModal');

        if (added > 0) {
            Toast.success('Banis Added', `${added} bani(s) added to ${this.targetPeriod}`);
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 14: SETTINGS MANAGER
   ───────────────────────────────────────────────────────────────────────────── */

const SettingsManager = {
    settings: {},
    elements: {},

    /**
     * Initialize settings
     */
    init() {
        // Load settings
        this.settings = StorageManager.load(CONFIG.STORAGE_KEYS.SETTINGS, CONFIG.DEFAULT_SETTINGS);

        // Cache elements
        this.elements = {
            settingsBtn: document.getElementById('settingsBtn'),
            hapticToggle: document.getElementById('hapticToggle'),
            soundToggle: document.getElementById('soundToggle'),
            autoWakeToggle: document.getElementById('autoWakeToggle'),
            presentUntilSelect: document.getElementById('presentUntilSelect'),
            beadsPerMalaSelect: document.getElementById('beadsPerMalaSelect'),
            vibrationPatternSelect: document.getElementById('vibrationPatternSelect'),
            exportDataBtn: document.getElementById('exportDataBtn'),
            importDataBtn: document.getElementById('importDataBtn'),
            resetDataBtn: document.getElementById('resetDataBtn')
        };

        // Setup event listeners
        this.setupEventListeners();

        // Apply settings to UI
        this.applySettingsToUI();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Settings button
        this.elements.settingsBtn?.addEventListener('click', () => {
            ModalManager.open('settingsModal');
        });

        // Toggle switches
        this.elements.hapticToggle?.addEventListener('change', (e) => {
            this.updateSetting('hapticEnabled', e.target.checked);
            HapticManager.toggle(e.target.checked);
        });

        this.elements.soundToggle?.addEventListener('change', (e) => {
            this.updateSetting('soundEnabled', e.target.checked);
            SoundManager.toggle(e.target.checked);
        });

        this.elements.autoWakeToggle?.addEventListener('change', (e) => {
            this.updateSetting('autoWakeDetect', e.target.checked);
        });

        // Selects
        this.elements.presentUntilSelect?.addEventListener('change', (e) => {
            this.updateSetting('presentUntil', parseInt(e.target.value));
        });

        this.elements.beadsPerMalaSelect?.addEventListener('change', (e) => {
            this.updateSetting('beadsPerMala', parseInt(e.target.value));
            MalaManager.updateBeadCount(parseInt(e.target.value));
        });

        this.elements.vibrationPatternSelect?.addEventListener('change', (e) => {
            this.updateSetting('vibrationPattern', e.target.value);
        });

        // Data actions
        this.elements.exportDataBtn?.addEventListener('click', () => {
            this.exportData();
        });

        this.elements.importDataBtn?.addEventListener('click', () => {
            this.importData();
        });

        this.elements.resetDataBtn?.addEventListener('click', () => {
            this.resetData();
        });
    },

    /**
     * Apply settings to UI elements
     */
    applySettingsToUI() {
        if (this.elements.hapticToggle) {
            this.elements.hapticToggle.checked = this.settings.hapticEnabled;
        }
        if (this.elements.soundToggle) {
            this.elements.soundToggle.checked = this.settings.soundEnabled;
        }
        if (this.elements.autoWakeToggle) {
            this.elements.autoWakeToggle.checked = this.settings.autoWakeDetect;
        }
        if (this.elements.presentUntilSelect) {
            this.elements.presentUntilSelect.value = this.settings.presentUntil;
        }
        if (this.elements.beadsPerMalaSelect) {
            this.elements.beadsPerMalaSelect.value = this.settings.beadsPerMala;
        }
        if (this.elements.vibrationPatternSelect) {
            this.elements.vibrationPatternSelect.value = this.settings.vibrationPattern;
        }
    },

    /**
     * Update a setting
     */
    updateSetting(key, value) {
        this.settings[key] = value;
        StorageManager.save(CONFIG.STORAGE_KEYS.SETTINGS, this.settings);
        HapticManager.selection();
    },

    /**
     * Get setting value
     */
    get(key) {
        return this.settings[key];
    },

    /**
     * Export all data
     */
    exportData() {
        const data = StorageManager.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `nitnem-tracker-backup-${Utils.getTodayString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Toast.success('Export Complete', 'Your data has been downloaded');
    },

    /**
     * Import data
     */
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const success = StorageManager.importData(event.target.result);

                if (success) {
                    Toast.success('Import Complete', 'Your data has been restored');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    Toast.error('Import Failed', 'Invalid backup file');
                }
            };
            reader.readAsText(file);
        };

        input.click();
    },

    /**
     * Reset all data
     */
    resetData() {
        if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
            StorageManager.clearAll();
            Toast.success('Data Reset', 'All data has been cleared');
            setTimeout(() => location.reload(), 1500);
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 15: Note - Full implementations are in Part 2 (below)
   ───────────────────────────────────────────────────────────────────────────── */

// MalaManager, AlarmManager, StreakManager, AchievementManager, 
// ReportsManager, CelebrationManager, and StatisticsModal are defined in Part 2 below.

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 16: MAIN APPLICATION INITIALIZATION
   ───────────────────────────────────────────────────────────────────────────── */

const NitnemTrackerApp = {
    isInitialized: false,

    /**
     * Initialize the application
     */
    async init() {
        if (this.isInitialized) return;

        console.log(`🙏 Initializing ${CONFIG.APP_NAME} v${CONFIG.APP_VERSION}`);

        try {
            // Initialize core systems
            HapticManager.init();
            SoundManager.init();
            Toast.init();
            ModalManager.init();
            // ThemeEngine auto-initializes via NitnemTrackerThemeEngine constructor

            // Initialize UI components
            HeaderManager.init();
            TabBarManager.init();

            // Initialize main features
            AmritvelaManager.init();
            await NitnemManager.init();
            BaniModal.init();

            // Initialize settings
            SettingsManager.init();

            // Initialize secondary features (placeholders for Part 2)
            MalaManager.init();
            AlarmManager.init();
            StreakManager.init();
            AchievementManager.init();
            ReportsManager.init();
            StatisticsModal.init();

            // Hide loading screen
            this.hideLoadingScreen();

            // Mark as initialized
            this.isInitialized = true;

            console.log('✅ Application initialized successfully');

            // Dispatch ready event
            document.dispatchEvent(new CustomEvent('appReady'));

        } catch (error) {
            console.error('❌ Initialization error:', error);
            Toast.error('Error', 'Failed to initialize app. Please refresh.');
        }
    },

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('appLoading');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 300);
        }
    },

    /**
     * Cleanup on unload
     */
    destroy() {
        HeaderManager.destroy();
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 17: EVENT LISTENERS & STARTUP
   ───────────────────────────────────────────────────────────────────────────── */

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NitnemTrackerApp.init());
} else {
    NitnemTrackerApp.init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    NitnemTrackerApp.destroy();
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Refresh time-sensitive data
        AmritvelaManager.checkTodayStatus();
        AmritvelaManager.updateTimeDisplay();
        NitnemManager.loadTodayProgress();
        NitnemManager.renderAllLists();
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    Toast.success('Back Online', 'Connection restored');
});

window.addEventListener('offline', () => {
    Toast.warning('Offline', 'You are currently offline');
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NitnemTrackerApp,
        Utils,
        StorageManager,
        HapticManager,
        SoundManager,
        Toast,
        ModalManager,
        ThemeEngine: window.NitnemTrackerThemeEngine,
        AmritvelaManager,
        NitnemManager,
        CONFIG
    };
}

/* ─────────────────────────────────────────────────────────────────────────────
   END OF PART 1
   ───────────────────────────────────────────────────────────────────────────── */

/* ═══════════════════════════════════════════════════════════════════════════════
   NITNEM TRACKER - PREMIUM iOS 26+ APPLICATION
   Part 2: Mala, Alarms, Streaks, Achievements, Reports, Celebrations, Stats
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 18: MALA COUNTER SYSTEM
   ───────────────────────────────────────────────────────────────────────────── */

const MalaManager = {
    elements: {},
    state: {
        count: 0,
        completedMalas: 0,
        totalToday: 0,
        beadsPerMala: 108,
        currentJaap: 'waheguru',
        beads: []
    },

    /**
     * Initialize Mala Counter
     */
    init() {
        // Prevent double initialization
        if (this.initialized) return;
        this.initialized = true;
        this.lastTapTime = 0;

        // Cache elements
        this.elements = {
            section: document.getElementById('malaSection'),
            ring: document.getElementById('malaRing'),
            beadsSvg: document.getElementById('malaBeadsSvg'),
            centerBtn: document.getElementById('malaCenterBtn'),
            countDisplay: document.getElementById('malaCount'),
            completedDisplay: document.getElementById('malaCompleted'),
            totalDisplay: document.getElementById('totalJaap'),
            progressFill: document.getElementById('malaProgressFill'),
            progressText: document.getElementById('malaProgressText'),
            tapHint: document.getElementById('tapHint'),
            malaOptions: document.querySelectorAll('.mala-option'),
            resetBtn: document.getElementById('malaResetBtn'),
            completeBtn: document.getElementById('malaCompleteBtn'),
            settingsBtn: document.getElementById('malaSettingsBtn')
        };

        // Load settings
        const settings = StorageManager.load(CONFIG.STORAGE_KEYS.SETTINGS, CONFIG.DEFAULT_SETTINGS);
        this.state.beadsPerMala = settings.beadsPerMala || 108;

        // Load today's data
        this.loadTodayData();

        // Generate beads
        this.generateBeads();

        // Setup event listeners
        this.setupEventListeners();

        // Update display
        this.updateDisplay();
    },

    /**
     * Load today's mala data
     */
    loadTodayData() {
        const today = Utils.getTodayString();
        const log = StorageManager.load(CONFIG.STORAGE_KEYS.MALA_LOG, {});

        if (log[today]) {
            this.state.completedMalas = log[today].completedMalas || 0;
            this.state.totalToday = log[today].totalCount || 0;
        } else {
            this.state.completedMalas = 0;
            this.state.totalToday = 0;
        }
    },

    /**
     * Save today's mala data
     */
    saveTodayData() {
        const today = Utils.getTodayString();
        const log = StorageManager.load(CONFIG.STORAGE_KEYS.MALA_LOG, {});

        log[today] = {
            completedMalas: this.state.completedMalas,
            totalCount: this.state.totalToday,
            lastUpdated: new Date().toISOString()
        };

        StorageManager.save(CONFIG.STORAGE_KEYS.MALA_LOG, log);
    },

    /**
     * Generate bead elements in SVG
     */
    generateBeads() {
        if (!this.elements.beadsSvg) return;

        const beadCount = this.state.beadsPerMala;
        const centerX = 100;
        const centerY = 100;
        const radius = 85;
        const beadRadius = beadCount <= 27 ? 8 : beadCount <= 54 ? 6 : 4;

        this.elements.beadsSvg.innerHTML = '';
        this.state.beads = [];

        // Add gradient definitions
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <radialGradient id="beadGradient">
                <stop offset="0%" stop-color="rgba(255,255,255,0.4)"/>
                <stop offset="100%" stop-color="rgba(255,255,255,0.1)"/>
            </radialGradient>
            <radialGradient id="activeBeadGradient">
                <stop offset="0%" stop-color="#AF52DE"/>
                <stop offset="100%" stop-color="#8B3DB8"/>
            </radialGradient>
            <radialGradient id="completedBeadGradient">
                <stop offset="0%" stop-color="#34C759"/>
                <stop offset="100%" stop-color="#248A3D"/>
            </radialGradient>
            <filter id="beadGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        `;
        this.elements.beadsSvg.appendChild(defs);

        // Generate beads in a circle
        for (let i = 0; i < beadCount; i++) {
            const angle = (i / beadCount) * 2 * Math.PI - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            const bead = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            bead.setAttribute('cx', x);
            bead.setAttribute('cy', y);
            bead.setAttribute('r', beadRadius);
            bead.setAttribute('class', 'mala-bead');
            bead.setAttribute('data-index', i);
            bead.setAttribute('fill', 'url(#beadGradient)');

            this.elements.beadsSvg.appendChild(bead);
            this.state.beads.push(bead);
        }

        // Add sumeru bead (main bead)
        const sumeruBead = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        sumeruBead.setAttribute('cx', centerX);
        sumeruBead.setAttribute('cy', centerY - radius);
        sumeruBead.setAttribute('r', beadRadius + 3);
        sumeruBead.setAttribute('class', 'mala-bead sumeru');
        sumeruBead.setAttribute('fill', '#FFD700');
        sumeruBead.setAttribute('filter', 'url(#beadGlow)');
        this.elements.beadsSvg.appendChild(sumeruBead);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Center button tap
        this.elements.centerBtn?.addEventListener('click', () => {
            this.incrementCount();
        });

        // Touch events for better mobile experience
        this.elements.centerBtn?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.elements.centerBtn.classList.add('pulse');
        }, { passive: false });

        this.elements.centerBtn?.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.incrementCount();
            setTimeout(() => {
                this.elements.centerBtn?.classList.remove('pulse');
            }, 150);
        }, { passive: false });

        // Keyboard support
        this.elements.centerBtn?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.incrementCount();
            }
        });

        // Jaap selection
        this.elements.malaOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.selectJaap(option.dataset.jaap);
            });
        });

        // Reset button
        this.elements.resetBtn?.addEventListener('click', () => {
            this.resetCurrent();
        });

        // Complete button
        this.elements.completeBtn?.addEventListener('click', () => {
            this.completeMala();
        });

        // Settings/Menu button
        this.elements.settingsBtn?.addEventListener('click', () => {
            this.showMalaMenu();
        });

        // Load custom mala options
        this.renderCustomMalaOptions();
    },

    /**
     * Increment count
     */
    incrementCount() {
        // Debounce to prevent double counting (e.g. touch + click)
        const now = Date.now();
        if (this.lastTapTime && (now - this.lastTapTime < 200)) {
            return;
        }
        this.lastTapTime = now;

        if (this.state.count >= this.state.beadsPerMala) {
            this.completeMala();
            return;
        }

        this.state.count++;
        this.state.totalToday++;

        // Haptic feedback
        HapticManager.malaTap();
        SoundManager.malaTap();

        // Update bead visual
        this.updateBeadVisual(this.state.count - 1);

        // Hide tap hint after first tap
        if (this.state.count === 1 && this.elements.tapHint) {
            this.elements.tapHint.style.display = 'none';
        }

        // Update display
        this.updateDisplay();

        // Animate count
        this.animateCountChange();

        // Check if mala complete
        if (this.state.count >= this.state.beadsPerMala) {
            this.completeMala();
        }

        // Save data
        this.saveTodayData();

        // ═══ LIVE GOAL PROGRESS UPDATE - Fix for stuck Naam Jaap count ═══
        if (typeof MalaGoalTracker !== 'undefined') {
            MalaGoalTracker.update();
        }
    },

    /**
     * Update bead visual
     */
    updateBeadVisual(index) {
        if (!this.state.beads[index]) return;

        const bead = this.state.beads[index];
        bead.setAttribute('fill', 'url(#activeBeadGradient)');
        bead.setAttribute('filter', 'url(#beadGlow)');
        bead.classList.add('active');

        // Animate bead
        bead.style.transform = 'scale(1.5)';
        bead.style.transition = 'transform 0.15s ease-out';

        setTimeout(() => {
            bead.style.transform = 'scale(1)';
            bead.setAttribute('fill', 'url(#completedBeadGradient)');
            bead.classList.remove('active');
            bead.classList.add('completed');
        }, 150);
    },

    /**
     * Animate count change
     */
    animateCountChange() {
        if (!this.elements.countDisplay) return;

        this.elements.countDisplay.classList.add('count-animate');
        setTimeout(() => {
            this.elements.countDisplay.classList.remove('count-animate');
        }, 300);
    },

    /**
     * Complete mala
     */
    completeMala() {
        this.state.completedMalas++;

        // Haptic feedback
        HapticManager.malaComplete();
        SoundManager.malaComplete();

        // Reset count
        this.state.count = 0;

        // Reset beads visual
        this.resetBeadsVisual();

        // Update display
        this.updateDisplay();

        // Save data
        this.saveTodayData();

        // ═══ Real-time Goal Progress Update ═══
        this.updateGoalProgress();
        if (typeof MalaGoalTracker !== 'undefined') {
            MalaGoalTracker.update();
        }

        // Show tap hint again
        if (this.elements.tapHint) {
            this.elements.tapHint.style.display = '';
        }

        // Check achievement
        AchievementManager.checkMalaMaster(this.state.completedMalas);

        // Show celebration
        Toast.success('🙏 Mala Complete!', `You've completed ${this.state.completedMalas} mala(s) today`);

        // Animate completion
        this.animateMalaComplete();
    },

    /**
     * Animate mala completion
     */
    animateMalaComplete() {
        if (!this.elements.ring) return;

        this.elements.ring.classList.add('glow-pulse');
        setTimeout(() => {
            this.elements.ring.classList.remove('glow-pulse');
        }, 2000);
    },

    /**
     * Reset beads visual
     */
    resetBeadsVisual() {
        this.state.beads.forEach(bead => {
            bead.setAttribute('fill', 'url(#beadGradient)');
            bead.removeAttribute('filter');
            bead.classList.remove('active', 'completed');
        });
    },

    /**
     * Reset current mala
     */
    resetCurrent() {
        if (this.state.count === 0) return;

        // Subtract from total
        this.state.totalToday -= this.state.count;
        this.state.count = 0;

        // Reset visuals
        this.resetBeadsVisual();

        // Update display
        this.updateDisplay();

        // Save data
        this.saveTodayData();

        // Haptic
        HapticManager.light();

        // Show tap hint
        if (this.elements.tapHint) {
            this.elements.tapHint.style.display = '';
        }

        Toast.info('Reset', 'Current mala has been reset');
    },

    /**
     * Select jaap
     */
    selectJaap(jaap) {
        if (jaap === 'custom') {
            this.showCustomJaapDialog();
            return;
        }

        this.state.currentJaap = jaap;

        // Update UI
        this.elements.malaOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.jaap === jaap);
        });

        HapticManager.selection();
    },

    /**
     * Show custom jaap dialog (enhanced modal version)
     */
    showCustomJaapDialog() {
        // Use the enhanced modal from the menu
        this.addCustomMala();
    },

    /**
     * Update display
     */
    updateDisplay() {
        // Count
        if (this.elements.countDisplay) {
            this.elements.countDisplay.textContent = this.state.count;
        }

        // Completed malas
        if (this.elements.completedDisplay) {
            this.elements.completedDisplay.textContent = this.state.completedMalas;
        }

        // Total today
        if (this.elements.totalDisplay) {
            this.elements.totalDisplay.textContent = this.state.totalToday;
        }

        // Progress bar
        if (this.elements.progressFill) {
            const percentage = (this.state.count / this.state.beadsPerMala) * 100;
            this.elements.progressFill.style.width = `${percentage}%`;
        }

        // Progress text
        if (this.elements.progressText) {
            this.elements.progressText.textContent = `${this.state.count}/${this.state.beadsPerMala}`;
        }
    },

    /**
     * Update bead count from settings
     */
    updateBeadCount(count) {
        if (!CONFIG.MALA.BEAD_OPTIONS.includes(count)) return;

        this.state.beadsPerMala = count;
        this.state.count = 0;

        // Regenerate beads
        this.generateBeads();

        // Update display
        this.updateDisplay();
    },

    /**
     * Get today's stats
     */
    getTodayStats() {
        return {
            count: this.state.count,
            completedMalas: this.state.completedMalas,
            totalToday: this.state.totalToday
        };
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // ENHANCED MALA MENU SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Show the three-dot menu for Mala section
     */
    showMalaMenu() {
        // Load current goal if any
        const dailyGoals = StorageManager.load('nt_mala_goals', {});
        const currentGoal = dailyGoals[this.state.currentJaap] || dailyGoals.default || 0;

        const menuHTML = `
            <div class="mala-menu-overlay" id="malaMenuOverlay" onclick="MalaManager.closeMenu(event)">
                <div class="mala-menu" onclick="event.stopPropagation()">
                    <div class="menu-header">
                        <h4>📿 Mala Options</h4>
                        <button class="menu-close-btn" onclick="MalaManager.closeMenu()">×</button>
                    </div>
                    
                    <div class="menu-option" onclick="MalaManager.setDailyGoal()">
                        <span class="menu-icon">🎯</span>
                        <div class="menu-text">
                            <span class="menu-label">Set Daily Goal</span>
                            <span class="menu-value">${currentGoal > 0 ? currentGoal + ' malas/day' : 'Not set'}</span>
                        </div>
                    </div>
                    
                    <div class="menu-option" onclick="MalaManager.viewPreviousData()">
                        <span class="menu-icon">📊</span>
                        <div class="menu-text">
                            <span class="menu-label">Previous Day Records</span>
                            <span class="menu-value">Yesterday & Day Before</span>
                        </div>
                    </div>
                    
                    <div class="menu-option" onclick="MalaManager.viewFullHistory()">
                        <span class="menu-icon">📅</span>
                        <div class="menu-text">
                            <span class="menu-label">View Full History</span>
                            <span class="menu-value">Last 30 days</span>
                        </div>
                    </div>
                    
                    <div class="menu-option" onclick="MalaManager.addCustomMala()">
                        <span class="menu-icon">➕</span>
                        <div class="menu-text">
                            <span class="menu-label">Add Custom Naam Jap</span>
                            <span class="menu-value">Create your own</span>
                        </div>
                    </div>
                    
                    <div class="menu-option" onclick="MalaManager.showPersonalBests()">
                        <span class="menu-icon">🏆</span>
                        <div class="menu-text">
                            <span class="menu-label">Personal Bests</span>
                            <span class="menu-value">Your records</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', menuHTML);
        HapticManager.light();
    },

    /**
     * Close the menu
     */
    closeMenu(event) {
        if (event && event.target.id !== 'malaMenuOverlay') return;

        const overlay = document.getElementById('malaMenuOverlay');
        if (overlay) {
            overlay.classList.add('closing');
            setTimeout(() => overlay.remove(), 200);
        }
    },

    /**
     * Set daily mala goal
     */
    setDailyGoal() {
        this.closeMenu();

        const dailyGoals = StorageManager.load('nt_mala_goals', {});
        const currentGoal = dailyGoals.default || 0;

        const modalHTML = `
            <div class="modal-overlay active" id="goalModal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>🎯 Set Daily Goal</h3>
                        <button class="modal-close" onclick="document.getElementById('goalModal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 16px; color: var(--text-secondary)">How many malas do you want to complete daily?</p>
                        
                        <div class="goal-presets">
                            <button class="goal-preset" onclick="MalaManager.confirmGoal(5)">5</button>
                            <button class="goal-preset" onclick="MalaManager.confirmGoal(10)">10</button>
                            <button class="goal-preset" onclick="MalaManager.confirmGoal(12)">12</button>
                            <button class="goal-preset" onclick="MalaManager.confirmGoal(21)">21</button>
                            <button class="goal-preset" onclick="MalaManager.confirmGoal(40)">40</button>
                        </div>
                        
                        <div class="custom-goal-input">
                            <label>Custom:</label>
                            <input type="number" id="customGoalInput" min="1" max="108" value="${currentGoal || 10}">
                            <button class="set-goal-btn" onclick="MalaManager.confirmGoal(parseInt(document.getElementById('customGoalInput').value))">Set</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    /**
     * Confirm goal setting
     */
    confirmGoal(goal) {
        if (!goal || goal < 1) return;

        const dailyGoals = StorageManager.load('nt_mala_goals', {});
        dailyGoals.default = goal;
        dailyGoals[this.state.currentJaap] = goal;
        StorageManager.save('nt_mala_goals', dailyGoals);

        document.getElementById('goalModal')?.remove();

        // Real-time UI update - no refresh needed
        this.updateGoalProgress();

        // Also update the enhanced goal tracker display
        if (typeof MalaGoalTracker !== 'undefined') {
            MalaGoalTracker.update();
        }

        // Force update the display elements immediately
        this.updateDisplay();

        Toast.success('Goal Set!', `Daily goal: ${goal} malas`);
        HapticManager.success();
    },

    /**
     * Update goal progress display
     */
    updateGoalProgress() {
        const dailyGoals = StorageManager.load('nt_mala_goals', {});
        const goal = dailyGoals.default || 0;

        if (goal > 0) {
            const progress = Math.min((this.state.completedMalas / goal) * 100, 100);
            const goalDisplay = document.getElementById('malaGoalProgress');

            if (goalDisplay) {
                goalDisplay.textContent = `${this.state.completedMalas}/${goal}`;
                goalDisplay.classList.toggle('complete', this.state.completedMalas >= goal);
            }
        }
    },

    /**
     * View previous day data
     */
    viewPreviousData() {
        this.closeMenu();

        const malaLog = StorageManager.load(CONFIG.STORAGE_KEYS.MALA_LOG, {});

        const yesterday = this.getDateString(-1);
        const dayBefore = this.getDateString(-2);

        const yesterdayData = malaLog[yesterday] || { completedMalas: 0, totalCount: 0 };
        const dayBeforeData = malaLog[dayBefore] || { completedMalas: 0, totalCount: 0 };

        const formatDate = (dateStr) => {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        };

        const modalHTML = `
            <div class="modal-overlay active" id="previousDataModal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>📊 Previous Records</h3>
                        <button class="modal-close" onclick="document.getElementById('previousDataModal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="record-card">
                            <h4>📅 Yesterday (${formatDate(yesterday)})</h4>
                            <div class="record-stats">
                                <div class="record-stat">
                                    <span class="stat-value">${yesterdayData.completedMalas || 0}</span>
                                    <span class="stat-label">Malas</span>
                                </div>
                                <div class="record-stat">
                                    <span class="stat-value">${yesterdayData.totalCount || 0}</span>
                                    <span class="stat-label">Total Beads</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="record-card">
                            <h4>📅 Day Before (${formatDate(dayBefore)})</h4>
                            <div class="record-stats">
                                <div class="record-stat">
                                    <span class="stat-value">${dayBeforeData.completedMalas || 0}</span>
                                    <span class="stat-label">Malas</span>
                                </div>
                                <div class="record-stat">
                                    <span class="stat-value">${dayBeforeData.totalCount || 0}</span>
                                    <span class="stat-label">Total Beads</span>
                                </div>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 16px; color: var(--text-tertiary); font-size: 13px;">
                            📿 Total this week: ${this.getWeekTotal()} malas
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    /**
     * Get date string for offset days
     */
    getDateString(offsetDays) {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        return d.toLocaleDateString('en-CA');
    },

    /**
     * Get week total malas
     */
    getWeekTotal() {
        const malaLog = StorageManager.load(CONFIG.STORAGE_KEYS.MALA_LOG, {});
        let total = 0;

        for (let i = 0; i < 7; i++) {
            const dateStr = this.getDateString(-i);
            const dayData = malaLog[dateStr];
            if (dayData) {
                total += dayData.completedMalas || 0;
            }
        }

        return total;
    },

    /**
     * View full history
     */
    viewFullHistory() {
        this.closeMenu();

        const malaLog = StorageManager.load(CONFIG.STORAGE_KEYS.MALA_LOG, {});
        const entries = [];

        for (let i = 0; i < 30; i++) {
            const dateStr = this.getDateString(-i);
            const dayData = malaLog[dateStr];
            if (dayData && dayData.completedMalas > 0) {
                entries.push({
                    date: dateStr,
                    malas: dayData.completedMalas || 0,
                    total: dayData.totalCount || 0
                });
            }
        }

        const formatDate = (dateStr) => {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };

        const historyHTML = entries.length > 0 ? entries.map(e => `
            <div class="history-item">
                <span class="history-date">${formatDate(e.date)}</span>
                <span class="history-malas">${e.malas} malas</span>
                <span class="history-total">${e.total} beads</span>
            </div>
        `).join('') : '<p style="text-align:center;color:var(--text-tertiary);padding:20px;">No records yet. Start counting!</p>';

        const modalHTML = `
            <div class="modal-overlay active" id="historyModal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>📅 Mala History (Last 30 Days)</h3>
                        <button class="modal-close" onclick="document.getElementById('historyModal').remove()">×</button>
                    </div>
                    <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
                        <div class="history-list">
                            ${historyHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    /**
     * Add custom mala
     */
    addCustomMala() {
        this.closeMenu();

        const modalHTML = `
            <div class="modal-overlay active" id="addMalaModal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>➕ Add Custom Naam Jap</h3>
                        <button class="modal-close" onclick="document.getElementById('addMalaModal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" id="customMalaName" placeholder="e.g., ਧੰਨ ਗੁਰੂ ਨਾਨਕ">
                        </div>
                        
                        <div class="form-group">
                            <label>Mantra (Optional)</label>
                            <textarea id="customMalaMantra" placeholder="Enter mantra in Gurmukhi or English" rows="2"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Beads per Mala</label>
                            <input type="number" id="customMalaBeads" value="108" min="1" max="1000">
                        </div>
                        
                        <div class="form-group">
                            <label>Select Icon</label>
                            <div class="icon-picker" id="iconPicker">
                                <span class="icon-option selected" data-icon="🙏">🙏</span>
                                <span class="icon-option" data-icon="☬">☬</span>
                                <span class="icon-option" data-icon="✨">✨</span>
                                <span class="icon-option" data-icon="📿">📿</span>
                                <span class="icon-option" data-icon="🌸">🌸</span>
                                <span class="icon-option" data-icon="💫">💫</span>
                                <span class="icon-option" data-icon="🕉️">🕉️</span>
                                <span class="icon-option" data-icon="⭐">⭐</span>
                            </div>
                        </div>
                        
                        <button class="primary-btn full-width" onclick="MalaManager.saveCustomMala()">
                            Add Mala
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Setup icon picker
        document.querySelectorAll('#iconPicker .icon-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('#iconPicker .icon-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });
    },

    /**
     * Save custom mala
     */
    saveCustomMala() {
        const name = document.getElementById('customMalaName')?.value.trim();
        const mantra = document.getElementById('customMalaMantra')?.value.trim();
        const beads = parseInt(document.getElementById('customMalaBeads')?.value) || 108;
        const icon = document.querySelector('#iconPicker .icon-option.selected')?.dataset.icon || '📿';

        if (!name) {
            Toast.error('Error', 'Please enter a name');
            return;
        }

        const customMalas = StorageManager.load('nt_custom_malas', []);

        customMalas.push({
            id: `custom_${Date.now()}`,
            name,
            mantra,
            beadsPerMala: beads,
            icon,
            createdAt: Date.now()
        });

        StorageManager.save('nt_custom_malas', customMalas);

        document.getElementById('addMalaModal')?.remove();
        this.renderCustomMalaOptions();

        Toast.success('Added!', `${name} has been added`);
        HapticManager.success();
    },

    /**
     * Render custom mala options in the selector
     */
    renderCustomMalaOptions() {
        const customMalas = StorageManager.load('nt_custom_malas', []);
        const container = document.querySelector('.mala-options');

        if (!container || customMalas.length === 0) return;

        // Remove existing custom options
        container.querySelectorAll('.custom-mala').forEach(el => el.remove());

        // Add custom options
        customMalas.forEach(mala => {
            const optionHTML = `
                <button class="mala-option custom-mala" data-jaap="${mala.id}">
                    <span class="option-gurmukhi">${mala.icon} ${mala.name}</span>
                    <span class="option-english">${mala.beadsPerMala} beads</span>
                </button>
            `;
            container.insertAdjacentHTML('beforeend', optionHTML);
        });

        // Reattach click handlers
        container.querySelectorAll('.custom-mala').forEach(opt => {
            opt.addEventListener('click', () => this.selectJaap(opt.dataset.jaap));
        });
    },

    /**
     * Show personal bests
     */
    showPersonalBests() {
        this.closeMenu();

        const malaLog = StorageManager.load(CONFIG.STORAGE_KEYS.MALA_LOG, {});

        // Calculate personal bests
        let maxMalasDay = 0;
        let maxMalasDate = '';
        let totalLifetime = 0;
        let daysTracked = 0;
        let currentStreak = 0;
        let maxStreak = 0;

        const sortedDates = Object.keys(malaLog).sort().reverse();

        sortedDates.forEach((date, index) => {
            const data = malaLog[date];
            if (data && data.completedMalas > 0) {
                totalLifetime += data.completedMalas;
                daysTracked++;

                if (data.completedMalas > maxMalasDay) {
                    maxMalasDay = data.completedMalas;
                    maxMalasDate = date;
                }

                // Calculate streak
                if (index === 0 || this.areDatesConsecutive(sortedDates[index - 1], date)) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 1;
                }
            }
        });

        const avgPerDay = daysTracked > 0 ? Math.round(totalLifetime / daysTracked) : 0;

        const formatDate = (dateStr) => {
            if (!dateStr) return 'N/A';
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };

        const modalHTML = `
            <div class="modal-overlay active" id="bestsModal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>🏆 Personal Bests</h3>
                        <button class="modal-close" onclick="document.getElementById('bestsModal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="personal-bests-grid">
                            <div class="best-card">
                                <span class="best-icon">📿</span>
                                <span class="best-value">${totalLifetime}</span>
                                <span class="best-label">Lifetime Malas</span>
                            </div>
                            <div class="best-card">
                                <span class="best-icon">🔥</span>
                                <span class="best-value">${maxMalasDay}</span>
                                <span class="best-label">Best Single Day</span>
                                <span class="best-date">${formatDate(maxMalasDate)}</span>
                            </div>
                            <div class="best-card">
                                <span class="best-icon">📊</span>
                                <span class="best-value">${avgPerDay}</span>
                                <span class="best-label">Avg. Per Day</span>
                            </div>
                            <div class="best-card">
                                <span class="best-icon">🎯</span>
                                <span class="best-value">${maxStreak}</span>
                                <span class="best-label">Best Streak</span>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 20px; color: var(--text-tertiary); font-size: 13px;">
                            📅 ${daysTracked} days tracked
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    /**
     * Check if two dates are consecutive
     */
    areDatesConsecutive(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays === 1;
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 19: ALARM OBEDIENCE SYSTEM
   ───────────────────────────────────────────────────────────────────────────── */

const AlarmManager = {
    elements: {},
    state: {
        alarms: [],
        weekOffset: 0,
        todayAlarms: [],
        stats: {
            responded: 0,
            snoozed: 0,
            missed: 0
        },
        isSyncing: false
    },

    /**
     * Icon mapping for reminders - converts text icon names to emojis
     */
    ICON_MAP: {
        'sunrise': '🌅',
        'sunset': '🌇',
        'moon': '🌙',
        'bell': '🔔',
        'clock': '⏰',
        'star': '⭐',
        'heart': '❤️',
        'book': '📖',
        'music': '🎵',
        'custom': '🔔',
        'amritvela': '🌅',
        'rehras': '🌇',
        'sohila': '🌙'
    },

    /**
     * Convert icon name to emoji
     */
    getIconEmoji(iconName) {
        if (!iconName) return '🔔';
        // If it's already an emoji (single char or 2 chars for emoji), return it
        if (iconName.length <= 2 || /\p{Emoji}/u.test(iconName)) {
            return iconName;
        }
        return this.ICON_MAP[iconName.toLowerCase()] || '🔔';
    },

    /**
     * Get color based on type/color name
     */
    getColorValue(colorName) {
        const colorMap = {
            'saffron': '#FF9500',
            'orange': '#FF6B00',
            'purple': '#AF52DE',
            'blue': '#007AFF',
            'green': '#34C759',
            'red': '#FF3B30',
            'teal': '#5AC8FA',
            'pink': '#FF2D55',
            'yellow': '#FFCC00'
        };
        // If it's already a hex color or rgb, return it
        if (colorName && (colorName.startsWith('#') || colorName.startsWith('rgb'))) {
            return colorName;
        }
        return colorMap[colorName?.toLowerCase()] || '#007AFF';
    },

    /**
     * Initialize Alarm Manager
     */
    init() {
        // Cache elements
        this.elements = {
            section: document.getElementById('alarmSection'),
            weekView: document.getElementById('alarmWeekView'),
            weekLabel: document.getElementById('weekLabel'),
            weekDays: document.getElementById('weekDays'),
            prevWeekBtn: document.getElementById('prevWeekBtn'),
            nextWeekBtn: document.getElementById('nextWeekBtn'),
            statsGrid: document.getElementById('alarmStatsGrid'),
            alarmsResponded: document.getElementById('alarmsResponded'),
            alarmsSnoozed: document.getElementById('alarmsSnoozed'),
            alarmsMissed: document.getElementById('alarmsMissed'),
            obedienceRate: document.getElementById('obedienceRate'),
            todayAlarmsList: document.getElementById('todayAlarmsList'),
            linkRemindersBtn: document.getElementById('linkRemindersBtn'),
            syncRemindersBtn: document.getElementById('syncRemindersBtn')
        };

        // Load data
        this.loadAlarmData();

        // Setup event listeners
        this.setupEventListeners();

        // Render week view
        this.renderWeekView();

        // Render today's alarms
        this.renderTodayAlarms();

        // Update stats
        this.updateStats();
    },

    /**
     * Load alarm data
     */
    loadAlarmData() {
        const log = StorageManager.load(CONFIG.STORAGE_KEYS.ALARM_LOG, {});
        this.state.alarms = log;

        // Calculate stats for current week
        this.calculateStats();

        // Try to sync from Smart Reminders
        this.syncFromSmartReminders();
    },

    /**
     * Sync from Smart Reminders - Enhanced Pro Level
     */
    syncFromSmartReminders() {
        // Prevent double sync
        if (this.state.isSyncing) return;
        this.state.isSyncing = true;

        // Add loading state to sync buttons
        const syncBtns = document.querySelectorAll('.sync-reminders-btn, #syncRemindersBtn, #syncRemindersBtn2');
        syncBtns.forEach(btn => {
            if (btn) {
                btn.classList.add('syncing');
                btn.disabled = true;
            }
        });

        try {
            // Try multiple storage keys for compatibility
            const keys = ['sr_reminders_v4', 'sr_reminders_v3', 'smart_reminders_v1'];
            let rawData = null;
            let foundKey = null;

            for (const key of keys) {
                rawData = localStorage.getItem(key);
                if (rawData) {
                    foundKey = key;
                    break;
                }
            }

            if (!rawData) {
                console.log('⚠️ No Smart Reminders data found in any storage key');
                this.state.todayAlarms = [];
                this.renderTodayAlarms();
                return;
            }

            console.log(`✅ Found reminders in: ${foundKey}`);
            const data = JSON.parse(rawData);
            let reminders = [];

            // Handle different data structures
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

            // Filter for today's day and enabled reminders
            const today = new Date().getDay(); // 0 = Sunday
            const todayDate = Utils.getTodayString();

            // Get stats data
            const statsData = localStorage.getItem('sr_stats_v4');
            const stats = statsData ? JSON.parse(statsData) : {};

            this.state.todayAlarms = reminders
                .filter(r => {
                    // Check if enabled
                    if (r.enabled === false) return false;
                    // Check if scheduled for today
                    const days = r.days || [0, 1, 2, 3, 4, 5, 6]; // Default to all days
                    return days.includes(today);
                })
                .map(r => {
                    // Determine status from our local alarm log or stats
                    let status = 'pending';
                    const alarmLog = this.state.alarms[todayDate] || {};

                    if (alarmLog[r.id]) {
                        const entry = alarmLog[r.id];
                        status = typeof entry === 'object' ? entry.status : entry;
                    } else if (stats.completedById && stats.completedById[r.id]) {
                        // Check if completed today in Smart Reminders stats
                        const lastCompleted = stats.lastCompletedDate?.[r.id];
                        if (lastCompleted === todayDate) {
                            status = 'responded';
                        }
                    }

                    // Check if alarm time has passed
                    const now = new Date();
                    const [hours, minutes] = (r.time || '00:00').split(':').map(Number);
                    const alarmTime = new Date();
                    alarmTime.setHours(hours, minutes, 0, 0);

                    if (now > alarmTime && status === 'pending') {
                        // Time has passed, check if within 30 min grace period
                        const diffMins = (now - alarmTime) / 60000;
                        if (diffMins > 30) {
                            status = 'missed';
                        }
                    }

                    return {
                        id: r.id || Utils.generateId(),
                        time: r.time || '00:00',
                        label: r.title || r.titlePunjabi || r.label || 'Reminder',
                        labelPunjabi: r.titlePunjabi || '',
                        bani: r.bani || r.description || '',
                        icon: r.icon || '🔔',
                        color: r.color || '#007AFF',
                        importance: r.importance || 'normal',
                        status: status,
                        type: r.type || 'custom',
                        enabled: true
                    };
                });

            // Sort by time
            this.state.todayAlarms.sort((a, b) => a.time.localeCompare(b.time));

            console.log(`📅 Synced ${this.state.todayAlarms.length} reminders for today`);

            // Render with animation
            this.renderTodayAlarms(true);

            // Update stats
            this.updateStats();

            // Save sync timestamp
            localStorage.setItem('nitnem_alarm_last_sync', Date.now().toString());

            // Show success message
            if (this.state.todayAlarms.length > 0) {
                Toast.success('Synced!', `${this.state.todayAlarms.length} reminders loaded`);
            }

        } catch (e) {
            console.error('❌ Error syncing Smart Reminders:', e);
            Toast.error('Sync failed', 'Check console for details');
        } finally {
            // Remove loading state
            this.state.isSyncing = false;
            const syncBtns = document.querySelectorAll('.sync-reminders-btn, #syncRemindersBtn, #syncRemindersBtn2');
            syncBtns.forEach(btn => {
                if (btn) {
                    btn.classList.remove('syncing');
                    btn.disabled = false;
                }
            });
        }
    },

    /**
     * Get alarm status for today
     */
    getAlarmStatus(alarmId) {
        const today = Utils.getTodayString();
        const log = this.state.alarms[today] || {};
        return log[alarmId] || 'pending';
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Week navigation
        this.elements.prevWeekBtn?.addEventListener('click', () => {
            this.state.weekOffset--;
            this.renderWeekView();
            HapticManager.selection();
        });

        this.elements.nextWeekBtn?.addEventListener('click', () => {
            if (this.state.weekOffset < 0) {
                this.state.weekOffset++;
                this.renderWeekView();
                HapticManager.selection();
            }
        });

        // Link/Sync buttons
        this.elements.linkRemindersBtn?.addEventListener('click', () => {
            this.openSmartReminders();
        });

        this.elements.syncRemindersBtn?.addEventListener('click', () => {
            this.syncFromSmartReminders();
            Toast.success('Synced', 'Reminders synced from Smart Reminders');
            HapticManager.success();
        });

        // Listen for alarm interactions from service worker/notifications
        this.listenForAlarmInteractions();
    },

    /**
     * Listen for alarm interactions
     */
    listenForAlarmInteractions() {
        // Listen for custom events from notification handler
        window.addEventListener('alarmInteraction', (e) => {
            const { alarmId, action, timestamp } = e.detail;
            this.recordAlarmInteraction(alarmId, action, timestamp);
        });

        // Check for stored interactions (from when app was closed)
        const pendingInteractions = JSON.parse(localStorage.getItem('pending_alarm_interactions') || '[]');
        pendingInteractions.forEach(interaction => {
            this.recordAlarmInteraction(interaction.alarmId, interaction.action, interaction.timestamp);
        });
        localStorage.removeItem('pending_alarm_interactions');
    },

    /**
     * Record alarm interaction
     */
    recordAlarmInteraction(alarmId, action, timestamp = new Date().toISOString()) {
        const date = timestamp.split('T')[0];

        if (!this.state.alarms[date]) {
            this.state.alarms[date] = {};
        }

        this.state.alarms[date][alarmId] = {
            status: action, // 'responded', 'snoozed', 'missed'
            timestamp
        };

        StorageManager.save(CONFIG.STORAGE_KEYS.ALARM_LOG, this.state.alarms);

        // Update displays
        this.calculateStats();
        this.updateStats();
        this.renderTodayAlarms();
        this.renderWeekView();
    },

    /**
     * Render week view
     */
    renderWeekView() {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + (this.state.weekOffset * 7));

        // Update week label
        if (this.elements.weekLabel) {
            if (this.state.weekOffset === 0) {
                this.elements.weekLabel.textContent = 'This Week';
            } else if (this.state.weekOffset === -1) {
                this.elements.weekLabel.textContent = 'Last Week';
            } else {
                const endDate = new Date(weekStart);
                endDate.setDate(weekStart.getDate() + 6);
                this.elements.weekLabel.textContent =
                    `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            }
        }

        // Disable next button if at current week
        if (this.elements.nextWeekBtn) {
            this.elements.nextWeekBtn.disabled = this.state.weekOffset >= 0;
        }

        // Render days
        if (!this.elements.weekDays) return;

        const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const todayString = Utils.getTodayString();

        let daysHTML = '';

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateString = date.toLocaleDateString('en-CA');

            const dayLog = this.state.alarms[dateString] || {};
            const statuses = Object.values(dayLog).map(l => l.status || l);

            let dayClass = '';
            if (dateString === todayString) {
                dayClass = 'today';
            } else if (statuses.length > 0) {
                const allResponded = statuses.every(s => s === 'responded');
                const hasMissed = statuses.some(s => s === 'missed');

                if (allResponded) {
                    dayClass = 'complete';
                } else if (hasMissed) {
                    dayClass = 'missed';
                } else {
                    dayClass = 'partial';
                }
            }

            daysHTML += `
                <div class="week-day ${dayClass}" data-date="${dateString}">
                    <span class="day-name">${dayNames[i]}</span>
                    <span class="day-number">${date.getDate()}</span>
                    <span class="day-indicator"></span>
                </div>
            `;
        }

        this.elements.weekDays.innerHTML = daysHTML;
    },

    /**
     * Render today's alarms - Premium iOS Style
     */
    renderTodayAlarms(animate = false) {
        if (!this.elements.todayAlarmsList) return;

        if (this.state.todayAlarms.length === 0) {
            this.elements.todayAlarmsList.innerHTML = `
                <div class="no-alarms-message">
                    <div class="empty-state-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="13" r="8"/>
                            <path d="M12 9v4l2 2"/>
                            <path d="M5 3L2 6"/>
                            <path d="M22 6l-3-3"/>
                            <path d="M6 19l-2 2"/>
                            <path d="M18 19l2 2"/>
                        </svg>
                    </div>
                    <h4>No Reminders Synced</h4>
                    <p>Connect with Smart Reminders to track your spiritual discipline</p>
                    <button class="sync-reminders-btn premium-btn" id="syncRemindersBtn2">
                        <span class="btn-icon">🔄</span>
                        <span>Sync from Smart Reminders</span>
                    </button>
                </div>
            `;

            document.getElementById('syncRemindersBtn2')?.addEventListener('click', () => {
                const btn = document.getElementById('syncRemindersBtn2');
                btn?.classList.add('syncing');
                this.syncFromSmartReminders();
                setTimeout(() => btn?.classList.remove('syncing'), 1000);
                Toast.success('Synced!', 'Reminders loaded successfully');
                HapticManager.success();
            });
            return;
        }

        // Sort by time
        const sortedAlarms = [...this.state.todayAlarms].sort((a, b) => {
            return a.time.localeCompare(b.time);
        });

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        this.elements.todayAlarmsList.innerHTML = sortedAlarms.map((alarm, index) => {
            const status = typeof alarm.status === 'object' ? alarm.status.status : alarm.status;
            const [hours, minutes] = (alarm.time || '00:00').split(':').map(Number);
            const alarmMinutes = hours * 60 + minutes;
            const isUpcoming = alarmMinutes > currentMinutes;
            const isPast = alarmMinutes <= currentMinutes;
            const isNext = isUpcoming && sortedAlarms.findIndex(a => {
                const [h, m] = (a.time || '00:00').split(':').map(Number);
                return h * 60 + m > currentMinutes;
            }) === index;

            const statusConfig = {
                pending: {
                    label: isUpcoming ? 'Upcoming' : 'Pending',
                    icon: '⏳',
                    gradient: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8ed 100%)',
                    color: '#8e8e93'
                },
                responded: {
                    label: 'Completed',
                    icon: '✓',
                    gradient: 'linear-gradient(135deg, #34c759 0%, #28a745 100%)',
                    color: '#fff'
                },
                snoozed: {
                    label: 'Snoozed',
                    icon: '💤',
                    gradient: 'linear-gradient(135deg, #ff9500 0%, #ff7b00 100%)',
                    color: '#fff'
                },
                missed: {
                    label: 'Missed',
                    icon: '✗',
                    gradient: 'linear-gradient(135deg, #ff3b30 0%, #dc3545 100%)',
                    color: '#fff'
                }
            };

            const config = statusConfig[status] || statusConfig.pending;
            const animDelay = animate ? index * 100 : 0;
            const importanceClass = alarm.importance === 'sacred' ? 'sacred' : '';

            // Time until alarm
            const diffMins = alarmMinutes - currentMinutes;
            let timeUntil = '';
            if (isUpcoming && status === 'pending') {
                if (diffMins < 60) {
                    timeUntil = `in ${diffMins} min`;
                } else {
                    timeUntil = `in ${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
                }
            }

            return `
                <div class="alarm-card-premium ${status} ${importanceClass} ${isNext ? 'next-alarm' : ''}" 
                     data-alarm-id="${alarm.id}"
                     style="animation-delay: ${animDelay}ms; ${animate ? 'animation: alarmCardSlideIn 0.5s ease-out forwards;' : ''}">
                    
                    <div class="alarm-card-left">
                        <div class="alarm-icon-wrapper" style="background: ${this.getColorValue(alarm.color)}">
                            <span class="alarm-icon">${this.getIconEmoji(alarm.icon)}</span>
                        </div>
                        <div class="alarm-info">
                            <div class="alarm-time-row">
                                <span class="alarm-time-large">${this.formatTime(alarm.time)}</span>
                                ${timeUntil ? `<span class="alarm-countdown">${timeUntil}</span>` : ''}
                            </div>
                            <span class="alarm-label-text">${alarm.label}</span>
                            ${alarm.labelPunjabi ? `<span class="alarm-label-punjabi">${alarm.labelPunjabi}</span>` : ''}
                            ${alarm.bani ? `<span class="alarm-bani-text">${alarm.bani}</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="alarm-card-right">
                        <div class="alarm-status-chip" style="background: ${config.gradient}; color: ${config.color}">
                            <span class="status-icon">${config.icon}</span>
                            <span class="status-text">${config.label}</span>
                        </div>
                        ${status === 'pending' ? `
                            <button class="alarm-action-btn" aria-label="Quick actions">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                    <circle cx="12" cy="6" r="2"/>
                                    <circle cx="12" cy="12" r="2"/>
                                    <circle cx="12" cy="18" r="2"/>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                    
                    ${isNext ? '<div class="next-alarm-indicator"><span>NEXT</span></div>' : ''}
                </div>
            `;
        }).join('');

        // Add click handlers
        this.elements.todayAlarmsList.querySelectorAll('.alarm-card-premium.pending').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.alarm-action-btn')) {
                    this.showAlarmActionSheet(item.dataset.alarmId);
                    HapticManager.selection();
                }
            });

            const actionBtn = item.querySelector('.alarm-action-btn');
            actionBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showAlarmActionSheet(item.dataset.alarmId);
                HapticManager.selection();
            });
        });
    },

    /**
     * Format time for display
     */
    formatTime(time) {
        const [hours, minutes] = time.split(':').map(Number);
        const { hours: h, minutes: m, period } = Utils.formatTime12h(hours, minutes);
        return `${h}:${m} ${period}`;
    },

    /**
     * Show alarm action sheet - Premium iOS Style
     */
    showAlarmActionSheet(alarmId) {
        // Find the alarm data
        const alarm = this.state.todayAlarms.find(a => a.id === alarmId);
        if (!alarm) return;

        // Remove any existing action sheet
        document.querySelector('.alarm-action-sheet-overlay')?.remove();

        // Create premium action sheet
        const overlay = document.createElement('div');
        overlay.className = 'alarm-action-sheet-overlay';
        overlay.innerHTML = `
            <div class="alarm-action-sheet">
                <div class="action-sheet-header">
                    <div class="action-sheet-icon" style="background: ${this.getColorValue(alarm.color)}">
                        <span>${this.getIconEmoji(alarm.icon)}</span>
                    </div>
                    <div class="action-sheet-title">
                        <h4>${alarm.label}</h4>
                        <p>${this.formatTime(alarm.time)}</p>
                    </div>
                </div>
                
                <div class="action-sheet-options">
                    <button class="action-option completed" data-action="responded">
                        <div class="option-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <path d="M20 6L9 17l-5-5"/>
                            </svg>
                        </div>
                        <div class="option-content">
                            <span class="option-label">Mark as Complete</span>
                            <span class="option-desc">I responded to this reminder</span>
                        </div>
                    </button>
                    
                    <button class="action-option snoozed" data-action="snoozed">
                        <div class="option-icon">💤</div>
                        <div class="option-content">
                            <span class="option-label">Snoozed</span>
                            <span class="option-desc">I delayed this reminder</span>
                        </div>
                    </button>
                    
                    <button class="action-option missed" data-action="missed">
                        <div class="option-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </div>
                        <div class="option-content">
                            <span class="option-label">Missed</span>
                            <span class="option-desc">I missed this reminder</span>
                        </div>
                    </button>
                </div>
                
                <button class="action-sheet-cancel">Cancel</button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });

        // Handle actions
        overlay.querySelectorAll('.action-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;

                // Visual feedback
                btn.classList.add('selected');
                HapticManager.success();

                // Record interaction
                setTimeout(() => {
                    this.recordAlarmInteraction(alarmId, action);
                    this.closeActionSheet(overlay);

                    // Show confirmation toast
                    const messages = {
                        responded: '✓ Marked as complete!',
                        snoozed: '💤 Marked as snoozed',
                        missed: '✗ Marked as missed'
                    };
                    Toast.success('Updated', messages[action]);
                }, 200);
            });
        });

        // Close handlers
        overlay.querySelector('.action-sheet-cancel').addEventListener('click', () => {
            HapticManager.selection();
            this.closeActionSheet(overlay);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeActionSheet(overlay);
            }
        });
    },

    /**
     * Close action sheet with animation
     */
    closeActionSheet(overlay) {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
    },

    /**
     * Calculate stats
     */
    calculateStats() {
        const { start, end } = Utils.getWeekRange();

        let responded = 0;
        let snoozed = 0;
        let missed = 0;

        Object.entries(this.state.alarms).forEach(([date, alarms]) => {
            const dateObj = new Date(date);
            if (dateObj >= start && dateObj <= end) {
                Object.values(alarms).forEach(alarm => {
                    const status = typeof alarm === 'object' ? alarm.status : alarm;
                    if (status === 'responded') responded++;
                    else if (status === 'snoozed') snoozed++;
                    else if (status === 'missed') missed++;
                });
            }
        });

        this.state.stats = { responded, snoozed, missed };
    },

    /**
     * Update stats display
     */
    updateStats() {
        const { responded, snoozed, missed } = this.state.stats;
        const total = responded + snoozed + missed;
        const rate = total > 0 ? Math.round((responded / total) * 100) : 0;

        if (this.elements.alarmsResponded) {
            this.elements.alarmsResponded.textContent = responded;
        }
        if (this.elements.alarmsSnoozed) {
            this.elements.alarmsSnoozed.textContent = snoozed;
        }
        if (this.elements.alarmsMissed) {
            this.elements.alarmsMissed.textContent = missed;
        }
        if (this.elements.obedienceRate) {
            this.elements.obedienceRate.textContent = `${rate}%`;
        }
    },

    /**
     * Open Smart Reminders page
     */
    openSmartReminders() {
        window.location.href = '../reminders/smart-reminders.html';
    },

    /**
     * Get obedience rate
     */
    getObedienceRate() {
        const { responded, snoozed, missed } = this.state.stats;
        const total = responded + snoozed + missed;
        return total > 0 ? Math.round((responded / total) * 100) : 0;
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 20: STREAK ENGINE
   ───────────────────────────────────────────────────────────────────────────── */

const StreakManager = {
    elements: {},
    state: {
        current: 0,
        longest: 0,
        totalDays: 0,
        lastUpdated: null
    },

    /**
     * Initialize Streak Manager
     */
    init() {
        // Cache elements
        this.elements = {
            section: document.getElementById('streakSection'),
            mainNumber: document.getElementById('mainStreakNumber'),
            message: document.getElementById('streakMessage'),
            currentStreak: document.getElementById('currentStreak'),
            longestStreak: document.getElementById('longestStreak'),
            totalDays: document.getElementById('totalDays')
        };

        // Load streak data
        this.loadStreakData();

        // Update display
        this.updateDisplay();

        // Add flame animation if streak > 0
        this.updateFlameAnimation();
    },

    /**
     * Load streak data
     */
    loadStreakData() {
        const saved = StorageManager.load(CONFIG.STORAGE_KEYS.STREAK_DATA, null);

        if (saved) {
            this.state = { ...this.state, ...saved };
        }

        // Recalculate to ensure accuracy
        this.recalculateStreak();
    },

    /**
     * Recalculate streak from logs
     */
    recalculateStreak() {
        const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});

        // A day is "complete" if both Amritvela and Nitnem are done
        const completeDates = [];

        const amritvelaDates = Object.keys(amritvelaLog);
        const nitnemDates = Object.keys(nitnemLog);

        amritvelaDates.forEach(date => {
            // Check if nitnem was completed on this date
            const nitnemData = nitnemLog[date];
            if (nitnemData) {
                // Check if all banis were completed
                const selectedBanis = StorageManager.load(CONFIG.STORAGE_KEYS.SELECTED_BANIS, {
                    amritvela: [],
                    rehras: [],
                    sohila: []
                });

                let allComplete = true;
                Object.keys(selectedBanis).forEach(period => {
                    const selected = selectedBanis[period];
                    const completed = nitnemData[period] || [];
                    if (selected.length > 0 && completed.length < selected.length) {
                        allComplete = false;
                    }
                });

                if (allComplete) {
                    completeDates.push(date);
                }
            }
        });

        // If no complete dates, just use Amritvela dates for streak
        const datesToUse = completeDates.length > 0 ? completeDates : amritvelaDates;

        // Calculate current streak
        this.state.current = Utils.calculateStreak(datesToUse);

        // Calculate longest streak
        this.state.longest = Math.max(this.state.longest, this.state.current);

        // Total days
        this.state.totalDays = datesToUse.length;

        // Save
        this.saveStreakData();
    },

    /**
     * Save streak data
     */
    saveStreakData() {
        this.state.lastUpdated = new Date().toISOString();
        StorageManager.save(CONFIG.STORAGE_KEYS.STREAK_DATA, this.state);
    },

    /**
     * Check and update streak
     */
    checkAndUpdate() {
        const previousStreak = this.state.current;
        this.recalculateStreak();

        // Check for streak milestones
        if (this.state.current > previousStreak) {
            this.checkMilestones(this.state.current);
        }

        // Update display
        this.updateDisplay();
        this.updateFlameAnimation();

        // Update header
        HeaderManager.updateStreakDisplay();
    },

    /**
     * Check for streak milestones
     */
    checkMilestones(streak) {
        if (streak === 7) {
            AchievementManager.unlock(ACHIEVEMENT_IDS.WEEK_STREAK);
            CelebrationManager.show('weekStreak');
        } else if (streak === 30) {
            AchievementManager.unlock(ACHIEVEMENT_IDS.MONTH_STREAK);
            CelebrationManager.show('monthStreak');
        } else if (streak === 100) {
            CelebrationManager.show('centuryStreak');
        } else if (streak === 365) {
            CelebrationManager.show('yearStreak');
        }
    },

    /**
     * Update display
     */
    updateDisplay() {
        // Main streak number
        if (this.elements.mainNumber) {
            Utils.animateNumber(
                this.elements.mainNumber,
                parseInt(this.elements.mainNumber.textContent) || 0,
                this.state.current,
                800
            );
        }

        // Current streak
        if (this.elements.currentStreak) {
            this.elements.currentStreak.textContent = this.state.current;
        }

        // Longest streak
        if (this.elements.longestStreak) {
            this.elements.longestStreak.textContent = this.state.longest;
        }

        // Total days
        if (this.elements.totalDays) {
            this.elements.totalDays.textContent = this.state.totalDays;
        }

        // Message
        this.updateMessage();
    },

    /**
     * Update streak message
     */
    updateMessage() {
        if (!this.elements.message) return;

        let message = '';
        const streak = this.state.current;

        if (streak === 0) {
            message = 'Start your spiritual journey today! 🙏';
        } else if (streak === 1) {
            message = 'Great start! Keep it going tomorrow! 🌟';
        } else if (streak < 7) {
            message = `${streak} days strong! ${7 - streak} more for a week! 💪`;
        } else if (streak === 7) {
            message = '🎉 One week complete! Amazing dedication!';
        } else if (streak < 30) {
            message = `${streak} days! ${30 - streak} more for a month! 🔥`;
        } else if (streak === 30) {
            message = '🏆 One month! You are truly blessed!';
        } else if (streak < 100) {
            message = `${streak} days of devotion! Incredible! ✨`;
        } else {
            message = `${streak} days! You are an inspiration! 👑`;
        }

        this.elements.message.textContent = message;
    },

    /**
     * Update flame animation
     */
    updateFlameAnimation() {
        if (!this.elements.section) return;

        if (this.state.current > 0) {
            this.elements.section.classList.add('active');
        } else {
            this.elements.section.classList.remove('active');
        }
    },

    /**
     * Get streak data
     */
    getData() {
        return { ...this.state };
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 21: ACHIEVEMENT SYSTEM
   ───────────────────────────────────────────────────────────────────────────── */

const AchievementManager = {
    achievements: [],
    unlockedAchievements: [],
    elements: {},

    /**
     * Initialize Achievement System
     */
    async init() {
        // Cache elements
        this.elements = {
            grid: document.getElementById('achievementsGrid')
        };

        // Load achievements data
        await this.loadAchievements();

        // Load unlocked achievements
        this.loadUnlockedAchievements();

        // Render achievements
        this.renderAchievements();
    },

    /**
     * Load achievements data
     */
    async loadAchievements() {
        try {
            const response = await fetch(CONFIG.API.ACHIEVEMENTS);
            if (response.ok) {
                const data = await response.json();
                // FIX: Ensure achievements is always an array (handle wrapper)
                const items = data.achievements || data;
                this.achievements = Array.isArray(items) ? items : this.getDefaultAchievements();
            } else {
                throw new Error('Failed to load');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load achievements.json, using defaults:', error);
            // Use default achievements
            this.achievements = this.getDefaultAchievements();
        }
    },

    /**
     * Get default achievements
     */
    getDefaultAchievements() {
        return [
            {
                id: 'first-amritvela',
                name: 'Early Riser',
                description: 'First Amritvela',
                icon: '🌅',
                condition: 'Mark present for the first time'
            },
            {
                id: 'week-streak',
                name: 'Week Warrior',
                description: '7 Day Streak',
                icon: '🔥',
                condition: 'Maintain a 7-day streak'
            },
            {
                id: 'month-streak',
                name: 'Month Master',
                description: '30 Day Streak',
                icon: '⭐',
                condition: 'Maintain a 30-day streak'
            },
            {
                id: 'mala-master',
                name: 'Mala Master',
                description: '108 in one sitting',
                icon: '📿',
                condition: 'Complete a full mala of 108'
            },
            {
                id: 'nitnem-complete',
                name: 'Nitnem Complete',
                description: 'All daily banis',
                icon: '📖',
                condition: 'Complete all Nitnem banis in a day'
            },
            {
                id: 'perfect-week',
                name: 'Perfect Week',
                description: '100% Obedience',
                icon: '💎',
                condition: 'Respond to all alarms for a week'
            }
        ];
    },

    /**
     * Load unlocked achievements
     */
    loadUnlockedAchievements() {
        this.unlockedAchievements = StorageManager.load(CONFIG.STORAGE_KEYS.ACHIEVEMENTS, []);
    },

    /**
     * Save unlocked achievements
     */
    saveUnlockedAchievements() {
        StorageManager.save(CONFIG.STORAGE_KEYS.ACHIEVEMENTS, this.unlockedAchievements);
    },

    /**
     * Render achievements grid
     */
    renderAchievements() {
        if (!this.elements.grid) return;

        // FIX: Ensure achievements is an array before mapping
        if (!Array.isArray(this.achievements)) {
            console.warn('⚠️ Achievements not loaded, loading defaults');
            this.achievements = this.getDefaultAchievements();
        }

        this.elements.grid.innerHTML = this.achievements.map(achievement => {
            const isUnlocked = this.unlockedAchievements.includes(achievement.id);

            return `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}" 
                     data-achievement="${achievement.id}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <span class="achievement-name">${achievement.name}</span>
                    <span class="achievement-desc">${achievement.description}</span>
                </div>
            `;
        }).join('');

        // Add click handlers
        this.elements.grid.querySelectorAll('.achievement-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showAchievementDetails(card.dataset.achievement);
            });
        });
    },

    /**
     * Show achievement details
     */
    showAchievementDetails(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement) return;

        const isUnlocked = this.unlockedAchievements.includes(achievementId);

        Toast.info(
            `${achievement.icon} ${achievement.name}`,
            isUnlocked ? 'Achievement Unlocked!' : achievement.condition
        );

        HapticManager.light();
    },

    /**
     * Unlock achievement
     */
    unlock(achievementId) {
        if (this.unlockedAchievements.includes(achievementId)) return;

        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement) return;

        this.unlockedAchievements.push(achievementId);
        this.saveUnlockedAchievements();

        // Update UI
        const card = this.elements.grid?.querySelector(`[data-achievement="${achievementId}"]`);
        if (card) {
            card.classList.remove('locked');
            card.classList.add('unlocked');
        }

        // Show celebration
        HapticManager.success();
        SoundManager.success();

        Toast.success(
            `🏆 Achievement Unlocked!`,
            `${achievement.icon} ${achievement.name}`
        );
    },

    /**
     * Check Amritvela achievements
     */
    checkAmritvela(entry) {
        // First Amritvela
        if (!this.unlockedAchievements.includes(ACHIEVEMENT_IDS.FIRST_AMRITVELA)) {
            this.unlock(ACHIEVEMENT_IDS.FIRST_AMRITVELA);
        }
    },

    /**
     * Check Nitnem complete achievement
     */
    checkNitnemComplete() {
        if (!this.unlockedAchievements.includes(ACHIEVEMENT_IDS.NITNEM_COMPLETE)) {
            this.unlock(ACHIEVEMENT_IDS.NITNEM_COMPLETE);
        }
    },

    /**
     * Check Mala Master achievement
     */
    checkMalaMaster(completedMalas) {
        if (completedMalas >= 1 && !this.unlockedAchievements.includes(ACHIEVEMENT_IDS.MALA_MASTER)) {
            this.unlock(ACHIEVEMENT_IDS.MALA_MASTER);
        }
    },

    /**
     * Check Perfect Week achievement
     */
    checkPerfectWeek() {
        const rate = AlarmManager.getObedienceRate();
        if (rate === 100 && !this.unlockedAchievements.includes(ACHIEVEMENT_IDS.PERFECT_WEEK)) {
            this.unlock(ACHIEVEMENT_IDS.PERFECT_WEEK);
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 22: REPORTS MANAGER
   ───────────────────────────────────────────────────────────────────────────── */

const ReportsManager = {
    elements: {},
    activeReport: 'weekly',
    currentMonth: new Date(),

    /**
     * Initialize Reports Manager
     */
    init() {
        try {
            // Initialize generator - check if ReportGenerator exists
            if (typeof window.ReportGenerator === 'function') {
                this.generator = new window.ReportGenerator(StorageManager);
            } else {
                console.warn('⚠️ ReportGenerator not available, reports will be limited');
                this.generator = null;
            }

            // Cache elements
            this.elements = {
                section: document.getElementById('reportsSection'),
                reportTabs: document.querySelectorAll('.report-tab'),
                weeklyReport: document.getElementById('weeklyReport'),
                monthlyReport: document.getElementById('monthlyReport'),
                weeklyChartBars: document.getElementById('weeklyChartBars'),
                weeklyInsight: document.getElementById('weeklyInsight'),
                weeklyAmritvelaFill: document.getElementById('weeklyAmritvelaFill'),
                weeklyAmritvelaValue: document.getElementById('weeklyAmritvelaValue'),
                weeklyNitnemFill: document.getElementById('weeklyNitnemFill'),
                weeklyNitnemValue: document.getElementById('weeklyNitnemValue'),
                weeklyAlarmsFill: document.getElementById('weeklyAlarmsFill'),
                weeklyAlarmsValue: document.getElementById('weeklyAlarmsValue'),
                calendarMonth: document.getElementById('calendarMonth'),
                calendarDays: document.getElementById('calendarDays'),
                prevMonthBtn: document.getElementById('prevMonthBtn'),
                nextMonthBtn: document.getElementById('nextMonthBtn'),
                monthlyCompleteDays: document.getElementById('monthlyCompleteDays'),
                monthlyAvgWakeTime: document.getElementById('monthlyAvgWakeTime'),
                monthlyMalas: document.getElementById('monthlyMalas'),
                exportReportBtn: document.getElementById('exportReportBtn'),
                shareReportBtn: document.getElementById('shareReportBtn')
            };

            // Setup event listeners
            this.setupEventListeners();

            // Render reports (with error protection)
            try {
                this.renderWeeklyReport();
            } catch (e) {
                console.warn('⚠️ renderWeeklyReport error:', e);
            }

            try {
                this.renderMonthlyCalendar();
            } catch (e) {
                console.warn('⚠️ renderMonthlyCalendar error:', e);
            }
        } catch (error) {
            console.error('❌ ReportsManager failed to initialize:', error);
            // Don't show error toast - silent fail for reports
        }
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Report tabs
        this.elements.reportTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchReport(tab.dataset.report);
            });
        });

        // Month navigation
        this.elements.prevMonthBtn?.addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
            this.renderMonthlyCalendar();
            HapticManager.selection();
        });

        this.elements.nextMonthBtn?.addEventListener('click', () => {
            const now = new Date();
            if (this.currentMonth.getMonth() < now.getMonth() ||
                this.currentMonth.getFullYear() < now.getFullYear()) {
                this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
                this.renderMonthlyCalendar();
                HapticManager.selection();
            }
        });

        // Export/Share
        this.elements.exportReportBtn?.addEventListener('click', () => {
            this.exportReport();
        });

        this.elements.shareReportBtn?.addEventListener('click', () => {
            this.shareReport();
        });
    },

    /**
     * Switch report view
     */
    switchReport(reportType) {
        if (this.activeReport === reportType) return;

        this.activeReport = reportType;
        HapticManager.selection();

        // Update tabs
        this.elements.reportTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.report === reportType);
        });

        // Update content
        document.querySelectorAll('.report-content').forEach(content => {
            content.classList.toggle('active', content.dataset.report === reportType);
        });
    },

    /**
     * Render weekly report
     */
    renderWeeklyReport() {
        const report = this.generator.generateWeeklyReport();
        const { start, end } = Utils.getWeekRange();

        // Use generator's daily stats
        const dailyData = [];
        const dates = this.generator.getWeekDates().reverse(); // ReportGenerator returns current to past

        dates.forEach(date => {
            const hasAmritvela = report.amritvela.dailyStats[date]?.woke;
            const nitnemStats = report.nitnem.dailyStats[date];
            const hasNitnem = nitnemStats?.percentage === 100;

            dailyData.push({
                date: date,
                amritvela: hasAmritvela,
                nitnem: hasNitnem,
                score: (hasAmritvela ? 50 : 0) + (hasNitnem ? 50 : 0)
            });
        });

        // Update summary bars
        const amritvelaPercent = report.amritvela.wakeRate;
        const nitnemPercent = report.nitnem.completionRate;
        const alarmRate = report.alarms.responseRate;

        if (this.elements.weeklyAmritvelaFill) {
            this.elements.weeklyAmritvelaFill.style.width = `${amritvelaPercent}%`;
        }
        if (this.elements.weeklyAmritvelaValue) {
            this.elements.weeklyAmritvelaValue.textContent = `${report.amritvela.amritvelaWakeups}/${report.amritvela.totalDays}`;
        }

        if (this.elements.weeklyNitnemFill) {
            this.elements.weeklyNitnemFill.style.width = `${nitnemPercent}%`;
        }
        if (this.elements.weeklyNitnemValue) {
            this.elements.weeklyNitnemValue.textContent = `${report.nitnem.totalCompleted}/${report.nitnem.totalPossible}`;
        }

        if (this.elements.weeklyAlarmsFill) {
            this.elements.weeklyAlarmsFill.style.width = `${alarmRate}%`;
        }
        if (this.elements.weeklyAlarmsValue) {
            this.elements.weeklyAlarmsValue.textContent = `${alarmRate}%`;
        }

        // Render chart bars
        if (this.elements.weeklyChartBars) {
            this.elements.weeklyChartBars.innerHTML = dailyData.map(day => {
                const height = day.score;
                const barClass = height === 100 ? '' : height > 0 ? 'partial' : 'empty';

                return `
                    <div class="chart-bar">
                        <div class="bar-fill ${barClass}" style="height: ${Math.max(height, 4)}%"></div>
                    </div>
                `;
            }).join('');
        }

        // Update insight
        this.updateWeeklyInsight(report.amritvela.amritvelaWakeups, report.nitnem.completeDays, alarmRate); // passed values might need adjustment but logic inside uses them generically or I can pass text directly

        // Actually, updateWeeklyInsight logic uses counts. Let's reuse it or better, use generator's insight
        if (this.elements.weeklyInsight) {
            const insightText = this.elements.weeklyInsight.querySelector('.insight-text');
            if (insightText && report.nitnem.insight) {
                // report.nitnem.insight isn't exactly standard but we have generator methods
                // Let's rely on previous logic for now or custom generator insight

                // Using generator's insight logic if adaptable, or stick to existing simple logic
                // Existing logic:
                this.updateWeeklyInsight(report.amritvela.amritvelaWakeups, Math.round(report.nitnem.totalCompleted / report.nitnem.targetBanis * 10) / 10, alarmRate);
            }
        }
    },

    /**
     * Check if Nitnem is complete for a day
     */
    isNitnemComplete(dayData) {
        if (!dayData) return false;

        const selectedBanis = StorageManager.load(CONFIG.STORAGE_KEYS.SELECTED_BANIS, {
            amritvela: [],
            rehras: [],
            sohila: []
        });

        let totalSelected = 0;
        let totalCompleted = 0;

        Object.keys(selectedBanis).forEach(period => {
            totalSelected += selectedBanis[period].length;
            totalCompleted += (dayData[period] || []).length;
        });

        return totalSelected > 0 && totalCompleted >= totalSelected;
    },

    /**
     * Update weekly insight
     */
    updateWeeklyInsight(amritvelaDays, nitnemDays, alarmRate) {
        if (!this.elements.weeklyInsight) return;

        const insightText = this.elements.weeklyInsight.querySelector('.insight-text');
        if (!insightText) return;

        let insight = '';
        const avgScore = ((amritvelaDays + nitnemDays) / 14) * 100;

        if (avgScore === 100) {
            insight = '🌟 Perfect week! You are truly blessed. Keep up the amazing dedication!';
        } else if (avgScore >= 80) {
            insight = '🔥 Excellent week! Your consistency is inspiring. A few more steps to perfection!';
        } else if (avgScore >= 60) {
            insight = '👍 Good progress! Try to wake up a bit earlier and complete all banis.';
        } else if (avgScore >= 40) {
            insight = '💪 You\'re building habits! Focus on Amritvela - it transforms your entire day.';
        } else if (avgScore > 0) {
            insight = '🌱 Every step counts! Start small - even 1 Amritvela can change your week.';
        } else {
            insight = '🙏 Complete your first week to see personalized insights!';
        }

        insightText.textContent = insight;
    },

    /**
     * Render monthly calendar
     */
    renderMonthlyCalendar() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        // Update month label
        if (this.elements.calendarMonth) {
            this.elements.calendarMonth.textContent =
                this.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }

        // Disable next button if current month
        const now = new Date();
        if (this.elements.nextMonthBtn) {
            this.elements.nextMonthBtn.disabled =
                month >= now.getMonth() && year >= now.getFullYear();
        }

        // Get data
        // We need date range for the month
        const firstDate = new Date(year, month, 1);
        const lastDate = new Date(year, month + 1, 0);
        // Manually build dates array for generator
        const dates = [];
        for (let d = 1; d <= lastDate.getDate(); d++) {
            dates.push(`${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`);
        }

        const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        // nitnemLog not needed directly if using generator for nitnem stats
        const malaLog = StorageManager.load(CONFIG.STORAGE_KEYS.MALA_LOG, {});

        // Generate calendar
        const daysInMonth = Utils.getDaysInMonth(year, month);
        const firstDayOfWeek = new Date(year, month, 1).getDay();
        const today = Utils.getTodayString();

        // Use generator's monthly report logic or just access logs via generator helper if needed
        // Or better, keep existing loop but use generator helper for checks if possible, 
        // OR fully replace with generator.generateMonthlyReport() output data if it maps well.
        // Generator's generateMonthlyReport() returns specific stats but maybe not day-by-day mapping in the exact structure needed here.
        // Actually, generator has getNitnemCompletionStats(dates) which gives dailyStats.

        // Safety check for generator availability
        let report = { dailyStats: {}, targetBanis: 5 };
        if (this.generator && typeof this.generator.getNitnemCompletionStats === 'function') {
            try {
                report = this.generator.getNitnemCompletionStats(dates);
            } catch (e) {
                console.warn('⚠️ getNitnemCompletionStats error:', e);
            }
        }
        // We need a map of date -> status for the calendar

        let calendarHTML = '';

        // Empty cells
        for (let i = 0; i < firstDayOfWeek; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }

        let completeDays = 0;
        let totalWakeMinutes = 0;
        let wakeDaysCount = 0;
        let totalMalas = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const isToday = dateString === today;
            const isFuture = new Date(dateString) > new Date();

            const hasAmritvela = !!amritvelaLog[dateString];
            const hasNitnem = report.dailyStats[dateString]?.completed === report.targetBanis; // Check exact completion

            let dayClass = '';
            if (isToday) dayClass = 'today';
            else if (isFuture) dayClass = 'future';
            else if (hasAmritvela && hasNitnem) {
                dayClass = 'complete';
                completeDays++;
            }
            else if (hasAmritvela || hasNitnem) dayClass = 'partial';

            // Track stats
            if (hasAmritvela) {
                const time = amritvelaLog[dateString].time;
                const [h, m] = time.split(':').map(Number);
                totalWakeMinutes += h * 60 + m;
                wakeDaysCount++;
            }

            if (malaLog[dateString]) {
                totalMalas += malaLog[dateString].completedMalas || 0;
            }

            calendarHTML += `
                <div class="calendar-day ${dayClass}" data-date="${dateString}">
                    ${day}
                </div>
            `;
        }

        if (this.elements.calendarDays) {
            this.elements.calendarDays.innerHTML = calendarHTML;
        }

        // Update monthly stats
        if (this.elements.monthlyCompleteDays) {
            this.elements.monthlyCompleteDays.textContent = completeDays;
        }

        if (this.elements.monthlyAvgWakeTime && wakeDaysCount > 0) {
            const avgMinutes = Math.round(totalWakeMinutes / wakeDaysCount);
            const avgHours = Math.floor(avgMinutes / 60);
            const avgMins = avgMinutes % 60;
            this.elements.monthlyAvgWakeTime.textContent =
                `${avgHours.toString().padStart(2, '0')}:${avgMins.toString().padStart(2, '0')}`;
        } else if (this.elements.monthlyAvgWakeTime) {
            this.elements.monthlyAvgWakeTime.textContent = '--:--';
        }

        if (this.elements.monthlyMalas) {
            this.elements.monthlyMalas.textContent = totalMalas;
        }
    },

    /**
     * Export report
     */
    exportReport() {
        const report = this.generateReportData();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `nitnem-report-${Utils.getTodayString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Toast.success('Report Exported', 'Your report has been downloaded');
        HapticManager.success();
    },

    /**
     * Share report
     */
    async shareReport() {
        const report = this.generateReportData();

        const shareText = `🙏 Nitnem Tracker Report
        
📅 Week Summary:
• Amritvela: ${report.weekly.amritvelaDays}/7 days
• Nitnem: ${report.weekly.nitnemDays}/7 days
• Streak: ${report.streak.current} days

🔥 Keep the spiritual journey going!

#NitnemTracker #Sikhi #Amritvela`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Nitnem Tracker Report',
                    text: shareText
                });
                HapticManager.success();
            } catch (error) {
                if (error.name !== 'AbortError') {
                    this.copyToClipboard(shareText);
                }
            }
        } else {
            this.copyToClipboard(shareText);
        }
    },

    /**
     * Copy to clipboard
     */
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            Toast.success('Copied!', 'Report copied to clipboard');
            HapticManager.success();
        }).catch(() => {
            Toast.error('Error', 'Failed to copy report');
        });
    },

    /**
     * Generate report data
     */
    generateReportData() {
        return this.generator.generateWeeklyReport(); // Or make it dynamic based on view
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 23: CELEBRATION MANAGER
   ───────────────────────────────────────────────────────────────────────────── */

const CelebrationManager = {
    elements: {},
    isShowing: false,

    /**
     * Initialize Celebration Manager
     */
    init() {
        this.elements = {
            overlay: document.getElementById('celebrationOverlay'),
            icon: document.getElementById('celebrationIcon'),
            title: document.getElementById('celebrationTitle'),
            message: document.getElementById('celebrationMessage'),
            btn: document.getElementById('celebrationBtn'),
            confettiContainer: document.getElementById('confettiContainer')
        };

        // Setup close handler
        this.elements.btn?.addEventListener('click', () => {
            this.hide();
        });

        this.elements.overlay?.addEventListener('click', (e) => {
            if (e.target === this.elements.overlay) {
                this.hide();
            }
        });
    },

    /**
     * Show celebration
     */
    show(type) {
        if (this.isShowing) return;
        this.isShowing = true;

        const celebrations = this.getCelebrations();
        const celebration = celebrations[type] || celebrations.default;

        // Update content
        if (this.elements.icon) {
            this.elements.icon.textContent = celebration.icon;
        }
        if (this.elements.title) {
            this.elements.title.textContent = celebration.title;
        }
        if (this.elements.message) {
            this.elements.message.textContent = celebration.message;
        }

        // Show overlay
        this.elements.overlay?.classList.add('active');

        // Haptic
        HapticManager.success();
        SoundManager.malaComplete();

        // Create confetti
        this.createConfetti();
    },

    /**
     * Hide celebration
     */
    hide() {
        this.elements.overlay?.classList.remove('active');
        this.isShowing = false;

        // Clear confetti
        if (this.elements.confettiContainer) {
            this.elements.confettiContainer.innerHTML = '';
        }

        HapticManager.light();
    },

    /**
     * Get celebration content
     */
    getCelebrations() {
        return {
            nitnemComplete: {
                icon: '📖',
                title: 'ਧੰਨ ਗੁਰੂ ਨਾਨਕ!',
                message: 'You completed all your Nitnem for today! Your dedication is inspiring.'
            },
            weekStreak: {
                icon: '🔥',
                title: 'One Week Streak!',
                message: '7 days of spiritual dedication. You are building a beautiful habit!'
            },
            monthStreak: {
                icon: '🏆',
                title: 'One Month Streak!',
                message: '30 days of devotion! You are truly walking the path of Sikhi.'
            },
            centuryStreak: {
                icon: '💯',
                title: '100 Day Streak!',
                message: 'A hundred days of spiritual practice. You are an inspiration!'
            },
            yearStreak: {
                icon: '👑',
                title: 'One Year Streak!',
                message: '365 days! Your dedication to Sikhi is extraordinary. Waheguru!'
            },
            malaComplete: {
                icon: '📿',
                title: 'Mala Complete!',
                message: '108 repetitions of divine naam. May Waheguru bless you!'
            },
            achievement: {
                icon: '🎖️',
                title: 'Achievement Unlocked!',
                message: 'You\'ve reached a new milestone in your spiritual journey!'
            },
            default: {
                icon: '🎉',
                title: 'Congratulations!',
                message: 'You are doing great on your spiritual journey!'
            }
        };
    },

    /**
     * Create confetti animation
     */
    createConfetti() {
        if (!this.elements.confettiContainer) return;

        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF9500', '#AF52DE'];
        const confettiCount = 100;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            confetti.style.animationDuration = `${2 + Math.random() * 2}s`;

            // Random shapes
            if (Math.random() > 0.5) {
                confetti.style.borderRadius = '50%';
            } else {
                confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            }

            this.elements.confettiContainer.appendChild(confetti);
        }

        // Add sparkles
        this.createSparkles();

        // Add golden glow
        this.createGoldenGlow();

        // Clean up after animation
        setTimeout(() => {
            if (this.elements.confettiContainer) {
                this.elements.confettiContainer.innerHTML = '';
            }
        }, 5000);
    },

    /**
     * Create magical sparkle effects
     */
    createSparkles() {
        const sparkleCount = 20;

        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = `${20 + Math.random() * 60}%`;
            sparkle.style.top = `${20 + Math.random() * 60}%`;
            sparkle.style.animationDelay = `${Math.random() * 1.5}s`;

            document.body.appendChild(sparkle);

            // Remove sparkle after animation
            setTimeout(() => sparkle.remove(), 2500);
        }
    },

    /**
     * Create golden glow burst effect
     */
    createGoldenGlow() {
        const glow = document.createElement('div');
        glow.className = 'achievement-unlock-glow';
        document.body.appendChild(glow);

        // Remove glow after animation
        setTimeout(() => glow.remove(), 1500);
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 23.5: ADVANCED INSIGHTS ENGINE
   ───────────────────────────────────────────────────────────────────────────── */

const InsightsEngine = {
    /**
     * Initialize Insights Engine
     */
    init() {
        this.updateInsightsDisplay();
    },

    /**
     * Generate comprehensive insights based on user data
     */
    generateInsights() {
        const insights = [];

        // Get all relevant data
        const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});
        const malaLog = StorageManager.load(CONFIG.STORAGE_KEYS.MALA_LOG, {});
        const streakData = StorageManager.load(CONFIG.STORAGE_KEYS.STREAK_DATA, { current: 0, longest: 0 });

        // Calculate consistency score
        const consistencyScore = this.calculateConsistencyScore(amritvelaLog, nitnemLog);

        // Get wake time trends
        const wakeTrend = this.analyzeWakeTrend(amritvelaLog);

        // Get weekly performance
        const weeklyPerf = this.analyzeWeeklyPerformance(amritvelaLog, nitnemLog);

        // Generate personalized insights

        // 1. Streak Insight
        if (streakData.current > 0) {
            if (streakData.current >= 7) {
                insights.push({
                    icon: '🔥',
                    title: 'Amazing Streak!',
                    description: `You're on a ${streakData.current}-day streak! Your commitment to Sikhi is inspiring.`,
                    type: 'success'
                });
            } else {
                insights.push({
                    icon: '📈',
                    title: 'Building Momentum',
                    description: `${streakData.current} days and counting! Keep going to reach 7 days for a special milestone.`,
                    type: 'progress'
                });
            }
        } else {
            insights.push({
                icon: '🌅',
                title: 'New Beginning',
                description: 'Every spiritual journey starts with one step. Mark your Amritvela today to begin your streak!',
                type: 'info'
            });
        }

        // 2. Wake Time Insight
        if (wakeTrend.avgWakeTime) {
            const avgHour = Math.floor(wakeTrend.avgWakeTime / 60);
            const avgMin = wakeTrend.avgWakeTime % 60;

            if (avgHour < 4) {
                insights.push({
                    icon: '⭐',
                    title: 'True Amritvelai!',
                    description: `Your average wake time is ${avgHour}:${avgMin.toString().padStart(2, '0')} AM - the sacred Amritvela hours!`,
                    type: 'success'
                });
            } else if (avgHour < 5) {
                insights.push({
                    icon: '🌙',
                    title: 'Early Riser',
                    description: `Waking at ${avgHour}:${avgMin.toString().padStart(2, '0')} AM. Try waking 30 min earlier for true Amritvela (3-4 AM).`,
                    type: 'info'
                });
            } else if (avgHour < 6) {
                insights.push({
                    icon: '🌄',
                    title: 'Morning Practice',
                    description: `Your ${avgHour}:${avgMin.toString().padStart(2, '0')} AM wake time is good! The goal is 3-5 AM for deeper spiritual experience.`,
                    type: 'info'
                });
            }

            // Trend direction
            if (wakeTrend.trend === 'improving') {
                insights.push({
                    icon: '📉',
                    title: 'Wake Time Improving!',
                    description: `You're waking up ${wakeTrend.improvement} minutes earlier on average. Great progress!`,
                    type: 'success'
                });
            } else if (wakeTrend.trend === 'declining') {
                insights.push({
                    icon: '⚠️',
                    title: 'Wake Time Slipping',
                    description: `You've been waking up ${Math.abs(wakeTrend.improvement)} minutes later recently. Try going to bed earlier.`,
                    type: 'warning'
                });
            }
        }

        // 3. Weekly Consistency
        if (weeklyPerf.completionRate >= 80) {
            insights.push({
                icon: '💎',
                title: 'Excellent Week!',
                description: `${weeklyPerf.completionRate}% completion this week. You're a true Gursikh!`,
                type: 'success'
            });
        } else if (weeklyPerf.completionRate >= 50) {
            insights.push({
                icon: '💪',
                title: 'Good Progress',
                description: `${weeklyPerf.completionRate}% this week. Push for 80%+ next week for even better results!`,
                type: 'progress'
            });
        } else if (weeklyPerf.completionRate > 0) {
            insights.push({
                icon: '🌱',
                title: 'Room to Grow',
                description: `${weeklyPerf.completionRate}% this week. Set small, achievable goals to build consistency.`,
                type: 'info'
            });
        }

        // 4. Best Day Analysis
        if (weeklyPerf.bestDay) {
            insights.push({
                icon: '📅',
                title: 'Peak Performance Day',
                description: `${weeklyPerf.bestDay} is your strongest day. Consider what makes it special!`,
                type: 'info'
            });
        }

        // 5. Mala Progress
        const weekMalas = this.getWeeklyMalas(malaLog);
        if (weekMalas > 0) {
            insights.push({
                icon: '📿',
                title: 'Mala Progress',
                description: `${weekMalas} malas this week. Each repetition brings you closer to the Divine.`,
                type: 'info'
            });
        }

        return {
            insights,
            consistencyScore,
            wakeTrend,
            weeklyPerf
        };
    },

    /**
     * Calculate consistency score (0-100)
     */
    calculateConsistencyScore(amritvelaLog, nitnemLog) {
        const last30Days = [];
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last30Days.push(d.toLocaleDateString('en-CA'));
        }

        let amritvelaDays = 0;
        let nitnemDays = 0;

        last30Days.forEach(date => {
            if (amritvelaLog[date]) amritvelaDays++;
            if (nitnemLog[date]) {
                const dayData = nitnemLog[date];
                const totalCompleted = (dayData.amritvela?.length || 0) +
                    (dayData.rehras?.length || 0) +
                    (dayData.sohila?.length || 0);
                if (totalCompleted > 0) nitnemDays++;
            }
        });

        const amritvelaScore = (amritvelaDays / 30) * 50;
        const nitnemScore = (nitnemDays / 30) * 50;

        return Math.round(amritvelaScore + nitnemScore);
    },

    /**
     * Analyze wake time trends
     */
    analyzeWakeTrend(amritvelaLog) {
        const last14Days = [];
        for (let i = 0; i < 14; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last14Days.push(d.toLocaleDateString('en-CA'));
        }

        const wakeTimes = [];
        last14Days.forEach(date => {
            const entry = amritvelaLog[date];
            if (entry && entry.time) {
                const [h, m] = entry.time.split(':').map(Number);
                wakeTimes.push({ date, minutes: h * 60 + m });
            }
        });

        if (wakeTimes.length < 2) {
            return { avgWakeTime: null, trend: 'insufficient' };
        }

        const avgWakeTime = Math.round(wakeTimes.reduce((s, w) => s + w.minutes, 0) / wakeTimes.length);

        // Compare first half vs second half
        const midpoint = Math.floor(wakeTimes.length / 2);
        const recentAvg = wakeTimes.slice(0, midpoint).reduce((s, w) => s + w.minutes, 0) / midpoint;
        const olderAvg = wakeTimes.slice(midpoint).reduce((s, w) => s + w.minutes, 0) / (wakeTimes.length - midpoint);

        const improvement = Math.round(olderAvg - recentAvg);
        let trend = 'stable';
        if (improvement > 15) trend = 'improving';
        else if (improvement < -15) trend = 'declining';

        return {
            avgWakeTime,
            trend,
            improvement,
            daysTracked: wakeTimes.length,
            wakeTimes
        };
    },

    /**
     * Analyze weekly performance
     */
    analyzeWeeklyPerformance(amritvelaLog, nitnemLog) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];

        let totalPossible = 0;
        let totalCompleted = 0;

        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');
            const dayOfWeek = d.getDay();

            totalPossible += 2; // Amritvela + Nitnem

            if (amritvelaLog[dateStr]) {
                totalCompleted++;
                dayCounts[dayOfWeek]++;
            }

            if (nitnemLog[dateStr]) {
                const dayData = nitnemLog[dateStr];
                const completed = (dayData.amritvela?.length || 0) +
                    (dayData.rehras?.length || 0) +
                    (dayData.sohila?.length || 0);
                if (completed > 0) {
                    totalCompleted++;
                    dayCounts[dayOfWeek]++;
                }
            }
        }

        const completionRate = Math.round((totalCompleted / totalPossible) * 100);

        // Find best day
        const maxCount = Math.max(...dayCounts);
        const bestDayIndex = dayCounts.indexOf(maxCount);
        const bestDay = maxCount > 0 ? dayNames[bestDayIndex] : null;

        return {
            completionRate,
            bestDay,
            dayCounts
        };
    },

    /**
     * Get weekly mala count
     */
    getWeeklyMalas(malaLog) {
        let total = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');
            if (malaLog[dateStr]) {
                total += malaLog[dateStr].completedMalas || 0;
            }
        }
        return total;
    },

    /**
     * Generate wake time chart data
     */
    generateWakeTimeChartData() {
        const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const chartData = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');
            const entry = amritvelaLog[dateStr];

            if (entry && entry.time) {
                const [h, m] = entry.time.split(':').map(Number);
                const minutes = h * 60 + m;

                // Determine bar class based on wake time
                let barClass = 'missed';
                if (minutes < 240) barClass = 'excellent';      // Before 4 AM
                else if (minutes < 300) barClass = 'good';       // 4-5 AM
                else if (minutes < 360) barClass = 'okay';       // 5-6 AM
                else if (minutes < 420) barClass = 'late';       // 6-7 AM

                // Height calculation (earlier = taller, max 100px for 3AM)
                const height = Math.max(10, 100 - ((minutes - 180) / 2.4));

                chartData.push({
                    day: dayNames[d.getDay()],
                    time: entry.time,
                    height,
                    barClass
                });
            } else {
                chartData.push({
                    day: dayNames[d.getDay()],
                    time: null,
                    height: 4,
                    barClass: 'missed'
                });
            }
        }

        return chartData;
    },

    /**
     * Render wake time chart
     */
    renderWakeTimeChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const chartData = this.generateWakeTimeChartData();

        container.innerHTML = chartData.map(bar => `
            <div class="wake-time-bar">
                <div class="wake-bar-fill ${bar.barClass}" style="height: ${bar.height}px"></div>
                ${bar.time ? `<span class="wake-bar-time">${bar.time}</span>` : ''}
                <span class="wake-bar-day">${bar.day}</span>
            </div>
        `).join('');
    },

    /**
     * Update insights display in UI
     */
    updateInsightsDisplay() {
        const insightsContainer = document.getElementById('insightsContainer');
        if (!insightsContainer) return;

        const { insights, consistencyScore } = this.generateInsights();

        // Render insights
        insightsContainer.innerHTML = insights.map(insight => `
            <div class="insight-item insight-${insight.type}">
                <span class="insight-icon">${insight.icon}</span>
                <div class="insight-content">
                    <span class="insight-title">${insight.title}</span>
                    <span class="insight-description">${insight.description}</span>
                </div>
            </div>
        `).join('');

        // Update consistency score if element exists
        const scoreElement = document.getElementById('consistencyScore');
        if (scoreElement) {
            scoreElement.textContent = `${consistencyScore}%`;

            const scoreFill = document.getElementById('consistencyScoreFill');
            if (scoreFill) {
                const circumference = 283; // 2 * PI * 45
                const offset = circumference - (consistencyScore / 100) * circumference;
                scoreFill.style.strokeDashoffset = offset;
            }
        }

        // Render wake time chart
        this.renderWakeTimeChart('wakeTimeChart');
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 23.6: CARRY-FORWARD SYSTEM
   Incomplete banis from previous day carry forward to next day
   ───────────────────────────────────────────────────────────────────────────── */

const CarryForwardSystem = {
    /**
     * Initialize Carry Forward System
     */
    init() {
        this.checkForCarryForward();
        this.setupDailyReset();
    },

    /**
     * Check if there are uncompleted banis from yesterday
     */
    checkForCarryForward() {
        const yesterday = this.getYesterday();
        const today = Utils.getTodayString();

        // Check if we already processed carry-forward today
        const lastProcessed = StorageManager.load('nt_carry_forward_date', '');
        if (lastProcessed === today) return;

        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});
        const selectedBanis = StorageManager.load(CONFIG.STORAGE_KEYS.SELECTED_BANIS, {
            amritvela: [],
            rehras: [],
            sohila: []
        });

        const carryForward = StorageManager.load('nt_carry_forward', {
            date: '',
            banis: []
        });

        // If we have yesterday's data, check for incomplete
        if (nitnemLog[yesterday]) {
            const yesterdayData = nitnemLog[yesterday];
            const incompleteBanis = [];

            ['amritvela', 'rehras', 'sohila'].forEach(period => {
                const periodBanis = selectedBanis[period] || [];
                const completedUids = yesterdayData[period] || [];

                periodBanis.forEach(bani => {
                    if (!completedUids.includes(bani.uid)) {
                        incompleteBanis.push({
                            ...bani,
                            originalPeriod: period,
                            carryDate: yesterday
                        });
                    }
                });
            });

            if (incompleteBanis.length > 0) {
                // Save carry-forward banis
                StorageManager.save('nt_carry_forward', {
                    date: today,
                    banis: incompleteBanis
                });

                // Show notification
                this.showCarryForwardNotification(incompleteBanis);
            }
        }

        // Mark today as processed
        StorageManager.save('nt_carry_forward_date', today);
    },

    /**
     * Get yesterday's date string
     */
    getYesterday() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toLocaleDateString('en-CA');
    },

    /**
     * Show carry-forward notification
     */
    showCarryForwardNotification(incompleteBanis) {
        const count = incompleteBanis.length;
        const baniNames = incompleteBanis.slice(0, 3).map(b => b.nameEnglish).join(', ');
        const extra = count > 3 ? ` +${count - 3} more` : '';

        // Create persistent notification banner
        this.showCarryForwardBanner(incompleteBanis);

        // Show toast
        Toast.warning(
            `📋 ${count} Bani${count > 1 ? 's' : ''} Carried Forward`,
            `${baniNames}${extra} from yesterday`
        );

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Nitnem Carry-Forward', {
                body: `${count} bani${count > 1 ? 's' : ''} incomplete from yesterday: ${baniNames}${extra}`,
                icon: '/frontend/assets/icons/icon-192.png',
                tag: 'carry-forward'
            });
        }
    },

    /**
     * Show carry-forward banner in UI
     */
    showCarryForwardBanner(incompleteBanis) {
        // Remove existing banner
        document.querySelector('.carry-forward-banner')?.remove();

        const count = incompleteBanis.length;
        const bannerHTML = `
            <div class="carry-forward-banner">
                <div class="banner-content">
                    <span class="banner-icon">📋</span>
                    <div class="banner-text">
                        <strong>${count} Bani${count > 1 ? 's' : ''} Carried Forward</strong>
                        <span>Complete yesterday's pending banis along with today's</span>
                    </div>
                </div>
                <button class="banner-view-btn" onclick="CarryForwardSystem.showDetails()">View</button>
                <button class="banner-dismiss-btn" onclick="CarryForwardSystem.dismissBanner()">×</button>
            </div>
        `;

        const nitnemSection = document.getElementById('nitnemSection');
        if (nitnemSection) {
            nitnemSection.insertAdjacentHTML('afterbegin', bannerHTML);
        }
    },

    /**
     * Get carry-forward banis
     */
    getCarryForwardBanis() {
        const today = Utils.getTodayString();
        const carryForward = StorageManager.load('nt_carry_forward', { date: '', banis: [] });

        if (carryForward.date === today) {
            return carryForward.banis;
        }
        return [];
    },

    /**
     * Show carry-forward details modal
     */
    showDetails() {
        const banis = this.getCarryForwardBanis();

        const modalHTML = `
            <div class="modal-overlay active" id="carryForwardModal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>📋 Carried Forward Banis</h3>
                        <button class="modal-close" onclick="document.getElementById('carryForwardModal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <p style="color: var(--text-secondary); margin-bottom: 16px;">
                            These banis were not completed yesterday. Complete them along with today's nitnem:
                        </p>
                        <div class="carry-forward-list">
                            ${banis.map(bani => `
                                <div class="carry-item">
                                    <div class="carry-bani">
                                        <span class="carry-name">${bani.nameEnglish}</span>
                                        <span class="carry-period">${bani.originalPeriod}</span>
                                    </div>
                                    <button class="carry-complete-btn" onclick="CarryForwardSystem.markComplete('${bani.uid}')">
                                        ✓ Done
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <div style="text-align: center; margin-top: 20px;">
                            <button class="primary-btn" onclick="CarryForwardSystem.completeAll()">
                                Complete All Carried Forward
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    /**
     * Mark a carry-forward bani as complete
     */
    markComplete(uid) {
        const carryForward = StorageManager.load('nt_carry_forward', { date: '', banis: [] });
        carryForward.banis = carryForward.banis.filter(b => b.uid !== uid);
        StorageManager.save('nt_carry_forward', carryForward);

        // Update modal
        const item = document.querySelector(`.carry-complete-btn[onclick*="${uid}"]`)?.parentElement;
        if (item) {
            item.classList.add('completed');
            setTimeout(() => item.remove(), 300);
        }

        // Check if all done
        if (carryForward.banis.length === 0) {
            this.dismissBanner();
            document.getElementById('carryForwardModal')?.remove();
            Toast.success('🎉 All Caught Up!', 'All carried-forward banis completed');
        }

        HapticManager.success();
    },

    /**
     * Complete all carry-forward banis
     */
    completeAll() {
        StorageManager.save('nt_carry_forward', { date: '', banis: [] });
        this.dismissBanner();
        document.getElementById('carryForwardModal')?.remove();

        Toast.success('🎉 All Caught Up!', 'All carried-forward banis completed');
        HapticManager.success();
        CelebrationManager.show('nitnemComplete');
    },

    /**
     * Dismiss the banner
     */
    dismissBanner() {
        const banner = document.querySelector('.carry-forward-banner');
        if (banner) {
            banner.classList.add('hiding');
            setTimeout(() => banner.remove(), 300);
        }
    },

    /**
     * Setup daily reset check
     */
    setupDailyReset() {
        // Check every hour for new day
        setInterval(() => {
            const lastProcessed = StorageManager.load('nt_carry_forward_date', '');
            const today = Utils.getTodayString();

            if (lastProcessed !== today) {
                this.checkForCarryForward();
            }
        }, 3600000); // 1 hour
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 23.7: ENHANCED MALA GOAL TRACKER
   Shows progress meter with malas and total naam jap count
   ───────────────────────────────────────────────────────────────────────────── */

const MalaGoalTracker = {
    /**
     * Initialize Mala Goal Display
     */
    init() {
        this.renderGoalDisplay();
    },

    /**
     * Render the goal display meter
     */
    renderGoalDisplay() {
        const goalContainer = document.getElementById('malaGoalContainer');
        if (!goalContainer) return;

        const dailyGoals = StorageManager.load('nt_mala_goals', {});
        const goal = dailyGoals.default || 0;
        const settings = StorageManager.load(CONFIG.STORAGE_KEYS.SETTINGS, { beadsPerMala: 108 });
        const beadsPerMala = settings.beadsPerMala || 108;

        const malaLog = StorageManager.load(CONFIG.STORAGE_KEYS.MALA_LOG, {});
        const today = Utils.getTodayString();
        const todayData = malaLog[today] || { completedMalas: 0, totalCount: 0 };

        const completedMalas = todayData.completedMalas || 0;
        const totalJaap = todayData.totalCount || 0;

        if (goal > 0) {
            const progress = Math.min((completedMalas / goal) * 100, 100);
            const totalGoalJaap = goal * beadsPerMala;

            goalContainer.innerHTML = `
                <div class="goal-meter">
                    <div class="goal-progress">
                        <div class="goal-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="goal-stats">
                        <div class="goal-stat">
                            <span class="goal-value ${completedMalas >= goal ? 'complete' : ''}">${completedMalas}/${goal}</span>
                            <span class="goal-label">Malas</span>
                        </div>
                        <div class="goal-divider"></div>
                        <div class="goal-stat">
                            <span class="goal-value">${totalJaap.toLocaleString()}/${totalGoalJaap.toLocaleString()}</span>
                            <span class="goal-label">Naam Jaap</span>
                        </div>
                    </div>
                </div>
                ${completedMalas >= goal ? '<div class="goal-complete-badge">🎯 Goal Complete!</div>' : ''}
            `;
        } else {
            goalContainer.innerHTML = `
                <button class="set-goal-btn" onclick="MalaManager.setDailyGoal()">
                    🎯 Set Daily Goal
                </button>
            `;
        }
    },

    /**
     * Update goal display (called after each mala count)
     */
    update() {
        this.renderGoalDisplay();
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 23.8: ENHANCED AMRITVELA WEEK VIEW
   Click "This Week" to see all wake times
   ───────────────────────────────────────────────────────────────────────────── */

const AmritvelaWeekView = {
    /**
     * Show week view modal with all attendance times
     */
    show() {
        const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        const weekData = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');
            const entry = amritvelaLog[dateStr];

            weekData.push({
                date: dateStr,
                dayName: dayNames[d.getDay()],
                dayNum: d.getDate(),
                attended: !!entry,
                time: entry?.time || null,
                slot: entry?.slot || null
            });
        }

        const getSlotClass = (slot) => {
            const classes = { excellent: 'green', good: 'blue', okay: 'orange', late: 'red' };
            return classes[slot] || '';
        };

        const modalHTML = `
            <div class="modal-overlay active" id="weekViewModal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>🌅 This Week's Attendance</h3>
                        <button class="modal-close" onclick="document.getElementById('weekViewModal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="week-attendance-grid">
                            ${weekData.map(day => `
                                <div class="week-day-card ${day.attended ? 'attended' : 'missed'}">
                                    <span class="day-name">${day.dayName}</span>
                                    <span class="day-num">${day.dayNum}</span>
                                    ${day.attended
                ? `<span class="day-time ${getSlotClass(day.slot)}">${day.time}</span>`
                : `<span class="day-missed">—</span>`
            }
                                </div>
                            `).join('')}
                        </div>
                        <div class="week-summary">
                            <div class="summary-item">
                                <span class="summary-value">${weekData.filter(d => d.attended).length}/7</span>
                                <span class="summary-label">Days Present</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-value">${this.getAverageWakeTime(weekData)}</span>
                                <span class="summary-label">Avg Wake Time</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-value">${this.getEarliestWake(weekData)}</span>
                                <span class="summary-label">Earliest</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        HapticManager.light();
    },

    /**
     * Get average wake time
     */
    getAverageWakeTime(weekData) {
        const times = weekData.filter(d => d.time).map(d => {
            const [h, m] = d.time.split(':').map(Number);
            return h * 60 + m;
        });

        if (times.length === 0) return '—';

        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const h = Math.floor(avg / 60);
        const m = avg % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    },

    /**
     * Get earliest wake time
     */
    getEarliestWake(weekData) {
        const times = weekData.filter(d => d.time).map(d => {
            const [h, m] = d.time.split(':').map(Number);
            return { time: d.time, minutes: h * 60 + m };
        });

        if (times.length === 0) return '—';

        const earliest = times.reduce((min, t) => t.minutes < min.minutes ? t : min);
        return earliest.time;
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 23.9: ENHANCED ALARM HISTORY VIEW
   Click on previous dates to see alarm details
   ───────────────────────────────────────────────────────────────────────────── */

const AlarmHistoryView = {
    /**
     * Show alarm history for a specific date
     */
    showForDate(dateStr) {
        const alarmLog = StorageManager.load(CONFIG.STORAGE_KEYS.ALARM_LOG, {});
        const dateData = alarmLog[dateStr] || { alarms: [], stats: { responded: 0, snoozed: 0, missed: 0 } };

        const formatDate = (ds) => {
            const d = new Date(ds);
            return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        };

        const modalHTML = `
            <div class="modal-overlay active" id="alarmHistoryModal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>⏰ Alarm History</h3>
                        <span class="modal-date">${formatDate(dateStr)}</span>
                        <button class="modal-close" onclick="document.getElementById('alarmHistoryModal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        ${dateData.alarms && dateData.alarms.length > 0 ? `
                            <div class="alarm-history-list">
                                ${dateData.alarms.map(alarm => `
                                    <div class="alarm-history-item ${alarm.status}">
                                        <div class="alarm-time">${alarm.time}</div>
                                        <div class="alarm-name">${alarm.name || alarm.type || 'Alarm'}</div>
                                        <div class="alarm-status-badge">${alarm.status}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="no-alarms">
                                <span class="no-alarms-icon">⏰</span>
                                <p>No alarm data for this date</p>
                            </div>
                        `}
                        
                        <div class="alarm-stats-summary">
                            <div class="stat-item success">
                                <span class="stat-count">${dateData.stats?.responded || 0}</span>
                                <span class="stat-label">Responded</span>
                            </div>
                            <div class="stat-item warning">
                                <span class="stat-count">${dateData.stats?.snoozed || 0}</span>
                                <span class="stat-label">Snoozed</span>
                            </div>
                            <div class="stat-item danger">
                                <span class="stat-count">${dateData.stats?.missed || 0}</span>
                                <span class="stat-label">Missed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        HapticManager.light();
    },

    /**
     * Make alarm week days clickable
     */
    setupClickableWeekDays() {
        const weekDays = document.querySelectorAll('.alarm-day');
        weekDays.forEach(dayEl => {
            dayEl.style.cursor = 'pointer';
            dayEl.addEventListener('click', () => {
                const dateStr = dayEl.dataset.date;
                if (dateStr) {
                    this.showForDate(dateStr);
                }
            });
        });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 23.10: ENHANCED REPORTS CALCULATIONS
   Fix the 0/35 issue - calculate correctly based on actual banis
   ───────────────────────────────────────────────────────────────────────────── */

const EnhancedReports = {
    /**
     * Get correct weekly Nitnem statistics
     */
    getWeeklyNitnemStats() {
        const selectedBanis = StorageManager.load(CONFIG.STORAGE_KEYS.SELECTED_BANIS, {
            amritvela: [],
            rehras: [],
            sohila: []
        });

        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});

        // Calculate total banis per day
        const totalBanisPerDay =
            (selectedBanis.amritvela?.length || 0) +
            (selectedBanis.rehras?.length || 0) +
            (selectedBanis.sohila?.length || 0);

        const totalPossible = totalBanisPerDay * 7;
        let totalCompleted = 0;
        let completeDays = 0;

        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');

            if (nitnemLog[dateStr]) {
                const dayData = nitnemLog[dateStr];
                const dayCompleted =
                    (dayData.amritvela?.length || 0) +
                    (dayData.rehras?.length || 0) +
                    (dayData.sohila?.length || 0);

                totalCompleted += dayCompleted;

                if (dayCompleted >= totalBanisPerDay && totalBanisPerDay > 0) {
                    completeDays++;
                }
            }
        }

        return {
            totalPossible,
            totalCompleted,
            completeDays,
            totalBanisPerDay,
            percentage: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0
        };
    },

    /**
     * Update reports display with correct calculations
     */
    updateReportsDisplay() {
        const stats = this.getWeeklyNitnemStats();

        // Update Nitnem value and fill
        const nitnemValue = document.getElementById('weeklyNitnemValue');
        const nitnemFill = document.getElementById('weeklyNitnemFill');

        if (nitnemValue) {
            nitnemValue.textContent = `${stats.totalCompleted}/${stats.totalPossible}`;
        }
        if (nitnemFill) {
            nitnemFill.style.width = `${stats.percentage}%`;
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 23.11: AI NOTIFICATION SYSTEM
   Smart reminders and notifications
   ───────────────────────────────────────────────────────────────────────────── */

const AINotificationSystem = {
    /**
     * Initialize AI notifications
     */
    init() {
        this.scheduleSmartReminders();
    },

    /**
     * Schedule smart reminders based on user patterns
     */
    scheduleSmartReminders() {
        // Check every 15 minutes for reminder opportunities
        setInterval(() => {
            this.checkForReminders();
        }, 900000); // 15 minutes

        // Initial check
        this.checkForReminders();
    },

    /**
     * Check if we should send a reminder
     */
    checkForReminders() {
        const now = new Date();
        const hour = now.getHours();
        const today = Utils.getTodayString();

        // Get today's progress
        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});
        const todayData = nitnemLog[today] || { amritvela: [], rehras: [], sohila: [] };
        const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});

        // Morning Amritvela reminder (4-5 AM)
        if (hour >= 4 && hour < 5 && !amritvelaLog[today]) {
            this.sendReminder('amritvela', 'It\'s Amritvela! Rise and connect with Waheguru 🌅');
        }

        // Evening Rehras reminder (5-6 PM)
        if (hour >= 17 && hour < 18 && (todayData.rehras?.length || 0) === 0) {
            this.sendReminder('rehras', 'Time for Rehras Sahib. Complete your evening prayers 🙏');
        }

        // Night Sohila reminder (9-10 PM)
        if (hour >= 21 && hour < 22 && (todayData.sohila?.length || 0) === 0) {
            this.sendReminder('sohila', 'Don\'t forget Sohila before sleep. Sweet dreams await 🌙');
        }

        // Carry-forward reminder (mid-day)
        if (hour >= 12 && hour < 13) {
            const carryForward = StorageManager.load('nt_carry_forward', { date: '', banis: [] });
            if (carryForward.date === today && carryForward.banis.length > 0) {
                this.sendReminder('carry', `${carryForward.banis.length} bani(s) pending from yesterday 📋`);
            }
        }
    },

    /**
     * Send a reminder notification
     */
    sendReminder(type, message) {
        // Check if we already sent this reminder today
        const reminderKey = `nt_reminder_${type}_${Utils.getTodayString()}`;
        if (StorageManager.load(reminderKey, false)) return;

        // Mark as sent
        StorageManager.save(reminderKey, true);

        // Show toast
        Toast.info('🔔 Reminder', message);

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Nitnem Tracker', {
                body: message,
                icon: '/frontend/assets/icons/icon-192.png',
                tag: `reminder-${type}`
            });
        }

        HapticManager.light();
    },

    /**
     * Request notification permission
     */
    requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 24: STATISTICS MODAL
   ───────────────────────────────────────────────────────────────────────────── */

const StatisticsModal = {
    elements: {},

    /**
     * Initialize Statistics Modal
     */
    init() {
        this.elements = {
            statsBtn: document.getElementById('statsBtn'),
            modal: document.getElementById('statsModal'),
            overallScoreFill: document.getElementById('overallScoreFill'),
            overallScoreValue: document.getElementById('overallScoreValue'),
            detailedStats: document.getElementById('detailedStats')
        };

        // Setup event listeners
        this.elements.statsBtn?.addEventListener('click', () => {
            this.open();
        });
    },

    /**
     * Open statistics modal
     */
    open() {
        this.renderStats();
        ModalManager.open('statsModal');
    },

    /**
     * Render statistics
     */
    renderStats() {
        const stats = this.calculateOverallStats();

        // Update overall score
        if (this.elements.overallScoreFill) {
            const circumference = 2 * Math.PI * 45;
            const offset = circumference - (stats.overallScore / 100) * circumference;
            this.elements.overallScoreFill.style.strokeDashoffset = offset;
        }

        if (this.elements.overallScoreValue) {
            Utils.animateNumber(this.elements.overallScoreValue, 0, stats.overallScore, 1000);
        }

        // Render detailed stats
        if (this.elements.detailedStats) {
            this.elements.detailedStats.innerHTML = `
                <div class="stat-section">
                    <h4>Amritvela</h4>
                    <div class="stat-row">
                        <span>Total Days</span>
                        <span>${stats.amritvela.totalDays}</span>
                    </div>
                    <div class="stat-row">
                        <span>This Month</span>
                        <span>${stats.amritvela.thisMonth}</span>
                    </div>
                    <div class="stat-row">
                        <span>Average Time</span>
                        <span>${stats.amritvela.avgTime}</span>
                    </div>
                </div>
                
                <div class="stat-section">
                    <h4>Nitnem</h4>
                    <div class="stat-row">
                        <span>Complete Days</span>
                        <span>${stats.nitnem.completeDays}</span>
                    </div>
                    <div class="stat-row">
                        <span>Total Banis Read</span>
                        <span>${stats.nitnem.totalBanis}</span>
                    </div>
                </div>
                
                <div class="stat-section">
                    <h4>Mala Jaap</h4>
                    <div class="stat-row">
                        <span>Total Malas</span>
                        <span>${stats.mala.totalMalas}</span>
                    </div>
                    <div class="stat-row">
                        <span>Total Counts</span>
                        <span>${stats.mala.totalCounts.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="stat-section">
                    <h4>Streaks</h4>
                    <div class="stat-row">
                        <span>Current Streak</span>
                        <span>${stats.streak.current} days</span>
                    </div>
                    <div class="stat-row">
                        <span>Longest Streak</span>
                        <span>${stats.streak.longest} days</span>
                    </div>
                </div>
                
                <div class="stat-section">
                    <h4>Achievements</h4>
                    <div class="stat-row">
                        <span>Unlocked</span>
                        <span>${stats.achievements.unlocked}/${stats.achievements.total}</span>
                    </div>
                </div>
            `;
        }
    },

    /**
     * Calculate overall stats
     */
    calculateOverallStats() {
        const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});
        const malaLog = StorageManager.load(CONFIG.STORAGE_KEYS.MALA_LOG, {});
        const streakData = StreakManager.getData();
        const achievements = AchievementManager.unlockedAchievements;

        // Amritvela stats
        const amritvelaDates = Object.keys(amritvelaLog);
        const thisMonth = new Date().toLocaleDateString('en-CA').substring(0, 7);
        const amritvelaThisMonth = amritvelaDates.filter(d => d.startsWith(thisMonth)).length;

        let totalWakeMinutes = 0;
        amritvelaDates.forEach(date => {
            const time = amritvelaLog[date].time;
            const [h, m] = time.split(':').map(Number);
            totalWakeMinutes += h * 60 + m;
        });
        const avgMinutes = amritvelaDates.length > 0 ? Math.round(totalWakeMinutes / amritvelaDates.length) : 0;
        const avgTime = avgMinutes > 0
            ? `${Math.floor(avgMinutes / 60).toString().padStart(2, '0')}:${(avgMinutes % 60).toString().padStart(2, '0')}`
            : '--:--';

        // Nitnem stats
        let completeDays = 0;
        let totalBanis = 0;
        Object.values(nitnemLog).forEach(day => {
            const dayTotal = (day.amritvela?.length || 0) + (day.rehras?.length || 0) + (day.sohila?.length || 0);
            totalBanis += dayTotal;
            if (ReportsManager.isNitnemComplete(day)) {
                completeDays++;
            }
        });

        // Mala stats
        let totalMalas = 0;
        let totalCounts = 0;
        Object.values(malaLog).forEach(day => {
            totalMalas += day.completedMalas || 0;
            totalCounts += day.totalCount || 0;
        });

        // Calculate overall score
        const factors = [
            Math.min(streakData.current / 30, 1) * 25, // Streak (25%)
            Math.min(amritvelaDates.length / 30, 1) * 25, // Amritvela (25%)
            Math.min(completeDays / 14, 1) * 25, // Nitnem (25%)
            Math.min(achievements.length / 6, 1) * 25 // Achievements (25%)
        ];
        const overallScore = Math.round(factors.reduce((a, b) => a + b, 0));

        return {
            overallScore,
            amritvela: {
                totalDays: amritvelaDates.length,
                thisMonth: amritvelaThisMonth,
                avgTime
            },
            nitnem: {
                completeDays,
                totalBanis
            },
            mala: {
                totalMalas,
                totalCounts
            },
            streak: streakData,
            achievements: {
                unlocked: achievements.length,
                total: AchievementManager.achievements.length
            }
        };
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 25: APP INITIALIZATION (UPDATED)
   ───────────────────────────────────────────────────────────────────────────── */

// Update the NitnemTrackerApp initialization to include all managers
/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 24.5: DAILY RESET MANAGER (NEW)
   ───────────────────────────────────────────────────────────────────────────── */

const DailyResetManager = {
    checkReset() {
        const lastActive = localStorage.getItem('lastActiveDate');
        const today = Utils.getTodayString();

        if (lastActive !== today) {
            console.log('[DailyReset] New day detected:', today);
            this.performMidnightReset(lastActive, today);
            localStorage.setItem('lastActiveDate', today);
        }
    },

    performMidnightReset(yesterday, today) {
        // 1. Finalize Yesterday's Data
        if (yesterday) {
            this.finalizeDay(yesterday);
        }

        // 2. Reset Today's Temporary State
        // Clear any non-date-keyed temporary flags
        localStorage.removeItem('temp_amritvela_state');
        localStorage.removeItem('temp_mala_count');

        // 3. Initialize Today's Entry if needed
        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});
        if (!nitnemLog[today]) {
            nitnemLog[today] = {
                amritvela: [],
                completed: false,
                progress: 0
            };
            StorageManager.save(CONFIG.STORAGE_KEYS.NITNEM_LOG, nitnemLog);
        }

        Toast.info('New Day', 'Daily stats have been reset for today.');
    },

    finalizeDay(date) {
        // Calculate and freeze stats for the passed date
        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});
        const dayData = nitnemLog[date];

        if (dayData) {
            // Check if full nitnem was done
            const isComplete = ReportsManager.isNitnemComplete(dayData);
            dayData.finalStatus = isComplete ? 'completed' : 'incomplete';
            StorageManager.save(CONFIG.STORAGE_KEYS.NITNEM_LOG, nitnemLog);
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 25: APP INITIALIZATION (UPDATED)
   ───────────────────────────────────────────────────────────────────────────── */

// Update the NitnemTrackerApp initialization to include all managers
const initializeFullApp = async () => {
    console.log(`🙏 Initializing ${CONFIG.APP_NAME} v${CONFIG.APP_VERSION} - Full Version`);

    const safeInit = async (name, fn) => {
        try {
            await fn();
            console.log(`✅ ${name} initialized`);
        } catch (e) {
            console.error(`❌ ${name} failed to initialize:`, e);
            // Optionally show non-blocking toast
        }
    };

    try {
        // Initialize storage first (syncs from IndexedDB)
        await safeInit('StorageManager', () => StorageManager.init());

        // Perform Mid-night Check immediately after storage is ready
        DailyResetManager.checkReset();

        // Initialize core systems (from Part 1)
        await safeInit('HapticManager', () => HapticManager.init());
        await safeInit('SoundManager', () => SoundManager.init());
        await safeInit('Toast', () => Toast.init());
        await safeInit('ModalManager', () => ModalManager.init());
        await safeInit('ThemeEngine', () => { window.themeEngine = new NitnemTrackerThemeEngine(); });


        // Initialize UI components (from Part 1)
        await safeInit('HeaderManager', () => HeaderManager.init());
        await safeInit('TabBarManager', () => TabBarManager.init());

        // Initialize main features (from Part 1)
        await safeInit('AmritvelaManager', () => AmritvelaManager.init());
        await safeInit('NitnemManager', async () => await NitnemManager.init());
        await safeInit('BaniModal', () => BaniModal.init());

        // Initialize Part 2 features
        await safeInit('MalaManager', () => MalaManager.init());
        await safeInit('AlarmManager', () => AlarmManager.init());
        await safeInit('StreakManager', () => StreakManager.init());
        await safeInit('AchievementManager', async () => await AchievementManager.init());
        await safeInit('ReportsManager', () => ReportsManager.init());
        await safeInit('CelebrationManager', () => CelebrationManager.init());
        await safeInit('StatisticsModal', () => StatisticsModal.init());

        // Initialize settings (from Part 1)
        await safeInit('SettingsManager', () => SettingsManager.init());

        // Add SVG gradient definitions for score circle
        try { addSVGDefinitions(); } catch (e) { console.error(e); }

        // Hide loading screen
        const loadingScreen = document.getElementById('appLoading');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 300);
        }

        console.log('✅ Full application initialized successfully');

        // Dispatch ready event
        document.dispatchEvent(new CustomEvent('appReady'));

    } catch (error) {
        console.error('❌ Initialization error:', error);
        Toast.error('Error', 'Failed to initialize app. Please refresh.');
    }
};

/**
 * Add SVG gradient definitions to the document
 */
function addSVGDefinitions() {
    const svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgDefs.setAttribute('width', '0');
    svgDefs.setAttribute('height', '0');
    svgDefs.setAttribute('style', 'position: absolute');
    svgDefs.innerHTML = `
        <defs>
            <linearGradient id="timeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#FF9500"/>
                <stop offset="100%" stop-color="#FFCC00"/>
            </linearGradient>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#34C759"/>
                <stop offset="50%" stop-color="#5AC8FA"/>
                <stop offset="100%" stop-color="#007AFF"/>
            </linearGradient>
        </defs>
    `;
    document.body.appendChild(svgDefs);
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 26: SMART REMINDERS INTEGRATION
   ───────────────────────────────────────────────────────────────────────────── */

const SmartRemindersIntegration = {
    /**
     * Initialize integration with Smart Reminders
     */
    init() {
        // Listen for messages from Smart Reminders
        window.addEventListener('message', (event) => {
            if (event.data.type === 'ALARM_TRIGGERED') {
                this.handleAlarmTriggered(event.data);
            }
        });

        // Check for pending alarm responses
        this.checkPendingResponses();
    },

    /**
     * Handle alarm triggered
     */
    handleAlarmTriggered(data) {
        const { alarmId, action } = data;

        // Record the interaction
        AlarmManager.recordAlarmInteraction(alarmId, action);

        // Show appropriate feedback
        if (action === 'responded') {
            Toast.success('Alarm Responded', 'Great job waking up!');
        } else if (action === 'snoozed') {
            Toast.warning('Alarm Snoozed', 'Remember to wake up soon!');
        }
    },

    /**
     * Check for pending responses from notifications
     */
    checkPendingResponses() {
        const pending = localStorage.getItem('nitnem_pending_alarm_response');
        if (pending) {
            try {
                const data = JSON.parse(pending);
                this.handleAlarmTriggered(data);
                localStorage.removeItem('nitnem_pending_alarm_response');
            } catch (e) {
                console.error('Error processing pending alarm response:', e);
            }
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 27: SERVICE WORKER COMMUNICATION
   ───────────────────────────────────────────────────────────────────────────── */

const ServiceWorkerComm = {
    /**
     * Initialize service worker communication
     */
    init() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleMessage(event.data);
            });
        }
    },

    /**
     * Handle messages from service worker
     */
    handleMessage(data) {
        switch (data.type) {
            case 'ALARM_ACTION':
                AlarmManager.recordAlarmInteraction(data.alarmId, data.action);
                break;
            case 'NOTIFICATION_CLICKED':
                this.handleNotificationClick(data);
                break;
            case 'SYNC_COMPLETE':
                Toast.success('Synced', 'Data synchronized successfully');
                break;
        }
    },

    /**
     * Handle notification click
     */
    handleNotificationClick(data) {
        if (data.action === 'open_bani' && data.baniId) {
            // Navigate to bani reading page
            window.location.href = `../nitnem/${data.baniId}.html`;
        }
    },

    /**
     * Send message to service worker
     */
    sendMessage(message) {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage(message);
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 28: KEYBOARD SHORTCUTS
   ───────────────────────────────────────────────────────────────────────────── */

const KeyboardShortcuts = {
    /**
     * Initialize keyboard shortcuts
     */
    init() {
        document.addEventListener('keydown', (e) => {
            // Skip if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Space for mala count
            if (e.code === 'Space' && !e.ctrlKey && !e.metaKey) {
                const malaSection = document.getElementById('malaSection');
                if (this.isElementInViewport(malaSection)) {
                    e.preventDefault();
                    MalaManager.incrementCount();
                }
            }

            // Cmd/Ctrl + 1-4 for tabs
            if ((e.metaKey || e.ctrlKey) && e.code >= 'Digit1' && e.code <= 'Digit4') {
                e.preventDefault();
                const tabIndex = parseInt(e.code.replace('Digit', '')) - 1;
                const tabs = ['home', 'nitnem', 'mala', 'stats'];
                if (tabs[tabIndex]) {
                    TabBarManager.switchTab(tabs[tabIndex]);
                }
            }

            // Cmd/Ctrl + , for settings
            if ((e.metaKey || e.ctrlKey) && e.code === 'Comma') {
                e.preventDefault();
                ModalManager.open('settingsModal');
            }

            // ? for help
            if (e.code === 'Slash' && e.shiftKey) {
                e.preventDefault();
                this.showHelp();
            }
        });
    },

    /**
     * Check if element is in viewport
     */
    isElementInViewport(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
        );
    },

    /**
     * Show keyboard shortcuts help
     */
    showHelp() {
        Toast.info('Keyboard Shortcuts', 'Space: Mala count | ⌘1-4: Switch tabs | ⌘,: Settings');
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 29: FINAL EVENT LISTENERS & STARTUP
   ───────────────────────────────────────────────────────────────────────────── */

// Override the initialization to use full version
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeFullApp();
        SmartRemindersIntegration.init();
        ServiceWorkerComm.init();
        KeyboardShortcuts.init();

        // Back button navigation
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                HapticManager.light();
                window.location.href = '../index.html';
            });
        }
    });
} else {
    initializeFullApp();
    SmartRemindersIntegration.init();
    ServiceWorkerComm.init();
    KeyboardShortcuts.init();
}

// Handle app visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Refresh all data when app becomes visible
        AmritvelaManager.checkTodayStatus();
        AmritvelaManager.updateTimeDisplay();
        NitnemManager.loadTodayProgress();
        NitnemManager.renderAllLists();
        MalaManager.loadTodayData();
        MalaManager.updateDisplay();
        AlarmManager.syncFromSmartReminders();
        StreakManager.recalculateStreak();
        ReportsManager.renderWeeklyReport();

        // Update insights
        if (typeof InsightsEngine !== 'undefined') {
            InsightsEngine.updateInsightsDisplay();
        }

        // Update enhanced reports
        if (typeof EnhancedReports !== 'undefined') {
            EnhancedReports.updateReportsDisplay();
        }

        // Update mala goal tracker
        if (typeof MalaGoalTracker !== 'undefined') {
            MalaGoalTracker.update();
        }

        // Check carry-forward
        if (typeof CarryForwardSystem !== 'undefined') {
            CarryForwardSystem.checkForCarryForward();
        }
    }
});

// Handle beforeunload - save any pending data
window.addEventListener('beforeunload', () => {
    MalaManager.saveTodayData();
});

// Initialize enhanced systems after a short delay
setTimeout(() => {
    // Initialize Carry Forward System
    if (typeof CarryForwardSystem !== 'undefined') {
        CarryForwardSystem.init();
    }

    // Initialize Mala Goal Tracker
    if (typeof MalaGoalTracker !== 'undefined') {
        MalaGoalTracker.init();
    }

    // Initialize AI Notification System
    if (typeof AINotificationSystem !== 'undefined') {
        AINotificationSystem.init();
        AINotificationSystem.requestPermission();
    }

    // Setup clickable alarm days
    if (typeof AlarmHistoryView !== 'undefined') {
        AlarmHistoryView.setupClickableWeekDays();
    }

    // Update reports with correct calculations
    if (typeof EnhancedReports !== 'undefined') {
        EnhancedReports.updateReportsDisplay();
    }
}, 1000);

// Export all managers for external use
if (typeof window !== 'undefined') {
    window.NitnemTracker = {
        // Core
        CONFIG,
        Utils,
        StorageManager,

        // UI
        HapticManager,
        SoundManager,
        Toast,
        ModalManager,
        ThemeEngine: window.themeEngine,

        // Features
        AmritvelaManager,
        NitnemManager,
        MalaManager,
        AlarmManager,
        StreakManager,
        AchievementManager,
        ReportsManager,
        CelebrationManager,
        StatisticsModal,
        InsightsEngine,

        // Enhanced Systems
        CarryForwardSystem,
        MalaGoalTracker,
        AmritvelaWeekView,
        AlarmHistoryView,
        EnhancedReports,
        AINotificationSystem,

        // Integration
        SmartRemindersIntegration,
        ServiceWorkerComm
    };
}

/* ─────────────────────────────────────────────────────────────────────────────
   END OF NITNEM TRACKER APPLICATION
   ═══════════════════════════════════════════════════════════════════════════════ */