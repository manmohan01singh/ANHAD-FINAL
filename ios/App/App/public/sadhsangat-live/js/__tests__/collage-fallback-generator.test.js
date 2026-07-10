/**
 * Tests for Fallback Placeholder Generator
 * Task 1.3: Comprehensive test suite for fallback placeholder generation
 */

const fc = require('fast-check');

// Mock canvas for Node.js environment
class MockCanvas {
  constructor() {
    this.width = 0;
    this.height = 0;
    this._fillStyle = '';
    this._font = '';
    this._textAlign = '';
    this._textBaseline = '';
    this._operations = [];
  }
  
  getContext() {
    const self = this;
    return {
      get fillStyle() { return self._fillStyle; },
      set fillStyle(value) { 
        self._fillStyle = value;
        self._operations.push({ type: 'fillStyle', value });
      },
      get font() { return self._font; },
      set font(value) { 
        self._font = value;
        self._operations.push({ type: 'font', value });
      },
      get textAlign() { return self._textAlign; },
      set textAlign(value) { 
        self._textAlign = value;
        self._operations.push({ type: 'textAlign', value });
      },
      get textBaseline() { return self._textBaseline; },
      set textBaseline(value) { 
        self._textBaseline = value;
        self._operations.push({ type: 'textBaseline', value });
      },
      fillRect: (x, y, w, h) => {
        self._operations.push({ type: 'fillRect', x, y, w, h, fillStyle: self._fillStyle });
      },
      fillText: (text, x, y) => {
        self._operations.push({ type: 'fillText', text, x, y, fillStyle: self._fillStyle, font: self._font });
      },
      clearRect: (x, y, w, h) => {
        self._operations.push({ type: 'clearRect', x, y, w, h });
      }
    };
  }
}

global.document = {
  documentElement: {},
  createElement: (tag) => {
    if (tag === 'canvas') {
      return new MockCanvas();
    }
    return {};
  }
};

global.getComputedStyle = () => ({
  getPropertyValue: (prop) => {
    if (prop === '--bg-tertiary') return '#E5E5EA';
    if (prop === '--text-secondary') return '#636366';
    return '';
  }
});

// Load the module
const { createFallbackPlaceholder } = require('../collage-fallback-generator.js');

describe('Fallback Placeholder Generator - Unit Tests', () => {
  
  test('creates canvas of specified size (default 116px)', () => {
    const channel = { channelId: 'test', channelName: 'Test Channel' };
    const canvas = createFallbackPlaceholder(channel);
    
    expect(canvas.width).toBe(116);
    expect(canvas.height).toBe(116);
  });
  
  test('creates canvas of custom size', () => {
    const channel = { channelId: 'test', channelName: 'Test Channel' };
    const customSize = 58;
    const canvas = createFallbackPlaceholder(channel, customSize);
    
    expect(canvas.width).toBe(customSize);
    expect(canvas.height).toBe(customSize);
  });
  
  test('uses first letter of channel name as text', () => {
    const channel = { channelId: 'test', channelName: 'Test Channel' };
    const canvas = createFallbackPlaceholder(channel);
    
    const fillTextOp = canvas._operations.find(op => op.type === 'fillText');
    expect(fillTextOp).toBeDefined();
    expect(fillTextOp.text).toBe('T');
  });
  
  test('uppercases the first letter', () => {
    const channel = { channelId: 'test', channelName: 'test channel' };
    const canvas = createFallbackPlaceholder(channel);
    
    const fillTextOp = canvas._operations.find(op => op.type === 'fillText');
    expect(fillTextOp.text).toBe('T');
  });
  
  test('handles empty channel name with "?"', () => {
    const channel = { channelId: 'test', channelName: '' };
    const canvas = createFallbackPlaceholder(channel);
    
    const fillTextOp = canvas._operations.find(op => op.type === 'fillText');
    expect(fillTextOp.text).toBe('?');
  });
  
  test('handles null channel name with "?"', () => {
    const channel = { channelId: 'test', channelName: null };
    const canvas = createFallbackPlaceholder(channel);
    
    const fillTextOp = canvas._operations.find(op => op.type === 'fillText');
    expect(fillTextOp.text).toBe('?');
  });
  
  test('handles undefined channel name with "?"', () => {
    const channel = { channelId: 'test' };
    const canvas = createFallbackPlaceholder(channel);
    
    const fillTextOp = canvas._operations.find(op => op.type === 'fillText');
    expect(fillTextOp.text).toBe('?');
  });
  
  test('handles missing channel object with "?"', () => {
    const canvas = createFallbackPlaceholder(null);
    
    const fillTextOp = canvas._operations.find(op => op.type === 'fillText');
    expect(fillTextOp.text).toBe('?');
  });
  
  test('uses CSS variable colors for consistency', () => {
    const channel = { channelId: 'test', channelName: 'Test' };
    const canvas = createFallbackPlaceholder(channel);
    
    // Check background fill
    const fillRectOp = canvas._operations.find(op => op.type === 'fillRect');
    expect(fillRectOp.fillStyle).toBe('#E5E5EA');
    
    // Check text fill
    const fillTextOp = canvas._operations.find(op => op.type === 'fillText');
    expect(fillTextOp.fillStyle).toBe('#636366');
  });
  
  test('centers text in canvas', () => {
    const channel = { channelId: 'test', channelName: 'Test' };
    const size = 116;
    const canvas = createFallbackPlaceholder(channel, size);
    
    const fillTextOp = canvas._operations.find(op => op.type === 'fillText');
    expect(fillTextOp.x).toBe(size / 2);
    expect(fillTextOp.y).toBe(size / 2);
    
    const textAlignOp = canvas._operations.find(op => op.type === 'textAlign');
    expect(textAlignOp.value).toBe('center');
    
    const textBaselineOp = canvas._operations.find(op => op.type === 'textBaseline');
    expect(textBaselineOp.value).toBe('middle');
  });
  
  test('returns HTMLCanvasElement', () => {
    const channel = { channelId: 'test', channelName: 'Test' };
    const canvas = createFallbackPlaceholder(channel);
    
    expect(canvas).toBeDefined();
    expect(typeof canvas.getContext).toBe('function');
    expect(canvas.width).toBeDefined();
    expect(canvas.height).toBeDefined();
  });
  
  test('font size scales with canvas size', () => {
    const channel = { channelId: 'test', channelName: 'Test' };
    const sizes = [58, 116, 200];
    
    sizes.forEach(size => {
      const canvas = createFallbackPlaceholder(channel, size);
      const fontOp = canvas._operations.find(op => op.type === 'font');
      
      // Font should be 40% of canvas size
      const expectedFontSize = size * 0.4;
      expect(fontOp.value).toContain(`${expectedFontSize}px`);
    });
  });
  
  test('handles unicode characters correctly', () => {
    const channel = { channelId: 'test', channelName: 'ਗੁਰਬਾਣੀ' };
    const canvas = createFallbackPlaceholder(channel);
    
    const fillTextOp = canvas._operations.find(op => op.type === 'fillText');
    expect(fillTextOp.text).toBe('ਗ');
  });
  
  test('handles numeric first character', () => {
    const channel = { channelId: 'test', channelName: '24/7 Radio' };
    const canvas = createFallbackPlaceholder(channel);
    
    const fillTextOp = canvas._operations.find(op => op.type === 'fillText');
    expect(fillTextOp.text).toBe('2');
  });
  
  test('handles special characters', () => {
    const channel = { channelId: 'test', channelName: '@SpecialChannel' };
    const canvas = createFallbackPlaceholder(channel);
    
    const fillTextOp = canvas._operations.find(op => op.type === 'fillText');
    expect(fillTextOp.text).toBe('@');
  });
});

