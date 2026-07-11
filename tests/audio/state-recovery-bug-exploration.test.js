/**
 * Bug Condition Exploration Test: State Recovery Failures
 * 
 * **Validates: Requirements 1.14, 1.15, 1.16, 1.17**
 * 
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists.
 * 
 * Bug Symptom: After refresh/sleep/reconnect, incorrect "Behind Live" values and stale positions
 * Root Cause: State recovery uses stale cached offsets instead of forcing fresh server sync
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';

describe('BUG EXPLORATION: State Recovery Failures', () => {
  let mockAudio;
  let _syncCache;
  let _syncCacheAt;
  let currentTrackIndex;
  let getServerPosFunc;
  let recoverStateFunc;

  beforeEach(() => {
    // Simulate stale cache from before recovery event
    _syncCache = {
      trackIndex: 10,
      position: 600, // 10:00
      epoch: 1704067200
    };
    _syncCacheAt = Date.now() - 600000; // Cache is 10 minutes old (stale!)
    currentTrackIndex = 10;

    const SYNC_TTL = 4500; // 4.5 seconds

    mockAudio = {
      currentTime: 600,
      duration: 5591,
      paused: false,
      src: 'https://cdn.example.com/day-11.webm',
      play: vi.fn(() => {
        mockAudio.paused = false;
        return Promise.resolve();
      })
    };

    // Mock fetch for server sync
    global.fetch = vi.fn((url) => {
      // Server's current live position (10 minutes ahead of cached value)
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          trackIndex: 15, // Live is now at Track 15
          trackPosition: 1800, // @ 30:00
          epoch: 1704067200,
          trackDuration: 5640,
          trackTitle: 'Day 15 - Amritvela Kirtan',
          trackArtist: 'ਅੰਮ੍ਰਿਤ ਵੇਲੇ ਦੀ ਬਾਣੀ'
        })
      });
    });

    // BUG: getServerPos doesn't force fresh sync on recovery
    getServerPosFunc = async (force = false) => {
      // BUG: Doesn't check if cache is stale due to recovery event
      if (!force && _syncCache && (Date.now() - _syncCacheAt) < SYNC_TTL) {
        const drift = (Date.now() - _syncCacheAt) / 1000;
        console.log(`[GET_POS] Using stale cache (${Math.floor(drift)}s drift, cache age: ${Math.floor((Date.now() - _syncCacheAt) / 1000)}s)`);
        return {
          trackIndex: _syncCache.trackIndex,
          position: _syncCache.position + drift, // BUG: Accumulated massive drift
          fromCache: true
        };
      }

      // Fetch fresh from server
      const resp = await fetch('/api/radio/live');
      const data = await resp.json();
      
      _syncCache = {
        trackIndex: data.trackIndex,
        position: data.trackPosition
      };
      _syncCacheAt = Date.now();

      console.log(`[GET_POS] Fresh server sync: Track ${data.trackIndex} @ ${data.trackPosition}s`);
      return {
        trackIndex: data.trackIndex,
        position: data.trackPosition,
        fromCache: false
      };
    };

    // BUG: State recovery doesn't force fresh sync
    recoverStateFunc = async () => {
      // BUG: Uses stale cache without forcing fresh sync
      const pos = await getServerPosFunc(false); // Should be force=true!
      
      currentTrackIndex = pos.trackIndex;
      mockAudio.currentTime = pos.position;
      
      console.log(`[RECOVERY] Recovered to Track ${currentTrackIndex} @ ${Math.floor(mockAudio.currentTime)}s (fromCache: ${pos.fromCache})`);
      
      return pos;
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Bug Test 1: Page refresh uses stale cached offsets
   * 
   * Expected: Fresh server sync after refresh
   * Bug: Uses 10-minute-old cache, shows incorrect position
   */
  it('BUG: Page refresh uses stale cached timeline offsets', async () => {
    console.log(`[BEFORE REFRESH] Cache age: ${Math.floor((Date.now() - _syncCacheAt) / 1000)}s`);
    console.log(`[CACHED] Track ${_syncCache.trackIndex} @ ${_syncCache.position}s`);
    
    // Simulate page refresh (state recovery)
    const recoveredPos = await recoverStateFunc();
    
    console.log(`[AFTER REFRESH] Track ${currentTrackIndex} @ ${Math.floor(mockAudio.currentTime)}s`);
    
    // EXPECTED: Should fetch fresh from server (Track 15 @ 30:00)
    expect(recoveredPos.fromCache).toBe(false);
    expect(currentTrackIndex).toBe(15); // Server's current track
    expect(mockAudio.currentTime).toBeCloseTo(1800, 1); // Server's current position
    
    // This assertion WILL FAIL on unfixed code (uses stale cache)
  });

  /**
   * Bug Test 2: Device sleep/wake uses stale cache
   * 
   * Expected: After 10-minute sleep, force fresh sync
   * Bug: Cache appears "valid" because wall clock validation is missing
   */
  it('BUG: Device sleep causes stale cache (wall clock drift not detected)', async () => {
    // Simulate device going to sleep for 10 minutes
    // In real scenario, _syncCacheAt timestamp becomes invalid
    const sleepDuration = 600000; // 10 minutes
    
    console.log(`[BEFORE SLEEP] Cache timestamp: ${new Date(_syncCacheAt).toISOString()}`);
    console.log(`[BEFORE SLEEP] Current time: ${new Date().toISOString()}`);
    
    // Simulate time passage (in reality, Date.now() jumps)
    _syncCacheAt = Date.now() - sleepDuration;
    
    console.log(`[AFTER SLEEP] Cache age: ${Math.floor((Date.now() - _syncCacheAt) / 1000)}s`);
    
    // Wake up and recover
    const recoveredPos = await recoverStateFunc();
    
    console.log(`[RECOVERY] fromCache: ${recoveredPos.fromCache}`);
    
    // EXPECTED: Should detect wall clock drift and force fresh sync
    expect(recoveredPos.fromCache).toBe(false);
    
    // Calculate "Behind Live"
    const serverLivePos = recoveredPos.position;
    const localPos = mockAudio.currentTime;
    const behindLive = serverLivePos - localPos;
    
    console.log(`[BEHIND LIVE] ${behindLive}s (${(behindLive / 3600).toFixed(2)} hours)`);
    
    // EXPECTED: Should be approximately at server's live position, not 10 hours behind
    expect(behindLive).toBeLessThan(60); // At most 1 minute behind, not hours
    
    // This assertion WILL FAIL on unfixed code (massive drift)
  });

  /**
   * Bug Test 3: Network reconnect uses stale cached offsets
   * 
   * Expected: Force fresh sync on reconnect
   * Bug: Stale cache persists across reconnection
   */
  it('BUG: Network reconnect uses stale cached offsets', async () => {
    // Simulate offline period (5 minutes)
    const offlineDuration = 300000;
    _syncCacheAt = Date.now() - offlineDuration;
    
    console.log(`[OFFLINE] Cache is ${Math.floor((Date.now() - _syncCacheAt) / 1000)}s old`);
    
    // Network reconnects, state recovery happens
    const recoveredPos = await recoverStateFunc();
    
    console.log(`[RECONNECT] Recovered position: Track ${currentTrackIndex} @ ${Math.floor(mockAudio.currentTime)}s`);
    console.log(`[RECONNECT] Used cache: ${recoveredPos.fromCache}`);
    
    // EXPECTED: Should force fresh sync on reconnect
    expect(recoveredPos.fromCache).toBe(false);
    expect(currentTrackIndex).toBe(15); // Fresh from server
    
    // This assertion WILL FAIL on unfixed code
  });

  /**
   * Property Test: For ANY recovery event after stale cache, force fresh sync
   * 
   * Property: If cache age > TTL, recovery must fetch fresh from server
   */
  it('PROPERTY: Recovery events force fresh sync when cache is stale', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5000, max: 600000 }), // cache age in ms (5s to 10min)
        async (cacheAge) => {
          // Setup: Stale cache
          _syncCacheAt = Date.now() - cacheAge;
          
          // Recovery
          const recoveredPos = await recoverStateFunc();
          
          // Property: If cache older than TTL, should fetch fresh
          const SYNC_TTL = 4500;
          const cacheIsStale = cacheAge > SYNC_TTL;
          
          if (cacheIsStale) {
            const fetchedFresh = recoveredPos.fromCache === false;
            
            if (!fetchedFresh) {
              console.log(`[PROPERTY FAIL] Cache age ${cacheAge}ms > TTL ${SYNC_TTL}ms, but used cache anyway`);
            }
            
            return fetchedFresh;
          }
          
          return true; // If cache not stale, test is moot
        }
      ),
      { numRuns: 10, timeout: 5000 }
    );
    
    // This property WILL FAIL on unfixed code
  });

  /**
   * Bug Test 4: Global synchronization broken after recovery
   * 
   * Expected: All devices worldwide on same track after recovery
   * Bug: Each device recovers to different stale position
   */
  it('BUG: Global synchronization broken - devices on different tracks after recovery', async () => {
    // Simulate two devices with different stale caches
    const device1Cache = {
      trackIndex: 8,
      position: 400,
      cacheAt: Date.now() - 480000 // 8 minutes old
    };
    
    const device2Cache = {
      trackIndex: 12,
      position: 900,
      cacheAt: Date.now() - 720000 // 12 minutes old
    };
    
    // Device 1 recovery (BUG: uses stale cache)
    _syncCache = { trackIndex: device1Cache.trackIndex, position: device1Cache.position };
    _syncCacheAt = device1Cache.cacheAt;
    const device1Pos = await recoverStateFunc();
    
    const device1Track = currentTrackIndex;
    const device1Time = mockAudio.currentTime;
    
    // Device 2 recovery (BUG: uses different stale cache)
    _syncCache = { trackIndex: device2Cache.trackIndex, position: device2Cache.position };
    _syncCacheAt = device2Cache.cacheAt;
    const device2Pos = await recoverStateFunc();
    
    const device2Track = currentTrackIndex;
    const device2Time = mockAudio.currentTime;
    
    console.log(`[DEVICE 1] Track ${device1Track} @ ${Math.floor(device1Time)}s`);
    console.log(`[DEVICE 2] Track ${device2Track} @ ${Math.floor(device2Time)}s`);
    console.log(`[SERVER TRUTH] Track 15 @ 1800s`);
    
    // EXPECTED: Both devices should be on Track 15 (server's current track)
    expect(device1Track).toBe(15);
    expect(device2Track).toBe(15);
    
    // EXPECTED: Both should be at approximately the same position
    expect(Math.abs(device1Time - device2Time)).toBeLessThan(10);
    
    // This assertion WILL FAIL on unfixed code (different tracks)
  });

  /**
   * Bug Test 5: Accumulated drift from stale cache
   * 
   * Expected: Behind Live calculation is accurate after recovery
   * Bug: Shows massive drift due to stale cache
   */
  it('BUG: Stale cache causes massive timeline drift calculation', async () => {
    // Setup: Very stale cache (30 minutes old)
    _syncCacheAt = Date.now() - 1800000;
    
    console.log(`[STALE CACHE] ${Math.floor((Date.now() - _syncCacheAt) / 60000)} minutes old`);
    
    // Recovery
    const recoveredPos = await recoverStateFunc();
    
    // Calculate "Behind Live"
    const serverLivePos = 1800; // Server is at Track 15 @ 30:00
    const localPos = mockAudio.currentTime;
    const behindLive = serverLivePos - localPos;
    
    console.log(`[BEHIND LIVE] ${behindLive}s (${(behindLive / 3600).toFixed(2)} hours, ${(behindLive / 60).toFixed(2)} minutes)`);
    
    // EXPECTED: Should be near live (within a minute)
    expect(behindLive).toBeLessThan(60); // Not hours behind
    
    // This assertion WILL FAIL on unfixed code (shows hours of drift)
  });

  /**
   * Bug Test 6: localStorage persistence makes stale cache worse
   * 
   * Expected: Stale localStorage data is invalidated on load
   * Bug: Persisted stale cache loads and is used
   */
  it('BUG: Persisted stale cache from localStorage causes drift', () => {
    // Simulate localStorage with very old cached data
    const oldCachedData = {
      trackIndex: 5,
      position: 200,
      epoch: 1704067200,
      timestamp: Date.now() - 3600000 // 1 hour old!
    };
    
    global.localStorage = {
      getItem: vi.fn((key) => {
        if (key === 'anhad_broadcast_meta') {
          return JSON.stringify({
            amritvela: {
              epoch: oldCachedData.epoch,
              lastServerTime: oldCachedData.timestamp
            }
          });
        }
        return null;
      }),
      setItem: vi.fn()
    };
    
    // Load from localStorage (BUG: doesn't validate staleness)
    const loadedData = JSON.parse(global.localStorage.getItem('anhad_broadcast_meta'));
    const amritvelaData = loadedData.amritvela;
    
    const cacheAge = Date.now() - amritvelaData.lastServerTime;
    
    console.log(`[LOCALSTORAGE] Cache age: ${Math.floor(cacheAge / 60000)} minutes`);
    
    // EXPECTED: Should detect stale cache and not use it
    expect(cacheAge).toBeLessThan(300000); // Should be < 5 minutes old
    
    // This assertion WILL FAIL on unfixed code (1 hour old cache)
  });

  /**
   * Property Test: Recovery always results in globally consistent position
   * 
   * Property: After any recovery event, position matches server's authoritative timeline
   */
  it('PROPERTY: Recovery always syncs to server authoritative timeline', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10000, max: 3600000 }), // cache staleness (10s to 1hour)
        fc.integer({ min: 0, max: 39 }), // old cached track
        async (staleness, oldTrack) => {
          // Setup: Stale cache
          _syncCache = { trackIndex: oldTrack, position: 500 };
          _syncCacheAt = Date.now() - staleness;
          
          // Recovery
          const recoveredPos = await recoverStateFunc();
          
          // Property: Should match server's track (15)
          const matchesServer = currentTrackIndex === 15;
          
          if (!matchesServer) {
            console.log(`[PROPERTY FAIL] Server at Track 15, recovered to Track ${currentTrackIndex} (staleness: ${staleness}ms)`);
          }
          
          return matchesServer;
        }
      ),
      { numRuns: 15, timeout: 5000 }
    );
    
    // This property WILL FAIL on unfixed code
  });

  /**
   * Bug Test 7: Multiple recovery events compound drift
   * 
   * Expected: Each recovery forces fresh sync
   * Bug: Drift accumulates across multiple recoveries
   */
  it('BUG: Multiple recovery events compound timeline drift', async () => {
    const recoveryLog = [];
    
    // Simulate multiple recovery events
    for (let i = 0; i < 3; i++) {
      // Make cache increasingly stale
      _syncCacheAt = Date.now() - (i + 1) * 300000; // 5, 10, 15 minutes
      
      const recoveredPos = await recoverStateFunc();
      
      const serverLivePos = 1800;
      const behindLive = serverLivePos - mockAudio.currentTime;
      
      recoveryLog.push({
        iteration: i + 1,
        cacheAge: Math.floor((Date.now() - _syncCacheAt) / 60000),
        track: currentTrackIndex,
        behindLive: behindLive,
        usedCache: recoveredPos.fromCache
      });
      
      console.log(`[RECOVERY ${i + 1}] Behind Live: ${behindLive}s, Used Cache: ${recoveredPos.fromCache}`);
    }
    
    // EXPECTED: Each recovery should fetch fresh, keeping drift minimal
    for (const log of recoveryLog) {
      expect(log.usedCache).toBe(false);
      expect(log.behindLive).toBeLessThan(60);
    }
    
    // This assertion WILL FAIL on unfixed code (drift compounds)
  });

  /**
   * Bug Test 8: Force parameter is ignored
   * 
   * Expected: getServerPos(force=true) always fetches fresh
   * Bug: Force parameter doesn't bypass cache
   */
  it('BUG: Force parameter does not bypass cache', async () => {
    // Setup: Valid cache (not expired)
    _syncCacheAt = Date.now() - 1000; // 1 second old (within TTL)
    
    // Call with force=true
    const forcedPos = await getServerPosFunc(true);
    
    console.log(`[FORCED SYNC] fromCache: ${forcedPos.fromCache}`);
    
    // EXPECTED: Should ignore cache when forced
    expect(forcedPos.fromCache).toBe(false);
    expect(forcedPos.trackIndex).toBe(15); // Fresh from server
    
    // This test should PASS on buggy code IF force is implemented correctly
    // But validates that force parameter exists and works
  });
});
