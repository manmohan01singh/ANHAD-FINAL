/**
 * Tests for Cache Manager with LRU Eviction
 * Task 2.1: Comprehensive test suite for cache management
 */

const fc = require('fast-check');
const { CollageCache, simpleHash } = require('../collage-cache-manager.js');

describe('Cache Manager - Unit Tests', () => {
  
  test('stores up to 5 collages maximum', () => {
    const cache = new CollageCache(5);
    
    // Add 5 entries
    for (let i = 0; i < 5; i++) {
      cache.set(`key${i}`, `dataUrl${i}`, [{ channelId: `ch${i}` }]);
    }
    
    expect(cache.getStats().size).toBe(5);
    
    // Add 6th entry - should evict oldest
    cache.set('key5', 'dataUrl5', [{ channelId: 'ch5' }]);
    
    expect(cache.getStats().size).toBe(5);
    expect(cache.get('key0')).toBeNull(); // Oldest should be evicted
    expect(cache.get('key5')).toBe('dataUrl5'); // Newest should exist
  });
  
  test('generates consistent keys for same channel list', () => {
    const cache = new CollageCache();
    
    const channels1 = [
      { channelId: 'ch1', displayPicture: 'url1' },
      { channelId: 'ch2', displayPicture: 'url2' }
    ];
    
    const channels2 = [
      { channelId: 'ch1', displayPicture: 'url1' },
      { channelId: 'ch2', displayPicture: 'url2' }
    ];
    
    const key1 = cache._generateKey(channels1);
    const key2 = cache._generateKey(channels2);
    
    expect(key1).toBe(key2);
  });
  
  test('generates consistent keys regardless of channel order', () => {
    const cache = new CollageCache();
    
    const channels1 = [
      { channelId: 'ch1', displayPicture: 'url1' },
      { channelId: 'ch2', displayPicture: 'url2' }
    ];
    
    const channels2 = [
      { channelId: 'ch2', displayPicture: 'url2' },
      { channelId: 'ch1', displayPicture: 'url1' }
    ];
    
    const key1 = cache._generateKey(channels1);
    const key2 = cache._generateKey(channels2);
    
    expect(key1).toBe(key2);
  });
  
  test('evicts oldest entry when adding 6th collage', () => {
    const cache = new CollageCache(5);
    
    // Add 5 entries
    cache.set('key1', 'dataUrl1', [{ channelId: 'ch1' }]);
    cache.set('key2', 'dataUrl2', [{ channelId: 'ch2' }]);
    cache.set('key3', 'dataUrl3', [{ channelId: 'ch3' }]);
    cache.set('key4', 'dataUrl4', [{ channelId: 'ch4' }]);
    cache.set('key5', 'dataUrl5', [{ channelId: 'ch5' }]);
    
    expect(cache.get('key1')).toBe('dataUrl1');
    
    // Add 6th entry
    cache.set('key6', 'dataUrl6', [{ channelId: 'ch6' }]);
    
    // key1 should be evicted (but it was accessed, so it moved to end)
    // Actually key2 should be evicted now
    expect(cache.getStats().size).toBe(5);
    expect(cache.get('key2')).toBeNull();
    expect(cache.get('key6')).toBe('dataUrl6');
  });
  
  test('moves accessed entries to end (LRU behavior)', () => {
    const cache = new CollageCache(3);
    
    cache.set('key1', 'dataUrl1', [{ channelId: 'ch1' }]);
    cache.set('key2', 'dataUrl2', [{ channelId: 'ch2' }]);
    cache.set('key3', 'dataUrl3', [{ channelId: 'ch3' }]);
    
    // Access key1 to move it to end
    expect(cache.get('key1')).toBe('dataUrl1');
    
    // Add key4 - should evict key2 (oldest)
    cache.set('key4', 'dataUrl4', [{ channelId: 'ch4' }]);
    
    expect(cache.get('key1')).toBe('dataUrl1'); // Still exists
    expect(cache.get('key2')).toBeNull(); // Evicted
    expect(cache.get('key3')).toBe('dataUrl3'); // Still exists
    expect(cache.get('key4')).toBe('dataUrl4'); // Newly added
  });
  
  test('tracks cache hits and misses', () => {
    const cache = new CollageCache();
    
    cache.set('key1', 'dataUrl1', [{ channelId: 'ch1' }]);
    
    // Hit
    cache.get('key1');
    expect(cache.getStats().hits).toBe(1);
    expect(cache.getStats().misses).toBe(0);
    
    // Miss
    cache.get('keyNonExistent');
    expect(cache.getStats().hits).toBe(1);
    expect(cache.getStats().misses).toBe(1);
    
    // Another hit
    cache.get('key1');
    expect(cache.getStats().hits).toBe(2);
    expect(cache.getStats().misses).toBe(1);
  });
  
  test('provides cache statistics', () => {
    const cache = new CollageCache();
    
    cache.set('key1', 'dataUrl1', [{ channelId: 'ch1' }]);
    cache.set('key2', 'dataUrl2', [{ channelId: 'ch2' }]);
    cache.get('key1');
    cache.get('keyMissing');
    
    const stats = cache.getStats();
    
    expect(stats.size).toBe(2);
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });
  
  test('handles cache invalidation', () => {
    const cache = new CollageCache();
    
    cache.set('key1', 'dataUrl1', [{ channelId: 'ch1' }]);
    expect(cache.get('key1')).toBe('dataUrl1');
    
    cache.invalidate('key1');
    expect(cache.get('key1')).toBeNull();
    expect(cache.getStats().size).toBe(0);
  });
  
  test('has() method works correctly', () => {
    const cache = new CollageCache();
    
    expect(cache.has('key1')).toBe(false);
    
    cache.set('key1', 'dataUrl1', [{ channelId: 'ch1' }]);
    expect(cache.has('key1')).toBe(true);
    
    cache.invalidate('key1');
    expect(cache.has('key1')).toBe(false);
  });
  
  test('clear() removes all entries and resets stats', () => {
    const cache = new CollageCache();
    
    cache.set('key1', 'dataUrl1', [{ channelId: 'ch1' }]);
    cache.set('key2', 'dataUrl2', [{ channelId: 'ch2' }]);
    cache.get('key1');
    cache.get('keyMissing');
    
    cache.clear();
    
    const stats = cache.getStats();
    expect(stats.size).toBe(0);
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });
  
  test('simpleHash generates consistent hash for same input', () => {
    const input = 'test string';
    const hash1 = simpleHash(input);
    const hash2 = simpleHash(input);
    
    expect(hash1).toBe(hash2);
  });
  
  test('simpleHash generates different hashes for different inputs', () => {
    const hash1 = simpleHash('test1');
    const hash2 = simpleHash('test2');
    
    expect(hash1).not.toBe(hash2);
  });
  
  test('stores channel IDs with cache entry', () => {
    const cache = new CollageCache();
    const channels = [
      { channelId: 'ch1', displayPicture: 'url1' },
      { channelId: 'ch2', displayPicture: 'url2' }
    ];
    
    const key = cache._generateKey(channels);
    cache.set(key, 'dataUrl', channels);
    
    // Accessing internal structure for verification
    const entry = cache.cache.get(key);
    expect(entry.channels).toEqual(['ch1', 'ch2']);
  });
  
  test('updating existing key does not increase cache size', () => {
    const cache = new CollageCache(5);
    
    cache.set('key1', 'dataUrl1', [{ channelId: 'ch1' }]);
    expect(cache.getStats().size).toBe(1);
    
    // Update same key
    cache.set('key1', 'dataUrlUpdated', [{ channelId: 'ch1' }]);
    expect(cache.getStats().size).toBe(1);
    expect(cache.get('key1')).toBe('dataUrlUpdated');
  });
  
  test('cache size never exceeds maxSize', () => {
    const cache = new CollageCache(3);
    
    for (let i = 0; i < 10; i++) {
      cache.set(`key${i}`, `dataUrl${i}`, [{ channelId: `ch${i}` }]);
      expect(cache.getStats().size).toBeLessThanOrEqual(3);
    }
  });
});

