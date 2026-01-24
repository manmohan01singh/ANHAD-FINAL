/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GURBANI RADIO - BANIDB API INTEGRATION
 * Complete BaniDB API client with caching and offline support
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * API Documentation: https://api.banidb.com/v2/
 * 
 * This module provides:
 * - Fetch Sri Guru Granth Sahib Ji Angs (pages 1-1430)
 * - Get daily Hukamnama from Sri Darbar Sahib
 * - Search Gurbani by first letter, full text, etc.
 * - Offline caching via IndexedDB
 */

(function () {
  'use strict';

  const API_BASE = 'https://api.banidb.com/v2';

  // Cache configuration
  const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days for Angs
  const HUKAMNAMA_TTL = 4 * 60 * 60 * 1000;   // 4 hours for Hukamnama

  // In-memory cache
  const memoryCache = new Map();

  /**
   * BaniDB API Client
   */
  class BaniDB {
    constructor() {
      this.baseUrl = API_BASE;
      this.storageReady = false;
      this.initStorage();
    }

    /**
     * Initialize storage connection
     */
    async initStorage() {
      // Wait for GurbaniStorage to be ready
      if (window.GurbaniStorage) {
        await window.GurbaniStorage.init();
        this.storageReady = true;
      } else {
        // Retry after a short delay
        setTimeout(() => this.initStorage(), 100);
      }
    }

    /**
     * Fetch a specific Ang (page) from Sri Guru Granth Sahib Ji
     * @param {number} angNumber - Page number (1-1430)
     * @returns {Promise<Object>}
     */
    async getAng(angNumber) {
      // Validate
      const ang = parseInt(angNumber, 10);
      if (isNaN(ang) || ang < 1 || ang > 1430) {
        throw new Error(`Invalid Ang number: ${angNumber}. Must be between 1 and 1430.`);
      }

      const cacheKey = `ang_${ang}`;

      // 1. Check memory cache
      if (memoryCache.has(cacheKey)) {
        const cached = memoryCache.get(cacheKey);
        if (cached.expiry > Date.now()) {
          return cached.data;
        }
      }

      // 2. Check IndexedDB cache
      try {
        if (this.storageReady && window.GurbaniStorage) {
          const cached = await window.GurbaniStorage.getCachedApiData(cacheKey);
          if (cached) {
            memoryCache.set(cacheKey, { data: cached, expiry: Date.now() + CACHE_TTL });
            return cached;
          }
        }
      } catch (e) {
        console.warn('Cache read error:', e);
      }

      // 3. Fetch from API
      try {
        // Using /angs/{ang}/G endpoint (G = Guru Granth Sahib)
        const response = await fetch(`${this.baseUrl}/angs/${ang}/G`, {
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch Ang ${ang}: ${response.status}`);
        }

        const data = await response.json();

        // Cache the result
        memoryCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });

        if (this.storageReady && window.GurbaniStorage) {
          await window.GurbaniStorage.cacheApiData(cacheKey, data, CACHE_TTL);
        }

        // Prefetch adjacent Angs
        this._prefetchAdjacentAngs(ang);

        return data;
      } catch (error) {
        console.error(`Error fetching Ang ${ang}:`, error);

        // Try fallback from any cache
        const fallback = await this._getFallbackFromCache(cacheKey);
        if (fallback) return fallback;

        throw error;
      }
    }

    /**
     * Prefetch adjacent Angs for smoother navigation
     */
    _prefetchAdjacentAngs(currentAng) {
      const toPrefetch = [currentAng - 1, currentAng + 1, currentAng + 2]
        .filter(a => a >= 1 && a <= 1430);

      toPrefetch.forEach(ang => {
        const cacheKey = `ang_${ang}`;
        if (!memoryCache.has(cacheKey)) {
          // Fetch silently in background
          this.getAng(ang).catch(() => { });
        }
      });
    }

    /**
     * Get fallback from cache
     */
    async _getFallbackFromCache(cacheKey) {
      // Check memory cache (even if expired)
      if (memoryCache.has(cacheKey)) {
        return memoryCache.get(cacheKey).data;
      }

      // Check localStorage fallback
      try {
        const lsData = localStorage.getItem(`banidb_${cacheKey}`);
        if (lsData) {
          return JSON.parse(lsData);
        }
      } catch (e) { }

      return null;
    }

    /**
     * Get today's Hukamnama from Sri Darbar Sahib
     * @returns {Promise<Object>}
     */
    async getHukamnama() {
      const cacheKey = 'hukamnama_today';
      const today = new Date().toDateString();

      // 1. Check memory cache
      if (memoryCache.has(cacheKey)) {
        const cached = memoryCache.get(cacheKey);
        if (cached.date === today) {
          return cached.data;
        }
      }

      // 2. Check IndexedDB cache
      try {
        if (this.storageReady && window.GurbaniStorage) {
          const cached = await window.GurbaniStorage.get('cache', cacheKey);
          if (cached && cached.date === today) {
            memoryCache.set(cacheKey, { data: cached.data, date: today });
            return cached.data;
          }
        }
      } catch (e) {
        console.warn('Cache read error:', e);
      }

      // 3. Fetch from API
      try {
        const response = await fetch(`${this.baseUrl}/hukamnamas/today`, {
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch Hukamnama: ${response.status}`);
        }

        const data = await response.json();

        // Cache the result
        memoryCache.set(cacheKey, { data, date: today });

        if (this.storageReady && window.GurbaniStorage) {
          await window.GurbaniStorage.set('cache', cacheKey, {
            data,
            date: today,
            timestamp: Date.now()
          });
        }

        return data;
      } catch (error) {
        console.error('Error fetching Hukamnama:', error);

        // Try fallback
        const fallback = await this._getHukamnamaFallback();
        if (fallback) return fallback;

        throw error;
      }
    }

    /**
     * Get Hukamnama by specific date
     * @param {number} year
     * @param {number} month
     * @param {number} day
     * @returns {Promise<Object>}
     */
    async getHukamnamaByDate(year, month, day) {
      const cacheKey = `hukamnama_${year}_${month}_${day}`;

      // Check cache
      if (memoryCache.has(cacheKey)) {
        return memoryCache.get(cacheKey).data;
      }

      try {
        const response = await fetch(`${this.baseUrl}/hukamnamas/${year}/${month}/${day}`, {
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch Hukamnama: ${response.status}`);
        }

        const data = await response.json();
        memoryCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });

        return data;
      } catch (error) {
        console.error('Error fetching Hukamnama by date:', error);
        throw error;
      }
    }

    /**
     * Get Hukamnama fallback from cache
     */
    async _getHukamnamaFallback() {
      // Memory cache (any date)
      if (memoryCache.has('hukamnama_today')) {
        return memoryCache.get('hukamnama_today').data;
      }

      // IndexedDB
      try {
        if (this.storageReady && window.GurbaniStorage) {
          const cached = await window.GurbaniStorage.get('cache', 'hukamnama_today');
          if (cached) return cached.data;
        }
      } catch (e) { }

      return null;
    }

    /**
     * Search for Gurbani
     * @param {string} query - Search query
     * @param {string} type - Search type: first-letter, first-word, gurmukhi, english
     * @param {number} results - Max results (default 20)
     * @returns {Promise<Object>}
     */
    async search(query, type = 'first-letter', results = 20) {
      if (!query || !query.trim()) {
        throw new Error('Search query cannot be empty');
      }

      const searchTypes = {
        'first-letter': 0,
        'first-word': 1,
        'full-word': 2,
        'gurmukhi': 4,
        'english': 5
      };

      const typeNum = searchTypes[type] ?? 0;

      try {
        const response = await fetch(
          `${this.baseUrl}/search/${encodeURIComponent(query)}?searchType=${typeNum}&source=G&results=${results}`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        console.error('Search error:', error);
        throw error;
      }
    }

    /**
     * Get a random Shabad
     * @returns {Promise<Object>}
     */
    async getRandomShabad() {
      try {
        const response = await fetch(`${this.baseUrl}/random/G`, {
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Random fetch failed: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        console.error('Random shabad error:', error);
        // Return a random Ang as fallback
        const randomAng = Math.floor(Math.random() * 1430) + 1;
        return this.getAng(randomAng);
      }
    }

    /**
     * Get Shabad by ID
     * @param {number|string} shabadId
     * @returns {Promise<Object>}
     */
    async getShabadById(shabadId) {
      // ═══════════════════════════════════════════════════════════════
      // DEFENSIVE GUARD: Validate shabadId before API call
      // ═══════════════════════════════════════════════════════════════
      if (!shabadId || shabadId === 'undefined' || shabadId === 'null' || shabadId === undefined || shabadId === null) {
        const error = new Error(`Invalid Shabad ID: ${shabadId}. ID is required and must be a valid number.`);
        console.error('[BaniDB] BLOCKED:', error.message);
        throw error;
      }

      // Convert to number if string
      const id = typeof shabadId === 'string' ? parseInt(shabadId, 10) : shabadId;

      if (isNaN(id) || id <= 0) {
        const error = new Error(`Invalid Shabad ID: ${shabadId}. Must be a positive number.`);
        console.error('[BaniDB] BLOCKED:', error.message);
        throw error;
      }

      const cacheKey = `shabad_${id}`;

      if (memoryCache.has(cacheKey)) {
        console.log(`[BaniDB] Cache hit for shabad ${id}`);
        return memoryCache.get(cacheKey).data;
      }

      console.log(`[BaniDB] Fetching shabad ${id} from API...`);

      try {
        const response = await fetch(`${this.baseUrl}/shabads/${id}`, {
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Shabad fetch failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data || (!data.shabad && !data.verses && data.length === 0)) {
          throw new Error('Empty response from API');
        }

        memoryCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });
        console.log(`[BaniDB] Successfully fetched and cached shabad ${id}`);

        return data;
      } catch (error) {
        console.error(`[BaniDB] Shabad fetch error for ID ${id}:`, error);
        throw error;
      }
    }

    /**
     * Get Banis list
     * @returns {Promise<Object>}
     */
    async getBanis() {
      const cacheKey = 'banis_list';

      if (memoryCache.has(cacheKey)) {
        return memoryCache.get(cacheKey).data;
      }

      try {
        const response = await fetch(`${this.baseUrl}/banis`, {
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Banis fetch failed: ${response.status}`);
        }

        const data = await response.json();
        memoryCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });

        return data;
      } catch (error) {
        console.error('Banis fetch error:', error);
        throw error;
      }
    }

    /**
     * Get a specific Bani by ID
     * @param {number} baniId
     * @returns {Promise<Object>}
     */
    async getBani(baniId) {
      const cacheKey = `bani_${baniId}`;

      if (memoryCache.has(cacheKey)) {
        return memoryCache.get(cacheKey).data;
      }

      try {
        const response = await fetch(`${this.baseUrl}/banis/${baniId}`, {
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Bani fetch failed: ${response.status}`);
        }

        const data = await response.json();
        memoryCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });

        if (this.storageReady && window.GurbaniStorage) {
          await window.GurbaniStorage.cacheApiData(cacheKey, data, CACHE_TTL);
        }

        return data;
      } catch (error) {
        console.error('Bani fetch error:', error);
        throw error;
      }
    }

    /**
     * Clear all caches
     */
    clearCache() {
      memoryCache.clear();
      console.log('[BaniDB] Cache cleared');
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
      return {
        memoryEntries: memoryCache.size,
        memoryKeys: Array.from(memoryCache.keys())
      };
    }
  }

  // Create singleton instance
  const baniDB = new BaniDB();

  // Export to window
  window.BaniDB = baniDB;

  // Also export class for testing
  window.BaniDBClass = BaniDB;

  // Support module exports
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BaniDB: baniDB, BaniDBClass: BaniDB };
  }

  // Also support ES module named exports via global assignment
  // for compatibility with existing code that may import { fetchAng }
  window.fetchAng = (angNumber) => baniDB.getAng(angNumber);
  window.searchGurbani = (query, type) => baniDB.search(query, type);
  window.getRandomHukam = () => baniDB.getRandomShabad();

})();
