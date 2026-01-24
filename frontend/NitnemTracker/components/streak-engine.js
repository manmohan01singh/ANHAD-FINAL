/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * STREAK ENGINE - Spiritual Progress Streak Calculator
 * ═══════════════════════════════════════════════════════════════════════════════
 * Tracks continuous spiritual practice streaks
 */

'use strict';

class StreakEngine {
    constructor() {
        this.STORAGE_KEY = 'nitnemTracker_streakData';
        this.AMRITVELA_KEY = 'nitnemTracker_amritvelaLog';
        this.NITNEM_KEY = 'nitnemTracker_nitnemLog';
    }

    /**
     * Load streak data from storage
     */
    loadStreakData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : this.getDefaultStreakData();
        } catch (e) {
            return this.getDefaultStreakData();
        }
    }

    /**
     * Save streak data to storage
     */
    saveStreakData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save streak data:', e);
        }
    }

    /**
     * Get default streak data structure
     */
    getDefaultStreakData() {
        return {
            current: 0,
            longest: 0,
            lastDate: null,
            history: []
        };
    }

    /**
     * Get today's date string in YYYY-MM-DD format
     */
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Get yesterday's date string
     */
    getYesterdayString() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    }

    /**
     * Calculate current streak based on completed days
     */
    calculateStreak() {
        const amritvelaLog = this.loadLog(this.AMRITVELA_KEY);
        const nitnemLog = this.loadLog(this.NITNEM_KEY);

        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 365; i++) { // Check up to a year
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const hasAmritvela = amritvelaLog[dateStr]?.woke === true;
            const hasNitnem = this.isNitnemComplete(nitnemLog[dateStr]);

            // A complete day requires both Amritvela and Nitnem
            if (hasAmritvela && hasNitnem) {
                streak++;
            } else if (i > 0) {
                // If not today and not complete, break streak
                break;
            }
        }

        return streak;
    }

    /**
     * Check if Nitnem is complete for a day
     */
    isNitnemComplete(dayLog) {
        if (!dayLog) return false;

        try {
            const selectedBanis = JSON.parse(localStorage.getItem('nitnemTracker_selectedBanis') || '{}');
            const totalRequired =
                (selectedBanis.amritvela?.length || 0) +
                (selectedBanis.rehras?.length || 0) +
                (selectedBanis.sohila?.length || 0);

            if (totalRequired === 0) return true; // No banis selected means technically complete

            const completed = dayLog.completed || [];
            return completed.length >= totalRequired;
        } catch (e) {
            return false;
        }
    }

    /**
     * Load a log from storage
     */
    loadLog(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    /**
     * Update streak after marking attendance or completing banis
     */
    updateStreak() {
        const streakData = this.loadStreakData();
        const today = this.getTodayString();
        const yesterday = this.getYesterdayString();

        const currentStreak = this.calculateStreak();

        // Update data
        streakData.current = currentStreak;
        streakData.lastDate = today;

        // Update longest if current is higher
        if (currentStreak > streakData.longest) {
            streakData.longest = currentStreak;
        }

        // Add to history if not already there
        if (!streakData.history) {
            streakData.history = [];
        }

        if (!streakData.history.includes(today)) {
            streakData.history.push(today);
            // Keep only last 365 days
            if (streakData.history.length > 365) {
                streakData.history = streakData.history.slice(-365);
            }
        }

        this.saveStreakData(streakData);

        return streakData;
    }

    /**
     * Get streak statistics
     */
    getStats() {
        const streakData = this.loadStreakData();
        const currentStreak = this.calculateStreak();

        return {
            current: currentStreak,
            longest: streakData.longest || 0,
            totalDays: streakData.history?.length || 0,
            lastDate: streakData.lastDate
        };
    }

    /**
     * Check if streak is at risk (yesterday wasn't complete)
     */
    isStreakAtRisk() {
        const yesterday = this.getYesterdayString();
        const amritvelaLog = this.loadLog(this.AMRITVELA_KEY);
        const nitnemLog = this.loadLog(this.NITNEM_KEY);

        const hadAmritvela = amritvelaLog[yesterday]?.woke === true;
        const hadNitnem = this.isNitnemComplete(nitnemLog[yesterday]);

        return !(hadAmritvela && hadNitnem);
    }

    /**
     * Get motivational message based on streak
     */
    getStreakMessage(streak) {
        if (streak === 0) {
            return "Start your spiritual journey today!";
        } else if (streak < 7) {
            return `${streak} day streak! Keep building momentum!`;
        } else if (streak < 30) {
            return `${streak} day streak! You're developing a strong habit!`;
        } else if (streak < 100) {
            return `${streak} day streak! Exceptional dedication!`;
        } else {
            return `${streak} day streak! A true Gursikh!`;
        }
    }
}

// Export to window
window.StreakEngine = StreakEngine;
