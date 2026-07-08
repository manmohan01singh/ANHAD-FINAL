/**
 * Unit Tests for Grid Layout Calculator
 * Feature: channel-collage-all-button
 */

const { calculateGridLayout } = require('./collage-grid-calculator');
const fc = require('fast-check');

describe('Grid Layout Calculator - Unit Tests', () => {
  describe('1 channel', () => {
    test('returns 1×1 grid with 116px cells', () => {
      const layout = calculateGridLayout(1);
      
      expect(layout.rows).toBe(1);
      expect(layout.cols).toBe(1);
      expect(layout.cellSize).toBe(116);
      expect(layout.totalCells).toBe(1);
      expect(layout.channelsToShow).toBe(1);
    });
  });

  describe('2-4 channels', () => {
    test('2 channels return 2×2 grid with 58px cells', () => {
      const layout = calculateGridLayout(2);
      
      expect(layout.rows).toBe(2);
      expect(layout.cols).toBe(2);
      expect(layout.cellSize).toBe(58);
      expect(layout.totalCells).toBe(4);
      expect(layout.channelsToShow).toBe(2);
    });

    test('3 channels return 2×2 grid with 58px cells', () => {
      const layout = calculateGridLayout(3);
      
      expect(layout.rows).toBe(2);
      expect(layout.cols).toBe(2);
      expect(layout.cellSize).toBe(58);
      expect(layout.totalCells).toBe(4);
      expect(layout.channelsToShow).toBe(3);
    });

    test('4 channels return 2×2 grid with 58px cells', () => {
      const layout = calculateGridLayout(4);
      
      expect(layout.rows).toBe(2);
      expect(layout.cols).toBe(2);
      expect(layout.cellSize).toBe(58);
      expect(layout.totalCells).toBe(4);
      expect(layout.channelsToShow).toBe(4);
    });
  });

  describe('5-9 channels', () => {
    test('5 channels return 3×3 grid with 38.67px cells', () => {
      const layout = calculateGridLayout(5);
      
      expect(layout.rows).toBe(3);
      expect(layout.cols).toBe(3);
      expect(layout.cellSize).toBe(38.67);
      expect(layout.totalCells).toBe(9);
      expect(layout.channelsToShow).toBe(5);
    });

    test('9 channels return 3×3 grid with 38.67px cells', () => {
      const layout = calculateGridLayout(9);
      
      expect(layout.rows).toBe(3);
      expect(layout.cols).toBe(3);
      expect(layout.cellSize).toBe(38.67);
      expect(layout.totalCells).toBe(9);
      expect(layout.channelsToShow).toBe(9);
    });
  });

  describe('10+ channels', () => {
    test('10 channels return 4×4 grid with 29px cells', () => {
      const layout = calculateGridLayout(10);
      
      expect(layout.rows).toBe(4);
      expect(layout.cols).toBe(4);
      expect(layout.cellSize).toBe(29);
      expect(layout.totalCells).toBe(16);
      expect(layout.channelsToShow).toBe(10);
    });

    test('16 channels return 4×4 grid with 29px cells', () => {
      const layout = calculateGridLayout(16);
      
      expect(layout.rows).toBe(4);
      expect(layout.cols).toBe(4);
      expect(layout.cellSize).toBe(29);
      expect(layout.totalCells).toBe(16);
      expect(layout.channelsToShow).toBe(16);
    });

    test('17 channels return 4×4 grid with max 16 channels to show', () => {
      const layout = calculateGridLayout(17);
      
      expect(layout.rows).toBe(4);
      expect(layout.cols).toBe(4);
      expect(layout.cellSize).toBe(29);
      expect(layout.totalCells).toBe(16);
      expect(layout.channelsToShow).toBe(16);
    });

    test('100 channels return 4×4 grid with max 16 channels to show', () => {
      const layout = calculateGridLayout(100);
      
      expect(layout.rows).toBe(4);
      expect(layout.cols).toBe(4);
      expect(layout.cellSize).toBe(29);
      expect(layout.totalCells).toBe(16);
      expect(layout.channelsToShow).toBe(16);
    });
  });

  describe('channelsToShow constraint', () => {
    test('channelsToShow never exceeds totalCells', () => {
      const testCases = [1, 2, 4, 5, 9, 10, 16, 20, 100];
      
      testCases.forEach(count => {
        const layout = calculateGridLayout(count);
        expect(layout.channelsToShow).toBeLessThanOrEqual(layout.totalCells);
        expect(layout.channelsToShow).toBe(Math.min(count, layout.totalCells));
      });
    });
  });

  describe('error handling', () => {
    test('throws error for zero channel count', () => {
      expect(() => calculateGridLayout(0)).toThrow('Channel count must be positive');
    });

    test('throws error for negative channel count', () => {
      expect(() => calculateGridLayout(-1)).toThrow('Channel count must be positive');
      expect(() => calculateGridLayout(-10)).toThrow('Channel count must be positive');
    });
  });
});

