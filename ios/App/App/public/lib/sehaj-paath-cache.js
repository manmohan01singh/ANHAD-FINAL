/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SEHAJ PAATH CACHE — Smart Progressive Caching with LRU
 * Stores Angs in IndexedDB for instant offline access
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const DB_NAME = 'AnhadSehajPaathDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'ang_cache';
    const MAX_CACHE_SIZE = 200;
    const HISTORY_KEY = 'anhad_ang_history';

    class SehajPaathCache {
        constructor() {
            this.db = null;
            this.isReady = false;
            this.readyPromise = null;
        }

        /**
         * Initialize the IndexedDB database
         */
        async init() {
            if (this.isReady) return true;
            if (this.readyPromise) return this.readyPromise;

            this.readyPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = () => {
                    console.error('[SehajPaathCache] Failed to open database');
                    reject(request.error);
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    this.isReady = true;
                    console.log('[SehajPaathCache] Database initialized');
                    resolve(true);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        const store = db.createObjectStore(STORE_NAME, { keyPath: 'ang' });
                        store.createIndex('fetched_at', 'fetched_at', { unique: false });
                        store.createIndex('last_accessed', 'last_accessed', { unique: false });
                        console.log('[SehajPaathCache] Created ang_cache store');
                    }
                };
            });

            return this.readyPromise;
        }

        /**
         * Get cached Ang data
         */
        async getAng(angNumber) {
            await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(angNumber);

                request.onsuccess = () => {
                    const result = request.result;
                    if (result) {
                        // Update last accessed time
                        this.updateLastAccessed(angNumber);
                    }
                    resolve(result);
                };
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Update last accessed timestamp
         */
        async updateLastAccessed(angNumber) {
            try {
                const transaction = this.db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(angNumber);

                request.onsuccess = () => {
                    const data = request.result;
                    if (data) {
                        data.last_accessed = Date.now();
                        store.put(data);
                    }
                };
            } catch (e) {
                console.warn('[SehajPaathCache] Failed to update last_accessed:', e);
            }
        }

        /**
         * Save Ang to cache
         */
        async saveAng(angNumber, data) {
            await this.init();

            // Check if we need to evict (LRU)
            await this.ensureSpace();

            const cacheEntry = {
                ang: angNumber,
                verses: data.verses || data.lines || [],
                raag: data.raag || '',
                source: data.source || 'G',
                fetched_at: Date.now(),
                last_accessed: Date.now()
            };

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(cacheEntry);

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Ensure we have space by evicting oldest entries (LRU)
         * Protected: Last 30 visited Angs
         */
        async ensureSpace() {
            const count = await this.getCount();

            if (count < MAX_CACHE_SIZE) return;

            // Get protected Angs (last 30 visited)
            const protectedAngs = this.getProtectedAngs();

            // Get all entries sorted by last_accessed (oldest first)
            const entries = await this.getAllEntries();
            const evictable = entries.filter(e => !protectedAngs.includes(e.ang));

            // Evict oldest entries until we're under limit
            const toEvict = evictable.slice(0, entries.length - MAX_CACHE_SIZE + 10);

            for (const entry of toEvict) {
                await this.deleteAng(entry.ang);
            }

            console.log(`[SehajPaathCache] Evicted ${toEvict.length} old entries`);
        }

        /**
         * Get protected Angs (last 30 visited from history)
         */
        getProtectedAngs() {
            try {
                const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
                return history.slice(-30);
            } catch (e) {
                return [];
            }
        }

        /**
         * Add Ang to visit history
         */
        addToHistory(angNumber) {
            try {
                let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

                // Remove if already exists
                history = history.filter(a => a !== angNumber);

                // Add to end
                history.push(angNumber);

                // Keep only last 30
                if (history.length > 30) {
                    history = history.slice(-30);
                }

                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            } catch (e) {
                console.warn('[SehajPaathCache] Failed to update history:', e);
            }
        }

        /**
         * Get total count of cached entries
         */
        async getCount() {
            await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.count();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Get all entries sorted by last_accessed
         */
        async getAllEntries() {
            await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const index = store.index('last_accessed');
                const request = index.openCursor();

                const entries = [];

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        entries.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(entries);
                    }
                };

                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Delete a specific Ang from cache
         */
        async deleteAng(angNumber) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(angNumber);

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Prefetch Angs in background
         */
        async prefetchAngs(angNumbers) {
            if (!navigator.onLine) {
                console.log('[SehajPaathCache] Offline, skipping prefetch');
                return;
            }

            // Use requestIdleCallback if available, otherwise setTimeout
            const schedule = window.requestIdleCallback || ((fn) => setTimeout(fn, 100));

            schedule(async () => {
                for (const ang of angNumbers) {
                    if (ang < 1 || ang > 1430) continue;

                    try {
                        // Check if already cached
                        const cached = await this.getAng(ang);
                        if (cached) continue;

                        // Fetch and cache
                        if (window.BaniDBAPI) {
                            const api = new window.BaniDBAPI();
                            const data = await api.getAng(ang);
                            await this.saveAng(ang, data);
                            console.log(`[SehajPaathCache] Prefetched Ang ${ang}`);
                        }
                    } catch (e) {
                        console.warn(`[SehajPaathCache] Failed to prefetch Ang ${ang}:`, e);
                    }
                }
            });
        }

        /**
         * Clear all cached Angs
         */
        async clearAll() {
            await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.clear();

                request.onsuccess = () => {
                    localStorage.removeItem(HISTORY_KEY);
                    console.log('[SehajPaathCache] All cached Angs cleared');
                    resolve(true);
                };
                request.onerror = () => reject(request.error);
            });
        }
    }

    // Create singleton
    const sehajPaathCache = new SehajPaathCache();

    // Export to window
    window.SehajPaathCache = SehajPaathCache;
    window.sehajPaathCache = sehajPaathCache;

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => sehajPaathCache.init());
    } else {
        sehajPaathCache.init();
    }

    console.log('[SehajPaathCache] Module loaded');
})();
