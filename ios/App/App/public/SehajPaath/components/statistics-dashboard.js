/**
 * Statistics Dashboard Component
 */

class StatisticsDashboard {
    constructor() {
        this.stats = this.loadStats();
    }

    loadStats() {
        try {
            return JSON.parse(localStorage.getItem('sehajPaathStats') || '{}');
        } catch {
            return {};
        }
    }

    saveStats() {
        localStorage.setItem('sehajPaathStats', JSON.stringify(this.stats));
    }

    getStats() {
        const today = new Date().toDateString();

        return {
            totalAngsRead: this.stats.totalAngsRead || 0,
            todayAngsRead: this.stats.lastReadDate === today ? (this.stats.todayAngsRead || 0) : 0,
            currentStreak: this.stats.currentStreak || 0,
            longestStreak: this.stats.longestStreak || 0,
            totalReadingTime: Math.floor((this.stats.totalReadingTimeSeconds || 0) / 60),
            lastReadDate: this.stats.lastReadDate || null
        };
    }

    recordAngRead(ang) {
        const today = new Date().toDateString();

        // Reset daily stats if new day
        if (this.stats.lastReadDate !== today) {
            // Check streak
            const lastRead = this.stats.lastReadDate ? new Date(this.stats.lastReadDate) : null;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastRead && lastRead.toDateString() === yesterday.toDateString()) {
                this.stats.currentStreak = (this.stats.currentStreak || 0) + 1;
            } else {
                this.stats.currentStreak = 1;
            }

            this.stats.longestStreak = Math.max(this.stats.longestStreak || 0, this.stats.currentStreak);
            this.stats.todayAngsRead = 0;
        }

        this.stats.todayAngsRead = (this.stats.todayAngsRead || 0) + 1;
        this.stats.totalAngsRead = (this.stats.totalAngsRead || 0) + 1;
        this.stats.lastReadDate = today;

        this.saveStats();
    }

    recordReadingTime(seconds) {
        this.stats.totalReadingTimeSeconds = (this.stats.totalReadingTimeSeconds || 0) + seconds;
        this.saveStats();
    }

    getWeeklyData() {
        // Get reading data for the past 7 days
        const data = [];
        const history = JSON.parse(localStorage.getItem('sehajPaathHistory') || '[]');

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();

            const dayCount = history.filter(h =>
                new Date(h.timestamp).toDateString() === dateStr
            ).length;

            data.push({
                day: date.toLocaleDateString('en', { weekday: 'short' }),
                count: dayCount
            });
        }

        return data;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatisticsDashboard;
}
