/**
 * Real-behavior test for the Virtual Live pause/resume algebra.
 *
 * VirtualLiveEngine and its helpers (resolveBroadcastPosition,
 * getCurrentTimelineValue, convertToTimelineCoordinate, regenerateShuffleOrder)
 * are closure-private inside anhad-audio-singleton.js's IIFE and never
 * attached to window — confirmed by reading the file, not assumed. Rather
 * than string-surgery the file to expose them (fragile — breaks the moment
 * the wrapper shape changes, and nothing else in this repo does that), this
 * test exercises the identical code path through the real public API:
 * play()/pause()/resume()/getLiveOffset()/getState().currentTrackIndex.
 *
 * The property under test: resume() computes
 *   manualOffset = pauseAnchor.offset + elapsedPauseSeconds
 * which algebraically reconstructs the exact pre-pause timeline coordinate
 * regardless of how long the pause lasted, because the elapsed-pause term
 * cancels out. This proves that holds for real, not just by hand-derivation.
 *
 * IMPORTANT (found by actually running this, not by inspection):
 * PlaybackQueueController.pause() runs its body — including setting
 * isPlaying=false — inside enqueue(), i.e. on a microtask, unlike play()
 * (which flips isPlaying=true synchronously via loadAndPlay's prologue).
 * resume() starts with `if (isPlaying) return;`, so calling resume()
 * immediately after pause() without letting that microtask run makes
 * resume() silently no-op. Every pause() below is followed by a fake-timer
 * microtask flush before resume() is called.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

async function pauseAndFlush() {
  window.AnhadAudio.pause();
  await vi.advanceTimersByTimeAsync(0);
}

describe('anhad-audio-singleton: Virtual Live pause/resume timeline algebra', () => {
  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('reconstructs the identical track position after a short (10s) pause', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));

    window.AnhadAudio.play('amritvela');
    const before = window.AnhadAudio.getState();

    await pauseAndFlush();
    vi.advanceTimersByTime(10_000);
    window.AnhadAudio.resume();

    expect(window.AnhadAudio.getLiveOffset()).toBe(10); // exact: Math.floor(10000/1000)
    expect(window.AnhadAudio.getState().currentTrackIndex).toBe(before.currentTrackIndex);
  });

  it('reconstructs the identical timeline coordinate after a multi-hour (5h) pause', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));

    window.AnhadAudio.play('amritvela');
    const before = window.AnhadAudio.getState();

    await pauseAndFlush();
    vi.advanceTimersByTime(5 * 60 * 60 * 1000); // 5h
    window.AnhadAudio.resume();

    expect(window.AnhadAudio.getLiveOffset()).toBe(5 * 60 * 60); // exact: 18000, regardless of gap size
    expect(window.AnhadAudio.getState().currentTrackIndex).toBe(before.currentTrackIndex);
  });

  it('holds for the simran playlist too, not just amritvela', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));

    window.AnhadAudio.play('simran');
    const before = window.AnhadAudio.getState();

    await pauseAndFlush();
    vi.advanceTimersByTime(90_000);
    window.AnhadAudio.resume();

    expect(window.AnhadAudio.getLiveOffset()).toBe(90);
    expect(window.AnhadAudio.getState().currentTrackIndex).toBe(before.currentTrackIndex);
  });

  it('a second pause/resume cycle correctly accumulates on top of the first offset', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));

    window.AnhadAudio.play('amritvela');

    await pauseAndFlush();
    vi.advanceTimersByTime(30_000);
    window.AnhadAudio.resume();
    expect(window.AnhadAudio.getLiveOffset()).toBe(30);

    await pauseAndFlush();
    vi.advanceTimersByTime(15_000);
    window.AnhadAudio.resume();
    expect(window.AnhadAudio.getLiveOffset()).toBe(45); // 30 + 15
  });

  it('jumpToLive() resets the offset to 0 regardless of how far behind the user was', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));

    window.AnhadAudio.play('amritvela');

    await pauseAndFlush();
    vi.advanceTimersByTime(3 * 60 * 60 * 1000);
    window.AnhadAudio.resume();
    expect(window.AnhadAudio.getLiveOffset()).toBeGreaterThan(0);

    window.AnhadAudio.jumpToLive();
    expect(window.AnhadAudio.getLiveOffset()).toBe(0);
  });
});
