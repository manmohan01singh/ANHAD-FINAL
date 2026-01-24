/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * STORAGE SERVICE
 * Handles all local storage operations with fallback support
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class StorageService {
    constructor(namespace = 'sehajPaath') {
        this.namespace = namespace;
        this.dbName = `${namespace}DB`;
        this.dbVersion = 1;
        this.db = null;

        this.initIndexedDB();
    }

    /**
     * Initialize IndexedDB
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn('IndexedDB not supported, falling back to localStorage');
                resolve(null);
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.warn('IndexedDB failed, falling back to localStorage');
                resolve(null);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('state')) {
                    db.createObjectStore('state', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('bookmarks')) {
                    db.createObjectStore('bookmarks', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('notes')) {
                    db.createObjectStore('notes', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('history')) {
                    db.createObjectStore('history', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('cache')) {
                    db.createObjectStore('cache', { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * Get prefixed key for localStorage
     */
    getKey(key) {
        return `${this.namespace}_${key}`;
    }

    /**
     * Save data to storage
     */
    async set(key, value) {
        try {
            // Try IndexedDB first
            if (this.db) {
                await this.setIndexedDB('state', { key, value, timestamp: Date.now() });
            }

            // Also save to localStorage as backup
            localStorage.setItem(this.getKey(key), JSON.stringify(value));

            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    /**
     * Get data from storage
     */
    async get(key, defaultValue = null) {
        try {
            // Try IndexedDB first
            if (this.db) {
                const result = await this.getIndexedDB('state', key);
                if (result) return result.value;
            }

            // Fallback to localStorage
            const stored = localStorage.getItem(this.getKey(key));
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    /**
     * Remove data from storage
     */
    async remove(key) {
        try {
            if (this.db) {
                await this.deleteIndexedDB('state', key);
            }
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    /**
     * IndexedDB helpers
     */
    async setIndexedDB(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async getIndexedDB(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteIndexedDB(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllIndexedDB(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Bookmarks Management
     */
    async saveBookmark(bookmark) {
        const bookmarks = await this.getBookmarks();
        const existingIndex = bookmarks.findIndex(b => b.id === bookmark.id);

        if (existingIndex >= 0) {
            bookmarks[existingIndex] = bookmark;
        } else {
            bookmarks.push(bookmark);
        }

        await this.set('bookmarks', bookmarks);
        return bookmark;
    }

    async getBookmarks() {
        return await this.get('bookmarks', []);
    }

    async deleteBookmark(id) {
        const bookmarks = await this.getBookmarks();
        const filtered = bookmarks.filter(b => b.id !== id);
        await this.set('bookmarks', filtered);
        return true;
    }

    /**
     * Notes Management
     */
    async saveNote(note) {
        const notes = await this.getNotes();
        const existingIndex = notes.findIndex(n => n.id === note.id);

        if (existingIndex >= 0) {
            notes[existingIndex] = note;
        } else {
            notes.push(note);
        }

        await this.set('notes', notes);
        return note;
    }

    async getNotes() {
        return await this.get('notes', []);
    }

    async deleteNote(id) {
        const notes = await this.getNotes();
        const filtered = notes.filter(n => n.id !== id);
        await this.set('notes', filtered);
        return true;
    }

    /**
     * Reading History
     */
    async addHistoryEntry(entry) {
        const history = await this.getHistory();
        history.unshift({
            ...entry,
            timestamp: Date.now()
        });

        // Keep only last 100 entries
        const trimmed = history.slice(0, 100);
        await this.set('history', trimmed);
        return entry;
    }

    async getHistory() {
        return await this.get('history', []);
    }

    async clearHistory() {
        await this.set('history', []);
        return true;
    }

    /**
     * Clear all data
     */
    async clearAll() {
        try {
            // Clear localStorage
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.namespace))
                .forEach(key => localStorage.removeItem(key));

            // Clear IndexedDB
            if (this.db) {
                const storeNames = Array.from(this.db.objectStoreNames);
                for (const storeName of storeNames) {
                    const transaction = this.db.transaction([storeName], 'readwrite');
                    transaction.objectStore(storeName).clear();
                }
            }

            return true;
        } catch (error) {
            console.error('Clear all error:', error);
            return false;
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageService;
}
