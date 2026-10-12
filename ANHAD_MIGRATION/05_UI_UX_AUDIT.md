# ANHAD UI/UX Reverse Engineering & Design System Audit
**Document:** `ANHAD_MIGRATION/05_UI_UX_AUDIT.md`  
**Version:** 1.0.0  

---

## 1. Visual Identity & Brand Philosophy

ANHAD represents a sacred, serene, and spiritually elevated digital experience. The interface combines:
1. **Apple Human Interface Guidelines (HIG):** Restrained typography, subtle frosted glass / claymorphic surfaces, fluid rounded corners (16-24px radii), and clean optical alignment.
2. **Sacred Sikh Aesthetics:** Warm golden accents (`#D4943A`, `#B8860B`, `#FFD60A`), deep contemplative backgrounds (`#0D0D0F`, `#1C1C1E`), and reverent Guru Sahib portraiture.
3. **Dynamic Diurnal Rhythm (Circadian Auto-Theme):**
   - **Amritvela / Morning (5:00 AM – 9:00 AM):** Warm soft peach/dawn tones (`#FFF5EC`), gentle golden illumination.
   - **Day (9:00 AM – 4:00 PM):** Pure clean ivory/cream surface (`#FAF8F5`), high contrast text.
   - **Sandhya / Evening (4:00 PM – 8:00 PM):** Rich warm amber golden hour tones (`#FFF8E7`), peaceful sunset glow.
   - **Night (8:00 PM – 5:00 AM):** Deep OLED black / dark slate (`#0D0D0F`), subdued amber highlights, zero eye strain.

---

## 2. Core Layouts & Component Hierarchies

### 2.1 The Flagship Home Screen (`index.html`)
- **Top Utility & Brand Header:** Logo, Gurmukhi ligature "ਅਨਹਦ ਬਾਣੀ", live Darbar Sahib status pill, search shortcut, and settings toggle.
- **Hero Devotional Banner & Dark Carousel:**
  - Dynamic Time-of-Day background artwork (`assets/HERO CARD IMAGES/`).
  - Guru Sahib portrait carousel with optical centering and gentle panning effect.
  - Active Chaliya / Gurpurab campaign event badge with gold foil borders.
- **Live Stream Hero Cards:**
  - Darbar Sahib Live Stream card with live audio equalizer bars and "Listen Live" CTA.
  - Amritvela Kirtan card with virtual live progress indicator.
  - Waheguru Simran card with track info.
- **Spiritual Daily Dashboard:**
  - Nitnem Daily Checklist progress ring.
  - Sehaj Paath current Ang and daily target indicator.
  - Daily Hukamnama quick preview card.
  - Daily Spiritual Streak counter flame badge.
- **Quick Practice Cards Grid:**
  - Naam Abhyas (Simran Mala counter).
  - Gurbani Khoj (Search).
  - Sadhsangat Live (YouTube broadcasts).
  - Spiritual Notes & Treasury.

### 2.2 Reader Experience (`nitnem/reader.html`, `SehajPaath/reader.html`)
- **Immersive Distraction-Free Layout:** Auto-hiding navigation bars on scroll down, restoring on gentle scroll up or tap.
- **Typography Controls:** Slider for font size (18px to 42px), line height, letter spacing, font family switcher.
- **Larivaar Support:** Native Gurmukhi continuous script toggle with syllable-assist coloring.
- **Multi-line Scripture Presentation:**
  - Gurmukhi original (sacred verse).
  - Transliteration (English, Hindi, Shahmukhi).
  - Translation (English Sant Singh Khalsa / Punjabi Bhai Manmohan Singh).
  - Vishram (pause points) subtle color highlighting.

---

## 3. Claymorphic & Glassmorphic Elevation System

In `css/claymorphism-system.css` and `css/anhad-clay.css`:
- **Surface Construction:** Soft inner bevel highlights combined with diffuse outer drop shadows:
  - Outer shadow: `0 8px 24px rgba(0, 0, 0, 0.08)`
  - Inner highlight: `inset 0 1px 1px rgba(255, 255, 255, 0.6)`
  - Border: `1px solid rgba(255, 255, 255, 0.15)`
- **In React Native:** Replicate using subtle dual-layer elevation with custom view styling and semi-transparent alpha borders.
