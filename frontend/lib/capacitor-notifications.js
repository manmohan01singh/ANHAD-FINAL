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
                    at: new Date(options.scheduledTime),
                    allowWhileIdle: true,
                    exact: true
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
                // FIX: If delay is <= 0 (overdue), show immediately instead of silently dropping the notification
            }

            // Show immediately (also catches overdue notifications)
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

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION DEEP-LINK ROUTING
// When user taps a notification, navigate to the correct app page.
// Reads: notification.extra.url (relative path from frontend root, e.g.
//   "GurbaniRadio/gurbani-radio.html?stream=amritvela"
//   "NitnemTracker/nitnem-tracker.html"
//   "NaamAbhyas/naam-abhyas.html"
// )
// ═══════════════════════════════════════════════════════════════════════════
(function initNotificationDeepLink() {
    if (!window.Capacitor || !window.Capacitor.Plugins) {
        // Retry after Capacitor loads
        setTimeout(initNotificationDeepLink, 1500);
        return;
    }
    const { LocalNotifications } = window.Capacitor.Plugins;
    if (!LocalNotifications || typeof LocalNotifications.addListener !== 'function') {
        setTimeout(initNotificationDeepLink, 1500);
        return;
    }

    // Already registered guard - use separate flag so both this and capacitor-notifications-global.js can register
    if (window.__anhadNotifRouterRegistered) return;
    window.__anhadNotifRouterRegistered = true;

    LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
        try {
            const extra = event.notification && event.notification.extra;
            if (!extra) return;

            // Defer to capacitor-notifications-global.js for alarm popups — do NOT navigate away
            if (extra.action === 'show_alarm') {
                console.log('[NotifRouter] Deferring show_alarm to global handler');
                return;
            }

            // Determine target URL
            let targetUrl = extra.url || null;
            if (!targetUrl && extra.action) {
                // Legacy action-based routing
                const actionMap = {
                    'open_radio': 'GurbaniRadio/gurbani-radio.html',
                    'open_radio_darbar': 'GurbaniRadio/gurbani-radio.html?stream=darbar',
                    'open_amritvela': 'GurbaniRadio/gurbani-radio.html?stream=amritvela',
                    'open_simran': 'GurbaniRadio/gurbani-radio.html?stream=simran',
                    'open_nitnem': 'NitnemTracker/nitnem-tracker.html',
                    'open_naam_abhyas': 'NaamAbhyas/naam-abhyas.html',
                    'open_streak': 'NitnemTracker/nitnem-tracker.html#streak',
                    'show_tracker': 'NitnemTracker/nitnem-tracker.html',
                    'show_streak_saver': 'NitnemTracker/nitnem-tracker.html?streakSaver=activate',
                    'auto_start_naam': 'NaamAbhyas/naam-abhyas.html?autoStart=true',
                    'show_naam': 'NaamAbhyas/naam-abhyas.html',
                    // show_alarm intentionally omitted — handled by capacitor-notifications-global.js (alarm popup)
                };
                targetUrl = actionMap[extra.action] || null;
                if (extra.action === 'auto_start_naam') {
                    const params = new URLSearchParams({ autoStart: 'true' });
                    if (extra.hour !== undefined) params.set('hour', extra.hour);
                    if (extra.minute !== undefined) params.set('minute', extra.minute);
                    targetUrl = 'NaamAbhyas/naam-abhyas.html?' + params.toString();
                }
            }

            // Resolve absolute target relative to ANHAD_ROOT (or fallback to location.origin)
            let absoluteTarget;
            if (targetUrl) {
                if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://') || targetUrl.startsWith('capacitor://')) {
                    absoluteTarget = targetUrl;
                } else {
                    const cleanTargetUrl = targetUrl.startsWith('/') ? targetUrl.substring(1) : targetUrl;
                    const root = window.ANHAD_ROOT || (window.location.origin + '/');
                    absoluteTarget = new URL(cleanTargetUrl, root).href;
                }

                console.log('[NotifRouter] Navigating to:', absoluteTarget);

                // Use window.navigateTo SPA router if available, otherwise fallback
                if (window.navigateTo) {
                    window.navigateTo(absoluteTarget);
                } else if (window.SmoothNav && window.SmoothNav.navigate) {
                    window.SmoothNav.navigate(absoluteTarget);
                } else {
                    window.location.href = absoluteTarget;
                }
                return;
            }

            if (!targetUrl) {
                console.log('[NotifRouter] No target URL in notification extra:', extra);
                return;
            }

            console.log('[NotifRouter] Navigating to:', targetUrl);

            // Build absolute path relative to frontend root
            // The app's index.html is at the root, pages are in sub-folders.
            const currentPath = window.location.pathname;
            // Find the frontend root (everything up to and including /frontend/ or last known dir)
            let base = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
            // If we're deep in a subdir, go up to root
            const depth = (currentPath.match(/\//g) || []).length - 1;
            let prefix = '';
            for (let i = 0; i < depth; i++) prefix += '../';

            // Use smooth navigation if available, otherwise direct href
            if (window.SmoothNav && window.SmoothNav.navigate) {
                window.SmoothNav.navigate(prefix + targetUrl);
            } else {
                window.location.href = prefix + targetUrl;
            }
        } catch (e) {
            console.error('[NotifRouter] Deep-link routing error:', e);
        }
    });

    console.log('[NotifRouter] ✅ Notification deep-link listener registered');
})();
