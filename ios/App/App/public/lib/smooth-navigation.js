/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMOOTH NAVIGATION (App Shell Engine v4 - ULTRA FAST)
 *
 * This script turns the app into a high-performance Single Page Application (SPA).
 * Features:
 * - Proactive In-Memory Caching (Zero-latency transitions)
 * - Proactive Fetching on Hover/Touch
 * - View Transitions API Support
 * - Intersection Observer Pre-fetching (Prefetches links in viewport)
 * - Hardware Back Button Integration
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  // Set to true only for debugging — kills all console.log overhead in production
  const NAV_DEBUG = false;

  const MAIN_TARGET_ID = 'app';
  const PAGE_CACHE = new Map();
  const DOM_CACHE = new Map(); // For keepAlive strategy
  const FETCH_QUEUE = new Set();
  // Tracks which pages have had their inline body scripts executed.
  // Inline scripts declaring top-level 'const'/'let' can only run once per session.
  // Re-visits rely on anhad_page_changed event for re-initialization.
  const EXECUTED_INLINE_PAGES = new Set();
  
  /**
   * Normalizes a URL for caching and history comparison ONLY.
   * IMPORTANT: Do NOT use this URL for fetch() — it may strip index.html which
   * causes a directory listing to be served instead of the actual page.
   * Use toFetchUrl() for the actual network request.
   */
  function normalizeUrl(url) {
    try {
      const u = new URL(url, window.location.origin);
      let path = u.pathname;
      // Remove trailing slash if not root
      if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
      // Only strip /index.html from the root (e.g. /index.html → /)
      // Do NOT strip from subdirectories — /nitnem/index.html must stay as /nitnem/index.html
      // otherwise Python's http.server returns a directory listing
      if (path === '/index.html') path = '/';
      return u.origin + path + u.search;
    } catch (e) {
      return url;
    }
  }

  /**
   * Returns the actual URL to use for fetch().
   * If the path ends with a bare directory (trailing slash or no extension),
   * appends index.html so the server serves the file, not a directory listing.
   */
  function toFetchUrl(normalizedUrl) {
    try {
      const u = new URL(normalizedUrl, window.location.origin);
      let path = u.pathname;
      // If URL points to a directory (ends with / or has no file extension at end)
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
  
  // Cache the initial page's #app content immediately (not full outerHTML — saves ~2MB memory)
  const _initApp = document.getElementById('app');
  if (_initApp) {
    PAGE_CACHE.set(currentActiveUrl, document.documentElement.outerHTML);
  }


  // NOTE: DOMContentLoaded polyfill removed — it caused every SPA swap to
  // re-fire DOMContentLoaded on ALL previously loaded scripts, causing
  // duplicate initialisation of App.init(), AudioSync, Scheduler, etc.
  // Each page's scripts are now dispatched via 'anhad_page_changed' instead.

  const SHELL_SCRIPTS = [
    'overlay-player.js',
    'smooth-navigation.js',
    'global-theme.js',
    'audio-coordinator.js',
    'anhad-audio-singleton.js',
    'anhad-core.js',
    'pwa-register.js',
    'smart-back.js',
    'page-lifecycle.js',
    'welcome-check.js',
    'state-preservation.js',
    // NOTE: hub-app.js is NOT here - it's nitnem/js/hub-app.js (page-specific, must re-run)
    'trendora-app.js',
    'ultra-welcome-loader.js',
    'homepage-data.js',
    'capacitor-bridge.js',
    // Library singletons - lazy-loaded by nitnem but define global classes:
    'storage-manager.js',      // declares class StorageManager
    'widget-bridge.js',        // declares class WidgetBridge / WidgetBridge identifier
    'anhad-widget-bridge.js',  // same
    'gurbani-db.js',           // declares class GurbaniDB
    'bani-cache-optimizer.js', // declares class BaniCacheOptimizer
    'optimized-image-loader.js', // declares class OptimizedImageLoader
    'gurbani-local-db.js',     // global singleton
    'gurbani-download-manager.js', // global singleton
    'capacitor-notifications-global.js', // global singleton
  ];


  // Resolve App Root once on load (robustly handles query strings)
  const navScriptTag = document.querySelector('script[src*="smooth-navigation.js"]');
  if (navScriptTag) {
    const url = new URL(navScriptTag.src);
    const parts = url.pathname.split('lib/smooth-navigation.js');
    window.ANHAD_ROOT = url.origin + parts[0];
  } else {
    // Dynamic resolution fallback with protocol/origin
    const path = window.location.pathname;
    const marker = '/frontend/';
    const idx = path.indexOf(marker);
    if (idx !== -1) {
      window.ANHAD_ROOT = window.location.origin + path.substring(0, idx + marker.length);
    } else {
      window.ANHAD_ROOT = window.location.origin + '/ANHAD-FINAL/frontend/';
    }
  }
      NAV_DEBUG &&   console.log('[SmoothNav] App Root resolved to:', window.ANHAD_ROOT);

  // Fix icon paths to absolute to prevent 404s during SPA navigation
  document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]').forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('/')) {
      link.setAttribute('href', new URL(href, window.ANHAD_ROOT).href);
    }
  });

  /**
   * Navigate to a URL using AJAX swap and View Transitions
   * @param {string} url - Destination URL
   * @param {Object} options - Navigation options
   */
  /**
   * Determine if a URL is part of the core Home App Shell pages
   * (Home, Learning, Favorites, Dashboard) which are perfectly compatible with SPA swapping
   */
  function isShellPage(url) {
    try {
      const pathname = new URL(url, window.location.origin).pathname;
      const cleanPath = pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
      
      return cleanPath.endsWith('/frontend') || 
             cleanPath.endsWith('/frontend/index.html') ||
             cleanPath.endsWith('/frontend/index') ||
             cleanPath.endsWith('/index.html') ||
             cleanPath.endsWith('/index') ||
             cleanPath.endsWith('/') || 
             cleanPath === '' ||
             cleanPath.endsWith('/Insights/insights.html') ||
             cleanPath.endsWith('/Insights/insights') ||
             cleanPath.endsWith('/Favorites/favorites.html') ||
             cleanPath.endsWith('/Favorites/favorites') ||
             cleanPath.endsWith('/Dashboard/dashboard.html') ||
             cleanPath.endsWith('/Dashboard/dashboard');
    } catch (e) {
      return false;
    }
  }

  window.navigateTo = async function(url, options = {}) {
    if (!url || typeof url !== 'string') return;

    // Resolve to absolute URL using window.location.href for correct relative path handling
    const absoluteUrl = new URL(url, window.location.href).href;
    const normalized = normalizeUrl(absoluteUrl);
    
    if (normalized === currentActiveUrl && !options.force) return;

    // CRITICAL: Before navigating to index.html, always stamp session flags so
    // welcome-check.js NEVER triggers the splash/welcome screen redirect.
    if (absoluteUrl.endsWith('/index.html') || absoluteUrl.endsWith('/index') ||
        absoluteUrl.endsWith('/') || absoluteUrl === window.ANHAD_ROOT) {
      try {
        sessionStorage.setItem('anhad_welcomed', '1');
        localStorage.setItem('anhad_welcome_seen', 'true');
        localStorage.setItem('anhad_session_active_ts', Date.now().toString());
      } catch(e) {}
    }

    // ─── SELECTIVE SPA SWAP FOR APP SHELL PAGES ──────────────────────────────
    // Core Home App Shell pages share identical styling and singletons.
    // They are perfectly compatible with instant view-transition AJAX swaps.
    // All subdirectories (nitnem, GurbaniKhoj, SehajPaath, readers) operate
    // as standalone apps and are loaded as full reloads to prevent leaks.
    // ─────────────────────────────────────────────────────────────────────────
    if (isShellPage(absoluteUrl)) {
      NAV_DEBUG &&       console.log('[SmoothNav] SPA swap navigating to:', absoluteUrl);
      performSwap(absoluteUrl, options);
    } else {
      NAV_DEBUG &&       console.log('[SmoothNav] Full reload navigating to:', absoluteUrl);
      window.location.href = absoluteUrl;
    }
  };

  /**
   * Extracts the "module" directory from a pathname.
   * e.g. "/nitnem/index.html" → "nitnem"
   *      "/GurbaniKhoj/gurbani-khoj.html" → "GurbaniKhoj"
   *      "/index.html" → ""  (root)
   *      "/" → ""  (root)
   */
  function getModulePath(pathname) {
    // Strip leading slash and split
    const parts = pathname.replace(/^\/+/, '').split('/');
    // If there's only one part (e.g. "index.html") or empty, it's root
    if (parts.length <= 1) return '';
    // Otherwise return the first directory segment
    return parts[0];
  }

  /**
   * Safely starts a view transition, handling the .back-transition class.
   */
  async function safeStartTransition(callback, isBack, instant) {
    if ('startViewTransition' in document && !instant) {
      if (isBack) {
        document.documentElement.classList.add('back-transition');
      } else {
        document.documentElement.classList.remove('back-transition');
      }
      const transition = document.startViewTransition(callback);
      try {
        await transition.finished;
      } catch (e) {
        // Ignore view transition cancellation/errors
      } finally {
        document.documentElement.classList.remove('back-transition');
      }
    } else {
      await callback();
    }
  }

  /**
   * Fetch new page and swap content
   */
  async function performSwap(url, options = {}) {
    // Normalize for caching/history — but fetch the actual file URL
    url = normalizeUrl(url);
    const fetchUrl = toFetchUrl(url); // e.g. /nitnem/ → /nitnem/index.html

    // ── CACHE HIT: serve instantly from in-memory cache ──────────────────────
    const cachedHtml = PAGE_CACHE.get(url);
    if (cachedHtml) {
      NAV_DEBUG && console.log('[SmoothNav] Cache hit for:', url);
      await safeStartTransition(() => applyNewContent(cachedHtml, url, options), options.isBack, options.instant);
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Disconnect mutation observer during swap to prevent DOM-mutation storm
    if (window._anhadDomObserver) window._anhadDomObserver.disconnect();

    const loader = ensureLoader();
    let loaderTimeout = null;
    let transitionFinished = false;

    try {
      // Show loader after grace period (only for forward navigation, not back)
      loaderTimeout = setTimeout(() => {
        if (!transitionFinished && !options.isBack) {
          loader.classList.add('visible');
          document.body.classList.add('page-loading');
        }
      }, 120);

      // Use fetchUrl (with index.html) to avoid directory listing responses
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${fetchUrl}`);
      const text = await response.text();
      
      // Cache under the normalized URL (canonical key)
      PAGE_CACHE.set(url, text);
      
      transitionFinished = true;
      clearTimeout(loaderTimeout);
      loaderTimeout = null;
      
      await safeStartTransition(() => applyNewContent(text, url, options), options.isBack, options.instant);
      
    } catch (e) {
      console.error('[SmoothNav] SPA swap failed, falling back to full reload:', e);
      clearTimeout(loaderTimeout);
      window.location.href = fetchUrl;
    } finally {
      if (loaderTimeout) clearTimeout(loaderTimeout);
      loader.classList.remove('visible');
      document.body.classList.remove('page-loading');
      // Reconnect mutation observer after swap completes
      if (window._anhadDomObserver && document.body) {
        window._anhadDomObserver.observe(document.body, {
          childList: true, subtree: true, attributes: false, characterData: false
        });
      }
    }
  }

  /**
   * Applies the new content to the DOM
   */
  async function applyNewContent(htmlText, url, options) {
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(htmlText, 'text/html');

    // Extract targets
    const newApp = newDoc.getElementById(MAIN_TARGET_ID);
    const currentApp = document.getElementById(MAIN_TARGET_ID);

    if (!newApp || !currentApp) {
       console.warn('[SmoothNav] Target structure mismatch, attempting full reload');
       window.location.href = url;
       return;
    }

    // INSTANT HIDE: Before ANY DOM change, hide all module-specific out-of-app elements
    // This prevents them flashing during the swap (e.g. Nitnem bg-orbs, skeleton-container)
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

    // Update Shell elements (Title, Head assets)
    document.title = newDoc.title;
    
    // Sync critical navigation elements outside the main app area
    // We only sync if the element exists in BOTH to prevent shell elements from being replaced by page-specific ones
    const shellSelectors = [
      '#mainNav', '#main-nav', '#pageHeader', '#globalPlayer', 
      '.tab-bar', '.sidebar', '.desktop-sidebar', '.app-header'
    ];
    
    shellSelectors.forEach(selector => {
      const newNode = newDoc.querySelector(selector);
      const currentNode = document.querySelector(selector);
      
      if (newNode && currentNode) {
        // Sync contents if present in both
        if (newNode.innerHTML !== currentNode.innerHTML) {
          currentNode.innerHTML = newNode.innerHTML;
        }
      } else if (newNode && !currentNode) {
        // Inject shell element if it exists in the incoming page but is missing from active DOM
      NAV_DEBUG &&         console.log('[SPA] Dynamic Shell Sync — Injecting missing shell element:', selector);
        const clonedNode = newNode.cloneNode(true);
        
        // Find correct placement
        if (selector === '.desktop-sidebar') {
          const appEl = document.getElementById(MAIN_TARGET_ID);
          if (appEl) {
            appEl.parentNode.insertBefore(clonedNode, appEl);
          } else {
            document.body.prepend(clonedNode);
          }
        } else if (selector === '.tab-bar' || selector === '#bottomNav') {
          document.body.appendChild(clonedNode);
        } else {
          document.body.appendChild(clonedNode);
        }
      } else if (!newNode && currentNode) {
        // Remove shell element if it does not exist in the incoming page but exists in active DOM
      NAV_DEBUG &&         console.log('[SPA] Dynamic Shell Sync — Removing shell element:', selector);
        currentNode.remove();
      }
    });

    // MODULE CLEANUP: Remove module-specific elements that are OUTSIDE #app
    // If an element exists in current page but NOT in the new page, and it's not a shell element, remove it.
    const moduleSpecificSelectors = [
      '.bg-orbs', '.ikonkar-background', '#ikonkarBackground', '.bg-effects',
      '.skeleton-container', '#skeletonContainer', '#skeletonLoader',
      '.app-loading', '#appLoading', '.ultra-loader', '.ultra-welcome-loader',
      '.welcome-screen',
      // Hukamnama-specific elements
      '.hukam-player', '.action-bar', '.modal-overlay',
      // Other page-specific overlays
      '.live-caption-overlay', '.radio-menu'
    ];
    
    // Reset body classes and styles to prevent module-leakage
    const globalClasses = ['dark-mode', 'is-mobile', 'reduce-motion', 'theme-loaded'];
    const currentClasses = Array.from(document.body.classList);
    currentClasses.forEach(cls => {
      if (!globalClasses.includes(cls)) {
        document.body.classList.remove(cls);
      }
    });
    
    // Clear inline body styles to prevent leakage from any module
    // NOTE: Do NOT clear backgroundImage — anhad-sky-bg.js owns it.
    // Clearing it causes a 1-2 frame dark flash on every navigation.
    document.body.style.backgroundColor = '';
    document.body.style.overflow = '';
    document.body.style.minHeight = '';
    document.body.style.color = '';

    // Remove previously injected page-specific <style> blocks (prevents unbounded <head> growth)
    const oldPageStyles = document.querySelectorAll('style[data-spa-page]');
    const newPageKey = new URL(url, window.location.origin).pathname;
    oldPageStyles.forEach(el => {
      if (el.getAttribute('data-spa-page') !== newPageKey) el.remove();
    });
    
    moduleSpecificSelectors.forEach(selector => {
      const currentEl = document.querySelector(selector);
      const newEl = newDoc.querySelector(selector);
      
      if (currentEl && !newEl) {
      NAV_DEBUG &&         console.log('[SPA] Cleaning up module element:', selector);
        currentEl.remove();
      } else if (!currentEl && newEl) {
      NAV_DEBUG &&         console.log('[SPA] Injecting module element:', selector);
        // Clone to body but keep it outside #app
        document.body.appendChild(newEl.cloneNode(true));
      }
    });

    // Sync Head Assets and WAIT for new CSS to load before swapping content
    // This prevents the Flash Of Unstyled Content (FOUC) seen on SPA navigation
    await syncHeadAssets(newDoc, url);
    
    // SWAP CONTENT
    currentApp.innerHTML = newApp.innerHTML;
    
    // Update URL — store url in state so popstate can do cache lookup
    if (!options.replace) {
      history.pushState({ spa: true, url: url }, '', url);
    } else {
      history.replaceState({ spa: true, url: url }, '', url);
    }

    // Execute Page-Specific Scripts (Sequential & Async-aware)
    await executePageScripts(newDoc, url);

    // Scroll and Lifecycle
    // PERF FIX: Always use instant scroll — smooth scroll fights View Transitions
    // and causes visible jank as the animation and scroll conflict on the GPU.
    if (!options.keepScroll) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    document.documentElement.style.overscrollBehaviorY = 'auto';
    
    // Trigger lifecycle recovery
    if (window.AnhadPageLifecycle && window.AnhadPageLifecycle.recover) {
      window.AnhadPageLifecycle.recover();
    }
    
    // Force absolute path resolution on newly swapped content
    resolveRelativePaths(currentApp, url);
    absoluteifyShellLinks();

    // Re-init any core components
    if (window.AnhadCore && window.AnhadCore.init) {
      window.AnhadCore.init();
    }

    currentActiveUrl = url;
    window.dispatchEvent(new CustomEvent('anhad_page_changed', { detail: { url } }));
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
   * Resolves relative links inside shell elements (.desktop-sidebar, .tab-bar)
   * to absolute pathnames relative to window.ANHAD_ROOT.
   * This prevents directory nesting from corrupting links.
   */
  function absoluteifyShellLinks() {
    const root = window.ANHAD_ROOT;
    if (!root) return;
    
    const shellSelectors = ['.desktop-sidebar', '.tab-bar', '#bottomNav'];
    shellSelectors.forEach(selector => {
      const shellEl = document.querySelector(selector);
      if (!shellEl) return;
      
      shellEl.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('/') || href.startsWith('#')) return;
        
        try {
          // Resolve relative to the app root
          const resolved = new URL(href, root).pathname;
          link.setAttribute('href', resolved);
          console.log(`[SmoothNav] Resolved shell link: ${href} -> ${resolved}`);
        } catch (e) {
          console.warn('[SmoothNav] Failed to resolve shell link:', href, e);
        }
      });
    });
  }

  /**
   * Ensures the glass loader exists in the DOM
   */
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

  /**
   * Syncs new CSS links AND inline style blocks from the target document.
   * Returns a Promise that resolves ONLY after all new stylesheets have loaded.
   * This prevents Flash Of Unstyled Content (FOUC) during SPA transitions.
   *
   * CRITICAL: Pages like nitnem/index.html embed all their CSS in a massive
   * inline <style> block in <head>. Without syncing these, the SPA swap
   * renders completely unstyled content.
   */
  async function syncHeadAssets(newDoc, sourceUrl) {
    // ─── 1. Sync external <link rel="stylesheet"> ───────────────────────────
    const currentStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(l => new URL(l.getAttribute('href') || '', document.baseURI).href);
    const newStyles = Array.from(newDoc.querySelectorAll('link[rel="stylesheet"]'));

    const loadPromises = [];

    newStyles.forEach(style => {
      const href = style.getAttribute('href');
      if (href) {
        const absoluteHref = new URL(href, sourceUrl).href;
        if (!currentStyles.includes(absoluteHref)) {
      NAV_DEBUG &&           console.log('[SmoothNav] Loading stylesheet:', absoluteHref);
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = absoluteHref;
          // Track each new stylesheet load so we can wait for it
          const p = new Promise(resolve => {
            link.onload = resolve;
            link.onerror = resolve; // Don't block on errors (e.g. missing optional sheet)
          });
          loadPromises.push(p);
          document.head.appendChild(link);
        }
      }
    });

    // ─── 2. Sync inline <style> blocks from <head> ───────────────────────────
    // Pages like nitnem/index.html embed ALL their CSS in inline <style> blocks.
    // We use a page-key attribute to avoid re-injecting on subsequent navigations.
    const pageKey = new URL(sourceUrl).pathname; // e.g. /nitnem/index.html
    const existingPageStyle = document.querySelector(`style[data-spa-page="${pageKey}"]`);

    if (!existingPageStyle) {
      const headStyles = Array.from(newDoc.head.querySelectorAll('style'));
      if (headStyles.length > 0) {
        // Merge all head <style> blocks into one tagged <style> element.
        // CRITICAL: Absolutize all url() values in the CSS before injecting.
        // Without this, @font-face paths like url('g-fonts/foo.woff') resolve
        // against document.baseURI (which may still be the previous page URL)
        // causing double-path errors like /nitnem/nitnem/g-fonts/foo.woff.
        const combinedCSS = headStyles.map(s => s.textContent).join('\n');
        const absoluteCSS = combinedCSS.replace(
          /url\(['"]?([^'")\s]+)['"]?\)/g,
          (match, relUrl) => {
            // Skip already-absolute URLs and data URIs
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
        styleEl.setAttribute('data-spa-page', pageKey);
        styleEl.textContent = absoluteCSS;
        document.head.appendChild(styleEl);
        console.log(`[SmoothNav] Injected ${headStyles.length} inline style block(s) for: ${pageKey}`);
      }
    }

    // Wait for all new external stylesheets to load, max 600ms
    if (loadPromises.length > 0) {
      await Promise.race([
        Promise.all(loadPromises),
        new Promise(resolve => setTimeout(resolve, 600))
      ]);
      NAV_DEBUG &&       console.log('[SmoothNav] All new stylesheets ready.');
    }
  }


  /**
   * Finds and executes scripts from the new document.
   *
   * KEY RULES:
   * - Inline scripts are executed ONLY on first visit to each page (tracked by EXECUTED_INLINE_PAGES).
   *   Reason: they declare top-level `const`/`let` (e.g. themeToggle, banis) that cannot be
   *   redeclared. Re-visits rely on the 'anhad_page_changed' event for re-initialization.
   * - External scripts: skip if already in DOM (prevents duplicate class/identifier declarations).
   * - Shell scripts (global utilities) are always skipped.
   */
  async function executePageScripts(newDoc, sourceUrl) {
    // CRITICAL: Only execute scripts from <body>, never from <head>.
    const scripts = Array.from(newDoc.body.querySelectorAll('script'));
    const externalScripts = [];

    const pageKey = new URL(sourceUrl, window.location.origin).pathname;
    const isFirstVisit = !EXECUTED_INLINE_PAGES.has(pageKey);
    if (isFirstVisit) EXECUTED_INLINE_PAGES.add(pageKey);
    
    for (const script of scripts) {
      const src = script.getAttribute('src');
      
      // Skip core shell scripts to avoid double-initialization
      if (src && SHELL_SCRIPTS.some(shell => src.includes(shell))) {
        continue;
      }

      if (src) {
        const absoluteSrc = new URL(src, sourceUrl).href;
        // Re-execute page-specific scripts on every SPA swap by removing old instances first!
        const existingScript = document.querySelector(`script[src="${absoluteSrc}"]`);
        if (existingScript) {
          existingScript.remove();
        }
        externalScripts.push(new Promise((resolve) => {
          const newScript = document.createElement('script');
          Array.from(script.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          newScript.src = absoluteSrc;
          newScript.onload = resolve;
          newScript.onerror = resolve;
          document.body.appendChild(newScript);
        }));
      } else {
        // ── Inline scripts ────────────────────────────────────────────────────────
        // Wrap in block scope to avoid "already declared" SyntaxErrors for top-level const/let.
        // This allows event listeners and initializers to bind to the new DOM elements on every visit.
        const content = script.textContent;
        // Skip dangerous patterns regardless
        if (content.includes('serviceWorker.register') || content.includes('location.reload')) {
          continue;
        }
        
        const newScript = document.createElement('script');
        newScript.textContent = "(function(){\n" + content + "\n})();";
        document.body.appendChild(newScript);
      }
    }
    
    if (externalScripts.length > 0) {
      await Promise.all(externalScripts);
    }

    // After scripts load, re-bind global DOM variables that inline scripts set up
    // on first visit. After each SPA swap these point to detached elements and must
    // be updated so inline onclick handlers (onclick="themeToggle.click()") still work.
    rebindPageGlobals(pageKey);
  }

  /**
   * Re-binds known global DOM variables set by inline scripts on first page visit.
   * These must be updated after each SPA swap to point to the current DOM elements.
   */
  function rebindPageGlobals(pageKey) {
    if (pageKey.includes('/nitnem/')) {
      // 're-bind themeToggle' - declared as top-level const by nitnem/index.html inline script.
      // After DOM swap the element is a new node; we update window.themeToggle to point to it
      // and re-attach the click handler (since the original closure is gone on re-visit).
      const newThemeToggle = document.getElementById('themeToggle');
      if (newThemeToggle) {
        try { window.themeToggle = newThemeToggle; } catch(e) {}

        // Apply current theme icon (updateThemeUI won't run on re-visit)
        const currentTheme = window.AnhadTheme ? AnhadTheme.get() : 
                             (document.documentElement.getAttribute('data-theme') || 'light');
        newThemeToggle.textContent = currentTheme === 'dark' ? '🌙' : '☀️';

        // Re-attach click handler
        newThemeToggle.onclick = function() {
          if (window.AnhadTheme) {
            const newTheme = AnhadTheme.toggle();
            document.documentElement.setAttribute('data-theme', newTheme);
            newThemeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
          }
        };
      }
    }
  }

  /**
   * Proactively prefetch a page and cache its content
   * - Skips on save-data / slow connections
   * - Limits concurrent prefetches to 2
   */
  const MAX_CONCURRENT_PREFETCH = 2;
  
  async function prefetchPage(url) {
    if (!url || url.includes('#')) return;
    const normalized = normalizeUrl(new URL(url, window.location.href).href);
    if (PAGE_CACHE.has(normalized) || FETCH_QUEUE.has(normalized)) return;
    if (FETCH_QUEUE.size >= MAX_CONCURRENT_PREFETCH) return;
    
    // Skip prefetch on slow/metered connections
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')) return;
    
    const targetUrl = new URL(url, window.location.origin);
    if (targetUrl.origin !== window.location.origin) return;

    FETCH_QUEUE.add(url);
    try {
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        PAGE_CACHE.set(url, text);
      }
    } catch (e) {
      // Silent fail for prefetch
    } finally {
      FETCH_QUEUE.delete(url);
    }
  }

  /**
   * Intercept all internal link clicks and data-href navigations
   */
  function setupLinkInterception() {
    document.addEventListener('click', e => {
      // 1. Look for <a> tags
      const link = e.target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#') && !link.hasAttribute('data-no-spa')) {
          // CRITICAL: Before navigating to index.html stamp session flags so
          // welcome-check.js NEVER triggers the splash screen on back navigation
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

      // 2. Look for data-href attributes (for custom cards/buttons)
      const clickable = e.target.closest('[data-href]');
      if (clickable) {
        const href = clickable.getAttribute('data-href');
        if (href) {
          e.preventDefault();
          window.navigateTo(href);
          return;
        }
      }
      
      // 3. Catch elements with onclick="window.location.href=..."
      // Note: This is a fallback if we haven't replaced them with data-href yet.
      // We can only catch them if they bubble up, but if they are inline, they execute first.
      // So we proactively replace them on load.
    });

    // Smart Pre-fetching on Hover/Touch
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

    // Handle browser back/forward buttons — use SPA cache for instant back (no hard reload)
    window.addEventListener('popstate', (e) => {
      // Stamp session flags for index.html to prevent splash screen re-show
      if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        try {
          sessionStorage.setItem('anhad_welcomed', '1');
          localStorage.setItem('anhad_welcome_seen', 'true');
          localStorage.setItem('anhad_session_active_ts', Date.now().toString());
        } catch(ex) {}
      }
      const targetUrl = normalizeUrl(window.location.href);
      const cached = PAGE_CACHE.get(targetUrl);
      if (cached) {
        // Instant SPA swap — no network request, no white flash
        NAV_DEBUG && console.log('[SmoothNav] Popstate cache hit:', targetUrl);
        safeStartTransition(() => applyNewContent(cached, targetUrl, { replace: true, isBack: true }), true, false);
      } else {
        // Not cached — fetch asynchronously instead of hard reload to keep it smooth!
        NAV_DEBUG && console.log('[SmoothNav] Popstate cache miss, performing swap for:', targetUrl);
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

    // Proactive viewport prefetching
    initViewportPrefetch();
  }

  /**
   * Prefetches links that enter the viewport
   */
  function initViewportPrefetch() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const href = el.getAttribute('href') || el.getAttribute('data-href');
          prefetchPage(href);
          observer.unobserve(el);
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
    
    // PERF: Use MutationObserver instead of setInterval to detect new links
    if ('MutationObserver' in window) {
      let mutationTimeout = null;
      const domObserver = new MutationObserver(function() {
        // PERF: Debounce at 1000ms — SPA swaps replace the whole DOM
        // so a 1s debounce ensures a single call per swap.
        clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(observeNewLinks, 1000);
      });
      // Expose globally so performSwap can disconnect during swaps (prevents GC storm)
      window._anhadDomObserver = domObserver;

      const startObserving = () => {
        if (document.body) {
          // PERF: childList+subtree only — skip attribute/text node changes
          // which fire extremely frequently and we don't need for link detection
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

  /**
   * Helper to convert existing onclick="window.location.href" to data-href
   * so they can be handled by the SPA engine.
   */
  function convertOnclickToDataHref() {
    document.querySelectorAll('[onclick*="location.href"]').forEach(el => {
      const onclick = el.getAttribute('onclick');
      const match = onclick.match(/location\.href\s*=\s*['"](.*?)['"]/);
      if (match && match[1]) {
        el.setAttribute('data-href', match[1]);
        el.removeAttribute('onclick');
        console.log(`[SmoothNav] Converted onclick to data-href for: ${match[1]}`);
      }
    });
  }

  // Self-initialize
  setupLinkInterception();
  convertOnclickToDataHref();
  absoluteifyShellLinks();
  
  // Also run conversion on page change
  window.addEventListener('anhad_page_changed', convertOnclickToDataHref);

  // Periodic cache maintenance to prevent memory leaks in long sessions
  setInterval(() => {
    if (PAGE_CACHE.size > 20) {
      const keys = Array.from(PAGE_CACHE.keys());
      // Keep initial page and last 10
      keys.slice(1, keys.length - 10).forEach(key => PAGE_CACHE.delete(key));
    }
  }, 60000);

})();
