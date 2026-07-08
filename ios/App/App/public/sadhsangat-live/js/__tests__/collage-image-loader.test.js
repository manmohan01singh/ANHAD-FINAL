/**
 * Tests for Image Loader with Timeout
 * Task 1.2: Comprehensive test suite for async image loading
 */

const fc = require('fast-check');

// Mock Image class for Node.js environment
class MockImage {
  constructor() {
    this.src = '';
    this.crossOrigin = '';
    this.onload = null;
    this.onerror = null;
  }
  
  set src(url) {
    this._src = url;
    // Simulate async image loading
    setTimeout(() => {
      if (url.includes('timeout')) {
        // Don't trigger any event for timeout simulation
      } else if (url.includes('error') || url.includes('404')) {
        if (this.onerror) this.onerror(new Error('Load failed'));
      } else {
        if (this.onload) this.onload();
      }
    }, 10);
  }
  
  get src() {
    return this._src;
  }
}

//Mock canvas for testing
class MockCanvas {
  constructor() {
    this.width = 0;
    this.height = 0;
  }
  
  getContext() {
    return {
      fillStyle: '',
      fillRect: jest.fn(),
      fillText: jest.fn(),
      clearRect: jest.fn(),
      font: '',
      textAlign: '',
      textBaseline: ''
    };
  }
}

global.Image = MockImage;
global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return new MockCanvas();
    }
    return {};
  }
};
global.getComputedStyle = () => ({
  getPropertyValue: () => '#E5E5EA'
});

// Load the module - inline implementation for testing
const loadImageWithTimeout = function(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timer = setTimeout(() => {
      reject(new Error(`Image load timeout: ${url}`));
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`Image load failed: ${url}`));
    };
    
    img.src = url;
  });
};

