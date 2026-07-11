import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Vitest Setup Verification', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have jsdom environment', () => {
    expect(document).toBeDefined();
    expect(window).toBeDefined();
  });

  it('should have Audio mock available', () => {
    const audio = new Audio();
    expect(audio).toBeDefined();
    expect(audio.play).toBeInstanceOf(Function);
    expect(audio.pause).toBeInstanceOf(Function);
  });

  it('should have localStorage mock available', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
    localStorage.clear();
  });

  it('should support fast-check property-based testing', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a; // Commutative property
      })
    );
  });
});
