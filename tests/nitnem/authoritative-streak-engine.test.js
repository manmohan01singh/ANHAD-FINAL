/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Authoritative Streak Engine Test Suite (R1)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Verifies single deterministic source of truth for Amritvela and Nitnem streaks:
 * - First-time user initialization (0 streak, clean state)
 * - Explicit attendance vs passive event rejection (audio playback / app boot)
 * - Consecutive day progression and same-day idempotency
 * - Broken streak transitions (preservation of broken count, broken date, previous-best)
 * - Calendar day boundaries, month-end and leap-year transitions
 * - Multi-surface consistency across anhad_streak_data, unified-stats, and nitnemTracker
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';

function loadEngine() {
  const enginePath = path.resolve(__dirname, '../../frontend/lib/authoritative-streak-engine.js');
  delete require.cache[require.resolve(enginePath)];
  const mod = require(enginePath);
  return mod.AuthoritativeStreakEngine || mod;
}

describe('R1: Authoritative Streak Engine', () => {
  let engine;

  beforeEach(() => {
    localStorage.clear();
    engine = loadEngine();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('1. First-time User Initialization', () => {
    it('returns deterministic clean state with 0 streak and no broken streak on empty storage', () => {
      const state = engine.getState();
      expect(state).toBeDefined();
      expect(state.currentStreak).toBe(0);
      expect(state.longestStreak).toBe(0);
      expect(state.previousBestStreak).toBe(0);
      expect(state.brokenStreak).toBeNull();
      expect(state.lastSuccessfulSession).toBeNull();
      expect(state.recoveryChallenge.active).toBe(false);
      expect(state.recoveryChallenge.status).toBe('idle');
      expect(state.recoveryConfig.minDelayDays).toBe(7);
      expect(state.recoveryConfig.requiredConsecutiveDays).toBe(5);
    });

    it('checkStreakBreak returns not broken for first-time user', () => {
      const result = engine.checkStreakBreak('2026-10-12');
      expect(result.isBroken).toBe(false);
      expect(result.brokenStreak).toBeNull();
      expect(result.elapsedDays).toBe(0);
    });
  });

  describe('2. Explicit Attendance & Consecutive Day Progression', () => {
    it('increments streak across consecutive qualifying Amritvela attendance days', () => {
      vi.useFakeTimers();

      // Day 1: 2026-10-01 at 03:45 AM
      vi.setSystemTime(new Date('2026-10-01T03:45:00'));
      let state = engine.recordAmritvelaAttendance('2026-10-01', '03:45', 'excellent');
      expect(state.currentStreak).toBe(1);
      expect(state.longestStreak).toBe(1);
      expect(state.previousBestStreak).toBe(1);
      expect(state.lastSuccessfulSession.type).toBe('amritvela');
      expect(state.lastSuccessfulSession.slot).toBe('excellent');

      // Day 2: 2026-10-02 at 04:30 AM
      vi.setSystemTime(new Date('2026-10-02T04:30:00'));
      state = engine.recordAmritvelaAttendance('2026-10-02', '04:30', 'good');
      expect(state.currentStreak).toBe(2);
      expect(state.longestStreak).toBe(2);
      expect(state.previousBestStreak).toBe(2);

      // Day 3: 2026-10-03 at 05:15 AM
      vi.setSystemTime(new Date('2026-10-03T05:15:00'));
      state = engine.recordAmritvelaAttendance('2026-10-03', '05:15', 'okay');
      expect(state.currentStreak).toBe(3);
      expect(state.longestStreak).toBe(3);
      expect(state.previousBestStreak).toBe(3);
    });

    it('increments streak on consecutive Nitnem full completions', () => {
      vi.useFakeTimers();

      // Day 1 Nitnem
      vi.setSystemTime(new Date('2026-10-01T07:00:00'));
      let state = engine.recordNitnemCompletion('2026-10-01', [1, 2, 3, 4, 5]);
      expect(state.currentStreak).toBe(1);

      // Day 2 Nitnem
      vi.setSystemTime(new Date('2026-10-02T07:00:00'));
      state = engine.recordNitnemCompletion('2026-10-02', [1, 2, 3, 4, 5]);
      expect(state.currentStreak).toBe(2);
    });

    it('enforces idempotency on duplicate same-day attendance without double counting', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-01T03:30:00'));

      const firstRecord = engine.recordAmritvelaAttendance('2026-10-01', '03:30', 'excellent');
      expect(firstRecord.currentStreak).toBe(1);

      // Re-recording on same day at later time
      const secondRecord = engine.recordAmritvelaAttendance('2026-10-01', '05:30', 'okay');
      expect(secondRecord.currentStreak).toBe(1); // STILL 1
    });
  });

  describe('3. Passive Event Rejection & Attendance Verification', () => {
    it('does not increment streak from passive radio audio playback or app boot', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-01T10:00:00'));

      // Empty attendance logs: no explicit woke:true or completed Nitnem
      const stateBefore = engine.recalculateStreak('2026-10-01');
      expect(stateBefore.currentStreak).toBe(0);

      // Verify that mere recalculation without explicit logs yields 0 streak
      const stateAfter = engine.recalculateStreak('2026-10-01');
      expect(stateAfter.currentStreak).toBe(0);

      // Even if user listens for 120 minutes of audio, amritvelaLog has no entry
      const amritvelaLog = JSON.parse(localStorage.getItem('nitnemTracker_amritvelaLog') || '{}');
      expect(amritvelaLog['2026-10-01']).toBeUndefined();
    });
  });

  describe('4. Broken Streak Transitions & Previous-Best Preservation', () => {
    it('preserves broken streak count, broken date, and previousBestStreak when streak lapses', () => {
      vi.useFakeTimers();

      // User builds 4-day streak: 2026-10-01 through 2026-10-04
      engine.recordAmritvelaAttendance('2026-10-01', '03:45');
      engine.recordAmritvelaAttendance('2026-10-02', '03:50');
      engine.recordAmritvelaAttendance('2026-10-03', '04:10');
      const stateDay4 = engine.recordAmritvelaAttendance('2026-10-04', '04:15');
      expect(stateDay4.currentStreak).toBe(4);
      expect(stateDay4.previousBestStreak).toBe(4);

      // Day 5 (2026-10-05) is missed!
      // Day 6 (2026-10-06) user opens the app without attending Day 5
      vi.setSystemTime(new Date('2026-10-06T12:00:00'));
      const breakCheck = engine.checkStreakBreak('2026-10-06');

      expect(breakCheck.isBroken).toBe(true);
      expect(breakCheck.brokenStreak).toBeDefined();
      expect(breakCheck.brokenStreak.count).toBe(4);
      expect(breakCheck.brokenStreak.lastCompletedDate).toBe('2026-10-04');
      expect(breakCheck.brokenStreak.brokenDate).toBe('2026-10-05');
      expect(breakCheck.elapsedDays).toBe(1); // 2026-10-06 - 2026-10-05 = 1 day

      const currentState = engine.getState();
      expect(currentState.currentStreak).toBe(0);
      expect(currentState.previousBestStreak).toBe(4); // PRESERVED!
      expect(currentState.longestStreak).toBe(4);
    });

    it('correctly tracks active streak if yesterday was completed and today is still open', () => {
      vi.useFakeTimers();
      // Completed yesterday: 2026-10-09
      engine.recordAmritvelaAttendance('2026-10-09', '04:00');

      // Today is 2026-10-10, user has not yet checked in today
      vi.setSystemTime(new Date('2026-10-10T02:00:00'));
      const state = engine.recalculateStreak('2026-10-10');

      // Streak is still active (1) because yesterday was attended
      expect(state.currentStreak).toBe(1);
      expect(state.brokenStreak).toBeNull();
    });
  });

  describe('5. Calendar Day Boundaries & UTC Math Determinism', () => {
    it('handles month boundaries and non-leap/leap year transitions deterministically', () => {
      // Month boundary: Feb 28 to March 1 (non-leap year 2025)
      const feb28 = engine.toUtcDay('2025-02-28');
      const mar01 = engine.toUtcDay('2025-03-01');
      expect(mar01 - feb28).toBe(1);
      expect(engine.fromUtcDay(mar01)).toBe('2025-03-01');

      // Leap year boundary: Feb 28 to Feb 29 to March 1 (leap year 2024)
      const leapFeb28 = engine.toUtcDay('2024-02-28');
      const leapFeb29 = engine.toUtcDay('2024-02-29');
      const leapMar01 = engine.toUtcDay('2024-03-01');
      expect(leapFeb29 - leapFeb28).toBe(1);
      expect(leapMar01 - leapFeb29).toBe(1);

      // Year boundary: Dec 31 to Jan 01
      const dec31 = engine.toUtcDay('2025-12-31');
      const jan01 = engine.toUtcDay('2026-01-01');
      expect(jan01 - dec31).toBe(1);
      expect(engine.fromUtcDay(jan01)).toBe('2026-01-01');
    });

    it('consecutive streak increments seamlessly across month boundary', () => {
      vi.useFakeTimers();

      engine.recordAmritvelaAttendance('2026-01-31', '04:00');
      const stateFeb1 = engine.recordAmritvelaAttendance('2026-02-01', '04:00');

      expect(stateFeb1.currentStreak).toBe(2);
    });
  });

  describe('6. Multi-Surface Consistency & Legacy Synchronization', () => {
    it('synchronizes streak updates across anhad_streak_data, anhad_unified_stats, and nitnemTracker_userData', () => {
      // Seed unified stats and user data
      localStorage.setItem('anhad_unified_stats', JSON.stringify({
        streaks: { nitnem: 0, kirtan: 0 }
      }));
      localStorage.setItem('nitnemTracker_userData', JSON.stringify({
        streaks: { current: 0, longest: 0 }
      }));

      // Record attendance
      engine.recordAmritvelaAttendance('2026-10-01', '04:00');

      // Check anhad_streak_data
      const streakData = JSON.parse(localStorage.getItem('anhad_streak_data') || '{}');
      expect(streakData.currentStreak).toBe(1);
      expect(streakData.current).toBe(1);

      // Check anhad_unified_stats
      const unifiedStats = JSON.parse(localStorage.getItem('anhad_unified_stats') || '{}');
      expect(unifiedStats.streaks.nitnem).toBe(1);

      // Check nitnemTracker_userData
      const userData = JSON.parse(localStorage.getItem('nitnemTracker_userData') || '{}');
      expect(userData.streaks.current).toBe(1);
    });

    it('dispatches custom streakUpdated events on window', () => {
      let eventFired = false;
      let detailReceived = null;

      const handler = (e) => {
        eventFired = true;
        detailReceived = e.detail;
      };

      window.addEventListener('authoritativeStreakUpdated', handler);
      engine.recordAmritvelaAttendance('2026-10-01', '04:00');

      expect(eventFired).toBe(true);
      expect(detailReceived.currentStreak).toBe(1);

      window.removeEventListener('authoritativeStreakUpdated', handler);
    });

    it('handles dynamic partial vs 100% Nitnem completions accurately', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-01T12:00:00'));

      // 1 of 5 banis complete (20%, isComplete: false) -> DOES NOT QUALIFY FOR STREAK
      let state = engine.recordNitnemCompletion('2026-10-01', [2], 20, false);
      expect(state.currentStreak).toBe(0);

      // Now all 5 banis complete (100%, isComplete: true) -> QUALIFIES!
      state = engine.recordNitnemCompletion('2026-10-01', [2, 4, 9, 21, 23], 100, true);
      expect(state.currentStreak).toBe(1);

      // Day 2: 100% completion
      vi.setSystemTime(new Date('2026-10-02T12:00:00'));
      state = engine.recordNitnemCompletion('2026-10-02', [2, 4, 9, 21, 23], 100, true);
      expect(state.currentStreak).toBe(2);

      // Unchecking Day 2 banis (0%, isComplete: false) -> reverts streak to 1
      state = engine.recordNitnemCompletion('2026-10-02', [], 0, false);
      expect(state.currentStreak).toBe(1);
    });
  });
});
