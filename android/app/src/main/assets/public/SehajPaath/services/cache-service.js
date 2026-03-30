/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CACHE SERVICE
 * Handles offline caching of Gurbani content
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class CacheService {
    constructor() {
        this.cacheName = 'sehaj-paath-cache-v1';
        this.angCacheName = 'sehaj-paath-angs-v1';
        this.maxCachedAngs = 100;
    }

    /**
     * Check if service worker caching is available
     */
    isAvailable() {
        return 'caches' in window;
    }

    /**
     * Cache a specific Ang
     */
    async cacheAng(angNumber, data) {
        if (!this.isAvailable()) return false;

        try {
            const cache = await caches.open(this.angCacheName);
            const response = new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json' }
            });

            await cache.put(`/ang/${angNumber}`, response);
            await this.updateCachedAngsList(angNumber);

            return true;
        } catch (error) {
            console.error('Cache Ang error:', error);
            return false;
        }
    }

    /**
     * Get cached Ang
     */
    async getCachedAng(angNumber) {
        if (!this.isAvailable()) return null;

        try {
            const cache = await caches.open(this.angCacheName);
            const response = await cache.match(`/ang/${angNumber}`);

            if (response) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Get cached Ang error:', error);
            return null;
        }
    }

    /**
     * Update list of cached Angs
     */
    async updateCachedAngsList(angNumber) {
        const cachedAngs = await this.getCachedAngsList();
        if (!cachedAngs.includes(angNumber)) {
            cachedAngs.push(angNumber);
            cachedAngs.sort((a, b) => a - b);
            localStorage.setItem('sehajPaathCachedAngs', JSON.stringify(cachedAngs));
        }
    }

    /**
     * Get list of cached Angs
     */
    async getCachedAngsList() {
        try {
            const stored = localStorage.getItem('sehajPaathCachedAngs');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    /**
     * Cache a range of Angs
     */
    async cacheAngRange(startAng, endAng, onProgress) {
        const results = [];
        const total = endAng - startAng + 1;

        for (let i = startAng; i <= endAng; i++) {
            try {
                // Fetch from API
                const response = await fetch(`https://api.banidb.com/v2/angs/${i}`);
                const data = await response.json();

                // Cache it
                await this.cacheAng(i, data);
                results.push({ ang: i, success: true });

                // Progress callback
                if (onProgress) {
                    onProgress({
                        current: i - startAng + 1,
                        total,
                        percent: ((i - startAng + 1) / total) * 100
                    });
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                results.push({ ang: i, success: false, error });
            }
        }

        return results;
    }

    /**
     * Cache all Angs (1-1430)
     */
    async cacheAllAngs(onProgress) {
        return this.cacheAngRange(1, 1430, onProgress);
    }

    /**
     * Clear Ang cache
     */
    async clearAngCache() {
        if (!this.isAvailable()) return false;

        try {
            await caches.delete(this.angCacheName);
            localStorage.removeItem('sehajPaathCachedAngs');
            return true;
        } catch (error) {
            console.error('Clear Ang cache error:', error);
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    async getCacheStats() {
        const cachedAngs = await this.getCachedAngsList();

        return {
            cachedAngsCount: cachedAngs.length,
            totalAngs: 1430,
            percentCached: ((cachedAngs.length / 1430) * 100).toFixed(1),
            cachedAngs
        };
    }

    /**
     * Check if an Ang is cached
     */
    async isAngCached(angNumber) {
        const cachedAngs = await this.getCachedAngsList();
        return cachedAngs.includes(angNumber);
    }

    /**
     * Preload nearby Angs
     */
    async preloadNearbyAngs(currentAng, range = 3) {
        const start = Math.max(1, currentAng - range);
        const end = Math.min(1430, currentAng + range);

        for (let i = start; i <= end; i++) {
            if (i !== currentAng && !(await this.isAngCached(i))) {
                try {
                    const response = await fetch(`https://api.banidb.com/v2/angs/${i}`);
                    const data = await response.json();
                    await this.cacheAng(i, data);
                } catch (error) {
                    console.warn(`Failed to preload Ang ${i}:`, error);
                }
            }
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheService;
}
