# ANHAD NITNEM READER — PRE-IMPLEMENTATION AUDIT REPORT

**Date:** December 10, 2026  
**Auditor:** Pre-Implementation Planning Agent  
**Workspace:** `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\frontend\nitnem`  
**Purpose:** Complete technical audit before UI/UX reconstruction to match Apple Books reference

---

## Executive Summary

The ANHAD Nitnem Reader is a sophisticated Gurbani reading application with **extensive functionality** already implemented. The codebase demonstrates advanced features including optical liquid glass effects, multiple reading modes, comprehensive typography controls, theme management, and offline-first architecture. However, the UI presentation does not match the reference Apple Books reading interface provided by the user.

**Key Finding:** This is a **reconstruction task**, not a greenfield project. All core features exist and function. The implementation challenge is to **reorganize the presentation layer** to match the reference design while preserving every existing capability.

---

## 1. Architecture & File Structure

### 1.1 Entry Point
**File:** `reader.html` (565+ lines)

**Structure:**
- **Blocking theme script** in `<head>` prevents FOUC (Flash of Unstyled Content)
  - Line 11-123: Inline JavaScript loads `anhad_theme`, `anhad_reader_v5` settings, applies theme, fonts before paint
  - Sets `data-theme`, `data-theme-mode`, `data-time-of-day` attributes
  - Injects inline `<style id="anhad-font-preload">` with CSS variables
- **Safe-area handling** for iOS notch: `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`
- **Mobile viewport:** `viewport-fit=cover`

### 1.2 Core Source Files

| File | Role | Lines | Key Responsibilities |
|------|------|-------|---------------------|
| `reader.html` | Main entry | 565+ | HTML structure, background layers, settings drawer, end card |
| `reader-engine.js` | Core logic | 1800+ | Bani loading, settings, rendering, modes, persistence |
| `reader-app.js` | Alternate implementation | 700+ | Simpler reader (unused in main flow) |
| `bani-setting-panel.js` | Settings controller | 800+ | Manages settings drawer, optical effects, lens mode |
| `banidb-api.js` | Data layer | 400+ | BaniDB API, offline fallback, chunk loading |
| `bani-metadata.js` | Metadata | N/A | Bani names, icons, estimated times |
| `bani-font-reactivity.js` | Font updates | N/A | Real-time font change propagation |

### 1.3 CSS Architecture

| File | Purpose | Key Features |
|------|---------|--------------|
| `reader.css` | Main styles | 1154+ lines, iOS design system, verse rendering, modes |
| `themes.css` | Theme system | Light/dark themes, optical variables, glass effects |
| `setting-panel.css` | Settings drawer | iOS-style sheet, toggles, sliders |
| `liquid-glass.css` | Visual effects | Optical glass, caustics, refraction, droplet physics |
| `fonts.css` | Font faces | 7 Gurmukhi fonts loaded locally |

### 1.4 External Libraries
**CDN Dependencies:** None visible in main reader  
**Local Libraries:** Referenced in `<script>` tags:
- `../lib/desktop-sidebar.js` (defer)
- `../lib/smart-back.js`
- `../lib/page-lifecycle.js`
- `../lib/smooth-navigation.js`
- `../lib/state-preservation.js`
- `../lib/gurbani-db.js`
- `../lib/bani-cache-optimizer.js`
- `../lib/optimized-image-loader.js`
- `../lib/audio-preload.js`
- `../lib/audio-coordinator.js`
- `../lib/overlay-player.js`
- `../lib/capacitor-notifications-global.js`
- `../lib/anhad-widget-bridge.js`
- `../lib/anhad-audio-singleton.js?v=2.1.5`

### 1.5 CSS Custom Properties Root
**Location:** `themes.css` lines 10-200+

**Key Variables:**
```css
--font-gurmukhi, --font-english, --font-system
--gurmukhi-size, --roman-size, --translation-size (dynamic)
--glass-blur-sm through --glass-blur-2xl (8px-60px)
--light-x, --light-y, --light-intensity (JS-updated)
--scroll-progress, --scroll-velocity, --scroll-glow
--bg-primary, --text-primary, --accent
--color-accent-rgb, --glass-bg, --glass-border
```

---

## 2. Current UI Components & Layout

### 2.1 Header Structure
**File:** `reader.html` lines 134-177

**Components:**
1. **Progress Bar** (`reader-progress`)
   - 2px fixed bar at top
   - Updated by scroll event: `progressBar.style.width`

2. **Reader Header** (`reader-sticky-top-bar` > `reader-header`)
   - Fixed position, never detaches
   - **Back Button** with SVG chevron, text "Banis", `data-anhad-back` attribute
   - **Title** (centered): Gurmukhi + English spans
   - **Action Buttons:** Bookmark, Tick (Nitnem tracker), Settings (gear icon)

3. **Display Toggles** (`reader-toggles`)
   - 4 buttons: ਗੁਰਮੁਖੀ, Roman, English, ਪੰਜਾਬੀ
   - CSS: `position: fixed; top: calc(44px + env(safe-area-inset-top))`
   - Hides on scroll: `.reader-toggles.hidden { transform: translateY(-200%) }`

**Issues Found:**
- Header and toggles can overlap reading content during scroll (CSS transforms may cause z-index issues)
- Multiple visibility states managed by JS scroll handlers

### 2.2 Reading Surface
**Container:** `.reader-content` (max-width: 680px, centered)

**Verse Structure:** (reader.html line 212+, rendered by JS)
```html
<div class="verse">
  <div class="verse-gurmukhi">...</div>
  <div class="verse-roman">...</div>
  <div class="verse-english">...</div>
  <div class="verse-punjabi">...</div>
</div>
```

**CSS Classes for Modes:**
- `.verses-container.continuous-mode` — inline display, paragraph flow
- `.verses-container.paragraph-mode` — paudi detection, double line breaks
- `.verses-container.best-version-mode` — 2 panktis per group
- `.verse.verse-heading` — always centered, accent color
- `.verse.paudi-end` — extra spacing after paudi/rahao markers

