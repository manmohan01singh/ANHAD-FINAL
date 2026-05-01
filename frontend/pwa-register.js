/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PWA MANAGER v4.1 - SAFE AUTO-UPDATE (No infinite refresh loops)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * STRATEGY FOR AUTO-UPDATES ON ALL DEVICES:
 * ──────────────────────────────────────────
 * 1. Polls version.json every 60 seconds (cache-busted)
 * 2. If server version differs from local, triggers SW update check
 * 3. New SW installs → skipWaiting → claims clients → ONE reload
 * 4. Uses sessionStorage cooldown to prevent infinite refresh loops
 * 5. On visibility change (app opens from background), checks immediately
 * 
 * ANTI-LOOP PROTECTION:
 * ─────────────────────
 * - sessionStorage tracks reload timestamps to prevent loops
 * - 30-second cooldown after any reload
 * - controllerchange only reloads ONCE per session
 * - Never clears caches from client side (let SW handle it)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class PWAManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.deferredPrompt = null;
    this.isInstalled = this.checkIfInstalled();
    this.currentVersion = null;
    this.versionCheckInterval = null;
    this._hasReloaded = false; // in-memory guard
    this.init();
  }

  /**
   * ANTI-LOOP: Check if we recently reloaded for an update.
   * Uses sessionStorage so it persists across the reload but not across sessions.
   */
  _isInReloadCooldown() {
    try {
      const lastReload = sessionStorage.getItem('pwa_reload_at');
      if (lastReload) {
        const elapsed = Date.now() - parseInt(lastReload, 10);
        // 30 second cooldown — if we reloaded within 30s, don't reload again
        if (elapsed < 30000) {
          console.log(`[PWA] Reload cooldown active (${Math.round(elapsed/1000)}s ago)`);
          return true;
        }
      }
    } catch (e) { /* sessionStorage not available */ }
    return false;
  }

  /**
   * ANTI-LOOP: Mark that we're about to reload.
   */
  _markReload() {
    try {
      sessionStorage.setItem('pwa_reload_at', Date.now().toString());
    } catch (e) { /* ignore */ }
    this._hasReloaded = true;
  }

  /**
   * Safe reload — only reloads if not in cooldown
   */
  _safeReload(reason) {
    if (this._hasReloaded || this._isInReloadCooldown()) {
      console.log(`[PWA] Skipping reload (${reason}) — cooldown active`);
      return;
    }
    console.log(`[PWA] Reloading: ${reason}`);
    this._markReload();
    window.location.reload();
  }

  /**
   * Check if app is already installed as PWA
   */
  checkIfInstalled() {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.navigator.standalone === true) return true;
    if (document.referrer.includes('android-app://')) return true;
    return false;
  }

  /**
   * Lock screen orientation to portrait for mobile devices
   */
  async lockOrientation() {
    if (window.innerWidth > 1024) return;

    if ('screen' in window && 'orientation' in window.screen && 'lock' in window.screen.orientation) {
      try {
        await window.screen.orientation.lock('portrait-primary');
        console.log('🔒 Screen orientation locked to portrait');
        return;
      } catch (err) {
        console.warn('Screen orientation lock failed:', err.message);
      }
    }

    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.ScreenOrientation) {
      try {
        await window.Capacitor.Plugins.ScreenOrientation.lock({ orientation: 'portrait' });
        console.log('🔒 Capacitor orientation locked to portrait');
        return;
      } catch (err) {
        console.warn('Capacitor orientation lock failed:', err.message);
      }
    }

    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      const content = viewport.getAttribute('content');
      if (!content.includes('orientation=portrait')) {
        viewport.setAttribute('content', content + ', orientation=portrait');
      }
    }

    window.addEventListener('orientationchange', () => {
      if (window.innerWidth > window.innerHeight && window.innerWidth <= 1024) {
        console.warn('⚠️ Please rotate your device to portrait mode for the best experience');
      }
    });
  }

  async init() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    // CRITICAL: Skip ALL service worker logic in Capacitor native apps
    // SW registration + controllerchange + version polling cause infinite reload loops
    // inside the Android/iOS WebView where content is served from bundled assets
    const isCapacitor = typeof window.Capacitor !== 'undefined' ||
                        navigator.userAgent.includes('Capacitor');
    if (isCapacitor) {
      console.log('[PWA] Running in Capacitor — skipping SW registration & version polling');
      this.lockOrientation();
      return;
    }

    this.lockOrientation();

    try {
      this.registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './'
      });

      console.log('SW registered:', this.registration.scope);

      // ═══════════════════════════════════════════════════════════════════════
      // PWA INSTALLATION DETECTION
      // ═══════════════════════════════════════════════════════════════════════

      window.addEventListener('appinstalled', () => {
        console.log('✅ PWA Installed - registering alarms and notifications');
        this.deferredPrompt = null;
        this.isInstalled = true;
        localStorage.setItem('pwa_installed', 'true');
        localStorage.setItem('pwa_installed_at', new Date().toISOString());
        this.onPWAInstalled();
      });

      if (this.isInstalled) {
        console.log('📱 Running as installed PWA - ensuring alarms are registered');
        await this.ensureAlarmsRegistered();
      }

      // ═══════════════════════════════════════════════════════════════════════
      // SAFE AUTO-UPDATE SYSTEM (with anti-loop protection)
      // ═══════════════════════════════════════════════════════════════════════

      // 1. If there's a waiting worker on load, activate it (will trigger controllerchange → reload)
      if (this.registration.waiting) {
        console.log('[PWA] Update waiting on load — activating');
        this.applyUpdateSilently();
      }

      // 2. Listen for new service worker installation
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        console.log('[PWA] New service worker installing...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New SW ready — activating silently');
            this.applyUpdateSilently();
          }
        });
      });

      // 3. Handle controller change → reload ONCE (with cooldown guard)
      let controllerChangeHandled = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (controllerChangeHandled) return;
        controllerChangeHandled = true;
        this._safeReload('controllerchange');
      });

      // 4. Start version polling (every 60 seconds)
      this.startVersionPolling();

      // 5. Check when app comes to foreground
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.checkVersionAndUpdate();
        }
      });

      // 6. Force an SW update check right now
      this.checkForSWUpdate();

    } catch (error) {
      console.error('SW registration failed:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VERSION POLLING — Polls version.json every 60 seconds
  // ═══════════════════════════════════════════════════════════════════════════

  startVersionPolling() {
    this.currentVersion = localStorage.getItem('anhad_app_version') || null;

    // Initial check (delayed slightly to let page settle)
    setTimeout(() => this.checkVersionAndUpdate(), 3000);

    // Poll every 10 seconds for instant updates
    this.versionCheckInterval = setInterval(() => {
      this.checkVersionAndUpdate();
    }, 10 * 1000);
  }

  async checkVersionAndUpdate() {
    // Don't check if we're in a reload cooldown
    if (this._hasReloaded || this._isInReloadCooldown()) return;

    try {
      const response = await fetch(`./version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) return;

      const data = await response.json();
      const serverVersion = data.version;

      if (!this.currentVersion) {
        // First load — just record the version, don't trigger anything
        this.currentVersion = serverVersion;
        localStorage.setItem('anhad_app_version', serverVersion);
        console.log(`[PWA] Version initialized: ${serverVersion}`);
        return;
      }

      if (serverVersion !== this.currentVersion) {
        console.log(`[PWA] 🔄 VERSION CHANGED: ${this.currentVersion} → ${serverVersion}`);
        
        // Update stored version FIRST (so after reload it won't re-trigger)
        this.currentVersion = serverVersion;
        localStorage.setItem('anhad_app_version', serverVersion);

        // Stop polling — we found a change, no need to keep checking
        if (this.versionCheckInterval) {
          clearInterval(this.versionCheckInterval);
          this.versionCheckInterval = null;
        }

        // Trigger SW update check — this will find the new sw.js
        await this.checkForSWUpdate();

        // If there's a waiting worker, activate it (will trigger controllerchange → reload)
        if (this.registration?.waiting) {
          this.applyUpdateSilently();
        } else {
          // SW hasn't changed but app files have — just reload once to get fresh content
          // The stale-while-revalidate strategy means the SW already cached fresh files
          // in the background, so a simple reload will serve them
          this._safeReload('version changed — refreshing for new content');
        }
      }
    } catch (error) {
      // Offline — silently ignore
    }
  }

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
   * Apply update silently — tell waiting SW to skip waiting.
   * This will trigger 'controllerchange' which calls _safeReload().
   */
  applyUpdateSilently() {
    console.log('[PWA] Telling waiting SW to skip waiting');
    
    // Remove any existing update notification banners
    const existingBanner = document.querySelector('.pwa-update-banner');
    if (existingBanner) existingBanner.remove();
    const existingNotif = document.getElementById('pwa-update-notification');
    if (existingNotif) existingNotif.remove();
    
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  /**
   * Called when PWA is successfully installed
   */
  async onPWAInstalled() {
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('🔔 Notification permission:', permission);
      }

      await this.registerAlarmsWithSW();
      await this.setupPeriodicSync();

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PWA_INSTALLED',
          timestamp: Date.now()
        });
      }

      if (Notification.permission === 'granted') {
        this.showInstallConfirmation();
      }

      console.log('✅ PWA installation setup complete');
    } catch (error) {
      console.error('Error during PWA install setup:', error);
    }
  }

  async ensureAlarmsRegistered() {
    const lastRegistration = localStorage.getItem('pwa_alarms_registered_at');
    const today = new Date().toDateString();

    if (lastRegistration !== today) {
      await this.registerAlarmsWithSW();
      await this.setupPeriodicSync();
      localStorage.setItem('pwa_alarms_registered_at', today);
    }
  }

  async registerAlarmsWithSW() {
    if (!navigator.serviceWorker.controller) {
      await navigator.serviceWorker.ready;
    }

    const alarms = this.collectAllAlarms();
    if (alarms.length === 0) {
      console.log('📋 No alarms to register');
      return;
    }

    localStorage.setItem('pwa_scheduled_alarms', JSON.stringify(alarms));

    navigator.serviceWorker.controller?.postMessage({
      type: 'SET_ALARMS',
      alarms: alarms
    });

    console.log(`⏰ Registered ${alarms.length} alarms with Service Worker`);
  }

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

  async setupPeriodicSync() {
    if (!this.registration) return;

    try {
      if ('periodicSync' in this.registration) {
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync',
        });

        if (status.state === 'granted') {
          await this.registration.periodicSync.register('anhad-notification-check', {
            minInterval: 15 * 60 * 1000
          });
          console.log('✅ Periodic background sync registered (15 min interval)');

          await this.registration.periodicSync.register('anhad-daily-reminders', {
            minInterval: 60 * 60 * 1000
          });
          console.log('✅ Daily reminder sync registered');
        } else {
          console.log('⚠️ Periodic sync permission not granted');
        }
      }

      if ('sync' in this.registration) {
        await this.registration.sync.register('anhad-alarm-sync');
        console.log('✅ One-time background sync registered');
      }
    } catch (error) {
      console.warn('Background sync setup failed:', error);
    }
  }

  async showInstallConfirmation() {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('🙏 ANHAD Installed!', {
        body: 'You will now receive daily reminders for Nitnem, Rehras, and Naam Abhyas',
        icon: './assets/icon-192x192.png',
        badge: './assets/icon-72x72.png',
        tag: 'pwa-install-confirmation',
        requireInteraction: false,
        vibrate: [200, 100, 200]
      });
    } catch (e) {
      console.warn('Could not show install confirmation:', e);
    }
  }

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

  getCurrentVersion() {
    return this.currentVersion || localStorage.getItem('anhad_app_version') || 'unknown';
  }

  async forceUpdateCheck() {
    await this.checkVersionAndUpdate();
    await this.checkForSWUpdate();
    return !!this.registration?.waiting || !!this.registration?.installing;
  }

  showUpdateNotification() {
    console.log('[PWA] Update available - applying automatically');
    this.applyUpdateSilently();
  }

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
