# NITNEM READER UI/UX RECONSTRUCTION — IMPLEMENTATION PLAN

**Date:** December 2026  
**Workspace:** `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\frontend\nitnem`  
**Audit Reference:** `.agents/tasks/nitnem-reader-audit/AUDIT_REPORT.md`

---

## MISSION SUMMARY

Transform the ANHAD Nitnem Reader UI to match Apple Books reference design while preserving all existing functionality. This is a **presentation-layer reconstruction**, not a feature rebuild.

**Three Target States:**
1. **STATE A** — Clean reading surface with minimal header and bottom toolbar
2. **STATE B** — Reader Options Menu (compact bottom sheet with navigation)
3. **STATE C** — Themes & Settings Sheet (font size controls, display toggles, theme selector)

**Key Constraint:** Zero data loss, zero functionality removal. All 30+ existing settings must remain accessible.

---

## CRITICAL PRESERVATION CHECKLIST

### DO NOT MODIFY

- ✅ Theme blocking script (reader.html lines 11-123)
- ✅ localStorage keys: `anhad_reader_v5`, `anhad_theme`, `anhad_my_pothi`, `nitnem_tracker`, `anhad_bookmarks`
- ✅ CSS mode classes: `.continuous-mode`, `.paragraph-mode`, `.best-version-mode`
- ✅ CSS variables: `--gurmukhi-size`, `--font-gurmukhi`, `--font-weight`, `--text-align`
- ✅ Data layer: `banidb-api.js`, `BaniDB.getBani()`, cache system
- ✅ Core functions: `applySettings()`, `loadSettings()`, `saveSettings()`, `adjustSize()`, `toggleDisplay()`
- ✅ Reading modes: Larivaar, Larivaar Assist, Continuous, Paragraph, Best Version, Paper Background
- ✅ Integration points: My Pothi end card, Nitnem Tracker tick button, bookmark system, smart-back navigation

---

## Z-INDEX ARCHITECTURE

Define in new file `frontend/nitnem/css/z-index-scale.css`:

```css
:root {
  /* Reading surface and content */
  --z-reading-surface: 1;
  --z-verses: 10;
  
  /* Fixed UI chrome */
  --z-header: 7000;
  --z-progress-bar: 7500;
  
  /* Bottom toolbar and sheets */
  --z-bottom-toolbar: 8000;
  --z-sheets-backdrop: 8500;
  --z-compact-settings: 9000;
  --z-reading-options-menu: 9000;
  --z-advanced-settings: 9500;
  
  /* Modals and overlays */
  --z-modals: 10000;
  --z-loading: 10500;
}
```

**Rationale:** Clear stacking hierarchy prevents modal conflicts. Sheets at same level (9000) because only one opens at a time via state machine.

---

## IMPLEMENTATION STEPS

### PHASE 1: FOUNDATION (New Files)

#### Step 1.1 — Create Z-Index Scale CSS
**What:** Define CSS custom properties for z-index hierarchy  
**Files to create:**
- `frontend/nitnem/css/z-index-scale.css`

**Content:**
```css
/* Z-Index Stacking Scale for Reader UI
 * Applied hierarchically to prevent modal conflicts
 */
:root {
  --z-reading-surface: 1;
  --z-verses: 10;
  --z-background-effects: 5;
  --z-header: 7000;
  --z-progress-bar: 7500;
  --z-bottom-toolbar: 8000;
  --z-sheets-backdrop: 8500;
  --z-compact-settings: 9000;
  --z-reading-options-menu: 9000;
  --z-advanced-settings: 9500;
  --z-modals: 10000;
  --z-loading: 10500;
}
```

**Verify:** Include in reader.html `<head>` after themes.css, before reader.css. Inspect in DevTools that variables are set on `:root`.

---

#### Step 1.2 — Create Compact Settings Sheet HTML Structure
**What:** Build the Themes & Settings bottom sheet (STATE C) HTML without wiring  
**Files to create:**
- `frontend/nitnem/css/compact-settings.css`

**Add to reader.html after line 263** (before existing settings drawer):

```html
<!-- Compact Themes & Settings Sheet (STATE C) -->
<div class="compact-settings-backdrop" id="compactSettingsBackdrop"></div>
<div class="compact-settings-sheet" id="compactSettingsSheet">
  <!-- Drag Handle -->
  <div class="sheet-handle"></div>
  
  <!-- Header -->
  <div class="sheet-header">
    <h2 class="sheet-title">Display & Appearance</h2>
    <button class="sheet-close-btn" id="compactSettingsCloseBtn" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
  
  <!-- Font Size Controls -->
  <div class="sheet-section">
    <div class="font-size-control">
      <button class="font-size-btn" id="fontSizeDecreaseBtn" aria-label="Decrease font size">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <text x="3" y="18" font-size="16" fill="currentColor">A</text>
        </svg>
      </button>
      <span class="font-size-display" id="fontSizeDisplay">28</span>
      <button class="font-size-btn" id="fontSizeIncreaseBtn" aria-label="Increase font size">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <text x="1" y="20" font-size="20" font-weight="600" fill="currentColor">A</text>
        </svg>
      </button>
    </div>
  </div>
  
  <!-- Display Toggles -->
  <div class="sheet-section">
    <h3 class="sheet-section-title">Display</h3>
    <div class="display-toggles-compact">
      <button class="display-toggle-btn active" id="compactToggleGurmukhi" data-lang="gurmukhi">
        <span class="toggle-label">ਗੁਰਮੁਖੀ</span>
      </button>
      <button class="display-toggle-btn" id="compactToggleRoman" data-lang="roman">
        <span class="toggle-label">Roman</span>
      </button>
      <button class="display-toggle-btn" id="compactToggleEnglish" data-lang="english">
        <span class="toggle-label">English</span>
      </button>
      <button class="display-toggle-btn" id="compactTogglePunjabi" data-lang="punjabi">
        <span class="toggle-label">ਪੰਜਾਬੀ</span>
      </button>
    </div>
  </div>
  
  <!-- Theme Selector -->
  <div class="sheet-section">
    <h3 class="sheet-section-title">Theme</h3>
    <div class="theme-selector-grid">
      <button class="theme-card active" id="themeAutoBtn" data-theme="auto">
        <div class="theme-preview theme-preview-auto">
          <span class="preview-text">Aa</span>
        </div>
        <span class="theme-label">Auto</span>
      </button>
      <button class="theme-card" id="themeLightBtn" data-theme="light">
        <div class="theme-preview theme-preview-light">
          <span class="preview-text">Aa</span>
        </div>
        <span class="theme-label">Light</span>
      </button>
      <button class="theme-card" id="themeDarkBtn" data-theme="dark">
        <div class="theme-preview theme-preview-dark">
          <span class="preview-text">Aa</span>
        </div>
        <span class="theme-label">Dark</span>
      </button>
      <button class="theme-card" id="themePaperBtn" data-theme="paper">
        <div class="theme-preview theme-preview-paper">
          <span class="preview-text">Aa</span>
        </div>
        <span class="theme-label">Paper</span>
      </button>
    </div>
  </div>
  
  <!-- Advanced Options Link -->
  <div class="sheet-section">
    <button class="advanced-options-btn" id="advancedOptionsBtn">
      <span>Advanced Reading Options</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  </div>
</div>
```

