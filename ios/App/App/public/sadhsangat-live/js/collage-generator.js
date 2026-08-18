/**
 * Main CollageGenerator Class
 * Task 2.3: Orchestrates collage generation
 */

// Import dependencies (for Node.js test environment)
if (typeof require !== 'undefined') {
  const { CollageCache } = require('./collage-cache-manager.js');
  const { calculateGridLayout } = require('./collage-grid-calculator.js');
  const { loadChannelImages } = require('./collage-image-loader.js');
  const { renderCollageToCanvas } = require('./collage-canvas-renderer.js');
  globalThis.CollageCache = CollageCache;
  globalThis.calculateGridLayout = calculateGridLayout;
  globalThis.loadChannelImages = loadChannelImages;
  globalThis.renderCollageToCanvas = renderCollageToCanvas;
}

class CollageGenerator {
  constructor() {
    const CacheClass = (typeof globalThis !== 'undefined' && globalThis.CollageCache) || CollageCache;
    this.cache = new CacheClass(5);
    this.isGenerating = false;
  }
  
  async generateCollage(channels) {
    if (!channels || channels.length === 0) {
      throw new Error('Channel list is empty');
    }
    
    // Check cache
    const cacheKey = this.cache._generateKey(channels);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('[Collage] Cache hit for', channels.length, 'channels');
      return cached;
    }
    
    console.log('[Collage] Generating new collage for', channels.length, 'channels');
    this.isGenerating = true;
    
    try {
      // Check canvas API availability
      if (!document.createElement('canvas').getContext) {
        throw new Error('Canvas API not supported');
      }
      
      const calcGrid = (typeof globalThis !== 'undefined' && globalThis.calculateGridLayout) || calculateGridLayout;
      const loadImages = (typeof globalThis !== 'undefined' && globalThis.loadChannelImages) || loadChannelImages;
      const renderCollage = (typeof globalThis !== 'undefined' && globalThis.renderCollageToCanvas) || renderCollageToCanvas;

      // Calculate grid layout
      const layout = calcGrid(channels.length);
      
      // Load images
      const imageResults = await loadImages(channels, 5000);
      
      // Check if all images failed
      const anySuccess = imageResults.some(r => r.success);
      if (!anySuccess) {
        console.warn('[Collage] All images failed, using fallbacks');
      }
      
      // Render to canvas
      const canvas = renderCollage(imageResults, layout);
      
      // Export as data URL
      const dataUrl = canvas.toDataURL('image/png');
      
      // Cache result
      this.cache.set(cacheKey, dataUrl, channels);
      
      // Cleanup
      this._cleanup(canvas, imageResults);
      
      return dataUrl;
    } catch (error) {
      console.error('[Collage Error]', {
        error: error.message,
        stack: error.stack,
        channelCount: channels.length,
        channelIds: channels.map(ch => ch.channelId),
        timestamp: new Date().toISOString()
      });
      throw error;
    } finally {
      this.isGenerating = false;
    }
  }
  
  invalidateCache(channels) {
    const key = this.cache._generateKey(channels);
    this.cache.invalidate(key);
  }
  
  clearCache() {
    this.cache.clear();
  }
  
  getCacheStats() {
    return this.cache.getStats();
  }
  
  _cleanup(canvas, imageResults) {
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    imageResults.forEach(result => {
      if (result.fallback) {
        const ctx = result.fallback.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, result.fallback.width, result.fallback.height);
        }
      }
    });
  }
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (typeof collageGenerator !== 'undefined') {
      collageGenerator.clearCache();
      console.log('[Collage] Cleaned up resources on page unload');
    }
  });
}

// Export for use in other modules and tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CollageGenerator };
}
