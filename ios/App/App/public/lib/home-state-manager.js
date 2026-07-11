/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ANHAD HOME STATE MANAGER
 * Prevents unnecessary re-initialization when returning to Home page.
 * Makes navigation feel instant like a native app.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  const STATE_KEY = 'anhad_home_state_v1';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Home Page State Structure:
   * {
   *   timestamp: number,
   *   initialized: boolean,
   *   data: {
   *     greeting: string,
   *     nextGurpurab: object,
   *     nitnemProgress: object,
   *     sehajPaath: object,
   *     naamAbhyas: object,
   *     hukamDate: string
   *   },
   *   animations: {
   *     playedOnce: boolean
   *   },
   *   images: {
   *     currentSlot: string,
   *     preloaded: string[]
   *   }
   * }
   */

  const HomeStateManager = {
    
    /**
     * Check if Home page has been recently initialized
     * Returns true if state is fresh (< 5 minutes old)
     */
    isRecentlyInitialized() {
      try {
        const stateStr = sessionStorage.getItem(STATE_KEY);
        if (!stateStr) return false;
        
        const state = JSON.parse(stateStr);
        const age = Date.now() - (state.timestamp || 0);
        
        return state.initialized && age < CACHE_DURATION;
      } catch (e) {
        console.warn('[HomeState] Failed to check initialization:', e);
        return false;
      }
    },

    /**
     * Get cached state if available and fresh
     */
    getState() {
      try {
        const stateStr = sessionStorage.getItem(STATE_KEY);
        if (!stateStr) return null;
        
        const state = JSON.parse(stateStr);
        const age = Date.now() - (state.timestamp || 0);
        
        if (age >= CACHE_DURATION) {
          // Stale state, clear it
          this.clearState();
          return null;
        }
        
        return state;
      } catch (e) {
        console.warn('[HomeState] Failed to get state:', e);
        return null;
      }
    },

    /**
     * Save current Home page state
     */
    saveState(data = {}) {
      try {
        const state = {
          timestamp: Date.now(),
          initialized: true,
          data: data.data || {},
          animations: data.animations || { playedOnce: true },
          images: data.images || { currentSlot: '', preloaded: [] }
        };
        
        sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn('[HomeState] Failed to save state:', e);
      }
    },

    /**
     * Update specific data in state without full replacement
     */
    updateData(key, value) {
      try {
        const state = this.getState() || { timestamp: Date.now(), initialized: true, data: {}, animations: {}, images: {} };
        state.data[key] = value;
        state.timestamp = Date.now(); // Update timestamp on data change
        sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn('[HomeState] Failed to update data:', e);
      }
    },

    /**
     * Mark animations as played
     */
    markAnimationsPlayed() {
      try {
        const state = this.getState() || { timestamp: Date.now(), initialized: true, data: {}, animations: {}, images: {} };
        state.animations.playedOnce = true;
        sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn('[HomeState] Failed to mark animations:', e);
      }
    },

    /**
     * Check if startup animations have been played
     */
    hasPlayedAnimations() {
      const state = this.getState();
      return state?.animations?.playedOnce || false;
    },

    /**
     * Save current image state
     */
    saveImageState(slot, preloadedUrls = []) {
      try {
        const state = this.getState() || { timestamp: Date.now(), initialized: true, data: {}, animations: {}, images: {} };
        state.images = {
          currentSlot: slot,
          preloaded: preloadedUrls
        };
        sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn('[HomeState] Failed to save image state:', e);
      }
    },

    /**
     * Get saved image state
     */
    getImageState() {
      const state = this.getState();
      return state?.images || null;
    },

    /**
     * Clear state (on explicit refresh or data invalidation)
     */
    clearState() {
      try {
        sessionStorage.removeItem(STATE_KEY);
      } catch (e) {
        console.warn('[HomeState] Failed to clear state:', e);
      }
    },

    /**
     * Check if returning from navigation (not fresh load)
     */
    isReturningFromNavigation() {
      try {
        // Check if SPA navigation has happened
        if (window.performance && window.performance.navigation) {
          const navType = window.performance.navigation.type;
          // TYPE_BACK_FORWARD = 2
          if (navType === 2) return true;
        }

        // Check if we have session state (indicates we've been here before in this session)
        const hasSessionState = !!sessionStorage.getItem(STATE_KEY);
        
        // Check if page was loaded via bfcache
        const perfEntries = window.performance.getEntriesByType('navigation');
        if (perfEntries.length > 0) {
          const navEntry = perfEntries[0];
          // @ts-ignore - type not fully supported yet
          if (navEntry.type === 'back_forward') return true;
        }

        return hasSessionState;
      } catch (e) {
        return false;
      }
    }
  };

  // Export to global scope
  window.HomeStateManager = HomeStateManager;

  // Listen for page visibility changes to update timestamp
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      const state = HomeStateManager.getState();
      if (state) {
        // Page became visible, update timestamp to extend cache duration
        HomeStateManager.saveState(state);
      }
    }
  });

  // Listen for SPA navigation to preserve state
  window.addEventListener('anhad_page_changed', function() {
    // If we're leaving the home page, ensure state is saved
    if (document.documentElement.hasAttribute('data-anhad-home')) {
      const currentState = HomeStateManager.getState();
      if (currentState) {
        HomeStateManager.saveState(currentState);
      }
    }
  });

  console.log('[HomeState] Manager initialized');
})();
