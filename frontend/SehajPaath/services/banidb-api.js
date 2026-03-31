/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BANIDB API SERVICE - STANDALONE VERSION
 * Works without backend proxy - uses direct CORS-friendly API
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class BaniDBAPI {
    constructor() {
        // Use direct API - BaniDB v2 supports CORS
        this.baseURL = 'https://api.banidb.com/v2';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }

    async fetchWithRetry(url, options = {}, attempt = 1) {
        try {
            console.log(`🌐 Fetching from BaniDB (attempt ${attempt}):`, url);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                signal: controller.signal,
                mode: 'cors', // Explicitly enable CORS
                ...options
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ BaniDB Response received');
            return data;

        } catch (error) {
            console.error(`❌ BaniDB API Error (attempt ${attempt}):`, error.message);

            // Retry logic
            if (attempt < this.retryAttempts) {
                console.log(`⏳ Retrying in ${this.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.fetchWithRetry(url, options, attempt + 1);
            }

            // All retries failed
            throw new Error(`Failed to fetch from BaniDB after ${this.retryAttempts} attempts: ${error.message}`);
        }
    }

    async fetch(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const cacheKey = endpoint;

        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📦 Returning cached data for:', endpoint);
                return cached.data;
            }
        }

        // Fetch with retry
        const data = await this.fetchWithRetry(url, options);

        // Cache the response (LRU eviction: keep at most 50 entries)
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        
        if (this.cache.size > 50) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        return data;
    }

    /**
     * Get a specific Ang (page) from Sri Guru Granth Sahib Ji
     * With smart caching: IndexedDB first, API fallback, prefetch next 5
     */
    async getAng(angNumber) {
        if (angNumber < 1 || angNumber > 1430) {
            throw new Error('Invalid Ang number. Must be between 1 and 1430.');
        }

        // 1. Check IndexedDB cache first (offline-first)
        if (window.sehajPaathCache) {
            const cached = await window.sehajPaathCache.getAng(angNumber);
            const lines = cached?.lines || cached?.verses || [];
            if (lines.length > 0) {
                console.log('[BaniDBAPI] ✓ Loaded from cache:', angNumber);
                window.sehajPaathCache.addToHistory(angNumber);
                this.prefetchNextAngs(angNumber);
                return {
                    ang: angNumber,
                    lines: lines,
                    raag: cached.raag,
                    source: cached.source || 'G'
                };
            }
        }

        // 2. Not cached - fetch from API
        console.log('[BaniDBAPI] Fetching from API:', angNumber);
        const data = await this.fetch(`/angs/${angNumber}/G`);
        const formatted = this.formatAngData(data, angNumber);

        // 3. Save to IndexedDB cache
        if (window.sehajPaathCache && formatted && formatted.lines) {
            await window.sehajPaathCache.saveAng(angNumber, formatted);
            window.sehajPaathCache.addToHistory(angNumber);
            console.log('[BaniDBAPI] ✓ Saved to cache:', angNumber);
        }

        // 4. Prefetch next 5 Angs in background
        this.prefetchNextAngs(angNumber);

        return formatted;
    }

    /**
     * Prefetch next 5 Angs in background for smooth reading
     */
    prefetchNextAngs(currentAng) {
        if (!window.sehajPaathCache) return;

        const nextAngs = [];
        for (let i = 1; i <= 5; i++) {
            if (currentAng + i <= 1430) {
                nextAngs.push(currentAng + i);
            }
        }

        if (nextAngs.length > 0) {
            // Prefetch in background without blocking
            setTimeout(() => {
                nextAngs.forEach(ang => {
                    this.getAng(ang).catch(() => {
                        // Silent fail for prefetch
                        console.log(`Prefetch failed for Ang ${ang}`);
                    });
                });
            }, 2000);
        }
    }

    /**
     * Format Ang data - handles BaniDB v2 response structure
     */
    formatAngData(data, angNumber) {
        console.log('📄 Formatting Ang data for:', angNumber);

        // Handle different response structures
        let pageData = [];
        let raagInfo = '';

        if (data?.page && Array.isArray(data.page)) {
            pageData = data.page;
            raagInfo = data.page[0]?.line?.raag?.gurmukhi || '';
        } else if (Array.isArray(data)) {
            pageData = data;
        }

        if (pageData.length === 0) {
            console.warn('⚠️ No page data found for Ang', angNumber);
            return {
                ang: angNumber,
                source: 'G',
                raag: '',
                lines: []
            };
        }

        const lines = pageData.map(item => {
            // Handle BaniDB v2 API response structure
            // The API returns: { verse: { unicode: "..." }, larivaar: { unicode: "..." }, translation: { en: { bdb: "..." } }, ... }
            return {
                id: item.verseId || item.id || item.lineId,
                shabadId: item.shabadId,
                ang: item.pageNo || item.ang || angNumber,
                // verse.unicode contains the Gurmukhi text
                gurmukhi: item.verse?.unicode || item.verse?.gurmukhi || item.gurmukhi?.unicode || item.gurmukhi || '',
                // larivaar.unicode contains the continuous text
                larivaar: item.larivaar?.unicode || item.larivaar?.gurmukhi || item.larivaar || '',
                translation: {
                    en: this.extractTranslation(item, 'en'),
                    pu: this.extractTranslation(item, 'pu'),
                    hi: this.extractTranslation(item, 'hi')
                },
                transliteration: {
                    en: item.transliteration?.english || item.transliteration?.en || '',
                    hi: item.transliteration?.hindi || item.transliteration?.hi || ''
                },
                writer: item.writer?.english || item.writer?.gurmukhi || '',
                raag: item.raag?.english || item.raag?.gurmukhi || ''
            };
        });

        console.log('📝 Formatted lines:', lines.length, 'First line:', lines[0]?.gurmukhi?.substring(0, 50));

        return {
            ang: angNumber,
            source: 'G',
            raag: raagInfo || lines[0]?.raag || '',
            lines: lines.filter(l => l.gurmukhi) // Only include lines with content
        };
    }

    /**
     * Extract translation from various possible structures
     * BaniDB v2 format: translation.en.bdb, translation.en.ms, translation.pu.ss.unicode, etc.
     */
    extractTranslation(item, lang) {
        const trans = item.translation;
        if (!trans) return '';

        // Handle string case
        if (typeof trans === 'string') return trans;

        // Handle BaniDB v2 nested structure
        if (trans[lang]) {
            const langTrans = trans[lang];
            // English translations are in bdb, ms, or ssk keys
            if (lang === 'en') {
                return langTrans.bdb || langTrans.ms || langTrans.ssk ||
                    (typeof langTrans === 'string' ? langTrans : '');
            }
            // Punjabi translations are in ss.unicode, bdb.unicode, etc.
            if (lang === 'pu') {
                return langTrans.ss?.unicode || langTrans.bdb?.unicode || langTrans.ms?.unicode ||
                    (typeof langTrans === 'string' ? langTrans : '');
            }
            // Hindi translations
            if (lang === 'hi') {
                return langTrans.ss || langTrans.sts ||
                    (typeof langTrans === 'string' ? langTrans : '');
            }
            // Generic fallback
            if (typeof langTrans === 'string') return langTrans;
            if (langTrans.unicode) return langTrans.unicode;
        }

        // Fallback to simple structure
        if (trans.english && lang === 'en') return trans.english;
        if (trans.punjabi && lang === 'pu') return trans.punjabi;
        if (trans.hindi && lang === 'hi') return trans.hindi;

        return '';
    }

    /**
     * Search Gurbani
     */
    async search(query, searchType = '1') {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const encodedQuery = encodeURIComponent(query.trim());
        const data = await this.fetch(`/search/${encodedQuery}?searchtype=${searchType}`);
        return this.formatSearchResults(data);
    }

    formatSearchResults(data) {
        const results = data?.results || [];
        return results.map(result => {
            const line = result.line || result;
            return {
                id: line.id || line.lineId,
                shabadId: line.shabadId,
                ang: line.ang || line.pageNo,
                gurmukhi: line.gurmukhi?.unicode || line.gurmukhi || '',
                translation: this.extractTranslation(line, 'en'),
                transliteration: line.transliteration?.english || line.transliteration?.en || '',
                raag: line.raag?.gurmukhi || line.raag?.english || '',
                writer: line.writer?.gurmukhi || line.writer?.english || ''
            };
        });
    }

    /**
     * Get a specific Shabad by ID
     */
    async getShabad(shabadId) {
        const data = await this.fetch(`/shabads/${shabadId}`);
        return this.formatShabadData(data);
    }

    formatShabadData(data) {
        if (!data) return null;

        const shabadLines = data.shabad || data.verses || [];
        const info = data.shabadInfo || data.info || {};

        return {
            shabadId: info.shabadId || data.shabadId,
            source: info.source,
            writer: info.writer,
            raag: info.raag,
            ang: info.pageNo || info.ang,
            lines: shabadLines.map(item => {
                const line = item.line || item;
                return {
                    id: line.id || line.lineId,
                    gurmukhi: line.gurmukhi?.unicode || line.gurmukhi || '',
                    larivaar: line.larivaar?.unicode || line.larivaar || '',
                    translation: {
                        en: this.extractTranslation(line, 'en'),
                        pu: this.extractTranslation(line, 'pu')
                    },
                    transliteration: {
                        en: line.transliteration?.english || line.transliteration?.en || ''
                    }
                };
            })
        };
    }

    /**
     * Get random Shabad
     */
    async getRandomShabad() {
        const data = await this.fetch('/random/G');
        return this.formatShabadData(data);
    }

    /**
     * Get random Ang number
     */
    getRandomAngNumber() {
        return Math.floor(Math.random() * 1430) + 1;
    }

    /**
     * Get today's Hukamnama
     */
    async getHukamnama() {
        try {
            const data = await this.fetch('/hukamnama/today');
            if (!data) return null;

            const info = data.hukamnamainfo || data.shabadInfo || {};
            const lines = data.hukamnama || data.shabad || [];

            return {
                date: data.date,
                ang: info.pageNo || info.ang,
                shabadId: info.shabadId,
                lines: lines.map(item => {
                    const line = item.line || item;
                    return {
                        id: line.id,
                        gurmukhi: line.gurmukhi?.unicode || line.gurmukhi || '',
                        translation: { en: this.extractTranslation(line, 'en') },
                        transliteration: { en: line.transliteration?.english || '' }
                    };
                })
            };
        } catch (error) {
            console.error('Error fetching Hukamnama:', error);
            return null;
        }
    }

    /**
     * Get multiple Angs
     */
    async getAngRange(startAng, count = 5) {
        const promises = [];
        for (let i = 0; i < count && startAng + i <= 1430; i++) {
            promises.push(this.getAng(startAng + i));
        }
        return Promise.all(promises);
    }

    clearCache() {
        this.cache.clear();
    }
}

// Make globally available
window.BaniDBAPI = BaniDBAPI;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaniDBAPI;
}
