# Shabad Reader Quick Fixes - Complete List

## ✅ COMPLETED (Frontend CSS)

### 1. Highlighted Pankti - Simple Glow
```css
.shabad-line.highlighted {
    background: transparent;
    padding: 12px 0;
}
.shabad-line.highlighted .gurmukhi {
    color: var(--accent);
    font-weight: 600;
    text-shadow: 0 0 20px var(--accent), 0 0 8px var(--accent);
}
```

### 2. Dark Mode Highlight - Better Visibility
```css
[data-reader-theme="charcoal"] .shabad-line.highlighted .gurmukhi {
    color: #f4d03f;
    text-shadow: 0 0 24px #f4d03f, 0 0 12px #f4d03f;
}
```

### 3. Auto-Scroll Bar - Thin Bottom Bar
```css
.floating-player-card {
    height: 48px;
    padding: 8px 18px;
    flex-direction: row; /* was column */
}
.floating-player-card .nav-row {
    display: none; /* hide navigation buttons */
}
```

### 4. Header Scroll Hide - CSS Ready
```css
.ios-nav.nav-hidden {
    transform: translateY(-100%);
    opacity: 0;
}
```

## 🔧 TODO (Apply to iOS/Android + JS Fixes)

### Copy frontend CSS changes to:
- `ios/App/App/public/GurbaniKhoj/shabad-reader.css`
- `android/app/src/main/assets/public/GurbaniKhoj/shabad-reader.css`

### JS Changes Needed in `shabad-reader.js`:

1. **Hide Header on Scroll**
```javascript
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        DOM.nav?.classList.add('nav-hidden');
    } else {
        DOM.nav?.classList.remove('nav-hidden');
    }
    lastScrollTop = scrollTop;
});
```

2. **Fix Line Spacing** - Find lineSpacingSegmented click handler and apply:
```javascript
document.documentElement.style.setProperty('--line-spacing', value + 'em');
```

3. **Add Gurbani Font in Settings** - Add font options (Noto Sans Gurmukhi, GurbaniAkhar, etc.)

4. **Show Guru Sahib Name** - Parse mahalla and map to Guru names:
```javascript
const guruNames = {
    1: 'Guru Nanak Dev Ji',
    2: 'Guru Angad Dev Ji',
    3: 'Guru Amar Das Ji',
    4: 'Guru Ram Das Ji',
    5: 'Guru Arjan Dev Ji',
    9: 'Guru Tegh Bahadur Ji'
};
// Update navSubtitle with guruNames[mahalla]
```

5. **Remove Sections** - Hide these in HTML/JS:
   - Audio settings (autoPlaySwitch, repeatRow, bgAudioRow)
   - Focus mode toggle

## Summary
- CSS fixes applied to `frontend/GurbaniKhoj/shabad-reader.css` ✅
- Need to copy same fixes to iOS/Android versions
- JS functionality fixes documented above
