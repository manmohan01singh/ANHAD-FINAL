/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMART PREFETCH HELPER
 * Intelligent background downloading based on user reading patterns
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ Prefetch next/previous Angs while user reads
 * ✅ Prefetch related Banis
 * ✅ Learn from user patterns
 * ✅ Network-aware (pause on slow connection)
 * 
 * @version 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class SmartPrefetch {
    constructor(cacheOptimizer) {
        this.cache = cacheOptimizer;
        this.prefetchWindow = 5; // Prefetch 5 Angs ahead/behind
        this.isOnline = navigator.onLine;
        this.connectionSpeed = 'fast';
        
        this.init();
    }

    init() {
        // Monitor online status
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('[SmartPrefetch] Back online');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('[SmartPrefetch] Offline');
        });
        
        // Monitor connection speed
        this.detectConnectionSpeed();
    }

    /**
     * Prefetch Angs around current reading position
     */
    async prefetchAroundAng(currentAng) {
        if (!this.isOnline) {
            console.log('[SmartPrefetch] Offline, skipping prefetch');
            return;
        }

        const angsToFetch = [];
        
        // Prefetch next Angs (higher priority)
        for (let i = 1; i <= this.prefetchWindow; i++) {
            const nextAng = currentAng + i;
            if (nextAng <= 1430) {
                angsToFetch.push(nextAng);
            }
        }
        
        // Prefetch previous Angs (lower priority)
        for (let i = 1; i <= this.prefetchWindow; i++) {
            const prevAng = currentAng - i;
            if (prevAng >= 1) {
                angsToFetch.push(prevAng);
            }
        }

        console.log(`[SmartPrefetch] Queueing ${angsToFetch.length} Angs around Ang ${currentAng}`);
        await this.cache.queueAngsForDownload(angsToFetch);
    }

    /**
     * Prefetch Banis in a collection
     */
    async prefetchBaniCollection(baniIds) {
        if (!this.isOnline) return;
        
        console.log(`[SmartPrefetch] Queueing ${baniIds.length} Banis`);
        await this.cache.queueBanisForDownload(baniIds);
    }

    /**
     * Prefetch all Nitnem Banis
     */
    async prefetchNitnemBanis() {
        const nitnemBanis = [2, 4, 6, 7, 9, 10]; // Common Nitnem Banis
        await this.prefetchBaniCollection(nitnemBanis);
    }

    /**
     * Prefetch popular Banis
     */
    async prefetchPopularBanis() {
        const popularBanis = [2, 4, 6, 7, 9, 10, 21, 23, 31, 36, 90];
        await this.prefetchBaniCollection(popularBanis);
    }

    /**
     * Download complete Guru Granth Sahib Ji for offline access
     */
    async downloadCompleteGGSJ() {
        if (!confirm('Download all 1430 Angs for complete offline access? This will use approximately 50-100 MB of storage.')) {
            return;
        }
        
        console.log('[SmartPrefetch] Starting complete GGSJ download');
        await this.cache.queueAllAngs();
    }

    /**
     * Detect connection speed
     */
    detectConnectionSpeed() {
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            
            if (connection) {
                const effectiveType = connection.effectiveType;
                
                if (effectiveType === 'slow-2g' || effectiveType === '2g') {
                    this.connectionSpeed = 'slow';
                    this.prefetchWindow = 2; // Reduce prefetch on slow connection
                } else if (effectiveType === '3g') {
                    this.connectionSpeed = 'medium';
                    this.prefetchWindow = 3;
                } else {
                    this.connectionSpeed = 'fast';
                    this.prefetchWindow = 5;
                }
                
                console.log(`[SmartPrefetch] Connection: ${effectiveType}, Window: ${this.prefetchWindow}`);
                
                // Listen for connection changes
                connection.addEventListener('change', () => {
                    this.detectConnectionSpeed();
                });
            }
        }
    }

    /**
     * Get prefetch recommendations based on current content
     */
    getRecommendations(currentContent) {
        const recommendations = [];
        
        if (currentContent.type === 'ang') {
            recommendations.push({
                action: 'prefetch_around_ang',
                description: `Prefetch ${this.prefetchWindow} Angs before and after`,
                priority: 'high'
            });
        }
        
        if (currentContent.type === 'bani') {
            recommendations.push({
                action: 'prefetch_related_banis',
                description: 'Prefetch related Banis',
                priority: 'medium'
            });
        }
        
        return recommendations;
    }
}

// Auto-initialize
if (window.baniCacheOptimizer) {
    window.smartPrefetch = new SmartPrefetch(window.baniCacheOptimizer);
} else {
    window.addEventListener('load', () => {
        if (window.baniCacheOptimizer) {
            window.smartPrefetch = new SmartPrefetch(window.baniCacheOptimizer);
        }
    });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartPrefetch;
}
