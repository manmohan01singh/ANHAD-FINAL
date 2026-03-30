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

    isCached(angNumber) {
        return this.cachedAngs.includes(angNumber);
    }

    getCacheCount() {
        return this.cachedAngs.length;
    }

    getCachePercent() {
        return ((this.cachedAngs.length / 1430) * 100).toFixed(1);
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
