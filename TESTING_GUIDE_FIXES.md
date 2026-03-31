# Testing Guide for Critical Fixes

## Pre-Testing Setup
1. **Clear Browser Cache**: Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
   - Select "Cached images and files"
   - Select "All time"
   - Click "Clear data"

2. **Hard Refresh**: After clearing cache, press Ctrl+F5 (or Cmd+Shift+R on Mac)

3. **Test on Multiple Browsers**:
   - Chrome/Edge (Desktop & Mobile)
   - Safari (iOS)
   - Firefox

## Test Cases

### 1. Search Functionality (Gurbani Khoj)
**Location**: Gurbani Khoj page

**Test Steps**:
1. Open Gurbani Khoj/Search page
2. Try searching with valid Gurmukhi text
3. Try searching with network disconnected
4. Try searching with slow network (throttle in DevTools)

**Expected Results**:
- ✅ Valid search shows results
- ✅ Network error shows: "Failed to load Gurbani. Please check your connection and try again."
- ✅ Timeout shows: "Request timeout. Please check your connection."
- ✅ Toast notification appears with error message
- ✅ No console errors

**How to Test Network Issues**:
- Chrome DevTools → Network tab → Throttling → Offline
- Or disable WiFi/mobile data

---

### 2. Nanakshahi Date Display (Hukamnama)
**Location**: Hukamnama page

**Test Steps**:
1. Open Hukamnama page
2. Check the date cards section
3. Navigate to yesterday/tomorrow
4. Check if Nanakshahi date updates

**Expected Results**:
- ✅ Nanakshahi date is visible (format: "੧੫ ਚੇਤ ੫੫੬")
- ✅ Date updates when navigating
- ✅ Gurmukhi numerals display correctly
- ✅ No "—" or "Loading..." text remains

**Debug**:
- Open Console (F12)
- Type: `document.getElementById('nanakshahiDate').textContent`
- Should show Gurmukhi date, not empty or "—"

---

### 3. Add Bani Button (Nitnem Tracker)
**Location**: Nitnem Tracker page

**Test Steps**:
1. Open Nitnem Tracker
2. Click "Add Bani" button at bottom
3. Modal should open with bani categories
4. Expand a category (e.g., "Nitnem")
5. Select one or more banis (checkbox should appear)
6. Click "Add Selected (X)" button
7. Check if banis appear in the list

**Expected Results**:
- ✅ Modal opens smoothly
- ✅ Categories expand/collapse on click
- ✅ Checkboxes appear when selecting banis
- ✅ "Add Selected" button shows count
- ✅ Banis are added to the list
- ✅ Toast notification confirms addition
- ✅ Modal closes after adding

**If Not Working**:
1. Clear cache completely
2. Check Console for errors
3. Verify localStorage is enabled
4. Try in incognito/private mode

---

### 4. Animation Performance (Nitnem Tracker)
**Location**: Nitnem Tracker page

**Test Steps**:
1. Open Nitnem Tracker
2. Click various buttons rapidly:
   - Period tabs (Amritvela, Rehras, Sohila)
   - Add Bani button
   - Complete checkboxes
   - Settings button
3. Observe animation smoothness

**Expected Results**:
- ✅ No lag or stuttering
- ✅ Smooth transitions (< 200ms)
- ✅ No janky animations
- ✅ Instant feedback on tap

**Performance Check**:
- Chrome DevTools → Performance tab
- Record while clicking buttons
- Check for long tasks (> 50ms)
- FPS should stay above 50

---

### 5. Theme Synchronization
**Location**: All pages

**Test Steps**:
1. Open Homepage
2. Toggle theme to Light mode
3. Navigate to Gurbani Radio
4. Check if it's in Light mode
5. Navigate to Hukamnama
6. Check if it's in Light mode
7. Toggle back to Dark mode
8. Navigate between pages

**Expected Results**:
- ✅ Theme persists across all pages
- ✅ No flash of wrong theme on page load
- ✅ Theme toggle updates immediately
- ✅ localStorage has `anhad_theme` key

**Debug**:
- Console: `localStorage.getItem('anhad_theme')`
- Should return "light" or "dark"
- All pages should respect this value

---

### 6. Screen Orientation Lock
**Location**: All pages (mobile only)

**Test Steps**:
1. Open app on mobile device
2. Try rotating device to landscape
3. Check if orientation is locked to portrait
4. Test on different pages

**Expected Results**:
- ✅ Portrait orientation is locked on mobile
- ✅ Landscape is allowed on tablets/desktop (> 1024px width)
- ✅ No console errors about orientation
- ✅ Content doesn't rotate unexpectedly

