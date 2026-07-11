# Audio Autoplay Fixes - Testing Guide

## 🎯 Quick Test Summary

**Objective:** Verify that audio plays immediately on first user interaction across all audio features

**Test Environment:** 
- Local: http://localhost:3000
- Deployed: https://anhad-final.onrender.com

---

## ✅ Pre-Flight Checklist

Before starting tests:
- [ ] Backend server is running (`npm start` in backend folder)
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Open DevTools Console (F12) to monitor logs
- [ ] Test in Incognito/Private mode (fresh autoplay state)

---

## 🧪 Test Cases

### Test 1: Hukamnama Audio
**Feature:** Daily Hukamnama audio player

**Steps:**
1. Navigate to Home page
2. Scroll to "Today's Hukamnama" card
3. Tap the Hukamnama card to open it
4. Look for the audio player at the bottom
5. Tap the **play button** (▶️) once

**Expected Result:**
- ✅ Audio starts playing immediately
- ✅ Waveform animation visible
- ✅ Progress bar moves
- ✅ No need to tap multiple times
- ✅ Console shows: `[HukamPlayer] ✅ Success with URL:`

**Failure Signs:**
- ❌ Audio doesn't play
- ❌ Console shows: `NotAllowedError` or `autoplay blocked`
- ❌ Need to tap play button multiple times

---

### Test 2: Darbar Sahib Live
**Feature:** Live stream from Sri Harmandir Sahib

**Steps:**
1. Navigate to "Gurbani Radio" page (bottom nav)
2. Ensure "Darbar Sahib Live" tab is selected (left button)
3. Tap the **play button** (▶️) in center

**Expected Result:**
- ✅ Live stream starts immediately
- ✅ "LIVE" indicator turns red
- ✅ Progress bar shows "∞"
- ✅ Console shows: `[AnhadAudio] 🔴 LIVE:`

**Failure Signs:**
- ❌ Play button stays in loading state
- ❌ No audio output
- ❌ Console error about autoplay

---

### Test 3: Gurbani Radio - Amritvela
**Feature:** Virtual live Amritvela Kirtan stream

**Steps:**
1. Open "Gurbani Radio" page
2. Tap **"Amritvela Kirtan"** tab (middle button)
3. Tap the **play button** (▶️)

**Expected Result:**
- ✅ Stream starts immediately (no need to play Darbar first!)
- ✅ Artwork shows time-of-day image
- ✅ Track title displays "Day X - Amritvela Kirtan"
- ✅ Progress bar animates
- ✅ Console shows: `[AnhadAudio] Virtual live sync:`

**Failure Signs:**
- ❌ Need to play Darbar Sahib first as workaround
- ❌ Audio doesn't start
- ❌ Stuck in loading state

---

### Test 4: Gurbani Radio - Waheguru Simran
**Feature:** Waheguru Simran continuous stream

**Steps:**
1. Open "Gurbani Radio" page
2. Tap **"Waheguru Simran"** tab (right button)
3. Tap the **play button** (▶️)

**Expected Result:**
- ✅ Simran audio starts immediately
- ✅ Track title shows simran title (e.g., "Deenanath Suno")
- ✅ Playback is smooth
- ✅ Console shows track info

**Failure Signs:**
- ❌ No audio
- ❌ Need workaround to start playback

---

### Test 5: Mini Player
**Feature:** Global mini player on all pages

**Steps:**
1. Start playing any stream from Test 2 or 3
2. Navigate to **Home page** (bottom nav)
3. Observe mini player at bottom of screen
4. Tap **pause button** on mini player
5. Tap **play button** on mini player again

**Expected Result:**
- ✅ Audio resumes immediately
- ✅ No reload or restart
- ✅ Mini player shows correct stream info
- ✅ Artwork displays correctly

**Failure Signs:**
- ❌ Audio doesn't resume
- ❌ Mini player stuck
- ❌ Need to restart from Gurbani Radio page

---

### Test 6: First Interaction Unlock
**Feature:** Audio context unlock on first page load

**Steps:**
1. Open fresh Incognito window
2. Navigate to http://localhost:3000
3. **Without clicking anything**, open Console (F12)
4. Now **click anywhere** on the page
5. Check console logs

**Expected Result:**
- ✅ Console shows: `[AnhadAudio] ✅ Audio context unlocked`
- ✅ Subsequent audio plays work fine
- ✅ No autoplay block warnings

