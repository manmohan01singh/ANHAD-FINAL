/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COMPLETE DASHBOARD FIX
 * Fixes ALL sync and display issues
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    console.log('🔧 [COMPLETE FIX] Starting comprehensive dashboard fix...');

    // ═══════════════════════════════════════════════════════════════════════════
    // FIX 1: Clear localStorage and reset to correct values
    // ═══════════════════════════════════════════════════════════════════════════

    function resetAndSync() {
        console.log('📊 [FIX 1] Resetting and syncing all data...');
        
        const today = new Date().toLocaleDateString('en-CA');
        
        // Get actual data from sources
        const nitnemLog = JSON.parse(localStorage.getItem('nitnemTracker_nitnemLog') || '{}');
        const selectedBanis = JSON.parse(localStorage.getItem('nitnemTracker_selectedBanis') || 
            '{"amritvela":[],"rehras":[],"sohila":[]}');
        const sehajHistory = JSON.parse(localStorage.getItem('sehajPaathHistory') || '[]');
        
        // Count actual Nitnem banis completed today
        const totalBanis = (selectedBanis.amritvela?.length || 0) + 
                          (selectedBanis.rehras?.length || 0) + 
                          (selectedBanis.sohila?.length || 0);
        const todayLog = nitnemLog[today];
        let completedBanis = 0;
        if (todayLog) {
            completedBanis = (todayLog.amritvela?.length || 0) + 
                           (todayLog.rehras?.length || 0) + 
                           (todayLog.sohila?.length || 0);
        }
        
        // Nitnem is complete ONLY if ALL selected banis are done
        const isNitnemComplete = totalBanis > 0 && completedBanis === totalBanis;
        
        // Count actual Sehaj Paath pages read today
        const todayPages = sehajHistory.filter(entry => {
            const entryDate = new Date(entry.timestamp).toLocaleDateString('en-CA');
            return entryDate === today;
        }).length;
        
        console.log(`📿 Nitnem: ${completedBanis}/${totalBanis} banis`);
        console.log(`📖 Sehaj Paath: ${todayPages} pages`);
        
        // Reset user stats with correct values
        const userStats = {
            todayDate: today,
            todayPagesRead: todayPages,
            todayListeningMinutes: 0, // Will be updated by Kirtan tracker
            todayNitnemCount: completedBanis,
            totalPagesRead: todayPages,
            totalListeningMinutes: 0,
            totalNitnemCompleted: completedBanis,
            totalShabadsViewed: 0,
            totalDaysActive: 1,
            firstUseDate: today,
            lastActiveDate: today,
            sessionListeningMinutes: 0,
            sessionStartTime: null
        };
        
        localStorage.setItem('anhad_user_stats', JSON.stringify(userStats));
        
        // Reset goals with correct values
        const goals = {
            readPages: { 
                target: 5, 
                current: todayPages, 
                enabled: true,
                complete: todayPages >= 5
            },
            listenMinutes: { 
                target: 30, 
                current: 0, 
                enabled: true,
                complete: false
            },
            completeNitnem: { 
                target: 1, 
                current: isNitnemComplete ? 1 : 0, 
                enabled: true,
                complete: isNitnemComplete
            },
            naamAbhyas: { 
                target: 1, 
                current: 0, 
                enabled: false,
                complete: false
            }
        };
        
        localStorage.setItem('anhad_daily_goals', JSON.stringify(goals));
        
        // Reset analytics with correct values
        // CRITICAL FIX: Store 0 or 1 for Nitnem (not bani count) to prevent bar exceeding goal
        const analytics = {};
        analytics[today] = {
            readPages: todayPages,
            listenMinutes: 0,
            nitnemCount: isNitnemComplete ? 1 : 0  // Store completion status, not bani count
        };
        
        localStorage.setItem('anhad_daily_analytics', JSON.stringify(analytics));
        
        console.log('✅ [FIX 1] Data reset complete');
        console.log('  - Pages: ' + todayPages);
        console.log('  - Banis: ' + completedBanis);
        console.log('  - Listening: 0 min');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FIX 2: Force refresh dashboard display
    // ═══════════════════════════════════════════════════════════════════════════

    function forceRefreshDashboard() {
        console.log('🔄 [FIX 2] Force refreshing dashboard...');
        
        // Trigger all update events
        window.dispatchEvent(new CustomEvent('statsUpdated'));
        window.dispatchEvent(new CustomEvent('goalsUpdated'));
        window.dispatchEvent(new CustomEvent('nitnemUpdated'));
        window.dispatchEvent(new CustomEvent('dashboardRefresh'));
        
        // Force dashboard analytics refresh
        if (window.DashboardAnalytics) {
            setTimeout(() => {
                window.DashboardAnalytics.syncWithUserStats();
                window.DashboardAnalytics.syncWithNitnemTracker();
                window.DashboardAnalytics.renderChart();
            }, 100);
        }
        
        console.log('✅ [FIX 2] Dashboard refreshed');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FIX 3: Display current status
    // ═══════════════════════════════════════════════════════════════════════════

    function displayStatus() {
        console.log('\n📊 [STATUS] Current Dashboard State:');
        console.log('═══════════════════════════════════════════════════════════');
        
        const userStats = JSON.parse(localStorage.getItem('anhad_user_stats') || '{}');
        const goals = JSON.parse(localStorage.getItem('anhad_daily_goals') || '{}');
        const analytics = JSON.parse(localStorage.getItem('anhad_daily_analytics') || '{}');
        const today = new Date().toLocaleDateString('en-CA');
        
        console.log('User Stats:');
        console.log(`  📖 Pages Read: ${userStats.todayPagesRead || 0}`);
        console.log(`  🎧 Listening: ${userStats.todayListeningMinutes || 0} min`);
        console.log(`  📿 Nitnem: ${userStats.todayNitnemCount || 0} banis`);
        
        console.log('\nGoals:');
        if (goals.readPages) console.log(`  📖 Read: ${goals.readPages.current}/${goals.readPages.target}`);
        if (goals.listenMinutes) console.log(`  🎧 Listen: ${goals.listenMinutes.current}/${goals.listenMinutes.target}`);
        if (goals.completeNitnem) console.log(`  📿 Nitnem: ${goals.completeNitnem.current}/${goals.completeNitnem.target}`);
        
        console.log('\nAnalytics (Today):');
        if (analytics[today]) {
            console.log(`  📖 Pages: ${analytics[today].readPages || 0}`);
            console.log(`  🎧 Minutes: ${analytics[today].listenMinutes || 0}`);
            console.log(`  📿 Banis: ${analytics[today].nitnemCount || 0}`);
        }
        
        console.log('═══════════════════════════════════════════════════════════\n');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RUN ALL FIXES
    // ═══════════════════════════════════════════════════════════════════════════

    function runCompleteFix() {
        console.log('🚀 [COMPLETE FIX] Running all fixes...\n');
        
        resetAndSync();
        forceRefreshDashboard();
        
        setTimeout(() => {
            displayStatus();
            console.log('✅ [COMPLETE FIX] All fixes applied!');
            console.log('💡 Refresh the page to see corrected data.\n');
        }, 500);
    }

    // Auto-run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runCompleteFix);
    } else {
        runCompleteFix();
    }

    // Expose for manual use
    window.runCompleteDashboardFix = runCompleteFix;
    
    console.log('💡 You can also run: window.runCompleteDashboardFix()');
})();
