/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * STATS TRACKER - Statistics and Analytics for Naam Abhyas
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

class StatsTracker {
    constructor(history) {
        this.history = history || this.getDefaultHistory();
    }

    /**
     * Get default history structure
     */
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

    /**
     * Update history reference
     */
    setHistory(history) {
        this.history = history;
    }

    /**
     * Get today's statistics
     */
    getTodayStats() {
        const today = this.getTodayString();
        const todaySessions = this.history.sessions.filter(s => s.date === today);

        return {
            completed: todaySessions.filter(s => s.status === 'completed').length,
            skipped: todaySessions.filter(s => s.status === 'skipped').length,
            total: todaySessions.length,
            timeSpent: todaySessions
                .filter(s => s.status === 'completed')
                .reduce((acc, s) => acc + (s.duration || 0), 0),
            sessions: todaySessions
        };
    }

    /**
     * Get this week's statistics
     */
    getWeekStats() {
        const weekStart = this.getWeekStart();
        const weekSessions = this.history.sessions.filter(s =>
            new Date(s.date) >= weekStart
        );

        // Group by day
        const byDay = {};
        weekSessions.forEach(session => {
            if (!byDay[session.date]) {
                byDay[session.date] = { completed: 0, skipped: 0, total: 0 };
            }
            byDay[session.date].total++;
            if (session.status === 'completed') {
                byDay[session.date].completed++;
            } else {
                byDay[session.date].skipped++;
            }
        });

        return {
            completed: weekSessions.filter(s => s.status === 'completed').length,
            skipped: weekSessions.filter(s => s.status === 'skipped').length,
            total: weekSessions.length,
            byDay: byDay,
            activeDays: Object.keys(byDay).length
        };
    }

    /**
     * Get this month's statistics
     */
    getMonthStats() {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthSessions = this.history.sessions.filter(s =>
            new Date(s.date) >= monthStart
        );

        // Group by day
        const byDay = {};
        monthSessions.forEach(session => {
            if (!byDay[session.date]) {
                byDay[session.date] = { completed: 0, skipped: 0 };
            }
            if (session.status === 'completed') {
                byDay[session.date].completed++;
            } else {
                byDay[session.date].skipped++;
            }
        });

        return {
            completed: monthSessions.filter(s => s.status === 'completed').length,
            skipped: monthSessions.filter(s => s.status === 'skipped').length,
            total: monthSessions.length,
            byDay: byDay,
            activeDays: Object.keys(byDay).length,
            avgPerDay: Object.keys(byDay).length > 0
                ? (monthSessions.filter(s => s.status === 'completed').length / Object.keys(byDay).length).toFixed(1)
                : 0
        };
    }

    /**
     * Get all-time statistics
     */
    getAllTimeStats() {
        const stats = this.history.statistics;

        // Calculate unique active days
        const activeDays = new Set(
            this.history.sessions.map(s => s.date)
        ).size;

        // Calculate average session duration
        const completedSessions = this.history.sessions.filter(s => s.status === 'completed');
        const avgDuration = completedSessions.length > 0
            ? completedSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / completedSessions.length
            : 0;

        return {
            ...stats,
            activeDays,
            avgDuration: Math.round(avgDuration),
            formattedTime: this.formatDuration(stats.totalTimeSeconds)
        };
    }

    /**
     * Get streak data
     */
    getStreakData() {
        const stats = this.history.statistics;

        return {
            current: stats.currentStreak,
            longest: stats.longestStreak,
            isActive: stats.currentStreak > 0,
            message: this.getStreakMessage(stats.currentStreak)
        };
    }

    /**
     * Get motivational streak message
     */
    getStreakMessage(streak) {
        if (streak === 0) {
            return "Start your spiritual journey today!";
        } else if (streak < 5) {
            return "Great start! Keep going!";
        } else if (streak < 10) {
            return "You're building a habit! 🔥";
        } else if (streak < 24) {
            return "Amazing dedication! 🌟";
        } else if (streak < 48) {
            return "A full day+ of devotion! 🙏";
        } else if (streak < 100) {
            return "Truly devoted! Keep shining! ✨";
        } else {
            return "Waheguru is proud! 🏆";
        }
    }

    /**
     * Calculate hourly distribution
     */
    getHourlyDistribution() {
        const distribution = {};

        // Initialize all hours
        for (let h = 0; h < 24; h++) {
            distribution[h] = { completed: 0, skipped: 0 };
        }

        // Count sessions by hour
        this.history.sessions.forEach(session => {
            const hour = session.hour;
            if (distribution[hour]) {
                if (session.status === 'completed') {
                    distribution[hour].completed++;
                } else {
                    distribution[hour].skipped++;
                }
            }
        });

        return distribution;
    }

    /**
     * Get best performing hour
     */
    getBestHour() {
        const distribution = this.getHourlyDistribution();
        let bestHour = null;
        let maxCompleted = 0;

        Object.entries(distribution).forEach(([hour, data]) => {
            if (data.completed > maxCompleted) {
                maxCompleted = data.completed;
                bestHour = parseInt(hour);
            }
        });

        return {
            hour: bestHour,
            count: maxCompleted,
            formatted: bestHour !== null ? this.formatHour(bestHour) : 'N/A'
        };
    }

    /**
     * Get completion trends (last 7 days)
     */
    getWeeklyTrend() {
        const trend = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-CA');

            const daySessions = this.history.sessions.filter(s => s.date === dateStr);
            const completed = daySessions.filter(s => s.status === 'completed').length;
            const skipped = daySessions.filter(s => s.status === 'skipped').length;

            trend.push({
                date: dateStr,
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                completed,
                skipped,
                total: completed + skipped,
                rate: completed + skipped > 0
                    ? Math.round((completed / (completed + skipped)) * 100)
                    : 0
            });
        }

        return trend;
    }

    /**
     * Calculate consistency score (0-100)
     */
    getConsistencyScore() {
        const weekTrend = this.getWeeklyTrend();
        const activeDays = weekTrend.filter(d => d.total > 0).length;
        const avgCompletionRate = weekTrend.reduce((acc, d) => acc + d.rate, 0) / 7;

        // Score based on: active days (40%) + completion rate (60%)
        const score = Math.round((activeDays / 7) * 40 + (avgCompletionRate / 100) * 60);

        return {
            score,
            activeDaysThisWeek: activeDays,
            avgCompletionRate: Math.round(avgCompletionRate),
            rating: this.getConsistencyRating(score)
        };
    }

    /**
     * Get consistency rating label
     */
    getConsistencyRating(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 75) return 'Great';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Improving';
        if (score >= 20) return 'Getting Started';
        return 'Begin Today';
    }

    /**
     * Export statistics as JSON
     */
    exportStats() {
        return {
            exportDate: new Date().toISOString(),
            allTime: this.getAllTimeStats(),
            thisWeek: this.getWeekStats(),
            thisMonth: this.getMonthStats(),
            weeklyTrend: this.getWeeklyTrend(),
            consistency: this.getConsistencyScore(),
            bestHour: this.getBestHour(),
            achievements: this.history.achievements
        };
    }

    /* ═════════════════════════════════════════════════════════════════════════
       UTILITY FUNCTIONS
    ═════════════════════════════════════════════════════════════════════════ */

    getTodayString() {
        return new Date().toLocaleDateString('en-CA');
    }

    getWeekStart() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(now);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    formatHour(hour) {
        const h = hour % 12 || 12;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${h}:00 ${ampm}`;
    }
}

// Export for global usage
window.StatsTracker = StatsTracker;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatsTracker;
}
