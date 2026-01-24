/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PERFORMANCE OPTIMIZER v1.0
 * 
 * Features:
 * ✅ 60fps animations with requestAnimationFrame
 * ✅ Debounced/throttled event handlers
 * ✅ Lazy loading for audio files
 * ✅ CSS containment for better rendering
 * ✅ Virtual scrolling for long lists
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // Prevent duplicate initialization
    if (window.PerfOptimizer) return;

    // ══════════════════════════════════════════════════════════════════════════
    // ANIMATION UTILITIES
    // ══════════════════════════════════════════════════════════════════════════
    const Animation = {
        // Smooth spring animation
        spring(element, properties, options = {}) {
            const {
                stiffness = 100,
                damping = 10,
                mass = 1,
                duration = 500
            } = options;

            const start = performance.now();
            const initialValues = {};

            for (const prop in properties) {
                initialValues[prop] = parseFloat(getComputedStyle(element)[prop]) || 0;
            }

            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);

                // Spring easing
                const springProgress = 1 - Math.exp(-stiffness * progress / damping) *
                    Math.cos(Math.sqrt(stiffness / mass) * progress);

                for (const prop in properties) {
                    const current = initialValues[prop] +
                        (properties[prop] - initialValues[prop]) * springProgress;
                    element.style[prop] = `${current}px`;
                }

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        },

        // Smooth fade
        fade(element, from, to, duration = 300) {
            const start = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);

                element.style.opacity = from + (to - from) * eased;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        },

        // Smooth transform
        transform(element, transform, duration = 300) {
            element.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
            element.style.transform = transform;
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // DEBOUNCE & THROTTLE
    // ══════════════════════════════════════════════════════════════════════════
    function debounce(func, wait = 100) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function throttle(func, limit = 100) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    function rafThrottle(func) {
        let ticking = false;
        return function executedFunction(...args) {
            if (!ticking) {
                requestAnimationFrame(() => {
                    func(...args);
                    ticking = false;
                });
                ticking = true;
            }
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LAZY AUDIO LOADER
    // ══════════════════════════════════════════════════════════════════════════
    const AudioLoader = {
        cache: new Map(),
        loading: new Set(),

        async preload(src) {
            if (this.cache.has(src) || this.loading.has(src)) {
                return this.cache.get(src);
            }

            this.loading.add(src);

            return new Promise((resolve, reject) => {
                const audio = new Audio();
                audio.preload = 'metadata';

                audio.addEventListener('canplaythrough', () => {
                    this.cache.set(src, audio);
                    this.loading.delete(src);
                    resolve(audio);
                }, { once: true });

                audio.addEventListener('error', (e) => {
                    this.loading.delete(src);
                    reject(e);
                }, { once: true });

                audio.src = src;
            });
        },

        get(src) {
            return this.cache.get(src) || null;
        },

        clear() {
            this.cache.forEach(audio => {
                audio.pause();
                audio.src = '';
            });
            this.cache.clear();
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // INTERSECTION OBSERVER FOR LAZY LOADING
    // ══════════════════════════════════════════════════════════════════════════
    const LazyLoader = {
        observer: null,

        init() {
            if (!('IntersectionObserver' in window)) return;

            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const el = entry.target;

                        // Handle images
                        if (el.dataset.src) {
                            el.src = el.dataset.src;
                            el.removeAttribute('data-src');
                        }

                        // Handle animations
                        if (el.dataset.animate) {
                            el.classList.add(el.dataset.animate);
                            el.removeAttribute('data-animate');
                        }

                        this.observer.unobserve(el);
                    }
                });
            }, {
                rootMargin: '50px',
                threshold: 0.1
            });
        },

        observe(element) {
            if (this.observer) {
                this.observer.observe(element);
            }
        },

        disconnect() {
            if (this.observer) {
                this.observer.disconnect();
            }
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // VIRTUAL SCROLLER
    // ══════════════════════════════════════════════════════════════════════════
    class VirtualScroller {
        constructor(container, items, renderItem, itemHeight = 100) {
            this.container = container;
            this.items = items;
            this.renderItem = renderItem;
            this.itemHeight = itemHeight;
            this.buffer = 5;

            this.setup();
        }

        setup() {
            this.container.style.position = 'relative';
            this.container.style.overflow = 'auto';
            this.container.style.contain = 'strict';

            // Create content wrapper
            this.wrapper = document.createElement('div');
            this.wrapper.style.position = 'relative';
            this.wrapper.style.width = '100%';
            this.wrapper.style.height = `${this.items.length * this.itemHeight}px`;
            this.container.appendChild(this.wrapper);

            // Bind scroll handler
            this.handleScroll = rafThrottle(() => this.render());
            this.container.addEventListener('scroll', this.handleScroll, { passive: true });

            // Initial render
            this.render();
        }

        render() {
            const scrollTop = this.container.scrollTop;
            const containerHeight = this.container.clientHeight;

            const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
            const endIndex = Math.min(
                this.items.length,
                Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.buffer
            );

            // Clear wrapper
            this.wrapper.innerHTML = '';

            // Render visible items
            for (let i = startIndex; i < endIndex; i++) {
                const item = this.items[i];
                const element = this.renderItem(item, i);

                element.style.position = 'absolute';
                element.style.top = `${i * this.itemHeight}px`;
                element.style.left = '0';
                element.style.right = '0';
                element.style.height = `${this.itemHeight}px`;
                element.style.contain = 'layout style paint';

                this.wrapper.appendChild(element);
            }
        }

        updateItems(newItems) {
            this.items = newItems;
            this.wrapper.style.height = `${this.items.length * this.itemHeight}px`;
            this.render();
        }

        destroy() {
            this.container.removeEventListener('scroll', this.handleScroll);
            this.wrapper.remove();
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SCROLL PERFORMANCE
    // ══════════════════════════════════════════════════════════════════════════
    function optimizeScroll() {
        // Add passive listeners for better scroll performance
        document.addEventListener('touchstart', () => { }, { passive: true });
        document.addEventListener('touchmove', () => { }, { passive: true });
        document.addEventListener('wheel', () => { }, { passive: true });

        // Add scroll momentum to iOS
        document.querySelectorAll('.scrollable').forEach(el => {
            el.style.webkitOverflowScrolling = 'touch';
            el.style.overscrollBehavior = 'contain';
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CSS CONTAINMENT
    // ══════════════════════════════════════════════════════════════════════════
    function applyContainment() {
        // Apply CSS containment to cards for better rendering performance
        const style = document.createElement('style');
        style.textContent = `
            .alarm-card,
            .stat-item,
            .quick-setting,
            .settings-item,
            .sound-option {
                contain: layout style paint;
            }
            
            .sheet-content {
                contain: strict;
            }
            
            .app-container {
                contain: layout;
            }
            
            /* GPU acceleration for animations */
            .alarm-card,
            .sheet,
            .fab,
            .toggle-track::before {
                will-change: transform;
            }
            
            /* Reduce paint areas */
            .pulse-ring,
            .countdown-ring {
                will-change: transform, opacity;
            }
        `;
        document.head.appendChild(style);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MEMORY MANAGEMENT
    // ══════════════════════════════════════════════════════════════════════════
    function cleanupMemory() {
        // Clear audio cache when page is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                AudioLoader.clear();
            }
        });

        // Clear unused resources on low memory
        if ('memory' in navigator) {
            setInterval(() => {
                const memory = navigator.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                    console.log('[Perf] Low memory, clearing caches');
                    AudioLoader.clear();
                    LazyLoader.disconnect();
                }
            }, 30000);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════
    function init() {
        console.log('⚡ Performance Optimizer initializing...');

        LazyLoader.init();
        optimizeScroll();
        applyContainment();
        cleanupMemory();

        console.log('⚡ Performance Optimizer ready');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose utilities
    window.PerfOptimizer = {
        Animation,
        AudioLoader,
        LazyLoader,
        VirtualScroller,
        debounce,
        throttle,
        rafThrottle
    };

})();
