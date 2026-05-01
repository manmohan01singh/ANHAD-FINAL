/**
 * BaniDB API Module - CHUNKED OFFLINE VERSION
 * Banis loaded from chunked JSON files for maximum speed
 * @version 5.0.0 - CHUNKED OFFLINE EDITION
 */

const BaniDB = (function () {
    'use strict';

    // Configuration
    const CONFIG = {
        chunksPath: '../data/banis-chunks',
        cacheVersion: 'v5',
        offlineFirst: true
    };

    // Cache
    const cache = new Map();
    let indexData = null;
    let nitnemBundle = null;
    let popularBundle = null;
    let loadedChunks = new Map();

    // Nitnem banis (preloaded on startup)
    const NITNEM_BANIS = [1, 2, 3, 4, 5, 6, 7, 9, 10, 21, 22, 23, 24, 25, 26];

    /**
     * Load index file
     */
    async function loadIndex() {
        if (indexData) return indexData;

        try {
            const response = await fetch(`${CONFIG.chunksPath}/index.json`);
            indexData = await response.json();
            console.log('[BaniDB] Loaded index');
            return indexData;
        } catch (error) {
            console.error('[BaniDB] Failed to load index:', error);
            return null;
        }
    }

    /**
     * Load nitnem bundle (small, preloaded for instant access)
     */
    async function loadNitnemBundle() {
        if (nitnemBundle) return nitnemBundle;

        try {
            const response = await fetch(`${CONFIG.chunksPath}/nitnem-banis.json`);
            nitnemBundle = await response.json();
            console.log(`[BaniDB] Loaded nitnem bundle (${Object.keys(nitnemBundle.banis).length} banis)`);
            return nitnemBundle;
        } catch (error) {
            console.error('[BaniDB] Failed to load nitnem bundle:', error);
            return null;
        }
    }

    /**
     * Load popular bundle (preloaded after nitnem)
     */
    async function loadPopularBundle() {
        if (popularBundle) return popularBundle;

        try {
            const response = await fetch(`${CONFIG.chunksPath}/popular-banis.json`);
            popularBundle = await response.json();
            console.log(`[BaniDB] Loaded popular bundle (${Object.keys(popularBundle.banis).length} banis)`);
            return popularBundle;
        } catch (error) {
            console.error('[BaniDB] Failed to load popular bundle:', error);
            return null;
        }
    }

    /**
     * Load a specific chunk
     */
    async function loadChunk(chunkFile) {
        if (loadedChunks.has(chunkFile)) {
            return loadedChunks.get(chunkFile);
        }

        try {
            const response = await fetch(`${CONFIG.chunksPath}/${chunkFile}`);
            const chunkData = await response.json();
            loadedChunks.set(chunkFile, chunkData);
            console.log(`[BaniDB] Loaded chunk: ${chunkFile}`);
            return chunkData;
        } catch (error) {
            console.error(`[BaniDB] Failed to load chunk ${chunkFile}:`, error);
            return null;
        }
    }

    /**
     * Get bani data from appropriate chunk
     */
    async function getOfflineBani(baniId) {
        const id = parseInt(baniId);
        
        // Check if it's in nitnem bundle (already loaded)
        if (nitnemBundle && nitnemBundle.banis[id]) {
            return nitnemBundle.banis[id];
        }

        // Check if it's in popular bundle
        if (popularBundle && popularBundle.banis[id]) {
            return popularBundle.banis[id];
        }

        // Load index if not loaded
        if (!indexData) {
            await loadIndex();
        }

        // Find which chunk contains this bani
        if (indexData && indexData.baniIndex[id]) {
            const chunkFile = indexData.baniIndex[id];
            const chunk = await loadChunk(chunkFile);
            if (chunk && chunk.banis[id]) {
                return chunk.banis[id];
            }
        }

        return null;
    }

    /**
     * Initialize - preload nitnem bundle on startup
     */
    async function initialize() {
        console.log('[BaniDB] Initializing - preloading nitnem bundle...');
        await loadNitnemBundle();
        
        // Preload popular bundle in background
        setTimeout(async () => {
            await loadPopularBundle();
        }, 100);
    }

    // Auto-initialize when script loads
    initialize();

    // Check if offline data is available
    const hasOfflineData = () => nitnemBundle !== null;

    // Bani ID Mapping (commonly used)
    const BANI_IDS = {
        gurMantar: 1,
        japjiSahib: 2,
        shabadHazare: 3,
        jaapSahib: 4,
        shabadHazare10: 5,
        tavPrasadSavaiye1: 6,
        tavPrasadSavaiye2: 7,
        chaupaiSahib: 9,
        anandSahib: 10,
        rehrasSahib: 21,
        aarti: 22,
        sohilaSahib: 23,
        ardas: 24,
        barahMaha: 27,
        akalUstat: 29,
        salokM9: 30,
        sukhmaniSahib: 31,
        bavanAkhri: 33,
        sidhGosht: 34,
        dukhBhanjani: 36,
        asaDiVaar: 90
    };

    // Nitnem collections
    const NITNEM = {
        morning: [2, 4, 6, 7, 9, 10],
        evening: [21],
        night: [23],
        full: [2, 4, 6, 7, 9, 10, 21, 23]
    };

    // ALL BANI IDS are now available offline
    const OFFLINE_BANI_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107];

    /**
     * Escape HTML for security
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get bani data from offline JSON file
     */
    function getOfflineBani(baniId) {
        if (!hasOfflineData()) return null;
        return allBanisData.banis[baniId] || null;
    }

    /**
     * Get list of all Banis from index
     */
    async function getAllBanis() {
        await loadIndex();
        if (!indexData) return [];
        
        // Return index info without loading all banis
        return {
            version: indexData.version,
            lastUpdated: indexData.lastUpdated,
            totalBanis: indexData.totalBanis,
            chunks: indexData.chunks
        };
    }

    /**
     * Get a specific Bani by ID - CHUNKED LOADING
     */
    async function getBani(baniId, options = {}) {
        // Initialize if not already done
        if (!nitnemBundle) {
            await initialize();
        }
        
        const baniData = await getOfflineBani(baniId);
        if (!baniData) {
            console.error(`[BaniDB] Bani ${baniId} not found in offline data`);
            return null;
        }
        
        return baniData;
    }

    /**
     * Search Banis by query - OFFLINE VERSION (searches within loaded banis)
     */
    async function searchBanis(query, options = {}) {
        await loadOfflineBanis();
        if (!allBanisData) return [];

        const results = [];
        const queryLower = query.toLowerCase();

        // Search through all banis
        for (const [baniId, bani] of Object.entries(allBanisData.banis)) {
            const baniInfo = bani.baniInfo;
            if (!baniInfo) continue;

            // Search in bani name
            if (baniInfo.unicode?.toLowerCase().includes(queryLower) ||
                baniInfo.english?.toLowerCase().includes(queryLower)) {
                results.push({
                    ID: parseInt(baniId),
                    gurmukhiUni: baniInfo.unicode,
                    gurmukhi: baniInfo.gurmukhi,
                    transliteration: baniInfo.english
                });
                continue;
            }

            // Search in verses
            if (bani.verses) {
                for (const verse of bani.verses) {
                    const verseText = verse.verse?.gurmukhi || verse.verse?.verse || '';
                    if (verseText.toLowerCase().includes(queryLower)) {
                        results.push({
                            ID: parseInt(baniId),
                            gurmukhiUni: baniInfo.unicode,
                            gurmukhi: baniInfo.gurmukhi,
                            transliteration: baniInfo.english
                        });
                        break;
                    }
                }
            }
        }

        return results;
    }

    /**
     * Get random Shabad - OFFLINE VERSION (returns random verse from loaded banis)
     */
    async function getRandomShabad() {
        await loadOfflineBanis();
        if (!allBanisData) return null;

        const baniIds = Object.keys(allBanisData.banis);
        const randomBaniId = baniIds[Math.floor(Math.random() * baniIds.length)];
        const bani = allBanisData.banis[randomBaniId];

        if (!bani?.verses || bani.verses.length === 0) return null;

        const randomVerse = bani.verses[Math.floor(Math.random() * bani.verses.length)];
        return randomVerse;
    }

    /**
     * Get Today's Hukamnama - DISABLED (requires API)
     */
    async function getHukamnama() {
        console.warn('[BaniDB] Hukamnama requires API - offline version not available');
        return null;
    }

    /**
     * Parse verse data into consistent format
     */
    function parseVerse(verseData) {
        const verse = verseData.verse || verseData;

        // Extract Gurmukhi
        let gurmukhi = '';
        if (verse.verse) {
            gurmukhi = typeof verse.verse === 'string'
                ? verse.verse
                : verse.verse.unicode || verse.verse.gurmukhi || '';
        } else {
            gurmukhi = verse.unicode || verse.gurmukhi || verse.gurmukhi || '';
        }

        // Extract transliteration
        let transliteration = '';
        const translit = verseData.transliteration || verse.transliteration;
        if (translit) {
            transliteration = typeof translit === 'string'
                ? translit
                : translit.english || translit.en || translit.roman || '';
        }

        // Extract English translation
        let english = '';
        const translation = verseData.translation || verse.translation;
        if (translation) {
            if (typeof translation === 'string') {
                english = translation;
            } else if (translation.en) {
                const en = translation.en;
                english = typeof en === 'string' ? en : en.bdb || en.ms || en.ssk || '';
            }
        }

        // Extract Punjabi translation
        let punjabi = '';
        if (translation?.pu) {
            const pu = translation.pu;
            if (typeof pu === 'string') {
                punjabi = pu;
            } else {
                const sources = ['ss', 'bdb', 'ms', 'ft'];
                for (const src of sources) {
                    if (pu[src]) {
                        punjabi = typeof pu[src] === 'string'
                            ? pu[src]
                            : pu[src].unicode || pu[src].gurmukhi || '';
                        if (punjabi) break;
                    }
                }
            }
        }

        // Extract Hindi transliteration
        let hindi = '';
        if (translit?.hi || translit?.hindi) {
            hindi = translit.hi || translit.hindi;
        }

        return {
            id: verse.verseId || verseData.verseId || null,
            gurmukhi: escapeHtml(gurmukhi),
            transliteration: escapeHtml(transliteration),
            english: escapeHtml(english),
            punjabi: escapeHtml(punjabi),
            hindi: escapeHtml(hindi),
            lineNo: verse.lineNo || verseData.lineNo || null,
            sourceId: verse.sourceId || null,
            shabadId: verse.shabadId || null,
            pageNo: verse.pageNo || verseData.pageNo || null,
            header: verse.header || verseData.header || null
        };
    }

    /**
     * Format Bani info
     */
    function formatBaniInfo(baniData) {
        return {
            id: baniData.ID || baniData.id,
            token: baniData.token,
            nameGurmukhi: baniData.gurmukhiUni || baniData.gurmukhi,
            nameEnglish: baniData.transliteration,
            nameHindi: baniData.transliterations?.hindi || baniData.transliterations?.hi || ''
        };
    }

    /**
     * Pre-cache popular Banis - Load nitnem and popular bundles
     */
    async function preCachePopularBanis(onProgress) {
        await initialize();
        
        // Nitnem bundle is already loaded
        let loaded = Object.keys(nitnemBundle?.banis || {}).length;
        
        // Popular bundle loads in background
        if (popularBundle) {
            loaded += Object.keys(popularBundle.banis).length;
        }
        
        if (onProgress) onProgress(loaded, 112);
        return loaded;
    }

    /**
     * Clear all caches - NOT NEEDED (no caching in offline mode)
     */
    function clearCache() {
        cache.clear();
        console.log('[BaniDB] Cache cleared (offline mode)');
    }

    // Public API
    return {
        initialize,
        getAllBanis,
        getBani,
        searchBanis,
        getRandomShabad,
        getHukamnama,
        parseVerse,
        formatBaniInfo,
        preCachePopularBanis,
        clearCache,
        BANI_IDS,
        NITNEM,
        OFFLINE_BANI_IDS,
        escapeHtml,
        hasOfflineData: () => hasOfflineData()
    };
})();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaniDB;
}