**CSS file** (`frontend/nitnem/css/compact-settings.css`):

```css
/* ═══════════════════════════════════════════════════════════════
   COMPACT THEMES & SETTINGS SHEET (STATE C)
   ═══════════════════════════════════════════════════════════════ */

/* Backdrop */
.compact-settings-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: var(--z-sheets-backdrop);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.compact-settings-backdrop.visible {
  opacity: 1;
  visibility: visible;
}

/* Sheet Container */
.compact-settings-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-primary, #FFFFFF);
  border-radius: 20px 20px 0 0;
  padding: 8px 20px calc(env(safe-area-inset-bottom) + 20px);
  z-index: var(--z-compact-settings);
  transform: translateY(100%);
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  max-height: 85vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.compact-settings-sheet.visible {
  transform: translateY(0);
}

/* Dark mode adjustments */
[data-theme="dark"] .compact-settings-sheet {
  background: #1C1C1E;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.6);
}

/* Drag Handle */
.sheet-handle {
  width: 36px;
  height: 5px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  margin: 0 auto 16px;
}

[data-theme="dark"] .sheet-handle {
  background: rgba(255, 255, 255, 0.3);
}

/* Sheet Header */
.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.sheet-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.sheet-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.sheet-close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] .sheet-close-btn {
  background: rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .sheet-close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Sheet Sections */
.sheet-section {
  margin-bottom: 28px;
}

.sheet-section-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary, #8E8E93);
  margin: 0 0 12px 0;
}

/* Font Size Control */
.font-size-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 20px 0;
}

.font-size-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 24px;
  font-weight: 500;
}

.font-size-btn:active {
  transform: scale(0.95);
  background: rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .font-size-btn {
  border-color: rgba(255, 255, 255, 0.2);
}

[data-theme="dark"] .font-size-btn:active {
  background: rgba(255, 255, 255, 0.1);
}

.font-size-display {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 48px;
  text-align: center;
}

/* Display Toggles */
.display-toggles-compact {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.display-toggle-btn {
  flex: 1;
  min-width: 80px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.display-toggle-btn:active {
  transform: scale(0.98);
}

.display-toggle-btn.active {
  background: var(--accent, #007AFF);
  color: #FFFFFF;
  border-color: var(--accent, #007AFF);
}

[data-theme="dark"] .display-toggle-btn {
  border-color: rgba(255, 255, 255, 0.2);
}

[data-theme="dark"] .display-toggle-btn:not(.active) {
  color: #FFFFFF;
}

/* Theme Selector Grid */
.theme-selector-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  border-radius: 12px;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-card:active {
  transform: scale(0.98);
}

.theme-card.active {
  border-color: var(--accent, #007AFF);
  border-width: 2px;
}

[data-theme="dark"] .theme-card {
  border-color: rgba(255, 255, 255, 0.2);
}

.theme-preview {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
  transition: all 0.2s ease;
}

.theme-preview-auto {
  background: linear-gradient(135deg, #FAF8F5 50%, #1C1C1E 50%);
  color: #000;
}

.theme-preview-light {
  background: #FAF8F5;
  color: #000;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.theme-preview-dark {
  background: #1C1C1E;
  color: #FFF;
}

.theme-preview-paper {
  background: linear-gradient(135deg, #F5F1E8 0%, #E8E3D6 100%);
  color: #000;
}

.theme-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

/* Advanced Options Button */
.advanced-options-btn {
  width: 100%;
  padding: 14px 20px;
  border-radius: 12px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: var(--accent, #007AFF);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
}

.advanced-options-btn:active {
  transform: scale(0.99);
  background: rgba(0, 0, 0, 0.08);
}

[data-theme="dark"] .advanced-options-btn {
  background: rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .advanced-options-btn:active {
  background: rgba(255, 255, 255, 0.15);
}

/* Responsive adjustments */
@media (max-width: 400px) {
  .theme-selector-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .display-toggles-compact {
    flex-direction: column;
  }
  
  .display-toggle-btn {
    flex: none;
    width: 100%;
  }
}
```

**Verify:** Open DevTools, inspect HTML structure. Sheet should be present in DOM but hidden (translateY(100%)). No JavaScript errors. CSS variables resolve correctly.

---

#### Step 1.3 — Create Bottom Toolbar HTML and CSS
**What:** Build fixed bottom toolbar (STATE A baseline) with icons for opening reader options  
**Files to create:**
- `frontend/nitnem/css/bottom-toolbar.css`

**Add to reader.html** after `.reader-content` closing tag (before `</div><!-- .reader-app -->`):

```html
<!-- Bottom Reading Toolbar (STATE A) -->
<div class="bottom-reading-toolbar" id="bottomReadingToolbar">
  <button class="toolbar-btn" id="toolbarContentsBtn" aria-label="Contents & Progress">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
    <span class="toolbar-label">Contents</span>
  </button>
  
  <button class="toolbar-btn" id="toolbarBookmarksBtn" aria-label="Bookmarks & Highlights">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
    </svg>
    <span class="toolbar-label">Bookmarks</span>
  </button>
  
  <button class="toolbar-btn" id="toolbarSearchBtn" aria-label="Search Bani">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
    <span class="toolbar-label">Search</span>
  </button>
  
  <button class="toolbar-btn" id="toolbarSettingsBtn" aria-label="Themes & Settings">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
    </svg>
    <span class="toolbar-label">Settings</span>
  </button>
</div>
```

**CSS file** (`frontend/nitnem/css/bottom-toolbar.css`):

```css
/* ═══════════════════════════════════════════════════════════════
   BOTTOM READING TOOLBAR (STATE A)
   ═══════════════════════════════════════════════════════════════ */

.bottom-reading-toolbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px 24px 0 0;
  padding: 12px 20px calc(env(safe-area-inset-bottom) + 12px);
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
  z-index: var(--z-bottom-toolbar);
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 8px;
  width: 100%;
  max-width: 500px;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* Dark mode */
[data-theme="dark"] .bottom-reading-toolbar {
  background: rgba(28, 28, 30, 0.95);
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.4);
}

/* Hide toolbar when scrolled down (optional enhancement) */
.bottom-reading-toolbar.hidden {
  transform: translateX(-50%) translateY(100%);
  opacity: 0;
}

/* Toolbar Buttons */
.toolbar-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--text-primary, #000);
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.2s ease;
  flex: 1;
  max-width: 100px;
}

.toolbar-btn:active {
  transform: scale(0.95);
  background: rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .toolbar-btn {
  color: #FFFFFF;
}

[data-theme="dark"] .toolbar-btn:active {
  background: rgba(255, 255, 255, 0.1);
}

.toolbar-btn svg {
  flex-shrink: 0;
}

.toolbar-label {
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

/* Active state (when corresponding sheet is open) */
.toolbar-btn.active {
  color: var(--accent, #007AFF);
}

/* Desktop responsive */
@media (min-width: 768px) {
  .bottom-reading-toolbar {
    max-width: 400px;
    border-radius: 24px;
    bottom: 20px;
    padding: 12px 16px;
  }
}
```

**Verify:** Toolbar appears at bottom with safe-area inset. Four buttons visible. Backdrop blur works. Icons render correctly.

