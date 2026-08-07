# Gurbani Khoj Script Duplicate Execution Fix

## Issue Summary
When navigating to Gurbani Khoj page from the homepage, JavaScript errors occurred:
```
Uncaught SyntaxError: Identifier 'GurbaniCache' has already been declared
Uncaught SyntaxError: Identifier 'API' has already been declared
```

This caused the Gurbani Khoj page to load with broken UI, and the bottom navigation bar from the homepage would remain visible (when it should be hidden).

## Root Cause
The `executePageScripts()` function in `smooth-navigation.js` was removing and re-adding external scripts on every navigation event, causing them to execute multiple times. This led to duplicate variable declarations.

The problematic code pattern was:
```javascript
const existingScript = document.querySelector(`script[src="${absoluteSrc}"]`);
if (existingScript) {
  existingScript.remove();  // Removed
}
// Then re-added, causing re-execution
document.body.appendChild(newScript);
```

## Solution Implemented

### 1. Added Script Execution Tracking
Created a new Map to track which external scripts have been executed for each page:
```javascript
const EXECUTED_EXTERNAL_SCRIPTS = new Map(); // Map<pageKey, Set<scriptSrc>>
```

### 2. Modified Script Execution Logic
Updated `executePageScripts()` to:
- Check if a script has already been executed for the current page
- Skip re-execution if the script is already loaded
- Only load new scripts that haven't been executed yet

```javascript
// Initialize tracking for this page's external scripts
if (!EXECUTED_EXTERNAL_SCRIPTS.has(pageKey)) {
  EXECUTED_EXTERNAL_SCRIPTS.set(pageKey, new Set());
}
const executedScriptsForPage = EXECUTED_EXTERNAL_SCRIPTS.get(pageKey);

// Check if already executed
if (executedScriptsForPage.has(absoluteSrc)) {
  console.log(`[SmoothNav] ⏭️ Skipping already-executed script`);
  continue;
}

// Check if script exists in DOM
const existingScript = document.querySelector(`script[src="${absoluteSrc}"]`);
if (existingScript) {
  executedScriptsForPage.add(absoluteSrc);
  console.log(`[SmoothNav] ✓ Script already in DOM, marking as executed`);
  continue;
}

// Mark as executed and load
executedScriptsForPage.add(absoluteSrc);
```

## Files Modified

### Frontend
- ✅ `frontend/lib/smooth-navigation.js`
  - Added `EXECUTED_EXTERNAL_SCRIPTS` Map
  - Modified `executePageScripts()` function

### iOS Build
- ✅ `ios/App/App/public/lib/smooth-navigation.js`
  - Applied same fixes

### Android Build
- ✅ `android/app/src/main/assets/public/lib/smooth-navigation.js`
  - Copied from frontend (automated sync)

## Expected Behavior After Fix

### Navigation to Gurbani Khoj
1. ✅ No JavaScript errors in console
2. ✅ `GurbaniCache` and `API` declared only once
3. ✅ Gurbani Khoj page loads with correct UI
4. ✅ Bottom navigation bar from homepage is properly removed
5. ✅ Gurbani Khoj's own navigation bar (`.gk-bottom-tabbar`) displays correctly

### Navigation Back to Homepage
1. ✅ Homepage bottom navigation bar (`.tab-bar`) is restored
2. ✅ Gurbani Khoj scripts are not re-executed
3. ✅ No memory leaks from duplicate script loading

## Testing Instructions

1. **Clear browser cache** or do a hard refresh (Ctrl+Shift+R)
2. Start from homepage (index.html)
3. Click on "Gurbani Khoj" card
4. Check browser console - should have no "already declared" errors
5. Verify Gurbani Khoj UI loads correctly
6. Check bottom navbar - should show Gurbani Khoj's navbar, not homepage navbar
7. Navigate back to homepage
8. Navigate to Gurbani Khoj again
9. Verify no errors on second navigation

## Debug Logging
The fix includes console logs for debugging:
- `⏭️ Skipping already-executed script` - Script execution prevented
- `✓ Script already in DOM, marking as executed` - Script found but not re-executed
- `📜 Loading external script` - First-time script load

## Performance Impact
✅ **Positive** - Prevents unnecessary script re-execution
✅ **Positive** - Reduces memory usage from duplicate scripts
✅ **Neutral** - Minimal overhead from Map tracking

## Related Issues
- Navigation bar visibility on specialized pages (Gurbani Khoj, Naam Abhyas, etc.)
- SPA navigation state management
- Script execution lifecycle in single-page applications

---

**Status**: ✅ FIXED
**Date**: 2026-07-25
**Priority**: CRITICAL
**Tested**: Pending user verification
