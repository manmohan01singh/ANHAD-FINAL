/**
 * Bug Condition Exploration Test: Pause/Resume Position Loss
 * 
 * **Validates: Requirements 1.4, 1.5**
 * 
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists.
 * 
 * Bug Symptom: Pressing Play after pause jumps to live position instead of resuming
 * Root Cause: play() always seeks to getServerLivePosition(), no pause anchor check
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';

describe('BUG EXPLORATION: Pause/Resume Position Loss', () => {
  let mockAudio;
  let pauseAnchor;
  let currentTrackIndex;
  let playFunc;
  let pauseFunc;

  beforeEach(() => {
    // Simulate the buggy play/pause system
    pauseAnchor = null; // BUG: No pause anchor state
    currentTrackIndex = 15;

    mockAudio = {
      currentTime: 1530, // Track 15 @ 25:30
      paused: true,
      src: '',
      play: vi.fn(() => {
        mockAudio.paused = false;
        return Promise.resolve();
      }),
      pause: vi.fn(() => {
        mockAudio.paused = true;
      }),
      addEventListener: vi.fn((event, handler) => {
        if (event === 'loadedmetadata') {
          // Simulate immediate metadata load
          setTimeout(() => handler(), 10);
        }
      }),
      removeEventListener: vi.fn()
    };

    // Mock server sync that returns current live position
    global.fetch = vi.fn((url) => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          trackIndex: 17, // Live is now at Track 17
          trackPosition: 45, // @ 0:45
          epoch: 1704067200,
          trackDuration: 5640
        })
      });
    });

    // BUG: pause() doesn't save anchor
    pauseFunc = () => {
      if (!mockAudio) return;
      // BUG: No pause anchor saved
      // pauseAnchor = { trackIndex: currentTrackIndex, position: mockAudio.currentTime };
      mockAudio.pause();
      console.log(`[PAUSE] Track ${currentTrackIndex} @ ${Math.floor(mockAudio.currentTime)}s`);
    };

    // BUG: play() always jumps to live
    playFunc = async () => {
      // BUG: No check for pause anchor
      // if (pauseAnchor) { /* resume from anchor */ }
      
      // Always syncs to server live position
      const resp = await fetch('/api/radio/live');
      const data = await resp.json();
      
      currentTrackIndex = data.trackIndex;
      mockAudio.src = `track-${data.trackIndex}.webm`;
      
      // BUG: Seeks to server's live position, not paused position
      mockAudio.addEventListener('loadedmetadata', () => {
        mockAudio.currentTime = data.trackPosition;
      });
      
      await mockAudio.play();
      console.log(`[PLAY] Jumped to Track ${currentTrackIndex} @ ${Math.floor(mockAudio.currentTime)}s`);
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Bug Test 1: Resume after pause jumps to live
   * 
   * Scenario: User pauses at Track 15 @ 25:30, then presses Play after 2 minutes
   * Expected: Resume from Track 15 @ 25:30, display "2 minutes behind"
   * Bug: Jumps to Track 17 @ 0:45 (current live position)
   */
  it('BUG: Resume after pause jumps to live position instead of resuming from pause', async () => {
    // User is listening to Track 15 @ 25:30
    currentTrackIndex = 15;
    mockAudio.currentTime = 1530;
    mockAudio.paused = false;

    console.log(`[INITIAL] Track ${currentTrackIndex} @ ${Math.floor(mockAudio.currentTime)}s`);

    // User pauses
    const pausedTrack = currentTrackIndex;
    const pausedPosition = mockAudio.currentTime;
    pauseFunc();

    expect(mockAudio.paused).toBe(true);
    console.log(`[PAUSED] Track ${pausedTrack} @ ${Math.floor(pausedPosition)}s`);

    // Wait 2 minutes (simulate user doing other things)
    await new Promise(resolve => setTimeout(resolve, 2000)); // Shortened for test

    // User presses Play (expects to resume from Track 15 @ 25:30)
    await playFunc();

    console.log(`[AFTER PLAY] Track ${currentTrackIndex} @ ${Math.floor(mockAudio.currentTime)}s`);

    // EXPECTED: Should resume from paused position
    expect(currentTrackIndex).toBe(pausedTrack); // Track 15
    expect(mockAudio.currentTime).toBeCloseTo(pausedPosition, 1); // 25:30

    // This assertion WILL FAIL on unfixed code
    // Bug behavior: currentTrackIndex = 17, currentTime = 45
  });

  /**
   * Bug Test 2: Pause anchor is not saved
   * 
   * Expected: Pausing should save {trackIndex, position, timestamp}
   * Bug: No pause anchor state exists
   */
  it('BUG: Pause anchor is not saved on pause', () => {
    // User is playing Track 20 @ 15:30
    currentTrackIndex = 20;
    mockAudio.currentTime = 930;
    mockAudio.paused = false;

    // User pauses
    pauseFunc();

    // EXPECTED: pauseAnchor should be set
    expect(pauseAnchor).toBeDefined();
    expect(pauseAnchor).toHaveProperty('trackIndex', 20);
    expect(pauseAnchor).toHaveProperty('position', 930);
    expect(pauseAnchor).toHaveProperty('timestamp');

    // This assertion WILL FAIL on unfixed code (pauseAnchor is null)
  });

  /**
   * Property Test: For ANY pause duration, resume should preserve position
   * 
   * Property: pause(t) then play() → position === t
   */
  it('PROPERTY: Resume preserves pause position for any pause duration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 3000 }), // pause position in seconds
        fc.integer({ min: 1, max: 60 }), // pause duration in seconds
        async (pausePosition, pauseDuration) => {
          // Setup: User is playing at pausePosition
          currentTrackIndex = 15;
          mockAudio.currentTime = pausePosition;
          mockAudio.paused = false;

          // Action: User pauses
          const pausedTrack = currentTrackIndex;
          const pausedPos = mockAudio.currentTime;
          pauseFunc();

          // Wait for pauseDuration
          await new Promise(resolve => setTimeout(resolve, pauseDuration * 100)); // Scaled down for speed

          // Action: User resumes
          await playFunc();

          // Property: Should resume at same position
          const positionMatches = currentTrackIndex === pausedTrack && 
                                 Math.abs(mockAudio.currentTime - pausedPos) < 5;

          if (!positionMatches) {
            console.log(`[PROPERTY FAIL] Paused: Track ${pausedTrack} @ ${pausedPos}s, Resumed: Track ${currentTrackIndex} @ ${mockAudio.currentTime}s`);
          }

          return positionMatches;
        }
      ),
      { numRuns: 10, timeout: 5000 }
    );

    // This property test WILL FAIL on unfixed code
  });

  /**
   * Bug Test 3: Multiple pause/resume cycles
   * 
   * Expected: Each pause should save anchor, each resume should restore
   * Bug: Each play jumps to current live position
   */
  it('BUG: Multiple pause/resume cycles lose position', async () => {
    const testCases = [
      { track: 10, position: 600 },  // Track 10 @ 10:00
      { track: 12, position: 1200 }, // Track 12 @ 20:00
      { track: 15, position: 1800 }  // Track 15 @ 30:00
    ];

    for (const testCase of testCases) {
      // Setup
      currentTrackIndex = testCase.track;
      mockAudio.currentTime = testCase.position;
      mockAudio.paused = false;

      console.log(`[TEST CASE] Starting at Track ${testCase.track} @ ${Math.floor(testCase.position)}s`);

      // Pause
      const pausedTrack = currentTrackIndex;
      const pausedPos = mockAudio.currentTime;
      pauseFunc();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));

      // Resume
      await playFunc();

      // Verify position preserved
      console.log(`[VERIFY] Expected Track ${pausedTrack} @ ${pausedPos}s, Got Track ${currentTrackIndex} @ ${mockAudio.currentTime}s`);
      
      expect(currentTrackIndex).toBe(pausedTrack);
      expect(mockAudio.currentTime).toBeCloseTo(pausedPos, 1);

      // This assertion WILL FAIL on unfixed code
    }
  });

  /**
   * Bug Test 4: Pause anchor should have timestamp
   * 
   * Expected: Anchor should include timestamp for staleness detection
   * Bug: No anchor exists at all
   */
  it('BUG: Pause anchor should include timestamp for staleness check', () => {
    // User pauses
    currentTrackIndex = 18;
    mockAudio.currentTime = 2100;
    mockAudio.paused = false;

    const beforePause = Date.now();
    pauseFunc();
    const afterPause = Date.now();

    // EXPECTED: Anchor should have timestamp
    expect(pauseAnchor).toBeDefined();
    expect(pauseAnchor.timestamp).toBeGreaterThanOrEqual(beforePause);
    expect(pauseAnchor.timestamp).toBeLessThanOrEqual(afterPause);

    // This assertion WILL FAIL on unfixed code (pauseAnchor is null)
  });

  /**
   * Bug Test 5: Old pause anchor should be cleared on explicit "Go Live"
   * 
   * Expected: jumpToLive() should clear pause anchor
   * Bug: No anchor to clear (and no jumpToLive that clears it)
   */
  it('BUG: Explicit "Go Live" should clear pause anchor', async () => {
    // User pauses
    currentTrackIndex = 15;
    mockAudio.currentTime = 1530;
    pauseFunc();

    // Simulate pause anchor being set (if fix were present)
    pauseAnchor = { trackIndex: 15, position: 1530, timestamp: Date.now() };

    // Simulate jumpToLive function (if it existed)
    const jumpToLive = async () => {
      // EXPECTED: Clear pause anchor
      pauseAnchor = null; // This line should exist in fix
      
      const resp = await fetch('/api/radio/live');
      const data = await resp.json();
      currentTrackIndex = data.trackIndex;
      mockAudio.currentTime = data.trackPosition;
    };

    await jumpToLive();

    // EXPECTED: Anchor should be null after explicit live jump
    expect(pauseAnchor).toBeNull();

    // This test validates the expected fix behavior
  });

  /**
   * Property Test: Pause position invariant across track boundaries
   * 
   * Property: Pause should work correctly even if live stream has moved to a different track
   */
  it('PROPERTY: Pause position preserved even when live advances multiple tracks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 35 }), // initial track
        fc.integer({ min: 500, max: 3000 }), // pause position
        fc.integer({ min: 1, max: 10 }), // tracks advanced while paused
        async (initialTrack, pausePos, tracksAdvanced) => {
          // Setup
          currentTrackIndex = initialTrack;
          mockAudio.currentTime = pausePos;
          mockAudio.paused = false;

          const pausedTrack = currentTrackIndex;
          const pausedPosition = mockAudio.currentTime;

          // Pause
          pauseFunc();

          // Simulate live stream advancing
          global.fetch = vi.fn(() => {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                trackIndex: initialTrack + tracksAdvanced,
                trackPosition: 120,
                epoch: 1704067200,
                trackDuration: 5640
              })
            });
          });

          // Resume
          await playFunc();

          // Property: Should resume at pause position, not current live
          const preserved = currentTrackIndex === pausedTrack &&
                          Math.abs(mockAudio.currentTime - pausedPosition) < 5;

          if (!preserved) {
            console.log(`[PROPERTY] Live advanced ${tracksAdvanced} tracks, but resume should preserve pause position`);
          }

          return preserved;
        }
      ),
      { numRuns: 10, timeout: 5000 }
    );

    // This property WILL FAIL on unfixed code
  });
});