**Failure Signs:**
- ❌ No unlock message
- ❌ Audio still blocked later

---

## 📊 Browser-Specific Tests

### Chrome/Edge (Strictest Policy)
Test all 6 cases above in Chrome/Edge

**Expected:**
- All tests pass
- No `NotAllowedError` in console
- Audio plays on first tap every time

### Firefox
Test cases 1, 2, and 3

**Expected:**
- Same behavior as Chrome
- Audio works immediately

### Safari (if available)
Test cases 1 and 2

**Expected:**
- Audio plays on first tap
- No additional permissions needed

---

## 🐛 Debugging Guide

If audio doesn't play, check console for these messages:

### ✅ Good Signs
```
[AnhadAudio] ✅ Audio context unlocked
[HukamPlayer] ✅ Success with URL: ...
[AnhadAudio] 🔴 LIVE: https://live.sgpc.net...
[AnhadAudio] Virtual live sync: amritvela track 5 seekTo=234s
```

### ❌ Bad Signs (Autoplay Still Blocked)
```
NotAllowedError: play() failed because user didn't interact
DOMException: The play() request was interrupted
[AnhadAudio] ❌ Autoplay blocked
```

**If you see bad signs:**
1. Verify you're clicking directly (not using keyboard)
2. Check if audio element was created WITHIN the click handler
3. Ensure no `await` or `setTimeout` between click and play()

---

## 🔄 Regression Tests

After confirming fixes work, test these to ensure nothing broke:

### R1: Audio Switching
1. Start Darbar Sahib
2. Switch to Amritvela
3. Switch to Simran
4. Switch back to Darbar

**Expected:** Clean switches, no stuttering

### R2: Page Navigation During Playback
1. Start any stream
2. Navigate: Home → Nitnem → Profile → Back to Gurbani Radio

**Expected:** Audio continues, mini player stays visible

### R3: Volume Control
1. Start any stream
2. Adjust volume slider

**Expected:** Volume changes immediately

### R4: Pause/Resume
1. Start any stream
2. Pause
3. Wait 10 seconds
4. Resume

**Expected:** Resumes from same position

---

## 📝 Test Results Template

Copy this and fill it out:

```
Date: ___________
Tester: ___________
Browser: ___________
Environment: [ ] Local [ ] Deployed

Test 1 - Hukamnama Audio:        [ ] PASS [ ] FAIL
Test 2 - Darbar Sahib Live:      [ ] PASS [ ] FAIL
Test 3 - Gurbani Radio Amritvela: [ ] PASS [ ] FAIL
Test 4 - Gurbani Radio Simran:    [ ] PASS [ ] FAIL
Test 5 - Mini Player:            [ ] PASS [ ] FAIL
Test 6 - First Interaction:      [ ] PASS [ ] FAIL

R1 - Audio Switching:            [ ] PASS [ ] FAIL
R2 - Page Navigation:            [ ] PASS [ ] FAIL
R3 - Volume Control:             [ ] PASS [ ] FAIL
R4 - Pause/Resume:               [ ] PASS [ ] FAIL

Notes:
_________________________________
_________________________________
_________________________________
```

---

## 🚀 Deployment Verification

After deploying to production (https://anhad-final.onrender.com):

1. **Wait 2-3 minutes** for deployment to complete
2. **Clear browser cache completely**
3. Run all 6 main tests again
4. Test on mobile device (if available)
5. Verify console logs are clean

**Success Criteria:**
- ✅ All 6 tests pass on deployed URL
- ✅ No autoplay warnings in console
- ✅ Audio works on FIRST tap every time
- ✅ No "play another stream first" workaround needed

---

## 📱 Mobile Testing (Optional)

If testing on mobile:

**Android Chrome:**
1. Open https://anhad-final.onrender.com
2. Run Tests 1-5
3. Check that audio works on first tap

**iOS Safari:**
1. Open same URL
2. Run Tests 1-2
3. Verify audio plays immediately

---

## ✅ Sign-Off

When all tests pass:

```
✅ Audio Autoplay Fixes Verified

Tested by: ___________
Date: ___________
Environment: ___________
All tests: PASSED

Ready for Production: YES
```

---

## 🆘 Need Help?

If tests fail:
1. Check AUTOPLAY_FIXES.md for technical details
2. Review console logs for specific error messages
3. Verify files were modified correctly
4. Consider rollback if issues persist

**Contact:** Share console logs and test results for debugging
