/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Streak Restore Policy & Streak Saver Audit Test Suite
 * ═══════════════════════════════════════════════════════════════════════════════
 * Comprehensive verification for:
 * 1. Streak Restore Policy: 5 Sukhmani Sahib in 5 Hours to restore previous max streak
 * 2. 5-Hour Expiration & Progress Tracking (1-5 Sukhmani sessions)
 * 3. Local Storage Persistence & Continuity (preventing recalculation wiping)
 * 4. Streak Boost (/boost) restoring historical streak (e.g. 64 days broken 20 days ago)
 * 5. Data Backup Export & Import with Streak Restoration
 * 6. Streak Saver audit fixes (punishment addition when bani already in routine, atomic restore)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function loadEngine() {
  const enginePath = path.resolve(process.cwd(), 'frontend/lib/authoritative-streak-engine.js');
  delete require.cache[require.resolve(enginePath)];
  const mod = require(enginePath);
  return mod.AuthoritativeStreakEngine || mod;
}

function loadNitnemTracker(engine) {
  if (engine && typeof window !== 'undefined') {
    window.AuthoritativeStreakEngine = engine;
  }
  const src = fs.readFileSync(
    path.resolve(process.cwd(), 'frontend/NitnemTracker/nitnem-tracker.js'),
    'utf8'
  );
  const moduleObj = { exports: {} };
  const fn = new Function('window', 'document', 'navigator', 'localStorage', 'module', 'require', src);
  fn(window, document, navigator, window.localStorage, moduleObj, require);
  return moduleObj.exports;
}

describe('Streak Restore Policy (5 Sukhmani Sahib in 5 Hours)', () => {
  let engine;

  beforeEach(() => {
    localStorage.clear();
    engine = loadEngine();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes default streak restore policy state correctly', () => {
    const policy = engine.getStreakRestoreState();
    expect(policy).toBeDefined();
    expect(policy.active).toBe(false);
    expect(policy.status).toBe('idle');
    expect(policy.targetSukhmaniCount).toBe(5);
    expect(policy.completedSukhmaniCount).toBe(0);
    expect(policy.completedSessions).toEqual([]);
  });

  it('starts a 5-hour challenge with target streak defaulting to previous max streak', () => {
    // User had a 64-day streak that broke
    const state = engine.getState();
    state.currentStreak = 0;
    state.previousBestStreak = 64;
    state.longestStreak = 64;
    engine.saveState(state);

    const res = engine.startStreakRestoreChallenge();
    expect(res.challenge.active).toBe(true);
    expect(res.challenge.status).toBe('in_progress');
    expect(res.challenge.targetStreakToRestore).toBe(64);
    expect(res.challenge.completedSukhmaniCount).toBe(0);
    expect(res.challenge.startedAt).toBeDefined();
    expect(res.challenge.expiresAt).toBeDefined();

    // Verify 5-hour window duration (5 * 60 * 60 * 1000 = 18,000,000 ms)
    const startTime = new Date(res.challenge.startedAt).getTime();
    const expTime = new Date(res.challenge.expiresAt).getTime();
    expect(expTime - startTime).toBe(5 * 60 * 60 * 1000);

    // Verify persistence in localStorage
    const saved = JSON.parse(localStorage.getItem('anhad_streak_restore_challenge'));
    expect(saved.active).toBe(true);
    expect(saved.targetStreakToRestore).toBe(64);
  });

  it('tracks Sukhmani Sahib completions 1 through 4 incrementally', () => {
    engine.startStreakRestoreChallenge(45);

    // Record session 1
    const res1 = engine.recordSukhmaniCompletion('Sukhmani Sahib 1');
    expect(res1.success).toBe(true);
    expect(res1.completed).toBe(false);
    expect(res1.completedCount).toBe(1);
    expect(res1.remainingCount).toBe(4);

    // Record session 2
    const res2 = engine.recordSukhmaniCompletion('Sukhmani Sahib 2');
    expect(res2.completedCount).toBe(2);
    expect(res2.remainingCount).toBe(3);

    // Record sessions 3 and 4
    engine.recordSukhmaniCompletion('Sukhmani Sahib 3');
    const res4 = engine.recordSukhmaniCompletion('Sukhmani Sahib 4');
    expect(res4.completedCount).toBe(4);
    expect(res4.remainingCount).toBe(1);
    expect(res4.completed).toBe(false);

    // State still in progress
    const current = engine.getStreakRestoreState();
    expect(current.status).toBe('in_progress');
    expect(current.completedSessions.length).toBe(4);
  });

  it('fails and marks challenge as expired if 5 hours have passed', () => {
    vi.useFakeTimers();
    const baseTime = new Date('2026-10-16T08:00:00.000Z');
    vi.setSystemTime(baseTime);

    engine.startStreakRestoreChallenge(50);
    engine.recordSukhmaniCompletion('Sukhmani Sahib 1');

    // Advance time by 5 hours and 1 minute
    vi.setSystemTime(new Date('2026-10-16T13:01:00.000Z'));

    const res = engine.recordSukhmaniCompletion('Sukhmani Sahib 2');
    expect(res.success).toBe(false);
    expect(res.expired).toBe(true);

    const policy = engine.getStreakRestoreState();
    expect(policy.active).toBe(false);
    expect(policy.status).toBe('expired');
  });

  it('atomically restores previous max streak on 5th Sukhmani completion within 5 hours', () => {
    const targetStreak = 64;
    engine.startStreakRestoreChallenge(targetStreak);

    engine.recordSukhmaniCompletion('Sukhmani 1');
    engine.recordSukhmaniCompletion('Sukhmani 2');
    engine.recordSukhmaniCompletion('Sukhmani 3');
    engine.recordSukhmaniCompletion('Sukhmani 4');
    const res5 = engine.recordSukhmaniCompletion('Sukhmani 5');

    expect(res5.success).toBe(true);
    expect(res5.completed).toBe(true);
    expect(res5.completedCount).toBe(5);
    expect(res5.remainingCount).toBe(0);
    expect(res5.restorationResult).toBeDefined();
    expect(res5.restorationResult.restoredStreak).toBe(targetStreak);

    // Verify engine state
    const state = engine.getState();
    expect(state.currentStreak).toBe(targetStreak);
    expect(state.longestStreak).toBeGreaterThanOrEqual(targetStreak);
    expect(state.previousBestStreak).toBeGreaterThanOrEqual(targetStreak);
    expect(state.streakRestorePolicy.status).toBe('completed');
  });

  it('resets challenge on user reset request', () => {
    engine.startStreakRestoreChallenge(30);
    engine.recordSukhmaniCompletion('Sukhmani 1');

    const resetState = engine.resetStreakRestoreChallenge();
    expect(resetState.active).toBe(false);
    expect(resetState.status).toBe('idle');
    expect(resetState.completedSukhmaniCount).toBe(0);

    const reloaded = engine.getStreakRestoreState();
    expect(reloaded.active).toBe(false);
  });
});

