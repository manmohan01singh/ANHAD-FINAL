/**
 * ANHAD Notification System
 * Peaceful, spiritually uplifting push notifications
 */

class AnhadNotificationSystem {
    constructor() {
        this.notifications = null;
        this.enabled = false;
        this.init();
    }

    async init() {
        try {
            // Load notification content
            const response = await fetch('/notifications-content.json');
            this.notifications = await response.json();
            
            // Check if user has granted permission
            this.checkPermission();
            
            // Load user preferences
            this.loadPreferences();
        } catch (error) {
            console.error('Error initializing notification system:', error);
        }
    }

    async checkPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                this.enabled = true;
            } else if (Notification.permission !== 'denied') {
                // Can ask for permission
                this.enabled = false;
            }
        }
    }

    async requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            this.enabled = permission === 'granted';
            return this.enabled;
        }
        return false;
    }

    loadPreferences() {
        const prefs = localStorage.getItem('anhad_notification_prefs');
        if (prefs) {
            this.preferences = JSON.parse(prefs);
        } else {
            // Default preferences
            this.preferences = {
                amritvela: { enabled: true, time: '04:00' },
                japji_sahib: { enabled: true, time: '05:00' },
                jaap_sahib: { enabled: true, time: '05:30' },
                rehras_sahib: { enabled: true, time: '18:00' },
                kirtan_sohila: { enabled: true, time: '21:00' },
                hukamnama: { enabled: true, time: '06:00' },
                simran_reminders: { enabled: true, frequency: 'medium' }, // low, medium, high
                bedtime: { enabled: true, time: '22:00' },
                nitnem_check: { enabled: true, time: '20:00' }
            };
            this.savePreferences();
        }
    }

    savePreferences() {
        localStorage.setItem('anhad_notification_prefs', JSON.stringify(this.preferences));
    }

    getRandomNotification(category) {
        if (!this.notifications || !this.notifications.notifications[category]) {
            return null;
        }
        
        const categoryNotifications = this.notifications.notifications[category];
        const randomIndex = Math.floor(Math.random() * categoryNotifications.length);
        return categoryNotifications[randomIndex];
    }

    async sendNotification(category) {
        if (!this.enabled) return;
        
        const notif = this.getRandomNotification(category);
        if (!notif) return;

        try {
            // For Capacitor (mobile)
            if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
                await this.sendCapacitorNotification(notif);
            } 
            // For web
            else if ('Notification' in window && Notification.permission === 'granted') {
                this.sendWebNotification(notif);
            }
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    async sendCapacitorNotification(notif) {
        const { LocalNotifications } = window.Capacitor.Plugins;
        
        await LocalNotifications.schedule({
            notifications: [{
                title: notif.title,
                body: notif.body,
                id: Date.now(),
                schedule: { at: new Date(Date.now() + 1000) },
                sound: null,
                attachments: null,
                actionTypeId: '',
                extra: {
                    category: notif.category,
                    translation: notif.translation
                }
            }]
        });
    }

    sendWebNotification(notif) {
        const notification = new Notification(notif.title, {
            body: notif.body,
            icon: '/assets/app-logo-96.png',
            badge: '/assets/app-logo-96.png',
            tag: notif.category,
            requireInteraction: false,
            silent: true
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }

    // Schedule notifications based on user preferences
    scheduleNotifications() {
        // Clear existing schedules
        if (this.scheduleIntervals) {
            this.scheduleIntervals.forEach(interval => clearInterval(interval));
        }
        this.scheduleIntervals = [];

        // Check every minute for scheduled notifications
        const checkInterval = setInterval(() => {
            this.checkScheduledNotifications();
        }, 60000); // Check every minute

        this.scheduleIntervals.push(checkInterval);

        // Random spiritual reminders (if enabled)
        if (this.preferences.simran_reminders?.enabled) {
            this.scheduleRandomReminders();
        }
    }

    checkScheduledNotifications() {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Check each category
        Object.keys(this.preferences).forEach(category => {
            const pref = this.preferences[category];
            if (pref.enabled && pref.time === currentTime) {
                this.sendNotification(category);
            }
        });

        // Evening check for Nitnem completion
        if (this.preferences.nitnem_check?.enabled && 
            this.preferences.nitnem_check.time === currentTime) {
            this.checkNitnemCompletion();
        }
    }

    scheduleRandomReminders() {
        const frequencies = {
            low: 180,    // Every 3 hours
            medium: 120, // Every 2 hours
            high: 60     // Every hour
        };

        const frequency = this.preferences.simran_reminders.frequency || 'medium';
        const intervalMinutes = frequencies[frequency];

        const reminderInterval = setInterval(() => {
            // Only send between 8 AM and 9 PM
            const hour = new Date().getHours();
            if (hour >= 8 && hour <= 21) {
                this.sendNotification('random_spiritual_reminders');
            }
        }, intervalMinutes * 60 * 1000);

        this.scheduleIntervals.push(reminderInterval);
    }

    checkNitnemCompletion() {
        // Check if user completed Nitnem today
        const today = new Date().toDateString();
        const nitnemStatus = localStorage.getItem('nitnem_status_' + today);
        
        if (!nitnemStatus || nitnemStatus !== 'complete') {
            this.sendNotification('nitnem_missed');
        }
    }

    // Public methods
    enable() {
        this.enabled = true;
        this.scheduleNotifications();
    }

    disable() {
        this.enabled = false;
        if (this.scheduleIntervals) {
            this.scheduleIntervals.forEach(interval => clearInterval(interval));
        }
    }

    updatePreference(category, settings) {
        this.preferences[category] = { ...this.preferences[category], ...settings };
        this.savePreferences();
        this.scheduleNotifications(); // Reschedule with new preferences
    }
}

// Initialize global notification system
window.anhadNotifications = new AnhadNotificationSystem();
