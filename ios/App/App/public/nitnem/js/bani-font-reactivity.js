/**
 * Bani Font Reactivity Engine
 * Ensures instant font updates across ALL Nitnem Bani pages
 * @version 1.0.0 - Fixes ISSUE 1: Font Does Not Update Instantly
 */

(function () {
  'use strict';

  console.log('🔤 Bani Font Reactivity Engine initialized');

  // Apply font sizes from CSS variables to all verse elements
  function applyFontSizesToVerses() {
    const root = document.documentElement;
    
    // Read current CSS variable values
    const gurmukhiSize = root.style.getPropertyValue('--font-gurmukhi') || '28px';
    const translitSize = root.style.getPropertyValue('--font-transliteration') || '18px';
    const translationSize = root.style.getPropertyValue('--font-translation') || '16px';
    const punjabiSize = root.style.getPropertyValue('--font-punjabi') || '16px';

    // Apply to all verse elements
    document.querySelectorAll('.verse__gurmukhi').forEach(el => {
      el.style.fontSize = gurmukhiSize;
    });

    document.querySelectorAll('.verse__transliteration').forEach(el => {
      el.style.fontSize = translitSize;
    });

    document.querySelectorAll('.verse__translation').forEach(el => {
      el.style.fontSize = translationSize;
    });

    document.querySelectorAll('.verse__punjabi').forEach(el => {
      el.style.fontSize = punjabiSize;
    });

    console.log('✓ Font sizes applied to verses:', {
      gurmukhi: gurmukhiSize,
      transliteration: translitSize,
      translation: translationSize,
      punjabi: punjabiSize
    });
  }

  // Listen for settings changes from bani-setting-panel.js
  window.addEventListener('baniSettingsChanged', function(event) {
    console.log('🔄 Settings changed event received:', event.detail);
    
    // Apply immediately to all rendered verses
    applyFontSizesToVerses();
  });

  // Listen for storage events (cross-tab/window synchronization)
  window.addEventListener('storage', function(e) {
    if (e.key === 'baniSettings' && e.newValue) {
      console.log('🔄 Storage event detected - reapplying fonts');
      
      // Small delay to ensure CSS variables are updated first
      setTimeout(() => {
        applyFontSizesToVerses();
      }, 50);
    }
  });

  // Apply fonts on initial load and when DOM changes (new verses rendered)
  function initializeFontReactivity() {
    // Apply fonts immediately on load
    applyFontSizesToVerses();

    // Watch for new verses being added (for dynamic loading)
    const versesContainer = document.getElementById('versesContainer');
    if (versesContainer) {
      const observer = new MutationObserver(function(mutations) {
        let shouldUpdate = false;
        
        mutations.forEach(mutation => {
          if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE && 
                  (node.classList?.contains('verse') || node.querySelector?.('.verse'))) {
                shouldUpdate = true;
              }
            });
          }
        });

        if (shouldUpdate) {
          console.log('🆕 New verses detected - applying fonts');
          applyFontSizesToVerses();
        }
      });

      observer.observe(versesContainer, {
        childList: true,
        subtree: true
      });

      console.log('👁️ MutationObserver watching for new verses');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFontReactivity);
  } else {
    initializeFontReactivity();
  }

  // Export for manual triggering if needed
  window.baniReactivity = {
    applyFonts: applyFontSizesToVerses
  };

})();
