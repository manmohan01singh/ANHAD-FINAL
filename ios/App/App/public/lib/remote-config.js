/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD REMOTE CONFIGURATION & CAMPAIGN ENGINE
 * 
 * Multi-Tiered Architecture:
 *   1. Fresh Remote Config (GET /api/config/campaigns)
 *   2. Cached Valid Configuration (localStorage with TTL)
 *   3. Built-in Safe Defaults (Zero single point of failure)
 * 
 * Supports:
 *   - Automatic schedule activation/deactivation (Start/End dates)
 *   - Chaliya Amritvela Trust 2026 & future Gurpurabs/Samagams
 *   - Feature flags & platform targeting (Web/Android)
 *   - Dynamic Hero Takeover, Banners, and Announcements
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function(window) {
  'use strict';

  // Defensive re-entrancy guard, matching the pattern used by
  // campaign-renderer.js and anhad-audio-singleton.js: if this file is ever
  // double-included on one page, this stops a second RemoteConfigManager
  // instance from spinning up its own permanent 15s poll + duplicate
  // online/visibilitychange listeners alongside an orphaned first instance.
  if (window.AnhadCampaigns) return;

  const CONFIG_CACHE_KEY = 'anhad_remote_config_cache_v1';
  const CONFIG_CACHE_TTL = 3600000; // 1 Hour — past this the cache is served but treated as stale
  // An admin toggle must reach open devices quickly, so poll while the app is
  // in the foreground. Paused entirely while hidden (see startPolling) so a
  // backgrounded app costs nothing.
  const POLL_INTERVAL_MS = 15000;

  const SAFE_BUILTIN_CONFIG = {
    version: '1.0.0',
    featureFlags: {
      enableVirtualLive: true,
      enableSadhsangatAutoRefresh: true,
      enableDynamicSky: true,
      enableCampaignHeroTakeover: true
    },
    campaigns: [
      {
        id: 'chaliya-amritvela-2026',
        title: 'Chaliya Amritvela Trust 2026',
        subtitle: '40 Days of Divine Naam Simran & Nitnem Practice',
        type: 'spiritual_event',
        priority: 100,
        platforms: ['web', 'android', 'ios'],
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
        // ON. The consumption layer is now the in-greeting rotating
        // announcement, which swaps in place of the Guru portraits and cycles
        // back — it takes no extra space and has no dismiss control, so having
        // it live is not the takeover the old dismissible card would have been.
        // NOTE: startDate/endDate above still span all of 2026. Narrow them to
        // the real 40-day Chaliya window before release.
        active: false,
        content: {
          badgeText: 'CHALIYA 2026',
          heroTitle: 'Chaliya Amritvela 2026',
          heroSubtitle: 'Join thousands in the annual 40-day Amritvela Simran Abhyaas',
          ctaText: 'Join Amritvela',
          ctaAction: 'STREAM:amritvela',
          announcement: {
            icon: '✨',
            title: 'Amritvela Chaliya 2026 In Progress',
            message: 'Awaken during Amritvela (3:00 AM – 6:00 AM) for collective Nitnem & Waheguru Simran.',
            actionLabel: 'Open Nitnem Tracker',
            actionUrl: 'NitnemTracker/nitnem-tracker.html'
          },
          banner: {
            enabled: true,
            text: 'ੴ Annual Chaliya 2026 — Amritvela Trust',
            link: 'GurbaniRadio/gurbani-radio.html?stream=amritvela',
            accentColor: '#D4AF37'
          },
          // Copy for the in-greeting rotating announcement (State B). Short by
          // necessity: it renders inside the 152px portrait disc and the
          // greeting text block, both of which are fixed-size boxes.
          // Copy for the in-greeting announcement (State B). Kept short because
          // it renders inside the 148px portrait disc and the greeting text box,
          // both fixed-size; campaign-renderer.js clamps it as a backstop.
          announce: {
            badge: 'CHALIYA 2026',
            title: 'Chaliya Coming Soon',
            line: '',
            sub: '',
            pill: '',
            image: 'assets/Darbar-sahib-AMRITVELA.webp'
          },
          themeTokens: {
            accentGlow: 'rgba(212, 175, 55, 0.3)',
            badgeBackground: 'linear-gradient(135deg, #8A6D3B 0%, #D4AF37 100%)'
          }
        }
      }
    ]
  };

  const API_BASE = (() => {
    try {
      if (window.Capacitor && ((typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) || (typeof window.Capacitor.getPlatform === 'function' && window.Capacitor.getPlatform() !== 'web') || window.Capacitor.isNative)) return 'https://anhad-final.onrender.com';
      const port = window.location.port;
      const host = window.location.hostname;
      if (port === '3000' || port === '3001' || host === 'localhost' || host === '127.0.0.1') {
        return `${window.location.protocol}//${host}${port ? `:${port}` : ''}`;
      }
    } catch(e) {}
    return 'https://anhad-final.onrender.com';
  })();

  class RemoteConfigManager {
    constructor() {
      this.cacheIsStale = false;
      // Where this.config actually came from: 'remote' | 'cache' | 'builtin'.
      // Consumers need this to distinguish an authoritative "nothing is
      // active" (the owner switched a campaign off) from "this device has
      // never heard from the server". Only the latter may fall back to the
      // built-in — otherwise a deliberately disabled campaign resurrects
      // itself on every offline device. loadCachedConfig() sets 'cache' on a
      // hit; assigning 'builtin' first makes the miss path correct.
      this.source = 'builtin';
      this.config = this.loadCachedConfig() || SAFE_BUILTIN_CONFIG;
      this.isOnline = navigator.onLine !== false;
      this._pollTimer = null;
      this._lastPayload = null;
      this.init();
    }

    init() {
      // PERF: cached/built-in config is already available synchronously via
      // loadCachedConfig() above, so the network refresh is not on the critical
      // path for first paint/interaction — defer it to idle time (same pattern
      // as trendora-app.js's Hukamnama hero-card fetch).
      // Exception: if the cache is past its TTL we no longer trust it, so fetch
      // straight away rather than waiting for an idle slot.
      if (this.cacheIsStale) {
        this.fetchRemoteConfig();
      } else if ('requestIdleCallback' in window) {
        requestIdleCallback(() => this.fetchRemoteConfig(), { timeout: 2000 });
      } else {
        setTimeout(() => this.fetchRemoteConfig(), 1000);
      }

      // Listen for network recovery
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.fetchRemoteConfig();
      });

      // Coming back to the foreground is the most likely moment for the config
      // to have changed since the user last looked.
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stopPolling();
        } else {
          this.fetchRemoteConfig();
          this.startPolling();
        }
      });

      if (!document.hidden) this.startPolling();
    }

    startPolling() {
      if (this._pollTimer) return;
      this._pollTimer = setInterval(() => {
        if (document.hidden) return;
        this.fetchRemoteConfig();
      }, POLL_INTERVAL_MS);
    }

    stopPolling() {
      if (!this._pollTimer) return;
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }

    loadCachedConfig() {
      try {
        const raw = localStorage.getItem(CONFIG_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.data && parsed.timestamp) {
          // Soft expiration: serve the cached data either way (it is far better
          // than nothing when offline), but record staleness so init() can skip
          // the idle deferral. The TTL constant was previously declared and
          // never read, which made a cached config effectively immortal.
          this.cacheIsStale = (Date.now() - parsed.timestamp) > CONFIG_CACHE_TTL;
          this.source = 'cache';
          return parsed.data;
        }
      } catch (e) {
        console.warn('[RemoteConfig] Cache read error:', e);
      }
      return null;
    }

    saveCachedConfig(data) {
      try {
        localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('[RemoteConfig] Cache write error:', e);
      }
    }

    async fetchRemoteConfig() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const resp = await fetch(`${API_BASE}/api/config/campaigns?t=${Date.now()}`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (data && Array.isArray(data.campaigns)) {
          // Only notify when something actually changed — otherwise a 15s poll
          // would re-render the campaign UI four times a minute forever.
          const payload = JSON.stringify(data);
          const changed = payload !== this._lastPayload;
          this._lastPayload = payload;
          this.config = data;
          this.cacheIsStale = false;
          this.source = 'remote';
          this.saveCachedConfig(data);
          if (changed) this.notifyCampaignChange();
        }
      } catch (e) {
        // Fallback gracefully to cache or built-in default. Never throw: a
        // campaign system must not be able to break the app it decorates.
        console.log('[RemoteConfig] Using local/fallback config:', e.message);
      }
    }

    notifyCampaignChange() {
      try {
        const active = this.getActiveCampaign();
        window.dispatchEvent(new CustomEvent('anhadCampaignUpdated', {
          detail: { activeCampaign: active, config: this.config }
        }));
      } catch (e) {}
    }

    getCurrentPlatform() {
      if (window.Capacitor) {
        if (typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
          return (typeof window.Capacitor.getPlatform === 'function' ? window.Capacitor.getPlatform() : 'android') || 'android';
        }
        if (typeof window.Capacitor.getPlatform === 'function' && window.Capacitor.getPlatform() !== 'web') {
          return window.Capacitor.getPlatform();
        }
        if (window.Capacitor.isNative) {
          return (typeof window.Capacitor.getPlatform === 'function' ? window.Capacitor.getPlatform() : 'android') || 'android';
        }
      }
      return 'web';
    }

    getActiveCampaign() {
      if (!this.config || !Array.isArray(this.config.campaigns)) return null;

      const now = new Date();
      const platform = this.getCurrentPlatform();

      const validCampaigns = this.config.campaigns.filter(c => {
        if (!c.active) return false;
        if (c.startDate && new Date(c.startDate) > now) return false;
        if (c.endDate && new Date(c.endDate) < now) return false;
        if (Array.isArray(c.platforms) && !c.platforms.includes(platform) && !c.platforms.includes('all')) {
          return false;
        }
        return true;
      });

      if (!validCampaigns.length) return null;

      // Sort by highest priority
      validCampaigns.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      return validCampaigns[0];
    }

    isFeatureEnabled(flagName, defaultValue = false) {
      if (this.config && this.config.featureFlags && flagName in this.config.featureFlags) {
        return !!this.config.featureFlags[flagName];
      }
      return defaultValue;
    }

    getConfig() {
      return this.config;
    }

    /**
     * 'remote' | 'cache' | 'builtin' — the provenance of the current config.
     * See the note in the constructor for why callers must branch on this
     * rather than treating a null active campaign as "no config".
     */
    getSource() {
      return this.source;
    }
  }

  const manager = new RemoteConfigManager();
  window.AnhadCampaigns = manager;

})(typeof window !== 'undefined' ? window : globalThis);
