# ✨ Sparkles Activation Guide - Guru Harkrishan Sahib Ji Parkash Gurpurab

## 🎉 Today IS a Gurpurab!

**Date:** August 7, 2026  
**Event:** Parkash Gurpurab - Sri Guru Harkrishan Sahib Ji  
**Status:** Sparkles should activate automatically

---

## ✅ What I Just Fixed

### Problem:
The festival mode integration was timing out before FestivalMode loaded.

### Solution:
1. **Increased retry timeout** from 5 seconds to 10 seconds
2. **Added detailed console logging** to track activation
3. **Improved error messages** to help debug
4. **Deployed to iOS and Android**

---

## 🔍 How to Check If It's Working

### Step 1: Reload the Page
1. **Hard refresh** your browser:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
2. Wait 3-5 seconds for all scripts to load

### Step 2: Open Console
1. Press `F12` (or `Ctrl + Shift + I`)
2. Click **"Console"** tab

### Step 3: Look for These Messages

✅ **SUCCESS - You should see:**
```
[Festival Mode] Configuration system loaded
[Festival Integration] Module loaded
[Festival Integration] ✅ Initialized successfully
[Festival Integration] 🔍 Checking today's events...
[Festival Integration] 📦 Cached event data: {...}
[Festival Integration] 🎉 TODAY IS A GURPURAB! {...}
[Festival Integration] 🚀 Attempting to activate Festival Mode for: ...
[Festival Integration] ✅ Event qualifies for celebration mode
[Festival Mode] Activated for: Prakash Gurpurab Sri Guru Harkrishan Sahib Ji
```

❌ **PROBLEM - If you see:**
```
[Festival Integration] ❌ FestivalMode not loaded after 10 seconds, aborting initialization
```
OR
```
[Festival Integration] ℹ️ No Gurpurab today
```

---

## 🚀 Manual Activation (If Auto-Activation Fails)

### Quick Console Command:

Open console (F12) and paste this:

```javascript
// Manual activation for today's Gurpurab
const todayEvent = {
  id: 'prakash-guru-harkrishan-2026',
  gregorian_date: '2026-08-07',
  name_en: 'Prakash Gurpurab Sri Guru Harkrishan Sahib Ji',
  name_pa: 'ਪ੍ਰਕਾਸ਼ ਗੁਰਪੁਰਬ ਗੁਰੂ ਹਰਿਕ੍ਰਿਸ਼ਨ ਜੀ',
  type: 'prakash',
  color: '#FF6B00'
};

// Activate Festival Mode
if (typeof FestivalMode !== 'undefined') {
  FestivalMode.activate(todayEvent);
  console.log('✅ Festival Mode activated manually!');
  console.log('👀 Look at the TOP of the page for 5 golden sparkles (✦)');
} else {
  console.error('❌ FestivalMode not loaded yet. Wait 3 seconds and try again.');
}
```

---

## 👀 What to Look For

### At the Very Top of the Page:
```
    ✦         ✦      ✦       ✦         ✦
```

**5 Golden Sparkles:**
- Semi-transparent golden color
- Gentle glow and rotation animation
- Positioned across the top (15%, 35%, 50%, 65%, 85%)
- Fixed position (stays at top when scrolling up)

### Scroll Behavior:
- ✅ **At top of page:** Sparkles visible
- ✅ **Scroll down >50px:** Sparkles fade away
- ✅ **Scroll back to top:** Sparkles reappear

---

## 🔧 Debug Commands

### Check if Festival Mode is active:
```javascript
console.log('Is Active:', FestivalMode.isActive());
```

### Check if HTML has the class:
```javascript
console.log('Has gurpurab-active class:', document.documentElement.classList.contains('gurpurab-active'));
```

### Check if sparkles element exists:
```javascript
const sparkles = document.querySelector('.gurpurab-sparkles-top');
console.log('Sparkles element:', sparkles);
if (sparkles) {
  console.log('Display:', sparkles.style.display);
  console.log('Opacity:', window.getComputedStyle(sparkles).opacity);
}
```

### Count sparkles:
```javascript
const count = document.querySelectorAll('.gurpurab-sparkle-top').length;
console.log('Number of sparkles:', count); // Should be 5
```

### Check localStorage cache:
```javascript
const cached = localStorage.getItem('anhad_cached_upcoming_gurpurab');
console.log('Cached event:', JSON.parse(cached));
```

---

## 🎯 Force Sparkles Visible (Emergency Override)

If nothing else works, paste this to **force create sparkles**:

