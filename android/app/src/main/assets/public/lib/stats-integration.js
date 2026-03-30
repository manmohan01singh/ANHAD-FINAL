/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD STATS INTEGRATION LAYER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Connects all modules to the central AnhadStats system:
 * - Audio players (Radio, NaamAbhyas)
 * - Reading progress (SehajPaath, Nitnem)
 * - Streak tracking (unified)
 * - Dashboard updates (real-time)
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // AUDIO TRACKING INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════════

    class AudioTracker {
        constructor() {
            this.activeTrackers = new Map();
            this.SYNC_INTERVAL = 30000; // Sync every 30 seconds
            this.init();
        }

        init() {
            // Track all audio elements
            this.trackAudioElements();
            
            // Track custom audio players
            this.trackCustomPlayers();
            
            // Periodic sync - store for cleanup
            this.syncIntervalId = setInterval(() => this.syncAll(), this.SYNC_INTERVAL);
            
            // Cleanup on pagehide
            window.addEventListener('pagehide', () => {
                if (this.syncIntervalId) {
                    clearInterval(this.syncIntervalId);
                }
            }, { once: true });
        }

        trackAudioElements() {
            // Monitor all <audio> elements
            document.addEventListener('play', (e) => {
                if (e.target.tagName === 'AUDIO') {
                    this.startTracking(e.target.id || 'audio_' + Date.now(), e.target);
                }
            }, true);

            document.addEventListener('pause', (e) => {
                if (e.target.tagName === 'AUDIO') {
                    this.stopTracking(e.target.id || 'audio_' + Date.now());
                }
            }, true);

            document.addEventListener('ended', (e) => {
                if (e.target.tagName === 'AUDIO') {
                    this.stopTracking(e.target.id || 'audio_' + Date.now());
                }
            }, true);
        }

        trackCustomPlayers() {
            // Listen for custom player events
            window.addEventListener('audioPlayerPlay', (e) => {
                this.startTracking(e.detail?.id || 'player_' + Date.now());
            });

            window.addEventListener('audioPlayerPause', (e) => {
                this.stopTracking(e.detail?.id || 'player_' + Date.now());
            });

            window.addEventListener('audioPlayerStop', (e) => {
                this.stopTracking(e.detail?.id || 'player_' + Date.now());
            });
        }

        startTracking(id, audioElement = null) {
            if (this.activeTrackers.has(id)) return;

            const tracker = {
                id,
                startTime: Date.now(),
                audioElement,
                lastSync: Date.now()
            };

            this.activeTrackers.set(id, tracker);
            console.log('[AudioTracker] Started tracking:', id);
        }

        stopTracking(id) {
            const tracker = this.activeTrackers.get(id);
            if (!tracker) return;

            const duration = Math.floor((Date.now() - tracker.startTime) / 1000);
            const minutes = Math.floor(duration / 60);

            if (minutes > 0 && window.AnhadStats) {
                window.AnhadStats.addListeningTime(minutes);
                console.log('[AudioTracker] Recorded', minutes, 'minutes for', id);
            }

            this.activeTrackers.delete(id);
        }

        syncAll() {
            const now = Date.now();
            
            for (const [id, tracker] of this.activeTrackers) {
                const elapsed = Math.floor((now - tracker.lastSync) / 1000);
                const minutes = Math.floor(elapsed / 60);

                if (minutes > 0 && window.AnhadStats) {
                    window.AnhadStats.addListeningTime(minutes);
                    tracker.lastSync = now;
                    console.log('[AudioTracker] Synced', minutes, 'minutes for', id);
                }
            }
        }

        stopAll() {
            for (const id of this.activeTrackers.keys()) {
                this.stopTracking(id);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEHAJ PAATH INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════════

    class SehajPaathIntegration {
        constructor() {
            this.init();
        }

        init() {
            // Listen for Ang read events
            window.addEventListener('sehajPaathAngRead', (e) => {
                this.recordAngRead(e.detail);
            });

            // Intercept SehajPaath stats updates
            this.interceptStatsUpdates();
        }

        recordAngRead(detail) {
            if (!window.AnhadStats) return;

            // 1 Ang = 1 page for stats purposes
            window.AnhadStats.addPagesRead(1);
            console.log('[SehajPaath] Recorded Ang read:', detail?.ang);
        }

        interceptStatsUpdates() {
            // Hook into StatisticsDashboard if it exists
            const originalRecordAngRead = window.StatisticsDashboard?.prototype?.recordAngRead;
            
            if (originalRecordAngRead) {
                window.StatisticsDashboard.prototype.recordAngRead = function(ang) {
                    // Call original
                    originalRecordAngRead.call(this, ang);
                    
                    // Sync to main stats
                    if (window.AnhadStats) {
                        window.AnhadStats.addPagesRead(1);
                    }
                };
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NITNEM TRACKER INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════════

    class NitnemIntegration {
        constructor() {
            this.init();
        }

        init() {
            // Listen for Nitnem completion events
            window.addEventListener('nitnemBaniCompleted', (e) => {
                this.recordBaniCompleted(e.detail);
            });

            window.addEventListener('nitnemDayCompleted', (e) => {
                this.recordDayCompleted(e.detail);
            });

            // Monitor localStorage changes for Nitnem
            this.monitorNitnemLog();
        }

        recordBaniCompleted(detail) {
            console.log('[Nitnem] Bani completed:', detail?.bani);
            // Individual bani completion tracked but not added to total yet
        }

        recordDayCompleted(detail) {
            if (!window.AnhadStats) return;

            // Full Nitnem day completed
            window.AnhadStats.addNitnemCompleted(1);
            console.log('[Nitnem] Full day completed');
        }

        monitorNitnemLog() {
            // Check for Nitnem completion daily
            const checkInterval = 60000; // Check every minute
            
            this.nitnemIntervalId = setInterval(() => {
                this.checkTodayCompletion();
            }, checkInterval);
            
            // Cleanup on pagehide
            window.addEventListener('pagehide', () => {
                if (this.nitnemIntervalId) {
                    clearInterval(this.nitnemIntervalId);
                }
            }, { once: true });
        }

        checkTodayCompletion() {
            try {
                const nitnemLog = JSON.parse(localStorage.getItem('nitnemTracker_nitnemLog') || '{}');
                const today = new Date().toLocaleDateString('en-CA');
                const todayData = nitnemLog[today];

                if (!todayData) return;

                // Check if all banis completed
                const selectedBanis = JSON.parse(localStorage.getItem('nitnemTracker_selectedBanis') || '{}');
                const totalRequired = (selectedBanis.amritvela?.length || 0) +
                                     (selectedBanis.rehras?.length || 0) +
                                     (selectedBanis.sohila?.length || 0);

                let completed = 0;
                if (Array.isArray(todayData)) {
                    completed = todayData.length;
                } else if (typeof todayData === 'object') {
                    completed = (todayData.amritvela?.length || 0) +
                               (todayData.rehras?.length || 0) +
                               (todayData.sohila?.length || 0);
                }

                // If completed today and not yet recorded
                if (completed >= totalRequired && totalRequired > 0) {
                    const lastRecorded = localStorage.getItem('nitnem_last_recorded_date');
                    if (lastRecorded !== today) {
                        if (window.AnhadStats) {
                            window.AnhadStats.addNitnemCompleted(1);
                            localStorage.setItem('nitnem_last_recorded_date', today);
                            console.log('[Nitnem] Day completion synced to stats');
                        }
                    }
                }
            } catch (e) {
                console.error('[Nitnem] Error checking completion:', e);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NAAM ABHYAS INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════════

    class NaamAbhyasIntegration {
        constructor() {
            this.init();
        }

        init() {
            // Listen for session completion
            window.addEventListener('naamAbhyasSessionComplete', (e) => {
                this.recordSession(e.detail);
            });

            // Intercept NaamAbhyas history updates
            this.interceptHistoryUpdates();
        }

        recordSession(detail) {
            if (!window.AnhadStats) return;

            const duration = detail?.duration || 0;
            const minutes = Math.floor(duration / 60);

            if (minutes > 0) {
                window.AnhadStats.addListeningTime(minutes);
                console.log('[NaamAbhyas] Recorded session:', minutes, 'minutes');
            }
        }

        interceptHistoryUpdates() {
            // Monitor localStorage for naam_abhyas_history changes
            const originalSetItem = localStorage.setItem;
            
            localStorage.setItem = function(key, value) {
                originalSetItem.apply(this, arguments);
                
                if (key === 'naam_abhyas_history') {
                    try {
                        const history = JSON.parse(value);
                        const lastSession = history.sessions?.[history.sessions.length - 1];
                        
                        if (lastSession?.status === 'completed' && lastSession.duration) {
                            const minutes = Math.floor(lastSession.duration / 60);
                            if (minutes > 0 && window.AnhadStats) {
                                window.AnhadStats.addListeningTime(minutes);
                            }
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UNIFIED STREAK SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    class UnifiedStreakSystem {
        constructor() {
            this.init();
        }

        init() {
            // Daily check for streak updates
            this.checkDailyActivity();
            
            // Check every hour
            this.streakIntervalId = setInterval(() => this.checkDailyActivity(), 3600000);
            
            // Cleanup on pagehide
            window.addEventListener('pagehide', () => {
                if (this.streakIntervalId) {
                    clearInterval(this.streakIntervalId);
                }
            }, { once: true });
        }

        checkDailyActivity() {
            if (!window.AnhadStats) return;

            const stats = window.AnhadStats.getSummary();
            const today = new Date().toLocaleDateString('en-CA');
            const lastCheck = localStorage.getItem('streak_last_check');

            if (lastCheck === today) return;

            // Check if user was active today
            const hasActivity = stats.todayListeningMinutes > 0 ||
                               stats.todayPagesRead > 0 ||
                               stats.todayNitnemCount > 0;

            if (hasActivity) {
                window.AnhadStats.updateStreak();
                localStorage.setItem('streak_last_check', today);
                console.log('[Streak] Updated for today');
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DASHBOARD REAL-TIME UPDATES
    // ═══════════════════════════════════════════════════════════════════════════

    class DashboardUpdater {
        constructor() {
            this.init();
        }

        init() {
            // Listen for all stats events
            window.addEventListener('statsUpdated', () => this.updateDashboard());
            window.addEventListener('streakUpdated', () => this.updateDashboard());
            window.addEventListener('goalsUpdated', () => this.updateDashboard());
            
            // Update on page visibility
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    this.updateDashboard();
                }
            });
        }

        updateDashboard() {
            // Dispatch custom event for dashboard to refresh
            window.dispatchEvent(new CustomEvent('dashboardRefresh'));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    function initStatsIntegration() {
        // Wait for AnhadStats to be available
        if (!window.AnhadStats) {
            console.warn('[StatsIntegration] AnhadStats not found, retrying...');
            setTimeout(initStatsIntegration, 1000);
            return;
        }

        console.log('[StatsIntegration] Initializing...');

        // Initialize all integrations
        window.AudioTracker = new AudioTracker();
        window.SehajPaathIntegration = new SehajPaathIntegration();
        window.NitnemIntegration = new NitnemIntegration();
        window.NaamAbhyasIntegration = new NaamAbhyasIntegration();
        window.UnifiedStreakSystem = new UnifiedStreakSystem();
        window.DashboardUpdater = new DashboardUpdater();

        console.log('[StatsIntegration] ✓ All integrations active');

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (window.AudioTracker) {
                window.AudioTracker.stopAll();
            }
        });
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStatsIntegration);
    } else {
        initStatsIntegration();
    }

})();
