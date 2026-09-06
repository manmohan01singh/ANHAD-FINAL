import { describe, it, expect, afterEach, vi } from 'vitest';

describe('anhad-audio-singleton: network interruption exact resume', () => {
  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
    navigator.onLine = true;
  });

  function setOnLine(value) {
    navigator.onLine = value;
  }

  it('preserves exact track and position when network drops and reconnects for Amritvela Kirtan', async () => {
    vi.useFakeTimers();
    setOnLine(true);
    window.AnhadAudio.play('amritvela');
    await vi.advanceTimersByTimeAsync(100);

    const audioEl = window.AnhadAudio.getAudio();
    expect(window.AnhadAudio.getState().isPlaying).toBe(true);

    // Simulate playback advancing to 420 seconds on track
    audioEl.currentTime = 420;
    audioEl._trigger('timeupdate');
    await vi.advanceTimersByTimeAsync(0);

    const preInterruptState = window.AnhadAudio.getState();
    const trackBefore = preInterruptState.currentTrackIndex;
    const offsetBefore = preInterruptState.manualOffset;

    // Simulate network drop
    setOnLine(false);
    audioEl._trigger('error');
    await vi.advanceTimersByTimeAsync(100);

    // Assert paused/stopped state due to network, but intent to play remains
    const interruptedState = window.AnhadAudio.getState();
    expect(interruptedState.isPlaying).toBe(false);
    expect(interruptedState.networkInterruptAnchor).not.toBeNull();
    expect(interruptedState.networkInterruptAnchor.trackIndex).toBe(trackBefore);
    expect(interruptedState.networkInterruptAnchor.position).toBe(420);

    // Simulate 120 seconds of network outage
    await vi.advanceTimersByTimeAsync(120000);

    // Track play calls on recovery
    const playSpy = vi.spyOn(audioEl, 'play').mockImplementation(() => {
      audioEl._trigger('playing');
      return Promise.resolve();
    });

    // Network returns!
    setOnLine(true);
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(100);

    const postRecoveryState = window.AnhadAudio.getState();
    // Must remain on the exact same track
    expect(postRecoveryState.currentTrackIndex).toBe(trackBefore);
    // manualOffset must have increased by the outage duration (120s)
    expect(postRecoveryState.manualOffset).toBe(offsetBefore + 120);
    // currentTime sought to exact interrupted position
    expect(audioEl.currentTime).toBe(420);
    expect(playSpy).toHaveBeenCalled();

    playSpy.mockRestore();
  });

  it('preserves exact track and position when network drops for Waheguru Simran', async () => {
    vi.useFakeTimers();
    setOnLine(true);
    window.AnhadAudio.play('simran');
    await vi.advanceTimersByTimeAsync(100);

    const audioEl = window.AnhadAudio.getAudio();
    audioEl.currentTime = 350;
    audioEl._trigger('timeupdate');
    await vi.advanceTimersByTimeAsync(0);

    const trackBefore = window.AnhadAudio.getState().currentTrackIndex;
    const titleBefore = window.AnhadAudio.getState().currentTrackTitle;

    // Offline event fires
    setOnLine(false);
    window.dispatchEvent(new Event('offline'));
    audioEl._trigger('error');
    await vi.advanceTimersByTimeAsync(60000); // 60s offline

    const playSpy = vi.spyOn(audioEl, 'play').mockImplementation(() => {
      audioEl._trigger('playing');
      return Promise.resolve();
    });

    // Online event fires
    setOnLine(true);
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(100);

    const recovered = window.AnhadAudio.getState();
    expect(recovered.currentTrackIndex).toBe(trackBefore);
    expect(recovered.currentTrackTitle).toBe(titleBefore);
    expect(audioEl.currentTime).toBe(350);

    playSpy.mockRestore();
  });

  it('restores exact position when user manually taps resume after an outage', async () => {
    vi.useFakeTimers();
    setOnLine(true);
    window.AnhadAudio.play('amritvela');
    await vi.advanceTimersByTimeAsync(100);

    const audioEl = window.AnhadAudio.getAudio();
    audioEl.currentTime = 750;
    audioEl._trigger('timeupdate');

    // Network error stops playback
    setOnLine(false);
    audioEl._trigger('error');
    await vi.advanceTimersByTimeAsync(30000); // 30s passed

    setOnLine(true);
    // User taps play directly instead of waiting for auto-online
    const playSpy = vi.spyOn(audioEl, 'play').mockImplementation(() => {
      audioEl._trigger('playing');
      return Promise.resolve();
    });

    window.AnhadAudio.resume();
    await vi.advanceTimersByTimeAsync(100);

    const recovered = window.AnhadAudio.getState();
    expect(recovered.manualOffset).toBe(30);
    expect(audioEl.currentTime).toBe(750);

    playSpy.mockRestore();
  });

  it('preserves networkInterruptAnchor across localStorage persistence', async () => {
    vi.useFakeTimers();
    setOnLine(true);
    window.AnhadAudio.play('simran');
    await vi.advanceTimersByTimeAsync(100);

    const audioEl = window.AnhadAudio.getAudio();
    audioEl.currentTime = 610;
    audioEl._trigger('timeupdate');

    setOnLine(false);
    audioEl._trigger('error');
    await vi.advanceTimersByTimeAsync(50);

    const savedStateRaw = localStorage.getItem('anhad_audio_state_v4');
    expect(savedStateRaw).not.toBeNull();
    const parsed = JSON.parse(savedStateRaw);
    expect(parsed.networkInterruptAnchor).not.toBeNull();
    expect(parsed.networkInterruptAnchor.position).toBe(610);
    expect(parsed.networkInterruptAnchor.stream).toBe('simran');
  });
});
