# 🌟 HOW TO SEE THE SPARKLES - Simple Guide

## 🎯 Quick Start (3 Steps)

### Option A: Test Page (EASIEST - Recommended First)

1. **Open the test page:**
   - Double-click `test-sparkles.html` in the project folder
   - Opens in your default browser

2. **Click the button:**
   - Click "🎉 Activate Festival Mode" button

3. **Look at the top:**
   - You should see **5 golden stars (✦)** at the very top
   - They glow and rotate gently

### Option B: Main App with Console

1. **Open the main app:**
   - Open `frontend/index.html` in browser
   - Or run your development server

2. **Open console:**
   - Press F12 (or Ctrl+Shift+I)
   - Go to "Console" tab

3. **Paste this ONE line:**
   ```javascript
   FestivalMode.activate({id:'test',type:'prakash',name_en:'Test Gurpurab'})
   ```
   - Press Enter
   - Look at the TOP of the page

### Option C: Auto-Activation Script

1. **Open console** (F12)
2. **Copy entire contents of** `QUICK-ACTIVATE.js`
3. **Paste into console and press Enter**
4. **Wait 1 second** - it will tell you if it worked

---

## 👀 What You're Looking For

### At the TOP of the page:
```
    ✦         ✦      ✦       ✦         ✦
```

- **5 golden stars**
- **Semi-transparent** (you can see through them)
- **Gentle glow animation** (they pulse and rotate slowly)
- **Positioned across the top** (spread out left to right)

### They should:
- ✅ Be visible when you're at the top of the page
- ✅ **Fade away** when you scroll down
- ✅ **Reappear** when you scroll back to top

---

## 🔍 Troubleshooting

### "I don't see anything"

1. **Wait 2 seconds** after opening the page (scripts need to load)
2. **Refresh the page** (Ctrl+R or Cmd+R)
3. **Try the test page** first (`test-sparkles.html`)
4. **Check console for errors** (F12 → Console tab)

### "FestivalMode is not defined"

- **Wait 2-3 seconds** after page load
- The scripts load asynchronously
- Try again after waiting

### "Still nothing!"

Run this in console to force it:

```javascript
// Force add the class
document.documentElement.classList.add('gurpurab-active');

// Manually create sparkles
const container = document.createElement('div');
container.className = 'gurpurab-sparkles-top';
container.style.cssText = 'position:fixed;top:0;left:0;right:0;height:80px;z-index:9999;display:block;';

for (let i = 0; i < 5; i++) {
  const sparkle = document.createElement('div');
  sparkle.className = 'gurpurab-sparkle-top';
  sparkle.textContent = '✦';
  sparkle.style.cssText = `position:absolute;font-size:24px;color:rgba(212,175,55,0.8);top:20px;left:${20 + i*20}%;`;
  container.appendChild(sparkle);
}

document.body.appendChild(container);
console.log('✅ Sparkles forced! Look at the very top of the page!');
```

---

## 📱 Testing on Mobile/Android

1. **Build the app:**
   ```bash
   npm run build
   npx cap sync android
   ```

2. **Open Android Studio**
3. **Run on device/emulator**
4. **Manually activate** using Chrome DevTools remote debugging:
   - Connect device via USB
   - Open `chrome://inspect` in desktop Chrome
   - Find your app and click "Inspect"
   - Run activation command in console

---

## 🎨 Visual Debug Mode

If you want to make sparkles **SUPER OBVIOUS** for testing:

```javascript
// Make sparkles HUGE and bright
const style = document.createElement('style');
style.textContent = `
  .gurpurab-sparkle-top {
    font-size: 48px !important;
    color: #D4AF37 !important;
    text-shadow: 0 0 20px gold !important;
    animation: none !important;
  }
  .gurpurab-sparkles-top {
    background: rgba(255,0,0,0.1) !important;
  }
`;
document.head.appendChild(style);
```

Now the sparkles will be GIANT and impossible to miss!

---

## ✅ Success Checklist

When it works, you should have:

- [ ] 5 sparkles visible at top
- [ ] They glow and rotate gently
- [ ] They fade when you scroll down
- [ ] They reappear when you scroll up
- [ ] Console shows: `[Festival Mode] Activated for: ...`
- [ ] HTML element has class `gurpurab-active`

---

## 📞 Still Not Working?

1. **Check browser:** Modern browsers only (Chrome, Firefox, Safari, Edge)
2. **Check console:** Any red error messages?
3. **Check files exist:**
   - `frontend/css/gurpurab-celebration-2026.css`
   - `frontend/js/festival-mode-config.js`
4. **Try test page first:** `test-sparkles.html` is guaranteed to work

---

## 🎯 Expected Behavior Summary

| When | Sparkles |
|------|----------|
| Page loads normally | ❌ Hidden (no Gurpurab today) |
| After manual activation | ✅ Visible at top |
| Scrolling down >50px | 🌫️ Fade away |
| Scrolling back to top | ✅ Reappear |
| On real Gurpurab day | ✅ Auto-activate |

---

## 📁 Files You Need

All these files are already in place:

✅ `frontend/css/gurpurab-celebration-2026.css` - Styles for sparkles
✅ `frontend/js/festival-mode-config.js` - Logic to create sparkles
✅ `frontend/js/festival-mode-integration.js` - Auto-activation system
✅ `frontend/index.html` - Has the CSS and JS links

✅ Deployed to iOS
✅ Deployed to Android

Everything is ready - you just need to activate it!

---

## 🚀 Quick Test RIGHT NOW

1. Open `test-sparkles.html` in your browser
2. Click "Activate Festival Mode" button
3. Done! You'll see sparkles immediately.

That's it! 🎉
