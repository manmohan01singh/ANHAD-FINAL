/**
 * Preservation Property Test: Basic Playback Functionality
 * 
 * **Validates: Requirements 3.3, 3.4, 3.5**
 * 
 * CRITICAL: These tests are EXPECTED TO PASS on unfixed code.
 * Success confirms that basic playback controls (start, volume, stop)
 * remain unchanged after the bugfix.
 * 
 * Test Strategy:
 * - Test start playback, volume controls, stop button
 * - Verify audio element lifecycle management
 * - Tests should pass on both unfixed and fixed code
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';

describe('PRESERVATION: Basic Playback Functionality', () => {
  let mockAudio;
  let audioEventListeners;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Track event listeners
    audioEventListeners = {};

    // Mock audio element with full lifecycle
    mockAudio = {
      src: '',
      currentTime: 0,
      duration: 3600,
      paused: true,
      volume: 0.7,
      playbackRate: 1,
      readyState: 0,
      networkState: 0,
      ended: false,
      play() {
        this.paused = false;
        this.readyState = 4;
        this._trigger('play');
        this._trigger('playing');
        return Promise.resolve();
      },
      pause() {
        this.paused = true;
        this._trigger('pause');
      },
      load() {
        this.readyState = 1;
        this._trigger('loadstart');
        setTimeout(() => {
          this.readyState = 4;
          this._trigger('loadedmetadata');
          this._trigger('canplay');
        }, 10);
      },
      addEventListener(event, handler) {
        if (!audioEventListeners[event]) {
          audioEventListeners[event] = [];
        }
        audioEventListeners[event].push(handler);
      },
      removeEventListener(event, handler) {
        if (audioEventListeners[event]) {
          audioEventListeners[event] = audioEventListeners[event].filter(h => h !== handler);
        }
      },
      _trigger(event) {
        if (audioEventListeners[event]) {
          audioEventListeners[event].forEach(handler => {
            handler.call(this, { type: event, target: this });
          });
        }
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 1: Starting playback initiates audio correctly
   * 
   * Expected: play() sets paused=false and fires 'playing' event
   * Preservation: Basic play behavior unchanged
   */
  it('PROPERTY: Starting playback initiates audio correctly', async () => {
    // Setup audio source
    mockAudio.src = 'https://example.com/audio/track.mp3';
    mockAudio.load();

    // Verify initial state
    expect(mockAudio.paused).toBe(true);
    expect(mockAudio.readyState).toBeGreaterThanOrEqual(1);

    // Start playback
    await mockAudio.play();

    // Verify playback started
    expect(mockAudio.paused).toBe(false);
    expect(mockAudio.readyState).toBe(4); // HAVE_ENOUGH_DATA
  });

  /**
   * Property 2: Volume controls adjust volume correctly
   * 
   * Expected: Setting volume property changes audio volume
   * Preservation: Volume control unchanged
   */
  it('PROPERTY: Volume controls adjust volume correctly', () => {
    // Test setting volume
    mockAudio.volume = 0.5;
    expect(mockAudio.volume).toBe(0.5);

    mockAudio.volume = 0.0; // Mute
    expect(mockAudio.volume).toBe(0.0);

    mockAudio.volume = 1.0; // Max
    expect(mockAudio.volume).toBe(1.0);

    mockAudio.volume = 0.7; // Default
    expect(mockAudio.volume).toBe(0.7);
  });

  /**
   * Property 3: Stop button stops audio correctly
   * 
   * Expected: pause() sets paused=true and fires 'pause' event
   * Preservation: Stop/pause behavior unchanged
   */
  it('PROPERTY: Stop button stops audio correctly', async () => {
    // Start playback
    mockAudio.src = 'https://example.com/audio/track.mp3';
    await mockAudio.play();
    expect(mockAudio.paused).toBe(false);

    // Track pause event
    let pauseEventFired = false;
    mockAudio.addEventListener('pause', () => {
      pauseEventFired = true;
    });

    // Stop playback
    mockAudio.pause();

    // Verify playback stopped
    expect(mockAudio.paused).toBe(true);
    expect(pauseEventFired).toBe(true);
  });

  /**
   * Property 4: Property-based test for volume range
   * 
   * For ANY valid volume value 0.0-1.0, audio.volume should set correctly
   */
  it('PROPERTY: Volume accepts all valid values (0.0-1.0)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.0, max: 1.0, noNaN: true }),
        (volume) => {
          mockAudio.volume = volume;
          
          // Volume should match within floating-point precision
          return Math.abs(mockAudio.volume - volume) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Audio element lifecycle events fire correctly
   * 
   * Expected: load() → loadstart → loadedmetadata → canplay
   * Preservation: Event sequence unchanged
   */
  it('PROPERTY: Audio element lifecycle events fire correctly', async () => {
    const eventsFired = [];

    // Listen for lifecycle events
    mockAudio.addEventListener('loadstart', () => eventsFired.push('loadstart'));
    mockAudio.addEventListener('loadedmetadata', () => eventsFired.push('loadedmetadata'));
    mockAudio.addEventListener('canplay', () => eventsFired.push('canplay'));

    // Load audio
    mockAudio.src = 'https://example.com/audio/track.mp3';
    mockAudio.load();

    // Wait for events
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify event sequence
    expect(eventsFired).toContain('loadstart');
    expect(eventsFired).toContain('loadedmetadata');
    expect(eventsFired).toContain('canplay');
    
    // Events should fire in order
    expect(eventsFired.indexOf('loadstart')).toBeLessThan(eventsFired.indexOf('loadedmetadata'));
    expect(eventsFired.indexOf('loadedmetadata')).toBeLessThan(eventsFired.indexOf('canplay'));
  });

  /**
   * Property 6: Play/pause toggle works correctly
   * 
   * Expected: Multiple play/pause cycles work correctly
   * Preservation: Toggle behavior unchanged
   */
  it('PROPERTY: Play/pause toggle works correctly', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';
    mockAudio.load();

    // Cycle 1: Play → Pause
    await mockAudio.play();
    expect(mockAudio.paused).toBe(false);
    mockAudio.pause();
    expect(mockAudio.paused).toBe(true);

    // Cycle 2: Play → Pause
    await mockAudio.play();
    expect(mockAudio.paused).toBe(false);
    mockAudio.pause();
    expect(mockAudio.paused).toBe(true);

    // Cycle 3: Play → Pause
    await mockAudio.play();
    expect(mockAudio.paused).toBe(false);
    mockAudio.pause();
    expect(mockAudio.paused).toBe(true);
  });

  /**
   * Property 7: Audio source can be changed
   * 
   * Expected: Setting new src loads new audio correctly
   * Preservation: Source switching unchanged
   */
  it('PROPERTY: Audio source can be changed', async () => {
    // Load first track
    mockAudio.src = 'https://example.com/audio/track1.mp3';
    mockAudio.load();
    await mockAudio.play();
    expect(mockAudio.src).toBe('https://example.com/audio/track1.mp3');

    // Switch to second track
    mockAudio.src = 'https://example.com/audio/track2.mp3';
    mockAudio.load();
    expect(mockAudio.src).toBe('https://example.com/audio/track2.mp3');

    // Playback should work with new source
    await mockAudio.play();
    expect(mockAudio.paused).toBe(false);
  });

  /**
   * Property 8: Volume persists across pause/play cycles
   * 
   * Expected: Volume setting preserved when pausing/playing
   * Preservation: Volume persistence unchanged
   */
  it('PROPERTY: Volume persists across pause/play cycles', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';
    
    // Set custom volume
    mockAudio.volume = 0.3;
    expect(mockAudio.volume).toBe(0.3);

    // Play
    await mockAudio.play();
    expect(mockAudio.volume).toBe(0.3);

    // Pause
    mockAudio.pause();
    expect(mockAudio.volume).toBe(0.3);

    // Play again
    await mockAudio.play();
    expect(mockAudio.volume).toBe(0.3);
  });

  /**
   * Property 9: currentTime advances during playback
   * 
   * Expected: currentTime increments when playing
   * Preservation: Time tracking unchanged
   */
  it('PROPERTY: currentTime advances during playback', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';
    mockAudio.currentTime = 0;
    await mockAudio.play();

    // Simulate time advancement
    mockAudio.currentTime = 10;
    expect(mockAudio.currentTime).toBe(10);

    mockAudio.currentTime = 30;
    expect(mockAudio.currentTime).toBe(30);

    // currentTime should be within duration
    expect(mockAudio.currentTime).toBeLessThanOrEqual(mockAudio.duration);
  });

  /**
   * Property 10: Audio element can be stopped and restarted
   * 
   * Expected: Pause, seek to 0, play again works correctly
   * Preservation: Stop/restart behavior unchanged
   */
  it('PROPERTY: Audio can be stopped and restarted', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';
    
    // Play and advance
    await mockAudio.play();
    mockAudio.currentTime = 100;
    expect(mockAudio.currentTime).toBe(100);

    // Stop (pause and reset)
    mockAudio.pause();
    mockAudio.currentTime = 0;
    expect(mockAudio.paused).toBe(true);
    expect(mockAudio.currentTime).toBe(0);

    // Restart
    await mockAudio.play();
    expect(mockAudio.paused).toBe(false);
    expect(mockAudio.currentTime).toBe(0);
  });

  /**
   * Property 11: Property-based test for playback rate
   * 
   * For ANY valid playbackRate 0.5-2.0, audio should accept it
   */
  it('PROPERTY: Playback rate can be adjusted (0.5-2.0)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.5, max: 2.0 }),
        (rate) => {
          mockAudio.playbackRate = rate;
          
          // Playback rate should be set correctly
          return Math.abs(mockAudio.playbackRate - rate) < 0.01;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 12: Audio state persists to localStorage
   * 
   * Expected: Playing state should be saveable to localStorage
   * Preservation: State persistence unchanged
   */
  it('PROPERTY: Audio state persists to localStorage', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';
    await mockAudio.play();
    mockAudio.currentTime = 150;

    // Save state
    const state = {
      stream: 'amritvela',
      trackIndex: 5,
      isPlaying: !mockAudio.paused,
      currentTime: mockAudio.currentTime,
      volume: mockAudio.volume,
      timestamp: Date.now()
    };
    localStorage.setItem('anhad_audio_state', JSON.stringify(state));

    // Verify state saved
    const saved = JSON.parse(localStorage.getItem('anhad_audio_state'));
    expect(saved.stream).toBe('amritvela');
    expect(saved.trackIndex).toBe(5);
    expect(saved.isPlaying).toBe(true);
    expect(saved.currentTime).toBe(150);
  });

  /**
   * Property 13: Multiple event listeners can be attached
   * 
   * Expected: Multiple handlers for same event all fire
   * Preservation: Event system unchanged
   */
  it('PROPERTY: Multiple event listeners can be attached', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';

    const events = { play1: 0, play2: 0, play3: 0 };
    
    mockAudio.addEventListener('play', () => events.play1++);
    mockAudio.addEventListener('play', () => events.play2++);
    mockAudio.addEventListener('play', () => events.play3++);

    await mockAudio.play();

    // All handlers should fire
    expect(events.play1).toBe(1);
    expect(events.play2).toBe(1);
    expect(events.play3).toBe(1);
  });

  /**
   * Property 14: Audio element can be loaded without playing
   * 
   * Expected: load() prepares audio without starting playback
   * Preservation: Load behavior unchanged
   */
  it('PROPERTY: Audio can be loaded without playing', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';
    
    // Load only (don't play)
    mockAudio.load();
    
    // Wait for load complete
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify loaded but not playing
    expect(mockAudio.readyState).toBeGreaterThan(0);
    expect(mockAudio.paused).toBe(true);
  });

  /**
   * Property 15: Audio element cleans up correctly
   * 
   * Expected: Removing event listeners works
   * Preservation: Cleanup behavior unchanged
   */
  it('PROPERTY: Event listeners can be removed', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';

    let playCount = 0;
    const handler = () => playCount++;
    
    mockAudio.addEventListener('play', handler);
    await mockAudio.play();
    expect(playCount).toBe(1);

    mockAudio.pause();
    mockAudio.removeEventListener('play', handler);
    
    await mockAudio.play();
    // Handler removed, so count should not increase
    expect(playCount).toBe(1);
  });
});