**Font Application:**
- CSS variables: `--gurmukhi-size`, `--font-gurmukhi`, `--font-weight`, `--text-align`
- Font classes: `.font-riyasti`, `.font-noto`, `.font-pg-serif` etc. (applied to `<html>`)
- Reactive updates via `bani-font-reactivity.js` custom events

### 2.3 Settings Drawer / Panel
**File:** `reader.html` lines 264-569

**Structure:**
- **Overlay** (`settings-overlay`) — backdrop with blur
- **Drawer** (`settings-drawer`) — iOS-style bottom sheet
  - Handle bar at top
  - Floating close button
  - Header: "ਸੈਟਿੰਗ" + "Reading Preferences"
  - Sections: General, Translation, Transliteration, Appearance, Colors, Font, Data

**UI Pattern:** iOS Settings style
- `.setting-card` wraps multiple `.setting-row`
- `.setting-row` contains label + control (toggle/select/slider)
- `.ios-toggle` for boolean settings (custom iOS switch UI)
- `.setting-divider` between rows

**Animation:**
- Drawer slides in from bottom: `transform: translateY(100%)` → `translateY(0)`
- Backdrop fades in
- Staggered entry for setting groups (0.1s, 0.15s, 0.2s delays)

**Current Issues:**
- Drawer is comprehensive but visually complex
- Does not match reference "Themes & Settings" compact bottom sheet
- Many controls visible simultaneously (overwhelming)

### 2.4 Bottom Controls
**Current State:**
- **Scroll-to-top button** (`.scroll-top`) — floating, bottom-right, appears on scroll
- **No dedicated bottom toolbar** matching reference

**Missing from Reference:**
- Compact bottom toolbar with reading progress, bookmarks, search, themes icons
- Reading options menu (second reference screenshot)

### 2.5 Progress Indicators
1. **Progress Bar** (top, 2px)
2. **Progress Text** (`.progress-text`) — percentage, top-right
3. **Scroll Progress CSS Variable** — `--scroll-progress` updated on scroll

### 2.6 End Card / Completion Screen
**File:** `reader.html` lines 230-253

**Structure:**
```html
<div class="reader-end">
  <div class="end-khanda">☬</div>
  <h2 class="end-gurmukhi">ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ...</h2>
  <p class="end-english">The Khalsa belongs to God...</p>
  <div class="next-bani-container">...</div> <!-- My Pothi feature -->
  <div class="end-actions">
    <button class="end-btn primary">Read Again</button>
    <a href="index.html" class="end-btn secondary">Browse Banis</a>
  </div>
</div>
```

**Features:**
- Animated khanda (☬) with pulse effect
- "Next Bani in My Pothi" section (conditional, when `?from=pothi`)
- Read Again + Browse Banis actions

---

## 3. Theme System

### 3.1 THEMES Definition
**File:** `bani-setting-panel.js` lines 6-8
```javascript
const THEMES = ['dark', 'light', 'sepia', 'paper'];
```

**Implementation:**
- `dark` — Primary dark theme
- `light` — Primary light theme
- `sepia` — Warm sepia tones (defined in variables but not fully distinct UI)
- `paper` — Paper texture background mode

**Note:** Only `dark` and `light` have full theme implementations in `themes.css`. Sepia/paper are partially implemented.

### 3.2 Theme Application
**File:** `reader.html` lines 11-123, `reader-engine.js` lines 1100+

**Mechanism:**
1. **Blocking script** reads `localStorage.getItem('anhad_theme')` or `'auto'`
2. **Auto mode:** Time-based (5am-8pm = light, else dark)
   - Forced time override: `anhad_forced_time_of_day`
   - Sets `data-time-of-day`: morning/day/evening/night
3. **Applies immediately:**
   - `document.documentElement.setAttribute('data-theme', effectiveTheme)`
   - `document.documentElement.setAttribute('data-theme-mode', theme)` (original setting)
   - Sets `document.documentElement.style.colorScheme`
   - Adds `.dark` and `.dark-mode` classes if dark
4. **Background color set** to prevent flash

### 3.3 Theme Persistence
**localStorage Keys:**
- `anhad_theme` — Global theme: 'auto', 'dark', 'light'
- `nitnem_theme_override` — Nitnem-specific override (bani-setting-panel.js line 780)
- `anhad_forced_time_of_day` — Manual time override for auto mode

### 3.4 Theme Flash Prevention
**Techniques:**
1. Inline blocking script before any CSS
2. Sets background color immediately: `document.documentElement.style.backgroundColor`
3. Adds `.theme-loaded` class after setup
4. Injects inline `<style id="anhad-font-preload">` for fonts

**Effectiveness:** Generally successful, but font/size changes can still cause layout shift

### 3.5 Auto Theme Time-Based Logic
**File:** `reader.html` lines 15-30
```javascript
if (theme === 'auto') {
  const hour = new Date().getHours();
  effectiveTheme = (hour >= 5 && hour < 20) ? 'light' : 'dark';
  // morning: 5-9, day: 9-16, evening: 16-20, night: 20-5
}
```

---

## 4. Typography & Font Controls

### 4.1 Font Families Available
**File:** `reader-engine.js` lines 74-82, `fonts.css`

**FONT_MAP:**
```javascript
{
  'noto': "'Noto Sans Gurmukhi', sans-serif",
  'pg-serif': "'PG Serif', 'Noto Sans Gurmukhi', sans-serif",
  'mfjashan': "'MFJashan', 'Noto Sans Gurmukhi', sans-serif",
  'pg-khanna': "'PG Khanna', 'Noto Sans Gurmukhi', sans-serif",
  'pixel-r': "'Pixel R', 'Noto Sans Gurmukhi', sans-serif",
  'riyasti': "'RiyastiHastlikhat', 'Noto Sans Gurmukhi', sans-serif",
  'pg-muskan': "'PGMuskan', 'Noto Sans Gurmukhi', sans-serif"
}
```

**Font Files:** (frontend/nitnem/fonts/)
- `RiyastiHastlikhat.ttf`
- `riyasti-naveen.ttf/woff/woff2`
- `khicho_02.ttf`
- `mffjashan.ttf`
- `pg_serif_r.ttf`, `pg_serif_s.ttf`
- `pg_khanna_c_6.ttf`
- `pixel_r_21.ttf`
- `pg_muskan_5.ttf`
- `pg_bhojanshala_7.ttf`, `pg_thikriwala_1.ttf`

