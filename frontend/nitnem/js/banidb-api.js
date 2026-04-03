/**
 * BaniDB API Module
 * Handles all interactions with the BaniDB API for fetching Gurbani content
 * @version 2.0.0
 */

const BaniDB = (function () {
    'use strict';

    // Configuration
    const CONFIG = {
        baseUrl: 'https://api.banidb.com/v2',
        cacheVersion: 'v2',
        cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
        maxRetries: 3,
        retryDelay: 1000
    };

    // Cache
    const cache = new Map();

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
     * Get cache key
     */
    function getCacheKey(endpoint) {
        return `banidb_${CONFIG.cacheVersion}_${endpoint}`;
    }

    /**
     * Store in cache (localStorage + memory)
     */
    function setCache(key, data) {
        const entry = {
            data,
            timestamp: Date.now()
        };

        cache.set(key, entry);

        try {
            localStorage.setItem(key, JSON.stringify(entry));
        } catch (e) {
            console.warn('Could not cache to localStorage:', e);
        }
    }

    /**
     * Get from cache
     */
    function getCache(key) {
        // Check memory cache first
        if (cache.has(key)) {
            const entry = cache.get(key);
            if (Date.now() - entry.timestamp < CONFIG.cacheExpiry) {
                return entry.data;
            }
            cache.delete(key);
        }

        // Check localStorage
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                const entry = JSON.parse(stored);
                if (Date.now() - entry.timestamp < CONFIG.cacheExpiry) {
                    cache.set(key, entry);
                    return entry.data;
                }
                localStorage.removeItem(key);
            }
        } catch (e) {
            console.warn('Could not read from localStorage:', e);
        }

        return null;
    }

    /**
     * Fetch with retry logic
     */
    async function fetchWithRetry(url, options = {}, retries = CONFIG.maxRetries) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
                return fetchWithRetry(url, options, retries - 1);
            }
            throw error;
        }
    }

    /**
     * Get list of all Banis
     */
    async function getAllBanis() {
        const cacheKey = getCacheKey('banis');
        const cached = getCache(cacheKey);
        if (cached) return cached;

        try {
            const data = await fetchWithRetry(`${CONFIG.baseUrl}/banis`);
            setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Failed to fetch Banis list:', error);
            throw error;
        }
    }

    /**
     * Get a specific Bani by ID - with offline-first graceful fallback
     */
    async function getBani(baniId, options = {}) {
        const larivaar = options.larivaar ? '&larivaar=true' : '';
        const cacheKey = getCacheKey(`bani_${baniId}${larivaar}`);
        const cached = getCache(cacheKey);
        if (cached && !options.forceRefresh) return cached;

        try {
            const url = `${CONFIG.baseUrl}/banis/${baniId}${larivaar ? `?larivaar=true` : ''}`;
            const data = await fetchWithRetry(url);
            setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error(`Failed to fetch Bani ${baniId}:`, error);
            
            // GRACEFUL OFFLINE FALLBACK: Return cached data even if expired
            if (cached) {
                console.log(`[BaniDB] Serving stale cached Bani ${baniId} due to network error`);
                return cached;
            }
            
            throw error;
        }
    }

    /**
     * Search Banis by query
     */
    async function searchBanis(query, options = {}) {
        const searchType = options.type || 0; // 0 = First Letter Start, 1 = First Letter Anywhere, etc.
        const source = options.source || 'all';

        try {
            const url = `${CONFIG.baseUrl}/search/${encodeURIComponent(query)}?searchtype=${searchType}&source=${source}`;
            const data = await fetchWithRetry(url);
            return data;
        } catch (error) {
            console.error('Search failed:', error);
            throw error;
        }
    }

    /**
     * Get random Shabad
     */
    async function getRandomShabad() {
        try {
            const data = await fetchWithRetry(`${CONFIG.baseUrl}/random`);
            return data;
        } catch (error) {
            console.error('Failed to fetch random Shabad:', error);
            throw error;
        }
    }

    /**
     * Get Today's Hukamnama from Sri Darbar Sahib
     */
    async function getHukamnama() {
        const cacheKey = getCacheKey('hukamnama_today');
        const cached = getCache(cacheKey);

        // Hukamnama should be refreshed every 4 hours
        if (cached) {
            const entry = cache.get(cacheKey);
            if (Date.now() - entry.timestamp < 4 * 60 * 60 * 1000) {
                return cached;
            }
        }

        try {
            const data = await fetchWithRetry(`${CONFIG.baseUrl}/hukamnamas/today`);
            setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Failed to fetch Hukamnama:', error);
            throw error;
        }
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
            gurmukhi = verse.unicode || verse.gurmukhi || '';
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
     * Pre-cache popular Banis for offline use
     */
    async function preCachePopularBanis(onProgress) {
        const popularBanis = [2, 4, 9, 10, 21, 23, 31];
        let loaded = 0;

        for (const baniId of popularBanis) {
            try {
                await getBani(baniId);
                loaded++;
                if (onProgress) onProgress(loaded, popularBanis.length);
            } catch (error) {
                console.warn(`Failed to pre-cache Bani ${baniId}:`, error);
            }
        }

        return loaded;
    }

    /**
     * Clear all caches
     */
    function clearCache() {
        cache.clear();

        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('banidb_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            console.warn('Could not clear localStorage cache:', e);
        }
    }

    // Public API
    return {
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
        escapeHtml
    };
})();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaniDB;
}
