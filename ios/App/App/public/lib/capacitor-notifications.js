/**
 * Capacitor Notification Wrapper
 * 
 * Provides a unified notification API that:
 * 1. Uses Capacitor LocalNotifications plugin when available (mobile)
 * 2. Falls back to Web Notification API for browser testing
 * 
 * Bug Fix: Addresses Requirement 1.21 - Use Capacitor plugin instead of web API
 * Preservation: Maintains web fallbacks for browser testing (Requirement 3.7)
 */

/**
 * Check if Capacitor LocalNotifications plugin is available
 * @returns {boolean} True if Capacitor plugin is available
 */
function isCapacitorAvailable() {
    return !!(window.Capacitor?.Plugins?.LocalNotifications);
}

/**
 * Request notification permissions
 * Uses Capacitor plugin when available, falls back to Web API
 * 
 * @returns {Promise<string>} Permission status: 'granted', 'denied', or 'default'
 */
async function requestPermission() {
    if (isCapacitorAvailable()) {
        try {
            const result = await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
            // Capacitor returns { display: 'granted' | 'denied' | 'prompt' }
            return result.display === 'granted' ? 'granted' : 'denied';
        } catch (error) {
            console.error('[CapacitorNotifications] Permission request failed:', error);
            return 'denied';
        }
    }
    
    // Web fallback for browser testing
    if ('Notification' in window) {
        try {
            return await Notification.requestPermission();
        } catch (error) {
            console.error('[CapacitorNotifications] Web notification permission failed:', error);
            return 'denied';
        }
    }
    
    console.warn('[CapacitorNotifications] Notifications not available');
    return 'denied';
}

/**
 * Check current notification permission status
 * 
 * @returns {Promise<string>} Permission status: 'granted', 'denied', or 'default'
 */
async function checkPermission() {
    if (isCapacitorAvailable()) {
        try {
            const result = await window.Capacitor.Plugins.LocalNotifications.checkPermissions();
            return result.display === 'granted' ? 'granted' : 'denied';
        } catch (error) {
            console.error('[CapacitorNotifications] Permission check failed:', error);
            return 'denied';
        }
    }
    
    // Web fallback
    if ('Notification' in window) {
        return Notification.permission;
    }
    
    return 'denied';
}

/**
 * Schedule a notification
 * Uses Capacitor plugin when available, falls back to Web API
 * 
 * @param {Object} options - Notification options
 * @param {number} options.id - Unique notification ID (required for Capacitor)
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body text
 * @param {Date|number} [options.scheduledTime] - When to show notification (Date or timestamp)
 * @param {Object} [options.data] - Additional data to attach
 * @param {string} [options.icon] - Icon URL (web only)
 * @param {string} [options.badge] - Badge URL (web only)
 * @param {string} [options.tag] - Notification tag for grouping
 * @param {boolean} [options.requireInteraction] - Keep notification visible until user interacts
 * @param {Array} [options.actions] - Notification actions (buttons)
 * 
 * @returns {Promise<void>}
 */
async function scheduleNotification(options) {
    if (!options.title) {
        throw new Error('[CapacitorNotifications] Notification title is required');
    }
    
    if (isCapacitorAvailable()) {
        try {
            // Convert options to Capacitor format
            const capacitorNotification = {
                id: options.id || Date.now(),
                title: options.title,
                body: options.body || '',
                schedule: options.scheduledTime ? {
                    at: new Date(options.scheduledTime)
                } : undefined,
                extra: options.data || {},
                smallIcon: 'ic_stat_icon_config_sample',
                iconColor: '#FF6B35',
                sound: options.sound || undefined,
                actionTypeId: options.actions ? 'default' : undefined,
                group: options.tag || undefined
            };
            
            // Schedule the notification
            await window.Capacitor.Plugins.LocalNotifications.schedule({
                notifications: [capacitorNotification]
            });
            
            console.log('[CapacitorNotifications] Scheduled via Capacitor:', capacitorNotification.id);
            return;
        } catch (error) {
            console.error('[CapacitorNotifications] Capacitor scheduling failed:', error);
            // Fall through to web fallback
        }
    }
    
    // Web fallback for browser testing
    if ('Notification' in window) {
        const permission = await checkPermission();
        
        if (permission !== 'granted') {
            console.warn('[CapacitorNotifications] Notification permission not granted');
            return;
        }
        
        try {
            // For scheduled notifications, use setTimeout
            if (options.scheduledTime) {
                const delay = new Date(options.scheduledTime).getTime() - Date.now();
                
                if (delay > 0) {
                    setTimeout(() => {
                        new Notification(options.title, {
                            body: options.body,
                            icon: options.icon,
                            badge: options.badge,
                            tag: options.tag,
                            requireInteraction: options.requireInteraction,
                            data: options.data,
                            actions: options.actions
                        });
                    }, delay);
                    
                    console.log('[CapacitorNotifications] Scheduled via Web API (delayed)');
                    return;
                }
            }
            
            // Show immediately
            new Notification(options.title, {
                body: options.body,
                icon: options.icon,
                badge: options.badge,
                tag: options.tag,
                requireInteraction: options.requireInteraction,
                data: options.data,
                actions: options.actions
            });
            
            console.log('[CapacitorNotifications] Shown via Web API (immediate)');
        } catch (error) {
            console.error('[CapacitorNotifications] Web notification failed:', error);
        }
        
        return;
    }
    
    console.warn('[CapacitorNotifications] Notifications not available');
}

/**
 * Cancel a scheduled notification
 * 
 * @param {number} id - Notification ID to cancel
 * @returns {Promise<void>}
 */
async function cancelNotification(id) {
    if (isCapacitorAvailable()) {
        try {
            await window.Capacitor.Plugins.LocalNotifications.cancel({
                notifications: [{ id }]
            });
            console.log('[CapacitorNotifications] Cancelled notification:', id);
        } catch (error) {
            console.error('[CapacitorNotifications] Cancel failed:', error);
        }
    }
    // Web API doesn't support canceling scheduled notifications
}

/**
 * Get list of pending notifications
 * 
 * @returns {Promise<Array>} Array of pending notifications
 */
async function getPendingNotifications() {
    if (isCapacitorAvailable()) {
        try {
            const result = await window.Capacitor.Plugins.LocalNotifications.getPending();
            return result.notifications || [];
        } catch (error) {
            console.error('[CapacitorNotifications] Get pending failed:', error);
            return [];
        }
    }
    
    // Web API doesn't support getting pending notifications
    return [];
}

/**
 * Cancel all scheduled notifications
 * 
 * @returns {Promise<void>}
 */
async function cancelAllNotifications() {
    if (isCapacitorAvailable()) {
        try {
            const pending = await getPendingNotifications();
            if (pending.length > 0) {
                await window.Capacitor.Plugins.LocalNotifications.cancel({
                    notifications: pending
                });
                console.log('[CapacitorNotifications] Cancelled all notifications:', pending.length);
            }
        } catch (error) {
            console.error('[CapacitorNotifications] Cancel all failed:', error);
        }
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isCapacitorAvailable,
        requestPermission,
        checkPermission,
        scheduleNotification,
        cancelNotification,
        getPendingNotifications,
        cancelAllNotifications
    };
}

// Also make available globally for easy access
window.CapacitorNotifications = {
    isCapacitorAvailable,
    requestPermission,
    checkPermission,
    scheduleNotification,
    cancelNotification,
    getPendingNotifications,
    cancelAllNotifications
};