**Display Names:**
```javascript
'noto': 'Gurmukhi Lipi',
'riyasti': 'Riyasti Hastlikhat',
'pg-serif': 'Gurmukhi Font 1', // etc.
```

### 4.2 Font Size Ranges
**File:** `reader-engine.js` lines 21-50 (DEFAULTS)

**Current Defaults:**
- `gurbaniFontSize`: 28px (Gurmukhi)
- `translationSize`: 16px (English/Punjabi translation)
- `translitSize`: 17px (Roman transliteration)

**Per-Font Defaults:** (FONT_SIZES object, lines 85-94)
- Noto: 28px (base)
- Handwritten fonts (riyasti, pg-serif, mfjashan, pg-muskan): **36px** (larger for readability)
- PG Khanna, Pixel R: 34px

**Size Adjustment:**
- Buttons: `-` and `+` in settings drawer
- Step: 2px per click (reader-engine.js function `adjustSize`)
- Min/max limits: Not explicitly defined (should add bounds)

### 4.3 Font Weight & Text Alignment
**Settings:**
- `fontWeight`: '400', '500', '600', '700' (dropdown, reader.html line 576)
- `textAlign`: 'left', 'center', 'right' (dropdown, reader.html line 586)

**Application:**
- CSS variables: `--font-weight`, `--text-align` (reader.html line 77, 86)
- Applied to `.verse-gurmukhi` via `font-weight: var(--font-weight)` (reader.css line 685)
- Best Version mode uses `text-align: var(--text-align, center)` (reader.css line 957)

### 4.4 Color Customization
**File:** `reader-engine.js` lines 60-71 (COLOR_PALETTE)

**Palette:**
```javascript
[
  'currentColor', // 0 - Default
  '#D4AF37',      // 1 - Sacred Gold
  '#8E8E93',      // 2 - iOS Gray
  '#DC2626',      // 3 - Red
  '#F59E0B',      // 4 - Amber
  '#2E8B57',      // 5 - Green
  '#3B82F6',      // 6 - Blue
  '#8B5CF6',      // 7 - Purple
  '#EC4899',      // 8 - Pink
  '#000000',      // 9 - Black
  '#FFFFFF',      // 10 - White
]
```

**Color Settings:**
- `gurmukhiColorIdx`: 0 (default currentColor)
- `translationColorIdx`: 2 (iOS Gray)
- `translitColorIdx`: 2 (iOS Gray)

**Application:**
- CSS variables: `--gurmukhi-text-color`, `--translation-text-color`, `--translit-text-color`
- Set in blocking script (reader.html lines 92-104)
- Color picker modal in settings drawer

### 4.5 Font Application Flow
**Critical Fix Applied:** (reader.html line 57-100, reader-engine.js line 879-891)

1. **Blocking inline style injection** to prevent FOUC
2. **CSS variables set on `:root`**
3. **Font class added to `<html>`**: `html.font-riyasti`, etc.
4. **Reactivity:** `bani-font-reactivity.js` listens for `baniSettingsChanged` event
5. **Immediate reflow** forced after font change (reader-engine.js line 1734)

**Known Issue:** Font changes work but may cause brief layout shift if many verses rendered

---

## 5. Reading Options & Toggles

### 5.1 Complete Settings List
**Source:** `reader-engine.js` DEFAULTS object (lines 21-50)

| Setting | Default | Type | Description |
|---------|---------|------|-------------|
| **General** |
| `wakeLock` | false | boolean | Keep screen awake |
| `larivaar` | false | boolean | Remove spaces between words |
| `larivaarAssist` | false | boolean | Alternate word colors in Larivaar |
| `continuousReading` | false | boolean | Flow text without line breaks |
| `paragraphMode` | false | boolean | Paudi/Rahao spacing |
| `bestVersion` | false | boolean | Line break every 2 panktis |
| `paperBackground` | false | boolean | Paper texture overlay |
| `showVisraams` | false | boolean | Highlight pause markers |
| `showTitles` | true | boolean | Show section headings |
| **Translation** |
| `translationSize` | 16 | number | Translation font size (px) |
| `englishTranslation` | true | boolean | Show English translation |
| `punjabiTranslation` | false | boolean | Show Punjabi translation |
| **Transliteration** |
| `translitSize` | 17 | number | Transliteration font size (px) |
| `englishTranslit` | true | boolean | Show Roman transliteration |
| **Font** |
| `gurbaniFontSize` | 28 | number | Gurmukhi font size (px) |
| `fontFamily` | 'noto' | string | Font family key |
| `fontWeight` | '500' | string | Font weight |
| `textAlign` | 'center' | string | Text alignment |
| **Display Toggles** |
| `showGurmukhi` | true | boolean | Display Gurmukhi text |
| `showRoman` | false | boolean | Display Roman button active |
| `showEnglish` | false | boolean | Display English button active |
| `showPunjabi` | false | boolean | Display Punjabi button active |
| **Backgrounds** |
| `ikonkarTransparency` | 0 | number | Ik Onkar background opacity (0-100) |
| `orbsOpacity` | 0 | number | Light orbs opacity (0-100) |

### 5.2 Settings UI Location
**File:** `reader.html` lines 264-600 (settings drawer)

**Sections in Drawer:**
1. **General** (11 toggles) — lines 279-375
2. **Translation** (size + 2 toggles) — lines 377-405
3. **Transliteration** (size + 1 toggle) — lines 407-426
4. **Appearance** (theme + 2 sliders) — lines 428-483
5. **Colors** (3 color pickers) — lines 485-514
6. **Font** (preview, size, family, weight, align) — lines 516-596
7. **Data** (reset button) — lines 598-614

### 5.3 Toggle Implementation Details

#### Larivaar Mode
**CSS:** `body.larivaar-mode .verse-gurmukhi` (reader.css lines 1000-1010)
```css
word-spacing: -0.25em;
letter-spacing: 0.02em;
word-wrap: break-word !important; /* CRITICAL FIX line 1005 */
```

