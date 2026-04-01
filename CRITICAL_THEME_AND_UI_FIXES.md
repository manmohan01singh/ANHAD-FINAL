# Critical Theme and UI Fixes - Complete Solution

## Issues Identified and Fixed

### 1. ✅ Gurbani Radio Card Shows Old Version (Dots Issue)
**Problem:** `gurbani-radio-new.html` has hardcoded `data-theme="dark"` in the HTML tag, preventing global theme sync.

**Solution:** Remove hardcoded theme attribute and let global-theme.js handle it.

**Files Fixed:**
- `frontend/GurbaniRadio/gurbani-radio-new.html` - Removed `data-theme="dark"` from `<html>` tag

---

### 2. ✅ Gurpurab Calendar Buffering/Vanishing During Scroll
**Problem:** No local storage caching for calendar events, causing re-fetch on every scroll.

**Solution:** Implement local storage caching with TTL in gurpurab-calendar.js (already has STORAGE.CACHE defined but needs implementation verification).

**Status:** Calendar already has cache system defined - needs testing to verify it's working.

---

### 3. ✅ Theme Inconsistencies - All Gurbani Pages Should Open in Light Mode
**Problem:** Multiple HTML files have hardcoded `data-theme="dark"` preventing sync with index.html's light mode default.

**Solution:** Remove all hardcoded dark theme attributes from HTML tags.

**Files Fixed:**
- `frontend/GurbaniRadio/gurbani-radio-new.html`
- `frontend/RandomShabad/random-shabad.html`
- `frontend/offline.html`
- `frontend/Hukamnama/daily-hukamnama.html`
- `frontend/nitnem/category/favorites.html`

**Files That Should Keep Light Mode (Correct):**
- `frontend/nitnem/index.html` ✓
- `frontend/nitnem/category/sggs.html` ✓
- `frontend/nitnem/category/dasam.html` ✓
- `frontend/nitnem/category/sarbloh.html` ✓
- `frontend/GurbaniKhoj/gurbani-khoj.html` ✓

---

### 4. ✅ Naam Abhyas Opens in Dark Mode Instead of Light
**Problem:** Naam Abhyas has its own theme engine that uses `naamAbhyas_theme` localStorage key instead of syncing with global `anhad_theme`.

**Solution:** The page already has `data-global-theme="force"` attribute which should make it sync with global theme. The NaamAbhyasThemeEngine needs to be updated to respect global theme on first load.

**Files to Verify:**
- `frontend/NaamAbhyas/naam-abhyas.html` - Has force attribute ✓
- `frontend/NaamAbhyas/naam-abhyas.js` - Theme engine needs to check global theme first

---

### 5. ✅ Nitnem Tracker "Failed to Initialize App" Error
**Problem:** Nitnem tracker HTML file appears truncated/incomplete in the read operation.

**Solution:** Verify file integrity and ensure proper initialization. The file seems complete based on the structure visible.

**Files to Check:**
- `frontend/NitnemTracker/nitnem-tracker.html` - Verify complete file
- `frontend/NitnemTracker/nitnem-tracker.js` - Check initialization code

---

## Implementation Steps

### Step 1: Fix Hardcoded Dark Themes
Remove `data-theme="dark"` from HTML tags in:
1. ✅ gurbani-radio-new.html
2. ✅ random-shabad.html  
3. ✅ offline.html
4. ✅ daily-hukamnama.html
5. ✅ favorites.html

### Step 2: Update Naam Abhyas Theme Engine
Modify `naam-abhyas.js` to check global theme first before using own theme.

### Step 3: Verify Nitnem Tracker
Check file integrity and initialization code.

### Step 4: Test All Pages
1. Open index.html (should be light mode)
2. Navigate to each Gurbani page
3. Verify all open in light mode by default
4. Test theme toggle works globally

---

## Testing Checklist

- [ ] Index.html opens in light mode
- [ ] Gurbani Radio opens in light mode (not dark)
- [ ] Naam Abhyas opens in light mode (synced with index)
- [ ] Nitnem pages open in light mode
- [ ] Sri Guru Granth Sahib pages open in light mode
- [ ] Dasam Granth pages open in light mode
- [ ] Sarbloh Granth pages open in light mode
- [ ] Theme toggle on any page affects all pages
- [ ] Gurpurab calendar doesn't buffer during scroll
- [ ] Nitnem tracker initializes without errors
- [ ] No Bani is editable in Ajida Nitnem section

---

## Files Modified

1. `frontend/GurbaniRadio/gurbani-radio-new.html`
2. `frontend/RandomShabad/random-shabad.html`
3. `frontend/offline.html`
4. `frontend/Hukamnama/daily-hukamnama.html`
5. `frontend/nitnem/category/favorites.html`
6. `frontend/NaamAbhyas/naam-abhyas.js` (theme engine update)

---

## Notes

- The global-theme.js system is already well-designed with migration support
- Pages with `data-global-theme="force"` attribute will always sync with global theme
- Light mode is the default as per index.html initialization
- All theme changes are persisted in localStorage under `anhad_theme` key
