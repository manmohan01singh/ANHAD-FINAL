# Quick Test Guide - Audio Persistence

## 🚀 How to Test

### 1. Start the App
```bash
# If using a local server
cd frontend
python -m http.server 8000
# or
npx serve
```

Open: `http://localhost:8000/index.html`

### 2. Start Playing Audio
1. On the home page, click on "Darbar Sahib Live" or "Amritvela Kirtan"
2. Wait for audio to start playing
3. You should see the mini player at the bottom

### 3. Navigate Between Pages
Click through these pages in order:
- Home → Favorites
- Favorites → Dashboard  
- Dashboard → Nitnem Tracker
- Nitnem Tracker → Home

### 4. What to Observe

#### ✅ Expected Behavior (SUCCESS):
- Audio continues playing throughout navigation
- Mini player stays visible at the bottom
- Very brief gap (50-200ms, barely noticeable)
- Audio resumes from the same position
- Feels smooth like a native app

#### ❌ Old Behavior (if fix didn't work):
- Audio stops completely
- Mini player disappears
- Long silence (2-4 seconds)
- Audio restarts from beginning

### 5. Check Browser Console

Open DevTools (F12) and look for these logs:

```
[AudioPreload] ⚡ Preloading: darbar
[GMP] ⚡ Using preloaded audio element
[GMP] ▶ Resumed: Darbar Sahib Live
```

If you see these logs, the system is working correctly!

## 🐛 Troubleshooting

### Audio Still Stops Completely

**Check 1: Scripts Loading**
```javascript
// In browser console, check:
window.__anhadPreloadedAudio  // Should exist during page load
window.GlobalMiniPlayer        // Should exist after page loads
```

**Check 2: LocalStorage**
```javascript
// In browser console:
localStorage.getItem('anhad_global_audio')
// Should show: {"isPlaying":true,"stream":"darbar",...}
```

**Check 3: Network**
- Open DevTools → Network tab
- Filter by "media"
- You should see the stream URL loading

### Audio Gap Still Too Long

This is normal! The gap will ALWAYS exist (50-200ms) because:
- Browser must reload the entire page
- New audio element must be created
- Stream must reconnect

To achieve zero-gap, you'd need to convert to a Single Page Application (SPA).

### Mini Player Not Showing

**Check:**
```javascript
// In browser console:
document.getElementById('gmp')  // Should exist
document.querySelector('.gmp--visible')  // Should exist when playing
```

If mini player exists but not visible:
```javascript
// Force show it:
window.GlobalMiniPlayer.show()
```

## 📊 Performance Metrics

### Measure the Gap
```javascript
// Add this to browser console before navigating:
let startTime = Date.now();
window.addEventListener('pageshow', () => {
  console.log('Page load time:', Date.now() - startTime, 'ms');
});
```

**Good:** 50-200ms gap
**Acceptable:** 200-500ms gap  
**Bad:** >500ms gap (something's wrong)

## 🎯 Success Criteria

Your implementation is working if:
- ✅ Audio continues across page navigation
- ✅ Gap is less than 500ms
- ✅ Mini player stays visible
- ✅ Console shows preload logs
- ✅ Feels smooth and app-like

## 📱 Test on Mobile

### iOS Safari
1. Add to Home Screen
2. Open as PWA
3. Test navigation
4. Should work even better (PWA mode)

### Android Chrome
1. Install as PWA
2. Test navigation
3. Check if audio continues in background

## 🎉 Expected Results

After this fix, your app should feel like:
- ✅ Spotify (continuous audio)
- ✅ YouTube Music (persistent player)
- ✅ Native mobile app (smooth transitions)

NOT like:
- ❌ Traditional website (audio stops)
- ❌ Broken web app (long gaps)

## 💡 Tips

1. **Use headphones** - Easier to hear the gap
2. **Test on slow connection** - Gap will be more noticeable
3. **Try both streams** - Darbar (live) and Amritvela (playlist)
4. **Check on mobile** - Real-world usage scenario

## 📞 Need Help?

If audio still stops completely:
1. Check browser console for errors
2. Verify all files were updated (see AUDIO_PERSISTENCE_IMPLEMENTATION.md)
3. Clear browser cache and try again
4. Test in incognito mode (rules out extension issues)

---

**Happy Testing!** 🎵✨
