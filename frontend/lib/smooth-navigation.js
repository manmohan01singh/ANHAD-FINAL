/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMOOTH NAVIGATION (App Shell Engine v5 - UNIFIED LIFECYCLE & PARITY)
 *
 * This script turns the app into a high-performance Single Page Application (SPA).
 * Features:
 * - Single Canonical Rendering Pipeline (SPA == Direct Hard Refresh)
 * - Proactive In-Memory HTML Response Caching (PAGE_CACHE)
 * - Deterministic Page Lifecycle (initPage / destroyPage)
 * - Head Asset & Stylesheet Synchronization
 * - Bottom Navigation & Shell State Synchronization
 * - Hardware Back Button Integration
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  // Defensive re-entrancy guard: this file is loaded via a plain <script src>
  // on every page (no module dedup), and at least two pages accidentally
  // double-include it. Without this, the whole IIFE below runs twice on
  // those pages — two MutationObservers, two IntersectionObservers, two sets
  // of document-level click/mouseover/touchstart interceptors, two popstate
  // handlers, two independent PAGE_CACHE/prefetch timers, and two closure-
  // scoped navInFlight flags that can't see each other and can race into
  // concurrent DOM swaps. Matches the guard pattern already used by
  // overlay-player.js and campaign-renderer.js.
  if (window.__anhadSmoothNavInit) return;
  window.__anhadSmoothNavInit = true;

  const NAV_DEBUG = false;

  const MAIN_TARGET_ID = 'app';
  const PAGE_CACHE = new Map();
  // Declared here, beside PAGE_CACHE, and NOT next to cachePage() further down:
  // cachePage is a hoisted function declaration called during this IIFE's own
  // startup (the initial-page snapshot below), so a `const` declared later sits
  // in the temporal dead zone at that moment and throws — which aborts the
  // whole IIFE and leaves window.navigateTo undefined, silently disabling the
  // entire SPA. Keep this above its first possible use.
  const PAGE_CACHE_MAX = 8;
  const FETCH_QUEUE = new Set();
  const SCROLL_POSITIONS = new Map();
  const EXECUTED_INLINE_PAGES = new Set();

  // Page Lifecycle Registry
  window.__anhadPageInit = window.__anhadPageInit || {};
  window.__anhadPageCleanup = window.__anhadPageCleanup || {};
  
  /**
   * Normalizes a URL for caching and history comparison ONLY.
   */
  function normalizeUrl(url) {
    try {
      const u = new URL(url, window.location.origin);
      let path = u.pathname;
      if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
      if (path === '/index.html') path = '/';
      return u.origin + path + u.search;
    } catch (e) {
      return url;
    }
  }

  /**
   * Returns the actual URL to use for fetch().
   */
  function toFetchUrl(normalizedUrl) {
    try {
      const u = new URL(normalizedUrl, window.location.origin);
      let path = u.pathname;
      if (path.endsWith('/')) {
        path = path + 'index.html';
        u.pathname = path;
        return u.href;
      }
      return normalizedUrl;
    } catch (e) {
      return normalizedUrl;
    }
  }

  let currentActiveUrl = normalizeUrl(window.location.href);
  // Holds the normalized url of the swap currently running, or null when idle.
  // Cleared in performSwap()'s finally block and on every early return in
  // navigateTo(), so a bailout can never wedge navigation permanently.
  let navInFlight = null;

  // -- PAGE CSS OWNERSHIP --------------------------------------------------
  // Every page-owned <style>/<link> carries data-spa-page="<pathname>" plus a
  // data-spa-media record of the media value it should have when active.
  //
  // Activation/deactivation toggles the `media` attribute ("all" vs "not all")
  // instead of removing the node. That is instant, needs no re-fetch or
  // re-parse, is fully reversible, and — critically — means an error partway
  // through a navigation can never leave the document with NO CSS at all.
  // (The previous remove-then-reinstall approach did exactly that, and also
  // left the OUTGOING page rendering unstyled for up to 150ms before the DOM
  // swap — the giant-guru-image and Coming-Soon-popup flashes.)
  const CSS_INACTIVE_MEDIA = 'not all';

  function pageKeyForUrl(url) {
    try {
      return new URL(url, window.location.origin).pathname;
    } catch (e) {
      return null;
    }
  }

  /**
   * Resolves a URL to an absolute URL string.
   * - Absolute http/https URLs are returned as-is.
   * - Origin-relative paths ('/foo') are resolved against window.location.origin.
   * - Explicitly relative paths ('./foo', '../foo') are resolved against window.location.href.
   * - Root-relative app paths ('GurbaniRadio/foo', 'Favorites/foo') are resolved against window.ANHAD_ROOT.
   */
  function resolveAppUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return new URL(url, window.location.origin).href;
    if (url.startsWith('./') || url.startsWith('../')) return new URL(url, window.location.href).href;
    return new URL(url, window.ANHAD_ROOT || (window.location.origin + '/')).href;
  }

  function isSharedStylesheetHref(absoluteHref) {
    return SHARED_STYLESHEET_ALLOWLIST.some(name => absoluteHref.includes(name));
  }

  function recordActiveMedia(el) {
    if (el.hasAttribute('data-spa-media')) return;
    const m = el.getAttribute('media');
    // `media="print"` is the async-CSS loading trick (onload flips it to 'all'),
    // so 'all' — not 'print' — is the value to restore on re-activation.
    el.setAttribute('data-spa-media', (!m || m === 'print') ? 'all' : m);
  }

  function setPageCssActive(el, active) {
    if (active) {
      const original = el.getAttribute('data-spa-media') || 'all';
      if (original === 'all') el.removeAttribute('media');
      else el.setAttribute('media', original);
    } else {
      el.setAttribute('media', CSS_INACTIVE_MEDIA);
    }
  }

  /**
   * Claim any not-yet-tagged <head> CSS for the page currently on screen.
   *
   * Deliberately called at NAVIGATION time, never at script-execution time:
   * pages load this script both with and without `defer` (index.html defers it,
   * Insights/Favorites do not and declare their <style> after it), so a
   * startup-time sweep silently missed the styles of every non-deferred page.
   * At navigation time the document is always fully parsed.
   *
   * Shared shell stylesheets and remote (CDN/font) sheets are never claimed —
   * they stay globally active for every page.
   */
  function claimUntaggedHeadCss(pageKey) {
    if (!pageKey) return;
    document.head.querySelectorAll('style:not([data-spa-page])').forEach(el => {
      recordActiveMedia(el);
      el.setAttribute('data-spa-page', pageKey);
    });
    document.querySelectorAll('link[rel="stylesheet"]:not([data-spa-page])').forEach(el => {
      // el.href is the browser's already-resolved absolute URL, correct for the
      // document that parsed it — unlike re-resolving getAttribute('href')
      // against document.baseURI, which drifts as history.pushState runs.
      const absoluteHref = el.href;
      if (!absoluteHref) return;
      const isRemote = absoluteHref.startsWith('http') && !absoluteHref.includes(window.location.host);
      if (isRemote || isSharedStylesheetHref(absoluteHref)) return;
      recordActiveMedia(el);
      el.setAttribute('data-spa-page', pageKey);
    });
  }

  /**
   * Deactivate every page-owned stylesheet/style block not belonging to the
   * page now on screen. Runs AFTER the DOM swap, so the outgoing page is never
   * rendered without its own CSS.
   */
  function deactivateForeignPageCss(activeKey) {
    document.querySelectorAll('style[data-spa-page], link[data-spa-page]').forEach(el => {
      setPageCssActive(el, el.getAttribute('data-spa-page') === activeKey);
    });
  }

  /**
   * Copy a container's own attributes from the incoming document onto the live
   * element (id excepted). Home is <main class="app" id="app">, Insights is
   * <div id="app"> with no class — without this the incoming page renders
   * inside the outgoing page's container classes.
   */
  function syncElementAttributes(target, source) {
    Array.from(target.attributes).forEach(attr => {
      if (attr.name === 'id') return;
      if (!source.hasAttribute(attr.name)) target.removeAttribute(attr.name);
    });
    Array.from(source.attributes).forEach(attr => {
      if (attr.name === 'id') return;
      if (target.getAttribute(attr.name) !== attr.value) {
        target.setAttribute(attr.name, attr.value);
      }
    });
  }

  /**
   * Save the current scroll position before we swap away from a page.
   */
  function saveScrollPosition() {
    SCROLL_POSITIONS.set(currentActiveUrl, window.scrollY);
  }

  /**
   * Restore scroll position for a given URL, or scroll to top if no saved pos.
   */
  function restoreScrollPosition(url) {
    const saved = SCROLL_POSITIONS.get(url);
    window.scrollTo({
      top: saved !== undefined ? saved : 0,
      behavior: 'instant'
    });
  }

  // Cache the initial page's HTML response immediately
  const _initApp = document.getElementById('app');
  if (_initApp) {
    cachePage(currentActiveUrl, document.documentElement.outerHTML);
    try {
      fetch(currentActiveUrl).then(r => r.text()).then(t => {
        if (t) cachePage(currentActiveUrl, t);
      }).catch(() => {});
    } catch(e) {}
  }

  const SHELL_SCRIPTS = [
    'anhad-svg-sprite.js',
    'overlay-player.js',
    'smooth-navigation.js',
    'global-theme.js',
    // Re-executing this tag on every SPA arrival at Home raced its own
    // init() (uses whatever data-theme-mode is still on <html> from BEFORE
    // this navigation) against applyNewContent()'s explicit, correctly-
    // ordered AnhadSky.applyTimeOfDay()/updateHeroCardImages() call further
    // below (runs AFTER AnhadTheme.apply() has settled data-theme-mode for
    // the incoming page). Two passes with two different theme-mode inputs
    // repainted the sky background/hero images/card colors twice in a row —
    // the reported "two-time flash" on every return to Home. window.AnhadSky
    // is a persistent global (this is a real SPA, the JS realm never
    // reloads), so the single explicit call still reaches live DOM fine
    // without this script re-running.
    'anhad-sky-bg.js',
    'audio-coordinator.js',
    'anhad-audio-singleton.js',
    'anhad-core.js',
    'pwa-register.js',
    'smart-back.js',
    'page-lifecycle.js',
    'welcome-check.js',
    'state-preservation.js',
    'ultra-welcome-loader.js',
    'capacitor-bridge.js',
    'storage-manager.js',
    'widget-bridge.js',
    'anhad-widget-bridge.js',
    'gurbani-db.js',
    'bani-cache-optimizer.js',
    'optimized-image-loader.js',
    'gurbani-local-db.js',
    'gurbani-download-manager.js',
    'capacitor-notifications-global.js',
    'user-stats.js',
    'trendora-app.js',
    'homepage-data.js',
    'insights.js',
    // Both hold module-level state and bind window listeners; they re-render on
    // 'anhad_page_changed' rather than needing re-execution.
    'remote-config.js',
    'campaign-renderer.js'
  ];

  // Resolve App Root once on load
  const navScriptTag = document.querySelector('script[src*="smooth-navigation.js"]');
  if (navScriptTag) {
    const url = new URL(navScriptTag.src, window.location.origin);
    const parts = url.pathname.split('lib/smooth-navigation.js');
    window.ANHAD_ROOT = url.origin + parts[0];
  } else {
    const path = window.location.pathname;
    const marker = '/frontend/';
    const idx = path.indexOf(marker);
    if (idx !== -1) {
      window.ANHAD_ROOT = window.location.origin + path.substring(0, idx + marker.length);
    } else {
      window.ANHAD_ROOT = window.location.origin + '/';
    }
  }

  // Fix icon paths to absolute to prevent 404s during SPA navigation
  document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]').forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('/')) {
      link.setAttribute('href', new URL(href, window.ANHAD_ROOT).href);
    }
  });

  function isHomeUrl(url) {
    try {
      const pathname = new URL(url, window.location.origin).pathname;
      const cleanPath = pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
      return cleanPath.endsWith('/frontend') ||
             cleanPath.endsWith('/frontend/index.html') ||
             cleanPath.endsWith('/frontend/index') ||
             cleanPath.endsWith('/index.html') ||
             cleanPath.endsWith('/index') ||
             cleanPath.endsWith('/') ||
             cleanPath === '';
    } catch (e) {
      return false;
    }
  }

  function isShellPage(url) {
    try {
      const pathname = new URL(url, window.location.origin).pathname.toLowerCase();
      const cleanPath = pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');

      if (isHomeUrl(url)) return true;
      if (cleanPath.includes('/insights') || cleanPath.includes('insights')) return true;
      if (cleanPath.includes('/favorites') || cleanPath.includes('favorites')) return true;

      return cleanPath.endsWith('/frontend') ||
             cleanPath.endsWith('/frontend/index.html') ||
             cleanPath.endsWith('/frontend/index') ||
             cleanPath.endsWith('/index.html') ||
             cleanPath.endsWith('/index') ||
             cleanPath.endsWith('/') || 
             cleanPath === '';
    } catch (e) {
      return false;
    }
  }

  function runPageCleanup(url) {
    try {
      const leavingPath = new URL(url, window.location.origin).pathname;
      const cleanPath = leavingPath.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
      // De-duplicated: for any path that isn't an index.html/trailing-slash
      // form (i.e. every sub-page, e.g. /frontend/Insights/insights.html) the
      // two .replace() calls are no-ops, so cleanPath === leavingPath and both
      // lookups resolve to the SAME function — running every page hook twice
      // per navigation.
      const cleanups = [...new Set([
        window.__anhadPageCleanup && window.__anhadPageCleanup[leavingPath],
        window.__anhadPageCleanup && window.__anhadPageCleanup[cleanPath]
      ])];
      cleanups.forEach(fn => {
        if (typeof fn === 'function') {
          try { fn(); } catch (err) { console.warn('[SmoothNav] Cleanup error for', leavingPath, err); }
        }
      });
    } catch (e) {}
  }

  function runPageInit(url) {
    try {
      const enterPath = new URL(url, window.location.origin).pathname;
      const cleanPath = enterPath.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
      // De-duplicated — see the matching note in runPageCleanup(). Without
      // this, Insights' init() ran twice on every arrival: two sets of its
      // JSON fetches and two more permanent window scroll listeners per visit.
      const inits = [...new Set([
        window.__anhadPageInit && window.__anhadPageInit[enterPath],
        window.__anhadPageInit && window.__anhadPageInit[cleanPath]
      ])];
      inits.forEach(fn => {
        if (typeof fn === 'function') {
          try { fn(); } catch (err) { console.warn('[SmoothNav] PageInit error for', enterPath, err); }
        }
      });
    } catch (e) {}
  }

  function syncBottomNav(url) {
    // #mainNav/.tab-bar, not document.getElementById('mainNav') alone — a page
    // missing an id (or a duplicate) shouldn't leave a stale copy unsynced.
    const mainNavs = document.querySelectorAll('#mainNav, .tab-bar');
    if (mainNavs.length === 0) return;

    const pathname = new URL(url, window.location.origin).pathname;
    const isLearning = pathname.includes('/Insights/') || pathname.includes('/insights');
    const isFavorites = pathname.includes('/Favorites/') || pathname.includes('/favorites');
    const isSadhsangat = pathname.includes('/sadhsangat');

    mainNavs.forEach(mainNav => {
      mainNav.querySelectorAll('.tab-item').forEach(item => {
        const href = item.getAttribute('href') || '';
        let active = false;
        // Match each tab-item against the SAME isHomeUrl() the rest of this
        // file uses to mean "Home", instead of href.endsWith('index.html') —
        // that matched ANY page whose own file happens to be an index.html,
        // including /sadhsangat-live/index.html. Confirmed via real-browser
        // trace: returning to Home showed both Home and Sadhsangat active,
        // because Sadhsangat's href satisfied that same suffix check.
        if (isHomeUrl(url) && isHomeUrl(href)) {
          active = true;
        } else if (isLearning && href.includes('Insights')) {
          active = true;
        } else if (isFavorites && href.includes('Favorites')) {
          active = true;
        } else if (isSadhsangat && href.includes('sadhsangat')) {
          active = true;
        }
        item.classList.toggle('active', active);
      });
    });
  }

  window.navigateTo = async function(url, options = {}) {
    if (!url || typeof url !== 'string') return;

    const absoluteUrl = resolveAppUrl(url);
    const normalized = normalizeUrl(absoluteUrl);

    if (normalized === currentActiveUrl && !options.force) return;

    // If an identical destination is already in flight, ignore (duplicate tap).
    // BUT if the user tapped a DIFFERENT tab, cancel the old flight and start fresh
    // — this is the core fix for "takes 3 taps to navigate": previously any in-flight
    // nav blocked ALL subsequent taps until the swap finished, so rapid tab switches
    // would silently drop the 2nd and 3rd taps.
    if (navInFlight && navInFlight === normalized && !options.force) return;
    navInFlight = normalized;

    // Run page cleanup before leaving
    runPageCleanup(currentActiveUrl);

    // Save current page scroll BEFORE we swap away
    saveScrollPosition();

    // Proactively save navigation referrer in sessionStorage
    try {
      const targetUrlObj = new URL(absoluteUrl, window.location.origin);
      const targetKey = targetUrlObj.pathname + targetUrlObj.search;
      const referrerMap = JSON.parse(sessionStorage.getItem('anhad_nav_referrer') || '{}');
      referrerMap[targetKey] = window.location.href;
      sessionStorage.setItem('anhad_nav_referrer', JSON.stringify(referrerMap));
    } catch (ex) {}

    // Before navigating to index.html stamp session flags so welcome splash does not re-trigger
    if (absoluteUrl.endsWith('/index.html') || absoluteUrl.endsWith('/index') ||
        absoluteUrl.endsWith('/') || absoluteUrl === window.ANHAD_ROOT) {
      try {
        sessionStorage.setItem('anhad_welcomed', '1');
        localStorage.setItem('anhad_welcome_seen', 'true');
        localStorage.setItem('anhad_session_active_ts', Date.now().toString());
      } catch(e) {}
    }

    if (isShellPage(absoluteUrl)) {
      // performSwap clears navInFlight in its own finally block.
      performSwap(absoluteUrl, options);
    } else {
      // Full page load — this document is being torn down, but clear the flag
      // anyway so a blocked/cancelled navigation can't wedge the SPA.
      navInFlight = null;
      window.location.href = absoluteUrl;
    }
  };

  /**
   * Fetch new page and swap content
   */
  async function performSwap(url, options = {}) {
    url = normalizeUrl(url);
    const fetchUrl = toFetchUrl(url);

    if (window._anhadDomObserver) window._anhadDomObserver.disconnect();

    const loader = ensureLoader();
    let loaderTimeout = null;
    let transitionFinished = false;

    try {
      // CACHE HIT: serve instantly from in-memory HTML response cache.
      // Deliberately INSIDE the try — prefetchCoreShell() warms this cache for
      // Insights/Favorites moments after Home loads, so this is the path almost
      // every real navigation takes. Outside the try, any throw mid-swap left a
      // half-swapped document with no fallback and no way back except a hard
      // refresh; now it degrades to a normal page load instead.
      const cachedHtml = PAGE_CACHE.get(url);
      if (cachedHtml) {
        transitionFinished = true;
        await applyNewContent(cachedHtml, url, options);
        return;
      }

      const isTabRoute = url.includes('insights') || url.includes('favorites') || url.includes('sadhsangat') || isHomeUrl(url);

      loaderTimeout = setTimeout(() => {
        if (!transitionFinished && !options.isBack && !isTabRoute) {
          loader.classList.add('visible');
          document.body.classList.add('page-loading');
        }
      }, 700);

      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${fetchUrl}`);
      const text = await response.text();
      
      cachePage(url, text);

      transitionFinished = true;
      clearTimeout(loaderTimeout);
      loaderTimeout = null;
      
      await applyNewContent(text, url, options);
      
    } catch (e) {
      console.error('[SmoothNav] SPA swap failed, falling back to full reload:', e);
      clearTimeout(loaderTimeout);
      window.location.href = fetchUrl;
    } finally {
      navInFlight = null;
      if (loaderTimeout) clearTimeout(loaderTimeout);
      loader.classList.remove('visible');
      document.body.classList.remove('page-loading');
      if (window._anhadDomObserver && document.body) {
        window._anhadDomObserver.observe(document.body, {
          childList: true, subtree: true, attributes: false, characterData: false
        });
      }
    }
  }

  /**
   * Applies the new content to the DOM with Unified Single Pipeline
   */
  async function applyNewContent(htmlText, url, options) {
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(htmlText, 'text/html');

    const newApp = newDoc.getElementById(MAIN_TARGET_ID);
    const currentApp = document.getElementById(MAIN_TARGET_ID);

    if (!newApp || !currentApp) {
       console.warn('[SmoothNav] Target structure mismatch, attempting full reload');
       window.location.href = url;
       return;
    }

    // -- ARRIVAL EPOCH ----------------------------------------------------
    // A monotonic counter identifying THIS navigation. Page modules repopulate
    // themselves from two independent triggers that both fire for a single
    // arrival — runPageInit() below, and the anhad_page_changed event at the
    // end of this function. They need to collapse to one run per ARRIVAL.
    //
    // They previously deduplicated on wall-clock time instead, which is not the
    // same thing and dropped real arrivals: a 500ms window was stamped even when
    // LEAVING a page, so returning within 500ms silently skipped the only code
    // that repopulates Home. Bumped here, before executePageScripts(), so a
    // script injected during this navigation observes the epoch it arrived on.
    window.__anhadNavEpoch = (window.__anhadNavEpoch || 0) + 1;

    // Run cleanup on departing page
    runPageCleanup(currentActiveUrl);

    // Hide module-specific out-of-app elements
    [
      '.bg-orbs', '.ikonkar-background', '#ikonkarBackground', '.bg-effects',
      '.skeleton-container', '#skeletonContainer', '#skeletonLoader',
      '.ultra-loader', '.ultra-welcome-loader', '.welcome-screen',
      '.hukam-player', '.action-bar'
    ].forEach(sel => {
      const el = document.querySelector(sel);
      if (el) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      }
    });

    // Update document title
    document.title = newDoc.title;
    
    // Sync persistent global shell elements outside #app.
    // #pageHeader and .app-header are load-bearing: Insights' entire header —
    // including its <h1> page title — lives OUTSIDE #app, so it is neither
    // swapped as page content nor synced as shell unless it is listed here.
    // (Dropping them is why the Learning page lost its heading on SPA nav.)
    const shellSelectors = [
      '#anhadSvgSprite',
      '#mainNav', '#main-nav', '#pageHeader', '#globalPlayer',
      '.tab-bar', '.sidebar', '.desktop-sidebar', '.app-header',
      // Page-owned but declared OUTSIDE #app, so the content swap can't reach
      // it. Home's Coming Soon dialog is hidden purely by opacity:0 in Home's
      // own CSS — once that CSS is (correctly) deactivated on another page, a
      // leftover copy renders as a fully visible unstyled block. Listing it
      // here means it is removed on leaving Home and restored on return; the
      // inline script that binds it re-runs afterwards and re-finds it by id.
      '#anhadComingSoonOverlay',
      // Same story: Home-owned, declared outside #app, and position:fixed. Once
      // shown it survived every content swap and kept floating over Insights'
      // and Favorites' navigation for the rest of the session.
      '#installBanner'
    ];

    // Shell elements that belong ABOVE the page content. Appending these to the
    // end of <body> (the old default) renders a page header below everything.
    const SHELL_BEFORE_APP = ['#anhadSvgSprite', '#pageHeader', '.app-header', '.desktop-sidebar'];

    shellSelectors.forEach(selector => {
      const newNode = newDoc.querySelector(selector);
      const currentNode = document.querySelector(selector);

      if (newNode) resolveRelativePaths(newNode, url);

      if (newNode && currentNode) {
        if (newNode.innerHTML !== currentNode.innerHTML) {
          currentNode.innerHTML = newNode.innerHTML;
        }
        // Class/attribute parity matters as much as content parity here —
        // e.g. Insights' header is .insights-header, other pages' are not.
        syncElementAttributes(currentNode, newNode);
      } else if (newNode && !currentNode) {
        const clonedNode = newNode.cloneNode(true);
        if (SHELL_BEFORE_APP.includes(selector)) {
          const appEl = document.getElementById(MAIN_TARGET_ID);
          if (appEl && appEl.parentNode) appEl.parentNode.insertBefore(clonedNode, appEl);
          else document.body.prepend(clonedNode);
        } else {
          document.body.appendChild(clonedNode);
        }
      } else if (!newNode && currentNode) {
        if (selector !== '#mainNav' && selector !== '.tab-bar') {
          currentNode.remove();
        }
      }
    });

    // Reset body classes and styles
    const globalClasses = ['dark-mode', 'is-mobile', 'reduce-motion', 'theme-loaded'];
    const currentClasses = Array.from(document.body.classList);
    currentClasses.forEach(cls => {
      if (!globalClasses.includes(cls)) {
        document.body.classList.remove(cls);
      }
    });
    
    document.body.style.overflow = '';
    document.body.style.minHeight = '';
    document.body.style.color = '';

    // -- CSS LIFECYCLE: install → swap → deactivate ------------------------
    // Ordering is the whole point here. The outgoing page's CSS stays fully
    // active until AFTER its DOM has been replaced, so it is never rendered
    // unstyled. Nothing is removed at any stage — see the ownership helpers
    // near the top of this file for why.
    const newPageKey = pageKeyForUrl(url);

    // 1. Claim whatever CSS the outgoing page brought in but never tagged.
    claimUntaggedHeadCss(pageKeyForUrl(currentActiveUrl));

    // 2. Install + activate the incoming page's CSS, and wait for it to load.
    await syncHeadAssets(newDoc, url);

    // Apply theme attributes without wiping dynamic background
    const htmlEl = document.documentElement;
    const currentTheme = htmlEl.getAttribute('data-theme') || 'light';
    const currentMode = htmlEl.getAttribute('data-theme-mode') || 'auto';

    if (isHomeUrl(url)) {
      htmlEl.setAttribute('data-anhad-home', '');
      // Falling back to htmlEl.getAttribute('data-time-of-day') here is only
      // valid when Home is the page we're LEAVING. Arriving at Home from
      // Insights/Favorites, that attribute was just removed by this same
      // function's own non-Home branch on the PREVIOUS navigation — so
      // timeOfDay resolved to null, every slot comparison below silently
      // fell through to the 'day'/light default, and this painted the wrong
      // background for one frame until AnhadTheme.apply() (a few lines down,
      // computing the real hour-based slot independently) corrected it —
      // a real, visible light-to-dark (or vice versa) flash on every arrival
      // at Home from another page. Compute it the same way
      // global-theme.js's getAutoTheme()/applyTheme() do instead of trusting
      // a DOM attribute that may have just been cleared.
      let timeOfDay = localStorage.getItem('anhad_forced_time_of_day');
      if (!timeOfDay || !['morning', 'day', 'evening', 'night'].includes(timeOfDay)) {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 9) timeOfDay = 'morning';
        else if (hour >= 9 && hour < 16) timeOfDay = 'day';
        else if (hour >= 16 && hour < 20) timeOfDay = 'evening';
        else timeOfDay = 'night';
      }
      const isDark = currentMode === 'dark' || currentTheme === 'dark' || htmlEl.classList.contains('dark-mode');
      if (currentMode === 'light') {
        htmlEl.removeAttribute('data-time-of-day');
        htmlEl.style.setProperty('background-color', '#FAF8F5', 'important');
      } else if (isDark) {
        htmlEl.setAttribute('data-time-of-day', 'night');
        htmlEl.style.setProperty('background-color', '#0D0D0F', 'important');
      } else {
        htmlEl.setAttribute('data-time-of-day', timeOfDay);
        let autoBg = '#FAF8F5';
        if (timeOfDay === 'morning') autoBg = '#FFF5EC';
        else if (timeOfDay === 'day') autoBg = '#FAF8F5';
        else if (timeOfDay === 'evening') autoBg = '#FFF8E7';
        else if (timeOfDay === 'night') autoBg = '#0D0D0F';
        htmlEl.style.setProperty('background-color', autoBg, 'important');
      }
    } else {
      htmlEl.removeAttribute('data-anhad-home');
      htmlEl.removeAttribute('data-time-of-day');
      htmlEl.style.removeProperty('--dynamic-bg-url');
      // The eight --sky-card-* custom properties are set INLINE on <html> by
      // anhad-sky-bg.js, so they are invisible to the data-spa-page CSS
      // ownership system below and survive the swap unless cleared explicitly.
      // Left behind, they tint shared card/nav classes on Insights/Favorites.
      if (window.AnhadSky && window.AnhadSky.clearTimeAdaptiveCardColors) {
        try { window.AnhadSky.clearTimeAdaptiveCardColors(); } catch (e) {}
      }
      htmlEl.style.setProperty('background-color', currentTheme === 'dark' ? '#0D0D0F' : '#FAF8F5', 'important');
    }

    // Resolve relative asset paths on new content before mounting
    resolveRelativePaths(newApp, url);

    // 3. Swap #app — both its contents AND its own identity attributes, so the
    //    page renders under the same container it would on a hard refresh.
    syncElementAttributes(currentApp, newApp);
    currentApp.innerHTML = newApp.innerHTML;

    // 4. Only now retire the outgoing page's CSS.
    deactivateForeignPageCss(newPageKey);

    // Update URL history
    if (!options.replace) {
      history.pushState({ spa: true, url: url }, '', url);
    } else {
      history.replaceState({ spa: true, url: url }, '', url);
    }

    // Execute Page-Specific Scripts
    await executePageScripts(newDoc, url);

    // Restore saved scroll for this URL, or scroll to top if first visit
    if (!options.keepScroll) {
      restoreScrollPosition(url);
    }
    document.documentElement.style.overscrollBehaviorY = 'auto';

    // Re-apply global theme to new content
    if (window.AnhadTheme) {
      try { window.AnhadTheme.apply(window.AnhadTheme.get()); } catch(e) {}
    }
    
    // Re-apply sky background + hero images ONLY if on Home
    if (window.AnhadSky && isHomeUrl(url)) {
      try {
        window.AnhadSky.applyTimeOfDay();
        window.AnhadSky.updateHeroCardImages();
      } catch(e) {}
    }

    if (typeof window.syncGreetingHeroArtwork === 'function') {
      try { window.syncGreetingHeroArtwork(); } catch(e) {}
    }

    // Synchronize bottom navigation active tab
    syncBottomNav(url);

    // Run registered Page Init Lifecycle
    runPageInit(url);

    // Force absolute path resolution on newly swapped content
    resolveRelativePaths(currentApp, url);
    absoluteifyShellLinks();

    // Ensure global SVG sprite and refresh all SVG <use> elements across DOM
    if (window.AnhadSvgSprite && typeof window.AnhadSvgSprite.ensure === 'function') {
      window.AnhadSvgSprite.ensure();
    }
    refreshSvgUses(document);

    // Re-init core components
    if (window.AnhadCore && window.AnhadCore.init) {
      window.AnhadCore.init();
    }

    currentActiveUrl = url;
    
    // Dispatch standard page changed event
    window.dispatchEvent(new CustomEvent('anhad_page_changed', { detail: { url } }));

    // Refresh mini-player so it reliably reappears when coming back from full-screen pages
    // (e.g. Gurbani Radio → Home/Favorites/Insights) without requiring a play-button tap
    setTimeout(() => {
      if (typeof window.AnhadUpdateOverlayUI === 'function') {
        window.AnhadUpdateOverlayUI();
      }
    }, 80);
  }

  /**
   * Refreshes SVG <use> elements so browser engine re-evaluates symbol instances
   */
  function refreshSvgUses(container = document) {
    try {
      const uses = container.querySelectorAll('use');
      uses.forEach(useEl => {
        const href = useEl.getAttribute('href') || useEl.getAttribute('xlink:href');
        if (href && href.startsWith('#')) {
          useEl.setAttribute('href', href);
          useEl.setAttribute('xlink:href', href);
        }
      });
    } catch(e) {}
  }

  /**
   * Fixes relative paths in newly injected content to prevent 404s
   */
  function resolveRelativePaths(container, baseUrl) {
    const base = new URL(baseUrl, window.location.origin);
    const selectors = 'img[src], script[src], a[href], source[srcset], article[data-href]';
    
    container.querySelectorAll(selectors).forEach(el => {
      const attr = el.tagName === 'SOURCE' ? 'srcset' : 
                   (el.hasAttribute('data-href') ? 'data-href' : 
                   (el.hasAttribute('src') ? 'src' : 'href'));
                   
      let val = el.getAttribute(attr);
      if (!val || val.startsWith('http') || val.startsWith('/') || val.startsWith('#') || val.startsWith('data:')) return;
      
      try {
        const resolved = new URL(val, base);
        const resolvedStr = resolved.pathname + resolved.search + resolved.hash;
        el.setAttribute(attr, resolvedStr);
      } catch(e) {}
    });
  }

  /**
   * Resolves relative links and images inside shell elements
   */
  function absoluteifyShellLinks() {
    const root = window.ANHAD_ROOT;
    if (!root) return;
    
    const shellSelectors = ['.desktop-sidebar', '.tab-bar', '#bottomNav', '#mainNav'];
    shellSelectors.forEach(selector => {
      const shellEl = document.querySelector(selector);
      if (!shellEl) return;
      
      shellEl.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('/') || href.startsWith('#')) return;
        
        try {
          const resolved = new URL(href, root).pathname;
          link.setAttribute('href', resolved);
        } catch (e) {}
      });
      
      shellEl.querySelectorAll('img[src]').forEach(img => {
        const src = img.getAttribute('src');
        if (!src || src.startsWith('http') || src.startsWith('/') || src.startsWith('data:')) return;
        
        try {
          const resolved = new URL(src, root).pathname;
          img.setAttribute('src', resolved);
        } catch (e) {}
      });
    });
  }

  function ensureLoader() {
    let loader = document.querySelector('.nav-loading-overlay');
    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'nav-loading-overlay';
      loader.innerHTML = `
        <div class="nav-loading-overlay__shimmer"></div>
        <div class="nav-loading-overlay__spinner"></div>
      `;
      document.body.appendChild(loader);
    }
    return loader;
  }

  const SHARED_STYLESHEET_ALLOWLIST = [
    'theme-variables.css',
    'anhad-core.css',
    'trendora-premium.css',
    'anhad-clay.css',
    'claymorphism-system.css',
    'nav-glass.css',
    'no-shadows.css',
    // 'mobile-lock.css' deliberately NOT listed, same reasoning as
    // ios-override.css below. It is loaded by Insights/Favorites but NOT by
    // index.html, and allowlisting it meant it was never tagged data-spa-page
    // and therefore never deactivatable — so after one visit to either page its
    // rules (a landscape `body { transform: rotate(-90deg) }` block and
    // `* { max-width: 100% }`) stayed live on Home for the rest of the session.
    // Treating it as page-owned lets deactivateForeignPageCss() mute it off Home.
    'font-awesome',
    'all.min.css',
    'global-mini-player.css',
    'anhad-sky-bg.css',
    // 'ios-override.css' deliberately NOT listed. It is loaded by index.html
    // ONLY, but allowlisting it meant it was never tagged data-spa-page, never
    // claimed, and therefore never deactivatable — so Home's time-of-day card
    // rules stayed live on Insights/Favorites for the rest of the session and
    // repainted their .glass-card elements cream/orange. Treating it as
    // page-owned lets deactivateForeignPageCss() mute it off Home, which is
    // what makes SPA-navigated Insights match a hard refresh of Insights.
    'hero-clean-desktop.css',
    'desktop-responsive.css',
    'gurpurab-special-mode.css',
    'gurpurab-event-semantics.css',
    'mobile-accessibility.css',
    'install-button.css',
    'scroll-engine.css'
  ];

  /**
   * Syncs new CSS links AND inline style blocks from the target document.
   */
  /**
   * Installs and ACTIVATES the incoming page's CSS. Purely additive — it never
   * removes or deactivates anything, so it is safe to run before the DOM swap.
   * Deactivating the outgoing page's CSS happens after the swap, in
   * applyNewContent(), via deactivateForeignPageCss().
   */
  async function syncHeadAssets(newDoc, sourceUrl) {
    const pageKey = pageKeyForUrl(sourceUrl);

    // Index what's already installed, keyed by resolved PATHNAME — not the
    // full href. The same physical stylesheet is referenced with differing
    // cache-busting queries across pages (`anhad-sky-bg.css?v=2` here, bare
    // there), and keying on the full URL treated those as different sheets, so
    // each one got installed a second time on first navigation. Within a
    // single session they are the same bytes; reuse the installed node.
    const cssKey = (u) => {
      try { return new URL(u, window.location.origin).pathname; }
      catch (e) { return u; }
    };
    const existingByHref = new Map();
    document.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
      if (!l.href) return;
      const k = cssKey(l.href);
      if (!existingByHref.has(k)) existingByHref.set(k, l);
    });

    const loadPromises = [];

    Array.from(newDoc.querySelectorAll('link[rel="stylesheet"]')).forEach(style => {
      const href = style.getAttribute('href');
      if (!href) return;
      let absoluteHref;
      try {
        absoluteHref = new URL(href, sourceUrl).href;
      } catch (e) {
        return;
      }

      const existing = existingByHref.get(cssKey(absoluteHref));
      if (existing) {
        // Already installed — possibly deactivated by an earlier navigation.
        // Re-activate in place; no re-fetch, no re-parse, no flash.
        if (existing.hasAttribute('data-spa-page')) {
          existing.setAttribute('data-spa-page', pageKey);
        }
        setPageCssActive(existing, true);
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = absoluteHref;

      const isRemote = absoluteHref.startsWith('http') && !absoluteHref.includes(window.location.host);
      if (!isRemote && !isSharedStylesheetHref(absoluteHref) && pageKey) {
        link.setAttribute('data-spa-page', pageKey);
        link.setAttribute('data-spa-media', 'all');
      }
      if (!isRemote) {
        loadPromises.push(new Promise(resolve => {
          link.onload = resolve;
          link.onerror = resolve;
        }));
      }
      document.head.appendChild(link);
    });

    // Inline <style> blocks from the incoming page's <head>.
    // Favorites in particular keeps its ENTIRE design system in one inline
    // block, so losing this is the difference between a styled page and raw HTML.
    const alreadyInstalled = pageKey
      ? document.querySelectorAll(`style[data-spa-page="${pageKey}"]`)
      : [];

    if (alreadyInstalled.length > 0) {
      alreadyInstalled.forEach(el => setPageCssActive(el, true));
    } else {
      const headStyles = Array.from(newDoc.head.querySelectorAll('style'));
      if (headStyles.length > 0) {
        const combinedCSS = headStyles.map(s => s.textContent).join('\n');
        const absoluteCSS = combinedCSS.replace(
          /url\(['"]?([^'")\s]+)['"]?\)/g,
          (match, relUrl) => {
            if (!relUrl || relUrl.startsWith('http') || relUrl.startsWith('/') ||
                relUrl.startsWith('data:') || relUrl.startsWith('#')) {
               return match;
            }
            try {
              return `url('${new URL(relUrl, sourceUrl).href}')`;
            } catch(e) {
              return match;
            }
          }
        );
        const styleEl = document.createElement('style');
        if (pageKey) {
          styleEl.setAttribute('data-spa-page', pageKey);
          styleEl.setAttribute('data-spa-media', 'all');
        }
        styleEl.textContent = absoluteCSS;
        document.head.appendChild(styleEl);
      }
    }

    if (loadPromises.length > 0) {
      // On first-ever visit to a page the stylesheet is not in the HTTP cache and
      // must download from the network — 150ms was too short on a real Android
      // device over Wi-Fi, causing content to render unstyled for one frame (the
      // "HTML loads then CSS loads" flash the user reported). 800ms is the outer
      // bound; the race resolves immediately once ALL sheets have loaded, so fast
      // connections are unaffected.
      await Promise.race([
        Promise.all(loadPromises),
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
    }
  }

  /**
   * True if a script with this src is already in the document.
   *
   * Compares by pathname, not full href: the SAME file is referenced with
   * different cache-busting queries across pages (Insights loads
   * `smooth-navigation.js?v=2`, Home loads it bare), and those are one script
   * as far as "has this already executed in this realm" is concerned.
   */
  function findLoadedScripts(absoluteSrc) {
    let targetPath;
    try {
      targetPath = new URL(absoluteSrc, window.location.origin).pathname;
    } catch (e) {
      return [];
    }
    return Array.from(document.querySelectorAll('script[src]')).filter(el => {
      try {
        return new URL(el.src, window.location.origin).pathname === targetPath;
      } catch (e) {
        return false;
      }
    });
  }

  function isScriptAlreadyLoaded(absoluteSrc) {
    return findLoadedScripts(absoluteSrc).length > 0;
  }

  /**
   * Injects a SHELL_SCRIPTS entry, retrying once on failure instead of
   * silently treating a failed fetch as success.
   *
   * Previously both onload and onerror called the same `resolve`, so a
   * flaky connection (far more likely on a real phone than on localhost)
   * left trendora-app.js/homepage-data.js/anhad-sky-bg.js permanently
   * unloaded for the rest of the session — nothing logged, nothing retried,
   * Home silently stuck half-initialized. A failed attempt is also removed
   * from the DOM: isScriptAlreadyLoaded() only checks whether a <script> tag
   * with this src exists, not whether it actually loaded, so leaving the
   * failed tag in place would have permanently convinced every later
   * navigation this script was "already loaded" and skip it forever.
   */
  function loadShellScriptWithRetry(sourceScript, absoluteSrc) {
    function attempt() {
      return new Promise((resolve) => {
        const el = document.createElement('script');
        Array.from(sourceScript.attributes).forEach(attr => {
          if (attr.name !== 'src') el.setAttribute(attr.name, attr.value);
        });
        // A dynamically-created <script> defaults to async, and the `defer`
        // attribute copied above is ignored for such scripts — so without
        // this these would race each other. These are the page's own content
        // scripts and can depend on document order, so force ordered exec.
        el.async = false;
        el.src = absoluteSrc;
        el.onload = () => resolve(true);
        el.onerror = () => {
          el.remove();
          resolve(false);
        };
        document.body.appendChild(el);
      });
    }

    return attempt().then((ok) => {
      if (ok) return;
      console.warn('[SmoothNav] Shell script failed to load, retrying once:', absoluteSrc);
      return attempt().then((retryOk) => {
        if (!retryOk) {
          console.error('[SmoothNav] Shell script failed again after retry — will try again on the next navigation:', absoluteSrc);
        }
      });
    });
  }

  /**
   * Finds and executes scripts from the new document.
   */
  async function executePageScripts(newDoc, sourceUrl) {
    const scripts = Array.from(newDoc.body.querySelectorAll('script'));
    const externalScripts = [];

    // EXECUTED_INLINE_PAGES is still recorded (other code reads it), but the
    // `isFirstVisit` local it used to feed was never read — inline scripts are
    // re-run on every arrival regardless. Removed so it stops implying a
    // first-visit fast path that does not exist.
    const pageKey = new URL(sourceUrl, window.location.origin).pathname;
    EXECUTED_INLINE_PAGES.add(pageKey);
    
    for (const script of scripts) {
      const src = script.getAttribute('src');

      // SHELL_SCRIPTS means "already owned by the live JS realm — don't run it
      // a SECOND time", NOT "never load it". Those are only the same thing for
      // scripts every SPA page ships. trendora-app.js / homepage-data.js /
      // anhad-sky-bg.js are Home-ONLY, and Insights/Favorites don't load them —
      // so an unconditional `continue` meant that arriving at Home from a
      // hard-refreshed Insights left Home with none of its content scripts ever
      // loaded, rendering the raw shipped placeholders (empty guru slider,
      // skeleton event card, a literal "-- days left"). Skip only when the
      // script is genuinely already in this document; otherwise fall through
      // and inject it once. Revisits still skip it, so nothing re-runs and the
      // no-double-flash behaviour is preserved.
      if (src && SHELL_SCRIPTS.some(shell => src.includes(shell))) {
        let shellAbsoluteSrc;
        try {
          shellAbsoluteSrc = new URL(src, sourceUrl).href;
        } catch (e) {
          continue;
        }
        if (isScriptAlreadyLoaded(shellAbsoluteSrc)) continue;
        externalScripts.push(loadShellScriptWithRetry(script, shellAbsoluteSrc));
        continue;
      }

      if (src) {
        const absoluteSrc = new URL(src, sourceUrl).href;
        // Match on the RESOLVED url, not an attribute selector. The page's
        // original tags carry relative attributes (src="lib/fetch-utils.js"),
        // so `script[src="http://host/lib/fetch-utils.js"]` never matched them
        // — the old copy was left in place and a second, absolute-src copy was
        // appended, permanently doubling every re-executed body script.
        findLoadedScripts(absoluteSrc).forEach(el => el.remove());
        externalScripts.push(new Promise((resolve) => {
          const newScript = document.createElement('script');
          Array.from(script.attributes).forEach(attr => {
            // CRITICAL FIX: Skip setting relative 'src' attribute to prevent premature 404
            if (attr.name !== 'src') {
              newScript.setAttribute(attr.name, attr.value);
            }
          });
          newScript.src = absoluteSrc;
          newScript.onload = resolve;
          newScript.onerror = resolve;
          document.body.appendChild(newScript);
        }));
      } else {
        const content = script.textContent;
        if (content.includes('serviceWorker.register') || content.includes('location.reload')) {
          continue;
        }
        
        const newScript = document.createElement('script');
        newScript.textContent = "(function(){\n" + content + "\n})();";
        document.body.appendChild(newScript);
        // Remove the node once it has run. Inline scripts execute synchronously
        // on append, so by this line the work is done and the element is inert
        // DOM. Left in place (the previous behaviour) every visit to Home added
        // 12 more permanent <script> nodes — and, worse, each kept its closure
        // scope alive, so stale copies of Home's audio listeners kept firing
        // with their own out-of-date state.
        newScript.remove();
      }
    }
    
    if (externalScripts.length > 0) {
      await Promise.all(externalScripts);
    }
  }

  const MAX_CONCURRENT_PREFETCH = 2;
  
  async function prefetchPage(url) {
    if (!url || url.includes('#')) return;
    const resolvedUrl = resolveAppUrl(url);
    // Only SPA-navigable pages are worth caching. navigateTo() hands anything
    // else to a full page load, so its HTML can never be served from
    // PAGE_CACHE — fetching it is pure waste that also pins the bytes in
    // memory. The bottom tab bar is permanently in-viewport, so the
    // IntersectionObserver prefetcher was eagerly pulling
    // sadhsangat-live/index.html (~383 KB) into the cache on every cold load.
    if (!isShellPage(resolvedUrl)) return;
    const normalized = normalizeUrl(resolvedUrl);
    if (PAGE_CACHE.has(normalized) || FETCH_QUEUE.has(normalized)) return;
    if (FETCH_QUEUE.size >= MAX_CONCURRENT_PREFETCH) return;

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')) return;
    
    const targetUrl = new URL(resolvedUrl, window.location.origin);
    if (targetUrl.origin !== window.location.origin) return;

    FETCH_QUEUE.add(normalized);
    try {
      const response = await fetch(resolvedUrl);
      if (response.ok) {
        const text = await response.text();
        cachePage(normalized, text);
      }
    } catch (e) {
    } finally {
      FETCH_QUEUE.delete(normalized);
    }
  }

  function setupLinkInterception() {
    document.addEventListener('click', e => {
      const link = e.target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#') && !link.hasAttribute('data-no-spa')) {
          if (href.endsWith('index.html') || href.endsWith('/index') || href === '../' || href === './') {
            try {
              sessionStorage.setItem('anhad_welcomed', '1');
              localStorage.setItem('anhad_welcome_seen', 'true');
              localStorage.setItem('anhad_session_active_ts', Date.now().toString());
            } catch(e) {}
          }
          e.preventDefault();
          window.navigateTo(href);
          return;
        }
      }

      const clickable = e.target.closest('[data-href]');
      if (clickable) {
        if (clickable.hasAttribute('onclick') && clickable.getAttribute('onclick').includes('location.href')) {
          return;
        }
        const href = clickable.getAttribute('data-href');
        if (href) {
          e.preventDefault();
          window.navigateTo(href);
          return;
        }
      }
    });

    document.addEventListener('mouseover', e => {
      const el = e.target.closest('a, [data-href]');
      if (el) {
        const href = el.getAttribute('href') || el.getAttribute('data-href');
        prefetchPage(href);
      }
    });

    document.addEventListener('touchstart', e => {
      const el = e.target.closest('a, [data-href]');
      if (el) {
        const href = el.getAttribute('href') || el.getAttribute('data-href');
        prefetchPage(href);
      }
    }, { passive: true });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        try {
          sessionStorage.setItem('anhad_welcomed', '1');
          localStorage.setItem('anhad_welcome_seen', 'true');
          localStorage.setItem('anhad_session_active_ts', Date.now().toString());
        } catch(ex) {}
      }

      runPageCleanup(currentActiveUrl);

      const targetUrl = normalizeUrl(window.location.href);
      const cached = PAGE_CACHE.get(targetUrl);
      if (cached) {
        // applyNewContent is async and does DOM surgery. Called bare, any throw
        // became an unhandled rejection that left a half-swapped document with
        // no way out but a manual refresh — performSwap's try/catch fallback
        // only covers the non-cached branch below. Mirror that safety net here,
        // and hold navInFlight for the duration so a rapid back/forward burst
        // can't interleave two swaps.
        if (navInFlight) return;
        navInFlight = targetUrl;
        Promise.resolve(applyNewContent(cached, targetUrl, { replace: true, isBack: true }))
          .catch(err => {
            console.error('[SmoothNav] Back-navigation swap failed, falling back to full reload:', err);
            window.location.href = toFetchUrl(targetUrl);
          })
          .finally(() => { navInFlight = null; });
      } else {
        performSwap(targetUrl, { replace: true, isBack: true });
      }
    });

    // Integrate with Capacitor native back button
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      window.Capacitor.Plugins.App.addListener('backButton', () => {
        if (history.length > 1) {
          history.back();
        } else {
          window.Capacitor.Plugins.App.exitApp();
        }
      });
    }

    initViewportPrefetch();
  }

  function initViewportPrefetch() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          observer.unobserve(el);
          if (!el.isConnected) return;
          const href = el.getAttribute('href') || el.getAttribute('data-href');
          prefetchPage(href);
        }
      });
    }, { rootMargin: '100px' });

    function observeNewLinks() {
      document.querySelectorAll('a:not([data-observed]), [data-href]:not([data-observed])').forEach(el => {
        const href = el.getAttribute('href') || el.getAttribute('data-href');
        if (href && !href.startsWith('http') && !href.startsWith('#')) {
          el.setAttribute('data-observed', 'true');
          observer.observe(el);
        }
      });
    }

    observeNewLinks();
    window.addEventListener('anhad_page_changed', observeNewLinks);
    
    if ('MutationObserver' in window) {
      let mutationTimeout = null;
      const domObserver = new MutationObserver(function() {
        clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(observeNewLinks, 1000);
      });
      window._anhadDomObserver = domObserver;

      const startObserving = () => {
        if (document.body) {
          domObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
          });
        }
      };

      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', startObserving);
      } else {
        startObserving();
      }
    }
  }

  function convertOnclickToDataHref() {
    document.querySelectorAll('[onclick*="location.href"]').forEach(el => {
      const onclick = el.getAttribute('onclick');
      const match = onclick.match(/location\.href\s*=\s*['"](.*?)['"]/);
      if (match && match[1]) {
        el.setAttribute('data-href', match[1]);
      }
    });
  }

  setupLinkInterception();
  convertOnclickToDataHref();
  absoluteifyShellLinks();
  
  window.addEventListener('anhad_page_changed', convertOnclickToDataHref);

  // Eviction runs on WRITE, not on a timer. The previous timer-based version
  // was torn down by the first `pagehide` with { once: true } — and pagehide
  // fires whenever a mobile PWA is backgrounded, so after the first time the
  // user switched apps the cache grew without bound for the rest of the
  // session. Each entry is a full HTML document held as a JS string, so that
  // was multiple MB of retained memory — the likeliest cause of the renderer
  // being discarded and the app "reloading itself" (the reported instability).
  function cachePage(key, html) {
    PAGE_CACHE.set(key, html);
    if (PAGE_CACHE.size <= PAGE_CACHE_MAX) return;
    // Map preserves insertion order: drop oldest first, but never evict the
    // entry for the page currently on screen.
    for (const k of PAGE_CACHE.keys()) {
      if (PAGE_CACHE.size <= PAGE_CACHE_MAX) break;
      if (k !== currentActiveUrl) PAGE_CACHE.delete(k);
    }
  }

  // Home-only content scripts. Not in SHELL_SCRIPTS' sense of "always
  // present" — Insights/Favorites never load them, so the FIRST arrival at
  // Home from either one has to fetch, parse, and execute these (112KB+
  // combined) after the DOM swap, before the guru slider / event card /
  // sky background can populate. That gap is exactly the "flash like a
  // reload happened" — real, not perceived: a real trace showed the guru
  // slider sitting empty for ~140ms after the swap on a bare localhost
  // round-trip; on a real network it's worse. Warming these into the HTTP
  // cache while the user is idle on Insights/Favorites (nothing to lose —
  // they're no-cache/etag-revalidated per backend/server.js, so a warm
  // fetch here just means the later real one resolves from a fast
  // conditional 304 instead of a cold full download) hides most of that gap
  // without changing the actual loading mechanism in executePageScripts().
  const HOME_ONLY_SCRIPTS = [
    'js/trendora-app.js',
    'js/homepage-data.js',
    'js/anhad-sky-bg.js'
  ];

  function prefetchCoreShell() {
    setTimeout(() => {
      if (isHomeUrl(window.location.href)) return;

      HOME_ONLY_SCRIPTS.forEach(src => {
        try {
          const absolute = new URL(src, window.ANHAD_ROOT || '/').href;
          if (isScriptAlreadyLoaded(absolute)) return;
          fetch(absolute).catch(() => {});
        } catch (e) {}
      });

      try {
        const homeUrl = new URL('index.html', window.ANHAD_ROOT || '/').href;
        prefetchPage(homeUrl);
      } catch (e) {}
    }, 1500);

    setTimeout(() => {
      const shellPages = [
        'Insights/insights.html',
        'Favorites/favorites.html',
        'sadhsangat-live/index.html'
      ];
      shellPages.forEach(url => {
        try {
          const absolute = new URL(url, window.ANHAD_ROOT || '/').href;
          prefetchPage(absolute);
        } catch (e) {}
      });

      // Pre-warm Insights' stylesheet into the browser HTTP cache so the first
      // SPA navigation to Insights does not suffer the HTML-before-CSS flash.
      // This is a simple background fetch — the browser caches the bytes under
      // the same key syncHeadAssets() later requests via a <link> tag.
      try {
        const insightsCssUrl = new URL('Insights/insights.css', window.ANHAD_ROOT || '/').href;
        fetch(insightsCssUrl, { priority: 'low' }).catch(() => {});
      } catch (e) {}
    }, 100);
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', prefetchCoreShell);
  } else {
    prefetchCoreShell();
  }

})();
