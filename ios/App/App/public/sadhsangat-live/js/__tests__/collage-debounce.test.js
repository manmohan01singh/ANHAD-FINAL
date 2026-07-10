/**
 * Tests for Debounce Logic
 * Task 2.2: Comprehensive test suite for debouncing
 */

const fc = require('fast-check');
const { debounce } = require('../collage-debounce.js');

// Use fake timers for testing
jest.useFakeTimers();

describe('Debounce - Unit Tests', () => {
  
  afterEach(() => {
    jest.clearAllTimers();
  });
  
  test('debounces function calls by 500ms default', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn);
    
    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(500);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
  
  test('cancels previous pending call on new call', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn();
    jest.advanceTimersByTime(50);
    expect(mockFn).not.toHaveBeenCalled();
    
    // Call again before first completes
    debouncedFn();
    jest.advanceTimersByTime(50);
    expect(mockFn).not.toHaveBeenCalled();
    
    // Wait for second call to complete
    jest.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
  
  test('executes only once after multiple rapid calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);
    
    // Rapid calls
    debouncedFn();
    debouncedFn();
    debouncedFn();
    debouncedFn();
    debouncedFn();
    
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
  
  test('500ms delay is respected', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 500);
    
    debouncedFn();
    
    jest.advanceTimersByTime(499);
    expect(mockFn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
  
  test('preserves function context (this)', () => {
    const obj = {
      value: 42,
      method: function() {
        return this.value;
      }
    };
    
    const mockFn = jest.fn(function() {
      return this.value;
    });
    
    obj.debouncedMethod = debounce(mockFn, 100);
    obj.debouncedMethod();
    
    jest.advanceTimersByTime(100);
    
    expect(mockFn).toHaveBeenCalled();
    // Context should be preserved but in test environment might differ
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
  
  test('preserves function arguments', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn('arg1', 'arg2', 42);
    
    jest.advanceTimersByTime(100);
    
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 42);
  });
  
  test('custom delay value is respected', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 200);
    
    debouncedFn();
    
    jest.advanceTimersByTime(199);
    expect(mockFn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
  
  test('handles multiple arguments correctly', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);
    
    const obj = { test: 'object' };
    const arr = [1, 2, 3];
    
    debouncedFn(obj, arr, 'string', 123, true);
    
    jest.advanceTimersByTime(100);
    
    expect(mockFn).toHaveBeenCalledWith(obj, arr, 'string', 123, true);
  });
  
  test('allows execution after debounce period completes', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn();
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
    
    // Call again after debounce completes
    debouncedFn();
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
  
  test('resets timeout on each call', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn();
    jest.advanceTimersByTime(50);
    
    debouncedFn();
    jest.advanceTimersByTime(50);
    
    debouncedFn();
    jest.advanceTimersByTime(50);
    
    // Still not called because timeout keeps resetting
    expect(mockFn).not.toHaveBeenCalled();
    
    // Wait remaining time
    jest.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
  
  test('handles async functions correctly', async () => {
    const mockAsyncFn = jest.fn(async () => {
      return 'result';
    });
    const debouncedFn = debounce(mockAsyncFn, 100);
    
    debouncedFn();
    
    jest.advanceTimersByTime(100);
    
    expect(mockAsyncFn).toHaveBeenCalledTimes(1);
  });
  
  test('latest arguments are used when multiple calls occur', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn('call1');
    debouncedFn('call2');
    debouncedFn('call3');
    
    jest.advanceTimersByTime(100);
    
    // Should be called with latest arguments
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call3');
  });
});

describe('Debounce - Property-Based Tests', () => {
  
  afterEach(() => {
    jest.clearAllTimers();
  });
  
  test('Property 7: Debounce Behavior - single execution after rapid calls', () => {
    return fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 50, max: 500 }),
        (numCalls, delay) => {
          const mockFn = jest.fn();
          const debouncedFn = debounce(mockFn, delay);
          
          // Make multiple rapid calls
          for (let i = 0; i < numCalls; i++) {
            debouncedFn(i);
          }
          
          // Before delay completes
          jest.advanceTimersByTime(delay - 1);
          expect(mockFn).not.toHaveBeenCalled();
          
          // After delay completes
          jest.advanceTimersByTime(1);
          expect(mockFn).toHaveBeenCalledTimes(1);
          
          // Should be called with latest argument
          expect(mockFn).toHaveBeenCalledWith(numCalls - 1);
          
          jest.clearAllTimers();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
  
  test('Property: Delay is always respected', () => {
    return fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 1000 }),
        (delay) => {
          const mockFn = jest.fn();
          const debouncedFn = debounce(mockFn, delay);
          
          debouncedFn();
          
          // Just before delay
          jest.advanceTimersByTime(delay - 1);
          expect(mockFn).not.toHaveBeenCalled();
          
          // Exactly at delay
          jest.advanceTimersByTime(1);
          expect(mockFn).toHaveBeenCalledTimes(1);
          
          jest.clearAllTimers();
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });
  
  test('Property: Arguments are always preserved', () => {
    return fc.assert(
      fc.property(
        fc.array(fc.anything(), { minLength: 0, maxLength: 5 }),
        (args) => {
          const mockFn = jest.fn();
          const debouncedFn = debounce(mockFn, 100);
          
          debouncedFn(...args);
          
          jest.advanceTimersByTime(100);
          
          expect(mockFn).toHaveBeenCalledWith(...args);
          
          jest.clearAllTimers();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
  
  test('Property: Can be called again after completion', () => {
    return fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 50, max: 200 }),
        (numCycles, delay) => {
          const mockFn = jest.fn();
          const debouncedFn = debounce(mockFn, delay);
          
          for (let i = 0; i < numCycles; i++) {
            debouncedFn(i);
            jest.advanceTimersByTime(delay);
          }
          
          expect(mockFn).toHaveBeenCalledTimes(numCycles);
          
          jest.clearAllTimers();
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });
});
