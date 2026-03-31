/**
 * Offline Manager Component
 * Handles caching of Angs for offline reading
 */

class OfflineManager {
    constructor() {
        this.cachedAngs = this.loadCachedAngs();
    }

    loadCachedAngs() {
        try {
            return JSON.parse(localStorage.getItem('sehajPaathCachedAngs') || '[]');
        } catch {
            return [];
        }
    }

    saveCachedAngs() {
        localStorage.setItem('sehajPaathCachedAngs', JSON.stringify(this.cachedAngs));
    }

    async cacheAng(angNumber, data) {
        try {
            const key = `sehajPaathAng_${angNumber}`;
            localStorage.setItem(key, JSON.stringify(data));

            if (!this.cachedAngs.includes(angNumber)) {
                this.cachedAngs.push(angNumber);
                this.saveCachedAngs();
            }

            return true;
        } catch (e) {
            console.error('Error caching Ang:', e);
            return false;
        }
    }

    getCachedAng(angNumber) {
        try {
            const key = `sehajPaathAng_${angNumber}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    // Alias for BaniDBAPI compatibility
    getAng(angNumber) {
        return this.getCachedAng(angNumber);
    }

    isCached(angNumber) {
        return this.cachedAngs.includes(angNumber);
    }

    getCacheCount() {
        return this.cachedAngs.length;
    }

    getCachePercent() {
        return ((this.cachedAngs.length / 1430) * 100).toFixed(1);
    }

    // Alias for BaniDBAPI compatibility
    saveAng(angNumber, data) {
        return this.cacheAng(angNumber, data);
    }

    // Stub for BaniDBAPI compatibility
    addToHistory(angNumber) {
        // Optional: track reading history
        try {
            const history = JSON.parse(localStorage.getItem('sehajPaathHistory') || '[]');
            if (!history.includes(angNumber)) {
                history.push(angNumber);
                if (history.length > 100) history.shift();
                localStorage.setItem('sehajPaathHistory', JSON.stringify(history));
            }
        } catch (e) {
            console.warn('History tracking error:', e);
        }
    }

    // Stub for BaniDBAPI compatibility
    prefetchAngs(angNumbers) {
        // Background prefetching is handled by BaniDBAPI itself
        console.log('[OfflineManager] Prefetch requested for:', angNumbers);
    }

    clearCache() {
        this.cachedAngs.forEach(ang => {
            localStorage.removeItem(`sehajPaathAng_${ang}`);
        });
        this.cachedAngs = [];
        this.saveCachedAngs();
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfflineManager;
}
