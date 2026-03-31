/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BANI CACHE OPTIMIZER v2.0
 * Aggressive caching + background downloading + image preloading
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ Once a bani is opened, it's cached forever (IndexedDB + Memory)
 * ✅ Background downloading while user reads online content
 * ✅ Smart queue management for Banis and Angs
 * ✅ Preload Guru Saheb images in background
 * ✅ Progressive image loading with blur-up placeholders
 * ✅ Instant skeleton UI while loading
 * ✅ Background prefetch of popular banis
 * ✅ Download progress tracking and notifications
 * 
 * @version 2.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class BaniCacheOptimizer {
    constructor() {
        this.memoryCache = new Map();
        this.imageCache = new Map();
        this.dbName = 'AnhadBaniCache';
        this.dbVersion = 2;
        this.db = null;
        
        // Popular banis to prefetch
        this.popularBanis = [2, 4, 6, 7, 9, 10, 21, 23, 31, 36, 90];
        
        // Guru images to preload
        this.guruImages = [
            '/assets/darbar-sahib-day.webp',
            '/assets/darbar-sahib-day.png',
            '/assets/Darbar-sahib-AMRITVELA.webp',
            '/assets/Darbar-sahib-AMRITVELA.png',
            '/assets/darbar-sahib-evening.webp',
            '/assets/darbar-sahib-evening.jpg',
            '/assets/HUKAMNAMA-SAHIB.webp',
            '/assets/HUKAMNAMA-SAHIB.png'
        ];
        
        // Background download queue
        this.downloadQueue = {
            banis: new Set(),
            angs: new Set(),
            active: false,
            paused: false,
            progress: { total: 0, completed: 0, failed: 0 }
        };
        
        // Download listeners
        this.downloadListeners = new Set();
        
        this.init();
    }

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    async init() {
        try {
            await this.openDB();
            await this.restoreDownloadQueue();
            this.startBackgroundTasks();
            console.log('✅ BaniCacheOptimizer v2.0 initialized');
        } catch (error) {
            console.error('❌ BaniCacheOptimizer init failed:', error);
        }
    }

    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion;

                // Bani content store
                if (!db.objectStoreNames.contains('banis')) {
                    const baniStore = db.createObjectStore('banis', { keyPath: 'id' });
                    baniStore.createIndex('cachedAt', 'cachedAt', { unique: false });
                }

                // Ang (page) content store
                if (!db.objectStoreNames.contains('angs')) {
                    const angStore = db.createObjectStore('angs', { keyPath: 'angNumber' });
                    angStore.createIndex('cachedAt', 'cachedAt', { unique: false });
                    angStore.createIndex('source', 'source', { unique: false });
                }

                // Image cache store
                if (!db.objectStoreNames.contains('images')) {
                    const imageStore = db.createObjectStore('images', { keyPath: 'url' });
                    imageStore.createIndex('cachedAt', 'cachedAt', { unique: false });
                }

                // Metadata store
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }

                // Download queue store (persists across sessions)
                if (!db.objectStoreNames.contains('downloadQueue')) {
                    db.createObjectStore('downloadQueue', { keyPath: 'id' });
                }
            };
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // BANI CACHING
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get bani data - checks memory → IndexedDB → API
     */
    async getBani(baniId) {
        // 1. Check memory cache (instant)
        if (this.memoryCache.has(baniId)) {
            console.log(`[BaniCache] ⚡ Memory hit: ${baniId}`);
            return this.memoryCache.get(baniId);
        }

        // 2. Check IndexedDB (fast)
        const cached = await this.getBaniFromDB(baniId);
        if (cached) {
            console.log(`[BaniCache] 💾 DB hit: ${baniId}`);
            this.memoryCache.set(baniId, cached.data);
            return cached.data;
        }

        // 3. Fetch from API (slow)
        console.log(`[BaniCache] 🌐 API fetch: ${baniId}`);
        const data = await this.fetchBaniFromAPI(baniId);
        
        // Cache it for next time
        await this.cacheBani(baniId, data);
        
        return data;
    }

    async getBaniFromDB(baniId) {
        if (!this.db) return null;

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(['banis'], 'readonly');
                const store = tx.objectStore('banis');
                const request = store.get(baniId);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            } catch (error) {
                resolve(null);
            }
        });
    }

    async fetchBaniFromAPI(baniId) {
        const response = await fetch(`https://api.banidb.com/v2/banis/${baniId}`);
        if (!response.ok) throw new Error(`Failed to fetch bani ${baniId}`);
        return await response.json();
    }

    async cacheBani(baniId, data) {
        // Store in memory
        this.memoryCache.set(baniId, data);

        // Store in IndexedDB
        if (!this.db) return;

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(['banis'], 'readwrite');
                const store = tx.objectStore('banis');
                
                store.put({
                    id: baniId,
                    data: data,
                    cachedAt: Date.now()
                });

                tx.oncomplete = () => {
                    console.log(`[BaniCache] ✅ Cached: ${baniId}`);
                    resolve();
                };
                tx.onerror = () => resolve();
            } catch (error) {
                resolve();
            }
        });
    }

    /**
     * Check if bani is cached
     */
    async isBaniCached(baniId) {
        if (this.memoryCache.has(baniId)) return true;
        const cached = await this.getBaniFromDB(baniId);
        return !!cached;
    }

    // ═══════════════════════════════════════════════════════════════
    // IMAGE PRELOADING
    // ═══════════════════════════════════════════════════════════════

    /**
     * Preload an image and cache it
     */
    async preloadImage(url) {
        // Check if already cached
        if (this.imageCache.has(url)) {
            return this.imageCache.get(url);
        }

        // Check IndexedDB
        const cached = await this.getImageFromDB(url);
        if (cached) {
            this.imageCache.set(url, cached.blob);
            return cached.blob;
        }

        // Fetch and cache
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load ${url}`);
            
            const blob = await response.blob();
            
            // Cache in memory
            this.imageCache.set(url, blob);
            
            // Cache in IndexedDB
            await this.cacheImage(url, blob);
            
            console.log(`[BaniCache] 🖼️ Image cached: ${url}`);
            return blob;
        } catch (error) {
            console.warn(`[BaniCache] Image load failed: ${url}`, error);
            return null;
        }
    }

    async getImageFromDB(url) {
        if (!this.db) return null;

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(['images'], 'readonly');
                const store = tx.objectStore('images');
                const request = store.get(url);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            } catch (error) {
                resolve(null);
            }
        });
    }

    async cacheImage(url, blob) {
        if (!this.db) return;

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(['images'], 'readwrite');
                const store = tx.objectStore('images');
                
                store.put({
                    url: url,
                    blob: blob,
                    cachedAt: Date.now()
                });

                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch (error) {
                resolve();
            }
        });
    }

    /**
     * Get cached image as object URL
     */
    async getCachedImageURL(url) {
        const blob = this.imageCache.get(url) || await this.getImageFromDB(url)?.blob;
        if (blob) {
            return URL.createObjectURL(blob);
        }
        return null;
    }

    // ═══════════════════════════════════════════════════════════════
    // ANG (PAGE) CACHING - For Sehaj Paath
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get Ang data - checks memory → IndexedDB → API
     */
    async getAng(angNumber) {
        // 1. Check memory cache (instant)
        const cacheKey = `ang_${angNumber}`;
        if (this.memoryCache.has(cacheKey)) {
            console.log(`[BaniCache] ⚡ Memory hit: Ang ${angNumber}`);
            return this.memoryCache.get(cacheKey);
        }

        // 2. Check IndexedDB (fast)
        const cached = await this.getAngFromDB(angNumber);
        if (cached) {
            console.log(`[BaniCache] 💾 DB hit: Ang ${angNumber}`);
            this.memoryCache.set(cacheKey, cached.data);
            return cached.data;
        }

        // 3. Fetch from API (slow)
        console.log(`[BaniCache] 🌐 API fetch: Ang ${angNumber}`);
        const data = await this.fetchAngFromAPI(angNumber);
        
        // Cache it for next time
        await this.cacheAng(angNumber, data);
        
        return data;
    }

    async getAngFromDB(angNumber) {
        if (!this.db) return null;

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(['angs'], 'readonly');
                const store = tx.objectStore('angs');
                const request = store.get(angNumber);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            } catch (error) {
                resolve(null);
            }
        });
    }

    async fetchAngFromAPI(angNumber) {
        const response = await fetch(`https://api.banidb.com/v2/angs/${angNumber}`);
        if (!response.ok) throw new Error(`Failed to fetch Ang ${angNumber}`);
        return await response.json();
    }

    async cacheAng(angNumber, data) {
        // Store in memory
        const cacheKey = `ang_${angNumber}`;
        this.memoryCache.set(cacheKey, data);

        // Store in IndexedDB
        if (!this.db) return;

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(['angs'], 'readwrite');
                const store = tx.objectStore('angs');
                
                store.put({
                    angNumber: angNumber,
                    data: data,
                    cachedAt: Date.now(),
                    source: 'api'
                });

                tx.oncomplete = () => {
                    console.log(`[BaniCache] ✅ Cached: Ang ${angNumber}`);
                    resolve();
                };
                tx.onerror = () => resolve();
            } catch (error) {
                resolve();
            }
        });
    }

    /**
     * Check if Ang is cached
     */
    async isAngCached(angNumber) {
        const cacheKey = `ang_${angNumber}`;
        if (this.memoryCache.has(cacheKey)) return true;
        const cached = await this.getAngFromDB(angNumber);
        return !!cached;
    }

    // ═══════════════════════════════════════════════════════════════
    // BACKGROUND DOWNLOAD QUEUE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    /**
     * Add Banis to background download queue
     */
    async queueBanisForDownload(baniIds) {
        if (!Array.isArray(baniIds)) baniIds = [baniIds];
        
        for (const id of baniIds) {
            this.downloadQueue.banis.add(id);
        }
        
        await this.saveDownloadQueue();
        this.notifyDownloadListeners('queue_updated');
        
        if (!this.downloadQueue.active && !this.downloadQueue.paused) {
            this.startBackgroundDownload();
        }
    }

    /**
     * Add Angs to background download queue
     */
    async queueAngsForDownload(angNumbers) {
        if (!Array.isArray(angNumbers)) angNumbers = [angNumbers];
        
        for (const ang of angNumbers) {
            if (ang >= 1 && ang <= 1430) {
                this.downloadQueue.angs.add(ang);
            }
        }
        
        await this.saveDownloadQueue();
        this.notifyDownloadListeners('queue_updated');
        
        if (!this.downloadQueue.active && !this.downloadQueue.paused) {
            this.startBackgroundDownload();
        }
    }

    /**
     * Queue all Angs for complete offline access
     */
    async queueAllAngs() {
        const allAngs = Array.from({ length: 1430 }, (_, i) => i + 1);
        await this.queueAngsForDownload(allAngs);
    }

    /**
     * Start background download process
     */
    async startBackgroundDownload() {
        if (this.downloadQueue.active) {
            console.log('[BaniCache] Download already active');
            return;
        }

        this.downloadQueue.active = true;
        this.downloadQueue.paused = false;
        this.downloadQueue.progress.total = this.downloadQueue.banis.size + this.downloadQueue.angs.size;
        this.downloadQueue.progress.completed = 0;
        this.downloadQueue.progress.failed = 0;

        console.log(`[BaniCache] 🚀 Starting background download: ${this.downloadQueue.progress.total} items`);
        this.notifyDownloadListeners('download_started');

        // Download Banis first
        for (const baniId of this.downloadQueue.banis) {
            if (this.downloadQueue.paused) break;

            try {
                const isCached = await this.isBaniCached(baniId);
                if (!isCached) {
                    await this.getBani(baniId);
                    console.log(`[BaniCache] ✓ Downloaded Bani ${baniId}`);
                }
                this.downloadQueue.banis.delete(baniId);
                this.downloadQueue.progress.completed++;
                this.notifyDownloadListeners('progress', this.getDownloadProgress());
                await this.saveDownloadQueue();
                await this.delay(300); // Rate limiting
            } catch (error) {
                console.warn(`[BaniCache] Failed to download Bani ${baniId}:`, error);
                this.downloadQueue.progress.failed++;
                this.notifyDownloadListeners('item_failed', { type: 'bani', id: baniId, error });
            }
        }

        // Download Angs
        for (const angNumber of this.downloadQueue.angs) {
            if (this.downloadQueue.paused) break;

            try {
                const isCached = await this.isAngCached(angNumber);
                if (!isCached) {
                    await this.getAng(angNumber);
                    console.log(`[BaniCache] ✓ Downloaded Ang ${angNumber}`);
                }
                this.downloadQueue.angs.delete(angNumber);
                this.downloadQueue.progress.completed++;
                this.notifyDownloadListeners('progress', this.getDownloadProgress());
                await this.saveDownloadQueue();
                await this.delay(300); // Rate limiting
            } catch (error) {
                console.warn(`[BaniCache] Failed to download Ang ${angNumber}:`, error);
                this.downloadQueue.progress.failed++;
                this.notifyDownloadListeners('item_failed', { type: 'ang', id: angNumber, error });
            }
        }

        this.downloadQueue.active = false;
        
        if (this.downloadQueue.banis.size === 0 && this.downloadQueue.angs.size === 0) {
            console.log('[BaniCache] ✅ Background download complete');
            this.notifyDownloadListeners('download_completed', this.getDownloadProgress());
        } else {
            console.log('[BaniCache] ⏸️ Background download paused');
            this.notifyDownloadListeners('download_paused');
        }
    }

    /**
     * Pause background download
     */
    pauseBackgroundDownload() {
        this.downloadQueue.paused = true;
        console.log('[BaniCache] ⏸️ Download paused');
        this.notifyDownloadListeners('download_paused');
    }

    /**
     * Resume background download
     */
    resumeBackgroundDownload() {
        if (this.downloadQueue.paused) {
            this.downloadQueue.paused = false;
            console.log('[BaniCache] ▶️ Download resumed');
            this.startBackgroundDownload();
        }
    }

    /**
     * Cancel background download
     */
    async cancelBackgroundDownload() {
        this.downloadQueue.paused = true;
        this.downloadQueue.active = false;
        this.downloadQueue.banis.clear();
        this.downloadQueue.angs.clear();
        await this.saveDownloadQueue();
        console.log('[BaniCache] ❌ Download cancelled');
        this.notifyDownloadListeners('download_cancelled');
    }

    /**
     * Get download progress
     */
    getDownloadProgress() {
        const { total, completed, failed } = this.downloadQueue.progress;
        const remaining = this.downloadQueue.banis.size + this.downloadQueue.angs.size;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return {
            total,
            completed,
            failed,
            remaining,
            percentage,
            active: this.downloadQueue.active,
            paused: this.downloadQueue.paused
        };
    }

    /**
     * Save download queue to IndexedDB (persists across sessions)
     */
    async saveDownloadQueue() {
        if (!this.db) return;

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(['downloadQueue'], 'readwrite');
                const store = tx.objectStore('downloadQueue');
                
                store.put({
                    id: 'current',
                    banis: Array.from(this.downloadQueue.banis),
                    angs: Array.from(this.downloadQueue.angs),
                    progress: this.downloadQueue.progress,
                    savedAt: Date.now()
                });

                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch (error) {
                resolve();
            }
        });
    }

    /**
     * Restore download queue from IndexedDB
     */
    async restoreDownloadQueue() {
        if (!this.db) return;

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(['downloadQueue'], 'readonly');
                const store = tx.objectStore('downloadQueue');
                const request = store.get('current');

                request.onsuccess = () => {
                    const saved = request.result;
                    if (saved) {
                        this.downloadQueue.banis = new Set(saved.banis || []);
                        this.downloadQueue.angs = new Set(saved.angs || []);
                        this.downloadQueue.progress = saved.progress || { total: 0, completed: 0, failed: 0 };
                        
                        if (this.downloadQueue.banis.size > 0 || this.downloadQueue.angs.size > 0) {
                            console.log(`[BaniCache] 📥 Restored download queue: ${this.downloadQueue.banis.size} banis, ${this.downloadQueue.angs.size} angs`);
                        }
                    }
                    resolve();
                };
                request.onerror = () => resolve();
            } catch (error) {
                resolve();
            }
        });
    }

    /**
     * Add download listener
     */
    onDownloadProgress(callback) {
        this.downloadListeners.add(callback);
        return () => this.downloadListeners.delete(callback);
    }

    /**
     * Notify download listeners
     */
    notifyDownloadListeners(event, data = null) {
        this.downloadListeners.forEach(callback => {
            try {
                callback({ event, data, timestamp: Date.now() });
            } catch (error) {
                console.error('[BaniCache] Listener error:', error);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // BACKGROUND TASKS
    // ═══════════════════════════════════════════════════════════════

    startBackgroundTasks() {
        // Wait 3 seconds after page load, then start prefetching
        setTimeout(() => {
            this.prefetchPopularBanis();
            this.preloadGuruImages();
            
            // Resume any pending downloads
            if (this.downloadQueue.banis.size > 0 || this.downloadQueue.angs.size > 0) {
                console.log('[BaniCache] Resuming pending downloads...');
                this.startBackgroundDownload();
            }
        }, 3000);
    }

    /**
     * Prefetch popular banis in background
     */
    async prefetchPopularBanis() {
        console.log('[BaniCache] 🚀 Starting background prefetch...');

        for (const baniId of this.popularBanis) {
            // Check if already cached
            const isCached = await this.isBaniCached(baniId);
            if (isCached) {
                console.log(`[BaniCache] ✓ Already cached: ${baniId}`);
                continue;
            }

            try {
                // Fetch and cache
                await this.getBani(baniId);
                console.log(`[BaniCache] ✓ Prefetched: ${baniId}`);
                
                // Small delay to avoid overwhelming the API
                await this.delay(500);
            } catch (error) {
                console.warn(`[BaniCache] Prefetch failed: ${baniId}`, error);
            }
        }

        console.log('[BaniCache] ✅ Background prefetch complete');
    }

    /**
     * Preload Guru Saheb images in background
     */
    async preloadGuruImages() {
        console.log('[BaniCache] 🖼️ Preloading Guru images...');

        for (const url of this.guruImages) {
            try {
                await this.preloadImage(url);
                await this.delay(200);
            } catch (error) {
                console.warn(`[BaniCache] Image preload failed: ${url}`);
            }
        }

        console.log('[BaniCache] ✅ Guru images preloaded');
    }

    // ═══════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear all caches (for debugging)
     */
    async clearAllCaches() {
        this.memoryCache.clear();
        this.imageCache.clear();

        if (!this.db) return;

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(['banis', 'images'], 'readwrite');
                tx.objectStore('banis').clear();
                tx.objectStore('images').clear();
                tx.oncomplete = () => {
                    console.log('[BaniCache] 🗑️ All caches cleared');
                    resolve();
                };
                tx.onerror = () => resolve();
            } catch (error) {
                resolve();
            }
        });
    }

    /**
     * Get cache statistics
     */
    async getCacheStats() {
        const stats = {
            memoryBanis: 0,
            memoryAngs: 0,
            memoryImages: this.imageCache.size,
            dbBanis: 0,
            dbAngs: 0,
            dbImages: 0,
            downloadQueue: {
                banis: this.downloadQueue.banis.size,
                angs: this.downloadQueue.angs.size,
                active: this.downloadQueue.active,
                paused: this.downloadQueue.paused,
                progress: this.downloadQueue.progress
            }
        };

        // Count memory cache items
        for (const key of this.memoryCache.keys()) {
            if (key.startsWith('ang_')) {
                stats.memoryAngs++;
            } else {
                stats.memoryBanis++;
            }
        }

        if (!this.db) return stats;

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(['banis', 'angs', 'images'], 'readonly');
                
                const baniRequest = tx.objectStore('banis').count();
                baniRequest.onsuccess = () => {
                    stats.dbBanis = baniRequest.result;
                };

                const angRequest = tx.objectStore('angs').count();
                angRequest.onsuccess = () => {
                    stats.dbAngs = angRequest.result;
                };

                const imageRequest = tx.objectStore('images').count();
                imageRequest.onsuccess = () => {
                    stats.dbImages = imageRequest.result;
                };

                tx.oncomplete = () => resolve(stats);
                tx.onerror = () => resolve(stats);
            } catch (error) {
                resolve(stats);
            }
        });
    }

    /**
     * Get storage size estimate
     */
    async getStorageEstimate() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                usageInMB: (estimate.usage / (1024 * 1024)).toFixed(2),
                quotaInMB: (estimate.quota / (1024 * 1024)).toFixed(2),
                percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
            };
        }
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL INSTANCE
// ═══════════════════════════════════════════════════════════════

window.baniCacheOptimizer = new BaniCacheOptimizer();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaniCacheOptimizer;
}
