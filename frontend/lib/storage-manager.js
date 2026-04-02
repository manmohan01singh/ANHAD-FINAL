/**
 * Storage Manager with Quota Monitoring
 * 
 * Prevents QuotaExceededError on Android WebView by:
 * 1. Monitoring localStorage quota using navigator.storage.estimate()
 * 2. Automatically falling back to IndexedDB when approaching quota (80% threshold)
 * 3. Handling QuotaExceededError gracefully
 * 4. Providing unified API: set(key, value) and get(key)
 * 
 * Bug Condition: size > 5MB
 * Expected Behavior: Quota monitoring with IndexedDB fallback
 * Preservation: Data persistence patterns (Req 3.6)
 * Requirements: 1.19, 2.19
 */

class StorageManager {
  constructor() {
    this.dbName = 'AnhadStorage';
    this.dbVersion = 1;
    this.storeName = 'keyValueStore';
    this.db = null;
  }

  /**
   * Get current storage quota information
   * @returns {Promise<{usage: number, quota: number}>}
   */
  async getQuota() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        return await navigator.storage.estimate();
      } catch (e) {
        console.warn('Failed to estimate storage quota:', e);
      }
    }
    // Default fallback: 5MB quota (typical Android WebView limit)
    return { usage: 0, quota: 5 * 1024 * 1024 };
  }

  /**
   * Initialize IndexedDB connection
   * @returns {Promise<IDBDatabase>}
   */
  async initIndexedDB() {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  /**
   * Set value in IndexedDB
   * @param {string} key
   * @param {any} value
   * @returns {Promise<void>}
   */
  async setIndexedDB(key, value) {
    const db = await this.initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to store ${key} in IndexedDB`));
    });
  }

  /**
   * Get value from IndexedDB
   * @param {string} key
   * @returns {Promise<any>}
   */
  async getIndexedDB(key) {
    const db = await this.initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to retrieve ${key} from IndexedDB`));
    });
  }

  /**
   * Set value with automatic quota monitoring and fallback
   * @param {string} key
   * @param {any} value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    const size = new Blob([JSON.stringify(value)]).size;
    const quota = await this.getQuota();
    
    // Use IndexedDB if approaching quota (80% threshold)
    if (quota.usage + size > quota.quota * 0.8) {
      console.log(`Storage quota at ${Math.round((quota.usage / quota.quota) * 100)}%, using IndexedDB for ${key}`);
      return this.setIndexedDB(key, value);
    }
    
    // Try localStorage first
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn(`QuotaExceededError for ${key}, falling back to IndexedDB`);
        return this.setIndexedDB(key, value);
      }
      throw e;
    }
  }

  /**
   * Get value with automatic fallback
   * Try localStorage first, fallback to IndexedDB
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    // Try localStorage first
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        return JSON.parse(value);
      }
    } catch (e) {
      console.warn(`Failed to read ${key} from localStorage:`, e);
    }
    
    // Fallback to IndexedDB
    try {
      const value = await this.getIndexedDB(key);
      return value;
    } catch (e) {
      console.warn(`Failed to read ${key} from IndexedDB:`, e);
      return null;
    }
  }

  /**
   * Remove value from both localStorage and IndexedDB
   * @param {string} key
   * @returns {Promise<void>}
   */
  async remove(key) {
    // Remove from localStorage
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove ${key} from localStorage:`, e);
    }
    
    // Remove from IndexedDB
    try {
      const db = await this.initIndexedDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Failed to remove ${key} from IndexedDB`));
      });
    } catch (e) {
      console.warn(`Failed to remove ${key} from IndexedDB:`, e);
    }
  }

  /**
   * Clear all data from both localStorage and IndexedDB
   * @returns {Promise<void>}
   */
  async clear() {
    // Clear localStorage
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
    
    // Clear IndexedDB
    try {
      const db = await this.initIndexedDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to clear IndexedDB'));
      });
    } catch (e) {
      console.warn('Failed to clear IndexedDB:', e);
    }
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<{usage: number, quota: number, percentage: number}>}
   */
  async getStats() {
    const quota = await this.getQuota();
    return {
      usage: quota.usage,
      quota: quota.quota,
      percentage: Math.round((quota.usage / quota.quota) * 100)
    };
  }
}

// Export singleton instance
const storageManager = new StorageManager();

// Make available globally for easy access
if (typeof window !== 'undefined') {
  window.StorageManager = storageManager;
}

export default storageManager;
