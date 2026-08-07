# ✨ ACTIVATE SPARKLES NOW - Quick Test Guide

## Method 1: Using Test Page (Easiest)

1. Open `test-sparkles.html` in your browser
2. Click the **"🎉 Activate Festival Mode"** button
3. Look at the TOP of the page for 5 golden stars (✦)
4. Scroll down - sparkles should fade away
5. Scroll back up - sparkles should reappear

---

## Method 2: Using Browser Console (Main App)

1. Open `frontend/index.html` in your browser
2. Open Developer Console (F12 or Ctrl+Shift+I)
3. Copy and paste this code:

```javascript
// Activate Festival Mode manually
const testEvent = {
  id: 'test-prakash-gurpurab',
  type: 'prakash',
  name_en: 'Parkash Gurpurab of Guru Nanak Dev Ji',
  name_pa: 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਦਾ ਪ੍ਰਕਾਸ਼ ਪੁਰਬ'
};

FestivalMode.activate(testEvent);
console.log('✅ Festival Mode Activated - Look at the top for sparkles!');
```

4. Press Enter
5. Look at the **very top** of the page for 5 golden stars (✦)
6. Scroll down to see them fade away

---

## Method 3: Simulate Real Gurpurab Event

```javascript
// Add fake event to localStorage (simulates today being a Gurpurab)
const fakeEvent = {
  isToday: true,
  date: new Date().toISOString().split('T')[0],
  events: [{
    id: 'guru-nanak-dev-ji-prakash',
    type: 'prakash',
    name_en: 'Parkash Gurpurab - Guru Nanak Dev Ji',
    name_pa: 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਦਾ ਪ੍ਰਕਾਸ਼ ਪੁਰਬ',
    guruName_en: 'Guru Nanak Dev Ji',
    description_en: 'The blessed day of Guru Nanak Dev Ji\'s birth'
  }]
};

localStorage.setItem('anhad_cached_upcoming_gurpurab', JSON.stringify(fakeEvent));
console.log('✅ Fake Gurpurab event added to cache');

// Reload the page
location.reload();
```

After reloading, the sparkles should appear automatically!

---

## What You Should See:

### 🌟 At the Top of the Page:
- **5 golden stars (✦)** positioned across the top
- Gentle glow and rotation animation
- Semi-transparent golden color (#D4AF37)

### 📍 Sparkle Positions:
1. Left (15% from left)
2. Left-center (35%)
3. Center (50%)
4. Right-center (65%)
5. Right (85%)

### 🎭 Behavior:
- ✅ **When at top**: Sparkles visible with gentle glow
- ✅ **When scrolling down**: Sparkles fade away smoothly
- ✅ **When scrolling back up**: Sparkles reappear

---

## Debugging Commands:

```javascript
// Check if Festival Mode is active
console.log('Active:', FestivalMode.isActive());

// Check if HTML has the right class
console.log('Has active class:', document.documentElement.classList.contains('gurpurab-active'));

// Check if scrolled class is applied
console.log('Has scrolled class:', document.documentElement.classList.contains('gurpurab-scrolled'));

// Check if sparkles element exists
console.log('Sparkles element:', document.querySelector('.gurpurab-sparkles-top'));

// Check sparkles visibility
const sparkles = document.querySelector('.gurpurab-sparkles-top');
if (sparkles) {
  console.log('Sparkles display:', window.getComputedStyle(sparkles).display);
  console.log('Sparkles opacity:', window.getComputedStyle(sparkles).opacity);
}

// Count sparkle children
const sparkleChildren = document.querySelectorAll('.gurpurab-sparkle-top');
console.log('Number of sparkles:', sparkleChildren.length);

// Force show sparkles (if hidden)
if (sparkles) {
  sparkles.style.display = 'block';
  sparkles.style.opacity = '1';
}
```

---

## Troubleshooting:

### ❌ Problem: "FestivalMode is not defined"
**Solution:** Wait 2-3 seconds after page load for scripts to load, then try again.

### ❌ Problem: No sparkles visible
**Solution:** Run this in console:
```javascript
// Manually add the class
document.documentElement.classList.add('gurpurab-active');

// Check if sparkles container exists
console.log(document.querySelector('.gurpurab-sparkles-top'));
```

### ❌ Problem: Sparkles exist but not visible
**Solution:**
```javascript
const sparkles = document.querySelector('.gurpurab-sparkles-top');
if (sparkles) {
  sparkles.style.display = 'block';
  sparkles.style.opacity = '1';
  sparkles.style.zIndex = '9999';
  console.log('✅ Forced sparkles visible');
}
```

### ❌ Problem: Sparkles not fading on scroll
**Solution:**
```javascript
// Check scroll listener
window.addEventListener('scroll', () => {
  console.log('ScrollY:', window.scrollY, 'Should fade:', window.scrollY > 50);
});
```

---

## Quick Visual Test:

Run this to add temporary styles and see the sparkle positions clearly:

```javascript
const style = document.createElement('style');
style.textContent = `
  .gurpurab-sparkles-top {
    background: rgba(255, 0, 0, 0.1) !important; /* Red tint to see container */
    border: 2px solid red !important;
  }
  .gurpurab-sparkle-top {
    font-size: 32px !important; /* Make them bigger */
    color: gold !important;
    text-shadow: 0 0 10px rgba(212, 175, 55, 1) !important;
  }
`;
document.head.appendChild(style);
console.log('✅ Debug styles applied - sparkles should be HUGE and obvious now');
```

---

## Expected Console Output:

When Festival Mode activates, you should see:
```
[Festival Mode] Configuration system loaded
[Festival Integration] Module loaded
[Festival Integration] Initialized successfully
[Festival Mode] Activated for: Parkash Gurpurab of Guru Nanak Dev Ji
```

---

## Files Deployed:

✅ `frontend/css/gurpurab-celebration-2026.css`
✅ `frontend/js/festival-mode-config.js`
✅ `frontend/js/festival-mode-integration.js`
✅ `ios/App/App/public/js/festival-mode-config.js`
✅ `android/app/src/main/assets/public/js/festival-mode-config.js`

---

## Next Steps:

1. **Test with the test page first** (`test-sparkles.html`)
2. If that works, test on main app with console commands
3. If main app doesn't work, check browser console for errors
4. Use debugging commands above to diagnose

The sparkles are **definitely there** - they just need Festival Mode to be activated!
