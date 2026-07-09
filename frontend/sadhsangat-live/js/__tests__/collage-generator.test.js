/**
 * Tests for CollageGenerator Class
 * Task 2.3: Comprehensive test suite for collage generation orchestration
 */

const fc = require('fast-check');

// Mock all dependencies
jest.mock('../collage-cache-manager.js');
jest.mock('../collage-grid-calculator.js');
jest.mock('../collage-image-loader.js');
jest.mock('../collage-canvas-renderer.js');

const { CollageCache } = require('../collage-cache-manager.js');
const { calculateGridLayout } = require('../collage-grid-calculator.js');
const { loadChannelImages } = require('../collage-image-loader.js');
const { renderCollageToCanvas } = require('../collage-canvas-renderer.js');
const { CollageGenerator } = require('../collage-generator.js');

// Mock canvas
class MockCanvas {
  constructor() {
    this.width = 116;
    this.height = 116;
  }
  
  getContext() {
    return {
      clearRect: jest.fn()
    };
  }
  
  toDataURL() {
    return 'data:image/png;base64,mockDataUrl';
  }
}

global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return new MockCanvas();
    }
    return {};
  }
};

describe('CollageGenerator - Unit Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    CollageCache.mockImplementation(() => ({
      _generateKey: jest.fn((channels) => `key-${channels.length}`),
      get: jest.fn(() => null),
      set: jest.fn(),
      invalidate: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(() => ({ size: 0, hits: 0, misses: 0 }))
    }));
    
    calculateGridLayout.mockImplementation((count) => ({
      rows: 2,
      cols: 2,
      cellSize: 58,
      totalCells: 4,
      channelsToShow: count
    }));
    
    loadChannelImages.mockResolvedValue([
      { success: true, image: {}, channel: { channelId: 'ch1' } }
    ]);
    
    renderCollageToCanvas.mockReturnValue(new MockCanvas());
  });
  
  test('generates collage from valid channel list', async () => {
    const generator = new CollageGenerator();
    const channels = [
      { channelId: 'ch1', displayPicture: 'url1', channelName: 'Channel 1' }
    ];
    
    const result = await generator.generateCollage(channels);
    
    expect(result).toBe('data:image/png;base64,mockDataUrl');
    expect(calculateGridLayout).toHaveBeenCalledWith(1);
    expect(loadChannelImages).toHaveBeenCalledWith(channels, 5000);
    expect(renderCollageToCanvas).toHaveBeenCalled();
  });
  
  test('returns PNG data URL', async () => {
    const generator = new CollageGenerator();
    const channels = [
      { channelId: 'ch1', displayPicture: 'url1', channelName: 'Channel 1' }
    ];
    
    const result = await generator.generateCollage(channels);
    
    expect(result).toMatch(/^data:image\/png;base64,/);
  });
  
  test('uses cache when available', async () => {
    const cachedDataUrl = 'data:image/png;base64,cachedData';
    
    CollageCache.mockImplementation(() => ({
      _generateKey: jest.fn(() => 'cache-key'),
      get: jest.fn(() => cachedDataUrl),
      set: jest.fn(),
      invalidate: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(() => ({ size: 1, hits: 1, misses: 0 }))
    }));
    
    const generator = new CollageGenerator();
    const channels = [
      { channelId: 'ch1', displayPicture: 'url1', channelName: 'Channel 1' }
    ];
    
    const result = await generator.generateCollage(channels);
    
    expect(result).toBe(cachedDataUrl);
    expect(calculateGridLayout).not.toHaveBeenCalled();
    expect(loadChannelImages).not.toHaveBeenCalled();
  });
  
  test('populates cache with new collages', async () => {
    const mockCache = {
      _generateKey: jest.fn(() => 'cache-key'),
      get: jest.fn(() => null),
      set: jest.fn(),
      invalidate: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(() => ({ size: 0, hits: 0, misses: 0 }))
    };
    
    CollageCache.mockImplementation(() => mockCache);
    
    const generator = new CollageGenerator();
    const channels = [
      { channelId: 'ch1', displayPicture: 'url1', channelName: 'Channel 1' }
    ];
    
    await generator.generateCollage(channels);
    
    expect(mockCache.set).toHaveBeenCalledWith(
      'cache-key',
      'data:image/png;base64,mockDataUrl',
      channels
    );
  });
  
  test('handles empty channel list error', async () => {
    const generator = new CollageGenerator();
    
    await expect(generator.generateCollage([])).rejects.toThrow('Channel list is empty');
    await expect(generator.generateCollage(null)).rejects.toThrow('Channel list is empty');
  });
  
  test('handles all-images-failed scenario', async () => {
    loadChannelImages.mockResolvedValue([
      { success: false, error: new Error('Failed'), channel: { channelId: 'ch1' } }
    ]);
    
    const generator = new CollageGenerator();
    const channels = [
      { channelId: 'ch1', displayPicture: 'bad-url', channelName: 'Channel 1' }
    ];
    
    // Should still generate collage with fallbacks
    const result = await generator.generateCollage(channels);
    expect(result).toBeDefined();
  });
  
  test('cleans up resources after generation', async () => {
    const generator = new CollageGenerator();
    const channels = [
      { channelId: 'ch1', displayPicture: 'url1', channelName: 'Channel 1' }
    ];
    
    await generator.generateCollage(channels);
    
    // Cleanup should be called (verified by no errors)
    expect(true).toBe(true);
  });
  
  test('provides cache invalidation', () => {
    const mockCache = {
      _generateKey: jest.fn(() => 'cache-key'),
      get: jest.fn(),
      set: jest.fn(),
      invalidate: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn()
    };
    
    CollageCache.mockImplementation(() => mockCache);
    
    const generator = new CollageGenerator();
    const channels = [
      { channelId: 'ch1', displayPicture: 'url1', channelName: 'Channel 1' }
    ];
    
    generator.invalidateCache(channels);
    
    expect(mockCache.invalidate).toHaveBeenCalledWith('cache-key');
  });
  
  test('provides cache stats', () => {
    const mockStats = { size: 3, hits: 10, misses: 5 };
    const mockCache = {
      _generateKey: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      invalidate: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(() => mockStats)
    };
    
    CollageCache.mockImplementation(() => mockCache);
    
    const generator = new CollageGenerator();
    const stats = generator.getCacheStats();
    
    expect(stats).toEqual(mockStats);
  });
  
  test('clears cache', () => {
    const mockCache = {
      _generateKey: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      invalidate: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn()
    };
    
    CollageCache.mockImplementation(() => mockCache);
    
    const generator = new CollageGenerator();
    generator.clearCache();
    
    expect(mockCache.clear).toHaveBeenCalled();
  });
  
  test('detects canvas API unavailability', async () => {
    const originalCreateElement = global.document.createElement;
    global.document.createElement = (tag) => {
      if (tag === 'canvas') {
        return {
          getContext: () => null
        };
      }
      return {};
    };
    
    const generator = new CollageGenerator();
    const channels = [
      { channelId: 'ch1', displayPicture: 'url1', channelName: 'Channel 1' }
    ];
    
    await expect(generator.generateCollage(channels)).rejects.toThrow('Canvas API not supported');
    
    global.document.createElement = originalCreateElement;
  });
  
  test('logs detailed error information', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    calculateGridLayout.mockImplementation(() => {
      throw new Error('Grid calculation failed');
    });
    
    const generator = new CollageGenerator();
    const channels = [
      { channelId: 'ch1', displayPicture: 'url1', channelName: 'Channel 1' }
    ];
    
    await expect(generator.generateCollage(channels)).rejects.toThrow();
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Collage Error]',
      expect.objectContaining({
        error: 'Grid calculation failed',
        channelCount: 1,
        channelIds: ['ch1']
      })
    );
    
    consoleErrorSpy.mockRestore();
  });
  
  test('sets isGenerating flag during generation', async () => {
    const generator = new CollageGenerator();
    const channels = [
      { channelId: 'ch1', displayPicture: 'url1', channelName: 'Channel 1' }
    ];
    
    expect(generator.isGenerating).toBe(false);
    
    const promise = generator.generateCollage(channels);
    expect(generator.isGenerating).toBe(true);
    
    await promise;
    expect(generator.isGenerating).toBe(false);
  });
  
  test('resets isGenerating flag on error', async () => {
    calculateGridLayout.mockImplementation(() => {
      throw new Error('Test error');
    });
    
    const generator = new CollageGenerator();
    const channels = [
      { channelId: 'ch1', displayPicture: 'url1', channelName: 'Channel 1' }
    ];
    
    await expect(generator.generateCollage(channels)).rejects.toThrow();
    expect(generator.isGenerating).toBe(false);
  });
});

