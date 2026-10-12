/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Previous-Best Streak Recovery Challenge Test Suite (R2)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Verifies the 5-consecutive-day Amritvela recovery challenge:
 * - Eligibility gates: broken streak, elapsed delay (5–10 days, default 7), previousBest > current
 * - State persistence across sessions and reloads
 * - 5-consecutive-day challenge lifecycle progression (Day 1 of 5 to Day 5 of 5)
 * - Authentic Sri Guru Granth Sahib Gurbani passages with exact Unicode Gurmukhi & Ang citations
 * - Missed-day reset and failure handling with spiritual encouragement guidance
 * - Configurable delay window validation (5 to 10 days)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';

function loadEngine() {
  const enginePath = path.resolve(__dirname, '../../frontend/lib/authoritative-streak-engine.js');
  delete require.cache[require.resolve(enginePath)];
  const mod = require(enginePath);
  return mod.AuthoritativeStreakEngine || mod;
}

describe('R2: Previous-Best Streak Recovery Challenge', () => {
  let engine;

  beforeEach(() => {
    localStorage.clear();
    engine = loadEngine();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('1. Recovery Challenge Eligibility Gate', () => {
    it('is ineligible when streak is active and unbroken', () => {
      // User has 5-day active streak, previousBest=5
      engine.recordAmritvelaAttendance('2026-10-01', '04:00');
      engine.recordAmritvelaAttendance('2026-10-02', '04:00');
      engine.recordAmritvelaAttendance('2026-10-03', '04:00');
      engine.recordAmritvelaAttendance('2026-10-04', '04:00');
      engine.recordAmritvelaAttendance('2026-10-05', '04:00');

      expect(engine.isRecoveryEligible('2026-10-05')).toBe(false);
    });

    it('is ineligible if previousBestStreak is not greater than currentStreak', () => {
      // Brand new user with 0 streak
      expect(engine.isRecoveryEligible('2026-10-05')).toBe(false);
    });

    it('is ineligible before configured delay window (default 7 days)', () => {
      vi.useFakeTimers();

      // Seed a broken streak of 10 days that broke on 2026-10-01
      const state = engine.getState();
      state.previousBestStreak = 10;
      state.longestStreak = 10;
      state.currentStreak = 0;
      state.brokenStreak = {
        count: 10,
        brokenDate: '2026-10-01',
        lastCompletedDate: '2026-09-30'
      };
      engine.saveState(state);

      // On Day 1 after break (2026-10-02): elapsed = 1 -> ineligible
      expect(engine.isRecoveryEligible('2026-10-02')).toBe(false);

      // On Day 6 after break (2026-10-07): elapsed = 6 -> ineligible
      expect(engine.isRecoveryEligible('2026-10-07')).toBe(false);

      // On Day 7 after break (2026-10-08): elapsed = 7 -> ELIGIBLE!
      expect(engine.isRecoveryEligible('2026-10-08')).toBe(true);
    });

    it('respects configurable delay window between 5 and 10 days', () => {
      // Configure 5-day min delay
      const state = engine.getState();
      state.previousBestStreak = 14;
      state.brokenStreak = { count: 14, brokenDate: '2026-10-01', lastCompletedDate: '2026-09-30' };
      state.recoveryConfig = { minDelayDays: 5, requiredConsecutiveDays: 5 };
      engine.saveState(state);

      // On Day 4 (2026-10-05): elapsed = 4 -> ineligible
      expect(engine.isRecoveryEligible('2026-10-05')).toBe(false);

      // On Day 5 (2026-10-06): elapsed = 5 -> ELIGIBLE!
      expect(engine.isRecoveryEligible('2026-10-06')).toBe(true);
    });
  });

  describe('2. Challenge Initiation & State Persistence', () => {
    it('initiates challenge and persists across reloads', () => {
      // Seed eligible state
      const state = engine.getState();
      state.previousBestStreak = 12;
      state.brokenStreak = { count: 12, brokenDate: '2026-10-01', lastCompletedDate: '2026-09-30' };
      engine.saveState(state);

      // Start challenge on 2026-10-10
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-10T04:00:00'));

      const startResult = engine.startRecoveryChallenge();
      expect(startResult.success).toBe(true);
      expect(startResult.challenge.active).toBe(true);
      expect(startResult.challenge.status).toBe('in_progress');
      expect(startResult.challenge.currentDay).toBe(0);
      expect(startResult.challenge.brokenStreakCountToRestore).toBe(12);
      expect(startResult.passage).toBeDefined();
      expect(startResult.passage.ang).toBe(2);

      // Verify persistence across reload
      const reloadedEngine = loadEngine();
      const persistedState = reloadedEngine.getState();
      expect(persistedState.recoveryChallenge.active).toBe(true);
      expect(persistedState.recoveryChallenge.status).toBe('in_progress');
      expect(persistedState.recoveryChallenge.brokenStreakCountToRestore).toBe(12);
    });

    it('rejects initiation if user is not eligible', () => {
      // Ineligible state (unbroken streak)
      const startResult = engine.startRecoveryChallenge();
      expect(startResult.success).toBe(false);
      expect(startResult.error).toContain('not eligible');
    });
  });

  describe('3. 5-Consecutive-Day Challenge Lifecycle', () => {
    it('advances sequentially through Day 1 to Day 5 on consecutive days', () => {
      vi.useFakeTimers();

      // Seed eligible broken streak
      const state = engine.getState();
      state.previousBestStreak = 15;
      state.brokenStreak = { count: 15, brokenDate: '2026-10-01', lastCompletedDate: '2026-09-30' };
      engine.saveState(state);

      // Start challenge on 2026-10-10
      vi.setSystemTime(new Date('2026-10-10T04:00:00'));
      engine.startRecoveryChallenge();

      // Day 1 completion: 2026-10-10
      const day1 = engine.recordRecoveryDayCompletion('2026-10-10', '04:00');
      expect(day1.success).toBe(true);
      expect(day1.completed).toBe(false);
      expect(day1.dayNumber).toBe(1);
      expect(day1.passage.ang).toBe(2);

      // Day 2 completion: 2026-10-11
      vi.setSystemTime(new Date('2026-10-11T04:15:00'));
      const day2 = engine.recordRecoveryDayCompletion('2026-10-11', '04:15');
      expect(day2.success).toBe(true);
      expect(day2.completed).toBe(false);
      expect(day2.dayNumber).toBe(2);
      expect(day2.passage.ang).toBe(305);

      // Day 3 completion: 2026-10-12
      vi.setSystemTime(new Date('2026-10-12T03:50:00'));
      const day3 = engine.recordRecoveryDayCompletion('2026-10-12', '03:50');
      expect(day3.success).toBe(true);
      expect(day3.completed).toBe(false);
      expect(day3.dayNumber).toBe(3);
      expect(day3.passage.ang).toBe(449);

      // Day 4 completion: 2026-10-13
      vi.setSystemTime(new Date('2026-10-13T04:20:00'));
      const day4 = engine.recordRecoveryDayCompletion('2026-10-13', '04:20');
      expect(day4.success).toBe(true);
      expect(day4.completed).toBe(false);
      expect(day4.dayNumber).toBe(4);
      expect(day4.passage.ang).toBe(815);

      // Day 5 completion: 2026-10-14 -> COMPLETE!
      vi.setSystemTime(new Date('2026-10-14T04:05:00'));
      const day5 = engine.recordRecoveryDayCompletion('2026-10-14', '04:05');
      expect(day5.success).toBe(true);
      expect(day5.completed).toBe(true);
      expect(day5.dayNumber).toBe(5);
      expect(day5.passage.ang).toBe(1383);
      expect(day5.challenge.status).toBe('completed');
      expect(day5.restoration).toBeDefined();
    });

    it('rejects duplicate attendance on the same day during the challenge gracefully', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-10T04:00:00'));

      const state = engine.getState();
      state.previousBestStreak = 10;
      state.brokenStreak = { count: 10, brokenDate: '2026-10-01', lastCompletedDate: '2026-09-30' };
      engine.saveState(state);
      engine.startRecoveryChallenge();

      const firstAttempt = engine.recordRecoveryDayCompletion('2026-10-10', '04:00');
      expect(firstAttempt.success).toBe(true);
      expect(firstAttempt.dayNumber).toBe(1);

      // Second attempt on the same day
      const secondAttempt = engine.recordRecoveryDayCompletion('2026-10-10', '05:00');
      expect(secondAttempt.success).toBe(true);
      expect(secondAttempt.duplicate).toBe(true);
      expect(secondAttempt.currentDay).toBe(1);
    });
  });

  describe('4. Authentic SGGS Gurbani Passages & Ang Citations', () => {
    it('verifies all 5 daily passages have authentic Gurmukhi Unicode text and exact Ang references', () => {
      const passages = engine.CONFIG.GURBANI_PASSAGES;
      expect(passages).toHaveLength(5);

      // Day 1: Ang 2 (Japji Sahib)
      expect(passages[0].day).toBe(1);
      expect(passages[0].ang).toBe(2);
      expect(passages[0].source).toContain('Japji Sahib');
      expect(passages[0].author).toContain('Guru Nanak');
      expect(passages[0].gurmukhi).toBe('ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਸਚੁ ਨਾਉ ਵਡਿਆਈ ਵੀਚਾਰੁ ॥');
      expect(passages[0].translation).toContain('Amrit Vela');

      // Day 2: Ang 305 (Gauri Ki Var)
      expect(passages[1].day).toBe(2);
      expect(passages[1].ang).toBe(305);
      expect(passages[1].gurmukhi).toBe('ਗੁਰ ਸਤਿਗੁਰ ਕਾ ਜੋ ਸਿਖੁ ਅਖਾਏ ਸੁ ਭਲਕੇ ਉਠਿ ਹਰਿ ਨਾਮੁ ਧਿਆਵੈ ॥');
      expect(passages[1].translation).toContain('Sikh of the Guru');

      // Day 3: Ang 449 (Asa M:4)
      expect(passages[2].day).toBe(3);
      expect(passages[2].ang).toBe(449);
      expect(passages[2].gurmukhi).toBe('ਹਰਿ ਜਪੇ ਹਰਿ ਮੰਦਰੁ ਸਾਜਿਆ ਸੰਤ ਭਗਤ ਗੁਣ ਗਾਵਹਿ ਰਾਮ ॥');

      // Day 4: Ang 815 (Bilawal M:5)
      expect(passages[3].day).toBe(4);
      expect(passages[3].ang).toBe(815);
      expect(passages[3].gurmukhi).toBe('ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਆਮੀ ਪ੍ਰਭੁ ਅਪਨਾ ਸੀਤਲ ਤਨੁ ਮਨੁ ਛਾਤੀ ॥');

      // Day 5: Ang 1383 (Salok Farid Ji)
      expect(passages[4].day).toBe(5);
      expect(passages[4].ang).toBe(1383);
      expect(passages[4].author).toContain('Farid');
      expect(passages[4].gurmukhi).toBe('ਫਰੀਦਾ ਰਾਤਿ ਕਥੂਰੀ ਵੰਡੀਐ ਸੁਤਿਆ ਮਿਲੈ ਨ ਭਾਉ ॥');

      // Helper function getGurbaniPassage
      expect(engine.getGurbaniPassage(1).ang).toBe(2);
      expect(engine.getGurbaniPassage(5).ang).toBe(1383);
    });
  });

  describe('5. Challenge Failure & Reset on Missed Day', () => {
    it('resets challenge and provides spiritual encouragement when a day is skipped', () => {
      vi.useFakeTimers();

      // Seed and start challenge
      const state = engine.getState();
      state.previousBestStreak = 10;
      state.brokenStreak = { count: 10, brokenDate: '2026-10-01', lastCompletedDate: '2026-09-30' };
      engine.saveState(state);

      vi.setSystemTime(new Date('2026-10-10T04:00:00'));
      engine.startRecoveryChallenge();

      // Day 1 completed on 2026-10-10
      engine.recordRecoveryDayCompletion('2026-10-10', '04:00');

      // Day 2 (2026-10-11) is SKIPPED!
      // Attempting completion on Day 3 (2026-10-12): difference is 2 days
      vi.setSystemTime(new Date('2026-10-12T04:00:00'));
      const failureResult = engine.recordRecoveryDayCompletion('2026-10-12', '04:00');

      expect(failureResult.success).toBe(false);
      expect(failureResult.failed).toBe(true);
      expect(failureResult.message).toContain('resets your progress');
      expect(failureResult.message).toContain('grace and effort');
      expect(failureResult.retryAvailable).toBe(true);

      const currentState = engine.getState();
      expect(currentState.recoveryChallenge.status).toBe('failed');
      expect(currentState.recoveryChallenge.active).toBe(false);
      expect(currentState.recoveryChallenge.currentDay).toBe(0);
    });

    it('resetRecoveryChallenge resets active challenge to idle state', () => {
      const state = engine.getState();
      state.previousBestStreak = 10;
      state.brokenStreak = { count: 10, brokenDate: '2026-10-01', lastCompletedDate: '2026-09-30' };
      engine.saveState(state);
      engine.startRecoveryChallenge();

      const resetState = engine.resetRecoveryChallenge();
      expect(resetState.active).toBe(false);
      expect(resetState.status).toBe('idle');
      expect(resetState.currentDay).toBe(0);
    });
  });
});
