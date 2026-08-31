/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NAAM ABHYAS - Sacred Hourly Practice Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Complete, Unified, High-Precision Naam Abhyas Controller for ANHAD
 * 
 * Features:
 *  1. Single Source of Truth Notification & Intent Lifecycle
 *  2. High-Precision Timer Player with SVG Ring & Breathing Animation
 *  3. Sacred Completion Modal with Blessings, Streaks & Next Session Info
 *  4. Canonical Stats Engine (Streak, Ring %, Weekly Minutes, Perfect Days)
 *  5. Extra Naam Simran Support (Start Now 2m, Quick 30s, Deep 11m)
 *  6. Cross-App Sync (Nitnem Tracker, Profile, Dashboard, Widgets)
 *  7. Full Claymorphic UI/UX Preservation with Theme Sync
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════════════
   1. CONFIGURATION & CONSTANTS
═══════════════════════════════════════════════════════════════════════════════ */

const NAAM_CONFIG = {
    STORAGE_KEYS: {
        CONFIG: 'naam_abhyas_config',
        HISTORY: 'naam_abhyas_history',
        SCHEDULE: 'naam_abhyas_schedule',
        PENDING_LAUNCH: 'anhad_pending_naam_launch'
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
            sound: 'gentle-bell',
            vibration: true,
            soundEnabled: true
        },
        autoStartTimer: true,
        theme: 'system'
    },

    ACHIEVEMENTS: [
        { id: 'first_session', name: 'First Step', description: 'Complete your first Naam Abhyas', icon: '🏅', condition: stats => (stats.completedSessions || 0) >= 1 },
        { id: 'streak_5', name: 'Getting Started', description: '5-hour streak', icon: '⚡', condition: stats => (stats.currentStreak || 0) >= 5 },
        { id: 'streak_10', name: 'Dedicated Seeker', description: '10-hour streak', icon: '🔥', condition: stats => (stats.currentStreak || 0) >= 10 },
        { id: 'streak_24', name: 'Perfect Day', description: '24-hour streak', icon: '🌟', condition: stats => (stats.currentStreak || 0) >= 24 },
        { id: 'sessions_10', name: 'Devoted', description: '10 sessions completed', icon: '📿', condition: stats => (stats.completedSessions || 0) >= 10 },
        { id: 'sessions_50', name: 'Regular Practice', description: '50 sessions completed', icon: '🎯', condition: stats => (stats.completedSessions || 0) >= 50 },
        { id: 'sessions_100', name: 'Centurion', description: '100 sessions completed', icon: '💯', condition: stats => (stats.completedSessions || 0) >= 100 },
        { id: 'sessions_500', name: 'Devoted Soul', description: '500 sessions completed', icon: '👑', condition: stats => (stats.completedSessions || 0) >= 500 },
        { id: 'time_30min', name: 'Half Hour', description: '30 minutes in Naam Abhyas', icon: '⏰', condition: stats => (stats.totalTimeSeconds || 0) >= 1800 },
        { id: 'time_1hour', name: 'Hour of Devotion', description: '1 hour in Naam Abhyas', icon: '🕐', condition: stats => (stats.totalTimeSeconds || 0) >= 3600 },
        { id: 'time_5hours', name: 'Deep Practice', description: '5 hours in Naam Abhyas', icon: '🙏', condition: stats => (stats.totalTimeSeconds || 0) >= 18000 }
    ],

    WISDOM_QUOTES: [
        { gurmukhi: "ਨਾਮ ਜਪਤ ਅਘ ਕੋਟਿ ਉਤਾਰੇ", translation: "Chanting the Naam, millions of sins are erased", source: "Sri Guru Granth Sahib Ji, Ang 289" },
        { gurmukhi: "ਜਪਿ ਮਨ ਮੇਰੇ ਗੋਵਿੰਦ ਕੀ ਬਾਣੀ", translation: "O my mind, chant the Word of the Lord", source: "Sri Guru Granth Sahib Ji, Ang 192" },
        { gurmukhi: "ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖ ਪਾਵਉ", translation: "Meditating, meditating, meditating, I find peace", source: "Sri Guru Granth Sahib Ji, Ang 262" },
        { gurmukhi: "ਮਨ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ ਆਪਣਾ ਮੂਲੁ ਪਛਾਣੁ", translation: "O my mind, you are the embodiment of Light - recognize your origin", source: "Sri Guru Granth Sahib Ji, Ang 441" },
        { gurmukhi: "ਹਰਿ ਕਾ ਨਾਮੁ ਜਪਿ ਦਿਨਸੁ ਰਾਤਿ", translation: "Chant the Lord's Name, day and night", source: "Sri Guru Granth Sahib Ji, Ang 185" },
        { gurmukhi: "ਨਾਮ ਬਿਨਾ ਸਭੁ ਜਗੁ ਕਮਲਾਨਾ", translation: "Without the Naam, the whole world is in confusion", source: "Sri Guru Granth Sahib Ji, Ang 366" },
        { gurmukhi: "ਏਕੋ ਨਾਮੁ ਹੁਕਮੁ ਹੈ ਨਾਨਕ ਸਤਿਗੁਰਿ ਦੀਆ ਬੁਝਾਇ", translation: "The One Name is the Lord's Command; the True Guru has given understanding", source: "Sri Guru Granth Sahib Ji, Ang 72" },
        { gurmukhi: "ਗੁਰਮੁਖਿ ਨਾਮੁ ਜਪਹੁ ਮਨ ਮੇਰੇ", translation: "O my mind, chant the Naam as Gurmukh", source: "Sri Guru Granth Sahib Ji, Ang 560" }
    ],

    BLESSINGS: [
        "Wonderful! You remembered Guru Maharaj Ji 🙏",
        "Beautiful! Waheguru was with you ✨",
        "Sat Sri Akal! Your Simran is complete 🌸",
        "ਧੰਨ ਧੰਨ! Blessed is this sacred moment 🌺",
        "You have honored your daily spiritual practice 🙏",
        "Discipline compounds. Every breath with Waheguru shines ✨"
    ]
};

/* ═══════════════════════════════════════════════════════════════════════════════
   2. THEME ENGINE
═══════════════════════════════════════════════════════════════════════════════ */

class NaamAbhyasThemeEngine {
    constructor() {
        const globalTheme = localStorage.getItem('anhad_theme') || 'auto';
        this.currentTheme = globalTheme;
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupListeners();
        this.bindThemeButtons();
    }

