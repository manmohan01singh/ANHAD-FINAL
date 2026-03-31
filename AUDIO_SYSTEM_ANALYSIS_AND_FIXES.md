# Gurbani Radio System - Deep Analysis & Fixes

## Current System Architecture

### Two Separate Audio Systems:

1. **Darbar Sahib Live** - Managed by `GlobalMiniPlayer` (global-mini-player.js)
   - Live stream from SGPC: `https://live.sgpc.net:8443/`
   - Persists across all pages
   - Uses its own `<audio>` element

2. **Amritvela Kirtan** - Managed by `AnhadAudio` (persistent-audio.js)
   - 40 curated tracks from Cloudflare R2
   - Server-synced virtual live broadcast
   - Uses its own separate `<audio>` element

## 🔴 CRITICAL ISSUES IDENTIFIED

### Issue #1: Simultaneous Playback ✅ CONFIRMED
**Problem**: Both audio systems can play at the same time because they use separate `<audio>` elements and don't communicate with each other.

**Root Cause**:
- `GlobalMiniPlayer` creates its own audio element
- `AnhadAudio` creates its own audio element
- No cross-communication or mutual exclusion logic

### Issue #2: Server Sync Working Correctly ✅ VERIFIED
**Status**: The Amritvela Kirtan virtual live system IS working correctly!

**How it works**:
1. Backend has a fixed `epoch` timestamp (birth of the radio station)
2. Server calculates current position: `(now - epoch) % totalPlaylistDuration`
3. All clients call `/api/radio/live` to get the same track and position
4. When user pauses and resumes, it calls server again to get current live position

**Evidence from code**:
```javascript
// In persistent-audio.js
async function getServerLivePosition() {
    const resp = await fetch(`${PA_API_BASE}/api/radio/live`);
    const data = await resp.json();
    return {
        trackIndex: data.trackIndex,
        trackPosition: data.trackPosition + (latencyMs / 1000)
    };
}
```

### Issue #3: Render Deployment Configuration ⚠️ NEEDS ATTENTION
**Problem**: The backend uses hardcoded Windows paths that won't work on Render.

**Current config in server.js**:
```javascript
const CONFIG = {
    R2_BASE_URL: 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev',
    FRONTEND_ROOT: 'c:\\right\\ANHAD\\frontend',  // ❌ Windows path
    MAIN_UI: 'c:\\right\\ANHAD\\frontend',        // ❌ Windows path
    SEHAJ_PROGRESS_DIR: path.join(__dirname, '..', 'frontend', 'SehajPaath', 'data'),
    // ...
};
```

## 🛠️ SOLUTIONS

### Solution #1: Implement Mutual Exclusion for Audio Playback

We need to make both audio systems aware of each other and pause one when the other starts playing.

**Implementation Strategy**:
1. Create a global audio coordinator
2. Both systems register with the coordinator
3. When one plays, coordinator pauses the other

### Solution #2: Fix Render Deployment Paths

Replace hardcoded Windows paths with relative paths that work on Linux (Render).

### Solution #3: Add Environment Variable Configuration

Use environment variables for deployment-specific settings.

## 📋 DETAILED FIX PLAN

### Fix 1: Audio Mutual Exclusion System
- Create `audio-coordinator.js` that manages both players
- Modify both `global-mini-player.js` and `persistent-audio.js` to register with coordinator
- Implement pause-on-play logic

### Fix 2: Backend Path Configuration
- Remove Windows-specific paths
- Use `path.join(__dirname, ...)` for relative paths
- Add environment variable support

### Fix 3: Render Deployment Checklist
- Update `package.json` with correct start script
- Create `.env.example` for Render configuration
- Verify CORS settings for production domain
- Test audio proxy endpoint

## 🎯 PRIORITY ORDER

1. **HIGH**: Fix simultaneous playback (User Experience Issue)
2. **HIGH**: Fix backend paths for Render deployment
3. **MEDIUM**: Add better error handling for audio failures
4. **LOW**: Optimize audio preloading

## 📊 VERIFICATION CHECKLIST

After fixes:
- [ ] Only one audio source plays at a time
- [ ] Switching between Darbar and Amritvela pauses the other
- [ ] Amritvela stays synced across all devices
- [ ] Backend deploys successfully on Render
- [ ] Audio proxy works on Render
- [ ] CORS allows frontend (Vercel) to access backend (Render)

## 🔍 CODE LOCATIONS

### Files to Modify:
1. `frontend/lib/global-mini-player.js` - Add coordinator integration
2. `frontend/lib/persistent-audio.js` - Add coordinator integration
3. `backend/server.js` - Fix paths and add env vars
4. `backend/.env.example` - Document required env vars

### New Files to Create:
1. `frontend/lib/audio-coordinator.js` - Central audio management
