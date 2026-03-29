/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * REPORT GENERATOR - Nitnem Tracker Analytics Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 * Generates comprehensive reports for weekly/monthly spiritual progress tracking
 */

'use strict';

class ReportGenerator {
    constructor(storageManager) {
        this.storage = storageManager || {
            load: (key, defaultValue) => {
                try {
                    const data = localStorage.getItem(key);
                    return data ? JSON.parse(data) : defaultValue;
                } catch (e) {
                    return defaultValue;
                }
            }
        };

        this.STORAGE_KEYS = {
            AMRITVELA_LOG: 'nitnemTracker_amritvelaLog',
            NITNEM_LOG: 'nitnemTracker_nitnemLog',
            MALA_LOG: 'nitnemTracker_malaLog',
            ALARM_LOG: 'nitnemTracker_alarmLog',
            STREAK_DATA: 'nitnemTracker_streakData',
            SELECTED_BANIS: 'nitnemTracker_selectedBanis'
        };
    }

    /**
     * Get array of date strings for the past 7 days (today first)
     */
    getWeekDates() {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toLocaleDateString('en-CA'));
        }
        return dates;
    }

    /**
     * Get array of date strings for the current month
     */
    getMonthDates(year, month) {
        const dates = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const d = new Date(year, month, day);
            dates.push(d.toLocaleDateString('en-CA'));
        }
        return dates;
    }

    /**
     * Generate comprehensive weekly report
     */
    generateWeeklyReport() {
        const weekDates = this.getWeekDates();

        // Load all data
        const amritvelaLog = this.storage.load(this.STORAGE_KEYS.AMRITVELA_LOG, {});
        const nitnemLog = this.storage.load(this.STORAGE_KEYS.NITNEM_LOG, {});
        const malaLog = this.storage.load(this.STORAGE_KEYS.MALA_LOG, {});
        const alarmLog = this.storage.load(this.STORAGE_KEYS.ALARM_LOG, {});
        const selectedBanis = this.storage.load(this.STORAGE_KEYS.SELECTED_BANIS, {
            amritvela: [],
            rehras: [],
            sohila: []
        });

        // Calculate target banis count
        const targetBanis = (selectedBanis.amritvela?.length || 0) +
            (selectedBanis.rehras?.length || 0) +
            (selectedBanis.sohila?.length || 0);

        // Amritvela stats
        const amritvelaStats = this.calculateAmritvelaStats(weekDates, amritvelaLog);

        // Nitnem stats
        const nitnemStats = this.calculateNitnemStats(weekDates, nitnemLog, targetBanis);

        // Mala stats
        const malaStats = this.calculateMalaStats(weekDates, malaLog);

        // Alarm stats
        const alarmStats = this.calculateAlarmStats(weekDates, alarmLog);

        return {
            period: 'week',
            startDate: weekDates[weekDates.length - 1],
            endDate: weekDates[0],
            amritvela: amritvelaStats,
            nitnem: nitnemStats,
            mala: malaStats,
            alarms: alarmStats,
            weekly: {
                amritvelaDays: amritvelaStats.amritvelaWakeups,
                nitnemDays: nitnemStats.completeDays,
                totalMalas: malaStats.totalMalas,
                obedienceRate: alarmStats.responseRate
            }
        };
    }

    /**
     * Calculate Amritvela statistics
     */
    calculateAmritvelaStats(dates, log) {
        let amritvelaWakeups = 0;
        let totalWakeTimes = [];
        const dailyStats = {};

        dates.forEach(date => {
            const entry = log[date];
            dailyStats[date] = {
                woke: false,
                time: null,
                quality: null
            };

            // Entry exists means user marked present (entry has date, time, slot, timestamp)
            // Also support old format with entry.woke for backwards compatibility
            if (entry && (entry.time || entry.woke === true)) {
                amritvelaWakeups++;
                dailyStats[date].woke = true;
                dailyStats[date].time = entry.time;
                dailyStats[date].quality = entry.quality || entry.slot || this.getQualityFromTime(entry.time);

                // Parse time for average calculation
                if (entry.time) {
                    const timeParts = entry.time.match(/(\d+):(\d+)/);
                    if (timeParts) {
                        const hours = parseInt(timeParts[1]);
                        const minutes = parseInt(timeParts[2]);
                        totalWakeTimes.push(hours * 60 + minutes);
                    }
                }
            }
        });

        // Calculate average wake time
        let averageWakeTime = null;
        if (totalWakeTimes.length > 0) {
            const avgMinutes = Math.round(totalWakeTimes.reduce((a, b) => a + b, 0) / totalWakeTimes.length);
            const avgHours = Math.floor(avgMinutes / 60);
            const avgMins = avgMinutes % 60;
            averageWakeTime = `${avgHours}:${avgMins.toString().padStart(2, '0')}`;
        }

        return {
            totalDays: dates.length,
            amritvelaWakeups,
            wakeRate: Math.round((amritvelaWakeups / dates.length) * 100),
            averageWakeTime,
            dailyStats
        };
    }

    /**
     * Get quality rating from wake time
     */
    getQualityFromTime(timeStr) {
        if (!timeStr) return 'unknown';

        const match = timeStr.match(/(\d+):(\d+)/);
        if (!match) return 'unknown';

        const hour = parseInt(match[1]);

        if (hour < 4) return 'excellent';
        if (hour < 5) return 'good';
        if (hour < 6) return 'okay';
        return 'late';
    }

    /**
     * Calculate Nitnem statistics
     */
    calculateNitnemStats(dates, log, targetBanis) {
        let totalCompleted = 0;
        let completeDays = 0;
        const dailyStats = {};

        dates.forEach(date => {
            const entry = log[date] || {};
            const completed = entry.completed || [];
            const completedCount = Array.isArray(completed) ? completed.length : 0;

            dailyStats[date] = {
                completed: completedCount,
                total: targetBanis,
                percentage: targetBanis > 0 ? Math.round((completedCount / targetBanis) * 100) : 0,
                banis: completed
            };

            totalCompleted += completedCount;

            // A day is complete if all selected banis are done
            if (targetBanis > 0 && completedCount >= targetBanis) {
                completeDays++;
            }
        });

        const totalPossible = dates.length * targetBanis;

        return {
            totalDays: dates.length,
            targetBanis,
            totalCompleted,
            totalPossible,
            completeDays,
            completionRate: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
            dailyStats
        };
    }

    /**
     * Calculate Mala statistics
     */
    calculateMalaStats(dates, log) {
        let totalMalas = 0;
        let totalJaap = 0;
        const dailyStats = {};

        dates.forEach(date => {
            const entry = log[date] || {};
            const malas = entry.completedMalas || 0;
            const jaap = entry.totalCount || 0;

            dailyStats[date] = {
                malas,
                totalCount: jaap
            };

            totalMalas += malas;
            totalJaap += jaap;
        });

        return {
            totalDays: dates.length,
            totalMalas,
            totalJaap,
            averageMalasPerDay: dates.length > 0 ? Math.round((totalMalas / dates.length) * 10) / 10 : 0,
            dailyStats
        };
    }

    /**
     * Calculate Alarm/Reminder statistics
     */
    calculateAlarmStats(dates, log) {
        let responded = 0;
        let snoozed = 0;
        let missed = 0;
        let total = 0;
        const dailyStats = {};

        dates.forEach(date => {
            const entry = log[date] || {};
            const alarms = entry.alarms || [];

            dailyStats[date] = {
                responded: 0,
                snoozed: 0,
                missed: 0,
                total: alarms.length
            };

            alarms.forEach(alarm => {
                total++;
                if (alarm.response === 'responded') {
                    responded++;
                    dailyStats[date].responded++;
                } else if (alarm.response === 'snoozed') {
                    snoozed++;
                    dailyStats[date].snoozed++;
                } else {
                    missed++;
                    dailyStats[date].missed++;
                }
            });
        });

        const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

        return {
            totalDays: dates.length,
            responded,
            snoozed,
            missed,
            total,
            responseRate,
            dailyStats
        };
    }

    /**
     * Generate monthly report
     */
    generateMonthlyReport(year = new Date().getFullYear(), month = new Date().getMonth()) {
        const monthDates = this.getMonthDates(year, month);
        const today = new Date().toLocaleDateString('en-CA');

        // Only include dates up to today
        const relevantDates = monthDates.filter(d => d <= today);

        // Load all data
        const amritvelaLog = this.storage.load(this.STORAGE_KEYS.AMRITVELA_LOG, {});
        const nitnemLog = this.storage.load(this.STORAGE_KEYS.NITNEM_LOG, {});
        const malaLog = this.storage.load(this.STORAGE_KEYS.MALA_LOG, {});
        const alarmLog = this.storage.load(this.STORAGE_KEYS.ALARM_LOG, {});
        const selectedBanis = this.storage.load(this.STORAGE_KEYS.SELECTED_BANIS, {
            amritvela: [],
            rehras: [],
            sohila: []
        });

        const targetBanis = (selectedBanis.amritvela?.length || 0) +
            (selectedBanis.rehras?.length || 0) +
            (selectedBanis.sohila?.length || 0);

        return {
            period: 'month',
            year,
            month,
            monthName: new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long' }),
            daysInMonth: monthDates.length,
            daysTracked: relevantDates.length,
            amritvela: this.calculateAmritvelaStats(relevantDates, amritvelaLog),
            nitnem: this.calculateNitnemStats(relevantDates, nitnemLog, targetBanis),
            mala: this.calculateMalaStats(relevantDates, malaLog),
            alarms: this.calculateAlarmStats(relevantDates, alarmLog)
        };
    }

    /**
     * Get streak information
     */
    getStreakInfo() {
        const streakData = this.storage.load(this.STORAGE_KEYS.STREAK_DATA, {
            current: 0,
            longest: 0,
            lastDate: null
        });

        return {
            currentStreak: streakData.current || 0,
            longestStreak: streakData.longest || 0,
            lastActiveDate: streakData.lastDate
        };
    }

    /**
     * Generate insights based on data
     */
    generateInsights(report) {
        const insights = [];

        // Amritvela insights
        if (report.amritvela.wakeRate >= 80) {
            insights.push({
                type: 'success',
                icon: '🌟',
                message: `Excellent! You woke up for Amritvela ${report.amritvela.amritvelaWakeups} out of ${report.amritvela.totalDays} days!`
            });
        } else if (report.amritvela.wakeRate >= 50) {
            insights.push({
                type: 'progress',
                icon: '💪',
                message: `Good progress! Focus on waking earlier for true Amritvela benefits.`
            });
        } else {
            insights.push({
                type: 'motivation',
                icon: '🌱',
                message: `Every step counts! Even 1 Amritvela can transform your week.`
            });
        }

        // Nitnem insights
        if (report.nitnem.completionRate >= 100) {
            insights.push({
                type: 'success',
                icon: '📖',
                message: `Perfect Nitnem completion! All banis recited every day.`
            });
        } else if (report.nitnem.completionRate >= 70) {
            insights.push({
                type: 'progress',
                icon: '📚',
                message: `Strong Nitnem practice! ${report.nitnem.completeDays} complete days.`
            });
        }

        // Mala insights
        if (report.mala.totalMalas > 0) {
            insights.push({
                type: 'info',
                icon: '📿',
                message: `${report.mala.totalMalas} malas completed. Total ${report.mala.totalJaap.toLocaleString()} naam jap!`
            });
        }

        return insights;
    }

    /**
     * Get Nitnem completion statistics for specific dates
     * Used by ReportsManager.renderMonthlyCalendar()
     * @param {string[]} dates - Array of date strings (YYYY-MM-DD)
     * @returns {{ dailyStats: Object, targetBanis: number }}
     */
    getNitnemCompletionStats(dates) {
        const nitnemLog = this.storage.load(this.STORAGE_KEYS.NITNEM_LOG, {});
        const selectedBanis = this.storage.load(this.STORAGE_KEYS.SELECTED_BANIS, {
            amritvela: [],
            rehras: [],
            sohila: []
        });

        // Calculate target banis count
        let targetBanis = (selectedBanis.amritvela?.length || 0) +
            (selectedBanis.rehras?.length || 0) +
            (selectedBanis.sohila?.length || 0);

        // Default to 5 if no banis selected
        if (targetBanis === 0) targetBanis = 5;

        const dailyStats = {};

        dates.forEach(date => {
            const entry = nitnemLog[date] || {};
            let completed = 0;

            // Handle different storage formats
            if (Array.isArray(entry.completed)) {
                completed = entry.completed.length;
            } else if (typeof entry === 'object') {
                // Count banis completed across all periods
                ['amritvela', 'rehras', 'sohila'].forEach(period => {
                    if (Array.isArray(entry[period])) {
                        completed += entry[period].length;
                    }
                });
            }

            dailyStats[date] = {
                completed,
                percentage: Math.round((completed / targetBanis) * 100)
            };
        });

        return { dailyStats, targetBanis };
    }
}

// Export to window for global access
window.ReportGenerator = ReportGenerator;
