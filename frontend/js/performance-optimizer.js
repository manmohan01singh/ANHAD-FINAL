/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PERFORMANCE OPTIMIZER JS
 * ═══════════════════════════════════════════════════════════════════════════════
 * Fixes scrolling performance issues (flickering, lag, color splashing)
 * WITHOUT removing any animations or UI elements.
 * 
 * Key optimizations:
 * 1. Adds 'is-scrolling' class during scroll to pause background animations
 * 2. Throttles scroll-based CSS variable updates
 * 3. Uses requestIdleCallback for non-critical updates
 * 4. Implements intersection observer for off-screen animation pausing
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════════

    const CONFIG = {
        scrollDebounceMs: 150,          // Time to wait after scroll stops
        scrollThrottleMs: 16,           // ~60fps throttle
        enableScrollClass: true,        // Add is-scrolling class during scroll
        enableAnimationPausing: true,   // Pause animations during scroll
        enableIntersectionPausing: true // Pause off-screen animations
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // SCROLL PERFORMANCE HANDLER
    // ═══════════════════════════════════════════════════════════════════════════════

    let scrollTimeout = null;
    let isScrolling = false;
    let lastScrollY = 0;
    let rafId = null;

    function onScrollStart() {
        if (!isScrolling && CONFIG.enableScrollClass) {
            isScrolling = true;
            document.body.classList.add('is-scrolling');
        }
    }

    function onScrollEnd() {
        if (isScrolling && CONFIG.enableScrollClass) {
            isScrolling = false;
            document.body.classList.remove('is-scrolling');
        }
    }

    function handleScroll() {
        const scrollY = window.scrollY || window.pageYOffset;

        // Skip if scroll position hasn't changed meaningfully
        if (Math.abs(scrollY - lastScrollY) < 2) return;
        lastScrollY = scrollY;

        // Mark scroll start
        onScrollStart();

        // Clear existing timeout
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        // Set timeout to detect scroll end
        scrollTimeout = setTimeout(onScrollEnd, CONFIG.scrollDebounceMs);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // OPTIMIZED LIQUID GLASS SCROLL HANDLER
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Optimized version of the liquid glass scroll handler
     * Reduces DOM updates and batches CSS property changes
     */
    let liquidGlassTicking = false;
    let lastLiquidUpdate = 0;
    const LIQUID_UPDATE_INTERVAL = 50; // Update every 50ms instead of every frame

    function updateLiquidGlassOptimized() {
        const now = performance.now();

        // Throttle updates to reduce repaints
        if (now - lastLiquidUpdate < LIQUID_UPDATE_INTERVAL) {
            liquidGlassTicking = false;
            return;
        }
        lastLiquidUpdate = now;

        const scrollY = window.scrollY || window.pageYOffset;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? scrollY / max : 0;

        // Batch all CSS custom property updates into a single frame
        const root = document.documentElement;

        // Use CSS.registerProperty for smoother transitions if available
        root.style.setProperty("--liquid-flow", (scrollY * 0.1).toFixed(1));
        root.style.setProperty("--refraction", (20 + progress * 30).toFixed(1));
        root.style.setProperty("--highlight-shift", (progress * 80).toFixed(1));
        root.style.setProperty("--dispersion", (0.3 + progress * 0.5).toFixed(2));

        liquidGlassTicking = false;
    }

    function requestLiquidUpdate() {
        if (!liquidGlassTicking) {
            liquidGlassTicking = true;

            // Use requestIdleCallback for non-critical visual updates
            if (window.requestIdleCallback) {
                requestIdleCallback(() => {
                    requestAnimationFrame(updateLiquidGlassOptimized);
                }, { timeout: 100 });
            } else {
                requestAnimationFrame(updateLiquidGlassOptimized);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // INTERSECTION OBSERVER FOR OFF-SCREEN ANIMATIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    let animationObserver = null;

    function initIntersectionPausing() {
        if (!CONFIG.enableIntersectionPausing || !window.IntersectionObserver) return;

        const animatedElements = document.querySelectorAll(`
            .aurora,
            .orb,
            .floating-particle,
            .cosmic-bg__divine-rays,
            .flower-of-life,
            [class*="animate-"],
            [class*="--pulse"],
            [class*="--float"],
            [class*="--glow"]
        `);

        if (animatedElements.length === 0) return;

        animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const element = entry.target;
                if (entry.isIntersecting) {
                    element.style.animationPlayState = 'running';
                } else {
                    element.style.animationPlayState = 'paused';
                }
            });
        }, {
            root: null,
            rootMargin: '50px',  // Start animation slightly before visible
            threshold: 0
        });

        animatedElements.forEach(el => animationObserver.observe(el));
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // ICON FLICKERING FIX
    // ═══════════════════════════════════════════════════════════════════════════════

    function fixIconFlickering() {
        // Force GPU layer for all Font Awesome icons
        const icons = document.querySelectorAll('.fas, .far, .fab, .fa, [class*="fa-"]');

        icons.forEach(icon => {
            // Ensure consistent rendering
            icon.style.willChange = 'transform';
            icon.style.transform = 'translateZ(0)';
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // BACKDROP FILTER OPTIMIZATION
    // ═══════════════════════════════════════════════════════════════════════════════

    function optimizeBackdropFilters() {
        const glassElements = document.querySelectorAll('.ios-glass, .liquid-glass, [class*="glass"]');

        glassElements.forEach(el => {
            // Force compositing layer
            if (!el.style.transform) {
                el.style.transform = 'translateZ(0)';
            }
            el.style.isolation = 'isolate';
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // VISIBILITY CHANGE HANDLER
    // ═══════════════════════════════════════════════════════════════════════════════

    function handleVisibilityChange() {
        if (document.hidden) {
            // Pause all background animations when tab is hidden
            document.body.classList.add('is-scrolling');
        } else {
            // Resume animations when tab is visible
            document.body.classList.remove('is-scrolling');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════════

    function init() {
        // Replace existing scroll listener with optimized version
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('scroll', requestLiquidUpdate, { passive: true });

        // Visibility change handling
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Initialize after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                fixIconFlickering();
                optimizeBackdropFilters();
                initIntersectionPausing();
            });
        } else {
            fixIconFlickering();
            optimizeBackdropFilters();
            initIntersectionPausing();
        }

        console.log('[PerfOptimizer] ✅ Scroll performance optimizer initialized');
    }

    // Run initialization
    init();

    // Expose for debugging
    window.PerfOptimizer = {
        config: CONFIG,
        forceScrollEnd: onScrollEnd,
        reinit: init
    };

})();
