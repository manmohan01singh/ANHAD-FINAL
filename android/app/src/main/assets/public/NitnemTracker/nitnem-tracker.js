/* ═══════════════════════════════════════════════════════════════════════════════
   NITNEM TRACKER - PREMIUM iOS 26+ APPLICATION
   Part 1: Core System, State, Storage, Amritvela, Nitnem, Themes, UI
   ═══════════════════════════════════════════════════════════════════════════════ */

'use strict';

/* -----------------------------------------------------------------------------
   SECTION 1: CONFIGURATION & CONSTANTS
   ----------------------------------------------------------------------------- */

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
        STREAK_DATA: 'anhad_streak_data',
        STREAK_DATA_LEGACY: 'nitnemTracker_streakData',
        ACHIEVEMENTS: 'nitnemTracker_achievements',
        SELECTED_BANIS: 'nitnemTracker_selectedBanis',
        THEME: 'nitnemTracker_theme',
        SELECTED_BANIS_HISTORY: 'nitnemTracker_selectedBanis_history',
        NITNEM_PROGRESS: 'nitnemTracker_progress',
        DAILY_GOALS: 'anhad_daily_goals',
        MALA_COUNTER_V1: 'anhad_mala_counter_v1',
        MY_POTHI_ORDER: 'anhad_my_pothi',
        MY_POTHI_DATA: 'anhad_my_pothi_data',
        MY_POTHI_COMPLETED: 'anhad_my_pothi_completed',
        MY_POTHI_SNAPSHOTS: 'anhad_pothi_snapshots',
        MY_POTHI_ADDITIONS: 'anhad_pothi_bani_additions',
        POTHI_INSIGHTS_TAB: 'pothi_insights_tab',
        SEHAJ_STATE: 'sehajPaathState',
        SEHAJ_PROGRESS: 'sehajPaathProgress',
        SEHAJ_PROGRESS_ALT: 'gurbani_sehajPaath_progress',
        SEHAJ_BOOKMARKS: 'sehajPaathBookmarks',
        SEHAJ_BOOKMARK_FOLDERS: 'sehajPaathBookmarkFolders',
        SEHAJ_HISTORY: 'sehajPaathHistory',
        SEHAJ_NOTES: 'sehajPaathNotes',
        SEHAJ_ACHIEVEMENTS: 'sehajPaathAchievements',
        SEHAJ_SETTINGS: 'sehajPaathSettings',
        SEHAJ_STATS: 'sehajPaathStats',
        COMPLETED_PAATHS: 'completedPaaths',
        NAAM_ABHYAS_HISTORY: 'naam_abhyas_history',
        NAAM_ABHYAS_CONFIG: 'naam_abhyas_config',
        NAAM_ABHYAS_SCHEDULE: 'naam_abhyas_schedule',
        ANHAD_FAVORITES: 'anhad_favorites',
        GURBANI_FAVORITE_SHABADS: 'gurbani_favorite_shabads',
        GURBANI_SHABAD_BOOKMARKS: 'gurbani_shabad_bookmarks',
        USER_NOTES: 'userNotes',
        SEARCH_HISTORY: 'searchHistory',
        BANI_SETTINGS: 'baniSettings',
        BANI_READER_SETTINGS: 'baniReader_settings',
        SHABAD_SETTINGS: 'gurbani_shabad_settings',
        GURBANI_FONT: 'gurbaniFont',
        GURBANI_KHOJ_FONT: 'gurbaniKhoj_font',
        ANHAD_THEME: 'anhad_theme',
        ANHAD_TIME_OF_DAY: 'anhad_forced_time_of_day',
        ANHAD_NOTIFICATIONS: 'anhad_notification_prefs',
        CINE_ALARMS: 'cine_alarms_v4',
        SMART_REMINDERS_SETTINGS: 'sr_settings_v7',
        SMART_REMINDERS_LOG: 'sr_reminders_v7',
        UNIFIED_STATS: 'anhad_unified_stats',
        USER_STATS: 'anhad_user_stats',
        DAILY_ANALYTICS: 'anhad_daily_analytics'
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

/* -----------------------------------------------------------------------------
   SECTION 2: UTILITY FUNCTIONS
   ----------------------------------------------------------------------------- */

function syncNaamAbhyasIntoCanonicalStreak(sessionData) {
    try {
        if (!sessionData || sessionData.status !== 'completed') return;
        const today = new Date().toLocaleDateString('en-CA');
        const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.STREAK_DATA);
        const streak = raw ? JSON.parse(raw) : {};
        if (!streak.naamAbhyas) streak.naamAbhyas = {};
        if (!streak.naamAbhyas.sessionsByDate) streak.naamAbhyas.sessionsByDate = {};
        if (!streak.naamAbhyas.sessionsByDate[today]) streak.naamAbhyas.sessionsByDate[today] = [];

        const sessionId = sessionData.id || `${sessionData.recordedAt || ''}_${sessionData.hour || ''}`;
        const exists = streak.naamAbhyas.sessionsByDate[today].some(s => s.id === sessionId);
        if (!exists) {
            streak.naamAbhyas.sessionsByDate[today].push({
                id: sessionId,
                hour: sessionData.hour,
                duration: sessionData.duration || 0,
                recordedAt: sessionData.recordedAt || new Date().toISOString()
            });
        }
        streak.naamAbhyas.todayCount = streak.naamAbhyas.sessionsByDate[today].length;
        streak.naamAbhyas.lastCompletedDate = today;
        streak.lastUpdated = new Date().toISOString();
        localStorage.setItem(CONFIG.STORAGE_KEYS.STREAK_DATA, JSON.stringify(streak));
        window.dispatchEvent(new CustomEvent('streakUpdated', { detail: streak }));
    } catch (e) {
        console.warn('[NitnemTracker] Naam Abhyas streak bridge failed:', e);
    }
}

window.addEventListener('naamAbhyasSessionComplete', (e) => {
    syncNaamAbhyasIntoCanonicalStreak(e.detail);
});

// ═══ PENDING BANIS ROLLOVER LOGIC ═══
function renderPendingBanis() {
    try {
        const sec = document.getElementById('pendingBanisSection');
        const list = document.getElementById('pendingBanisList');
        if (!sec || !list) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yestStr = yesterday.toLocaleDateString('en-CA');

        // CRITICAL FIX: Use Nitnem Tracker's historical data, not My Pothi
        const selectedBanisHistory = JSON.parse(localStorage.getItem('nitnemTracker_selectedBanis_history') || '{}');
        const yesterdaySelectedBanis = selectedBanisHistory[yestStr];
        
        // If no historical data exists for yesterday, don't show pending section
        if (!yesterdaySelectedBanis) {
            console.log('[Nitnem] No nitnem tracker history for yesterday, hiding pending section');
            sec.style.display = 'none';
            return;
        }

        // Get yesterday's completed banis from nitnem log
        const nitnemLog = JSON.parse(localStorage.getItem('nitnemTracker_nitnemLog') || '{}');
        const yestCompleted = nitnemLog[yestStr] || {};
        
        // Extract all completed UIDs from all periods
        const completedUIDs = new Set();
        ['amritvela', 'rehras', 'sohila'].forEach(period => {
            if (Array.isArray(yestCompleted[period])) {
                yestCompleted[period].forEach(uid => completedUIDs.add(uid));
            }
        });

        const ALL_BANIS_MAP = {
            2: 'ਜਪੁਜੀ ਸਾਹਿਬ (Japji Sahib)', 
            4: 'ਜਾਪੁ ਸਾਹਿਬ (Jaap Sahib)', 
            6: 'ਤ੍ਵ ਪ੍ਰਸਾਦਿ ਸਵੱਯੇ (Savaiye)',
            9: 'ਬੇਨਤੀ ਚੌਪਈ (Chaupai Sahib)', 
            10: 'ਅਨੰਦੁ ਸਾਹਿਬ (Anand Sahib)', 
            21: 'ਰਹਿਰਾਸਿ ਸਾਹਿਬ (Rehras Sahib)',
            23: 'ਸੋਹਿਲਾ ਸਾਹਿਬ (Kirtan Sohila)', 
            31: 'ਸੁਖਮਨੀ ਸਾਹਿਬ (Sukhmani Sahib)', 
            24: 'ਅਰਦਾਸ (Ardas)'
        };

        // Collect all pending banis from all periods that were in yesterday's list but not completed
        const pendingBanis = [];
        ['amritvela', 'rehras', 'sohila'].forEach(period => {
            const periodBanis = yesterdaySelectedBanis[period] || [];
            periodBanis.forEach(bani => {
                // Check if this bani (by UID) was NOT completed
                if (!completedUIDs.has(bani.uid)) {
                    pendingBanis.push({
                        id: bani.id,
                        uid: bani.uid,
                        name: ALL_BANIS_MAP[bani.id] || `Bani ${bani.id}`,
                        period: period
                    });
                }
            });
        });

        if (pendingBanis.length === 0) {
            sec.style.display = 'none';
            return;
        }

        sec.style.display = 'block';
        
        // Group by bani ID to avoid showing duplicates
        const uniquePendingBanis = [];
        const seenIds = new Set();
        pendingBanis.forEach(bani => {
            if (!seenIds.has(bani.id)) {
                seenIds.add(bani.id);
                uniquePendingBanis.push(bani);
            }
        });
        
        // IMPROVED UI: Better styling with smooth animations and modern design
        list.innerHTML = uniquePendingBanis.map(bani => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 16px; background:var(--bg-secondary); border-radius:16px; border:1.5px solid rgba(255,149,0,0.25); transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(255,149,0,0.08);" 
                 onmouseenter="this.style.borderColor='rgba(255,149,0,0.4)'; this.style.boxShadow='0 4px 12px rgba(255,149,0,0.15)'"
                 onmouseleave="this.style.borderColor='rgba(255,149,0,0.25)'; this.style.boxShadow='0 2px 8px rgba(255,149,0,0.08)'">
                <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                    <span style="font-size:15px; font-weight:600; color:var(--text-primary); font-family: 'Noto Sans Gurmukhi', sans-serif;">${bani.name}</span>
                    <span style="font-size:11px; color:var(--text-secondary); font-weight:500;">Yesterday's pending prayer</span>
                </div>
                <button onclick="markPendingBaniComplete('${bani.uid}', '${yestStr}', '${bani.period}')" 
                        style="padding:8px 18px; background:linear-gradient(135deg, #FF9500, #FF8000); color:#fff; font-size:13px; font-weight:700; border:none; border-radius:12px; cursor:pointer; box-shadow: 0 2px 8px rgba(255,149,0,0.3); transition: all 0.2s ease; white-space: nowrap;"
                        onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(255,149,0,0.4)'"
                        onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(255,149,0,0.3)'"
                        ontouchstart="this.style.transform='scale(0.95)'"
                        ontouchend="this.style.transform='scale(1)'">
                    ✓ Mark Done
                </button>
            </div>
        `).join('');
    } catch(e) {
        console.error('[Nitnem] Error rendering pending banis:', e);
    }
}

// CRITICAL FIX: Save nitnem tracker selected banis snapshot for historical tracking
function saveNitnemTrackerSnapshot() {
    try {
        const today = new Date().toLocaleDateString('en-CA');
        const currentSelectedBanis = JSON.parse(localStorage.getItem('nitnemTracker_selectedBanis') || '{"amritvela":[],"rehras":[],"sohila":[]}');
        const history = JSON.parse(localStorage.getItem('nitnemTracker_selectedBanis_history') || '{}');
        
        // Only save if not already saved for today
        if (!history[today]) {
            history[today] = currentSelectedBanis;
            localStorage.setItem('nitnemTracker_selectedBanis_history', JSON.stringify(history));
            console.log('[Nitnem] Saved nitnem tracker snapshot for', today);
        }
        
        // Clean up old history (keep only last 7 days)
        const dates = Object.keys(history);
        if (dates.length > 7) {
            dates.sort().slice(0, dates.length - 7).forEach(oldDate => {
                delete history[oldDate];
            });
            localStorage.setItem('nitnemTracker_selectedBanis_history', JSON.stringify(history));
        }
    } catch(e) {
        console.error('[Nitnem] Error saving nitnem tracker snapshot:', e);
    }
}

// Save snapshot when page loads (once per day)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        saveNitnemTrackerSnapshot();
        renderPendingBanis();
    }, 500);
});

window.markPendingBaniComplete = function(id, dateStr) {
    try {
        const completed = JSON.parse(localStorage.getItem('anhad_my_pothi_completed') || '{}');
        if (!completed[dateStr]) completed[dateStr] = [];
        if (!completed[dateStr].includes(id)) completed[dateStr].push(id);
        localStorage.setItem('anhad_my_pothi_completed', JSON.stringify(completed));
        renderPendingBanis();
        
        // Show success feedback
        if (window.Toast) {
            Toast.success('Bani Completed', 'Yesterday\'s bani marked as complete! 🙏');
        }
    } catch(e) {
        console.error('[Nitnem] Error marking pending bani complete:', e);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderPendingBanis, 500);
});

try {
    if (!localStorage.getItem(CONFIG.STORAGE_KEYS.STREAK_DATA)) {
        const legacyStreak = localStorage.getItem('nitnemTracker_streakData');
        if (legacyStreak) localStorage.setItem(CONFIG.STORAGE_KEYS.STREAK_DATA, legacyStreak);
    }
} catch (e) { }

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
     * Calculate streak from date array (YYYY-MM-DD strings)
     * BUG FIX: old code used new Date('YYYY-MM-DD') subtraction which is
     * timezone-sensitive — ISO date strings parse as UTC midnight, causing
     * off-by-one errors in IST and other UTC+ zones across DST transitions.
     * Fix: compare UTC day-numbers (ms since epoch ÷ 86400000) which is
     * completely immune to local timezone offsets.
     */
    calculateStreak(dates) {
        if (!dates || dates.length === 0) return 0;

        // PERF FIX: Work with UTC day numbers to avoid timezone issues
        const toUtcDay = (dateStr) => {
            // YYYY-MM-DD → parse parts directly to avoid timezone ambiguity
            const parts = String(dateStr).split('-');
            if (parts.length !== 3) return NaN;
            return Date.UTC(+parts[0], +parts[1] - 1, +parts[2]) / 86400000;
        };

        const today = Utils.getTodayString();
        const todayDay = toUtcDay(today);
        const yesterdayDay = todayDay - 1;

        // Sort descending by day number
        const dayNumbers = [...new Set(dates.map(toUtcDay))]
            .filter(d => !isNaN(d))
            .sort((a, b) => b - a);

        if (!dayNumbers.length) return 0;

        // Check if streak is active (today or yesterday)
        const mostRecent = dayNumbers[0];
        // FIX: Only count streak if TODAY is completed, not yesterday
        // If only yesterday is completed, the streak shows as 0 until today is marked
        const isStreakActive = mostRecent === todayDay;
        
        // Special case: If yesterday was completed but not today yet, 
        // the streak is still "alive" but should show the count up to yesterday
        const streakAliveButNotToday = mostRecent === yesterdayDay;

        if (!isStreakActive && !streakAliveButNotToday) {
            return 0;
        }

        // Count consecutive days starting from most recent
        // BUG FIX: compare UTC day integers — immune to timezone/DST issues
        let streak = 1;
        for (let i = 0; i < dayNumbers.length - 1; i++) {
            if (dayNumbers[i] - dayNumbers[i + 1] === 1) {
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
    },

    /**
     * Schedule non-critical work for idle time
     * Uses requestIdleCallback with fallback to setTimeout
     */
    scheduleIdleWork(callback, timeout = 2000) {
        if ('requestIdleCallback' in window) {
            return requestIdleCallback(callback, { timeout });
        } else {
            return setTimeout(callback, 1);
        }
    },

    /**
     * Batch DOM reads for layout performance
     * Prevents layout thrashing by reading all values first
     */
    batchDOMReads(reads) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                const results = reads.map(read => read());
                resolve(results);
            });
        });
    },

    /**
     * Batch DOM writes for layout performance
     * Groups all DOM mutations together
     */
    batchDOMWrites(writes) {
        requestAnimationFrame(() => {
            writes.forEach(write => write());
        });
    }
};

class NitnemTrackerThemeEngine {
    constructor() {
        // ONLY light and dark themes as requested
        this.themes = ['light', 'dark', 'auto'];

        // Sync with global theme first
        const globalTheme = localStorage.getItem('anhad_theme') || 'light';
        this.currentTheme = this.themes.includes(globalTheme) ? globalTheme : 'light';

        // Save synced theme to Nitnem storage (JSON encoded to prevent persistence guard warnings)
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, JSON.stringify(this.currentTheme));

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

        // Auto-refresh if in auto mode
        setInterval(() => {
            if (this.currentTheme === 'auto') {
                this.applyTheme('auto');
            }
        }, 60000);

    }

    _isNight() {
        const forced = localStorage.getItem('anhad_forced_time_of_day');
        if (forced && ['morning', 'day', 'evening', 'night'].includes(forced)) {
            return forced === 'night';
        }
        const hour = new Date().getHours();
        return hour < 5 || hour >= 20;
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
        let effectiveTheme = themeName;
        if (themeName === 'auto') {
            const forced = localStorage.getItem('anhad_forced_time_of_day');
            if (forced && ['morning', 'day', 'evening', 'night'].includes(forced)) {
                effectiveTheme = (forced === 'night') ? 'dark' : 'light';
            } else {
                const hour = new Date().getHours();
                effectiveTheme = (hour >= 5 && hour < 20) ? 'light' : 'dark';
            }
        }
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        document.documentElement.setAttribute('data-theme-mode', themeName);
        document.body.setAttribute('data-theme', effectiveTheme);
        document.body.setAttribute('data-theme-mode', themeName);

        // Also add class for maximum compatibility
        document.documentElement.classList.remove('theme-light', 'theme-dark');
        document.documentElement.classList.add(`theme-${effectiveTheme}`);
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${effectiveTheme}`);

        // Handle dark-mode class
        if (effectiveTheme === 'dark') {
            document.documentElement.classList.add('dark-mode');
            document.body.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.body.classList.remove('dark-mode');
        }

        // Save to both local and global storage (local JSON encoded for guard)
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, JSON.stringify(themeName));
        localStorage.setItem('anhad_theme', themeName);

        // Update UI if it exists
        this.updateActiveThemeButton();

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('nitnemThemeChanged', { detail: { theme: themeName, effectiveTheme } }));

        console.log(`[ThemeEngine] Applied theme: ${themeName} (Effective: ${effectiveTheme})`);
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


/* -----------------------------------------------------------------------------
   SECTION 3: STORAGE MANAGER
   ----------------------------------------------------------------------------- */

const StorageManager = {
    /**
     * Initialize storage and sync with IndexedDB
     */
    async init() {
        try {
            // Wait for GurbaniStorage to be ready (optional dependency)
            if (window.GurbaniStorage) {
                try {
                    await window.GurbaniStorage.init();
                    await this.syncFromIndexedDB();
                } catch (error) {
                    console.warn('GurbaniStorage init failed, continuing without IndexedDB sync:', error);
                }
            } else {
                console.log('GurbaniStorage not available, using localStorage only');
            }
        } catch (error) {
            console.warn('StorageManager init error:', error);
            // Don't throw - allow app to continue with localStorage only
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
            // Don't throw - allow app to continue
        }
    },

    /**
     * Save data to localStorage AND IndexedDB (prevent double-stringifying JSON strings)
     */
    save(key, data) {
        try {
            let serialized;
            if (typeof data === 'string') {
                const trimmed = data.trim();
                if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                    serialized = trimmed;
                } else {
                    serialized = JSON.stringify(data);
                }
            } else {
                serialized = JSON.stringify(data);
            }

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
     * Load data from localStorage (recursively unwraps stringified objects)
     */
    load(key, defaultValue = null) {
        try {
            const serialized = localStorage.getItem(key);
            if (serialized === null || serialized === undefined) return defaultValue;

            let parsed = serialized;
            // Parse recursively if string contains encoded JSON object/array
            while (typeof parsed === 'string') {
                const trimmed = parsed.trim();
                if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
                    try {
                        const next = JSON.parse(trimmed);
                        if (next === parsed) break;
                        parsed = next;
                    } catch (e) {
                        break;
                    }
                } else {
                    break;
                }
            }

            return parsed !== null && parsed !== undefined ? parsed : defaultValue;
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
     * Export user progress data as a compact JSON (no Gurbani text)
     */
    exportData() {
        const data = {};

        // === USER PROGRESS KEYS ONLY ===
        // These are the specific localStorage keys that hold user's personal
        // progress — NOT Gurbani content (which lives in the app anyway).
        const PROGRESS_KEYS = [
            // Nitnem Tracker core
            'nitnemTracker_nitnemLog',
            'nitnemTracker_selectedBanis',
            'nitnemTracker_currentStreak',
            'nitnemTracker_longestStreak',
            'nitnemTracker_lastCompletedDate',
            'nitnemTracker_achievements',
            'nitnemTracker_stats',
            'nitnemTracker_amritvelaLog',
            'nitnemTracker_amritvelaStreak',
            // My Pothi / bani selection (IDs only, not Gurbani text)
            'anhad_my_pothi',
            'anhad_my_pothi_data',
            'anhad_my_pothi_completed',
            'anhad_pothi_order',
            // Mala / Naam Simran counts
            'anhad_mala_count',
            'anhad_mala_history',
            'anhad_mala_daily',
            'mala_count',
            'mala_history',
            'naam_mala_count',
            'naam_mala_daily',
            // Naam Abhyas progress
            'naam_abhyas_sessions',
            'naam_abhyas_stats',
            'naam_abhyas_config',
            'naam_abhyas_history',
            // Streak / unified stats
            'anhad_streak_data',
            'anhad_unified_stats',
            'anhad_daily_snapshot',
            // User preferences (not content)
            'anhad_theme',
            'anhad_user_name',
            'anhad_language_pref',
            'anhad_nitnem_prefs',
        ];

        PROGRESS_KEYS.forEach(k => {
            try {
                const raw = localStorage.getItem(k);
                if (raw !== null) {
                    try { data[k] = JSON.parse(raw); }
                    catch(e) { data[k] = raw; }
                }
            } catch(e) {}
        });

        // Also pick up any nitnemTracker_* and naam_* keys dynamically
        // but EXCLUDE any key that holds large Gurbani text arrays
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k) continue;
            if (data[k] !== undefined) continue; // already included

            const isProgress =
                (k.startsWith('nitnemTracker_') && !k.includes('baniText') && !k.includes('_content')) ||
                (k.startsWith('naam_') && !k.includes('baniText')) ||
                k.startsWith('anhad_mala') ||
                k.startsWith('mala_');

            if (isProgress) {
                try {
                    const raw = localStorage.getItem(k);
                    if (raw !== null) {
                        // Skip if value looks like a large Gurbani array (> 100KB)
                        if (raw.length > 102400) continue;
                        try { data[k] = JSON.parse(raw); }
                        catch(e) { data[k] = raw; }
                    }
                } catch(e) {}
            }
        }

        data.exportDate = Utils.getTodayString();
        data.exportTimestamp = new Date().toISOString();
        data.appVersion = CONFIG.APP_VERSION || '2.0';
        data.appName = 'ANHAD Nitnem Progress Backup';
        data._exportType = 'progress_only'; // marker for import validation
        return JSON.stringify(data, null, 2);
    },

    /**
     * Parse backup summary from JSON string
     */
    parseBackupSummary(jsonString) {
        try {
            let raw = typeof jsonString === 'object' && jsonString !== null ? jsonString : JSON.parse(jsonString);
            if (typeof raw !== 'object' || raw === null) {
                return { isValid: false, categoriesCount: 0, categoriesList: [] };
            }

            // Handle nested wrapped payload (e.g. { data: { ... } } or { backup: { ... } })
            let payload = (raw.data && typeof raw.data === 'object') ? raw.data :
                          (raw.backup && typeof raw.backup === 'object') ? raw.backup : raw;

            const categoryLabels = {
                SETTINGS: 'App Settings',
                nitnemTracker_settings: 'App Settings',
                BANI_SETTINGS: 'Bani Reader Preferences',
                baniSettings: 'Bani Reader Preferences',
                BANI_READER_SETTINGS: 'Bani Reader Preferences',
                baniReader_settings: 'Bani Reader Preferences',
                SHABAD_SETTINGS: 'Shabad Reader Settings',
                gurbani_shabad_settings: 'Shabad Reader Settings',
                GURBANI_FONT: 'Gurbani Font Preferences',
                gurbaniFont: 'Gurbani Font Preferences',
                GURBANI_KHOJ_FONT: 'Khoj Font Preferences',
                gurbaniKhoj_font: 'Khoj Font Preferences',
                ANHAD_THEME: 'Theme Preference',
                anhad_theme: 'Theme Preference',
                THEME: 'Theme Preference',
                nitnemTracker_theme: 'Theme Preference',
                ANHAD_TIME_OF_DAY: 'Time of Day Theme',
                anhad_forced_time_of_day: 'Time of Day Theme',
                ANHAD_NOTIFICATIONS: 'Notification Settings',
                anhad_notification_prefs: 'Notification Settings',

                AMRITVELA_LOG: 'Amritvela Logs & History',
                nitnemTracker_amritvelaLog: 'Amritvela Logs & History',
                
                NITNEM_LOG: 'Nitnem Completion History',
                nitnemTracker_nitnemLog: 'Nitnem Completion History',
                NITNEM_PROGRESS: 'Nitnem Progress Stats',
                nitnemTracker_progress: 'Nitnem Progress Stats',
                
                MALA_LOG: 'Mala Logs & Daily Jaap',
                nitnemTracker_malaLog: 'Mala Logs & Daily Jaap',
                MALA_COUNTER_V1: 'Waheguru Simran Mala Jaap',
                anhad_mala_counter_v1: 'Waheguru Simran Mala Jaap',
                
                ALARM_LOG: 'Alarm Logs',
                nitnemTracker_alarmLog: 'Alarm Logs',
                CINE_ALARMS: 'Smart Alarm Reminders',
                cine_alarms_v4: 'Smart Alarm Reminders',
                SMART_REMINDERS_SETTINGS: 'Smart Reminder Settings',
                sr_settings_v7: 'Smart Reminder Settings',
                SMART_REMINDERS_LOG: 'Smart Reminder Log',
                sr_reminders_v7: 'Smart Reminder Log',
                
                STREAK_DATA: 'Streaks & Milestones',
                anhad_streak_data: 'Streaks & Milestones',
                STREAK_DATA_LEGACY: 'Streak Data',
                nitnemTracker_streakData: 'Streak Data',
                USER_DATA: 'User Profile & Streaks',
                nitnemTracker_userData: 'User Profile & Streaks',
                UNIFIED_STATS: 'Unified Spiritual Stats',
                anhad_unified_stats: 'Unified Spiritual Stats',
                USER_STATS: 'User Lifetime Stats',
                anhad_user_stats: 'User Lifetime Stats',
                DAILY_ANALYTICS: 'Daily Analytics',
                anhad_daily_analytics: 'Daily Analytics',
                
                ACHIEVEMENTS: 'Nitnem Achievements',
                nitnemTracker_achievements: 'Nitnem Achievements',
                SEHAJ_ACHIEVEMENTS: 'Sehaj Paath Achievements',
                sehajPaathAchievements: 'Sehaj Paath Achievements',
                
                SELECTED_BANIS: 'Selected Banis Routine',
                nitnemTracker_selectedBanis: 'Selected Banis Routine',
                SELECTED_BANIS_HISTORY: 'Bani Selection History',
                nitnemTracker_selectedBanis_history: 'Bani Selection History',
                DAILY_GOALS: 'Daily Spiritual Goals',
                anhad_daily_goals: 'Daily Spiritual Goals',
                
                MY_POTHI_ORDER: 'My Pothi Bani Collection',
                anhad_my_pothi: 'My Pothi Bani Collection',
                MY_POTHI_DATA: 'My Pothi Banis Data',
                anhad_my_pothi_data: 'My Pothi Banis Data',
                MY_POTHI_COMPLETED: 'My Pothi Reading Progress History',
                anhad_my_pothi_completed: 'My Pothi Reading Progress History',
                MY_POTHI_SNAPSHOTS: 'My Pothi Snapshots',
                anhad_pothi_snapshots: 'My Pothi Snapshots',
                MY_POTHI_ADDITIONS: 'My Pothi Addition History',
                anhad_pothi_bani_additions: 'My Pothi Addition History',
                POTHI_INSIGHTS_TAB: 'Pothi Insights Preference',
                pothi_insights_tab: 'Pothi Insights Preference',
                
                SEHAJ_STATE: 'Sehaj Paath Current State',
                sehajPaathState: 'Sehaj Paath Current State',
                SEHAJ_PROGRESS: 'Sehaj Paath Progress',
                sehajPaathProgress: 'Sehaj Paath Progress',
                SEHAJ_PROGRESS_ALT: 'Sehaj Paath Reading Log',
                gurbani_sehajPaath_progress: 'Sehaj Paath Reading Log',
                SEHAJ_BOOKMARKS: 'Sehaj Paath Ang Bookmarks',
                sehajPaathBookmarks: 'Sehaj Paath Ang Bookmarks',
                SEHAJ_BOOKMARK_FOLDERS: 'Sehaj Paath Folders',
                sehajPaathBookmarkFolders: 'Sehaj Paath Folders',
                SEHAJ_HISTORY: 'Sehaj Paath History',
                sehajPaathHistory: 'Sehaj Paath History',
                SEHAJ_NOTES: 'Sehaj Paath Reflections & Notes',
                sehajPaathNotes: 'Sehaj Paath Reflections & Notes',
                SEHAJ_SETTINGS: 'Sehaj Paath Settings',
                sehajPaathSettings: 'Sehaj Paath Settings',
                SEHAJ_STATS: 'Sehaj Paath Stats',
                sehajPaathStats: 'Sehaj Paath Stats',
                COMPLETED_PAATHS: 'Completed Paaths Archive',
                completedPaaths: 'Completed Paaths Archive',
                
                NAAM_ABHYAS_HISTORY: 'Naam Abhyas Meditation History',
                naam_abhyas_history: 'Naam Abhyas Meditation History',
                NAAM_ABHYAS_CONFIG: 'Naam Abhyas Config',
                naam_abhyas_config: 'Naam Abhyas Config',
                NAAM_ABHYAS_SCHEDULE: 'Naam Abhyas Schedule',
                naam_abhyas_schedule: 'Naam Abhyas Schedule',
                
                ANHAD_FAVORITES: 'Favorite Banis & Shabads',
                anhad_favorites: 'Favorite Banis & Shabads',
                GURBANI_FAVORITE_SHABADS: 'Favorite Shabads',
                gurbani_favorite_shabads: 'Favorite Shabads',
                GURBANI_SHABAD_BOOKMARKS: 'Shabad Bookmarks',
                gurbani_shabad_bookmarks: 'Shabad Bookmarks',
                USER_NOTES: 'User Notes & Reflections',
                userNotes: 'User Notes & Reflections',
                SEARCH_HISTORY: 'Search History',
                searchHistory: 'Search History'
            };

            const foundCategories = new Set();
            Object.keys(payload).forEach(key => {
                if (categoryLabels[key] && payload[key] !== null && payload[key] !== undefined) {
                    foundCategories.add(categoryLabels[key]);
                }
            });

            const exportDate = raw.exportDate || (raw.exportTimestamp ? raw.exportTimestamp.split('T')[0] : null);

            return {
                isValid: foundCategories.size > 0,
                exportDate: exportDate,
                appVersion: raw.appVersion || '2.0',
                categoriesCount: foundCategories.size,
                categoriesList: Array.from(foundCategories),
                rawPayload: payload
            };
        } catch (e) {
            return { isValid: false, categoriesCount: 0, categoriesList: [] };
        }
    },

    /**
     * Import data from JSON
     */
    importData(jsonString) {
        try {
            const summary = this.parseBackupSummary(jsonString);
            if (!summary.isValid || !summary.rawPayload) {
                console.error('Import error: invalid or unrecognized JSON backup file');
                return false;
            }

            const data = summary.rawPayload;
            let restoredCount = 0;

            // Build bidirectional key mapping table
            const keyMap = {};
            Object.entries(CONFIG.STORAGE_KEYS).forEach(([name, key]) => {
                keyMap[name] = key;
                keyMap[key] = key;
            });

            Object.entries(data).forEach(([keyOrName, value]) => {
                const storageKey = keyMap[keyOrName] || (typeof keyOrName === 'string' && keyOrName.startsWith('anhad_') || keyOrName.startsWith('nitnem') || keyOrName.startsWith('sehaj') || keyOrName.startsWith('gurbani') ? keyOrName : null);
                if (storageKey && value !== null && value !== undefined) {
                    this.save(storageKey, value);
                    restoredCount++;
                }
            });

            if (restoredCount === 0) {
                console.error('Import error: no recognized backup keys restored');
                return false;
            }

            // Refresh in-memory manager state immediately
            try {
                if (typeof NitnemManager !== 'undefined') {
                    NitnemManager.loadSelectedBanis?.();
                    NitnemManager.loadTodayProgress?.();
                    NitnemManager.renderAllLists?.();
                    NitnemManager.updatePeriodStats?.();
                }
                if (typeof AmritvelaManager !== 'undefined') {
                    AmritvelaManager.checkTodayStatus?.();
                    AmritvelaManager.updateTimeDisplay?.();
                }
                if (typeof MalaManager !== 'undefined') {
                    MalaManager.loadTodayData?.();
                    MalaManager.updateDisplay?.();
                }
                if (typeof StreakManager !== 'undefined') {
                    StreakManager.calculateStreak?.();
                    StreakManager.updateUI?.();
                }
            } catch(refreshErr) {
                console.warn('Manager refresh notice:', refreshErr);
            }

            // Sync with IndexedDB if available
            try {
                if (window.GurbaniStorage && window.GurbaniStorage.isReady) {
                    Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
                        const val = localStorage.getItem(key);
                        if (val) window.GurbaniStorage.set('nitnemTracker', key, JSON.parse(val));
                    });
                }
            } catch (idbErr) {}

            // Dispatch global synchronization events
            try {
                window.dispatchEvent(new StorageEvent('storage', {
                    key: CONFIG.STORAGE_KEYS.NITNEM_LOG,
                    newValue: localStorage.getItem(CONFIG.STORAGE_KEYS.NITNEM_LOG),
                    url: window.location.href
                }));
                window.dispatchEvent(new StorageEvent('storage', {
                    key: CONFIG.STORAGE_KEYS.SELECTED_BANIS,
                    newValue: localStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_BANIS),
                    url: window.location.href
                }));
                window.dispatchEvent(new StorageEvent('storage', {
                    key: CONFIG.STORAGE_KEYS.MALA_LOG,
                    newValue: localStorage.getItem(CONFIG.STORAGE_KEYS.MALA_LOG),
                    url: window.location.href
                }));
                window.dispatchEvent(new StorageEvent('storage', {
                    key: CONFIG.STORAGE_KEYS.MY_POTHI_COMPLETED,
                    newValue: localStorage.getItem(CONFIG.STORAGE_KEYS.MY_POTHI_COMPLETED),
                    url: window.location.href
                }));
                window.dispatchEvent(new StorageEvent('storage', {
                    key: CONFIG.STORAGE_KEYS.STREAK_DATA,
                    newValue: localStorage.getItem(CONFIG.STORAGE_KEYS.STREAK_DATA),
                    url: window.location.href
                }));
                window.dispatchEvent(new CustomEvent('nitnemUpdated', { detail: { restored: true } }));
                window.dispatchEvent(new CustomEvent('malaUpdated', { detail: { restored: true } }));
                window.dispatchEvent(new CustomEvent('statsChanged', { detail: { restored: true } }));
                window.dispatchEvent(new CustomEvent('streakUpdated', { detail: { restored: true } }));
                window.dispatchEvent(new CustomEvent('nitnemCompletionUpdated', { detail: { restored: true } }));
            } catch (evErr) {}

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

