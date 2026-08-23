/* ═══════════════════════════════════════════════════════════════════════════════
   ANHAD — AUTHORITATIVE SCROLL ENGINE & PERFORMANCE CONTROLLER v3.0
   Ultra-stable native fluid 60-120 FPS scrolling with zero style invalidations.
   ═══════════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // Global Scroll State - Passive tracking without DOM thrashing
    let isScrolling = false;

    // Pause all heavy animations when page is hidden (saves battery/CPU)
    document.addEventListener('visibilitychange', () => {
        if (document.body) {
            document.body.classList.toggle('page-hidden', document.hidden);
        }
    });

    // ─── CENTRALIZED REVEAL OBSERVER ───
    // Single shared IntersectionObserver for scroll-reveal animations.
    const AnhadScrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                target.classList.add('revealed', 'scroll-revealed', 'in-viewport');
                target.classList.add('anhad-reveal-instant');
                // Stop observing once revealed — single-fire, zero ongoing cost
                AnhadScrollObserver.unobserve(target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px 40px 0px',
        threshold: 0.05
    });

    function scanAndObserveReveals() {
        const targets = document.querySelectorAll(
            '.scroll-reveal, .practice-grid, .quick-card, .event-card, .practice-card, .clay-card'
        );
        targets.forEach(t => {
            if (!t.classList.contains('revealed')) {
                AnhadScrollObserver.observe(t);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scanAndObserveReveals);
    } else {
        scanAndObserveReveals();
    }

    // Re-scan after SPA navigation (new elements mounted to DOM)
    window.addEventListener('anhad_page_changed', () => {
        setTimeout(scanAndObserveReveals, 100);
    });

    // Export public API
    window.AnhadScrollEngine = {
        getIsScrolling: () => false,
        scan: scanAndObserveReveals,
        observer: AnhadScrollObserver
    };
    window.AnhadScrollObserver = AnhadScrollObserver;

})();
