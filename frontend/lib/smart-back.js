/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD — Smart Back Navigation v1.0
 * 
 * Contextual back button: uses browser history when available,
 * falls back to a specified URL (usually ../index.html).
 * This ensures users return to the page they came FROM, not always the homepage.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
(function() {
  'use strict';

  /**
   * Navigate back intelligently.
   * @param {string} [fallbackUrl] — URL to go to if no history or direct-load
   */
  window.anhadGoBack = function(fallbackUrl) {
    fallbackUrl = fallbackUrl || '../index.html';

    // Check if there's meaningful browser history to go back to.
    // document.referrer is empty on direct loads / new tabs.
    // history.length > 1 means there's at least one previous entry.
    if (document.referrer && history.length > 1) {
      history.back();
    } else {
      window.location.href = fallbackUrl;
    }
  };

  /**
   * Auto-wire any element with id="backBtn", id="bk", id="back-btn",
   * or class="header__back" / class="header-back" / class="nav-back"
   */
  function autoWire() {
    var selectors = [
      '#backBtn', '#bk', '#back-btn',
      '.header__back', '.header-back', '.nav-back'
    ];

    selectors.forEach(function(sel) {
      var el = document.querySelector(sel);
      if (!el) return;

      // Determine fallback from existing href (if <a> tag), or default
      var fallback = '../index.html';
      if (el.tagName === 'A' && el.getAttribute('href')) {
        fallback = el.getAttribute('href');
      }

      // For <a> tags, prevent default navigation
      el.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.anhadGoBack(fallback);
      });

      // Set cursor
      el.style.cursor = 'pointer';
    });
  }

  // Wire on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoWire);
  } else {
    autoWire();
  }
})();
