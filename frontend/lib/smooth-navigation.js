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

  const MAIN_TARGET_ID = 'app';
  const PAGE_CACHE = new Map();
  const DOM_CACHE = new Map(); // For keepAlive strategy
  const FETCH_QUEUE = new Set();
  
  /**
   * Normalizes a URL for caching and comparison
   */
  function normalizeUrl(url) {
    try {
      const u = new URL(url, window.location.origin);
      let path = u.pathname;
      // Remove trailing slash if not root
      if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
      // Remove index.html for root comparison consistency
      if (path.endsWith('/index.html')) path = path.slice(0, -11) || '/';
      return u.origin + path + u.search;
    } catch (e) {
      return url;
    }
  }

  let currentActiveUrl = normalizeUrl(window.location.href);
  
  // Cache the initial page immediately to prevent re-fetching on first 'back' navigation
  if (document.documentElement.innerHTML) {
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
    'hub-app.js',
    'trendora-app.js',
    'ultra-welcome-loader.js',
    'homepage-data.js',
    'capacitor-bridge.js'
  ];

  // Resolve App Root once on load (robustly handles query strings)
  const navScriptTag = document.querySelector('script[src*="smooth-navigation.js"]');
  if (navScriptTag) {
    const url = new URL(navScriptTag.src);
    const parts = url.pathname.split('lib/smooth-navigation.js');
    window.ANHAD_ROOT = url.origin + parts[0];
  } else {
    window.ANHAD_ROOT = '/ANHAD-FINAL/frontend/';
  }
  console.log('[SmoothNav] App Root resolved to:', window.ANHAD_ROOT);

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
  window.navigateTo = async function(url, options = {}) {
    if (!url || typeof url !== 'string') return;

    // Resolve to absolute URL using document.baseURI for correct relative path handling
    const absoluteUrl = new URL(url, document.baseURI).href;
    const normalized = normalizeUrl(absoluteUrl);
    
    if (normalized === currentActiveUrl && !options.force) return;

    // NOTE: We no longer serialize outerHTML (expensive string, causes jank).
    // Back navigation uses the PAGE_CACHE HTML fetched at load time instead.
    performSwap(normalized, options);
  };

  /**
   * Fetch new page and swap content
   */
  async function performSwap(url, options = {}) {
    url = normalizeUrl(url);
    const loader = ensureLoader();
    let loaderTimeout = null;
    let transitionFinished = false;

    try {
      /* CACHE BYPASSED FOR STABILITY 
      const cachedContent = PAGE_CACHE.get(url);
      if (cachedContent) {
        if ('startViewTransition' in document && !options.instant) {
          document.startViewTransition(() => applyNewContent(cachedContent, url, options));
        } else {
          await applyNewContent(cachedContent, url, options);
        }
        return;
      }
      */

      // 2. Not in cache? Show loader and fetch
      loaderTimeout = setTimeout(() => {
        if (!transitionFinished) {
          // Only show loader if not a back navigation
          if (options.isBack) return;
          loader.classList.add('visible');
          document.body.classList.add('page-loading');
        }
      }, 250); // Increased grace period to 250ms for "ultra smooth" loads

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      
      // Cache it for next time
      PAGE_CACHE.set(url, text);
      
      transitionFinished = true;
      if ('startViewTransition' in document && !options.instant) {
        document.startViewTransition(() => applyNewContent(text, url, options));
      } else {
        await applyNewContent(text, url, options);
      }
      
      // Clean up loader
      clearTimeout(loaderTimeout);
      loader.classList.remove('visible');
      document.body.classList.remove('page-loading');
      
    } catch (e) {
      console.error('[SmoothNav] SPA swap failed, falling back to full reload:', e);
      window.location.href = url;
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
        if (newNode.innerHTML !== currentNode.innerHTML) {
          currentNode.innerHTML = newNode.innerHTML;
        }
      }
    });

    // MODULE CLEANUP: Remove module-specific elements that are OUTSIDE #app
    // If an element exists in current page but NOT in the new page, and it's not a shell element, remove it.
    const moduleSpecificSelectors = [
      '.bg-orbs', '.ikonkar-background', '#ikonkarBackground', '.bg-effects',
      '.skeleton-container', '#skeletonContainer', '#skeletonLoader',
      '.app-loading', '#appLoading', '.ultra-loader', '.ultra-welcome-loader',
      '.welcome-screen'
    ];
    
    // Reset body classes and styles to prevent module-leakage
    const globalClasses = ['dark-mode', 'is-mobile', 'reduce-motion', 'theme-loaded'];
    const currentClasses = Array.from(document.body.classList);
    currentClasses.forEach(cls => {
      if (!globalClasses.includes(cls)) {
        document.body.classList.remove(cls);
      }
    });
    
    // Clear inline body styles (e.g. background-image from Hukamnama or Nitnem)
    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = '';
    document.body.style.overflow = '';
    
    moduleSpecificSelectors.forEach(selector => {
      const currentEl = document.querySelector(selector);
      const newEl = newDoc.querySelector(selector);
      
      if (currentEl && !newEl) {
        console.log('[SPA] Cleaning up module element:', selector);
        currentEl.remove();
      } else if (!currentEl && newEl) {
        console.log('[SPA] Injecting module element:', selector);
        // Clone to body but keep it outside #app
        document.body.appendChild(newEl.cloneNode(true));
      }
    });

    // Sync Head Assets
    syncHeadAssets(newDoc, url);
    
    // SWAP CONTENT
    currentApp.innerHTML = newApp.innerHTML;
    
    // Update URL
    if (!options.replace) {
      history.pushState({ spa: true }, '', url);
    } else {
      history.replaceState({ spa: true }, '', url);
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
        const resolved = new URL(val, base).pathname;
        el.setAttribute(attr, resolved);
      } catch(e) {}
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
   * Syncs new CSS links from the target document
   */
  function syncHeadAssets(newDoc, sourceUrl) {
    const currentStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(l => new URL(l.getAttribute('href') || '', document.baseURI).href);
    const newStyles = Array.from(newDoc.querySelectorAll('link[rel="stylesheet"]'));

    newStyles.forEach(style => {
      const href = style.getAttribute('href');
      if (href) {
        const absoluteHref = new URL(href, sourceUrl).href;
        if (!currentStyles.includes(absoluteHref)) {
          console.log('[SmoothNav] Adding stylesheet:', absoluteHref);
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = absoluteHref;
          document.head.appendChild(link);
        }
      }
    });
  }

  /**
   * Finds and executes scripts from the new document
   */
  async function executePageScripts(newDoc, sourceUrl) {
    const scripts = Array.from(newDoc.querySelectorAll('script'));
    const externalScripts = [];
    
    for (const script of scripts) {
      const src = script.getAttribute('src');
      
      // Skip core shell scripts to avoid double-initialization
      if (src && SHELL_SCRIPTS.some(shell => src.includes(shell))) {
        continue;
      }

      if (src) {
        // PERF FIX: Load external scripts in PARALLEL instead of sequential await.
        // Sequential loading was the #1 cause of slow page transitions —
        // each script blocked the next, causing 100-500ms extra per navigation.
        const absoluteSrc = new URL(src, sourceUrl).href;
        // Skip already-loaded scripts to prevent double-init
        if (document.querySelector(`script[src="${absoluteSrc}"]`)) continue;
        externalScripts.push(new Promise((resolve) => {
          const newScript = document.createElement('script');
          Array.from(script.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          newScript.src = absoluteSrc;
          newScript.onload = resolve;
          newScript.onerror = resolve; // Never block on script errors
          document.body.appendChild(newScript);
        }));
      } else {
        // Inline scripts run immediately (synchronous)
        // PROTECT: Skip common shell initialization patterns in inline scripts
        const content = script.textContent;
        if (content.includes('serviceWorker.register') || content.includes('location.reload')) {
          console.log('[SmoothNav] Skipping potentially disruptive inline shell script');
          continue;
        }
        
        const newScript = document.createElement('script');
        newScript.textContent = content;
        document.body.appendChild(newScript);
      }
    }
    
    // Wait for ALL external scripts in parallel
    if (externalScripts.length > 0) {
      await Promise.all(externalScripts);
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
    const normalized = normalizeUrl(new URL(url, document.baseURI).href);
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

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      const normalized = normalizeUrl(window.location.href);
      performSwap(normalized, { replace: true, instant: true, isBack: true });
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
        // PERF: Increased debounce from 500ms to 1000ms.
        // During SPA swaps the whole DOM is replaced — a 500ms debounce fires
        // multiple times per transition. 1s ensures a single call per swap.
        clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(observeNewLinks, 1000);
      });

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