**Larivaar Assist:**
- Enabled only when Larivaar is on
- Row visibility: `#larivaarAssistRow` shown/hidden by JS
- Effect: `.word-alt` class on alternating words, color set to `--accent`

#### Continuous Reading
**CSS:** `.verses-container.continuous-mode` (reader.css lines 889-929)
- Verses display as `inline`
- Gurmukhi text display as `inline` (paragraph flow)
- Space added between verses via `::after { content: " " }`
- **Headings preserved:** `.verse-heading` forced to `display: block !important`, centered

#### Paragraph Mode
**CSS:** `.verses-container.paragraph-mode` (reader.css lines 931-998)
- Similar to continuous but with **paudi detection**
- `.verse.paudi-end::after { content: "\A\A" }` — double line break
- **Paudi markers:** `॥੧॥`, `॥੨॥`, etc. (Gurmukhi numbers)
- **Rahao detection:** `ਰਹਾਉ` keyword

**Logic:** (reader-engine.js lines 756-772)
```javascript
const paudiPattern = /॥[੦੧੨੩੪੫੬੭੮੯]+॥\s*$/;
const rahaoPattern = /ਰਹਾਉ/;
if (paudiPattern.test(parsed.gurmukhi) || rahaoPattern.test(parsed.gurmukhi)) {
  el.classList.add('paudi-end');
}
```

#### Best Version Mode
**CSS:** `.verses-container.best-version-mode` (reader.css lines 945-998)
- Each verse is `display: block`
- Line break after every verse (each pankti separate)
- Extra spacing after every 2nd verse: `:nth-child(2n) { margin-bottom: 16px }`
- Uses `text-align: var(--text-align, center)` (respects user setting)

#### Paper Background
**Element:** `.paper-background` (reader.html line 126)
- Fixed overlay with paper texture
- Background image: `url('image.png')` + generated SVG noise (reader.css lines 417-443)
- Toggled via `.paper-background.visible { opacity: 1 }`
- **Text color override:** `.reader-app.paper-active .verse-gurmukhi { color: #000 !important }` (reader.css line 354)

#### Visraams (Pauses)
**Status:** Toggle exists but implementation incomplete
- `showVisraams` setting in DEFAULTS
- No visible highlighting logic in renderer
- Color settings exist: `longVisraamColor`, `shortVisraamColor` (referenced but not applied)

---

## 6. Visual Effects & Advanced Features

### 6.1 Optical Liquid Glass Physics
**File:** `liquid-glass.css` (500+ lines), CSS variables in `themes.css`

**Core System:**
- **Glass blur:** 8px-60px (`--glass-blur-sm` through `--glass-blur-2xl`)
- **Refraction offsets:** `--refract-x`, `--refract-y` (updated by JS)
- **Light source tracking:** `--light-x`, `--light-y`, `--light-intensity`
- **Scroll-linked:** `--scroll-progress`, `--scroll-velocity`, `--scroll-glow`

**Visual Layers:**
1. **Liquid orbs** (`.liquid-orb--1` through `--4`) — animated gradient orbs
2. **Caustic overlay** — radial gradient following light source
3. **Droplet effects** — glass panels with `::before`/`::after` pseudo-elements
4. **Chromatic aberration** — red/blue edge coloring based on `--edge-chroma`

**Application:**
- Settings drawer: `backdrop-filter: blur(var(--glass-blur-xl))`
- Cards, buttons: `.glass-panel`, `.glass-card` classes
- Refraction transforms updated on scroll/mousemove

**Performance Concern:** Heavy blur + animations may impact low-end devices

### 6.2 Lens Mode and LensEngine
**Reference:** `bani-setting-panel.js` lines 180, settings object

**Status:** **Toggle exists but LensEngine not found in audited files**
- `lensMode` setting stored
- No `LensEngine` class or implementation visible in reader-engine.js
- May be in separate file not yet audited, or planned feature

**Expected Behavior:** Magnification lens following cursor/touch (based on setting name)

### 6.3 Background Elements

#### Ik Onkar Background
**Element:** `.ikonkar-background` (reader.html line 111)
```html
<div class="ikonkar-background" id="ikonkarBackground">
  <img src="../assets/icons/bg-nitnem.jpg" alt="Background" />
</div>
```

**Control:**
- Slider in settings: "Ik Onkar Background" transparency (0-100%)
- **Default:** 0% (off)
- Applied via `opacity` style (reader-engine.js lines 967-990)
- **Issue:** Image path `../assets/icons/bg-nitnem.jpg` — error handler logs if missing (line 985)

#### Light Orbs
**Element:** `.bg-orbs` container with `.orb-1`, `.orb-2`, `.orb-3` (reader.html lines 105-109)

**Control:**
- Slider in settings: "Light Orbs Background" opacity (0-100%)
- **Default:** 0% (off)
- Applied via `.bg-orbs { opacity: ... }` (reader-engine.js lines 1026-1051)

**Dynamic Colors:** (reader.html lines 599-663)
- Scroll-based color transitions in dark mode
- 5 color palettes: gold/orange, warm tones, pink/purple, blue/pink, purple/gold
- Updated on scroll with `requestAnimationFrame` throttling
- **Performance optimization:** Skip updates during fast scroll, batch opacity changes

**Color Palettes:**
```javascript
const darkThemeColors = [
  { orb1: 'conic-gradient(from 0deg, #D4AF37, #FF8C00, #FFD700, #D4AF37)', ... },
  { orb1: 'conic-gradient(from 45deg, #FF6B6B, #FF8E53, #FED766, #FF6B6B)', ... },
  // ... 3 more palettes
];
```

### 6.4 Ripple Effects
**File:** `liquid-glass.css` lines 320-348

**Implementation:**
- `.droplet-ripple` class
- Animated on touch/click (presumably via JS event)
- Scales from 0 to 1, fades out
- `mix-blend-mode: screen` for light effect

**Status:** CSS exists but JS trigger not seen in audit

