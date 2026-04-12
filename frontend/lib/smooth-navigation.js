/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMOOTH NAVIGATION — View Transitions API for Persistent Mini Player
 *
 * Provides Spotify-like page transitions where the mini player stays visible
 * during navigation. Uses the View Transitions API with graceful fallback.
 *
 * Usage: window.navigateTo('./Page/page.html') instead of location.href
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  const GMP_ID = 'gmp';
  const STATE_KEY = 'anhad_global_audio';

  /**
   * Navigate to a URL - DISABLED View Transitions to remove push animation delay
   * @param {string} url - Destination URL
   * @param {Object} options - Navigation options
   */
  window.navigateTo = function(url, options = {}) {
    if (!url || typeof url !== 'string') {
      console.warn('[SmoothNav] Invalid URL provided');
      return;
    }

    // Handle external links normally
    if (url.startsWith('http') && !url.includes(window.location.hostname)) {
      window.open(url, '_blank');
      return;
    }

    // DISABLED: View Transitions API removed to eliminate push animation delay
    // Direct navigation for instant page loads
    preserveMiniPlayerState();
    window.location.href = url;
  };

  /**
   * Preserve current mini player state to localStorage
   */
  function preserveMiniPlayerState() {
    try {
      const currentState = localStorage.getItem(STATE_KEY);
      if (currentState) {
        const state = JSON.parse(currentState);
        // Mark that we're in a transition
        sessionStorage.setItem('anhad_navigating', 'true');
        sessionStorage.setItem('anhad_navigate_time', Date.now().toString());
      }
    } catch (e) {
      console.warn('[SmoothNav] Could not preserve state:', e);
    }
  }

  /**
   * Intercept all link clicks for smooth navigation
   */
  function setupLinkInterception() {
    // Don't intercept on player pages - they have their own audio
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.includes('gurbani-radio')) return;

    document.addEventListener('click', function(e) {
      // Find closest anchor tag
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Skip if it has specific attributes
      if (link.hasAttribute('data-no-transition') ||
          link.hasAttribute('download') ||
          link.target === '_blank') {
        return;
      }

      // Skip external links
      if (href.startsWith('http') && !href.includes(window.location.hostname)) {
        return;
      }

      // Skip hash-only links (smooth scroll)
      if (href.startsWith('#')) return;

      // Skip javascript: links
      if (href.startsWith('javascript:')) return;

      // This is a local page link - intercept it
      e.preventDefault();
      navigateTo(href);
    }, true);
  }

  /**
   * Check if we're navigating back and restore mini player instantly
   */
  function handleNavigationRestore() {
    const wasNavigating = sessionStorage.getItem('anhad_navigating');
    const navigateTime = parseInt(sessionStorage.getItem('anhad_navigate_time') || '0', 10);

    if (wasNavigating) {
      // Clear the navigation flags
      sessionStorage.removeItem('anhad_navigating');
      sessionStorage.removeItem('anhad_navigate_time');

      // Calculate time since navigation started
      const timeSinceNav = Date.now() - navigateTime;

      // If navigation was recent (within 5 seconds), force show mini player
      if (timeSinceNav < 5000) {
        // Dispatch event to signal that we should show mini player immediately
        window.dispatchEvent(new CustomEvent('anhadRestoreMiniPlayer', {
          detail: { timeSinceNav }
        }));

        // Also check localStorage directly
        try {
          const state = localStorage.getItem(STATE_KEY);
          if (state) {
            const parsed = JSON.parse(state);
            if (parsed.isPlaying) {
              // Add a class to body to indicate we should show mini player
              document.body.classList.add('gmp-should-be-visible');

              // Remove it after a short delay
              setTimeout(() => {
                document.body.classList.remove('gmp-should-be-visible');
              }, 100);
            }
          }
        } catch (e) {}
      }
    }
  }

  // Setup on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupLinkInterception();
      handleNavigationRestore();
    });
  } else {
    setupLinkInterception();
    handleNavigationRestore();
  }

  // Also handle when page becomes visible (for back navigation)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      handleNavigationRestore();
    }
  });

  console.log('[SmoothNav] Navigation system initialized');
})();
