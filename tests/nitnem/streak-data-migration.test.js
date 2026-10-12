/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Streak Data Migration & Storage Compatibility Test Suite (R5)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Verifies:
 * - Migration of legacy storage records from older schemas (current/longest -> currentStreak/longestStreak)
 * - Graceful fallback and error recovery on corrupted / malformed JSON strings
 * - Idempotent migration passes (state remains stable after repeated migrations)
 * - Preservation of user streak records and backward-compatible mirrors
 * - Theme token stability and dual light/dark mode attribute resilience
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';

function loadEngine() {
  const enginePath = path.resolve(__dirname, '../../frontend/lib/authoritative-streak-engine.js');
  delete require.cache[require.resolve(enginePath)];
  const mod = require(enginePath);
  return mod.AuthoritativeStreakEngine || mod;
}

describe('R5: Streak Data Migration & Storage Compatibility', () => {
  let engine;

  beforeEach(() => {
    localStorage.clear();
    engine = loadEngine();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('1. Legacy Schema Migration', () => {
    it('migrates older schema with current/longest into authoritative currentStreak/longestStreak', () => {
      // Seed older schema
      localStorage.setItem('anhad_streak_data', JSON.stringify({
        current: 12,
        longest: 24,
        lastCheckIn: '2026-09-20',
        freezesUsed: 1
      }));

      const state = engine.getState();

      expect(state.currentStreak).toBe(12);
      expect(state.longestStreak).toBe(24);
      expect(state.previousBestStreak).toBe(24); // Backfilled from longest
      expect(state.brokenStreak).toBeNull();
      expect(state.lastCheckIn).toBe('2026-09-20');
      // Legacy mirrors preserved
      expect(state.current).toBe(12);
      expect(state.longest).toBe(24);
    });

    it('migrates partial legacy record containing only current count', () => {
      localStorage.setItem('anhad_streak_data', JSON.stringify({
        current: 7
      }));

      const state = engine.getState();

      expect(state.currentStreak).toBe(7);
      expect(state.longestStreak).toBe(7);
      expect(state.previousBestStreak).toBe(7);
    });

    it('migrates legacy broken streak records preserving count and dates', () => {
      localStorage.setItem('anhad_streak_data', JSON.stringify({
        currentStreak: 0,
        longestStreak: 18,
        previousBestStreak: 18,
        brokenStreak: {
          count: '18',
          brokenDate: '2026-09-15',
          lastCompletedDate: '2026-09-14'
        }
      }));

      const state = engine.getState();

      expect(state.currentStreak).toBe(0);
      expect(state.brokenStreak).toBeDefined();
      expect(state.brokenStreak.count).toBe(18);
      expect(state.brokenStreak.brokenDate).toBe('2026-09-15');
      expect(state.brokenStreak.lastCompletedDate).toBe('2026-09-14');
    });
  });

  describe('2. Corrupted & Malformed JSON Resilience', () => {
    it('recovers gracefully from malformed JSON in anhad_streak_data without crashing', () => {
      localStorage.setItem('anhad_streak_data', '{ bad json, broken: [');

      expect(() => {
        const state = engine.getState();
        expect(state).toBeDefined();
        expect(state.currentStreak).toBe(0);
        expect(state.longestStreak).toBe(0);
        expect(state.previousBestStreak).toBe(0);
      }).not.toThrow();
    });

    it('recovers gracefully from malformed JSON in nitnemTracker_amritvelaLog and nitnemLog', () => {
      localStorage.setItem('nitnemTracker_amritvelaLog', '<<<NOT JSON>>>');
      localStorage.setItem('nitnemTracker_nitnemLog', '{"broken');

      expect(() => {
        const avg = engine.calculateAverageWakeUpTime();
        expect(avg).toBe('04:30'); // Clean fallback
      }).not.toThrow();

      expect(() => {
        const recalculated = engine.recalculateStreak('2026-10-12');
        expect(recalculated.currentStreak).toBe(0);
      }).not.toThrow();
    });

    it('handles non-object JSON values (null, numbers, strings) safely', () => {
      localStorage.setItem('anhad_streak_data', JSON.stringify(null));
      expect(engine.getState().currentStreak).toBe(0);

      localStorage.setItem('anhad_streak_data', JSON.stringify(42));
      expect(engine.getState().currentStreak).toBe(0);

      localStorage.setItem('anhad_streak_data', JSON.stringify('invalid_string'));
      expect(engine.getState().currentStreak).toBe(0);
    });
  });

  describe('3. Idempotent Migration Execution', () => {
    it('produces identical state when migration runs multiple consecutive times', () => {
      localStorage.setItem('anhad_streak_data', JSON.stringify({
        current: 10,
        longest: 20,
        lastCheckIn: '2026-10-01'
      }));

      const firstPass = engine.getState();
      engine.saveState(firstPass);

      for (let i = 0; i < 5; i++) {
        const subsequentPass = engine.getState();
        expect(subsequentPass.currentStreak).toBe(10);
        expect(subsequentPass.longestStreak).toBe(20);
        expect(subsequentPass.previousBestStreak).toBe(20);
        expect(subsequentPass.current).toBe(10);
        expect(subsequentPass.longest).toBe(20);
      }
    });
  });

  describe('4. Backward-Compatible Legacy Store Synchronization', () => {
    it('syncLegacyStores updates legacy stores without throwing on missing or partial targets', () => {
      // With no legacy data present
      expect(() => {
        engine.syncLegacyStores(engine.getState());
      }).not.toThrow();

      // With partial legacy unified stats
      localStorage.setItem('anhad_unified_stats', JSON.stringify({
        streaks: { nitnem: 0 }
      }));
      const state = engine.getState();
      state.currentStreak = 8;
      engine.syncLegacyStores(state);

      const unified = JSON.parse(localStorage.getItem('anhad_unified_stats') || '{}');
      expect(unified.streaks.nitnem).toBe(8);
    });
  });

  describe('5. Theme & Design Token Resilience', () => {
    it('verifies theme attribute switching does not alter or corrupt streak data state', () => {
      localStorage.setItem('anhad_streak_data', JSON.stringify({
        currentStreak: 5,
        longestStreak: 10,
        previousBestStreak: 10
      }));

      // Switch to light mode
      document.documentElement.setAttribute('data-theme', 'light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(engine.getState().currentStreak).toBe(5);

      // Switch to dark mode
      document.documentElement.setAttribute('data-theme', 'dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(engine.getState().currentStreak).toBe(5);
    });
  });
});
