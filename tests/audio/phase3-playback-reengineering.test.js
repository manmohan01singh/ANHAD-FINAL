/**
 * ANHAD Phase 3 Playback Re-Engineering Verification Suite
 * 
 * Tests the core requirements of Phase 3:
 * 1. Live stream unexpected EOF ('ended') auto-recovery from live edge.
 * 2. Rapid tap debouncing (250ms guard on play() and toggle()).
 * 3. AudioCoordinator mutual exclusion (AnhadAudio vs Hukamnama/NaamAbhyas).
 * 4. Cache-busting on live stream reconnects.
 * 5. Forced reload on network reconnection recovery.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Phase 3 Playback Re-Engineering & Audio Mutual Exclusion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  describe('1. Live stream unexpected EOF auto-recovery', () => {
    it('does not advance tracks on live stream ended event, but reconnects to live edge', async () => {
      vi.useFakeTimers();
      window.AnhadAudio.play('darbar');
      await vi.advanceTimersByTimeAsync(0);

      expect(window.AnhadAudio.getState().currentStream).toBe('darbar');
      expect(window.AnhadAudio.getState().connectionState).toBe('connected');

      const audioEl = window.AnhadAudio.getAudio();
      const playSpy = vi.spyOn(audioEl, 'play');
      playSpy.mockClear();

      // Trigger 'ended' on a live stream (unexpected server EOF)
      audioEl._trigger('ended');

      // Debounce timer is 200ms
      await vi.advanceTimersByTimeAsync(200);

      // Stream should be in reconnecting state
      const state = window.AnhadAudio.getState();
      expect(state.connectionState).toBe('reconnecting');
      expect(state.currentStream).toBe('darbar'); // Still Darbar Sahib, not jumped to another track

      // Backoff timer for attempt 1 is 2000ms
      await vi.advanceTimersByTimeAsync(2000);

      // Verified that play was re-attempted with fresh live-edge connection
      expect(playSpy).toHaveBeenCalled();
      // Audio source should contain cache-busting query parameter _t=
      expect(audioEl.src).toContain('_t=');
    });
  });

  describe('2. Rapid tap debouncing', () => {
    it('debounces rapid play() calls within 250ms window', async () => {
      vi.useFakeTimers();
      const audioEl = window.AnhadAudio.getAudio();
      const playSpy = vi.spyOn(audioEl, 'play');
      playSpy.mockClear();

      // Initial play call
      window.AnhadAudio.play('darbar');
      await vi.advanceTimersByTimeAsync(0);
      const callCountAfterFirst = playSpy.mock.calls.length;

      // Immediate second call 50ms later (rapid click)
      await vi.advanceTimersByTimeAsync(50);
      window.AnhadAudio.play('darbar');
      await vi.advanceTimersByTimeAsync(0);

      // Play should not be invoked a second time
      expect(playSpy.mock.calls.length).toBe(callCountAfterFirst);

      // After 250ms debounce window passes, play can be invoked again
      await vi.advanceTimersByTimeAsync(300);
      window.AnhadAudio.pause();
      await vi.advanceTimersByTimeAsync(300);
      window.AnhadAudio.play('darbar');
      await vi.advanceTimersByTimeAsync(0);

      expect(playSpy.mock.calls.length).toBeGreaterThan(callCountAfterFirst);
    });

    it('debounces rapid toggle() calls within 250ms window', async () => {
      vi.useFakeTimers();
      window.AnhadAudio.play('darbar');
      await vi.advanceTimersByTimeAsync(0);
      expect(window.AnhadAudio.isPlaying()).toBe(true);

      // First toggle: pauses
      window.AnhadAudio.toggle();
      await vi.advanceTimersByTimeAsync(0);
      expect(window.AnhadAudio.isPlaying()).toBe(false);

      // Rapid toggle 100ms later: ignored by debounce
      await vi.advanceTimersByTimeAsync(100);
      window.AnhadAudio.toggle();
      await vi.advanceTimersByTimeAsync(0);
      // Should remain paused (rapid second tap ignored)
      expect(window.AnhadAudio.isPlaying()).toBe(false);

      // After 300ms, toggle works again
      await vi.advanceTimersByTimeAsync(300);
      window.AnhadAudio.toggle();
      await vi.advanceTimersByTimeAsync(0);
      expect(window.AnhadAudio.isPlaying()).toBe(true);
    });
  });

  describe('3. AudioCoordinator mutual exclusion', () => {
    it('pauses AnhadAudio when an external player requests play', async () => {
      vi.useFakeTimers();
      window.AnhadAudio.play('darbar');
      await vi.advanceTimersByTimeAsync(0);
      expect(window.AnhadAudio.isPlaying()).toBe(true);

      // Register an external mock player (e.g. Hukamnama or NaamAbhyas)
      let externalPaused = false;
      window.AudioCoordinator.register('hukamnama', {
        pause: () => { externalPaused = true; }
      });

      // External player requests play
      window.AudioCoordinator.requestPlay('hukamnama');
      await vi.advanceTimersByTimeAsync(0);

      // AnhadAudio must be paused
      expect(window.AnhadAudio.isPlaying()).toBe(false);
      expect(window.AudioCoordinator.getCurrentlyPlaying()).toBe('hukamnama');
    });

    it('pauses external player when AnhadAudio plays', async () => {
      vi.useFakeTimers();
      let externalPaused = false;
      window.AudioCoordinator.register('mockPlayer', {
        pause: () => { externalPaused = true; }
      });

      window.AudioCoordinator.requestPlay('mockPlayer');
      expect(window.AudioCoordinator.getCurrentlyPlaying()).toBe('mockPlayer');

      // AnhadAudio starts playing
      window.AnhadAudio.play('darbar');
      await vi.advanceTimersByTimeAsync(0);

      // Mock player must have received pause()
      expect(externalPaused).toBe(true);
      expect(window.AudioCoordinator.getCurrentlyPlaying()).toBe('AnhadAudio');
    });
  });

  describe('4. Forced socket reload on network reconnect', () => {
    it('appends cache-busting timestamp on live reconnect recovery', async () => {
      vi.useFakeTimers();
      window.AnhadAudio.play('darbar');
      await vi.advanceTimersByTimeAsync(0);

      const audioEl = window.AnhadAudio.getAudio();
      
      // Simulate going offline then online
      window.dispatchEvent(new Event('offline'));
      await vi.advanceTimersByTimeAsync(100);

      // Restore network
      window.dispatchEvent(new Event('online'));
      await vi.advanceTimersByTimeAsync(700); // 600ms recovery debounce

      // Audio src must be updated with live-edge cache buster
      expect(audioEl.src).toContain('_t=');
    });
  });
});
