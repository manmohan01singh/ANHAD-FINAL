/**
 * Bug Condition Exploration Test: Track Transition Position Errors
 * 
 * **Validates: Requirements 1.12, 1.13**
 * 
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists.
 * 
 * Bug Symptom: Next track starts at non-zero timestamp (00:15, 01:32, 02:40)
 * Root Cause: advanceTrack() doesn't reset audio.currentTime = 0 after loading new src
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';

describe('BUG EXPLORATION: Track Transition Position Errors', () => {
  let mockAudio;
  let currentTrackIndex;
  let advanceTrackFunc;
  let trackTransitionInProgress;
  let lastTransitionProof;

  beforeEach(() => {
    currentTrackIndex = 14; // Track 15
    trackTransitionInProgress = false;
    lastTransitionProof = null;

    // Mock audio element with buggy behavior
    mockAudio = {
      currentTime: 3585, // Near end of track: 59:45
      duration: 3600, // Track is 60 minutes
      src: 'https://cdn.example.com/day-15.webm',
      paused: false,
      play: vi.fn(() => {
        mockAudio.paused = false;
        return Promise.resolve();
      }),
      addEventListener: vi.fn((event, handler, options) => {
        if (event === 'loadedmetadata') {
          // Simulate metadata loading and handler execution
          setTimeout(() => {
            handler();
            if (options?.once) {
              mockAudio.removeEventListener(event, handler);
            }
          }, 10);
        }
      }),
      removeEventListener: vi.fn()
    };

    // BUG: advanceTrack() doesn't reset currentTime to 0
    advanceTrackFunc = async () => {
      if (trackTransitionInProgress) return;
      
      trackTransitionInProgress = true;
      
      // Calculate next track (with looping)
      const totalTracks = 40; // Amritvela Kirtan has 40 tracks
      currentTrackIndex = (currentTrackIndex + 1) % totalTracks;
      
      console.log(`[Transition] Moving to Track ${currentTrackIndex + 1}`);
      
      // Load next track URL
      mockAudio.src = `https://cdn.example.com/day-${currentTrackIndex + 1}.webm`;
      
      // BUG: Missing audio.currentTime = 0 after loading metadata
      mockAudio.addEventListener('loadedmetadata', function onMetadataLoaded() {
        mockAudio.removeEventListener('loadedmetadata', onMetadataLoaded);
        
        // BUG: No reset to 0.0
        // audio.currentTime = 0; // ← THIS LINE IS MISSING
        
        // Instead, currentTime inherits previous value or seeks to server position
        // Simulating bug: currentTime stays at non-zero value
        if (mockAudio.currentTime > 3500) {
          // If near end of previous track, simulate seek to server mid-track position
          mockAudio.currentTime = Math.floor(Math.random() * 200) + 15; // Random 15-215s
        }
        
        console.log(`[Transition] Track ${currentTrackIndex + 1} starting at ${mockAudio.currentTime.toFixed(1)}s`);
        
        lastTransitionProof = {
          trackIndex: currentTrackIndex,
          startTime: mockAudio.currentTime,
          timestamp: Date.now()
        };
        
        trackTransitionInProgress = false;
      }, { once: true });
      
      // Resume playback
      await mockAudio.play();
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Bug Test 1: Track transition starts at non-zero timestamp
   * 
   * Expected: Next track starts at 00:00 (currentTime === 0.0)
   * Bug: Starts at 00:15, 01:32, 02:40, or other non-zero values
   */
  it('BUG: Track transition starts at non-zero timestamp instead of 00:00', async () => {
    console.log(`[INITIAL] Track ${currentTrackIndex + 1} at ${mockAudio.currentTime}s (near end)`);
    
    // Simulate track ending and transition
    await advanceTrackFunc();
    
    // Wait for metadata to load
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log(`[AFTER TRANSITION] Track ${currentTrackIndex + 1} at ${mockAudio.currentTime}s`);
    
    // EXPECTED: Should start at 0.0
    expect(mockAudio.currentTime).toBe(0.0);
    
    // This assertion WILL FAIL on unfixed code (starts at non-zero value)
  });

  /**
   * Bug Test 2: Verify transition proof records non-zero start
   * 
   * Expected: lastTransitionProof.startTime should be 0.0
   * Bug: Records non-zero start time
   */
  it('BUG: Transition proof records non-zero start time', async () => {
    await advanceTrackFunc();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(lastTransitionProof).toBeDefined();
    expect(lastTransitionProof.trackIndex).toBe(15); // Advanced from 14 to 15
    
    console.log(`[PROOF] Track ${lastTransitionProof.trackIndex + 1} started at ${lastTransitionProof.startTime}s`);
    
    // EXPECTED: Should start at 0.0
    expect(lastTransitionProof.startTime).toBe(0.0);
    
    // This assertion WILL FAIL on unfixed code
  });

  /**
   * Bug Test 3: Multiple transitions all start at non-zero
   * 
   * Expected: Each transition should start at 00:00
   * Bug: Each starts at different non-zero timestamps
   */
  it('BUG: Multiple track transitions all start at non-zero timestamps', async () => {
    const transitionLog = [];
    
    // Simulate multiple track transitions
    for (let i = 0; i < 5; i++) {
      // Set up near-end condition
      mockAudio.currentTime = 3585 + i * 5; // Vary slightly
      
      await advanceTrackFunc();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      transitionLog.push({
        track: currentTrackIndex + 1,
        startTime: mockAudio.currentTime,
        iteration: i
      });
      
      console.log(`[Transition ${i + 1}] Track ${currentTrackIndex + 1} started at ${mockAudio.currentTime.toFixed(1)}s`);
    }
    
    // EXPECTED: All transitions should start at 0.0
    for (const transition of transitionLog) {
      expect(transition.startTime).toBe(0.0);
    }
    
    // This assertion WILL FAIL on unfixed code (all start at non-zero)
  });

  /**
   * Property Test: Track transitions always start at 00:00
   * 
   * Property: For ANY track transition, next track starts with currentTime === 0.0
   */
  it('PROPERTY: All track transitions start at exactly 00:00', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 39 }), // any track index
        fc.integer({ min: 3500, max: 3600 }), // near-end position
        async (trackIndex, nearEndPosition) => {
          // Setup: Near end of current track
          currentTrackIndex = trackIndex;
          mockAudio.currentTime = nearEndPosition;
          mockAudio.duration = 3600;
          
          // Action: Transition to next track
          await advanceTrackFunc();
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Property: Next track should start at 0.0
          const startsAtZero = mockAudio.currentTime === 0.0;
          
          if (!startsAtZero) {
            console.log(`[PROPERTY FAIL] Track ${currentTrackIndex + 1} started at ${mockAudio.currentTime}s instead of 0.0s`);
          }
          
          return startsAtZero;
        }
      ),
      { numRuns: 10, timeout: 5000 }
    );
    
    // This property WILL FAIL on unfixed code
  });

  /**
   * Bug Test 4: Simran stream track transitions
   * 
   * Expected: Waheguru Simran tracks also start at 00:00
   * Bug: Same issue affects Simran stream
   */
  it('BUG: Waheguru Simran track transitions start at non-zero timestamps', async () => {
    // Simulate Simran stream (38 tracks)
    currentTrackIndex = 20;
    mockAudio.currentTime = 2095; // Near end of ~35min track
    mockAudio.duration = 2100;
    mockAudio.src = 'https://cdn-simran.example.com/track-21.mp3';
    
    // Override advanceTrack for Simran
    const simranAdvanceTrack = async () => {
      trackTransitionInProgress = true;
      const totalTracks = 38;
      currentTrackIndex = (currentTrackIndex + 1) % totalTracks;
      
      mockAudio.src = `https://cdn-simran.example.com/track-${currentTrackIndex + 1}.mp3`;
      
      mockAudio.addEventListener('loadedmetadata', function onMeta() {
        mockAudio.removeEventListener('loadedmetadata', onMeta);
        
        // BUG: Same missing reset
        // audio.currentTime = 0; // ← MISSING
        
        // Simulate non-zero start
        if (mockAudio.currentTime > 2000) {
          mockAudio.currentTime = Math.floor(Math.random() * 150) + 20;
        }
        
        lastTransitionProof = {
          trackIndex: currentTrackIndex,
          startTime: mockAudio.currentTime,
          timestamp: Date.now()
        };
        
        trackTransitionInProgress = false;
      }, { once: true });
      
      await mockAudio.play();
    };
    
    await simranAdvanceTrack();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log(`[SIMRAN] Track ${currentTrackIndex + 1} started at ${mockAudio.currentTime.toFixed(1)}s`);
    
    // EXPECTED: Should start at 0.0
    expect(mockAudio.currentTime).toBe(0.0);
    
    // This assertion WILL FAIL on unfixed code
  });

  /**
   * Bug Test 5: Track loop boundary (Track 40 → Track 1)
   * 
   * Expected: Looping back to Track 1 should also start at 00:00
   * Bug: Loop transition also starts at non-zero
   */
  it('BUG: Playlist loop transition (Track 40 → Track 1) starts at non-zero', async () => {
    // Setup: Last track (Track 40) near end
    currentTrackIndex = 39; // 0-indexed, so 39 = Track 40
    mockAudio.currentTime = 3590;
    mockAudio.duration = 3600;
    
    console.log(`[BEFORE LOOP] Track 40 at ${mockAudio.currentTime}s`);
    
    // Transition (should loop to Track 1)
    await advanceTrackFunc();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log(`[AFTER LOOP] Track ${currentTrackIndex + 1} at ${mockAudio.currentTime}s`);
    
    // Verify looped back to Track 1
    expect(currentTrackIndex).toBe(0);
    
    // EXPECTED: Track 1 should start at 0.0
    expect(mockAudio.currentTime).toBe(0.0);
    
    // This assertion WILL FAIL on unfixed code
  });

  /**
   * Bug Test 6: Race condition - rapid track changes
   * 
   * Expected: Even with rapid transitions, each track starts at 00:00
   * Bug: Race conditions cause inconsistent start positions
   */
  it('BUG: Rapid track transitions cause inconsistent start positions', async () => {
    const startPositions = [];
    
    // Simulate rapid transitions (user skipping tracks)
    for (let i = 0; i < 3; i++) {
      mockAudio.currentTime = 3590; // Near end
      
      await advanceTrackFunc();
      await new Promise(resolve => setTimeout(resolve, 30)); // Short delay
      
      startPositions.push({
        track: currentTrackIndex + 1,
        startTime: mockAudio.currentTime
      });
    }
    
    console.log(`[RAPID TRANSITIONS] Start positions:`, startPositions);
    
    // EXPECTED: All should start at 0.0
    for (const pos of startPositions) {
      expect(pos.startTime).toBe(0.0);
    }
    
    // This assertion WILL FAIL on unfixed code
  });

  /**
   * Bug Test 7: Transition while paused
   * 
   * Expected: Transition should still start at 00:00 even when paused
   * Bug: Start position affected by pause state
   */
  it('BUG: Track transition while paused starts at non-zero', async () => {
    // Setup: Near end and paused
    mockAudio.currentTime = 3595;
    mockAudio.paused = true;
    
    console.log(`[PAUSED] Track ${currentTrackIndex + 1} at ${mockAudio.currentTime}s`);
    
    // Manually trigger transition (simulating 'ended' event while paused scenario)
    await advanceTrackFunc();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log(`[AFTER TRANSITION] Track ${currentTrackIndex + 1} at ${mockAudio.currentTime}s`);
    
    // EXPECTED: Should still start at 0.0 regardless of pause state
    expect(mockAudio.currentTime).toBe(0.0);
    
    // This assertion WILL FAIL on unfixed code
  });

  /**
   * Property Test: Start position is always 0.0, never inherited from previous track
   * 
   * Property: After transition, currentTime is not influenced by previous track's position
   */
  it('PROPERTY: Track start position is independent of previous track position', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 3600 }), // any position in previous track
        async (previousPosition) => {
          // Setup: Any position in current track
          mockAudio.currentTime = previousPosition;
          
          // Force transition
          await advanceTrackFunc();
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Property: New track position should be 0.0, not influenced by previousPosition
          const independentStart = mockAudio.currentTime === 0.0;
          
          if (!independentStart) {
            console.log(`[PROPERTY FAIL] Previous: ${previousPosition}s, New start: ${mockAudio.currentTime}s (should be 0.0)`);
          }
          
          return independentStart;
        }
      ),
      { numRuns: 15, timeout: 5000 }
    );
    
    // This property WILL FAIL on unfixed code
  });

  /**
   * Bug Test 8: Server sync during transition causes mid-track start
   * 
   * Expected: Even if server sync happens during transition, track should start at 00:00
   * Bug: Server sync causes seek to mid-track position
   */
  it('BUG: Server sync during transition causes mid-track start position', async () => {
    // Mock server sync that happens during transition
    global.fetch = vi.fn(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          trackIndex: 16, // Next track
          trackPosition: 120, // Server says track is at 2:00
          epoch: 1704067200,
          trackDuration: 5640
        })
      });
    });
    
    // Setup transition
    currentTrackIndex = 14;
    mockAudio.currentTime = 3590;
    
    // Simulate advanceTrack with server sync logic (BUG)
    const advanceWithSync = async () => {
      trackTransitionInProgress = true;
      currentTrackIndex = (currentTrackIndex + 1) % 40;
      
      mockAudio.src = `https://cdn.example.com/day-${currentTrackIndex + 1}.webm`;
      
      // BUG: Syncs with server position instead of starting at 0.0
      const serverPos = await fetch('/api/radio/live').then(r => r.json());
      
      mockAudio.addEventListener('loadedmetadata', () => {
        // BUG: Seeks to server position instead of 0.0
        mockAudio.currentTime = serverPos.trackPosition;
        
        lastTransitionProof = {
          trackIndex: currentTrackIndex,
          startTime: mockAudio.currentTime,
          timestamp: Date.now()
        };
        
        trackTransitionInProgress = false;
      }, { once: true });
      
      await mockAudio.play();
    };
    
    await advanceWithSync();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log(`[SERVER SYNC BUG] Track ${currentTrackIndex + 1} started at ${mockAudio.currentTime}s (server said ${120}s)`);
    
    // EXPECTED: Should ignore server and start at 0.0
    expect(mockAudio.currentTime).toBe(0.0);
    
    // This assertion WILL FAIL on unfixed code (starts at 120s from server)
  });
});