    applyTheme(theme) {
        const htmlEl = document.documentElement;
        let effective = theme;
        let timeOfDay = localStorage.getItem('anhad_forced_time_of_day');

        if (theme === 'auto' || theme === 'system') {
            if (timeOfDay && ['morning', 'day', 'evening', 'night'].includes(timeOfDay)) {
                effective = (timeOfDay === 'night') ? 'dark' : 'light';
            } else {
                const hour = new Date().getHours();
                effective = (hour >= 5 && hour < 20) ? 'light' : 'dark';
            }
        }

        htmlEl.setAttribute('data-theme', effective);
        htmlEl.setAttribute('data-theme-mode', theme);
        htmlEl.style.colorScheme = effective;

        if (effective === 'dark') {
            htmlEl.classList.add('dark', 'dark-mode');
            document.body.classList.add('dark-mode');
        } else {
            htmlEl.classList.remove('dark', 'dark-mode');
            document.body.classList.remove('dark-mode');
        }

        this.updateActiveButton(theme);
        this.currentTheme = theme;
    }

    setupListeners() {
        window.addEventListener('themechange', (e) => {
            if (e.detail && e.detail.theme) this.applyTheme(e.detail.theme);
        });

        window.addEventListener('storage', (e) => {
            if (e.key === 'anhad_theme' && e.newValue) {
                this.applyTheme(e.newValue);
            }
        });
    }

    bindThemeButtons() {
        const options = document.querySelectorAll('.theme-option');
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                const val = opt.getAttribute('data-theme');
                if (val) {
                    localStorage.setItem('anhad_theme', val);
                    this.applyTheme(val);
                }
            });
        });
    }

    updateActiveButton(theme) {
        const inputs = document.querySelectorAll('input[name="theme"]');
        inputs.forEach(input => {
            input.checked = (input.value === theme);
        });
    }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   3. CANONICAL STATS & HISTORY ENGINE
═══════════════════════════════════════════════════════════════════════════════ */

class NaamStatsEngine {
    constructor() {
        this.history = this.loadHistory();
    }

    loadHistory() {
        try {
            const raw = localStorage.getItem(NAAM_CONFIG.STORAGE_KEYS.HISTORY);
            if (!raw) return this.getDefaultHistory();
            const parsed = JSON.parse(raw);
            return this.normalizeHistory(parsed);
        } catch (e) {
            console.error('[NaamStatsEngine] Error loading history:', e);
            return this.getDefaultHistory();
        }
    }

    getDefaultHistory() {
        return {
            sessions: [],
            daily: {},
            scheduleHistory: {},
            statistics: {
                totalSessions: 0,
                completedSessions: 0,
                skippedSessions: 0,
                totalTimeSeconds: 0,
                currentStreak: 0,
                longestStreak: 0,
                extraSessions: 0,
                completionRate: 0,
                lastStreakDate: null
            },
            achievements: [],
            totalCompleted: 0,
            currentStreak: 0,
            longestStreak: 0
        };
    }

    normalizeHistory(h) {
        const base = this.getDefaultHistory();
        const merged = { ...base, ...h };
        merged.statistics = { ...base.statistics, ...(h.statistics || {}) };
        merged.daily = h.daily || {};
        merged.sessions = Array.isArray(h.sessions) ? h.sessions : [];
        merged.scheduleHistory = h.scheduleHistory || {};
        merged.achievements = Array.isArray(h.achievements) ? h.achievements : [];
        return merged;
    }

    saveHistory() {
        try {
            localStorage.setItem(NAAM_CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
        } catch (e) {
            console.error('[NaamStatsEngine] Error saving history:', e);
        }
    }

    getTodayKey() {
        return new Date().toLocaleDateString('en-CA');
    }

    recordSession(sessionData) {
        const today = this.getTodayKey();
        const now = new Date();
        const duration = Math.max(0, Math.round(Number(sessionData.duration) || 120));
        const hour = sessionData.hour !== undefined ? Number(sessionData.hour) : now.getHours();
        const isExtra = !!sessionData.isExtra;

        const session = {
            id: sessionData.id || `session_${now.getTime()}`,
            date: today,
            hour: hour,
            startTime: sessionData.startTime || this.formatTime12h(hour, sessionData.startMinute || 0),
            duration: duration,
            status: sessionData.status || 'completed',
            isExtra: isExtra,
            presenceConfirmed: !!sessionData.presenceConfirmed,
            endedEarly: !!sessionData.endedEarly,
            recordedAt: now.toISOString()
        };

        // Guard against duplicate recording for same scheduled hour today
        if (!isExtra && session.status === 'completed') {
            const alreadyRecorded = this.history.sessions.some(s =>
                s.date === today && s.hour === hour && !s.isExtra && s.status === 'completed'
            );
            if (alreadyRecorded) {
                console.warn(`[NaamStatsEngine] Duplicate session for hour ${hour} on ${today} prevented`);
                return session;
            }
        }

        this.history.sessions.push(session);

        // Update daily bucket (compatible with Profile and Dashboard)
        if (!this.history.daily[today]) {
            this.history.daily[today] = { completed: 0, total: 0, totalMinutes: 0, sessions: [] };
        }
        const dailyBucket = this.history.daily[today];
        dailyBucket.sessions = dailyBucket.sessions || [];
        dailyBucket.sessions.push(session);

        if (session.status === 'completed') {
            dailyBucket.completed = (dailyBucket.completed || 0) + 1;
            dailyBucket.totalMinutes = (dailyBucket.totalMinutes || 0) + Math.round(duration / 60);

            // Update top-level statistics
            this.history.statistics.completedSessions = (this.history.statistics.completedSessions || 0) + 1;
            this.history.statistics.totalTimeSeconds = (this.history.statistics.totalTimeSeconds || 0) + duration;
            this.history.totalCompleted = this.history.statistics.completedSessions;

            if (isExtra) {
                this.history.statistics.extraSessions = (this.history.statistics.extraSessions || 0) + 1;
            } else {
                this.updateStreakInternal(today);
            }
        } else if (session.status === 'skipped') {
            this.history.statistics.skippedSessions = (this.history.statistics.skippedSessions || 0) + 1;
            this.history.statistics.currentStreak = 0;
            this.history.currentStreak = 0;
        }

        this.history.statistics.totalSessions = this.history.sessions.length;

        // Calculate completion rate
        const totalScheduled = this.history.sessions.filter(s => !s.isExtra).length;
        const completedScheduled = this.history.sessions.filter(s => !s.isExtra && s.status === 'completed').length;
        this.history.statistics.completionRate = totalScheduled > 0
            ? Math.round((completedScheduled / totalScheduled) * 100)
            : 100;

        // Check and unlock achievements
        this.checkAchievements();

        // Save
        this.saveHistory();

        // Broadcast cross-app sync events
        this.broadcastSync(session);

        return session;
    }

    updateStreakInternal(today) {
        const stats = this.history.statistics;
        stats.currentStreak = (stats.currentStreak || 0) + 1;
        if (stats.currentStreak > (stats.longestStreak || 0)) {
            stats.longestStreak = stats.currentStreak;
        }
        stats.lastStreakDate = today;

        this.history.currentStreak = stats.currentStreak;
        this.history.longestStreak = stats.longestStreak;
    }

    checkAchievements() {
        const stats = this.history.statistics;
        const unlockedIds = new Set(this.history.achievements.map(a => a.id));

        NAAM_CONFIG.ACHIEVEMENTS.forEach(ach => {
            if (!unlockedIds.has(ach.id)) {
                try {
                    if (ach.condition(stats)) {
                        this.history.achievements.push({
                            id: ach.id,
                            unlockedAt: new Date().toISOString()
                        });
                        window.dispatchEvent(new CustomEvent('naamAchievementUnlocked', { detail: ach }));
                    }
                } catch (e) {}
            }
        });
    }

    getTodayStats(activeHoursCount = 18) {
        const today = this.getTodayKey();
        const todaysSessions = this.history.sessions.filter(s => s.date === today);
        const completedSessions = todaysSessions.filter(s => s.status === 'completed');
        const scheduledCompleted = completedSessions.filter(s => !s.isExtra).length;
        const extraCompleted = completedSessions.filter(s => s.isExtra).length;

        const totalTimeSeconds = completedSessions.reduce((acc, s) => acc + (s.duration || 0), 0);

        return {
            today,
            completed: completedSessions.length,
            scheduledCompleted,
            extraCompleted,
            totalExpected: activeHoursCount,
            totalTimeSeconds,
            totalTimeMinutes: Math.round(totalTimeSeconds / 60),
            currentStreak: this.history.statistics.currentStreak || 0,
            longestStreak: this.history.statistics.longestStreak || 0,
            completionRate: activeHoursCount > 0 ? Math.min(100, Math.round((scheduledCompleted / activeHoursCount) * 100)) : 0,
            isPerfectDay: scheduledCompleted >= activeHoursCount && activeHoursCount > 0
        };
    }

    getWeeklyStats(activeHoursCount = 18) {
        const now = new Date();
        const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
        const monday = new Date(now);
        monday.setDate(now.getDate() - dayOfWeek);
        monday.setHours(0, 0, 0, 0);

        let weeklyMinutes = 0;
        let perfectDays = 0;

        for (let i = 0; i <= 6; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateStr = d.toLocaleDateString('en-CA');
            const daySessions = this.history.sessions.filter(s => s.date === dateStr && s.status === 'completed');
            const scheduledDone = daySessions.filter(s => !s.isExtra).length;
            const minutes = daySessions.reduce((acc, s) => acc + Math.round((s.duration || 0) / 60), 0);

            weeklyMinutes += minutes;
            if (scheduledDone >= activeHoursCount && activeHoursCount > 0) {
                perfectDays++;
            }
        }

        return {
            weeklyMinutes,
            perfectDays
        };
    }

    broadcastSync(session) {
        try {
            // Event 1: Nitnem canonical streak bridge
            window.dispatchEvent(new CustomEvent('naamAbhyasSessionComplete', { detail: session }));
            // Event 2: Nitnem Tracker & Global Alarm System
            window.dispatchEvent(new CustomEvent('naamAbhyasComplete', {
                detail: {
                    count: 1,
                    duration: session.duration,
                    hour: session.hour,
                    isScheduled: !session.isExtra,
                    presenceConfirmed: session.presenceConfirmed
                }
            }));
            // Event 3: Generic completion notice
            window.dispatchEvent(new CustomEvent('naamSessionCompleted', { detail: session }));
        } catch (e) {
            console.warn('[NaamStatsEngine] Error broadcasting sync:', e);
        }
    }

    formatTime12h(hour, minute = 0) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const displayMinute = (minute % 60).toString().padStart(2, '0');
        return `${displayHour}:${displayMinute} ${period}`;
    }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   4. SCHEDULE MANAGER
═══════════════════════════════════════════════════════════════════════════════ */

class NaamScheduleManager {
    constructor(app) {
        this.app = app;
        this.currentSchedule = this.loadSchedule();
    }

