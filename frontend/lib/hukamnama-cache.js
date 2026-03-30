/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HUKAMNAMA CACHE — Daily Offline Caching with Fallback
 * Stores each day's Hukamnama in IndexedDB with yesterday fallback
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const DB_NAME = 'AnhadHukamnamaDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'hukamnama_cache';

    class HukamnamaCache {
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
                    console.error('[HukamnamaCache] Failed to open database');
                    reject(request.error);
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    this.isReady = true;
                    console.log('[HukamnamaCache] Database initialized');
                    resolve(true);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        const store = db.createObjectStore(STORE_NAME, { keyPath: 'date' });
                        store.createIndex('cached_at', 'cached_at', { unique: false });
                        console.log('[HukamnamaCache] Created hukamnama_cache store');
                    }
                };
            });

            return this.readyPromise;
        }

        /**
         * Get cache key for today
         */
        getTodayKey() {
            return new Date().toLocaleDateString('en-CA');
        }

        /**
         * Get yesterday's key
         */
        getYesterdayKey() {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday.toLocaleDateString('en-CA');
        }

        /**
         * Get cached Hukamnama by date
         */
        async getByDate(dateKey) {
            await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(dateKey);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Get today's Hukamnama (with fallback to yesterday)
         */
        async getToday() {
            const todayKey = this.getTodayKey();
            
            // Try today's cache first
            let cached = await this.getByDate(todayKey);
            if (cached && cached.data) {
                return {
                    date: todayKey,
                    isToday: true,
                    data: cached.data,
                    cached: true
                };
            }

            // If offline, try yesterday's
            if (!navigator.onLine) {
                const yesterdayKey = this.getYesterdayKey();
                cached = await this.getByDate(yesterdayKey);
                if (cached && cached.data) {
                    return {
                        date: yesterdayKey,
                        isToday: false,
                        data: cached.data,
                        cached: true,
                        offlineFallback: true
                    };
                }
            }

            return null; // Need to fetch
        }

        /**
         * Save Hukamnama to cache
         */
        async save(dateKey, data) {
            await this.init();

            const cacheEntry = {
                date: dateKey,
                data: data,
                cached_at: Date.now()
            };

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(cacheEntry);

                request.onsuccess = () => {
                    console.log('[HukamnamaCache] Saved:', dateKey);
                    resolve(true);
                };
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Clean up old entries (keep only today and yesterday)
         */
        async cleanup() {
            await this.init();

            const todayKey = this.getTodayKey();
            const yesterdayKey = this.getYesterdayKey();

            const allEntries = await this.getAllEntries();
            const toDelete = allEntries.filter(e => 
                e.date !== todayKey && e.date !== yesterdayKey
            );

            for (const entry of toDelete) {
                await this.delete(entry.date);
            }

            if (toDelete.length > 0) {
                console.log(`[HukamnamaCache] Cleaned up ${toDelete.length} old entries`);
            }
        }

        /**
         * Get all cached entries
         */
        async getAllEntries() {
            await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.openCursor();

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
         * Delete a specific date entry
         */
        async delete(dateKey) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(dateKey);

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Clear all cached Hukamnamas
         */
        async clearAll() {
            await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.clear();

                request.onsuccess = () => {
                    console.log('[HukamnamaCache] All entries cleared');
                    resolve(true);
                };
                request.onerror = () => reject(request.error);
            });
        }
    }

    // Create singleton
    const hukamnamaCache = new HukamnamaCache();

    // Export to window
    window.HukamnamaCache = HukamnamaCache;
    window.hukamnamaCache = hukamnamaCache;

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => hukamnamaCache.init());
    } else {
        hukamnamaCache.init();
    }

    console.log('[HukamnamaCache] Module loaded');
})();
