# Simultaneous Playback Fix - Verification Guide

## ✅ What Was Fixed

### Files Updated (11 HTML pages):
1. ✅ `frontend/index.html` - Main homepage
2. ✅ `frontend/Hukamnama/daily-hukamnama.html`
3. ✅ `frontend/nitnem/reader.html`
4. ✅ `frontend/RandomShabad/random-shabad.html`
5. ✅ `frontend/Dashboard/dashboard.html`
6. ✅ `frontend/GurbaniKhoj/gurbani-khoj.html`
7. ✅ `frontend/Notes/notes.html`
8. ✅ `frontend/Profile/profile.html`
9. ✅ `frontend/Favorites/favorites.html`
10. ✅ `frontend/Insights/insights.html`
11. ✅ `frontend/Calendar/Gurupurab-Calendar.html`
12. ✅ `frontend/NitnemTracker/nitnem-tracker.html`
13. ✅ `frontend/NaamAbhyas/naam-abhyas.html`

### What Changed:
Added `<script src="../lib/audio-coordinator.js"></script>` BEFORE the audio player scripts on every page.

## 🧪 How to Test

### Test 1: Homepage Test
1. Open `frontend/index.html` in browser
2. Open browser console (F12)
3. Look for these messages:
   ```
   [AudioCoordinator] Initialized
   🎵 AnhadAudio registered with AudioCoordinator
   [GMP] Registered with AudioCoordinator
   ```
4. If you see all three messages ✅ Coordinator is working!

### Test 2: Play Darbar Sahib Live
1. On homepage, find "Darbar Sahib Live" card
2. Click play button
3. Audio should start playing
4. Console should show:
   ```
   [AudioCoordinator] Now playing: GlobalMiniPlayer
   ```

### Test 3: Switch to Amritvela (THE CRITICAL TEST)
1. While Darbar is playing, find "Amritvela Kirtan" card
2. Click play button
3. **Expected behavior**:
   - Darbar should STOP automatically
   - Amritvela should START playing
   - Console should show:
     ```
     [AudioCoordinator] Paused GlobalMiniPlayer to allow AnhadAudio to play
     [AudioCoordinator] Now playing: AnhadAudio
     ```

### Test 4: Switch Back to Darbar
1. While Amritvela is playing, click Darbar play button
2. **Expected behavior**:
   - Amritvela should STOP automatically
   - Darbar should START playing
   - Console should show:
     ```
     [AudioCoordinator] Paused AnhadAudio to allow GlobalMiniPlayer to play
     [AudioCoordinator] Now playing: GlobalMiniPlayer
     ```

### Test 5: Use Test Page
1. Open `frontend/test-audio-coordinator.html`
2. Click "Play Darbar Sahib Live"
3. Click "Play Amritvela Kirtan"
4. Watch the status section - only one should show "Playing" at a time
5. Check event log for coordinator messages

## 🔍 Debugging

### If both audios still play together:

#### Check 1: Coordinator Loaded?
Open console and type:
```javascript
window.AudioCoordinator
```
Should return an object. If `undefined`, coordinator didn't load.

#### Check 2: Players Registered?
```javascript
window.AudioCoordinator.getRegisteredPlayers()
```
Should return: `["AnhadAudio", "GlobalMiniPlayer"]`

#### Check 3: Clear Cache
1. Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
2. Clear cached files
3. Hard reload: Ctrl+Shift+R (or Cmd+Shift+R)

#### Check 4: Script Load Order
View page source and verify:
```html
<!-- Coordinator MUST come first -->
<script src="lib/audio-coordinator.js"></script>
<!-- Then audio systems -->
<script src="lib/persistent-audio.js"></script>
<script src="lib/global-mini-player.js"></script>
```

### If coordinator not registering players:

The audio systems have a 500ms retry mechanism. Wait 1 second after page load, then check:
```javascript
window.AudioCoordinator.getRegisteredPlayers()
```

## 📊 Expected Console Output

### On Page Load:
```
[AudioCoordinator] Initialized
🪯 ANHAD Persistent Audio System V2 loaded
📻 Available streams: darbar, amritvela
🎵 AnhadAudio registered with AudioCoordinator
[GMP] Global Mini-Player loaded
[GMP] Registered with AudioCoordinator
```

### When Playing Darbar:
```
[AudioCoordinator] Now playing: GlobalMiniPlayer
[GMP] ▶ Resumed: Darbar Sahib Ji Live
```

### When Switching to Amritvela:
```
[AudioCoordinator] Paused GlobalMiniPlayer to allow AnhadAudio to play
[AudioCoordinator] Now playing: AnhadAudio
🔊 Playing: Amritvela Kirtan
```

## ✅ Success Criteria

The fix is working correctly when:

1. ✅ Console shows coordinator initialized
2. ✅ Console shows both players registered
3. ✅ Playing Darbar works
4. ✅ Playing Amritvela automatically pauses Darbar
5. ✅ Playing Darbar automatically pauses Amritvela
6. ✅ Only ONE audio plays at any time
7. ✅ No errors in console

## 🚀 Next Steps After Verification

Once you confirm it works locally:

1. Commit changes:
   ```bash
   git add .
   git commit -m "Fix simultaneous playback with AudioCoordinator"
   git push
   ```

2. Deploy to Vercel (auto-deploys on push)

3. Test on live site

4. Verify on mobile devices

## 📞 Still Not Working?

If after all these steps both audios still play together, run this diagnostic:

```javascript
// In browser console
console.log('Coordinator:', window.AudioCoordinator);
console.log('Registered:', window.AudioCoordinator?.getRegisteredPlayers());
console.log('Currently Playing:', window.AudioCoordinator?.getCurrentlyPlaying());
console.log('AnhadAudio:', window.AnhadAudio);
console.log('GlobalMiniPlayer:', window.GlobalMiniPlayer);
```

Share the output and I'll help debug further!
