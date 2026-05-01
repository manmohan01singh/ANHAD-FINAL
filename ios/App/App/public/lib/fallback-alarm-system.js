/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FALLBACK ALARM SYSTEM v1.0
 * Works without Service Worker - Uses setTimeout + localStorage
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ No Service Worker required
 * ✅ Persistent alarms across page reloads
 * ✅ Automatic missed alarm detection
 * ✅ Cross-tab synchronization
 * ✅ Works on iOS Safari
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

class FallbackAlarmSystem {
    constructor() {
        this.alarms = [];
        this.timers = new Map();
        this.storageKey = 'fallback_alarms';
        this.checkInterval = null;
        this.isInitialized = false;
        
        console.log('[FallbackAlarm] 🔔 Initializing fallback alarm system...');
        this.init();
    }

    init() {
        try {
            // Load persisted alarms
            this.loadAlarms();
            
            // Schedule all pending alarms
            this.scheduleAll();
            
            // Check for missed alarms on page load
            this.checkMissedAlarms();
            
            // Re-check every minute for reliability
            this.checkInterval = setInterval(() => {
                this.checkMissedAlarms();
            }, 60000);
            
            // Save alarms before page unload
            window.addEventListener('beforeunload', () => {
                this.saveAlarms();
            });

            // Listen for storage changes (cross-tab sync)
            window.addEventListener('storage', (e) => {
                if (e.key === this.storageKey) {
                    this.loadAlarms();
                    this.scheduleAll();
                }
            });

            this.isInitialized = true;
            console.log('[FallbackAlarm] ✅ Initialized with', this.alarms.length, 'alarms');
        } catch (e) {
            console.error('[FallbackAlarm] ❌ Initialization failed:', e);
        }
    }

