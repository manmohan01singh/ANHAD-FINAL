/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BANIDB API SERVICE - FIXED VERSION
 * Handles all API calls to BaniDB for fetching Gurbani content
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class BaniDBAPI {
    constructor() {
        this.baseURL = 'https://api.banidb.com/v2';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000;
    }

    async fetch(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const cacheKey = url;

        // Check cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📦 Returning cached data for:', endpoint);
                return cached.data;
            }
        }

        try {
            console.log('🌐 Fetching from BaniDB:', url);
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ BaniDB Response received:', endpoint);

            // Cache the response
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('❌ BaniDB API Error:', error);
            throw error;
        }
    }

    /**
     * Get a specific Ang (page) from Sri Guru Granth Sahib Ji
     */
    async getAng(angNumber) {
        if (angNumber < 1 || angNumber > 1430) {
            throw new Error('Invalid Ang number. Must be between 1 and 1430.');
        }

        const data = await this.fetch(`/angs/${angNumber}`);
        return this.formatAngData(data, angNumber);
    }

    /**
     * Format Ang data - handles BaniDB v2 response structure
     */
    formatAngData(data, angNumber) {
        console.log('📄 Formatting Ang data:', data);

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
