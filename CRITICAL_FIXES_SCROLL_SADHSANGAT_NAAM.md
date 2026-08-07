# CRITICAL FIXES: Scroll, Sadhsangat & Naam Abhyas
**Date**: August 7, 2026  
**Priority**: P0 - App-Breaking Issues

## 🔴 Issues Identified

### 1. **Scroll Performance Issues**
- **Root Cause**: Multiple non-passive touch event listeners blocking scroll dispatch
- **Impact**: Laggy scrolling, unresponsive touch gestures
- **Files Affected**: 
  - `frontend/sadhsangat-live/index.html` (line 334-350)
  - `frontend/js/trendora-app.js` (Portrait slider touch events)
  - `frontend/css/anhad-core.css` (will-change causing rendering glitches)

### 2. **Sadhsangat Player Crashes**
- **Root Cause**: YouTube iframe rendering issues + memory leaks from uncleared event listeners
- **Impact**: App crashes when opening Sadhsangat Live
- **Files Affected**:
  - `frontend/sadhsangat-live/index.html` (CSS masks on iframes)
  - Event listener cleanup missing

### 3. **Naam Abhyas Popup Not Appearing**
- **Root Cause**: Engine not triggering popup + UI initialization race condition
- **Impact**: "Coming soon" message instead of actual popup
- **Files Affected**:
  - `frontend/NaamAbhyas-V2/js/ui/NaamAbhyasUI.js` (missing popup trigger logic)
  - `frontend/NaamAbhyas-V2/js/core/NaamAbhyasEngine.js` (popup event not fired)

## ✅ Fixes Applied

### Fix 1: Scroll Performance
- ✓ Made ALL touch/touchend listeners passive
- ✓ Removed will-change and transform from glass-nav (caused rendering glitches)
- ✓ Added passive:true to Portrait slider touch events
- ✓ Removed non-passive window touchend listener

### Fix 2: Sadhsangat Player
- ✓ Removed CSS masks from YouTube iframes (caused rendering crashes)
- ✓ Added proper event listener cleanup
- ✓ Fixed memory leaks in player state management
- ✓ Added error boundaries around player initialization

### Fix 3: Naam Abhyas Popup
- ✓ Fixed popup trigger logic in UI controller
- ✓ Added proper engine-to-UI event subscription
- ✓ Fixed race condition in initialization sequence
- ✓ Added fallback popup trigger on hourly check

## 🚀 Testing Checklist
- [ ] Test smooth scrolling on all pages
- [ ] Open Sadhsangat Live and play a stream (should not crash)
- [ ] Enable Naam Abhyas and wait for hourly popup
- [ ] Test touch gestures on Portrait slider
- [ ] Verify no console errors

## 📝 Implementation Details

### Scroll Fix Pattern
```javascript
// BEFORE (blocks scroll)
window.addEventListener('touchend', handler);

// AFTER (allows smooth scroll)
window.addEventListener('touchend', handler, { passive: true });
```

### Sadhsangat Fix Pattern
```css
/* BEFORE (causes crash) */
iframe {
  -webkit-mask-image: linear-gradient(...);
}

/* AFTER (stable) */
iframe, .ytp-* {
  -webkit-mask-image: none !important;
  mask-image: none !important;
}
```

### Naam Abhyas Fix Pattern
```javascript
// Added proper popup trigger
showSessionPopup() {
  if (!this.sessionPopup) return;
  this.sessionPopup.style.display = 'flex';
  this.sessionPopup.classList.add('visible');
  document.body.style.overflow = 'hidden'; // Prevent background scroll
}
```

## 🔍 Root Cause Analysis

**Scroll Lag**: Non-passive touch listeners force browser to wait for preventDefault() check before dispatching scroll events, causing 16ms+ delays per frame = janky scroll.

**Sadhsangat Crash**: CSS masks on YouTube iframes trigger GPU rendering pipeline conflicts, especially on mobile WebView, causing memory exceptions and app crashes.

**Naam Popup Missing**: Engine was emitting events but UI wasn't subscribed to the right event channel. Added proper observer pattern implementation.

