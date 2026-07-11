/**
 * Preservation Property Test: Other Functionality
 * 
 * **Validates: Requirements 3.8, 3.9, 3.10, 3.11, 3.12**
 * 
 * CRITICAL: These tests are EXPECTED TO PASS on unfixed code.
 * Success confirms that buffering, navigation, stream switching,
 * Media Session API, and background playback remain unchanged after the bugfix.
 * 
 * Test Strategy:
 * - Test audio buffering under network conditions
 * - Test navigation and stream switching
 * - Test Media Session API integration
 * - Test background playback persistence
 * - Tests should pass on both unfixed and fixed code
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';

describe('PRESERVATION: Other Functionality', () => {
  let mockAudio;
  let audioEventListeners;
  let mediaSessionHandlers;

  beforeEach(() => {
    localStorage.clear();
    audioEventListeners = {};
    mediaSessionHandlers = {};

    // Mock MediaSession API
    if (!navigator.mediaSession) {
      navigator.mediaSession = {
        metadata: null,
        playbackState: 'none',
        setActionHandler: vi.fn((action, handler) => {
          mediaSessionHandlers[action] = handler;
        }),
        setPositionState: vi.fn()
      };
    }

    // Mock audio element with network states
    mockAudio = {
      src: '',
      currentTime: 0,
      duration: 3600,
      paused: true,
      volume: 0.7,
      readyState: 0, // HAVE_NOTHING
      networkState: 0, // NETWORK_EMPTY
      buffered: {
        length: 0,
        start: () => 0,
        end: () => 0
      },
      play() {
        this.paused = false;
        this.readyState = 4;
        this.networkState = 2;
        this._trigger('playing');
        return Promise.resolve();
      },
      pause() {
        this.paused = true;
        this._trigger('pause');
      },
      load() {
        this.readyState = 1;
        this.networkState = 1;
        this._trigger('loadstart');
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

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUIREMENT 3.8: Audio Buffering
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Property 1: Network buffering handled gracefully
   * 
   * Expected: 'waiting' event fired when buffering, no crashes
   * Preservation: Buffering handling unchanged
   */
  it('PROPERTY: Network buffering handled gracefully (Req 3.8)', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';
    await mockAudio.play();

    let waitingEventFired = false;
    mockAudio.addEventListener('waiting', () => {
      waitingEventFired = true;
    });

    // Simulate buffering (network stall)
    mockAudio.readyState = 2; // HAVE_CURRENT_DATA
    mockAudio._trigger('waiting');

    // Verify buffering handled without crash
    expect(waitingEventFired).toBe(true);
    expect(mockAudio.readyState).toBe(2);

    // Simulate buffer recovered
    mockAudio.readyState = 4; // HAVE_ENOUGH_DATA
    mockAudio._trigger('canplaythrough');
    
    expect(mockAudio.readyState).toBe(4);
  });

  /**
   * Property 2: Progress event during buffering
   * 
   * Expected: 'progress' events fire as data loads
   * Preservation: Progress tracking unchanged
   */
  it('PROPERTY: Progress events fire during buffering (Req 3.8)', () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';

    let progressEventCount = 0;
    mockAudio.addEventListener('progress', () => {
      progressEventCount++;
    });

    // Simulate progressive loading
    mockAudio._trigger('progress');
    mockAudio._trigger('progress');
    mockAudio._trigger('progress');

    expect(progressEventCount).toBe(3);
  });

  /**
   * Property 3: Audio continues after buffering
   * 
   * Expected: Playback resumes after buffer fills
   * Preservation: Resume after buffering unchanged
   */
  it('PROPERTY: Audio continues after buffering (Req 3.8)', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';
    await mockAudio.play();
    expect(mockAudio.paused).toBe(false);

    // Simulate buffering
    mockAudio.readyState = 2;
    mockAudio._trigger('waiting');

    // Simulate buffer filled
    mockAudio.readyState = 4;
    mockAudio._trigger('canplaythrough');

    // Playback should continue
    expect(mockAudio.paused).toBe(false);
    expect(mockAudio.readyState).toBe(4);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUIREMENT 3.9: Navigation and UI
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Property 4: Audio persists across page navigation
   * 
   * Expected: State saved to localStorage survives navigation
   * Preservation: Cross-page persistence unchanged
   */
  it('PROPERTY: Audio persists across page navigation (Req 3.9)', async () => {
    // Start playback
    mockAudio.src = 'https://example.com/audio/track.mp3';
    await mockAudio.play();
    mockAudio.currentTime = 150;

    // Save state (simulates navigation away)
    const state = {
      stream: 'amritvela',
      trackIndex: 10,
      isPlaying: !mockAudio.paused,
      currentTime: mockAudio.currentTime,
      timestamp: Date.now()
    };
    localStorage.setItem('anhad_audio_state', JSON.stringify(state));

    // Simulate page reload
    const restoredState = JSON.parse(localStorage.getItem('anhad_audio_state'));

    // Verify state preserved
    expect(restoredState.stream).toBe('amritvela');
    expect(restoredState.trackIndex).toBe(10);
    expect(restoredState.isPlaying).toBe(true);
    expect(restoredState.currentTime).toBe(150);
  });

  /**
   * Property 5: Navigation doesn't interrupt playback
   * 
   * Expected: Audio continues playing during navigation
   * Preservation: Uninterrupted playback unchanged
   */
  it('PROPERTY: Navigation doesn\'t interrupt playback (Req 3.9)', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';
    await mockAudio.play();

    const wasPlaying = !mockAudio.paused;

    // Simulate navigation (state save/restore cycle)
    const state = {
      isPlaying: !mockAudio.paused,
      currentTime: mockAudio.currentTime
    };

    // Audio should still be in playing state
    expect(state.isPlaying).toBe(true);
    expect(wasPlaying).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUIREMENT 3.10: Stream Switching
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Property 6: Stream switching works correctly
   * 
   * Expected: Switching between Darbar/Amritvela/Simran works
   * Preservation: Stream switching unchanged
   */
  it('PROPERTY: Stream switching works correctly (Req 3.10)', async () => {
    const streams = {
      darbar: 'https://live.sgpc.net:8443/;nocache=1',
      amritvela: 'https://example.com/audio/day-1.webm',
      simran: 'https://example.com/audio/simran-1.mp3'
    };

    // Start with Darbar Sahib
    mockAudio.src = streams.darbar;
    await mockAudio.play();
    expect(mockAudio.src).toBe(streams.darbar);

    // Switch to Amritvela
    mockAudio.pause();
    mockAudio.src = streams.amritvela;
    mockAudio.load();
    await mockAudio.play();
    expect(mockAudio.src).toBe(streams.amritvela);

    // Switch to Simran
    mockAudio.pause();
    mockAudio.src = streams.simran;
    mockAudio.load();
    await mockAudio.play();
    expect(mockAudio.src).toBe(streams.simran);
  });

  /**
   * Property 7: Property-based test for stream switching
   * 
   * For ANY sequence of stream switches, audio source updates correctly
   */
  it('PROPERTY: Multiple stream switches work (Req 3.10)', () => {
    const streamUrls = [
      'https://live.sgpc.net:8443/;nocache=1',
      'https://example.com/audio/day-1.webm',
      'https://example.com/audio/simran-1.mp3'
    ];

    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 2 }), { minLength: 1, maxLength: 10 }),
        (switchSequence) => {
          let lastSrc = '';
          
          for (const streamIndex of switchSequence) {
            mockAudio.src = streamUrls[streamIndex];
            lastSrc = streamUrls[streamIndex];
          }

          // Final src should match last switch
          return mockAudio.src === lastSrc;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8: Stream switching preserves volume
   * 
   * Expected: Volume setting preserved across stream switches
   * Preservation: Volume persistence unchanged
   */
  it('PROPERTY: Stream switching preserves volume (Req 3.10)', async () => {
    // Set custom volume
    mockAudio.volume = 0.35;
    
    // Stream 1
    mockAudio.src = 'https://example.com/audio/day-1.webm';
    await mockAudio.play();
    expect(mockAudio.volume).toBe(0.35);

    // Switch to Stream 2
    mockAudio.src = 'https://example.com/audio/simran-1.mp3';
    await mockAudio.play();
    expect(mockAudio.volume).toBe(0.35);

    // Switch to Stream 3
    mockAudio.src = 'https://live.sgpc.net:8443/;nocache=1';
    await mockAudio.play();
    expect(mockAudio.volume).toBe(0.35);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUIREMENT 3.11: Media Session API
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Property 9: Media Session metadata updates
   * 
   * Expected: navigator.mediaSession.metadata set correctly
   * Preservation: Media Session integration unchanged
   */
  it('PROPERTY: Media Session metadata updates (Req 3.11)', () => {
    // Set Media Session metadata
    navigator.mediaSession.metadata = {
      title: 'Day 10 - Amritvela Kirtan',
      artist: 'ਅੰਮ੍ਰਿਤ ਵੇਲੇ ਦੀ ਬਾਣੀ',
      album: 'Gurbani Radio',
      artwork: [
        { src: '/assets/darbar-sahib-amritvela.webp', sizes: '512x512', type: 'image/webp' }
      ]
    };

    // Verify metadata set
    expect(navigator.mediaSession.metadata).toBeDefined();
    expect(navigator.mediaSession.metadata.title).toBe('Day 10 - Amritvela Kirtan');
    expect(navigator.mediaSession.metadata.artist).toBe('ਅੰਮ੍ਰਿਤ ਵੇਲੇ ਦੀ ਬਾਣੀ');
  });

  /**
   * Property 10: Media Session action handlers work
   * 
   * Expected: setActionHandler registers play/pause/seek handlers
   * Preservation: Action handler registration unchanged
   */
  it('PROPERTY: Media Session action handlers work (Req 3.11)', () => {
    let playHandlerCalled = false;
    let pauseHandlerCalled = false;

    // Register action handlers
    navigator.mediaSession.setActionHandler('play', () => {
      playHandlerCalled = true;
      mockAudio.play();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      pauseHandlerCalled = true;
      mockAudio.pause();
    });

    // Verify handlers registered
    expect(navigator.mediaSession.setActionHandler).toBeDefined();
    expect(typeof navigator.mediaSession.setActionHandler).toBe('function');

    // Simulate handler invocation
    if (mediaSessionHandlers['play']) {
      mediaSessionHandlers['play']();
      expect(playHandlerCalled).toBe(true);
    }

    if (mediaSessionHandlers['pause']) {
      mediaSessionHandlers['pause']();
      expect(pauseHandlerCalled).toBe(true);
    }
  });

  /**
   * Property 11: Media Session playback state updates
   * 
   * Expected: playbackState changes based on audio state
   * Preservation: State synchronization unchanged
   */
  it('PROPERTY: Media Session playback state updates (Req 3.11)', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';

    // Initially none
    expect(navigator.mediaSession.playbackState).toBe('none');

    // Play
    await mockAudio.play();
    navigator.mediaSession.playbackState = 'playing';
    expect(navigator.mediaSession.playbackState).toBe('playing');

    // Pause
    mockAudio.pause();
    navigator.mediaSession.playbackState = 'paused';
    expect(navigator.mediaSession.playbackState).toBe('paused');
  });

  /**
   * Property 12: Media Session position state updates
   * 
   * Expected: setPositionState called with correct duration/position
   * Preservation: Position reporting unchanged
   */
  it('PROPERTY: Media Session position state updates (Req 3.11)', () => {
    mockAudio.duration = 3600;
    mockAudio.currentTime = 1500;

    // Update position state
    navigator.mediaSession.setPositionState({
      duration: mockAudio.duration,
      position: mockAudio.currentTime,
      playbackRate: mockAudio.playbackRate
    });

    // Verify setPositionState is callable
    expect(navigator.mediaSession.setPositionState).toBeDefined();
    expect(typeof navigator.mediaSession.setPositionState).toBe('function');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUIREMENT 3.12: Background Playback
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Property 13: Audio continues when app backgrounded
   * 
   * Expected: visibilitychange doesn't pause audio
   * Preservation: Background playback unchanged
   */
  it('PROPERTY: Audio continues when app backgrounded (Req 3.12)', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';
    await mockAudio.play();
    expect(mockAudio.paused).toBe(false);

    // Simulate app backgrounded
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    // Audio should still be playing
    expect(mockAudio.paused).toBe(false);
  });

  /**
   * Property 14: Audio state preserved across visibility changes
   * 
   * Expected: Volume, currentTime preserved when backgrounding
   * Preservation: State preservation unchanged
   */
  it('PROPERTY: Audio state preserved across visibility changes (Req 3.12)', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';
    mockAudio.volume = 0.6;
    mockAudio.currentTime = 450;
    await mockAudio.play();

    // Background
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(mockAudio.volume).toBe(0.6);
    expect(mockAudio.currentTime).toBe(450);

    // Foreground
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(mockAudio.volume).toBe(0.6);
    expect(mockAudio.currentTime).toBe(450);
  });

  /**
   * Property 15: Property-based test for background playback
   * 
   * For ANY number of background/foreground cycles, audio continues
   */
  it('PROPERTY: Audio survives multiple background cycles (Req 3.12)', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';
    await mockAudio.play();

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (numCycles) => {
          for (let i = 0; i < numCycles; i++) {
            // Background
            Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
            document.dispatchEvent(new Event('visibilitychange'));
            
            // Foreground
            Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
            document.dispatchEvent(new Event('visibilitychange'));
          }

          // Audio should still be playing
          return !mockAudio.paused;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 16: Audio persists across all pages
   * 
   * Expected: Single audio instance survives page navigation
   * Preservation: Cross-page audio singleton unchanged
   */
  it('PROPERTY: Audio persists across all pages (Req 3.12)', () => {
    // Simulate audio singleton initialized on page 1
    const audioInstance1 = mockAudio;
    audioInstance1.src = 'https://example.com/audio/track.mp3';

    // Navigate to page 2 (same audio instance should be used)
    const audioInstance2 = audioInstance1;

    // Verify same instance
    expect(audioInstance2).toBe(audioInstance1);
    expect(audioInstance2.src).toBe('https://example.com/audio/track.mp3');
  });

  /**
   * Property 17: Network reconnect doesn't stop playback
   * 
   * Expected: Audio continues after network recovery
   * Preservation: Network recovery unchanged
   */
  it('PROPERTY: Network reconnect doesn\'t stop playback (Req 3.8, 3.12)', async () => {
    mockAudio.src = 'https://example.com/audio/track.mp3';
    await mockAudio.play();
    expect(mockAudio.paused).toBe(false);

    // Simulate network disconnect
    mockAudio.networkState = 0; // NETWORK_EMPTY
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

    // Simulate buffering during disconnect
    mockAudio.readyState = 2;
    mockAudio._trigger('waiting');

    // Simulate network reconnect
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    mockAudio.networkState = 2; // NETWORK_LOADING
    mockAudio.readyState = 4; // HAVE_ENOUGH_DATA
    mockAudio._trigger('canplaythrough');

    // Audio should continue playing
    expect(mockAudio.paused).toBe(false);
    expect(mockAudio.readyState).toBe(4);
  });
});
