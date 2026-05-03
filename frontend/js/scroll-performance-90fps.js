/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SCROLL PERFORMANCE MANAGER - 90 FPS TARGET
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Advanced scroll performance optimization system that:
 * - Manages scroll state and performance modes
 * - Throttles scroll events for 90fps performance
 * - Dynamically disables/enables visual effects during scroll
 * - Monitors scroll performance and adapts accordingly
 * - Provides smooth scrolling with hardware acceleration
 */

class ScrollPerformanceManager {
    constructor() {
        this.isScrolling = false;
        this.scrollTimeout = null;
        this.rafId = null;
        this.performanceMode = 'high'; // 'high', 'medium', 'low'
        this.lastScrollTime = 0;
        this.scrollVelocity = 0;
        this.scrollDirection = 'down';
        this.lastScrollY = 0;
        
        // Performance monitoring
        this.frameCount = 0;
        this.fps = 60;
        this.lastFrameTime = performance.now();
        
        this.init();
    }

    init() {
        this.setupScrollListeners();
        this.setupTouchOptimizations();
        this.setupPerformanceMonitoring();
        this.optimizeScrollContainers();
        console.log('[ScrollPerformance] 90fps optimization initialized');
    }

    setupScrollListeners() {
        // Main scroll listener with RAF throttling
        let ticking = false;
        
        const optimizedScrollHandler = () => {
            if (!ticking) {
                this.rafId = requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Use passive listeners for better performance
        window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
        
        // Optimize touch events
        document.addEventListener('touchstart', this.handleTouchStart, { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove, { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    }

    handleScroll() {
        const currentTime = performance.now();
        const currentScrollY = window.pageYOffset;
        
        // Calculate scroll velocity
        const deltaY = currentScrollY - this.lastScrollY;
        const deltaTime = currentTime - this.lastScrollTime;
        this.scrollVelocity = Math.abs(deltaY / deltaTime);
        this.scrollDirection = deltaY > 0 ? 'down' : 'up';
        
        this.lastScrollY = currentScrollY;
        this.lastScrollTime = currentTime;

        // Set scrolling state
        if (!this.isScrolling) {
            this.setScrollingState(true);
        }

        // Clear existing timeout
        clearTimeout(this.scrollTimeout);
        
        // Set timeout to end scrolling state
        this.scrollTimeout = setTimeout(() => {
            this.setScrollingState(false);
        }, 150);

        // Update performance mode based on velocity
        this.updatePerformanceMode();

        // Apply scroll-specific optimizations
        this.applyScrollOptimizations();
    }

    handleTouchStart = (e) => {
        // Mark touch start for performance optimization
        document.body.classList.add('touch-active');
        this.setScrollingState(true);
    }

    handleTouchMove = (e) => {
        // Prevent default only if necessary
        if (this.shouldPreventDefault(e)) {
            e.preventDefault();
        }
    }

    handleTouchEnd = (e) => {
        // Remove touch state
        document.body.classList.remove('touch-active');
        setTimeout(() => {
            this.setScrollingState(false);
        }, 100);
    }

    shouldPreventDefault(e) {
        // Only prevent default for specific cases
        return false; // Let the browser handle scrolling naturally
    }

    setScrollingState(isScrolling) {
        this.isScrolling = isScrolling;
        
        if (isScrolling) {
            document.body.classList.add('scrolling');
            this.disableExpensiveEffects();
        } else {
            document.body.classList.remove('scrolling');
            this.enableExpensiveEffects();
        }
    }

    disableExpensiveEffects() {
        // Disable expensive animations and effects during scroll
        const expensiveElements = document.querySelectorAll(`
            .aurora-bg,
            .particle-burst,
            .spark-burst,
            .hero-card__badge,
            .event-card__guru-img-wrapper
        `);

        expensiveElements.forEach(el => {
            el.style.transition = 'none';
            el.style.animation = 'none';
        });

        // Simplify shadows during scroll
        const shadowElements = document.querySelectorAll(`
            .event-card,
            .hero-card,
            .quick-card,
            .practice-card
        `);

        shadowElements.forEach(el => {
            el.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.04)';
        });
    }

    enableExpensiveEffects() {
        // Re-enable effects after scroll ends
        setTimeout(() => {
            const expensiveElements = document.querySelectorAll(`
                .aurora-bg,
                .particle-burst,
                .spark-burst
            `);

            expensiveElements.forEach(el => {
                el.style.transition = '';
                el.style.animation = '';
            });

            // Restore complex shadows
            const shadowElements = document.querySelectorAll(`
                .event-card,
                .hero-card,
                .quick-card,
                .practice-card
            `);

            shadowElements.forEach(el => {
                el.style.boxShadow = '';
            });
        }, 100);
    }

    updatePerformanceMode() {
        if (this.scrollVelocity > 15) {
            this.performanceMode = 'low';
        } else if (this.scrollVelocity > 5) {
            this.performanceMode = 'medium';
        } else {
            this.performanceMode = 'high';
        }

        document.body.setAttribute('data-performance', this.performanceMode);
    }

    applyScrollOptimizations() {
        // Apply different optimizations based on performance mode
        switch (this.performanceMode) {
            case 'low':
                this.applyLowPerformanceMode();
                break;
            case 'medium':
                this.applyMediumPerformanceMode();
                break;
            case 'high':
                this.applyHighPerformanceMode();
                break;
        }
    }

    applyLowPerformanceMode() {
        // Most aggressive optimizations for fast scrolling
        document.body.classList.add('performance-low');
        document.body.classList.remove('performance-medium', 'performance-high');
        
        // Disable all non-essential animations
        const animatedElements = document.querySelectorAll('[data-animate]');
        animatedElements.forEach(el => {
            el.style.animationPlayState = 'paused';
        });
    }

    applyMediumPerformanceMode() {
        // Balanced optimizations
        document.body.classList.add('performance-medium');
        document.body.classList.remove('performance-low', 'performance-high');
    }

    applyHighPerformanceMode() {
        // Full visual effects enabled
        document.body.classList.add('performance-high');
        document.body.classList.remove('performance-low', 'performance-medium');
        
        // Re-enable animations
        const animatedElements = document.querySelectorAll('[data-animate]');
        animatedElements.forEach(el => {
            el.style.animationPlayState = 'running';
        });
    }

    setupTouchOptimizations() {
        // Optimize touch responsiveness
        document.addEventListener('touchstart', () => {
            document.body.classList.add('touch-active');
        }, { passive: true });

        document.addEventListener('touchend', () => {
            setTimeout(() => {
                document.body.classList.remove('touch-active');
            }, 100);
        }, { passive: true });
    }

    setupPerformanceMonitoring() {
        // Monitor FPS and adjust performance accordingly
        const monitorFPS = () => {
            const now = performance.now();
            const delta = now - this.lastFrameTime;
            this.fps = Math.round(1000 / delta);
            this.lastFrameTime = now;

            // Auto-adjust performance if FPS drops
            if (this.fps < 45) {
                this.performanceMode = 'low';
            } else if (this.fps < 55) {
                this.performanceMode = 'medium';
            }

            requestAnimationFrame(monitorFPS);
        };

        requestAnimationFrame(monitorFPS);
    }

    optimizeScrollContainers() {
        // Add performance attributes to scroll containers
        const scrollContainers = document.querySelectorAll('.main-content, .gurbani-scroll, .verses-container');
        
        scrollContainers.forEach(container => {
            container.setAttribute('data-scrollable', 'true');
            container.style.willChange = 'scroll-position';
            container.style.transform = 'translateZ(0)';
            container.style.backfaceVisibility = 'hidden';
        });

        // Optimize images for scroll performance
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.style.transform = 'translateZ(0)';
            img.style.willChange = 'transform';
            img.style.imageRendering = '-webkit-optimize-contrast';
        });
    }

    // Public API for manual control
    enablePerformanceMode() {
        document.body.classList.add('performance-mode');
        this.optimizeScrollContainers();
    }

    disablePerformanceMode() {
        document.body.classList.remove('performance-mode');
    }

    getScrollMetrics() {
        return {
            isScrolling: this.isScrolling,
            scrollVelocity: this.scrollVelocity,
            scrollDirection: this.scrollDirection,
            performanceMode: this.performanceMode,
            fps: this.fps
        };
    }
}

// Initialize the scroll performance manager
const scrollPerformance = new ScrollPerformanceManager();

// Export for global access
window.ScrollPerformanceManager = ScrollPerformanceManager;
window.scrollPerformance = scrollPerformance;

console.log('[ScrollPerformance] 90fps scroll optimization loaded successfully');
