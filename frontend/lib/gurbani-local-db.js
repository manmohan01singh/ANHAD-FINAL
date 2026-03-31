/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GURBANI LOCAL DB — Offline-First Nitnem Engine
 * Stores all 7 Nitnem Banis in IndexedDB for instant offline access
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const DB_NAME = 'AnhadGurbaniDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'banis';

    // The 7 Nitnem Banis to cache
    const NITNEM_BANIS = [
        { id: 2, name: 'Japji Sahib' },
        { id: 4, name: 'Jaap Sahib' },
        { id: 6, name: 'Tav Prasad Savaiye' },
        { id: 7, name: 'Tav Prasad Savaiye 2' },
        { id: 9, name: 'Chaupai Sahib' },
        { id: 10, name: 'Anand Sahib' },
        { id: 21, name: 'Rehras Sahib' },
        { id: 23, name: 'Sohila Sahib' }
    ];

    const LS_KEY_DOWNLOADED = 'anhad_gurbani_downloaded';
    const LS_KEY_DOWNLOAD_PROGRESS = 'anhad_gurbani_download_progress';

    class GurbaniLocalDB {
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
                    console.error('[GurbaniLocalDB] Failed to open database');
                    reject(request.error);
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    this.isReady = true;
                    console.log('[GurbaniLocalDB] Database initialized');
                    resolve(true);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                        store.createIndex('fetched_at', 'fetched_at', { unique: false });
                        console.log('[GurbaniLocalDB] Created banis store');
                    }
                };
            });

            return this.readyPromise;
        }

        /**
         * Check if all banis are downloaded
         */
        isDownloaded() {
            return localStorage.getItem(LS_KEY_DOWNLOADED) === 'true';
        }

        /**
         * Get download progress
         */
        getDownloadProgress() {
            const progress = localStorage.getItem(LS_KEY_DOWNLOAD_PROGRESS);
            return progress ? JSON.parse(progress) : { current: 0, total: NITNEM_BANIS.length };
        }

        /**
         * Save bani to IndexedDB
         */
        async saveBani(baniId, name, verses) {
            await this.init();

            const data = {
                id: baniId,
                name: name,
                verses: verses,
                fetched_at: Date.now()
            };

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(data);

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Get bani from IndexedDB
         */
        async getBani(baniId) {
            await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(baniId);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Fetch bani from BaniDB API
         * Uses correct endpoint: /v2/banis/{id}
         */
        async fetchFromAPI(baniId) {
            // Primary endpoint (correct BaniDB v2 API)
            const url = `https://api.banidb.com/v2/banis/${baniId}`;

            try {
                const response = await fetch(url, {
                    headers: { 'Accept': 'application/json' },
                    // Add timeout to prevent hanging
                    signal: AbortSignal.timeout(10000)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                return data;
            } catch (error) {
                console.error(`[GurbaniLocalDB] API fetch failed for bani ${baniId}:`, error);
                throw error;
            }
        }

        /**
         * Download all Nitnem banis with progress callback
         * Resilient: continues even if individual banis fail
         */
        async downloadAllBanis(onProgress) {
            console.log('[GurbaniLocalDB] Starting download of all banis');

            let downloaded = 0;
            let failed = 0;
            const failedBanis = [];
            const total = NITNEM_BANIS.length;

            for (const bani of NITNEM_BANIS) {
                try {
                    // Check if already cached to skip
                    const cached = await this.getBani(bani.id);
                    if (cached && cached.verses && cached.verses.length > 0) {
                        console.log(`[GurbaniLocalDB] ✓ ${bani.name} already cached, skipping`);
                        downloaded++;
                        if (onProgress) {
                            onProgress(downloaded, total, bani.name);
                        }
                        continue;
                    }

                    console.log(`[GurbaniLocalDB] Downloading ${bani.name} (ID: ${bani.id})`);
                    const data = await this.fetchFromAPI(bani.id);

                    // Extract verses from API response
                    const verses = this.extractVerses(data);

                    // Validate we got actual content
                    if (!verses || verses.length === 0) {
                        throw new Error('No verses extracted from API response');
                    }

                    // Save to IndexedDB
                    await this.saveBani(bani.id, bani.name, verses);

                    downloaded++;

                    // Save progress
                    localStorage.setItem(LS_KEY_DOWNLOAD_PROGRESS, JSON.stringify({
                        current: downloaded,
                        total: total,
                        currentBani: bani.name,
                        failed: failed,
                        failedBanis: failedBanis
                    }));

                    // Notify progress
                    if (onProgress) {
                        onProgress(downloaded, total, bani.name);
                    }

                    console.log(`[GurbaniLocalDB] ✓ Downloaded ${bani.name} (${downloaded}/${total})`);
                } catch (error) {
                    console.error(`[GurbaniLocalDB] ✗ Failed to download ${bani.name}:`, error);
                    failed++;
                    failedBanis.push({ id: bani.id, name: bani.name, error: error.message });
                    // Continue with next bani instead of throwing
                    // Notify progress with failure info
                    if (onProgress) {
                        onProgress(downloaded, total, `${bani.name} (failed)`);
                    }
                }
            }

            // Mark as downloaded if we got at least 50% of banis (4 out of 8)
            // This allows partial offline functionality
            const successRate = downloaded / total;
            if (successRate >= 0.5) {
                localStorage.setItem(LS_KEY_DOWNLOADED, 'true');
                localStorage.setItem(LS_KEY_DOWNLOAD_PROGRESS, JSON.stringify({
                    current: downloaded,
                    total: total,
                    failed: failed,
                    failedBanis: failedBanis,
                    completedAt: Date.now(),
                    partial: failed > 0
                }));
                console.log(`[GurbaniLocalDB] ✓ Downloaded ${downloaded}/${total} banis (${failed} failed)`);
                if (failed > 0) {
                    console.log('[GurbaniLocalDB] Some banis failed but enough succeeded - marked as downloaded');
                }
                return { success: true, downloaded, failed, failedBanis };
            } else {
                // Less than 50% success - don't mark as downloaded
                localStorage.setItem(LS_KEY_DOWNLOAD_PROGRESS, JSON.stringify({
                    current: downloaded,
                    total: total,
                    failed: failed,
                    failedBanis: failedBanis,
                    error: 'Too many failures - will retry'
                }));
                throw new Error(`Download failed: only ${downloaded}/${total} banis downloaded`);
            }
        }

        /**
         * Extract verses from BaniDB API response
         */
        extractVerses(data) {
            if (!data || !Array.isArray(data.verses)) {
                return [];
            }

            return data.verses.map(v => {
                const verse = v.verse || {};
                const translation = v.translation || {};
                const transliteration = v.transliteration || {};

                return {
                    id: v.verseId,
                    gurmukhi: verse.unicode || verse.gurmukhi || '',
                    larivaar: v.larivaar?.unicode || '',
                    translation: {
                        en: translation.en?.bdb || translation.en?.ms || '',
                        pu: translation.pu?.ss?.unicode || translation.pu?.bdb?.unicode || ''
                    },
                    transliteration: {
                        en: transliteration.en || ''
                    },
                    pageNo: v.pageNo,
                    lineNo: v.lineNo
                };
            });
        }

        /**
         * Check and refresh stale banis (older than 7 days)
         */
        async refreshStaleBanis() {
            if (!navigator.onLine) {
                console.log('[GurbaniLocalDB] Offline, skipping refresh');
                return;
            }

            const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
            const now = Date.now();

            for (const bani of NITNEM_BANIS) {
                try {
                    const cached = await this.getBani(bani.id);

                    if (cached && cached.fetched_at && (now - cached.fetched_at) > ONE_WEEK) {
                        console.log(`[GurbaniLocalDB] Refreshing stale bani: ${bani.name}`);
                        const data = await this.fetchFromAPI(bani.id);
                        const verses = this.extractVerses(data);
                        await this.saveBani(bani.id, bani.name, verses);
                        console.log(`[GurbaniLocalDB] ✓ Refreshed ${bani.name}`);
                    }
                } catch (error) {
                    console.warn(`[GurbaniLocalDB] Failed to refresh ${bani.name}:`, error);
                }
            }
        }

        /**
         * Get all cached bani IDs
         */
        async getAllCachedBaniIds() {
            await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAllKeys();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * Clear all cached banis
         */
        async clearAll() {
            await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.clear();

                request.onsuccess = () => {
                    localStorage.removeItem(LS_KEY_DOWNLOADED);
                    localStorage.removeItem(LS_KEY_DOWNLOAD_PROGRESS);
                    console.log('[GurbaniLocalDB] All banis cleared');
                    resolve(true);
                };
                request.onerror = () => reject(request.error);
            });
        }
    }

    // Create singleton instance
    const gurbaniLocalDB = new GurbaniLocalDB();

    // Export to window
    window.GurbaniLocalDB = GurbaniLocalDB;
    window.gurbaniLocalDB = gurbaniLocalDB;

    // Auto-initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => gurbaniLocalDB.init());
    } else {
        gurbaniLocalDB.init();
    }

    console.log('[GurbaniLocalDB] Module loaded');
})();
