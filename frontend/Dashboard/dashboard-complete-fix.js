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
    // FIX 1: Sync and preserve existing data
    // ═══════════════════════════════════════════════════════════════════════════

    function resetAndSync() {
        console.log('📊 [FIX 1] Syncing data (preserving existing)...');
        
        const today = new Date().toLocaleDateString('en-CA');
        
        // Get existing data first (PRESERVE EXISTING)
        const existingStats = JSON.parse(localStorage.getItem('anhad_user_stats') || '{}');
        const existingGoals = JSON.parse(localStorage.getItem('anhad_daily_goals') || '{}');
        const existingAnalytics = JSON.parse(localStorage.getItem('anhad_daily_analytics') || '{}');
        const existingUnified = JSON.parse(localStorage.getItem('anhad_unified_stats') || '{}');
        
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
        
        // Get existing listening minutes from UnifiedStats (if any)
        let existingListeningMinutes = 0;
        if (existingUnified.daily && existingUnified.daily[today]) {
            existingListeningMinutes = existingUnified.daily[today].kirtanMinutes || 0;
        } else if (existingStats.todayListeningMinutes) {
            existingListeningMinutes = existingStats.todayListeningMinutes;
        }
        
        // Get total lifetime stats (preserve existing totals)
        const existingTotalPages = existingStats.totalPagesRead || 0;
        const existingTotalListening = existingStats.totalListeningMinutes || 0;
        const existingTotalNitnem = existingStats.totalNitnemCompleted || 0;
        const existingTotalDays = existingStats.totalDaysActive || 1;
        const existingFirstUseDate = existingStats.firstUseDate || today;
        
        console.log(`📿 Nitnem: ${completedBanis}/${totalBanis} banis`);
        console.log(`📖 Sehaj Paath: ${todayPages} pages (existing: ${existingStats.todayPagesRead || 0})`);
        console.log(`🎧 Listening: ${existingListeningMinutes} min (preserved)`);
        
        // Only update if new values are higher (never decrease)
        const finalPagesRead = Math.max(todayPages, existingStats.todayPagesRead || 0);
        const finalListeningMinutes = Math.max(existingListeningMinutes, existingStats.todayListeningMinutes || 0);
        const finalNitnemCount = Math.max(completedBanis, existingStats.todayNitnemCount || 0);
        
        // Update user stats - PRESERVE TOTALS, only update today's values
        const userStats = {
            ...existingStats,
            todayDate: today,
            todayPagesRead: finalPagesRead,
            todayListeningMinutes: finalListeningMinutes,
            todayNitnemCount: finalNitnemCount,
            // Preserve or calculate totals
            totalPagesRead: Math.max(existingTotalPages, finalPagesRead),
            totalListeningMinutes: Math.max(existingTotalListening, finalListeningMinutes),
            totalNitnemCompleted: Math.max(existingTotalNitnem, isNitnemComplete ? 1 : 0),
            totalDaysActive: existingTotalDays,
            firstUseDate: existingFirstUseDate,
            lastActiveDate: today,
            sessionListeningMinutes: 0,
            sessionStartTime: null
        };
        
        localStorage.setItem('anhad_user_stats', JSON.stringify(userStats));
        
        // Update goals - preserve existing, only update current values
        const goals = {
            readPages: { 
                target: existingGoals.readPages?.target || 5, 
                current: finalPagesRead, 
                enabled: existingGoals.readPages?.enabled !== false,
                complete: finalPagesRead >= (existingGoals.readPages?.target || 5)
            },
            listenMinutes: { 
                target: existingGoals.listenMinutes?.target || 30, 
                current: finalListeningMinutes, 
                enabled: existingGoals.listenMinutes?.enabled !== false,
                complete: finalListeningMinutes >= (existingGoals.listenMinutes?.target || 30)
            },
            completeNitnem: { 
                target: 1, 
                current: isNitnemComplete ? 1 : 0, 
                enabled: existingGoals.completeNitnem?.enabled !== false,
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
        
        // Update analytics - merge with existing data
        const analytics = { ...existingAnalytics };
        const todayAnalytics = analytics[today] || {};
        analytics[today] = {
            readPages: Math.max(finalPagesRead, todayAnalytics.readPages || 0),
            listenMinutes: Math.max(finalListeningMinutes, todayAnalytics.listenMinutes || 0),
            nitnemCount: isNitnemComplete ? 1 : (todayAnalytics.nitnemCount || 0)
        };
        
        localStorage.setItem('anhad_daily_analytics', JSON.stringify(analytics));
        
        // Also update UnifiedStats to ensure consistency
        if (!existingUnified.daily) existingUnified.daily = {};
        if (!existingUnified.daily[today]) {
            existingUnified.daily[today] = {
                angRead: 0,
                nitnemBanis: [],
                nitnemComplete: false,
                kirtanMinutes: 0
            };
        }
        existingUnified.daily[today].angRead = Math.max(finalPagesRead, existingUnified.daily[today].angRead || 0);
        existingUnified.daily[today].kirtanMinutes = Math.max(finalListeningMinutes, existingUnified.daily[today].kirtanMinutes || 0);
        existingUnified.daily[today].nitnemComplete = isNitnemComplete || existingUnified.daily[today].nitnemComplete;
        existingUnified.lastActive = new Date().toISOString();
        localStorage.setItem('anhad_unified_stats', JSON.stringify(existingUnified));
        
        console.log('✅ [FIX 1] Data synced (existing data preserved)');
        console.log('  - Pages: ' + finalPagesRead);
        console.log('  - Banis: ' + completedBanis);
        console.log('  - Listening: ' + finalListeningMinutes + ' min');
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
