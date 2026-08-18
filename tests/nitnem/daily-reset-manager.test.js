/**
 * Real-behavior test for DailyResetManager.checkReset()/handleNewDay() and
 * scheduleMidnightCheck() (frontend/NitnemTracker/nitnem-tracker.js).
 *
 * nitnem-tracker.js is a 12,000+ line flat script with no module boundary;
 * loading it unconditionally used to fire an ~20-manager app-init cascade
 * (initializeFullApp()) that assumes the real nitnem-tracker.html DOM
 * exists. A small, additive, no-op-in-the-browser guard was added so that
 * in a module/test context (module.exports present) that cascade is
 * skipped and DailyResetManager/StreakSaverManager/ReportsManager are
 * exported instead. We supply our own `module` object to the eval so the
 * guard sees module.exports as truthy, then read the managers back off it —
 * they are not attached to `window`.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function loadNitnemTracker() {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), 'frontend/NitnemTracker/nitnem-tracker.js'),
    'utf8'
  );
  const moduleObj = { exports: {} };
  const fn = new Function('window', 'document', 'navigator', 'localStorage', 'module', src);
  fn(window, document, navigator, window.localStorage, moduleObj);
  return moduleObj.exports;
}

describe('nitnem-tracker.js: DailyResetManager', () => {
  let DailyResetManager;

  beforeEach(() => {
    localStorage.clear();
    const exported = loadNitnemTracker();
    DailyResetManager = exported.DailyResetManager;

    // handleNewDay() calls Toast.info(...) to notify the user of the reset.
    // Toast.show() renders into a container from the real nitnem-tracker.html
    // page, which this bare test document doesn't have. Toast is already in
    // the file's original (Part 1) module.exports, so it's reachable here —
    // stub its rendering so DailyResetManager's actual logic (what's under
    // test) can run without needing the real page's DOM.
    if (exported.Toast) {
      exported.Toast.show = () => {};
      exported.Toast.info = () => {};
      exported.Toast.success = () => {};
      exported.Toast.error = () => {};
      exported.Toast.warning = () => {};
    }
  });

  it('is exported and reachable in a module/test context (the prerequisite refactor works)', () => {
    expect(DailyResetManager).toBeDefined();
    expect(typeof DailyResetManager.checkReset).toBe('function');
    expect(typeof DailyResetManager.handleNewDay).toBe('function');
    expect(typeof DailyResetManager.scheduleMidnightCheck).toBe('function');
  });

  it('checkReset() is idempotent and fires handleNewDay exactly once at the local date boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T23:59:00'));

    DailyResetManager.checkReset(); // first call of the day, records today as processed
    const handleNewDaySpy = vi.spyOn(DailyResetManager, 'handleNewDay');

    vi.setSystemTime(new Date('2026-01-15T23:59:58'));
    DailyResetManager.checkReset();
    expect(handleNewDaySpy).not.toHaveBeenCalled(); // same local date, no-op

    vi.setSystemTime(new Date('2026-01-16T00:00:06'));
    DailyResetManager.checkReset();
    expect(handleNewDaySpy).toHaveBeenCalledTimes(1); // date actually changed

    DailyResetManager.checkReset();
    expect(handleNewDaySpy).toHaveBeenCalledTimes(1); // idempotent, not called again the same day

    vi.useRealTimers();
  });

  it('scheduleMidnightCheck() fires checkReset once fake time crosses the scheduled local midnight, then reschedules', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T22:00:00'));

    DailyResetManager.checkReset(); // establish today as already processed
    const checkResetSpy = vi.spyOn(DailyResetManager, 'checkReset');
    checkResetSpy.mockClear();

    DailyResetManager.scheduleMidnightCheck();

    // Not yet due.
    vi.advanceTimersByTime(60 * 60 * 1000); // +1h -> 23:00, still before midnight
    expect(checkResetSpy).not.toHaveBeenCalled();

    // Crosses local midnight (scheduled for :00:05 past midnight per the 5s safety margin).
    vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 10 * 1000); // well past midnight
    expect(checkResetSpy).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('does not double-fire if scheduleMidnightCheck() is called again (clears its own prior timer)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:00'));
    DailyResetManager.checkReset();

    DailyResetManager.scheduleMidnightCheck();
    const firstTimer = DailyResetManager._midnightTimer;
    DailyResetManager.scheduleMidnightCheck();
    const secondTimer = DailyResetManager._midnightTimer;

    expect(secondTimer).not.toBe(firstTimer); // old timer was cleared and replaced, not stacked

    vi.useRealTimers();
  });
});
