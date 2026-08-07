/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GURBANI DB — Offline-First Local Database
 * Powered by IndexedDB • API-First with Progressive Caching
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Architecture:
 *   1. All reads go to IndexedDB FIRST (< 20ms)
 *   2. If data missing → fetch from BaniDB API → cache in IndexedDB
 *   3. Visited pages are cached automatically for offline use
 *   4. Optional user-initiated "Download All" from Settings
 *   5. GurbaniNow API used as fallback if BaniDB is down
 * 
 * Stores:
 *   angs          — 1430 pages of Sri Guru Granth Sahib Ji
 *   banis         — All Banis (Japji, Rehras, Sukhmani, etc.)
 *   shabads       — Individual Shabads (fetched on-demand)
 *   search_index  — Pre-computed first-letter index for offline search
 *   hukamnama     — Cached daily Hukamnama (24h TTL)
 *   meta          — Hydration status, version, timestamps
 * 
 * @version 2.0.0 — API-First (no bulk auto-download)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class GurbaniDB {
    static DB_NAME = 'AnhadGurbaniDB';
    static DB_VERSION = 1;
    static API_BASE = 'https://api.banidb.com/v2';

    // Singleton
    static _instance = null;
    static _dbPromise = null;

    constructor() {
        if (GurbaniDB._instance) return GurbaniDB._instance;
        GurbaniDB._instance = this;
        this._db = null;
        this._ready = this._openDB();
    }

    // ═══════════════════════════════════════════════════════════════
    // DATABASE INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    async _openDB() {
        if (this._db) return this._db;
        if (GurbaniDB._dbPromise) return GurbaniDB._dbPromise;

        GurbaniDB._dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(GurbaniDB.DB_NAME, GurbaniDB.DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('📦 GurbaniDB: Creating stores...');

                // Angs store (1-1430)
                if (!db.objectStoreNames.contains('angs')) {
                    db.createObjectStore('angs', { keyPath: 'angNumber' });
                }

                // Banis store
                if (!db.objectStoreNames.contains('banis')) {
                    db.createObjectStore('banis', { keyPath: 'id' });
                }

                // Shabads store
                if (!db.objectStoreNames.contains('shabads')) {
                    db.createObjectStore('shabads', { keyPath: 'shabadId' });
                }

                // Search index — first-letter index for offline search
                if (!db.objectStoreNames.contains('search_index')) {
                    const searchStore = db.createObjectStore('search_index', { keyPath: 'id', autoIncrement: true });
                    searchStore.createIndex('firstLetters', 'firstLetters', { unique: false });
                    searchStore.createIndex('angNumber', 'angNumber', { unique: false });
                }

                // Hukamnama cache
                if (!db.objectStoreNames.contains('hukamnama')) {
                    db.createObjectStore('hukamnama', { keyPath: 'dateKey' });
                }

                // Meta store (hydration status, etc.)
                if (!db.objectStoreNames.contains('meta')) {
                    db.createObjectStore('meta', { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                this._db = event.target.result;
                console.log('✅ GurbaniDB: Database opened successfully');
                resolve(this._db);
            };

            request.onerror = (event) => {
                console.error('❌ GurbaniDB: Failed to open database:', event.target.error);
                reject(event.target.error);
            };
        });

        return GurbaniDB._dbPromise;
    }

    async _getDB() {
        if (this._db) return this._db;
        return this._ready;
    }

    // ═══════════════════════════════════════════════════════════════
    // LOW-LEVEL INDEXEDDB OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    async _get(storeName, key) {
        const db = await this._getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    }

    async _put(storeName, data) {
        const db = await this._getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.put(data);
            req.onsuccess = () => resolve(true);
            req.onerror = () => {
                if (req.error?.name === 'QuotaExceededError') {
                    console.warn('GurbaniDB: Storage quota exceeded, skipping cache write');
                    resolve(false);
                } else {
                    reject(req.error);
                }
            };
        });
    }

    async _putBatch(storeName, items) {
        const db = await this._getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            items.forEach(item => store.put(item));
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => {
                if (tx.error?.name === 'QuotaExceededError') {
                    console.warn('GurbaniDB: Storage quota exceeded on batch write');
                    resolve(false);
                } else {
                    reject(tx.error);
                }
            };
        });
    }

    async _count(storeName) {
        const db = await this._getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async _getAll(storeName) {
        const db = await this._getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    async _clear(storeName) {
        const db = await this._getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.clear();
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // ANG (PAGE) — SEHAJ PAATH
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get a specific Ang (page 1-1430) — OFFLINE FIRST
     * @param {number} angNumber 
     * @returns {Object} Formatted ang data with lines[]
     */
    async getAng(angNumber) {
        if (angNumber < 1 || angNumber > 1430) {
            throw new Error(`Invalid Ang number: ${angNumber}. Must be 1-1430.`);
        }

        // 1. Try local DB first
        const cached = await this._get('angs', angNumber);
        if (cached) {
            console.log(`📦 GurbaniDB: Ang ${angNumber} from local DB`);
            return cached;
        }

        // 2. Fetch from API
        console.log(`🌐 GurbaniDB: Fetching Ang ${angNumber} from API...`);
        const data = await this._fetchJSON(`/angs/${angNumber}`);
        const formatted = this._formatAngData(data, angNumber);

        // 3. Store locally (fire and forget)
        this._put('angs', formatted).catch(e => console.warn('Cache write failed:', e));

        // 4. Also index for search (fire and forget)
        this._indexAngForSearch(formatted).catch(e => console.warn('Index failed:', e));

        return formatted;
    }

    /**
     * Format BaniDB v2 Ang response into our standard format
     */
    _formatAngData(data, angNumber) {
        let pageData = [];
        let raagInfo = '';

        if (data?.page && Array.isArray(data.page)) {
            pageData = data.page;
            raagInfo = data.page[0]?.raag?.gurmukhi || data.page[0]?.raag?.english || '';
        } else if (Array.isArray(data)) {
            pageData = data;
        }

        const lines = pageData.map(item => ({
            id: item.verseId || item.id || item.lineId,
            shabadId: item.shabadId,
            ang: item.pageNo || angNumber,
            gurmukhi: item.verse?.unicode || item.verse?.gurmukhi || item.gurmukhi?.unicode || item.gurmukhi || '',
            larivaar: item.larivaar?.unicode || item.larivaar?.gurmukhi || item.larivaar || '',
            translation: {
                en: this._extractTranslation(item, 'en'),
                pu: this._extractTranslation(item, 'pu'),
                hi: this._extractTranslation(item, 'hi')
            },
            transliteration: {
                en: item.transliteration?.english || item.transliteration?.en || '',
                hi: item.transliteration?.hindi || item.transliteration?.hi || ''
            },
            writer: item.writer?.english || item.writer?.gurmukhi || '',
            raag: item.raag?.english || item.raag?.gurmukhi || ''
        }));

        return {
            angNumber,
            ang: angNumber,
            source: 'G',
            raag: raagInfo || lines[0]?.raag || '',
            lines: lines.filter(l => l.gurmukhi),
            downloadedAt: Date.now()
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // BANI — NITNEM & OTHERS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get a specific Bani by ID — OFFLINE FIRST
     * @param {number} baniId 
     * @returns {Object} BaniDB v2 formatted response
     */
    async getBani(baniId) {
        // 1. Try local DB first
        const cached = await this._get('banis', baniId);
        if (cached) {
            console.log(`📦 GurbaniDB: Bani ${baniId} from local DB`);
            return cached.data;
        }

        // 2. Fetch from API
        console.log(`🌐 GurbaniDB: Fetching Bani ${baniId} from API...`);
        const data = await this._fetchJSON(`/banis/${baniId}`);

        // 3. Store locally
        await this._put('banis', {
            id: baniId,
            data: data,
            downloadedAt: Date.now()
        }).catch(e => console.warn('Cache write failed:', e));

        return data;
    }

    // ═══════════════════════════════════════════════════════════════
    // SHABAD — INDIVIDUAL SHABAD
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get a specific Shabad — OFFLINE FIRST
     * @param {string|number} shabadId
     * @returns {Object} BaniDB v2 shabad response
     */
    async getShabad(shabadId) {
        const key = String(shabadId);

        // 1. Try local DB first
        const cached = await this._get('shabads', key);
        if (cached) {
            console.log(`📦 GurbaniDB: Shabad ${shabadId} from local DB`);
            return cached.data;
        }

        // 2. Fetch from API
        console.log(`🌐 GurbaniDB: Fetching Shabad ${shabadId} from API...`);
        const data = await this._fetchJSON(`/shabads/${shabadId}`);

        // 3. Store locally
        await this._put('shabads', {
            shabadId: key,
            data: data,
            downloadedAt: Date.now()
        }).catch(e => console.warn('Cache write failed:', e));

        return data;
    }

    // ═══════════════════════════════════════════════════════════════
    // RANDOM SHABAD — OFFLINE
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get a random Shabad — works offline if Angs are hydrated
     * @returns {Object} BaniDB v2 random shabad response
     */
    async getRandomShabad() {
        // Check if we have local data
        const angCount = await this._count('angs');

        if (angCount >= 100) {
            // Pick a random Ang, then pick a random Shabad from it
            const randomAngNum = Math.floor(Math.random() * Math.min(angCount, 1430)) + 1;
            const ang = await this._get('angs', randomAngNum);

            if (ang && ang.lines && ang.lines.length > 0) {
                // Find unique shabadIds in this Ang
                const shabadIds = [...new Set(ang.lines.map(l => l.shabadId).filter(Boolean))];
                if (shabadIds.length > 0) {
                    const randomShabadId = shabadIds[Math.floor(Math.random() * shabadIds.length)];

                    // Try to get full shabad from cache
                    const cached = await this._get('shabads', String(randomShabadId));
                    if (cached) {
                        console.log(`📦 GurbaniDB: Random Shabad ${randomShabadId} from local DB`);
                        return cached.data;
                    }

                    // Try to fetch it
                    try {
                        return await this.getShabad(randomShabadId);
                    } catch (e) {
                        // Offline and shabad not cached — build a pseudo-shabad from Ang lines
                        return this._buildShabadFromAngLines(ang, randomShabadId);
                    }
                }
            }
        }

        // Fallback: fetch from API
        console.log('🌐 GurbaniDB: Fetching random Shabad from API...');
        const data = await this._fetchJSON('/random/shabad');

        // Cache it
        if (data?.shabadInfo?.shabadId) {
            await this._put('shabads', {
                shabadId: String(data.shabadInfo.shabadId),
                data: data,
                downloadedAt: Date.now()
            }).catch(() => {});
        }

        return data;
    }

    /**
     * Build a pseudo-shabad response from Ang lines (for offline random)
     */
    _buildShabadFromAngLines(ang, shabadId) {
        const lines = ang.lines.filter(l => l.shabadId === shabadId);
        return {
            shabadInfo: {
                shabadId: shabadId,
                pageNo: ang.angNumber,
                source: { english: 'Sri Guru Granth Sahib Ji' },
                raag: { english: lines[0]?.raag || '' },
                writer: { english: lines[0]?.writer || '' }
            },
            verses: lines.map(l => ({
                verseId: l.id,
                shabadId: l.shabadId,
                pageNo: l.ang,
                verse: { unicode: l.gurmukhi },
                larivaar: { unicode: l.larivaar },
                translation: {
                    en: { bdb: l.translation?.en || '' },
                    pu: { ss: { unicode: l.translation?.pu || '' } }
                },
                transliteration: {
                    english: l.transliteration?.en || '',
                    hindi: l.transliteration?.hi || ''
                }
            })),
            count: lines.length
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // HUKAMNAMA — 24 HOUR CACHE
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get today's Hukamnama — cached for 24 hours
     * @returns {Object} Hukamnama data
     */
    async getHukamnama() {
        const today = new Date();
        const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // 1. Check cache
        const cached = await this._get('hukamnama', dateKey);
        if (cached && cached.data) {
            const age = Date.now() - cached.fetchedAt;
            const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

            if (age < TWENTY_FOUR_HOURS) {
                console.log(`📦 GurbaniDB: Hukamnama for ${dateKey} from cache (${Math.round(age / 3600000)}h old)`);
                return cached.data;
            }
        }

        // 2. Fetch fresh
        try {
            console.log(`🌐 GurbaniDB: Fetching Hukamnama for ${dateKey}...`);
            const data = await this._fetchJSON('/hukamnamas/today');

            // Cache it
            await this._put('hukamnama', {
                dateKey: dateKey,
                data: data,
                fetchedAt: Date.now()
            }).catch(() => {});

            return data;
        } catch (error) {
            // Offline — return whatever we have cached (even if expired)
            if (cached && cached.data) {
                console.log('📦 GurbaniDB: Returning expired Hukamnama (offline)');
                return cached.data;
            }

            // Try yesterday's
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
            const yesterdayCached = await this._get('hukamnama', yesterdayKey);
            if (yesterdayCached) {
                console.log('📦 GurbaniDB: Returning yesterday\'s Hukamnama (offline)');
                return yesterdayCached.data;
            }

            throw error;
        }
    }

    /**
     * Get Hukamnama by specific date
     */
    async getHukamnamaByDate(year, month, day) {
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Check cache
        const cached = await this._get('hukamnama', dateKey);
        if (cached && cached.data) {
            return cached.data;
        }

        // Fetch
        const url = `/hukamnamas/${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
        const data = await this._fetchJSON(url);

        await this._put('hukamnama', {
            dateKey,
            data,
            fetchedAt: Date.now()
        }).catch(() => {});

        return data;
    }

    // ═══════════════════════════════════════════════════════════════
    // SEARCH — OFFLINE FIRST-LETTER SEARCH
    // ═══════════════════════════════════════════════════════════════

    /**
     * Gurmukhi matras (vowel signs) to strip for first-letter extraction
     */
    static GURMUKHI_MATRAS = /[\u0A3E-\u0A4C\u0A3C\u0A4D\u0A70\u0A71]/g;

    /**
     * Extract first letters from Gurmukhi text
     */
    static extractFirstLetters(text) {
        if (!text) return '';
        const words = text.trim().split(/\s+/);
        let result = '';
        for (const word of words) {
            if (!word) continue;
            let firstChar = word[0];
            if (/[\u0A00-\u0A7F]/.test(firstChar)) {
                let baseChar = firstChar.replace(GurbaniDB.GURMUKHI_MATRAS, '');
                if (baseChar) result += baseChar;
            }
        }
        return result;
    }

    /**
     * Search Gurbani — OFFLINE first-letter search
     * @param {string} query - First letters in Gurmukhi
     * @param {number} searchType - 0 = first letter (only supported offline)
     * @returns {Object} Search results in BaniDB format
     */
    async search(query, searchType = 0) {
        if (!query || query.trim().length < 2) return { verses: [], resultsInfo: { totalResults: 0 } };

        const trimmedQuery = query.trim();

        // Try local search first
        const indexCount = await this._count('search_index');
        if (indexCount > 0 && searchType === 0) {
            console.log(`🔍 GurbaniDB: Local search for "${trimmedQuery}"...`);
            return await this._localFirstLetterSearch(trimmedQuery);
        }

        // Fallback to API
        console.log(`🌐 GurbaniDB: API search for "${trimmedQuery}"...`);
        const data = await this._fetchJSON(`/search/${encodeURIComponent(trimmedQuery)}?searchtype=0&source=G`);
        return data;
    }

    /**
     * Perform local first-letter search using IndexedDB cursor
     */
    async _localFirstLetterSearch(query) {
        const db = await this._getDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction('search_index', 'readonly');
            const store = tx.objectStore('search_index');
            const index = store.index('firstLetters');

            // We need to find entries where firstLetters starts with the query
            const range = IDBKeyRange.bound(query, query + '\uffff', false, false);
            const results = [];
            const MAX_RESULTS = 50;

            const cursorReq = index.openCursor(range);

            cursorReq.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < MAX_RESULTS) {
                    const entry = cursor.value;
                    results.push({
                        verseId: entry.verseId,
                        shabadId: entry.shabadId,
                        pageNo: entry.angNumber,
                        verse: { unicode: entry.gurmukhi },
                        translation: { en: { bdb: entry.translation } },
                        transliteration: { en: entry.transliteration || '' },
                        raag: { english: entry.raag || '' },
                        writer: { english: entry.writer || '' }
                    });
                    cursor.continue();
                } else {
                    console.log(`🔍 GurbaniDB: Found ${results.length} local results`);
                    resolve({
                        verses: results,
                        resultsInfo: {
                            totalResults: results.length,
                            pages: { totalPages: 1 }
                        }
                    });
                }
            };

            cursorReq.onerror = () => {
                console.warn('Local search failed, should fallback to API');
                reject(cursorReq.error);
            };
        });
    }

    /**
     * Index an Ang's lines for search
     */
    async _indexAngForSearch(angData) {
        if (!angData || !angData.lines || angData.lines.length === 0) return;

        const entries = angData.lines
            .filter(l => l.gurmukhi && l.gurmukhi.length > 3)
            .map(line => {
                const firstLetters = GurbaniDB.extractFirstLetters(line.gurmukhi);
                if (!firstLetters || firstLetters.length < 2) return null;

                return {
                    firstLetters,
                    gurmukhi: line.gurmukhi,
                    verseId: line.id,
                    shabadId: line.shabadId,
                    angNumber: angData.angNumber,
                    translation: line.translation?.en || '',
                    transliteration: line.transliteration?.en || '',
                    raag: line.raag || '',
                    writer: line.writer || ''
                };
            })
            .filter(Boolean);

        if (entries.length > 0) {
            await this._putBatch('search_index', entries);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // TRANSLATION EXTRACTION
    // ═══════════════════════════════════════════════════════════════

    _extractTranslation(item, lang) {
        const trans = item.translation;
        if (!trans) return '';
        if (typeof trans === 'string') return trans;

        if (trans[lang]) {
            const langTrans = trans[lang];
            if (lang === 'en') {
                return langTrans.bdb || langTrans.ms || langTrans.ssk || (typeof langTrans === 'string' ? langTrans : '');
            }
            if (lang === 'pu') {
                return langTrans.ss?.unicode || langTrans.bdb?.unicode || langTrans.ms?.unicode || (typeof langTrans === 'string' ? langTrans : '');
            }
            if (lang === 'hi') {
                return langTrans.ss || langTrans.sts || (typeof langTrans === 'string' ? langTrans : '');
            }
            if (typeof langTrans === 'string') return langTrans;
            if (langTrans.unicode) return langTrans.unicode;
        }

        if (trans.english && lang === 'en') return trans.english;
        if (trans.punjabi && lang === 'pu') return trans.punjabi;
        if (trans.hindi && lang === 'hi') return trans.hindi;

        return '';
    }

    // ═══════════════════════════════════════════════════════════════
    // HTTP UTILITY
    // ═══════════════════════════════════════════════════════════════

    async _fetchJSON(endpoint, retries = 3) {
        const url = `${GurbaniDB.API_BASE}${endpoint}`;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, {
                    headers: { 'Accept': 'application/json' }
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            } catch (error) {
                if (attempt === retries) {
                    // Dual-API fallback: try GurbaniNow if BaniDB is down
                    const fallback = await this._tryGurbaniNowFallback(endpoint);
                    if (fallback) return fallback;
                    throw error;
                }
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }

    /**
     * GurbaniNow API fallback — used if BaniDB is unreachable
     * @param {string} endpoint - The BaniDB endpoint that failed
     * @returns {Object|null} Data from GurbaniNow, or null
     */
    async _tryGurbaniNowFallback(endpoint) {
        const GURBANINOW_BASE = 'https://api.gurbaninow.com/v2';

        try {
            // Map BaniDB endpoints to GurbaniNow equivalents
            if (endpoint.startsWith('/hukamnamas/today')) {
                const response = await fetch(`${GURBANINOW_BASE}/hukamnama/today`);
                if (response.ok) {
                    console.log('🔄 GurbaniDB: BaniDB down → using GurbaniNow fallback for Hukamnama');
                    return response.json();
                }
            }

            if (endpoint.startsWith('/shabads/')) {
                const shabadId = endpoint.split('/shabads/')[1];
                if (shabadId) {
                    const response = await fetch(`${GURBANINOW_BASE}/shabad/${shabadId}`);
                    if (response.ok) {
                        console.log(`🔄 GurbaniDB: BaniDB down → using GurbaniNow fallback for Shabad ${shabadId}`);
                        return response.json();
                    }
                }
            }

            if (endpoint.startsWith('/search/')) {
                const searchPart = endpoint.split('/search/')[1];
                if (searchPart) {
                    const response = await fetch(`${GURBANINOW_BASE}/search/${searchPart}`);
                    if (response.ok) {
                        console.log('🔄 GurbaniDB: BaniDB down → using GurbaniNow fallback for search');
                        return response.json();
                    }
                }
            }
        } catch (e) {
            console.warn('🔄 GurbaniDB: GurbaniNow fallback also failed:', e.message);
        }

        return null;
    }

    // ═══════════════════════════════════════════════════════════════
    // HYDRATION STATUS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get hydration status
     */
    async getHydrationStatus() {
        const angCount = await this._count('angs');
        const baniCount = await this._count('banis');
        const searchCount = await this._count('search_index');
        const meta = await this._get('meta', 'hydration_status');

        return {
            angsDownloaded: angCount,
            angsTotal: 1430,
            angsPercent: ((angCount / 1430) * 100).toFixed(1),
            banisDownloaded: baniCount,
            searchIndexSize: searchCount,
            isFullyHydrated: angCount >= 1430,
            isPartiallyHydrated: angCount > 0,
            lastSyncAt: meta?.lastSyncAt || null,
            status: meta?.status || 'not_started'
        };
    }

    /**
     * Set hydration metadata
     */
    async setHydrationMeta(key, value) {
        await this._put('meta', { key, ...value });
    }

    /**
     * Clear all Gurbani data (for re-download)
     */
    async clearAllData() {
        await this._clear('angs');
        await this._clear('banis');
        await this._clear('shabads');
        await this._clear('search_index');
        await this._clear('hukamnama');
        await this._clear('meta');
        console.log('🗑️ GurbaniDB: All data cleared');
    }

    /**
     * Get estimated storage size in MB
     */
    async getStorageSize() {
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                return {
                    usedMB: (estimate.usage / (1024 * 1024)).toFixed(1),
                    quotaMB: (estimate.quota / (1024 * 1024)).toFixed(0),
                    percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(1)
                };
            }
        } catch (e) {
            console.warn('Storage estimate not available');
        }
        return { usedMB: '?', quotaMB: '?', percentUsed: '?' };
    }
    // ═══════════════════════════════════════════════════════════════
    // SMART BACKGROUND PRE-CACHING
    // ═══════════════════════════════════════════════════════════════

    /**
     * Check if a specific Bani is already cached in IndexedDB (no fetch)
     * @param {number} baniId
     * @returns {boolean}
     */
    async isBaniCached(baniId) {
        try {
            const cached = await this._get('banis', baniId);
            return cached !== null;
        } catch (e) {
            return false;
        }
    }

    /**
     * Background pre-cache a list of Banis silently (fire-and-forget).
     * Only fetches ones that are not already cached. Prioritizes the first IDs.
     * @param {number[]} baniIds - Array of Bani IDs to pre-cache
     * @param {function} [onProgress] - Optional: called with (cached, total, baniId)
     */
    async preCacheBanis(baniIds, onProgress) {
        if (!baniIds || baniIds.length === 0) return;

        console.log(`🔄 GurbaniDB: Background pre-caching ${baniIds.length} Banis...`);
        let cached = 0;

        for (const baniId of baniIds) {
            try {
                const alreadyCached = await this.isBaniCached(baniId);
                if (alreadyCached) {
                    cached++;
                    if (onProgress) onProgress(cached, baniIds.length, baniId, 'cached');
                    continue;
                }

                // Fetch and auto-cache (getBani already stores to IndexedDB)
                await this.getBani(baniId);
                cached++;
                console.log(`✅ GurbaniDB: Pre-cached Bani ${baniId} (${cached}/${baniIds.length})`);
                if (onProgress) onProgress(cached, baniIds.length, baniId, 'downloaded');

                // Small pause between fetches to avoid overwhelming the API
                await new Promise(r => setTimeout(r, 300));
            } catch (e) {
                console.warn(`⚠️ GurbaniDB: Failed to pre-cache Bani ${baniId}:`, e.message);
                if (onProgress) onProgress(cached, baniIds.length, baniId, 'error');
            }
        }

        console.log(`✅ GurbaniDB: Pre-cache complete. ${cached}/${baniIds.length} Banis ready.`);
        return cached;
    }

    /**
     * Pre-cache all Banis saved in the user's My Pothi (silently in background)
     */
    async preCachePothiBanis() {
        try {
            const pothiOrder = JSON.parse(localStorage.getItem('anhad_my_pothi') || '[]');
            if (pothiOrder.length === 0) return;
            console.log(`📖 GurbaniDB: Pre-caching ${pothiOrder.length} My Pothi Banis in background...`);
            // Fire and forget — don't block page load
            this.preCacheBanis(pothiOrder).catch(e => console.warn('Pothi pre-cache failed:', e));
        } catch (e) {
            console.warn('preCachePothiBanis error:', e);
        }
    }

    /**
     * Get a summary of what's currently cached in IndexedDB
     * @returns {Object} { baniIds: number[], baniCount: number, angCount: number, usedMB: string }
     */
    async getCacheStats() {
        try {
            const allBanis = await this._getAll('banis');
            const angCount = await this._count('angs');
            const storageInfo = await this.getStorageSize();

            return {
                baniIds: allBanis.map(b => b.id),
                baniCount: allBanis.length,
                angCount,
                ...storageInfo
            };
        } catch (e) {
            return { baniIds: [], baniCount: 0, angCount: 0, usedMB: '?', quotaMB: '?', percentUsed: '?' };
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL EXPORT
// ═══════════════════════════════════════════════════════════════

window.GurbaniDB = GurbaniDB;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GurbaniDB;
}
