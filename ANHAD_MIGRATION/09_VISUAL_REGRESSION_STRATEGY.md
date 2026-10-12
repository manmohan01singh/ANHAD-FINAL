# ANHAD Visual Acceptance & Regression Testing Strategy
**Document:** `ANHAD_MIGRATION/09_VISUAL_REGRESSION_STRATEGY.md`  
**Version:** 1.0.0  

---

## 1. Visual Acceptance Goals

The standard for success is that **an existing ANHAD user will immediately recognize the application**. It must preserve:
- The exact warm, devotional spiritual color grading (Sacred Gold, Cream, Deep Charcoal/Night).
- The proportions and optical centering of the Guru Sahib portraits and hero banners.
- The precise Gurmukhi typography, ligatures, and font hierarchy.
- The claymorphic/glassmorphic elevation and smooth card radii.
- The seamless persistent mini-player behavior.

---

## 2. Baseline Devices & Viewport Matrix

All visual comparisons must be conducted against the following standard screen sizes:

| Form Factor | Device Archetype | Logical Dimensions | Density | Focus Areas |
|---|---|---|---|---|
| **Compact Phone** | iPhone SE (3rd Gen) / Pixel 4a | 375 x 667 pt | @2x / @2.75x | Small screen wrapping, mini-player safe area, button tap targets |
| **Standard Phone** | iPhone 15 / Galaxy S24 | 393 x 852 pt | @3x | Dynamic Island safe-area, standard card padding, reading line length |
| **Large Pro Phone** | iPhone 15 Pro Max / Pixel 8 Pro | 430 x 932 pt | @3x / @3.5x | Optical balance, hero banner max-width, bottom tab bar spacing |
| **Tablet** | iPad Mini / Galaxy Tab S9 | 744 x 1133 pt | @2x | Multi-column layouts, reader margins, landscape orientation |

---

## 3. Visual Regression Process & Tooling

### 3.1 Automated Snapshot Testing (Component & Screen Level)
- Tooling: Jest + React Native Testing Library + `react-test-renderer`.
- Every screen rendered in 4 canonical themes:
  1. `Light` (Standard Day)
  2. `Dark` (Standard Night)
  3. `Morning` (Auto Peach)
  4. `Divine Gold` (Warm Amber)
- Snapshots check for:
  - Component tree hierarchy fidelity.
  - Proper font family application (`NotoSansGurmukhi`, `RiyastiHastlikhat`).
  - Correct color token inheritance.

### 3.2 Pixel-Fidelity End-to-End Visual Testing
- Automated screenshots via Maestro / Detox on iOS Simulator & Android Emulator.
- Baseline capture of the original Capacitor web app screens using identical dimensions and content fixtures (e.g. fixed date: Oct 9, fixed Hukamnama Ang: 654).
- Image diffing via pixelmatch / Playwright visual comparison:
  - Geometry threshold: < 2% allowable pixel variation due to native font rasterization differences.
  - Layout structure threshold: 0% variation on card ordering, alignment, or missing elements.

### 3.3 Visual Acceptance Checklist for Every Migrated Screen
1. [ ] Correct status bar style (light/dark according to active theme).
2. [ ] Safe-area insets respected on notch, Dynamic Island, and home indicator.
3. [ ] All images preserve aspect ratio without stretching or distortion.
4. [ ] All Gurmukhi text renders complete ligatures without dropped matras.
5. [ ] Bottom navigation and mini-player do not overlap screen content or buttons.
6. [ ] Claymorphic cards show soft, subtle elevation without harsh black drop shadows.
7. [ ] Smooth 60fps scrolling with zero stuttering or blank white flashes.
