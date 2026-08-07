# Shabad Reader Fixes Applied

## Date: 2026-07-25

### CSS Changes Made ✅

1. **Highlighted Pankti** - Simple glow effect (no box)
   - Removed border, background, box-shadow
   - Added text-shadow glow: `0 0 20px` for light mode
   - Dark mode: `0 0 24px #f4d03f` for better visibility
   
2. **Auto-Scroll Bar** - Made thin
   - Changed height: 48px (was ~120px)
   - Removed nav-row (navigation controls)
   - Single row layout with just speed control
   
3. **Line Numbers** - Already hidden with `.verse-number { display: none !important; }`

4. **Header Hide on Scroll** - CSS ready with `.ios-nav.nav-hidden` class

### JS Changes Needed

1. **Header Scroll Hide** - Add scroll listener to toggle `.nav-hidden`
2. **Line Spacing Fix** - Connect lineSpacingSegmented to CSS variable
3. **Gurbani Font Switcher** - Add font options in settings
4. **Guru Name in Title** - Parse mahalla/author and show Guru Sahib name
5. **Remove Audio Section** - Hide autoPlaySwitch, repeatRow, bgAudioRow
6. **Remove Focus Mode** - Hide focus mode toggle

### Files Updated
- `frontend/GurbaniKhoj/shabad-reader.css` ✅
- `frontend/GurbaniKhoj/shabad-reader.js` (in progress)
- `frontend/GurbaniKhoj/shabad-reader.html` (may need updates)

### Pending Tasks
- Apply same CSS fixes to iOS and Android versions
- Complete JS functionality fixes
- Test all changes