/* -----------------------------------------------------------------------------
   SECTION 4: HAPTIC FEEDBACK MANAGER
   ----------------------------------------------------------------------------- */

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

/* -----------------------------------------------------------------------------
   SECTION 5: SOUND MANAGER
   ----------------------------------------------------------------------------- */

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

/* -----------------------------------------------------------------------------
   SECTION 6: TOAST NOTIFICATION SYSTEM
   ----------------------------------------------------------------------------- */

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

/* -----------------------------------------------------------------------------
   SECTION 7: MODAL SYSTEM
   ----------------------------------------------------------------------------- */

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

/* -----------------------------------------------------------------------------
   SECTION 8: THEME MANAGER
   ----------------------------------------------------------------------------- */

/* ThemeManager removed and replaced by NitnemTrackerThemeEngine */
;

/* -----------------------------------------------------------------------------
   SECTION 9: HEADER & CLOCK MANAGER
   ----------------------------------------------------------------------------- */

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
            timePeriod: document.getElementById('timePeriod'),
            // Penalty system elements
            penaltyBtn: document.getElementById('penaltyBtn'),
            penaltyBadge: document.getElementById('penaltyBadge'),
            streakAlertBadge: document.getElementById('streakAlertBadge'),
            fireEmoji: document.getElementById('fireEmoji'),
            streakFire: document.getElementById('streakFire')
        };

        // Start clock
        this.startClock();

        // Setup scroll behavior
        this.setupScrollBehavior();

        // Update streak in header
        this.updateStreakDisplay();

        // Listen for global streak updates
        window.addEventListener('streakUpdated', () => {
            console.log('[HeaderManager] Global streak updated, refreshing display...');
            this.updateStreakDisplay();
        });

        // Fix header layout styles
        this.fixHeaderLayout();

        // Setup penalty system
        this.setupPenaltyListeners();
        this.updatePenaltyState();

        // Periodic penalty state check (every minute)
        setInterval(() => {
            this.updatePenaltyState();
        }, 60000);
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

            /* 4. Buttons (Back & Actions) - Vertically centered with Box */
            .back-btn, .header-actions {
                position: absolute;
                top: 50%; /* Center vertically with the header-content */
                transform: translateY(-50%);
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
                padding-top: 145px !important; 
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

            /* ═══════════════════════════════════════════════════════════════
               PENALTY SYSTEM STYLES - Extreme iOS Aesthetics
               ═══════════════════════════════════════════════════════════════ */

            /* -- 1. FIRE ICON - Broken State (Blue) -- */
            .streak-fire {
                position: relative;
                display: flex;
                align-items: center;
                gap: 4px;
                transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            .streak-fire.streak-broken .fire-emoji {
                filter: hue-rotate(180deg) saturate(2.5) brightness(1.3);
                animation: fireBreatheBroken 2s ease-in-out infinite;
            }

            .streak-fire.streak-broken .streak-count {
                color: #5AC8FA !important;
                text-shadow: 0 0 8px rgba(90, 200, 250, 0.5);
            }

            .streak-fire.streak-healthy .fire-emoji {
                filter: none;
                animation: fireBreathHealth 3s ease-in-out infinite;
            }

            @keyframes fireBreatheBroken {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.15); opacity: 1; }
            }

            @keyframes fireBreathHealth {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.08); }
            }

            /* -- 2. STREAK ALERT BADGE (Red Exclamation) -- */
            .streak-alert-badge {
                position: absolute;
                top: -6px;
                right: -10px;
                width: 16px;
                height: 16px;
                background: linear-gradient(135deg, #FF3B30, #FF6B6B);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 8px;
                font-weight: 900;
                border: 2px solid rgba(0, 0, 0, 0.85);
                z-index: 10;
                box-shadow: 0 2px 8px rgba(255, 59, 48, 0.6);
            }

            .streak-alert-badge svg {
                width: 8px;
                height: 8px;
                fill: #fff;
            }

            .streak-alert-badge.pulse-alert {
                animation: pulseAlert 1.5s ease-in-out infinite;
            }

            @keyframes pulseAlert {
                0%, 100% { transform: scale(1); box-shadow: 0 2px 8px rgba(255, 59, 48, 0.6); }
                50% { transform: scale(1.2); box-shadow: 0 2px 16px rgba(255, 59, 48, 0.9); }
            }

            /* -- 3. PENALTY HEADER BUTTON -- */
            .penalty-header-btn {
                position: relative;
                background: linear-gradient(135deg, #FF9500, #FF3B30) !important;
                border-radius: 12px !important;
                color: #fff !important;
                border: none !important;
                box-shadow: 0 4px 16px rgba(255, 149, 0, 0.5);
                overflow: visible !important;
            }

            .penalty-header-btn .header-icon {
                stroke: #fff !important;
                filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
            }

            .penalty-header-btn.penalty-active {
                animation: penaltyPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }

            @keyframes penaltyPulse {
                0%, 100% { 
                    box-shadow: 0 4px 16px rgba(255, 149, 0, 0.5);
                    transform: scale(1);
                }
                50% { 
                    box-shadow: 0 6px 24px rgba(255, 59, 48, 0.7), 0 0 40px rgba(255, 149, 0, 0.3);
                    transform: scale(1.08);
                }
            }

            .penalty-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                width: 18px;
                height: 18px;
                background: #FF3B30;
                color: #fff;
                font-size: 11px;
                font-weight: 800;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #fff;
                box-shadow: 0 2px 6px rgba(255, 59, 48, 0.5);
                animation: badgeBounce 2s ease-in-out infinite;
                z-index: 5;
            }

            [data-theme="dark"] .penalty-badge {
                border-color: #1c1c1e;
            }

            @keyframes badgeBounce {
                0%, 100% { transform: scale(1); }
                25% { transform: scale(1.15); }
                50% { transform: scale(0.95); }
                75% { transform: scale(1.1); }
            }

            /* -- 4. PENALTY MODAL (iOS Bottom Sheet) -- */
            .penalty-modal-container {
                max-height: 85vh !important;
                border-top-left-radius: 28px !important;
                border-top-right-radius: 28px !important;
                overflow: hidden;
                background: rgba(255, 255, 255, 0.95) !important;
                backdrop-filter: blur(40px) saturate(200%);
                -webkit-backdrop-filter: blur(40px) saturate(200%);
                border: 1px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 -10px 60px rgba(0, 0, 0, 0.15), 
                            0 -2px 20px rgba(0, 0, 0, 0.08);
            }

            [data-theme="dark"] .penalty-modal-container {
                background: rgba(28, 28, 30, 0.97) !important;
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 0 -10px 60px rgba(0, 0, 0, 0.6),
                            0 -2px 20px rgba(0, 0, 0, 0.3);
            }

            /* Modal Header */
            .penalty-modal-header {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px 24px 12px;
                position: relative;
                text-align: center;
            }

            .penalty-modal-header .modal-close-btn {
                position: absolute;
                top: 16px;
                right: 16px;
            }

            .penalty-modal-icon-wrap {
                position: relative;
                width: 64px;
                height: 64px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 12px;
            }

            .penalty-modal-icon-glow {
                position: absolute;
                inset: -8px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255, 149, 0, 0.3) 0%, transparent 70%);
                animation: iconGlowPulse 2.5s ease-in-out infinite;
            }

            @keyframes iconGlowPulse {
                0%, 100% { opacity: 0.6; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.15); }
            }

            .penalty-modal-icon {
                font-size: 40px;
                z-index: 2;
                position: relative;
                animation: iconFloat 3s ease-in-out infinite;
            }

            @keyframes iconFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-4px); }
            }

            .penalty-modal-title {
                font-size: 22px;
                font-weight: 800;
                color: #1d1d1f;
                margin: 0 0 4px;
                letter-spacing: -0.3px;
            }

            [data-theme="dark"] .penalty-modal-title {
                color: #fff;
            }

            .penalty-modal-subtitle {
                font-size: 14px;
                color: #86868b;
                margin: 0;
                font-weight: 500;
            }

            [data-theme="dark"] .penalty-modal-subtitle {
                color: rgba(235, 235, 245, 0.6);
            }

            /* Modal Body */
            .penalty-modal-body {
                padding: 0 20px 16px;
                overflow-y: auto;
                max-height: 55vh;
                -webkit-overflow-scrolling: touch;
            }

            /* -- 5. STREAK INFO CARD -- */
            .penalty-streak-info {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: linear-gradient(135deg, rgba(255, 149, 0, 0.12) 0%, rgba(255, 59, 48, 0.08) 100%);
                border-radius: 16px;
                padding: 16px 20px;
                margin-bottom: 20px;
                border: 1px solid rgba(255, 149, 0, 0.15);
            }

            [data-theme="dark"] .penalty-streak-info {
                background: linear-gradient(135deg, rgba(255, 149, 0, 0.15) 0%, rgba(255, 59, 48, 0.1) 100%);
                border: 1px solid rgba(255, 149, 0, 0.2);
            }

            .penalty-streak-number {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .penalty-streak-fire {
                font-size: 28px;
                filter: hue-rotate(180deg) saturate(2) brightness(1.2);
                animation: fireBreatheBroken 2s ease-in-out infinite;
            }

            .penalty-streak-count {
                font-size: 32px;
                font-weight: 800;
                color: #FF9500;
                letter-spacing: -1px;
            }

            .penalty-streak-label {
                font-size: 12px;
                color: #86868b;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .penalty-timer {
                display: flex;
                align-items: center;
                gap: 6px;
                background: rgba(255, 59, 48, 0.12);
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                color: #FF3B30;
            }

            .penalty-timer svg {
                stroke: #FF3B30;
            }

            /* -- 6. TASK CARDS -- */
            .penalty-tasks-section {
                margin-bottom: 16px;
            }

            .penalty-tasks-title {
                font-size: 15px;
                font-weight: 700;
                color: #1d1d1f;
                margin: 0 0 12px 4px;
                letter-spacing: -0.2px;
            }

            [data-theme="dark"] .penalty-tasks-title {
                color: #fff;
            }

            .penalty-task-card {
                display: flex;
                align-items: center;
                gap: 14px;
                background: rgba(0, 0, 0, 0.03);
                border-radius: 16px;
                padding: 16px;
                margin-bottom: 10px;
                border: 1px solid rgba(0, 0, 0, 0.06);
                transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
                overflow: hidden;
            }

            [data-theme="dark"] .penalty-task-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.08);
            }

            .penalty-task-card::before {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(135deg, rgba(52, 199, 89, 0.15) 0%, rgba(52, 199, 89, 0.05) 100%);
                opacity: 0;
                transition: opacity 0.5s ease;
                border-radius: 16px;
            }

            .penalty-task-card.completed::before {
                opacity: 1;
            }

            .penalty-task-card.completed {
                border-color: rgba(52, 199, 89, 0.3);
                transform: scale(0.98);
            }

            .penalty-task-icon {
                width: 44px;
                height: 44px;
                background: linear-gradient(135deg, #FF9500, #FF6B00);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 22px;
                flex-shrink: 0;
                box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
                transition: all 0.5s ease;
            }

            .penalty-task-card.completed .penalty-task-icon {
                background: linear-gradient(135deg, #34C759, #30B350);
                box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
            }

            .penalty-task-info {
                flex: 1;
                min-width: 0;
            }

            .penalty-task-name {
                font-family: 'Noto Sans Gurmukhi', sans-serif;
                font-size: 16px;
                font-weight: 700;
                color: #1d1d1f;
                margin: 0 0 2px;
                line-height: 1.3;
            }

            [data-theme="dark"] .penalty-task-name {
                color: #fff;
            }

            .penalty-task-english {
                font-size: 13px;
                color: #86868b;
                margin: 0 0 2px;
                font-weight: 500;
            }

            .penalty-task-desc {
                font-size: 11px;
                color: #aeaeb2;
                margin: 0;
                font-weight: 400;
            }

            .penalty-task-card.completed .penalty-task-name,
            .penalty-task-card.completed .penalty-task-english {
                color: #34C759 !important;
            }

            /* -- 7. CHECKMARK BUTTON -- */
            .penalty-task-check {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 2.5px solid rgba(0, 0, 0, 0.15);
                background: transparent;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                flex-shrink: 0;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                padding: 0;
            }

            [data-theme="dark"] .penalty-task-check {
                border-color: rgba(255, 255, 255, 0.15);
            }

            .penalty-task-check svg {
                width: 18px;
                height: 18px;
                opacity: 0;
                transform: scale(0.5);
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                stroke: #fff;
            }

            .penalty-task-check.checked {
                background: linear-gradient(135deg, #34C759, #30B350);
                border-color: #34C759;
                box-shadow: 0 4px 16px rgba(52, 199, 89, 0.4);
                animation: checkBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            .penalty-task-check.checked svg {
                opacity: 1;
                transform: scale(1);
            }

            @keyframes checkBounce {
                0% { transform: scale(0.8); }
                40% { transform: scale(1.25); }
                60% { transform: scale(0.95); }
                80% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            /* -- 8. MOTIVATION SECTION -- */
            .penalty-motivation {
                text-align: center;
                padding: 16px;
                background: linear-gradient(135deg, rgba(88, 86, 214, 0.08) 0%, rgba(175, 82, 222, 0.06) 100%);
                border-radius: 16px;
                border: 1px solid rgba(88, 86, 214, 0.1);
            }

            [data-theme="dark"] .penalty-motivation {
                background: linear-gradient(135deg, rgba(88, 86, 214, 0.15) 0%, rgba(175, 82, 222, 0.1) 100%);
                border: 1px solid rgba(88, 86, 214, 0.15);
            }

            .penalty-motivation-icon {
                font-size: 28px;
                display: block;
                margin-bottom: 8px;
            }

            .penalty-motivation-text {
                font-family: 'Noto Sans Gurmukhi', sans-serif;
                font-size: 14px;
                font-weight: 600;
                color: #5856D6;
                margin: 0 0 4px;
                line-height: 1.5;
            }

            .penalty-motivation-english {
                font-size: 12px;
                color: #86868b;
                margin: 0;
                font-weight: 500;
                font-style: italic;
            }

            /* -- 9. COMPLETE ALL BUTTON -- */
            .penalty-modal-footer {
                padding: 12px 20px 24px !important;
                background: transparent !important;
            }

            .penalty-complete-all-btn {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                padding: 16px 24px;
                background: linear-gradient(135deg, #34C759, #30B350);
                color: #fff;
                border: none;
                border-radius: 16px;
                font-size: 16px;
                font-weight: 700;
                cursor: pointer;
                position: relative;
                overflow: hidden;
                box-shadow: 0 6px 20px rgba(52, 199, 89, 0.4);
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                letter-spacing: -0.2px;
            }

            .penalty-complete-all-btn:active {
                transform: scale(0.96);
                box-shadow: 0 3px 12px rgba(52, 199, 89, 0.3);
            }

            .penalty-complete-all-btn::after {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%);
                pointer-events: none;
            }

            .penalty-complete-all-btn svg {
                stroke: #fff;
                filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
            }

            /* -- 10. STREAK SAVER BANNER (Enhanced) -- */
            .streak-saver-banner {
                background: linear-gradient(135deg, rgba(255, 149, 0, 0.1) 0%, rgba(255, 59, 48, 0.08) 100%) !important;
                border: 1px solid rgba(255, 149, 0, 0.2) !important;
                border-radius: 16px !important;
                padding: 14px 16px !important;
                margin: 8px 0 16px !important;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .streak-saver-banner:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(255, 149, 0, 0.2);
            }

            .banner-content {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
            }

            .banner-icon {
                font-size: 20px;
                animation: iconFloat 3s ease-in-out infinite;
            }

            .banner-text {
                flex: 1;
            }

            .banner-text strong {
                display: block;
                font-size: 14px;
                color: #FF9500;
                margin-bottom: 2px;
            }

            .banner-text span {
                font-size: 12px;
                color: #86868b;
            }

            .banner-progress {
                height: 4px;
                background: rgba(0,0,0,0.06);
                border-radius: 2px;
                overflow: hidden;
            }

            .banner-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #FF9500, #FF3B30);
                border-radius: 2px;
                transform: width 0.5s ease;
            }

            /* ═══════════════════════════════════════════════════════════════
               PREMIUM UX SYSTEM STYLES (10 Features)
               ═══════════════════════════════════════════════════════════════ */

            /* -- FEATURE 2: Ambient Aura Background -- */
            body::before {
                content: '';
                position: fixed;
                inset: 0;
                z-index: -2;
                background: radial-gradient(circle at 50% 0%, var(--aura-color, rgba(255, 149, 0, 0.15)) 0%, transparent 60%);
                transition: background 3s ease;
                pointer-events: none;
            }

            /* -- FEATURE 3: Mala Ripple Effect -- */
            .mala-ripple {
                position: absolute;
                border-radius: 50%;
                transform: scale(0);
                animation: malaRippleAnim 0.6s linear;
                background-color: rgba(255, 255, 255, 0.4);
                pointer-events: none;
            }
            .mala-tap-recoil {
                animation: malaRecoil 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            @keyframes malaRippleAnim {
                to { transform: scale(4); opacity: 0; }
            }
            @keyframes malaRecoil {
                0% { transform: scale(1); }
                50% { transform: scale(0.95); }
                100% { transform: scale(1); }
            .penalty-task-check.checked {
                background: linear-gradient(135deg, #34C759, #30B350);
                border-color: #34C759;
                box-shadow: 0 4px 16px rgba(52, 199, 89, 0.4);
                animation: checkBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            .penalty-task-check.checked svg {
                opacity: 1;
                transform: scale(1);
            }

            @keyframes checkBounce {
                0% { transform: scale(0.8); }
                40% { transform: scale(1.25); }
                60% { transform: scale(0.95); }
                80% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            /* -- 8. MOTIVATION SECTION -- */
            .penalty-motivation {
                text-align: center;
                padding: 16px;
                background: linear-gradient(135deg, rgba(88, 86, 214, 0.08) 0%, rgba(175, 82, 222, 0.06) 100%);
                border-radius: 16px;
                border: 1px solid rgba(88, 86, 214, 0.1);
            }

            [data-theme="dark"] .penalty-motivation {
                background: linear-gradient(135deg, rgba(88, 86, 214, 0.15) 0%, rgba(175, 82, 222, 0.1) 100%);
                border: 1px solid rgba(88, 86, 214, 0.15);
            }

            .penalty-motivation-icon {
                font-size: 28px;
                display: block;
                margin-bottom: 8px;
            }

            .penalty-motivation-text {
                font-family: 'Noto Sans Gurmukhi', sans-serif;
                font-size: 14px;
                font-weight: 600;
                color: #5856D6;
                margin: 0 0 4px;
                line-height: 1.5;
            }

            .penalty-motivation-english {
                font-size: 12px;
                color: #86868b;
                margin: 0;
                font-weight: 500;
                font-style: italic;
            }

            /* -- 9. COMPLETE ALL BUTTON -- */
            .penalty-modal-footer {
                padding: 12px 20px 24px !important;
                background: transparent !important;
            }

            .penalty-complete-all-btn {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                padding: 16px 24px;
                background: linear-gradient(135deg, #34C759, #30B350);
                color: #fff;
                border: none;
                border-radius: 16px;
                font-size: 16px;
                font-weight: 700;
                cursor: pointer;
                position: relative;
                overflow: hidden;
                box-shadow: 0 6px 20px rgba(52, 199, 89, 0.4);
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                letter-spacing: -0.2px;
            }

            .penalty-complete-all-btn:active {
                transform: scale(0.96);
                box-shadow: 0 3px 12px rgba(52, 199, 89, 0.3);
            }

            .penalty-complete-all-btn::after {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%);
                pointer-events: none;
            }

            .penalty-complete-all-btn svg {
                stroke: #fff;
                filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
            }

            /* -- 10. STREAK SAVER BANNER (Enhanced) -- */
            .streak-saver-banner {
                background: linear-gradient(135deg, rgba(255, 149, 0, 0.1) 0%, rgba(255, 59, 48, 0.08) 100%) !important;
                border: 1px solid rgba(255, 149, 0, 0.2) !important;
                border-radius: 16px !important;
                padding: 14px 16px !important;
                margin: 8px 0 16px !important;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .streak-saver-banner:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(255, 149, 0, 0.2);
            }

            .banner-content {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
            }

            .banner-icon {
                font-size: 20px;
                animation: iconFloat 3s ease-in-out infinite;
            }

            .banner-text {
                flex: 1;
            }

            .banner-text strong {
                display: block;
                font-size: 14px;
                color: #FF9500;
                margin-bottom: 2px;
            }

            .banner-text span {
                font-size: 12px;
                color: #86868b;
            }

            .banner-progress {
                height: 4px;
                background: rgba(0,0,0,0.06);
                border-radius: 2px;
                overflow: hidden;
            }

            .banner-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #FF9500, #FF3B30);
                border-radius: 2px;
                transform: width 0.5s ease;
            }

            /* ═══════════════════════════════════════════════════════════════
               PREMIUM UX SYSTEM STYLES (10 Features)
               ═══════════════════════════════════════════════════════════════ */

            /* -- FEATURE 2: Ambient Aura Background -- */
            body::before {
                content: '';
                position: fixed;
                inset: 0;
                z-index: -2;
                background: radial-gradient(circle at 50% 0%, var(--aura-color, rgba(255, 149, 0, 0.15)) 0%, transparent 60%);
                transition: background 3s ease;
                pointer-events: none;
            }

            /* -- FEATURE 3: Mala Ripple Effect -- */
            .mala-ripple {
                position: absolute;
                border-radius: 50%;
                transform: scale(0);
                animation: malaRippleAnim 0.6s linear;
                background-color: rgba(255, 255, 255, 0.4);
                pointer-events: none;
            }
            .mala-tap-recoil {
                animation: malaRecoil 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            @keyframes malaRippleAnim {
                to { transform: scale(4); opacity: 0; }
            }
            @keyframes malaRecoil {
                0% { transform: scale(1); }
                50% { transform: scale(0.95); }
                100% { transform: scale(1); }
            }

            /* -- FEATURE 4: Active Bani Breathing Focus -- */
            .active-bani-focus {
                animation: breatheFocus 4s ease-in-out infinite;
                border: 1px solid rgba(255, 149, 0, 0.3);
            }
            @keyframes breatheFocus {
                0%, 100% { box-shadow: 0 0 0px rgba(255, 149, 0, 0); }
                50% { box-shadow: 0 4px 20px rgba(255, 149, 0, 0.15); }
            }

            /* -- FEATURE 5: SVG Smooth Draw -- */
            .progress-ring-circle, .time-ring-circle {
                transition: stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1);
            }

            /* -- FEATURE 6: Milestone Sparkles -- */
                position: absolute;
                inset: -10px;
                background-image: 
                    radial-gradient(circle, #FFA200 10%, transparent 10%),
                    radial-gradient(circle, #FFA200 10%, transparent 10%);
                background-size: 4px 4px;
                background-position: 0 0, 10px 10px;
                background-repeat: no-repeat;
                animation: sparkEmitter 3s infinite linear;
                opacity: 0.6;
                pointer-events: none;
            }
            @keyframes sparkEmitter {
                0% { transform: rotate(0deg) scale(0.8); opacity: 0; }
                50% { opacity: 0.6; }
                100% { transform: rotate(180deg) scale(1.2); opacity: 0; }
            }

            /* -- FEATURE 7: Native Tab Slide -- */
            .app-section {
                animation: slideTabIn 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
            }
            @keyframes slideTabIn {
                from { opacity: 0; transform: translateX(20px); }
                to { opacity: 1; transform: translateX(0); }
            }

            /* -- FEATURE 9: Skeleton Shimmer -- */
            .skeleton-shimmer {
                background: linear-gradient(90deg, rgba(200,200,200,0.1) 25%, rgba(200,200,200,0.2) 50%, rgba(200,200,200,0.1) 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 8px;
                color: transparent !important;
            }
            * > .skeleton-shimmer * {
                visibility: hidden;
            }
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }

            /* -- FEATURE 10: Motivational Marquee -- */
            .motivation-marquee-wrapper {
                overflow: hidden;
                white-space: nowrap;
                background: linear-gradient(90deg, transparent, rgba(100,100,100,0.05) 20%, rgba(100,100,100,0.05) 80%, transparent);
                padding: 4px 0;
                margin-top: -8px;
                margin-bottom: 8px;
                font-size: 11px;
                color: #8E8E93;
                position: relative;
                display: flex;
            }
            [data-theme="dark"] .motivation-marquee-wrapper {
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03) 20%, rgba(255,255,255,0.03) 80%, transparent);
            }
            .motivation-marquee {
                display: inline-flex;
                animation: marqueeScroll 30s linear infinite;
            }
            .marquee-text {
                padding-right: 50px;
                font-style: italic;
                letter-spacing: 0.3px;
            }
            @keyframes marqueeScroll {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
            }
            /* Streak Saved Mode (Shield Icon) */
            .streak-fire.streak-saved .fire-emoji {
                filter: none;
                animation: none;
            }
            .streak-fire.streak-saved {
                background: rgba(52, 199, 89, 0.15);
                padding: 2px 10px;
                border-radius: 12px;
                border: 1px solid rgba(52, 199, 89, 0.3);
            }
            .streak-fire.streak-saved::after {
                content: '🛡️';
                font-size: 12px;
                margin-left: 4px;
            }
            .streak-saved-tag {
                font-size: 10px;
                font-weight: 700;
                color: #34C759;
                text-transform: uppercase;
                margin-left: 6px;
                letter-spacing: 0.5px;
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

            // Sync UI elements
            if (this.elements.currentTime) this.elements.currentTime.textContent = `${formatted.hours}:${formatted.minutes} ${formatted.period}`;
            if (this.elements.currentHour) this.elements.currentHour.textContent = formatted.hours.toString().padStart(2, '0');
            if (this.elements.currentMinute) this.elements.currentMinute.textContent = formatted.minutes;
            if (this.elements.timePeriod) this.elements.timePeriod.textContent = formatted.period;
            this.updateSubtitle(hours);
        };

        this.clockInterval = setInterval(() => {
            if (!document.hidden) updateClock();
        }, 1000);
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
        if (typeof StreakManager !== 'undefined' && typeof StreakManager.recalculateStreak === 'function') {
            StreakManager.recalculateStreak();
        }

        let currentStreak = 0;

        if (typeof StreakManager !== 'undefined' && StreakManager.state) {
            currentStreak = StreakManager.state.currentStreak || 0;
        } else if (typeof UnifiedStats !== 'undefined' && typeof UnifiedStats.getStreaks === 'function') {
            const streaks = UnifiedStats.getStreaks();
            currentStreak = streaks.nitnem || 0;
        } else if (typeof AnhadStats !== 'undefined' && typeof AnhadStats.getStreak === 'function') {
            const streakData = AnhadStats.getStreak();
            currentStreak = streakData.currentStreak || 0;
        } else {
            // Last resort: raw storage
            const streakData = StorageManager.load(CONFIG.STORAGE_KEYS.STREAK_DATA, { currentStreak: 0 });
            currentStreak = streakData.currentStreak || streakData.current || 0;
        }

        const headerStreakEl = document.getElementById('headerStreakCount') || (this.elements && this.elements.headerStreakCount);
        if (headerStreakEl) {
            headerStreakEl.textContent = currentStreak;
        }

        const amritvelaEl = document.getElementById('amritvelaStreak');
        if (amritvelaEl) {
            amritvelaEl.textContent = currentStreak;
        }

        // Update flame animation if it exists in StreakManager
        if (typeof StreakManager !== 'undefined' && typeof StreakManager.updateFlameAnimation === 'function') {
            StreakManager.updateFlameAnimation();
        }

        // Also update penalty state whenever streak display updates
        this.updatePenaltyState();
    },

    /**
     * Setup event listeners for penalty interactions
     */
    setupPenaltyListeners() {
        if (this.elements.penaltyBtn) {
            this.elements.penaltyBtn.addEventListener('click', () => {
                const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
                const today = Utils.getTodayString();
                const todayMarked = !!amritvelaLog[today];

                let activePunishment = null;
                if (typeof StreakSaverManager !== 'undefined' && typeof StreakSaverManager.getActivePunishment === 'function') {
                    activePunishment = StreakSaverManager.getActivePunishment();
                }

                if (activePunishment && !activePunishment.completed) {
                    this.showPenaltyModal();
                } else if (!todayMarked) {
                    this.showStreakRiskModal();
                } else {
                    Toast.info('All Good', 'Your streak is currently safe.');
                }
            });
        }

        // Add listener to streak status pill to open risk/penalty modal
        if (this.elements.statusPill) {
            this.elements.statusPill.addEventListener('click', () => {
                if (this.elements.penaltyBtn && this.elements.penaltyBtn.classList.contains('penalty-active')) {
                    this.elements.penaltyBtn.click();
                }
            });
        }

        // Add listener to 'Mark All Complete' button in modal
        const markAllBtn = document.getElementById('penaltyCompleteAllBtn');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => {
                this.completePenaltyTask();
            });
        }
    },

    /**
     * Update the visual penalty state (fire color, alerts, penalty button)
     */
    updatePenaltyState() {
        const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        const today = Utils.getTodayString();
        const todayMarked = !!amritvelaLog[today];

        // SYNC: Use global streak data
        let currentStreak = 0;
        if (typeof AnhadStats !== 'undefined' && typeof AnhadStats.getStreak === 'function') {
            currentStreak = AnhadStats.getStreak().currentStreak || 0;
        } else {
            const streakData = StorageManager.load(CONFIG.STORAGE_KEYS.STREAK_DATA, { currentStreak: 0 });
            currentStreak = streakData.currentStreak || streakData.current || 0;
        }

        // Check active punishment
        let activePunishment = null;
        if (typeof StreakSaverManager !== 'undefined' && typeof StreakSaverManager.getActivePunishment === 'function') {
            activePunishment = StreakSaverManager.getActivePunishment();
        }

        const hasPenalty = activePunishment && !activePunishment.completed;
        const streakAtRisk = !todayMarked && currentStreak > 0;

        // Premium 10 Feature #6: Milestone Sparkles
        if (this.elements.streakFire) {
            const hasSparkles = this.elements.streakFire.querySelector('.milestone-sparkles');
            if (currentStreak >= 30 && todayMarked && !hasSparkles) {
                const sparks = document.createElement('div');
                sparks.className = 'milestone-sparkles';
                this.elements.streakFire.appendChild(sparks);
            } else if ((currentStreak < 30 || !todayMarked) && hasSparkles) {
                hasSparkles.remove();
            }
        }

        // === 1. Fire Icon Color ===
        if (this.elements.streakFire) {
            // Check if streak is SAVED first (highest priority)
            const isSaved = amritvelaLog[today]?.isStreakSaverPatch === true;

            if (isSaved) {
                this.elements.streakFire.classList.remove('streak-broken', 'streak-healthy');
                this.elements.streakFire.classList.add('streak-saved');

                // Add SAVED tag if it doesn't exist
                if (!this.elements.streakFire.querySelector('.streak-saved-tag')) {
                    const tag = document.createElement('span');
                    tag.className = 'streak-saved-tag';
                    tag.textContent = 'SAVED';
                    this.elements.streakFire.appendChild(tag);
                }
            } else {
                // Remove SAVED styles
                this.elements.streakFire.classList.remove('streak-saved');
                const savedTag = this.elements.streakFire.querySelector('.streak-saved-tag');
                if (savedTag) savedTag.remove();

                if (hasPenalty) {
                    // ACTIVE PUNISHMENT: Blue fire
                    this.elements.streakFire.classList.add('streak-broken');
                    this.elements.streakFire.classList.remove('streak-healthy');
                } else if (streakAtRisk && new Date().getHours() >= 6) {
                    // AT RISK (past 6 AM, not marked): Blue fire
                    this.elements.streakFire.classList.add('streak-broken');
                    this.elements.streakFire.classList.remove('streak-healthy');
                } else if (todayMarked || (activePunishment && activePunishment.completed)) {
                    // MARKED or PUNISHMENT COMPLETED: Red fire (healthy)
                    this.elements.streakFire.classList.remove('streak-broken');
                    this.elements.streakFire.classList.add('streak-healthy');
                } else {
                    // Normal state: No special class
                    this.elements.streakFire.classList.remove('streak-broken', 'streak-healthy');
                }
            }
        }

        // === 2. Red Alert Badge ===
        if (this.elements.streakAlertBadge) {
            if (hasPenalty) {
                this.elements.streakAlertBadge.style.display = 'flex';
                this.elements.streakAlertBadge.classList.add('pulse-alert');
            } else {
                this.elements.streakAlertBadge.style.display = 'none';
                this.elements.streakAlertBadge.classList.remove('pulse-alert');
            }
        }

        // === 3. Penalty Button ===
        if (this.elements.penaltyBtn) {
            // Activate if: has active punishment OR streak at risk (today not marked + streak > 0)
            const shouldActivate = hasPenalty || streakAtRisk;

            if (shouldActivate) {
                this.elements.penaltyBtn.classList.add('penalty-active');
                // Show badge if at risk or has penalty
                if (this.elements.penaltyBadge) {
                    this.elements.penaltyBadge.style.display = 'flex';
                }
            } else {
                this.elements.penaltyBtn.classList.remove('penalty-active');
                if (this.elements.penaltyBadge) {
                    this.elements.penaltyBadge.style.display = 'none';
                }
            }
        }
    },

    /**
     * Show penalty modal with iOS bottom sheet style
     */
    showPenaltyModal() {
        if (typeof StreakSaverManager === 'undefined') return;
        const activePunishment = StreakSaverManager.getActivePunishment();
        if (!activePunishment || activePunishment.completed) {
            Toast.info('No Penalty', 'Your streak is safe! Keep going!');
            return;
        }

        // Update modal content
        const subtitle = document.getElementById('penaltyModalSubtitle');
        const streakCount = document.getElementById('penaltyStreakCount');
        const timeRemaining = document.getElementById('penaltyTimeRemaining');

        if (streakCount) {
            streakCount.textContent = activePunishment.brokenStreak;
        }

        if (subtitle) {
            subtitle.textContent = `Save your ${activePunishment.brokenStreak}-day streak!`;
        }

        // Calculate time remaining
        if (timeRemaining) {
            const expiresAt = new Date(activePunishment.expiresAt);
            const now = new Date();
            const hoursLeft = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60)));
            const minsLeft = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60)) % 60);
            timeRemaining.textContent = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m remaining` : 'Expiring soon!';
        }

        // Render tasks
        this.renderPenaltyTasks(activePunishment);

        // Open modal
        ModalManager.open('penaltyModal');
        HapticManager.warning();
    },

    /**
     * Render penalty tasks inside the modal
     */
    renderPenaltyTasks(punishmentData) {
        const tasksList = document.getElementById('penaltyTasksList');
        if (!tasksList) return;

        const punishment = punishmentData.punishment;
        let baniInfo = { name: 'Japji Sahib', namePunjabi: 'ਜਪੁਜੀ ਸਾਹਿਬ' };
        if (typeof StreakSaverManager !== 'undefined' && StreakSaverManager.PUNISHMENT_BANIS) {
            baniInfo = StreakSaverManager.PUNISHMENT_BANIS[punishment.type] || baniInfo;
        }

        let tasksHTML = '';

        if (punishment.type === 'sukhmani') {
            tasksHTML = `
                <div class="penalty-task-card" data-task-id="sukhmani-0">
                    <div class="penalty-task-icon">
                        <span>📖</span>
                    </div>
                    <div class="penalty-task-info">
                        <h4 class="penalty-task-name">${baniInfo.namePunjabi}</h4>
                        <p class="penalty-task-english">${baniInfo.name}</p>
                        <p class="penalty-task-desc">Complete 1 full paath of Sukhmani Sahib</p>
                    </div>
                    <button class="penalty-task-check" data-task="sukhmani-0" aria-label="Mark complete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <path d="M20 6L9 17l-5-5"/>
                        </svg>
                    </button>
                </div>
            `;
        } else {
            for (let i = 0; i < punishment.count; i++) {
                tasksHTML += `
                    <div class="penalty-task-card" data-task-id="japji-${i}">
                        <div class="penalty-task-icon">
                            <span>📖</span>
                        </div>
                        <div class="penalty-task-info">
                            <h4 class="penalty-task-name">${baniInfo.namePunjabi}</h4>
                            <p class="penalty-task-english">${baniInfo.name} ${punishment.count > 1 ? `(${i + 1}/${punishment.count})` : ''}</p>
                            <p class="penalty-task-desc">Complete full paath</p>
                        </div>
                        <button class="penalty-task-check" data-task="japji-${i}" aria-label="Mark complete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <path d="M20 6L9 17l-5-5"/>
                            </svg>
                        </button>
                    </div>
                `;
            }
        }

        tasksList.innerHTML = tasksHTML;

        // Add click listeners to individual checkmarks
        tasksList.querySelectorAll('.penalty-task-check').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskCard = btn.closest('.penalty-task-card');
                if (taskCard && !taskCard.classList.contains('completed')) {
                    taskCard.classList.add('completed');
                    btn.classList.add('checked');
                    HapticManager.success();
                    SoundManager.success();

                    // Check if all tasks are complete
                    const allCards = Array.from(tasksList.querySelectorAll('.penalty-task-card'));
                    const allCompleted = allCards.every(c => c.classList.contains('completed'));
                    if (allCompleted) {
                        setTimeout(() => this.completePenaltyTask(), 500);
                    }
                }
            });
        });
    },

    /**
     * Complete penalty task — restore the streak
     */
    completePenaltyTask() {
        if (typeof StreakSaverManager === 'undefined') return;
        const activePunishment = StreakSaverManager.getActivePunishment();
        if (!activePunishment || activePunishment.completed) return;

        // Mark all task cards as completed visually
        const taskCards = document.querySelectorAll('.penalty-task-card');
        taskCards.forEach(card => {
            card.classList.add('completed');
            const checkBtn = card.querySelector('.penalty-task-check');
            if (checkBtn) checkBtn.classList.add('checked');
        });

        // Haptic + Sound
        HapticManager.heavy();
        SoundManager.malaComplete();

        // Call the StreakSaverManager to complete the punishment
        StreakSaverManager.completePunishment();

        // Close modal after a short celebration delay
        setTimeout(() => {
            ModalManager.close('penaltyModal');

            // Update UI
            this.updatePenaltyState();
            this.updateStreakDisplay();

            // Celebration
            Toast.success('🎉 Streak Saved!', `Your ${activePunishment.brokenStreak}-day streak is restored!`);
            if (typeof CelebrationManager !== 'undefined') {
                CelebrationManager.show('streakSaved');
            }
        }, 800);
    },

    /**
     * Show streak risk warning modal (preventive mode)
     */
    showStreakRiskModal() {
        const streakData = StorageManager.load(CONFIG.STORAGE_KEYS.STREAK_DATA, { current: 0 });
        const hours = new Date().getHours();

        // Check if modal already exists
        let modal = document.getElementById('streakRiskModal');
        if (!modal) {
            // Create modal HTML
            const modalHTML = `
                <div class="modal-overlay" id="streakRiskModal">
                    <div class="modal-container penalty-modal-container">
                        <div class="penalty-modal-header">
                            <button class="modal-close-btn" data-close-modal>✕</button>
                            <div class="penalty-modal-icon-wrap">
                                <div class="penalty-modal-icon-glow"></div>
                                <span class="penalty-modal-icon">⚠️</span>
                            </div>
                            <h2 class="penalty-modal-title">Streak at Risk!</h2>
                            <p class="penalty-modal-subtitle">Mark Amritvela to save your streak</p>
                        </div>
                        <div class="modal-body penalty-modal-body">
                            <div class="penalty-streak-info">
                                <div class="penalty-streak-number">
                                    <span class="penalty-streak-fire">🔥</span>
                                    <span class="penalty-streak-count">${streakData.currentStreak || streakData.current || 0}</span>
                                    <span class="penalty-streak-label">Day Streak</span>
                                </div>
                            </div>
                            <div class="penalty-motivation">
                                <span class="penalty-motivation-icon">🙏</span>
                                <p class="penalty-motivation-text">ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਸਚੁ ਨਾਉ ਵਡਿਆਈ ਵੀਚਾਰੁ ॥</p>
                                <p class="penalty-motivation-english">In the Amritvela, contemplate the Greatness of the True Name.</p>
                            </div>
                        </div>
                        <div class="modal-footer penalty-modal-footer">
                            <button class="penalty-complete-all-btn" data-close-modal>
                                I'll Mark It Now
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Add close listeners
            modal = document.getElementById('streakRiskModal');
            modal.querySelectorAll('[data-close-modal]').forEach(el => {
                el.addEventListener('click', () => {
                    ModalManager.close('streakRiskModal');
                    HapticManager.selection();

                    // Scroll to Nitnem section so user can mark it
                    const section = document.getElementById('nitnemProgressSection');
                    if (section) {
                        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Add a temporary highlight effect
                        section.classList.add('highlight-section');
                        setTimeout(() => section.classList.remove('highlight-section'), 2000);
                    }
                });
            });
        }

        ModalManager.open('streakRiskModal');
        HapticManager.warning();
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

