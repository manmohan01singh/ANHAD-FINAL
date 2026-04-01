# 🚀 Quick Test Guide - Progress Sync

## ⚡ 3-Minute Test

### Step 1: Test Nitnem (30 seconds)
1. Open `frontend/NitnemTracker/nitnem-tracker.html`
2. Check any bani as complete
3. See console: `✅ Tracked 1 bani completion`

### Step 2: Test Sehaj Paath (30 seconds)
1. Open `frontend/SehajPaath/reader.html`
2. Navigate to next page (swipe or click arrow)
3. See console: `✅ Tracked 1 page read`

### Step 3: Test Kirtan (30 seconds)
1. Open `frontend/GurbaniRadio/gurbani-radio.html`
2. Click play button
3. See console: `🎧 Started tracking listening time`
4. Wait 1 minute
5. See console: `📊 Syncing 1 minute(s)`

### Step 4: Check Dashboard (30 seconds)
1. Open `frontend/Dashboard/dashboard.html`
2. Look at the 7-day graph
3. Today's bars should show:
   - Green bar (Nitnem count)
   - Blue bar (Pages read)
   - Yellow bar (Minutes listened)

### Step 5: Use Test Page (1 minute)
1. Open `frontend/test-progress-sync.html`
2. Click "Complete 1 Bani"
3. Click "Read 1 Page"
4. Click "Add 30 Minutes"
5. Click "View Stats"
6. See all numbers update in real-time

## ✅ Success Indicators

### Console Logs:
```
✅ Unified Progress Tracker loaded
✅ Kirtan Listening Tracker loaded
📊 Dashboard Analytics loaded
📈 Current streak: X days
```

### Dashboard Shows:
- ✅ Bars in the graph for today
- ✅ Numbers match your activity
- ✅ Insight message at bottom

### LocalStorage Keys:
```javascript
// Check in DevTools > Application > Local Storage
anhad_user_stats          // User statistics
anhad_daily_analytics     // Dashboard data
```

## 🔍 Quick Debug

### If nothing tracks:
```javascript
// In browser console:
window.UnifiedProgressTracker.trackNitnemCompletion(1);
window.UnifiedProgressTracker.trackPagesRead(5);
window.UnifiedProgressTracker.trackListeningTime(10);
window.UnifiedProgressTracker.syncNow();
```

### If dashboard doesn't update:
```javascript
// In browser console:
window.DashboardAnalytics.syncWithUserStats();
window.DashboardAnalytics.syncWithNitnemTracker();
window.DashboardAnalytics.renderChart();
```

### View current stats:
```javascript
// In browser console:
window.AnhadStats.getSummary();
```

## 🎯 Expected Results

After completing the tests above, you should see:

**Dashboard Graph (Today's column):**
- Green bar: 1-2 (Nitnem)
- Blue bar: 1-6 (Pages)
- Yellow bar: 1-31 (Minutes)

**Console Output:**
```
[UnifiedTracker] 📿 Nitnem completion: 1
[UnifiedTracker] ✅ Synced 1 Nitnem to AnhadStats
[SehajPaath] ✅ Tracked 1 page read
[KirtanTracker] 🎧 Started tracking listening time
[Analytics] ✅ Dashboard refresh triggered
```

## 🚨 Common Issues

### Issue: "UnifiedProgressTracker is not defined"
**Fix**: Hard refresh the page (Ctrl+Shift+R)

### Issue: Dashboard shows 0 for everything
**Fix**: 
1. Complete an activity (Nitnem/Sehaj/Kirtan)
2. Wait 5 seconds
3. Refresh dashboard

### Issue: Listening time not tracking
**Fix**:
1. Make sure audio is actually playing
2. Check console for "Started tracking"
3. Wait at least 1 minute for first sync

## 📱 Mobile Testing

### iOS:
1. Open in Safari
2. Complete activities
3. Check dashboard
4. Should work identically to desktop

### Android:
1. Open in Chrome
2. Complete activities
3. Check dashboard
4. Should work identically to desktop

## ⏱️ Timing

- **Nitnem**: Syncs immediately
- **Sehaj Paath**: Syncs within 5 seconds
- **Kirtan**: Syncs every 60 seconds
- **Dashboard**: Updates on next page load or force sync

---

**Total Test Time**: ~3 minutes
**Success Rate**: Should be 100% if all files are loaded correctly
