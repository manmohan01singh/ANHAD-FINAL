/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  DISCIPLINE METRICS TRACKER
 *  
 *  Product-minded KPIs for Naam Abhyas discipline training:
 *  
 *  - Session completion rate
 *  - Missed vs attended slots
 *  - Longest streak
 *  - Total minutes this week
 *  - "Perfect day" badge (all slots done)
 *  - Weekly trends
 *  
 *  "Discipline thrives on visibility"
 *  
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class DisciplineMetrics {
    constructor(historyData) {
        this.history = historyData || this.getDefaultHistory();
        this.STORAGE_KEY = 'naam_abhyas_discipline_metrics';
        this.loadMetrics();
    }

    /**
     * Load persisted metrics
     */
    loadMetrics() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.metrics = { ...this.getDefaultMetrics(), ...parsed };
            } else {
                this.metrics = this.getDefaultMetrics();
            }
        } catch (e) {
            console.error('[DisciplineMetrics] Failed to load:', e);
            this.metrics = this.getDefaultMetrics();
        }
    }

    /**
     * Save metrics to storage
     */
    saveMetrics() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.metrics));
        } catch (e) {
            console.error('[DisciplineMetrics] Failed to save:', e);
        }
    }

    /**
     * Default metrics structure
     */
    getDefaultMetrics() {
        return {
            // Overall stats
            totalSessionsAttempted: 0,
            totalSessionsCompleted: 0,
            totalSessionsSkipped: 0,
            totalSessionsMissed: 0,

            // Time tracking
            totalMinutesCompleted: 0,
            totalMinutesThisWeek: 0,
            averageSessionDuration: 0,

            // Streak tracking  
            currentStreak: 0,
            longestStreak: 0,
            currentDayStreak: 0, // Days in a row with at least 1 session
            longestDayStreak: 0,

            // Daily metrics
            dailyStats: {}, // { 'YYYY-MM-DD': { completed: 0, skipped: 0, missed: 0, expected: 0 } }

            // Weekly metrics
            weeklyStats: {}, // { 'YYYY-Wxx': { completed: 0, skipped: 0, missed: 0, perfectDays: 0 } }

            // Perfect days tracking
            perfectDays: [], // Array of dates with 100% completion
            perfectDaysThisWeek: 0,
            perfectDaysThisMonth: 0,

            // Last updated
            lastUpdated: null,
            lastSessionDate: null
        };
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
            }
        };
    }

    /**
     * Record a session outcome
     */
    recordSession(sessionData) {
        const today = this.getTodayString();
        const week = this.getWeekString();

        // Initialize daily stats if needed
        if (!this.metrics.dailyStats[today]) {
            this.metrics.dailyStats[today] = { completed: 0, skipped: 0, missed: 0, expected: 0 };
        }

        // Initialize weekly stats if needed
        if (!this.metrics.weeklyStats[week]) {
            this.metrics.weeklyStats[week] = { completed: 0, skipped: 0, missed: 0, perfectDays: 0, totalMinutes: 0 };
        }

        this.metrics.totalSessionsAttempted++;
        this.metrics.dailyStats[today].expected++;

        if (sessionData.status === 'completed') {
            this.recordCompletion(sessionData, today, week);
        } else if (sessionData.status === 'skipped') {
            this.recordSkip(today, week, sessionData.skipReason);
        }

        this.metrics.lastUpdated = new Date().toISOString();
        this.saveMetrics();

        return this.getSnapshot();
    }

    /**
     * Record a completed session
     */
    recordCompletion(sessionData, today, week) {
        this.metrics.totalSessionsCompleted++;
        this.metrics.dailyStats[today].completed++;
        this.metrics.weeklyStats[week].completed++;

        // Duration tracking
        const duration = sessionData.duration || 120; // seconds
        const minutes = duration / 60;
        this.metrics.totalMinutesCompleted += minutes;
        this.metrics.weeklyStats[week].totalMinutes += minutes;
        this.metrics.totalMinutesThisWeek = this.metrics.weeklyStats[week].totalMinutes;

        // Average session duration
        this.metrics.averageSessionDuration =
            this.metrics.totalMinutesCompleted / this.metrics.totalSessionsCompleted;

        // Streak tracking
        this.metrics.currentStreak++;
        if (this.metrics.currentStreak > this.metrics.longestStreak) {
            this.metrics.longestStreak = this.metrics.currentStreak;
        }

        // Day streak tracking
        if (this.metrics.lastSessionDate !== today) {
            // Check if yesterday was also a session day
            const yesterday = this.getYesterdayString();
            if (this.metrics.dailyStats[yesterday]?.completed > 0) {
                this.metrics.currentDayStreak++;
            } else if (this.metrics.lastSessionDate !== yesterday) {
                // Gap in days - reset streak
                this.metrics.currentDayStreak = 1;
            }

            if (this.metrics.currentDayStreak > this.metrics.longestDayStreak) {
                this.metrics.longestDayStreak = this.metrics.currentDayStreak;
            }

            this.metrics.lastSessionDate = today;
        }

        // Check for perfect day
        this.checkPerfectDay(today, week);
    }

    /**
     * Record a skipped session
     */
    recordSkip(today, week, reason) {
        if (reason === 'missed') {
            this.metrics.totalSessionsMissed++;
            this.metrics.dailyStats[today].missed++;
            this.metrics.weeklyStats[week].missed++;
        } else {
            this.metrics.totalSessionsSkipped++;
            this.metrics.dailyStats[today].skipped++;
            this.metrics.weeklyStats[week].skipped++;
        }

        // Reset hourly streak on skip
        this.metrics.currentStreak = 0;
    }

    /**
     * Check if today is a perfect day
     */
    checkPerfectDay(today, week) {
        const dayStats = this.metrics.dailyStats[today];
        if (!dayStats || dayStats.expected === 0) return;

        // Perfect day = all expected sessions completed, none skipped/missed
        if (dayStats.completed === dayStats.expected && dayStats.skipped === 0 && dayStats.missed === 0) {
            if (!this.metrics.perfectDays.includes(today)) {
                this.metrics.perfectDays.push(today);
                this.metrics.weeklyStats[week].perfectDays++;
                this.updatePerfectDayCounts();
            }
        }
    }

    /**
     * Update perfect day counts for week and month
     */
    updatePerfectDayCounts() {
        const weekStart = this.getWeekStartDate();
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        this.metrics.perfectDaysThisWeek = this.metrics.perfectDays.filter(d => {
            const date = new Date(d);
            return date >= weekStart;
        }).length;

        this.metrics.perfectDaysThisMonth = this.metrics.perfectDays.filter(d => {
            const date = new Date(d);
            return date >= monthStart;
        }).length;
    }

    /**
     * Get completion rate
     */
    getCompletionRate() {
        if (this.metrics.totalSessionsAttempted === 0) return 0;
        return (this.metrics.totalSessionsCompleted / this.metrics.totalSessionsAttempted) * 100;
    }

    /**
     * Get completion rate for today
     */
    getTodayCompletionRate() {
        const today = this.getTodayString();
        const dayStats = this.metrics.dailyStats[today];
        if (!dayStats || dayStats.expected === 0) return 0;
        return (dayStats.completed / dayStats.expected) * 100;
    }

    /**
     * Get this week's metrics snapshot
     */
    getWeeklySnapshot() {
        const week = this.getWeekString();
        const weekStats = this.metrics.weeklyStats[week] || { completed: 0, skipped: 0, missed: 0, perfectDays: 0, totalMinutes: 0 };

        const totalAttempted = weekStats.completed + weekStats.skipped + weekStats.missed;
        const completionRate = totalAttempted > 0 ? (weekStats.completed / totalAttempted) * 100 : 0;

        return {
            completed: weekStats.completed,
            skipped: weekStats.skipped,
            missed: weekStats.missed,
            totalMinutes: weekStats.totalMinutes,
            perfectDays: weekStats.perfectDays,
            completionRate: completionRate.toFixed(1)
        };
    }

    /**
     * Get full metrics snapshot
     */
    getSnapshot() {
        return {
            // Core stats
            completionRate: this.getCompletionRate().toFixed(1),
            todayCompletionRate: this.getTodayCompletionRate().toFixed(1),

            // Counts
            completed: this.metrics.totalSessionsCompleted,
            skipped: this.metrics.totalSessionsSkipped,
            missed: this.metrics.totalSessionsMissed,

            // Time
            totalMinutes: Math.round(this.metrics.totalMinutesCompleted),
            weeklyMinutes: Math.round(this.metrics.totalMinutesThisWeek),
            avgSessionMinutes: this.metrics.averageSessionDuration.toFixed(1),

            // Streaks
            currentStreak: this.metrics.currentStreak,
            longestStreak: this.metrics.longestStreak,
            currentDayStreak: this.metrics.currentDayStreak,
            longestDayStreak: this.metrics.longestDayStreak,

            // Perfect days
            perfectDays: this.metrics.perfectDays.length,
            perfectDaysThisWeek: this.metrics.perfectDaysThisWeek,
            perfectDaysThisMonth: this.metrics.perfectDaysThisMonth,

            // Today's stats
            todayStats: this.metrics.dailyStats[this.getTodayString()] || { completed: 0, skipped: 0, missed: 0, expected: 0 },

            // Weekly snapshot
            weeklyStats: this.getWeeklySnapshot()
        };
    }

    /**
     * Check if today is a perfect day candidate
     */
    isPerfectDayPossible() {
        const today = this.getTodayString();
        const dayStats = this.metrics.dailyStats[today];
        if (!dayStats) return true; // No misses yet
        return dayStats.skipped === 0 && dayStats.missed === 0;
    }

    /**
     * Get achievement badges
     */
    getAchievementBadges() {
        const badges = [];
        const snapshot = this.getSnapshot();

        // Perfect day today
        if (snapshot.todayCompletionRate === '100.0' && snapshot.todayStats.expected > 0) {
            badges.push({ id: 'perfect_day', name: 'Perfect Day', icon: '🌟', earned: true });
        }

        // Session count badges
        if (snapshot.completed >= 1) badges.push({ id: 'first_step', name: 'First Step', icon: '🏅', earned: true });
        if (snapshot.completed >= 10) badges.push({ id: 'dedicated', name: 'Dedicated', icon: '🔥', earned: true });
        if (snapshot.completed >= 50) badges.push({ id: 'committed', name: 'Committed', icon: '💪', earned: true });
        if (snapshot.completed >= 100) badges.push({ id: 'centurion', name: 'Centurion', icon: '💯', earned: true });

        // Streak badges
        if (snapshot.longestStreak >= 10) badges.push({ id: 'streak_10', name: '10 Hour Streak', icon: '⚡', earned: true });
        if (snapshot.longestDayStreak >= 7) badges.push({ id: 'week_streak', name: 'Week Warrior', icon: '📅', earned: true });
        if (snapshot.longestDayStreak >= 30) badges.push({ id: 'month_streak', name: 'Month Master', icon: '🏆', earned: true });

        // Time badges
        if (snapshot.totalMinutes >= 60) badges.push({ id: 'hour_devotion', name: 'Hour of Devotion', icon: '⏰', earned: true });
        if (snapshot.totalMinutes >= 300) badges.push({ id: 'deep_practice', name: 'Deep Practice (5h)', icon: '🙏', earned: true });

        // Perfect day badges
        if (snapshot.perfectDays >= 7) badges.push({ id: 'perfect_week', name: 'Perfect Week', icon: '✨', earned: true });

        return badges;
    }

    // ══════════════════════════════════════════════════
    // UTILITY METHODS
    // ══════════════════════════════════════════════════

    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    getYesterdayString() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    getWeekString() {
        const now = new Date();
        const onejan = new Date(now.getFullYear(), 0, 1);
        const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
        return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`;
    }

    getWeekStartDate() {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }
}

// Export for use
window.DisciplineMetrics = DisciplineMetrics;
