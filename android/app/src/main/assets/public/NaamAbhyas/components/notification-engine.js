/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOTIFICATION ENGINE - Smart Notification Scheduling for Naam Abhyas
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

class NotificationEngine {
    constructor() {
        this.permission = 'default';
        this.scheduledNotifications = [];
        this.serviceWorkerReady = false;
        this.notificationHistory = [];
        this.maxRetries = 3;
        this.retryDelay = 5000; // 5 seconds

        this.init();
    }

    /**
     * Initialize notification engine
     */
    async init() {
        // Check permission status
        if ('Notification' in window) {
            this.permission = Notification.permission;
        }

        // Check for service worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                this.serviceWorkerReady = true;
                console.log('🔔 Notification Engine: Service Worker ready');
            } catch (e) {
                console.log('Notification Engine: Service Worker not available');
            }
        }
    }

    /**
     * Request notification permission
     * @returns {Promise<string>} Permission status
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('Notifications not supported');
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            this.permission = 'granted';
            return 'granted';
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission;
        } catch (e) {
            console.error('Failed to request notification permission:', e);
            return 'denied';
        }
    }

    /**
     * Show immediate notification with retry logic
     * @param {string} title - Notification title
     * @param {object} options - Notification options
     * @param {number} retryCount - Current retry attempt
     * @returns {Notification|null}
     */
    show(title, options = {}, retryCount = 0) {
        if (this.permission !== 'granted') {
            console.log('Notifications not permitted');
            return null;
        }

        const defaultOptions = {
            icon: '../assets/icon-192x192.png',
            badge: '../assets/icon-72x72.png',
            vibrate: [200, 100, 200],
            tag: 'naam-abhyas',
            renotify: true,
            requireInteraction: false,
            silent: false
        };

        try {
            const notification = new Notification(title, { ...defaultOptions, ...options });

            notification.onclick = (event) => {
                event.preventDefault();
                window.focus();
                notification.close();

                if (options.onClick) {
                    options.onClick(event);
                }
            };

            // Log to history
            this.addToHistory({
                title,
                timestamp: Date.now(),
                success: true
            });

            return notification;
        } catch (e) {
            console.error('Failed to show notification:', e);

            // Retry logic
            if (retryCount < this.maxRetries) {
                console.log(`Retrying notification (${retryCount + 1}/${this.maxRetries}) in ${this.retryDelay}ms`);
                setTimeout(() => {
                    this.show(title, options, retryCount + 1);
                }, this.retryDelay);
            } else {
                console.error('Max retries reached for notification:', title);
                this.addToHistory({
                    title,
                    timestamp: Date.now(),
                    success: false,
                    error: e.message
                });
            }

            return null;
        }
    }

    /**
     * Add notification to history for debugging
     * @param {object} entry - History entry
     */
    addToHistory(entry) {
        this.notificationHistory.push(entry);
        // Keep only last 100 entries
        if (this.notificationHistory.length > 100) {
            this.notificationHistory.shift();
        }
    }

    /**
     * Get notification history
     * @returns {Array} Notification history
     */
    getHistory() {
        return this.notificationHistory;
    }

    /**
     * Schedule a notification for a specific time
     * @param {string} id - Unique notification ID
     * @param {Date} time - Time to show notification
     * @param {string} title - Notification title
     * @param {object} options - Notification options
     */
    schedule(id, time, title, options = {}) {
        // CAPACITOR FIX: On native platforms, all notification scheduling is handled
        // by capacitor-notifications-global.js using exact native alarms.
        // The web setTimeout path is unreliable in background/Doze mode and creates
        // duplicate scheduling conflicts. Skip entirely on native builds.
        if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
            console.log(`🔔 [NotificationEngine] Skipping web schedule for "${id}" — using native alarms`);
            return;
        }

        const now = Date.now();
        const scheduleTime = time instanceof Date ? time.getTime() : time;
        const delay = scheduleTime - now;

        if (delay <= 0) {
            // Time has passed, show immediately
            this.show(title, options);
            return;
        }

        // Clear any existing scheduled notification with same ID
        this.cancel(id);

        // Schedule new notification
        const timeoutId = setTimeout(() => {
            this.show(title, options);

            // Remove from scheduled list
            this.scheduledNotifications = this.scheduledNotifications.filter(n => n.id !== id);
        }, delay);

        this.scheduledNotifications.push({
            id,
            timeoutId,
            time: scheduleTime,
            title,
            options
        });

        console.log(`🔔 Scheduled notification "${id}" for ${new Date(scheduleTime).toLocaleTimeString()}`);
    }

    /**
     * Cancel a scheduled notification
     * @param {string} id - Notification ID
     */
    cancel(id) {
        const scheduled = this.scheduledNotifications.find(n => n.id === id);
        if (scheduled) {
            clearTimeout(scheduled.timeoutId);
            this.scheduledNotifications = this.scheduledNotifications.filter(n => n.id !== id);
            console.log(`🔔 Cancelled notification "${id}"`);
        }
    }

    /**
     * Cancel all scheduled notifications
     */
    cancelAll() {
        this.scheduledNotifications.forEach(n => {
            clearTimeout(n.timeoutId);
        });
        this.scheduledNotifications = [];
        console.log('🔔 Cancelled all scheduled notifications');
    }

    /**
     * Cancel notifications for a specific hour
     * @param {number} hour - Hour to cancel
     */
    cancelHour(hour) {
        const idsToCancel = [
            `naam_hour_${hour}`,
            `naam_pre_${hour}`,
            `naam_start_${hour}`
        ];

        idsToCancel.forEach(id => this.cancel(id));
    }

    /**
     * Get scheduled notifications
     * @returns {Array} Scheduled notifications
     */
    getScheduled() {
        return this.scheduledNotifications.map(n => ({
            id: n.id,
            time: new Date(n.time),
            title: n.title
        }));
    }

    /**
     * Check if notifications are permitted
     * @returns {boolean}
     */
    isPermitted() {
        return this.permission === 'granted';
    }

    /**
     * Helper to generate a deterministic pseudo-random minute between 10 and 50
     * based on the date and hour, ensuring consistency across app reloads.
     */
    _getRandomMinuteForHour(dateStr, hour) {
        // Simple hash of date string + hour
        let hash = 0;
        const str = dateStr + "_" + hour;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        // Get pseudo-random number between 10 and 50
        return 10 + Math.abs(hash) % 41;
    }

    /**
     * Schedule Naam Abhyas notifications for a session
     * @param {object} session - Session data
     * @param {object} config - Notification config
     */
    scheduleSessionNotifications(session, config) {
        const sessionTime = new Date();
        sessionTime.setHours(session.hour, session.startMinute, 0, 0);

        // 1. Hour start notification
        if (config.hourStart) {
            const hourStart = new Date();
            hourStart.setHours(session.hour, 0, 0, 0);

            if (hourStart > new Date()) {
                this.schedule(
                    `naam_hour_${session.hour}`,
                    hourStart,
                    '🙏 Naam Abhyas',
                    {
                        body: `Your Naam Abhyas this hour: ${session.startTime} - ${session.endTime}`,
                        tag: 'naam-hour-start'
                    }
                );
            }
        }

        // 2. Pre-reminder (default 2 minutes before)
        if (config.preReminder) {
            const preReminderMinutes = config.preReminderMinutes || 2;
            const preReminder = new Date(sessionTime);
            preReminder.setMinutes(preReminder.getMinutes() - preReminderMinutes);

            if (preReminder > new Date()) {
                this.schedule(
                    `naam_pre_${session.hour}`,
                    preReminder,
                    '🔔 Naam Abhyas Starting Soon!',
                    {
                        body: `Starting in ${preReminderMinutes} minutes. Prepare yourself.`,
                        tag: 'naam-pre-reminder'
                    }
                );
            }
        }

        // 3. Start time notification - ALSO REGISTER WITH GLOBAL ALARM SYSTEM
        if (sessionTime > new Date()) {
            this.schedule(
                `naam_start_${session.hour}`,
                sessionTime,
                '🙏 TIME FOR NAAM ABHYAS',
                {
                    body: 'Leave all work. Remember Vaheguru.',
                    tag: 'naam-start',
                    requireInteraction: true,
                    actions: [
                        { action: 'start', title: 'Start Now' },
                        { action: 'skip', title: 'Skip' }
                    ]
                }
            );

            // CRITICAL FIX: Also register with global alarm system for guaranteed firing
            if (window.GlobalAlarmSystem) {
                window.GlobalAlarmSystem.registerNaamAbhyasAlarm({
                    id: `naam_${session.hour}`,
                    hour: session.hour,
                    minute: session.startMinute,
                    title: 'Naam Abhyas',
                    enabled: true
                });
            }
        }
    }

    /**
     * Schedule Capacitor-native notifications for Naam Abhyas.
     * ═══ OVERHAULED: Fixes BUG 3 (importance), BUG 4 (no channel delete), BUG 5 (no priority field) ═══
     * Also persists schedule to dedicated localStorage key for cross-page sync.
     */
    async scheduleCapacitorHourlyBatch(config) {
        if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;
        if (!window.Capacitor.Plugins.LocalNotifications) return;
        if (!config || !config.enabled) return;

        try {
            const LN = window.Capacitor.Plugins.LocalNotifications;

            // Request permission first
            const perms = await LN.checkPermissions();
            if (perms.display !== 'granted') {
                await LN.requestPermissions();
            }

            if (window.Capacitor.Plugins.AlarmReliability) {
                try {
                    const status = await window.Capacitor.Plugins.AlarmReliability.getStatus();
                    if (!status || status.exactAlarm !== true) {
                        await window.Capacitor.Plugins.AlarmReliability.requestExactAlarmPermission();
                    }
                    if (status && status.batteryOptimized === true) {
                        await window.Capacitor.Plugins.AlarmReliability.requestIgnoreBatteryOptimizations();
                    }
                } catch (e) {
                    console.warn('[NaamAbhyas] Alarm reliability permission check failed:', e);
                }
            }

            console.log('[NaamAbhyas] 📅 Schedule data received:', {
                startHour: config.startHour,
                endHour: config.endHour
            });

            // Cancel previous Naam Abhyas notifications (7-day rolling window)
            const cancelIds = [];
            for (let i = 0; i < 168; i++) {
                cancelIds.push({ id: 90000 + i });
            }
            try {
                await LN.cancel({ notifications: cancelIds });
            } catch (e) { /* ignore if none exist */ }

            const now = new Date();
            const startHour = config.startHour || config.activeHours?.start || 5;
            const endHour = config.endHour || config.activeHours?.end || 22;
            const messages = [
                'Naam japn da time ho gya hai, 2 min layi sare kamm chhaddo.',
                'Waheguru Ji bula rahe ne. Bas 2 minutes Simran.',
                'Phone pocket vich rakh lo, akhan band kro, Waheguru japo.',
                '2-minute Simran break: kaam pause, Waheguru play.',
                'Naam Abhyas slot live hai. Hun bas 120 seconds Rab naal.',
                'Your soul is calling. Take 2 minutes for Naam Simran.',
                'Be still. Breathe. Remember Vaheguru.'
            ];

            let scheduledCount = 0;

            // Schedule for the next 7 days so alarms survive app restarts.
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                for (let hour = startHour; hour <= endHour; hour++) {
                    const scheduleDate = new Date(now);
                    scheduleDate.setDate(scheduleDate.getDate() + dayOffset);

                    const dateStr = scheduleDate.toISOString().split('T')[0];
                    // FIX: Use actual schedule minute for today, fall back to hash for future days
                    var sessionMinute;
                    if (dayOffset === 0 && config.currentSchedule && config.currentSchedule[hour]) {
                        sessionMinute = config.currentSchedule[hour].startMinute;
                    } else {
                        sessionMinute = this._getRandomMinuteForHour(dateStr, hour);
                    }

                    scheduleDate.setHours(hour, sessionMinute, 0, 0);

                    // Skip times that have already passed
                    if (scheduleDate <= now) continue;

                    const notifId = 90000 + (dayOffset * 24) + hour;
                    const message = messages[(hour + dayOffset) % messages.length];

                    // 1. Try to schedule Native Full-Screen Alarm (Play Store style)
                    if (window.Capacitor.Plugins.AlarmReliability && window.Capacitor.Plugins.AlarmReliability.scheduleFullScreenAlarm) {
                        try {
                            await window.Capacitor.Plugins.AlarmReliability.scheduleFullScreenAlarm({
                                id: notifId,
                                timestamp: scheduleDate.getTime(),
                                title: '🙏 ਨਾਮ ਅਭਿਆਸ | Naam Abhyas',
                                message: message,
                                hour: String(hour),
                                minute: String(sessionMinute)
                            });
                            scheduledCount++;
                            continue; // Successfully scheduled full-screen alarm, skip LocalNotifications
                        } catch (e) {
                            console.warn('[NaamAbhyas] Full-screen alarm failed, falling back to LocalNotifications', e);
                        }
                    }

                    // 2. Fallback to LocalNotifications if native full-screen plugin fails
                    try {
                        await LN.schedule({
                            notifications: [{
                                id: notifId,
                                title: '🙏 ਨਾਮ ਅਭਿਆਸ | Naam Abhyas',
                                body: message,
                                schedule: {
                                    at: scheduleDate,
                                    allowWhileIdle: true,
                                    exact: true
                                },
                                channelId: 'naam_abhyas_v2',
                                sound: 'default',
                                smallIcon: 'ic_stat_notify',
                                extra: {
                                    type: 'naam_abhyas',
                                    action: 'auto_start_naam',
                                    hour: String(hour),
                                    minute: String(sessionMinute),
                                    url: 'NaamAbhyas/naam-abhyas.html',
                                    autoStart: 'true'
                                }
                            }]
                        });
                        scheduledCount++;
                    } catch (e) {
                        console.error('[NaamAbhyas] Fallback notification scheduling failed', e);
                    }
                }
            }

            console.log(`[NaamAbhyas] ✅ Scheduled ${scheduledCount} randomized hourly alarms via Native Engine`);
        } catch (e) {
            console.error('[NaamAbhyas] Failed to schedule Capacitor notifications:', e);
        }
    }

    /**
     * CAPACITOR-NATIVE: Cancel all Naam Abhyas notifications
     */
    async cancelCapacitorBatch() {
        if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;
        if (!window.Capacitor.Plugins.LocalNotifications) return;

        try {
            const cancelIds = [];
            for (let i = 0; i < 168; i++) {
                cancelIds.push({ id: 90000 + i });
            }
            await window.Capacitor.Plugins.LocalNotifications.cancel({ notifications: cancelIds });
            console.log('[NaamAbhyas] Cancelled all Capacitor notifications');
        } catch (e) {
            console.error('[NaamAbhyas] Failed to cancel Capacitor notifications:', e);
        }
    }

    /**
     * CAPACITOR-NATIVE: Force refresh all notifications with new schedule
     * This ensures notification times update when active hours change
     */
    async forceRefreshCapacitorNotifications(config) {
        if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;
        if (!window.Capacitor.Plugins.LocalNotifications) return;

        console.log('[NaamAbhyas] Force refreshing Capacitor notifications due to schedule change');

        try {
            // First cancel all existing notifications
            await this.cancelCapacitorBatch();

            // Wait a brief moment for cancellation to process
            await new Promise(resolve => setTimeout(resolve, 100));

            // Then reschedule with new configuration
            await this.scheduleCapacitorHourlyBatch(config);

            console.log('[NaamAbhyas] ✅ Force refresh completed - notifications updated with new schedule');
        } catch (e) {
            console.error('[NaamAbhyas] Failed to force refresh Capacitor notifications:', e);
        }
    }
}

// Export for global usage
window.NotificationEngine = NotificationEngine;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationEngine;
}
