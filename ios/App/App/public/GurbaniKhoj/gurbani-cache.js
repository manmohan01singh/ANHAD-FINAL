/**
 * Local Gurbani Cache System
 * Stores search results locally for offline access
 */

const GurbaniCache = {
    CACHE_KEY: 'gurbani_search_cache',
    MAX_CACHE_SIZE: 10000, // Maximum number of verses to cache
    CACHE_VERSION: '1.0',

    init() {
        // Initialize cache if not exists
        if (!localStorage.getItem(this.CACHE_KEY)) {
            const initialCache = {
                version: this.CACHE_VERSION,
                lastUpdated: Date.now(),
                verses: [],
                searchIndex: {}
            };
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(initialCache));
        }
    },

    getCache() {
        try {
            const cache = localStorage.getItem(this.CACHE_KEY);
            return cache ? JSON.parse(cache) : null;
        } catch (e) {
            console.error('Cache read error:', e);
            return null;
        }
    },

    saveCache(cache) {
        try {
            cache.lastUpdated = Date.now();
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
            return true;
        } catch (e) {
            console.error('Cache write error:', e);
            // If quota exceeded, remove oldest entries
            if (e.name === 'QuotaExceededError') {
                this.pruneCache();
                return this.saveCache(cache);
            }
            return false;
        }
    },

    addVerses(verses) {
        const cache = this.getCache();
        if (!cache) return false;

        let addedCount = 0;
        verses.forEach(verse => {
            // Check if verse already exists (by verseId)
            const exists = cache.verses.some(v => v.verseId === verse.verseId);
            if (!exists) {
                cache.verses.push(verse);
                addedCount++;
            }
        });

        // Prune if over limit
        if (cache.verses.length > this.MAX_CACHE_SIZE) {
            // Keep most recent entries
            cache.verses = cache.verses.slice(-this.MAX_CACHE_SIZE);
        }

        // Rebuild search index
        this.rebuildSearchIndex(cache);
        this.saveCache(cache);

        console.log(`Added ${addedCount} verses to cache (Total: ${cache.verses.length})`);
        return addedCount;
    },

    rebuildSearchIndex(cache) {
        cache.searchIndex = {};
        cache.verses.forEach(verse => {
            const gurmukhi = verse.verse?.unicode || '';
            // Index by first letter
            const firstLetter = gurmukhi.charAt(0);
            if (firstLetter) {
                if (!cache.searchIndex[firstLetter]) {
                    cache.searchIndex[firstLetter] = [];
                }
                cache.searchIndex[firstLetter].push(verse.verseId);
            }
        });
    },

    search(query, sourceFilter = 'all') {
        const cache = this.getCache();
        if (!cache || cache.verses.length === 0) {
            return { verses: [], fromCache: false };
        }

        const queryLower = query.toLowerCase();
        let results = [];

        // Simple search: match Gurmukhi text
        results = cache.verses.filter(verse => {
            const gurmukhi = verse.verse?.unicode || '';
            return gurmukhi.includes(query);
        });

        // Apply source filter
        if (sourceFilter !== 'all') {
            results = results.filter(verse => verse._source === sourceFilter);
        }

        return {
            verses: results,
            fromCache: true,
            totalInCache: cache.verses.length
        };
    },

    pruneCache() {
        const cache = this.getCache();
        if (!cache) return;

        // Remove oldest half of entries
        const keepCount = Math.floor(cache.verses.length / 2);
        cache.verses = cache.verses.slice(-keepCount);
        this.rebuildSearchIndex(cache);
        this.saveCache(cache);
        console.log(`Pruned cache to ${cache.verses.length} verses`);
    },

    getStats() {
        const cache = this.getCache();
        if (!cache) return null;

        return {
            totalVerses: cache.verses.length,
            lastUpdated: new Date(cache.lastUpdated).toLocaleString(),
            version: cache.version,
            storageSize: JSON.stringify(cache).length
        };
    },

    clearCache() {
        localStorage.removeItem(this.CACHE_KEY);
        this.init();
        console.log('Cache cleared');
    }
};

// Initialize cache on load
GurbaniCache.init();
