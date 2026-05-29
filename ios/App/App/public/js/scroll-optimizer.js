/* ═══════════════════════════════════════════════════════════════════════════
   ANHAD — Ultra Smooth Scroll Optimizer
   Pauses heavy animations during scroll for 120fps performance
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  let scrollTimeout;
  let isScrolling = false;
  const SCROLL_THRESHOLD = 50; // ms

  function handleScrollStart() {
    if (!isScrolling) {
      isScrolling = true;
      document.body.classList.add('is-scrolling');
    }
  }

  function handleScrollEnd() {
    isScrolling = false;
    document.body.classList.remove('is-scrolling');
  }

  // Use requestAnimationFrame for smooth scroll detection
  let lastScrollTime = 0;
  function onScroll() {
    const now = performance.now();
    
    if (now - lastScrollTime > SCROLL_THRESHOLD) {
      handleScrollStart();
    }
    
    lastScrollTime = now;
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleScrollEnd, 150);
  }

  // Passive event listener for better scroll performance
  window.addEventListener('scroll', onScroll, { passive: true });

  // Also handle touch events for mobile
  window.addEventListener('touchstart', handleScrollStart, { passive: true });
  window.addEventListener('touchend', handleScrollEnd, { passive: true });

})();
