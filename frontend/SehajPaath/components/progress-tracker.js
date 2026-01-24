/**
 * Progress Tracker Component
 * Tracks reading progress across Sehaj Paaths
 */

class ProgressTracker {
    constructor() {
        this.state = this.loadState();
    }

    loadState() {
        try {
            return JSON.parse(localStorage.getItem('sehajPaathProgress') || '{}');
        } catch {
            return {};
        }
    }

    saveState() {
        localStorage.setItem('sehajPaathProgress', JSON.stringify(this.state));
    }

    /**
     * Get current Paath progress
     */
    getCurrentProgress() {
        const paathState = JSON.parse(localStorage.getItem('sehajPaathState') || '{}');
        if (!paathState.currentPaath) return null;

        const currentAng = paathState.currentPaath.currentAng || 1;
        return {
            currentAng,
            totalAngs: 1430,
            percentage: ((currentAng / 1430) * 100).toFixed(1),
            remaining: 1430 - currentAng,
            startDate: paathState.currentPaath.startDate,
            paathNumber: paathState.currentPaath.number || 1
        };
    }

    /**
     * Update reading progress
     */
    updateProgress(ang) {
        try {
            const state = JSON.parse(localStorage.getItem('sehajPaathState') || '{}');
            if (state.currentPaath) {
                state.currentPaath.currentAng = Math.max(state.currentPaath.currentAng || 1, ang);
                state.currentPaath.lastReadAt = new Date().toISOString();
                localStorage.setItem('sehajPaathState', JSON.stringify(state));
            }

            // Update daily history
            this.updateDailyHistory(ang);

            return true;
        } catch (error) {
            console.error('Error updating progress:', error);
            return false;
        }
    }

    /**
     * Update daily reading history
     */
    updateDailyHistory(ang) {
        const today = new Date().toISOString().split('T')[0];
        let history = this.state.dailyHistory || {};

        if (!history[today]) {
            history[today] = { angsRead: [], startTime: Date.now() };
        }

        if (!history[today].angsRead.includes(ang)) {
            history[today].angsRead.push(ang);
        }

        this.state.dailyHistory = history;
        this.saveState();
    }

    /**
     * Get reading statistics
     */
    getStatistics() {
        const stats = JSON.parse(localStorage.getItem('sehajPaathStats') || '{}');
        const progress = this.getCurrentProgress();

        return {
            totalAngsRead: stats.totalAngsRead || 0,
            totalReadingTimeMinutes: Math.floor((stats.totalReadingTimeSeconds || 0) / 60),
            currentStreak: stats.currentStreak || 0,
            longestStreak: stats.longestStreak || 0,
            todayAngsRead: stats.todayAngsRead || 0,
            averageAngsPerDay: this.calculateAverageAngsPerDay(),
            estimatedDaysRemaining: progress ? Math.ceil(progress.remaining / (this.calculateAverageAngsPerDay() || 5)) : 0,
            currentProgress: progress
        };
    }

    /**
     * Calculate average Angs per day
     */
    calculateAverageAngsPerDay() {
        const history = this.state.dailyHistory || {};
        const days = Object.keys(history);

        if (days.length === 0) return 5; // Default

        const totalAngs = days.reduce((sum, day) => {
            return sum + (history[day].angsRead?.length || 0);
        }, 0);

        return Math.round(totalAngs / days.length) || 5;
    }

    /**
     * Get completed Paaths
     */
    getCompletedPaaths() {
        try {
            return JSON.parse(localStorage.getItem('completedPaaths') || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Check if current Paath is complete
     */
    isPaathComplete() {
        const progress = this.getCurrentProgress();
        return progress && progress.currentAng >= 1430;
    }

    /**
     * Complete current Paath and start new one
     */
    completePaath() {
        if (!this.isPaathComplete()) return false;

        try {
            const state = JSON.parse(localStorage.getItem('sehajPaathState') || '{}');
            const completedPaaths = this.getCompletedPaaths();

            // Move current to completed
            completedPaaths.push({
                ...state.currentPaath,
                endDate: new Date().toISOString(),
                completed: true
            });

            localStorage.setItem('completedPaaths', JSON.stringify(completedPaaths));

            // Start new Paath
            state.currentPaath = {
                id: `paath_${Date.now()}`,
                number: completedPaaths.length + 1,
                startDate: new Date().toISOString(),
                currentAng: 1,
                lastReadAt: null,
                totalTimeSpentSeconds: 0
            };

            localStorage.setItem('sehajPaathState', JSON.stringify(state));

            return true;
        } catch (error) {
            console.error('Error completing Paath:', error);
            return false;
        }
    }

    /**
     * Get weekly reading data for chart
     */
    getWeeklyData() {
        const history = this.state.dailyHistory || {};
        const data = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            const dayData = history[dateKey];

            data.push({
                date: dateKey,
                day: date.toLocaleDateString('en', { weekday: 'short' }),
                angsRead: dayData?.angsRead?.length || 0
            });
        }

        return data;
    }

    /**
     * Get monthly heatmap data
     */
    getMonthlyHeatmap() {
        const history = this.state.dailyHistory || {};
        const data = [];

        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            const dayData = history[dateKey];

            data.push({
                date: dateKey,
                count: dayData?.angsRead?.length || 0
            });
        }

        return data;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressTracker;
}
