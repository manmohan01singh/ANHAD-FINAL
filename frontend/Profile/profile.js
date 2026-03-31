/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD Profile Page - Analytics & Statistics Engine (FIXED)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Aggregates data from CORRECT localStorage sources:
 * - sehajPaathState: Current Ang/progress
 * - sehajPaathStats: Reading statistics
 * - anhad_user_stats: Listening time
 * - nitnemTracker_*: Nitnem data
 * - naam_abhyas_history: Naam Abhyas sessions
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // CORRECT STORAGE KEYS
    // ═══════════════════════════════════════════════════════════════════════════

    const KEYS = {
        // User Stats (listening, etc)
        ANHAD_STATS: 'anhad_user_stats',
        ANHAD_STREAK: 'anhad_streak_data',
        ANHAD_GOALS: 'anhad_daily_goals',

        // Sehaj Paath - CORRECT KEYS
        SEHAJ_STATE: 'sehajPaathState',
        SEHAJ_STATS: 'sehajPaathStats',

        // Nitnem Tracker
        NITNEM_LOG: 'nitnemTracker_nitnemLog',
        AMRITVELA_LOG: 'nitnemTracker_amritvelaLog',
        STREAK_DATA: 'nitnemTracker_streakData',
        SELECTED_BANIS: 'nitnemTracker_selectedBanis',

        // Naam Abhyas
        NAAM_HISTORY: 'naam_abhyas_history'
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function loadData(key, defaultValue = {}) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.warn(`Error loading ${key}:`, e);
            return defaultValue;
        }
    }

    function getTodayString() {
        return new Date().toLocaleDateString('en-CA');
    }

    function getYesterdayString() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toLocaleDateString('en-CA');
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function animateNumber(element, target, duration = 1000) {
        if (!element) return;
        const start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            const current = Math.round(start + (target - start) * eased);
            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // THEME TOGGLE
    // ═══════════════════════════════════════════════════════════════════════════

    function setupThemeToggle() {
        const themeBtn = document.getElementById('themeToggleBtn');
        const themeIcon = document.getElementById('themeIcon');

        if (!themeBtn || !themeIcon) return;

        // Sync with current theme
        function updateIcon() {
            const isDark = document.documentElement.classList.contains('dark-mode');
            themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }

        // Initial icon state
        updateIcon();

        // Toggle theme on click
        themeBtn.addEventListener('click', () => {
            if (window.AnhadTheme && typeof window.AnhadTheme.toggle === 'function') {
                window.AnhadTheme.toggle();
            } else {
                // Fallback: Toggle dark-mode class manually
                document.documentElement.classList.toggle('dark-mode');
                const isDark = document.documentElement.classList.contains('dark-mode');
                localStorage.setItem('anhad_theme', isDark ? 'dark' : 'light');
            }
            updateIcon();
        });

        // Listen for theme changes from other sources
        window.addEventListener('themechange', updateIcon);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA AGGREGATION - FIXED
    // ═══════════════════════════════════════════════════════════════════════════

    function getAnhadStatsData() {
        // Try to use the global AnhadStats if available
        if (window.AnhadStats && typeof window.AnhadStats.getSummary === 'function') {
            return window.AnhadStats.getSummary();
        }

        // Fallback: Load directly from localStorage
        const stats = loadData(KEYS.ANHAD_STATS);
        const streak = loadData(KEYS.ANHAD_STREAK);
        const goals = loadData(KEYS.ANHAD_GOALS);

        return {
            totalListeningMinutes: stats.totalListeningMinutes || 0,
            totalListeningHours: Math.round((stats.totalListeningMinutes || 0) / 60 * 10) / 10,
            totalPagesRead: stats.totalPagesRead || 0,
            totalNitnemCompleted: stats.totalNitnemCompleted || 0,
            totalDaysActive: stats.totalDaysActive || 0,
            todayListeningMinutes: stats.todayListeningMinutes || 0,
            todayPagesRead: stats.todayPagesRead || 0,
            todayNitnemCount: stats.todayNitnemCount || 0,
            currentStreak: streak.currentStreak || 0,
            longestStreak: streak.longestStreak || 0,
            freezesAvailable: streak.freezesAvailable || 0,
            milestones: streak.milestones || {},
            firstUseDate: stats.firstUseDate,
            goals: goals
        };
    }

    function getSehajPaathData() {
        // CORRECT: Load from sehajPaathState and sehajPaathStats
        const state = loadData(KEYS.SEHAJ_STATE);
        const stats = loadData(KEYS.SEHAJ_STATS);

        // Get current Ang from state.currentPaath
        let currentAng = 1;
        if (state.currentPaath && state.currentPaath.currentAng) {
            currentAng = state.currentPaath.currentAng;
        } else if (state.currentAng) {
            currentAng = state.currentAng;
        }

        const totalAngs = 1430;
        const percent = Math.round((currentAng / totalAngs) * 100);
        const remaining = totalAngs - currentAng;

        // Get total Angs read from stats
        const totalAngsRead = stats.totalAngsRead || currentAng - 1;

        // Estimate completion based on average
        const daysActive = stats.totalDaysActive || 1;
        const avgAngsPerDay = totalAngsRead / Math.max(daysActive, 1);

        let estimatedDays = '--';
        if (avgAngsPerDay > 0 && remaining > 0) {
            const days = Math.ceil(remaining / avgAngsPerDay);
            if (days < 30) {
                estimatedDays = `${days} days`;
            } else if (days < 365) {
                estimatedDays = `${Math.round(days / 30)} months`;
            } else {
                estimatedDays = `${Math.round(days / 365)} years`;
            }
        }

        console.log('📖 Sehaj Paath Data:', { state, currentAng, stats });

        return {
            currentAng,
            percent,
            remaining,
            totalAngsRead,
            estimatedCompletion: estimatedDays
        };
    }

    function getNitnemData() {
        const nitnemLog = loadData(KEYS.NITNEM_LOG);
        const selectedBanis = loadData(KEYS.SELECTED_BANIS);
        const streakData = loadData(KEYS.STREAK_DATA);
        const today = getTodayString();
        const yesterday = getYesterdayString();

        // Calculate total banis based on user selection
        let totalBanis = 0;
        if (selectedBanis && typeof selectedBanis === 'object') {
            totalBanis = (selectedBanis.amritvela?.length || 0) +
                (selectedBanis.rehras?.length || 0) +
                (selectedBanis.sohila?.length || 0);
        }
        // Only use default if no banis configuration exists at all
        if (totalBanis === 0 && !selectedBanis) {
            totalBanis = 11; // Default for first-time users
        }

        // Get today's completed count
        let todayCompleted = 0;
        if (nitnemLog[today]) {
            if (Array.isArray(nitnemLog[today])) {
                todayCompleted = nitnemLog[today].length;
            } else if (typeof nitnemLog[today] === 'object') {
                todayCompleted = (nitnemLog[today].amritvela?.length || 0) +
                    (nitnemLog[today].rehras?.length || 0) +
                    (nitnemLog[today].sohila?.length || 0);
            }
        }

        // Get yesterday's completed count
        let yesterdayCompleted = 0;
        if (nitnemLog[yesterday]) {
            if (Array.isArray(nitnemLog[yesterday])) {
                yesterdayCompleted = nitnemLog[yesterday].length;
            } else if (typeof nitnemLog[yesterday] === 'object') {
                yesterdayCompleted = (nitnemLog[yesterday].amritvela?.length || 0) +
                    (nitnemLog[yesterday].rehras?.length || 0) +
                    (nitnemLog[yesterday].sohila?.length || 0);
            }
        }

        // Get streak from streakData
        const currentStreak = streakData.current || 0;
        const longestStreak = streakData.longest || 0;

        // Count total Nitnem completed
        let totalNitnemCompleted = 0;
        Object.values(nitnemLog).forEach(day => {
            if (Array.isArray(day)) {
                totalNitnemCompleted += day.length;
            } else if (typeof day === 'object') {
                totalNitnemCompleted += (day.amritvela?.length || 0) +
                    (day.rehras?.length || 0) +
                    (day.sohila?.length || 0);
            }
        });

        console.log('📿 Nitnem Data:', { todayCompleted, totalBanis, totalNitnemCompleted });

        return {
            totalBanis,
            todayCompleted,
            yesterdayCompleted,
            currentStreak,
            longestStreak,
            totalNitnemCompleted
        };
    }

    function getAmritvelaData() {
        const amritvelaLog = loadData(KEYS.AMRITVELA_LOG);

        // Count total days woken
        let totalDays = 0;
        const times = [];
        const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat

        Object.entries(amritvelaLog).forEach(([date, entry]) => {
            if (entry && entry.woke) {
                totalDays++;

                // Track time for average calculation
                if (entry.time) {
                    const match = entry.time.match(/(\d+):(\d+)/);
                    if (match) {
                        times.push(parseInt(match[1]) * 60 + parseInt(match[2]));
                    }
                }

                // Track by day of week
                const d = new Date(date);
                dayCount[d.getDay()]++;
            }
        });

        // Calculate average wake time
        let avgWakeTime = '--:--';
        if (times.length > 0) {
            const avgMinutes = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
            const hours = Math.floor(avgMinutes / 60);
            const mins = avgMinutes % 60;
            avgWakeTime = `${hours}:${mins.toString().padStart(2, '0')} AM`;
        }

        // Find best day
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const bestDayIndex = dayCount.indexOf(Math.max(...dayCount));
        const bestDay = dayCount[bestDayIndex] > 0 ? dayNames[bestDayIndex] : '--';

        // Get week data
        const weekData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');
            weekData.push({
                label: dayNames[d.getDay()],
                woke: amritvelaLog[dateStr]?.woke || false
            });
        }

        return {
            totalDays,
            avgWakeTime,
            bestDay,
            weekData
        };
    }

    function getNaamAbhyasData() {
        const history = loadData(KEYS.NAAM_HISTORY);
        const today = getTodayString();

        let totalSessions = history.totalCompleted || 0;
        let todaySessions = 0;
        let todayMinutes = 0;

        if (history.daily && history.daily[today]) {
            todaySessions = history.daily[today].completed || 0;
            todayMinutes = Math.round((history.daily[today].totalMinutes || 0));
        }

        return {
            totalSessions,
            todaySessions,
            todayMinutes
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UI UPDATE FUNCTIONS - FIXED
    // ═══════════════════════════════════════════════════════════════════════════

    function updateUserCard(stats, nitnem) {
        const memberSince = document.getElementById('memberSince');
        const currentStreakBadge = document.getElementById('currentStreak');

        if (stats.firstUseDate) {
            memberSince.textContent = `Member since ${formatDate(stats.firstUseDate)}`;
        } else {
            memberSince.textContent = 'Welcome to ANHAD!';
        }

        // Use Nitnem streak if available, else use stats streak
        const streak = nitnem.currentStreak || stats.currentStreak || 0;
        currentStreakBadge.textContent = streak;
    }

    function updateStatsGrid(stats, sehaj, nitnem) {
        // Hours Listened
        animateNumber(document.getElementById('totalListeningHours'), Math.round(stats.totalListeningHours));

        // Days Active
        animateNumber(document.getElementById('totalDaysActive'), stats.totalDaysActive);

        // Total Nitnem Done - use actual count
        animateNumber(document.getElementById('totalNitnem'), nitnem.totalNitnemCompleted || stats.totalNitnemCompleted);

        // ANGS Read (not Pages!) - use Sehaj Paath data
        animateNumber(document.getElementById('totalPages'), sehaj.totalAngsRead || sehaj.currentAng - 1);
    }

    function updateComparison(stats, nitnem) {
        // Listening comparison
        document.getElementById('todayListening').textContent = `${stats.todayListeningMinutes} min`;
        document.getElementById('yesterdayListening').textContent = '-- min';

        // Nitnem comparison
        document.getElementById('todayNitnem').textContent = `${nitnem.todayCompleted}/${nitnem.totalBanis}`;
        document.getElementById('yesterdayNitnem').textContent = `${nitnem.yesterdayCompleted}/${nitnem.totalBanis}`;

        // Angs comparison
        document.getElementById('todayPages').textContent = stats.todayPagesRead || 0;
        document.getElementById('yesterdayPages').textContent = '--';
    }

    function updateStreakSection(stats, nitnem) {
        const streakNumber = document.getElementById('streakNumber');
        const currentStreakDisplay = document.getElementById('currentStreakDisplay');
        const longestStreak = document.getElementById('longestStreak');
        const freezesAvailable = document.getElementById('freezesAvailable');
        const streakRingFill = document.getElementById('streakRingFill');

        // Use Nitnem streak if available
        const currentStreak = nitnem.currentStreak || stats.currentStreak || 0;
        const longest = nitnem.longestStreak || stats.longestStreak || 0;

        // Update numbers
        animateNumber(streakNumber, currentStreak);
        currentStreakDisplay.textContent = `${currentStreak} days`;
        longestStreak.textContent = `${longest} days`;
        freezesAvailable.textContent = `${stats.freezesAvailable || 0} ❄️`;

        // Update ring (max out at 108 days for visual)
        const maxRing = 108;
        const progress = Math.min(currentStreak / maxRing, 1);
        const circumference = 283; // 2 * π * 45
        if (streakRingFill) {
            streakRingFill.style.stroke = 'url(#streakGradient)';
            streakRingFill.style.strokeDashoffset = circumference * (1 - progress);
        }

        // Update milestones
        const milestoneValues = [7, 21, 40, 108, 365];
        milestoneValues.forEach(days => {
            const el = document.getElementById(`milestone${days}`);
            if (el) {
                if (currentStreak >= days || (stats.milestones && stats.milestones[`day${days}`])) {
                    el.classList.add('achieved');
                }
            }
        });
    }

    function updateAmritvelaSection(amritvela) {
        document.getElementById('amritvelaDays').textContent = amritvela.totalDays;
        document.getElementById('avgWakeTime').textContent = amritvela.avgWakeTime;
        document.getElementById('bestDay').textContent = amritvela.bestDay;

        // Update week visualization
        const weekContainer = document.getElementById('amritvelaWeek');
        if (weekContainer) {
            weekContainer.innerHTML = amritvela.weekData.map(day => `
                <div class="amritvela-week__day">
                    <div class="amritvela-week__dot ${day.woke ? 'woke' : ''}">
                        ${day.woke ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <span class="amritvela-week__label">${day.label}</span>
                </div>
            `).join('');
        }
    }

    function updateNaamSection(naam) {
        document.getElementById('naamSessionsTotal').textContent = naam.totalSessions;
        document.getElementById('naamSessionsToday').textContent = naam.todaySessions;
        document.getElementById('naamMinutesToday').textContent = naam.todayMinutes;
    }

    function updateSehajSection(sehaj) {
        document.getElementById('currentAng').textContent = sehaj.currentAng;
        document.getElementById('sehajPercent').textContent = `${sehaj.percent}%`;
        document.getElementById('pagesRemaining').textContent = sehaj.remaining;
        document.getElementById('estimatedCompletion').textContent = sehaj.estimatedCompletion;

        // Animate progress bar
        setTimeout(() => {
            const fill = document.getElementById('sehajProgressFill');
            if (fill) fill.style.width = `${sehaj.percent}%`;
        }, 300);
    }

    function updateGoalsSection(stats) {
        const goals = stats.goals || {};

        // Listening goal
        const listenGoal = goals.listenMinutes || { target: 30, current: stats.todayListeningMinutes || 0, enabled: true };
        const listenPercent = Math.min(100, Math.round((listenGoal.current / listenGoal.target) * 100));
        const listenFill = document.getElementById('goalListeningFill');
        if (listenFill) listenFill.style.width = `${listenPercent}%`;
        const listenPercentEl = document.getElementById('goalListeningPercent');
        if (listenPercentEl) listenPercentEl.textContent = `${listenPercent}%`;

        // Angs goal
        const pagesGoal = goals.readPages || { target: 5, current: stats.todayPagesRead || 0, enabled: true };
        const pagesPercent = Math.min(100, Math.round((pagesGoal.current / pagesGoal.target) * 100));
        const pagesFill = document.getElementById('goalPagesFill');
        if (pagesFill) pagesFill.style.width = `${pagesPercent}%`;
        const pagesPercentEl = document.getElementById('goalPagesPercent');
        if (pagesPercentEl) pagesPercentEl.textContent = `${pagesPercent}%`;

        // Nitnem goal
        const nitnemGoal = goals.completeNitnem || { target: 1, current: stats.todayNitnemCount || 0, enabled: true };
        const nitnemPercent = Math.min(100, Math.round((nitnemGoal.current / nitnemGoal.target) * 100));
        const nitnemFill = document.getElementById('goalNitnemFill');
        if (nitnemFill) nitnemFill.style.width = `${nitnemPercent}%`;
        const nitnemPercentEl = document.getElementById('goalNitnemPercent');
        if (nitnemPercentEl) nitnemPercentEl.textContent = `${nitnemPercent}%`;
    }

    function updateWeeklyChart() {
        const weekContainer = document.getElementById('weeklyChart');
        if (!weekContainer) return;

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const stats = loadData(KEYS.ANHAD_STATS);

        // Generate week data from stats if available
        const weekData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            weekData.push({
                label: dayNames[d.getDay()],
                listening: Math.random() * 60, // Would need historical data
                nitnem: Math.random() * 100
            });
        }

        const maxListening = Math.max(...weekData.map(d => d.listening)) || 1;
        const maxNitnem = Math.max(...weekData.map(d => d.nitnem)) || 1;

        weekContainer.innerHTML = weekData.map(day => `
            <div class="weekly-chart__day">
                <div class="weekly-chart__bars">
                    <div class="weekly-chart__bar weekly-chart__bar--listening" 
                         style="height: ${(day.listening / maxListening) * 70}px"></div>
                    <div class="weekly-chart__bar weekly-chart__bar--nitnem" 
                         style="height: ${(day.nitnem / maxNitnem) * 70}px"></div>
                </div>
                <span class="weekly-chart__label">${day.label}</span>
            </div>
        `).join('');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════════

    function setupNavigation() {
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = '../index.html';
                }
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        console.log('📊 ANHAD Profile Page initializing (FIXED)...');

        // Setup navigation
        setupNavigation();

        // Setup theme toggle
        setupThemeToggle();

        // Load and display all data
        refreshAllData();

        console.log('✅ Profile page loaded successfully');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA REFRESH - Reusable function to load and display all data
    // ═══════════════════════════════════════════════════════════════════════════

    function refreshAllData() {
        console.log('🔄 Refreshing profile data...');

        // Gather all data from localStorage
        const stats = getAnhadStatsData();
        const sehaj = getSehajPaathData();
        const nitnem = getNitnemData();
        const amritvela = getAmritvelaData();
        const naam = getNaamAbhyasData();

        console.log('📈 Stats:', stats);
        console.log('📖 Sehaj:', sehaj);
        console.log('📿 Nitnem:', nitnem);
        console.log('🌅 Amritvela:', amritvela);
        console.log('🙏 Naam:', naam);

        // Update all UI sections with CORRECT data
        updateUserCard(stats, nitnem);
        updateStatsGrid(stats, sehaj, nitnem);
        updateComparison(stats, nitnem);
        updateStreakSection(stats, nitnem);
        updateAmritvelaSection(amritvela);
        updateNaamSection(naam);
        updateSehajSection(sehaj);
        updateGoalsSection(stats);
        updateWeeklyChart();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PAGE VISIBILITY HANDLERS - Refresh data when returning to page
    // ═══════════════════════════════════════════════════════════════════════════

    // Refresh when page becomes visible (switching tabs or returning from other page)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            refreshAllData();
        }
    });

    // Also refresh on pageshow (handles back/forward navigation cache)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            refreshAllData();
        }
    });

})();
