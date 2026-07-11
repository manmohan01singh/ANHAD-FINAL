/* ═══════════════════════════════════════════════════════════════════════════════
   ANHAD — AUTHORITATIVE SCROLL ENGINE & PERFORMANCE CONTROLLER
   Targeting native fluid 60-120 FPS scrolling across mobile PWAs.
   ═══════════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // Global Scroll State
    let isScrolling = false;
    let scrollStopTimeout = null;

    // Cache document element references
    const rootEl = document.documentElement;

    // ─── 1. SCROLL CLASS TOGGLE (simplified — no RAF+setTimeout hybrid) ───
    // PERF FIX: Removed nested RAF inside scroll handler. The 'scroll' event
    // fires asynchronously off the main thread already; no need to double-buffer
    // via RAF. This eliminates the flickering is-scrolling class state that caused
    // visual inconsistency and redundant style recalculations.
    function setScrollingState(scrolling) {
        if (isScrolling === scrolling) return;
        isScrolling = scrolling;
        const body = document.body;
        if (!body) return;
        if (scrolling) {
            body.classList.add('scrolling', 'is-scrolling');
            rootEl.classList.add('scrolling', 'is-scrolling');
        } else {
            body.classList.remove('scrolling', 'is-scrolling');
            rootEl.classList.remove('scrolling', 'is-scrolling');
        }
    }

    function onScroll() {
        setScrollingState(true);
        if (scrollStopTimeout) clearTimeout(scrollStopTimeout);
        scrollStopTimeout = setTimeout(() => setScrollingState(false), 150);
    }

    // Listen to scroll events with { passive: true } to prevent blocking main thread
    window.addEventListener('scroll', onScroll, { passive: true });



    // Pause all infinite animations when page is hidden (saves battery/CPU)
    document.addEventListener('visibilitychange', () => {
        if (document.body) {
            document.body.classList.toggle('page-hidden', document.hidden);
        }
        if (document.hidden) {
            setScrollingState(false);
            if (scrollStopTimeout) clearTimeout(scrollStopTimeout);
        }
    });

    // ─── 2. CENTRALIZED REVEAL OBSERVER ───
    // Single shared IntersectionObserver for scroll-reveal animations.
    // PERF FIX: Removed the second 'cvObserver' that dynamically toggled
    // content-visibility:auto/visible. That pattern caused layout recalculations
    // every time off-screen elements re-entered the viewport — the opposite of
    // the intended optimization. CSS content-visibility:auto is better applied
    // statically in CSS for sections that are guaranteed below-the-fold.
    const AnhadScrollObserver = new IntersectionObserver((entries) => {
        requestAnimationFrame(() => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    
                    // NATIVE APP FIX: Check if animations have already been played
                    // Don't replay animations if we're returning to the page
                    const hasPlayedAnimations = window.HomeStateManager?.hasPlayedAnimations();
                    
                    if (hasPlayedAnimations) {
                        // Just add classes without animation
                        target.classList.add('revealed', 'scroll-revealed', 'in-viewport');
                        // Remove animation to make it instant
                        target.style.animation = 'none';
                    } else {
                        // First time - play animation
                        target.classList.add('revealed', 'scroll-revealed', 'in-viewport');
                    }
                    
                    // Stop observing once revealed — single-fire, no ongoing cost
                    AnhadScrollObserver.unobserve(target);
                }
            });
        });
    }, {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.1
    });

    function scanAndObserveReveals() {
        const targets = document.querySelectorAll(
            '.scroll-reveal, .practice-grid, .quick-card, .event-card, .practice-card, .clay-card'
        );
        targets.forEach(t => AnhadScrollObserver.observe(t));
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
        getIsScrolling: () => isScrolling,
        scan: scanAndObserveReveals,
        observer: AnhadScrollObserver
    };
    window.AnhadScrollObserver = AnhadScrollObserver;

    console.log('[AnhadScrollEngine] v2 — simplified, single-observer engine initialized');
})();
