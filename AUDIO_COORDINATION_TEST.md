# 🧪 Audio Coordination Test Guide

## 🎯 Problem Fixed

When Darbar Sahib was playing and you clicked play on Amritvela, both audios played simultaneously.

## ✅ Solution

Updated `persistent-audio.js` to properly notify AudioCoordinator before playing, ensuring only ONE audio plays at a time.

---

## 🧪 How to Test

### Quick Test (1 minute)

1. **Open test page**:
   ```
   http://localhost:3000/test-audio-coordination.html
   ```

2. **Test Darbar → Amritvela**:
   - Click "▶️ Play Darbar"
   - Wait 2 seconds
   - Click "▶️ Play Amritvela"
   - **Expected**: Darbar stops, Amritvela starts
   - **Check**: Only Amritvela card shows "Playing"

3. **Test Amritvela → Darbar**:
   - Click "▶️ Play Amritvela"
   - Wait 2 seconds
   - Click "▶️ Play Darbar"
   - **Expected**: Amritvela stops, Darbar starts
   - **Check**: Only Darbar card shows "Playing"

4. **Check logs**:
   - Look for: `✅ PASS: Only one audio playing`
   - Should NOT see: `❌ FAIL: Multiple audios playing`

---

## 🔍 What to Look For

### ✅ Success Indicators

1. **Visual**: Only ONE card shows "Playing" status (green)
2. **Audio**: Only ONE audio stream is audible
3. **Logs**: Show coordination messages like:
   ```
   [AudioCoordinator] Paused GlobalMiniPlayer to allow AnhadAudio to play
   ✅ PASS: Only one audio playing (AnhadAudio)
   ```
4. **Alert**: Green success message appears

### ❌ Failure Indicators (Should NOT Happen)

1. Both cards show "Playing" status
2. Both audios are audible simultaneously
3. Logs show: `❌ FAIL: Multiple audios playing`
4. Red warning message appears

---

## 🔧 Debugging

### Check AudioCoordinator Status
```javascript
// In browser console
window.AudioCoordinator.getRegisteredPlayers()
// Expected: ['AnhadAudio', 'GlobalMiniPlayer']

window.AudioCoordinator.getCurrentlyPlaying()
// Expected: 'AnhadAudio' or 'GlobalMiniPlayer' or null
```

### Force Pause All
```javascript
window.AudioCoordinator.pauseAll()
// Should pause both systems
```

### Check Individual Players
```javascript
// Check AnhadAudio
window.AnhadAudio.isPlaying()

// Check GlobalMiniPlayer
window.GMP.isPlaying()
```

---

## 📊 Test Results

### Test 1: Darbar → Amritvela
- [ ] Darbar starts playing
- [ ] Click Amritvela
- [ ] Darbar stops automatically
- [ ] Amritvela starts
- [ ] Only one audio audible

### Test 2: Amritvela → Darbar
- [ ] Amritvela starts playing
- [ ] Click Darbar
- [ ] Amritvela stops automatically
- [ ] Darbar starts
- [ ] Only one audio audible

### Test 3: Pause All
- [ ] Start any audio
- [ ] Click "Pause All"
- [ ] All audio stops
- [ ] Both cards show "Paused"

---

## 🎯 Expected Behavior

### Before Fix ❌
```
1. Play Darbar → Darbar playing
2. Play Amritvela → BOTH playing! ❌
3. Audio chaos!
```

### After Fix ✅
```
1. Play Darbar → Darbar playing
2. Play Amritvela → Darbar stops, Amritvela starts ✅
3. Only one audio at a time!
```

---

## 🚀 Real-World Test

After testing the test page, verify on the actual homepage:

1. Go to `http://localhost:3000/`
2. Click "Play" on Darbar Sahib card
3. Verify Darbar is playing
4. Click "Play" on Amritvela card
5. **Expected**: Darbar stops, Amritvela starts
6. **No simultaneous playback!**

---

## 📝 Technical Details

### What Changed

**File**: `frontend/lib/persistent-audio.js`

**Changes**:
1. `play()` function now calls `AudioCoordinator.requestPlay()` BEFORE playing
2. `switchStream()` properly pauses and coordinates
3. Explicit coordination on all playback operations

### How It Works

```
User clicks "Play Amritvela"
    ↓
AnhadAudio.play('amritvela')
    ↓
AudioCoordinator.requestPlay('AnhadAudio')
    ↓
AudioCoordinator pauses ALL other players
    ↓
GlobalMiniPlayer.pause() called
    ↓
Darbar Sahib stops
    ↓
Amritvela starts
    ↓
✅ Only ONE audio playing!
```

---

## ✅ Success Criteria

The fix is working if:
- [ ] Only one audio plays at a time
- [ ] Switching automatically pauses the other
- [ ] Test page shows green success messages
- [ ] No simultaneous playback audible
- [ ] Logs show coordination events

---

**Status**: ✅ Fixed  
**Test Page**: `frontend/test-audio-coordination.html`  
**Documentation**: `AUDIO_COORDINATION_FIX.md`  
**Date**: 2026-03-31