---

#### Step 1.4 — Create Reading Options Menu HTML and CSS
**What:** Build the Reader Options Menu bottom sheet (STATE B) with placeholder content  
**Files to create:**
- `frontend/nitnem/css/reading-options-menu.css`

**Add to reader.html** after compact settings sheet (before existing settings drawer):

```html
<!-- Reading Options Menu (STATE B) -->
<div class="reading-options-backdrop" id="readingOptionsBackdrop"></div>
<div class="reading-options-menu" id="readingOptionsMenu">
  <!-- Drag Handle -->
  <div class="sheet-handle"></div>
  
  <!-- Header -->
  <div class="sheet-header">
    <h2 class="sheet-title">Reading Options</h2>
    <button class="sheet-close-btn" id="readingOptionsCloseBtn" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
  
  <!-- Menu Items -->
  <div class="options-menu-list">
    <!-- Reading Progress / Contents -->
    <button class="option-menu-item" id="optionContentsBtn">
      <div class="option-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        </svg>
      </div>
      <div class="option-content">
        <span class="option-title">Contents & Progress</span>
        <span class="option-subtitle" id="progressSubtitle">0% complete</span>
      </div>
      <svg class="option-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
    
    <!-- Bookmarks & Highlights -->
    <button class="option-menu-item" id="optionBookmarksBtn">
      <div class="option-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
        </svg>
      </div>
      <div class="option-content">
        <span class="option-title">Bookmarks & Highlights</span>
        <span class="option-subtitle" id="bookmarksSubtitle">View saved items</span>
      </div>
      <svg class="option-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
    
    <!-- Search Bani -->
    <button class="option-menu-item" id="optionSearchBtn">
      <div class="option-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
      </div>
      <div class="option-content">
        <span class="option-title">Search Bani</span>
        <span class="option-subtitle">Find verses and words</span>
      </div>
      <svg class="option-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
    
    <!-- Themes & Settings -->
    <button class="option-menu-item" id="optionThemesBtn">
      <div class="option-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6M12 17v6"/>
        </svg>
      </div>
      <div class="option-content">
        <span class="option-title">Themes & Settings</span>
        <span class="option-subtitle">Customize your reading experience</span>
      </div>
      <svg class="option-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  </div>
</div>
```

**CSS file** (`frontend/nitnem/css/reading-options-menu.css`):

```css
/* ═══════════════════════════════════════════════════════════════
   READING OPTIONS MENU (STATE B)
   ═══════════════════════════════════════════════════════════════ */

/* Backdrop */
.reading-options-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: var(--z-sheets-backdrop);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.reading-options-backdrop.visible {
  opacity: 1;
  visibility: visible;
}

/* Menu Sheet */
.reading-options-menu {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-primary, #FFFFFF);
  border-radius: 20px 20px 0 0;
  padding: 8px 0 calc(env(safe-area-inset-bottom) + 20px);
  z-index: var(--z-reading-options-menu);
  transform: translateY(100%);
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

.reading-options-menu.visible {
  transform: translateY(0);
}

[data-theme="dark"] .reading-options-menu {
  background: #1C1C1E;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.6);
}

/* Sheet header reused from compact settings */
.reading-options-menu .sheet-header {
  padding: 0 20px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 8px;
}

[data-theme="dark"] .reading-options-menu .sheet-header {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

/* Options List */
.options-menu-list {
  display: flex;
  flex-direction: column;
}

.option-menu-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.2s ease;
  text-align: left;
  width: 100%;
}

.option-menu-item:active {
  background: rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .option-menu-item:active {
  background: rgba(255, 255, 255, 0.1);
}

.option-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent, #007AFF);
  flex-shrink: 0;
}

[data-theme="dark"] .option-icon {
  background: rgba(255, 255, 255, 0.1);
}

.option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.option-subtitle {
  font-size: 13px;
  color: var(--text-secondary, #8E8E93);
}

.option-chevron {
  color: var(--text-tertiary, #C7C7CC);
  flex-shrink: 0;
}

[data-theme="dark"] .option-chevron {
  color: #636366;
}
```

**Verify:** Menu structure exists in DOM, hidden by default. Four menu items visible when toggled. Backdrop and slide-in animation work.

---

### PHASE 2: JAVASCRIPT CONTROLLER (Wire UI to Existing Functions)

#### Step 2.1 — Create Modal State Machine
**What:** Build JavaScript controller to manage sheet visibility (only one open at a time)  
**Files to create:**
- `frontend/nitnem/js/compact-settings-controller.js`

**Content:**

