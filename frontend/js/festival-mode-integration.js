/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FESTIVAL MODE INTEGRATION
 * Integrates Festival Mode with ANHAD's existing event system
 * 
 * Performance Requirements:
 * - Zero impact on startup performance
 * - Loads after critical resources
 * - Lazy initialization on first event check
 * - No memory leaks
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  /**
   * Festival Mode Integration Manager
   * Bridges Festival Mode with existing ANHAD event system
   */
  const FestivalIntegration = {
    _initialized: false,
    _checkInterval: null,

    /**
     * Initialize Festival Mode integration
     * Call this after DOM is ready and trendora-app.js is loaded
     */
    init() {
      if (this._initialized) return;

      // Wait for dependencies with retry limit
      if (!this._retryCount) this._retryCount = 0;
      
      if (!window.FestivalMode) {
        this._retryCount++;
        if (this._retryCount < 20) { // Max 10 seconds (20 * 500ms) - increased for slower devices
          setTimeout(() => this.init(), 500);
        } else {
          console.error('[Festival Integration] FestivalMode not loaded after 10 seconds, aborting initialization');
        }
        return;
      }

      this._initialized = true;
      console.log('[Festival Integration] ✅ Initialized successfully');
      
      // Check if today is a Gurpurab
      this._checkTodaysEvents();
      
      // Set up periodic check (every 5 minutes to catch midnight transitions)
      this._checkInterval = setInterval(() => {
        this._checkTodaysEvents();
      }, 5 * 60 * 1000);
      
      // Listen for event updates from the main app
      document.addEventListener('anhad:event-updated', (e) => {
        this._handleEventUpdate(e.detail);
      });
      
      console.log('[Festival Integration] Initialized successfully');
    },

    /**
     * Check today's events and activate Festival Mode if applicable
     * @private
     */
    async _checkTodaysEvents() {
      try {
        console.log('[Festival Integration] 🔍 Checking today\'s events...');
        
        // Check localStorage cache for today's Gurpurab
        const cached = this._getCachedUpcomingEvent();
        
        console.log('[Festival Integration] 📦 Cached event data:', cached);
        
        if (cached && cached.isToday && cached.events && cached.events.length > 0) {
          console.log('[Festival Integration] 🎉 TODAY IS A GURPURAB!', cached.events[0]);
          this._activateFestivalMode(cached.events[0]);
          console.log('[Festival Integration] ✅ Activated from cache:', cached.events[0].name_en || cached.events[0].name_pa);
        } else {
          console.log('[Festival Integration] ℹ️ No Gurpurab today');
          // No Gurpurab today
          window.FestivalMode.deactivate();
        }
      } catch (error) {
        console.error('[Festival Integration] ❌ Error checking events:', error);
      }
    },

    /**
     * Get cached upcoming event from localStorage
     * @private
     * @returns {Object|null}
     */
    _getCachedUpcomingEvent() {
      try {
        const cached = localStorage.getItem('anhad_cached_upcoming_gurpurab');
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {
        console.warn('[Festival Integration] Failed to parse cached event:', e);
      }
      return null;
    },

    /**
     * Cache event data for instant activation
     * @private
     */
    _cacheEvent(data) {
      try {
        localStorage.setItem('anhad_cached_upcoming_gurpurab', JSON.stringify(data));
      } catch (e) {
        console.warn('[Festival Integration] Failed to cache event:', e);
      }
    },

    /**
     * Activate Festival Mode for given event
     * @private
     */
    _activateFestivalMode(event) {
      if (!window.FestivalMode || !event) {
        console.error('[Festival Integration] ❌ Cannot activate - FestivalMode or event missing');
        return;
      }
      
      console.log('[Festival Integration] 🚀 Attempting to activate Festival Mode for:', event);
      
      // Check if Festival Mode should activate for this event
      if (window.FestivalMode.shouldActivate(event)) {
        console.log('[Festival Integration] ✅ Event qualifies for celebration mode');
        window.FestivalMode.activate(event);
        
        // Sync with portrait slider if available
        if (window.PortraitSlider && window.PortraitSlider.setGuruById) {
          window.PortraitSlider.setGuruById(event);
        }
      } else {
        console.log('[Festival Integration] ℹ️ Event does not qualify for celebration (e.g., Shaheedi)');
        // Event doesn't qualify for celebration (e.g., Shaheedi)
        window.FestivalMode.deactivate();
      }
    },

    /**
     * Handle event update from main app
     * @private
     */
    _handleEventUpdate(eventData) {
      if (!eventData) return;
      
      if (eventData.isToday && eventData.events && eventData.events.length > 0) {
        this._activateFestivalMode(eventData.events[0]);
      } else {
        window.FestivalMode.deactivate();
      }
    },

    /**
     * Clean up resources
     */
    destroy() {
      if (this._checkInterval) {
        clearInterval(this._checkInterval);
        this._checkInterval = null;
      }
      
      if (window.FestivalMode) {
        window.FestivalMode.deactivate();
      }
      
      this._initialized = false;
    }
  };

  /**
   * Listen for event card updates from the main app
   * The main app will dispatch 'anhad:event-updated' events
   */
  function setupEventListener() {
    document.addEventListener('anhad:event-updated', (e) => {
      if (FestivalIntegration._initialized && e.detail) {
        FestivalIntegration._handleEventUpdate(e.detail);
      }
    });
    
    console.log('[Festival Integration] Event listener registered');
  }

  /**
   * Auto-initialize when DOM is ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Delay initialization to not block critical rendering
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          FestivalIntegration.init();
          setupEventListener();
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          FestivalIntegration.init();
          setupEventListener();
        }, 1500);
      }
    });
  } else {
    // DOM already loaded
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        FestivalIntegration.init();
        setupEventListener();
      }, { timeout: 2000 });
    } else {
      setTimeout(() => {
        FestivalIntegration.init();
        setupEventListener();
      }, 1500);
    }
  }

  // Expose to window for manual control if needed
  window.FestivalIntegration = FestivalIntegration;

  // Battery optimization: Detect low battery and reduce animation intensity
  if ('getBattery' in navigator) {
    navigator.getBattery().then(battery => {
      function updateBatteryStatus() {
        if (battery.level < 0.2 && !battery.charging) {
          // Battery below 20% and not charging - enable low battery mode
          document.documentElement.classList.add('low-battery');
          console.log('[Festival Integration] Low battery mode enabled');
        } else {
          document.documentElement.classList.remove('low-battery');
        }
      }
      
      battery.addEventListener('levelchange', updateBatteryStatus);
      battery.addEventListener('chargingchange', updateBatteryStatus);
      updateBatteryStatus();
    }).catch(err => {
      console.warn('[Festival Integration] Battery API not available:', err);
    });
  }

  // Performance monitoring: Log Festival Mode impact
  if (window.performance && window.performance.mark) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (window.FestivalMode && window.FestivalMode.isActive()) {
          performance.mark('festival-mode-active');
          console.log('[Festival Integration] Festival Mode performance metrics available');
        }
      }, 1000);
    });
  }

  console.log('[Festival Integration] Module loaded');

})();