```javascript
// Emergency: Force create sparkles
document.documentElement.classList.add('gurpurab-active');

// Create container if it doesn't exist
let container = document.querySelector('.gurpurab-sparkles-top');
if (!container) {
  container = document.createElement('div');
  container.className = 'gurpurab-sparkles-top';
  container.style.cssText = 'position:fixed;top:0;left:0;right:0;height:80px;pointer-events:none;z-index:998;display:block;opacity:1;';
  
  // Create 5 sparkles
  const positions = ['15%', '35%', '50%', '65%', '85%'];
  const tops = ['20px', '30px', '15px', '25px', '20px'];
  
  positions.forEach((left, i) => {
    const sparkle = document.createElement('div');
    sparkle.className = 'gurpurab-sparkle-top';
    sparkle.textContent = '✦';
    sparkle.style.cssText = `position:absolute;left:${left};top:${tops[i]};font-size:20px;color:rgba(212,175,55,0.8);animation:sparkleGlow 3s ease-in-out infinite;animation-delay:${i*0.6}s;`;
    container.appendChild(sparkle);
  });
  
  document.body.appendChild(container);
}

console.log('✅ SPARKLES FORCED! Look at the very top of the page!');
```

---

## 📱 Testing on Mobile/Device

### iOS:
1. Build: `npx cap sync ios`
2. Open in Xcode and run
3. Use Safari Web Inspector to check console

### Android:
1. Build: `npx cap sync android`
2. Open in Android Studio and run
3. Use Chrome DevTools (chrome://inspect) to check console

---

## 🎨 Make Sparkles HUGE (for testing visibility)

```javascript
// Temporary: Make sparkles GIANT
const style = document.createElement('style');
style.id = 'debug-sparkles';
style.textContent = `
  .gurpurab-sparkle-top {
    font-size: 64px !important;
    color: gold !important;
    text-shadow: 0 0 30px gold !important;
    animation: none !important;
  }
`;
document.head.appendChild(style);

console.log('Sparkles are now GIANT. Remove with: document.getElementById("debug-sparkles").remove()');
```

---

## ✅ Success Indicators

When working correctly:

### In Browser:
- [ ] 5 sparkles visible at top
- [ ] Sparkles glow and rotate
- [ ] Sparkles fade on scroll
- [ ] Console shows activation messages
- [ ] HTML has `gurpurab-active` class

### In Console:
```
✅ [Festival Mode] Activated for: Prakash Gurpurab Sri Guru Harkrishan Sahib Ji
```

---

## 📊 What Changed in This Update

### Files Modified:
1. **`frontend/js/festival-mode-config.js`**
   - ✅ Changed from 7 diyas to 5 sparkles
   - ✅ Added scroll listener for fade effect
   - ✅ Updated deactivation to handle sparkles

2. **`frontend/js/festival-mode-integration.js`**
   - ✅ Increased timeout from 5s to 10s
   - ✅ Added extensive console logging
   - ✅ Better error handling

3. **`frontend/css/gurpurab-celebration-2026.css`**
   - ✅ Already had sparkle styles ready

### Files Deployed:
- ✅ iOS: `ios/App/App/public/js/*`
- ✅ Android: `android/app/src/main/assets/public/js/*`

---

## 🆘 Still Not Working?

### Checklist:
1. ✅ Files are in place (check 404 errors in console)
2. ✅ Wait 5 seconds after page load
3. ✅ Hard refresh (Ctrl+Shift+R)
4. ✅ Check console for error messages
5. ✅ Try manual activation command above
6. ✅ Try emergency force creation script

### Common Issues:

**"FestivalMode is not defined"**
- Wait 3-5 seconds for scripts to load
- Check Network tab - is `festival-mode-config.js` loading?

**"No sparkles visible"**
- Check console for activation messages
- Try manual activation
- Use emergency force creation script

**"Sparkles don't fade on scroll"**
- Check if scroll listener is working:
```javascript
window.addEventListener('scroll', () => {
  console.log('Scroll Y:', window.scrollY);
}, { passive: true });
```

---

## 📞 Support Info

**Event:** Prakash Gurpurab Sri Guru Harkrishan Sahib Ji  
**Date:** August 7, 2026  
**Type:** `prakash` (celebration event)  
**Should activate:** ✅ YES

**Files:**
- Config: `frontend/js/festival-mode-config.js`
- Integration: `frontend/js/festival-mode-integration.js`
- CSS: `frontend/css/gurpurab-celebration-2026.css`

---

## 🙏 Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh

The sparkles are a humble way to honor Guru Harkrishan Sahib Ji's Parkash Gurpurab. They are lightweight, respectful, and designed to enhance the spiritual atmosphere without distraction.

---

**Last Updated:** August 7, 2026  
**Status:** ✅ Ready for Testing