describe('Streak Recalculation Continuity with Restored Streaks', () => {
  let engine;

  beforeEach(() => {
    localStorage.clear();
    engine = loadEngine();
  });

  it('does NOT wipe restored streak to 0 upon recalculateStreak()', () => {
    // Restore a 64-day streak
    engine.restoreStreakToMaximum(64);

    const beforeState = engine.getState();
    expect(beforeState.currentStreak).toBe(64);

    // Trigger recalculation (which previously reset patched streaks to 0)
    const recalculated = engine.recalculateStreak();
    expect(recalculated.currentStreak).toBe(64);
    expect(recalculated.longestStreak).toBeGreaterThanOrEqual(64);
  });
});

describe('Streak Boost (/boost) - 64-day streak broken 20 days ago scenario', () => {
  let engine;

  beforeEach(() => {
    localStorage.clear();
    engine = loadEngine();
  });

  it('restores streak to 64 days and backfills missing days leading up to today', () => {
    // Apply boost for 64 days
    const result = engine.applyStreakBoost(64, 20);

    expect(result.success).toBe(true);
    expect(result.restoredStreak).toBe(64);

    const state = engine.getState();
    expect(state.currentStreak).toBe(64);
    expect(state.longestStreak).toBe(64);
    expect(state.previousBestStreak).toBe(64);

    // Verify amritvela log has backfilled days with isStreakSaverPatch: true
    const amritvelaLog = JSON.parse(localStorage.getItem('nitnemTracker_amritvelaLog'));
    expect(Object.keys(amritvelaLog).length).toBeGreaterThanOrEqual(64);

    const todayStr = engine.getTodayString();
    expect(amritvelaLog[todayStr]).toBeDefined();
    expect(amritvelaLog[todayStr].woke).toBe(true);
    expect(amritvelaLog[todayStr].origin).toBe('restored');
  });
});

