/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SCROLL PERFORMANCE MANAGER - 60 FPS TARGET (LEAN)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Lightweight scroll optimization:
 * - Adds/removes 'scrolling' class for CSS-driven optimizations
 * - Throttled via RAF (no perpetual RAF loop)
 * - Zero DOM queries during scroll (cached selectors)
 * - No will-change/translateZ spam
 */

(function() {
    'use strict';

    let isScrolling = false;
    let scrollTimeout = null;
    let ticking = false;

    function setScrollState(state) {
        if (isScrolling === state) return;
        isScrolling = state;
        if (state) {
            document.body.classList.add('scrolling');
        } else {
            document.body.classList.remove('scrolling');
        }
    }

    function handleScroll() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(function() {
                setScrollState(true);
                ticking = false;
            });
        }

        // Debounce scroll-end detection
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            setScrollState(false);
        }, 120);
    }

    // Single passive scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Pause animations when tab is hidden
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            setScrollState(true);
        } else {
            setScrollState(false);
        }
    });

    // Public API
    window.scrollPerformance = {
        getState: function() { return { isScrolling: isScrolling }; }
    };


})();