/* -----------------------------------------------------------------------------
   SECTION 10: TAB BAR NAVIGATION
   ----------------------------------------------------------------------------- */

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
        HapticManager.selection();

        if (tabName === 'nitnem') {
            const card = document.getElementById('pothiRedirectCard');
            if (card) {
                card.classList.remove('pothi-highlight-pulse');
                void card.offsetWidth;
                card.classList.add('pothi-highlight-pulse');
            }
            if (this.activeTab === 'nitnem') {
                window.location.href = '../nitnem/my-pothi.html';
                return;
            }
        }

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
            nitnem: 'pothiRedirectCard',
            mala: 'malaSection',
            stats: 'streakSection'
        };

        const sectionId = sectionMap[tabName];
        if (!sectionId) return;

        const section = document.getElementById(sectionId);
        if (!section) return;

        // FIX: Calculate proper scroll position accounting for fixed header
        const header = document.querySelector('.app-header') || document.querySelector('.nitnem-header');
        const headerHeight = header ? header.offsetHeight : 80;
        const sectionTop = section.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = Math.max(0, sectionTop - headerHeight - 16);

        try {
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        } catch (e) {
            window.scrollTo(0, offsetPosition);
        }

        // WebView fallback scroll check
        setTimeout(() => {
            const currentY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            if (Math.abs(currentY - offsetPosition) > 40) {
                window.scrollTo(0, offsetPosition);
                document.documentElement.scrollTop = offsetPosition;
                document.body.scrollTop = offsetPosition;
            }
        }, 200);
    }
};

