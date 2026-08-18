/**
 * Real-behavior test for the anhadAudioStateChange CustomEvent bridge.
 *
 * Prior to this fix, Home's play/pause icons (trendora-app.js, homepage-data.js)
 * listened for 'anhadAudioStateChange' but nothing in the live singleton ever
 * dispatched it — only a dead/orphaned file did. emit() now bridges every
 * 'statechange' event to a real window-level CustomEvent. This test exercises
 * the actual shipped emit() function via window.AnhadAudio's real public API —
 * it does not reimplement or mock the dispatch logic itself.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

describe('anhad-audio-singleton: anhadAudioStateChange event bridge', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('dispatches anhadAudioStateChange with .detail.stream and .detail.isPlaying on play()', () => {
    const received = [];
    const listener = (e) => received.push(e.detail);
    window.addEventListener('anhadAudioStateChange', listener);

    window.AnhadAudio.play('darbar');

    window.removeEventListener('anhadAudioStateChange', listener);

    expect(received.length).toBeGreaterThanOrEqual(1);
    const evt = received.find((d) => d.stream === 'darbar');
    expect(evt).toBeDefined();
    expect(evt.currentStream).toBe('darbar'); // proves { stream: data.currentStream } alias
    expect(evt.isPlaying).toBe(true);
  });

  it('dispatches isPlaying:false on pause()', async () => {
    window.AnhadAudio.play('amritvela');
    // Let play()'s own loadAndPlay() enqueue()'d continuation fully settle
    // before proceeding. isPlaying() is already true synchronously (via the
    // mock's synchronous 'play'/'playing' events), so waiting on that check
    // alone resolves immediately WITHOUT the enqueued continuation having
    // run — it can then resolve LATER, after our listener attaches, get
    // captured as a spurious isPlaying:true 'amritvela' event ahead of
    // pause()'s real one, and poison every later .find() (found by running
    // this: manifested as a full-timeout failure, not a quick one, since
    // .find() deterministically re-finds the same stale event every retry).
    // A real macrotask reliably flushes ALL pending microtask work first.
    await new Promise((resolve) => setTimeout(resolve, 10));

    const received = [];
    const listener = (e) => received.push(e.detail);
    window.addEventListener('anhadAudioStateChange', listener);

    // Unlike play() (which calls audio.play() synchronously in loadAndPlay's
    // prologue, before the enqueue()'d part), PlaybackQueueController.pause()
    // runs its whole body — including the actual audio.pause() call that
    // fires the DOM 'pause' event this bridges from — inside enqueue(), i.e.
    // on a microtask. A fixed number of awaits proved unreliable (found by
    // running this); poll until it's actually happened instead.
    window.AnhadAudio.pause();

    await vi.waitFor(() => {
      const evt = received.find((d) => d.stream === 'amritvela');
      expect(evt).toBeDefined();
      expect(evt.isPlaying).toBe(false);
    });

    window.removeEventListener('anhadAudioStateChange', listener);
  });

  it('includes streamName so listeners expecting the old persistent-audio.js shape still work', () => {
    const received = [];
    const listener = (e) => received.push(e.detail);
    window.addEventListener('anhadAudioStateChange', listener);

    window.AnhadAudio.play('darbar');

    window.removeEventListener('anhadAudioStateChange', listener);

    const evt = received.find((d) => d.stream === 'darbar');
    expect(evt.streamName).toBeTruthy();
  });

});
