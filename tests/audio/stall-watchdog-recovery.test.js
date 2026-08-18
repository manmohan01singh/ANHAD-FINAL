/**
 * Real-behavior test for the stall/hang watchdog. Previously there was no
 * 'waiting'/'stalled' handling at all in PlaybackQueueController — a stuck
 * audio element (buffering forever) was never detected or recovered. The
 * shared Audio mock's real addEventListener is used here (via its own
 * _trigger() hook, the only way to fire a real DOM event on it), not a
 * locally-reimplemented mock.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

describe('anhad-audio-singleton: stall watchdog', () => {
  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('reloads via playStream 15s after a waiting event with no playing event following', async () => {
    vi.useFakeTimers();
    window.AnhadAudio.play('darbar');
    await vi.advanceTimersByTimeAsync(0);

    const audioEl = window.AnhadAudio.getAudio();
    const playSpy = vi.spyOn(audioEl, 'play');
    playSpy.mockClear();

    audioEl._trigger('waiting');

    await vi.advanceTimersByTimeAsync(14999);
    expect(playSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT reload if a playing event arrives before the 15s watchdog elapses', async () => {
    vi.useFakeTimers();
    window.AnhadAudio.play('darbar');
    await vi.advanceTimersByTimeAsync(0);

    const audioEl = window.AnhadAudio.getAudio();
    const playSpy = vi.spyOn(audioEl, 'play');
    playSpy.mockClear();

    audioEl._trigger('waiting');
    await vi.advanceTimersByTimeAsync(5000);
    audioEl._trigger('playing'); // clears the watchdog timer

    await vi.advanceTimersByTimeAsync(15000);
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('a stalled event arms the same watchdog as waiting', async () => {
    vi.useFakeTimers();
    window.AnhadAudio.play('darbar');
    await vi.advanceTimersByTimeAsync(0);

    const audioEl = window.AnhadAudio.getAudio();
    const playSpy = vi.spyOn(audioEl, 'play');
    playSpy.mockClear();

    audioEl._trigger('stalled');
    await vi.advanceTimersByTimeAsync(15000);

    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('a pause event (real, deliberate) also clears a pending watchdog', async () => {
    vi.useFakeTimers();
    window.AnhadAudio.play('darbar');
    await vi.advanceTimersByTimeAsync(0);

    const audioEl = window.AnhadAudio.getAudio();
    const playSpy = vi.spyOn(audioEl, 'play');
    playSpy.mockClear();

    audioEl._trigger('waiting');
    window.AnhadAudio.pause(); // real pause fires a real 'pause' DOM event via the mock

    await vi.advanceTimersByTimeAsync(15000);
    expect(playSpy).not.toHaveBeenCalled();
  });
});
