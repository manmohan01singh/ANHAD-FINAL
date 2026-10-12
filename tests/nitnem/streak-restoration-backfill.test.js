/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Deterministic Streak Restoration & Historical Gap Backfilling Test Suite (R3)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Verifies:
 * - Atomic streak restoration upon completing Day 5 (previous-best + 5 challenge days)
 * - Calculation of average historical wake-up time from genuine entries with "04:30" fallback
 * - Transparent gap backfilling with origin: "restored" and systemGenerated: true
 * - Exclusion of restored records from genuine wake-up performance analytics
 * - Non-destructive integrity (genuine records are NEVER overwritten)
 * - Idempotent restoration execution (no duplicate double-restores)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';

function loadEngine() {
  const enginePath = path.resolve(__dirname, '../../frontend/lib/authoritative-streak-engine.js');
  delete require.cache[require.resolve(enginePath)];
  const mod = require(enginePath);
  return mod.AuthoritativeStreakEngine || mod;
}

describe('R3: Deterministic Streak Restoration & Historical Gap Backfilling', () => {
  let engine;

  beforeEach(() => {
    localStorage.clear();
    engine = loadEngine();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('1. Average Historical Wake-up Time Calculation', () => {
    it('calculates exact average wake-up time from genuine historical timestamps', () => {
      // Seed 3 genuine attendance entries in nitnemTracker_amritvelaLog:
      // 03:30 (210 mins), 04:00 (240 mins), 04:30 (270 mins) -> avg = 240 mins = "04:00"
      localStorage.setItem('nitnemTracker_amritvelaLog', JSON.stringify({
        '2026-09-01': { date: '2026-09-01', time: '03:30', slot: 'excellent', woke: true, origin: 'user' },
        '2026-09-02': { date: '2026-09-02', time: '04:00', slot: 'good', woke: true, origin: 'user' },
        '2026-09-03': { date: '2026-09-03', time: '04:30', slot: 'good', woke: true, origin: 'user' }
      }));

      const avg = engine.calculateAverageWakeUpTime();
      expect(avg).toBe('04:00');
    });

    it('falls back deterministically to "04:30" when no genuine historical timestamps exist', () => {
      // Empty amritvela log
      const avg = engine.calculateAverageWakeUpTime();
      expect(avg).toBe('04:30');
    });

    it('strictly excludes existing restored records and penalty patches from average calculation', () => {
      // Genuine entry: 05:00 (300 mins)
      // Restored entry: 02:00 (120 mins) -> MUST BE EXCLUDED!
      // Streak saver patch: 01:00 (60 mins) -> MUST BE EXCLUDED!
      localStorage.setItem('nitnemTracker_amritvelaLog', JSON.stringify({
        '2026-09-01': { date: '2026-09-01', time: '05:00', slot: 'okay', woke: true, origin: 'user' },
        '2026-09-02': { date: '2026-09-02', time: '02:00', slot: 'excellent', woke: true, origin: 'restored', systemGenerated: true },
        '2026-09-03': { date: '2026-09-03', time: '01:00', slot: 'excellent', woke: true, isStreakSaverPatch: true }
      }));

      const avg = engine.calculateAverageWakeUpTime();
      expect(avg).toBe('05:00'); // only genuine 05:00 counted!
    });
  });

  describe('2. Atomic Streak Restoration on Day 5 Completion', () => {
    it('transactionally restores previous-best streak + 5 challenge days atomically', () => {
      vi.useFakeTimers();

      // Seed state: previousBest = 15, broken streak count = 15, broken on 2026-10-01
      const state = engine.getState();
      state.previousBestStreak = 15;
      state.longestStreak = 15;
      state.currentStreak = 0;
      state.brokenStreak = {
        count: 15,
        brokenDate: '2026-10-01',
        lastCompletedDate: '2026-09-30'
      };
      engine.saveState(state);

      // Start challenge on 2026-10-10
      vi.setSystemTime(new Date('2026-10-10T04:00:00'));
      engine.startRecoveryChallenge();

      // Complete Days 1 through 4
      engine.recordRecoveryDayCompletion('2026-10-10', '04:00');
      vi.setSystemTime(new Date('2026-10-11T04:00:00'));
      engine.recordRecoveryDayCompletion('2026-10-11', '04:00');
      vi.setSystemTime(new Date('2026-10-12T04:00:00'));
      engine.recordRecoveryDayCompletion('2026-10-12', '04:00');
      vi.setSystemTime(new Date('2026-10-13T04:00:00'));
      engine.recordRecoveryDayCompletion('2026-10-13', '04:00');

      // Day 5 Completion!
      vi.setSystemTime(new Date('2026-10-14T04:00:00'));
      const day5Result = engine.recordRecoveryDayCompletion('2026-10-14', '04:00');

      expect(day5Result.success).toBe(true);
      expect(day5Result.completed).toBe(true);

      // Verify restored streak: 15 (target) + 5 (challenge days) = 20
      const updatedState = engine.getState();
      expect(updatedState.currentStreak).toBe(20);
      expect(updatedState.longestStreak).toBe(20);
      expect(updatedState.previousBestStreak).toBe(20);
      expect(updatedState.brokenStreak).toBeNull(); // Broken streak is resolved!
      expect(updatedState.recoveryChallenge.status).toBe('completed');
      expect(updatedState.recoveryChallenge.active).toBe(false);
    });
  });

  describe('3. Transparent Historical Gap Backfilling & Non-Destructive Integrity', () => {
    it('backfills missing gap dates between brokenDate and challenge start with origin: "restored"', () => {
      // Broken on 2026-10-01, challenge Day 1 started on 2026-10-05 (4 gap dates: 10-01, 10-02, 10-03, 10-04)
      const state = engine.getState();
      state.previousBestStreak = 10;
      state.brokenStreak = {
        count: 10,
        brokenDate: '2026-10-01',
        lastCompletedDate: '2026-09-30'
      };
      state.recoveryChallenge = {
        active: false,
        startDay: '2026-10-05',
        currentDay: 5,
        qualifyingDays: ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'],
        brokenStreakCountToRestore: 10,
        status: 'completed',
        lastCompletedDate: '2026-10-09'
      };
      engine.saveState(state);

      // Seed a genuine attendance timestamp on earlier date to give average wake time "03:45"
      localStorage.setItem('nitnemTracker_amritvelaLog', JSON.stringify({
        '2026-09-29': { date: '2026-09-29', time: '03:45', slot: 'excellent', woke: true, origin: 'user' }
      }));

      const restoration = engine.restoreStreakAndBackfillGaps(state);
      expect(restoration.success).toBe(true);
      expect(restoration.backfilledCount).toBe(4);
      expect(restoration.backfilledDates).toEqual(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);

      // Inspect backfilled records in storage
      const log = JSON.parse(localStorage.getItem('nitnemTracker_amritvelaLog') || '{}');
      expect(log['2026-10-01']).toBeDefined();
      expect(log['2026-10-01'].origin).toBe('restored');
      expect(log['2026-10-01'].systemGenerated).toBe(true);
      expect(log['2026-10-01'].time).toBe('03:45');
      expect(log['2026-10-01'].slot).toBe('excellent');
      expect(log['2026-10-01'].woke).toBe(true);
    });

    it('NEVER overwrites genuine attendance records existing within the gap range', () => {
      // Gap range: 2026-10-01 to 2026-10-03
      // Suppose user had an genuine attendance entry on 2026-10-02 (e.g. at 05:30)
      localStorage.setItem('nitnemTracker_amritvelaLog', JSON.stringify({
        '2026-10-02': { date: '2026-10-02', time: '05:30', slot: 'okay', woke: true, origin: 'user', note: 'genuine attendance' }
      }));

      const state = engine.getState();
      state.previousBestStreak = 10;
      state.brokenStreak = { count: 10, brokenDate: '2026-10-01', lastCompletedDate: '2026-09-30' };
      state.recoveryChallenge = {
        active: false,
        startDay: '2026-10-04',
        currentDay: 5,
        qualifyingDays: ['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'],
        status: 'completed'
      };
      engine.saveState(state);

      engine.restoreStreakAndBackfillGaps(state);

      const log = JSON.parse(localStorage.getItem('nitnemTracker_amritvelaLog') || '{}');

      // 2026-10-01 was missing -> backfilled
      expect(log['2026-10-01'].origin).toBe('restored');

      // 2026-10-02 was GENUINE -> PRESERVED! Not overwritten!
      expect(log['2026-10-02'].origin).toBe('user');
      expect(log['2026-10-02'].note).toBe('genuine attendance');
      expect(log['2026-10-02'].time).toBe('05:30');
    });
  });

  describe('4. Performance Metrics & Analytics Isolation', () => {
    it('getGenuineAmritvelaEntries isolates genuine records from restored records', () => {
      localStorage.setItem('nitnemTracker_amritvelaLog', JSON.stringify({
        '2026-10-01': { date: '2026-10-01', time: '04:00', slot: 'good', woke: true, origin: 'user' },
        '2026-10-02': { date: '2026-10-02', time: '04:30', slot: 'good', woke: true, origin: 'restored', systemGenerated: true },
        '2026-10-03': { date: '2026-10-03', time: '04:15', slot: 'good', woke: true, isStreakSaverPatch: true },
        '2026-10-04': { date: '2026-10-04', time: '03:50', slot: 'excellent', woke: true, origin: 'user' }
      }));

      const genuine = engine.getGenuineAmritvelaEntries();
      const genuineDates = Object.keys(genuine);

      // Only 2026-10-01 and 2026-10-04 are genuine
      expect(genuineDates).toEqual(['2026-10-01', '2026-10-04']);
      expect(genuine['2026-10-02']).toBeUndefined();
      expect(genuine['2026-10-03']).toBeUndefined();
    });
  });

  describe('5. Idempotent Restoration Execution', () => {
    it('calling restoreStreakAndBackfillGaps multiple times does not duplicate streak or overwrite records', () => {
      const state = engine.getState();
      state.previousBestStreak = 10;
      state.brokenStreak = { count: 10, brokenDate: '2026-10-01', lastCompletedDate: '2026-09-30' };
      state.recoveryChallenge = {
        active: false,
        startDay: '2026-10-05',
        currentDay: 5,
        qualifyingDays: ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'],
        status: 'completed'
      };
      engine.saveState(state);

      // First run
      const res1 = engine.restoreStreakAndBackfillGaps(state);
      expect(res1.restoredStreak).toBe(15);
      expect(res1.backfilledCount).toBe(4);

      // Second run (re-running restoration with the original broken streak date range)
      const stateWithBroken = JSON.parse(JSON.stringify(state));
      stateWithBroken.brokenStreak = { count: 10, brokenDate: '2026-10-01', lastCompletedDate: '2026-09-30' };
      const res2 = engine.restoreStreakAndBackfillGaps(stateWithBroken);
      // Backfilled count on second run is 0 (all dates already populated)
      expect(res2.backfilledCount).toBe(0);
      expect(res2.restoredStreak).toBe(15);
      expect(engine.getState().currentStreak).toBe(15); // NOT double-restored!

      // Attempting to advance a completed challenge via lifecycle is rejected
      const duplicateAttempt = engine.recordRecoveryDayCompletion('2026-10-10', '04:00');
      expect(duplicateAttempt.success).toBe(false);
      expect(duplicateAttempt.error).toContain('No active recovery challenge in progress');
    });
  });
});
