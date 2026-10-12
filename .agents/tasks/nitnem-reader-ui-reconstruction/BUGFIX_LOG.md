# Bug Fix Log - Reader Engine API Export

## Issue
**Error:** `Uncaught ReferenceError: adjustSize is not defined at reader-engine.js:1814`

## Root Cause
The `window.readerEngine` API export was placed **outside** the IIFE (Immediately Invoked Function Expression) closure, making all the internal functions (`adjustSize`, `toggleDisplay`, `setTheme`, etc.) inaccessible because they were only defined within the IIFE scope.

## Solution
Moved the `window.readerEngine` export **inside** the IIFE, just before the closing `})();`

### Before (Broken)
```javascript
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();  // ← IIFE closes here

// Export is OUTSIDE the IIFE scope - can't access internal functions
window.readerEngine = {
    adjustSize,      // ← undefined!
    toggleDisplay,   // ← undefined!
    setTheme,        // ← undefined!
    // ...
};
```

### After (Fixed)
```javascript
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export is INSIDE the IIFE scope - can access internal functions
    window.readerEngine = {
        adjustSize,      // ✓ accessible
        toggleDisplay,   // ✓ accessible
        setTheme,        // ✓ accessible
        state,
        applyFontToVerses,
        saveSettings,
        loadSettings
    };

})();  // ← IIFE closes here
```

## Files Modified
- `frontend/nitnem/js/reader-engine.js` (lines 1795-1820)

## Testing
After this fix:
1. Reload the page: http://localhost:3004/nitnem/reader.html?id=2
2. Click the settings gear icon
3. Compact settings sheet should now open without errors
4. Font size +/- buttons should work
5. Display toggles should work
6. Theme selector should work

## Status
✅ **Fixed** - All functions now accessible via `window.readerEngine` API