describe('Streak Saver System Audit & Bug Fixes', () => {
  let trackerExports;
  let engine;

  beforeEach(() => {
    localStorage.clear();
    engine = loadEngine();
    trackerExports = loadNitnemTracker(engine);

    if (trackerExports.Toast) {
      trackerExports.Toast.show = () => {};
      trackerExports.Toast.info = () => {};
      trackerExports.Toast.success = () => {};
      trackerExports.Toast.error = () => {};
      trackerExports.Toast.warning = () => {};
    }
  });

  it('addPunishmentToNitnem adds punishment even if bani is already in user selectedBanis', () => {
    const StreakSaverManager = trackerExports.StreakSaverManager;
    expect(StreakSaverManager).toBeDefined();

    // User already has Japji Sahib (ID: 2) in their daily routine
    const selectedBanis = {
      amritvela: [{ id: 2, name: 'Japji Sahib', period: 'amritvela', type: 'morning' }],
      rehras: [],
      sohila: []
    };
    localStorage.setItem('nitnemTracker_selectedBanis', JSON.stringify(selectedBanis));

    // Initialize saverData with punishment type 'japji'
    const saverData = {
      brokenStreak: 10,
      punishmentBanisAdded: false,
      punishment: { type: 'japji', name: 'Japji Sahib', id: 2, count: 1 }
    };
    StreakSaverManager.savePunishmentData(saverData);

    // Call addPunishmentToNitnem()
    StreakSaverManager.addPunishmentToNitnem(saverData.punishment);

    // Verify that punishment bani was added to selectedBanis with isPunishment: true
    const updatedBanis = JSON.parse(localStorage.getItem('nitnemTracker_selectedBanis'));
    const punishmentEntry = updatedBanis.amritvela.find(b => b.isPunishment === true);
    expect(punishmentEntry).toBeDefined();
    expect(punishmentEntry.id).toBe(2);
    expect(punishmentEntry.uid).toBeDefined();

    // Verify saverData flag was set to true
    const updatedSaver = StreakSaverManager.getActivePunishment();
    expect(updatedSaver.punishmentBanisAdded).toBe(true);
  });

  it('completePunishment() marks amritvelaLog with patch and restores streak without dropping to 0', () => {
    const StreakSaverManager = trackerExports.StreakSaverManager;

    // Seed broken streak of 40 days
    const state = engine.getState();
    state.currentStreak = 0;
    state.previousBestStreak = 40;
    state.longestStreak = 40;
    engine.saveState(state);

    const missedDate = '2026-10-15';
    StreakSaverManager.savePunishmentData({
      brokenStreak: 40,
      completed: false,
      punishment: { type: 'japji', name: 'Japji Sahib', id: 2, count: 1 },
      context: { missedDate }
    });

    // Complete punishment
    StreakSaverManager.completePunishment();

    // Verify saver is marked completed
    const storedSaver = JSON.parse(localStorage.getItem('nitnemTracker_streakSaver'));
    expect(storedSaver.completed).toBe(true);

    // Verify missedDate in amritvelaLog was patched
    const log = JSON.parse(localStorage.getItem('nitnemTracker_amritvelaLog'));
    expect(log[missedDate]).toBeDefined();
    expect(log[missedDate].woke).toBe(true);
    expect(log[missedDate].isStreakSaverPatch).toBe(true);

    // Verify streak is restored to 40
    const finalState = engine.getState();
    expect(finalState.currentStreak).toBe(40);
  });
});