    loadSchedule() {
        const today = new Date().toLocaleDateString('en-CA');
        try {
            const raw = localStorage.getItem(NAAM_CONFIG.STORAGE_KEYS.SCHEDULE);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                    return parsed;
                }
            }
        } catch (e) {}

        return this.generateDailySchedule();
    }

    saveSchedule() {
        try {
            localStorage.setItem(NAAM_CONFIG.STORAGE_KEYS.SCHEDULE, JSON.stringify(this.currentSchedule));
        } catch (e) {}
    }

    generateDailySchedule(force = false) {
        const config = this.app.config;
        const startHour = Number(config.activeHours?.start || 5);
        const endHour = Number(config.activeHours?.end || 22);
        const duration = Number(config.duration || 2);
        const schedule = {};

        for (let h = startHour; h <= endHour; h++) {
            const min = 0;
            const endMin = min + duration;
            schedule[h] = {
                hour: h,
                startMinute: min,
                endMinute: endMin,
                durationMinutes: duration,
                startTime: this.formatTime12h(h, min),
                endTime: this.formatTime12h(h, endMin),
                status: 'pending'
            };
        }

        // Sync with existing completions today from history
        const today = new Date().toLocaleDateString('en-CA');
        const completedHours = new Set(
            this.app.statsEngine.history.sessions
                .filter(s => s.date === today && s.status === 'completed' && !s.isExtra)
                .map(s => Number(s.hour))
        );

        Object.keys(schedule).forEach(h => {
            if (completedHours.has(Number(h))) {
                schedule[h].status = 'completed';
            }
        });

        this.currentSchedule = schedule;
        this.saveSchedule();
        return schedule;
    }

    refreshRandomMinutes() {
        const config = this.app.config;
        const startHour = Number(config.activeHours?.start || 5);
        const endHour = Number(config.activeHours?.end || 22);
        const duration = Number(config.duration || 2);
        const now = new Date();
        const currentHour = now.getHours();

        for (let h = startHour; h <= endHour; h++) {
            if (this.currentSchedule[h]?.status === 'completed') continue;

            let min = 0;
            if (h === currentHour) {
                min = Math.min(55, Math.max(0, now.getMinutes() + 2));
            } else {
                min = Math.floor(Math.random() * 50);
            }

            const endMin = min + duration;
            this.currentSchedule[h] = {
                hour: h,
                startMinute: min,
                endMinute: endMin,
                durationMinutes: duration,
                startTime: this.formatTime12h(h, min),
                endTime: this.formatTime12h(h, endMin),
                status: 'pending'
            };
        }

        this.saveSchedule();
    }

    getNextSession() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const nowMs = now.getTime();

        const sortedHours = Object.keys(this.currentSchedule)
            .map(Number)
            .sort((a, b) => a - b);

        for (const h of sortedHours) {
            const item = this.currentSchedule[h];
            if (!item || item.status === 'completed' || item.status === 'skipped') continue;

            const slotTime = new Date(now);
            slotTime.setHours(h, item.startMinute || 0, 0, 0);

            if (slotTime.getTime() + (item.durationMinutes * 60 * 1000) >= nowMs) {
                return item;
            }
        }

        return null;
    }

    markHourCompleted(hour) {
        if (this.currentSchedule && this.currentSchedule[hour]) {
            this.currentSchedule[hour].status = 'completed';
            this.saveSchedule();
        }
    }

    formatTime12h(hour, minute = 0) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const displayMinute = (minute % 60).toString().padStart(2, '0');
        return `${displayHour}:${displayMinute} ${period}`;
    }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   5. TIMER PLAYER (Immersive Overlay Experience)
