/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PWA MANAGER v2.0 - Enhanced with Background Alarm Registration
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ PWA Installation Detection (appinstalled event)
 * ✅ Automatic Alarm Registration on Install
 * ✅ PeriodicSync Setup for Background Notifications
 * ✅ Naam Abhyas Schedule Persistence for Service Worker
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class PWAManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.updateDismissKey = 'pwaUpdateDismissedAt';
    this.updateDismissTtlMs = 6 * 60 * 60 * 1000;
    this.deferredPrompt = null;
    this.isInstalled = this.checkIfInstalled();
    this.init();
  }

  /**
   * Check if app is already installed as PWA
   */
  checkIfInstalled() {
    // Check display-mode
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    // iOS Safari standalone
    if (window.navigator.standalone === true) return true;
    // Check if launched from installed PWA
    if (document.referrer.includes('android-app://')) return true;
    return false;
  }

  /**
   * Lock screen orientation to portrait for mobile devices
   */
  async lockOrientation() {
    // Only attempt on mobile/tablet sized screens
    if (window.innerWidth > 1024) {
      return; // Desktop — don't lock
    }

    // Method 1: Screen Orientation API (Chrome/Android)
    if ('screen' in window && 'orientation' in window.screen && 'lock' in window.screen.orientation) {
      try {
        await window.screen.orientation.lock('portrait-primary');
        console.log('🔒 Screen orientation locked to portrait');
        return;
      } catch (err) {
        console.warn('Screen orientation lock failed:', err.message);
      }
    }

    // Method 2: Capacitor ScreenOrientation plugin (if in native app)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.ScreenOrientation) {
      try {
        await window.Capacitor.Plugins.ScreenOrientation.lock({
          orientation: 'portrait'
        });
        console.log('🔒 Capacitor orientation locked to portrait');
      } catch (err) {
        console.warn('Capacitor orientation lock failed:', err.message);
      }
    }
  }

  async init() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SCREEN ORIENTATION LOCK (Portrait Only)
    // ═══════════════════════════════════════════════════════════════════════
    this.lockOrientation();

    try {
      this.registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './'
      });

      console.log('SW registered:', this.registration.scope);

      // ═══════════════════════════════════════════════════════════════════════
      // PWA INSTALLATION DETECTION
      // ═══════════════════════════════════════════════════════════════════════

      // Capture install prompt for later use
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        console.log('📲 PWA install prompt captured');
        // Dispatch event for UI components to show install button
        window.dispatchEvent(new CustomEvent('pwaInstallAvailable', { detail: { prompt: e } }));
      });

      // Handle successful installation
      window.addEventListener('appinstalled', () => {
        console.log('✅ PWA Installed - registering alarms and notifications');
        this.deferredPrompt = null;
        this.isInstalled = true;
        localStorage.setItem('pwa_installed', 'true');
        localStorage.setItem('pwa_installed_at', new Date().toISOString());

        // Trigger alarm and notification registration
        this.onPWAInstalled();
      });

      // If already installed, ensure alarms are registered
      if (this.isInstalled) {
        console.log('📱 Running as installed PWA - ensuring alarms are registered');
        await this.ensureAlarmsRegistered();
      }

      // ═══════════════════════════════════════════════════════════════════════
      // UPDATE MANAGEMENT
      // ═══════════════════════════════════════════════════════════════════════

      if (this.registration.waiting) {
        this.showUpdateNotification();
      }

      this.checkForUpdates();
      setInterval(() => this.checkForUpdates(), 60 * 60 * 1000);

      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateNotification();
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (this.userInitiatedUpdate) {
          window.location.reload();
        }
      });

    } catch (error) {
      console.error('SW registration failed:', error);
    }
  }

  /**
   * Called when PWA is successfully installed
   */
  async onPWAInstalled() {
    try {
      // 1. Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('🔔 Notification permission:', permission);
      }

      // 2. Register all scheduled alarms with service worker
      await this.registerAlarmsWithSW();

      // 3. Setup periodic background sync
      await this.setupPeriodicSync();

      // 4. Notify service worker that PWA was installed
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PWA_INSTALLED',
          timestamp: Date.now()
        });
      }

      // 5. Show confirmation notification
      if (Notification.permission === 'granted') {
        this.showInstallConfirmation();
      }

      console.log('✅ PWA installation setup complete');
    } catch (error) {
      console.error('Error during PWA install setup:', error);
    }
  }

  /**
   * Ensure alarms are registered (for already-installed PWA)
   */
  async ensureAlarmsRegistered() {
    const lastRegistration = localStorage.getItem('pwa_alarms_registered_at');
    const today = new Date().toDateString();

    // Re-register once per day to keep alarms fresh
    if (lastRegistration !== today) {
      await this.registerAlarmsWithSW();
      await this.setupPeriodicSync();
      localStorage.setItem('pwa_alarms_registered_at', today);
    }
  }

  /**
   * Register all user alarms with the service worker
   */
  async registerAlarmsWithSW() {
    if (!navigator.serviceWorker.controller) {
      // Wait for SW to be ready
      await navigator.serviceWorker.ready;
    }

    const alarms = this.collectAllAlarms();
    if (alarms.length === 0) {
      console.log('📋 No alarms to register');
      return;
    }

    // Persist alarms to localStorage for SW access
    localStorage.setItem('pwa_scheduled_alarms', JSON.stringify(alarms));

    // Send to service worker
    navigator.serviceWorker.controller?.postMessage({
      type: 'SET_ALARMS',
      alarms: alarms
    });

    console.log(`⏰ Registered ${alarms.length} alarms with Service Worker`);
  }

  /**
   * Collect all alarms from various sources
   */
  collectAllAlarms() {
    const alarms = [];
    const now = new Date();

    // 1. Smart Reminders
    const reminderKeys = ['sr_reminders_v4', 'sr_reminders_v3', 'smart_reminders_v1'];
    for (const key of reminderKeys) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          const reminders = Array.isArray(parsed) ? parsed :
            [...(parsed.core ? Object.values(parsed.core) : []), ...(parsed.custom || [])];

          reminders.forEach(r => {
            if (r.enabled && r.time) {
              alarms.push({
                id: `reminder_${r.id}`,
                type: 'smartReminder',
                title: r.title || r.label || 'Reminder',
                time: r.time,
                enabled: true
              });
            }
          });
          break;
        }
      } catch (e) { /* ignore */ }
    }

    // 2. Naam Abhyas Schedule
    try {
      // CRITICAL: Use correct storage keys matching naam-abhyas.js
      const naamConfig = localStorage.getItem('naam_abhyas_config');
      if (naamConfig) {
        const config = JSON.parse(naamConfig);
        if (config.enabled) {
          const history = localStorage.getItem('naam_abhyas_history');
          const historyData = history ? JSON.parse(history) : {};
          const today = now.toLocaleDateString('en-CA');
          const schedule = historyData.scheduleHistory?.[today] || {};

          Object.entries(schedule).forEach(([hour, session]) => {
            if (session && session.status === 'pending') {
              const sessionTime = new Date();
              sessionTime.setHours(parseInt(hour), session.startMinute, 0, 0);

              if (sessionTime > now) {
                alarms.push({
                  id: `naamAbhyas_${hour}_${session.startMinute}`,
                  type: 'naamAbhyas',
                  title: 'ਨਾਮ ਅਭਿਆਸ | Naam Abhyas',
                  time: `${String(hour).padStart(2, '0')}:${String(session.startMinute).padStart(2, '0')}`,
                  enabled: true,
                  data: { hour: parseInt(hour), startMinute: session.startMinute }
                });
              }
            }
          });
        }
      }
    } catch (e) { /* ignore */ }

    // 3. Gurupurab Reminders  
    try {
      const gurupurabReminders = localStorage.getItem('gurupurab_reminders');
      if (gurupurabReminders) {
        const reminders = JSON.parse(gurupurabReminders);
        if (Array.isArray(reminders)) {
          reminders.forEach(r => {
            if (r.enabled) {
              alarms.push({
                id: `gurupurab_${r.id}`,
                type: 'gurupurab',
                title: r.title || 'Gurupurab Reminder',
                time: r.time || '06:00',
                enabled: true
              });
            }
          });
        }
      }
    } catch (e) { /* ignore */ }

    return alarms;
  }

  /**
   * Setup periodic background sync for notifications
   */
  async setupPeriodicSync() {
    if (!this.registration) return;

    try {
      // Check if periodic sync is supported
      if ('periodicSync' in this.registration) {
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync',
        });

        if (status.state === 'granted') {
          // Register for notification checks every 15 minutes
          await this.registration.periodicSync.register('anhad-notification-check', {
            minInterval: 15 * 60 * 1000 // 15 minutes
          });
          console.log('✅ Periodic background sync registered (15 min interval)');

          // Register daily reminder sync
          await this.registration.periodicSync.register('anhad-daily-reminders', {
            minInterval: 60 * 60 * 1000 // 1 hour (for daily reminder checks)
          });
          console.log('✅ Daily reminder sync registered');
        } else {
          console.log('⚠️ Periodic sync permission not granted');
        }
      }

      // Also register one-time background sync as fallback
      if ('sync' in this.registration) {
        await this.registration.sync.register('anhad-alarm-sync');
        console.log('✅ One-time background sync registered');
      }
    } catch (error) {
      console.warn('Background sync setup failed:', error);
    }
  }

  /**
   * Show install confirmation notification
   */
  async showInstallConfirmation() {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('🙏 ANHAD Installed!', {
        body: 'You will now receive daily reminders for Nitnem, Rehras, and Naam Abhyas',
        icon: './assets/icons/icon-192x192.png',
        badge: './assets/icons/icon-72x72.png',
        tag: 'pwa-install-confirmation',
        requireInteraction: false,
        vibrate: [200, 100, 200]
      });
    } catch (e) {
      console.warn('Could not show install confirmation:', e);
    }
  }

  /**
   * Trigger PWA install prompt (for install buttons)
   */
  async promptInstall() {
    if (!this.deferredPrompt) {
      console.log('Install prompt not available');
      return { outcome: 'unavailable' };
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} install`);

    if (outcome === 'accepted') {
      this.deferredPrompt = null;
    }

    return { outcome };
  }

  checkForUpdates() {
    if (this.registration) {
      this.registration.update().catch(console.error);
    }
  }

  showUpdateNotification() {
    if (document.querySelector('.pwa-update-banner')) return;

    try {
      const dismissedAt = Number(localStorage.getItem(this.updateDismissKey) || '0');
      if (dismissedAt && (Date.now() - dismissedAt) < this.updateDismissTtlMs) {
        return;
      }
    } catch (e) { }

    this.updateAvailable = true;

    const banner = document.createElement('div');
    banner.className = 'pwa-update-banner';
    banner.innerHTML = `
      <div class="update-content">
        <span class="update-icon">✨</span>
        <span class="update-text">Update available</span>
      </div>
      <div class="update-actions">
        <button class="btn-update-now" id="pwaUpdateBtn">Update</button>
        <button class="btn-update-later" id="pwaLaterBtn">Later</button>
      </div>
    `;

    document.body.appendChild(banner);

    requestAnimationFrame(() => {
      banner.classList.add('visible');
    });

    document.getElementById('pwaUpdateBtn').addEventListener('click', () => {
      try {
        localStorage.removeItem(this.updateDismissKey);
      } catch (e) { }
      this.applyUpdate();
    });

    document.getElementById('pwaLaterBtn').addEventListener('click', () => {
      try {
        localStorage.setItem(this.updateDismissKey, String(Date.now()));
      } catch (e) { }
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 300);
    });
  }

  applyUpdate() {
    this.userInitiatedUpdate = true;
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
}

// Initialize and expose globally
let pwaManager = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    pwaManager = new PWAManager();
    window.pwaManager = pwaManager;
  });
} else {
  pwaManager = new PWAManager();
  window.pwaManager = pwaManager;
}
