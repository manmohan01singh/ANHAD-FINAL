/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OPTIMIZED IMAGE LOADER
 * Progressive image loading with blur-up placeholders
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ Blur-up placeholder technique
 * ✅ Lazy loading with Intersection Observer
 * ✅ Cache-first loading strategy
 * ✅ WebP with fallback support
 * ✅ Responsive image loading
 * 
 * @version 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class OptimizedImageLoader {
    constructor() {
        this.observer = null;
        this.loadedImages = new Set();
        this.init();
    }

    init() {
        // Setup Intersection Observer for lazy loading
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
                            this.loadImage(entry.target);
                            // Delay unobserve to prevent flickering during momentum scroll
                            setTimeout(() => this.observer.unobserve(entry.target), 100);
                        }
                    });
                },
                {
                    rootMargin: '100px', // Start loading 100px before visible (increased from 50px)
                    threshold: 0.1 // Require at least 10% visibility before triggering
                }
            );
        }

        // Auto-discover and optimize images
        this.optimizeAllImages();
    }

    /**
     * Find all images and optimize them
     */
    optimizeAllImages() {
        const images = document.querySelectorAll('img[data-src], img[data-optimize]');
        images.forEach(img => this.setupImage(img));
    }

    /**
     * Setup a single image for optimized loading
     */
    setupImage(img) {
        // Add loading class
        img.classList.add('img-loading');

        // If image should load immediately (above fold)
        if (img.hasAttribute('data-eager') || img.loading === 'eager') {
            this.loadImage(img);
        } else if (this.observer) {
            // Lazy load
            this.observer.observe(img);
        } else {
            // Fallback for browsers without IntersectionObserver
            this.loadImage(img);
        }
    }

    /**
     * Load an image with progressive enhancement
     */
    async loadImage(img) {
        if (this.loadedImages.has(img)) return;
        this.loadedImages.add(img);

        const src = img.dataset.src || img.src;
        const srcWebp = img.dataset.srcWebp;

        if (!src) return;

        try {
            // Try to get from cache first
            let imageUrl = src;
            
            if (window.baniCacheOptimizer) {
                const cachedUrl = await window.baniCacheOptimizer.getCachedImageURL(src);
                if (cachedUrl) {
                    imageUrl = cachedUrl;
                    console.log('[ImageLoader] ⚡ Loaded from cache:', src);
                }
            }

            // Create a new image to preload
            const tempImg = new Image();
            
            // Setup load handlers
            tempImg.onload = () => {
                // Fade in the image
                img.src = imageUrl;
                img.classList.remove('img-loading');
                img.classList.add('img-loaded');
                
                // Trigger fade-in animation
                requestAnimationFrame(() => {
                    img.style.opacity = '1';
                });
            };

            tempImg.onerror = () => {
                console.warn('[ImageLoader] Failed to load:', src);
                img.classList.remove('img-loading');
                img.classList.add('img-error');
                
                // Try fallback if available
                const fallback = img.dataset.fallback;
                if (fallback && fallback !== src) {
                    img.dataset.src = fallback;
                    this.loadedImages.delete(img);
                    this.loadImage(img);
                }
            };

            // Start loading
            tempImg.src = imageUrl;

        } catch (error) {
            console.error('[ImageLoader] Error:', error);
            img.classList.remove('img-loading');
            img.classList.add('img-error');
        }
    }

    /**
     * Preload an array of image URLs
     */
    async preloadImages(urls) {
        const promises = urls.map(url => this.preloadSingleImage(url));
        return Promise.allSettled(promises);
    }

    /**
     * Preload a single image
     */
    preloadSingleImage(url) {
        return new Promise((resolve, reject) => {
            // Check cache first
            if (window.baniCacheOptimizer) {
                window.baniCacheOptimizer.preloadImage(url)
                    .then(resolve)
                    .catch(reject);
            } else {
                // Fallback to standard preload
                const img = new Image();
                img.onload = () => resolve(url);
                img.onerror = () => reject(new Error(`Failed to load ${url}`));
                img.src = url;
            }
        });
    }

    /**
     * Create an optimized image element
     */
    createOptimizedImage(options) {
        const {
            src,
            srcWebp,
            alt = '',
            className = '',
            eager = false,
            fallback = null,
            width = null,
            height = null
        } = options;

        const img = document.createElement('img');
        img.alt = alt;
        img.className = `optimized-image ${className}`;
        
        if (width) img.width = width;
        if (height) img.height = height;

        // Use data attributes for lazy loading
        if (eager) {
            img.src = src;
            img.loading = 'eager';
            img.setAttribute('data-eager', 'true');
        } else {
            img.dataset.src = src;
            img.loading = 'lazy';
            // Use a tiny placeholder
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
        }

        if (srcWebp) img.dataset.srcWebp = srcWebp;
        if (fallback) img.dataset.fallback = fallback;

        // Setup for optimization
        this.setupImage(img);

        return img;
    }

    /**
     * Observe new images added to DOM
     */
    observeNewImages() {
        if (!('MutationObserver' in window)) return;

        this.mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'IMG' && (node.dataset.src || node.dataset.optimize)) {
                            this.setupImage(node);
                        }
                        // Check children
                        const images = node.querySelectorAll?.('img[data-src], img[data-optimize]');
                        images?.forEach(img => this.setupImage(img));
                    }
                });
            });
        });

        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Cleanup handler to prevent memory leaks
        window.addEventListener('pagehide', () => {
            if (this.mutationObserver) {
                this.mutationObserver.disconnect();
                this.mutationObserver = null;
            }
        }, { once: true });
    }
}

// ═══════════════════════════════════════════════════════════════
// CSS INJECTION
// ═══════════════════════════════════════════════════════════════

const imageLoaderStyles = `
    .optimized-image {
        transition: opacity 0.3s ease-in-out;
    }

    .img-loading {
        opacity: 0.3;
        filter: blur(10px);
        transform: scale(1.05);
    }

    .img-loaded {
        opacity: 1;
        filter: blur(0);
        transform: scale(1);
    }

    .img-error {
        opacity: 0.5;
        filter: grayscale(1);
    }

    /* Skeleton placeholder for images */
    .img-loading::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.1) 100%
        );
        animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }

    /* Dark mode adjustments */
    html.dark-mode .img-loading::before {
        background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.05) 100%
        );
    }
`;

// Inject styles
if (!document.getElementById('optimized-image-loader-styles')) {
    const style = document.createElement('style');
    style.id = 'optimized-image-loader-styles';
    style.textContent = imageLoaderStyles;
    document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL INSTANCE
// ═══════════════════════════════════════════════════════════════

window.optimizedImageLoader = new OptimizedImageLoader();

// Auto-observe new images
window.optimizedImageLoader.observeNewImages();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptimizedImageLoader;
}
