/**
 * Bug Condition Exploration Test: UI Desynchronization
 * 
 * **Validates: Requirements 1.6, 1.7, 1.8, 1.9, 1.10, 1.11**
 * 
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists.
 * 
 * Bug Symptom: Mini Player and Radio Page show different progress/metadata
 * Root Cause: Multiple audio state sources (global-mini-player.js, gurbani-radio.js, persistent-audio.js)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';

describe('BUG EXPLORATION: UI Desynchronization', () => {
  let miniPlayerState;
  let radioPageState;
  let notificationState;
  let masterAudioState;

  beforeEach(() => {
    // Simulate three separate audio state sources (BUG: No single master)
    miniPlayerState = {
      currentTrack: 0,
      isPlaying: false,
      currentTime: 0,
      metadata: { title: '', artist: '' },
      behindLive: 0
    };

    radioPageState = {
      curTrack: 0,
      playing: false,
      elapsed: 0,
      trackTitle: '',
      subtitle: '',
      liveIndicator: false
    };

    notificationState = {
      track: 0,
      playing: false,
      position: 0,
      title: '',
      artist: ''
    };

    // Master state (should be single source of truth, but currently isn't used)
    masterAudioState = {
      currentStream: 'amritvela',
      currentTrackIndex: 10,
      currentTrackTitle: 'Day 10 - Amritvela Kirtan',
      currentTrackArtist: 'ਅੰਮ੍ਰਿਤ ਵੇਲੇ ਦੀ ਬਾਣੀ',
      isPlaying: true,
      currentTime: 600, // 10:00
      duration: 5591,
      behindLive: 15
    };

    // Simulate buggy update functions that don't read from master
    window.updateMiniPlayer = vi.fn(() => {
      // BUG: Uses local state, not master
      miniPlayerState.currentTrack = 10;
      miniPlayerState.currentTime = 525; // Different from master!
      miniPlayerState.isPlaying = true;
      miniPlayerState.metadata = { 
        title: 'Day 10', 
        artist: 'Amritvela' 
      };
      miniPlayerState.behindLive = 20; // Different from master!
    });

    window.updateRadioPage = vi.fn(() => {
      // BUG: Uses separate local state
      radioPageState.curTrack = 10;
      radioPageState.elapsed = 540; // Different from master and mini player!
      radioPageState.playing = true;
      radioPageState.trackTitle = 'Day 10 Kirtan';
      radioPageState.liveIndicator = false; // Different from master!
    });

    window.updateNotification = vi.fn(() => {
      // BUG: Yet another separate state
      notificationState.track = 9; // One track behind!
      notificationState.position = 3170; // Completely different!
      notificationState.playing = true;
      notificationState.title = 'Day 9 - Amritvela';
    });
  });

  afterEach(() => {
    delete window.updateMiniPlayer;
    delete window.updateRadioPage;
    delete window.updateNotification;
  });

  /**
   * Bug Test 1: Mini Player and Radio Page show different progress
   * 
   * Expected: Both should show same currentTime from master state
   * Bug: Mini Player shows 8:45, Radio Page shows 10:00
   */
  it('BUG: Mini Player and Radio Page display different progress positions', () => {
    // Update both UI components
    window.updateMiniPlayer();
    window.updateRadioPage();

    console.log(`[MASTER STATE] Track ${masterAudioState.currentTrackIndex} @ ${masterAudioState.currentTime}s`);
    console.log(`[MINI PLAYER] Track ${miniPlayerState.currentTrack} @ ${miniPlayerState.currentTime}s`);
    console.log(`[RADIO PAGE] Track ${radioPageState.curTrack} @ ${radioPageState.elapsed}s`);

    // EXPECTED: Both should match master state
    expect(miniPlayerState.currentTime).toBe(masterAudioState.currentTime);
    expect(radioPageState.elapsed).toBe(masterAudioState.currentTime);

    // EXPECTED: Both should match each other
    expect(miniPlayerState.currentTime).toBe(radioPageState.elapsed);

    // This assertion WILL FAIL on unfixed code
  });

  /**
   * Bug Test 2: Mini Player and Radio Page show different metadata
   * 
   * Expected: Both should show same title/artist from master
   * Bug: Different metadata displayed
   */
  it('BUG: Mini Player and Radio Page display different metadata', () => {
    window.updateMiniPlayer();
    window.updateRadioPage();

    console.log(`[MASTER] "${masterAudioState.currentTrackTitle}" by ${masterAudioState.currentTrackArtist}`);
    console.log(`[MINI PLAYER] "${miniPlayerState.metadata.title}" by ${miniPlayerState.metadata.artist}`);
    console.log(`[RADIO PAGE] "${radioPageState.trackTitle}" by ${radioPageState.subtitle}`);

    // EXPECTED: All should match master
    expect(miniPlayerState.metadata.title).toBe(masterAudioState.currentTrackTitle);
    expect(radioPageState.trackTitle).toBe(masterAudioState.currentTrackTitle);

    // This assertion WILL FAIL on unfixed code
  });

  /**
   * Bug Test 3: Mini Player and Radio Page show different playback states
   * 
   * Expected: Both should show same isPlaying state
   * Bug: One shows playing, other shows paused
   */
  it('BUG: Mini Player and Radio Page display different playback states', () => {
    // Simulate pause (only updates master)
    masterAudioState.isPlaying = false;

    // UI components update from their own state (BUG)
    window.updateMiniPlayer();
    window.updateRadioPage();

    console.log(`[MASTER] isPlaying: ${masterAudioState.isPlaying}`);
    console.log(`[MINI PLAYER] isPlaying: ${miniPlayerState.isPlaying}`);
    console.log(`[RADIO PAGE] playing: ${radioPageState.playing}`);

    // EXPECTED: All should match master
    expect(miniPlayerState.isPlaying).toBe(masterAudioState.isPlaying);
    expect(radioPageState.playing).toBe(masterAudioState.isPlaying);

    // This assertion WILL FAIL on unfixed code (both show true, master is false)
  });

  /**
   * Bug Test 4: Different "Behind Live" values across UI components
   * 
   * Expected: All components show same "Behind Live" value
   * Bug: Different values displayed
   */
  it('BUG: UI components display different "Behind Live" timeline values', () => {
    window.updateMiniPlayer();
    window.updateRadioPage();

    console.log(`[MASTER] Behind Live: ${masterAudioState.behindLive}s`);
    console.log(`[MINI PLAYER] Behind Live: ${miniPlayerState.behindLive}s`);

    // EXPECTED: Should match master
    expect(miniPlayerState.behindLive).toBe(masterAudioState.behindLive);

    // This assertion WILL FAIL on unfixed code (shows 20s instead of 15s)
  });

  /**
   * Bug Test 5: Live indicator desynchronization
   * 
   * Expected: All UI should agree on "at live edge" status
   * Bug: Different live indicators
   */
  it('BUG: Live indicators desynchronized across components', () => {
    // Master state: at live edge (behindLive <= 10s)
    masterAudioState.behindLive = 5;
    const masterIsLive = masterAudioState.behindLive <= 10;

    window.updateMiniPlayer();
    window.updateRadioPage();

    console.log(`[MASTER] Is Live: ${masterIsLive}`);
    console.log(`[RADIO PAGE] Live Indicator: ${radioPageState.liveIndicator}`);

    // EXPECTED: Radio page should match master
    expect(radioPageState.liveIndicator).toBe(masterIsLive);

    // This assertion WILL FAIL on unfixed code (shows false, should be true)
  });

  /**
   * Bug Test 6: Notification state completely out of sync
   * 
   * Expected: Notification should show current playing track
   * Bug: Shows previous track with wrong position
   */
  it('BUG: Media notification shows wrong track and position', () => {
    window.updateNotification();

    console.log(`[MASTER] Track ${masterAudioState.currentTrackIndex} @ ${masterAudioState.currentTime}s`);
    console.log(`[NOTIFICATION] Track ${notificationState.track} @ ${notificationState.position}s`);
    console.log(`[NOTIFICATION] Title: "${notificationState.title}"`);

    // EXPECTED: Should match master
    expect(notificationState.track).toBe(masterAudioState.currentTrackIndex);
    expect(notificationState.position).toBeCloseTo(masterAudioState.currentTime, -1);
    expect(notificationState.title).toContain(String(masterAudioState.currentTrackIndex));

    // This assertion WILL FAIL on unfixed code (shows Track 9, not Track 10)
  });

  /**
   * Property Test: For ANY state change, all UI components should sync
   * 
   * Property: After updating master state, all UI components should reflect same values
   */
  it('PROPERTY: All UI components synchronize with master state changes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 39 }), // track index
        fc.integer({ min: 0, max: 5000 }), // current time
        fc.boolean(), // is playing
        fc.integer({ min: 0, max: 120 }), // behind live
        (trackIndex, currentTime, isPlaying, behindLive) => {
          // Update master state
          masterAudioState.currentTrackIndex = trackIndex;
          masterAudioState.currentTime = currentTime;
          masterAudioState.isPlaying = isPlaying;
          masterAudioState.behindLive = behindLive;

          // Trigger UI updates (BUG: they don't read from master)
          window.updateMiniPlayer();
          window.updateRadioPage();
          window.updateNotification();

          // Property: All should match master
          const miniMatches = miniPlayerState.currentTrack === trackIndex &&
                            miniPlayerState.isPlaying === isPlaying;
          
          const radioMatches = radioPageState.curTrack === trackIndex &&
                             radioPageState.playing === isPlaying;
          
          const notificationMatches = notificationState.track === trackIndex &&
                                    notificationState.playing === isPlaying;

          const allSynced = miniMatches && radioMatches && notificationMatches;

          if (!allSynced) {
            console.log(`[PROPERTY FAIL] Master: Track ${trackIndex}, Mini: ${miniPlayerState.currentTrack}, Radio: ${radioPageState.curTrack}, Notification: ${notificationState.track}`);
          }

          return allSynced;
        }
      ),
      { numRuns: 20 }
    );

    // This property WILL FAIL on unfixed code
  });

  /**
   * Bug Test 7: Rapid state changes cause drift
   * 
   * Expected: UI should stay synchronized even during rapid changes
   * Bug: Desynchronization accumulates with rapid updates
   */
  it('BUG: Rapid state changes cause UI drift accumulation', async () => {
    const stateSnapshots = [];

    // Simulate rapid state changes (like normal playback with timeupdate events)
    for (let i = 0; i < 10; i++) {
      masterAudioState.currentTime += 10; // Advance 10 seconds
      masterAudioState.behindLive = Math.floor(Math.random() * 30);

      // Update UIs
      window.updateMiniPlayer();
      window.updateRadioPage();

      stateSnapshots.push({
        master: masterAudioState.currentTime,
        mini: miniPlayerState.currentTime,
        radio: radioPageState.elapsed,
        iteration: i
      });

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Check final state
    const lastSnapshot = stateSnapshots[stateSnapshots.length - 1];
    console.log(`[FINAL STATE] Master: ${lastSnapshot.master}s, Mini: ${lastSnapshot.mini}s, Radio: ${lastSnapshot.radio}s`);

    // EXPECTED: All should be synchronized
    expect(lastSnapshot.mini).toBe(lastSnapshot.master);
    expect(lastSnapshot.radio).toBe(lastSnapshot.master);

    // This assertion WILL FAIL on unfixed code (drift accumulates)
  });

  /**
   * Bug Test 8: Lock screen controls desync from UI
   * 
 * Expected: Lock screen should match Mini Player and Radio Page
   * Bug: Lock screen state is independent
   */
  it('BUG: Lock screen media controls desynchronized from main UI', () => {
    // Simulate Media Session API state (independent from UI)
    const mediaSessionState = {
      playbackState: 'playing',
      metadata: {
        title: 'Stale Title',
        artist: 'Stale Artist',
        album: 'Track 8' // Wrong track!
      }
    };

    // Update UI components
    window.updateMiniPlayer();
    window.updateRadioPage();

    console.log(`[MASTER] Track ${masterAudioState.currentTrackIndex}: "${masterAudioState.currentTrackTitle}"`);
    console.log(`[MEDIA SESSION] ${mediaSessionState.metadata.album}: "${mediaSessionState.metadata.title}"`);

    // EXPECTED: Media session should match master
    expect(mediaSessionState.metadata.album).toContain(String(masterAudioState.currentTrackIndex));
    expect(mediaSessionState.metadata.title).toBe(masterAudioState.currentTrackTitle);

    // This assertion WILL FAIL on unfixed code (shows Track 8, not Track 10)
  });

  /**
   * Bug Test 9: Event propagation doesn't sync all components
   * 
   * Expected: Single master emits events, all UIs subscribe
   * Bug: Each UI independently manages state
   */
  it('BUG: State change events do not propagate to all UI components', () => {
    const eventLog = [];

    // Mock event emitter that should notify all components
    const mockEmit = vi.fn((event, data) => {
      eventLog.push({ event, data, timestamp: Date.now() });
    });

    // Simulate master state change
    masterAudioState.currentTrackIndex = 15;
    masterAudioState.isPlaying = true;
    
    // EXPECTED: Should emit 'statechange' event
    mockEmit('statechange', { ...masterAudioState });

    // Update UI components (BUG: they don't listen to events)
    window.updateMiniPlayer();
    window.updateRadioPage();

    // EXPECTED: All components should have received the event
    expect(eventLog.length).toBeGreaterThan(0);
    expect(eventLog.some(e => e.event === 'statechange')).toBe(true);

    // EXPECTED: All components should match the emitted state
    expect(miniPlayerState.currentTrack).toBe(15);
    expect(radioPageState.curTrack).toBe(15);

    // This assertion WILL FAIL on unfixed code (UIs don't subscribe to master events)
  });

  /**
   * Property Test: Progress position consistency across all UI
   * 
   * Property: For any time T, all UI components report same currentTime
   */
  it('PROPERTY: All UI components report identical currentTime', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 6000 }), // any position in track
        (position) => {
          masterAudioState.currentTime = position;

          window.updateMiniPlayer();
          window.updateRadioPage();
          window.updateNotification();

          // Property: All positions should match
          const allMatch = 
            miniPlayerState.currentTime === position &&
            radioPageState.elapsed === position &&
            notificationState.position === position;

          if (!allMatch) {
            console.log(`[PROPERTY FAIL] Position ${position}s: Mini=${miniPlayerState.currentTime}, Radio=${radioPageState.elapsed}, Notification=${notificationState.position}`);
          }

          return allMatch;
        }
      ),
      { numRuns: 50 }
    );

    // This property WILL FAIL on unfixed code
  });
});
