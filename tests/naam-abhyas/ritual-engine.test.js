/**
 * Real-behavior tests for RitualEngine (frontend/NaamAbhyas/components/ritual-engine.js).
 *
 * RitualEngine is a plain top-level class (window.RitualEngine = RitualEngine,
 * no IIFE closure trap), loaded here the same way vitest.setup.js loads the
 * audio singleton: read the real file, execute it via `new Function(...)`.
 * All assertions exercise the actual shipped methods, not reimplementations.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

beforeAll(() => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), 'frontend/NaamAbhyas/components/ritual-engine.js'),
    'utf8'
  );
  new Function('window', 'document', 'navigator', 'localStorage', src)(
    window, document, navigator, window.localStorage
  );
});

function createMockApp(overrides = {}) {
  return {
    recordSession: vi.fn(),
    updateStreak: vi.fn(),
    skipCurrentSession: vi.fn(),
    updateUI: vi.fn(),
    requestWakeLock: vi.fn(),
    releaseWakeLock: vi.fn(),
    playSound: vi.fn(),
    currentSchedule: {},
    audioManager: {
      audioContext: null,
      initAudioContext: vi.fn(),
      playAmbient: vi.fn().mockResolvedValue(true),
      stopAmbient: vi.fn(),
      mute: vi.fn(),
      unmute: vi.fn(),
    },
    config: { notifications: { vibration: false } },
    history: { statistics: { totalTimeSeconds: 0, currentStreak: 0 }, sessions: [] },
    getTodayString: () => '2026-01-15',
    ...overrides,
  };
}

describe('RitualEngine: pause-on-background (countdown deadline shift)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.getElementById('ritualOverlay')?.remove();
    document.body.classList.remove('timer-active');
  });
  afterEach(() => {
    vi.useRealTimers();
    document.hidden = false;
  });

  it('shifts countdownEndTime forward by exactly the backgrounded duration, not counting it against the timer', () => {
    vi.useFakeTimers();
    const T0 = new Date('2026-01-15T10:00:00.000Z');
    vi.setSystemTime(T0);

    const engine = new window.RitualEngine(createMockApp());
    engine.triggerManualSession(2, true); // 2 min => countdownEndTime = T0 + 120000
    expect(engine.countdownEndTime).toBe(T0.getTime() + 120_000);

    vi.advanceTimersByTime(30_000); // 30s of real, visible playback elapses
    document.hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));

    vi.advanceTimersByTime(45_000); // 45s hidden

    document.hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));

    // The deterministic, precise assertion: the deadline shifted forward by
    // exactly the 45s spent hidden — the backgrounded time was not counted.
    expect(engine.countdownEndTime).toBe(T0.getTime() + 120_000 + 45_000);

    // Loose corroborating check on the displayed remaining time (loose
    // because it depends on exact 100ms-interval tick alignment, which is
    // an implementation detail, not the property under test): should read
    // ~90s remaining (120s - 30s visible elapsed), not ~45s (which is what
    // it would read if the 45s hidden window had incorrectly counted).
    vi.advanceTimersByTime(100);
    const [mins, secs] = document.getElementById('ritualTimerValue').textContent.split(':').map(Number);
    const totalRemaining = mins * 60 + secs;
    expect(totalRemaining).toBeGreaterThanOrEqual(88);
    expect(totalRemaining).toBeLessThanOrEqual(90);
  });

  it('does not tick or evaluate completion while hidden (no silent completion in the background)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));

    const mockApp = createMockApp();
    const engine = new window.RitualEngine(mockApp);
    engine.triggerManualSession(0.5, true); // 30s session

    document.hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));

    // Advance well past the nominal session duration while hidden.
    vi.advanceTimersByTime(60_000);

    // If the watchdog incorrectly evaluated completion while hidden, this
    // would already have fired.
    expect(mockApp.recordSession).not.toHaveBeenCalled();
    expect(engine.state).toBe('ACTIVE');
  });
});

describe('RitualEngine: completion event dispatch (Nitnem sync bridge)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.getElementById('ritualOverlay')?.remove();
    document.body.classList.remove('timer-active');
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('dispatches both naamAbhyasComplete and naamAbhyasSessionComplete with a status:"completed" payload', () => {
    const mockApp = createMockApp({ currentSchedule: { 10: { status: 'pending' } } });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));

    const engine = new window.RitualEngine(mockApp);
    const events = [];
    const onComplete = (e) => events.push(['naamAbhyasComplete', e.detail]);
    const onSessionComplete = (e) => events.push(['naamAbhyasSessionComplete', e.detail]);
    window.addEventListener('naamAbhyasComplete', onComplete);
    window.addEventListener('naamAbhyasSessionComplete', onSessionComplete);

    engine.triggerScheduledSession(
      { hour: 10, startMinute: 0, endMinute: 2, startTime: '10:00 AM', endTime: '10:02 AM' },
      2
    );
    engine.completeSession();

    window.removeEventListener('naamAbhyasComplete', onComplete);
    window.removeEventListener('naamAbhyasSessionComplete', onSessionComplete);

    expect(events.map((e) => e[0])).toEqual(['naamAbhyasComplete', 'naamAbhyasSessionComplete']);
    expect(events[0][1]).toMatchObject({ count: 1, duration: 120, hour: 10, isScheduled: true });
    expect(events[1][1]).toMatchObject({
      status: 'completed',
      hour: 10,
      duration: 120,
      isExtra: false,
      endedEarly: false,
    });
    expect(mockApp.recordSession).toHaveBeenCalledTimes(1);
    expect(mockApp.updateStreak).toHaveBeenCalledTimes(1);
    expect(mockApp.currentSchedule[10].status).toBe('completed');
  });

  it('extra (manual) sessions do not touch currentSchedule or call updateStreak', () => {
    const mockApp = createMockApp({ currentSchedule: { 14: { status: 'pending' } } });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T14:00:00.000Z'));

    const engine = new window.RitualEngine(mockApp);
    engine.triggerManualSession(2, true);
    engine.completeSession();

    expect(mockApp.updateStreak).not.toHaveBeenCalled();
    expect(mockApp.currentSchedule[14].status).toBe('pending');
    expect(mockApp.recordSession).toHaveBeenCalledTimes(1); // still recorded, just not scheduled/streaked
  });
});

describe('RitualEngine: interrupted-session marker', () => {
  beforeEach(() => {
    localStorage.clear();
    document.getElementById('ritualOverlay')?.remove();
    document.body.classList.remove('timer-active');
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets a marker on session start, clears it on completion, and detects+clears+logs a dangling one on next construction', () => {
    vi.useFakeTimers();
    // Local-time constructor (not a UTC 'Z' ISO string): triggerManualSession
    // derives `hour` from now.getHours(), which reads LOCAL time — a 'Z'
    // string would make this test's expected hour depend on the machine's
    // timezone. Found by actually running this: it failed in this exact way.
    vi.setSystemTime(new Date(2026, 0, 15, 14, 0, 0));

    const mockApp = createMockApp();
    const engine = new window.RitualEngine(mockApp);
    engine.triggerManualSession(2, true);

    const marker = JSON.parse(localStorage.getItem('naam_abhyas_active_session'));
    expect(marker).toMatchObject({ durationMinutes: 2, isExtra: true, hour: 14 });

    engine.completeSession();
    expect(localStorage.getItem('naam_abhyas_active_session')).toBeNull(); // cleanup() cleared it

    // Simulate an app kill mid-session: a marker is left dangling, no engine yet.
    localStorage.setItem(
      'naam_abhyas_active_session',
      JSON.stringify({ startedAt: Date.now() - 5000, durationMinutes: 2, isExtra: true, hour: 14 })
    );
    const warnSpy = vi.spyOn(console, 'warn');
    document.getElementById('ritualOverlay')?.remove();

    new window.RitualEngine(mockApp); // constructor -> init() -> checkForInterruptedSession()

    expect(localStorage.getItem('naam_abhyas_active_session')).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('interrupted'),
      expect.objectContaining({ durationMinutes: 2, hour: 14 })
    );
  });

  it('does nothing when no marker is present (normal fresh start)', () => {
    const mockApp = createMockApp();
    const warnSpy = vi.spyOn(console, 'warn');
    warnSpy.mockClear();

    new window.RitualEngine(mockApp);

    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('interrupted'), expect.anything());
  });
});
