/**
 * Regression tests for "kirtan never resumes after the network comes back".
 *
 * This file exists because of a specific gap: NO test in tests/audio/ ever
 * fired an 'error' event without also injecting a synthetic 'pause' alongside
 * it, and none simulated offline -> online. That combination is exactly what
 * let the following ship:
 *
 *   - A fatal MediaError stops playback but, per the HTML spec, does NOT fire
 *     'pause' and does NOT set audio.paused. Nothing in the singleton cleared
 *     isPlaying, yet BOTH recovery branches were gated on !isPlaying — so no
 *     retry ever fired, while liveReconnectAttempts still counted down to a
 *     terminal 'failed'. live-reconnect-backoff.test.js passed only because it
 *     injects the pause the real world never sends; its own header says so.
 *   - The engine had zero addEventListener('online'), so once the timers armed
 *     at failure time expired, playback was dead for the rest of the session.
 *
 * These tests therefore deliberately fire 'error' ALONE.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

describe('anhad-audio-singleton: network recovery', () => {
  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
    // Leave the network flag in a sane state for other suites.
    navigator.onLine = true;
  });

  // vitest.setup.js defines navigator.onLine as a plain writable property
  // (not configurable), so assign rather than redefine it.
  function setOnLine(value) {
    navigator.onLine = value;
  }

  it('clears isPlaying on a media error even with no pause event', async () => {
    vi.useFakeTimers();
    setOnLine(true);
    window.AnhadAudio.play('darbar');
    await vi.advanceTimersByTimeAsync(0);
    expect(window.AnhadAudio.getState().isPlaying).toBe(true);

    const audioEl = window.AnhadAudio.getAudio();
    audioEl._trigger('error'); // NO synthetic 'pause' — this is the real-world shape

    // The whole bug in one assertion: this used to stay true, which both blocked
    // every retry and made the mini player show a pause button over silence.
    expect(window.AnhadAudio.getState().isPlaying).toBe(false);
  });

  it('keeps the stream selected after an error so recovery has something to resume', async () => {
    vi.useFakeTimers();
    setOnLine(true);
    window.AnhadAudio.play('darbar');
    await vi.advanceTimersByTimeAsync(0);

    window.AnhadAudio.getAudio()._trigger('error');
    expect(window.AnhadAudio.getState().currentStream).toBe('darbar');
  });

  it('does not burn the retry budget while offline', async () => {
    vi.useFakeTimers();
    setOnLine(true);
    window.AnhadAudio.play('darbar');
    await vi.advanceTimersByTimeAsync(0);

    const audioEl = window.AnhadAudio.getAudio();
    const playSpy = vi.spyOn(audioEl, 'play').mockImplementation(() => Promise.resolve());

    setOnLine(false);
    // Six errors while offline: previously each one consumed an attempt, so an
    // outage longer than the ~60s cumulative backoff permanently exhausted the
    // budget and the stream could never come back.
    for (let i = 0; i < 6; i++) {
      audioEl._trigger('error');
      await vi.advanceTimersByTimeAsync(1000);
    }

    // Parked, not failed.
    expect(window.AnhadAudio.getState().connectionState).toBe('reconnecting');
    playSpy.mockRestore();
  });

  it('resumes automatically when the network returns, with no user gesture', async () => {
    vi.useFakeTimers();
    setOnLine(true);
    window.AnhadAudio.play('darbar');
    await vi.advanceTimersByTimeAsync(0);

    const audioEl = window.AnhadAudio.getAudio();
    setOnLine(false);
    audioEl._trigger('error');
    await vi.advanceTimersByTimeAsync(2000);
    expect(window.AnhadAudio.getState().isPlaying).toBe(false);

    const playSpy = vi.spyOn(audioEl, 'play').mockImplementation(() => Promise.resolve());
    setOnLine(true);
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(50);

    // The engine must re-issue playback itself. Before this fix nothing in the
    // app listened for 'online' at all.
    expect(playSpy).toHaveBeenCalled();
    playSpy.mockRestore();
  });

  it('does NOT resume after the user deliberately paused', async () => {
    vi.useFakeTimers();
    setOnLine(true);
    window.AnhadAudio.play('darbar');
    await vi.advanceTimersByTimeAsync(0);

    window.AnhadAudio.pause();
    await vi.advanceTimersByTimeAsync(0);

    const playSpy = vi.spyOn(window.AnhadAudio.getAudio(), 'play').mockImplementation(() => Promise.resolve());
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(50);

    // Auto-recovery must distinguish "the network died" from "the user paused",
    // or reconnecting would yank audio back on against the user's wishes.
    expect(playSpy).not.toHaveBeenCalled();
    playSpy.mockRestore();
  });

  it('does NOT resume after the user stopped playback', async () => {
    vi.useFakeTimers();
    setOnLine(true);
    window.AnhadAudio.play('darbar');
    await vi.advanceTimersByTimeAsync(0);

    window.AnhadAudio.stop();
    await vi.advanceTimersByTimeAsync(0);

    const playSpy = vi.spyOn(window.AnhadAudio.getAudio(), 'play').mockImplementation(() => Promise.resolve());
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(50);

    expect(playSpy).not.toHaveBeenCalled();
    playSpy.mockRestore();
  });

  it('resets connectionState on stop so a failure cannot leak into the next session', async () => {
    vi.useFakeTimers();
    setOnLine(true);
    window.AnhadAudio.play('darbar');
    await vi.advanceTimersByTimeAsync(0);

    const audioEl = window.AnhadAudio.getAudio();
    vi.spyOn(audioEl, 'play').mockImplementation(() => Promise.resolve());
    for (let i = 0; i < 6; i++) {
      audioEl._trigger('error');
      await vi.advanceTimersByTimeAsync(31000);
    }
    expect(window.AnhadAudio.getState().connectionState).toBe('failed');

    window.AnhadAudio.stop();
    expect(window.AnhadAudio.getState().connectionState).toBe('idle');
  });
});
