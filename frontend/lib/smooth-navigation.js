/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMOOTH NAVIGATION (App Shell Engine v3 - Optimized)
 *
 * This script turns the app into a high-performance Single Page Application (SPA).
 * It intercepts link clicks, fetches the target page manually, and swaps content.
 * This keeps the Overlay Player truly independent and uninterrupted.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  const MAIN_TARGET_ID = 'app';
  const GMP_ID = 'global-mini-player';
  
  /**
   * SPA POLYFILL: Ensures DOMContentLoaded listeners run even after AJAX swaps
   */
  (function polyfillDOMContentLoaded() {
    const originalAddEventListener = document.addEventListener;
    document.addEventListener = function(type, listener, options) {
      if (type === 'DOMContentLoaded' && document.readyState !== 'loading') {
        // If we are in SPA mode and the shell is already loaded, 
        // trigger the listener immediately for the new content.
        setTimeout(listener, 1); 
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
  })();

  const SHELL_SCRIPTS = [
    'overlay-player.js',
    'smooth-navigation.js',
    'global-theme.js',
    'audio-coordinator.js',
    'anhad-audio-singleton.js',
    'anhad-core.js',
    'pwa-register.js',
    'smart-back.js',
    'page-lifecycle.js'
  ];

  /**
   * Navigate to a URL using AJAX swap and View Transitions
   * @param {string} url - Destination URL
   * @param {Object} options - Navigation options
   */
  window.navigateTo = async function(url, options = {}) {
    if (!url || typeof url !== 'string') return;

    // Handle external links or same-page links
    if (url.startsWith('http') && !url.includes(window.location.hostname)) {
      window.open(url, '_blank');
      return;
    }
    
    const targetUrl = new URL(url, window.location.origin);
    if (targetUrl.href === window.location.href && !options.force) return;

    console.log(`[SmoothNav] Navigating to: ${url}`);

    // If View Transitions API is supported, wrap the swap
    if ('startViewTransition' in document && !options.instant) {
      document.startViewTransition(() => performSwap(url, options));
    } else {
      performSwap(url, options);
    }
  };

  /**
   * Fetch new page and swap content
   */
  async function performSwap(url, options = {}) {
    const loader = ensureLoader();
    let loaderTimeout = null;

    try {
      // 1. Show loader with slight delay to avoid flicker on fast networks
      loaderTimeout = setTimeout(() => loader.classList.add('visible'), 200);
      document.body.classList.add('page-loading');

      // 2. Fetch the page
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      
      // 3. Parse the content
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(text, 'text/html');

      // 4. Extract targets
      const newApp = newDoc.getElementById(MAIN_TARGET_ID);
      const currentApp = document.getElementById(MAIN_TARGET_ID);

      if (!newApp || !currentApp) {
         throw new Error('Target structure mismatch (no #app found)');
      }

      // 5. Update Shell elements (Title, Head assets)
      document.title = newDoc.title;
      syncHeadAssets(newDoc);
      
      // 6. SWAP CONTENT
      currentApp.innerHTML = newApp.innerHTML;
      
      // 7. Update URL
      if (!options.replace) {
        history.pushState({ spa: true }, '', url);
      } else {
        history.replaceState({ spa: true }, '', url);
      }

      // 8. Execute Scripts
      executePageScripts(newDoc);

      // 9. Clean up and signal completion
      clearTimeout(loaderTimeout);
      loader.classList.remove('visible');
      document.body.classList.remove('page-loading');
      
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Trigger lifecycle recovery (removes exit classes etc)
      if (window.AnhadPageLifecycle) {
        window.AnhadPageLifecycle.recover();
      }
      
      window.dispatchEvent(new CustomEvent('anhad_page_changed', { detail: { url } }));
      
    } catch (e) {
      console.error('[SmoothNav] SPA swap failed, falling back to full reload:', e);
      window.location.href = url;
    }
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
  function syncHeadAssets(newDoc) {
    const currentStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(l => l.getAttribute('href'));
    const newStyles = Array.from(newDoc.querySelectorAll('link[rel="stylesheet"]'));

    newStyles.forEach(style => {
      const href = style.getAttribute('href');
      if (href && !currentStyles.includes(href)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }

  /**
   * Finds and executes scripts from the new document that aren't already in the shell
   */
  function executePageScripts(newDoc) {
    const scripts = Array.from(newDoc.querySelectorAll('script'));
    
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      
      // Skip core shell scripts to avoid double-initialization
      if (src && SHELL_SCRIPTS.some(shell => src.includes(shell))) {
        return;
      }

      // Create new script element to trigger execution
      const newScript = document.createElement('script');
      
      // Copy attributes
      Array.from(script.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });

      // Copy content if inline
      if (script.innerHTML) {
        newScript.innerHTML = script.innerHTML;
      }

      // Append to document to execute immediately
      document.body.appendChild(newScript);
    });
  }

  /**
   * Intercept all internal link clicks
   */
  function setupLinkInterception() {
    document.addEventListener('click', e => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      
      // Skip external links, hash-links, and non-navigational links
      if (!href || 
          href.startsWith('http') || 
          href.startsWith('#') || 
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          href.startsWith('javascript:')) {
        return;
      }

      // Intercept local link
      e.preventDefault();
      window.navigateTo(href);
    });

    // Smart Pre-fetching
    document.addEventListener('mouseover', e => {
      const link = e.target.closest('a');
      if (link) prefetchLink(link.getAttribute('href'));
    });
    document.addEventListener('touchstart', e => {
      const link = e.target.closest('a');
      if (link) prefetchLink(link.getAttribute('href'));
    }, { passive: true });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      performSwap(window.location.href, { replace: true });
    });
  }

  const prefetchCache = new Set();
  function prefetchLink(url) {
    if (!url || url.includes('#') || prefetchCache.has(url)) return;
    prefetchCache.add(url);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }

  // Self-initialize
  setupLinkInterception();
  console.log('[SmoothNav] App Shell Optimized Engine active.');

})();