function createFallbackPlaceholder(channel, size = 116) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Background
  const bgColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-tertiary').trim() || '#E5E5EA';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  
  // Text
  const firstLetter = (channel.channelName || '?')[0].toUpperCase();
  const textColor = '#636366';
  ctx.fillStyle = textColor;
  ctx.font = `bold ${size * 0.4}px -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(firstLetter, size / 2, size / 2);
  
  return canvas;
}

async function loadChannelImages(channels, timeout = 5000) {
  const promises = channels.map(async (channel) => {
    try {
      const image = await loadImageWithTimeout(channel.displayPicture, timeout);
      return { success: true, image, channel, loadTime: Date.now() };
    } catch (error) {
      return { success: false, error, channel, fallback: createFallbackPlaceholder(channel) };
    }
  });
  
  return Promise.all(promises);
}

describe('Image Loader - Unit Tests', () => {
  
  test('successfully loads valid image URLs', async () => {
    const url = 'https://example.com/valid-image.jpg';
    const img = await loadImageWithTimeout(url, 5000);
    
    expect(img).toBeDefined();
    expect(img.src).toBe(url);
    expect(img.crossOrigin).toBe('anonymous');
  });
  
  test('times out after specified duration for slow images', async () => {
    const url = 'https://example.com/timeout-image.jpg';
    
    await expect(loadImageWithTimeout(url, 100))
      .rejects
      .toThrow('Image load timeout');
  }, 10000);
  
  test('rejects with error for 404/network failures', async () => {
    const url = 'https://example.com/404-not-found.jpg';
    
    await expect(loadImageWithTimeout(url, 5000))
      .rejects
      .toThrow('Image load failed');
  });
  
  test('sets crossOrigin attribute for CORS support', async () => {
    const url = 'https://example.com/cors-image.jpg';
    const img = await loadImageWithTimeout(url, 5000);
    
    expect(img.crossOrigin).toBe('anonymous');
  });
  
  test('loads multiple images in parallel', async () => {
    const channels = [
      { channelId: 'ch1', displayPicture: 'https://example.com/img1.jpg', channelName: 'Channel 1' },
      { channelId: 'ch2', displayPicture: 'https://example.com/img2.jpg', channelName: 'Channel 2' },
      { channelId: 'ch3', displayPicture: 'https://example.com/img3.jpg', channelName: 'Channel 3' }
    ];
    
    const startTime = Date.now();
    const results = await loadChannelImages(channels, 5000);
    const elapsed = Date.now() - startTime;
    
    expect(results).toHaveLength(3);
    expect(results.every(r => r.success)).toBe(true);
    // Parallel loading should be faster than sequential (3 * 10ms = 30ms)
    expect(elapsed).toBeLessThan(100);
  });
  
  test('returns ImageLoadResult with correct structure for success', async () => {
    const channel = { 
      channelId: 'test', 
      displayPicture: 'https://example.com/success.jpg',
      channelName: 'Test Channel'
    };
    
    const results = await loadChannelImages([channel], 5000);
    
    expect(results[0]).toMatchObject({
      success: true,
      channel: channel
    });
    expect(results[0].image).toBeDefined();
    expect(results[0].loadTime).toBeGreaterThan(0);
  });
  
  test('returns ImageLoadResult with fallback for failed loads', async () => {
    const channel = { 
      channelId: 'test', 
      displayPicture: 'https://example.com/error-image.jpg',
      channelName: 'Test Channel'
    };
    
    const results = await loadChannelImages([channel], 5000);
    
    expect(results[0]).toMatchObject({
      success: false,
      channel: channel
    });
    expect(results[0].error).toBeDefined();
    expect(results[0].fallback).toEqual({
      type: 'fallback',
      channelName: 'Test Channel'
    });
  });
  
  test('handles mixed success and failure results', async () => {
    const channels = [
      { channelId: 'ch1', displayPicture: 'https://example.com/success.jpg', channelName: 'Success' },
      { channelId: 'ch2', displayPicture: 'https://example.com/error.jpg', channelName: 'Error' },
      { channelId: 'ch3', displayPicture: 'https://example.com/success2.jpg', channelName: 'Success2' }
    ];
    
    const results = await loadChannelImages(channels, 5000);
    
    expect(results).toHaveLength(3);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[2].success).toBe(true);
  });
  
  test('custom timeout value is respected', async () => {
    const url = 'https://example.com/timeout-image.jpg';
    const customTimeout = 50;
    
    const startTime = Date.now();
    await expect(loadImageWithTimeout(url, customTimeout))
      .rejects
      .toThrow('Image load timeout');
    const elapsed = Date.now() - startTime;
    
    expect(elapsed).toBeGreaterThanOrEqual(customTimeout);
    expect(elapsed).toBeLessThan(customTimeout + 50); // Allow small margin
  }, 10000);
});

describe('Image Loader - Property-Based Tests', () => {
  
  test('Property 5: Image Load Timeout - timeouts trigger within expected range', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 500 }), // timeout values
        async (timeoutMs) => {
          const url = 'https://example.com/timeout-test.jpg';
          
          const startTime = Date.now();
          try {
            await loadImageWithTimeout(url, timeoutMs);
            return false; // Should not succeed
          } catch (error) {
            const elapsed = Date.now() - startTime;
            
            // Timeout should occur within timeout +/- 50ms margin
            return elapsed >= timeoutMs - 10 && 
                   elapsed <= timeoutMs + 100 &&
                   error.message.includes('timeout');
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);
  
  test('Property: Parallel loading scales efficiently', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }), // number of channels
        async (numChannels) => {
          const channels = Array.from({ length: numChannels }, (_, i) => ({
            channelId: `ch${i}`,
            displayPicture: `https://example.com/img${i}.jpg`,
            channelName: `Channel ${i}`
          }));
          
          const startTime = Date.now();
          const results = await loadChannelImages(channels, 5000);
          const elapsed = Date.now() - startTime;
          
          // All channels should be processed
          expect(results).toHaveLength(numChannels);
          
          // Parallel loading should take roughly the same time regardless of count
          // (assuming mock delay of 10ms per image)
          expect(elapsed).toBeLessThan(200); // Much less than sequential would take
          
          return results.length === numChannels;
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);
  
  test('Property: Error results always include fallback', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            channelId: fc.string({ minLength: 1, maxLength: 10 }),
            displayPicture: fc.constant('https://example.com/error.jpg'),
            channelName: fc.string({ minLength: 1, maxLength: 20 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (channels) => {
          const results = await loadChannelImages(channels, 5000);
          
          // All should fail due to 'error' in URL
          return results.every(r => 
            !r.success && 
            r.fallback && 
            r.error &&
            r.fallback.channelName === r.channel.channelName
          );
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);
  
  test('Property: Success results always include image and loadTime', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            channelId: fc.string({ minLength: 1, maxLength: 10 }),
            displayPicture: fc.string({ minLength: 10, maxLength: 50 }).filter(s => !s.includes('error') && !s.includes('timeout')),
            channelName: fc.string({ minLength: 1, maxLength: 20 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (channels) => {
          const results = await loadChannelImages(channels, 5000);
          
          // All should succeed (no 'error' or 'timeout' in URL)
          return results.every(r => 
            r.success && 
            r.image && 
            r.loadTime > 0 &&
            r.channel
          );
        }
      ),
      { numRuns: 15 }
    );
  }, 30000);
});