### 6.5 OpticalEngine
**Reference:** CSS variables `--glass-glow`, `--edge-chroma`, `--ui-motion` (themes.css lines 45-50)

**Purpose:** Light tracking and scroll velocity effects
- Updates `--light-x`, `--light-y` based on cursor position
- `--scroll-glow` intensity increases with scroll velocity
- Used in glass panel `::after` pseudo-elements for dynamic shine

**Implementation:** Likely in `bani-setting-panel.js` or separate optical engine file (not fully audited)

---

## 7. State Management & Persistence

### 7.1 localStorage Keys

**Reader Settings:**
- `anhad_reader_v5` — **Primary settings object** (reader-engine.js line 60)
  - Stores: all font, size, color, mode, toggle settings
  - JSON stringified object

**Theme Settings:**
- `anhad_theme` — Global theme: 'auto', 'dark', 'light'
- `nitnem_theme_override` — Nitnem-specific theme override (bani-setting-panel.js)
- `anhad_forced_time_of_day` — Manual time of day for auto mode

**Legacy Keys:**
- `baniSettings` — Older settings format (bani-setting-panel.js line 678)
- `baniReader_settings` — reader-app.js settings (alternate implementation)

**Navigation & State:**
- `anhad_my_pothi` — User's custom Bani order (JSON array of IDs)
- `gurbaniKhoj_state` — Search state (cleared on home, reader.html line 122)

**Nitnem Tracker:**
- `nitnem_tracker` — Completion state (reader-engine.js lines 1540-1590)
  - Format: `{ [dateString]: { [baniId]: boolean } }`
  - Example: `{ "2026-12-10": { "2": true, "4": true } }`

**Cache:**
- IndexedDB used by `baniCacheOptimizer` (referenced, details not in audit scope)
- `gurbaniLocalDB` stores Bani verses offline

### 7.2 Cross-Tab Synchronization
**File:** `bani-setting-panel.js` lines 719-752

**Mechanism:**
```javascript
window.addEventListener('storage', function(e) {
  if (e.key === 'baniSettings' && e.newValue) {
    const newSettings = JSON.parse(e.newValue);
    // Merge and apply
    applySettings();
  }
});
```

**Scope:** Settings changes in one Bani tab reflect in all open tabs
**Custom Event:** `baniSettingsChanged` dispatched for instant font updates (line 183)

### 7.3 Reading Position Restoration
**Status:** **Not explicitly implemented in audited code**
- No `scrollTop` persistence found in localStorage keys
- No `IntersectionObserver` for verse tracking
- User must scroll manually on reload

**Recommendation:** Add scroll position save/restore keyed by `baniId`

### 7.4 Bookmark State
**Implementation:** (reader-engine.js lines 1512-1538)
- Storage key: `anhad_bookmarks` (JSON array of baniId integers)
- Button state: `.reader-btn.active` class, fill/stroke color change
- Toggle via bookmark button click

### 7.5 Completion State (Nitnem Tracker)
**Implementation:** (reader-engine.js lines 1540-1590)
- Storage key: `nitnem_tracker`
- Format: `{ [YYYY-MM-DD]: { [baniId]: true/false } }`
- Tick button updates state, changes to green checkmark when ticked
- Checked on load: `checkNitnemTick()` function

---

## 8. Navigation & Integration Points

### 8.1 Entry from Index
**URL Pattern:** `reader.html?id=<baniId>&from=<source>`

**Parameters:**
- `id` — **Required** Bani ID (integer) from BaniDB
- `from` — Optional source context
  - `from=pothi` — Came from My Pothi feature
  - Triggers "Next Bani" UI (reader.html lines 244-251)

**Parsing:** (reader-engine.js lines 260-265)
```javascript
const params = new URLSearchParams(window.location.search);
state.baniId = parseInt(params.get('id'), 10);
state.isFromPothi = params.get('from') === 'pothi';
```

### 8.2 Back Button Behavior
**Element:** `<a class="reader-back" data-anhad-back="index.html">` (reader.html line 136)

**Attributes:**
- `href="index.html"` — Fallback
- `data-anhad-back` — Smart back target
- Handled by `smart-back.js` library (loads defer)

**Expected Behavior:**
- If history exists: browser back
- Else: Navigate to index.html

### 8.3 Smart Navigation Libraries
**Files:** (reader.html lines 127-131)
1. `smart-back.js` — Intelligent back button
2. `page-lifecycle.js` — Page visibility, freeze/resume handling
3. `smooth-navigation.js` — View transitions
4. `state-preservation.js` — Preserve scroll/state across navigation

**Integration:** Scripts loaded but usage not visible in reader-engine.js audit

### 8.4 Next Bani in My Pothi
**Feature:** (reader-engine.js lines 423-467, reader.html lines 244-251)

**Flow:**
1. Check `state.isFromPothi` (URL param `from=pothi`)
2. Load `anhad_my_pothi` from localStorage (JSON array of Bani IDs)
3. Find current Bani's index in array
4. Get next Bani ID
5. Look up metadata from `ALL_BANIS_LOOKUP` (hardcoded array, lines 429-461)
6. Display in end card:
   ```html
   <div class="next-bani-container">
     <span class="next-bani-icon">▶</span>
     <span class="next-bani-name">ਜਾਪੁ ਸਾਹਿਬ</span>
   </div>
   ```

**Navigation:** Clicking navigates to `reader.html?id=<nextId>&from=pothi`

### 8.5 Bookmark Button
**Function:** (reader-engine.js lines 1512-1538)
- Toggles Bani ID in `anhad_bookmarks` array
- Updates button visual state (filled icon)
- No navigation, purely state management

### 8.6 Tick Button (Mark Complete)
**Function:** (reader-engine.js lines 1540-1590)
- Marks Bani as read today in Nitnem Tracker
- Updates daily progress (used in stats/streak features elsewhere)
- Button turns green when ticked

---

## 9. Content Rendering

### 9.1 Verse Container Structure
**Rendered Output:** (reader-engine.js `createVerseElement`, lines 756-860)

