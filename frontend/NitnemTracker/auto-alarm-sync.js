/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUTOMATIC ALARM SYNC SYSTEM
 * Syncs reminders from Smart Reminders automatically
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Automatic background sync (no page open required)
 * - Syncs on app startup
 * - Syncs on visibility change
 * - Syncs periodically (every 5 minutes)
 * - Stores alarm data persistently
 */

(function() {
    'use strict';

    const ALARM_LOG_KEY = 'nitnemTracker_alarmLog';
    const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
    let syncInterval = null;

    // ═══════════════════════════════════════════════════════════════════════════
    // STORAGE HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    function getAlarmLog() {
        try {
            const stored = localStorage.getItem(ALARM_LOG_KEY);
            return stored ? JSON.parse(stored) : {
                syncedAlarms: [],
                lastSync: null,
                obedienceLog: {}
            };
        } catch (e) {
            console.error('[AlarmSync] Error reading alarm log:', e);
            return {
                syncedAlarms: [],
                lastSync: null,
                obedienceLog: {}
            };
        }
    }

    function saveAlarmLog(log) {
        try {
            localStorage.setItem(ALARM_LOG_KEY, JSON.stringify(log));
            
            // Dispatch event for UI updates
            window.dispatchEvent(new CustomEvent('alarmSynced', { 
                detail: { 
                    alarms: log.syncedAlarms,
                    lastSync: log.lastSync 
                } 
            }));
            
            console.log('[AlarmSync] ✅ Synced', log.syncedAlarms.length, 'alarms');
        } catch (e) {
            console.error('[AlarmSync] Error saving alarm log:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SYNC FROM SMART REMINDERS
    // ═══════════════════════════════════════════════════════════════════════════

    async function syncFromSmartReminders() {
        try {
            // Check if GurbaniStorage is available
            if (!window.GurbaniStorage) {
                console.log('[AlarmSync] GurbaniStorage not available, using localStorage fallback');
                syncFromLocalStorage();
                return;
            }

            // Ensure database is initialized
            if (!window.GurbaniStorage.isReady) {
                await window.GurbaniStorage.init();
            }

            // Get reminder data from IndexedDB
            const reminderData = await window.GurbaniStorage.get('sync', 'reminder_to_nitnem');
            
            if (reminderData && reminderData.alarms) {
                const alarmLog = getAlarmLog();
                
                // Update synced alarms
                alarmLog.syncedAlarms = reminderData.alarms;
                alarmLog.lastSync = Date.now();
                
                // Merge with existing obedience log
                if (reminderData.obedienceLog) {
                    alarmLog.obedienceLog = {
                        ...alarmLog.obedienceLog,
                        ...reminderData.obedienceLog
                    };
                }
                
                saveAlarmLog(alarmLog);
                
                console.log('[AlarmSync] ✅ Synced from Smart Reminders:', reminderData.alarms.length, 'alarms');
            } else {
                console.log('[AlarmSync] No reminder data found in IndexedDB');
            }
        } catch (error) {
            console.warn('[AlarmSync] IndexedDB sync error (non-fatal):', error);
            // Fallback to localStorage
            syncFromLocalStorage();
        }
    }

    function syncFromLocalStorage() {
        try {
            // Try to get reminder data from localStorage as fallback
            const reminderKey = 'smartReminders_alarms';
            const stored = localStorage.getItem(reminderKey);
            
            if (stored) {
                const reminders = JSON.parse(stored);
                const alarmLog = getAlarmLog();
                
                // Convert reminders to alarm format
                alarmLog.syncedAlarms = reminders.map(r => ({
                    id: r.id,
                    title: r.title,
                    time: r.time,
                    enabled: r.enabled,
                    days: r.days || []
                }));
                
                alarmLog.lastSync = Date.now();
                saveAlarmLog(alarmLog);
                
                console.log('[AlarmSync] ✅ Synced from localStorage:', alarmLog.syncedAlarms.length, 'alarms');
            }
        } catch (e) {
            console.warn('[AlarmSync] localStorage fallback error:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SYNC TO SMART REMINDERS (Bidirectional)
    // ═══════════════════════════════════════════════════════════════════════════

    async function syncToSmartReminders() {
        try {
            if (!window.GurbaniStorage || !window.GurbaniStorage.isReady) return;

            const alarmLog = getAlarmLog();
            
            // Send obedience data back to Smart Reminders
            await window.GurbaniStorage.set('sync', 'nitnem_to_reminder', {
                obedienceLog: alarmLog.obedienceLog,
                lastSync: Date.now()
            });
            
            console.log('[AlarmSync] ✅ Sent obedience data to Smart Reminders');
        } catch (error) {
            console.warn('[AlarmSync] Error syncing to Smart Reminders:', error);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ALARM OBEDIENCE TRACKING
    // ═══════════════════════════════════════════════════════════════════════════

    function recordAlarmResponse(alarmId, responded, responseTime) {
        const alarmLog = getAlarmLog();
        const today = new Date().toLocaleDateString('en-CA');
        
        if (!alarmLog.obedienceLog[today]) {
            alarmLog.obedienceLog[today] = [];
        }
        
        alarmLog.obedienceLog[today].push({
            alarmId,
            responded,
            responseTime,
            timestamp: Date.now()
        });
        
        saveAlarmLog(alarmLog);
        
        // Sync back to Smart Reminders
        syncToSmartReminders();
    }

    function getObedienceRate(days = 7) {
        const alarmLog = getAlarmLog();
        const obedienceLog = alarmLog.obedienceLog;
        
        let totalAlarms = 0;
        let respondedAlarms = 0;
        
        // Get last N days
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toLocaleDateString('en-CA');
            
            if (obedienceLog[dateString]) {
                const dayLog = obedienceLog[dateString];
                totalAlarms += dayLog.length;
                respondedAlarms += dayLog.filter(log => log.responded).length;
            }
        }
        
        return totalAlarms > 0 ? Math.round((respondedAlarms / totalAlarms) * 100) : 0;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTOMATIC SYNC SCHEDULER
    // ═══════════════════════════════════════════════════════════════════════════

    function startAutoSync() {
        // Initial sync
        syncFromSmartReminders();
        
        // Periodic sync every 5 minutes
        if (syncInterval) {
            clearInterval(syncInterval);
        }
        
        syncInterval = setInterval(() => {
            syncFromSmartReminders();
        }, SYNC_INTERVAL);
        
        console.log('[AlarmSync] 🔄 Auto-sync started (every 5 minutes)');
    }

    function stopAutoSync() {
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
            console.log('[AlarmSync] ⏸️ Auto-sync stopped');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VISIBILITY CHANGE HANDLER
    // ═══════════════════════════════════════════════════════════════════════════

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Page became visible - sync immediately
            console.log('[AlarmSync] 👁️ Page visible - syncing...');
            syncFromSmartReminders();
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STORAGE EVENT LISTENER (Cross-tab sync)
    // ═══════════════════════════════════════════════════════════════════════════

    window.addEventListener('storage', (e) => {
        if (e.key === 'smartReminders_alarms' || e.key === 'reminder_to_nitnem') {
            console.log('[AlarmSync] 🔄 Storage change detected - syncing...');
            syncFromSmartReminders();
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        console.log('[AlarmSync] 🚀 Initializing automatic alarm sync...');
        
        // Start auto-sync
        startAutoSync();
        
        // Sync on page load
        syncFromSmartReminders();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        stopAutoSync();
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // EXPOSE API
    // ═══════════════════════════════════════════════════════════════════════════

    window.AutoAlarmSync = {
        // Sync functions
        syncFromSmartReminders,
        syncToSmartReminders,
        startAutoSync,
        stopAutoSync,
        
        // Data access
        getAlarmLog,
        getObedienceRate,
        
        // Tracking
        recordAlarmResponse,
        
        // Manual trigger
        syncNow: syncFromSmartReminders
    };

    console.log('[AlarmSync] ✅ Automatic Alarm Sync System loaded');
})();