/* -----------------------------------------------------------------------------
   SECTION 11: AMRITVELA PRESENT SYSTEM
   ----------------------------------------------------------------------------- */

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
        const cutoffHour = 6;

        if (hours >= cutoffHour && !this.todayMarked && !this._penaltyTriggeredToday) {
            this._penaltyTriggeredToday = true;
            this.elements.presentBtn?.classList.add('disabled');
            this.showMessage('⏰', 'Present marking is available until 6:00 AM');

            // Trigger streak penalty warning
            this.triggerStreakPenalty();
        }
    },

    /**
     * Trigger streak penalty when Amritvela not marked after 6 AM
     */
    triggerStreakPenalty() {
        // Show warning badge on streak counter
        const streakFire = document.querySelector('.streak-fire');
        if (streakFire) {
            streakFire.classList.add('penalty-active');
        }

        // Update penalty streak info
        const penaltyStreakInfo = document.getElementById('penaltyStreakInfo');
        if (penaltyStreakInfo) {
            penaltyStreakInfo.style.display = 'flex';
        }

        // Show warning toast
        Toast.warning('Streak at Risk', 'Amritvela not marked before 6 AM. Your streak may be affected!');

        // Log penalty for streak calculation (using separate key to avoid corrupting attendance log)
        const today = Utils.getTodayString();
        const penalties = StorageManager.load('nitnemTracker_amritvelaPenalties', {});
        penalties[today] = true;
        StorageManager.save('nitnemTracker_amritvelaPenalties', penalties);
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
            timestamp: now.toISOString(),
            woke: true  // FIXED: Set woke flag for streak calculation
        };

        // ═══ INSTANT UI FEEDBACK (< 16ms) — DOM updates BEFORE storage I/O ═══
        // 1. Immediately mark flag (prevents double-click)
        this.todayMarked = true;

        // 2. Instantly update button visual state
        this.showMarkedState(entry);

        // 3. Play time-based animation
        this.playTimeBasedAnimation(hours);

        // 4. Haptic + sound feedback
        HapticManager.success();
        SoundManager.success();

        // 5. Show message
        this.showMessage(this.getSlotEmoji(slotInfo.label), slotInfo.message);

        // 6. Animate button ripple
        this.animateButton();

        // ═══ DEFERRED: Storage I/O + Heavy operations (non-blocking) ═══
        setTimeout(() => {
            // Save to log
            const log = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
            log[today] = entry;
            StorageManager.save(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, log);

            // Update stats
            this.updateStats();

            // Broadcast update to all sections (streak recalculation, achievements)
            this.broadcastAttendanceUpdate(entry);

            // Show toast
            Toast.success('ਹਾਜ਼ਰੀ ਲੱਗੀ!', `You woke up at ${entry.time} - ${slotInfo.label}`);

            // Refresh date strip if open
            DateHistoryView.refreshDateDots();
        }, 0);
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
     * ENHANCED: Ensure streak updates immediately with new Amritvela entry
     */
    broadcastAttendanceUpdate(entry) {
        // ═══ ENHANCED: Force immediate streak recalculation ═══
        // Use setTimeout to ensure log is fully saved before recalculation
        setTimeout(() => {
            StreakManager.recalculateStreak();
            StreakManager.updateDisplay();
            HeaderManager.updateStreakDisplay();
        }, 50);

        // Update Achievement Manager
        AchievementManager.checkAmritvela(entry);

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
            if (badge && entry?.slot) {
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

        // SYNC: Use exact recalculation from logs to avoid pre-increment before marking present
        StreakManager.recalculateStreak();
        let streak = StreakManager.state.currentStreak || 0;

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
                const time = log[d]?.time;
                if (!time) return 0;
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

/* -----------------------------------------------------------------------------
   SECTION 12: NITNEM PROGRESS SYSTEM
   ----------------------------------------------------------------------------- */

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
    allBanis: {}, // Initialize as object to match data structure

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
                { id: 'japji-sahib', nameGurmukhi: 'ਜਪੁਜੀ ਸਾਹਿਬ', nameEnglish: 'Japji Sahib', duration: '25 min', defaultPeriod: 'amritvela' },
                { id: 'jaap-sahib', nameGurmukhi: 'ਜਾਪ ਸਾਹਿਬ', nameEnglish: 'Jaap Sahib', duration: '15 min', defaultPeriod: 'amritvela' },
                { id: 'tav-prasad-savaiye', nameGurmukhi: 'ਤ੍ਵ ਪ੍ਰਸਾਦਿ ਸਵੱਯੇ', nameEnglish: 'Tav Prasad Savaiye', duration: '5 min', defaultPeriod: 'amritvela' },
                { id: 'chaupai-sahib', nameGurmukhi: 'ਚੌਪਈ ਸਾਹਿਬ', nameEnglish: 'Chaupai Sahib', duration: '7 min', defaultPeriod: 'amritvela' },
                { id: 'anand-sahib', nameGurmukhi: 'ਅਨੰਦ ਸਾਹਿਬ', nameEnglish: 'Anand Sahib', duration: '10 min', defaultPeriod: 'amritvela' },
                { id: 'rehras-sahib', nameGurmukhi: 'ਰਹਿਰਾਸ ਸਾਹਿਬ', nameEnglish: 'Rehras Sahib', duration: '25 min', defaultPeriod: 'rehras' },
                { id: 'sohila-sahib', nameGurmukhi: 'ਸੋਹਿਲਾ ਸਾਹਿਬ', nameEnglish: 'Sohila Sahib', duration: '7 min', defaultPeriod: 'sohila' }
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
        // FIX: Force default banis from embedded fallback data
        const defaults = [
            { id: 'japji-sahib', nameGurmukhi: 'ਜਪੁਜੀ ਸਾਹਿਬ', nameEnglish: 'Japji Sahib', duration: '25 min', defaultPeriod: 'amritvela', author: 'Guru Nanak Dev Ji', source: 'Sri Guru Granth Sahib Ji' },
            { id: 'jaap-sahib', nameGurmukhi: 'ਜਾਪ ਸਾਹਿਬ', nameEnglish: 'Jaap Sahib', duration: '15 min', defaultPeriod: 'amritvela', author: 'Guru Gobind Singh Ji', source: 'Sri Dasam Granth Sahib' },
            { id: 'tav-prasad-savaiye', nameGurmukhi: 'ਤ੍ਵ ਪ੍ਰਸਾਦਿ ਸਵੱਯੇ', nameEnglish: 'Tav Prasad Savaiye', duration: '5 min', defaultPeriod: 'amritvela', author: 'Guru Gobind Singh Ji', source: 'Sri Dasam Granth Sahib' },
            { id: 'chaupai-sahib', nameGurmukhi: 'ਚੌਪਈ ਸਾਹਿਬ', nameEnglish: 'Chaupai Sahib', duration: '7 min', defaultPeriod: 'amritvela', author: 'Guru Gobind Singh Ji', source: 'Sri Dasam Granth Sahib' },
            { id: 'anand-sahib', nameGurmukhi: 'ਅਨੰਦ ਸਾਹਿਬ', nameEnglish: 'Anand Sahib', duration: '10 min', defaultPeriod: 'amritvela', author: 'Guru Amar Das Ji', source: 'Sri Guru Granth Sahib Ji' },
            { id: 'rehras-sahib', nameGurmukhi: 'ਰਹਿਰਾਸ ਸਾਹਿਬ', nameEnglish: 'Rehras Sahib', duration: '25 min', defaultPeriod: 'rehras', author: 'Multiple Gurus', source: 'Sri Guru Granth Sahib Ji' },
            { id: 'sohila-sahib', nameGurmukhi: 'ਸੋਹਿਲਾ ਸਾਹਿਬ', nameEnglish: 'Sohila Sahib', duration: '7 min', defaultPeriod: 'sohila', author: 'Guru Nanak Dev Ji', source: 'Sri Guru Granth Sahib Ji' },
            { id: 'ardas', nameGurmukhi: 'ਅਰਦਾਸ', nameEnglish: 'Ardas', duration: '5 min', defaultPeriod: 'sohila', author: 'Sikh Tradition', source: 'Sikh Prayer' }
        ];

        defaults.forEach(bani => {
            if (bani.defaultPeriod && this.selectedBanis[bani.defaultPeriod]) {
                const entry = { ...bani, uid: Utils.generateId() };
                this.selectedBanis[bani.defaultPeriod].push(entry);
            }
        });

        this.saveSelectedBanis();
        console.log('[Nitnem] Default banis loaded');
    },

    /**
     * Save selected banis
     */
    saveSelectedBanis() {
        StorageManager.save(CONFIG.STORAGE_KEYS.SELECTED_BANIS, this.selectedBanis);
    },

    /**
     * Sync Nitnem Tracker selected banis → My Pothi (anhad_my_pothi)
     * Ensures bidirectional consistency: adding/removing in Tracker updates Pothi.
     */
    syncSelectedBanisToMyPothi() {
        try {
            var periods = ['amritvela', 'rehras', 'sohila'];
            var uniqueIds = [];
            var seen = {};

            periods.forEach(function (p) {
                var list = this.selectedBanis[p] || [];
                list.forEach(function (b) {
                    if (b && b.id != null && !seen[b.id]) {
                        seen[b.id] = true;
                        uniqueIds.push(b.id);
                    }
                });
            }, this);

            // Update anhad_my_pothi (ordered array of IDs)
            localStorage.setItem('anhad_my_pothi', JSON.stringify(uniqueIds));

            // CRITICAL FIX: Save snapshot for historical tracking
            // This ensures newly added banis today won't show as "pending from yesterday"
            saveDailyPothiSnapshot();

            console.log('[Nitnem] Synced to My Pothi:', uniqueIds);            // Build data array for anhad_my_pothi_data
            var pothiData = [];
            uniqueIds.forEach(function (id) {
                var bani = this.allBanis ? this.allBanis.find(function (b) { return b.id === id; }) : null;
                if (bani) {
                    pothiData.push({
                        id: bani.id,
                        name: bani.nameGurmukhi || bani.name || 'Unknown',
                        english: bani.nameEnglish || bani.english || 'Unknown'
                    });
                }
            }, this);
            localStorage.setItem('anhad_my_pothi_data', JSON.stringify(pothiData));
        } catch (e) {
            console.warn('[NitnemManager] syncSelectedBanisToMyPothi failed:', e);
        }
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

        // ═══ SYNC WITH MY POTHI COMPLETED ═══
        try {
            const completedPothiIds = [];
            const seen = new Set();
            Object.keys(this.selectedBanis || {}).forEach(period => {
                const list = this.selectedBanis[period] || [];
                const completedUIDs = this.completedToday[period] || [];
                list.forEach(b => {
                    if (b && b.id && completedUIDs.includes(b.uid) && !seen.has(b.id)) {
                        seen.add(b.id);
                        completedPothiIds.push(b.id);
                    }
                });
            });

            const pothiCompleted = JSON.parse(localStorage.getItem('anhad_my_pothi_completed') || '{}');
            pothiCompleted[today] = completedPothiIds;
            localStorage.setItem('anhad_my_pothi_completed', JSON.stringify(pothiCompleted));
            
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'anhad_my_pothi_completed',
                newValue: JSON.stringify(pothiCompleted),
                url: window.location.href
            }));
            window.dispatchEvent(new CustomEvent('nitnemCompletionUpdated', {
                detail: { today, completed: completedPothiIds }
            }));
        } catch (pothiErr) {
            console.warn('[NitnemManager] Error syncing to My Pothi completed:', pothiErr);
        }

        // Sync with UnifiedStats
        if (window.UnifiedStats && typeof window.UnifiedStats.syncNitnemProgress === 'function') {
            let totalBanis = 0;
            let completedBanis = 0;
            const completedList = [];

            Object.keys(this.selectedBanis).forEach(period => {
                totalBanis += (this.selectedBanis[period] || []).length;
                completedBanis += (this.completedToday[period] || []).length;
                (this.completedToday[period] || []).forEach(uid => {
                    if (!completedList.includes(uid)) {
                        completedList.push(uid);
                    }
                });
            });

            const isDayComplete = totalBanis > 0 && completedBanis >= totalBanis;
            window.UnifiedStats.syncNitnemProgress(completedList, isDayComplete);
        }
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

        // ═══ MY POTHI SYNC: Listen for completion updates from My Pothi ═══
        // This fires when user checks/unchecks a bani in My Pothi and it syncs here
        window.addEventListener('nitnemCompletionUpdated', (e) => {
            const { baniId, uid, isComplete, period } = e.detail || {};
            if (!period || !uid) return;
            console.log('[NitnemTracker] My Pothi sync received:', { baniId, uid, isComplete, period });

            // FIX DOUBLE-COUNT: Check if UID already exists before adding
            if (isComplete) {
                if (!this.completedToday[period]) this.completedToday[period] = [];
                if (!this.completedToday[period].includes(uid)) {
                    this.completedToday[period].push(uid);
                    this.saveTodayProgress();
                }
            } else {
                // Remove from completedToday
                if (this.completedToday[period]) {
                    this.completedToday[period] = this.completedToday[period].filter(id => id !== uid);
                    this.saveTodayProgress();
                }
            }

            // Re-render the affected period's visual list (show/hide green checkmark)
            this.renderBaniList(period);
            this.updateProgress();
            this.updateCounts();
        });

        // Also listen for storage changes from My Pothi (cross-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === 'nitnemTracker_nitnemLog') {
                console.log('[NitnemTracker] Storage sync (log) from My Pothi — re-loading progress');
                this.loadTodayProgress();
                this.renderAllLists();
                this.updateProgress();
            }
            if (e.key === 'nitnemTracker_selectedBanis') {
                // My Pothi auto-registered new banis — reload and re-render
                console.log('[NitnemTracker] Storage sync (selectedBanis) from My Pothi — re-loading banis');
                this.loadSelectedBanis();
                this.loadTodayProgress();
                this.renderAllLists();
                this.updateProgress();
            }
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
     * ENHANCED: Handle punishment banis with special styling
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

        // FIXED: Check if there are punishment banis and add a header
        const hasPunishmentBanis = banis.some(b => b.isPunishment);
        let html = '';

        if (hasPunishmentBanis) {
            html += `
                <div class="punishment-section-header">
                    <span class="punishment-icon">⚡</span>
                    <span class="punishment-title">Streak Saver Task</span>
                </div>
            `;
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

        html += Object.values(groups).map(group => {
            const total = group.instances.length;
            const done = group.completedCount;
            const isFullyCompleted = done === total && total > 0;
            const isGroup = total > 1;
            const isPunishment = group.isPunishment;

            let badgeHtml = '';
            if (isGroup) {
                badgeHtml = `<span class="bani-badge">${done}/${total}</span>`;
            }

            const punishmentClass = isPunishment ? 'punishment-bani' : '';
            const punishmentIcon = isPunishment ? '<span class="punishment-indicator">⚡</span>' : '';

            return `
            <div class="bani-item ${isFullyCompleted ? 'completed' : ''} ${punishmentClass}" 
                 data-bani-id="${group.id}" data-period="${period}"
                 data-is-group="${isGroup}">
                <div class="bani-checkbox">
                    ${isFullyCompleted ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>` : ''}
                </div>
                <div class="bani-info">
                    <span class="bani-name">${group.nameGurmukhi} ${badgeHtml} ${punishmentIcon}</span>
                    <span class="bani-name-english">${group.nameEnglish}</span>
                </div>
                <span class="bani-duration">${group.duration}</span>
                <button class="bani-vichar-btn" data-bani-name="${group.nameEnglish}" aria-label="Deep Vichar" title="Deep Vichar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                </button>
                ${!isPunishment ? `<button class="bani-remove-btn" data-bani-id="${group.id}" aria-label="Remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>` : ''}
            </div>
        `}).join('');

        listElement.innerHTML = html;

        // Attach event listeners
        listElement.querySelectorAll('.bani-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.bani-remove-btn') || e.target.closest('.bani-vichar-btn')) return;
                this.toggleGroupCompletion(item.dataset.baniId, item.dataset.period);
            });
        });

        listElement.querySelectorAll('.bani-vichar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = btn.dataset.baniName;
                if (window.AnhadComingSoon) {
                    window.AnhadComingSoon.show({
                        title: 'Deep Vichar',
                        gurmukhi: 'ਸ਼ਬਦ ਵਿਚਾਰ',
                        feature: name || '',
                        desc: 'A guided space for deeper reflection on this Bani is on its way.'
                    });
                }
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
     * Toggle completion of a bani group
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

            // ═══ SYNC WITH DASHBOARD ═══
            // ONLY use UnifiedProgressTracker to avoid double counting
            if (window.UnifiedProgressTracker) {
                window.UnifiedProgressTracker.trackNitnemCompletion(1);
            } else if (window.AnhadStats) {
                // Fallback: only if UnifiedProgressTracker not available
                window.AnhadStats.addNitnemCompleted(1);
            }

            console.log('[Nitnem] ✅ Tracked 1 bani completion');
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

        // CRITICAL FIX: Check if this completes a punishment task
        if (typeof StreakSaverManager !== 'undefined') {
            StreakSaverManager.checkPunishmentCompletion();
        }

        // CRITICAL FIX: Dispatch storage event to update homepage cards in real-time
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'nitnemTracker_nitnemLog',
            newValue: localStorage.getItem('nitnemTracker_nitnemLog'),
            url: window.location.href
        }));

        // Dispatch event for dashboard updates
        window.dispatchEvent(new CustomEvent('nitnemUpdated', {
            detail: {
                period,
                baniId,
                completed: this.completedToday,
                selected: this.selectedBanis
            }
        }));

        // CRITICAL FIX: Trigger homepage data update if function exists
        if (window.updateNitnemTracker) {
            window.updateNitnemTracker();
        }

        // Check if all complete
        this.checkAllComplete();
    },

    /**
     * Remove one instance of a group
     */
    removeGroupInstance(baniId, period) {
        // Find last instance (LIFO). Prefer uncompleted.
        let index = -1;
        for (let i = this.selectedBanis[period].length - 1; i >= 0; i--) {
            if (this.selectedBanis[period][i].id === baniId) {
                if (!this.completedToday[period].includes(this.selectedBanis[period][i].uid)) {
                    index = i;
                    break;
                }
                if (index === -1) index = i;
            }
        }
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
        this.syncSelectedBanisToMyPothi();
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
            // Animate completion for visual elements
            const listElement = this.elements[`${this.activePeriod}BaniList`];
            const items = listElement ? Array.from(listElement.querySelectorAll('.bani-item:not(.completed)')) : [];

            banis.forEach(b => {
                if (!this.completedToday[this.activePeriod].includes(b.uid)) {
                    this.completedToday[this.activePeriod].push(b.uid);
                }
            });

            for (let i = 0; i < items.length; i++) {
                await this.animateBaniCheck(items[i], i * 80);
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

        // CRITICAL FIX: Check if completing all includes punishment banis
        if (typeof StreakSaverManager !== 'undefined') {
            StreakSaverManager.checkPunishmentCompletion();
        }

        // CRITICAL FIX: Dispatch storage event to update homepage cards
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'nitnemTracker_nitnemLog',
            newValue: localStorage.getItem('nitnemTracker_nitnemLog'),
            url: window.location.href
        }));

        // Dispatch event for dashboard updates
        window.dispatchEvent(new CustomEvent('nitnemUpdated', {
            detail: {
                period: this.activePeriod,
                completed: this.completedToday,
                selected: this.selectedBanis
            }
        }));

        // CRITICAL FIX: Trigger homepage data update
        if (window.updateNitnemTracker) {
            window.updateNitnemTracker();
        }

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
        // FIX: Ensure period array exists
        if (!this.selectedBanis[period]) {
            this.selectedBanis[period] = [];
        }

        // Allow duplicates - Generate Unique Instance ID (UID)
        const entry = { ...bani, uid: Utils.generateId() };

        this.selectedBanis[period].push(entry);
        this.saveSelectedBanis();
        this.syncSelectedBanisToMyPothi();
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
        this.syncSelectedBanisToMyPothi();
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

        // Debug logging to trace 0% bug
        console.log('[Nitnem] Progress update:', {
            totalBanis,
            completedBanis,
            percentage,
            selectedBanis: this.selectedBanis,
            completedToday: this.completedToday
        });

        // Update progress ring with element guard
        const progressRing = document.getElementById('nitnemProgressRing');
        if (progressRing) {
            const circumference = 2 * Math.PI * 15; // radius = 15
            const offset = circumference - (percentage / 100) * circumference;
            progressRing.style.strokeDashoffset = offset;
            console.log('[Nitnem] Progress ring updated:', percentage + '%');
        } else {
            console.warn('[Nitnem] Progress ring element not found');
        }

        // Update percentage text with element guard
        const progressPercent = document.getElementById('nitnemProgressPercent');
        if (progressPercent) {
            progressPercent.textContent = `${percentage}%`;
            console.log('[Nitnem] Progress percent updated:', percentage + '%');
        } else {
            console.warn('[Nitnem] Progress percent element not found');
        }

        // Update complete all button
        if (this.elements.completeAllBtn) {
            const currentBanis = this.selectedBanis[this.activePeriod] || [];
            this.elements.completeAllBtn.disabled = currentBanis.length === 0;
        }

        // CRITICAL FIX: Store updated progress in localStorage for homepage sync
        try {
            const progressData = {
                totalBanis,
                completedBanis,
                percentage,
                timestamp: Date.now()
            };
            localStorage.setItem('nitnemTracker_progress', JSON.stringify(progressData));
        } catch (e) {
            console.error('[Nitnem] Failed to save progress data:', e);
        }
    },

    /**
     * Update counts display
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

            // ═══ SYNC FULL DAY COMPLETION ═══
            // Mark "Complete Nitnem" goal as done (1 full day = 1 goal)
            if (window.AnhadStats) {
                const goals = window.AnhadStats.getGoals();
                // Set completeNitnem goal to 1 (full day done)
                goals.completeNitnem.current = 1;
                localStorage.setItem('anhad_daily_goals', JSON.stringify(goals));
                window.dispatchEvent(new CustomEvent('goalsUpdated', { detail: goals }));
            }

            // Trigger dashboard refresh
            if (window.DashboardAnalytics) {
                window.DashboardAnalytics.syncWithNitnemTracker();
                window.DashboardAnalytics.renderChart();
            }

            // --- NITNEM COMPLETION NOTIFICATION ---
            // Dispatch nitnemUpdate so spiritual-notifications.js fires a
            // celebratory push notification (once per day, idempotent).
            const _today = new Date().toLocaleDateString('en-CA');
            const _nitnemCompletionKey = 'anhad_nitnem_notif_' + _today;
            if (localStorage.getItem(_nitnemCompletionKey) !== 'sent') {
                localStorage.setItem(_nitnemCompletionKey, 'sent');
                window.dispatchEvent(new CustomEvent('nitnemUpdate', {
                    detail: { complete: true, totalBanis, completedBanis }
                }));
                console.log('✅ Full Nitnem completed - nitnemUpdate dispatched for notification');
            } else {
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

/* -----------------------------------------------------------------------------
   SECTION 13: BANI MODAL
   ----------------------------------------------------------------------------- */

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

        // FIX: Ensure allBanis is loaded, use fallback if needed
        let allBanis = NitnemManager.allBanis;
        if (!allBanis || Object.keys(allBanis).length === 0) {
            console.warn('[BaniModal] allBanis not loaded, using fallback');
            allBanis = NitnemManager.getDefaultBanis();
        }

        const allBanisList = [
            ...(allBanis.nitnem || []),
            ...(allBanis.guruGranthSahib || []),
            ...(allBanis.dasamGranth || []),
            ...(allBanis.other || [])
        ];

        // FIX: Log for debugging
        console.log('[BaniModal] Adding banis:', this.selectedBanis.length, 'Available:', allBanisList.length);

        let added = 0;
        this.selectedBanis.forEach(baniId => {
            const bani = allBanisList.find(b => b.id === baniId);
            if (bani) {
                const success = NitnemManager.addBani(bani, this.targetPeriod);
                if (success) added++;
            } else {
                console.warn('[BaniModal] Bani not found:', baniId);
            }
        });

        ModalManager.close('addBaniModal');

        if (added > 0) {
            Toast.success('Banis Added', `${added} bani(s) added to ${this.targetPeriod}`);
        } else {
            Toast.error('Error', 'Could not add banis. Please try again.');
        }
    }
};

/* -----------------------------------------------------------------------------
   SECTION 14: SETTINGS MANAGER
   ----------------------------------------------------------------------------- */

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
        if (typeof ReportsManager !== 'undefined' && ReportsManager.downloadBackupFile) {
            ReportsManager.downloadBackupFile(data, 'data.json');
        } else {
            const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'data.json';
            a.setAttribute('download', 'data.json');
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                if (a.parentNode) document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 1000);
            Toast.success('Export Saved', 'data.json downloaded successfully');
        }
    },

    /**
     * Import data with file picker or clipboard paste options
     */
    importData() {
        let modal = document.getElementById('importChoiceModal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'importChoiceModal';
        modal.innerHTML = `
            <div class="modal-backdrop" data-close-choice></div>
            <div class="modal-container import-modal-container">
                <div class="modal-handle"></div>
                <div class="modal-header">
                    <h2 class="modal-title">📥 Import Nitnem Backup</h2>
                    <button class="modal-close-btn" data-close-choice aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="modal-body import-modal-body" style="padding: 16px;">
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 16px;">
                        Select how you want to restore your Nitnem backup:
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button class="btn btn-primary modal-btn" id="importFromFileBtn" style="padding: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span>Choose JSON File</span>
                        </button>
                        <button class="btn btn-secondary modal-btn" id="importFromClipboardBtn" style="padding: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            <span>Paste / Restore from Clipboard</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelectorAll('[data-close-choice]').forEach(el => {
            el.addEventListener('click', () => {
                ModalManager.close('importChoiceModal');
                setTimeout(() => modal.remove(), 300);
            });
        });

        // Option 1: File selection
        const fileBtn = modal.querySelector('#importFromFileBtn');
        if (fileBtn) {
            fileBtn.addEventListener('click', () => {
                ModalManager.close('importChoiceModal');
                setTimeout(() => modal.remove(), 300);
                this._triggerFileInput();
            });
        }

        // Option 2: Clipboard paste
        const clipBtn = modal.querySelector('#importFromClipboardBtn');
        if (clipBtn) {
            clipBtn.addEventListener('click', async () => {
                ModalManager.close('importChoiceModal');
                setTimeout(() => modal.remove(), 300);

                let pastedText = '';
                if (navigator.clipboard && navigator.clipboard.readText) {
                    try {
                        pastedText = await navigator.clipboard.readText();
                    } catch(e) {}
                }

                if (pastedText && pastedText.trim().startsWith('{')) {
                    const summary = StorageManager.parseBackupSummary(pastedText);
                    if (summary.isValid) {
                        this.showImportPreviewModal(pastedText, summary, 'Clipboard-Backup.json');
                        return;
                    }
                }

                // If clipboard read was denied or didn't contain valid JSON, show paste prompt
                const manualJson = prompt('Paste your Nitnem backup JSON text here:');
                if (manualJson && manualJson.trim()) {
                    const summary = StorageManager.parseBackupSummary(manualJson);
                    if (!summary.isValid) {
                        Toast.error('Invalid Backup Data', 'The pasted text is not a valid Nitnem backup');
                        HapticManager.error();
                        return;
                    }
                    this.showImportPreviewModal(manualJson, summary, 'Pasted-Backup.json');
                }
            });
        }

        ModalManager.open('importChoiceModal');
        HapticManager.selection();
    },

    _triggerFileInput() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json,text/plain';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target.result;
                const summary = StorageManager.parseBackupSummary(content);

                if (!summary.isValid) {
                    Toast.error('Invalid Backup File', 'The selected file is not a valid Nitnem backup');
                    HapticManager.error();
                    return;
                }

                this.showImportPreviewModal(content, summary, file.name);
            };
            reader.readAsText(file);
        };

        input.click();
    },

    /**
     * Show Import Confirmation Preview Modal
     */
    showImportPreviewModal(content, summary, filename) {
        let modal = document.getElementById('importModal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'importModal';

        const categoriesHtml = summary.categoriesList.map(cat => 
            `<div class="export-chip"><span class="chip-icon">✓</span> ${cat}</div>`
        ).join('');

        modal.innerHTML = `
            <div class="modal-backdrop" data-close-import></div>
            <div class="modal-container import-modal-container">
                <div class="modal-handle"></div>
                <div class="modal-header">
                    <h2 class="modal-title">📥 Restore Backup Data</h2>
                    <button class="modal-close-btn" data-close-import aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="modal-body import-modal-body">
                    <div class="import-preview-card">
                        <div class="import-preview-header">
                            <span class="import-preview-icon">📦</span>
                            <div>
                                <div class="export-filename">${filename}</div>
                                <div class="import-meta">Export Date: ${summary.exportDate || 'Valid Backup'} • ${summary.categoriesCount} Categories</div>
                            </div>
                        </div>
                    </div>

                    <div class="import-warning-box">
                        <span class="warning-icon">⚠️</span>
                        <span>Importing this file will safely merge and restore your Nitnem completion history, streak data, My Pothi banis, and app preferences.</span>
                    </div>

                    <div class="export-content-section">
                        <span class="export-section-label">Data to be Restored:</span>
                        <div class="export-chips-grid">
                            ${categoriesHtml}
                        </div>
                    </div>
                </div>
                <div class="modal-footer import-modal-footer">
                    <button class="btn btn-secondary modal-btn" data-close-import>Cancel</button>
                    <button class="btn btn-primary modal-btn" id="confirmImportBtn">
                        <span>Confirm & Restore</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll('[data-close-import]').forEach(el => {
            el.addEventListener('click', () => {
                ModalManager.close('importModal');
                setTimeout(() => modal.remove(), 300);
            });
        });

        const confirmBtn = modal.querySelector('#confirmImportBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const success = StorageManager.importData(content);
                ModalManager.close('importModal');
                setTimeout(() => modal.remove(), 300);

                if (success) {
                    Toast.success('Import Complete', 'Your Nitnem data has been successfully restored');
                    HapticManager.success();
                    setTimeout(() => location.reload(), 1500);
                } else {
                    Toast.error('Import Failed', 'Unable to restore backup data');
                    HapticManager.error();
                }
            });
        }

        ModalManager.open('importModal');
        HapticManager.selection();
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

/* -----------------------------------------------------------------------------
   SECTION 15: Note - Full implementations are in Part 2 (below)
   ----------------------------------------------------------------------------- */

// MalaManager, AlarmManager, StreakManager, AchievementManager, 
// ReportsManager, CelebrationManager, and StatisticsModal are defined in Part 2 below.

/* -----------------------------------------------------------------------------
   SECTION 16: MAIN APPLICATION INITIALIZATION
   ----------------------------------------------------------------------------- */

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

/* -----------------------------------------------------------------------------
   SECTION 17: EVENT LISTENERS & STARTUP
   ----------------------------------------------------------------------------- */

// Initialize when DOM is ready
// REMOVED: Duplicate initialization. initializeFullApp() is the only startup point now.
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', () => NitnemTrackerApp.init());
// } else {
//     NitnemTrackerApp.init();
// }

// Cleanup on page unload
window.addEventListener('pagehide', () => {
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

/* -----------------------------------------------------------------------------
   END OF PART 1
   ----------------------------------------------------------------------------- */

/* ═══════════════════════════════════════════════════════════════════════════════
   NITNEM TRACKER - PREMIUM iOS 26+ APPLICATION
   Part 2: Mala, Alarms, Streaks, Achievements, Reports, Celebrations, Stats
   ═══════════════════════════════════════════════════════════════════════════════ */

/* -----------------------------------------------------------------------------
   SECTION 18: MALA COUNTER SYSTEM
   ----------------------------------------------------------------------------- */

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
        let homeMala = {};
        try {
            homeMala = JSON.parse(localStorage.getItem('anhad_mala_counter_v1') || '{}');
        } catch(e) {}

        const logToday = log[today] || {};
        if (homeMala.date === today) {
            this.state.completedMalas = Math.max(logToday.completedMalas || 0, homeMala.rounds || 0);
            this.state.totalToday = Math.max(logToday.totalCount || 0, homeMala.totalJaap || 0);
            if (homeMala.count && this.state.count === 0) {
                this.state.count = homeMala.count;
            }
        } else if (logToday.totalCount || logToday.completedMalas) {
            this.state.completedMalas = logToday.completedMalas || 0;
            this.state.totalToday = logToday.totalCount || 0;
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

        // Sync with Home Screen Mala Jaap Counter
        try {
            localStorage.setItem('anhad_mala_counter_v1', JSON.stringify({
                date: today,
                count: this.state.count,
                rounds: this.state.completedMalas,
                totalJaap: this.state.totalToday,
                target: this.state.beadsPerMala
            }));

            window.dispatchEvent(new StorageEvent('storage', {
                key: 'nitnemTracker_malaLog',
                newValue: JSON.stringify(log),
                url: window.location.href
            }));

            window.dispatchEvent(new CustomEvent('malaUpdated', {
                detail: {
                    _source: 'nitnem_tracker',
                    count: this.state.count,
                    rounds: this.state.completedMalas,
                    totalJaap: this.state.totalToday,
                    target: this.state.beadsPerMala,
                    date: today
                }
            }));
        } catch(e) {}
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

        // Listen for external Mala Jaap updates (e.g. from Home Screen)
        window.addEventListener('storage', (e) => {
            if (e.key === 'anhad_mala_counter_v1' || e.key === 'nitnemTracker_malaLog') {
                this.loadTodayData();
                this.updateDisplay();
            }
        });
        window.addEventListener('malaUpdated', (e) => {
            if (e && e.detail && e.detail._source !== 'nitnem_tracker') {
                this.loadTodayData();
                this.updateDisplay();
            }
        });

        // Load custom mala options
        if (typeof this.renderCustomMalaOptions === 'function') {
            this.renderCustomMalaOptions();
        }
    },

    /**
     * Stub for missing custom mala rendering
     */
    renderCustomMalaOptions() {
        // Safe stub for missing method
    },

    /**
     * Stub for missing custom mala adding
     */
    addCustomMala() {
        Toast.info('Coming Soon', 'Custom Naam Jap options will be available in next update.');
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
     * Pre-render the mala menu once (called from init or first open)
     */
    _menuRendered: false,
    preRenderMenu() {
        if (this._menuRendered) return;
        this._menuRendered = true;

        const overlay = document.createElement('div');
        overlay.className = 'mala-menu-overlay pre-rendered';
        overlay.id = 'malaMenuOverlay';
        overlay.innerHTML = `
            <div class="mala-menu" onclick="event.stopPropagation()">
                <div class="menu-header">
                    <h4>📿 Mala Options</h4>
                    <button class="menu-close-btn" id="malaMenuCloseBtn">×</button>
                </div>
                <div class="menu-option" data-action="setDailyGoal">
                    <span class="menu-icon">🎯</span>
                    <div class="menu-text">
                        <span class="menu-label">Set Daily Goal</span>
                        <span class="menu-value" id="malaGoalValue">Not set</span>
                    </div>
                </div>
                <div class="menu-option" data-action="viewPreviousData">
                    <span class="menu-icon">📊</span>
                    <div class="menu-text">
                        <span class="menu-label">Previous Day Records</span>
                        <span class="menu-value">Yesterday & Day Before</span>
                    </div>
                </div>
                <div class="menu-option" data-action="viewFullHistory">
                    <span class="menu-icon">📅</span>
                    <div class="menu-text">
                        <span class="menu-label">View Full History</span>
                        <span class="menu-value">Last 30 days</span>
                    </div>
                </div>
                <div class="menu-option" data-action="addCustomMala">
                    <span class="menu-icon">➕</span>
                    <div class="menu-text">
                        <span class="menu-label">Add Custom Naam Jap</span>
                        <span class="menu-value">Create your own</span>
                    </div>
                </div>
                <div class="menu-option" data-action="showPersonalBests">
                    <span class="menu-icon">🏆</span>
                    <div class="menu-text">
                        <span class="menu-label">Personal Bests</span>
                        <span class="menu-value">Your records</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Bind events once
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeMenu();
        });
        overlay.querySelector('#malaMenuCloseBtn').addEventListener('click', () => this.closeMenu());
        overlay.querySelectorAll('.menu-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const action = opt.dataset.action;
                this.closeMenu();
                if (typeof this[action] === 'function') this[action]();
            });
        });
    },

    /**
     * Show the three-dot menu for Mala section
     */
    showMalaMenu() {
        this.preRenderMenu();

        // Update dynamic goal value
        const dailyGoals = StorageManager.load('nt_mala_goals', {});
        const currentGoal = dailyGoals[this.state.currentJaap] || dailyGoals.default || 0;
        const goalEl = document.getElementById('malaGoalValue');
        if (goalEl) goalEl.textContent = currentGoal > 0 ? currentGoal + ' malas/day' : 'Not set';

        const overlay = document.getElementById('malaMenuOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            requestAnimationFrame(() => {
                overlay.classList.add('visible');
            });
        }
        HapticManager.light();
    },

    /**
     * Close the menu (instant CSS transition, no DOM removal)
     */
    closeMenu(event) {
        const overlay = document.getElementById('malaMenuOverlay');
        if (!overlay) return;
        overlay.classList.remove('visible');
        setTimeout(() => { overlay.style.display = 'none'; }, 200);
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

/* -----------------------------------------------------------------------------
   SECTION 19: ALARM OBEDIENCE SYSTEM
   ----------------------------------------------------------------------------- */

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
            body: document.getElementById('alarmBody'),
            toggleBtn: document.getElementById('alarmToggleBtn'),
            collapsedSummary: document.getElementById('alarmCollapsedSummary'),
            summaryRate: document.getElementById('alarmSummaryRate'),
            summaryResponded: document.getElementById('alarmSummaryResponded'),
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

        // Setup collapsible toggle
        this.setupCollapseToggle();

        // Load data
        this.loadAlarmData();

        // Setup event listeners
        this.setupEventListeners();

        // Listen for background sync updates
        const refreshHandler = (e) => {
            console.log(`[AlarmManager] 🔄 Sync event detected (${e.type}), updating UI...`);
            this.loadAlarmData();
            this.renderTodayAlarms();
            this.renderWeekView();
        };

        window.addEventListener('alarmSynced', refreshHandler);
        window.addEventListener('nitnemSync', refreshHandler);
        window.addEventListener('nitnemTracker_sync', refreshHandler);

        // Render week view
        this.renderWeekView();

        // Render today's alarms
        this.renderTodayAlarms();

        // Update stats
        this.updateStats();
    },

    /**
     * Setup alarm section collapse/expand toggle
     */
    setupCollapseToggle() {
        const toggleBtn = this.elements.toggleBtn;
        const body = this.elements.body;
        const summary = this.elements.collapsedSummary;
        if (!toggleBtn || !body) return;

        toggleBtn.addEventListener('click', () => {
            const isCollapsed = body.classList.contains('collapsed');
            if (isCollapsed) {
                body.classList.remove('collapsed');
                body.classList.add('expanded');
                toggleBtn.classList.add('rotated');
                if (summary) summary.classList.add('hidden');
            } else {
                body.classList.add('collapsed');
                body.classList.remove('expanded');
                toggleBtn.classList.remove('rotated');
                if (summary) summary.classList.remove('hidden');
                this.updateCollapsedSummary();
            }
            HapticManager.selection();
        });
    },

    /**
     * Update collapsed summary stats
     */
    updateCollapsedSummary() {
        if (this.elements.summaryRate) {
            this.elements.summaryRate.textContent = this.elements.obedienceRate?.textContent || '0%';
        }
        if (this.elements.summaryResponded) {
            this.elements.summaryResponded.textContent = this.elements.alarmsResponded?.textContent || '0';
        }
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
    async syncFromSmartReminders() {
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
            // 1. Proactively trigger AutoAlarmSync if available (handles IndexedDB)
            if (window.AutoAlarmSync) {
                console.log('[AlarmManager] Triggering AutoAlarmSync...');
                await window.AutoAlarmSync.syncNow();
            }

            // 2. Scan localStorage for reminders
            const keys = ['sr_reminders_v7', 'anhad_smart_reminders_v7', 'sr_reminders_v4', 'sr_reminders_v3', 'smart_reminders_v1'];
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
                // v7/v1 format - object with core/custom
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

            // 3. Scan localStorage for stats/completion data
            const statKeys = ['sr_stats_v7', 'sr_stats_v4', 'anhad_smart_stats_v7'];
            let stats = {};
            for (const key of statKeys) {
                const s = localStorage.getItem(key);
                if (s) {
                    stats = JSON.parse(s);
                    break;
                }
            }

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
                        // Check if completed today in Smart Reminders stats (Legacy support)
                        const lastCompleted = stats.lastCompletedDate?.[r.id];
                        if (lastCompleted === todayDate) {
                            status = 'responded';
                        }
                    } else if (stats.history && stats.history[todayDate] && stats.history[todayDate][r.id]) {
                        // Check v7 history if it exists
                        status = stats.history[todayDate][r.id].status || 'responded';
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
                        label: r.label || r.title || r.titlePunjabi || 'Reminder',
                        labelPunjabi: r.gurmukhi || r.titlePunjabi || '',
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
            } else {
                Toast.info('Synced', 'No reminders found for today');
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

        // Ensure stats update for the viewed week
        this.calculateStats();
        this.updateStats();
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
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + ((this.state.weekOffset || 0) * 7));
        const { start, end } = Utils.getWeekRange(targetDate);

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

        // Update collapsed summary
        this.updateCollapsedSummary();
    },

    /**
     * Open Smart Reminders page
     */
    openSmartReminders() {
        if (window.navigateTo) window.navigateTo('../reminders/smart-reminders-v7.html'); else window.location.href = '../reminders/smart-reminders-v7.html';
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

/* -----------------------------------------------------------------------------
   SECTION 20: STREAK ENGINE
   ----------------------------------------------------------------------------- */

const StreakManager = {
    elements: {},
    state: {
        currentStreak: 0,
        longestStreak: 0,
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
            // Support both old (current) and new (currentStreak) keys during migration
            this.state.currentStreak = saved.currentStreak || saved.current || 0;
            this.state.longestStreak = saved.longestStreak || saved.longest || 0;
            this.state.totalDays = saved.totalDays || 0;
            this.state.lastUpdated = saved.lastUpdated || null;
        }

        // Recalculate to ensure accuracy
        this.recalculateStreak();
    },

    /**
     * Recalculate streak from logs
     * ENHANCED: More lenient - counts days with EITHER Amritvela OR Nitnem completion
     */
    recalculateStreak() {
        const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});

        const completeDates = new Set();

        // 1. Add Amritvela logged dates (including Streak Saver patches)
        Object.keys(amritvelaLog).forEach(date => {
            const entry = amritvelaLog[date];
            if (entry) {
                completeDates.add(date);
            }
        });

        // 2. Add Nitnem 100% completed dates
        Object.keys(nitnemLog).forEach(date => {
            const entry = nitnemLog[date];
            if (entry && (entry.completed === true || entry.percentage === 100)) {
                completeDates.add(date);
            }
        });

        const datesToUse = Array.from(completeDates);

        // Calculate current streak using Utils.calculateStreak
        this.state.currentStreak = Utils.calculateStreak(datesToUse);

        // Calculate longest streak
        this.state.longestStreak = Math.max(this.state.longestStreak, this.state.currentStreak);

        // Total days
        this.state.totalDays = datesToUse.length;

        // Save
        this.saveStreakData();
    },

    /**
     * Calculate what the streak was up to a specific historical date
     */
    calculateHistoricalStreak(targetDateStr) {
        const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});

        const completeDates = new Set();

        Object.keys(amritvelaLog).forEach(date => {
            if (amritvelaLog[date]) completeDates.add(date);
        });

        Object.keys(nitnemLog).forEach(date => {
            const entry = nitnemLog[date];
            if (entry && (entry.completed === true || entry.percentage === 100)) {
                completeDates.add(date);
            }
        });

        const datesToUse = Array.from(completeDates);

        if (!datesToUse.includes(targetDateStr)) return 0;

        const sortedDates = datesToUse.sort((a, b) => new Date(b) - new Date(a));
        const startIndex = sortedDates.indexOf(targetDateStr);

        let streak = 1;
        for (let i = startIndex; i < sortedDates.length - 1; i++) {
            const current = new Date(sortedDates[i]);
            const next = new Date(sortedDates[i + 1]);
            const diffDays = Math.round((current - next) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) streak++;
            else break;
        }

        return streak;
    },

    /**
     * StreakSaverManager - Race-condition guard for saving streaks
     */
    StreakSaverManager: {
        _saveQueue: Promise.resolve(),
        enqueueSave(stateToSave) {
            this._saveQueue = this._saveQueue.then(() => {
                return new Promise(resolve => {
                    try {
                        const existingData = StorageManager.load(CONFIG.STORAGE_KEYS.STREAK_DATA, {});
                        const mergedData = { ...existingData, ...stateToSave };
                        StorageManager.save(CONFIG.STORAGE_KEYS.STREAK_DATA, mergedData);
                    } catch (e) {
                        console.error('[StreakSaverManager] Failed to save streak:', e);
                    }
                    // Add tiny delay to ensure storage write completes
                    setTimeout(resolve, 50);
                });
            });
        }
    },

    /**
     * Save streak data
     */
    saveStreakData() {
        this.state.lastUpdated = new Date().toISOString();
        this.StreakSaverManager.enqueueSave(this.state);
        
        // SYNC to UnifiedStats immediately for instant home page streak update
        if (typeof UnifiedStats !== 'undefined' && typeof UnifiedStats.syncStreak === 'function') {
            UnifiedStats.syncStreak(this.state.currentStreak);
        }
    },

    /**
     * Check and update streak
     */
    checkAndUpdate() {
        const previousStreak = this.state.currentStreak;
        this.recalculateStreak();

        // Check for streak milestones
        if (this.state.currentStreak > previousStreak) {
            this.checkMilestones(this.state.currentStreak);

            // SYNC with global AnhadStats
            if (typeof AnhadStats !== 'undefined') {
                AnhadStats.updateStreak();
            }
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
                this.state.currentStreak,
                800
            );
        }

        // Current streak
        if (this.elements.currentStreak) {
            this.elements.currentStreak.textContent = this.state.currentStreak;
        }

        // Longest streak
        if (this.elements.longestStreak) {
            this.elements.longestStreak.textContent = this.state.longestStreak;
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
        const streak = this.state.currentStreak;

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

        if (this.state.currentStreak > 0) {
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

/**
 * SECTION 20.5: STREAK SAVER PUNISHMENT SYSTEM (Japtab)
 * Allows users to save their streak by completing punishment Banis within 24h
 */

const StreakSaverManager = {
    // Enhanced punishment tiers with Mathila-specific tracking
    PUNISHMENT_TIERS: [
        { min: 1, max: 7, count: 1, options: ['japji', 'chaupai'], severity: 'low' },
        { min: 7, max: 14, count: 2, options: ['japji', 'chaupai', 'tav_prasad'], severity: 'medium' },
        { min: 14, max: 21, count: 3, options: ['japji', 'chaupai', 'tav_prasad', 'jaap_sahib'], severity: 'high' },
        { min: 21, max: 28, count: 4, options: ['japji', 'chaupai', 'tav_prasad', 'jaap_sahib', 'anand_sahib'], severity: 'very_high' },
        { min: 28, max: Infinity, count: 5, options: ['japji', 'sukhmani', 'jaap_sahib', 'chaupai', 'tav_prasad'], severity: 'critical' }
    ],

    // Enhanced punishment Banis with Mathila-specific options
    // NOTE: id must match actual bani IDs from BaniDB (numeric)
    // Reference: japji=2, jaap=4, shabadHazare10=5, tavPrasad=6, tavPrasadDeenan=7, chaupai=9, anand=10, rehras=21, sohila=23, sukhmani=31
    PUNISHMENT_BANIS: {
        japji: { id: 2, name: 'Japji Sahib', namePunjabi: 'ਜਪੁਜੀ ਸਾਹਿਬ', period: 'amritvela', type: 'morning' },
        sukhmani: { id: 31, name: 'Sukhmani Sahib', namePunjabi: 'ਸੁਖਮਨੀ ਸਾਹਿਬ', period: 'amritvela', type: 'morning' },
        jaap_sahib: { id: 4, name: 'Jaap Sahib', namePunjabi: 'ਜਾਪੁ ਸਾਹਿਬ', period: 'amritvela', type: 'mathila' },
        chaupai: { id: 9, name: 'Chaupai Sahib', namePunjabi: 'ਚੌਪਈ ਸਾਹਿਬ', period: 'amritvela', type: 'morning' },
        tav_prasad: { id: 6, name: 'Tav-Prasad Savaiye', namePunjabi: 'ਤਵ-ਪ੍ਰਸਾਦ ਸਵਈਯੇ', period: 'amritvela', type: 'morning' },
        anand_sahib: { id: 10, name: 'Anand Sahib', namePunjabi: 'ਆਨੰਦ ਸਾਹਿਬ', period: 'amritvela', type: 'morning' },
        rehras: { id: 21, name: 'Rehras Sahib', namePunjabi: 'ਰਹਰਾਸ ਸਾਹਿਬ', period: 'rehras', type: 'evening' },
        kirtan_sohila: { id: 23, name: 'Kirtan Sohila', namePunjabi: 'ਕੀਰਤਨ ਸੋਹਿਲਾ', period: 'sohila', type: 'night' }
    },

    // Mathila-specific penalty configuration
    MATHILA_CONFIG: {
        minMalasForComplete: 1, // Minimum malas to consider Mathila complete
        gracePeriodHours: 2, // Grace period after Amritvela
        penaltyMultiplier: 1.5 // Extra penalty for missing Mathila
    },

    STORAGE_KEY: 'nitnemTracker_streakSaver',
    ATTENDANCE_KEY: 'nitnemTracker_weakAttendance',
    PUNISHMENT_USAGE_KEY: 'nitnemTracker_punishmentUsage',
    continuousCheckInterval: null,

    // Punishment limit system (5 saves per month - like Snapchat)
    PUNISHMENT_CONFIG: {
        maxSavesPerMonth: 5,          // Only 5 punishment saves per month (like Snapchat)
        monthlyResetDay: 1            // Reset on 1st of each month
    },

    /**
     * Initialize Streak Saver
     */
    init() {
        this.checkAndCleanupExpired();
        this.initializePunishmentLimitSystem(); // Initialize Snapchat-style monthly limits

        // ═══ 6 AM AUTO-CHECK: Ensure streak is evaluated on first app open ═══
        // If it's past 6 AM and we haven't checked today, run immediately.
        // This covers the case where user opens the app hours after 6 AM.
        try {
            const lastCheckDate = localStorage.getItem('streak_last_auto_check_date');
            const today = Utils.getTodayString();
            if (lastCheckDate !== today && new Date().getHours() >= 6) {
                console.log('[StreakSaver] Auto-check: first open past 6 AM today');
                localStorage.setItem('streak_last_auto_check_date', today);
                this.checkStreakBreak();
            } else {
                this.checkStreakBreak();
            }
        } catch (e) {
            this.checkStreakBreak();
        }

        this.renderPunishmentUI();

        // ═══ ENHANCED: Add continuous check every 5 minutes for 6 AM threshold ═══
        // This ensures streak saver activates even if user stays on page past 6 AM
        this.startContinuousCheck();
    },

    /**
     * Initialize Snapchat-style Punishment Limit System
     * User gets 5 punishment saves per month - resets on 1st
     */
    initializePunishmentLimitSystem() {
        const usageData = this.getPunishmentUsageData();
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        // Reset monthly usage if new month
        if (usageData.month !== currentMonth) {
            this.resetMonthlyPunishmentUsage();
            console.log('[StreakSaver] 🔄 Monthly punishment usage reset to 5');
        }
    },

    /**
     * Get punishment usage data (Snapchat-style monthly tracking)
     */
    getPunishmentUsageData() {
        try {
            const raw = localStorage.getItem(this.PUNISHMENT_USAGE_KEY);
            if (!raw) {
                return this.createDefaultPunishmentUsageData();
            }
            return JSON.parse(raw);
        } catch (e) {
            console.warn('[StreakSaver] Could not parse punishment usage data:', e);
            return this.createDefaultPunishmentUsageData();
        }
    },

    /**
     * Create default punishment usage data
     */
    createDefaultPunishmentUsageData() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        return {
            month: currentMonth,
            savesUsed: 0,
            savesRemaining: this.PUNISHMENT_CONFIG.maxSavesPerMonth,
            history: []
        };
    },

    /**
     * Save punishment usage data
     */
    savePunishmentUsageData(data) {
        localStorage.setItem(this.PUNISHMENT_USAGE_KEY, JSON.stringify(data));
    },

    /**
     * Reset monthly punishment usage (called on 1st of month)
     */
    resetMonthlyPunishmentUsage() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const usageData = {
            month: currentMonth,
            savesUsed: 0,
            savesRemaining: this.PUNISHMENT_CONFIG.maxSavesPerMonth,
            history: []
        };
        this.savePunishmentUsageData(usageData);
    },

    /**
     * Check if user has punishment saves remaining this month
     */
    hasPunishmentSavesRemaining() {
        const usageData = this.getPunishmentUsageData();
        return usageData.savesRemaining > 0;
    },

    /**
     * Use one punishment save (called when punishment is completed)
     */
    usePunishmentSave(reason) {
        const usageData = this.getPunishmentUsageData();
        
        if (usageData.savesRemaining <= 0) {
            return false;
        }

        usageData.savesUsed++;
        usageData.savesRemaining--;
        usageData.history.push({
            date: new Date().toISOString(),
            reason: reason,
            streakSaved: StreakManager.state.currentStreak
        });

        this.savePunishmentUsageData(usageData);
        console.log(`[StreakSaver] Punishment save used - ${usageData.savesRemaining}/5 remaining this month`);
        return true;
    },

    /**
     * Start continuous streak saver check (runs every 5 minutes)
     * FIXED: Reduced frequency to prevent performance issues
     */
    startContinuousCheck() {
        // Clear any existing interval
        if (this.continuousCheckInterval) {
            clearInterval(this.continuousCheckInterval);
        }

        // Check every 5 minutes instead of every minute to reduce performance impact
        this.continuousCheckInterval = setInterval(() => {
            this.checkStreakBreak();
        }, 5 * 60 * 1000); // 5 minutes

        console.log('[StreakSaver] Continuous check started (every 5 minutes)');
    },

    /**
     * Stop continuous check (call when page unloads)
     */
    stopContinuousCheck() {
        if (this.continuousCheckInterval) {
            clearInterval(this.continuousCheckInterval);
            this.continuousCheckInterval = null;
            console.log('[StreakSaver] Continuous check stopped');
        }
    },

    /**
     * Check if streak was broken and offer saver option (enhanced with Mathila & weak attendance)
     */
    checkStreakBreak() {
        const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        const malaLog = StorageManager.load(CONFIG.STORAGE_KEYS.MALA_LOG, {});
        const today = Utils.getTodayString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toLocaleDateString('en-CA');

        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();
        const hasStreak = StreakManager.state.currentStreak > 0;

        // Check if user already dismissed the streak saver this session
        const dismissedKey = 'streakSaverDismissed_' + today;
        if (sessionStorage.getItem(dismissedKey) === 'true') return;

        // ═══════════════════════════════════════════════════════════════
        // RETROACTIVE CHECK: User missed yesterday's Amritvela & Nitnem
        // ═══════════════════════════════════════════════════════════════
        const missedYesterday = !amritvelaLog[yesterdayString];

        // Check for missed Mathila (Mala Jap during Amritvela)
        const missedMathila = this.checkMissedMathila(yesterdayString);

        // Check for weak attendance pattern
        const weakAttendance = this.checkWeakAttendance();

        if (missedYesterday) {
            // Find what the streak was before yesterday was missed
            const dayBeforeYesterday = new Date();
            dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
            const dbyString = dayBeforeYesterday.toLocaleDateString('en-CA');

            const previousStreak = StreakManager.calculateHistoricalStreak(dbyString);
            const hadStreak = previousStreak > 0;

            if (hadStreak) {
                // Calculate effective streak for punishment tier
                let effectiveStreak = previousStreak;

                // Increase penalty for missed Mathila
                if (missedMathila) {
                    effectiveStreak = Math.floor(effectiveStreak * this.MATHILA_CONFIG.penaltyMultiplier);
                }

                // Store attendance info for punishment context
                this.saveAttendanceData({
                    missedAmritvela: true,
                    missedMathila: missedMathila,
                    weakAttendance: weakAttendance,
                    date: yesterdayString
                });

                // Offer saver with potentially increased punishment
                this.offerStreakSaver(effectiveStreak, {
                    missedMathila,
                    weakAttendance,
                    missedDate: yesterdayString
                });
            }
        }
    },

    /**
     * Check if user missed Mathila (Mala Jap) for a specific date
     */
    checkMissedMathila(dateStr) {
        const malaLog = StorageManager.load(CONFIG.STORAGE_KEYS.MALA_LOG, {});
        const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});

        // Mathila is Mala Jap done during Amritvela
        // If Amritvela was attended but no malas completed = missed Mathila
        const attendedAmritvela = amritvelaLog[dateStr];
        const malaData = malaLog[dateStr] || { completedMalas: 0 };

        if (attendedAmritvela && malaData.completedMalas < this.MATHILA_CONFIG.minMalasForComplete) {
            return true;
        }

        return false;
    },

    /**
     * Check for weak attendance pattern (less than 50% attendance in last 7 days)
     */
    checkWeakAttendance() {
        const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        let attendedDays = 0;

        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');
            if (amritvelaLog[dateStr]) {
                attendedDays++;
            }
        }

        // Less than 50% attendance = weak attendance
        return attendedDays < 4;
    },

    /**
     * Save attendance data for context
     */
    saveAttendanceData(data) {
        const existing = StorageManager.load(this.ATTENDANCE_KEY, []);
        existing.push(data);
        // Keep only last 30 entries
        if (existing.length > 30) existing.shift();
        StorageManager.save(this.ATTENDANCE_KEY, existing);
    },

    /**
     * Offer streak saver with punishment
     */
    offerStreakSaver(brokenStreakCount, context) {
        // Check if already has active punishment
        const existing = this.getActivePunishment();
        if (existing) return;

        // Check if user has punishment saves remaining this month (Snapchat-style 5/month limit)
        const usageData = this.getPunishmentUsageData();
        const hasSavesRemaining = usageData.savesRemaining > 0;

        // If no saves remaining, don't offer punishment - streak is lost
        if (!hasSavesRemaining) {
            Toast.error('❌ No Streak Saves Left', `You've used all 5 saves this month. Streak will reset. Saves reset on ${this.PUNISHMENT_CONFIG.monthlyResetDay}st.`);
            StreakManager.state.currentStreak = 0;
            StreakManager.saveStreakData();
            StreakManager.recalculateStreak();
            return;
        }

        // Generate punishment based on tier
        const punishment = this.generatePunishment(brokenStreakCount);

        // Save punishment data
        const saverData = {
            brokenStreak: brokenStreakCount,
            punishment: punishment,
            offeredAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            completed: false,
            punishmentBanisAdded: false,
            context: context || {},
            savesRemaining: usageData.savesRemaining  // Add remaining count
        };

        this.savePunishmentData(saverData);

        // Add punishment Banis to Ajadta Nitnem
        this.addPunishmentToNitnem(punishment);

        // Show notification
        this.showStreakSaverOffer(saverData);

        // Render UI
        this.renderPunishmentUI();

        // Update header penalty state (button, fire color, badge)
        HeaderManager.updatePenaltyState();
    },

    /**
     * Generate punishment based on streak tier with random Bani selection
     */
    generatePunishment(brokenStreak) {
        // Find appropriate tier
        const tier = this.PUNISHMENT_TIERS.find(t => brokenStreak >= t.min && brokenStreak < t.max);

        if (!tier) {
            return { type: 'japji', count: 1 };
        }

        // Randomly select a Bani type from tier options
        const randomIndex = Math.floor(Math.random() * tier.options.length);
        const selectedType = tier.options[randomIndex];

        // For longer Banis (sukhmani), use count 1, otherwise use tier count
        if (selectedType === 'sukhmani' || selectedType === 'rehras') {
            return { type: selectedType, count: 1 };
        }

        // For other Banis, use tier count
        return { type: selectedType, count: tier.count };
    },

    /**
     * Add punishment Banis to Ajadta Nitnem
     */
    addPunishmentToNitnem(punishment) {
        const selectedBanis = StorageManager.load(CONFIG.STORAGE_KEYS.SELECTED_BANIS, {
            amritvela: [],
            rehras: [],
            sohila: []
        });

        const baniInfo = this.PUNISHMENT_BANIS[punishment.type];

        // Check if punishment Bani already exists in user's Nitnem
        const period = baniInfo.period;
        if (!selectedBanis[period]) selectedBanis[period] = [];
        const existingIndex = selectedBanis[period].findIndex(b => b.id === baniInfo.id);

        if (existingIndex === -1) {
            // Add punishment Bani temporarily with proper UIDs
            for (let i = 0; i < punishment.count; i++) {
                selectedBanis[period].push({
                    ...baniInfo,
                    uid: `punishment_${baniInfo.id}_${i}_${Date.now()}`,
                    isPunishment: true,
                    punishmentIndex: i
                });
            }

            StorageManager.save(CONFIG.STORAGE_KEYS.SELECTED_BANIS, selectedBanis);

            // Update saver data
            const saverData = this.getActivePunishment();
            if (saverData) {
                saverData.punishmentBanisAdded = true;
                this.savePunishmentData(saverData);
            }

            // Refresh Nitnem display
            if (typeof NitnemManager !== 'undefined') {
                NitnemManager.loadSelectedBanis();
                NitnemManager.renderAllLists();
            }
        }
    },

    /**
     * Remove punishment Banis from Ajadta Nitnem
     */
    removePunishmentFromNitnem() {
        const selectedBanis = StorageManager.load(CONFIG.STORAGE_KEYS.SELECTED_BANIS, {
            amritvela: [],
            rehras: [],
            sohila: []
        });

        // Remove all punishment Banis
        Object.keys(selectedBanis).forEach(period => {
            selectedBanis[period] = selectedBanis[period].filter(b => !b.isPunishment);
        });

        StorageManager.save(CONFIG.STORAGE_KEYS.SELECTED_BANIS, selectedBanis);

        // Refresh Nitnem display
        if (typeof NitnemManager !== 'undefined') {
            NitnemManager.loadSelectedBanis();
            NitnemManager.renderAllLists();
        }
    },

    /**
     * Check if punishment Banis are completed
     */
    checkPunishmentCompletion() {
        const saverData = this.getActivePunishment();
        if (!saverData || saverData.completed) return;

        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});
        const today = Utils.getTodayString();
        const todayData = nitnemLog[today] || { amritvela: [], rehras: [], sohila: [] };

        const baniInfo = this.PUNISHMENT_BANIS[saverData.punishment.type];
        const period = baniInfo.period;
        const periodCompleted = todayData[period] || [];

        // Load selected banis to find punishment bani UIDs
        const selectedBanis = StorageManager.load(CONFIG.STORAGE_KEYS.SELECTED_BANIS, {});
        const periodBanis = selectedBanis[period] || [];

        // Find all punishment banis for this type
        const punishmentBanis = periodBanis.filter(b =>
            b.isPunishment && b.id === baniInfo.id
        );

        // Check if all required punishment Banis are completed
        let completedCount = 0;
        for (const punishmentBani of punishmentBanis) {
            // Check if this punishment bani's UID is in the completed list
            if (periodCompleted.includes(punishmentBani.uid)) {
                completedCount++;
            }
        }

        if (completedCount >= saverData.punishment.count) {
            this.completePunishment();
        }
    },

    /**
     * Complete punishment and save streak
     * ENHANCED: Counts toward monthly 5-save limit
     */
    completePunishment() {
        const saverData = this.getActivePunishment();
        if (!saverData) return;

        // ═══ USE ONE PUNISHMENT SAVE (counts toward 5/month limit) ═══
        const saveUsed = this.usePunishmentSave(`Saved ${saverData.brokenStreak}-day streak via punishment`);
        
        if (!saveUsed) {
            Toast.error('❌ Save Failed', 'Could not use punishment save. Please try again.');
            return;
        }

        saverData.completed = true;
        saverData.completedAt = new Date().toISOString();
        this.savePunishmentData(saverData);

        // Remove punishment Banis from Nitnem
        this.removePunishmentFromNitnem();

        // Patch the missed date so the streak doesn't break on reload!
        const missedDate = saverData.context ? saverData.context.missedDate : null;
        if (missedDate) {
            const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
            if (!amritvelaLog[missedDate]) {
                amritvelaLog[missedDate] = {
                    timestamp: new Date().toISOString(),
                    isStreakSaverPatch: true,
                    usedPunishmentSave: true  // Mark as punishment-saved
                };
                StorageManager.save(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, amritvelaLog);
            }
        }

        // Restore the streak
        const restoredStreak = saverData.brokenStreak;
        StreakManager.state.currentStreak = restoredStreak;
        StreakManager.saveStreakData();

        // Re-calculate to ensure logs are synced
        StreakManager.recalculateStreak();

        // ═══ ENHANCED: Clean up ATTENDANCE_KEY to prevent stale state ═══
        localStorage.removeItem(this.ATTENDANCE_KEY);

        // Get remaining saves for toast
        const usageData = this.getPunishmentUsageData();
        const remaining = usageData.savesRemaining;

        // Show celebration with remaining count
        Toast.success('🎉 Streak Saved!', `${restoredStreak}-day streak restored! ${remaining}/5 saves left this month.`);
        CelebrationManager.show('streakSaved');

        this.renderPunishmentUI();

        // Update header UI (remove blue fire, hide penalty button, update streak count)
        HeaderManager.updatePenaltyState();
        HeaderManager.updateStreakDisplay();
    },

    /**
     * Check and cleanup expired punishments
     */
    checkAndCleanupExpired() {
        const saverData = this.getActivePunishment();
        if (!saverData) return;

        const now = new Date();
        const expiresAt = new Date(saverData.expiresAt);

        if (now > expiresAt && !saverData.completed) {
            // Punishment expired - streak breaks
            this.removePunishmentFromNitnem();
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.ATTENDANCE_KEY);
            StreakManager.state.currentStreak = 0;
            StreakManager.saveStreakData();
            StreakManager.recalculateStreak();
            HeaderManager.updatePenaltyState();
            HeaderManager.updateStreakDisplay();
            if (typeof UIManager !== 'undefined' && typeof UIManager.updateStatsDashboard === 'function') {
                UIManager.updateStatsDashboard();
            }
            Toast.info('⏰ Streak Saver Expired', 'Your streak has been reset. Start fresh today!');
        }
    },

    /**
     * Show streak saver offer notification
     */
    showStreakSaverOffer(saverData) {
        const punishment = saverData.punishment;
        const baniName = this.PUNISHMENT_BANIS[punishment.type].name;
        const count = punishment.count;

        let message = '';
        if (count === 1) {
            message = `Complete 1 ${baniName} within 24h to save your ${saverData.brokenStreak}-day streak!`;
        } else {
            message = `Complete ${count}× ${baniName} within 24h to save your ${saverData.brokenStreak}-day streak!`;
        }

        // Add remaining saves info (Snapchat-style)
        message += ` (${saverData.savesRemaining}/5 saves left this month)`;

        // Show toast notification
        Toast.warning('⚡ Streak Saver Available!', message, 10000);

        // Show modal with details
        this.showStreakSaverModal(saverData);
    },

    /**
     * Show streak saver modal (Snapchat-style - punishment only, shows X/5 saves)
     */
    showStreakSaverModal(saverData) {
        const punishment = saverData.punishment;
        const baniInfo = this.PUNISHMENT_BANIS[punishment.type];
        const expiresAt = new Date(saverData.expiresAt);
        const timeRemaining = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60));

        let punishmentText = '';
        if (baniInfo) {
            punishmentText = `Complete ${baniInfo.name} × ${punishment.count}`;
        } else {
            punishmentText = `Complete ${punishment.type} × ${punishment.count}`;
        }

        const modalHTML = `
            <div class="modal-overlay active" id="streakSaverModal" style="pointer-events: auto;">
                <div class="modal-container streak-saver-modal">
                    <div class="modal-header">
                        <div class="streak-saver-icon">⚡</div>
                        <h3>Streak Saver Available!</h3>
                        <p class="streak-saver-subtitle">Your ${saverData.brokenStreak}-day streak can be saved!</p>
                    </div>
                    <div class="modal-body">
                        <div class="punishment-card">
                            <div class="punishment-icon">📿</div>
                            <div class="punishment-details">
                                <h4>Punishment Task</h4>
                                <p class="punishment-text">${punishmentText}</p>
                                <p class="punishment-note">Complete within <strong>${timeRemaining} hours</strong></p>
                            </div>
                        </div>
                        <div class="punishment-saves-info">
                            <div class="saves-icon">💾</div>
                            <div class="saves-text">
                                <strong>Streak Saves: ${saverData.savesRemaining}/5 left this month</strong>
                                <p>Complete punishment to use 1 save. Resets on 1st of each month.</p>
                            </div>
                        </div>
                        <div class="punishment-explanation">
                            <p>💡 Complete the punishment Bani to restore your ${saverData.brokenStreak}-day streak!</p>
                            <p class="punishment-warning">⚠️ If you decline, your streak will be reset to 0.</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn secondary" onclick="StreakSaverManager.declineStreakSaver()">
                            Decline (Lose Streak)
                        </button>
                        <button class="modal-btn primary" onclick="StreakSaverManager.acceptStreakSaver()">
                            Accept Punishment (${saverData.savesRemaining}/5)
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    /**
     * Accept streak saver punishment
     */
    acceptStreakSaver() {
        const saverData = this.getActivePunishment();
        const remaining = saverData ? saverData.savesRemaining : 5;
        
        document.getElementById('streakSaverModal')?.remove();
        Toast.success('✅ Punishment Accepted', `Complete the Bani to save your streak! (${remaining}/5 saves left)`);
    },

    /**
     * Decline streak saver (lose streak)
     */
    declineStreakSaver() {
        const saverData = this.getActivePunishment();
        if (saverData) {
            // Remove punishment Banis
            this.removePunishmentFromNitnem();
            // Clear streak saver data
            localStorage.removeItem(this.STORAGE_KEY);
            // Reset streak
            StreakManager.state.currentStreak = 0;
            StreakManager.saveStreakData();
        }
        document.getElementById('streakSaverModal').remove();
        Toast.info('📉 Streak Lost', 'Your streak has been reset. Start fresh today!');
        this.renderPunishmentUI();
        HeaderManager.updateStreakDisplay();
    },

    /**
     * Render punishment UI in Nitnem section
     */
    renderPunishmentUI() {
        const saverData = this.getActivePunishment();
        const existingBanner = document.getElementById('streakSaverBanner');

        if (!saverData || saverData.completed) {
            if (existingBanner) existingBanner.remove();
            return;
        }

        const expiresAt = new Date(saverData.expiresAt);
        const now = new Date();
        const hoursRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60));

        const punishment = saverData.punishment;
        const baniInfo = this.PUNISHMENT_BANIS[punishment.type];

        let statusText = '';
        if (punishment.type === 'sukhmani') {
            statusText = `Complete 1 Sukhmani Sahib - ${hoursRemaining}h remaining`;
        } else {
            statusText = `Complete ${punishment.count} Japji Sahib - ${hoursRemaining}h remaining`;
        }

        const bannerHTML = `
            <div id="streakSaverBanner" class="streak-saver-banner" onclick="StreakSaverManager.showStreakSaverDetails()">
                <div class="banner-content">
                    <span class="banner-icon">⚡</span>
                    <div class="banner-text">
                        <strong>Streak Saver Active!</strong>
                        <span>${statusText}</span>
                    </div>
                </div>
                <div class="banner-progress">
                    <div class="banner-progress-bar" style="width: ${(hoursRemaining / 24) * 100}%"></div>
                </div>
            </div>
        `;

        if (existingBanner) {
            existingBanner.outerHTML = bannerHTML;
        } else {
            const nitnemSection = document.getElementById('nitnemProgressSection');
            if (nitnemSection) {
                nitnemSection.insertAdjacentHTML('afterbegin', bannerHTML);
            }
        }
    },

    /**
     * Show streak saver details (called when banner is clicked)
     */
    showStreakSaverDetails() {
        const saverData = this.getActivePunishment();
        if (!saverData || saverData.completed) return;

        this.showStreakSaverModal(saverData);
    },

    /**
     * Get active punishment data
     */
    getActivePunishment() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.warn('[StreakSaver] Could not parse punishment data:', e);
            return null;
        }
    },

    /**
     * Save punishment data
     */
    savePunishmentData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
};

/* -----------------------------------------------------------------------------
   SECTION 21: ACHIEVEMENT SYSTEM
   ----------------------------------------------------------------------------- */

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
            grid: document.getElementById('achievementsGrid'),
            summaryBadge: document.getElementById('achievementSummaryBadge'),
            progressPill: document.getElementById('achievementsProgressPill'),
            progressBarFill: document.getElementById('achievementsProgressBarFill')
        };

        // Load achievements data
        await this.loadAchievements();

        // Load unlocked achievements
        this.loadUnlockedAchievements();

        // Automatically evaluate user storage for unlocked achievements
        this.checkAll();

        // Render achievements
        this.renderAchievements();
        this.updateSummaryCounts();
    },

    /**
     * Evaluate all achievement conditions against storage logs
     */
    checkAll() {
        try {
            const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
            const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});
            const malaLog = StorageManager.load(CONFIG.STORAGE_KEYS.MALA_LOG, {});
            const streakData = StorageManager.load(CONFIG.STORAGE_KEYS.STREAK, {});
            
            const currentStreak = streakData.currentStreak || streakData.streak || 0;
            const longestStreak = streakData.longestStreak || 0;
            const maxStreak = Math.max(currentStreak, longestStreak);

            // 1. Early Riser (first-amritvela)
            if (Object.keys(amritvelaLog).length > 0 || Object.values(amritvelaLog).some(v => v)) {
                this.unlockSilent('first-amritvela');
            }

            // 2. Week Warrior (week-streak)
            if (maxStreak >= 7) {
                this.unlockSilent('week-streak');
            }

            // 3. Month Master (month-streak)
            if (maxStreak >= 30) {
                this.unlockSilent('month-streak');
            }

            // 4. Mala Master (mala-master)
            let hasMala = false;
            if (typeof malaLog === 'object') {
                for (const k in malaLog) {
                    const entry = malaLog[k];
                    if (entry && (entry.completedMalas >= 1 || entry.count >= 108 || entry >= 108)) {
                        hasMala = true;
                        break;
                    }
                }
            }
            if (hasMala) {
                this.unlockSilent('mala-master');
            }

            // 5. Nitnem Complete (nitnem-complete)
            let hasNitnemComplete = false;
            if (typeof nitnemLog === 'object') {
                for (const k in nitnemLog) {
                    const entry = nitnemLog[k];
                    if (entry && (entry.completed === true || entry.percentage === 100)) {
                        hasNitnemComplete = true;
                        break;
                    }
                }
            }
            if (hasNitnemComplete) {
                this.unlockSilent('nitnem-complete');
            }

            // 6. Perfect Week (perfect-week)
            if (maxStreak >= 7 || Object.keys(amritvelaLog).length >= 7) {
                this.unlockSilent('perfect-week');
            }
        } catch (err) {
            console.warn('⚠️ Error checking achievements:', err);
        }
        this.updateSummaryCounts();
    },

    unlockSilent(achievementId) {
        if (!this.unlockedAchievements.includes(achievementId)) {
            this.unlockedAchievements.push(achievementId);
            this.saveUnlockedAchievements();
        }
    },

    updateSummaryCounts() {
        const total = (Array.isArray(this.achievements) && this.achievements.length) ? this.achievements.length : 6;
        const unlockedCount = Array.isArray(this.unlockedAchievements) ? this.unlockedAchievements.length : 0;
        const pct = Math.round((unlockedCount / total) * 100);

        const summaryBadge = document.getElementById('achievementSummaryBadge');
        if (summaryBadge) {
            summaryBadge.textContent = `🏆 ${unlockedCount}/${total}`;
        }

        const progressPill = document.getElementById('achievementsProgressPill');
        if (progressPill) {
            progressPill.textContent = `🏆 ${unlockedCount} of ${total} Unlocked (${pct}%)`;
        }

        const barFill = document.getElementById('achievementsProgressBarFill');
        if (barFill) {
            barFill.style.width = `${pct}%`;
        }
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
        const loaded = StorageManager.load(CONFIG.STORAGE_KEYS.ACHIEVEMENTS, []);
        // FIX: Ensure it's an array - localStorage might have corrupted data
        this.unlockedAchievements = Array.isArray(loaded) ? loaded : [];
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

        this.updateSummaryCounts();
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

        this.updateSummaryCounts();

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
        if (!this.unlockedAchievements.includes(ACHIEVEMENT_IDS.FIRST_AMRITVELA)) {
            this.unlock(ACHIEVEMENT_IDS.FIRST_AMRITVELA);
        }
        this.checkAll();
    },

    /**
     * Check Nitnem complete achievement
     */
    checkNitnemComplete() {
        if (!this.unlockedAchievements.includes(ACHIEVEMENT_IDS.NITNEM_COMPLETE)) {
            this.unlock(ACHIEVEMENT_IDS.NITNEM_COMPLETE);
        }
        this.checkAll();
    },

    /**
     * Check Mala Master achievement
     */
    checkMalaMaster(completedMalas) {
        if (completedMalas >= 1 && !this.unlockedAchievements.includes(ACHIEVEMENT_IDS.MALA_MASTER)) {
            this.unlock(ACHIEVEMENT_IDS.MALA_MASTER);
        }
        this.checkAll();
    },

    /**
     * Check Perfect Week achievement
     */
    checkPerfectWeek() {
        const rate = AlarmManager.getObedienceRate();
        if (rate === 100 && !this.unlockedAchievements.includes(ACHIEVEMENT_IDS.PERFECT_WEEK)) {
            this.unlock(ACHIEVEMENT_IDS.PERFECT_WEEK);
        }
        this.checkAll();
    }
};

/**
 * PothiCardManager - Real-Time Dynamic Data Renderer for My Pothi Card
 */
const PothiCardManager = {
    init() {
        this.updateCard();
        // Listen for all possible storage/sync events from My Pothi and Nitnem Tracker
        window.addEventListener('storage', () => this.updateCard());
        window.addEventListener('nitnemUpdated', () => this.updateCard());
        window.addEventListener('dashboardRefresh', () => this.updateCard());
        window.addEventListener('statsUpdated', () => this.updateCard());
        document.addEventListener('nitnemCompleted', () => this.updateCard());
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) this.updateCard();
        });
    },

    updateCard() {
        const card = document.getElementById('pothiRedirectCard');
        if (!card) return;

        const today = new Date().toLocaleDateString('en-CA');

        // Complete Master Bani ID to Gurmukhi Name Mapping matching BaniDB / My Pothi
        const BANI_MAP = {
            1: { id: 1, name: 'Japji Sahib', punjabi: 'ਜਪੁਜੀ ਸਾਹਿਬ' },
            2: { id: 2, name: 'Japji Sahib', punjabi: 'ਜਪੁਜੀ ਸਾਹਿਬ' },
            3: { id: 3, name: 'Shabad Hazare', punjabi: 'ਸ਼ਬਦ ਹਜ਼ਾਰੇ' },
            4: { id: 4, name: 'Jaap Sahib', punjabi: 'ਜਾਪੁ ਸਾਹਿਬ' },
            5: { id: 5, name: 'Shabad Hazare P10', punjabi: 'ਸ਼ਬਦ ਹਜ਼ਾਰੇ ਪਾ: ੧੦' },
            6: { id: 6, name: 'Tav Prasad Savaiye', punjabi: 'ਤ੍ਵ ਪ੍ਰਸਾਦਿ' },
            7: { id: 7, name: 'Tav Prasad Savaiye', punjabi: 'ਤ੍ਵ ਪ੍ਰਸਾਦਿ' },
            8: { id: 8, name: 'Akal Ustat Chaupai', punjabi: 'ਅਕਾਲ ਉਸਤਤਿ ਚੌਪਈ' },
            9: { id: 9, name: 'Chaupai Sahib', punjabi: 'ਚੌਪਈ ਸਾਹਿਬ' },
            10: { id: 10, name: 'Anand Sahib', punjabi: 'ਅਨੰਦੁ ਸਾਹਿਬ' },
            11: { id: 11, name: 'Lavan', punjabi: 'ਲਾਵਾਂ' },
            12: { id: 12, name: 'Chandi Charitra', punjabi: 'ਚੰਡੀ ਚਰਿਤ੍ਰ' },
            13: { id: 13, name: 'Chandi Di Vaar', punjabi: 'ਚੰਡੀ ਦੀ ਵਾਰ' },
            19: { id: 19, name: 'Shastar Naam Mala', punjabi: 'ਸ਼ਸਤ੍ਰ ਨਾਮ ਮਾਲਾ' },
            21: { id: 21, name: 'Rehras Sahib', punjabi: 'ਰਹਿਰਾਸ ਸਾਹਿਬ' },
            22: { id: 22, name: 'Aarti', punjabi: 'ਆਰਤੀ' },
            23: { id: 23, name: 'Kirtan Sohila', punjabi: 'ਕੀਰਤਨ ਸੋਹਿਲਾ' },
            24: { id: 24, name: 'Ardas', punjabi: 'ਅਰਦਾਸ' },
            27: { id: 27, name: 'Barah Maha', punjabi: 'ਬਾਰਹ ਮਾਹਾ' },
            29: { id: 29, name: 'Akal Ustat', punjabi: 'ਅਕਾਲ ਉਸਤਤਿ' },
            30: { id: 30, name: 'Salok Mahalla 9', punjabi: 'ਸਲੋਕ ਮਹਲਾ ੯' },
            31: { id: 31, name: 'Sukhmani Sahib', punjabi: 'ਸੁਖਮਨੀ ਸਾਹਿਬ' },
            32: { id: 32, name: 'Sukhmana Sahib', punjabi: 'ਸੁਖਮਨਾ ਸਾਹਿਬ' },
            33: { id: 33, name: 'Bavan Akhri', punjabi: 'ਬਾਵਨ ਅਖਰੀ' },
            34: { id: 34, name: 'Sidh Gosht', punjabi: 'ਸਿੱਧ ਗੋਸਟਿ' },
            35: { id: 35, name: 'Dakhni Oankar', punjabi: 'ਦਖਣੀ ਓਅੰਕਾਰ' },
            36: { id: 36, name: 'Dukh Bhanjani Sahib', punjabi: 'ਦੁਖ ਭੰਜਨੀ ਸਾਹਿਬ' },
            38: { id: 38, name: 'Raag Mala', punjabi: 'ਰਾਗ ਮਾਲਾ' },
            53: { id: 53, name: 'Ugardanti', punjabi: 'ਉਗ੍ਰਦੰਤੀ' },
            77: { id: 77, name: 'Salok Bhagat Kabir', punjabi: 'ਸਲੋਕ ਕਬੀਰ ਜੀ' },
            78: { id: 78, name: 'Salok Sheikh Farid', punjabi: 'ਸਲੋਕ ਫਰੀਦ ਜੀ' },
            90: { id: 90, name: 'Asa Di Vaar', punjabi: 'ਆਸਾ ਦੀ ਵਾਰ' }
        };

        // 1. Get Raw User's Pothi Banis from storage
        let rawUserBanis = [];

        // Source A: anhad_my_pothi_data
        try {
            const rawData = localStorage.getItem('anhad_my_pothi_data');
            if (rawData) {
                const parsed = JSON.parse(rawData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    rawUserBanis = parsed;
                }
            }
        } catch (e) {}

        // Source B: anhad_my_pothi (array of IDs)
        if (rawUserBanis.length === 0) {
            try {
                const rawOrder = localStorage.getItem('anhad_my_pothi');
                if (rawOrder) {
                    const parsed = JSON.parse(rawOrder);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        rawUserBanis = parsed;
                    }
                }
            } catch (e) {}
        }

        // Source C: nitnemTracker_selectedBanis
        if (rawUserBanis.length === 0) {
            try {
                const rawSel = localStorage.getItem('nitnemTracker_selectedBanis');
                if (rawSel) {
                    const parsed = JSON.parse(rawSel);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        rawUserBanis = parsed;
                    } else if (typeof parsed === 'object') {
                        const combined = [
                            ...(parsed.amritvela || []),
                            ...(parsed.rehras || []),
                            ...(parsed.sohila || [])
                        ];
                        if (combined.length > 0) rawUserBanis = combined;
                    }
                }
            } catch (e) {}
        }

        // Default Fallback: Standard 5 Amritvela Nitnem Banis
        if (rawUserBanis.length === 0) {
            rawUserBanis = [2, 4, 6, 9, 10];
        }

        // Deduplicate & Normalize Banis
        const seenKeys = new Set();
        const userBanis = [];

        rawUserBanis.forEach(b => {
            let id = typeof b === 'number' || typeof b === 'string' ? b : (b.id || b.name);
            let numId = parseInt(id, 10);
            let mapped = (!isNaN(numId) && BANI_MAP[numId]) ? BANI_MAP[numId] : null;

            let punjabi = b.punjabi || b.nameGurmukhi || (mapped ? mapped.punjabi : null);
            let name = b.name || b.english || (mapped ? mapped.name : null);

            if (!punjabi && !name) {
                punjabi = `ਬਾਣੀ #${id}`;
                name = `Bani #${id}`;
            }

            const item = {
                id: id,
                numId: isNaN(numId) ? null : numId,
                name: name || punjabi,
                punjabi: punjabi || name
            };

            const uniqueKey = String(item.numId || item.punjabi || item.name).toLowerCase();
            if (!seenKeys.has(uniqueKey)) {
                seenKeys.add(uniqueKey);
                userBanis.push(item);
            }
        });

        // 2. Load Completed Banis for Today
        const completedSet = new Set();

        // Source A: anhad_my_pothi_completed
        try {
            const rawCompleted = localStorage.getItem('anhad_my_pothi_completed');
            if (rawCompleted) {
                const parsed = JSON.parse(rawCompleted);
                const todayList = parsed[today] || [];
                if (Array.isArray(todayList)) {
                    todayList.forEach(id => {
                        completedSet.add(String(id).toLowerCase());
                        const num = parseInt(id, 10);
                        if (!isNaN(num) && BANI_MAP[num]) {
                            completedSet.add(BANI_MAP[num].punjabi.toLowerCase());
                            completedSet.add(BANI_MAP[num].name.toLowerCase());
                        }
                    });
                }
            }
        } catch (e) {}

        // Source B: nitnemTracker_nitnemLog
        try {
            const rawLog = localStorage.getItem('nitnemTracker_nitnemLog');
            if (rawLog) {
                const parsed = JSON.parse(rawLog);
                const todayEntry = parsed[today] || {};
                if (Array.isArray(todayEntry)) {
                    todayEntry.forEach(id => completedSet.add(String(id).toLowerCase()));
                } else if (todayEntry && typeof todayEntry === 'object') {
                    const allComps = [
                        ...(todayEntry.completedBanis || []),
                        ...(todayEntry.banis || []),
                        ...(todayEntry.amritvela || []),
                        ...(todayEntry.rehras || []),
                        ...(todayEntry.sohila || [])
                    ];
                    allComps.forEach(id => {
                        completedSet.add(String(id).toLowerCase());
                        const num = parseInt(id, 10);
                        if (!isNaN(num) && BANI_MAP[num]) {
                            completedSet.add(BANI_MAP[num].punjabi.toLowerCase());
                            completedSet.add(BANI_MAP[num].name.toLowerCase());
                        }
                    });
                    if (typeof todayEntry.banis === 'object' && !Array.isArray(todayEntry.banis)) {
                        Object.keys(todayEntry.banis).forEach(k => {
                            if (todayEntry.banis[k] === true) completedSet.add(String(k).toLowerCase());
                        });
                    }
                }
            }
        } catch (e) {}

        // 3. Match user banis with completion set
        const totalCount = userBanis.length;
        let completedCount = 0;

        const baniChipsData = userBanis.map(b => {
            const bId = String(b.id || '').toLowerCase();
            const bNumId = b.numId ? String(b.numId) : '';
            const bName = String(b.name || '').toLowerCase();
            const bPunjabi = String(b.punjabi || '').toLowerCase();

            const isDone = (
                completedSet.has(bId) ||
                (bNumId && completedSet.has(bNumId)) ||
                completedSet.has(bName) ||
                completedSet.has(bPunjabi)
            );

            if (isDone) completedCount++;

            return {
                title: b.punjabi || b.name,
                isDone: isDone
            };
        });

        // 4. Update Chips UI inside .card-body
        const chipsContainer = card.querySelector('.pothi-chips-row');
        if (chipsContainer) {
            chipsContainer.innerHTML = baniChipsData.map(b => `
                <span class="pothi-chip ${b.isDone ? 'completed' : ''}">
                    ${b.isDone ? '✅ ' : '⭕ '}${b.title}
                </span>
            `).join('');
        }

        // 5. Update Stat Items inside .card-footer
        const statItems = card.querySelectorAll('.card-footer .stat-item');
        if (statItems.length >= 3) {
            const stat1Value = statItems[0].querySelector('.stat-value');
            const stat1Label = statItems[0].querySelector('.stat-label');
            if (stat1Value) stat1Value.textContent = `${completedCount}/${totalCount} Done`;
            if (stat1Label) stat1Label.textContent = completedCount === totalCount ? '100% Complete' : 'Daily Path';

            const stat2Value = statItems[1].querySelector('.stat-value');
            if (stat2Value) stat2Value.textContent = '📖 Open Pothi';

            const stat3Value = statItems[2].querySelector('.stat-value');
            const stat3Label = statItems[2].querySelector('.stat-label');
            const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            if (stat3Value) stat3Value.textContent = `⚡ ${pct}%`;
            if (stat3Label) stat3Label.textContent = 'Today Progress';
        }
    }
};