═══════════════════════════════════════════════════════════════════════════════ */

class NaamTimerPlayer {
    constructor(app) {
        this.app = app;
        this.state = 'IDLE'; // IDLE | RUNNING | COMPLETING
        this.timerInterval = null;
        this.targetEndTime = null;
        this.totalDurationSeconds = 120;
        this.remainingSeconds = 120;
        this.currentSessionInfo = null;
        this.isSilent = false;
        this.presenceConfirmed = false;
        this.tenSecondWarningFired = false;
        this.breathingPhaseIndex = 0;
        this.breathingInterval = null;

        this.CIRCUMFERENCE = 2 * Math.PI * 85; // 534.07 for r=85

        this.initDOM();
    }

    initDOM() {
        this.overlay = document.getElementById('meditationOverlay');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.progressRing = document.getElementById('medProgressRing');
        this.progressBar = document.getElementById('timerProgressBar');
        this.breathingGuide = document.getElementById('breathingGuide');
        this.waheguruText = document.getElementById('waheguruText');

        this.medPresentBtn = document.getElementById('medPresentBtn');
        this.medSilentBtn = document.getElementById('medSilentBtn');
        this.silentBtnIcon = document.getElementById('silentBtnIcon');
        this.silentBtnLabel = document.getElementById('silentBtnLabel');
        this.skipBtn = document.getElementById('skipMeditationBtn');
        this.chimeToggle = document.getElementById('medChimeToggle');

        this.bindEvents();
    }

    bindEvents() {
        if (this.medPresentBtn) {
            this.medPresentBtn.addEventListener('click', () => this.confirmPresence());
        }

        if (this.medSilentBtn) {
            this.medSilentBtn.addEventListener('click', () => this.toggleSilence());
        }

        if (this.skipBtn) {
            this.skipBtn.addEventListener('click', () => this.skipOrEndEarly());
        }

        document.addEventListener('visibilitychange', () => {
            if (this.state === 'RUNNING' && !document.hidden) {
                this.tick();
            }
        });
    }

    start(durationMinutes = 2, sessionInfo = null) {
        this.stop();

        this.state = 'RUNNING';
        this.totalDurationSeconds = Math.max(10, Math.round(durationMinutes * 60));
        this.remainingSeconds = this.totalDurationSeconds;
        this.targetEndTime = Date.now() + (this.totalDurationSeconds * 1000);
        this.currentSessionInfo = sessionInfo || {
            hour: new Date().getHours(),
            startTime: this.app.statsEngine.formatTime12h(new Date().getHours()),
            isExtra: true
        };
        this.presenceConfirmed = false;
        this.tenSecondWarningFired = false;

        document.body.classList.add('timer-active');

        if (this.medPresentBtn) {
            this.medPresentBtn.classList.remove('confirmed');
            this.medPresentBtn.style.boxShadow = '';
        }

        if (this.overlay) {
            this.overlay.classList.add('active');
        }

        if (this.chimeToggle && this.chimeToggle.checked && !this.isSilent) {
            this.app.audioManager?.playStartBell?.();
        }

        if (!this.isSilent) {
            this.app.audioManager?.playAmbient?.(0.25);
        }

        this.updateDisplay();
        this.startBreathingGuide();

        this.timerInterval = setInterval(() => this.tick(), 100);

        console.log(`[NaamTimerPlayer] ⏱️ Timer started: ${durationMinutes} min (${this.totalDurationSeconds}s)`);
    }

    tick() {
        if (this.state !== 'RUNNING') return;

        const now = Date.now();
        const diff = Math.max(0, (this.targetEndTime - now) / 1000);
        this.remainingSeconds = Math.round(diff);

        this.updateDisplay();

        if (this.remainingSeconds <= 10 && !this.tenSecondWarningFired && this.remainingSeconds > 0) {
            this.tenSecondWarningFired = true;
            if (!this.isSilent && this.chimeToggle?.checked) {
                this.app.audioManager?.beep?.(660, 0.3, 0.4);
            }
        }

        if (diff <= 0) {
            this.complete();
        }
    }

    updateDisplay() {
        const mins = Math.floor(this.remainingSeconds / 60);
        const secs = this.remainingSeconds % 60;
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        if (this.timerDisplay) {
            this.timerDisplay.textContent = timeStr;
        }

        const elapsed = this.totalDurationSeconds - this.remainingSeconds;
        const progress = Math.min(1, Math.max(0, elapsed / this.totalDurationSeconds));

        if (this.progressRing) {
            const offset = this.CIRCUMFERENCE * (1 - progress);
            this.progressRing.style.strokeDashoffset = offset;
        }

        if (this.progressBar) {
            this.progressBar.style.width = `${progress * 100}%`;
        }
    }

    startBreathingGuide() {
        this.stopBreathingGuide();
        const phases = [
            "Breathe in... ਸਾਹ ਲਓ...",
            "Hold gently... ਧਿਆਨ ਧਰੋ...",
            "Breathe out... ਛੱਡੋ...",
            "Remember Waheguru... ਵਾਹਿਗੁਰੂ..."
        ];

        this.breathingPhaseIndex = 0;
        if (this.breathingGuide) {
            this.breathingGuide.textContent = phases[0];
            this.breathingGuide.style.opacity = '1';
        }

        this.breathingInterval = setInterval(() => {
            if (this.state !== 'RUNNING') return;
            this.breathingPhaseIndex = (this.breathingPhaseIndex + 1) % phases.length;
            if (this.breathingGuide) {
                this.breathingGuide.style.opacity = '0';
                setTimeout(() => {
                    if (this.breathingGuide && this.state === 'RUNNING') {
                        this.breathingGuide.textContent = phases[this.breathingPhaseIndex];
                        this.breathingGuide.style.opacity = '1';
                    }
                }, 300);
            }
        }, 4000);
    }

    stopBreathingGuide() {
        if (this.breathingInterval) {
            clearInterval(this.breathingInterval);
            this.breathingInterval = null;
        }
    }

    confirmPresence() {
        this.presenceConfirmed = true;
        if (this.medPresentBtn) {
            this.medPresentBtn.classList.add('confirmed');
            this.medPresentBtn.style.boxShadow = '0 0 30px rgba(52, 199, 89, 0.7)';
        }

        if (navigator.vibrate) navigator.vibrate(60);

        if (!this.isSilent) {
            this.app.audioManager?.beep?.(880, 0.15, 0.3);
        }

        this.app.showToast('Presence Recorded! ਵਾਹਿਗੁਰੂ', 'success');
    }

