/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * ANHAD â€” Smart Back Navigation v2.0
 * 
 * Universal, state-preserving back navigation:
 * 1. Tracks referrer for every page â†’ knows where user came FROM
 * 2. Saves scroll position before leaving â†’ restores it on return
 * 3. Uses history.back() when referrer exists, fallback URL otherwise
 * 4. Auto-wires all common back-button selectors across the entire app
 * 5. Integrates with bfcache (pageshow) for instant restore
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */
(function() {
  'use strict';

  var REFERRER_KEY  = 'anhad_nav_referrer';   // { url: referrerUrl } keyed by current page
  var SCROLL_KEY    = 'anhad_nav_scroll';     // { scrollY, scrollX, containers } keyed by page URL

  // â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  /** Get the module/folder name of a pathname (e.g. "/GurbaniKhoj/gurbani-khoj.html" -> "GurbaniKhoj") */
  function getModuleName(pathname) {
    if (!pathname) return '';
    var clean = pathname.replace(/^\//, '').replace(/\/$/, '');
    if (clean.indexOf('frontend/') === 0) {
      clean = clean.substring(9);
    }
    var parts = clean.split('/');
    if (parts.length > 1 || (parts.length === 1 && parts[0] && parts[0].indexOf('.html') === -1 && parts[0] !== 'index')) {
      return parts[0];
    }
    return '';
  }

  // â”€â”€â”€ 1. Referrer Tracking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ 2. Scroll State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€â”€ 3. Smart Back Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Navigate back intelligently.
   * Priority:
   *   1. Use history.back() if Capacitor OR browser history depth > 1
   *      (In Capacitor WebView, document.referrer is always empty, but
   *       history.length IS valid and history.back() works correctly)
   *   2. SPA navigateTo() for the fallback target (no full-page reload)
   *   3. Direct location.href as last resort
   *
   * CRITICAL: ALWAYS set session flags before going to index.html so
   * welcome-check.js NEVER redirects to the splash screen.
   *
   * @param {string} [fallbackUrl] â€” URL to go to if no history
   */
  window.anhadGoBack = function(fallbackUrl) {
    // Always ensure session is marked so index.html never triggers splash
    try {
      sessionStorage.setItem('anhad_welcomed', '1');
      localStorage.setItem('anhad_welcome_seen', 'true');
      localStorage.setItem('anhad_session_active_ts', Date.now().toString());
    } catch (e) {}

    // 1. Resolve fallback URL to absolute path relative to current page location first
    var target = fallbackUrl || '../index.html';
    var resolvedTarget;
    try {
      resolvedTarget = new URL(target, window.location.href).href;
    } catch (_) {
      resolvedTarget = target;
    }

    // Determine if resolvedTarget points to the global App Home page
    var root = window.ANHAD_ROOT;
    if (!root) {
      var path   = window.location.pathname;
      var marker = '/frontend/';
      var idx    = path.indexOf(marker);
      root = (idx !== -1)
        ? window.location.origin + path.substring(0, idx + marker.length)
        : window.location.origin + '/';
    }
    // Make sure root has origin/protocol
    if (root && !root.startsWith('http://') && !root.startsWith('https://')) {
      root = window.location.origin + (root.startsWith('/') ? '' : '/') + root;
    }
    
    var globalHome1 = root.endsWith('/') ? root + 'index.html' : root + '/index.html';
    var globalHome2 = root.endsWith('/') ? root : root + '/';
    
    var isBackToHome = (resolvedTarget === globalHome1 || resolvedTarget === globalHome2);

    if (isBackToHome) {
      resolvedTarget = globalHome1;
      console.log('[SmartBack] Back-to-Home â†’ resolved to:', resolvedTarget);
    } else {
      console.log('[SmartBack] Local Back â†’ resolved to:', resolvedTarget);
    }

    // 2. Use history.back() when we have real browser history.
    var isCapacitor = !!(window.Capacitor || window.location.protocol === 'capacitor:');
    var hasHistory  = window.history.length > 1;

    if (hasHistory) {
      var shouldHistoryBack = false;
      var referrer = document.referrer || getSavedReferrer();
      var referrerMatched = false;
      if (referrer) {
        try {
          var refUrl = new URL(referrer, window.location.origin).href;
          if (pageKey(refUrl) === pageKey(resolvedTarget)) {
            referrerMatched = true;
          }
        } catch (_) {}
      }

      if (referrerMatched) {
        shouldHistoryBack = true;
        console.log('[SmartBack] Referrer matches target URL in history, using history.back() for instant load');
      } else if (isBackToHome) {
        shouldHistoryBack = false;
        console.log('[SmartBack] Target is Home screen but referrer does not match, bypassing history.back()');
      } else {
        if (referrer) {
          // If referrer exists, ensure it's from our own app
          try {
            var ref = new URL(referrer);
            if (ref.origin === window.location.origin) {
              // Extract module names to detect cross-module transitions
              var currModule = getModuleName(window.location.pathname);
              var refModule = getModuleName(ref.pathname);

              if (currModule && refModule && currModule !== refModule) {
                shouldHistoryBack = false;
                console.log('[SmartBack] Cross-module referrer detected (' + refModule + ' -> ' + currModule + '), skipping history.back()');
              } else {
                // Check if referrer is a child page of current page
                // (e.g. current = /nitnem/index.html, referrer = /nitnem/reader.html)
                var currPath = window.location.pathname;
                var refPath = ref.pathname;
                
                // Normalize paths: remove trailing slashes and index.html
                var cleanCurr = currPath.replace(/\/index\.html$/, '/').replace(/\/$/, '');
                var cleanRef = refPath.replace(/\/index\.html$/, '/').replace(/\/$/, '');
                
                var isCurrHub = currPath.endsWith('/') || currPath.endsWith('/index.html') || currPath.endsWith('/index');
                
                if (isCurrHub && cleanRef.startsWith(cleanCurr + '/')) {
                  // Referrer is a sub-page/child of this hub page. Do NOT use history.back()
                  // as it would lead to a navigation loop between index and reader pages.
                  shouldHistoryBack = false;
                  console.log('[SmartBack] Referrer is a child page, skipping history.back:', refPath);
                } else {
                  shouldHistoryBack = true;
                }
              }
            }
          } catch (e) {
            shouldHistoryBack = false;
          }
        } else {
          // NO REFERRER: Never call history.back() blindly because we don't know where it leads!
          shouldHistoryBack = false;
          console.log('[SmartBack] No referrer found, avoiding history.back() to prevent wrong page routing');
        }
      }

      if (shouldHistoryBack) {
        console.log('[SmartBack] history.back() executed');
        history.back();
        return;
      }
    }

    console.log('[SmartBack] Navigating to target:', resolvedTarget);

    // Prefer SPA engine (no full-page reload, no flash)
    if (window.navigateTo) {
      window.navigateTo(resolvedTarget);
    } else {
      window.location.href = resolvedTarget;
    }
  };

  // â”€â”€â”€ 4. Auto-Wire Back Buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Auto-wire any element matching these selectors to use anhadGoBack.
   * This covers ALL back button patterns used across the Anhad app.
   */
  function autoWire() {
    var selectors = [
      '#backBtn', '#bk', '#back-btn', '#navBack',
      '.header__back', '.header-back', '.nav-back',
      '.glass-nav__back', '.glass-back-btn', '.reader-back', '.back-btn',
      '[data-anhad-back]', '[data-set-session]'
    ];

    var wired = new Set();

    selectors.forEach(function(sel) {
      var elements = document.querySelectorAll(sel);
      elements.forEach(function(el) {
        // Skip if marked to skip auto-wiring
        if (el.hasAttribute('data-anhad-skip-back')) return;
        // CRITICAL: Bottom tab-bar items are for routing and must never be wired as back buttons
        if (el.classList.contains('tab-item') || el.closest('.tab-bar')) return;
        // Prevent double-binding
        if (el._anhadBackWired || wired.has(el)) return;
        el._anhadBackWired = true;
        wired.add(el);

        // Determine fallback from existing href (if <a> tag), or default
        var fallback = '../index.html';
        if (el.tagName === 'A' && el.getAttribute('href')) {
          fallback = el.getAttribute('href');
        }

        // Only remove conflicting onclick handlers â€” preserve session-flag setters
        if (el.hasAttribute('onclick')) {
          var oc = el.getAttribute('onclick');
          if (!oc.includes('anhadGoBack') && !oc.includes('anhad_welcome')) {
            el.removeAttribute('onclick');
          }
        }

        if (el._anhadClickWired) return;
        el._anhadClickWired = true;

        el.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();

          // Use data-attribute fallback if present, else A-tag href, else the detected fallback
          var customFallback = el.getAttribute('data-anhad-back') || fallback;
          // anhadGoBack itself always stamps session flags before navigating
          window.anhadGoBack(customFallback);
        });

        // Set cursor for non-anchor elements
        el.style.cursor = 'pointer';
      });
    });
  }

  // â”€â”€â”€ 5. Lifecycle Integration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // SPA INTEGRATION: Re-wire when page content changes via smooth-navigation
  var lastHref = window.location.href;
  window.addEventListener('anhad_page_changed', function() {
    console.log('[SmartBack] Page changed, recording SPA referrer and re-wiring back buttons...');
    if (lastHref && lastHref !== window.location.href) {
      var key = pageKey(window.location.href);
      var map = loadMap(REFERRER_KEY);
      map[key] = lastHref;
      saveMap(REFERRER_KEY, map);
      console.log('[SmartBack] SPA Referrer recorded:', lastHref, '->', window.location.href);
    }
    lastHref = window.location.href;
    autoWire();
    restoreScrollState();
  });

  // Save scroll state before navigating away
  window.addEventListener('pagehide', function() {
    saveScrollState();
  });

  // Handle bfcache restoration (back/forward cache)
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      // Page was restored from bfcache â€” scroll is already correct
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
