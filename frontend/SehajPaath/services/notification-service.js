/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOTIFICATION SERVICE
 * Handles push notifications and reminders
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class NotificationService {
    constructor() {
        this.isSupported = 'Notification' in window;
        this.permission = this.isSupported ? Notification.permission : 'denied';
    }

    /**
     * Request notification permission
     */
    async requestPermission() {
        if (!this.isSupported) {
            return 'denied';
        }

        if (this.permission === 'granted') {
            return 'granted';
        }

        const result = await Notification.requestPermission();
        this.permission = result;
        return result;
    }

    /**
     * Check if notifications are enabled
     */
    isEnabled() {
        return this.isSupported && this.permission === 'granted';
    }

    /**
     * Show a notification
     */
    async show(title, options = {}) {
        if (!this.isEnabled()) {
            console.warn('Notifications not enabled');
            return null;
        }

        const defaultOptions = {
            icon: '../assets/favicon.svg',
            badge: '../assets/favicon.svg',
            vibrate: [100, 50, 100],
            tag: 'sehaj-paath',
            renotify: true,
            ...options
        };

        try {
            const notification = new Notification(title, defaultOptions);

            notification.onclick = () => {
                window.focus();
                if (options.onClick) options.onClick();
                notification.close();
            };

            return notification;
        } catch (error) {
            console.error('Notification error:', error);
            return null;
        }
    }

    /**
     * Schedule a daily reminder
     */
    scheduleReminder(time, enabled = true) {
        const settings = {
            time,
            enabled,
            lastScheduled: Date.now()
        };

        localStorage.setItem('sehajPaathReminder', JSON.stringify(settings));

        if (enabled) {
            this.setupReminderCheck();
        }

        return settings;
    }

    /**
     * Get reminder settings
     */
    getReminderSettings() {
        try {
            const stored = localStorage.getItem('sehajPaathReminder');
            return stored ? JSON.parse(stored) : { time: '06:00', enabled: false };
        } catch {
            return { time: '06:00', enabled: false };
        }
    }

    /**
     * Setup periodic reminder check
     */
    setupReminderCheck() {
        // Check every minute
        setInterval(() => {
            this.checkReminder();
        }, 60 * 1000);

        // Initial check
        this.checkReminder();
    }

    /**
     * Check if reminder should fire
     */
    checkReminder() {
        const settings = this.getReminderSettings();
        if (!settings.enabled) return;

        const now = new Date();
        const [hours, minutes] = settings.time.split(':').map(Number);

        if (now.getHours() === hours && now.getMinutes() === minutes) {
            // Check if already fired today
            const lastFired = localStorage.getItem('sehajPaathLastReminder');
            const today = now.toDateString();

            if (lastFired !== today) {
                this.fireReminder();
                localStorage.setItem('sehajPaathLastReminder', today);
            }
        }
    }

    /**
     * Fire the reading reminder
     */
    async fireReminder() {
        await this.show('ਸਹਿਜ ਪਾਠ ਯਾਦ ਦਹਾਨੀ', {
            body: 'Time for your daily Gurbani reading. ਵਾਹਿਗੁਰੂ!',
            tag: 'sehaj-paath-reminder',
            onClick: () => {
                window.location.href = 'reader.html';
            }
        });
    }

    /**
     * Show achievement notification
     */
    async showAchievement(title, description) {
        await this.show(`🏆 ${title}`, {
            body: description,
            tag: 'sehaj-paath-achievement'
        });
    }

    /**
     * Show streak reminder
     */
    async showStreakReminder(streakDays) {
        await this.show('ਸਟ੍ਰੀਕ ਬਚਾਓ!', {
            body: `Don't break your ${streakDays} day streak! Read some Gurbani today.`,
            tag: 'sehaj-paath-streak'
        });
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationService;
}