describe('Cache Manager - Property-Based Tests', () => {
  
  test('Property 6: Cache Population and Hit - caching works correctly', () => {
    return fc.assert(
      fc.property(
        fc.array(
          fc.record({
            channelId: fc.string({ minLength: 1, maxLength: 10 }),
            displayPicture: fc.webUrl()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (channels) => {
          const cache = new CollageCache();
          
          // Generate collage (simulate)
          const key = cache._generateKey(channels);
          const dataUrl = 'data:image/png;base64,mock';
          
          // First access - miss
          const firstResult = cache.get(key);
          expect(firstResult).toBeNull();
          
          // Populate cache
          cache.set(key, dataUrl, channels);
          
          // Second access - hit
          const secondResult = cache.get(key);
          expect(secondResult).toBe(dataUrl);
          
          // Verify stats
          const stats = cache.getStats();
          expect(stats.hits).toBe(1);
          expect(stats.misses).toBe(1);
          
          return secondResult === dataUrl;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property 15: LRU Cache Eviction - maintains size at maxSize', () => {
    return fc.assert(
      fc.property(
        fc.integer({ min: 6, max: 20 }),
        (numEntries) => {
          const cache = new CollageCache(5);
          
          for (let i = 0; i < numEntries; i++) {
            cache.set(`key${i}`, `dataUrl${i}`, [{ channelId: `ch${i}` }]);
          }
          
          const stats = cache.getStats();
          expect(stats.size).toBe(5);
          
          // Oldest entries should be evicted
          expect(cache.get('key0')).toBeNull();
          expect(cache.get('key1')).toBeNull();
          
          // Recent entries should exist
          const lastKey = `key${numEntries - 1}`;
          expect(cache.get(lastKey)).toBeDefined();
          
          return stats.size === 5;
        }
      ),
      { numRuns: 50 }
    );
  });
  
  test('Property: Key generation is deterministic', () => {
    return fc.assert(
      fc.property(
        fc.array(
          fc.record({
            channelId: fc.string({ minLength: 1, maxLength: 10 }),
            displayPicture: fc.webUrl()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (channels) => {
          const cache = new CollageCache();
          
          const key1 = cache._generateKey(channels);
          const key2 = cache._generateKey(channels);
          const key3 = cache._generateKey([...channels]); // Copy array
          
          expect(key1).toBe(key2);
          expect(key1).toBe(key3);
          
          return key1 === key2 && key1 === key3;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property: Key generation is order-independent', () => {
    return fc.assert(
      fc.property(
        fc.array(
          fc.record({
            channelId: fc.string({ minLength: 1, maxLength: 10 }),
            displayPicture: fc.webUrl()
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (channels) => {
          const cache = new CollageCache();
          
          const key1 = cache._generateKey(channels);
          const shuffled = [...channels].sort(() => Math.random() - 0.5);
          const key2 = cache._generateKey(shuffled);
          
          expect(key1).toBe(key2);
          
          return key1 === key2;
        }
      ),
      { numRuns: 50 }
    );
  });
  
  test('Property: LRU access updates position', () => {
    return fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),
        (accessIndex) => {
          const cache = new CollageCache(3);
          
          // Add 3 entries
          cache.set('key0', 'dataUrl0', [{ channelId: 'ch0' }]);
          cache.set('key1', 'dataUrl1', [{ channelId: 'ch1' }]);
          cache.set('key2', 'dataUrl2', [{ channelId: 'ch2' }]);
          
          // Access one to move it to end
          cache.get(`key${accessIndex}`);
          
          // Add 4th entry
          cache.set('key3', 'dataUrl3', [{ channelId: 'ch3' }]);
          
          // Accessed key should still exist
          expect(cache.get(`key${accessIndex}`)).toBeDefined();
          
          // Cache size should be 3
          expect(cache.getStats().size).toBe(3);
          
          return cache.get(`key${accessIndex}`) !== null;
        }
      ),
      { numRuns: 30 }
    );
  });
  
  test('Property: Cache stats are always non-negative', () => {
    return fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            fc.constantFrom('set', 'get', 'invalidate', 'clear'),
            fc.string({ minLength: 1, maxLength: 10 })
          ),
          { minLength: 1, maxLength: 50 }
        ),
        (operations) => {
          const cache = new CollageCache();
          
          operations.forEach(([op, key]) => {
            if (op === 'set') {
              cache.set(key, 'dataUrl', [{ channelId: key }]);
            } else if (op === 'get') {
              cache.get(key);
            } else if (op === 'invalidate') {
              cache.invalidate(key);
            } else if (op === 'clear') {
              cache.clear();
            }
          });
          
          const stats = cache.getStats();
          
          expect(stats.size).toBeGreaterThanOrEqual(0);
          expect(stats.hits).toBeGreaterThanOrEqual(0);
          expect(stats.misses).toBeGreaterThanOrEqual(0);
          
          return stats.size >= 0 && stats.hits >= 0 && stats.misses >= 0;
        }
      ),
      { numRuns: 50 }
    );
  });
});
