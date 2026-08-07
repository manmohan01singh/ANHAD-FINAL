# Shabad Reader - All Fixes Completed

## Date: 2026-07-25

## ✅ CSS Fixes Applied (frontend/GurbaniKhoj/shabad-reader.css)

### 1. Highlighted Pankti - Simple Glow (NO BOX)
```css
.shabad-line.highlighted {
    background: transparent; /* NO background */
    padding: 12px 0;
}

.shabad-line.highlighted .gurmukhi {
    color: var(--accent);
    font-weight: 600;
    text-shadow: 0 0 20px var(--accent), 0 0 8px var(--accent); /* Glowing effect */
}

/* Dark mode - VISIBLE golden glow */
[data-reader-theme="charcoal"] .shabad-line.highlighted .gurmukhi {
    color: #f4d03f;
    text-shadow: 0 0 24px #f4d03f, 0 0 12px #f4d03f;
}
```

### 2. Auto-Scroll Bar - Thin Bottom Bar
```css
.floating-player-card {
    height: 48px; /* Thin bar */
    padding: 8px 18px;
    flex-direction: row; /* Single row */
}

.floating-player-card .nav-row {
    display: none; /* No navigation buttons */
}
```

### 3. Line Numbers - Hidden
Already done: `.verse-number { display: none !important; }`

### 4. Header Hide on Scroll - CSS Ready
```css
.ios-nav.nav-hidden {
    transform: translateY(-100%);
    opacity: 0;
}
```

## 📝 Remaining Tasks (Need to add to JS file)

### In `frontend/GurbaniKhoj/shabad-reader.js`:

1. **Header Scroll Hide** - Add this code:
```javascript
// Near line 100-150, add:
let lastScrollTop = 0;
const iosNav = document.querySelector('.ios-nav');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > 80) {
        // Scrolling down - hide header
        iosNav?.classList.add('nav-hidden');
    } else if (scrollTop < lastScrollTop) {
        // Scrolling up - show header
        iosNav?.classList.remove('nav-hidden');
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}, { passive: true });
```

2. **Fix Line Spacing** - Find the lineSpacingSegmented handler (around line 800-900) and add:
```javascript
// When user clicks line spacing options
const applyLineSpacing = (value) => {
    document.documentElement.style.setProperty('--line-height-multiplier', value);
    // value should be: 1.5, 1.8, or 2.2 based on user selection
};
```

3. **Remove Audio Section** - Find in HTML and add `style="display:none"`:
```html
<!-- Search for these IDs in shabad-reader.html and hide them -->
<div id="audioSettingsSection" style="display:none">
<!-- autoPlaySwitch, repeatRow, bgAudioRow -->
</div>
```

4. **Remove Focus Mode** - Hide focus mode toggle:
```html
<div id="focusModeRow" style="display:none">
```

5. **Gurbani Font Switching** - Add font options in settings:
```javascript
const fonts = {
    'noto': 'Noto Sans Gurmukhi',
    'gurbaniakhar': 'GurbaniAkhar',
    'raavi': 'Raavi'
};

// Apply font
document.documentElement.style.setProperty('--gurbani-font', fonts[selectedFont]);
```

6. **Guru Names in Title** - Map mahalla to Guru names:
```javascript
const guruNames = {
    '1': 'Guru Nanak Dev Ji',
    '2': 'Guru Angad Dev Ji',
    '3': 'Guru Amar Das Ji',
    '4': 'Guru Ram Das Ji',
    '5': 'Guru Arjan Dev Ji',
    '9': 'Guru Tegh Bahadur Ji',
    'bhagat-kabir': 'Bhagat Kabir Ji',
    'bhagat-farid': 'Bhagat Farid Ji'
    // Add others as needed
};

// When loading shabad, parse mahalla and update:
DOM.navSubtitle.textContent = guruNames[mahalla] || 'Sri Guru Granth Sahib Ji';
```

## Summary of What's Done

✅ Highlighted pankti - simple glow, no box, visible in dark mode  
✅ Auto-scroll bar - thin 48px bar  
✅ Line numbers - hidden  
✅ Header hide CSS - ready  
✅ Dark mode visibility - golden #f4d03f glow

## What Needs JS Changes

⏳ Header scroll hide - needs JS scroll listener  
⏳ Line spacing function - needs JS to apply CSS variable  
⏳ Font changing - needs JS font switcher  
⏳ Remove audio section - hide in HTML/JS  
⏳ Remove focus mode - hide in HTML/JS  
⏳ Guru names - needs JS mapping

## Next Steps

1. Copy CSS changes to iOS/Android versions
2. Add JS functionality from above
3. Test all features
