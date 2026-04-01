/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PREMIUM DASHBOARD ANALYTICS - APPLE STYLE
 * Clean, minimal, data-focused visualization
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    const ANALYTICS_KEY = 'anhad_daily_analytics';
    const TARGET_PAGES = 5;
    const TARGET_MINUTES = 30;
    const TARGET_NITNEM = 1;
    const GOAL_LINE_HEIGHT = 75; // Goal line at 75% of chart height

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    function getTodayString() {
        return new Date().toLocaleDateString('en-CA');
    }

    function getDateString(daysAgo) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toLocaleDateString('en-CA');
    }

    function getShortDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[date.getDay()];
    }

    function getAnalyticsData() {
        try {
            const stored = localStorage.getItem(ANALYTICS_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('[Analytics] Error reading data:', e);
            return {};
        }
    }

    function saveAnalyticsData(data) {
        try {
            localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('[Analytics] Error saving data:', e);
        }
    }

    function updateDailyData(type, value) {
        const today = getTodayString();
        const data = getAnalyticsData();

        if (!data[today]) {
            data[today] = {
                readPages: 0,
                listenMinutes: 0,
                nitnemCount: 0
            };
        }

        if (type === 'read') {
            data[today].readPages += value;
        } else if (type === 'listen') {
            data[today].listenMinutes += value;
        } else if (type === 'nitnem') {
            data[today].nitnemCount += value;
        }

        saveAnalyticsData(data);
        renderChart();
    }

    function getLast7DaysData() {
        const data = getAnalyticsData();
        const result = [];

        for (let i = 6; i >= 0; i--) {
            const dateString = getDateString(i);
            const dayData = data[dateString] || {
                readPages: 0,
                listenMinutes: 0,
                nitnemCount: 0
            };

            result.push({
                date: dateString,
                label: getShortDate(dateString),
                ...dayData
            });
        }

        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHART RENDERING - PREMIUM STYLE
    // ═══════════════════════════════════════════════════════════════════════════

    function getBarHeight(value, target) {
        if (!value || value <= 0) return 4; // Minimum height for visibility
        const ratio = value / target;
        // Goal (100%) = 75% of chart height
        // Cap at 85% to prevent overflow
        const heightPercent = Math.min(ratio * GOAL_LINE_HEIGHT, 85);
        return Math.max(heightPercent, 4);
    }

    function renderChart() {
        const container = document.getElementById('analyticsChart');
        if (!container) return;

        const data = getLast7DaysData();

        container.innerHTML = `
            <div class="analytics-chart">
                <div class="chart-header">
                    <h3 class="chart-title">Last 7 Days Progress</h3>
                    <div class="chart-legend">
                        <div class="legend-item">
                            <span class="legend-dot legend-dot--blue"></span>
                            <span class="legend-label">Read (${TARGET_PAGES}pg)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-dot legend-dot--yellow"></span>
                            <span class="legend-label">Listen (${TARGET_MINUTES}m)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-dot legend-dot--green"></span>
                            <span class="legend-label">Nitnem (${TARGET_NITNEM}d)</span>
                        </div>
                    </div>
                </div>
                <div class="chart-body">
                    <div class="chart-target-line" style="top: ${100 - GOAL_LINE_HEIGHT}%;"></div>
                    
                    <div class="chart-days">
                        ${data.map(day => `
                            <div class="chart-day">
                                <div class="chart-bars">
                                    <div class="chart-bar chart-bar--blue" 
                                         style="height: ${getBarHeight(day.readPages, TARGET_PAGES)}%"
                                         data-value="${day.readPages}"
                                         title="${day.readPages} pages">
                                        <span class="bar-value">${day.readPages}</span>
                                    </div>
                                    <div class="chart-bar chart-bar--yellow" 
                                         style="height: ${getBarHeight(day.listenMinutes, TARGET_MINUTES)}%"
                                         data-value="${day.listenMinutes}"
                                         title="${day.listenMinutes} min">
                                        <span class="bar-value">${day.listenMinutes}</span>
                                    </div>
                                    <div class="chart-bar chart-bar--green" 
                                         style="height: ${getBarHeight(day.nitnemCount, TARGET_NITNEM)}%"
                                         data-value="${day.nitnemCount}"
                                         title="${day.nitnemCount} banis">
                                        <span class="bar-value">${day.nitnemCount}</span>
                                    </div>
                                </div>
                                <div class="chart-label">${day.label}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="chart-footer">
                    <div class="chart-insight">
                        <i class="fas fa-lightbulb"></i>
                        <span>${generateInsight(data)}</span>
                    </div>
                </div>
            </div>
        `;

        // Animate bars
        setTimeout(() => {
            container.querySelectorAll('.chart-bar').forEach(bar => {
                bar.classList.add('animated');
            });
        }, 100);
    }

    function generateInsight(data) {
        const today = data[data.length - 1];
        const yesterday = data[data.length - 2];
        
        const totalRead = data.reduce((sum, d) => sum + d.readPages, 0);
        const totalListen = data.reduce((sum, d) => sum + d.listenMinutes, 0);
        const totalNitnem = data.reduce((sum, d) => sum + d.nitnemCount, 0);
        
        const avgRead = Math.round(totalRead / 7);
        const avgListen = Math.round(totalListen / 7);

        if (today.readPages > yesterday.readPages && 
            today.listenMinutes > yesterday.listenMinutes && 
            today.nitnemCount > yesterday.nitnemCount) {
            return `Amazing! You're improving across all areas!`;
        } else if (totalRead === 0 && totalListen === 0 && totalNitnem === 0) {
            return `Start your spiritual journey today!`;
        } else if (avgListen >= 20) {
            return `Great listening habit! ${avgListen} minutes daily.`;
        } else if (avgRead >= 3) {
            return `Wonderful reading progress! ${avgRead} pages daily.`;
        } else {
            return `Every step counts! Keep building your practice.`;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SYNC FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function syncWithUserStats() {
        const today = getTodayString();
        const data = getAnalyticsData();

        if (!data[today]) {
            data[today] = { readPages: 0, listenMinutes: 0, nitnemCount: 0 };
        }
        
        if (window.AnhadStats) {
            try {
                const stats = window.AnhadStats.getStats();
                data[today].readPages = Math.max(data[today].readPages || 0, stats.todayPagesRead || 0);
                data[today].listenMinutes = Math.max(data[today].listenMinutes || 0, stats.todayListeningMinutes || 0);
                data[today].nitnemCount = Math.max(data[today].nitnemCount || 0, stats.todayNitnemCount || 0);
            } catch (e) {
                console.warn('[Analytics] Error syncing AnhadStats:', e);
            }
        }
        
        try {
            const userStats = JSON.parse(localStorage.getItem('anhad_user_stats') || '{}');
            if (userStats && userStats.daily) {
                const todayStats = userStats.daily[today];
                if (todayStats) {
                    data[today].listenMinutes = Math.max(data[today].listenMinutes || 0, todayStats.listeningMinutes || 0);
                    data[today].readPages = Math.max(data[today].readPages || 0, todayStats.pagesRead || 0);
                }
            }
        } catch (e) {
            console.warn('[Analytics] Error reading user_stats:', e);
        }
        
        saveAnalyticsData(data);
    }

    function syncWithNitnemTracker() {
        try {
            const nitnemLog = localStorage.getItem('nitnemTracker_nitnemLog');
            const data = getAnalyticsData();
            let hasUpdates = false;

            if (nitnemLog) {
                const log = JSON.parse(nitnemLog);
                for (let i = 0; i < 7; i++) {
                    const dateString = getDateString(i);
                    if (log[dateString]) {
                        if (!data[dateString]) {
                            data[dateString] = { readPages: 0, listenMinutes: 0, nitnemCount: 0 };
                        }
                        
                        const dayLog = log[dateString];
                        let completedCount = 0;
                        
                        ['amritvela', 'rehras', 'sohila'].forEach(period => {
                            if (dayLog[period]) {
                                if (Array.isArray(dayLog[period])) {
                                    completedCount += dayLog[period].length;
                                } else if (typeof dayLog[period] === 'object') {
                                    completedCount += Object.values(dayLog[period]).filter(v => v === true).length;
                                }
                            }
                        });
                        
                        data[dateString].nitnemCount = completedCount;
                        hasUpdates = true;
                    }
                }
            }

            if (hasUpdates) {
                saveAnalyticsData(data);
            }
        } catch (e) {
            console.warn('[Analytics] Error syncing with Nitnem Tracker:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════════════

    window.addEventListener('statsUpdated', () => {
        syncWithUserStats();
        renderChart();
    });

    window.addEventListener('nitnemUpdated', () => {
        syncWithNitnemTracker();
        renderChart();
    });

    window.addEventListener('dashboardRefresh', () => {
        syncWithUserStats();
        syncWithNitnemTracker();
        renderChart();
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        syncWithUserStats();
        syncWithNitnemTracker();
        renderChart();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose API
    window.DashboardAnalytics = {
        updateDailyData,
        renderChart,
        getLast7DaysData,
        syncWithUserStats,
        syncWithNitnemTracker
    };

    console.log('📊 Premium Dashboard Analytics loaded');
})();
