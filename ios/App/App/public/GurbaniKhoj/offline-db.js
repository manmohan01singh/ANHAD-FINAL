/**
 * GURBANI KHOJ - OFFLINE DATABASE MODULE
 * IndexedDB-based offline storage for Gurbani verses
 * Enables instant, offline search without internet dependency
 */

const OfflineDB = {
    dbName: 'GurbaniKhojDB',
    dbVersion: 1,
    db: null,
    isReady: false,
    totalVerses: 0,
    
    /**
     * Initialize IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('IndexedDB init failed:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                this.isReady = true;
                this.updateTotalCount();
                console.log('✓ Offline DB initialized');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create verses store
                if (!db.objectStoreNames.contains('verses')) {
                    const verseStore = db.createObjectStore('verses', { keyPath: 'verseId' });
                    verseStore.createIndex('shabadId', 'shabadId', { unique: false });
                    verseStore.createIndex('source', 'source', { unique: false });
                    verseStore.createIndex('gurmukhi', 'gurmukhi', { unique: false });
                    verseStore.createIndex('firstLetters', 'firstLetters', { unique: false });
                    verseStore.createIndex('ang', 'ang', { unique: false });
                }
                
                // Create metadata store
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
                
                console.log('IndexedDB schema created');
            };
        });
    },
    
    /**
     * Add verses to offline cache
     */
    async addVerses(verses) {
        if (!this.isReady || !verses || verses.length === 0) return;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['verses'], 'readwrite');
            const store = transaction.objectStore('verses');
            let added = 0;
            
            verses.forEach(verse => {
                const verseData = this.normalizeVerse(verse);
                if (verseData) {
                    const request = store.put(verseData);
                    request.onsuccess = () => added++;
                }
            });
            
            transaction.oncomplete = () => {
                this.updateTotalCount();
                console.log(`✓ Added ${added} verses to offline DB`);
                resolve(added);
            };
            
            transaction.onerror = () => {
                console.error('Failed to add verses:', transaction.error);
                reject(transaction.error);
            };
        });
    },
    
    /**
     * Normalize verse data for storage
     */
    normalizeVerse(verse) {
        try {
            const verseId = verse.verseId || verse.verseID || verse.verse?.verseId || '';
            const shabadId = verse.shabadId || verse.shabadID || verse.shabad?.shabadId || '';
            
            if (!verseId) return null;
            
            const gurmukhi = verse.verse?.unicode || verse.verse?.gurmukhi || verse.gurmukhi || '';
            const firstLetters = this.extractFirstLetters(gurmukhi);
            
            return {
                verseId: String(verseId),
                shabadId: String(shabadId),
                gurmukhi: gurmukhi,
                firstLetters: firstLetters,
                ang: verse.verse?.pageNo || verse.pageNo || verse.ang || 0,
                source: verse._source?.id || 'G',
                sourceName: verse._source?.name || 'Sri Guru Granth Sahib Ji',
                raag: verse.verse?.raag?.unicode || verse.verse?.raag?.gurmukhi || verse.raag?.unicode || verse.raag?.gurmukhi || '',
                raagEnglish: verse.verse?.raag?.english || verse.raag?.english || '',
                writer: verse.verse?.writer?.unicode || verse.verse?.writer?.gurmukhi || verse.writer?.unicode || verse.writer?.gurmukhi || '',
                writerEnglish: verse.verse?.writer?.english || verse.writer?.english || '',
                timestamp: Date.now()
            };
        } catch (e) {
            console.error('Error normalizing verse:', e);
            return null;
        }
    },
    
    /**
     * Extract first letters for searching
     */
    extractFirstLetters(text) {
        if (!text) return '';
        
        const words = text.trim().split(/\s+/);
        let result = '';
        
        for (const word of words) {
            if (!word) continue;
            const firstChar = word[0];
            
            // Strip matras to get base consonant
            if (/[\u0A00-\u0A7F]/.test(firstChar)) {
                let baseChar = firstChar.replace(/[\u0A3E-\u0A4C\u0A3C\u0A4D\u0A70\u0A71]/g, '');
                
                // Normalize vowels
                if (baseChar === 'ਉ' || baseChar === 'ਊ') baseChar = 'ੳ';
                if (baseChar === 'ਇ' || baseChar === 'ਈ' || baseChar === 'ਏ') baseChar = 'ੲ';
                if (/[ਅਆਐਓਔ]/.test(baseChar)) baseChar = 'ਅ';
                
                if (baseChar) result += baseChar;
            }
        }
        
        return result;
    },
    
    /**
     * Search offline database
     */
    async search(query, searchType = 1, source = 'all') {
        if (!this.isReady || !query) return { verses: [], totalResults: 0 };
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['verses'], 'readonly');
            const store = transaction.objectStore('verses');
            
            const results = [];
            const searchPattern = this.extractFirstLetters(query).toLowerCase();
            
            const request = store.openCursor();
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                
                if (cursor) {
                    const verse = cursor.value;
                    
                    // Source filter using normalized source mapping
                    const normSource = typeof normalizeSourceFilter === 'function' ? normalizeSourceFilter(source) : source;
                    if (normSource !== 'all' && verse.source !== normSource) {
                        cursor.continue();
                        return;
                    }
                    
                    // Search matching
                    let isMatch = false;
                    
                    if (searchType === 1) {
                        // First letter search
                        if (verse.firstLetters && verse.firstLetters.toLowerCase().includes(searchPattern)) {
                            isMatch = true;
                        }
                    } else {
                        // Full text search
                        if (verse.gurmukhi && verse.gurmukhi.toLowerCase().includes(query.toLowerCase())) {
                            isMatch = true;
                        }
                    }
                    
                    if (isMatch) {
                        results.push(this.denormalizeVerse(verse));
                    }
                    
                    cursor.continue();
                } else {
                    // Done iterating
                    console.log(`✓ Offline search found ${results.length} results`);
                    resolve({
                        verses: results,
                        totalResults: results.length,
                        fromCache: true
                    });
                }
            };
            
            request.onerror = () => {
                console.error('Search failed:', request.error);
                reject(request.error);
            };
        });
    },
    
    /**
     * Convert stored verse back to API format
     */
    denormalizeVerse(storedVerse) {
        const raagUnicode = typeof convertGurbaniAsciiToUnicode === 'function' ? convertGurbaniAsciiToUnicode(storedVerse.raag) : storedVerse.raag;
        const writerUnicode = typeof convertGurbaniAsciiToUnicode === 'function' ? convertGurbaniAsciiToUnicode(storedVerse.writer) : storedVerse.writer;
        return {
            verseId: storedVerse.verseId,
            shabadId: storedVerse.shabadId,
            verse: {
                unicode: storedVerse.gurmukhi,
                gurmukhi: storedVerse.gurmukhi,
                pageNo: storedVerse.ang,
                verseId: storedVerse.verseId,
                raag: {
                    unicode: raagUnicode,
                    gurmukhi: raagUnicode,
                    english: storedVerse.raagEnglish
                },
                writer: {
                    unicode: writerUnicode,
                    gurmukhi: writerUnicode,
                    english: storedVerse.writerEnglish
                }
            },
            gurmukhi: storedVerse.gurmukhi,
            pageNo: storedVerse.ang,
            ang: storedVerse.ang,
            _source: {
                id: storedVerse.source,
                name: storedVerse.sourceName
            },
            _fromCache: true
        };
    },
    
    /**
     * Update total verse count
     */
    async updateTotalCount() {
        if (!this.isReady) return;
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['verses'], 'readonly');
            const store = transaction.objectStore('verses');
            const request = store.count();
            
            request.onsuccess = () => {
                this.totalVerses = request.result;
                console.log(`📊 Offline DB has ${this.totalVerses} verses`);
                resolve(this.totalVerses);
            };
        });
    },
    
    /**
     * Get download progress
     */
    async getProgress() {
        await this.updateTotalCount();
        const target = 60000; // Approximate total verses in SGGS
        const progress = Math.min(100, Math.round((this.totalVerses / target) * 100));
        return { current: this.totalVerses, target, progress };
    },
    
    /**
     * Clear all offline data
     */
    async clearAll() {
        if (!this.isReady) return;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['verses'], 'readwrite');
            const store = transaction.objectStore('verses');
            const request = store.clear();
            
            request.onsuccess = () => {
                this.totalVerses = 0;
                console.log('✓ Offline DB cleared');
                resolve();
            };
            
            request.onerror = () => {
                console.error('Failed to clear DB:', request.error);
                reject(request.error);
            };
        });
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.OfflineDB = OfflineDB;
    OfflineDB.init().catch(err => {
        console.error('Failed to initialize offline DB:', err);
    });
}
