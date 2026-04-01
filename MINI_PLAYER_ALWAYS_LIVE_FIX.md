# 🎵 Mini Player Always Live Fix

## Problem
The mini player was NOT staying live when users navigated between pages. Instead, it would resume from the cached position where they clicked play, requiring users to clear cache to get back to the live stream.

## Root Cause
The issue was in `frontend/lib/global-mini-player.js`:

1. **Stale Cache Usage**: The `getServerLivePosition()` function was caching server sync data indefinitely without forcing fresh syncs when needed
2. **No Force Refresh**: When resuming playback or toggling play/pause, the system would use cached position data instead of fetching the current live position
3. **Drift Tolerance**: The toggle function had a 3-second drift tolerance, allowing audio to stay behind the live stream
4. **No Cache Busting**: Live streams weren't using cache busters to force fresh connections

## Solution Applied

### 1. Enhanced Server Sync with Force Refresh
```javascript
async function getServerLivePosition(forceRefresh = false) {
  // Use cache only if fresh AND not forcing refresh
  if (!forceRefresh && cachedPosition && (Date.now() - lastSyncTime) < SYNC_CACHE_TTL) {
    // Return cached position with time extrapolation
  }
  
  // Force fresh server sync with cache-control headers
  const resp = await fetch(`${API_BASE}/api/radio/live`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' }
  });
}
```

### 2. Always Jump to Live on Resume
```javascript
async function togglePlayPause() {
  if (audio.paused) {
    if (STREAMS[currentStream].type === 'playlist') {
      // CRITICAL FIX: Force fresh sync
      const pos = await getServerLivePosition(true);
      
      // ALWAYS seek to live position (no drift tolerance)
      audio.currentTime = targetPos;
      console.log(`[GMP] Jumped to live: ${Math.floor(targetPos)}s`);
    } else {
      // Live stream - add cache buster
      audio.src = baseUrl + '?t=' + Date.now();
    }
  }
}
```

### 3. Fresh Sync on Page Navigation
```javascript
async function resumePlayback() {
  if (stream.type === 'live') {
    // Add cache buster to force fresh connection
    audio.src = stream.url + '?t=' + Date.now();
  } else if (stream.type === 'playlist') {
    // Force fresh server sync
    const pos = await getServerLivePosition(true);
    currentTrackIndex = pos.trackIndex;
    audio.src = stream.getTrackUrl(currentTrackIndex);
    // Seek to live position
    audio.currentTime = Math.min(pos.position, dur - 5);
  }
}
```

### 4. Force Refresh on All Critical Operations
- `playStream()`: Force fresh sync when starting playback
- `togglePlayPause()`: Force fresh sync when resuming
- `resumePlayback()`: Force fresh sync on page load
- `playNextTrack()`: Force fresh sync on track boundaries

## Key Changes

### Before
- ❌ Used cached position data indefinitely
- ❌ 3-second drift tolerance allowed audio to lag
- ❌ No cache busting on live streams
- ❌ Resume used stale cached positions

### After
- ✅ Force fresh server sync on all resume operations
- ✅ ZERO drift tolerance - always jump to live
- ✅ Cache busting on live streams with timestamps
- ✅ Fresh sync on page navigation
- ✅ Reduced cache TTL to 3 seconds (from unlimited)

## Testing

### Test File
`frontend/test-mini-player-live-fix.html`

### Test Steps
1. Open the test page
2. Click "Play Amritvela" to start playlist
3. Wait 10-20 seconds
4. Click "Simulate Page Navigation"
5. Verify audio jumps to LIVE position (not cached position)
6. Check logs to confirm server sync is happening

### Expected Behavior
- ✅ Audio ALWAYS jumps to live position on resume
- ✅ No need to clear cache
- ✅ Console shows "Server sync: Track X at Ys"
- ✅ Position matches server time, not cached time

## Files Modified
- `frontend/lib/global-mini-player.js`
  - Enhanced `getServerLivePosition()` with force refresh parameter
  - Updated `togglePlayPause()` to always jump to live
  - Updated `resumePlayback()` to force fresh sync
  - Updated `playStream()` to force fresh sync
  - Updated `playNextTrack()` to force fresh sync
  - Added cache busting for live streams

## Impact
- ✅ Users never need to clear cache
- ✅ Audio is ALWAYS live, ALWAYS in sync
- ✅ Seamless experience across page navigation
- ✅ Works for both live streams and playlist streams
- ✅ Automatic drift correction on every resume

## Deployment
1. The fix is already applied to `frontend/lib/global-mini-player.js`
2. Test using `frontend/test-mini-player-live-fix.html`
3. Deploy to production
4. No cache clearing needed for users - fix is automatic

## Notes
- The fix maintains backward compatibility
- Fallback to local calculation if server is unreachable
- Cache TTL reduced to 3 seconds for safety
- All critical operations now force fresh server sync
- Live streams use timestamp-based cache busting

---

**Status**: ✅ COMPLETE
**Date**: 2026-04-01
**Priority**: CRITICAL - User Experience
