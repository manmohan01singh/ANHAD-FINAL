/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD — Page Lifecycle Recovery v1.0
 *
 * Fixes the critical bfcache (back-forward cache) bug:
 * When the user presses the Android/iOS back button, the browser restores
 * the previous page from its cache WITH all CSS classes still applied.
 * This means exit animations (opacity:0, blur) remain, leaving the page
 * invisible. This script cleans up ALL stuck states on page restore.
 *
 * Include on EVERY page: <script src="../lib/page-lifecycle.js"></script>
 * ═══════════════════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  // ─── PAGESHOW: Runs when page is shown (including bfcache restore) ───
  window.addEventListener('pageshow', function (event) {
    // Always clean up, whether from bfcache (persisted=true) or fresh load
    recoverPageState(event.persisted);
  });

  // ─── PAGEHIDE: Proactively clean up BEFORE bfcache stores the page ───
  window.addEventListener('pagehide', function () {
    cleanBeforeCache();
  });

  // ─── Also handle visibilitychange for tab-switch edge cases ───
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      // Small delay to let the rendering pipeline settle
      requestAnimationFrame(function () {
        recoverPageState(false);
      });
    }
  });

  /**
   * Main recovery function — called on pageshow and visibilitychange.
   * Removes ALL stuck CSS states that could make the page appear broken.
   */
  function recoverPageState(fromBfcache) {
    // 1. Fix stuck exit animation on .app container
    var apps = document.querySelectorAll('.app, .app-container, [class*="app"]');
    for (var i = 0; i < apps.length; i++) {
      var app = apps[i];
      app.classList.remove('app--exiting');
      // Force-reset inline styles that exit animations may have applied
      app.style.opacity = '';
      app.style.transform = '';
      app.style.filter = '';
      app.style.pointerEvents = '';
      app.style.visibility = '';
    }

    // 2. Unlock body scroll (modals/sheets may have locked it)
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.documentElement.style.overflow = '';

    // 3. Close ALL stuck overlays, sheets, modals
    var overlaySelectors = [
      '.sheet-overlay--active',
      '.sheet--active',
      '.modal.active',
      '.modal--active',
      '.modal--open',
      '.overlay.active',
      '.insight-modal--active',
      '[class*="overlay--active"]',
      '[class*="modal--active"]',
      '[class*="modal--open"]'
    ];

    for (var s = 0; s < overlaySelectors.length; s++) {
      var els = document.querySelectorAll(overlaySelectors[s]);
      for (var j = 0; j < els.length; j++) {
        els[j].classList.remove(
          'sheet-overlay--active', 'sheet--active',
          'active', 'modal--active', 'modal--open',
          'insight-modal--active'
        );
        // Also force-hide via inline style as a safety net
        if (els[j].classList.contains('sheet-overlay') ||
            els[j].dataset.overlayType === 'modal') {
          els[j].style.display = '';
          els[j].style.opacity = '';
        }
      }
    }

    // 4. Hide stuck loading overlays
    var loadingOverlays = document.querySelectorAll(
      '#navLoadingOverlay, #spa-loading, .loading-overlay, .nav-loading-overlay'
    );
    for (var k = 0; k < loadingOverlays.length; k++) {
      loadingOverlays[k].style.display = 'none';
      loadingOverlays[k].style.opacity = '0';
      loadingOverlays[k].classList.remove('visible', 'active');
    }

    // 5. Reset the SheetController if available
    if (window.SheetController && window.SheetController._active) {
      try { window.SheetController.closeAll(); } catch (e) {}
    }

    // 6. Ensure the golden-orb-bg doesn't block interaction
    var orb = document.querySelector('.golden-orb-bg');
    if (orb) {
      orb.style.pointerEvents = 'none';
    }

    if (fromBfcache) {
      console.log('[PageLifecycle] ✅ Recovered from bfcache');
    }
  }

  /**
   * Pre-cache cleanup — called on pagehide BEFORE the browser stores
   * the page in bfcache. This ensures the cached state is clean.
   */
  function cleanBeforeCache() {
    // Remove exit animation class so bfcache never stores a broken state
    var apps = document.querySelectorAll('.app');
    for (var i = 0; i < apps.length; i++) {
      apps[i].classList.remove('app--exiting');
      apps[i].style.opacity = '';
      apps[i].style.transform = '';
      apps[i].style.filter = '';
      apps[i].style.pointerEvents = '';
    }

    // Unlock body overflow
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  // ─── GLOBAL EXPOSURE for other scripts ───
  window.AnhadPageLifecycle = {
    recover: function () { recoverPageState(false); },
    clean: cleanBeforeCache
  };

})();