describe('Data Backup Export & Import with Streak Preservation', () => {
  let trackerExports;
  let engine;

  beforeEach(() => {
    localStorage.clear();
    engine = loadEngine();
    trackerExports = loadNitnemTracker(engine);

    if (trackerExports.Toast) {
      trackerExports.Toast.show = () => {};
      trackerExports.Toast.info = () => {};
      trackerExports.Toast.success = () => {};
      trackerExports.Toast.error = () => {};
      trackerExports.Toast.warning = () => {};
    }
  });

  it('StreakBackupManager is exported and provides exportBackup and openImportModal', () => {
    const BackupManager = trackerExports.StreakBackupManager;
    expect(BackupManager).toBeDefined();
    expect(typeof BackupManager.exportBackup).toBe('function');
    expect(typeof BackupManager.openImportModal).toBe('function');
    expect(typeof BackupManager.processJsonString).toBe('function');
  });

  it('imports JSON backup and restores 64-day streak contiguously to today', () => {
    const BackupManager = trackerExports.StreakBackupManager;

    const backupPayload = {
      app: 'Anhad',
      appName: 'ANHAD Nitnem Progress Backup',
      metadata: {
        currentStreak: 64,
        previousBestStreak: 64,
        longestStreak: 64
      },
      data: {
        anhad_streak_data: {
          currentStreak: 64,
          previousBestStreak: 64,
          longestStreak: 64
        },
        nitnemTracker_amritvelaLog: {},
        nitnemTracker_nitnemLog: {}
      }
    };

    // Process backup JSON import
    BackupManager.processJsonString(JSON.stringify(backupPayload));

    // Verify that streak engine preserved 64-day streak
    const engineState = engine.getState();
    expect(engineState.currentStreak).toBe(64);
    expect(engineState.previousBestStreak).toBe(64);
    expect(engineState.longestStreak).toBe(64);

    // Verify recalculation preserves streak
    const recalc = engine.recalculateStreak();
    expect(recalc.currentStreak).toBe(64);
  });

  it('imports JSON backup where metadata is only on root object', () => {
    const BackupManager = trackerExports.StreakBackupManager;

    const rootOnlyPayload = {
      app: 'Anhad',
      metadata: { currentStreak: 55, previousBestStreak: 55 },
      data: {
        nitnemTracker_amritvelaLog: {},
        nitnemTracker_nitnemLog: {}
      }
    };

    BackupManager.processJsonString(JSON.stringify(rootOnlyPayload));
    expect(engine.getState().currentStreak).toBe(55);
  });
});

