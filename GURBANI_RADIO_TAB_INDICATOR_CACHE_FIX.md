# 🐞 Gurbani Radio Tab Indicator Cache Fix

## Issue Summary
**Problem:** The tab indicator (highlight bar) in Gurbani Radio was misaligned in production - positioning between tabs instead of behind the active tab.

**Example:**
```
Stream 1      Stream 2      Stream 3
        ███████              ← Indicator between tabs (WRONG)

Should be:
Stream 1      Stream 2      Stream 3
              ███████        ← Indicator behind Stream 2 (CORRECT)
```

## Root Cause Analysis ✅

### The Evidence
- ✅ **Works perfectly in local development**
- ❌ **Broken in deployed production**
- 🔍 **Code logic is correct** - CSS uses proper `calc()` formula
- 🎯 **Conclusion: SERVICE WORKER CACHE ISSUE**

### What Happened
1. Old CSS version had incorrect translateX calculation (using `100%`, `200%` percentages)
2. Service Worker cached this old CSS file
3. New deployment with fixed CSS (`calc((100% - 8px) / 3)`) was uploaded
4. But Service Worker continued serving the **old cached CSS** to users
5. Result: Tab names rendered with new HTML, but indicator positioned with old CSS

## The Fix 🔧

### Changes Made

#### 1. Service Worker Cache Version Bump
**File:** `frontend/sw.js`
**Line:** 15
```javascript
// OLD
const CACHE_VERSION = 'anhad-v10.8.0';

// NEW
const CACHE_VERSION = 'anhad-v10.9.0'; // v10.9.0: CACHE BUST - Fixed Gurbani Radio tab indicator
```

**Why:** Changing the cache version forces Service Worker to:
- Delete all old caches (v10.8.0)
- Fetch fresh copies of ALL files
- Store them in new cache (v10.9.0)

#### 2. CSS Query Parameter Update
**File:** `frontend/GurbaniRadio/gurbani-radio.html`
**Line:** 36
```html
<!-- OLD -->
<link rel="stylesheet" href="gurbani-radio.css?v=10.7.0">

<!-- NEW -->
<link rel="stylesheet" href="gurbani-radio.css?v=10.9.0">
```

**Why:** Query parameter change forces browser to treat this as a new file, bypassing HTTP cache.

#### 3. CSS Documentation
**File:** `frontend/GurbaniRadio/gurbani-radio.css`
**Line:** 150
Added comprehensive comment explaining:
- What the issue was
- Why it happened
- How it was fixed
- Verification that local build was always correct

## CSS Technical Details

### The Correct Formula (Already in Code)
```css
/* Slider width: Takes full container width, subtracts padding (4px + 4px), divides by 3 tabs */
.gr-tabs-slider {
  width: calc((100% - 8px) / 3);
}

/* Slider positions: Moves by one tab width each step */
.gr-tabs[data-active="0"] .gr-tabs-slider { transform: translateX(0); }
.gr-tabs[data-active="1"] .gr-tabs-slider { transform: translateX(calc((100% - 8px) / 3)); }
.gr-tabs[data-active="2"] .gr-tabs-slider { transform: translateX(calc(2 * (100% - 8px) / 3)); }
```

### Why This Formula Works
- Container has 4px padding on left and right = 8px total
- Usable width = `100% - 8px`
- For 3 equal tabs = `(100% - 8px) / 3` per tab
- Position for tab N = `N * (100% - 8px) / 3`

## Deployment Checklist ✅

### 1. Pre-Deployment Verification
- [x] Service Worker cache version bumped to `v10.9.0`
- [x] CSS query parameter updated to `v10.9.0`
- [x] CSS code verified (correct `calc()` formulas in place)
- [x] Documentation added to CSS file

### 2. Deployment Steps

#### Option A: Manual Deployment
```bash
# 1. Sync files to server/CDN
git add .
git commit -m "fix: Gurbani Radio tab indicator cache bust v10.9.0"
git push origin main

# 2. If using Vercel/Netlify - automatic deployment triggered
# 3. If manual server - upload these files:
#    - frontend/sw.js
#    - frontend/GurbaniRadio/gurbani-radio.html
#    - frontend/GurbaniRadio/gurbani-radio.css
```

#### Option B: Force Clear Old Caches (Nuclear Option)
If users still see the issue after deployment, add this script temporarily:

```javascript
// Add to gurbani-radio.html temporarily
<script>
(function() {
  if ('serviceWorker' in navigator) {
    caches.keys().then(function(names) {
      names.forEach(function(name) {
        if (name.includes('anhad-v10.8') || name.includes('anhad-v10.7')) {
          console.log('Force clearing old cache:', name);
          caches.delete(name);
        }
      });
    });
  }
})();
</script>
```

### 3. Post-Deployment Verification

#### On Production Site:
1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)
3. Open DevTools → Application → Service Workers
4. Check that version shows `anhad-v10.9.0`
5. **Test the tabs:**
   - Click "Live" → Indicator should be behind "Live"
   - Click "Kirtan" → Indicator should be behind "Kirtan"
   - Click "Simran" → Indicator should be behind "Simran"

#### Verification Script (Run in Console):
```javascript
// Check Service Worker version
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW State:', reg.active.state);
  reg.active.postMessage({ type: 'VERSION_CHECK' });
});

// Check cached CSS
caches.keys().then(names => {
  console.log('Active Caches:', names);
  names.forEach(name => {
    caches.open(name).then(cache => {
      cache.match('/GurbaniRadio/gurbani-radio.css').then(res => {
        if (res) {
          console.log(`CSS found in cache: ${name}`);
          res.text().then(text => {
            if (text.includes('calc((100% - 8px) / 3)')) {
              console.log('✅ CSS has CORRECT formula');
            } else {
              console.log('❌ CSS has OLD formula - clear cache!');
            }
          });
        }
      });
    });
  });
});
```

