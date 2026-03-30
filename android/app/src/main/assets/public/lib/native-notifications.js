/**
 * Native Notifications Wrapper for Capacitor
 * Bridges the gap between Web and Android/iOS Native Alarms
 */
(function () {
    function _getLN() {
        return window.Capacitor?.Plugins?.LocalNotifications || null;
    }

    window.NativeNotifications = {
        _initialized: false,
        _listeners: [],

        isNativePlatform() {
            return window.Capacitor && window.Capacitor.isNativePlatform();
        },

        async init() {
            if (this._initialized) return;

            console.log('[NativeNotifications] Initializing...');
            if (this.isNativePlatform()) {
                await this.requestPermissions();
            }

            this._initialized = true;
        },

        async requestPermissions() {
            if (!this.isNativePlatform()) return 'granted';

            try {
                const ln = _getLN();
                if (!ln) return 'denied';
                const result = await ln.requestPermissions();
                return result.display;
            } catch (e) {
                console.warn('[NativeNotifications] Permission request failed:', e);
                return 'denied';
            }
        },

        async schedule(options) {
            // Options: { id, title, body, at: Date, recurring: bool, sound, ... }
            if (this.isNativePlatform()) {
                const notifs = [{
                    id: this._hashId(options.id), // Ensure ID is integer for Android
                    title: options.title,
                    body: options.body,
                    schedule: {
                        at: options.at,
                        repeats: options.recurring || false,
                        allowWhileIdle: true // IMPORTANT: Android Doze mode bypass
                    },
                    sound: options.sound ? `${options.sound}.wav` : undefined,
                    extra: options.data,
                    smallIcon: 'ic_stat_notify', // Ensure you have this resource
                    actionTypeId: options.actionTypeId,
                    channelId: 'frequent_reminders' // Create channel if needed
                }];

                try {
                    const ln = _getLN();
                    if (!ln) return false;
                    await ln.schedule({ notifications: notifs });
                    console.log('[NativeNotifications] Scheduled natively:', options.title, options.at);
                    return true;
                } catch (e) {
                    console.error('[NativeNotifications] Native schedule failed:', e);
                    return false;
                }
            } else {
                console.log('[NativeNotifications] Web Fallback Schedule:', options);
                // Return success so the caller thinks it worked (handled by SW/timeout)
                return false;
            }
        },

        async registerNotificationActions() {
            // Register quick actions like "Mark Done"
            if (!this.isNativePlatform()) return;

            /* 
            // Example Action Type
            await Capacitor.Plugins.LocalNotifications.registerActionTypes({
                types: [{
                    id: 'NITNEM_REMINDER',
                    actions: [
                        { id: 'open', title: 'Open', foreground: true },
                        { id: 'snooze', title: 'Snooze' }
                    ]
                }]
            });
            */
        },

        addListener(callback) {
            if (this.isNativePlatform()) {
                const ln = _getLN();
                if (!ln) return;
                ln.addListener('localNotificationActionPerformed', (notification) => {
                    callback({
                        type: 'action',
                        actionId: notification.actionId,
                        notification: notification.notification
                    });
                });
            }
        },

        // Helper: Convert string IDs to Integer for Android
        _hashId(str) {
            let hash = 0;
            if (str.length === 0) return hash;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash);
        }
    };

    // Auto-init specific channel for Android
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            const ln = _getLN();
            if (ln) {
                ln.createChannel({
                    id: 'frequent_reminders',
                    name: 'Nitnem Reminders',
                    importance: 5, // High importance
                    visibility: 1,
                    vibration: true,
                    sound: 'notification.wav'
                }).catch(e => console.warn('Channel creation failed', e));
            }
        } catch (e) { }
    }

})();
