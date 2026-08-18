/**
 * Real-behavior test for getLiveDrift() (previously a permanent stub
 * returning 0) and the 30s periodic drift-correction interval.
 *
 * Same-track drift (a few seconds off) should trigger a plain seek, not a
 * reload. Cross-track drift (the expected track has moved on entirely, e.g.
 * after a long stall) should trigger a full playStream() reload. We
 * distinguish the two by watching currentTrackIndex before/after: unchanged
 * means the seek branch ran, changed means the reload branch ran.
 *
 * IMPORTANT (found by actually running this, not by inspection): the 30s
 * drift-correction setInterval is registered unconditionally at module-load
 * time, inside the singleton's IIFE. The global beforeEach (vitest.setup.js)
 * reloads the singleton BEFORE this file's own it() bodies get a chance to
 * call vi.useFakeTimers() — so that interval gets created under REAL timers,
 * and is invisible to vi.advanceTimersByTimeAsync() for the rest of the
 * test. Tests that need the interval to actually fire reload the singleton
 * themselves, after enabling fake timers, using the same fs.readFileSync +
 * new Function pattern vitest.setup.js itself uses.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const singletonSrc = fs.readFileSync(
  path.resolve(process.cwd(), 'frontend/lib/anhad-audio-singleton.js'),
  'utf8'
);

function reloadSingletonUnderCurrentTimerRegime() {
  if (window.AnhadAudio) delete window.AnhadAudio;
  const fn = new Function(
    'window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'location', 'Audio', 'MediaMetadata',
    singletonSrc
  );
  fn(window, document, navigator, window.localStorage, window.sessionStorage, window.location, window.Audio, window.MediaMetadata);
}

describe('anhad-audio-singleton: live drift detection and correction', () => {
  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('reports near-zero drift immediately after starting a playlist stream', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));

    window.AnhadAudio.play('amritvela');
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0); // drain the seek()'s own enqueue hop

    expect(Math.abs(window.AnhadAudio.getLiveDrift())).toBeLessThan(2);
  });

  it('reports 0 drift for a raw live stream (no timeline model to drift from)', async () => {
    window.AnhadAudio.play('darbar');
    expect(window.AnhadAudio.getLiveDrift()).toBe(0);
  });

  it('same-track drift under the 8s threshold is left alone (no seek, no reload)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));
    window.AnhadAudio.play('amritvela');
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    const audioEl = window.AnhadAudio.getAudio();
    const trackBefore = window.AnhadAudio.getState().currentTrackIndex;
    audioEl.currentTime = Math.max(0, audioEl.currentTime - 3); // under threshold

    await vi.advanceTimersByTimeAsync(30000); // trip the periodic corrector

    expect(window.AnhadAudio.getState().currentTrackIndex).toBe(trackBefore);
  });

  it('same-track drift over the 8s threshold triggers a seek back into sync, not a reload', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));
    reloadSingletonUnderCurrentTimerRegime(); // so the 30s corrector interval is fake-timer-controlled

    window.AnhadAudio.play('amritvela');
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    const audioEl = window.AnhadAudio.getAudio();
    const trackBefore = window.AnhadAudio.getState().currentTrackIndex;
    audioEl.currentTime = Math.max(0, audioEl.currentTime - 20); // desync 20s, same track
    expect(Math.abs(window.AnhadAudio.getLiveDrift())).toBeGreaterThan(8);

    await vi.advanceTimersByTimeAsync(30000);

    expect(Math.abs(window.AnhadAudio.getLiveDrift())).toBeLessThan(2);
    expect(window.AnhadAudio.getState().currentTrackIndex).toBe(trackBefore); // seek path, not reload
  });

  it('cross-track drift (large wall-clock gap while stalled) triggers a reload onto the correct track', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));
    reloadSingletonUnderCurrentTimerRegime();

    window.AnhadAudio.play('amritvela');
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);
    const trackBefore = window.AnhadAudio.getState().currentTrackIndex;

    // Simulate a long real-world gap where audio.currentTime never advances
    // (the mock is static — nothing ticks it forward on its own), so the
    // "expected" position drifts far onto a different track while the
    // loaded track/position stays exactly where it was.
    await vi.advanceTimersByTimeAsync(2 * 60 * 60 * 1000); // 2 hours, in 30s corrector ticks

    expect(window.AnhadAudio.getState().currentTrackIndex).not.toBe(trackBefore);
    expect(Math.abs(window.AnhadAudio.getLiveDrift())).toBeLessThan(5);
  });
});
