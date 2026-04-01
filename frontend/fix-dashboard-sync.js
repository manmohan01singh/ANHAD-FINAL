/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DASHBOARD SYNC FIX SCRIPT
 * Run this in browser console to fix counting issues
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    console.log('🔧 Starting Dashboard Sync Fix...');

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Clear duplicate data
    // ═══════════════════════════════════════════════════════════════════════════

    function clearDuplicateData() {
        console.log('📊 Clearing duplicate tracking data...');
        
        // Get current stats
        const userStats = JSON.parse(localStorage.getItem('anhad_user_stats') || '{}');
        const analyticsData = JSON.parse(localStorage.getItem('anhad_daily_analytics') || '{}');
        const today = new Date().toLocaleDateString('en-CA');
        
        console.log('Before fix:');
        console.log('- User Stats Today:', {
            pages: userStats.todayPagesRead,
            listening: userStats.todayListeningMinutes,
            nitnem: userStats.todayNitnemCount
        });
        console.log('- Analytics Today:', analyticsData[today]);
        
        // If pages are doubled, halve them
        if (userStats.todayPagesRead && userStats.todayPagesRead % 2 === 0) {
            const halfPages = userStats.todayPagesRead / 2;
            console.log(`⚠️ Detected double counting: ${userStats.todayPagesRead} pages → ${halfPages} pages`);
            userStats.todayPagesRead = halfPages;
            userStats.totalPagesRead = (userStats.totalPagesRead || 0) - halfPages;
        }
        
        // Save corrected stats
        localStorage.setItem('anhad_user_stats', JSON.stringify(userStats));
        
        // Fix analytics data
        if (analyticsData[today] && analyticsData[today].readPages % 2 === 0) {
            analyticsData[today].readPages = analyticsData[today].readPages / 2;
            localStorage.setItem('anhad_daily_analytics', JSON.stringify(analyticsData));
        }
        
        console.log('✅ Duplicate data cleared');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Sync Nitnem completion with goals
    // ═══════════════════════════════════════════════════════════════════════════

    function syncNitnemGoals() {
        console.log('📿 Syncing Nitnem goals...');
        
        // Check if all banis are complete
        const nitnemLog = JSON.parse(localStorage.getItem('nitnemTracker_nitnemLog') || '{}');
        const selectedBanis = JSON.parse(localStorage.getItem('nitnemTracker_selectedBanis') || 
            '{"amritvela":[],"rehras":[],"sohila":[]}');
        const today = new Date().toLocaleDateString('en-CA');
        
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
        
        console.log(`Nitnem: ${completedBanis}/${totalBanis} banis completed`);
        
        // Update goals
        const goals = JSON.parse(localStorage.getItem('anhad_daily_goals') || '{}');
        
        if (goals.completeNitnem) {
            // FIXED: Show progress as fraction (e.g., 5/9 banis = 0.55)
            // But goal is binary: 0 (incomplete) or 1 (all done)
            if (completedBanis === totalBanis && totalBanis > 0) {
                goals.completeNitnem.current = 1;
                console.log('✅ Full Nitnem complete - goal set to 1/1');
            } else if (completedBanis > 0) {
                // Show partial progress (e.g., 5 banis done out of 9)
                goals.completeNitnem.current = completedBanis / totalBanis;
                console.log(`⏳ Nitnem in progress - ${completedBanis}/${totalBanis} banis (${Math.round(completedBanis/totalBanis*100)}%)`);
            } else {
                goals.completeNitnem.current = 0;
                console.log(`⏳ Nitnem not started - goal set to 0/1`);
            }
            
            localStorage.setItem('anhad_daily_goals', JSON.stringify(goals));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: Ensure Kirtan listening is connected
    // ═══════════════════════════════════════════════════════════════════════════

    function ensureKirtanTracking() {
        console.log('🎧 Checking Kirtan tracking...');
        
        const userStats = JSON.parse(localStorage.getItem('anhad_user_stats') || '{}');
        const goals = JSON.parse(localStorage.getItem('anhad_daily_goals') || '{}');
        
        if (goals.listenMinutes) {
            goals.listenMinutes.current = userStats.todayListeningMinutes || 0;
            localStorage.setItem('anhad_daily_goals', JSON.stringify(goals));
            console.log(`✅ Kirtan goal synced: ${goals.listenMinutes.current}/${goals.listenMinutes.target} min`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: Refresh dashboard
    // ═══════════════════════════════════════════════════════════════════════════

    function refreshDashboard() {
        console.log('🔄 Refreshing dashboard...');
        
        // Trigger all update events
        window.dispatchEvent(new CustomEvent('statsUpdated'));
        window.dispatchEvent(new CustomEvent('goalsUpdated'));
        window.dispatchEvent(new CustomEvent('nitnemUpdated'));
        window.dispatchEvent(new CustomEvent('dashboardRefresh'));
        
        // Force dashboard analytics refresh
        if (window.DashboardAnalytics) {
            window.DashboardAnalytics.syncWithUserStats();
            window.DashboardAnalytics.syncWithNitnemTracker();
            window.DashboardAnalytics.renderChart();
        }
        
        console.log('✅ Dashboard refreshed');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: Display current status
    // ═══════════════════════════════════════════════════════════════════════════

    function displayStatus() {
        console.log('\n📊 CURRENT STATUS:');
        console.log('═══════════════════════════════════════════════════════════');
        
        if (window.AnhadStats) {
            const summary = window.AnhadStats.getSummary();
            console.log('Today\'s Activity:');
            console.log(`  📖 Pages Read: ${summary.todayPagesRead}`);
            console.log(`  🎧 Listening: ${summary.todayListeningMinutes} min`);
            console.log(`  📿 Nitnem: ${summary.todayNitnemCount} banis`);
            console.log('\nGoals:');
            Object.entries(summary.goals).forEach(([key, goal]) => {
                if (goal.enabled) {
                    const status = goal.complete ? '✅' : '⏳';
                    console.log(`  ${status} ${key}: ${goal.current}/${goal.target}`);
                }
            });
        }
        
        console.log('═══════════════════════════════════════════════════════════\n');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RUN ALL FIXES
    // ═══════════════════════════════════════════════════════════════════════════

    function runAllFixes() {
        clearDuplicateData();
        syncNitnemGoals();
        ensureKirtanTracking();
        refreshDashboard();
        
        // Wait for refresh, then display status
        setTimeout(displayStatus, 500);
        
        console.log('\n✅ ALL FIXES COMPLETE!');
        console.log('Refresh the dashboard page to see corrected data.\n');
    }

    // Auto-run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAllFixes);
    } else {
        runAllFixes();
    }

    // Expose for manual use
    window.fixDashboardSync = runAllFixes;
    
    console.log('💡 You can also run: window.fixDashboardSync()');
})();
