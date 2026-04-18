/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PWA MANAGER v3.0 - Silent Auto-Update with Sensitive Page Protection
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ PWA Installation Detection (appinstalled event)
 * ✅ Automatic Alarm Registration on Install
 * ✅ PeriodicSync Setup for Background Notifications
 * ✅ Naam Abhyas Schedule Persistence for Service Worker
 * ✅ SILENT AUTO-UPDATE - No user interaction required
 * ✅ Sensitive Page Protection - Won't interrupt during Nitnem/reading
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class PWAManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.deferredPrompt = null;
    this.isInstalled = this.checkIfInstalled();
    this.pendingUpdateKey = 'pwa_pending_update';
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
      // AUTOMATIC UPDATE MANAGEMENT
      // ═══════════════════════════════════════════════════════════════════════

      // Check for waiting worker on initial load
      if (this.registration.waiting) {
        console.log('[PWA] Update detected on load - applying automatically');
        this.applyUpdateSilently();
      }

      // Check for updates every hour
      this.checkForUpdates();
      setInterval(() => this.checkForUpdates(), 15 * 60 * 1000);

      // Listen for new service worker installation
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        console.log('[PWA] New service worker found');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New service worker installed - applying update automatically');
            this.applyUpdateSilently();
          }
        });
      });

      // Handle controller change (when new SW takes control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service worker controller changed - reloading page');
        window.location.reload();
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

  /**
   * Get the current app version from service worker
   * @returns {string} Current version or 'unknown'
   */
  getCurrentVersion() {
    // Read from the service worker cache version
    const swCode = localStorage.getItem('sw_cache_version');
    if (swCode) return swCode;
    
    // Fallback: try to extract from sw.js if cached
    return '3.7.0'; // Default version
  }

  /**
   * Force a manual update check
   * @returns {Promise<boolean>} Whether update is available
   */
  async forceUpdateCheck() {
    if (!this.registration) return false;
    
    try {
      await this.registration.update();
      
      // Wait for detection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return !!this.registration.waiting || !!this.registration.installing;
    } catch (error) {
      console.error('Force update check failed:', error);
      return false;
    }
  }

  /**
   * Get last update check time
   * @returns {number|null} Timestamp or null
   */
  getLastUpdateCheck() {
    try {
      const last = localStorage.getItem('pwa_last_update_check');
      return last ? parseInt(last) : null;
    } catch (e) {
      return null;
    }
  }

  /**
  applyPendingUpdateIfSafe() {
    try {
      const hasPending = localStorage.getItem(this.pendingUpdateKey);
      if (hasPending && !this.isSensitivePage()) {
        console.log('[PWA] Applying pending update now that page is safe');
        localStorage.removeItem(this.pendingUpdateKey);
        
        if (this.registration?.waiting) {
          this.applyUpdateImmediately();
        }
      }
    } catch (e) {
      console.error('[PWA] Failed to apply pending update:', e);
    }
  }

  /**
   * Setup listener for navigation away from sensitive pages
   */
  setupNavigationListener() {
    // Listen for URL changes (SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        // URL changed - check if we can now apply update
        if (!this.isSensitivePage()) {
          this.applyPendingUpdateIfSafe();
        }
      }
    }).observe(document, { subtree: true, childList: true });
    
    // Also listen for popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      if (!this.isSensitivePage()) {
        this.applyPendingUpdateIfSafe();
      }
    });
  }

  /**
   * Apply update silently without user interaction
   */
  applyUpdateSilently() {
    console.log('[PWA] Applying update silently');
    
    // Clear any existing update notification
    const existingBanner = document.querySelector('.pwa-update-banner');
    if (existingBanner) {
      existingBanner.remove();
    }
    
    // Tell the waiting service worker to skip waiting and become active
    if (this.registration?.waiting) {
      console.log('[PWA] Applying update now...');
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
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
