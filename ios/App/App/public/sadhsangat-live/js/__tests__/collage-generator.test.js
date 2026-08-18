/**
 * Tests for CollageGenerator Class
 * Task 2.3: Comprehensive test suite for collage generation orchestration
 */

const fc = require('fast-check');
const { CollageGenerator } = require('../collage-generator.js');
const { CollageCache } = require('../collage-cache-manager.js');

// Mock canvas for Node.js testing environment
class MockCanvas {
  constructor() {
    this.width = 116;
    this.height = 116;
    this._ops = [];
  }
  
  getContext() {
    const self = this;
    return {
      clearRect: () => {},
      fillRect: (...args) => self._ops.push({ type: 'fillRect', args }),
      fillText: (...args) => self._ops.push({ type: 'fillText', args }),
      drawImage: (...args) => self._ops.push({ type: 'drawImage', args }),
      beginPath: () => {},
      arc: () => {},
      clip: () => {},
      closePath: () => {},
      save: () => {},
      restore: () => {}
    };
  }
  
  toDataURL() {
    return 'data:image/png;base64,mockDataUrl';
  }
}

// Mock Image
class MockImage {
  constructor() {
    this._src = '';
    this.onload = null;
    this.onerror = null;
  }
  set src(url) {
    this._src = url;
    if (!url) return;
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 5);
  }
  get src() {
    return this._src;
  }
}

global.Image = MockImage;
if (typeof window !== 'undefined') window.Image = MockImage;

global.document = {
  documentElement: {
    classList: { add: () => {}, remove: () => {}, contains: () => false }
  },
  createElement: (tag) => {
    if (tag === 'canvas') return new MockCanvas();
    return {};
  },
  addEventListener: () => {}
};

global.getComputedStyle = () => ({
  getPropertyValue: () => '#E5E5EA'
});

describe('CollageGenerator - Unit Tests', () => {
  let generator;

  beforeEach(() => {
    generator = new CollageGenerator();
  });

  test('generates collage from valid channel list', async () => {
    const channels = [
      { channelId: 'ch1', displayPicture: 'https://example.com/1.jpg', channelName: 'Channel 1' }
    ];
    
    const result = await generator.generateCollage(channels);
    
    expect(result).toBe('data:image/png;base64,mockDataUrl');
  });

  test('returns PNG data URL', async () => {
    const channels = [
      { channelId: 'ch1', displayPicture: 'https://example.com/1.jpg', channelName: 'Channel 1' }
    ];
    
    const result = await generator.generateCollage(channels);
    
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  test('uses cache when available', async () => {
    const channels = [
      { channelId: 'ch1', displayPicture: 'https://example.com/1.jpg', channelName: 'Channel 1' }
    ];
    
    const res1 = await generator.generateCollage(channels);
    const res2 = await generator.generateCollage(channels);
    
    expect(res1).toBe(res2);
    const stats = generator.getCacheStats();
    expect(stats.hits).toBeGreaterThanOrEqual(1);
  });

  test('populates cache with new collages', async () => {
    const channels = [
      { channelId: 'ch1', displayPicture: 'https://example.com/1.jpg', channelName: 'Channel 1' }
    ];
    
    await generator.generateCollage(channels);
    const stats = generator.getCacheStats();
    expect(stats.size).toBe(1);
  });

  test('handles empty channel list error', async () => {
    await expect(generator.generateCollage([])).rejects.toThrow('Channel list is empty');
    await expect(generator.generateCollage(null)).rejects.toThrow('Channel list is empty');
  });

  test('cleans up resources after generation', async () => {
    const channels = [
      { channelId: 'ch1', displayPicture: 'https://example.com/1.jpg', channelName: 'Channel 1' }
    ];
    
    await generator.generateCollage(channels);
    expect(generator.isGenerating).toBe(false);
  });

  test('provides cache invalidation', async () => {
    const channels = [
      { channelId: 'ch1', displayPicture: 'https://example.com/1.jpg', channelName: 'Channel 1' }
    ];
    
    await generator.generateCollage(channels);
    expect(generator.getCacheStats().size).toBe(1);
    
    generator.invalidateCache(channels);
    expect(generator.getCacheStats().size).toBe(0);
  });

  test('provides cache stats', async () => {
    const stats = generator.getCacheStats();
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('hits');
    expect(stats).toHaveProperty('misses');
  });

  test('clears cache', async () => {
    const channels = [
      { channelId: 'ch1', displayPicture: 'https://example.com/1.jpg', channelName: 'Channel 1' }
    ];
    
    await generator.generateCollage(channels);
    generator.clearCache();
    expect(generator.getCacheStats().size).toBe(0);
  });

  test('sets isGenerating flag during generation', async () => {
    const channels = [
      { channelId: 'ch1', displayPicture: 'https://example.com/1.jpg', channelName: 'Channel 1' }
    ];
    
    expect(generator.isGenerating).toBe(false);
    const promise = generator.generateCollage(channels);
    expect(generator.isGenerating).toBe(true);
    await promise;
    expect(generator.isGenerating).toBe(false);
  });
});

describe('CollageGenerator - Property-Based Tests', () => {
  test('Property 1: Collage Generation Success - always returns valid PNG data URL', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            channelId: fc.string({ minLength: 1, maxLength: 10 }),
            displayPicture: fc.constant('https://example.com/ch.jpg'),
            channelName: fc.string({ minLength: 1, maxLength: 20 })
          }),
          { minLength: 1, maxLength: 8 }
        ),
        async (channels) => {
          const generator = new CollageGenerator();
          const dataUrl = await generator.generateCollage(channels);
          return typeof dataUrl === 'string' && dataUrl.startsWith('data:image/png;base64,');
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Property: isGenerating flag is always reset', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            channelId: fc.string({ minLength: 1 }),
            displayPicture: fc.constant('https://example.com/ch.jpg'),
            channelName: fc.string({ minLength: 1 })
          }),
          { minLength: 1, maxLength: 4 }
        ),
        async (channels) => {
          const generator = new CollageGenerator();
          await generator.generateCollage(channels);
          return generator.isGenerating === false;
        }
      ),
      { numRuns: 20 }
    );
  });
});