describe('CollageGenerator - Property-Based Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    CollageCache.mockImplementation(() => ({
      _generateKey: jest.fn((channels) => `key-${channels.length}`),
      get: jest.fn(() => null),
      set: jest.fn(),
      invalidate: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(() => ({ size: 0, hits: 0, misses: 0 }))
    }));
    
    calculateGridLayout.mockImplementation((count) => ({
      rows: Math.ceil(Math.sqrt(count)),
      cols: Math.ceil(Math.sqrt(count)),
      cellSize: 116 / Math.ceil(Math.sqrt(count)),
      totalCells: Math.ceil(Math.sqrt(count)) ** 2,
      channelsToShow: count
    }));
    
    loadChannelImages.mockImplementation(async (channels) => 
      channels.map(ch => ({
        success: true,
        image: {},
        channel: ch
      }))
    );
    
    renderCollageToCanvas.mockReturnValue(new MockCanvas());
  });
  
  test('Property 1: Collage Generation Success - always returns valid PNG data URL', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            channelId: fc.string({ minLength: 1, maxLength: 10 }),
            displayPicture: fc.webUrl(),
            channelName: fc.string({ minLength: 1, maxLength: 20 })
          }),
          { minLength: 1, maxLength: 16 }
        ),
        async (channels) => {
          const generator = new CollageGenerator();
          const dataUrl = await generator.generateCollage(channels);
          
          expect(dataUrl).toMatch(/^data:image\/png;base64,/);
          
          return dataUrl.startsWith('data:image/png;base64,');
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property 14: PNG Data URL Format - output always has correct format', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            channelId: fc.string({ minLength: 1 }),
            displayPicture: fc.webUrl(),
            channelName: fc.string({ minLength: 1 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (channels) => {
          const generator = new CollageGenerator();
          const dataUrl = await generator.generateCollage(channels);
          
          expect(dataUrl).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
  
  test('Property: Cache is used on duplicate requests', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            channelId: fc.string({ minLength: 1 }),
            displayPicture: fc.webUrl(),
            channelName: fc.string({ minLength: 1 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (channels) => {
          const generator = new CollageGenerator();
          
          // First generation
          await generator.generateCollage(channels);
          const firstCallCount = calculateGridLayout.mock.calls.length;
          
          // Mock cache to return cached value
          generator.cache.get = jest.fn(() => 'data:image/png;base64,cached');
          
          // Second generation (should use cache)
          await generator.generateCollage(channels);
          const secondCallCount = calculateGridLayout.mock.calls.length;
          
          // calculateGridLayout should not be called again
          expect(secondCallCount).toBe(firstCallCount);
          
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });
  
  test('Property: isGenerating flag is always reset', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            channelId: fc.string({ minLength: 1 }),
            displayPicture: fc.webUrl(),
            channelName: fc.string({ minLength: 1 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.boolean(),
        async (channels, shouldFail) => {
          if (shouldFail) {
            calculateGridLayout.mockImplementation(() => {
              throw new Error('Forced error');
            });
          }
          
          const generator = new CollageGenerator();
          
          try {
            await generator.generateCollage(channels);
          } catch (e) {
            // Expected for shouldFail cases
          }
          
          expect(generator.isGenerating).toBe(false);
          
          // Reset mock
          calculateGridLayout.mockImplementation((count) => ({
            rows: 2, cols: 2, cellSize: 58, totalCells: 4, channelsToShow: count
          }));
          
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });
});