```html
<div class="verse" data-verse-id="123" style="animation-delay: 0.05s">
  <div class="verse-gurmukhi">ਜਪੁਜੀ ਸਾਹਿਬ</div>
  <div class="verse-roman hidden">Japji Sahib</div>
  <div class="verse-english hidden">Japji Sahib Ji</div>
  <div class="verse-punjabi hidden">ਜਪੁਜੀ ਸਾਹਿਬ</div>
</div>
```

**Classes:**
- `.verse` — Container
- `.verse-heading` — Section title (centered, accent color)
- `.paudi-end` — Paudi/Rahao marker (extra spacing in paragraph mode)
- `.hidden` — Toggle visibility

### 9.2 Multi-Script Rendering Pipeline
**Source:** `reader-engine.js` `parseVerse` function (lines 601-660)

**Data Flow:**
1. **Input:** `verseData` object from BaniDB API or cache
   ```javascript
   {
     verse: { verse: "...", header: "..." },
     transliteration: { english: "..." },
     translation: { en: { bdb: "..." }, pu: { ss: "..." } },
     visraam: [...]
   }
   ```

2. **Extract Gurmukhi:**
   - Path: `verse.verse.unicode` OR `verse.verse` OR `verseData.verse` (multiple fallbacks)
   - **Cleanup:** `cleanupCorruptedText()` function (lines 662-705)
     - Removes `\uFFFD` replacement characters
     - Fixes spacing after `॥` (double danda)
     - Removes zero-width characters

3. **Extract Roman:** `transliteration.english` OR `transliteration.en`

4. **Extract English Translation:**
   - Path: `translation.en.bdb` OR `.ms` OR `.ssk` (multiple sources, prioritized)

5. **Extract Punjabi Translation:**
   - Path: `translation.pu.ss` OR `.bdb` OR `.ms` OR `.ft`
   - Handles both string and object formats

6. **Return:** `{ gurmukhi, roman, english, punjabi, visraam }`

### 9.3 Line-Break and Paragraph Formatting
**Handled by CSS modes** (see §5.3 above)

**Key Techniques:**
- **Continuous:** `display: inline`, `::after { content: " " }`
- **Paragraph:** `display: inline` + `.paudi-end::after { content: "\A\A" }`
- **Best Version:** `display: block`, `:nth-child(2n) { margin-bottom: 16px }`
- **Headings:** Always `display: block !important`, `text-align: center !important`

### 9.4 Visraam Highlighting
**Status:** **Not implemented**
- `showVisraams` toggle exists in settings
- `visraam` data extracted from API (`parseVerse` line 659)
- **No rendering logic** to apply highlighting

**Expected Visraam Data Structure:**
```javascript
visraam: [
  { p: 0, t: "v" }, // main pause at position 0
  { p: 5, t: "y" }  // yamki pause at position 5
]
```

**Recommendation:** Implement by wrapping Gurmukhi characters at pause positions with `<span class="visraam-v">` or `.visraam-y`

### 9.5 Section Title Rendering
**Function:** `createSectionDivider` (reader-engine.js lines 862-872)

**Output:**
```html
<div class="section-divider">
  <span>ਛੰਦ</span>
</div>
```

**Trigger:**
- `meta.showChhandType` (Bani metadata flag)
- `state.settings.showTitles` (user toggle)
- `verseData.header` changes (new section detected)

**CSS:** Pill-shaped label with background (reader.css lines 1013-1037)

---

## 10. Known Issues & Instabilities

### 10.1 Duplicate Controls / Conflicting State
**Issue:** Two reader implementations in codebase
- `reader-engine.js` (1800+ lines) — **Active implementation**
- `reader-app.js` (700 lines) — Alternate/older implementation, not loaded in reader.html

**Risk:** Confusion during refactoring. Verify `reader-app.js` is unused before deletion.

### 10.2 Modal/Drawer Reliability
**Settings Drawer:**
- Opens: `settingsDrawer.classList.add('visible')` (reader-engine.js line 1667)
- Closes: Multiple triggers (close button, overlay click, Escape key)
- **Potential Issue:** Multiple event handlers, no explicit state lock
- **Risk:** Rapid clicks could trigger multiple animations or state conflicts

**Color Picker Modal:**
- Separate modal system (`colorPickerModal`, reader.html lines 621-628)
- Opens when color circle clicked
- **Not audited in detail** — possible Z-index or overlay conflicts

**Recommendation:** Consolidate modal logic into single manager with state machine

### 10.3 Scroll Position Preservation
**Issue:** Font size changes trigger layout reflow
- **Behavior:** User scrolled to verse 50, increases font size, scroll position jumps
- **Current Fix:** `applyFontToVerses()` called after font change (reader-engine.js line 1734)
- **Better Solution:** Save current verse ID in view, re-scroll to it after reflow

**Code Location:** `adjustSize` function (reader-engine.js lines 1695-1742)

### 10.4 Theme Flash
**Severity:** Low (mostly mitigated)
- Blocking script prevents most FOUC
- **Residual flash:** Font loading if web fonts not cached
- **Paper mode flash:** Background image loads async (reader-engine.js line 985)

**Recommendation:**
- Preload critical fonts in `<head>`
- Use `font-display: swap` for Gurmukhi fonts
- Inline small data-URI for paper texture

### 10.5 Safe-Area Handling
**iOS Notch:**
- Header padding: `padding-top: env(safe-area-inset-top, 0)` (reader.html line 138)
- Scroll-top button: `bottom: calc(24px + env(safe-area-inset-bottom, 0))` (reader.css line 1094)

**Android Navigation Bars:**
- Not explicitly handled beyond viewport-fit=cover
- **Risk:** Content hidden behind gesture navigation bars

**Recommendation:** Add `padding-bottom: env(safe-area-inset-bottom)` to `.reader-content`

### 10.6 TODOs, FIXMEs, Critical Fixes in Code

**grep results summary:**
1. **CRITICAL FIX: Font Reactivity** (8 occurrences)
   - Inline font preload to prevent FOUC (reader.html line 57, 79)
   - Word wrapping for Larivaar mode (reader.css line 674)
   - Text-align CSS variable for Best Version (reader.css line 955, reader-engine.js line 881)
   - Force style reflow on font change (reader-engine.js line 1734)

