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
     * Show immediate notification
     * @param {string} title - Notification title
     * @param {object} options - Notification options
     * @returns {Notification|null}
     */
    show(title, options = {}) {
        if (this.permission !== 'granted') {
            console.log('Notifications not permitted');
            return null;
        }

        const defaultOptions = {
            icon: '../assets/favicon.svg',
            badge: '../assets/favicon.svg',
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

            return notification;
        } catch (e) {
            console.error('Failed to show notification:', e);
            return null;
        }
    }

    /**
     * Schedule a notification for a specific time
     * @param {string} id - Unique notification ID
     * @param {Date} time - Time to show notification
     * @param {string} title - Notification title
     * @param {object} options - Notification options
     */
    schedule(id, time, title, options = {}) {
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

        // 3. Start time notification
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
        }
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
}

// Export for global usage
window.NotificationEngine = NotificationEngine;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationEngine;
}
