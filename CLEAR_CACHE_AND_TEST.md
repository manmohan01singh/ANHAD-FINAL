# Clear Cache and Test Guru Image Fixes

## The changes HAVE been applied to the code, but your browser is showing cached files.

## How to Clear Cache and See Changes:

### Option 1: Hard Refresh (Fastest)
1. Open the app in your browser
2. Press **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)
3. This forces browser to reload all CSS files

### Option 2: Clear Browser Cache
1. Open Chrome DevTools (F12)
2. Right-click on the refresh button
3. Select "Empty Cache and Hard Reload"

### Option 3: Incognito/Private Window
1. Open browser in Incognito/Private mode
2. Load the app fresh
3. This bypasses all cache

### Option 4: Add Cache Buster (Best for Development)
Add `?v=2` to the end of your URL:
- Instead of: `http://localhost:3000/`
- Use: `http://localhost:3000/?v=2`

## What Was Fixed in the Code:

### Light Mode:
- ✅ Image centered: `padding: 0` on hero banner
- ✅ Image path: `guruimages/guru-greeting-hero.webp`
- ✅ Size: 120% width

### Dark Mode:
- ✅ Gap removed: `padding: 0` and `margin-top: -10px`
- ✅ Gap reduced: Changed from `gap: 12px` to `gap: 6px`
- ✅ All 4 CSS sections updated

## Files Modified:
1. `frontend/index.html` (3 inline CSS sections updated)
2. `frontend/css/responsive-fix.css` (1 section updated)

## If Still Not Working After Cache Clear:

Check if you're viewing the correct file:
- Make sure you're viewing `frontend/index.html`
- NOT `ios/App/App/public/index.html` (this is a copy)

The iOS folder might have cached copies. If you're testing in a Capacitor app, you need to:
1. Run: `npx cap sync`
2. Rebuild the app

## Verify Files Were Changed:

Open these files and search for:
- "margin-top: -10px" - should be found in 4 places
- "padding: 0 !important" - should be in dark carousel sections
- "gap: 6px !important" - should replace old "gap: 12px"