2. **Text Cleanup** (reader-engine.js line 618)
   - `cleanupCorruptedText()` function to fix encoding issues

3. **Background Image Error Handling** (reader-engine.js line 967)
   - Sets opacity directly to avoid style conflicts

**No open TODOs** found — all are marked as fixes already applied.

### 10.7 Console Errors & Warnings

**error() calls:**
- BaniDB load failures (banidb-api.js lines 61, 78, 95, 115, 276)
- Bani not found in offline data (banidb-api.js line 276)
- Hukamnama not available offline (banidb-api.js line 362, warning)
- Load failures in reader-engine.js (line 381)
- Ik Onkar image not found (line 985)
- Nitnem tick errors (lines 1563, 1587)

**warn() calls:**
- Settings save/load failures (bani-setting-panel.js lines 681, 706, 742)
- Unknown size target (line 757)
- Unknown theme (line 793)
- Cache failures (reader-engine.js line 301)
- API failures (line 345)
- Wake Lock not supported (reader-app.js line 476)
- Various localStorage failures

**Assessment:** Error handling is robust with try/catch blocks and fallbacks.

---

## 11. Recommendations for Reconstruction

### 11.1 What Can Be Preserved As-Is

**Keep unchanged:**
1. **Data layer** — `banidb-api.js`, offline cache, BaniDB integration
2. **Content rendering** — Verse parsing, multi-script extraction, text cleanup
3. **Reading modes** — Continuous, Paragraph, Best Version CSS implementations
4. **Font system** — Font loading, CSS variable architecture, font reactivity
5. **Theme system** — Blocking script, auto time-based switching, persistence
6. **State management** — localStorage keys, bookmark/tick functionality
7. **Navigation** — Smart back, My Pothi integration, URL parameters
8. **Background effects** — Orbs, Ik Onkar, paper texture (move controls to new UI)

**Rationale:** These systems work well and changing them introduces risk.

### 11.2 What Needs Refactoring

**Refactor (preserve functionality, change presentation):**

1. **Settings Drawer Structure**
   - **Current:** Comprehensive iOS sheet with 7 sections, 30+ controls
   - **Target:** Compact "Themes & Settings" sheet matching reference screenshot #3
   - **Approach:**
     - Create new compact UI with font size (+/- buttons), display toggles, theme selector
     - Move advanced settings to separate "Advanced" button/screen
     - Keep all `applySettings()` logic intact, only change UI controls

