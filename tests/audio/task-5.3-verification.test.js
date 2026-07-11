/**
 * Task 5.3 Verification Test: Centralize Master State in anhad-audio-singleton.js
 * 
 * **Validates: Requirements 2.6, 2.7, 2.8, 2.9, 2.10**
 * 
 * Purpose: Verify that the getState() method exists, is exposed in window.AnhadAudio API,
 * and returns all required fields for master playback state.
 * 
 * Expected Behavior: Master state accessible to all UI components via getState()
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Task 5.3 Verification: Master State Centralization', () => {
  
  /**
   * Test 1: Verify getState() method exists in window.AnhadAudio
   */
  it('should expose getState() method in window.AnhadAudio API', () => {
    // Check that AnhadAudio singleton is loaded
    expect(window.AnhadAudio).toBeDefined();
    expect(window.AnhadAudio._singleton).toBe(true);
    
    // Check that getState method exists and is a function
    expect(window.AnhadAudio.getState).toBeDefined();
    expect(typeof window.AnhadAudio.getState).toBe('function');
    
    console.log('✅ getState() method is exposed in window.AnhadAudio API');
  });

  /**
   * Test 2: Verify getState() returns all required fields
   * 
   * Required fields from Task 5.3:
   * - currentStream
   * - currentTrackIndex
   * - currentTrackTitle
   * - currentTrackArtist
   * - isPlaying
   * - isLoading
   * - currentTime
   * - duration
   * - volume
   * - pauseAnchor
   */
  it('should return all required fields in master state', () => {
    const state = window.AnhadAudio.getState();
    
    // Verify state object exists
    expect(state).toBeDefined();
    expect(typeof state).toBe('object');
    
    // Verify all required fields are present
    const requiredFields = [
      'currentStream',
      'currentTrackIndex',
      'currentTrackTitle',
      'currentTrackArtist',
      'isPlaying',
      'isLoading',
      'currentTime',
      'duration',
      'volume',
      'pauseAnchor'
    ];
    
    requiredFields.forEach(field => {
      expect(state).toHaveProperty(field);
      console.log(`✅ Field '${field}' is present:`, state[field]);
    });
  });

  /**
   * Test 3: Verify field types are correct
   */
  it('should return correct data types for all fields', () => {
    const state = window.AnhadAudio.getState();
    
    // currentStream: string | null
    expect(state.currentStream === null || typeof state.currentStream === 'string').toBe(true);
    
    // currentTrackIndex: number
    expect(typeof state.currentTrackIndex).toBe('number');
    
    // currentTrackTitle: string
    expect(typeof state.currentTrackTitle).toBe('string');
    
    // currentTrackArtist: string
    expect(typeof state.currentTrackArtist).toBe('string');
    
    // isPlaying: boolean
    expect(typeof state.isPlaying).toBe('boolean');
    
    // isLoading: boolean
    expect(typeof state.isLoading).toBe('boolean');
    
    // currentTime: number
    expect(typeof state.currentTime).toBe('number');
    
    // duration: number
    expect(typeof state.duration).toBe('number');
    
    // volume: number
    expect(typeof state.volume).toBe('number');
    expect(state.volume).toBeGreaterThanOrEqual(0);
    expect(state.volume).toBeLessThanOrEqual(1);
    
    // pauseAnchor: object | null
    expect(state.pauseAnchor === null || typeof state.pauseAnchor === 'object').toBe(true);
    
    console.log('✅ All fields have correct data types');
  });

  /**
   * Test 4: Verify pauseAnchor structure when present
   */
  it('should have correct structure for pauseAnchor when set', () => {
    const state = window.AnhadAudio.getState();
    
    // pauseAnchor can be null (not paused) or an object with trackIndex, position, timestamp
    if (state.pauseAnchor !== null) {
      expect(typeof state.pauseAnchor).toBe('object');
      expect(state.pauseAnchor).toHaveProperty('trackIndex');
      expect(state.pauseAnchor).toHaveProperty('position');
      expect(state.pauseAnchor).toHaveProperty('timestamp');
      
      expect(typeof state.pauseAnchor.trackIndex).toBe('number');
      expect(typeof state.pauseAnchor.position).toBe('number');
      expect(typeof state.pauseAnchor.timestamp).toBe('number');
      
      console.log('✅ pauseAnchor structure is correct:', state.pauseAnchor);
    } else {
      console.log('✅ pauseAnchor is null (not currently paused)');
    }
  });

  /**
   * Test 5: Verify additional metadata fields are present
   * 
   * getPublicState() also returns additional useful fields:
   * - liveOffset
   * - isBehind
   * - streamName
   * - streamSubtitle
   * - streamType
   * - artwork
   * - playerPage
   */
  it('should include additional metadata fields for UI components', () => {
    const state = window.AnhadAudio.getState();
    
    const additionalFields = [
      'liveOffset',
      'isBehind',
      'streamName',
      'streamSubtitle',
      'streamType',
      'artwork',
      'playerPage'
    ];
    
    additionalFields.forEach(field => {
      expect(state).toHaveProperty(field);
      console.log(`✅ Additional field '${field}' is present:`, state[field]);
    });
  });

  /**
   * Test 6: Verify getState() is callable multiple times
   */
  it('should allow multiple calls to getState() without errors', () => {
    let state1, state2, state3;
    
    expect(() => {
      state1 = window.AnhadAudio.getState();
      state2 = window.AnhadAudio.getState();
      state3 = window.AnhadAudio.getState();
    }).not.toThrow();
    
    // All calls should return valid state objects
    expect(state1).toBeDefined();
    expect(state2).toBeDefined();
    expect(state3).toBeDefined();
    
    console.log('✅ getState() can be called multiple times without errors');
  });

  /**
   * Test 7: Verify state is accessible for UI synchronization
   * 
   * This test simulates how UI components (Mini Player, Radio Page) should
   * read from the master state.
   */
  it('should provide single source of truth for UI components', () => {
    // Simulate Mini Player reading from master state
    const miniPlayerState = window.AnhadAudio.getState();
    
    // Simulate Radio Page reading from master state
    const radioPageState = window.AnhadAudio.getState();
    
    // Both should get the same values (single source of truth)
    expect(miniPlayerState.currentStream).toBe(radioPageState.currentStream);
    expect(miniPlayerState.currentTrackIndex).toBe(radioPageState.currentTrackIndex);
    expect(miniPlayerState.currentTrackTitle).toBe(radioPageState.currentTrackTitle);
    expect(miniPlayerState.currentTrackArtist).toBe(radioPageState.currentTrackArtist);
    expect(miniPlayerState.isPlaying).toBe(radioPageState.isPlaying);
    expect(miniPlayerState.currentTime).toBe(radioPageState.currentTime);
    expect(miniPlayerState.duration).toBe(radioPageState.duration);
    expect(miniPlayerState.volume).toBe(radioPageState.volume);
    expect(miniPlayerState.pauseAnchor).toBe(radioPageState.pauseAnchor);
    
    console.log('✅ All UI components get consistent state from master source');
  });

  /**
   * Test 8: Verify backward compatibility shims also expose getState
   */
  it('should maintain backward compatibility with AnhadOverlayPlayer.getState()', () => {
    expect(window.AnhadOverlayPlayer).toBeDefined();
    expect(window.AnhadOverlayPlayer.getState).toBeDefined();
    expect(typeof window.AnhadOverlayPlayer.getState).toBe('function');
    
    const state = window.AnhadOverlayPlayer.getState();
    expect(state).toBeDefined();
    expect(state).toHaveProperty('currentStream');
    expect(state).toHaveProperty('isPlaying');
    
    console.log('✅ Backward compatibility maintained for AnhadOverlayPlayer');
  });

  /**
   * Test 9: Integration test - verify state consistency after operations
   * 
   * This test verifies that getState() reflects the actual master state
   * maintained by the singleton.
   */
  it('should reflect actual master state consistency', () => {
    const initialState = window.AnhadAudio.getState();
    
    // Verify internal consistency
    if (initialState.currentStream) {
      // If a stream is loaded, verify stream metadata is consistent
      expect(initialState.streamName).toBeTruthy();
      expect(initialState.streamType).toBeTruthy();
      
      console.log(`✅ Stream metadata is consistent: ${initialState.streamName} (${initialState.streamType})`);
    }
    
    // Verify time values are non-negative
    expect(initialState.currentTime).toBeGreaterThanOrEqual(0);
    expect(initialState.duration).toBeGreaterThanOrEqual(0);
    
    // If playing, duration should be positive
    if (initialState.isPlaying && initialState.duration > 0) {
      expect(initialState.currentTime).toBeLessThanOrEqual(initialState.duration);
      console.log(`✅ Playback position is valid: ${Math.floor(initialState.currentTime)}s / ${Math.floor(initialState.duration)}s`);
    }
    
    console.log('✅ Master state is internally consistent');
  });

  /**
   * Test 10: Verify Bug Condition is resolved
   * 
   * Bug Condition: isBugCondition() where no single source of truth for playback state
   * Expected Behavior: Master state accessible to all UI components via getState()
   */
  it('should resolve Bug Condition: single source of truth exists', () => {
    // Verify the bug condition is resolved by checking:
    // 1. getState() exists and is accessible
    expect(window.AnhadAudio.getState).toBeDefined();
    
    // 2. getState() returns a complete state object
    const state = window.AnhadAudio.getState();
    expect(state).toBeDefined();
    expect(Object.keys(state).length).toBeGreaterThan(0);
    
    // 3. All required fields for UI synchronization are present
    const requiredForSync = [
      'currentStream',
      'currentTrackIndex',
      'currentTrackTitle',
      'currentTrackArtist',
      'isPlaying',
      'isLoading',
      'currentTime',
      'duration',
      'volume',
      'pauseAnchor'
    ];
    
    const allFieldsPresent = requiredForSync.every(field => state.hasOwnProperty(field));
    expect(allFieldsPresent).toBe(true);
    
    console.log('✅ BUG CONDITION RESOLVED: Single source of truth exists via getState()');
    console.log('✅ Requirements 2.6, 2.7, 2.8, 2.9, 2.10 validated');
  });
});
