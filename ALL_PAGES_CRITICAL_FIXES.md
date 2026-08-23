# All Pages Critical Fixes - Comprehensive Update

**Date:** August 23, 2026  
**Status:** 🔧 IN PROGRESS

---

## Issues Identified

### 1. **Gurbani Khoj** ❌
- Search bar hidden behind fixed header
- Tab navigation overlapping search
- Z-index issues

### 2. **Sehaj Paath Reader** ❌
- Fonts not as good as Hukamnama
- Need premium font implementation

### 3. **Sadhsangat Live Page** ❌
- Not scrollable on desktop
- Content overflow issues

### 4. **Favorites Page** ❌
- Display/scrolling issues
- Layout problems

### 5. **Gurbani Khoj Shabad Reader** ❌
- Fonts need improvement
- Typography not matching Hukamnama quality

---

## Fix Strategy

### Phase 1: Layout & Scrolling Fixes
1. Fix Gurbani Khoj header overlap
2. Fix Sadhsangat scrolling
3. Fix Favorites page layout

### Phase 2: Typography Improvements  
1. Sehaj Paath Reader fonts
2. Gurbani Khoj Shabad Reader fonts

---

## Detailed Fixes

### 1. Gurbani Khoj - Header Overlap Fix

**Problem:**
```css
.search-section {
    padding-top: calc(var(--nav-h) + var(--safe-top) + 10px);
}
```
The fixed header at `z-index: 300` overlaps the search bar.

**Solution:**
Increase padding-top and ensure proper z-index stacking.

```css
.gk-nav {
    position: fixed;
    top: 0;
    z-index: 300;
    height: calc(var(--nav-h) + var(--safe-top));
}

.search-section {
    padding-top: calc(var(--nav-h) + var(--safe-top) + 20px); /* Increased from 10px */
    position: relative;
    z-index: 1;
}

/* Tab navigation should be below header */
.tab-nav {
    position: sticky;
    top: calc(var(--nav-h) + var(--safe-top));
    z-index: 200; /* Below header (300) */
}
```

---

### 2. Sadhsangat - Scrolling Fix

**Problem:**
- Page-content has `overflow: hidden` on desktop
- Height restrictions preventing scroll

**Solution:**
Add to `desktop-responsive.css`:

```css
@media screen and (min-width: 1024px) {
  /* Sadhsangat: Force scrollable content */
  .page-content {
    overflow-y: auto !important;
    overflow-x: hidden !important;
    height: auto !important;
    min-height: 100vh !important;
    max-height: none !important;
  }
  
  /* Fix main container */
  .page-content > main,
  #mainContainer {
    overflow: visible !important;
    height: auto !important;
  }
  
  /* Ensure body is scrollable */
  body {
    overflow-y: auto !important;
  }
}
```

---

### 3. Favorites Page - Layout Fix

**Problem:**
- Content not scrollable
- Fixed positioning issues

**Solution:**
Add responsive fixes for Favorites page:

```css
@media screen and (min-width: 1024px) {
  /* Favorites page fixes */
  .favorites-app,
  .favorites-container {
    overflow-y: auto !important;
    height: auto !important;
    min-height: 100vh !important;
  }
  
  .favorites-content {
    padding-bottom: 100px !important;
  }
}
```

---

### 4. Sehaj Paath Reader - Font Improvements

**Files to update:**
- `frontend/SehajPaath/reader.html`
- `frontend/SehajPaath/reader.css` (or inline styles)

**Changes:**

Apply same premium fonts as Hukamnama and Nitnem:

```css
:root {
    --font-gurmukhi: 'RiyastiHastlikhat', 'PGMuskan', 'Noto Sans Gurmukhi', 
                     'Gurmukhi MN', 'AnmolLipi', sans-serif;
    --gurmukhi-size: 32px;  /* Increased from 28px */
    --line-height: 2.2;      /* Increased from 1.8 */
}

.verse-gurmukhi,
.gurbani-text {
    font-family: 'RiyastiHastlikhat', 'PGMuskan', 'Noto Sans Gurmukhi', sans-serif;
    font-size: calc(var(--gurmukhi-size) * 1.15);
    line-height: 2.2;
    letter-spacing: 0.02em;
}
```

---

### 5. Gurbani Khoj Shabad Reader - Font Improvements

**File:** `frontend/GurbaniKhoj/shabad-reader.html` (if exists)

Apply same font stack:

```css
.shabad-line,
.gurbani-verse {
    font-family: 'RiyastiHastlikhat', 'PGMuskan', 'Noto Sans Gurmukhi', sans-serif;
    font-size: 32px;
    line-height: 2.2;
    letter-spacing: 0.02em;
}
```

---

## Implementation Steps

### Step 1: Fix Gurbani Khoj Header
```css
/* In gurbani-khoj.css */
.search-section {
    padding-top: calc(var(--nav-h) + var(--safe-top) + 20px);
}
```

### Step 2: Fix Sadhsangat & Favorites Scrolling
```css
/* In desktop-responsive.css - add at end */
@media screen and (min-width: 1024px) {
  /* Sadhsangat scrolling fix */
  body:has(.page-content) {
    overflow-y: auto !important;
  }
  
  .page-content {
    overflow-y: auto !important;
    height: auto !important;
  }
  
  /* Favorites scrolling fix */
  .favorites-app {
    overflow-y: auto !important;
    height: auto !important;
  }
}
```

### Step 3: Copy Sehaj Paath Fonts
Copy font files if not already present:
```
frontend/Hukamnama/RiyastiHastlikhat.ttf 
  → frontend/SehajPaath/fonts/
frontend/Hukamnama/pg_muskan_5.ttf 
  → frontend/SehajPaath/fonts/
```

### Step 4: Update Sehaj Paath CSS
Apply premium font stack with proper sizes and spacing.

---

## Testing Checklist

### Gurbani Khoj
- [ ] Header doesn't overlap search bar
- [ ] Tab navigation positioned correctly
- [ ] Search input is clickable
- [ ] Results scroll properly

### Sadhsangat
- [ ] Page scrolls on desktop
- [ ] Video grid displays properly
- [ ] No overflow issues
- [ ] Content fully accessible

### Favorites
- [ ] Page scrolls properly
- [ ] Cards display correctly
- [ ] No layout issues
- [ ] Desktop responsive

### Sehaj Paath Reader
- [ ] Fonts are beautiful (RiyastiHastlikhat/PGMuskan)
- [ ] Text size is larger (32px+)
- [ ] Line spacing is comfortable (2.2)
- [ ] Readability improved

### Gurbani Khoj Shabad Reader
- [ ] Fonts match other readers
- [ ] Text is readable
- [ ] Proper spacing
- [ ] No overflow

---

## Files to Modify

1. ✅ `frontend/GurbaniKhoj/gurbani-khoj.css`
2. ✅ `frontend/css/desktop-responsive.css`
3. ✅ `frontend/SehajPaath/reader.html`
4. ✅ `frontend/SehajPaath/reader.css` (or create)
5. ✅ `frontend/GurbaniKhoj/shabad-reader.html` (if exists)
6. ✅ `frontend/Favorites/favorites.html`

---

## Priority Order

1. **CRITICAL** - Gurbani Khoj header fix (blocks search)
2. **HIGH** - Sadhsangat scrolling (page unusable)
3. **HIGH** - Favorites page layout
4. **MEDIUM** - Sehaj Paath fonts
5. **MEDIUM** - Gurbani Khoj Shabad Reader fonts

---

## Next Steps

Proceeding with fixes in priority order...