**Platforms to Test**:
- iOS Safari (iPhone)
- Chrome Android
- Samsung Internet

---

### 7. Heart/Favorite Icon (Hukamnama)
**Location**: Hukamnama page

**Test Steps**:
1. Open Hukamnama page
2. Scroll to bottom controls
3. Click the heart/save icon
4. Check if it fills/unfills
5. Refresh page
6. Check if favorite is saved

**Expected Results**:
- ✅ Icon responds to click
- ✅ Visual feedback (fill/unfill)
- ✅ Toast notification appears
- ✅ Favorite persists after refresh
- ✅ Haptic feedback on mobile

---

### 8. Share Button (Hukamnama)
**Location**: Hukamnama page

**Test Steps**:
1. Open Hukamnama page
2. Click share button
3. Action sheet should appear
4. Select "Share as Text"
5. Check if share dialog opens

**Expected Results**:
- ✅ Share button responds to click
- ✅ Action sheet opens
- ✅ Share options are visible
- ✅ Native share dialog opens (mobile)
- ✅ Fallback to copy on desktop

---

### 9. Screen Overflow
**Location**: All pages

**Test Steps**:
1. Open each main page
2. Check for horizontal scrollbar
3. Resize browser window to various sizes
4. Test on different devices:
   - iPhone SE (375px)
   - iPhone 12 (390px)
   - iPad (768px)
   - Desktop (1920px)

**Expected Results**:
- ✅ No horizontal scrolling
- ✅ All content fits within viewport
- ✅ Buttons and icons are properly sized
- ✅ Text doesn't overflow containers
- ✅ Images scale properly

**DevTools Testing**:
- Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M)
- Test responsive breakpoints:
  - 375px (Mobile S)
  - 425px (Mobile L)
  - 768px (Tablet)
  - 1024px (Laptop)

---

## Performance Benchmarks

### Target Metrics:
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### How to Measure:
1. Chrome DevTools → Lighthouse
2. Run audit in Mobile mode
3. Check Performance score (should be > 90)

---

## Common Issues & Solutions

### Issue: "Add Bani button not working"
**Solution**:
1. Clear browser cache completely
2. Hard refresh (Ctrl+F5)
3. Check if JavaScript is enabled
4. Try incognito mode
5. Check Console for errors

### Issue: "Nanakshahi date shows '—'"
**Solution**:
1. Hard refresh page
2. Check if JavaScript loaded
3. Verify date calculation in Console:
   ```javascript
   const date = new Date();
   // Should show date object
   ```

### Issue: "Theme not syncing"
**Solution**:
1. Clear localStorage:
   ```javascript
   localStorage.clear();
   ```
2. Refresh page
3. Set theme again

### Issue: "Animations still laggy"
**Solution**:
1. Check if performance CSS loaded
2. Verify in DevTools → Sources:
   - `nitnem-performance-fix.css` should be present
3. Check for conflicting CSS
4. Test on different device

---

## Regression Testing

After fixes, verify these still work:
- [ ] PWA installation
- [ ] Service worker caching
- [ ] Offline functionality
- [ ] Audio playback
- [ ] Mini player
- [ ] Notifications
- [ ] Data persistence
- [ ] Streak tracking
- [ ] Analytics

---

## Browser Compatibility

### Minimum Supported Versions:
- Chrome/Edge: 90+
- Safari: 14+
- Firefox: 88+
- Samsung Internet: 14+

### Features with Fallbacks:
- Screen Orientation API → CSS fallback
- Web Share API → Copy to clipboard
- Haptic feedback → Silent fail
- Service Worker → Regular caching

---

## Reporting Issues

If you find issues during testing:

1. **Note the following**:
   - Browser and version
   - Device and OS
   - Steps to reproduce
   - Expected vs actual behavior
   - Console errors (F12)
   - Network tab errors

2. **Take screenshots**:
   - The issue
   - Console errors
   - Network tab

3. **Check localStorage**:
   ```javascript
   console.log(localStorage);
   ```

4. **Export state** (if applicable):
   - Nitnem Tracker → Settings → Export Data

---

## Success Criteria

All fixes are successful when:
- ✅ All 9 test cases pass
- ✅ No console errors
- ✅ Performance score > 90
- ✅ Works on iOS and Android
- ✅ No horizontal scrolling
- ✅ Smooth animations (60fps)
- ✅ Theme syncs across pages
- ✅ All icons respond to clicks
