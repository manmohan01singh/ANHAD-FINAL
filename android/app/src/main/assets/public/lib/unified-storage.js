/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GURBANI RADIO - UNIFIED STORAGE SYSTEM v2.0
 * Centralized IndexedDB + localStorage storage system for all modules
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This is the ONLY storage system that should be used across all modules.
 * Features:
 * - IndexedDB as primary storage (persistent, large capacity)
 * - localStorage as fallback and for quick access
 * - Data versioning and migration
 * - Cross-module synchronization
 * - Offline-first approach
 */

(function () {
    'use strict';

    const DB_NAME = 'GurbaniRadioDB';
    const DB_VERSION = 3; // Bumped for new stores

    // Define all object stores (tables)
    const STORES = {
        REMINDERS: 'reminders',           // Smart Reminders data
        NITNEM_TRACKER: 'nitnemTracker',  // Nitnem Tracker data
        SEHAJ_PAATH: 'sehajPaath',        // Sehaj Paath progress
        NOTES: 'notes',                    // Notes data
        SETTINGS: 'settings',              // App settings
        CACHE: 'cache',                    // API cache (Angs, Hukamnama)
        ACHIEVEMENTS: 'achievements',      // Unlocked achievements
        SYNC: 'sync',                      // Cross-module sync data
        PREFERENCES: 'preferences',        // User preferences store
        TRACKER_DATA: 'trackerData',       // Tracker data store
        NAAM_ABHYAS_SESSIONS: 'naamAbhyasSessions', // NaamAbhyas sessions
        BOOKMARKS: 'bookmarks',            // Bookmarks store
        READING_PROGRESS: 'readingProgress' // Reading progress
    };

    // Storage keys for localStorage (quick access)
    const LS_KEYS = {
        LAST_SYNC: 'gurbani_lastSync',
        USER_SETTINGS: 'gurbani_userSettings',
        OFFLINE_QUEUE: 'gurbani_offlineQueue'
    };

    /**
     * UnifiedStorage - Enhanced IndexedDB Storage Class
     */
    class UnifiedStorage {
        constructor() {
            this.dbName = DB_NAME;
            this.dbVersion = DB_VERSION;
            this.db = null;
            this.isReady = false;
            this.readyPromise = null;
            this.stores = STORES;
            this.listeners = new Map();
        }

        /**
         * Initialize the database
         * @returns {Promise<boolean>}
         */
        async init() {
            if (this.isReady) return true;
            if (this.readyPromise) return this.readyPromise;

            this.readyPromise = new Promise((resolve, reject) => {
                if (!window.indexedDB) {
                    console.warn('IndexedDB not supported, using localStorage fallback');
                    this.isReady = true;
                    resolve(true);
                    return;
                }

                const request = indexedDB.open(DB_NAME, DB_VERSION);
                let needsMigration = false;

                request.onerror = (event) => {
                    console.error('IndexedDB error:', event.target.error);
                    this.isReady = true; // Still mark as ready, will use fallback
                    resolve(true);
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    this.isReady = true;
                    console.log('UnifiedStorage: IndexedDB initialized successfully');
                    // Run async migration AFTER the upgrade transaction is fully closed
                    if (needsMigration) {
                        this._migrateFromLocalStorage();
                    }
                    resolve(true);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    const oldVersion = event.oldVersion;

                    console.log(`UnifiedStorage: Upgrading from v${oldVersion} to v${DB_VERSION}`);

                    // Create all stores if they don't exist
                    Object.values(STORES).forEach(storeName => {
                        if (!db.objectStoreNames.contains(storeName)) {
                            const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: false });
                            store.createIndex('timestamp', 'timestamp', { unique: false });
                            store.createIndex('type', 'type', { unique: false });

                            // Add specific indexes for certain stores
                            if (storeName === 'trackerData') {
                                store.createIndex('month', 'month', { unique: false });
                            }
                            if (storeName === 'naamAbhyasSessions') {
                                store.createIndex('date', 'date', { unique: false });
                            }
                            if (storeName === 'notes') {
                                store.createIndex('verseId', 'verseId', { unique: false });
                            }
                        }
                    });

                    // Flag migration for after the transaction closes (cannot await inside onupgradeneeded)
                    if (oldVersion < 2) {
                        needsMigration = true;
                    }
                };
            });

            return this.readyPromise;
        }

        /**
         * Ensure database is ready before operations
         */
        async ensureDB() {
            if (!this.db) {
                await this.init();
            }
        }

        /**
         * Migrate data from localStorage to IndexedDB
         */
        async _migrateFromLocalStorage() {
            const migrationKeys = [
                { lsKey: 'smart_reminders_v1', store: STORES.REMINDERS, id: 'reminders_data' },
                { lsKey: 'nitnemTracker_userData', store: STORES.NITNEM_TRACKER, id: 'user_data' },
                { lsKey: 'nitnemTracker_settings', store: STORES.NITNEM_TRACKER, id: 'settings' },
                { lsKey: 'sehajPaath_progress', store: STORES.SEHAJ_PAATH, id: 'progress' },
                { lsKey: 'gurbani_notes_v2', store: STORES.NOTES, id: 'notes_data' },
                { lsKey: 'naamAbhyas_sessions', store: STORES.NAAM_ABHYAS_SESSIONS, id: 'sessions' },
                { lsKey: 'gurbani_bookmarks', store: STORES.BOOKMARKS, id: 'bookmarks' }
            ];

            for (const { lsKey, store, id } of migrationKeys) {
                try {
                    const data = localStorage.getItem(lsKey);
                    if (data) {
                        const parsed = JSON.parse(data);
                        await this.save(store, { id, ...parsed });
                        console.log(`Migrated ${lsKey} to IndexedDB`);
                    }
                } catch (e) {
                    console.warn(`Migration failed for ${lsKey}:`, e);
                }
            }
        }

        /**
         * Save a value to a store
         * @param {string} storeName - Name of the object store
         * @param {object} data - Data to store (must have 'id' or will use 'key' property)
         * @returns {Promise<any>}
         */
        async save(storeName, data) {
            await this.ensureDB();

            // Ensure data has an id
            if (!data.id && data.key) {
                data.id = data.key;
            }

            const record = {
                ...data,
                timestamp: Date.now(),
                version: DB_VERSION
            };

            // Always save to localStorage as backup
            try {
                const lsKey = `gurbani_${storeName}_${data.id}`;
                localStorage.setItem(lsKey, JSON.stringify(record));
            } catch (e) {
                console.warn('localStorage backup failed:', e);
            }

            // Save to IndexedDB
            if (!this.db) return data.id;

            return new Promise((resolve, reject) => {
                try {
                    const transaction = this.db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.put(record);

                    request.onsuccess = () => {
                        this._notifyListeners(storeName, data.id, data);
                        resolve(request.result);
                    };

                    request.onerror = () => {
                        console.error('IndexedDB save error:', request.error);
                        resolve(data.id); // Still succeed since localStorage worked
                    };
                } catch (e) {
                    console.error('Transaction error:', e);
                    resolve(data.id);
                }
            });
        }

        /**
         * Set a value in a store (alias for save with key-value style)
         * @param {string} storeName - Name of the object store
         * @param {string} key - Key for the data
         * @param {any} value - Value to store
         * @returns {Promise<boolean>}
         */
        async set(storeName, key, value) {
            const record = {
                id: key,
                data: value,
                timestamp: Date.now(),
                version: DB_VERSION
            };

            await this.ensureDB();

            // Always save to localStorage as backup
            try {
                const lsKey = `gurbani_${storeName}_${key}`;
                localStorage.setItem(lsKey, JSON.stringify(record));
            } catch (e) {
                console.warn('localStorage backup failed:', e);
            }

            // Save to IndexedDB
            if (!this.db) return true;

            return new Promise((resolve, reject) => {
                try {
                    const transaction = this.db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.put(record);

                    request.onsuccess = () => {
                        this._notifyListeners(storeName, key, value);
                        resolve(true);
                    };

                    request.onerror = () => {
                        console.error('IndexedDB set error:', request.error);
                        resolve(true); // Still succeed since localStorage worked
                    };
                } catch (e) {
                    console.error('Transaction error:', e);
                    resolve(true);
                }
            });
        }

        /**
         * Get a value from a store
         * @param {string} storeName - Name of the object store
         * @param {string} key - Key for the data
         * @returns {Promise<any>}
         */
        async get(storeName, key) {
            await this.ensureDB();

            // Try IndexedDB first
            if (this.db) {
                try {
                    const result = await new Promise((resolve, reject) => {
                        const transaction = this.db.transaction(storeName, 'readonly');
                        const store = transaction.objectStore(storeName);
                        const request = store.get(key);

                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => reject(request.error);
                    });

                    if (result) {
                        return result.data !== undefined ? result.data : result;
                    }
                } catch (e) {
                    console.warn('IndexedDB get error:', e);
                }
            }

            // Fallback to localStorage
            try {
                const lsKey = `gurbani_${storeName}_${key}`;
                const data = localStorage.getItem(lsKey);
                if (data) {
                    const parsed = JSON.parse(data);
                    return parsed.data !== undefined ? parsed.data : parsed;
                }
            } catch (e) {
                console.warn('localStorage get error:', e);
            }

            return null;
        }

        /**
         * Get all items from a store
         * @param {string} storeName - Name of the object store
         * @returns {Promise<any[]>}
         */
        async getAll(storeName) {
            await this.ensureDB();

            if (!this.db) {
                // Fallback: scan localStorage
                const items = [];
                const prefix = `gurbani_${storeName}_`;
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(prefix)) {
                        try {
                            const data = JSON.parse(localStorage.getItem(key));
                            items.push(data.data !== undefined ? data.data : data);
                        } catch (e) { }
                    }
                }
                return items;
            }

            return new Promise((resolve, reject) => {
                try {
                    const transaction = this.db.transaction(storeName, 'readonly');
                    const store = transaction.objectStore(storeName);
                    const request = store.getAll();

                    request.onsuccess = () => {
                        const results = request.result || [];
                        resolve(results.map(r => r.data !== undefined ? r.data : r));
                    };

                    request.onerror = () => {
                        console.error('IndexedDB getAll error:', request.error);
                        resolve([]);
                    };
                } catch (e) {
                    console.error('Transaction error:', e);
                    resolve([]);
                }
            });
        }

        /**
         * Delete an item from a store
         * @param {string} storeName - Name of the object store
         * @param {string} key - Key to delete
         * @returns {Promise<void>}
         */
        async delete(storeName, key) {
            await this.ensureDB();

            // Remove from localStorage
            try {
                const lsKey = `gurbani_${storeName}_${key}`;
                localStorage.removeItem(lsKey);
            } catch (e) { }

            if (!this.db) return;

            return new Promise((resolve) => {
                try {
                    const transaction = this.db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.delete(key);

                    request.onsuccess = () => resolve();
                    request.onerror = () => resolve();
                } catch (e) {
                    resolve();
                }
            });
        }

        /**
         * Clear all items from a store
         * @param {string} storeName - Name of the object store
         * @returns {Promise<boolean>}
         */
        async clear(storeName) {
            await this.ensureDB();

            // Clear from localStorage
            const prefix = `gurbani_${storeName}_`;
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));

            if (!this.db) return true;

            return new Promise((resolve) => {
                try {
                    const transaction = this.db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.clear();

                    request.onsuccess = () => resolve(true);
                    request.onerror = () => resolve(true);
                } catch (e) {
                    resolve(true);
                }
            });
        }

        /**
         * Add a listener for store changes
         * @param {string} storeName - Store to listen to
         * @param {Function} callback - Callback function(key, value)
         */
        addListener(storeName, callback) {
            if (!this.listeners.has(storeName)) {
                this.listeners.set(storeName, new Set());
            }
            this.listeners.get(storeName).add(callback);
        }

        /**
         * Remove a listener
         */
        removeListener(storeName, callback) {
            if (this.listeners.has(storeName)) {
                this.listeners.get(storeName).delete(callback);
            }
        }

        /**
         * Notify listeners of changes
         */
        _notifyListeners(storeName, key, value) {
            if (this.listeners.has(storeName)) {
                this.listeners.get(storeName).forEach(cb => {
                    try {
                        cb(key, value);
                    } catch (e) {
                        console.error('Listener error:', e);
                    }
                });
            }
        }

        /**
         * Sync data between modules
         * Ensures Smart Reminders and Nitnem Tracker stay in sync
         */
        async syncBetweenModules() {
            const syncData = {
                timestamp: Date.now()
            };

            // Get reminder data for Nitnem Tracker
            const reminderData = await this.get(STORES.REMINDERS, 'reminders_data');
            if (reminderData) {
                syncData.reminders = reminderData;
                await this.set(STORES.SYNC, 'reminder_to_nitnem', {
                    alarms: reminderData.core || {},
                    custom: reminderData.custom || [],
                    lastSync: Date.now()
                });
            }

            // Get Nitnem completion data for Smart Reminders
            const nitnemData = await this.get(STORES.NITNEM_TRACKER, 'user_data');
            if (nitnemData) {
                syncData.nitnem = nitnemData;
                await this.set(STORES.SYNC, 'nitnem_to_reminder', {
                    completions: nitnemData.completions || {},
                    streaks: nitnemData.streaks || {},
                    lastSync: Date.now()
                });
            }

            // Update last sync time
            localStorage.setItem(LS_KEYS.LAST_SYNC, Date.now().toString());

            return syncData;
        }

        /**
         * Get sync data for a specific module
         */
        async getSyncDataFor(moduleName) {
            if (moduleName === 'nitnem') {
                return await this.get(STORES.SYNC, 'reminder_to_nitnem');
            } else if (moduleName === 'reminder') {
                return await this.get(STORES.SYNC, 'nitnem_to_reminder');
            }
            return null;
        }

        /**
         * Cache API data (for offline use)
         */
        async cacheApiData(cacheKey, data, ttlMs = 24 * 60 * 60 * 1000) {
            await this.set(STORES.CACHE, cacheKey, {
                data: data,
                cachedAt: Date.now(),
                expiresAt: Date.now() + ttlMs
            });
        }

        /**
         * Get cached API data
         */
        async getCachedApiData(cacheKey) {
            const cached = await this.get(STORES.CACHE, cacheKey);
            if (!cached) return null;

            // Check if expired
            if (cached.expiresAt && Date.now() > cached.expiresAt) {
                await this.delete(STORES.CACHE, cacheKey);
                return null;
            }

            return cached.data;
        }

        /**
         * Export all data for backup
         */
        async exportAllData() {
            const exportData = {
                exportedAt: new Date().toISOString(),
                version: DB_VERSION,
                stores: {}
            };

            for (const storeName of Object.values(STORES)) {
                exportData.stores[storeName] = await this.getAll(storeName);
            }

            return exportData;
        }

        /**
         * Import data from backup
         */
        async importData(importData) {
            if (!importData || !importData.stores) {
                throw new Error('Invalid import data format');
            }

            for (const [storeName, items] of Object.entries(importData.stores)) {
                if (STORES[storeName.toUpperCase()] || Object.values(STORES).includes(storeName)) {
                    for (const item of items) {
                        if (item && item.id !== undefined) {
                            await this.set(storeName, item.id, item);
                        }
                    }
                }
            }

            return true;
        }

        // ═══════════════════════════════════════════════════════════════════════
        // SIMPLE LOCALSTORAGE HELPERS (Fallback for quick access)
        // ═══════════════════════════════════════════════════════════════════════

        /**
         * Set a value in localStorage
         */
        setLocal(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('localStorage save failed:', e);
                return false;
            }
        }

        /**
         * Get a value from localStorage
         */
        getLocal(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                return defaultValue;
            }
        }

        /**
         * Remove a value from localStorage
         */
        removeLocal(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                return false;
            }
        }
    }

    /**
     * SimpleStorage - Quick localStorage wrapper for simple key-value storage
     * Use for small, frequently accessed data
     */
    const SimpleStorage = {
        set(key, value) {
            try {
                localStorage.setItem(`gurbani_${key}`, JSON.stringify({
                    data: value,
                    timestamp: Date.now()
                }));
                return true;
            } catch (e) {
                console.warn('SimpleStorage set error:', e);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(`gurbani_${key}`);
                if (item) {
                    const parsed = JSON.parse(item);
                    return parsed.data;
                }
            } catch (e) {
                console.warn('SimpleStorage get error:', e);
            }
            return defaultValue;
        },

        remove(key) {
            try {
                localStorage.removeItem(`gurbani_${key}`);
                return true;
            } catch (e) {
                return false;
            }
        },

        // Get with timestamp info
        getWithMeta(key) {
            try {
                const item = localStorage.getItem(`gurbani_${key}`);
                if (item) {
                    return JSON.parse(item);
                }
            } catch (e) { }
            return null;
        }
    };

    // Create singleton instance
    const unifiedStorage = new UnifiedStorage();

    // Auto-initialize
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => unifiedStorage.init());
        } else {
            unifiedStorage.init();
        }
    }

    // Export to window (multiple names for compatibility)
    window.unifiedStorage = unifiedStorage;
    window.GurbaniStorage = unifiedStorage;
    window.UnifiedStorage = UnifiedStorage;
    window.SimpleStorage = SimpleStorage;
    window.GURBANI_STORES = STORES;

    // Also support module exports
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { UnifiedStorage, GurbaniStorage: unifiedStorage, SimpleStorage, STORES };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // OFFLINE QUEUE FLUSH - Retry queued actions when coming online
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Flush the offline queue - retry queued actions
     */
    function flushOfflineQueue() {
        try {
            const queue = JSON.parse(localStorage.getItem(LS_KEYS.OFFLINE_QUEUE) || '[]');
            if (queue.length === 0) return;

            console.log(`[UnifiedStorage] Flushing ${queue.length} queued actions`);

            // Process each queued action
            const remaining = [];
            for (const action of queue) {
                try {
                    // Attempt to replay the action - modules should listen for this event
                    window.dispatchEvent(new CustomEvent('offlineQueueFlush', {
                        detail: action
                    }));
                } catch (e) {
                    // If failed, keep in queue for next attempt
                    remaining.push(action);
                }
            }

            // Update queue with remaining items
            if (remaining.length > 0) {
                localStorage.setItem(LS_KEYS.OFFLINE_QUEUE, JSON.stringify(remaining));
                console.log(`[UnifiedStorage] ${remaining.length} actions remain in queue`);
            } else {
                localStorage.removeItem(LS_KEYS.OFFLINE_QUEUE);
                console.log('[UnifiedStorage] Queue cleared');
            }
        } catch (e) {
            console.error('[UnifiedStorage] Error flushing offline queue:', e);
        }
    }

    // Listen for online event to flush queue
    window.addEventListener('online', () => {
        console.log('[UnifiedStorage] Device is online - flushing offline queue');
        flushOfflineQueue();
    });

    // Expose flush function globally
    window.flushOfflineQueue = flushOfflineQueue;

})();
