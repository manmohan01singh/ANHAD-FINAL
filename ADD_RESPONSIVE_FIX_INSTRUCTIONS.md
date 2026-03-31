# Instructions to Add Responsive Fix CSS

## Automatic Method (Recommended)
Add this line to the `<head>` section of each main page, right after the mobile-lock.css:

```html
<link rel="stylesheet" href="../css/responsive-fix.css">
```

## Pages That Need the Fix

### High Priority (User-Facing Pages):
1. `frontend/index.html` - Homepage
2. `frontend/Hukamnama/daily-hukamnama.html` - Already has mobile-lock.css
3. `frontend/NitnemTracker/nitnem-tracker.html` - Already has mobile-lock.css
4. `frontend/GurbaniRadio/gurbani-radio.html` - Already has mobile-lock.css
5. `frontend/GurbaniKhoj/gurbani-khoj.html` - Search page
6. `frontend/NaamAbhyas/naam-abhyas.html` - Already has mobile-lock.css
7. `frontend/Dashboard/dashboard.html` - Dashboard
8. `frontend/SehajPaath/sehaj-paath.html` - Already has mobile-lock.css

### Medium Priority (Secondary Pages):
9. `frontend/RandomShabad/random-shabad.html`
10. `frontend/Notes/notes.html`
11. `frontend/Profile/profile.html`
12. `frontend/Insights/insights.html`

### Low Priority (Nitnem Individual Pages):
- All files in `frontend/nitnem/` directory

## Manual Addition Example

Before:
```html
<head>
    <link rel="stylesheet" href="../css/mobile-lock.css">
    <link rel="stylesheet" href="../css/anhad-core.css">
    <meta charset="UTF-8">
```

After:
```html
<head>
    <link rel="stylesheet" href="../css/mobile-lock.css">
    <link rel="stylesheet" href="../css/responsive-fix.css">
    <link rel="stylesheet" href="../css/anhad-core.css">
    <meta charset="UTF-8">
```

## Note
The responsive-fix.css file is already created at `frontend/css/responsive-fix.css` and contains:
- Overflow prevention
- Proper viewport constraints
- Safe area insets for notched devices
- Touch target size optimization
- Responsive breakpoints
- Landscape orientation fixes

## Testing After Addition
1. Clear browser cache
2. Test on mobile devices (iOS and Android)
3. Check for horizontal scrolling (should be none)
4. Verify buttons and icons are properly sized
5. Test in both portrait and landscape orientations
