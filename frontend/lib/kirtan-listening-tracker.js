/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * KIRTAN LISTENING TRACKER
 * Tracks listening time for Gurbani Radio and syncs with dashboard
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    let listeningStartTime = null;
    let totalListeningSeconds = 0;
    let trackingInterval = null;
    let lastSyncMinute = 0;

    // ═══════════════════════════════════════════════════════════════════════════
    // LISTENING SESSION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    function startListening() {
        if (listeningStartTime) {
            console.log('[KirtanTracker] Already tracking');
            return;
        }

        listeningStartTime = Date.now();
        console.log('[KirtanTracker] 🎧 Started tracking listening time');

        // Track every second
        trackingInterval = setInterval(() => {
            totalListeningSeconds++;
            
            // Sync every minute
            const currentMinute = Math.floor(totalListeningSeconds / 60);
            if (currentMinute > lastSyncMinute) {
                syncListeningTime(1); // 1 minute
                lastSyncMinute = currentMinute;
            }
        }, 1000);

        // Also notify AnhadStats
        if (window.AnhadStats && window.AnhadStats.startListeningSession) {
            window.AnhadStats.startListeningSession();
        }
    }

    function stopListening() {
        if (!listeningStartTime) {
            return;
        }

        // Calculate final listening time
        const sessionDuration = Math.floor((Date.now() - listeningStartTime) / 1000);
        const remainingSeconds = sessionDuration % 60;
        
        // Sync any remaining partial minute
        if (remainingSeconds > 30) {
            syncListeningTime(1);
        }

        // Clear tracking
        if (trackingInterval) {
            clearInterval(trackingInterval);
            trackingInterval = null;
        }

        console.log(`[KirtanTracker] 🎧 Stopped tracking. Total: ${Math.floor(totalListeningSeconds / 60)} min`);
        
        listeningStartTime = null;

        // Notify AnhadStats
        if (window.AnhadStats && window.AnhadStats.stopListeningSession) {
            window.AnhadStats.stopListeningSession();
        }
    }

    function syncListeningTime(minutes) {
        console.log(`[KirtanTracker] 📊 Syncing ${minutes} minute(s)`);

        // CRITICAL: Sync to DashboardAnalytics FIRST (most important for graph)
        if (window.DashboardAnalytics) {
            window.DashboardAnalytics.updateDailyData('listen', minutes);
            console.log('[KirtanTracker] ✅ Synced to DashboardAnalytics');
        } else {
            console.error('[KirtanTracker] ❌ DashboardAnalytics not available!');
        }
        
        // ALSO sync to UnifiedProgressTracker
        if (window.UnifiedProgressTracker) {
            window.UnifiedProgressTracker.trackListeningTime(minutes);
            console.log('[KirtanTracker] ✅ Synced to UnifiedProgressTracker');
        } else {
            console.warn('[KirtanTracker] ⚠️ UnifiedProgressTracker not available');
        }
        
        // ALSO sync to AnhadStats for redundancy
        if (window.AnhadStats) {
            window.AnhadStats.addListeningTime(minutes);
            console.log('[KirtanTracker] ✅ Synced to AnhadStats');
        } else {
            console.warn('[KirtanTracker] ⚠️ AnhadStats not available');
        }
        
        // Force dashboard refresh
        window.dispatchEvent(new CustomEvent('statsUpdated'));
        window.dispatchEvent(new CustomEvent('dashboardRefresh'));
        
        console.log('[KirtanTracker] 🔄 Dashboard refresh events dispatched');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTO-DETECT AUDIO PLAYBACK
    // ═══════════════════════════════════════════════════════════════════════════

    function setupAutoDetection() {
        // Listen for audio state changes
        window.addEventListener('anhadaudiostatechange', (e) => {
            if (e.detail && e.detail.isPlaying) {
                startListening();
            } else {
                stopListening();
            }
        });

        // Listen for audio coordinator events
        window.addEventListener('audiocoordinatorstatechange', (e) => {
            if (e.detail && e.detail.isPlaying) {
                startListening();
            } else {
                stopListening();
            }
        });

        // Detect HTML5 audio elements
        document.addEventListener('play', (e) => {
            if (e.target.tagName === 'AUDIO') {
                startListening();
            }
        }, true);

        document.addEventListener('pause', (e) => {
            if (e.target.tagName === 'AUDIO') {
                stopListening();
            }
        }, true);

        document.addEventListener('ended', (e) => {
            if (e.target.tagName === 'AUDIO') {
                stopListening();
            }
        }, true);

        console.log('[KirtanTracker] ✅ Auto-detection enabled');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CLEANUP ON PAGE UNLOAD
    // ═══════════════════════════════════════════════════════════════════════════

    window.addEventListener('beforeunload', () => {
        stopListening();
    });

    window.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pause tracking when tab is hidden (optional)
            // stopListening();
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        setupAutoDetection();
        
        console.log('[KirtanTracker] Initializing... GlobalMiniPlayer exists:', !!window.GlobalMiniPlayer);
        
        // CRITICAL FIX: Listen to GlobalMiniPlayer events DIRECTLY
        window.addEventListener('anhadaudiostatechange', (e) => {
            console.log('[KirtanTracker] 📡 Received anhadaudiostatechange event:', e.detail);
            if (e.detail && e.detail.isPlaying) {
                if (!listeningStartTime) {
                    console.log('[KirtanTracker] 🎧 STARTING from event');
                    startListening();
                }
            } else {
                if (listeningStartTime) {
                    console.log('[KirtanTracker] 🛑 STOPPING from event');
                    stopListening();
                }
            }
        });
        
        // CRITICAL FIX: Poll GlobalMiniPlayer directly (more reliable than DOM polling)
        let checkCount = 0;
        const checkInterval = setInterval(() => {
            checkCount++;
            let anyPlaying = false;
            
            // Check 1: GlobalMiniPlayer (most reliable)
            if (window.GlobalMiniPlayer && window.GlobalMiniPlayer.isPlaying) {
                if (window.GlobalMiniPlayer.isPlaying()) {
                    anyPlaying = true;
                    if (checkCount % 10 === 0) { // Log every 10 checks (20 seconds)
                        console.log('[KirtanTracker] Mini player is playing (check #' + checkCount + ')');
                    }
                }
            }
            
            // Check 2: Audio elements in DOM (fallback)
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => {
                if (!audio.paused && !audio.ended && audio.currentTime > 0) {
                    anyPlaying = true;
                }
            });
            
            if (anyPlaying && !listeningStartTime) {
                console.log('[KirtanTracker] 🎧 STARTING TRACKING (check #' + checkCount + ')');
                startListening();
            } else if (!anyPlaying && listeningStartTime) {
                console.log('[KirtanTracker] 🛑 STOPPING TRACKING (check #' + checkCount + ')');
                stopListening();
            }
        }, 2000); // Check every 2 seconds
        
        console.log('[KirtanTracker] ✅ Polling every 2s for audio...');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXPOSE API
    // ═══════════════════════════════════════════════════════════════════════════

    window.KirtanListeningTracker = {
        startListening,
        stopListening,
        getListeningTime: () => Math.floor(totalListeningSeconds / 60),
        isTracking: () => listeningStartTime !== null
    };

    console.log('✅ Kirtan Listening Tracker loaded');
})();
