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
  const SHELL_SCRIPTS = [
    'overlay-player.js',
    'smooth-navigation.js',
    'global-theme.js',
    'audio-coordinator.js',
    'trendora-app.js'
  ];

  /**
   * Navigate to a URL using View Transitions for smooth mini player persistence
   * @param {string} url - Destination URL
   * @param {Object} options - Navigation options
   */
  window.navigateTo = async function(url, options = {}) {
    if (!url || typeof url !== 'string') {
      console.warn('[SmoothNav] Invalid URL provided');
      return;
    }

    // Handle external links normally
    if (url.startsWith('http') && !url.includes(window.location.hostname)) {
      window.open(url, '_blank');
      return;
    }
    
    // Normalize URL for comparison
    const targetUrl = new URL(url, window.location.origin);
    if (targetUrl.href === window.location.href && !options.force) return;

    // OPTIMIZATION: Skip View Transitions for dashboard to prevent lag
    // View Transitions capture screenshots which causes jank on complex pages
    const isDashboard = url.includes('dashboard') || url.includes('Dashboard');
    const skipTransition = isDashboard || options.instant;

    // Check if View Transitions API is supported
    const supportsViewTransitions = 'startViewTransition' in document && !skipTransition;

    if (!supportsViewTransitions) {
      // Fallback: standard navigation (instant for dashboard)
      window.location.href = url;
      return;
    }

    // Mark mini player for view transition
    const gmp = document.getElementById(GMP_ID);
    if (gmp) {
      gmp.style.viewTransitionName = 'mini-player';
    }

    // Start the view transition
    try {
      document.startViewTransition(() => {
        // During transition, keep mini player visible
        if (gmp) {
          gmp.style.opacity = '1';
          gmp.style.transform = 'translateY(0)';
        }

        // Navigate to the new page
        window.location.href = url;
      });
    } catch (e) {
      console.warn('[SmoothNav] View transition failed, using fallback:', e);
      window.location.href = url;
    }
  };

  /**
   * Fetch new page and swap content
   */
  async function performSwap(url) {
    try {
      // 1. Fetch the page immediately
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      
      // 2. Parse the content
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(text, 'text/html');

      // 3. Extract targets
      const newContent = newDoc.getElementById(MAIN_TARGET_ID);
      const currentContent = document.getElementById(MAIN_TARGET_ID);

      if (newContent && currentContent) {
        // Update URL in address bar
        history.pushState(null, '', url);

        // 4. Update the content
        currentContent.innerHTML = newContent.innerHTML;

        // 5. Update Shell elements (Title)
        document.title = newDoc.title;
        
        // 6. Manage Scripts (The most critical part for logic continuity)
        executePageScripts(newDoc);

        // 7. Post-navigation logic
        window.scrollTo({ top: 0, behavior: 'instant' });
        window.dispatchEvent(new CustomEvent('anhad_page_changed', { detail: { url } }));
        
        console.log('[SmoothNav] Shell Swap Successful.');
      } else {
        throw new Error('Target structure mismatch (no #app found)');
      }
    } catch (e) {
      console.warn('[SmoothNav] App Shell swap failed, falling back to full reload:', e);
      window.location.href = url;
    }
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

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      performSwap(window.location.href);
    });
  }

  // Self-initialize
  setupLinkInterception();
  console.log('[SmoothNav] App Shell Optimized Engine active.');

})();
