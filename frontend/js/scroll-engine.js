/* ═══════════════════════════════════════════════════════════════════════════════
   ANHAD — AUTHORITATIVE SCROLL ENGINE & PERFORMANCE CONTROLLER
   Targeting native fluid 60-120 FPS scrolling across mobile PWAs.
   ═══════════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // Global Scroll State
    let isScrolling = false;
    let rafId = null;
    let lastScrollY = -1;
    let scrollStopTimeout = null;

    // Cache document element references
    const rootEl = document.documentElement;
    const bodyEl = document.body || document.getElementsByTagName('body')[0];

    // Safely get body element (in case body is not loaded yet)
    function getBody() {
        return document.body || document.getElementsByTagName('body')[0];
    }

    // ─── 1. BATCHED SCROLL POSITION & CLASS UPDATES ───
    function updateScrollState(scrolling) {
        if (isScrolling === scrolling) return;
        isScrolling = scrolling;

        // Use requestAnimationFrame to batch DOM writes and prevent forced reflows
        requestAnimationFrame(() => {
            const body = getBody();
            if (!body) return;

            if (scrolling) {
                body.classList.add('scrolling', 'is-scrolling');
                rootEl.classList.add('scrolling', 'is-scrolling');
            } else {
                body.classList.remove('scrolling', 'is-scrolling');
                rootEl.classList.remove('scrolling', 'is-scrolling');
            }
        });
    }

    function handleScrollTick() {
        const currentY = window.scrollY || window.pageYOffset;

        if (currentY !== lastScrollY) {
            // Still moving
            updateScrollState(true);
            lastScrollY = currentY;

            // Request next frame check
            rafId = requestAnimationFrame(handleScrollTick);

            // Debounce scroll-end detection with a lightweight timer
            if (scrollStopTimeout) clearTimeout(scrollStopTimeout);
            scrollStopTimeout = setTimeout(() => {
                updateScrollState(false);
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            }, 150); // 150ms timeout to ensure movement has fully settled
        } else {
            // Position stayed same, check completed
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            updateScrollState(false);
        }
    }

    function onScroll() {
        lastScrollY = -1; // Reset to force tick evaluation
        if (!rafId) {
            rafId = requestAnimationFrame(handleScrollTick);
        }
    }

    // Listen to scroll events with { passive: true } to prevent blocking main thread
    window.addEventListener('scroll', onScroll, { passive: true });

    // Touch listener optimization for mobile touch latency bypass
    window.addEventListener('touchstart', () => {
        updateScrollState(true);
    }, { passive: true });

    window.addEventListener('touchend', () => {
        // Check if scrolling actually stopped or continues via inertial momentum
        if (scrollStopTimeout) clearTimeout(scrollStopTimeout);
        scrollStopTimeout = setTimeout(() => {
            updateScrollState(false);
        }, 200);
    }, { passive: true });

    // Handle visibility change to clean up scrolls and pause infinite animations
    document.addEventListener('visibilitychange', () => {
        document.body.classList.toggle('page-hidden', document.hidden);
        if (document.hidden) {
            updateScrollState(false);
            if (scrollStopTimeout) clearTimeout(scrollStopTimeout);
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }
    });

    // ─── 2. CENTRALIZED INSTANT REVEAL OBSERVER ───
    // Single shared IntersectionObserver instance
    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.1
    };

    const AnhadScrollObserver = new IntersectionObserver((entries) => {
        // Batch DOM updates
        requestAnimationFrame(() => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    // Apply both reveal classes to ensure backwards compatibility with all styles
                    target.classList.add('revealed', 'scroll-revealed', 'in-viewport');

                    // Stop observing once animation is triggered (improves CPU/FPS)
                    AnhadScrollObserver.unobserve(target);
                }
            });
        });
    }, observerOptions);

    // Auto-scan and observe elements on DOMContentLoaded
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

    // Monitor SPA page changing events (anhad_page_changed) for re-scans
    window.addEventListener('anhad_page_changed', () => {
        // Small delay to allow new SPA structure to mount to DOM
        setTimeout(() => {
            scanAndObserveReveals();
            initContentVisibility();
        }, 100);
    });

    // ─── 3. LAZY CONTENT-VISIBILITY OBSERVER ───
    function initContentVisibility() {
        if (!('IntersectionObserver' in window)) return;

        // Select widgets, grids, lists, and sheets that are outside critical above-the-fold content
        const sections = document.querySelectorAll(
            '.quick-access-grid, .practice-grid, .sheet, .card, .mala-card, .alarm-card, .streak-card, .event-card'
        );
        if (!sections.length) return;

        const cvObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.contentVisibility = 'visible';
                } else {
                    entry.target.style.contentVisibility = 'auto'; // Browser skips rendering offscreen elements
                }
            });
        }, { rootMargin: '300px' }); // larger margin for smoother scrolling transitions

        sections.forEach((el) => cvObserver.observe(el));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initContentVisibility);
    } else {
        initContentVisibility();
    }

    // Export properties
    window.AnhadScrollEngine = {
        getIsScrolling: () => isScrolling,
        scan: scanAndObserveReveals,
        observer: AnhadScrollObserver
    };

    // Expose legacy / alternative naming for backwards compatibility
    window.AnhadScrollObserver = AnhadScrollObserver;

    console.log('[AnhadScrollEngine] Centralized engine successfully initialized');
})();