```javascript
/* ═══════════════════════════════════════════════════════════════
   COMPACT SETTINGS & READING OPTIONS CONTROLLER
   Wires new UI elements to existing reader-engine.js functions
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // MODAL STATE MACHINE
  // ═══════════════════════════════════════════════════════════════
  
  const ModalState = {
    NONE: 'none',
    COMPACT_SETTINGS: 'compact_settings',
    READING_OPTIONS: 'reading_options',
    ADVANCED_SETTINGS: 'advanced_settings'
  };
  
  let currentModal = ModalState.NONE;
  
  // Get all modal elements
  const elements = {
    // Bottom toolbar
    bottomToolbar: document.getElementById('bottomReadingToolbar'),
    toolbarContentsBtn: document.getElementById('toolbarContentsBtn'),
    toolbarBookmarksBtn: document.getElementById('toolbarBookmarksBtn'),
    toolbarSearchBtn: document.getElementById('toolbarSearchBtn'),
    toolbarSettingsBtn: document.getElementById('toolbarSettingsBtn'),
    
    // Compact Settings (STATE C)
    compactSettingsBackdrop: document.getElementById('compactSettingsBackdrop'),
    compactSettingsSheet: document.getElementById('compactSettingsSheet'),
    compactSettingsCloseBtn: document.getElementById('compactSettingsCloseBtn'),
    fontSizeDecreaseBtn: document.getElementById('fontSizeDecreaseBtn'),
    fontSizeIncreaseBtn: document.getElementById('fontSizeIncreaseBtn'),
    fontSizeDisplay: document.getElementById('fontSizeDisplay'),
    compactToggleGurmukhi: document.getElementById('compactToggleGurmukhi'),
    compactToggleRoman: document.getElementById('compactToggleRoman'),
    compactToggleEnglish: document.getElementById('compactToggleEnglish'),
    compactTogglePunjabi: document.getElementById('compactTogglePunjabi'),
    themeAutoBtn: document.getElementById('themeAutoBtn'),
    themeLightBtn: document.getElementById('themeLightBtn'),
    themeDarkBtn: document.getElementById('themeDarkBtn'),
    themePaperBtn: document.getElementById('themePaperBtn'),
    advancedOptionsBtn: document.getElementById('advancedOptionsBtn'),
    
    // Reading Options Menu (STATE B)
    readingOptionsBackdrop: document.getElementById('readingOptionsBackdrop'),
    readingOptionsMenu: document.getElementById('readingOptionsMenu'),
    readingOptionsCloseBtn: document.getElementById('readingOptionsCloseBtn'),
    optionContentsBtn: document.getElementById('optionContentsBtn'),
    optionBookmarksBtn: document.getElementById('optionBookmarksBtn'),
    optionSearchBtn: document.getElementById('optionSearchBtn'),
    optionThemesBtn: document.getElementById('optionThemesBtn'),
    progressSubtitle: document.getElementById('progressSubtitle'),
    
    // Existing settings drawer (becomes Advanced Settings)
    settingsOverlay: document.getElementById('settingsOverlay'),
    settingsDrawer: document.getElementById('settingsDrawer'),
    settingsBtn: document.getElementById('settingsBtn')
  };
  
  // ═══════════════════════════════════════════════════════════════
  // MODAL CONTROL FUNCTIONS
  // ═══════════════════════════════════════════════════════════════
  
  function openModal(modal) {
    // Prevent opening if already open
    if (currentModal === modal) return;
    
    // Close current modal first
    closeAllModals();
    
    currentModal = modal;
    
    switch (modal) {
      case ModalState.COMPACT_SETTINGS:
        elements.compactSettingsBackdrop.classList.add('visible');
        elements.compactSettingsSheet.classList.add('visible');
        elements.toolbarSettingsBtn?.classList.add('active');
        break;
        
      case ModalState.READING_OPTIONS:
        elements.readingOptionsBackdrop.classList.add('visible');
        elements.readingOptionsMenu.classList.add('visible');
        updateProgressSubtitle();
        break;
        
      case ModalState.ADVANCED_SETTINGS:
        elements.settingsOverlay.classList.add('visible');
        elements.settingsDrawer.classList.add('visible');
        break;
    }
  }
  
  function closeAllModals() {
    // Close compact settings
    elements.compactSettingsBackdrop.classList.remove('visible');
    elements.compactSettingsSheet.classList.remove('visible');
    elements.toolbarSettingsBtn?.classList.remove('active');
    
    // Close reading options
    elements.readingOptionsBackdrop.classList.remove('visible');
    elements.readingOptionsMenu.classList.remove('visible');
    
    // Close advanced settings
    elements.settingsOverlay.classList.remove('visible');
    elements.settingsDrawer.classList.remove('visible');
    
    currentModal = ModalState.NONE;
  }
  
  function updateProgressSubtitle() {
    // Wire to existing progress tracking
    const progressBar = document.getElementById('progressBar');
    if (progressBar && elements.progressSubtitle) {
      const progress = Math.round(parseFloat(progressBar.style.width) || 0);
      elements.progressSubtitle.textContent = `${progress}% complete`;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // FONT SIZE CONTROL (Wire to existing adjustSize function)
  // ═══════════════════════════════════════════════════════════════
  
  function updateFontSizeDisplay() {
    // Read from existing state
    const saved = localStorage.getItem('anhad_reader_v5');
    if (saved && elements.fontSizeDisplay) {
      try {
        const settings = JSON.parse(saved);
        const size = settings.gurbaniFontSize || 28;
        elements.fontSizeDisplay.textContent = size;
      } catch (e) {
        elements.fontSizeDisplay.textContent = '28';
      }
    }
  }
  
  function handleFontSizeChange(action) {
    // Call existing adjustSize function from reader-engine.js
    if (typeof window.adjustSize === 'function') {
      window.adjustSize('gurbani', action);
      
      // Update display after change
      setTimeout(updateFontSizeDisplay, 100);
    } else {
      console.error('adjustSize function not found in reader-engine.js');
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // DISPLAY TOGGLES (Wire to existing toggleDisplay function)
  // ═══════════════════════════════════════════════════════════════
  
  function syncDisplayToggles() {
    // Read current state from localStorage
    const saved = localStorage.getItem('anhad_reader_v5');
    if (!saved) return;
    
    try {
      const settings = JSON.parse(saved);
      
      // Update compact toggle button states
      if (elements.compactToggleGurmukhi) {
        elements.compactToggleGurmukhi.classList.toggle('active', settings.showGurmukhi !== false);
      }
      if (elements.compactToggleRoman) {
        elements.compactToggleRoman.classList.toggle('active', settings.showRoman === true);
      }
      if (elements.compactToggleEnglish) {
        elements.compactToggleEnglish.classList.toggle('active', settings.showEnglish === true);
      }
      if (elements.compactTogglePunjabi) {
        elements.compactTogglePunjabi.classList.toggle('active', settings.showPunjabi === true);
      }
    } catch (e) {
      console.error('Error syncing display toggles:', e);
    }
  }
  
  function handleDisplayToggle(lang) {
    // Map lang to existing toggle button IDs
    const toggleMap = {
      'gurmukhi': 'toggleGurmukhi',
      'roman': 'toggleRoman',
      'english': 'toggleEnglish',
      'punjabi': 'togglePunjabi'
    };
    
    const existingToggleId = toggleMap[lang];
    const existingToggle = document.getElementById(existingToggleId);
    
    if (existingToggle) {
      // Trigger click on existing toggle button to reuse logic
      existingToggle.click();
      
      // Sync compact toggle states
      setTimeout(syncDisplayToggles, 100);
    } else {
      console.error(`Existing toggle button not found: ${existingToggleId}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // THEME SELECTION (Wire to existing theme logic)
  // ═══════════════════════════════════════════════════════════════
  
  function syncThemeSelection() {
    const currentTheme = localStorage.getItem('anhad_theme') || 'auto';
    
    // Update active state on theme cards
    [elements.themeAutoBtn, elements.themeLightBtn, elements.themeDarkBtn, elements.themePaperBtn].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    
    if (currentTheme === 'auto' && elements.themeAutoBtn) {
      elements.themeAutoBtn.classList.add('active');
    } else if (currentTheme === 'light' && elements.themeLightBtn) {
      elements.themeLightBtn.classList.add('active');
    } else if (currentTheme === 'dark' && elements.themeDarkBtn) {
      elements.themeDarkBtn.classList.add('active');
    }
    
    // Paper mode handled separately via paperBackground setting
    const saved = localStorage.getItem('anhad_reader_v5');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.paperBackground && elements.themePaperBtn) {
          elements.themePaperBtn.classList.add('active');
        }
      } catch (e) {}
    }
  }
  
  function handleThemeChange(theme) {
    if (theme === 'paper') {
      // Toggle paper background setting
      const paperToggle = document.getElementById('paperBackgroundToggle');
      if (paperToggle) {
        paperToggle.click();
      }
    } else {
      // Set theme and reload to apply blocking script
      localStorage.setItem('anhad_theme', theme);
      window.location.reload();
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════
  
  function initEventListeners() {
    // Bottom toolbar buttons
    elements.toolbarContentsBtn?.addEventListener('click', () => {
      openModal(ModalState.READING_OPTIONS);
    });
    
    elements.toolbarBookmarksBtn?.addEventListener('click', () => {
      openModal(ModalState.READING_OPTIONS);
    });
    
    elements.toolbarSearchBtn?.addEventListener('click', () => {
      openModal(ModalState.READING_OPTIONS);
    });
    
    elements.toolbarSettingsBtn?.addEventListener('click', () => {
      openModal(ModalState.COMPACT_SETTINGS);
    });
    
    // Compact Settings close
    elements.compactSettingsCloseBtn?.addEventListener('click', closeAllModals);
    elements.compactSettingsBackdrop?.addEventListener('click', closeAllModals);
    
    // Font size controls
    elements.fontSizeDecreaseBtn?.addEventListener('click', () => {
      handleFontSizeChange('decrease');
    });
    
    elements.fontSizeIncreaseBtn?.addEventListener('click', () => {
      handleFontSizeChange('increase');
    });
    
    // Display toggles
    elements.compactToggleGurmukhi?.addEventListener('click', () => {
      handleDisplayToggle('gurmukhi');
    });
    elements.compactToggleRoman?.addEventListener('click', () => {
      handleDisplayToggle('roman');
    });
    elements.compactToggleEnglish?.addEventListener('click', () => {
      handleDisplayToggle('english');
    });
    elements.compactTogglePunjabi?.addEventListener('click', () => {
      handleDisplayToggle('punjabi');
    });
    
    // Theme selection
    elements.themeAutoBtn?.addEventListener('click', () => {
      handleThemeChange('auto');
    });
    elements.themeLightBtn?.addEventListener('click', () => {
      handleThemeChange('light');
    });
    elements.themeDarkBtn?.addEventListener('click', () => {
      handleThemeChange('dark');
    });
    elements.themePaperBtn?.addEventListener('click', () => {
      handleThemeChange('paper');
    });
    
    // Advanced options button
    elements.advancedOptionsBtn?.addEventListener('click', () => {
      closeAllModals();
      setTimeout(() => {
        openModal(ModalState.ADVANCED_SETTINGS);
      }, 300);
    });
    
    // Reading Options Menu close
    elements.readingOptionsCloseBtn?.addEventListener('click', closeAllModals);
    elements.readingOptionsBackdrop?.addEventListener('click', closeAllModals);
    
    // Reading Options Menu items
    elements.optionContentsBtn?.addEventListener('click', () => {
      // TODO: Implement contents navigation
      console.log('Contents navigation - to be implemented');
      closeAllModals();
    });
    
    elements.optionBookmarksBtn?.addEventListener('click', () => {
      // TODO: Implement bookmarks view
      console.log('Bookmarks view - to be implemented');
      closeAllModals();
    });
    
    elements.optionSearchBtn?.addEventListener('click', () => {
      // TODO: Implement search interface
      console.log('Search interface - to be implemented');
      closeAllModals();
    });
    
    elements.optionThemesBtn?.addEventListener('click', () => {
      closeAllModals();
      setTimeout(() => {
        openModal(ModalState.COMPACT_SETTINGS);
      }, 300);
    });
    
    // Android back button support
    document.addEventListener('backbutton', () => {
      if (currentModal !== ModalState.NONE) {
        closeAllModals();
      }
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && currentModal !== ModalState.NONE) {
        closeAllModals();
      }
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════
  
  function init() {
    // Wait for DOM and reader-engine to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    // Initialize event listeners
    initEventListeners();
    
    // Sync initial states
    updateFontSizeDisplay();
    syncDisplayToggles();
    syncThemeSelection();
    
    // Listen for settings changes from existing drawer
    window.addEventListener('storage', () => {
      syncDisplayToggles();
      syncThemeSelection();
      updateFontSizeDisplay();
    });
    
    // Expose closeAllModals for external use
    window.closeCompactModals = closeAllModals;
    
    console.log('Compact Settings Controller initialized');
  }
  
  // Start initialization
  init();
  
})();
```

**Add to reader.html** before closing `</body>` tag, after reader-engine.js:
```html
<script src="js/compact-settings-controller.js" defer></script>
```

**Verify:** Open reader, click bottom toolbar Settings button. Compact Settings sheet opens. Click font size +/− buttons, see size change in reading content AND display updates. Click theme cards, theme changes. Click display toggles, scripts show/hide. Click Advanced Options, old drawer opens. Close buttons and backdrop clicks work.

---

### PHASE 3: HEADER SIMPLIFICATION

#### Step 3.1 — Remove Display Toggles Bar from Header
**What:** Remove the fixed display toggles nav element below header (lines ~173-180 in reader.html)  
**Files to modify:**
- `frontend/nitnem/reader.html`

**Find and DELETE** (approximately lines 173-180):
```html
<!-- Display Toggles -->
<nav class="reader-toggles">
    <button class="toggle-btn active" id="toggleGurmukhi">ਗੁਰਮੁਖੀ</button>
    <button class="toggle-btn" id="toggleRoman">Roman</button>
    <button class="toggle-btn" id="toggleEnglish">English</button>
    <button class="toggle-btn" id="togglePunjabi">ਪੰਜਾਬੀ</button>
</nav>
```

**Rationale:** Display toggles moved to Compact Settings sheet. Removing from header creates cleaner reading surface matching reference STATE A.

**Verify:** Reload reader. Toggle bar below header is gone. Header shows only back button, title, and action buttons. Display toggles still work via Compact Settings sheet.

---

#### Step 3.2 — Remove Settings Button from Header
**What:** Remove the settings gear icon button from `.reader-actions` in header  
**Files to modify:**
- `frontend/nitnem/reader.html`

**Find in reader.html** (around line 164):
```html
<button class="reader-btn" id="settingsBtn" aria-label="Settings">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
</button>
```

**DELETE** the entire button element.

**Rationale:** Settings access moved to bottom toolbar. Header should contain only essential navigation (back, bookmark, tick).

**Verify:** Header shows only three buttons: back, bookmark, tick. Settings accessible via bottom toolbar.

---

#### Step 3.3 — Rename Settings Drawer to "Advanced Settings"
**What:** Update settings drawer header text to indicate it's now advanced options  
**Files to modify:**
- `frontend/nitnem/reader.html`

**Find** (around line 277):
```html
<div class="settings-header">
    <h2>ਸੈਟਿੰਗ</h2>
    <span class="settings-subtitle">Reading Preferences</span>
</div>
```

**Replace with:**
```html
<div class="settings-header">
    <h2>ਉੱਨਤ ਸੈਟਿੰਗਾਂ</h2>
    <span class="settings-subtitle">Advanced Reading Options</span>
</div>
```

**Rationale:** Clarifies that common settings are in Compact Settings, while this drawer contains advanced/power-user options.

**Verify:** Open Advanced Options from Compact Settings sheet. Drawer header reads "Advanced Reading Options" subtitle.

---

#### Step 3.4 — Adjust Header CSS for Cleaner Layout
**What:** Simplify header spacing and ensure title is properly centered  
**Files to modify:**
- `frontend/nitnem/css/reader.css`

**Find** the `.reader-header` styles (around line 200-250) and **replace** with:

```css
/* Simplified Reader Header (STATE A) */
.reader-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: transparent;
  position: relative;
  z-index: var(--z-header, 7000);
}

.reader-back {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--accent, #007AFF);
  text-decoration: none;
  font-size: 17px;
  font-weight: 400;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.reader-back:active {
  opacity: 0.6;
}

.reader-back svg {
  width: 12px;
  height: 20px;
}

.reader-title {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  max-width: 50%;
  pointer-events: none;
}

.reader-gurmukhi {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reader-english {
  display: block;
  font-size: 12px;
  color: var(--text-secondary, #8E8E93);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reader-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.reader-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.reader-btn:active {
  transform: scale(0.95);
  background: rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .reader-btn:active {
  background: rgba(255, 255, 255, 0.1);
}

.reader-btn.active {
  color: var(--accent, #007AFF);
}

.reader-btn.active svg {
  fill: currentColor;
}
```

**Verify:** Header is visually cleaner. Title is centered. Back button on left, bookmark and tick buttons on right. No overlap or clipping.

---

### PHASE 4: SCROLL POSITION PRESERVATION

#### Step 4.1 — Implement Scroll Position Capture Before Font Size Change
**What:** Prevent scroll jump when font size changes by capturing current verse position and restoring after reflow  
**Files to modify:**
- `frontend/nitnem/js/compact-settings-controller.js`

**Find** the `handleFontSizeChange` function (created in Step 2.1) and **replace** with:

```javascript
function handleFontSizeChange(action) {
  // Capture current scroll position and first visible verse
  const versesContainer = document.getElementById('versesContainer');
  const verses = versesContainer?.querySelectorAll('.verse[data-verse-id]') || [];
  
  let targetVerseId = null;
  let targetOffsetTop = 0;
  
  // Find first verse in viewport
  const viewportTop = window.scrollY;
  const viewportHeight = window.innerHeight;
  
  for (let verse of verses) {
    const rect = verse.getBoundingClientRect();
    const verseTop = rect.top + window.scrollY;
    
    if (verseTop >= viewportTop && verseTop < (viewportTop + viewportHeight / 2)) {
      targetVerseId = verse.getAttribute('data-verse-id');
      targetOffsetTop = verseTop - viewportTop; // Distance from top of viewport
      break;
    }
  }
  
  // Call existing adjustSize function
  if (typeof window.adjustSize === 'function') {
    window.adjustSize('gurbani', action);
    
    // Update display
    setTimeout(updateFontSizeDisplay, 100);
    
    // Restore scroll position after reflow
    if (targetVerseId) {
      setTimeout(() => {
        const targetVerse = document.querySelector(`.verse[data-verse-id="${targetVerseId}"]`);
        if (targetVerse) {
          const newVerseTop = targetVerse.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: newVerseTop - targetOffsetTop,
            behavior: 'auto' // Instant, no smooth scroll
          });
        }
      }, 150); // Wait for font application and reflow
    }
  } else {
    console.error('adjustSize function not found in reader-engine.js');
  }
}
```

**Rationale:** Font size changes cause layout reflow which shifts scroll position. By capturing the first visible verse's ID and its offset from viewport top, we can restore the exact reading position after reflow completes.

**Verify:** Open reader, scroll to middle of Bani. Open Compact Settings, change font size. Reading position stays stable (same verse at same screen position before and after).

---

### PHASE 5: ADVANCED SETTINGS DRAWER ADJUSTMENTS

#### Step 5.1 — Update Settings Drawer Z-Index
**What:** Ensure Advanced Settings drawer appears above Compact Settings sheet when opened  
**Files to modify:**
- `frontend/nitnem/css/reader.css` (or wherever `.settings-drawer` styles are)

**Find** `.settings-drawer` styles and **update** the z-index line:

```css
.settings-drawer {
  /* existing styles... */
  z-index: var(--z-advanced-settings); /* Changed from fixed value */
}

.settings-overlay {
  /* existing styles... */
  z-index: var(--z-sheets-backdrop); /* Ensure consistent backdrop level */
}
```

**Verify:** Open Compact Settings, click Advanced Options. Advanced drawer slides in above Compact Settings (which closes first via state machine).

---

#### Step 5.2 — Remove Duplicate Font Size Controls from Advanced Drawer
**What:** Since font size controls are now in Compact Settings, remove or hide duplicate controls from Advanced drawer to avoid confusion  
**Files to modify:**
- `frontend/nitnem/reader.html`

**Find in Advanced Settings drawer** (around lines 516-596, "Font" section):

Look for the font size controls (the +/− buttons). **Option A:** Delete them entirely. **Option B:** Keep them for power users but add a note.

**Recommended approach** — **ADD NOTE** above font size controls in drawer:

```html
<section class="setting-section">
    <h3 class="setting-section-title">Font</h3>
    <p class="setting-note">Tip: Font size can be adjusted quickly from Display & Appearance sheet.</p>
    <!-- Keep existing controls for advanced users -->
    <div class="setting-card">
        <!-- existing font controls -->
    </div>
</section>
```

**Add CSS for note** in `frontend/nitnem/css/reader.css`:

```css
.setting-note {
  font-size: 13px;
  color: var(--text-secondary, #8E8E93);
  margin: 0 0 12px 0;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
}

[data-theme="dark"] .setting-note {
  background: rgba(255, 255, 255, 0.05);
}
```

**Rationale:** Keeps advanced controls accessible without duplicating primary UI. Power users can still fine-tune from Advanced drawer.

**Verify:** Open Advanced Settings. Note appears above Font section. Font controls still functional but not primary path.

---

### PHASE 6: POLISH & INTEGRATION

#### Step 6.1 — Add Include Statements to reader.html
**What:** Ensure all new CSS and JS files are loaded in correct order  
**Files to modify:**
- `frontend/nitnem/reader.html`

**In `<head>` section, after existing CSS links** (around line 120-125), **ADD:**

```html
<!-- New UI Reconstruction Styles -->
<link rel="stylesheet" href="css/z-index-scale.css">
<link rel="stylesheet" href="css/compact-settings.css">
<link rel="stylesheet" href="css/bottom-toolbar.css">
<link rel="stylesheet" href="css/reading-options-menu.css">
```

**Before closing `</body>` tag, after existing scripts** (around line 565+), **ADD:**

```html
<!-- Compact Settings Controller -->
<script src="js/compact-settings-controller.js" defer></script>
```

**Verify:** All styles load without 404 errors in Network tab. JavaScript file loads and executes (check console for "Compact Settings Controller initialized" message).

---

#### Step 6.2 — Update Progress Subtitle Dynamically
**What:** Wire Reading Options Menu progress subtitle to update when scroll position changes  
**Files to modify:**
- `frontend/nitnem/js/compact-settings-controller.js`

**ADD** at end of file, before closing IIFE:

```javascript
// Listen for scroll progress updates
let progressUpdateTimer;
window.addEventListener('scroll', () => {
  if (currentModal === ModalState.READING_OPTIONS) {
    clearTimeout(progressUpdateTimer);
    progressUpdateTimer = setTimeout(updateProgressSubtitle, 200);
  }
}, { passive: true });

// Listen for custom progress update events from reader-engine
document.addEventListener('baniProgressUpdated', () => {
  if (currentModal === ModalState.READING_OPTIONS) {
    updateProgressSubtitle();
  }
});
```

**Verify:** Open Reading Options Menu while reading. Scroll content. Progress subtitle updates to match current reading position percentage.

---

#### Step 6.3 — Hide Old Toggle Bar CSS (Fallback Safety)
**What:** Add CSS rule to hide old toggle bar even if HTML deletion is missed  
**Files to modify:**
- `frontend/nitnem/css/reader.css`

**ADD at end of file:**

```css
/* ═══════════════════════════════════════════════════════════════
   RECONSTRUCTION OVERRIDES
   Hide deprecated UI elements for clean reference-style layout
   ═══════════════════════════════════════════════════════════════ */

/* Hide old display toggles bar (moved to Compact Settings) */
.reader-toggles {
  display: none !important;
}

/* Hide old settings button in header (moved to bottom toolbar) */
.reader-header #settingsBtn {
  display: none !important;
}

/* Ensure reading content has proper bottom padding for toolbar */
.reader-content {
  padding-bottom: calc(100px + env(safe-area-inset-bottom));
}
```

**Rationale:** Defense-in-depth approach. Even if HTML elements aren't deleted, CSS hides them. Ensures clean UI.

**Verify:** Old toggle bar and header settings button are hidden. Reading content doesn't get cut off by bottom toolbar.

---

#### Step 6.4 — Test Modal State Machine Edge Cases
**What:** Verify modal behavior in all scenarios  
**Testing checklist:**

1. **Open Compact Settings from toolbar** → Opens correctly
2. **Click outside (backdrop)** → Closes
3. **Click close button** → Closes
4. **Open Compact Settings, click Advanced Options** → Compact closes, Advanced opens
5. **Open Reading Options, click Themes & Settings** → Reading Options closes, Compact opens
6. **Tap toolbar Settings button while Compact Settings open** → No duplicate, idempotent
7. **Tap Android back button** → Closes current modal
8. **Press Escape key** → Closes current modal
9. **Open modal, scroll content** → Modal stays fixed, doesn't scroll with page
10. **Change font size in Compact Settings** → Reading position preserved

**Files checked:**
- `frontend/nitnem/js/compact-settings-controller.js` (modal state machine logic)
- All backdrop and sheet elements in `reader.html`

**Verify:** All 10 scenarios pass. No stuck modals, no overlapping sheets, no scroll jump.

---

### PHASE 7: FINAL VERIFICATION & CLEANUP

#### Step 7.1 — Cross-Device Testing
**What:** Test UI on multiple devices and browsers  
**Testing matrix:**

| Device Type | Browser | Checklist |
|-------------|---------|-----------|
| iOS Safari (iPhone) | Safari | Bottom toolbar safe-area inset, notch clearance, backdrop blur |
| Android Chrome | Chrome | Bottom toolbar above gesture nav, backdrop blur, sheet animations |
| Desktop Chrome | Chrome | Responsive layout, hover states, keyboard navigation |
| iPad Safari | Safari | Landscape orientation, larger modals |

**Key checks per device:**
- Bottom toolbar doesn't hide behind system UI
- Safe-area insets applied correctly
- Backdrop blur renders (may degrade gracefully on older devices)
- Sheet slide-in animations smooth (60fps)
- Font size changes don't break layout
- Theme switches apply correctly

**Verify:** UI works on all target devices. Graceful degradation on unsupported features (e.g., backdrop-filter fallback).

---

#### Step 7.2 — Accessibility Audit
**What:** Ensure new UI is keyboard and screen-reader accessible  
**Checks:**

1. **Keyboard navigation:**
   - Tab through bottom toolbar buttons → Focus visible
   - Tab through Compact Settings controls → All interactive elements reachable
   - Enter/Space activates buttons
   - Escape closes modals

2. **Screen reader (VoiceOver/TalkBack):**
   - Bottom toolbar buttons have clear labels
   - Sheet titles announced when opened
   - Font size display reads current value
   - Theme cards announce "selected" state
   - Close buttons labeled

3. **Focus management:**
   - Opening modal moves focus to first interactive element
   - Closing modal returns focus to trigger button
   - Focus trapped within modal while open

**Files to check:**
- All `aria-label` attributes in HTML
- All button labels and SVG titles

**Verify:** Screen reader announces all controls correctly. Keyboard-only navigation works. Focus management proper.

---

#### Step 7.3 — Performance Check
**What:** Ensure new UI doesn't degrade scroll or animation performance  
**Checks:**

1. **Chrome DevTools Performance profiling:**
   - Record scroll performance → No layout thrashing
   - Record modal open/close → Animations at 60fps
   - Check paint/composite layers → Backdrops GPU-accelerated

2. **Memory usage:**
   - No memory leaks from repeated modal open/close cycles
   - Event listeners properly managed

3. **Bundle size:**
   - New CSS files: ~10-15 KB total (acceptable)
   - New JS file: ~8-10 KB (acceptable)

**Verify:** Scroll performance unchanged. Modal animations smooth. No memory leaks.

---

#### Step 7.4 — Settings Persistence Verification
**What:** Ensure all settings still save and load correctly  
**Test sequence:**

1. Change font size to 40px in Compact Settings
2. Toggle off Gurmukhi, toggle on Roman
3. Switch theme to Dark
4. Close browser tab
5. Reopen reader with same Bani ID
6. **Expected:** Font size 40px, Roman visible, Gurmukhi hidden, Dark theme active

**localStorage keys to verify:**
- `anhad_reader_v5` contains correct gurbaniFontSize
- `anhad_reader_v5` contains correct showGurmukhi/showRoman states
- `anhad_theme` set to 'dark'

**Verify:** All settings persist correctly across browser sessions. No data loss.

---

#### Step 7.5 — Clean Up Debug Code
**What:** Remove console.log statements and debug comments  
**Files to clean:**
- `frontend/nitnem/js/compact-settings-controller.js`

**REMOVE or comment out:**
```javascript
console.log('Contents navigation - to be implemented');
console.log('Bookmarks view - to be implemented');
console.log('Search interface - to be implemented');
```

**KEEP:**
```javascript
console.log('Compact Settings Controller initialized');
console.error('adjustSize function not found in reader-engine.js');
```

**Rationale:** Keep initialization and error logs for debugging, remove placeholder TODOs.

**Verify:** No unnecessary console noise in production. Only meaningful logs remain.

---

## TESTING CHECKLIST SUMMARY

### Critical Verification (Must Pass Before Completion)

- [ ] **Theme switches correctly** (auto, light, dark) — no FOUC
- [ ] **Font changes apply immediately** without scroll jump
- [ ] **All reading modes work** (Continuous, Paragraph, Best Version, Larivaar)
- [ ] **Display toggles show/hide correct scripts**
- [ ] **Settings persist** across reload (localStorage intact)
- [ ] **Bookmark/Tick state** saves and loads correctly
- [ ] **My Pothi "Next Bani"** displays when applicable
- [ ] **Back button navigates** correctly (smart-back behavior)
- [ ] **Scroll progress updates** smoothly (no jank)
- [ ] **Safe-area insets work** on iOS notch devices and Android gesture nav
- [ ] **Paper mode activates** without flash
- [ ] **Bottom toolbar appears** with correct spacing and safe-area
- [ ] **Compact Settings sheet** opens and closes reliably
- [ ] **Reading Options Menu** opens and closes reliably
- [ ] **Advanced Settings drawer** opens from Compact Settings
- [ ] **Only one modal open at a time** (state machine works)
- [ ] **Backdrop clicks close modals**
- [ ] **Close buttons work**
- [ ] **Android back button closes modals**
- [ ] **Escape key closes modals**
- [ ] **Font size +/− buttons** change size and update display
- [ ] **Theme cards** change theme correctly
- [ ] **Display toggle buttons** show/hide scripts
- [ ] **Advanced Options button** opens old drawer
- [ ] **No duplicate modals** from repeated taps
- [ ] **No JavaScript errors** in console
- [ ] **All CSS files load** (no 404s)
- [ ] **Header simplified** (no toggle bar, no settings button)
- [ ] **Header title centered**
- [ ] **Reading content not cut off** by bottom toolbar

### Cross-Device Testing

- [ ] **iOS Safari** (notch device) — safe-area insets correct
- [ ] **Android Chrome** (gesture nav) — toolbar above system UI
- [ ] **Desktop Chrome** (1920×1080) — responsive layout works
- [ ] **iPad Safari** (landscape) — modals sized appropriately

### Accessibility Testing

- [ ] **Keyboard navigation** — Tab through all controls
- [ ] **Screen reader** — All labels announced
- [ ] **Focus management** — Focus moves correctly when opening/closing modals
- [ ] **ARIA labels** present and correct

### Performance Testing

- [ ] **Scroll performance** — No layout thrashing, smooth 60fps
- [ ] **Modal animations** — Smooth slide-in/out at 60fps
- [ ] **No memory leaks** — Repeated open/close cycles don't leak
- [ ] **Bundle size acceptable** — New files < 25KB total

---

## FILES CREATED

### New Files (8 total)

1. `frontend/nitnem/css/z-index-scale.css` — Z-index hierarchy variables
2. `frontend/nitnem/css/compact-settings.css` — Compact Settings sheet (STATE C) styles
3. `frontend/nitnem/css/bottom-toolbar.css` — Bottom reading toolbar styles
4. `frontend/nitnem/css/reading-options-menu.css` — Reading Options Menu (STATE B) styles
5. `frontend/nitnem/js/compact-settings-controller.js` — JavaScript controller for new UI

### Files Modified (3 total)

6. `frontend/nitnem/reader.html` — HTML additions (new UI elements), HTML deletions (old toggle bar, header settings button), include statements for new CSS/JS
7. `frontend/nitnem/css/reader.css` — Header simplification styles, reconstruction overrides, setting notes
8. (No modifications to `reader-engine.js` — all wiring done via controller calling existing functions)

---

## SUCCESS CRITERIA

### PRIMARY GOALS ✅

1. **STATE A achieved** — Clean reading surface with minimal header, centered title, bottom toolbar
2. **STATE B achieved** — Reading Options Menu opens from toolbar, shows contents/bookmarks/search/themes navigation
3. **STATE C achieved** — Compact Settings sheet with font size controls, display toggles, theme selector
4. **Zero functionality lost** — All 30+ existing settings accessible (common ones in Compact, advanced in drawer)
5. **Zero data loss** — All localStorage keys preserved, settings persist correctly
6. **Modal state machine works** — Only one sheet open at a time, clean open/close behavior
7. **Scroll position preserved** — Font size changes don't cause scroll jump
8. **Cross-device compatibility** — Works on iOS Safari, Android Chrome, Desktop browsers
9. **Performance maintained** — Scroll and animations remain smooth

### SECONDARY GOALS 🎯

1. **Accessibility compliant** — Keyboard navigation, screen reader support, ARIA labels
2. **Visual polish** — Animations smooth, transitions refined, backdrop blur working
3. **Code quality** — Modular CSS, clean JavaScript, no console errors
4. **Documentation** — Code comments explain critical sections
5. **Future-ready** — Search and bookmarks UI hooks in place for future implementation

---

## ROLLBACK PLAN

If critical bugs discovered post-implementation:

### QUICK ROLLBACK (5 minutes)

1. **Remove new CSS includes** from reader.html `<head>`:
   ```html
   <!-- Comment out or delete these lines -->
   <!-- <link rel="stylesheet" href="css/z-index-scale.css"> -->
   <!-- <link rel="stylesheet" href="css/compact-settings.css"> -->
   <!-- <link rel="stylesheet" href="css/bottom-toolbar.css"> -->
   <!-- <link rel="stylesheet" href="css/reading-options-menu.css"> -->
   ```

2. **Remove new JS include** from reader.html before `</body>`:
   ```html
   <!-- Comment out or delete -->
   <!-- <script src="js/compact-settings-controller.js" defer></script> -->
   ```

3. **Restore old UI elements in reader.html:**
   - Un-delete display toggles nav (restore from git history)
   - Un-delete settings button in header (restore from git history)

4. **Remove bottom toolbar HTML** — Delete entire `<div class="bottom-reading-toolbar">...</div>` block

5. **Remove new sheet HTML** — Delete compact settings and reading options menu HTML blocks

**Result:** Reader reverts to original UI, fully functional, zero data loss.

### PARTIAL ROLLBACK (Keep some changes)

If only one component has issues (e.g., scroll position bug in font size change):

- Disable just that feature by commenting out the problematic event listener in compact-settings-controller.js
- Users can still use old Advanced Settings drawer for font size changes

---

## FUTURE ENHANCEMENTS (Post-MVP)

### Not Included in This Plan (Future Work)

1. **Search Interface** — Full-text Bani search modal (hooked in Reading Options, implementation TBD)
2. **Bookmarks List View** — Dedicated view for saved bookmarks (hooked, implementation TBD)
3. **Contents Navigation** — Table of contents with section jump (hooked, implementation TBD)
4. **Swipe Gestures** — Swipe down to close sheets, swipe between Banis
5. **Reading Streaks** — Visual progress indicator in Reading Options
6. **Font Preview** — Live preview when selecting font family in Compact Settings
7. **Auto-Scroll** — Controlled auto-scrolling with speed control
8. **Night Light** — Warm color temperature adjustment for late-night reading
9. **Read Aloud** — Text-to-speech integration with word highlighting
10. **Social Sharing** — Share verses as images or text

---

## ESTIMATED IMPLEMENTATION TIME

### Per Phase

- **Phase 1 (Foundation):** 3-4 hours (CSS + HTML structure)
- **Phase 2 (JavaScript Controller):** 2-3 hours (wiring + modal state machine)
- **Phase 3 (Header Simplification):** 1 hour (HTML deletions + CSS adjustments)
- **Phase 4 (Scroll Position Preservation):** 1-2 hours (implementation + testing)
- **Phase 5 (Advanced Settings Adjustments):** 1 hour (z-index + notes)
- **Phase 6 (Polish & Integration):** 2-3 hours (testing + edge cases)
- **Phase 7 (Final Verification):** 3-4 hours (cross-device + accessibility + performance)

**Total: 13-18 hours** for complete, tested, production-ready implementation

---

## CONCLUSION

This plan provides a **bottom-up, non-destructive reconstruction** of the Nitnem Reader UI to match the Apple Books reference design. By creating new UI components alongside the existing system and wiring them to existing functions, we preserve all functionality while dramatically improving the presentation layer.

**Key Success Factors:**

1. ✅ **Audit-driven** — Every decision grounded in actual codebase state
2. ✅ **Preservation-first** — Zero data loss, zero functionality removal
3. ✅ **Modular approach** — New files alongside old, atomic swap
4. ✅ **Reference-faithful** — Three-state design matches Apple Books closely
5. ✅ **Production-grade** — Safe-area handling, accessibility, performance considered
6. ✅ **Rollback-safe** — Can revert quickly if issues found

**This is a renovation, not a demolition. Every existing feature remains accessible, now with a premium, reference-inspired presentation.**
