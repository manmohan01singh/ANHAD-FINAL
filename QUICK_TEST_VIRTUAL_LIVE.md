# 🔴 Quick Test: Virtual Live Fix

## 30-Second Test

1. Open: `frontend/test-virtual-live-complete.html`
2. Click: **"Start Amritvela"**
3. Wait: **10 seconds**
4. Click: **"Pause"**
5. Wait: **30 seconds**
6. Click: **"Resume"**
7. **✅ PASS**: Audio jumps forward ~30 seconds
8. **❌ FAIL**: Audio resumes from pause point

## What to Look For

### Console Logs (MUST SEE)
```
[GMP] 🔴 RECREATING AUDIO FOR LIVE PLAYBACK
[GMP] 🔴 LIVE: Track 5 at 1234s
[GMP] ✅ Seeked to 1234s
```

### Audio Behavior (MUST HAPPEN)
- Audio should jump forward
- You should hear different content
- Time should increase by pause duration

### Status Display (SHOULD SHOW)
- "Expected Jump: +30s"
- "✅ SUCCESS! Jumped 30s forward"

## Quick Tests by Page

### Homepage (Mini Player)
```
1. Start Amritvela from hero card
2. Pause for 20 seconds
3. Resume
4. Should jump +20s
```

### Gurbani Radio Page
```
1. Open GurbaniRadio/gurbani-radio.html
2. Play Amritvela
3. Pause for 1 minute
4. Resume
5. Should jump +60s
```

### Dashboard (Mini Player Persistence)
```
1. Start playing on homepage
2. Navigate to Dashboard
3. Wait 30 seconds
4. Mini player should auto-resume +30s ahead
```

## Pass/Fail Criteria

### ✅ PASS
- Audio jumps forward by pause duration
- Console shows "🔴 JUMPING TO LIVE"
- Different audio content plays
- Status shows "SUCCESS"

### ❌ FAIL
- Audio resumes from pause point
- No console logs about jumping
- Same audio content continues
- Status shows "WARNING"

## Common Issues

### Issue: Audio doesn't jump
**Fix**: Check console for errors, verify server is running

### Issue: Only jumps sometimes
**Fix**: Clear browser cache, test in incognito mode

### Issue: Jumps wrong amount
**Fix**: Check server time sync, verify network latency

## Quick Commands

### Start Local Server
```bash
START_LOCAL_SERVER.bat
```

### Open Test Page
```
http://localhost:3000/test-virtual-live-complete.html
```

### Clear Cache
```javascript
localStorage.removeItem('anhad_global_audio');
location.reload();
```

## Expected Results

### Scenario 1: 30-Second Pause
- Pause at: 4:20
- Wait: 30 seconds
- Resume at: 4:20:30 ✅

### Scenario 2: 2-Minute Pause
- Pause at: 4:20
- Wait: 2 minutes
- Resume at: 4:22 ✅

### Scenario 3: Page Navigation
- Start at: 4:20
- Navigate away
- Wait: 1 minute
- Come back
- Resume at: 4:21 ✅

## One-Line Test

**Pause for X seconds → Resume → Should jump forward X seconds**

If this works, the fix is successful! 🎉