/* -----------------------------------------------------------------------------
   SECTION 22: REPORTS MANAGER
   ----------------------------------------------------------------------------- */

const ReportsManager = {
    elements: {},
    activeReport: 'weekly',
    currentMonth: new Date(),

    /**
     * Whether a NITNEM_LOG day entry counts as complete. Same rule
     * StreakManager already uses in 3 other places (recalculateStreak,
     * checkAndUpdate) — kept consistent rather than reintroducing a second
     * definition of "complete."
     * BUG FIX: this method did not previously exist on ReportsManager at
     * all (confirmed: grepping the whole file finds only call sites, no
     * definition) — every call to finalizeDay()/checkReset() at a real day
     * boundary threw "ReportsManager.isNitnemComplete is not a function",
     * silently aborting the rest of that day's reset logic (streak-break
     * check, temp-state clear, seeding today's entry) for every user, every
     * day. Found by writing a real test against the real function instead
     * of a mock.
     */
    isNitnemComplete(dayData) {
        return !!(dayData && (dayData.completed === true || dayData.percentage === 100));
    },

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
     * Render weekly report with safety checks
     */
    renderWeeklyReport() {
        // Safety check for generator availability
        if (!this.generator || typeof this.generator.generateWeeklyReport !== 'function') {
            console.warn('⚠️ ReportGenerator not available for weekly report');
            this.renderWeeklyReportFallback();
            return;
        }

        let report;
        try {
            report = this.generator.generateWeeklyReport();
        } catch (e) {
            console.warn('⚠️ generateWeeklyReport error:', e);
            this.renderWeeklyReportFallback();
            return;
        }

        const { start, end } = Utils.getWeekRange();

        // Use generator's daily stats
        const dailyData = [];
        const dates = this.generator.getWeekDates().reverse(); // ReportGenerator returns current to past

        dates.forEach(date => {
            const hasAmritvela = !!report.amritvela.dailyStats[date]?.woke;
            const wakeTime = report.amritvela.dailyStats[date]?.time || '';
            const nitnemStats = report.nitnem.dailyStats[date];
            const nitnemPct = nitnemStats?.percentage || 0;
            const hasNitnem = nitnemPct === 100;

            const score = (hasAmritvela ? 40 : 0) + Math.round((nitnemPct / 100) * 60);

            dailyData.push({
                date: date,
                amritvela: hasAmritvela,
                wakeTime: wakeTime,
                nitnem: hasNitnem,
                nitnemPct: nitnemPct,
                score: score
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

        // Render chart bars with Amritvela badges & tooltips
        if (this.elements.weeklyChartBars) {
            this.elements.weeklyChartBars.innerHTML = dailyData.map(day => {
                const height = day.score > 0 ? Math.max(day.score, 6) : 0;
                const barClass = day.score >= 90 ? 'full' : day.score > 0 ? 'partial' : 'empty';
                const dayName = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                
                const amritvelaBadge = day.amritvela 
                    ? `<div class="chart-amritvela-badge attended" title="🌅 Amritvela Attended ${day.wakeTime ? '(' + day.wakeTime + ')' : ''}">🌅</div>`
                    : `<div class="chart-amritvela-badge missed" title="Amritvela Missed"></div>`;
                
                const tooltipText = `${dayName}: ${day.amritvela ? '🌅 Amritvela Attended' : '❌ Amritvela Missed'} | 📖 Nitnem ${day.nitnemPct}%`;

                return `
                    <div class="chart-bar" title="${tooltipText}" data-tooltip="${tooltipText}">
                        ${amritvelaBadge}
                        <div class="bar-fill-track">
                            <div class="bar-fill ${barClass} ${day.amritvela ? 'has-amritvela' : ''}" style="height: ${height}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Update insight
        this.updateWeeklyInsight(report.amritvela.amritvelaWakeups, report.nitnem.completeDays, alarmRate);
    },

    /**
     * Fallback render for weekly report when generator fails
     */
    renderWeeklyReportFallback() {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toLocaleDateString('en-CA'));
        }

        const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});

        let amritvelaDays = 0;
        let nitnemDays = 0;

        const dailyData = dates.map(date => {
            const woke = !!amritvelaLog[date];
            if (woke) amritvelaDays++;

            const nitnemEntry = nitnemLog[date] || {};
            const completedCount = typeof nitnemEntry === 'object' ? Object.keys(nitnemEntry).length : (nitnemEntry ? 5 : 0);
            if (completedCount >= 5) nitnemDays++;
            const nitnemPct = Math.min(100, Math.round((completedCount / 5) * 100));

            const score = (woke ? 40 : 0) + Math.round((nitnemPct / 100) * 60);

            return {
                date,
                amritvela: woke,
                nitnemPct,
                score
            };
        });

        const amritvelaRate = Math.round((amritvelaDays / 7) * 100);
        const nitnemRate = Math.round((nitnemDays / 7) * 100);

        if (this.elements.weeklyAmritvelaFill) {
            this.elements.weeklyAmritvelaFill.style.width = `${amritvelaRate}%`;
        }
        if (this.elements.weeklyAmritvelaValue) {
            this.elements.weeklyAmritvelaValue.textContent = `${amritvelaDays}/7`;
        }

        if (this.elements.weeklyNitnemFill) {
            this.elements.weeklyNitnemFill.style.width = `${nitnemRate}%`;
        }
        if (this.elements.weeklyNitnemValue) {
            this.elements.weeklyNitnemValue.textContent = `${nitnemDays}/7`;
        }

        if (this.elements.weeklyChartBars) {
            this.elements.weeklyChartBars.innerHTML = dailyData.map(day => {
                const height = day.score > 0 ? Math.max(day.score, 6) : 0;
                const barClass = day.score >= 90 ? 'full' : day.score > 0 ? 'partial' : 'empty';
                const dayName = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                
                const amritvelaBadge = day.amritvela 
                    ? `<div class="chart-amritvela-badge attended" title="🌅 Amritvela Attended">🌅</div>`
                    : `<div class="chart-amritvela-badge missed" title="Amritvela Missed"></div>`;

                const tooltipText = `${dayName}: ${day.amritvela ? '🌅 Amritvela Attended' : '❌ Amritvela Missed'} | 📖 Nitnem ${day.nitnemPct}%`;

                return `
                    <div class="chart-bar" title="${tooltipText}" data-tooltip="${tooltipText}">
                        ${amritvelaBadge}
                        <div class="bar-fill-track">
                            <div class="bar-fill ${barClass} ${day.amritvela ? 'has-amritvela' : ''}" style="height: ${height}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        this.updateWeeklyInsight(amritvelaDays, nitnemDays, 0);
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
            if (hasAmritvela && amritvelaLog[dateString]?.time) {
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
     * Export report - Immediately download data.json and show status modal
     */
    exportReport() {
        // Generate comprehensive backup data
        const backupData = this.generateBackupData();
        
        // Immediately trigger direct file download of data.json
        this.downloadBackupFile(backupData, 'data.json');

        // Also show export modal with download status and file details
        this.showExportModal(backupData);
    },

    /**
     * Generate comprehensive backup data including My Pothi
     *
     * Reuses StorageManager.exportData() — the same canonical, CONFIG.STORAGE_KEYS-based
     * payload that Settings > Import Data reads — so a backup produced here can always be
     * restored from there. Only cosmetic/metadata fields are layered on top; we intentionally
     * do NOT hand-roll a second camelCase key scheme for the same underlying data (that
     * divergence is what previously made these backups silently fail to import).
     */
    generateBackupData() {
        const today = Utils.getTodayString();

        // Canonical data payload (identical shape to StorageManager.exportData()).
        const nitnemData = JSON.parse(StorageManager.exportData());

        // Cosmetic/metadata fields for this backup file only.
        nitnemData.exportDate = today;
        nitnemData.exportTimestamp = new Date().toISOString();
        nitnemData.appVersion = '2.0';

        return nitnemData;
    },

    /**
     * Show export modal with download progress bar & multi-sharing options
     */
    showExportModal(data) {
        const filename = 'data.json';
        const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        const fileSizeKb = (jsonStr.length / 1024).toFixed(1);

        let modal = document.getElementById('exportModal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'exportModal';
        modal.innerHTML = `
            <div class="modal-backdrop" data-close-export></div>
            <div class="modal-container export-modal-container">
                <div class="modal-handle"></div>
                <div class="modal-header">
                    <h2 class="modal-title">📥 Export Complete App Backup</h2>
                    <button class="modal-close-btn" data-close-export aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="modal-body export-modal-body">
                    <!-- Progress & Status Card -->
                    <div class="export-progress-card">
                        <div class="export-progress-header">
                            <span class="export-progress-title">Backup Generation Status</span>
                            <span class="export-progress-badge success" id="exportStatusBadge">Ready</span>
                        </div>
                        <div class="export-progress-track">
                            <div class="export-progress-fill" id="exportProgressBar" style="width: 100%;"></div>
                        </div>
                        <div class="export-progress-footer">
                            <span id="exportProgressSubtext">Complete All-App JSON backup payload generated (100% of data)</span>
                            <span id="exportProgressPercent">100%</span>
                        </div>
                    </div>

                    <!-- Included Content Section -->
                    <div class="export-content-section">
                        <span class="export-section-label">Included in this Complete Backup:</span>
                        <div class="export-chips-grid">
                            <div class="export-chip"><span class="chip-icon">📖</span> Nitnem History</div>
                            <div class="export-chip"><span class="chip-icon">🌅</span> Amritvela Logs</div>
                            <div class="export-chip"><span class="chip-icon">📿</span> Mala & Simran Logs</div>
                            <div class="export-chip"><span class="chip-icon">📚</span> My Pothi Banis & Progress</div>
                            <div class="export-chip"><span class="chip-icon">📖</span> Sehaj Paath Data</div>
                            <div class="export-chip"><span class="chip-icon">🧘</span> Naam Abhyas History</div>
                            <div class="export-chip"><span class="chip-icon">🏆</span> All Achievements</div>
                            <div class="export-chip"><span class="chip-icon">⚙️</span> App & Reader Settings</div>
                            <div class="export-chip"><span class="chip-icon">🔖</span> Favorites & Bookmarks</div>
                        </div>
                    </div>

                    <!-- File Details Badge with Direct Download Button -->
                    <div class="export-file-meta">
                        <div class="export-file-info">
                            <span class="export-file-icon">📄</span>
                            <div class="export-file-details">
                                <span class="export-filename">${filename}</span>
                                <span class="export-filesize">${fileSizeKb} KB • Universal JSON Backup</span>
                            </div>
                        </div>
                        <button class="btn btn-primary export-card-download-btn" id="downloadCardBtn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            <span>Save File</span>
                        </button>
                    </div>
                </div>

                <div class="modal-footer export-modal-footer">
                    <button class="btn btn-secondary modal-btn" id="shareBackupBtn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        <span>Share</span>
                    </button>
                    <button class="btn btn-secondary modal-btn" id="copyBackupBtn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        <span>Copy JSON</span>
                    </button>
                    <button class="btn btn-primary modal-btn" id="downloadBackupBtn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        <span>Save File</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelectorAll('[data-close-export]').forEach(el => {
            el.addEventListener('click', () => this.closeExportModal());
        });

        // Robust copy helper
        const copyJsonToClipboard = () => {
            const performFallback = () => {
                try {
                    const ta = document.createElement('textarea');
                    ta.value = jsonStr;
                    ta.style.position = 'fixed';
                    ta.style.top = '-9999px';
                    ta.style.left = '-9999px';
                    ta.setAttribute('readonly', '');
                    document.body.appendChild(ta);
                    ta.focus();
                    ta.select();
                    ta.setSelectionRange(0, ta.value.length);
                    const successful = document.execCommand('copy');
                    document.body.removeChild(ta);
                    if (successful) {
                        Toast.success('Copied!', 'Complete JSON backup copied to clipboard');
                        HapticManager.success();
                    } else {
                        throw new Error('execCommand copy failed');
                    }
                } catch (e) {
                    Toast.error('Copy Failed', 'Please use Save File option');
                }
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(jsonStr).then(() => {
                    Toast.success('Copied!', 'Complete JSON backup copied to clipboard');
                    HapticManager.success();
                }).catch(() => {
                    performFallback();
                });
            } else {
                performFallback();
            }
        };

        // Share button handler
        const shareBtn = modal.querySelector('#shareBackupBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareBackupFile(data, filename);
            });
        }

        // Copy JSON button handler
        const copyBtn = modal.querySelector('#copyBackupBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', copyJsonToClipboard);
        }

        // Save File button handlers (both card download & footer download)
        const downloadCardBtn = modal.querySelector('#downloadCardBtn');
        if (downloadCardBtn) {
            downloadCardBtn.addEventListener('click', () => {
                this.downloadBackupFile(data, filename);
            });
        }

        const downloadBtn = modal.querySelector('#downloadBackupBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadBackupFile(data, filename);
            });
        }

        ModalManager.open('exportModal');
        HapticManager.selection();
    },

    /**
     * Share backup file via Web Share API or native mobile intent
     */
    shareBackupFile(data, filename) {
        try {
            const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const file = new File([blob], filename, { type: 'application/json' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                    files: [file],
                    title: 'ANHAD Complete App Backup',
                    text: 'ANHAD Complete JSON backup file'
                }).then(() => {
                    Toast.success('Shared!', 'Backup file shared successfully');
                    HapticManager.success();
                }).catch(err => {
                    if (err && err.name !== 'AbortError') {
                        Toast.error('Share Failed', 'Could not share file');
                    }
                });
            } else if (navigator.share) {
                navigator.share({
                    title: 'ANHAD Complete App Backup',
                    text: jsonStr
                }).catch(() => {});
            } else {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(jsonStr).catch(() => {});
                }
                Toast.success('Copied!', 'JSON backup copied to clipboard for sharing');
                HapticManager.success();
            }
        } catch (err) {
            console.error('Share backup error:', err);
            Toast.error('Share Error', 'Unable to share file');
        }
    },

    /**
     * Download backup file (Direct HTML5 Blob Download of data.json + Capacitor Filesystem)
     */
    downloadBackupFile(data, filename = 'anhad-progress-backup.json') {
        try {
            filename = filename || 'anhad-progress-backup.json';
            const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

            // Animate progress bar in export modal if visible
            const progressFill = document.getElementById('exportProgressBar');
            const statusBadge = document.getElementById('exportStatusBadge');
            const progressSubtext = document.getElementById('exportProgressSubtext');

            if (progressFill && statusBadge) {
                progressFill.style.width = '30%';
                statusBadge.textContent = 'Saving...';
                statusBadge.className = 'export-progress-badge active';
                if (progressSubtext) progressSubtext.textContent = `Preparing ${filename}...`;
                setTimeout(() => { progressFill.style.width = '70%'; }, 100);
            }

            const isNativeApp = !!(window.Capacitor && (
                (typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) ||
                (typeof window.Capacitor.getPlatform === 'function' && window.Capacitor.getPlatform() !== 'web') ||
                window.Capacitor.isNative
            ));

            if (isNativeApp) {
                // === ANDROID / iOS NATIVE: Write to Downloads then Share ===
                const fs = window.Capacitor?.Plugins?.Filesystem;
                const share = window.Capacitor?.Plugins?.Share;

                if (fs) {
                    // Write to DOCUMENTS directory
                    fs.writeFile({
                        path: filename,
                        data: jsonStr,
                        directory: 'DOCUMENTS',
                        encoding: 'utf8'
                    }).then((result) => {
                        // After writing, share / show open-with dialog
                        if (share) {
                            share.share({
                                title: 'ANHAD Progress Backup',
                                text: 'Your ANHAD Nitnem progress backup',
                                files: [result.uri || filename],
                                dialogTitle: 'Save or Share your backup'
                            }).catch(() => {});
                        }
                        if (progressFill) progressFill.style.width = '100%';
                        if (statusBadge) { statusBadge.textContent = 'Saved!'; statusBadge.className = 'export-progress-badge success'; }
                        if (progressSubtext) progressSubtext.textContent = `${filename} saved to Documents`;
                        Toast.success('Backup Saved!', `${filename} saved — use Share to send it`);
                        HapticManager.success();
                    }).catch((err) => {
                        console.warn('Filesystem write failed, falling back to share:', err);
                        // Fallback: use Share with base64 text
                        if (share) {
                            share.share({
                                title: 'ANHAD Progress Backup',
                                text: jsonStr,
                                dialogTitle: 'Save or Share your backup'
                            }).catch(() => Toast.error('Export Failed', 'Could not save backup'));
                        }
                    });
                } else if (share) {
                    // No filesystem plugin — share text directly
                    share.share({
                        title: 'ANHAD Progress Backup',
                        text: jsonStr,
                        dialogTitle: 'Save your backup'
                    }).then(() => {
                        Toast.success('Backup Shared!', 'Save it to Files or Drive');
                    }).catch(() => Toast.error('Export Failed', 'Could not share backup'));
                }
            } else {
                // === WEB / PWA: data URI download (avoids blob:// page open) ===
                this._triggerBlobDownload(jsonStr, filename);
            }
        } catch (error) {
            console.error('Export failed:', error);
            Toast.error('Export Failed', 'Could not save backup file');
        }
    },

    /**
     * Helper to trigger HTML5 Blob / Data URI download
     */
    _triggerBlobDownload(jsonStr, filename = 'data.json') {
        try {
            filename = filename || 'data.json';
            // Primary: data URI download — works in Chrome/Edge/Firefox and doesn't open a blob page
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
            const a = document.createElement('a');
            a.href = dataUri;
            a.download = filename;
            a.setAttribute('download', filename);
            a.style.display = 'none';
            document.body.appendChild(a);

            setTimeout(() => {
                a.click();
                setTimeout(() => { if (a.parentNode) document.body.removeChild(a); }, 800);
            }, 50);

            const progressFill = document.getElementById('exportProgressBar');
            const statusBadge = document.getElementById('exportStatusBadge');
            const progressSubtext = document.getElementById('exportProgressSubtext');

            if (progressFill) progressFill.style.width = '100%';
            if (statusBadge) {
                statusBadge.textContent = 'Downloaded!';
                statusBadge.className = 'export-progress-badge success';
            }
            if (progressSubtext) progressSubtext.textContent = `${filename} saved to Downloads`;

            Toast.success('File Downloaded!', `${filename} saved to Downloads`);
            HapticManager.success();
        } catch (err) {
            console.error('Download error:', err);
            Toast.error('Download Failed', 'Unable to download file');
        }
    },

    /**
     * Close export modal
     */
    closeExportModal() {
        const modal = document.getElementById('exportModal');
        ModalManager.close('exportModal');
        HapticManager.light();
        if (modal) {
            setTimeout(() => modal.remove(), 300);
        }
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

/* -----------------------------------------------------------------------------
   SECTION 23: CELEBRATION MANAGER
   ----------------------------------------------------------------------------- */

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

/* -----------------------------------------------------------------------------
   SECTION 23.5: ADVANCED INSIGHTS ENGINE
   ----------------------------------------------------------------------------- */

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
        if ((streakData.currentStreak || streakData.current || 0) > 0) {
            if ((streakData.currentStreak || streakData.current || 0) >= 7) {
                insights.push({
                    icon: '🔥',
                    title: 'Amazing Streak!',
                    description: `You're on a ${streakData.currentStreak || streakData.current}-day streak! Your commitment to Sikhi is inspiring.`,
                    type: 'success'
                });
            } else {
                insights.push({
                    icon: '📈',
                    title: 'Building Momentum',
                    description: `${streakData.currentStreak || streakData.current} days and counting! Keep going to reach 7 days for a special milestone.`,
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

/* -----------------------------------------------------------------------------
   SECTION 23.5.1: DATE HISTORY VIEW
   Yesterday button — date strip popup and full day detail modal
   ----------------------------------------------------------------------------- */

const DateHistoryView = {
    show() {
        document.getElementById('dateStripOverlay')?.remove();
        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});
        const selectedBanis = StorageManager.load(CONFIG.STORAGE_KEYS.SELECTED_BANIS, { amritvela: [], rehras: [], sohila: [] });
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let chipsHTML = '';
        for (let i = 29; i >= 1; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');
            const dayData = nitnemLog[dateStr];

            let effectiveTotal = 0;
            const targetEndMs = new Date(dateStr);
            targetEndMs.setHours(23, 59, 59, 999);
            const targetTime = targetEndMs.getTime();
            ['amritvela', 'rehras', 'sohila'].forEach(period => {
                (selectedBanis[period] || []).forEach(b => {
                    let addedMs = 0;
                    if (b.uid && b.uid.includes('-')) addedMs = parseInt(b.uid.split('-')[0]);
                    if (!addedMs || addedMs <= targetTime) effectiveTotal++;
                });
            });

            let completed = 0;
            if (dayData) { completed = (dayData.amritvela?.length || 0) + (dayData.rehras?.length || 0) + (dayData.sohila?.length || 0); }
            const dotClass = !dayData ? 'none' : (completed >= effectiveTotal && effectiveTotal > 0 ? '' : 'incomplete');
            chipsHTML += '<div class="date-chip" data-date="' + dateStr + '" onclick="DateHistoryView.showDayDetail(\'' + dateStr + '\')"><span class="chip-day">' + dayNames[d.getDay()] + '</span><span class="chip-num">' + d.getDate() + '</span><span class="chip-dot ' + dotClass + '"></span></div>';
        }
        const overlay = document.createElement('div');
        overlay.className = 'date-strip-overlay';
        overlay.id = 'dateStripOverlay';
        overlay.innerHTML = '<div class="date-strip-container"><div class="date-strip-header"><h3>📅 Date History</h3><button class="date-strip-close" onclick="document.getElementById(\'dateStripOverlay\').remove()">×</button></div><div class="date-strip-scroll">' + chipsHTML + '</div></div>';
        overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);
        requestAnimationFrame(function () { var scroll = overlay.querySelector('.date-strip-scroll'); if (scroll) scroll.scrollLeft = scroll.scrollWidth; });
        HapticManager.light();
    },

    showDayDetail(dateStr) {
        // Remove existing day detail if any
        document.getElementById('dayDetailOverlay')?.remove();

        var d = new Date(dateStr);
        var dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        var nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});
        var selectedBanis = StorageManager.load(CONFIG.STORAGE_KEYS.SELECTED_BANIS, { amritvela: [], rehras: [], sohila: [] });
        var dayNitnem = nitnemLog[dateStr] || {};
        var nitnemRows = ''; var totalBanis = 0; var completedBanis = 0;
        ['amritvela', 'rehras', 'sohila'].forEach(function (period) {
            var periodBanis = selectedBanis[period] || [];
            var completedUids = dayNitnem[period] || [];

            periodBanis.forEach(function (bani) {
                let addedMs = 0;
                if (bani.uid && bani.uid.includes('-')) addedMs = parseInt(bani.uid.split('-')[0]);
                const viewDate = new Date(dateStr);
                viewDate.setHours(23, 59, 59, 999);
                if (addedMs && addedMs > viewDate.getTime()) {
                    var doneCheck = completedUids.includes(bani.uid);
                    if (!doneCheck) return;
                }

                totalBanis++;
                var done = completedUids.includes(bani.uid);
                if (done) completedBanis++;
                nitnemRows += '<div class="detail-row"><span>' + (bani.nameEnglish || bani.id) + '</span><span class="detail-value ' + (done ? 'complete' : 'incomplete') + '">' + (done ? '✓' : '✗') + '</span></div>';
            });
        });
        var nitnemRate = totalBanis > 0 ? Math.round((completedBanis / totalBanis) * 100) : 0;
        var malaLog = StorageManager.load(CONFIG.STORAGE_KEYS.MALA_LOG, {});
        var dayMala = malaLog[dateStr] || {};
        var malasCompleted = dayMala.completedMalas || 0;
        var totalBeads = dayMala.totalCount || 0;
        var amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        var amritEntry = amritvelaLog[dateStr];
        var amritvelaStatus = amritEntry ? ('✓ ' + (amritEntry.time || 'Present')) : '✗ Absent';
        var amritvelaClass = amritEntry ? 'complete' : 'incomplete';
        var alarmLog = StorageManager.load(CONFIG.STORAGE_KEYS.ALARM_LOG, {});
        var dayAlarms = alarmLog[dateStr] || {};
        var aResponded = 0, aSnoozed = 0, aMissed = 0;
        Object.values(dayAlarms).forEach(function (a) {
            var st = typeof a === 'object' ? a.status : a;
            if (st === 'responded') aResponded++;
            else if (st === 'snoozed') aSnoozed++;
            else if (st === 'missed') aMissed++;
        });
        var naamSessions = 0, naamMinutes = 0;
        try { var naamHistory = JSON.parse(localStorage.getItem('naam_abhyas_history') || '{}'); var schedule = naamHistory.scheduleHistory && naamHistory.scheduleHistory[dateStr] ? naamHistory.scheduleHistory[dateStr] : {}; Object.values(schedule).forEach(function (s) { if (s.completed) { naamSessions++; naamMinutes += (s.duration || 0); } }); } catch (e) { }

        // Create stacked day detail overlay (above date strip at z-index 10001)
        var overlay = document.createElement('div');
        overlay.className = 'day-detail-overlay';
        overlay.id = 'dayDetailOverlay';
        overlay.innerHTML = '<div class="day-detail-modal"><div class="modal-header"><h3>📋 ' + dateLabel + '</h3><button class="modal-close" id="dayDetailClose">×</button></div><div class="day-detail-scrollable">' +
            '<div class="day-detail-card"><h4>🌅 Amritvela</h4><div class="detail-row"><span>Attendance</span><span class="detail-value ' + amritvelaClass + '">' + amritvelaStatus + '</span></div></div>' +
            '<div class="day-detail-card"><h4>📖 Nitnem (' + nitnemRate + '%)</h4>' + (nitnemRows || '<div class="detail-row"><span>No data</span><span class="detail-value">—</span></div>') + '</div>' +
            '<div class="day-detail-card"><h4>📿 Mala Jap</h4><div class="detail-row"><span>Malas</span><span class="detail-value">' + malasCompleted + '</span></div><div class="detail-row"><span>Total Beads</span><span class="detail-value">' + totalBeads + '</span></div></div>' +
            '<div class="day-detail-card"><h4>🧘 Naam Abhyas</h4><div class="detail-row"><span>Sessions</span><span class="detail-value">' + naamSessions + '</span></div><div class="detail-row"><span>Minutes</span><span class="detail-value">' + naamMinutes + '</span></div></div>' +
            '<div class="day-detail-card"><h4>⏰ Alarm Obedience</h4><div class="detail-row"><span>Responded</span><span class="detail-value complete">' + aResponded + '</span></div><div class="detail-row"><span>Snoozed</span><span class="detail-value">' + aSnoozed + '</span></div><div class="detail-row"><span>Missed</span><span class="detail-value incomplete">' + aMissed + '</span></div></div>' +
            '</div></div>';

        // Add backdrop click to close only day detail (keep date strip)
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        // Add close button handler
        document.body.appendChild(overlay);
        document.getElementById('dayDetailClose')?.addEventListener('click', function () {
            overlay.remove();
        });

        HapticManager.light();
    },

    /**
     * Refresh date dots in the date strip (called when state changes)
     */
    refreshDateDots() {
        const dateStrip = document.getElementById('dateStripOverlay');
        if (!dateStrip) return;

        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});
        const selectedBanis = StorageManager.load(CONFIG.STORAGE_KEYS.SELECTED_BANIS, { amritvela: [], rehras: [], sohila: [] });
        const totalPerDay = (selectedBanis.amritvela?.length || 0) + (selectedBanis.rehras?.length || 0) + (selectedBanis.sohila?.length || 0);

        // Update each date chip's dot
        const chips = dateStrip.querySelectorAll('.date-chip');
        chips.forEach(chip => {
            const dateStr = chip.dataset.date;
            if (!dateStr) return;

            let effectiveTotal = 0;
            const targetEndMs = new Date(dateStr);
            targetEndMs.setHours(23, 59, 59, 999);
            const targetTime = targetEndMs.getTime();
            ['amritvela', 'rehras', 'sohila'].forEach(period => {
                (selectedBanis[period] || []).forEach(b => {
                    let addedMs = 0;
                    if (b.uid && b.uid.includes('-')) addedMs = parseInt(b.uid.split('-')[0]);
                    if (!addedMs || addedMs <= targetTime) effectiveTotal++;
                });
            });

            const dayData = nitnemLog[dateStr];
            let completed = 0;
            if (dayData) { completed = (dayData.amritvela?.length || 0) + (dayData.rehras?.length || 0) + (dayData.sohila?.length || 0); }
            const dotClass = !dayData ? 'none' : (completed >= effectiveTotal && effectiveTotal > 0 ? '' : 'incomplete');
            const dot = chip.querySelector('.chip-dot');
            if (dot) {
                dot.className = 'chip-dot ' + dotClass;
            }
        });

        console.log('[DateHistoryView] Date dots refreshed');
    }
};

/* -----------------------------------------------------------------------------
   SECTION 23.6: CARRY-FORWARD SYSTEM
   Incomplete banis from previous day carry forward to next day
   ----------------------------------------------------------------------------- */

const CarryForwardSystem = {
    /**
     * Initialize Carry Forward System
     */
    init() {
        this.checkForCarryForward();
        this.setupDailyReset();
    },

    /**
     * Check for uncompleted banis from all missed days (accumulating carry-forward)
     */
    checkForCarryForward() {
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

        // Load existing carry-forward data (for accumulating multiple days)
        let carryForward = StorageManager.load('nt_carry_forward', {
            date: today,
            banis: []
        });

        // Ensure carryForward is for today and has banis array
        if (carryForward.date !== today) {
            carryForward = { date: today, banis: [] };
        }

        // Find all missed days since last check (up to 30 days back)
        const missedDays = this.getMissedDaysSince(lastProcessed || this.getDaysAgo(30));
        let newAccumulatedBanis = [];

        // Check each missed day for incomplete banis
        missedDays.forEach(missedDate => {
            if (nitnemLog[missedDate]) {
                const dayData = nitnemLog[missedDate];

                ['amritvela', 'rehras', 'sohila'].forEach(period => {
                    const periodBanis = selectedBanis[period] || [];
                    const completedUids = dayData[period] || [];

                    periodBanis.forEach(bani => {
                        // Only add if not already in carry-forward list
                        const alreadyCarried = carryForward.banis.some(b => b.uid === bani.uid && b.carryDate === missedDate);
                        if (!completedUids.includes(bani.uid) && !alreadyCarried) {
                            newAccumulatedBanis.push({
                                ...bani,
                                originalPeriod: period,
                                carryDate: missedDate,
                                daysOverdue: this.getDaysDifference(missedDate, today)
                            });
                        }
                    });
                });
            }
        });

        // Accumulate new banis with existing carry-forward
        if (newAccumulatedBanis.length > 0) {
            carryForward.banis = [...carryForward.banis, ...newAccumulatedBanis];
            StorageManager.save('nt_carry_forward', carryForward);

            // Group by date for notification
            const byDate = {};
            newAccumulatedBanis.forEach(b => {
                byDate[b.carryDate] = (byDate[b.carryDate] || 0) + 1;
            });

            this.showCarryForwardNotification(newAccumulatedBanis, byDate);
        }

        // Mark today as processed
        StorageManager.save('nt_carry_forward_date', today);
    },

    /**
     * Get all missed days since a given date
     */
    getMissedDaysSince(sinceDate) {
        const missed = [];
        const today = new Date();
        const since = new Date(sinceDate);
        const maxLookBack = 30; // Don't look back more than 30 days

        // If no last processed date, check yesterday only
        if (!sinceDate || sinceDate === '') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return [yesterday.toLocaleDateString('en-CA')];
        }

        // Check days from the day after last processed up to yesterday
        let checkDate = new Date(since);
        checkDate.setDate(checkDate.getDate() + 1);

        let daysChecked = 0;
        while (checkDate < today && daysChecked < maxLookBack) {
            missed.push(checkDate.toLocaleDateString('en-CA'));
            checkDate.setDate(checkDate.getDate() + 1);
            daysChecked++;
        }

        return missed;
    },

    /**
     * Get date string for N days ago
     */
    getDaysAgo(days) {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d.toLocaleDateString('en-CA');
    },

    /**
     * Get yesterday's date string
     */
    getYesterday() {
        return this.getDaysAgo(1);
    },

    /**
     * Calculate days difference between two dates
     */
    getDaysDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    },

    /**
     * Show carry-forward notification (handles accumulated banis from multiple days)
     */
    showCarryForwardNotification(incompleteBanis, byDate) {
        const count = incompleteBanis.length;
        const baniNames = incompleteBanis.slice(0, 3).map(b => b.nameEnglish).join(', ');
        const extra = count > 3 ? ` +${count - 3} more` : '';

        // Create persistent notification banner
        this.showCarryForwardBanner(incompleteBanis);

        // Show toast with multi-day info
        const uniqueDays = Object.keys(byDate || {}).length;
        const dayText = uniqueDays === 1 ? 'yesterday' : `${uniqueDays} days`;
        Toast.warning(
            `📋 ${count} Bani${count > 1 ? 's' : ''} Carried Forward`,
            `${baniNames}${extra} from ${dayText}`
        );

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Nitnem Carry-Forward', {
                body: `${count} bani${count > 1 ? 's' : ''} incomplete from ${dayText}: ${baniNames}${extra}`,
                icon: '/assets/icon-192x192.png',
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

/* -----------------------------------------------------------------------------
   SECTION 23.7: ENHANCED MALA GOAL TRACKER
   Shows progress meter with malas and total naam jap count
   ----------------------------------------------------------------------------- */

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

/* -----------------------------------------------------------------------------
   SECTION 23.8: ENHANCED AMRITVELA WEEK VIEW
   Click "This Week" to see all wake times
   ----------------------------------------------------------------------------- */

const AmritvelaWeekView = {
    /**
     * Show week view modal with all attendance times (30 days, horizontal scroll, sticky summary)
     */
    show() {
        const amritvelaLog = StorageManager.load(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, {});
        const allData = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');
            const entry = amritvelaLog[dateStr];

            allData.push({
                date: dateStr,
                dayName: dayNames[d.getDay()],
                dayNum: d.getDate(),
                month: d.toLocaleDateString('en-US', { month: 'short' }),
                attended: !!entry,
                time: entry?.time || null,
                slot: entry?.slot || null
            });
        }

        const last7 = allData.slice(-7);

        const getSlotClass = (slot) => {
            const classes = { excellent: 'green', good: 'blue', okay: 'orange', late: 'red' };
            return classes[slot] || '';
        };

        const modalHTML = `
            <div class="modal-overlay active" id="weekViewModal">
                <div class="modal-container" style="display:flex;flex-direction:column;max-height:80vh;">
                    <div class="modal-header">
                        <h3>🌅 Attendance History</h3>
                        <button class="modal-close" onclick="document.getElementById('weekViewModal').remove()">×</button>
                    </div>
                    <div class="modal-body" style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding-bottom:0;">
                        <div class="week-attendance-grid" style="flex:1;overflow-x:auto;display:flex;gap:8px;padding-bottom:8px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;">
                            ${allData.map(day => `
                                <div class="week-day-card ${day.attended ? 'attended' : 'missed'}" style="flex-shrink:0;min-width:72px;scroll-snap-align:start;">
                                    <span class="day-name">${day.dayName}</span>
                                    <span class="day-num">${day.dayNum}</span>
                                    <span style="font-size:10px;color:var(--text-tertiary)">${day.month}</span>
                                    ${day.attended
                ? `<span class="day-time ${getSlotClass(day.slot)}">${day.time}</span>`
                : `<span class="day-missed">—</span>`
            }
                                </div>
                            `).join('')}
                        </div>
                        <div class="week-summary" style="position:sticky;bottom:0;flex-shrink:0;background:var(--glass-bg,#fff);padding:12px 0 16px;border-top:1px solid var(--glass-border,rgba(0,0,0,0.08));z-index:2;">
                            <div class="summary-item">
                                <span class="summary-value">${last7.filter(d => d.attended).length}/7</span>
                                <span class="summary-label">This Week</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-value">${this.getAverageWakeTime(allData)}</span>
                                <span class="summary-label">Avg Wake Time</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-value">${this.getEarliestWake(allData)}</span>
                                <span class="summary-label">Earliest</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Auto-scroll to the right (today) after render
        requestAnimationFrame(() => {
            const grid = document.querySelector('#weekViewModal .week-attendance-grid');
            if (grid) grid.scrollLeft = grid.scrollWidth;
        });

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

/* -----------------------------------------------------------------------------
   SECTION 23.9: ENHANCED ALARM HISTORY VIEW
   Click on previous dates to see alarm details
   ----------------------------------------------------------------------------- */

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

/* -----------------------------------------------------------------------------
   SECTION 23.10: ENHANCED REPORTS CALCULATIONS
   Fix the 0/35 issue - calculate correctly based on actual banis
   ----------------------------------------------------------------------------- */

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

        // Calculate total banis per day (default to 7 if empty)
        const totalBanisPerDay =
            ((selectedBanis.amritvela?.length || 0) +
            (selectedBanis.rehras?.length || 0) +
            (selectedBanis.sohila?.length || 0)) || 7;

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
            nitnemValue.textContent = `${stats.completeDays}/7`;
        }
        if (nitnemFill) {
            nitnemFill.style.width = `${stats.percentage}%`;
        }
    }
};

/* -----------------------------------------------------------------------------
   SECTION 23.11: AI NOTIFICATION SYSTEM
   Smart reminders and notifications
   ----------------------------------------------------------------------------- */

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
                icon: '/assets/icon-192x192.png',
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

/* -----------------------------------------------------------------------------
   SECTION 24: STATISTICS MODAL
   ----------------------------------------------------------------------------- */

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
            const dayTotal = (day.amritvela?.length || 0) +
                (day.rehras?.length || 0) +
                (day.sohila?.length || 0);
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
            Math.min((streakData.currentStreak || streakData.current || 0) / 30, 1) * 25, // Streak (25%)
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

/* -----------------------------------------------------------------------------
   SECTION 24.5: DAILY RESET MANAGER (Japtab)
   Handles midnight reset and streak break detection
   ----------------------------------------------------------------------------- */

const DailyResetManager = {
    STORAGE_KEY: 'nt_last_processed_date',

    /**
     * Check if a new day has started and handle reset
     */
    checkReset() {
        const lastProcessed = StorageManager.load(this.STORAGE_KEY, '');
        const today = Utils.getTodayString();

        if (lastProcessed !== today) {
            this.handleNewDay(lastProcessed, today);
        }
    },

    /**
     * checkReset() was previously only ever called once, at app startup.
     * If the app/tab stays continuously foregrounded across local midnight
     * with no visibility change (screen stays on, app stays in front), the
     * day never rolled over until some later reload. Schedule a one-shot
     * timer for the next local midnight and have it reschedule itself, so
     * the rollover fires on its own regardless of visibility events.
     * checkReset() is idempotent (it only acts when the date actually
     * differs), so this is safe to layer on top of the existing
     * startup + visibilitychange checks without risk of double-firing.
     */
    scheduleMidnightCheck() {
        if (this._midnightTimer) clearTimeout(this._midnightTimer);
        const now = new Date();
        const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
        const msUntilMidnight = nextMidnight.getTime() - now.getTime();
        this._midnightTimer = setTimeout(() => {
            this.checkReset();
            this.scheduleMidnightCheck();
        }, msUntilMidnight);
    },

    /**
     * Handle new day logic - streak check and reset
     */
    handleNewDay(lastProcessed, today) {
        // 1. Finalize Yesterday's Data
        if (lastProcessed) {
            this.finalizeDay(lastProcessed);
        }

        // 2. Check for streak break using StreakSaverManager (includes Mathila detection)
        StreakSaverManager.checkStreakBreak();

        // 3. Reset Today's Temporary State
        localStorage.removeItem('temp_amritvela_state');
        localStorage.removeItem('temp_mala_count');

        // 4. Initialize Today's Entry if needed
        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});
        if (!nitnemLog[today]) {
            nitnemLog[today] = {
                amritvela: [],
                rehras: [],
                sohila: [],
                completed: false,
                progress: 0
            };
            StorageManager.save(CONFIG.STORAGE_KEYS.NITNEM_LOG, nitnemLog);
        }

        // 5. Save that we processed today
        StorageManager.save(this.STORAGE_KEY, today);

        Toast.info('New Day', 'Daily stats have been reset for today.');
    },

    /**
     * Finalize a day's data
     */
    finalizeDay(date) {
        const nitnemLog = StorageManager.load(CONFIG.STORAGE_KEYS.NITNEM_LOG, {});
        const dayData = nitnemLog[date];

        if (dayData) {
            const isComplete = ReportsManager.isNitnemComplete(dayData);
            dayData.finalStatus = isComplete ? 'completed' : 'incomplete';
            StorageManager.save(CONFIG.STORAGE_KEYS.NITNEM_LOG, nitnemLog);
        }
    }
};

/* -----------------------------------------------------------------------------
   SECTION 25: APP INITIALIZATION (UPDATED)
   ----------------------------------------------------------------------------- */

const initializeFullApp = async () => {
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
        await safeInit('PothiCardManager', () => PothiCardManager.init());
        await safeInit('BaniModal', () => BaniModal.init());

        // Initialize Part 2 features
        await safeInit('MalaManager', () => MalaManager.init());
        await safeInit('AlarmManager', () => AlarmManager.init());
        await safeInit('StreakManager', () => StreakManager.init());
        await safeInit('StreakSaverManager', () => StreakSaverManager.init());
        await safeInit('AchievementManager', async () => await AchievementManager.init());
        await safeInit('ReportsManager', () => ReportsManager.init());
        await safeInit('CelebrationManager', () => CelebrationManager.init());
        await safeInit('StatisticsModal', () => StatisticsModal.init());

        // Initialize settings
        await safeInit('SettingsManager', () => SettingsManager.init());

        // Initialize Premium UX (10 Features)
        await safeInit('PremiumUXManager', () => PremiumUXManager.init());

        // Add SVG gradient definitions for score circle
        try { addSVGDefinitions(); } catch (e) { console.error(e); }

        // Perform Mid-night Check after all systems (including Toast and StreakSaverManager) are initialized
        DailyResetManager.checkReset();
        DailyResetManager.scheduleMidnightCheck();

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

/* -----------------------------------------------------------------------------
   SECTION 26: SMART REMINDERS INTEGRATION
   ----------------------------------------------------------------------------- */

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

/* -----------------------------------------------------------------------------
   SECTION 27: SERVICE WORKER COMMUNICATION
   ----------------------------------------------------------------------------- */

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
            if (window.navigateTo) window.navigateTo(`../nitnem/${data.baniId}.html`); else window.location.href = `../nitnem/${data.baniId}.html`;
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

/* -----------------------------------------------------------------------------
   SECTION 28: KEYBOARD SHORTCUTS
   ----------------------------------------------------------------------------- */

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

/* -----------------------------------------------------------------------------
   SECTION 29: FINAL EVENT LISTENERS & STARTUP
   ----------------------------------------------------------------------------- */

// Export Part 2 managers (defined above CONFIG's original export block, so
// they couldn't be included there) for module/test consumption. No-op in the
// real browser, where `module` is always undefined — this exists purely so
// DailyResetManager etc. are reachable from a test file without triggering
// the real-page-only auto-start block immediately below.
if (typeof module !== 'undefined' && module.exports) {
    Object.assign(module.exports, { DailyResetManager, StreakSaverManager, ReportsManager });
}

// Override the initialization to use full version.
// Guarded: in a module/test context (module.exports exists), skip the real
// app's auto-start cascade entirely — initializeFullApp() assumes the real
// nitnem-tracker.html DOM exists and isn't meant to run against a bare test
// environment. This guard changes nothing for the real browser, where
// `module` is always undefined.
if (typeof module === 'undefined' || !module.exports) {
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeFullApp();
        SmartRemindersIntegration.init();
        ServiceWorkerComm.init();
        KeyboardShortcuts.init();

        // Check for streak saver activation from notification
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('streakSaver') === 'activate') {
            setTimeout(() => {
                if (typeof StreakSaverManager !== 'undefined') {
                    // First run check to activate streak saver if needed
                    StreakSaverManager.checkStreakBreak();
                    // Then show modal
                    const saverData = StreakSaverManager.getActivePunishment();
                    if (saverData) {
                        StreakSaverManager.showStreakSaverModal(saverData);
                    }
                }
            }, 1500); // Wait for app to fully initialize
        }

        // Back button navigation
        const backBtn = document.getElementById('backBtn');
        if (backBtn && !backBtn._nitnemBackBound) {
            backBtn._nitnemBackBound = true;
            backBtn.addEventListener('click', (e) => {
                if (typeof HapticManager !== 'undefined') HapticManager.light();
                if (typeof window.anhadGoBack === 'function') {
                    window.anhadGoBack();
                } else {
                    if (window.navigateTo) window.navigateTo('../index.html'); else window.location.href = '../index.html';
                }
            });
        }
    });
} else {
    initializeFullApp();
    SmartRemindersIntegration.init();
    ServiceWorkerComm.init();
    KeyboardShortcuts.init();

    // Check for streak saver activation from notification
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('streakSaver') === 'activate') {
        setTimeout(() => {
            if (typeof StreakSaverManager !== 'undefined') {
                // First run check to activate streak saver if needed
                StreakSaverManager.checkStreakBreak();
                // Then show modal
                const saverData = StreakSaverManager.getActivePunishment();
                if (saverData) {
                    StreakSaverManager.showStreakSaverModal(saverData);
                }
            }
        }, 1500); // Wait for app to fully initialize
    }

    // Back button navigation
    const backBtn = document.getElementById('backBtn');
    if (backBtn && !backBtn._nitnemBackBound) {
        backBtn._nitnemBackBound = true;
        backBtn.addEventListener('click', (e) => {
            if (typeof HapticManager !== 'undefined') HapticManager.light();
            if (typeof window.anhadGoBack === 'function') {
                window.anhadGoBack();
            } else {
                if (window.navigateTo) window.navigateTo('../index.html'); else window.location.href = '../index.html';
            }
        });
    }
}
} // end module/test guard

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

        // ═══ ENHANCED: Full streak update on visibility change ═══
        StreakManager.recalculateStreak();
        StreakManager.updateDisplay();
        HeaderManager.updateStreakDisplay();

        // Check for streak saver activation
        StreakSaverManager.checkStreakBreak();
        StreakSaverManager.checkAndCleanupExpired();
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
window.addEventListener('pagehide', () => {
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
        SmartRemindersIntegration
    };
}

/* -----------------------------------------------------------------------------
   PREMIUM UX MANAGER
   Runs the 10 supreme dynamic UI updates.
   ----------------------------------------------------------------------------- */
const PremiumUXManager = {
    init() {
        this.setupDoubleTapPresent();
        this.setupMalaRipple();
        this.updateAmbientAura();
        setInterval(() => this.updateAmbientAura(), 60000 * 5); // Check aura every 5 mins
        this.startMarquee();
    },

    setupDoubleTapPresent() {
        // FEATURE 8: Double-Tap to Mark Present
        const presentBtn = document.getElementById('presentBtn');
        if (!presentBtn) return;

        let lastTap = 0;
        presentBtn.addEventListener('click', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                // Double tap detected! Quick submit with heavy haptic
                HapticManager.heavy();
                if (typeof AmritvelaManager !== 'undefined' && !AmritvelaManager.todayMarked) {
                    AmritvelaManager.markPresent();
                    Toast.success('Fast Present', 'Double-tap registered successfully! ⚡');
                }
            }
            lastTap = currentTime;
        });
    },

    setupMalaRipple() {
        // FEATURE 3: Mala Ripple & Recoil
        const tapZone = document.getElementById('malaTapZone');
        if (!tapZone) return;

        tapZone.addEventListener('mousedown', (e) => {
            tapZone.classList.add('mala-tap-recoil');

            // Create ripple
            const ripple = document.createElement('span');
            ripple.classList.add('mala-ripple');

            const rect = tapZone.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;

            const x = e.clientX ? e.clientX - rect.left - size / 2 : 0;
            const y = e.clientY ? e.clientY - rect.top - size / 2 : 0;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            tapZone.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
                tapZone.classList.remove('mala-tap-recoil');
            }, 600);
        });
    },

    updateAmbientAura() {
        // FEATURE 2: Ambient Background Glow
        const hour = new Date().getHours();
        let auraColor = 'rgba(255, 149, 0, 0.05)';

        if (hour >= 2 && hour < 6) auraColor = 'rgba(255, 149, 0, 0.15)'; // Golden Amritvela
        else if (hour >= 6 && hour < 12) auraColor = 'rgba(52, 199, 89, 0.08)'; // Morning Green
        else if (hour >= 18 && hour < 21) auraColor = 'rgba(255, 59, 48, 0.08)'; // Evening Red
        else if (hour >= 21 || hour < 2) auraColor = 'rgba(88, 86, 214, 0.12)'; // Night Deep Blue

        document.documentElement.style.setProperty('--aura-color', auraColor);
    },

    startMarquee() {
        // FEATURE 10: Motivational Sequence
        const quotes = [
            "Jo Mange Thakur Apne Te Soi Soi Deve...",
            "Arise, awake, for Amritvela is the time of nectar.",
            "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh 🙏",
            "Nanak Naam Chardi Kala, Tere Bhane Sarbat Da Bhala."
        ];

        const txt = document.getElementById('marqueeText');
        const clone = document.getElementById('marqueeTextClone');
        if (txt && clone) {
            let quoteIdx = 0;
            setInterval(() => {
                quoteIdx = (quoteIdx + 1) % quotes.length;
                txt.textContent = quotes[quoteIdx] + " • ";
                clone.textContent = quotes[quoteIdx] + " • ";
            }, 30000); // Change text when it loops approximately
        }
    }
};

/* -----------------------------------------------------------------------------
   END OF NITNEM TRACKER APPLICATION
   ═══════════════════════════════════════════════════════════════════════════════ */