    loadAlarms() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.alarms = JSON.parse(stored);
                console.log(`[FallbackAlarm] 📥 Loaded ${this.alarms.length} alarms from storage`);
            }
        } catch (e) {
            console.error('[FallbackAlarm] ❌ Failed to load alarms:', e);
            this.alarms = [];
        }
    }

    saveAlarms() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.alarms));
            console.log(`[FallbackAlarm] 💾 Saved ${this.alarms.length} alarms to storage`);
        } catch (e) {
            console.error('[FallbackAlarm] ❌ Failed to save alarms:', e);
        }
    }

    /**
     * Schedule a new alarm
     * @param {Object} alarm - Alarm configuration
     * @param {string} alarm.id - Unique alarm ID
     * @param {string} alarm.title - Notification title
     * @param {string} alarm.body - Notification body
     * @param {number} alarm.scheduledTime - Timestamp when alarm should fire
     * @param {string} alarm.tag - Notification tag
     * @param {Object} alarm.data - Additional data
     */
    scheduleAlarm(alarm) {
        try {
            // Check if alarm already exists
            const existingIndex = this.alarms.findIndex(a => a.id === alarm.id);
            if (existingIndex !== -1) {
                // Update existing alarm
                this.alarms[existingIndex] = { ...alarm, fired: false };
                console.log(`[FallbackAlarm] 🔄 Updated alarm: ${alarm.id}`);
            } else {
                // Add new alarm
                this.alarms.push({ ...alarm, fired: false });
                console.log(`[FallbackAlarm] ➕ Added alarm: ${alarm.id}`);
            }
            
            this.saveAlarms();
            
            // Schedule timer
            const delay = alarm.scheduledTime - Date.now();
            
            if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
                // Clear existing timer if any
                if (this.timers.has(alarm.id)) {
                    clearTimeout(this.timers.get(alarm.id));
                }
                
                const timerId = setTimeout(() => {
                    this.fireAlarm(alarm);
                }, delay);
                
                this.timers.set(alarm.id, timerId);
                
                const delayMinutes = Math.round(delay / 60000);
                console.log(`[FallbackAlarm] ⏰ Scheduled ${alarm.id} in ${delayMinutes} minutes`);
            } else if (delay <= 0) {
                console.log(`[FallbackAlarm] ⚠️ Alarm ${alarm.id} is in the past, firing immediately`);
                this.fireAlarm(alarm);
            } else {
                console.log(`[FallbackAlarm] ⚠️ Alarm ${alarm.id} is too far in the future (${Math.round(delay/3600000)} hours)`);
            }
        } catch (e) {
            console.error('[FallbackAlarm] ❌ Failed to schedule alarm:', e);
        }
    }

    scheduleAll() {
        console.log('[FallbackAlarm] 📅 Scheduling all pending alarms...');
        
        // Clear all existing timers
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
        
        // Schedule each unfired alarm
        this.alarms.forEach(alarm => {
            if (!alarm.fired) {
                const delay = alarm.scheduledTime - Date.now();
                if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
                    const timerId = setTimeout(() => {
                        this.fireAlarm(alarm);
                    }, delay);
                    this.timers.set(alarm.id, timerId);
                }
            }
        });
        
        console.log(`[FallbackAlarm] ✅ Scheduled ${this.timers.size} timers`);
    }

    checkMissedAlarms() {
        const now = Date.now();
        let missedCount = 0;
        
        this.alarms.forEach(alarm => {
            if (!alarm.fired && alarm.scheduledTime <= now) {
                // Missed alarm - fire it now if within 15 minute grace period
                const missedBy = now - alarm.scheduledTime;
                const missedMinutes = Math.round(missedBy / 60000);
                
                if (missedMinutes <= 15) {
                    console.log(`[FallbackAlarm] 🔔 Firing missed alarm: ${alarm.id} (missed by ${missedMinutes} min)`);
                    this.fireAlarm(alarm);
                    missedCount++;
                } else {
                    console.log(`[FallbackAlarm] ⏭️ Skipping old alarm: ${alarm.id} (missed by ${missedMinutes} min)`);
                    alarm.fired = true; // Mark as fired to prevent future checks
                }
            }
        });
        
        if (missedCount > 0) {
            this.saveAlarms();
        }
    }

    async fireAlarm(alarm) {
        try {
            console.log(`[FallbackAlarm] 🔔 FIRING ALARM: ${alarm.title}`);
            
            // Show notification
            if ('Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(alarm.title, {
                    body: alarm.body,
                    icon: alarm.icon || '/assets/icons/icon-192x192.png',
                    badge: alarm.badge || '/assets/icons/icon-72x72.png',
                    tag: alarm.tag || `fallback-${alarm.id}`,
                    requireInteraction: true,
                    vibrate: [500, 200, 500, 200, 500],
                    data: alarm.data || {}
                });

                // Handle notification click
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                    
                    // Navigate to the URL if provided
                    if (alarm.data && alarm.data.url) {
                        window.location.href = alarm.data.url;
                    }
                };
            } else {
                console.warn('[FallbackAlarm] ⚠️ Cannot show notification - permission not granted');
                
                // Fallback: Show in-page alert
                if (typeof window.naamAbhyas !== 'undefined' && window.naamAbhyas.showToast) {
                    window.naamAbhyas.showToast(alarm.title, 'info');
                }
            }
            
            // Mark as fired
            const alarmIndex = this.alarms.findIndex(a => a.id === alarm.id);
            if (alarmIndex !== -1) {
                this.alarms[alarmIndex].fired = true;
                this.alarms[alarmIndex].firedAt = Date.now();
            }
            this.saveAlarms();
            
            // Clear timer
            if (this.timers.has(alarm.id)) {
                clearTimeout(this.timers.get(alarm.id));
                this.timers.delete(alarm.id);
            }
            
            // Dispatch event for app to handle
            window.dispatchEvent(new CustomEvent('fallbackAlarmFired', {
                detail: alarm
            }));
            
            console.log(`[FallbackAlarm] ✅ Alarm fired successfully: ${alarm.id}`);
        } catch (e) {
            console.error('[FallbackAlarm] ❌ Failed to fire alarm:', e);
        }
    }

    cancelAlarm(alarmId) {
        try {
            // Remove from list
            const initialLength = this.alarms.length;
            this.alarms = this.alarms.filter(a => a.id !== alarmId);
            
            if (this.alarms.length < initialLength) {
                this.saveAlarms();
                console.log(`[FallbackAlarm] 🗑️ Cancelled alarm: ${alarmId}`);
            }
            
            // Clear timer
            if (this.timers.has(alarmId)) {
                clearTimeout(this.timers.get(alarmId));
                this.timers.delete(alarmId);
            }
        } catch (e) {
            console.error('[FallbackAlarm] ❌ Failed to cancel alarm:', e);
        }
    }

    clearAll() {
        try {
            console.log('[FallbackAlarm] 🗑️ Clearing all alarms...');
            
            this.alarms = [];
            this.timers.forEach(timer => clearTimeout(timer));
            this.timers.clear();
            this.saveAlarms();
            
            console.log('[FallbackAlarm] ✅ All alarms cleared');
        } catch (e) {
            console.error('[FallbackAlarm] ❌ Failed to clear alarms:', e);
        }
    }

    /**
     * Clean up old fired alarms (older than 24 hours)
     */
    cleanup() {
        try {
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            const initialLength = this.alarms.length;
            
            this.alarms = this.alarms.filter(alarm => {
                // Keep unfired alarms
                if (!alarm.fired) return true;
                
                // Keep recently fired alarms
                if (alarm.firedAt && alarm.firedAt > oneDayAgo) return true;
                
                // Remove old fired alarms
                return false;
            });
            
            if (this.alarms.length < initialLength) {
                this.saveAlarms();
                console.log(`[FallbackAlarm] 🧹 Cleaned up ${initialLength - this.alarms.length} old alarms`);
            }
        } catch (e) {
            console.error('[FallbackAlarm] ❌ Cleanup failed:', e);
        }
    }

    /**
     * Get status information
     */
    getStatus() {
        const pending = this.alarms.filter(a => !a.fired).length;
        const fired = this.alarms.filter(a => a.fired).length;
        const scheduled = this.timers.size;
        
        return {
            total: this.alarms.length,
            pending,
            fired,
            scheduled,
            isInitialized: this.isInitialized
        };
    }

    /**
     * Destroy the alarm system
     */
    destroy() {
        console.log('[FallbackAlarm] 🛑 Destroying fallback alarm system...');
        
        // Clear all timers
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
        
        // Clear check interval
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        
        // Save final state
        this.saveAlarms();
        
        this.isInitialized = false;
        console.log('[FallbackAlarm] ✅ Destroyed');
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.fallbackAlarmSystem = new FallbackAlarmSystem();
    
    // Cleanup old alarms every hour
    setInterval(() => {
        if (window.fallbackAlarmSystem) {
            window.fallbackAlarmSystem.cleanup();
        }
    }, 60 * 60 * 1000);
    
    console.log('[FallbackAlarm] 🌐 Global instance created: window.fallbackAlarmSystem');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FallbackAlarmSystem;
}
