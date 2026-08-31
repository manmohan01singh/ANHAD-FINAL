/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GURBANI LOCAL DB — Offline-First Nitnem Engine
 * Stores all 7 Nitnem Banis in IndexedDB for instant offline access
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const DB_NAME = 'AnhadGurbaniDB';
    const DB_VERSION = 4; // Bumped to 4 - force migration for all clients with corrupt v3
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
         * Nuclear reset: delete the entire DB and resolve with false so the
         * caller can re-open from scratch. Called when we detect a corrupt DB
         * (opened successfully but banis store is missing).
         */
        _nukeAndReset(resolve, reject) {
            console.warn('[GurbaniLocalDB] ☢️ Corrupt DB detected — nuking and re-opening...');
            try {
                localStorage.removeItem(LS_KEY_DOWNLOADED);
                localStorage.removeItem(LS_KEY_DOWNLOAD_PROGRESS);
            } catch (e) { }

            const deleteReq = indexedDB.deleteDatabase(DB_NAME);
            deleteReq.onsuccess = () => {
                console.log('[GurbaniLocalDB] ☢️ DB deleted. Re-opening fresh...');
                this.db = null;
                this.isReady = false;
                this.readyPromise = null;
                // Re-open fresh — this time onupgradeneeded WILL fire
                this.init().then(resolve).catch(reject);
            };
            deleteReq.onerror = () => {
                console.error('[GurbaniLocalDB] ☢️ Could not delete DB:', deleteReq.error);
                reject(deleteReq.error);
            };
            deleteReq.onblocked = () => {
                console.warn('[GurbaniLocalDB] ☢️ DB delete blocked (another tab open). Please close other tabs and retry.');
                reject(new Error('DB delete blocked — close other tabs and try again'));
            };
        }

        /**
         * Initialize the IndexedDB database.
         *
         * Strategy (3 layers):
         *   1. DB_VERSION bump (4) → triggers onupgradeneeded for every existing client
         *   2. onupgradeneeded always deletes + recreates `banis` store cleanly
         *   3. onsuccess guard → if store is somehow still missing (corrupt leftover),
         *      nuke the whole DB and re-open so we get a guaranteed clean slate
         */
        async init() {
            if (this.isReady) return true;
            if (this.readyPromise) return this.readyPromise;

            this.readyPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = () => {
                    console.error('[GurbaniLocalDB] Failed to open database:', request.error);
                    reject(request.error);
                };

                request.onsuccess = (event) => {
                    const db = event.target.result;

                    // -- Runtime guard: if store is missing even after a successful open --
                    // This happens when the DB was previously opened at v4 but the
                    // onupgradeneeded was interrupted/crashed and the store was never created.
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.close();
                        this._nukeAndReset(resolve, reject);
                        return;
                    }

                    this.db = db;
                    this.isReady = true;
                    console.log('[GurbaniLocalDB] Database initialized (v4)');
                    resolve(true);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    const oldVersion = event.oldVersion;
                    console.log(`[GurbaniLocalDB] Upgrading DB from v${oldVersion} → v${DB_VERSION}`);

                    // Delete old store if it exists (handles v1/v2/v3 migrations)
                    if (db.objectStoreNames.contains(STORE_NAME)) {
                        try {
                            db.deleteObjectStore(STORE_NAME);
                            console.log('[GurbaniLocalDB] Deleted old banis store for migration');
                        } catch (e) {
                            console.warn('[GurbaniLocalDB] Could not delete old store:', e);
                        }
                    }

                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('fetched_at', 'fetched_at', { unique: false });
                    console.log('[GurbaniLocalDB] ✅ Created banis store (v4)');

                    // Clear download flags so we re-download fresh data
                    try {
                        localStorage.removeItem(LS_KEY_DOWNLOADED);
                        localStorage.removeItem(LS_KEY_DOWNLOAD_PROGRESS);
                    } catch (e) { }
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
         * Fetch bani from offline JSON (chunked)
         * Uses local chunked JSON files for speed
         */
        async fetchFromAPI(baniId) {
            // Use BaniDB chunked loading if available
            if (window.BaniDB && window.BaniDB.getBani) {
                console.log(`[GurbaniLocalDB] Using BaniDB chunked loading: ${baniId}`);
                return await window.BaniDB.getBani(baniId);
            }

            // Fallback to nitnem bundle for nitnem banis
            const nitnemBanis = [1, 2, 3, 4, 5, 6, 7, 9, 10, 21, 22, 23, 24, 25, 26];
            if (nitnemBanis.includes(baniId)) {
                try {
                    const response = await fetch('../data/banis-chunks/nitnem-banis.json');
                    if (!response.ok) throw new Error('Failed to load nitnem bundle');
                    const jsonData = await response.json();

                    if (jsonData.banis && jsonData.banis[baniId]) {
                        console.log(`[GurbaniLocalDB] ✅ Loaded from nitnem bundle: ${baniId}`);
                        return jsonData.banis[baniId];
                    }
                } catch (error) {
                    console.error(`[GurbaniLocalDB] ❌ Failed to load from nitnem bundle for bani ${baniId}:`, error);
                }
            }

            throw new Error(`Bani ${baniId} not available offline`);
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
