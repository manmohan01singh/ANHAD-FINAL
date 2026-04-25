/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PWA MANAGER v4.0 - AGGRESSIVE AUTO-UPDATE (Updates within seconds)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * STRATEGY FOR INSTANT AUTO-UPDATES ON ALL DEVICES:
 * ─────────────────────────────────────────────────
 * 1. Polls version.json every 30 seconds (cache-busted)
 * 2. If server version differs from local, triggers SW update
 * 3. New SW installs → skipWaiting → claims clients → auto-reload
 * 4. No user interaction needed — completely silent
 * 5. On visibility change (app opens from background), checks immediately
 * 
 * Features:
 * ✅ PWA Installation Detection (appinstalled event)
 * ✅ Automatic Alarm Registration on Install
 * ✅ PeriodicSync Setup for Background Notifications
 * ✅ Naam Abhyas Schedule Persistence for Service Worker
 * ✅ INSTANT SILENT AUTO-UPDATE — No user interaction required
 * ✅ version.json polling every 30 seconds
 * ✅ Auto-reload on update
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class PWAManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.deferredPrompt = null;
    this.isInstalled = this.checkIfInstalled();
    this.pendingUpdateKey = 'pwa_pending_update';
    this.currentVersion = null;
    this.versionCheckInterval = null;
    this.isReloading = false;
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
        return;
      } catch (err) {
        console.warn('Capacitor orientation lock failed:', err.message);
      }
    }

    // Method 3: CSS-based orientation lock (fallback)
    // Add viewport meta tag to prevent rotation issues
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      const content = viewport.getAttribute('content');
      if (!content.includes('orientation=portrait')) {
        viewport.setAttribute('content', content + ', orientation=portrait');
      }
    }

    // Method 4: Listen for orientation changes and warn user
    window.addEventListener('orientationchange', () => {
      if (window.innerWidth > window.innerHeight && window.innerWidth <= 1024) {
        // Landscape mode detected on mobile/tablet
        console.warn('⚠️ Please rotate your device to portrait mode for the best experience');
      }
    });
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
      // AGGRESSIVE AUTO-UPDATE SYSTEM
      // The PWA will auto-update within seconds of a new deployment
      // ═══════════════════════════════════════════════════════════════════════

      // 1. Check for waiting worker on initial load — apply immediately
      if (this.registration.waiting) {
        console.log('[PWA] Update waiting on load — applying immediately');
        this.applyUpdateSilently();
      }

      // 2. Listen for new service worker installation
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        console.log('[PWA] New service worker found — monitoring');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New SW installed — applying update silently');
            this.applyUpdateSilently();
          }
        });
      });

      // 3. Handle controller change (when new SW takes control) → reload
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!this.isReloading) {
          console.log('[PWA] Controller changed — reloading for fresh content');
          this.isReloading = true;
          window.location.reload();
        }
      });

      // 4. Start aggressive version polling (every 30 seconds)
      this.startVersionPolling();

      // 5. Check immediately when app comes to foreground
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          console.log('[PWA] App became visible — checking for updates');
          this.checkVersionAndUpdate();
          this.checkForSWUpdate();
        }
      });

      // 6. Also check on focus
      window.addEventListener('focus', () => {
        this.checkVersionAndUpdate();
      });

      // 7. Force an SW update check right now
      this.checkForSWUpdate();

    } catch (error) {
      console.error('SW registration failed:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VERSION POLLING — Polls version.json every 30 seconds
  // This is the KEY mechanism for instant updates across all devices
  // ═══════════════════════════════════════════════════════════════════════════

  startVersionPolling() {
    // Get current version from localStorage or fetch it
    this.currentVersion = localStorage.getItem('anhad_app_version') || null;

    // Initial check
    this.checkVersionAndUpdate();

    // Poll every 30 seconds
    this.versionCheckInterval = setInterval(() => {
      this.checkVersionAndUpdate();
    }, 30 * 1000); // 30 seconds
  }

  async checkVersionAndUpdate() {
    try {
      // Cache-bust the version.json request
      const response = await fetch(`./version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) return;

      const data = await response.json();
      const serverVersion = data.version;

      console.log(`[PWA] Version check: local=${this.currentVersion} server=${serverVersion}`);

      if (!this.currentVersion) {
        // First load — just record the version
        this.currentVersion = serverVersion;
        localStorage.setItem('anhad_app_version', serverVersion);
        return;
      }

      if (serverVersion !== this.currentVersion) {
        console.log(`[PWA] 🔄 VERSION CHANGED: ${this.currentVersion} → ${serverVersion}`);
        console.log('[PWA] Triggering auto-update...');
        
        // Update stored version
        this.currentVersion = serverVersion;
        localStorage.setItem('anhad_app_version', serverVersion);

        // Force SW to check for update
        await this.checkForSWUpdate();

        // If there's a waiting worker, activate it immediately
        if (this.registration?.waiting) {
          this.applyUpdateSilently();
        } else {
          // No waiting worker yet — force clear caches and reload
          // This handles the case where the SW itself is identical
          // but app files have changed
          await this.forceClearAndReload();
        }
      }
    } catch (error) {
      // Offline or network error — silently ignore
      console.log('[PWA] Version check failed (offline?):', error.message);
    }
  }

  /**
   * Force the service worker to check for updates
   */
  async checkForSWUpdate() {
    if (this.registration) {
      try {
        await this.registration.update();
      } catch (e) {
        console.log('[PWA] SW update check failed:', e.message);
      }
    }
  }

  /**
   * Force clear all caches and reload — nuclear option for when files change
   * but the service worker hash hasn't
   */
  async forceClearAndReload() {
    if (this.isReloading) return;
    
    console.log('[PWA] Force clearing caches and reloading...');

    // Tell the SW to clear all caches
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'FORCE_CACHE_CLEAR'
      });
    }

    // Also clear caches from the client side
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // Wait a moment for cache clearing, then reload
    this.isReloading = true;
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  /**
   * Apply update silently without user interaction
   */
  applyUpdateSilently() {
    if (this.isReloading) return;
    
    console.log('[PWA] Applying update silently — no user action needed');
    
    // Remove any existing update notification banners
    const existingBanner = document.querySelector('.pwa-update-banner');
    if (existingBanner) existingBanner.remove();
    const existingNotif = document.getElementById('pwa-update-notification');
    if (existingNotif) existingNotif.remove();
    
    // Tell the waiting service worker to skip waiting and become active
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
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

  /**
   * Get the current app version
   * @returns {string} Current version or 'unknown'
   */
  getCurrentVersion() {
    return this.currentVersion || localStorage.getItem('anhad_app_version') || 'unknown';
  }

  /**
   * Force a manual update check
   * @returns {Promise<boolean>} Whether update is available
   */
  async forceUpdateCheck() {
    await this.checkVersionAndUpdate();
    await this.checkForSWUpdate();
    return !!this.registration?.waiting || !!this.registration?.installing;
  }

  /**
   * Show update notification (kept for backward compatibility but auto-applies)
   */
  showUpdateNotification() {
    console.log('[PWA] Update available - applying automatically');
    this.applyUpdateSilently();
  }

  /**
   * Apply update (legacy method - now redirects to silent apply)
   */
  applyUpdate() {
    this.applyUpdateSilently();
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
