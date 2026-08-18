/**
 * Real-behavior test for bounded-backoff reconnect on true-live streams
 * (Darbar Sahib, SikhNet channels). Previously these had NO auto-recovery at
 * all on error, unlike playlist streams. Two non-obvious mechanics, verified
 * against the real source, drive this test's shape:
 *
 * 1. The retry's own setTimeout only calls playStream again if !isPlaying —
 *    nothing in the 'error' listener itself sets isPlaying=false, so a real
 *    dropped-stream simulation needs a 'pause' event fired alongside 'error'.
 * 2. connectionState reaches 'failed' on the 6th error, not the 5th —
 *    attempts 1-5 each still take the "schedule another retry" branch.
 *
 * The mock's play() is overridden to resolve WITHOUT firing 'play'/'playing'
 * DOM events for retry attempts, specifically so connectionState doesn't get
 * reset back to 'connected' by a successful retry before we can observe the
 * backoff schedule across multiple attempts.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

describe('anhad-audio-singleton: live stream reconnect backoff', () => {
  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('climbs 2s->4s->8s->16s->30s across 5 attempts, then fails on the 6th error', async () => {
    vi.useFakeTimers();
    window.AnhadAudio.play('darbar');
    // Flush loadAndPlay()'s own enqueue()'d continuation before proceeding —
    // without this it can resolve later (mid-backoff-loop) and stomp
    // isPlaying back to true, silently preventing a retry from firing
    // (found by running this: manifested as "expected +0 to be 1").
    await vi.advanceTimersByTimeAsync(0);
    expect(window.AnhadAudio.getState().connectionState).toBe('connected');

    const audioEl = window.AnhadAudio.getAudio();
    const playSpy = vi.spyOn(audioEl, 'play').mockImplementation(() => Promise.resolve()); // silent success, no DOM events
    const backoffs = [2000, 4000, 8000, 16000, 30000];

    for (let attempt = 1; attempt <= 5; attempt++) {
      audioEl._trigger('pause'); // isPlaying=false, required for the retry timer to actually re-call playStream
      audioEl._trigger('error');
      expect(window.AnhadAudio.getState().connectionState).toBe('reconnecting');

      const callsBefore = playSpy.mock.calls.length;
      await vi.advanceTimersByTimeAsync(backoffs[attempt - 1]);
      expect(playSpy.mock.calls.length).toBe(callsBefore + 1); // scheduled retry actually fired on time
    }

    audioEl._trigger('pause');
    audioEl._trigger('error'); // 6th error: liveReconnectAttempts is already 5
    expect(window.AnhadAudio.getState().connectionState).toBe('failed');
  });

  it('returns to connected if a real playing event arrives before exhausting retries', async () => {
    vi.useFakeTimers();
    window.AnhadAudio.play('darbar');
    await vi.advanceTimersByTimeAsync(0); // flush loadAndPlay()'s own continuation first

    const audioEl = window.AnhadAudio.getAudio();
    audioEl._trigger('pause');
    audioEl._trigger('error'); // attempt 1, retry scheduled @2000ms; mock play() left at its default auto-succeeding behavior
    expect(window.AnhadAudio.getState().connectionState).toBe('reconnecting');

    await vi.advanceTimersByTimeAsync(2000); // retry fires, default mock play() succeeds -> fires real 'playing'
    expect(window.AnhadAudio.getState().connectionState).toBe('connected');
  });

  it('does not attempt reconnect for playlist-type streams (they use their own recovery path)', async () => {
    vi.useFakeTimers();
    window.AnhadAudio.play('amritvela');
    await vi.advanceTimersByTimeAsync(0);

    const audioEl = window.AnhadAudio.getAudio();
    const playSpy = vi.spyOn(audioEl, 'play');
    playSpy.mockClear();

    audioEl._trigger('error');
    // Playlist errors go through handleTrackEnded()'s own 3s-delayed recovery,
    // not the live-stream reconnect branch — connectionState is a live-stream
    // concept only and should remain untouched by a playlist error.
    expect(window.AnhadAudio.getState().connectionState).toBe('connected');
  });
});