    toggleSilence() {
        this.isSilent = !this.isSilent;
        if (this.isSilent) {
            this.app.audioManager?.mute?.();
            if (this.silentBtnIcon) this.silentBtnIcon.textContent = '🔇';
            if (this.silentBtnLabel) this.silentBtnLabel.textContent = 'Muted';
            if (this.medSilentBtn) this.medSilentBtn.dataset.muted = 'true';
        } else {
            this.app.audioManager?.unmute?.();
            if (this.silentBtnIcon) this.silentBtnIcon.textContent = '🔊';
            if (this.silentBtnLabel) this.silentBtnLabel.textContent = 'Silent';
            if (this.medSilentBtn) this.medSilentBtn.dataset.muted = 'false';
        }
    }

    skipOrEndEarly() {
        const elapsed = this.totalDurationSeconds - this.remainingSeconds;
        this.stop();

        if (elapsed >= 30) {
            this.complete(elapsed, true);
        } else {
            if (this.currentSessionInfo && !this.currentSessionInfo.isExtra) {
                this.app.scheduleManager.currentSchedule[this.currentSessionInfo.hour].status = 'skipped';
                this.app.scheduleManager.saveSchedule();
            }
            this.app.showToast('Session ended early', 'info');
            this.app.updateUI();
        }
    }

    complete(actualDurationSeconds = null, endedEarly = false) {
        if (this.state === 'COMPLETING') return;
        this.state = 'COMPLETING';

        const finalDuration = actualDurationSeconds || this.totalDurationSeconds;
        const sessionInfo = this.currentSessionInfo || {};

        this.stop();

        if (!this.isSilent) {
            this.app.audioManager?.playEndBell?.();
        }
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        const sessionRecord = {
            hour: sessionInfo.hour !== undefined ? sessionInfo.hour : new Date().getHours(),
            startTime: sessionInfo.startTime,
            duration: finalDuration,
            status: 'completed',
            isExtra: !!sessionInfo.isExtra,
            presenceConfirmed: this.presenceConfirmed,
            endedEarly: endedEarly
        };

        if (!sessionInfo.isExtra) {
            this.app.scheduleManager.markHourCompleted(sessionRecord.hour);
        }

        const recorded = this.app.statsEngine.recordSession(sessionRecord);

        this.app.completionManager.show(recorded, finalDuration);
    }

    stop() {
        this.state = 'IDLE';
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.stopBreathingGuide();

        document.body.classList.remove('timer-active');
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }

        this.app.audioManager?.stopAmbient?.();
    }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   6. COMPLETION MANAGER (Modal & Blessings)
═══════════════════════════════════════════════════════════════════════════════ */

class NaamCompletionManager {
    constructor(app) {
        this.app = app;
        this.modal = document.getElementById('completionModal');
        this.titleEl = document.getElementById('completionTitle');
        this.blessingEl = document.getElementById('completionBlessing');
        this.nextInfoEl = document.getElementById('nextSessionInfo');
        this.durationEl = document.getElementById('compDuration');
        this.streakEl = document.getElementById('compStreak');
        this.todayEl = document.getElementById('compToday');
        this.continueBtn = document.getElementById('continueBtn');

        this.bindEvents();
    }

    bindEvents() {
        if (this.continueBtn) {
            this.continueBtn.addEventListener('click', () => this.hide());
        }
    }

