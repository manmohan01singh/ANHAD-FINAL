/**
 * Reminder System Component
 */

class ReminderSystem {
    constructor() {
        this.isEnabled = localStorage.getItem('sehajPaathReminderEnabled') === 'true';
        this.time = localStorage.getItem('sehajPaathReminderTime') || '06:00';
    }

    enable(time) {
        this.isEnabled = true;
        this.time = time || this.time;
        localStorage.setItem('sehajPaathReminderEnabled', 'true');
        localStorage.setItem('sehajPaathReminderTime', this.time);

        this.scheduleReminder();
    }

    disable() {
        this.isEnabled = false;
        localStorage.setItem('sehajPaathReminderEnabled', 'false');
    }

    scheduleReminder() {
        if (!this.isEnabled) return;

        // For PWA/web, we'll use the NotificationService if available
        if (typeof NotificationService !== 'undefined') {
            const notificationService = new NotificationService();
            notificationService.scheduleReminder(this.time, true);
        }
    }

    getSettings() {
        return {
            enabled: this.isEnabled,
            time: this.time
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReminderSystem;
}
