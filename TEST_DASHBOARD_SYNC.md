# 🧪 Test Dashboard Sync - Quick Guide

## ⚡ Quick Fix (If you have wrong numbers now)

### Option 1: Run Fix Script
1. Open Dashboard (`frontend/Dashboard/dashboard.html`)
2. Open browser console (F12)
3. The fix script runs automatically!
4. Refresh page to see corrected numbers

### Option 2: Manual Fix in Console
```javascript
// Run this in browser console on dashboard:
window.fixDashboardSync();
```

### Option 3: Fresh Start
```javascript
// Clear all data and start fresh:
localStorage.clear();
location.reload();
```

## ✅ Verify Fix Worked

After running fix, check dashboard:

### Today's Goals Should Show:
- **Read Gurbani**: 6/5 Ang (not 12/5) ✅
- **Listen to Kirtan**: X/30 min (actual minutes, not 0) ✅
- **Complete Nitnem**: 1/1 (if all 9 banis done) ✅

### Graph Should Show:
- **Blue bar (Read)**: 6 (not 12) ✅
- **Yellow bar (Listen)**: Actual minutes ✅
- **Green bar (Nitnem)**: 9 (individual banis) ✅

## 🧪 Test New Activity

### Test 1: Read 1 More Page
1. Go to Sehaj Paath
2. Navigate to next page
3. Go back to Dashboard
4. **Expected**: Read Gurbani shows 7/5 (not 14/5)

### Test 2: Listen to Kirtan
1. Go to Gurbani Radio
2. Click play
3. Wait 1-2 minutes
4. Go back to Dashboard
5. **Expected**: Listen to Kirtan shows 1-2/30 min

### Test 3: Complete Another Bani
1. Go to Nitnem Tracker
2. Uncheck one bani, then check it again
3. Go back to Dashboard
4. **Expected**: Graph shows +1 bani

## 🔍 Debug Commands

### Check Current Stats:
```javascript
// In browser console:
window.AnhadStats.getSummary()
```

### Check Goals:
```javascript
JSON.parse(localStorage.getItem('anhad_daily_goals'))
```

### Check Analytics:
```javascript
JSON.parse(localStorage.getItem('anhad_daily_analytics'))
```

### Force Sync:
```javascript
window.UnifiedProgressTracker.syncNow();
window.DashboardAnalytics.renderChart();
```

## 📊 Expected Console Logs

When everything works correctly:

```
✅ Unified Progress Tracker loaded
✅ Kirtan Listening Tracker loaded
📊 Dashboard Analytics loaded
🔧 Starting Dashboard Sync Fix...
📊 Clearing duplicate data...
✅ Duplicate data cleared
📿 Syncing Nitnem goals...
✅ Full Nitnem complete - goal set to 1/1
🎧 Checking Kirtan tracking...
✅ Kirtan goal synced: 0/30 min
🔄 Refreshing dashboard...
✅ Dashboard refreshed
✅ ALL FIXES COMPLETE!
```

## ❌ Common Issues

### Issue: Still showing 12/5
**Fix**: Hard refresh (Ctrl+Shift+R) or run `window.fixDashboardSync()`

### Issue: Kirtan still 0/30
**Fix**: Play audio for at least 1 minute, then check dashboard

### Issue: Nitnem still 0/1
**Fix**: Make sure ALL selected banis are complete (9/9)

### Issue: Numbers not updating
**Fix**: 
```javascript
window.dispatchEvent(new CustomEvent('dashboardRefresh'));
```

## 🎯 Success Criteria

✅ Read Gurbani: Shows actual pages (not doubled)
✅ Listen to Kirtan: Shows actual minutes (not 0)
✅ Complete Nitnem: Shows 1/1 when all banis done
✅ Graph: Shows correct individual counts
✅ No console errors

## 📱 Mobile Testing

Same steps work on mobile:
1. Open Dashboard
2. Open browser DevTools (if available)
3. Or just use the app - fix runs automatically!

---

**Total Test Time**: 2 minutes
**Success Rate**: Should be 100% after fix script runs
