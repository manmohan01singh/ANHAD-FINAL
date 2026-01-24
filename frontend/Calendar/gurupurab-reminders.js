(function () {
  'use strict';

  class GurupurabReminderManager {
    constructor() {
      this.dbName = 'gurupurab-reminders';
      this.storeName = 'reminders';
      this.db = null;

      this.init().catch(() => { });
    }

    async init() {
      this.db = await this.openDatabase();
      await this.requestNotificationPermission();
      await this.ensureServiceWorker();
    }

    async ensureServiceWorker() {
      if (!('serviceWorker' in navigator)) return null;
      try {
        // Use the main site service worker
        const reg = await navigator.serviceWorker.register('/sw.js');
        return reg;
      } catch {
        return null;
      }
    }

    async requestNotificationPermission() {
      if (!('Notification' in window)) return false;
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch {
        return false;
      }
    }

    openDatabase() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(this.dbName, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
            store.createIndex('isActive', 'isActive', { unique: false });
            store.createIndex('reminderDate', 'reminderDate', { unique: false });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    async scheduleReminder(gurupurab, daysBefore = [0, 1, 7]) {
      if (!gurupurab) return;

      const currentYear = new Date().getFullYear();
      // Support both old format (gregorianDates) and new format (gregorian2026)
      const iso = gurupurab.gregorianDates?.[String(currentYear)]
        || gurupurab.gregorian_date
        || (currentYear === 2026 ? gurupurab.gregorian2026 : null);

      if (!iso) {
        console.warn('No date found for reminder:', gurupurab.id);
        return;
      }

      const gurupurabDate = new Date(`${iso}T00:00:00`);
      if (Number.isNaN(gurupurabDate.getTime())) return;

      const now = new Date();

      for (const days of daysBefore) {
        const reminderDate = new Date(gurupurabDate);
        reminderDate.setDate(reminderDate.getDate() - Number(days || 0));
        reminderDate.setHours(7, 0, 0, 0);

        // Only schedule if reminder is in the future
        if (reminderDate <= now) {
          console.log(`Skipping past reminder: ${gurupurab.id} - ${days} days`);
          continue;
        }

        const reminder = {
          id: `${gurupurab.id}-${days}`,
          gurupurabId: gurupurab.id,
          gurupurabName: gurupurab.name || gurupurab.name_en,
          gurupurabNamePunjabi: gurupurab.namePunjabi || gurupurab.name_pa,
          reminderDate: reminderDate.toISOString(),
          daysBefore: Number(days || 0),
          isActive: true,
          scheduledAt: now.toISOString()
        };

        await this.saveReminder(reminder);
        console.log(`✅ Scheduled reminder: ${reminder.gurupurabName} - ${days} days before`);
      }

      await this.registerServiceWorkerReminders();
    }

    async saveReminder(reminder) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction([this.storeName], 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.put(reminder);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }

    async getActiveReminders() {
      return new Promise((resolve) => {
        const tx = this.db.transaction([this.storeName], 'readonly');
        const store = tx.objectStore(this.storeName);
        const idx = store.index('isActive');
        const req = idx.getAll(IDBKeyRange.only(true));
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    }

    async markReminderShown(id) {
      const reminder = await new Promise((resolve) => {
        const tx = this.db.transaction([this.storeName], 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (!reminder) return;
      reminder.isActive = false;
      await this.saveReminder(reminder);
    }

    async registerServiceWorkerReminders() {
      // We can't reliably do true background notifications without Push.
      // But we can still ask SW to schedule short-window notifications.
      if (!('serviceWorker' in navigator)) return;
      const reg = await navigator.serviceWorker.ready;
      if (!reg.active) return;

      const reminders = await this.getActiveReminders();
      const now = Date.now();

      for (const r of reminders) {
        const when = new Date(r.reminderDate).getTime();
        if (!Number.isFinite(when) || when <= now) continue;

        // Only schedule near-future reminders (24h window) to avoid long timers
        if (when - now > 24 * 60 * 60 * 1000) continue;

        const title = r.daysBefore === 0
          ? `ਅੱਜ ${r.gurupurabNamePunjabi}`
          : `${r.gurupurabNamePunjabi} - ${r.daysBefore} ਦਿਨ ਬਾਕੀ`;

        reg.active.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          payload: {
            id: `gurupurab-${r.id}`,
            title,
            body: r.gurupurabName,
            scheduledTime: when,
            tag: `gurupurab-${r.gurupurabId}`,
            requireInteraction: r.daysBefore === 0,
            data: { url: `/Gurupurab-Calendar.html?highlight=${encodeURIComponent(r.gurupurabId)}` }
          }
        });
      }
    }

    async checkAndShowReminders() {
      const reminders = await this.getActiveReminders();
      const now = new Date();

      for (const reminder of reminders) {
        const reminderDate = new Date(reminder.reminderDate);
        if (reminderDate <= now && reminder.isActive) {
          this.showNotification(reminder);
          await this.markReminderShown(reminder.id);
        }
      }
    }

    showNotification(reminder) {
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      const title = reminder.daysBefore === 0
        ? `ਅੱਜ ${reminder.gurupurabNamePunjabi}`
        : `${reminder.gurupurabNamePunjabi} - ${reminder.daysBefore} ਦਿਨ ਬਾਕੀ`;

      try {
        const n = new Notification(title, {
          body: reminder.gurupurabName,
          icon: '/assets/favicon-32x32.png',
          badge: '/assets/favicon-32x32.png',
          tag: reminder.id,
          requireInteraction: true,
          data: { url: `/Gurupurab-Calendar.html?highlight=${encodeURIComponent(reminder.gurupurabId)}` }
        });

        n.onclick = () => {
          window.focus();
          window.location.href = `/Gurupurab-Calendar.html?highlight=${encodeURIComponent(reminder.gurupurabId)}`;
        };
      } catch {
        // ignore
      }
    }

    // User preferences
    async updatePreferences(prefs) {
      localStorage.setItem('gurupurab-reminder-prefs', JSON.stringify(prefs));
    }

    getPreferences() {
      const defaults = {
        isEnabled: true,
        daysBeforeReminder: [0, 1, 7],
        reminderTime: '07:00',
        includeShahidiDays: true,
        includeSangrand: false
      };

      try {
        const saved = localStorage.getItem('gurupurab-reminder-prefs');
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
      } catch {
        return defaults;
      }
    }
  }

  window.gurupurabReminders = new GurupurabReminderManager();
})();
