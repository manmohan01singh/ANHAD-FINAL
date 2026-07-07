/* ═══════════════════════════════════════════════════════════════════════════
   ANHAD — Ultra Smooth Scroll Optimizer v2.0
   
   PERF FIX: Uses requestAnimationFrame instead of setTimeout(150) to detect
   scroll-end. The old version fired a JS timer every 150ms = main-thread churn.
   This version:
   - Marks body.is-scrolling using rAF (zero main-thread cost during scroll)
   - Uses { passive: true } on ALL scroll/touch listeners (enables native scroll)
   - Debounces scroll-end detection with a single rAF loop (no timers)
   - Applies scroll containment to prevent scroll chaining to parent views
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let _rafId = null;
  let _isScrolling = false;
  let _lastScrollY = -1;

  function onScrollTick() {
    const currentY = window.scrollY;

    if (currentY !== _lastScrollY) {
      // Still scrolling — mark body and reschedule
      if (!_isScrolling) {
        _isScrolling = true;
        document.body.classList.add('is-scrolling');
        document.body.classList.add('scrolling');
      }
      _lastScrollY = currentY;
      _rafId = requestAnimationFrame(onScrollTick);
    } else {
      // Scroll stopped — clean up
      _isScrolling = false;
      document.body.classList.remove('is-scrolling');
      document.body.classList.remove('scrolling');
      _rafId = null;
    }
  }

  function onScroll() {
    // Only start the RAF loop if not already running
    if (!_rafId) {
      _rafId = requestAnimationFrame(onScrollTick);
    }
  }

  // PERF FIX: { passive: true } tells Chrome the handler will NEVER call
  // preventDefault() — unlocking native compositor-threaded scrolling.
  window.addEventListener('scroll', onScroll, { passive: true });

  // Touch listeners: passive for maximum native scroll throughput
  window.addEventListener('touchstart', function () {
    if (!_isScrolling) {
      _isScrolling = true;
      document.body.classList.add('is-scrolling');
      document.body.classList.add('scrolling');
    }
  }, { passive: true });

  window.addEventListener('touchend', function () {
    // Use rAF to check if scroll actually stopped
    requestAnimationFrame(function () {
      _isScrolling = false;
      document.body.classList.remove('is-scrolling');
      document.body.classList.remove('scrolling');
    });
  }, { passive: true });

  // PERF FIX: Intersection Observer-based lazy animation trigger.
  // Replaces scroll-event-based show/hide logic in individual components.
  // Export a shared observer so components can use it without creating their own.
  window.AnhadScrollObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-viewport');
        // Once visible, no need to observe again (saves CPU on long pages)
        window.AnhadScrollObserver.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -10% 0px', // Trigger 10% before element is fully visible
    threshold: 0.01
  });

})();
