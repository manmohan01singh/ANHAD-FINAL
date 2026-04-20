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
    // INTEGRATION WITH UNIFIED STATS (Single Source of Truth)
    // ═══════════════════════════════════════════════════════════════════════════

    function syncWithUnifiedStats() {
        // UnifiedStats is now the single source of truth
        // Just render what we get from it
        if (window.UnifiedStats) {
            const allStats = window.UnifiedStats.getAllStats();
            console.log('[Analytics] Synced with UnifiedStats:', allStats.today);
            renderChart();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA MANAGEMENT - Now delegates to UnifiedStats
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
        // Get from UnifiedStats if available
        if (window.UnifiedStats) {
            const allStats = window.UnifiedStats.getAllStats();
            const data = {};
            
            // Convert UnifiedStats format to analytics format
            allStats.last7Days.forEach(day => {
                data[day.date] = {
                    readPages: day.angRead || 0,
                    listenMinutes: day.kirtanMinutes || 0,
                    nitnemCount: day.nitnemComplete ? 1 : 0
                };
            });
            
            return data;
        }
        
        // Fallback to legacy localStorage
        try {
            const stored = localStorage.getItem(ANALYTICS_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('[Analytics] Error reading data:', e);
            return {};
        }
    }

    // Legacy save function - now updates through UnifiedStats
    function saveAnalyticsData(data) {
        // Data is now saved via UnifiedStats, this is just for backward compatibility
        try {
            localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('[Analytics] Error saving data:', e);
        }
    }

    // Legacy update function - now routes to UnifiedStats
    function updateDailyData(type, value) {
        if (!window.UnifiedStats) {
            console.warn('[Analytics] UnifiedStats not available');
            return;
        }
        
        if (type === 'read') {
            window.UnifiedStats.recordAngRead(value);
        } else if (type === 'listen') {
            window.UnifiedStats.recordKirtanListening(value);
        } else if (type === 'nitnem') {
            window.UnifiedStats.recordNitnemComplete();
        }
        
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
    // PROGRESS SCORE CALCULATION - Weighted Average
    // ═══════════════════════════════════════════════════════════════════════════
    
    function calculateDailyProgressScore(dayData) {
        // Weighted average calculation:
        // Nitnem Complete: 40% weight (1 if complete, 0 if not)
        // Kirtan Minutes: 35% weight (normalized to 0-1 based on 30 min goal)
        // Sehaj Path (Ang Read): 25% weight (normalized to 0-1 based on 5 pages goal)
        
        const nitnemScore = dayData.nitnemCount === 1 ? 1 : 0; // 40% weight
        const kirtanScore = Math.min(dayData.listenMinutes / 30, 1); // 35% weight, capped at 30 min
        const angScore = Math.min(dayData.readPages / 5, 1); // 25% weight, capped at 5 pages
        
        const weightedScore = (nitnemScore * 0.4) + (kirtanScore * 0.35) + (angScore * 0.25);
        return Math.round(weightedScore * 100); // Return as percentage (0-100)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHART RENDERING - Simple Line Chart (Stock Style)
    // ═══════════════════════════════════════════════════════════════════════════

    function renderChart() {
        const container = document.getElementById('analyticsChart');
        if (!container) {
            console.log('[Analytics] Chart container not found');
            return;
        }

        const data = getLast7DaysData();
        
        // Calculate progress scores for each day
        const scores = data.map(day => ({
            ...day,
            score: calculateDailyProgressScore(day)
        }));
        
        console.log('[Analytics] Rendering line chart with scores:', scores.map(d => ({
            day: d.label,
            score: d.score
        })));
        
        const currentScore = scores[scores.length - 1].score;
        const prevScore = scores.length > 1 ? scores[scores.length - 2].score : currentScore;
        const trend = currentScore >= prevScore ? 'up' : 'down';
        
        // Build SVG points for line
        const svgPoints = scores.map((d, i) => {
            const x = (i / (scores.length - 1)) * 100;
            const y = 100 - Math.max(d.score, 2);
            return `${x},${y}`;
        }).join(' ');
        
        // Build dots HTML
        const dotsHTML = scores.map((d, i) => {
            const x = (i / (scores.length - 1)) * 100;
            const y = 100 - Math.max(d.score, 2);
            const r = i === scores.length - 1 ? 3 : 2;
            return `<circle cx="${x}" cy="${y}" r="${r}" fill="#D4943A" stroke="white" stroke-width="0.5"/>`;
        }).join('');
        
        // Build labels HTML
        const labelsHTML = scores.map(d => `<span>${d.label}</span>`).join('');
        
        container.innerHTML = `
            <div class="analytics-chart analytics-chart--line">
                <div class="chart-header">
                    <h3 class="chart-title"><i class="fas fa-chart-line"></i> Your Progress</h3>
                    <div class="chart-current-score">
                        <span class="score-value">${currentScore}</span>
                        <span class="score-label">Score</span>
                        <span class="score-trend ${trend}"><i class="fas fa-arrow-${trend === 'up' ? 'up' : 'down'}"></i></span>
                    </div>
                </div>
                <div class="minimal-line-chart">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline points="${svgPoints}" fill="none" stroke="#D4943A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        ${dotsHTML}
                    </svg>
                    <div class="minimal-labels">${labelsHTML}</div>
                </div>
                <div class="chart-footer">
                    <div class="chart-insight">${generateLineInsight(scores)}</div>
                </div>
            </div>
        `;
    }

    function generateLineInsight(scores) {
        const today = scores[scores.length - 1];
        const yesterday = scores[scores.length - 2];
        
        const avgScore = Math.round(scores.reduce((sum, d) => sum + d.score, 0) / scores.length);
        const trend = yesterday ? (today.score - yesterday.score) : 0;
        
        let insight = '';
        
        if (scores.length < 2) {
            insight = `Start tracking to see your progress trend!`;
        } else if (today.score === 100) {
            insight = `🎉 Perfect day! You achieved all your goals!`;
        } else if (trend > 10) {
            insight = `📈 Great improvement! Your score went up by ${trend} points.`;
        } else if (trend > 0) {
            insight = `↗️ Making progress! Keep it up.`;
        } else if (trend < -10) {
            insight = `📉 Score dropped by ${Math.abs(trend)} points. Let's bounce back!`;
        } else if (trend < 0) {
            insight = `↘️ Slight dip. Tomorrow is a new day!`;
        } else if (avgScore >= 70) {
            insight = `🙏 Excellent consistency! Average score: ${avgScore}%`;
        } else if (avgScore >= 50) {
            insight = `💪 Good progress! Average score: ${avgScore}%`;
        } else if (avgScore > 0) {
            insight = `🌱 Building habits. Average score: ${avgScore}%`;
        } else {
            insight = `� Start your journey today! Complete Nitnem, listen to Kirtan, read Gurbani.`;
        }

        return `
            <i class="fas fa-lightbulb"></i>
            <span>${insight}</span>
        `;
    }

    function generateInsight(data) {
        // Legacy function kept for compatibility
        return generateLineInsight(data.map(d => ({
            ...d,
            score: calculateDailyProgressScore(d)
        })));
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
    // INITIALIZATION - OPTIMIZED FOR INSTANT LOAD
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        // Render chart immediately with existing data (fast)
        renderChart();
        
        // Defer heavy sync operations
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                syncWithNitnemTracker();
                syncWithUserStats();
            }, { timeout: 1000 });
        } else {
            setTimeout(() => {
                syncWithNitnemTracker();
                syncWithUserStats();
            }, 200);
        }
        
        console.log('[Analytics] Initialized (deferred sync)');
    }

    // Initialize when DOM is ready - use requestAnimationFrame for instant paint
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            requestAnimationFrame(init);
        });
    } else {
        requestAnimationFrame(init);
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