describe('Grid Layout Calculator - Property-Based Tests', () => {
  /**
   * Feature: channel-collage-all-button
   * Property 3: Grid Layout Correctness
   * 
   * For any channel count N, the CollageGenerator SHALL select the correct grid layout:
   * 1×1 for N=1, 2×2 for 2≤N≤4, 3×3 for 5≤N≤9, and 4×4 for N≥10,
   * displaying at most 16 channels.
   * 
   * **Validates: Requirements 2.2, 2.3, 2.4**
   */
  test('Property 3: Grid Layout Correctness - correct layout for any channel count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (channelCount) => {
          const layout = calculateGridLayout(channelCount);
          
          // Verify structure
          expect(layout).toHaveProperty('rows');
          expect(layout).toHaveProperty('cols');
          expect(layout).toHaveProperty('cellSize');
          expect(layout).toHaveProperty('totalCells');
          expect(layout).toHaveProperty('channelsToShow');
          
          // Verify totalCells = rows × cols
          expect(layout.totalCells).toBe(layout.rows * layout.cols);
          
          // Verify channelsToShow ≤ totalCells
          expect(layout.channelsToShow).toBeLessThanOrEqual(layout.totalCells);
          
          // Verify channelsToShow ≤ channelCount
          expect(layout.channelsToShow).toBeLessThanOrEqual(channelCount);
          
          // Verify correct grid selection based on channel count
          if (channelCount === 1) {
            expect(layout.rows).toBe(1);
            expect(layout.cols).toBe(1);
            expect(layout.cellSize).toBe(116);
            expect(layout.totalCells).toBe(1);
            expect(layout.channelsToShow).toBe(1);
          } else if (channelCount >= 2 && channelCount <= 4) {
            expect(layout.rows).toBe(2);
            expect(layout.cols).toBe(2);
            expect(layout.cellSize).toBe(58);
            expect(layout.totalCells).toBe(4);
            expect(layout.channelsToShow).toBe(channelCount);
          } else if (channelCount >= 5 && channelCount <= 9) {
            expect(layout.rows).toBe(3);
            expect(layout.cols).toBe(3);
            expect(layout.cellSize).toBe(38.67);
            expect(layout.totalCells).toBe(9);
            expect(layout.channelsToShow).toBe(channelCount);
          } else if (channelCount >= 10) {
            expect(layout.rows).toBe(4);
            expect(layout.cols).toBe(4);
            expect(layout.cellSize).toBe(29);
            expect(layout.totalCells).toBe(16);
            expect(layout.channelsToShow).toBe(Math.min(channelCount, 16));
          }
          
          // Verify channelsToShow is always ≤ 16 (maximum)
          expect(layout.channelsToShow).toBeLessThanOrEqual(16);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: channelsToShow never exceeds totalCells', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (channelCount) => {
          const layout = calculateGridLayout(channelCount);
          expect(layout.channelsToShow).toBeLessThanOrEqual(layout.totalCells);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: totalCells equals rows × cols', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (channelCount) => {
          const layout = calculateGridLayout(channelCount);
          expect(layout.totalCells).toBe(layout.rows * layout.cols);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: cellSize decreases as grid size increases', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (channelCount) => {
          const layout = calculateGridLayout(channelCount);
          
          // Verify cell size matches grid dimensions
          if (layout.rows === 1 && layout.cols === 1) {
            expect(layout.cellSize).toBe(116);
          } else if (layout.rows === 2 && layout.cols === 2) {
            expect(layout.cellSize).toBe(58);
          } else if (layout.rows === 3 && layout.cols === 3) {
            expect(layout.cellSize).toBe(38.67);
          } else if (layout.rows === 4 && layout.cols === 4) {
            expect(layout.cellSize).toBe(29);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: throws error for non-positive channel counts', () => {
    fc.assert(
      fc.property(
        fc.integer({ max: 0 }),
        (channelCount) => {
          expect(() => calculateGridLayout(channelCount)).toThrow('Channel count must be positive');
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
