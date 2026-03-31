/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DASHBOARD ANALYTICS GRAPH
 * Beautiful Claymorphism 7-Day Progress Chart
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Shows last 7 days of user activity:
 * - Blue: Read Gurbani (pages)
 * - Yellow: Listen to Kirtan (minutes)
 * - Green: Complete Nitnem (count)
 */

(function() {
    'use strict';

    const ANALYTICS_KEY = 'anhad_daily_analytics';
    const MAX_DAYS = 7;

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    function getTodayString() {
        return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
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
    // CHART RENDERING
    // ═══════════════════════════════════════════════════════════════════════════

    function renderChart() {
        const container = document.getElementById('analyticsChart');
        if (!container) return;

        const data = getLast7DaysData();
        
        // Calculate max values for scaling
        const maxRead = Math.max(...data.map(d => d.readPages), 10);
        const maxListen = Math.max(...data.map(d => d.listenMinutes), 30);
        const maxNitnem = Math.max(...data.map(d => d.nitnemCount), 5);

        // Generate HTML
        container.innerHTML = `
            <div class="analytics-chart">
                <div class="chart-header">
                    <h3 class="chart-title">
                        <i class="fas fa-chart-bar"></i>
                        Last 7 Days Progress
                    </h3>
                    <div class="chart-legend">
                        <div class="legend-item">
                            <span class="legend-dot legend-dot--blue"></span>
                            <span class="legend-label">Read Gurbani</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-dot legend-dot--yellow"></span>
                            <span class="legend-label">Listen Kirtan</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-dot legend-dot--green"></span>
                            <span class="legend-label">Complete Nitnem</span>
                        </div>
                    </div>
                </div>
                <div class="chart-body">
                    ${data.map(day => `
                        <div class="chart-day">
                            <div class="chart-bars">
                                <div class="chart-bar chart-bar--blue" 
                                     style="height: ${(day.readPages / maxRead) * 100}%"
                                     data-value="${day.readPages}"
                                     title="${day.readPages} pages read">
                                    <span class="bar-value">${day.readPages}</span>
                                </div>
                                <div class="chart-bar chart-bar--yellow" 
                                     style="height: ${(day.listenMinutes / maxListen) * 100}%"
                                     data-value="${day.listenMinutes}"
                                     title="${day.listenMinutes} min listened">
                                    <span class="bar-value">${day.listenMinutes}</span>
                                </div>
                                <div class="chart-bar chart-bar--green" 
                                     style="height: ${(day.nitnemCount / maxNitnem) * 100}%"
                                     data-value="${day.nitnemCount}"
                                     title="${day.nitnemCount} nitnem completed">
                                    <span class="bar-value">${day.nitnemCount}</span>
                                </div>
                            </div>
                            <div class="chart-label">${day.label}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="chart-footer">
                    <div class="chart-insight">
                        ${generateInsight(data)}
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
        const avgNitnem = Math.round(totalNitnem / 7);

        // Determine trend
        let insight = '';
        
        if (today.readPages > yesterday.readPages && 
            today.listenMinutes > yesterday.listenMinutes && 
            today.nitnemCount > yesterday.nitnemCount) {
            insight = `🌟 Amazing! You're improving across all areas! Keep up the great work.`;
        } else if (totalRead === 0 && totalListen === 0 && totalNitnem === 0) {
            insight = `📚 Start your spiritual journey today! Track your progress and watch yourself grow.`;
        } else if (avgNitnem >= 1) {
            insight = `🙏 Excellent consistency! You're averaging ${avgNitnem} Nitnem per day.`;
        } else if (avgListen >= 20) {
            insight = `🎧 Great listening habit! ${avgListen} minutes of Kirtan daily.`;
        } else if (avgRead >= 3) {
            insight = `📖 Wonderful reading progress! ${avgRead} pages daily on average.`;
        } else {
            insight = `💪 Every step counts! Keep building your spiritual practice.`;
        }

        return `
            <i class="fas fa-lightbulb"></i>
            <span>${insight}</span>
        `;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INTEGRATION WITH EXISTING STATS
    // ═══════════════════════════════════════════════════════════════════════════

    function syncWithUserStats() {
        if (!window.AnhadStats) return;

        const stats = window.AnhadStats.getStats();
        const today = getTodayString();
        const data = getAnalyticsData();

        // Sync today's data from AnhadStats
        if (!data[today]) {
            data[today] = {
                readPages: stats.todayPagesRead || 0,
                listenMinutes: stats.todayListeningMinutes || 0,
                nitnemCount: stats.todayNitnemCount || 0
            };
            saveAnalyticsData(data);
        }
    }

    function syncWithNitnemTracker() {
        try {
            const nitnemLog = localStorage.getItem('nitnemTracker_nitnemLog');
            if (!nitnemLog) return;

            const log = JSON.parse(nitnemLog);
            const data = getAnalyticsData();

            // Sync last 7 days from Nitnem Tracker
            for (let i = 0; i < 7; i++) {
                const dateString = getDateString(i);
                if (log[dateString]) {
                    if (!data[dateString]) {
                        data[dateString] = {
                            readPages: 0,
                            listenMinutes: 0,
                            nitnemCount: 0
                        };
                    }
                    
                    // Count completed banis for the day
                    const dayLog = log[dateString];
                    let completedCount = 0;
                    
                    ['amritvela', 'rehras', 'sohila'].forEach(period => {
                        if (dayLog[period]) {
                            completedCount += Object.values(dayLog[period]).filter(v => v === true).length;
                        }
                    });
                    
                    data[dateString].nitnemCount = completedCount;
                }
            }

            saveAnalyticsData(data);
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

    // Initialize when DOM is ready
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

    console.log('📊 Dashboard Analytics loaded');
})();
