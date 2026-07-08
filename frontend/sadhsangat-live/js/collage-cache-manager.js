/**
 * Cache Manager with LRU Eviction
 * Task 2.1: Stores up to 5 recent collages
 */

class CollageCache {
  constructor(maxSize = 5) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }
  
  _generateKey(channels) {
    const sorted = channels.slice().sort((a, b) => 
      a.channelId.localeCompare(b.channelId)
    );
    const keyData = sorted.map(ch => 
      `${ch.channelId}:${ch.displayPicture}`
    ).join('|');
    return simpleHash(keyData);
  }
  
  get(key) {
    if (this.cache.has(key)) {
      this.hits++;
      const entry = this.cache.get(key);
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry.dataUrl;
    }
    this.misses++;
    return null;
  }
  
  set(key, dataUrl, channels) {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      dataUrl,
      timestamp: Date.now(),
      channels: channels.map(ch => ch.channelId)
    });
  }
  
  has(key) {
    return this.cache.has(key);
  }
  
  invalidate(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
  
  getStats() {
    return { size: this.cache.size, hits: this.hits, misses: this.misses };
  }
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}
