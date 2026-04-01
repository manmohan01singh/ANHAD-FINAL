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
        console.log(`[Analytics] updateDailyData: ${type} +${value}, today=${today}, data=`, data[today]);
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
    // CHART RENDERING - VERBOSE LOGGING FOR DEBUGGING
    // ═══════════════════════════════════════════════════════════════════════════

    function renderChart() {
        const container = document.getElementById('analyticsChart');
        if (!container) {
            console.log('[Analytics] Chart container not found');
            return;
        }

        const data = getLast7DaysData();
        
        // Log all 7 days data for debugging
        console.log('[Analytics] Rendering chart with data:', data.map(d => ({
            day: d.label,
            read: d.readPages,
            listen: d.listenMinutes,
            nitnem: d.nitnemCount
        })));
        
        // Fixed target values for consistent scaling
        const TARGET_PAGES = 5;      // Daily goal for reading
        const TARGET_MINUTES = 30;   // Daily goal for listening
        const TARGET_NITNEM = 1;     // Daily goal (1 = full day complete)
        
        // GOAL LINE at 50% height = 100% achievement
        // Bars at 50% = goal achieved, bars above 50% = exceeded goal
        const GOAL_LINE_PERCENT = 50;
        
        // Calculate bar height: ratio * 50% 
        // - Read Gurbani (Sehaj Paath): Can exceed goal line (uncapped for over-achievement)
        // - Listen Kirtan: Cap at goal line (50%)
        // - Nitnem: Touch goal line when complete (50%)
        const getBarHeight = (value, target, type) => {
            if (!value || value <= 0) return 2;
            const ratio = value / target;
            // 100% target = 50% height
            let heightPercent = ratio * 50;
            // For reading: allow overflow above goal line (can go beyond 50%)
            // For listening: cap at goal line (50%)
            // For nitnem: if complete (1), set to exactly 50% to touch goal line
            if (type === 'listen') {
                heightPercent = Math.min(heightPercent, 50);
            } else if (type === 'nitnem') {
                // If nitnem is complete (value === 1), set to exactly 50% to touch goal line
                heightPercent = value === 1 ? 50 : Math.min(heightPercent, 50);
            }
            // For read: allow any height (can exceed 50%)
            const finalHeight = Math.max(heightPercent, 2);
            console.log(`[Chart] ${type}=${value}, target=${target}, ratio=${ratio.toFixed(2)}, height=${finalHeight.toFixed(1)}%`);
            return finalHeight;
        };

        // Generate HTML with target line
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
                            <span class="legend-label">Read Gurbani (${TARGET_PAGES} pages)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-dot legend-dot--yellow"></span>
                            <span class="legend-label">Listen Kirtan (${TARGET_MINUTES} min)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-dot legend-dot--green"></span>
                            <span class="legend-label">Complete Nitnem (daily)</span>
                        </div>
                    </div>
                </div>
                <div class="chart-body">
                    ${data.map(day => `
                        <div class="chart-day">
                            <div class="chart-bars">
                                <!-- Target Line - positioned inside each chart-bars for correct coordinate alignment -->
                                <div class="chart-target-line" style="bottom: ${GOAL_LINE_PERCENT}%; top: auto;"></div>
                                
                                <div class="chart-bar chart-bar--blue" 
                                     style="height: ${getBarHeight(day.readPages, TARGET_PAGES, 'read')}%"
                                     data-value="${day.readPages}"
                                     title="${day.readPages} pages read">
                                    <span class="bar-value">${day.readPages}</span>
                                </div>
                                <div class="chart-bar chart-bar--yellow" 
                                     style="height: ${getBarHeight(day.listenMinutes, TARGET_MINUTES, 'listen')}%"
                                     data-value="${day.listenMinutes}"
                                     title="${day.listenMinutes} min listened">
                                    <span class="bar-value">${day.listenMinutes}</span>
                                </div>
                                <div class="chart-bar chart-bar--green" 
                                     style="height: ${getBarHeight(day.nitnemCount, TARGET_NITNEM, 'nitnem')}%"
                                     data-value="${day.nitnemCount}"
                                     title="${day.nitnemCount === 1 ? 'Nitnem Complete ✓' : 'Nitnem Incomplete'}">
                                    <span class="bar-value">${day.nitnemCount === 1 ? '✓' : '✗'}</span>
                                </div>
                            </div>
                            <div class="chart-label">${day.label}</div>
                            <div class="chart-goal-label">GOAL</div>
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
        // FIXED: Conservative sync - preserve existing data, only supplement from other sources
        const today = getTodayString();
        const data = getAnalyticsData();

        // IMPORTANT: Don't overwrite existing today's data with zeros
        // Only create new entry if no data exists at all
        if (!data[today]) {
            data[today] = { readPages: 0, listenMinutes: 0, nitnemCount: 0 };
        }
        
        // Store current values to prevent overwriting
        const currentRead = data[today].readPages || 0;
        const currentListen = data[today].listenMinutes || 0;
        const currentNitnem = data[today].nitnemCount || 0;
        
        // CRITICAL: Skip syncing listening minutes - Kirtan tracker updates directly
        // Only sync if we have NO listening data at all (fresh start)
        const skipListeningSync = currentListen > 0;
        
        // Helper to safely get values with max cap to prevent runaway inflation
        // Only update if incoming > current (never decrease values)
        const safeUpdate = (current, incoming, maxReasonable) => {
            if (!incoming || incoming <= 0) return current; // Don't use zero/empty values
            if (incoming <= current) return current; // Keep higher existing value
            if (incoming > maxReasonable) {
                console.warn(`[Analytics] Ignoring inflated value: ${incoming} (max reasonable: ${maxReasonable})`);
                return current;
            }
            return incoming;
        };
        
        // Max reasonable values for a single day
        const MAX_REASONABLE = {
            pages: 50,        // 50 pages is a lot for one day
            minutes: 180,     // 3 hours of listening
            nitnem: 11        // All banis
        };
        
        // Source 1: AnhadStats global object (only use if has actual data)
        if (window.AnhadStats) {
            try {
                const stats = window.AnhadStats.getStats();
                if (stats) {
                    // Only update if stats has actual non-zero values greater than current
                    if (stats.todayPagesRead > currentRead) {
                        data[today].readPages = safeUpdate(currentRead, stats.todayPagesRead, MAX_REASONABLE.pages);
                    }
                    // CRITICAL: Only sync listening if we have no current data
                    if (!skipListeningSync && stats.todayListeningMinutes > currentListen) {
                        data[today].listenMinutes = safeUpdate(currentListen, stats.todayListeningMinutes, MAX_REASONABLE.minutes);
                    }
                    if (stats.todayNitnemCount > currentNitnem) {
                        // Ensure nitnem is capped at 1
                        const safeNitnem = Math.min(stats.todayNitnemCount, 1);
                        data[today].nitnemCount = safeUpdate(currentNitnem, safeNitnem, MAX_REASONABLE.nitnem);
                    }
                }
            } catch (e) {
                console.warn('[Analytics] Error syncing AnhadStats:', e);
            }
        }
        
        // Source 2: anhad_user_stats localStorage (only use if has actual data)
        try {
            const userStats = JSON.parse(localStorage.getItem('anhad_user_stats') || '{}');
            if (userStats && userStats.daily) {
                const todayStats = userStats.daily[today];
                if (todayStats) {
                    // Only update if incoming values are greater than current
                    // CRITICAL: Skip listening sync if we already have data (Kirtan tracker is source of truth)
                    if (!skipListeningSync && todayStats.listeningMinutes > data[today].listenMinutes) {
                        data[today].listenMinutes = safeUpdate(data[today].listenMinutes, todayStats.listeningMinutes, MAX_REASONABLE.minutes);
                    }
                    if (todayStats.pagesRead > data[today].readPages) {
                        data[today].readPages = safeUpdate(data[today].readPages, todayStats.pagesRead, MAX_REASONABLE.pages);
                    }
                }
            }
        } catch (e) {
            console.warn('[Analytics] Error reading user_stats:', e);
        }
        
        // Source 3: Radio/Gurbani listening data (only if we have no current data)
        if (!skipListeningSync) {
            try {
                const radioStats = JSON.parse(localStorage.getItem('anhad_radio_stats') || '{}');
                if (radioStats && radioStats.dailyListening) {
                    const todayListening = radioStats.dailyListening[today];
                    if (todayListening) {
                        const minutes = Math.round(todayListening / 60);
                        if (minutes > data[today].listenMinutes) {
                            data[today].listenMinutes = safeUpdate(data[today].listenMinutes, minutes, MAX_REASONABLE.minutes);
                        }
                    }
                }
            } catch (e) {
                console.warn('[Analytics] Error reading radio_stats:', e);
            }
        }
        
        saveAnalyticsData(data);
        console.log('[Analytics] Synced with UserStats (listening preserved):', data[today]);
    }

    function syncWithNitnemTracker() {
        try {
            const nitnemLog = localStorage.getItem('nitnemTracker_nitnemLog');
            const selectedBanis = JSON.parse(localStorage.getItem('nitnemTracker_selectedBanis') || 
                '{"amritvela":[],"rehras":[],"sohila":[]}');
            const data = getAnalyticsData();
            let hasUpdates = false;

            // Calculate total banis expected per day
            const totalBanisPerDay = (selectedBanis.amritvela?.length || 0) + 
                                     (selectedBanis.rehras?.length || 0) + 
                                     (selectedBanis.sohila?.length || 0);

            // Sync from Nitnem Tracker log
            if (nitnemLog && totalBanisPerDay > 0) {
                const log = JSON.parse(nitnemLog);
                // Sync last 7 days from Nitnem Tracker
                for (let i = 0; i < 7; i++) {
                    const dateString = getDateString(i);
                    if (!data[dateString]) {
                        data[dateString] = { readPages: 0, listenMinutes: 0, nitnemCount: 0 };
                    }
                    
                    if (log[dateString]) {
                        // Count completed banis for the day
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
                        
        // CRITICAL FIX: Store 0 or 1 (incomplete/complete) instead of bani count
        // This prevents bar from exceeding goal line
        const isComplete = completedCount >= totalBanisPerDay && totalBanisPerDay > 0;
        const newNitnemCount = isComplete ? 1 : 0;
        
        // Only update if value changed
        if (data[dateString].nitnemCount !== newNitnemCount) {
            data[dateString].nitnemCount = newNitnemCount;
            console.log(`[Analytics] ${dateString}: ${completedCount}/${totalBanisPerDay} banis → ${isComplete ? 'COMPLETE (1)' : 'INCOMPLETE (0)'}`);
            hasUpdates = true;
        }
                    }
                }
            }

            if (hasUpdates) {
                saveAnalyticsData(data);
                console.log('[Analytics] Synced with Nitnem Tracker');
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
        // FIXED: Don't sync on init - this overwrites tracked data with 0 from other sources
        // Only render existing data from localStorage
        renderChart();
        
        // Sync only happens when events are received (statsUpdated, nitnemUpdated)
        console.log('[Analytics] Initialized with stored data');
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
