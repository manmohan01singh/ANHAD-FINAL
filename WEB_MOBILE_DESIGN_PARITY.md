# WEB-TO-MOBILE DESIGN PARITY & RECONCILIATION AUDIT

**Document:** `WEB_MOBILE_DESIGN_PARITY.md`  
**System:** ANHAD (Gurbani Radio, Nitnem Tracker, Simran & Sacred Scripture App)  
**Authoritative Single Source of Truth:** `ANHAD-FINAL` (Web Application: HTML5, CSS3, ES Modules, Liquid Glass & Claymorphism System)  
**Target Mobile Implementation:** `ANHADIN-REACT` (React Native / Expo Mobile Application)  
**Status:** Design Parity Restoration in Progress  

---

## 1. Discrepancy & Root Cause Analysis

### Identified Issue
The initial React Native implementation in `ANHADIN-REACT` deviated aggressively from the authoritative ANHAD web design reference (`ANHAD-FINAL`):
1. **Visual Language & Aesthetic Deviation:** The web application features an elevated, diurnal daytime design with ivory/cream palettes (`#FAF8F5`, `#FFF5EC`), sacred gold typography (`#D4943A`), and frosted liquid glass/claymorphic cards with soft drop shadows. The React Native app introduced an unapproved dark purple/charcoal theme (`#070A12`) with high-contrast yellow headings and rigid flat borders.
2. **Header Layout Deviation:** The web app features an iconic iOS-inspired header containing a left-side Settings (`#settingsBtn`) and Theme toggle button (`#themeToggleBtn`), a central title pill with `ANHAD` and Gurmukhi `ਅਨਹਦ`, and right-side Sangat Connect (`#sangatSearchBtn`) and Notifications bell (`#notifBtn`). The mobile app had collapsed this into a dark single-row banner with a yellow time badge and plain text.
3. **Hero & Devotional Greeting Deviation:** The web app features a prominent panoramic devotional greeting artwork (`guruimages/guru-greeting-hero.webp`) of Sri Guru Granth Sahib Ji with Guru Gobind Singh Ji and Guru Nanak Dev Ji, flanked by "SRI GURU GRANTH SAHIB JI" in sacred gold display typography, paired with a dynamic night-time Guru carousel. The mobile app replaced this with an evening quote card.
4. **Daily Progress Indicator Missing:** The web application's inline progress bar (`.progress-inline`) with `☀️ Start morning Nitnem` and `0/10 Banis` was missing from the mobile Home screen.
5. **Hero Featured Carousel Missing:** The web app's swipeable card carousel featuring Darbar Sahib Live, Amritvela Smagams, Waheguru Simran (with Mala Jaap button), and Today's Hukamnama (with Share Card button) was replaced by a vertical list of live stream cards.
6. **Upcoming Gurpurab Event Card Missing:** The web application's modern event card with gold-rimmed Guru portrait avatar, days-left pill, event title, date pill, and "Calendar >" CTA was absent.
7. **Bottom Navigation Architecture Deviation:** The web application uses a floating frosted liquid glass navigation pill (`.tab-bar` / `shared-nav-pill`) with 4 primary destinations (HOME, LEARNING, FAVORITES, SADHSANGAT). The mobile app had introduced a dark 60px fixed bottom tab bar with 5 non-standard tabs.

---

## 2. Screen-by-Screen Parity Matrix

| Feature / Screen | Web Reference (`ANHAD-FINAL`) | React Native State (`ANHADIN-REACT`) | Required Restoration Action |
|---|---|---|---|
| **Home Theme & Background** | Diurnal Circadian: Morning (`#FFF5EC`), Day (`#FAF8F5`), Evening (`#FFF8E7`), Night (`#0D0D0F`). Soft claymorphic shadows. | Hardcoded dark purple (`#070A12`, `#17223B`). | Restore diurnal light/daytime default palette with automatic night mode support. |
| **Top App Header** | Symmetrical 3-part header: Left (Settings + Theme Moon), Center (ANHAD / ਅਨਹਦ Pill), Right (Search + Bell Badge). | Asymmetrical text row with yellow time badge. | Rebuild `Header.tsx` to match the exact 3-part layout, title pill, and action buttons. |
| **Greeting Banner** | Panoramic `guru-greeting-hero.webp` with "SRI GURU GRANTH SAHIB JI" display typography and dark mode carousel. | Replaced by single static evening card. | Replicate `GreetingHeroBanner` with high-resolution artwork and golden display typography. |
| **Daily Progress** | Inline rounded progress bar with sun emoji, track, and `0/10 Banis` status. | Completely missing on Home. | Implement `DailyProgressBar` connecting to `useTrackerStore`. |
| **Featured Carousel** | Horizontal swipeable cards (Darbar Sahib, Amritvela Smagams, Waheguru Simran, Hukamnama) + 4-dot indicator. | Vertical list of stream cards. | Implement `HeroCarousel` with exact aspect ratios, badges (LIVE, CURATED, 24/7 SIMRAN), and play triggers. |
| **Upcoming Gurpurab** | Card with 80px gold-bordered Guru avatar, days left badge, title, date, and Calendar button. | Missing on Home. | Implement `UpcomingGurpurabCard` reading from `gurpurab-events-2026.json`. |
| **Practice Cards Grid** | "Your Practice" section with Nitnem, Streak, Mala Counter, Sehaj Paath, Reminders, and Calendar. | 2-column practice grid with dark cards. | Style practice grid to match claymorphic light cards with pastel circular icon backgrounds. |
| **Bottom Navigation** | Floating rounded pill dock (HOME, LEARNING, FAVORITES, SADHSANGAT) elevated above viewport bottom. | Fixed dark bottom tab bar (Home, Radio, Nitnem, Search, Sangat). | Rebuild `BottomTabNavigator` as a floating liquid glass dock with active gold indicator pill. |
| **Global Mini Player** | Floating mini player dock when stream is active, positioned above bottom navigation pill. | Fixed bar docked at screen edge. | Re-align `GlobalMiniPlayer` to float seamlessly above the floating nav dock. |

---

## 3. Component & Design Token Alignment

### Colors
- `primaryBackground`: `#FAF8F5` (day default), `#FFF5EC` (morning), `#FFF8E7` (evening), `#0D0D0F` (night)
- `cardBackground`: `#FFFFFF` (light), `#1C1C1E` (dark)
- `sacredGold`: `#D4943A` (primary accent), `#B8860B` (dark gold), `#FFD60A` (bright highlight)
- `textPrimary`: `#1C1C1E` (light), `#F5F5F7` (dark)
- `textSecondary`: `#7D6B58` (light warm), `#8E8E93` (dark)
- `cardBorder`: `rgba(0, 0, 0, 0.08)` (light), `rgba(255, 255, 255, 0.12)` (dark)

### Typography
- Titles: `TrajanPro`, `OptimusPrinceps`, bold serif/display with uppercase tracking
- Gurmukhi: `RiyastiHastlikhat`, `PGMuskan`, `Noto Sans Gurmukhi`
- Body: Inter / System Sans, 14–16px, line height 22–24px
