/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PERFORMANCE OPTIMIZER JS (LEAN)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Lightweight scroll/visibility handler.
 * Removed: will-change spam, translateZ(0) on every icon, contain on every
 * glass element, IntersectionObserver for animation pausing (handled by CSS).
 * 
 * What remains:
 * 1. 'is-scrolling' class during scroll (CSS handles the rest)
 * 2. Visibility-based animation pausing
 * 3. Lazy IntersectionObserver for off-screen content-visibility
 */

(function () {
    'use strict';

    let scrollTimeout = null;
    let isScrolling = false;

    function onScrollStart() {
        if (!isScrolling) {
            isScrolling = true;
            document.body.classList.add('is-scrolling');
        }
    }

    function onScrollEnd() {
        if (isScrolling) {
            isScrolling = false;
            document.body.classList.remove('is-scrolling');
        }
    }

    function handleScroll() {
        onScrollStart();
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(onScrollEnd, 150);
    }

    // Single passive scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Pause animations when tab hidden
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            document.body.classList.add('is-scrolling');
        } else {
            document.body.classList.remove('is-scrolling');
        }
    });

    // Lazy content-visibility for off-screen sections (after DOMContentLoaded)
    function initContentVisibility() {
        if (!('IntersectionObserver' in window)) return;
        
        var sections = document.querySelectorAll('.quick-access-grid, .practice-grid, .sheet');
        if (!sections.length) return;

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.style.contentVisibility = 'visible';
                } else {
                    entry.target.style.contentVisibility = 'auto';
                }
            });
        }, { rootMargin: '200px' });

        sections.forEach(function(el) { observer.observe(el); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initContentVisibility);
    } else {
        initContentVisibility();
    }

    console.log('[PerfOptimizer] ✅ Lean performance optimizer initialized');

    window.PerfOptimizer = {
        forceScrollEnd: onScrollEnd
    };
})();
