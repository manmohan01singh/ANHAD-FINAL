/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * STATISTICS ENGINE - Nitnem Tracker Analytics
 * ═══════════════════════════════════════════════════════════════════════════════
 * Provides statistical analysis and insights for spiritual practice tracking
 */

'use strict';

class StatisticsEngine {
    constructor() {
        this.STORAGE_KEYS = {
            AMRITVELA_LOG: 'nitnemTracker_amritvelaLog',
            NITNEM_LOG: 'nitnemTracker_nitnemLog',
            MALA_LOG: 'nitnemTracker_malaLog',
            ALARM_LOG: 'nitnemTracker_alarmLog',
            STREAK_DATA: 'nitnemTracker_streakData'
        };
    }

    /**
     * Load data from storage
     */
    loadData(key, defaultValue = {}) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    /**
     * Get overall statistics
     */
    getOverallStats() {
        const amritvelaLog = this.loadData(this.STORAGE_KEYS.AMRITVELA_LOG);
        const nitnemLog = this.loadData(this.STORAGE_KEYS.NITNEM_LOG);
        const malaLog = this.loadData(this.STORAGE_KEYS.MALA_LOG);
        const streakData = this.loadData(this.STORAGE_KEYS.STREAK_DATA);

        // Count total days with any activity
        const allDates = new Set([
            ...Object.keys(amritvelaLog),
            ...Object.keys(nitnemLog),
            ...Object.keys(malaLog)
        ]);

        // Count Amritvela days
        const amritvelaDays = Object.values(amritvelaLog).filter(e => e.woke).length;

        // Count Nitnem days
        const nitnemDays = Object.values(nitnemLog).filter(e =>
            e.completed && e.completed.length > 0
        ).length;

        // Count total malas
        const totalMalas = Object.values(malaLog).reduce((sum, e) =>
            sum + (e.completedMalas || 0), 0
        );

        // Total naam jaap
        const totalJaap = Object.values(malaLog).reduce((sum, e) =>
            sum + (e.totalCount || 0), 0
        );

        return {
            totalActiveDays: allDates.size,
            amritvelaDays,
            nitnemDays,
            totalMalas,
            totalJaap,
            currentStreak: streakData.current || 0,
            longestStreak: streakData.longest || 0
        };
    }

    /**
     * Get this week's statistics
     */
    getWeeklyStats() {
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            weekDates.push(d.toISOString().split('T')[0]);
        }

        const amritvelaLog = this.loadData(this.STORAGE_KEYS.AMRITVELA_LOG);
        const nitnemLog = this.loadData(this.STORAGE_KEYS.NITNEM_LOG);
        const malaLog = this.loadData(this.STORAGE_KEYS.MALA_LOG);

        let amritvelaDays = 0;
        let nitnemDays = 0;
        let totalMalas = 0;
        let totalJaap = 0;

        weekDates.forEach(date => {
            if (amritvelaLog[date]?.woke) amritvelaDays++;
            if (nitnemLog[date]?.completed?.length > 0) nitnemDays++;
            totalMalas += malaLog[date]?.completedMalas || 0;
            totalJaap += malaLog[date]?.totalCount || 0;
        });

        return {
            dates: weekDates,
            amritvelaDays,
            amritvelaRate: Math.round((amritvelaDays / 7) * 100),
            nitnemDays,
            nitnemRate: Math.round((nitnemDays / 7) * 100),
            totalMalas,
            totalJaap
        };
    }

    /**
     * Get today's statistics
     */
    getTodayStats() {
        const today = new Date().toISOString().split('T')[0];

        const amritvelaLog = this.loadData(this.STORAGE_KEYS.AMRITVELA_LOG);
        const nitnemLog = this.loadData(this.STORAGE_KEYS.NITNEM_LOG);
        const malaLog = this.loadData(this.STORAGE_KEYS.MALA_LOG);

        return {
            date: today,
            amritvela: amritvelaLog[today] || { woke: false },
            nitnem: nitnemLog[today] || { completed: [] },
            mala: malaLog[today] || { completedMalas: 0, totalCount: 0 }
        };
    }

    /**
     * Calculate completion percentage for today
     */
    getTodayCompletionRate() {
        const today = this.getTodayStats();
        let completed = 0;
        let total = 0;

        // Amritvela counts as 1
        total++;
        if (today.amritvela.woke) completed++;

        // Nitnem banis
        try {
            const selectedBanis = JSON.parse(localStorage.getItem('nitnemTracker_selectedBanis') || '{}');
            const totalBanis =
                (selectedBanis.amritvela?.length || 0) +
                (selectedBanis.rehras?.length || 0) +
                (selectedBanis.sohila?.length || 0);

            total += totalBanis;
            completed += (today.nitnem.completed?.length || 0);
        } catch (e) {
            // Ignore
        }

        return total > 0 ? Math.round((completed / total) * 100) : 0;
    }

    /**
     * Get best performing day of week
     */
    getBestDay() {
        const amritvelaLog = this.loadData(this.STORAGE_KEYS.AMRITVELA_LOG);
        const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        Object.entries(amritvelaLog).forEach(([date, entry]) => {
            if (entry.woke) {
                const d = new Date(date);
                dayCount[d.getDay()]++;
            }
        });

        const bestDayIndex = dayCount.indexOf(Math.max(...dayCount));
        return {
            day: dayNames[bestDayIndex],
            count: dayCount[bestDayIndex]
        };
    }

    /**
     * Get average wake time for Amritvela
     */
    getAverageWakeTime() {
        const amritvelaLog = this.loadData(this.STORAGE_KEYS.AMRITVELA_LOG);
        const times = [];

        Object.values(amritvelaLog).forEach(entry => {
            if (entry.woke && entry.time) {
                const match = entry.time.match(/(\d+):(\d+)/);
                if (match) {
                    times.push(parseInt(match[1]) * 60 + parseInt(match[2]));
                }
            }
        });

        if (times.length === 0) return null;

        const avgMinutes = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const hours = Math.floor(avgMinutes / 60);
        const mins = avgMinutes % 60;

        return `${hours}:${mins.toString().padStart(2, '0')} AM`;
    }
}

// Export to window
window.StatisticsEngine = StatisticsEngine;
