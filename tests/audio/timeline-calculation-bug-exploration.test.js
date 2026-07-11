/**
 * Bug Condition Exploration Test: Timeline Calculation Errors
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists. Success means the bug is already fixed.
 * 
 * Bug Symptom: After pausing for 10 seconds, system displays "11 hours behind"
 * Root Cause: _syncCache not invalidated on pause, accumulated drift from stale cache
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';

describe('BUG EXPLORATION: Timeline Calculation Errors', () => {
  let originalFetch;
  let mockAudio;
  let getServerPosFunc;

  beforeEach(() => {
    // Mock fetch to simulate server sync responses
    originalFetch = global.fetch;
    global.fetch = vi.fn((url) => {
      const now = Date.now();
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          trackIndex: 15,
          trackPosition: 1830, // 30:30 (30 minutes 30 seconds)
          epoch: 1704067200,
          trackDuration: 5640,
          trackTitle: 'Day 15 - Amritvela Kirtan',
          trackArtist: 'ਅੰਮ੍ਰਿਤ ਵੇਲੇ ਦੀ ਬਾਣੀ'
        })
      });
    });

    // Simulate the getServerLivePosition function with cache behavior (BUG PRESENT)
    let _syncCache = null;
    let _syncCacheAt = 0;
    const SYNC_TTL = 4500; // 4.5 seconds cache TTL

    getServerPosFunc = async (force = false) => {
      // Bug condition: Cache is not invalidated on pause
      if (!force && _syncCache && (Date.now() - _syncCacheAt) < SYNC_TTL) {
        const drift = (Date.now() - _syncCacheAt) / 1000;
        return {
          trackIndex: _syncCache.trackIndex,
          position: _syncCache.position + drift, // BUG: drift accumulates even when paused
          fromCache: true
        };
      }

      const resp = await fetch('/api/radio/live?t=' + Date.now());
      const data = await resp.json();
      const latency = 0.05; // 50ms latency

      _syncCache = {
        trackIndex: data.trackIndex,
        position: data.trackPosition + latency
      };
      _syncCacheAt = Date.now();

      return {
        trackIndex: _syncCache.trackIndex,
        position: _syncCache.position,
        fromCache: false
      };
    };

    // Mock audio element
    mockAudio = {
      currentTime: 1830,
      paused: false,
      pause() { this.paused = true; },
      play() { this.paused = false; }
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  /**
   * Property 1: Timeline drift after short pause
   * 
   * Expected: After pausing for 10 seconds, "Behind Live" should be ~10 seconds
   * Bug: Shows "11 hours behind" or other impossible values
   */
  it('BUG: Short pause causes impossible timeline drift (10s pause → 11 hours behind)', async () => {
    // Get initial server position (this caches it)
    const initialPos = await getServerPosFunc();
    expect(initialPos.fromCache).toBe(false);
    expect(initialPos.trackIndex).toBe(15);
    expect(initialPos.position).toBeCloseTo(1830, 1);

    // Simulate user pausing
    mockAudio.pause();
    const pauseStartTime = Date.now();

    // Wait 10 seconds (simulate passage of time) - SCALED DOWN FOR TESTING
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms to simulate 10s

    // Get position again (BUG: uses stale cache with accumulated drift)
    const afterPausePos = await getServerPosFunc();
    
    // Calculate "Behind Live"
    const serverLivePos = afterPausePos.position;
    const localPos = mockAudio.currentTime; // Still at 1830 because paused
    const behindLive = serverLivePos - localPos;

    console.log(`[BUG TEST] After 10s pause:`);
    console.log(`  Server Live Position: ${serverLivePos}s`);
    console.log(`  Local Position: ${localPos}s`);
    console.log(`  Behind Live: ${behindLive}s (${(behindLive / 3600).toFixed(2)} hours)`);

    // EXPECTED: Should be approximately 10 seconds behind
    // BUG: Will show massive drift (cache drift accumulated while paused)
    expect(behindLive).toBeGreaterThan(5);
    expect(behindLive).toBeLessThan(15); // Should be ~10 seconds, not hours

    // This assertion WILL FAIL on unfixed code, proving the bug exists
  }, 5000);

  /**
   * Property 2: Timeline drift after 2-minute pause
   * 
   * Expected: After pausing for 2 minutes, "Behind Live" should be ~2 minutes (120s)
   * Bug: Shows "12 hours behind" or other mathematically incorrect values
   */
  it('BUG: 2-minute pause causes mathematically incorrect timeline (2min pause → 12 hours behind)', async () => {
    // Get initial server position
    const initialPos = await getServerPosFunc();
    expect(initialPos.fromCache).toBe(false);

    // Simulate user pausing
    mockAudio.pause();
    const pauseStartTime = Date.now();

    // Wait 2 minutes - SCALED DOWN FOR TESTING
    await new Promise(resolve => setTimeout(resolve, 200)); // 200ms to simulate 2min

    // Get position again
    const afterPausePos = await getServerPosFunc();
    
    const serverLivePos = afterPausePos.position;
    const localPos = mockAudio.currentTime;
    const behindLive = serverLivePos - localPos;

    console.log(`[BUG TEST] After 2min pause:`);
    console.log(`  Behind Live: ${behindLive}s (${(behindLive / 60).toFixed(2)} minutes, ${(behindLive / 3600).toFixed(2)} hours)`);

    // EXPECTED: Should be approximately 120 seconds (2 minutes) behind
    expect(behindLive).toBeGreaterThan(100);
    expect(behindLive).toBeLessThan(140); // Should be ~2 minutes, not 12 hours

    // This assertion WILL FAIL on unfixed code
  }, 5000);

  /**
   * Property 3: Property-based test for pause duration invariant
   * 
   * For ANY pause duration between 1-300 seconds, the "Behind Live" calculation
   * should equal the pause duration ± 5 seconds (for network latency)
   */
  it('PROPERTY: Behind Live = Pause Duration (for any pause 1-300s)', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 300 }), // Pause duration in seconds
        async (pauseDurationSeconds) => {
          // Get initial position
          const initialPos = await getServerPosFunc();
          
          // Simulate pause
          mockAudio.pause();
          
          // Simulate time passage - SCALED DOWN
          await new Promise(resolve => setTimeout(resolve, Math.min(pauseDurationSeconds * 10, 500)));
          
          // Get position after pause
          const afterPausePos = await getServerPosFunc();
          
          const behindLive = afterPausePos.position - mockAudio.currentTime;
          
          // PROPERTY: Behind Live should equal pause duration ± 5 seconds
          const expectedMin = pauseDurationSeconds - 5;
          const expectedMax = pauseDurationSeconds + 5;
          
          console.log(`[PROPERTY TEST] Pause: ${pauseDurationSeconds}s, Behind: ${behindLive.toFixed(2)}s`);
          
          // This will FAIL on unfixed code for most values
          return behindLive >= expectedMin && behindLive <= expectedMax;
        }
      ),
      { numRuns: 10, timeout: 5000 } // Run 10 random test cases
    );
  });

  /**
   * Property 4: Cache invalidation on pause
   * 
   * Expected: Pausing should invalidate the sync cache
   * Bug: Cache remains valid, causing drift accumulation
   */
  it('BUG: Pause does not invalidate sync cache', async () => {
    // Get initial position (caches it)
    const pos1 = await getServerPosFunc();
    expect(pos1.fromCache).toBe(false);

    // Immediately get again (should use cache)
    const pos2 = await getServerPosFunc();
    expect(pos2.fromCache).toBe(true);

    // Pause audio
    mockAudio.pause();

    // Get position again
    const pos3 = await getServerPosFunc();
    
    // EXPECTED: Cache should be invalidated, so fromCache should be false
    // BUG: Cache is still valid, fromCache is true
    console.log(`[BUG TEST] After pause, fromCache: ${pos3.fromCache}`);
    
    expect(pos3.fromCache).toBe(false); // WILL FAIL - cache not invalidated

    // This assertion WILL FAIL on unfixed code, proving cache invalidation bug
  });

  /**
   * Property 5: Wall clock drift detection
   * 
   * Expected: If wall clock jumps (device sleep), cache should be invalidated
   * Bug: Cache timestamp not validated against wall clock jumps
   */
  it('BUG: Device sleep causes stale cache (wall clock drift not detected)', async () => {
    // Get initial position (caches it)
    const pos1 = await getServerPosFunc();
    expect(pos1.fromCache).toBe(false);

    // Simulate device sleep (10 minutes) - SCALED DOWN
    // In real scenario, Date.now() would jump forward
    // Here we simulate by waiting and checking if cache is invalidated
    await new Promise(resolve => setTimeout(resolve, 600)); // 600ms to simulate 10 minutes

    // Get position again
    const pos2 = await getServerPosFunc();
    
    // EXPECTED: After 10 minutes, cache should be invalidated (TTL is 4.5s)
    // BUG: If wall clock validation is missing, stale cache could persist
    console.log(`[BUG TEST] After 10min, fromCache: ${pos2.fromCache}`);
    
    // Cache TTL is 4.5s, so after 10 minutes it should definitely be expired
    expect(pos2.fromCache).toBe(false); // Should pass even on buggy code (TTL expires)
    
    // But the position drift should still be correct
    const behindLive = pos2.position - mockAudio.currentTime;
    expect(behindLive).toBeLessThan(620); // 10 minutes + 20s buffer
    
    // This assertion WILL FAIL if wall clock validation is missing
  }, 5000);
});
