/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD — Smart Back Navigation v2.0
 * 
 * Universal, state-preserving back navigation:
 * 1. Tracks referrer for every page → knows where user came FROM
 * 2. Saves scroll position before leaving → restores it on return
 * 3. Uses history.back() when referrer exists, fallback URL otherwise
 * 4. Auto-wires all common back-button selectors across the entire app
 * 5. Integrates with bfcache (pageshow) for instant restore
 * ═══════════════════════════════════════════════════════════════════════════════
 */
(function() {
  'use strict';

  var REFERRER_KEY  = 'anhad_nav_referrer';   // { url: referrerUrl } keyed by current page
  var SCROLL_KEY    = 'anhad_nav_scroll';     // { scrollY, scrollX, containers } keyed by page URL

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Get a normalized page key (pathname + search, no hash) */
  function pageKey(url) {
    try {
      var u = new URL(url || window.location.href);
      return u.pathname + u.search;
    } catch (_) {
      return window.location.pathname + window.location.search;
    }
  }

  function loadMap(storageKey) {
    try { return JSON.parse(sessionStorage.getItem(storageKey) || '{}'); } catch (_) { return {}; }
  }
  function saveMap(storageKey, map) {
    try { sessionStorage.setItem(storageKey, JSON.stringify(map)); } catch (_) {}
  }

  // ─── 1. Referrer Tracking ────────────────────────────────────────────────
  // On every page load, record document.referrer so we know "who sent me here"

  function recordReferrer() {
    if (!document.referrer) return;
    // Only record if referrer is from our own origin
    try {
      var ref = new URL(document.referrer);
      if (ref.origin !== window.location.origin) return;
    } catch (_) { return; }

    var key = pageKey(window.location.href);
    var map = loadMap(REFERRER_KEY);
    map[key] = document.referrer;
    saveMap(REFERRER_KEY, map);
  }

  /** Get the saved referrer for the current page */
  function getSavedReferrer() {
    var key = pageKey(window.location.href);
    var map = loadMap(REFERRER_KEY);
    return map[key] || null;
  }

  // ─── 2. Scroll State ────────────────────────────────────────────────────

  /** Save current scroll position for this page */
  function saveScrollState() {
    var key = pageKey(window.location.href);
    var state = {
      scrollY: window.scrollY || window.pageYOffset || 0,
      scrollX: window.scrollX || window.pageXOffset || 0,
      timestamp: Date.now()
    };

    // Also capture scroll position of common scrollable containers
    var containers = {};
    var scrollables = document.querySelectorAll('.main-content, .app-content, [data-scroll-container]');
    scrollables.forEach(function(el) {
      var id = el.id || el.className.split(' ')[0];
      if (id && el.scrollTop > 0) {
        containers[id] = el.scrollTop;
      }
    });
    state.containers = containers;

    var map = loadMap(SCROLL_KEY);
    map[key] = state;
    saveMap(SCROLL_KEY, map);
  }

  /** Restore scroll position for this page */
  function restoreScrollState() {
    var key = pageKey(window.location.href);
    var map = loadMap(SCROLL_KEY);
    var state = map[key];
    if (!state) return;

    // Only restore if saved within last 30 minutes
    if (Date.now() - state.timestamp > 30 * 60 * 1000) {
      delete map[key];
      saveMap(SCROLL_KEY, map);
      return;
    }

    // Restore window scroll with RAF for dynamic content
    if (state.scrollY > 0 || state.scrollX > 0) {
      // Try immediate, then with delay for dynamic pages
      window.scrollTo(state.scrollX, state.scrollY);
      
      // Retry after content might have loaded
      requestAnimationFrame(function() {
        window.scrollTo(state.scrollX, state.scrollY);
      });
      setTimeout(function() {
        window.scrollTo(state.scrollX, state.scrollY);
      }, 100);
      setTimeout(function() {
        window.scrollTo(state.scrollX, state.scrollY);
      }, 300);
    }

    // Restore scrollable containers
    if (state.containers) {
      Object.keys(state.containers).forEach(function(id) {
        var el = document.getElementById(id) || document.querySelector('.' + id);
        if (el) {
          el.scrollTop = state.containers[id];
        }
      });
    }

    // Clean up after restore
    delete map[key];
    saveMap(SCROLL_KEY, map);
  }

  // ─── 3. Smart Back Navigation ────────────────────────────────────────────

  /**
   * Navigate back intelligently.
   * Priority: 
   *   1. If browser history exists AND we have a same-origin referrer → history.back()
   *   2. If we have a saved referrer → navigate to it directly
   *   3. Fallback to specified URL (default: ../index.html)
   * 
   * @param {string} [fallbackUrl] — URL to go to if no history or direct-load
   */
  window.anhadGoBack = function(fallbackUrl) {
    fallbackUrl = fallbackUrl || '../index.html';

    // Save scroll state of the page we're leaving
    // (the destination page will restore its own scroll on load)

    // Check if we have meaningful history to go back to
    var savedRef = getSavedReferrer();
    
    if (document.referrer && history.length > 1) {
      // We came here from another page in this tab — use history.back()
      // This is the smoothest option: preserves form state, bfcache, etc.
      history.back();
    } else if (savedRef) {
      // We have a recorded referrer from a previous visit
      window.location.href = savedRef;
    } else {
      // Direct load or no history — go to fallback
      window.location.href = fallbackUrl;
    }
  };

  // ─── 4. Auto-Wire Back Buttons ───────────────────────────────────────────

  /**
   * Auto-wire any element matching these selectors to use anhadGoBack.
   * This covers ALL back button patterns used across the Anhad app.
   */
  function autoWire() {
    var selectors = [
      '#backBtn', '#bk', '#back-btn', '#navBack',
      '.header__back', '.header-back', '.nav-back',
      '.glass-nav__back', '.glass-back-btn',
      '[data-anhad-back]'
    ];

    var wired = new Set();

    selectors.forEach(function(sel) {
      var elements = document.querySelectorAll(sel);
      elements.forEach(function(el) {
        // Prevent double-binding
        if (el._anhadBackWired || wired.has(el)) return;
        el._anhadBackWired = true;
        wired.add(el);

        // Determine fallback from existing href (if <a> tag), or default
        var fallback = '../index.html';
        if (el.tagName === 'A' && el.getAttribute('href')) {
          fallback = el.getAttribute('href');
        }

        // Remove any existing inline onclick that might conflict
        if (el.hasAttribute('onclick')) {
          el.removeAttribute('onclick');
        }

        el.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          window.anhadGoBack(fallback);
        });

        // Set cursor for non-anchor elements
        el.style.cursor = 'pointer';
      });
    });
  }

  // ─── 5. Lifecycle Integration ────────────────────────────────────────────

  // Record referrer on page load
  recordReferrer();

  // Auto-wire back buttons on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      autoWire();
      restoreScrollState();
    });
  } else {
    autoWire();
    restoreScrollState();
  }

  // Save scroll state before navigating away
  window.addEventListener('beforeunload', function() {
    saveScrollState();
  });

  // Handle bfcache restoration (back/forward cache)
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      // Page was restored from bfcache — scroll is already correct
      // Just re-wire in case DOM changed
      autoWire();
    }
  });

  // Also save scroll periodically for pages that might crash/force-close
  var scrollSaveTimer = null;
  window.addEventListener('scroll', function() {
    if (scrollSaveTimer) clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(saveScrollState, 1000);
  }, { passive: true });

  // Save on visibility change (user switches tabs/minimizes)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      saveScrollState();
    }
  });

})();