describe('Deep Edge Cases: rawRunLength, Reader Punishment Sync, Expiry Engine Cleanup, and Group Toggling', () => {
  let trackerExports;
  let engine;

  beforeEach(() => {
    localStorage.clear();
    engine = loadEngine();
    trackerExports = loadNitnemTracker(engine);

    if (trackerExports.Toast) {
      trackerExports.Toast.show = () => {};
      trackerExports.Toast.info = () => {};
      trackerExports.Toast.success = () => {};
      trackerExports.Toast.error = () => {};
      trackerExports.Toast.warning = () => {};
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('correctly calculates rawRunLength > 0 when runLength is populated', () => {
    // Seed 5 contiguous days up to today
    const todayStr = engine.getTodayString();
    const todayUtc = Math.floor(new Date(todayStr).getTime() / 86400000);
    
    // Seed amritvela log for 5 days
    const log = {};
    for (let i = 0; i < 5; i++) {
      const d = new Date((todayUtc - i) * 86400000).toISOString().split('T')[0];
      log[d] = { date: d, time: '04:00', woke: true, origin: 'user' };
    }
    localStorage.setItem('nitnemTracker_amritvelaLog', JSON.stringify(log));

    const state = engine.recalculateStreak(todayStr);
    expect(state.currentStreak).toBe(5);
  });

  it('checkPunishmentCompletion detects reader completion with "bani-2" format', () => {
    const StreakSaverManager = trackerExports.StreakSaverManager;
    const today = engine.getTodayString();

    StreakSaverManager.savePunishmentData({
      brokenStreak: 25,
      completed: false,
      punishment: { type: 'japji', name: 'Japji Sahib', id: 2, count: 1 },
      context: { missedDate: '2026-10-15' },
      savesRemaining: 5
    });

    // Nitnem log recorded reader completion as "bani-2"
    localStorage.setItem('nitnemTracker_nitnemLog', JSON.stringify({
      [today]: {
        amritvela: ['bani-2'],
        rehras: [],
        sohila: []
      }
    }));

    StreakSaverManager.checkPunishmentCompletion();

    const storedSaver = JSON.parse(localStorage.getItem('nitnemTracker_streakSaver'));
    expect(storedSaver.completed).toBe(true);
    expect(engine.getState().currentStreak).toBe(25);
  });

  it('checkAndCleanupExpired clears engine activeSavedStreak so streak stays 0 after recalculation', () => {
    const StreakSaverManager = trackerExports.StreakSaverManager;

    // Seed expired punishment and engine activeSavedStreak
    const state = engine.getState();
    state.activeSavedStreak = 30;
    state.savedStreakDate = '2026-10-01';
    state.currentStreak = 30;
    engine.saveState(state);

    StreakSaverManager.savePunishmentData({
      brokenStreak: 30,
      completed: false,
      expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      punishment: { type: 'japji', count: 1 }
    });

    // Run expiration cleanup
    StreakSaverManager.checkAndCleanupExpired();

    // Verify engine activeSavedStreak was cleared to 0
    const finalEngineState = engine.getState();
    expect(finalEngineState.activeSavedStreak).toBe(0);
    expect(finalEngineState.currentStreak).toBe(0);

    // Verify recalculation does not resurrect the expired streak
    const recalced = engine.recalculateStreak();
    expect(recalced.currentStreak).toBe(0);
  });

  it('toggleGroupCompletion matches punishment bani with numeric ID against string dataset baniId', () => {
    const NitnemManager = trackerExports.NitnemManager;
    if (!NitnemManager) return;

    // Initialize NitnemManager with punishment bani
    NitnemManager.selectedBanis = {
      amritvela: [{ id: 2, name: 'Japji Sahib', uid: 'punishment_2_0_123', isPunishment: true }],
      rehras: [],
      sohila: []
    };
    NitnemManager.completedToday = {
      amritvela: [],
      rehras: [],
      sohila: []
    };

    // Toggle completion passing string '2'
    NitnemManager.toggleGroupCompletion('2', 'amritvela');

    // Verify punishment bani uid was marked complete
    expect(NitnemManager.completedToday.amritvela).toContain('punishment_2_0_123');
  });

  it('StreakRestorePolicyManager.recordSukhmaniProgress advances active challenge', () => {
    const PolicyManager = trackerExports.StreakRestorePolicyManager;
    engine.startStreakRestoreChallenge(50);

    expect(engine.getStreakRestoreState().completedSukhmaniCount).toBe(0);

    PolicyManager.recordSukhmaniProgress('Reader Finished');

    expect(engine.getStreakRestoreState().completedSukhmaniCount).toBe(1);
  });

  it('prevents infinite recursion between saveState and streakUpdated listener', () => {
    let listenerCallCount = 0;
    const testListener = () => {
      listenerCallCount++;
      // Simulate listener trying to recalculate streak synchronously on update
      engine.recalculateStreak();
    };

    window.addEventListener('streakUpdated', testListener);

    expect(() => {
      engine.recalculateStreak();
    }).not.toThrow();

    window.removeEventListener('streakUpdated', testListener);
    // Verified: no RangeError: Maximum call stack size exceeded
    expect(listenerCallCount).toBeGreaterThan(0);
    expect(listenerCallCount).toBeLessThan(5);
  });

  it('StreakRestorePolicyManager and completePunishment handle missing/legacy engine gracefully', () => {
    const PolicyManager = trackerExports.StreakRestorePolicyManager;
    const SaverManager = trackerExports.StreakSaverManager;

    // Temporarily replace window.AuthoritativeStreakEngine with legacy object without methods
    const originalEngine = window.AuthoritativeStreakEngine;
    window.AuthoritativeStreakEngine = {
      getState: () => ({ currentStreak: 5, longestStreak: 10 }),
      saveState: () => {}
    };

    expect(() => {
      PolicyManager.init();
    }).not.toThrow();

    expect(() => {
      SaverManager.completePunishment();
    }).not.toThrow();

    window.AuthoritativeStreakEngine = originalEngine;
  });

  it('StreakRestorePolicyManager.renderUI creates container automatically if missing from DOM', () => {
    const PolicyManager = trackerExports.StreakRestorePolicyManager;
    document.body.innerHTML = `
      <div class="streak-stat-grid"></div>
    `;

    expect(document.getElementById('streakRestorePolicyContainer')).toBeNull();

    PolicyManager.renderUI();

    const created = document.getElementById('streakRestorePolicyContainer');
    expect(created).not.toBeNull();
    expect(created.innerHTML).toContain('Streak Restore Policy');
    expect(created.innerHTML).toContain('/boost');
  });
});

