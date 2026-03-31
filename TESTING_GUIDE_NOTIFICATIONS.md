# 🧪 NOTIFICATION SYSTEM - TESTING GUIDE

## Quick Test Checklist

### ✅ Test 1: Amrit Vela Notification (2-minute test)
**Purpose:** Verify Amrit Vela alarm fires correctly

**Steps:**
1. Open `frontend/reminders/smart-reminders.html`
2. Find "Amritvela" reminder
3. Set time to **2 minutes from now** (e.g., if it's 3:45 PM, set to 3:47 PM)
4. Ensure toggle is ON (enabled)
5. Wait 2 minutes
6. Keep browser tab open (can be in background)

**Expected Result:**
- At 3:47 PM, you should hear alarm sound (looping)
- Browser notification appears: "🌅 Amritvela - ਅੰਮ੍ਰਿਤ ਵੇਲਾ"
- Device vibrates (if supported)
- Console shows: `🔥 [GuaranteedAlarms] FIRING ALARM: Amritvela`

---

### ✅ Test 2: Rehraas Sahib Notification
**Purpose:** Verify evening prayer reminder

**Steps:**
1. Open `frontend/reminders/smart-reminders.html`
2. Find "Rehras Sahib" reminder
3. Set time to **1 minute from now**
4. Ensure toggle is ON
5. Wait 1 minute

**Expected Result:**
- Alarm fires with sound
- Notification: "🌆 Rehras Sahib - ਰਹਿਰਾਸ ਸਾਹਿਬ"
- Logged to Nitnem Tracker

---

### ✅ Test 3: Sohila Sahib Notification
**Purpose:** Verify bedtime prayer reminder

**Steps:**
1. Open `frontend/reminders/smart-reminders.html`
2. Find "Sohila Sahib" reminder
3. Set time to **1 minute from now**
4. Ensure toggle is ON
5. Wait 1 minute

**Expected Result:**
- Alarm fires with peaceful night sound
- Notification: "🌙 Sohila Sahib - ਸੋਹਿਲਾ ਸਾਹਿਬ"
- Logged to Nitnem Tracker

---

### ✅ Test 4: Naam Abhyas Notification
**Purpose:** Verify hourly Naam Abhyas reminders fire

**Steps:**
1. Open `frontend/NaamAbhyas/naam-abhyas.html`
2. Click "Schedule" or "Settings"
3. Enable a session for **current hour + 2 minutes**
   - Example: If it's 3:45 PM, enable session at 3:47 PM
4. Save settings
5. Wait 2 minutes

**Expected Result:**
- Alarm fires at 3:47 PM
- Notification: "🙏 Naam Abhyas - ਨਾਮ ਅਭਿਆਸ"
- Sound plays
- Console shows: `🔥 [GuaranteedAlarms] FIRING ALARM: Naam Abhyas`

---

### ✅ Test 5: Theme Following (Naam Abhyas)
**Purpose:** Verify Naam Abhyas follows global theme

**Steps:**
1. Open `frontend/index.html`
2. Check current theme (look at background - dark or light)
3. Navigate to Naam Abhyas
4. **Expected:** Naam Abhyas has SAME theme as index.html
5. Go back to index.html
6. Toggle theme (click logo/theme button)
7. Navigate to Naam Abhyas again
8. **Expected:** Naam Abhyas now has NEW theme

**Expected Result:**
- Dark mode on index → Dark mode on Naam Abhyas
- Light mode on index → Light mode on Naam Abhyas
- No white flash or theme mismatch

---

### ✅ Test 6: Audio Preview
**Purpose:** Verify alarm sound preview works

**Steps:**
1. Open `frontend/reminders/smart-reminders.html`
2. Click on any reminder
3. Click "Change Sound" or sound selector
4. Tap any audio option (e.g., "Waheguru Bell")
5. **Expected:** Audio plays for ~8 seconds
6. If error occurs, check console for helpful message

**Expected Result:**
- Audio plays successfully
- OR helpful error: "Audio file not found" (not generic "unavailable")

---

### ✅ Test 7: Multi-Tab Reliability
**Purpose:** Verify alarms fire even with multiple tabs

**Steps:**
1. Open `frontend/index.html` in Tab 1
2. Open `frontend/index.html` in Tab 2
3. Open `frontend/index.html` in Tab 3
4. In Tab 1, set Amrit Vela for 1 minute from now
5. Wait 1 minute
6. **Expected:** Alarm fires in at least ONE tab (guaranteed)

**Expected Result:**
- Alarm fires reliably
- No duplicate alarms (fired today tracking prevents this)
- Console shows which tab is firing

---

### ✅ Test 8: Page Reload Persistence
**Purpose:** Verify alarms survive page reload

**Steps:**
1. Set Amrit Vela for 3 minutes from now
2. Wait 1 minute
3. Reload the page (F5 or Cmd+R)
4. Wait 2 more minutes
5. **Expected:** Alarm still fires at scheduled time

**Expected Result:**
- Alarm fires even after reload
- GuaranteedAlarmSystem re-schedules on load

---

### ✅ Test 9: Background Tab Firing
**Purpose:** Verify alarms fire when tab is in background

**Steps:**
1. Set alarm for 2 minutes from now
2. Switch to different tab (Gmail, YouTube, etc.)
3. Wait 2 minutes
4. **Expected:** Hear alarm sound from background tab

**Expected Result:**
- Alarm fires in background
- Browser notification appears
- Sound plays (may be quieter in background)

---

### ✅ Test 10: Missed Alarm Detection
**Purpose:** Verify system catches missed alarms

**Steps:**
1. Set alarm for 2 minutes from now
2. Close browser completely
3. Wait 3 minutes (alarm time passes)
4. Open browser and navigate to app
5. **Expected:** System detects missed alarm and fires it

**Expected Result:**
- Within 10 seconds of opening, alarm fires
- Console shows: "⚠️ Missed alarm detected"

---

## 🔍 Debugging Tips

### Check Console Logs
Open browser console (F12) and look for:
```
🔥 [GuaranteedAlarms] Initializing...
🔥 [GuaranteedAlarms] System active - checking every 10 seconds
[GuaranteedAlarms] Loaded X active reminders
🔥 [GuaranteedAlarms] FIRING ALARM: [Name]
```

### Check localStorage
In console, run:
```javascript
// Check if alarm was fired today
localStorage.getItem('alarm_fired_amritvela_2024-03-31')

// Check reminders
localStorage.getItem('sr_reminders_v4')

// Check Naam Abhyas sessions
localStorage.getItem('naamAbhyas_sessions')
```

### Force Fire Alarm (Manual Test)
In console, run:
```javascript
GuaranteedAlarmSystem.fireAlarm({
  id: 'test',
  title: 'Test Alarm',
  tone: 'audio1',
  type: 'amritvela'
})
```

### Check Audio Files
In console, run:
```javascript
const audio = new Audio('Audio/audio1.mp3');
audio.play().then(() => console.log('✅ Audio works')).catch(e => console.error('❌ Audio error:', e));
```

---

## 🚨 Common Issues & Solutions

### Issue: "Audio preview unavailable"
**Solution:** 
- Check if `frontend/Audio/` folder exists
- Verify audio files are present (audio1.mp3, audio2.mp3, etc.)
- Check browser console for actual error

### Issue: Alarm doesn't fire
**Solution:**
- Check console for GuaranteedAlarms logs
- Verify reminder is enabled (toggle ON)
- Check if already fired today: `localStorage.getItem('alarm_fired_[id]_[date]')`
- Clear fired today flag: `localStorage.removeItem('alarm_fired_amritvela_2024-03-31')`

### Issue: Naam Abhyas wrong theme
**Solution:**
- Hard refresh Naam Abhyas page (Ctrl+Shift+R)
- Check if `data-global-theme="force"` is in HTML
- Verify global-theme.js is loaded

### Issue: No browser notification
**Solution:**
- Check notification permission: `Notification.permission`
- Grant permission: Click bell icon or run `Notification.requestPermission()`
- Check if notification blocked in browser settings

---

## ✅ Success Criteria

All tests pass if:
- ✅ Amrit Vela fires at 4:00 AM
- ✅ Rehraas fires at 6:00 PM  
- ✅ Sohila fires at 9:30 PM
- ✅ Naam Abhyas fires at scheduled times
- ✅ Audio preview works
- ✅ Theme follows correctly
- ✅ Multi-tab doesn't break system
- ✅ Page reload doesn't lose alarms
- ✅ Background tabs still fire alarms
- ✅ Missed alarms are caught

**If all pass → System is BULLETPROOF** 🎯
