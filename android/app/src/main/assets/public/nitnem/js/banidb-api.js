/**
 * BaniDB API Module - INSTANT OFFLINE-FIRST VERSION
 * Handles all interactions with the BaniDB API for fetching Gurbani content
 * NOW WITH INSTANT OFFLINE LOADING - Zero network delay for popular banis
 * @version 3.0.0 - INSTANT LOADING EDITION
 */

const BaniDB = (function () {
    'use strict';

    // Configuration
    const CONFIG = {
        baseUrl: 'https://api.banidb.com/v2',
        cacheVersion: 'v3',
        cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
        maxRetries: 2,
        retryDelay: 500,
        offlineFirst: true // NEW: Always use offline data first
    };

    // Cache
    const cache = new Map();

    // Check if offline data is available
    const hasOfflineData = () => typeof OFFLINE_BANI_DATA !== 'undefined' && OFFLINE_BANI_DATA;

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

    // POPULAR BANI IDS that have offline data
    const OFFLINE_BANI_IDS = [2, 4, 9, 10, 21, 23, 31];

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
     * Get offline bani data instantly
     */
    function getOfflineBani(baniId) {
        if (!hasOfflineData()) return null;
        const offlineData = OFFLINE_BANI_DATA[baniId];
        if (!offlineData) return null;
        
        // Transform offline data to match API format
        return {
            baniID: offlineData.baniID,
            baniName: offlineData.baniName,
            gurmukhiUni: offlineData.gurmukhiUni,
            transliteration: offlineData.transliteration,
            info: offlineData.info,
            verses: offlineData.verses.map(v => ({
                verseId: v.verseId,
                verse: {
                    verseId: v.verseId,
                    verse: v.gurmukhi,
                    gurmukhi: v.gurmukhi,
                    unicode: v.gurmukhi
                },
                transliteration: { english: v.transliteration, en: v.transliteration, roman: v.transliteration },
                translation: { en: { bdb: v.english, ms: v.english }, pu: { ss: v.punjabi } },
                lineNo: v.lineNo,
                pageNo: v.pageNo,
                shabadId: v.shabadId,
                sourceId: v.sourceId
            }))
        };
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
     * Get a specific Bani by ID - INSTANT OFFLINE-FIRST with background sync
     */
    async function getBani(baniId, options = {}) {
        const larivaar = options.larivaar ? '&larivaar=true' : '';
        const cacheKey = getCacheKey(`bani_${baniId}${larivaar}`);
        
        // INSTANT: Return offline data immediately if available
        const offlineData = getOfflineBani(baniId);
        if (offlineData && !options.forceRefresh) {
            // Check for fresher cached data in background
            const cached = getCache(cacheKey);
            
            // Return offline data instantly, but trigger background refresh if online
            if (navigator.onLine && !options.skipBackgroundRefresh) {
                // Background fetch to update cache
                setTimeout(async () => {
                    try {
                        const url = `${CONFIG.baseUrl}/banis/${baniId}${larivaar ? `?larivaar=true` : ''}`;
                        const freshData = await fetchWithRetry(url, {}, 1);
                        setCache(cacheKey, freshData);
                    } catch (e) {
                        // Silent fail - offline data is already serving
                    }
                }, 100);
            }
            
            return offlineData;
        }

        // Check cache for non-offline banis
        const cached = getCache(cacheKey);
        if (cached && !options.forceRefresh) {
            // Background refresh if online
            if (navigator.onLine && !options.skipBackgroundRefresh) {
                setTimeout(async () => {
                    try {
                        const url = `${CONFIG.baseUrl}/banis/${baniId}${larivaar ? `?larivaar=true` : ''}`;
                        const freshData = await fetchWithRetry(url, {}, 1);
                        setCache(cacheKey, freshData);
                    } catch (e) {}
                }, 100);
            }
            return cached;
        }

        // Fetch from network
        try {
            const url = `${CONFIG.baseUrl}/banis/${baniId}${larivaar ? `?larivaar=true` : ''}`;
            const data = await fetchWithRetry(url);
            setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error(`Failed to fetch Bani ${baniId}:`, error);
            
            // GRACEFUL OFFLINE FALLBACK
            if (offlineData) {
                console.log(`[BaniDB] Serving offline Bani ${baniId} due to network error`);
                return offlineData;
            }
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
        const searchType = options.type || 0;
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
            if (entry && Date.now() - entry.timestamp < 4 * 60 * 60 * 1000) {
                return cached;
            }
        }

        try {
            const data = await fetchWithRetry(`${CONFIG.baseUrl}/hukamnamas/today`);
            setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Failed to fetch Hukamnama:', error);
            if (cached) return cached;
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
     * Pre-cache popular Banis for offline use
     */
    async function preCachePopularBanis(onProgress) {
        const popularBanis = OFFLINE_BANI_IDS; // Use our offline list
        let loaded = 0;

        for (const baniId of popularBanis) {
            try {
                // Use skipBackgroundRefresh to avoid double fetch
                await getBani(baniId, { skipBackgroundRefresh: true });
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
        OFFLINE_BANI_IDS,
        escapeHtml,
        hasOfflineData: () => hasOfflineData()
    };
})();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaniDB;
}
