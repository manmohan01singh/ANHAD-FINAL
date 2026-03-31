# 🧪 Quick Test Guide - Verify Sync Fix

## ⚡ Quick Start (2 Minutes)

### Step 1: Start the Server
```bash
cd backend
npm start
```

Wait for:
```
═══════════════════════════════════════════════════════════════
  🙏 GURBANI RADIO SERVER — 24/7 LIVE BROADCAST
═══════════════════════════════════════════════════════════════
  📻 Now Playing:   Day 28 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ at 54:05
```

### Step 2: Open Test Page in Multiple Browsers

**Browser 1 (Chrome)**:
```
http://localhost:3000/test-sync-verification.html
```

**Browser 2 (Firefox or Chrome Incognito)**:
```
http://localhost:3000/test-sync-verification.html
```

### Step 3: Verify Synchronization

Both browsers should show:
- ✅ **Same Track Number**: e.g., "Day 28"
- ✅ **Same Position**: e.g., "54:05" (within 1-2 seconds)
- ✅ **Server Status**: Connected (green dot)
- ✅ **Drift**: < 5 seconds

### Step 4: Test Playback

1. Click **"▶️ Play Radio"** in both browsers
2. Listen - both should play the SAME audio
3. Wait 30 seconds
4. Click **"🔄 Check Sync"** - drift should still be < 5 seconds

## 🎯 What to Look For

### ✅ SUCCESS Indicators

1. **Same Track**: Both browsers show identical track number
2. **Same Position**: Positions match within 1-2 seconds
3. **Low Drift**: Drift indicator shows < 5 seconds
4. **Auto-Correction**: After 30s, drift stays low (auto-corrected)
5. **Sync Logs**: Show successful server connections

### ❌ FAILURE Indicators (Should NOT Happen)

1. Different track numbers (e.g., Day 26 vs Day 28)
2. Positions differ by > 10 seconds
3. Drift keeps increasing without correction
4. "Offline" status when server is running
5. Error messages about sync failures

## 🔍 Advanced Testing

### Test Drift Correction

1. Open browser console (F12)
2. Manually seek audio:
   ```javascript
   window.AnhadAudio.getAudio().currentTime += 30; // Jump ahead 30s
   ```
3. Wait 30 seconds
4. Check drift - should auto-correct back to server position

### Test Server Reconnection

1. Stop the backend server (Ctrl+C)
2. Try to play - should show error: "Cannot connect to radio server"
3. Restart server
4. Click "🔴 Jump to Live" - should reconnect and sync

### Test Multiple Devices

1. Open on your phone: `http://YOUR_IP:3000/test-sync-verification.html`
2. Open on your computer
3. Both should show same track/position

## 📊 Console Logs to Monitor

### Good Logs (Expected)
```
[Sync] Server: Track 28 at 3245s
✅ Server: Track 28 at 54:05
🔊 Playing: Amritvela Kirtan
[Drift] Correction started
```

### Bad Logs (Should NOT See)
```
❌ Server error: Failed to fetch
[Sync] Using stale cache (60s old)
Cannot sync with server
```

## 🐛 Troubleshooting

### Problem: "Server Status: Offline"
**Solution**: 
- Check backend is running on port 3000
- Verify `http://localhost:3000/api/radio/live` returns JSON

### Problem: Different tracks in different browsers
**Solution**:
- Clear browser cache and localStorage
- Hard refresh (Ctrl+Shift+R)
- Click "Jump to Live" in both browsers

### Problem: Drift keeps increasing
**Solution**:
- Check console for drift correction logs
- Verify server is responding to `/api/radio/live`
- Try manual "Jump to Live"

## 📱 Test on Production

Once local testing passes:

1. Deploy to production server
2. Test with: `https://your-domain.com/test-sync-verification.html`
3. Open on multiple devices/browsers
4. Verify same track/position across all

## ✅ Success Criteria

The fix is working if:
- [ ] Multiple browsers show same track number
- [ ] Positions match within 2 seconds
- [ ] Drift stays under 5 seconds
- [ ] Auto-correction works every 30 seconds
- [ ] Error messages appear when server is down
- [ ] "Jump to Live" resyncs correctly

## 🎉 Expected Result

**All devices will play the SAME audio at the SAME time.**

No more Day 26 vs Day 28 issues!

---

**Need Help?** Check the logs in the test page and browser console.