describe('Fallback Placeholder Generator - Property-Based Tests', () => {
  
  test('Property 4: Fallback Placeholder Generation - always creates valid canvas', () => {
    return fc.assert(
      fc.property(
        fc.record({
          channelId: fc.string({ minLength: 1, maxLength: 20 }),
          channelName: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: null })
        }),
        (channel) => {
          const canvas = createFallbackPlaceholder(channel);
          
          // Canvas must be valid
          expect(canvas).toBeDefined();
          expect(canvas.width).toBe(116);
          expect(canvas.height).toBe(116);
          
          // Must have text operation
          const fillTextOp = canvas._operations.find(op => op.type === 'fillText');
          expect(fillTextOp).toBeDefined();
          expect(fillTextOp.text).toBeDefined();
          expect(fillTextOp.text.length).toBe(1);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property: Canvas size always matches input parameter', () => {
    return fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 500 }),
        fc.record({
          channelId: fc.string({ minLength: 1 }),
          channelName: fc.string({ minLength: 1 })
        }),
        (size, channel) => {
          const canvas = createFallbackPlaceholder(channel, size);
          
          expect(canvas.width).toBe(size);
          expect(canvas.height).toBe(size);
          
          // Font size should scale with canvas size
          const fontOp = canvas._operations.find(op => op.type === 'font');
          expect(fontOp.value).toContain(`${size * 0.4}px`);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
  
  test('Property: Text always centered regardless of size', () => {
    return fc.assert(
      fc.property(
        fc.integer({ min: 20, max: 300 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (size, channelName) => {
          const channel = { channelId: 'test', channelName };
          const canvas = createFallbackPlaceholder(channel, size);
          
          const fillTextOp = canvas._operations.find(op => op.type === 'fillText');
          expect(fillTextOp.x).toBe(size / 2);
          expect(fillTextOp.y).toBe(size / 2);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
  
  test('Property: Empty or null names always produce "?"', () => {
    return fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (channelName) => {
          const channel = channelName === undefined 
            ? { channelId: 'test' }
            : { channelId: 'test', channelName };
          const canvas = createFallbackPlaceholder(channel);
          
          const fillTextOp = canvas._operations.find(op => op.type === 'fillText');
          expect(fillTextOp.text).toBe('?');
          
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });
  
  test('Property: Valid channel names produce uppercase first letter', () => {
    return fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (channelName) => {
          const channel = { channelId: 'test', channelName };
          const canvas = createFallbackPlaceholder(channel);
          
          const fillTextOp = canvas._operations.find(op => op.type === 'fillText');
          const expectedLetter = channelName[0].toUpperCase();
          
          expect(fillTextOp.text).toBe(expectedLetter);
          expect(fillTextOp.text.length).toBe(1);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