2. **Header & Toolbar**
   - **Current:** Fixed header + separate toggle bar
   - **Target:** Minimal centered title, bottom toolbar with icons
   - **Approach:**
     - Simplify top header to: back button, title, essential actions only
     - Create new bottom toolbar component (sticky at bottom)
     - Move reading options to bottom menu (reference screenshot #2)

3. **Reading Options Menu**
   - **Current:** Scattered in settings drawer
   - **Target:** Dedicated bottom menu (reference screenshot #2)
   - **Approach:**
     - New component: reading progress, bookmarks, search, themes & settings
     - Each opens respective interface
     - Keep existing bookmark/progress logic, wrap in new UI

4. **Display Toggles**
   - **Current:** Fixed bar below header
   - **Target:** Part of reading options menu or compact settings
   - **Approach:**
     - Remove from top area (reduces clutter)
     - Add to compact settings sheet or menu
     - Keep toggle logic (`updateDisplayVisibility()`) unchanged

### 11.3 What Should Be Replaced

**Replace entirely:**

1. **Settings Drawer HTML** (reader.html lines 264-620)
   - Structure too complex for reference design
   - Create new compact sheet HTML
   - **Port all control event handlers** to new elements

2. **Visual Effects Toggle UI**
   - Orb opacity, Ik Onkar transparency sliders currently in settings
   - Move to "Advanced" or remove from primary UI (rarely changed)

3. **Progress Indicators**
   - Current: Top bar + percentage text
   - Reference: Subtle, integrated into reading experience
   - Replace with bottom-integrated progress

### 11.4 Risk Areas Requiring Careful Handling

**High-Risk Changes:**

1. **CSS Mode Classes**
   - `.verses-container.continuous-mode`, `.paragraph-mode`, `.best-version-mode`
   - **Risk:** Changing these breaks reading modes
   - **Mitigation:** DO NOT rename classes, only adjust surrounding UI

2. **Font CSS Variables**
   - `--gurmukhi-size`, `--font-gurmukhi`, `--font-weight`, `--text-align`
   - **Risk:** Breaking font reactivity system
   - **Mitigation:** Keep variable names unchanged, test font picker extensively

3. **Theme Blocking Script**
   - Inline script in `<head>` (reader.html lines 11-123)
   - **Risk:** Moving/changing causes FOUC
   - **Mitigation:** Leave inline blocking script untouched, only adjust theme UI controls

4. **localStorage Keys**
   - `anhad_reader_v5`, `anhad_theme`, `anhad_my_pothi`, `nitnem_tracker`
   - **Risk:** Changing keys breaks existing user settings
   - **Mitigation:** NEVER rename keys, add migration if structure changes

5. **Scroll Event Performance**
   - Orb animations, progress updates on scroll (reader.html lines 599-663, reader-engine.js)
   - **Risk:** Adding more scroll listeners degrades performance
   - **Mitigation:** Consolidate scroll handlers, use `requestAnimationFrame`, `passive: true`

6. **Modal Z-Index Stacking**
   - Settings drawer, color picker, future search modal
   - **Risk:** Overlapping modals, backdrop conflicts
   - **Mitigation:** Define clear Z-index scale, single modal manager

### 11.5 Testing Checklist for Reconstruction

**Critical Functionality to Verify:**

- [ ] Theme switches correctly (auto, light, dark)
- [ ] No FOUC on page load (theme + fonts)
- [ ] Font changes apply immediately to all verses
- [ ] Font size changes preserve scroll position
- [ ] All reading modes work (Continuous, Paragraph, Best Version, Larivaar)
- [ ] Display toggles (Gurmukhi, Roman, English, Punjabi) show/hide correctly
- [ ] Settings persist across page reload
- [ ] Settings sync across tabs (storage event)
- [ ] Bookmark/Tick state saves and loads
- [ ] Next Bani in My Pothi displays when `?from=pothi`
- [ ] Back button navigates correctly
- [ ] Scroll progress updates smoothly
- [ ] Safe-area insets work on iOS notch devices
- [ ] Paper mode activates without flash
- [ ] Orb animations don't cause jank
- [ ] Gurmukhi text wraps correctly in Larivaar mode
- [ ] Section headings always centered in all modes
- [ ] End card appears after last verse
- [ ] Offline loading works (cache fallback)

### 11.6 Recommended Implementation Order

**Phase 1: Preparation (No UI Changes)**
1. Document all settings → UI control mappings
2. Extract reusable functions (applySettings, updateVisibility, etc.)
3. Create component map (what moves where)
4. Set up test Banis (short Bani for fast iteration, long Bani for scroll tests)

**Phase 2: Bottom-Up Reconstruction**
1. Create new bottom toolbar component (HTML + CSS)
2. Build compact "Themes & Settings" sheet (reference #3)
3. Connect font size controls to existing `adjustSize()` function
4. Connect theme selector to existing `setTheme()` function
5. Test: Font and theme changes work

**Phase 3: Reading Options Menu**
1. Create reading options menu component (reference #2)
2. Move bookmark, progress, search placeholders
3. Wire settings menu to open compact sheet
4. Test: Menu opens/closes reliably

**Phase 4: Header Simplification**
1. Simplify top header (back, title only)
2. Remove old toggle bar
3. Adjust safe-area padding
4. Test: Header doesn't overlap content

**Phase 5: Integration & Polish**
1. Move display toggles to new location
2. Add search interface (new feature)
3. Adjust spacing, typography, transitions
4. Test: All features work, no regressions

**Phase 6: Advanced Settings (Optional)**
1. Create "Advanced Settings" screen
2. Move Orb/Ik Onkar sliders, visual effects
3. Test: Settings accessible but not cluttering main UI

**Phase 7: Verification**
1. Run full testing checklist (§11.5)
2. Test on iOS Safari, Android Chrome
3. Test with screen reader (accessibility)
4. Performance audit (Lighthouse)

---

## 12. Summary of Findings

### Architecture Strengths
✅ **Offline-first design** with IndexedDB caching  
✅ **Robust data layer** with multiple fallbacks (API → cache → local data)  
✅ **Comprehensive settings system** with localStorage persistence  
✅ **Theme flash prevention** via blocking inline script  
✅ **Font reactivity system** with instant updates across verses  
✅ **Multiple reading modes** (Continuous, Paragraph, Best Version)  
✅ **Cross-tab sync** via storage events  
✅ **Safe-area handling** for iOS notch  

### Architecture Weaknesses
⚠️ **No scroll position restoration** (user loses place on reload)  
⚠️ **Two reader implementations** (reader-engine.js active, reader-app.js unused)  
⚠️ **Modal management fragmented** (settings drawer, color picker separate)  
⚠️ **Visraam highlighting not implemented** (toggle exists, no effect)  
⚠️ **LensEngine referenced but not found** (incomplete feature)  
⚠️ **Heavy visual effects** may impact performance on low-end devices  

### UI/UX Mismatch with Reference
❌ **Settings drawer too complex** (7 sections, 30+ controls vs. compact sheet)  
❌ **No bottom toolbar** (reference has minimal icons)  
❌ **No reading options menu** (reference screenshot #2 missing)  
❌ **Display toggles in wrong location** (top bar vs. integrated)  
❌ **Progress indicators not matching** (top bar vs. bottom integrated)  
❌ **Header has too many elements** (reference: minimal centered title)  

### Critical Preservation Requirements
🔒 **Do not rename localStorage keys** — breaks existing user data  
🔒 **Do not change CSS mode classes** — breaks reading modes  
🔒 **Do not move theme blocking script** — causes FOUC  
🔒 **Do not alter font CSS variables** — breaks reactivity  
🔒 **Do not change data layer APIs** — breaks offline functionality  

### Recommended Approach
1. **Keep data layer, settings logic, and mode implementations unchanged**
2. **Replace settings drawer HTML** with compact sheet matching reference #3
3. **Add bottom toolbar** with reading options menu (reference #2)
4. **Simplify header** to minimal back + title + essentials
5. **Port all event handlers** from old controls to new controls
6. **Test extensively** — verify no feature loss

---

## Appendix: File Reference Index

### HTML Files
- `reader.html` — Main entry (565+ lines)
- `japji-sahib.html`, `jaap-sahib.html`, etc. — Individual Bani pages (similar structure)
- `index.html` — Bani library/hub
- `my-pothi.html` — Custom Pothi builder

### JavaScript Files
- `reader-engine.js` — Core reader logic (1800+ lines)
- `reader-app.js` — Alternate reader (unused, 700 lines)
- `bani-setting-panel.js` — Settings controller (800 lines)
- `banidb-api.js` — Data API (400 lines)
- `bani-metadata.js` — Bani metadata lookup
- `bani-font-reactivity.js` — Font update propagation
- `hub-app.js` — Index page logic
- `local-bani-data.js`, `offline-bani-data.js` — Offline fallback data

### CSS Files
- `reader.css` — Main styles (1154+ lines)
- `themes.css` — Theme variables & dark mode
- `setting-panel.css` — Settings drawer styles
- `liquid-glass.css` — Optical effects (500+ lines)
- `fonts.css` — @font-face declarations
- `main.css`, `hub.css`, `nitnem.css` — Other module styles

### Library Files (../lib/)
- `smart-back.js`, `page-lifecycle.js`, `smooth-navigation.js`, `state-preservation.js`
- `gurbani-db.js`, `bani-cache-optimizer.js`, `optimized-image-loader.js`
- `audio-preload.js`, `audio-coordinator.js`, `overlay-player.js`, `anhad-audio-singleton.js`
- `desktop-sidebar.js`, `capacitor-notifications-global.js`, `anhad-widget-bridge.js`

---

**End of Audit Report**
