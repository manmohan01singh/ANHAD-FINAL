/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UNIFIED PROGRESS TRACKER
 * Ensures ALL activities sync with Dashboard Analytics
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Tracks:
 * - Nitnem completion (individual banis + full day)
 * - Sehaj Paath reading (pages/angs read)
 * - Kirtan listening (minutes listened)
 * 
 * Automatically syncs with:
 * - AnhadStats (user-stats.js)
 * - DashboardAnalytics (dashboard-analytics.js)
 */

(function() {
    'use strict';

    const TRACKER_KEY = 'anhad_unified_tracker';
    const SYNC_INTERVAL = 5000; // Sync every 5 seconds
    
    let syncTimer = null;
    let pendingUpdates = {
        nitnem: 0,
        pagesRead: 0,
        listeningMinutes: 0
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // CORE TRACKING FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function trackNitnemCompletion(count = 1) {
        console.log(`[UnifiedTracker] 📿 Nitnem completion: ${count}`);
        pendingUpdates.nitnem += count;
        
        // Immediate sync for Nitnem (important milestone)
        // Sync to DashboardAnalytics first (before clearing pending)
        if (window.DashboardAnalytics) {
            window.DashboardAnalytics.updateDailyData('nitnem', count);
        }
        syncToStats();
        syncToDashboard();
    }

    function trackPagesRead(pages = 1) {
        console.log(`[UnifiedTracker] 📖 Pages read: ${pages}`);
        pendingUpdates.pagesRead += pages;
        
        // Direct sync to DashboardAnalytics for immediate chart update
        if (window.DashboardAnalytics) {
            window.DashboardAnalytics.updateDailyData('read', pages);
        }
        
        // Batch sync for AnhadStats (less critical)
        scheduleBatchSync();
    }

    function trackListeningTime(minutes = 1) {
        console.log(`[UnifiedTracker] 🎧 Listening time: ${minutes} min`);
        pendingUpdates.listeningMinutes += minutes;
        
        // Direct sync to DashboardAnalytics for immediate chart update
        if (window.DashboardAnalytics) {
            window.DashboardAnalytics.updateDailyData('listen', minutes);
        }
        
        // Batch sync for AnhadStats
        scheduleBatchSync();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SYNC FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function syncToStats() {
        if (!window.AnhadStats) {
            console.warn('[UnifiedTracker] AnhadStats not available');
            return false;
        }

        try {
            // Sync Nitnem
            if (pendingUpdates.nitnem > 0) {
                window.AnhadStats.addNitnemCompleted(pendingUpdates.nitnem);
                console.log(`[UnifiedTracker] ✅ Synced ${pendingUpdates.nitnem} Nitnem to AnhadStats`);
                pendingUpdates.nitnem = 0;
            }

            // Sync Pages Read
            if (pendingUpdates.pagesRead > 0) {
                window.AnhadStats.addPagesRead(pendingUpdates.pagesRead);
                console.log(`[UnifiedTracker] ✅ Synced ${pendingUpdates.pagesRead} pages to AnhadStats`);
                pendingUpdates.pagesRead = 0;
            }

            // Sync Listening Time
            if (pendingUpdates.listeningMinutes > 0) {
                window.AnhadStats.addListeningTime(pendingUpdates.listeningMinutes);
                console.log(`[UnifiedTracker] ✅ Synced ${pendingUpdates.listeningMinutes} min to AnhadStats`);
                pendingUpdates.listeningMinutes = 0;
            }

            // Force goals update
            if (window.AnhadStats.getGoals) {
                window.dispatchEvent(new CustomEvent('goalsUpdated', { 
                    detail: window.AnhadStats.getGoals() 
                }));
            }

            return true;
        } catch (e) {
            console.error('[UnifiedTracker] Error syncing to AnhadStats:', e);
            return false;
        }
    }

    function syncToDashboard() {
        try {
            // Trigger dashboard refresh events
            window.dispatchEvent(new CustomEvent('statsUpdated'));
            window.dispatchEvent(new CustomEvent('nitnemUpdated'));
            window.dispatchEvent(new CustomEvent('dashboardRefresh'));
            
            console.log('[UnifiedTracker] ✅ Dashboard refresh triggered');
            return true;
        } catch (e) {
            console.error('[UnifiedTracker] Error syncing to dashboard:', e);
            return false;
        }
    }

    function scheduleBatchSync() {
        if (syncTimer) {
            clearTimeout(syncTimer);
        }

        syncTimer = setTimeout(() => {
            syncToStats();
            syncToDashboard();
        }, SYNC_INTERVAL);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTO-SYNC ON PAGE UNLOAD
    // ═══════════════════════════════════════════════════════════════════════════

    window.addEventListener('beforeunload', () => {
        // Final sync before leaving
        syncToStats();
    });

    window.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Sync when tab becomes hidden
            syncToStats();
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // EXPOSE API
    // ═══════════════════════════════════════════════════════════════════════════

    window.UnifiedProgressTracker = {
        trackNitnemCompletion,
        trackPagesRead,
        trackListeningTime,
        syncToStats,
        syncToDashboard,
        
        // Manual sync
        syncNow: () => {
            syncToStats();
            syncToDashboard();
        },
        
        // Get pending updates
        getPending: () => ({ ...pendingUpdates })
    };

    console.log('✅ Unified Progress Tracker loaded');
})();
