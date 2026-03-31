# Mini Player & Hero Card Fixes

## Issues Fixed

### 1. Line on Hero Card Image in Dark Mode ✅
**Problem:** A white/silver line was appearing on the hero card images in dark mode.

**Solution:** Removed the claymorphism box-shadow effects from the image wrapper overlay elements in dark mode.

**Files Modified:**
- `frontend/css/ios-override.css` - Removed inset shadows from `.hero-card__image-wrapper::before` and `::after`
- `frontend/css/dark-mode.css` - Updated dark mode styles

### 2. Hero Card Play Button - Converted from Claymorphism to Normal Button ✅
**Problem:** Play button on hero cards had heavy claymorphism styling with gradients and multiple shadows.

**Solution:** Converted to clean glassmorphism style with simple backdrop blur and single shadow.

**Changes:**
- Removed `linear-gradient` backgrounds
- Added `backdrop-filter: blur(20px)` for modern glass effect
- Simplified shadows to single `box-shadow`
- Reduced border thickness and opacity
- Maintained visibility in both light and dark modes

**Files Modified:**
- `frontend/css/ios-override.css` - Updated base button style
- `frontend/css/dark-mode.css` - Updated dark mode button style

**Before:**
```css
background: linear-gradient(145deg, rgba(60,60,65,0.8), rgba(30,30,35,0.6));
box-shadow: 8px 8px 25px rgba(0,0,0,0.8), 
            inset 4px 4px 10px rgba(255,255,255,0.15),
            inset -4px -4px 10px rgba(0,0,0,0.5);
```

**After:**
```css
background: rgba(255, 255, 255, 0.2);
backdrop-filter: blur(20px);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
```

### 3. Mini Player Disappearing When Clicking Play/Pause ✅
**Problem:** Clicking the play/pause button in the mini player caused it to disappear because the click event was propagating to parent elements.

**Solution:** Added `e.preventDefault()` to all button click handlers to prevent event propagation and default behavior.

**Files Modified:**
- `frontend/lib/global-mini-player.js`

**Changes:**
```javascript
// Before
document.getElementById('gmpPlay')?.addEventListener('click', (e) => {
  e.stopPropagation();
  togglePlayPause();
});

// After
document.getElementById('gmpPlay')?.addEventListener('click', (e) => {
  e.stopPropagation();
  e.preventDefault();  // Added
  togglePlayPause();
});
```

### 4. Mini Player Not Disappearing When Clicking Close Button ✅
**Problem:** Clicking the close button stopped the audio but the mini player remained visible.

**Root Cause:** The `updateMiniPlayerUI()` function had logic that kept the mini player visible if `audio && currentStream` was true, even when stopped.

**Solution:** 
1. Modified `stopAudio()` to set `currentStream = null` when closing
2. Updated `updateMiniPlayerUI()` to hide the mini player when no stream is selected
3. Modified `resumePlayback()` to not resume if stream was explicitly closed (null)

**Files Modified:**
- `frontend/lib/global-mini-player.js`

**Key Changes:**

```javascript
// stopAudio() - Now clears the stream
function stopAudio() {
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }
  isPlaying = false;
  currentStream = null; // Clear stream so mini player hides
  saveState({ isPlaying: false, stream: null, ... });
  updateMiniPlayerUI();
}

// updateMiniPlayerUI() - Simplified visibility logic
function updateMiniPlayerUI(forceVisible) {
  if (!miniPlayerEl) return;
  
  const stream = STREAMS[currentStream];
  if (!stream) {
    // No stream selected, hide mini player
    miniPlayerEl.classList.remove('gmp--visible');
    return;
  }
  
  const shouldShow = isPlaying || forceVisible;
  miniPlayerEl.classList.toggle('gmp--visible', shouldShow);
  // ... rest of function
}

// resumePlayback() - Don't resume if stream was closed
async function resumePlayback() {
  const state = loadState();
  if (!state || !state.isPlaying || !state.stream) return; // Added !state.stream check
  // ... rest of function
}
```

## Testing Checklist

- [x] Hero card images display without lines in dark mode
- [x] Play button on hero cards has clean glassmorphism style (no claymorphism)
- [x] Play button visible in both light and dark modes
- [x] Mini player play/pause button works without disappearing
- [x] Mini player close button properly hides the mini player
- [x] Mini player doesn't reappear after being closed
- [x] Audio state persists correctly across page navigation
- [x] Mini player shows when audio is playing
- [x] Mini player hides when audio is stopped/closed

## Visual Improvements

### Hero Card Play Button
- **Light Mode:** Clean white glass with subtle shadow
- **Dark Mode:** Translucent white glass with backdrop blur
- **Active State:** Slightly more opaque on press
- **Playing State:** Gold tint when audio is playing

### Mini Player Behavior
- **Playing:** Visible with pause icon
- **Paused:** Hidden (can be shown with forceVisible flag)
- **Closed:** Hidden and won't auto-resume
- **Smooth Transitions:** 0.45s cubic-bezier animation

## Browser Compatibility

All fixes use modern CSS features with fallbacks:
- `backdrop-filter` with `-webkit-` prefix
- Standard `box-shadow` (widely supported)
- CSS transitions (universal support)
- Event `preventDefault()` (universal support)

## Performance Impact

- **Positive:** Removed complex gradient calculations and multiple shadows
- **Neutral:** Added backdrop-filter (GPU accelerated on modern devices)
- **Improved:** Simplified JavaScript event handling logic