    show(sessionData, durationSeconds) {
        if (!this.modal) return;

        const blessings = NAAM_CONFIG.BLESSINGS;
        const blessing = blessings[Math.floor(Math.random() * blessings.length)];
        if (this.blessingEl) this.blessingEl.textContent = blessing;

        const mins = Math.floor(durationSeconds / 60);
        const secs = durationSeconds % 60;
        if (this.durationEl) {
            this.durationEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        const stats = this.app.statsEngine.getTodayStats(this.app.getActiveHoursCount());
        if (this.streakEl) {
            this.streakEl.textContent = stats.currentStreak;
        }

        if (this.todayEl) {
            this.todayEl.textContent = `${stats.completed}/${stats.totalExpected}`;
        }

        const next = this.app.scheduleManager.getNextSession();
        if (this.nextInfoEl) {
            if (next) {
                this.nextInfoEl.textContent = `Next Naam Abhyas at ${next.startTime}`;
            } else {
                this.nextInfoEl.textContent = `All scheduled sessions complete today! ✨`;
            }
        }

        this.modal.classList.add('active');
        this.app.updateUI();
    }

    hide() {
        if (this.modal) {
            this.modal.classList.remove('active');
        }
        this.app.updateUI();
    }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   7. MAIN NAAM ABHYAS APPLICATION
═══════════════════════════════════════════════════════════════════════════════ */

class NaamAbhyas {
    constructor() {
        this.config = this.loadConfig();
        this.statsEngine = new NaamStatsEngine();
        this.scheduleManager = new NaamScheduleManager(this);
        this.themeEngine = new NaamAbhyasThemeEngine();

        if (typeof AudioManager !== 'undefined') {
            this.audioManager = new AudioManager();
            this.audioManager.preloadAll().catch(() => {});
        } else {
            this.audioManager = null;
        }

        this.timerPlayer = new NaamTimerPlayer(this);
        this.completionManager = new NaamCompletionManager(this);

        this.clockInterval = null;
        this.countdownInterval = null;
    }

    loadConfig() {
        try {
            const raw = localStorage.getItem(NAAM_CONFIG.STORAGE_KEYS.CONFIG);
            if (raw) return { ...NAAM_CONFIG.DEFAULTS, ...JSON.parse(raw) };
        } catch (e) {}
        return { ...NAAM_CONFIG.DEFAULTS };
    }

    saveConfig() {
        try {
            localStorage.setItem(NAAM_CONFIG.STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
        } catch (e) {}
    }

    getActiveHoursCount() {
        const start = Number(this.config.activeHours?.start || 5);
        const end = Number(this.config.activeHours?.end || 22);
        return Math.max(1, (end - start) + 1);
    }

    init() {
        this.bindDOM();
        this.initWisdom();
        this.startHeaderClock();
        this.startCountdownTicker();
        this.updateUI();
        this.hideLoadingScreen();

        this.checkLaunchIntent();

        window.addEventListener('naamAbhyasLaunchReady', (e) => {
            if (e.detail?.autoStart) {
                this.executeAutoStart(e.detail);
            }
        });
    }

    bindDOM() {
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (window.smartBack) window.smartBack();
                else if (window.history.length > 1) window.history.back();
                else window.location.href = '../index.html';
            });
        }

        const toggle = document.getElementById('naamAbhyasToggle');
        if (toggle) {
            toggle.checked = !!this.config.enabled;
            toggle.addEventListener('change', (e) => {
                this.config.enabled = e.target.checked;
                this.saveConfig();
                this.updateToggleStatus();
                this.syncNativeNotifications();
                this.updateUI();

                const msg = this.config.enabled
                    ? 'Naam Abhyas enabled! Hourly reminders scheduled.'
                    : 'Naam Abhyas disabled.';
                this.showToast(msg, this.config.enabled ? 'success' : 'info');
            });
        }

        // Quick Actions (Extra Naam Simran)
        const startNowBtn = document.getElementById('startNowBtn');
        if (startNowBtn) {
            startNowBtn.addEventListener('click', () => {
                const dur = Number(this.config.duration || 2);
                this.startManualSession(dur);
            });
        }

        const quickNaamBtn = document.getElementById('quickNaamBtn');
        if (quickNaamBtn) {
            quickNaamBtn.addEventListener('click', () => {
                this.startManualSession(0.5); // 30 seconds
            });
        }

        const deepModeBtn = document.getElementById('deepModeBtn');
        if (deepModeBtn) {
            deepModeBtn.addEventListener('click', () => {
                this.startManualSession(11); // 11 minutes
            });
        }

        // Refresh Schedule
        const refreshScheduleBtn = document.getElementById('refreshScheduleBtn');
        if (refreshScheduleBtn) {
            refreshScheduleBtn.addEventListener('click', () => {
                this.scheduleManager.refreshRandomMinutes();
                this.updateUI();
                this.showToast('Schedule randomized for today ✨', 'success');
            });
        }

        // Wisdom Refresh
        const wisdomRefreshBtn = document.getElementById('wisdomRefreshBtn');
        if (wisdomRefreshBtn) {
            wisdomRefreshBtn.addEventListener('click', () => this.cycleWisdom());
        }

        // Settings Modal
        const settingsPageBtn = document.getElementById('settingsPageBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const settingsModalBackdrop = document.getElementById('settingsModalBackdrop');

        if (settingsPageBtn && settingsModal) {
            settingsPageBtn.addEventListener('click', () => {
                this.populateSettingsForm();
                settingsModal.classList.add('active');
            });
        }

        const closeSettings = () => {
            if (settingsModal) settingsModal.classList.remove('active');
            this.saveSettingsForm();
        };

        if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettings);
        if (settingsModalBackdrop) settingsModalBackdrop.addEventListener('click', closeSettings);

        const presetBtns = document.querySelectorAll('.preset-btn');
        const customInput = document.getElementById('durationCustomInput');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                presetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mins = Number(btn.getAttribute('data-min') || 2);
                if (customInput) customInput.value = mins;
                this.config.duration = mins;
                this.saveConfig();
            });
        });

        if (customInput) {
            customInput.addEventListener('change', () => {
                const val = Math.max(1, Math.min(60, Number(customInput.value) || 2));
                this.config.duration = val;
                this.saveConfig();
                presetBtns.forEach(b => {
                    b.classList.toggle('active', Number(b.getAttribute('data-min')) === val);
                });
            });
        }

        // Full Stats Modal
        const viewFullStatsBtn = document.getElementById('viewFullStatsBtn');
        const statsPanel = document.getElementById('statsPanel');
        const closeStatsBtn = document.getElementById('closeStatsBtn');
        const statsPanelBackdrop = document.getElementById('statsPanelBackdrop');

        if (viewFullStatsBtn && statsPanel) {
            viewFullStatsBtn.addEventListener('click', () => {
                this.renderFullStatsContent();
                statsPanel.classList.add('active');
            });
        }

        const closeStats = () => {
            if (statsPanel) statsPanel.classList.remove('active');
        };

        if (closeStatsBtn) closeStatsBtn.addEventListener('click', closeStats);
        if (statsPanelBackdrop) statsPanelBackdrop.addEventListener('click', closeStats);

        // Hub Navigation Links
        const syncNitnemItem = document.getElementById('syncNitnemItem');
        if (syncNitnemItem) {
            syncNitnemItem.addEventListener('click', () => {
                window.location.href = '../NitnemTracker/nitnem-tracker.html';
            });
        }

        const syncSangatItem = document.getElementById('syncSangatItem');
        if (syncSangatItem) {
            syncSangatItem.addEventListener('click', () => {
                window.location.href = '../sadhsangat-live/index.html';
            });
        }

        const syncGptItem = document.getElementById('syncGptItem');
        if (syncGptItem) {
            syncGptItem.addEventListener('click', () => {
                window.location.href = '../GurbaniKhoj/gurbani-khoj.html';
            });
        }
    }

    startManualSession(durationMinutes) {
        const now = new Date();
        const currentHour = now.getHours();

        const scheduledSlot = this.scheduleManager.currentSchedule[currentHour];
        const isScheduledPending = scheduledSlot && scheduledSlot.status === 'pending';

        const sessionInfo = {
            hour: currentHour,
            startTime: this.statsEngine.formatTime12h(currentHour, now.getMinutes()),
            isExtra: !isScheduledPending
        };

        this.timerPlayer.start(durationMinutes, sessionInfo);
    }

    checkLaunchIntent() {
        try {
            const url = new URL(window.location.href);
            const autoStart = url.searchParams.get('autoStart') === 'true';
            const hour = url.searchParams.get('hour');
            const minute = url.searchParams.get('minute');

            if (autoStart) {
                window.history.replaceState({}, document.title, window.location.pathname);

                const targetHour = hour !== null ? Number(hour) : new Date().getHours();
                const sessionInfo = {
                    hour: targetHour,
                    startTime: this.statsEngine.formatTime12h(targetHour, minute !== null ? Number(minute) : 0),
                    isExtra: false
                };

                const dur = Number(this.config.duration || 2);
                setTimeout(() => {
                    this.timerPlayer.start(dur, sessionInfo);
                }, 300);
                return;
            }

            const pendingRaw = localStorage.getItem(NAAM_CONFIG.STORAGE_KEYS.PENDING_LAUNCH);
            if (pendingRaw) {
                localStorage.removeItem(NAAM_CONFIG.STORAGE_KEYS.PENDING_LAUNCH);
                const intent = JSON.parse(pendingRaw);
                const age = Date.now() - Number(intent.timestamp || 0);

                if (age < 10 * 60 * 1000 && intent.autoStart) {
                    const targetHour = intent.hour ? Number(intent.hour) : new Date().getHours();
                    const sessionInfo = {
                        hour: targetHour,
                        startTime: this.statsEngine.formatTime12h(targetHour, intent.minute ? Number(intent.minute) : 0),
                        isExtra: false
                    };
                    const dur = Number(this.config.duration || 2);
                    setTimeout(() => {
                        this.timerPlayer.start(dur, sessionInfo);
                    }, 300);
                }
            }
        } catch (e) {
            console.warn('[NaamAbhyas] Error processing launch intent:', e);
        }
    }

    executeAutoStart(detail) {
        const targetHour = detail.hour !== undefined ? Number(detail.hour) : new Date().getHours();
        const sessionInfo = {
            hour: targetHour,
            startTime: this.statsEngine.formatTime12h(targetHour, detail.minute !== undefined ? Number(detail.minute) : 0),
            isExtra: false
        };
        const dur = Number(this.config.duration || 2);
        this.timerPlayer.start(dur, sessionInfo);
    }

    syncNativeNotifications() {
        try {
            if (window.CapacitorNotifications?.rescheduleAll) {
                window.CapacitorNotifications.rescheduleAll();
            }
        } catch (e) {}
    }

    startHeaderClock() {
        const timeEl = document.getElementById('currentTime');
        const update = () => {
            if (timeEl) {
                const now = new Date();
                timeEl.textContent = this.statsEngine.formatTime12h(now.getHours(), now.getMinutes());
            }
        };
        update();
        this.clockInterval = setInterval(update, 1000);
    }

    startCountdownTicker() {
        const update = () => {
            const next = this.scheduleManager.getNextSession();
            const timeEl = document.getElementById('nextSessionTime');
            const subEl = document.getElementById('nextSessionSubtitle');
            const cdValEl = document.getElementById('countdownValue');

            if (!next) {
                if (timeEl) timeEl.textContent = 'All Done! ✨';
                if (subEl) subEl.textContent = 'Today\'s practice completed';
                if (cdValEl) cdValEl.textContent = 'Rest & peace';
                return;
            }

            if (timeEl) timeEl.textContent = next.startTime;

            const now = new Date();
            const target = new Date(now);
            target.setHours(next.hour, next.startMinute || 0, 0, 0);

            const diff = target.getTime() - now.getTime();
            if (diff > 0) {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);

                let cdText = '';
                if (hours > 0) cdText += `${hours}h `;
                cdText += `${mins}m ${secs}s`;

                if (cdValEl) cdValEl.textContent = cdText;
                if (subEl) subEl.textContent = `Coming up next`;
            } else {
                if (cdValEl) cdValEl.textContent = 'Starting now!';
                if (subEl) subEl.textContent = 'Time for Naam Simran';
            }
        };

        update();
        this.countdownInterval = setInterval(update, 1000);
    }

    updateUI() {
        const activeHoursCount = this.getActiveHoursCount();
        const todayStats = this.statsEngine.getTodayStats(activeHoursCount);
        const weeklyStats = this.statsEngine.getWeeklyStats(activeHoursCount);

        const headerStreakEl = document.getElementById('headerStreakCount');
        if (headerStreakEl) headerStreakEl.textContent = todayStats.currentStreak;

        this.updateToggleStatus();

        const compCountEl = document.getElementById('completedCount');
        const totCountEl = document.getElementById('totalCount');
        if (compCountEl) compCountEl.textContent = todayStats.completed;
        if (totCountEl) totCountEl.textContent = todayStats.totalExpected;

        this.renderProgressDots(todayStats);

        const rateValEl = document.getElementById('completionRateValue');
        const ringFillEl = document.getElementById('completionRingFill');
        if (rateValEl) rateValEl.textContent = todayStats.completionRate;
        if (ringFillEl) {
            const circumference = 2 * Math.PI * 40; // 251.3
            const offset = circumference * (1 - (todayStats.completionRate / 100));
            ringFillEl.style.strokeDashoffset = offset;
        }

        const streakEl = document.getElementById('currentStreak');
        const todayDoneEl = document.getElementById('todayCompleted');
        const totalTimeEl = document.getElementById('totalTime');
        const longestStreakEl = document.getElementById('longestStreak');

        if (streakEl) streakEl.textContent = todayStats.currentStreak;
        if (todayDoneEl) todayDoneEl.textContent = todayStats.completed;
        if (totalTimeEl) {
            const totalSecs = this.statsEngine.history.statistics.totalTimeSeconds || 0;
            const totalMins = Math.round(totalSecs / 60);
            if (totalMins >= 60) {
                const h = Math.floor(totalMins / 60);
                const m = totalMins % 60;
                totalTimeEl.textContent = `${h}h ${m}m`;
            } else {
                totalTimeEl.textContent = `${totalMins}m`;
            }
        }
        if (longestStreakEl) longestStreakEl.textContent = todayStats.longestStreak;

        const barValEl = document.getElementById('todayProgressValue');
        const barFillEl = document.getElementById('todayProgressFill');
        if (barValEl) barValEl.textContent = `${todayStats.completed}/${todayStats.totalExpected}`;
        if (barFillEl) barFillEl.style.width = `${Math.min(100, todayStats.completionRate)}%`;

        const weeklyMinEl = document.getElementById('weeklyMinutes');
        const perfDaysEl = document.getElementById('perfectDaysCount');
        const perfBadgeEl = document.getElementById('perfectDayIndicator');

        if (weeklyMinEl) weeklyMinEl.textContent = weeklyStats.weeklyMinutes;
        if (perfDaysEl) perfDaysEl.textContent = weeklyStats.perfectDays;
        if (perfBadgeEl) {
            perfBadgeEl.classList.toggle('hidden', !todayStats.isPerfectDay);
        }

        this.renderTimeline();
        this.renderAchievements();
    }

    updateToggleStatus() {
        const toggle = document.getElementById('naamAbhyasToggle');
        const statusText = document.getElementById('toggleStatusText');
        if (toggle) toggle.checked = !!this.config.enabled;
        if (statusText) {
            statusText.textContent = this.config.enabled ? 'Hourly reminders active' : 'Currently disabled';
        }
    }

    renderProgressDots(todayStats) {
        const dotsContainer = document.getElementById('progressDots');
        if (!dotsContainer) return;

        const schedule = this.scheduleManager.currentSchedule;
        const hours = Object.keys(schedule).map(Number).sort((a, b) => a - b);
        const currentHour = new Date().getHours();

        let html = '';
        hours.forEach(h => {
            const item = schedule[h];
            let cls = 'progress-dot';
            if (item.status === 'completed') cls += ' completed';
            else if (h === currentHour) cls += ' current';
            html += `<span class="${cls}" title="${item.startTime}"></span>`;
        });

        dotsContainer.innerHTML = html;
    }

    renderTimeline() {
        const container = document.getElementById('scheduleTimeline');
        if (!container) return;

        if (!this.config.enabled) {
            container.innerHTML = `
                <div class="schedule-empty">
                    <p>Enable Naam Abhyas above to activate your daily sacred schedule.</p>
                </div>`;
            return;
        }

        const schedule = this.scheduleManager.currentSchedule;
        const hours = Object.keys(schedule).map(Number).sort((a, b) => a - b);
        const currentHour = new Date().getHours();

        let html = '';
        hours.forEach(h => {
            const item = schedule[h];
            const isCurrent = (h === currentHour);
            const isCompleted = (item.status === 'completed');
            const isSkipped = (item.status === 'skipped');

            let itemClass = 'timeline-item';
            if (isCompleted) itemClass += ' completed';
            if (isCurrent) itemClass += ' current';

            let dotClass = 'timeline-dot';
            if (isCompleted) dotClass += ' completed';
            else if (isCurrent) dotClass += ' current';

            let statusLabel = 'Scheduled';
            if (isCompleted) statusLabel = '✓ Done';
            else if (isSkipped) statusLabel = 'Skipped';
            else if (isCurrent) statusLabel = 'Active Now';

            html += `
                <div class="${itemClass}">
                    <span class="${dotClass}"></span>
                    <span class="timeline-time">${item.startTime}</span>
                    <span class="timeline-label">Waheguru Simran (${item.durationMinutes}m)</span>
                    <span class="timeline-status">${statusLabel}</span>
                </div>`;
        });

        container.innerHTML = html;
    }

    renderAchievements() {
        const unlockedIds = new Set(this.statsEngine.history.achievements.map(a => a.id));
        const previewBadges = document.querySelectorAll('.achievement-badge');
        previewBadges.forEach(badge => {
            const id = badge.getAttribute('data-id');
            if (unlockedIds.has(id)) {
                badge.classList.remove('locked');
                badge.classList.add('unlocked');
            } else {
                badge.classList.add('locked');
                badge.classList.remove('unlocked');
            }
        });

        const countEl = document.getElementById('achievementsUnlocked');
        if (countEl) {
            countEl.textContent = `${unlockedIds.size} unlocked`;
        }
    }

    initWisdom() {
        this.cycleWisdom(0);
    }

    cycleWisdom(index = null) {
        const quotes = NAAM_CONFIG.WISDOM_QUOTES;
        const selected = index !== null ? quotes[index] : quotes[Math.floor(Math.random() * quotes.length)];

        const qEl = document.getElementById('wisdomQuote');
        const tEl = document.getElementById('wisdomTranslation');
        const sEl = document.getElementById('wisdomSource');

        if (qEl) qEl.textContent = `"${selected.gurmukhi}"`;
        if (tEl) tEl.textContent = selected.translation;
        if (sEl) sEl.textContent = `— ${selected.source}`;
    }

    populateSettingsForm() {
        const startSelect = document.getElementById('activeHoursStart');
        const endSelect = document.getElementById('activeHoursEnd');
        const customInput = document.getElementById('durationCustomInput');
        const autoStartToggle = document.getElementById('autoStartTimer');

        if (startSelect) startSelect.value = String(this.config.activeHours?.start || 5);
        if (endSelect) endSelect.value = String(this.config.activeHours?.end || 22);
        if (customInput) customInput.value = String(this.config.duration || 2);
        if (autoStartToggle) autoStartToggle.checked = !!this.config.autoStartTimer;
    }

    saveSettingsForm() {
        const startSelect = document.getElementById('activeHoursStart');
        const endSelect = document.getElementById('activeHoursEnd');
        const customInput = document.getElementById('durationCustomInput');
        const autoStartToggle = document.getElementById('autoStartTimer');

        if (startSelect) this.config.activeHours.start = Number(startSelect.value);
        if (endSelect) this.config.activeHours.end = Number(endSelect.value);
        if (customInput) this.config.duration = Number(customInput.value);
        if (autoStartToggle) this.config.autoStartTimer = autoStartToggle.checked;

        this.saveConfig();
        this.scheduleManager.generateDailySchedule();
        this.syncNativeNotifications();
        this.updateUI();
    }

    renderFullStatsContent() {
        const contentEl = document.getElementById('statsPanelContent');
        if (!contentEl) return;

        const activeHours = this.getActiveHoursCount();
        const today = this.statsEngine.getTodayStats(activeHours);
        const stats = this.statsEngine.history.statistics;
        const achievements = this.statsEngine.history.achievements;

        contentEl.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="stat-cell">
                        <span class="stat-number">${today.currentStreak}</span>
                        <span class="stat-name">Current Streak</span>
                    </div>
                    <div class="stat-cell">
                        <span class="stat-number">${today.longestStreak}</span>
                        <span class="stat-name">Longest Streak</span>
                    </div>
                    <div class="stat-cell">
                        <span class="stat-number">${stats.completedSessions || 0}</span>
                        <span class="stat-name">Total Completed</span>
                    </div>
                    <div class="stat-cell">
                        <span class="stat-number">${Math.round((stats.totalTimeSeconds || 0) / 60)}m</span>
                        <span class="stat-name">Total Practice</span>
                    </div>
                </div>

                <h3 style="font-size:1rem; font-weight:700; margin-top:8px; color:var(--sp-text-primary);">All Achievements</h3>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${NAAM_CONFIG.ACHIEVEMENTS.map(ach => {
                        const isUnlocked = achievements.some(a => a.id === ach.id);
                        return `
                            <div style="display:flex; align-items:center; gap:12px; padding:10px 14px; background:var(--sp-surface-inner); border-radius:var(--sp-radius-inner); opacity:${isUnlocked ? '1' : '0.5'}; border:1px solid var(--sp-border-inner);">
                                <span style="font-size:1.5rem;">${ach.icon}</span>
                                <div style="flex:1;">
                                    <div style="font-size:0.875rem; font-weight:700; color:var(--sp-text-primary);">${ach.name} ${isUnlocked ? '✓' : ''}</div>
                                    <div style="font-size:0.75rem; color:var(--sp-text-tertiary);">${ach.description}</div>
                                </div>
                            </div>`;
                    }).join('')}
                </div>
            </div>`;
    }

    hideLoadingScreen() {
        const loader = document.getElementById('appLoading');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.pointerEvents = 'none';
            setTimeout(() => loader.remove(), 400);
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: rgba(15, 15, 20, 0.92);
            backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(212, 148, 58, 0.4);
            color: #FAF8F5;
            padding: 12px 20px;
            border-radius: 99px;
            font-size: 0.875rem;
            font-weight: 600;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
            animation: sp-fadeIn 0.3s ease-out;
            pointer-events: auto;
            text-align: center;
        `;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   8. BOOTSTRAPPER
═══════════════════════════════════════════════════════════════════════════════ */

let naamAbhyasInstance = null;

function bootNaamAbhyas() {
    if (!naamAbhyasInstance) {
        naamAbhyasInstance = new NaamAbhyas();
        window.naamAbhyas = naamAbhyasInstance;
        window.naamAbhyasApp = naamAbhyasInstance;
        naamAbhyasInstance.init();
        console.log('[NaamAbhyas] 🚀 Initialized and active');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootNaamAbhyas, { once: true });
} else {
    bootNaamAbhyas();
}
