/**
 * Real-behavior test for the MediaSession optimistic-state bug fix.
 *
 * updateMediaSession() sets navigator.mediaSession.playbackState = 'playing'
 * BEFORE audio.play()'s promise settles (needed so the OS shows controls
 * immediately on user tap). Prior to this fix, nothing reverted that state if
 * play() then actually failed — the lock screen/notification could keep
 * claiming "Playing" while nothing was playing. This test forces a real
 * rejection (and separately, a real timeout) on the shared Audio mock's
 * play() method and asserts the shipped catch-block logic reverts it.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

describe('anhad-audio-singleton: MediaSession revert on playback failure', () => {
  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('reverts mediaSession.playbackState to paused when audio.play() rejects immediately', async () => {
    const audioEl = window.AnhadAudio.getAudio();
    vi.spyOn(audioEl, 'play').mockRejectedValueOnce(new Error('NotAllowedError'));

    window.AnhadAudio.play('darbar');

    // Optimistic set happens synchronously before the rejected promise is awaited.
    expect(navigator.mediaSession.playbackState).toBe('playing');

    await vi.waitFor(() => {
      expect(navigator.mediaSession.playbackState).toBe('paused');
    });
    expect(window.AnhadAudio.isPlaying()).toBe(false);
  });

  it('reverts to paused and emits a type:"timeout" error when play() hangs past 15s', async () => {
    vi.useFakeTimers();
    const audioEl = window.AnhadAudio.getAudio();
    const errors = [];
    window.AnhadAudio.on('error', (e) => errors.push(e));

    vi.spyOn(audioEl, 'play').mockImplementationOnce(() => new Promise(() => {})); // never settles

    window.AnhadAudio.play('darbar');
    expect(navigator.mediaSession.playbackState).toBe('playing');

    await vi.advanceTimersByTimeAsync(15000);

    expect(navigator.mediaSession.playbackState).toBe('paused');
    expect(errors.some((e) => e.type === 'timeout')).toBe(true);
  });

  it('does NOT revert playbackState on a normal successful play()', async () => {
    window.AnhadAudio.play('darbar');
    await vi.waitFor(() => {
      expect(window.AnhadAudio.isPlaying()).toBe(true);
    });
    expect(navigator.mediaSession.playbackState).toBe('playing');
  });
});
