/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD User Statistics System
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Centralized tracking for all user activity:
 * - Listening time (Gurbani Radio)
 * - Reading progress (Sehaj Paath, Nitnem)
 * - Streak tracking
 * - Daily goals
 * 
 * Uses UnifiedStorage for persistence.
 */

(function () {
    'use strict';

    const STATS_KEY = 'anhad_user_stats';
    const STREAK_KEY = 'anhad_streak_data';
    const GOALS_KEY = 'anhad_daily_goals';

    // ═══════════════════════════════════════════════════════════════════════════
    // STATS STRUCTURE
    // ═══════════════════════════════════════════════════════════════════════════

    const defaultStats = {
        // Lifetime stats
        totalListeningMinutes: 0,
        totalPagesRead: 0,
        totalNitnemCompleted: 0,
        totalShabadsViewed: 0,
        totalDaysActive: 0,

        // Session stats
        sessionListeningMinutes: 0,
        sessionStartTime: null,

        // Today's stats
        todayListeningMinutes: 0,
        todayPagesRead: 0,
        todayNitnemCount: 0,
        todayDate: null,

        // First use date
        firstUseDate: null,
        lastActiveDate: null
    };

    const defaultStreak = {
        currentStreak: 0,
        longestStreak: 0,
        lastCheckIn: null,
        freezesUsed: 0,
        freezesAvailable: 1, // 1 free freeze per 7 days

        // Milestones achieved
        milestones: {
            day1: false,
            day7: false,
            day21: false,
            day40: false,
            day108: false,
            day365: false
        }
    };

    const defaultGoals = {
        readPages: { target: 5, current: 0, enabled: true },
        listenMinutes: { target: 30, current: 0, enabled: true },
        completeNitnem: { target: 1, current: 0, enabled: true },
        naamAbhyas: { target: 1, current: 0, enabled: false }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // STORAGE HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    function getStats() {
        try {
            const stored = localStorage.getItem(STATS_KEY);
            return stored ? { ...defaultStats, ...JSON.parse(stored) } : { ...defaultStats };
        } catch (e) {
            console.error('[UserStats] Error reading stats:', e);
            return { ...defaultStats };
        }
    }

    function saveStats(stats) {
        try {
            localStorage.setItem(STATS_KEY, JSON.stringify(stats));
            // Dispatch event for dashboard updates
            window.dispatchEvent(new CustomEvent('statsUpdated', { detail: stats }));
        } catch (e) {
            console.error('[UserStats] Error saving stats:', e);
        }
    }

    function getStreak() {
        try {
            const stored = localStorage.getItem(STREAK_KEY);
            return stored ? { ...defaultStreak, ...JSON.parse(stored) } : { ...defaultStreak };
        } catch (e) {
            return { ...defaultStreak };
        }
    }

    function saveStreak(streak) {
        try {
            localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
            window.dispatchEvent(new CustomEvent('streakUpdated', { detail: streak }));
        } catch (e) {
            console.error('[UserStats] Error saving streak:', e);
        }
    }

    function getGoals() {
        try {
            const stored = localStorage.getItem(GOALS_KEY);
            return stored ? { ...defaultGoals, ...JSON.parse(stored) } : { ...defaultGoals };
        } catch (e) {
            return { ...defaultGoals };
        }
    }

    function saveGoals(goals) {
        try {
            localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
            window.dispatchEvent(new CustomEvent('goalsUpdated', { detail: goals }));
        } catch (e) {
            console.error('[UserStats] Error saving goals:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DATE HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    function getTodayString() {
        return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    }

    function isToday(dateString) {
        return dateString === getTodayString();
    }

    function isYesterday(dateString) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return dateString === yesterday.toISOString().split('T')[0];
    }

    function daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STATS TRACKING FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function checkAndResetDaily() {
        const stats = getStats();
        const today = getTodayString();

        if (stats.todayDate !== today) {
            // New day - reset daily stats
            stats.todayDate = today;
            stats.todayListeningMinutes = 0;
            stats.todayPagesRead = 0;
            stats.todayNitnemCount = 0;
            stats.totalDaysActive++;

            // Set first use date if not set
            if (!stats.firstUseDate) {
                stats.firstUseDate = today;
            }

            saveStats(stats);

            // Also reset daily goals progress
            const goals = getGoals();
            Object.keys(goals).forEach(key => {
                goals[key].current = 0;
            });
            saveGoals(goals);
        }

        return stats;
    }

    function addListeningTime(minutes) {
        const stats = checkAndResetDaily();
        stats.totalListeningMinutes += minutes;
        stats.todayListeningMinutes += minutes;
        stats.sessionListeningMinutes += minutes;
        stats.lastActiveDate = getTodayString();
        saveStats(stats);

        // Update goals
        const goals = getGoals();
        if (goals.listenMinutes.enabled) {
            goals.listenMinutes.current += minutes;
            saveGoals(goals);
        }

        // Update streak
        updateStreak();

        return stats;
    }

    function addPagesRead(pages) {
        const stats = checkAndResetDaily();
        stats.totalPagesRead += pages;
        stats.todayPagesRead += pages;
        stats.lastActiveDate = getTodayString();
        saveStats(stats);

        // Update goals
        const goals = getGoals();
        if (goals.readPages.enabled) {
            goals.readPages.current += pages;
            saveGoals(goals);
        }

        updateStreak();
        return stats;
    }

    function addNitnemCompleted(count = 1) {
        const stats = checkAndResetDaily();
        stats.totalNitnemCompleted += count;
        stats.todayNitnemCount += count;
        stats.lastActiveDate = getTodayString();
        saveStats(stats);

        // Update goals
        const goals = getGoals();
        if (goals.completeNitnem.enabled) {
            goals.completeNitnem.current += count;
            saveGoals(goals);
        }

        updateStreak();
        return stats;
    }

    function addShabadViewed() {
        const stats = checkAndResetDaily();
        stats.totalShabadsViewed++;
        stats.lastActiveDate = getTodayString();
        saveStats(stats);
        updateStreak();
        return stats;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STREAK SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    function updateStreak() {
        const streak = getStreak();
        const today = getTodayString();

        // Already checked in today
        if (streak.lastCheckIn === today) {
            return streak;
        }

        if (!streak.lastCheckIn) {
            // First ever check-in
            streak.currentStreak = 1;
            streak.lastCheckIn = today;
        } else if (isYesterday(streak.lastCheckIn)) {
            // Continued streak
            streak.currentStreak++;
            streak.lastCheckIn = today;
        } else {
            // Streak broken - check if freeze available
            const daysMissed = daysBetween(streak.lastCheckIn, today);

            if (daysMissed === 2 && streak.freezesAvailable > 0) {
                // Use freeze for 1 day miss
                streak.freezesAvailable--;
                streak.freezesUsed++;
                streak.currentStreak++;
                streak.lastCheckIn = today;
                console.log('❄️ Streak freeze used!');
            } else {
                // Streak broken
                streak.currentStreak = 1;
                streak.lastCheckIn = today;
                console.log('💔 Streak reset to 1');
            }
        }

        // Update longest streak
        if (streak.currentStreak > streak.longestStreak) {
            streak.longestStreak = streak.currentStreak;
        }

        // Check milestones
        const milestones = [1, 7, 21, 40, 108, 365];
        milestones.forEach(day => {
            if (streak.currentStreak >= day && !streak.milestones[`day${day}`]) {
                streak.milestones[`day${day}`] = true;
                celebrateMilestone(day);
            }
        });

        // Refresh freeze every 7 days of streak
        if (streak.currentStreak % 7 === 0 && streak.freezesAvailable < 1) {
            streak.freezesAvailable = 1;
            console.log('❄️ Streak freeze restored!');
        }

        saveStreak(streak);
        return streak;
    }

    function celebrateMilestone(days) {
        console.log(`🎉 Milestone achieved: ${days} day streak!`);

        // Dispatch celebration event
        window.dispatchEvent(new CustomEvent('milestoneAchieved', {
            detail: { days, message: getMilestoneMessage(days) }
        }));
    }

    function getMilestoneMessage(days) {
        const messages = {
            1: '🌱 First step on your spiritual journey!',
            7: '🙏 One week of devotion!',
            21: '⭐ 21 days - A habit is forming!',
            40: '🪷 40 days - Chalisaa complete!',
            108: '📿 108 days - Mala milestone!',
            365: '👑 One full year of dedication!'
        };
        return messages[days] || `🎯 ${days} day streak!`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GOALS SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    function setGoalTarget(goalKey, target) {
        const goals = getGoals();
        if (goals[goalKey]) {
            goals[goalKey].target = target;
            saveGoals(goals);
        }
        return goals;
    }

    function toggleGoal(goalKey, enabled) {
        const goals = getGoals();
        if (goals[goalKey]) {
            goals[goalKey].enabled = enabled;
            saveGoals(goals);
        }
        return goals;
    }

    function getGoalProgress() {
        const goals = getGoals();
        const progress = {};

        Object.keys(goals).forEach(key => {
            const goal = goals[key];
            progress[key] = {
                ...goal,
                percent: Math.min(100, Math.round((goal.current / goal.target) * 100)),
                complete: goal.current >= goal.target
            };
        });

        return progress;
    }

    function areAllGoalsComplete() {
        const goals = getGoals();
        return Object.values(goals)
            .filter(g => g.enabled)
            .every(g => g.current >= g.target);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LISTENING TIME TRACKER
    // ═══════════════════════════════════════════════════════════════════════════

    let listeningInterval = null;

    function startListeningSession() {
        if (listeningInterval) return;

        const stats = getStats();
        stats.sessionStartTime = Date.now();
        stats.sessionListeningMinutes = 0;
        saveStats(stats);

        // Track every minute
        listeningInterval = setInterval(() => {
            addListeningTime(1);
        }, 60000); // 1 minute

        console.log('🎧 Listening session started');
    }

    function stopListeningSession() {
        if (listeningInterval) {
            clearInterval(listeningInterval);
            listeningInterval = null;
            console.log('🎧 Listening session stopped');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SUMMARY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function getSummary() {
        const stats = checkAndResetDaily();
        const streak = getStreak();
        const goals = getGoalProgress();

        return {
            // Today
            todayListeningMinutes: stats.todayListeningMinutes,
            todayPagesRead: stats.todayPagesRead,
            todayNitnemCount: stats.todayNitnemCount,

            // Lifetime
            totalListeningMinutes: stats.totalListeningMinutes,
            totalListeningHours: Math.round(stats.totalListeningMinutes / 60 * 10) / 10,
            totalPagesRead: stats.totalPagesRead,
            totalNitnemCompleted: stats.totalNitnemCompleted,
            totalShabadsViewed: stats.totalShabadsViewed,
            totalDaysActive: stats.totalDaysActive,

            // Streak
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            freezesAvailable: streak.freezesAvailable,
            milestones: streak.milestones,

            // Goals
            goals: goals,
            allGoalsComplete: areAllGoalsComplete(),

            // Dates
            firstUseDate: stats.firstUseDate,
            memberDays: stats.firstUseDate ? daysBetween(stats.firstUseDate, getTodayString()) : 0
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUDIO INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════════

    // Listen for audio state changes
    window.addEventListener('anhadaudiostatechange', (e) => {
        if (e.detail && e.detail.isPlaying) {
            startListeningSession();
        } else {
            stopListeningSession();
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    // Check daily reset on load
    checkAndResetDaily();

    // Track page visit as activity
    updateStreak();

    // Expose global API
    window.AnhadStats = {
        // Get data
        getStats,
        getStreak,
        getGoals,
        getGoalProgress,
        getSummary,

        // Track activity
        addListeningTime,
        addPagesRead,
        addNitnemCompleted,
        addShabadViewed,

        // Listening session
        startListeningSession,
        stopListeningSession,

        // Goals
        setGoalTarget,
        toggleGoal,
        areAllGoalsComplete,

        // Streak
        updateStreak,

        // Debug
        resetStats: () => {
            localStorage.removeItem(STATS_KEY);
            localStorage.removeItem(STREAK_KEY);
            localStorage.removeItem(GOALS_KEY);
            console.log('🗑️ All stats reset');
        }
    };

    console.log('📊 ANHAD User Stats System loaded');
    console.log('📈 Current streak:', getStreak().currentStreak, 'days');
})();
