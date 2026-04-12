/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMOOTH NAVIGATION (App Shell Engine v2)
 *
 * Turns a multi-page website into a high-performance SPA.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  const MAIN_TARGET_ID = 'app'; 
  const SHELL_SCRIPTS = [
    'overlay-player.js',
    'smooth-navigation.js',
    'global-theme.js',
    'audio-coordinator.js',
    'trendora-app.js'
  ];

  /**
   * Navigate to a URL without reloading the browser
   */
  window.navigateTo = async function(url) {
    if (!url) return;
    
    // Normalize URL
    const targetUrl = new URL(url, window.location.origin);
    if (targetUrl.href === window.location.href) return;

    console.log('[SmoothNav] Intercepted navigation to:', url);

    // Use View Transition API if supported
    if (document.startViewTransition) {
      document.startViewTransition(() => performSwap(url));
    } else {
      performSwap(url);
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
        // Update URL
        history.pushState(null, '', url);

        // 4. Update the content
        // We replace the outerHTML or innerHTML based on what's safer
        currentContent.innerHTML = newContent.innerHTML;

        // 5. Update Shell elements (Title, Metadata)
        document.title = newDoc.title;
        
        // 6. Manage Scripts (The most critical part)
        // We only want to execute scripts that are NOT shell scripts
        executePageScripts(newDoc);

        // 7. Cleanup & Events
        window.scrollTo({ top: 0, behavior: 'instant' });
        window.dispatchEvent(new CustomEvent('anhad_page_changed', { detail: { url } }));
        
        console.log('[SmoothNav] Page swap successful:', url);
      } else {
        throw new Error('Target structure mismatch');
      }
    } catch (e) {
      console.warn('[SmoothNav] Performance swap failed, falling back to hard reload:', e);
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
      
      // Skip shell scripts to avoid double-init
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

      // Append to body to execute
      document.body.appendChild(newScript);
      
      // Optional: remove after execution if it was a one-time script
      // but usually safer to leave it unless it causes issues.
    });
  }

  /**
   * Intercept all local links
   */
  function setupLinkInterception() {
    document.addEventListener('click', e => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      
      // Skip external links, anchors, and non-html links
      if (!href || 
          href.startsWith('http') || 
          href.startsWith('#') || 
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          href.startsWith('javascript:')) {
        return;
      }

      // Check if it's the same origin
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;

      // Intercept!
      e.preventDefault();
      window.navigateTo(href);
    });

    // Handle back/forward buttons
    window.addEventListener('popstate', () => {
      // Use location.href to ensure search params are included
      performSwap(window.location.href);
    });
  }

  // Initialize
  setupLinkInterception();
  console.log('[SmoothNav] App Shell active. Multi-page transition logic ready.');

})();
