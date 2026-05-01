/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UNIFIED STATS SYSTEM - Single Source of Truth
 * Tracks: Sehaj Path (Ang), Nitnem, Kirtan Listening
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'anhad_unified_stats';
    const VERSION = '1.0';

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    function getTodayString() {
        return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    }

    function getDefaultStats() {
        return {
            version: VERSION,
            daily: {},
            streaks: {
                sehajPath: 0,
                nitnem: 0,
                kirtan: 0
            },
            lastActive: null
        };
    }

    function getStats() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return getDefaultStats();
            
            const data = JSON.parse(stored);
            // Migration: ensure version and structure
            if (!data.version) data.version = VERSION;
            if (!data.daily) data.daily = {};
            if (!data.streaks) data.streaks = { sehajPath: 0, nitnem: 0, kirtan: 0 };
            
            return data;
        } catch (e) {
            console.error('[UnifiedStats] Error reading stats:', e);
            return getDefaultStats();
        }
    }

    function saveStats(data) {
        try {
            data.lastActive = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            // Dispatch event for real-time updates
            window.dispatchEvent(new CustomEvent('statsChanged', { 
                detail: { today: data.daily[getTodayString()] }
            }));
        } catch (e) {
            console.error('[UnifiedStats] Error saving stats:', e);
        }
    }

    function getTodayData(stats) {
        const today = getTodayString();
        if (!stats.daily[today]) {
            stats.daily[today] = {
                angRead: 0,
                nitnemBanis: [],
                nitnemComplete: false,
                kirtanMinutes: 0,
                lastUpdated: new Date().toISOString()
            };
        }
        return stats.daily[today];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CORE STATS API
    // ═══════════════════════════════════════════════════════════════════════════

    const UnifiedStats = {
        // Sehaj Path - Ang Reading
        recordAngRead: function(count = 1) {
            const stats = getStats();
            const today = getTodayData(stats);
            
            today.angRead += count;
            today.lastUpdated = new Date().toISOString();
            
            // Update streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toLocaleDateString('en-CA');
            
            if (stats.daily[yesterdayStr] && stats.daily[yesterdayStr].angRead > 0) {
                stats.streaks.sehajPath = (stats.streaks.sehajPath || 0) + 1;
            } else if (today.angRead === count) {
                // First read today, check if streak continues
                const dayBefore = new Date();
                dayBefore.setDate(dayBefore.getDate() - 2);
                const dayBeforeStr = dayBefore.toLocaleDateString('en-CA');
                if (!stats.daily[dayBeforeStr] || stats.daily[dayBeforeStr].angRead === 0) {
                    stats.streaks.sehajPath = 1; // Reset streak
                }
            }
            
            saveStats(stats);
            
            // Dispatch specific event
            window.dispatchEvent(new CustomEvent('angRead', {
                detail: { count: today.angRead, added: count }
            }));
            
            console.log(`[UnifiedStats] Ang read: +${count} (total: ${today.angRead})`);
            return today.angRead;
        },

        // Nitnem - Bani completion
        recordNitnemBani: function(baniName) {
            const stats = getStats();
            const today = getTodayData(stats);
            
            if (!today.nitnemBanis.includes(baniName)) {
                today.nitnemBanis.push(baniName);
            }
            today.lastUpdated = new Date().toISOString();
            
            saveStats(stats);
            
            window.dispatchEvent(new CustomEvent('nitnemBaniCompleted', {
                detail: { bani: baniName, completed: today.nitnemBanis }
            }));
            
            console.log(`[UnifiedStats] Nitnem bani completed: ${baniName}`);
            return today.nitnemBanis.length;
        },

        // Nitnem - Full day complete
        recordNitnemComplete: function() {
            const stats = getStats();
            const today = getTodayData(stats);
            
            const wasComplete = today.nitnemComplete;
            today.nitnemComplete = true;
            today.lastUpdated = new Date().toISOString();
            
            // Update streak only if not already complete today
            if (!wasComplete) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toLocaleDateString('en-CA');
                
                if (stats.daily[yesterdayStr]?.nitnemComplete) {
                    stats.streaks.nitnem = (stats.streaks.nitnem || 0) + 1;
                } else {
                    stats.streaks.nitnem = 1;
                }
            }
            
            saveStats(stats);
            
            window.dispatchEvent(new CustomEvent('nitnemDayCompleted', {
                detail: { date: getTodayString() }
            }));
            
            console.log('[UnifiedStats] Nitnem day completed!');
            return today.nitnemComplete;
        },

        // Kirtan - Listening minutes
        recordKirtanListening: function(minutes = 1) {
            const stats = getStats();
            const today = getTodayData(stats);
            
            today.kirtanMinutes += minutes;
            today.lastUpdated = new Date().toISOString();
            
            saveStats(stats);
            
            window.dispatchEvent(new CustomEvent('kirtanListeningUpdated', {
                detail: { minutes: today.kirtanMinutes, added: minutes }
            }));
            
            console.log(`[UnifiedStats] Kirtan listening: +${minutes} min (total: ${today.kirtanMinutes})`);
            return today.kirtanMinutes;
        },

        // Getters
        getTodayStats: function() {
            const stats = getStats();
            return getTodayData(stats);
        },

        getLast7Days: function() {
            const stats = getStats();
            const result = [];
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toLocaleDateString('en-CA');
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
                
                const dayData = stats.daily[dateStr] || {
                    angRead: 0,
                    nitnemBanis: [],
                    nitnemComplete: false,
                    kirtanMinutes: 0
                };
                
                result.push({
                    date: dateStr,
                    label: i === 0 ? 'Today' : dayName,
                    ...dayData
                });
            }
            
            return result;
        },

        getStreaks: function() {
            const stats = getStats();
            return stats.streaks;
        },

        // For dashboard compatibility
        getAllStats: function() {
            const stats = getStats();
            const today = getTodayData(stats);
            
            return {
                today: today,
                last7Days: this.getLast7Days(),
                streaks: stats.streaks
            };
        },

        // Reset (for testing)
        reset: function() {
            localStorage.removeItem(STORAGE_KEY);
            console.log('[UnifiedStats] All stats reset');
        }
    };

    // Expose globally
    window.UnifiedStats = UnifiedStats;

    // Auto-init: Fire event on load to sync any existing data
    window.addEventListener('load', () => {
        const stats = getStats();
        const today = getTodayData(stats);
        
        window.dispatchEvent(new CustomEvent('statsInitialized', {
            detail: { today: today, streaks: stats.streaks }
        }));
        
        console.log('[UnifiedStats] Initialized', today);
    });

    console.log('📊 Unified Stats System loaded');
})();
