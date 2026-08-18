/**
 * Real-behavior test for the defensive background-kill pauseAnchor snapshot.
 *
 * Prior to this fix, only explicit pause()/pauseFromNative() created a
 * pauseAnchor. If the OS killed the process while backgrounded WITHOUT
 * either running first, resume() had nothing to reconstruct from and used a
 * stale pre-kill manualOffset against the new, later live time. This test
 * fires real visibilitychange/pagehide events (document.hidden is a writable
 * mock per vitest.setup.js) and asserts on the actual snapshotted state via
 * getState().pauseAnchor — there is no other accessor for it.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

describe('anhad-audio-singleton: defensive background-kill protection', () => {
  afterEach(() => {
    localStorage.clear();
    document.hidden = false;
  });

  it('snapshots a pauseAnchor on visibilitychange->hidden while playing, without actually pausing', () => {
    window.AnhadAudio.play('amritvela');
    expect(window.AnhadAudio.getState().pauseAnchor).toBeNull(); // playStream() clears it

    document.hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));

    const anchor = window.AnhadAudio.getState().pauseAnchor;
    expect(anchor).not.toBeNull();
    expect(typeof anchor.timestamp).toBe('number');
    expect(typeof anchor.trackIndex).toBe('number');
    expect(typeof anchor.position).toBe('number');
    expect(typeof anchor.offset).toBe('number');

    // Critically: playback itself was NOT interrupted by this defensive snapshot.
    expect(window.AnhadAudio.isPlaying()).toBe(true);
  });

  it('clears the defensive anchor on return to foreground while still playing', () => {
    window.AnhadAudio.play('amritvela');

    document.hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(window.AnhadAudio.getState().pauseAnchor).not.toBeNull();

    document.hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(window.AnhadAudio.getState().pauseAnchor).toBeNull();
  });

  it('pagehide also snapshots an anchor (covers runtimes where visibilitychange does not fire)', () => {
    window.AnhadAudio.play('amritvela');
    window.dispatchEvent(new Event('pagehide'));
    expect(window.AnhadAudio.getState().pauseAnchor).not.toBeNull();
  });

  it('is a no-op when nothing is playing (does not clobber an already-set real pauseAnchor)', async () => {
    window.AnhadAudio.play('amritvela');
    window.AnhadAudio.pause(); // pauseAnchor itself is set synchronously by the public pause()...
    const realAnchor = window.AnhadAudio.getState().pauseAnchor;
    expect(realAnchor).not.toBeNull();

    // ...but isPlaying only flips to false once PlaybackQueueController's
    // enqueue()'d body actually runs (a microtask). Without waiting for it,
    // isPlaying is still true here, snapshotBackgroundAnchor()'s guard
    // doesn't trigger, and it overwrites pauseAnchor with a fresh timestamp —
    // defeating the exact no-op behavior under test (found by running this).
    await vi.waitFor(() => expect(window.AnhadAudio.isPlaying()).toBe(false));

    document.hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));

    // Must be untouched, not overwritten with a fresh (wrong) timestamp/offset.
    expect(window.AnhadAudio.getState().pauseAnchor).toEqual(realAnchor);
  });
});