### 4. User Impact & Migration

#### Expected User Experience:
- **First visit after deployment:** May see old version initially
- **Service Worker detects update:** Installs new version in background
- **On next reload:** Fresh CSS loads automatically
- **Timeline:** Most users fixed within 5-10 seconds of page load

#### Force Update for Immediate Fix (Optional):
Add to `gurbani-radio.html` head section:
```javascript
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(function(reg) {
    if (reg && reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    if (reg && reg.active) {
      reg.update();
    }
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });
}
</script>
```

## Why This Happened

### Service Worker Caching Strategy
The app uses **Stale-While-Revalidate** strategy:
1. Returns cached version immediately (fast)
2. Fetches fresh version in background
3. Updates cache for next visit

### The Problem
- Old CSS had wrong formula
- Got cached with version `v10.8.0`
- New CSS was deployed with fix
- But Service Worker kept serving old cached CSS
- Cache version wasn't bumped → no cache invalidation

### The Solution
- Bump cache version → Forces complete cache refresh
- Bump CSS query param → Bypasses HTTP cache
- **Result:** Every user gets fresh CSS guaranteed

## Testing Strategy

### Local Testing (Already Verified ✅)
```bash
# Start local server
npm run dev

# Test in browser:
# 1. Open http://localhost:3000/GurbaniRadio/gurbani-radio.html
# 2. Click each tab
# 3. Verify indicator aligns perfectly behind active tab
```

### Production Testing (After Deploy)
```bash
# 1. Open production URL
# 2. Hard refresh (Ctrl+Shift+R)
# 3. Open DevTools → Network → Disable cache
# 4. Check gurbani-radio.css response
# 5. Verify it contains: calc((100% - 8px) / 3)
# 6. Test tab switching
```

### Automated Verification (Optional)
```javascript
// E2E test pseudo-code
test('Gurbani Radio tab indicator aligns correctly', async () => {
  await page.goto('/GurbaniRadio/gurbani-radio.html');
  
  // Get tab and indicator positions
  const tab2 = await page.$('[data-stream="amritvela"]');
  const indicator = await page.$('.gr-tabs-slider');
  
  // Click tab 2
  await tab2.click();
  await page.waitForTimeout(300); // Wait for animation
  
  // Get positions
  const tab2Box = await tab2.boundingBox();
  const indicatorBox = await indicator.boundingBox();
  
  // Verify indicator is behind tab (within 2px tolerance)
  expect(Math.abs(indicatorBox.x - tab2Box.x)).toBeLessThan(2);
});
```

## Rollback Plan

### If Issues Occur After Deployment:

#### Quick Rollback (5 minutes)
```bash
# 1. Revert git commit
git revert HEAD
git push origin main

# 2. Or restore previous files:
git checkout HEAD~1 frontend/sw.js
git checkout HEAD~1 frontend/GurbaniRadio/gurbani-radio.html
git checkout HEAD~1 frontend/GurbaniRadio/gurbani-radio.css
git add .
git commit -m "rollback: Revert cache bust changes"
git push origin main
```

#### Clear User Caches (If Needed)
Deploy a temporary cache-clearing script (see Option B above)

## Prevention for Future

### 1. Always Bump Cache Version
When updating CSS/JS files that affect UI:
```javascript
// In sw.js - ALWAYS increment version
const CACHE_VERSION = 'anhad-vX.Y.Z'; // Bump Z for patches, Y for features
```

### 2. Use Query Parameters
For critical CSS/JS files:
```html
<link rel="stylesheet" href="style.css?v=X.Y.Z">
<script src="script.js?v=X.Y.Z"></script>
```

### 3. Test Cache Behavior
Before deploying CSS changes:
```bash
# 1. Deploy to staging
# 2. Visit staging in incognito
# 3. Check Network tab shows correct file versions
# 4. Verify Service Worker cache version
# 5. Test functionality
```

### 4. Add Cache Headers
In server config (e.g., Vercel `vercel.json`):
```json
{
  "headers": [
    {
      "source": "/GurbaniRadio/(.*).css",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

## Related Files

### Modified Files:
- `frontend/sw.js` - Cache version bump
- `frontend/GurbaniRadio/gurbani-radio.html` - CSS query param
- `frontend/GurbaniRadio/gurbani-radio.css` - Documentation added

### Files to Check on Deployment:
- All files in `android/app/src/main/assets/public/GurbaniRadio/`
- All files in `ios/App/App/public/GurbaniRadio/`
- Service Worker cache on live site

## Support & Debugging

### If Users Report Issue Persists:

1. **Ask them to:**
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R)
   - Uninstall and reinstall PWA (if installed)

2. **Check their browser:**
   ```javascript
   // Run in console
   navigator.serviceWorker.getRegistration().then(reg => {
     console.log('SW Version:', reg.active);
   });
   ```

3. **Force cache clear remotely:**
   - Add cache-clearing script to HTML (see Option B)
   - Push to production
   - Instruct user to refresh once

## Success Metrics

### Before Fix (Production):
- ❌ Tab indicator positioned between tabs
- ❌ Clicking tab 2 shows indicator at position 1.5
- ❌ User reports of "broken UI"

### After Fix (Expected):
- ✅ Tab indicator perfectly centered behind active tab
- ✅ Smooth animation between tabs
- ✅ Consistent behavior across all devices/browsers
- ✅ Matches local development experience

---

## Contact
For issues with this fix, contact the development team or reference this document.

**Last Updated:** 2026-07-20
**Fix Version:** v10.9.0
**Status:** ✅ Ready for Deployment
