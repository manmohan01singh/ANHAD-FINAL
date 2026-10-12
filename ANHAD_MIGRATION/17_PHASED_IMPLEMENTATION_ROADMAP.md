# ANHAD Phased Implementation Roadmap
**Document:** `ANHAD_MIGRATION/17_PHASED_IMPLEMENTATION_ROADMAP.md`  
**Version:** 1.0.0  

---

## 1. Roadmap Overview & Sequencing Logic

Work is scheduled based on dependencies, technical risk, and verifiable value:
1. **Foundation First:** Build environment, design tokens, typography, and navigation skeleton.
2. **Audio Early:** Build the authoritative audio engine early to validate background playback and lockscreen controls before building surrounding features.
3. **Core Devotional Features:** Scripture reader, offline database, Hukamnama, and Tracker.
4. **Specialized Features:** Naam Abhyas, Sadhsangat YouTube live, Calendar, Notes, and Alarms.
5. **Stability & Release:** Performance profiling, quality gates, automated testing, and store packaging.

---

## 2. The 8 Ordered Implementation Parts

### Part 1 — Foundation, Design System & Navigation Architecture
- **Objective:** Initialize `ANHADIN-REACT`, verify builds on Android & iOS, implement theme tokens, custom Gurmukhi fonts, and basic navigation shell.
- **Scope:**
  - Create project via `npx create-expo-app ANHADIN-REACT -t default`.
  - Configure strict TypeScript, Prettier, ESLint, Jest.
  - Install `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`.
  - Embed custom Gurmukhi fonts (`NotoSansGurmukhi`, `RiyastiHastlikhat`, `PGMuskan`) and display serif (`Cinzel`, `OptimusPrinceps`).
  - Implement design token theme system (`src/theme/colors.ts`, `typography.ts`, `shadows.ts`, `useTheme.ts`).
  - Build basic 4-tab bottom navigation (Home, Insights, Sadhsangat, Favorites).
- **Exit Criteria:** Project compiles and boots cleanly on physical Android and iOS devices; custom Gurmukhi text renders correctly; theme toggles between Light, Dark, Divine Gold, and Auto without flickering.
- **Estimated Effort:** 3-4 days (Confidence: High).

### Part 2 — Flagship Home Screen & Reusable Component Library
- **Objective:** Recreate the flagship `HomeScreen` matching `index.html` visual hierarchy and optical balance.
- **Scope:**
  - Top header with logo and live status pill.
  - Hero devotional banner with dynamic diurnal background artwork.
  - Optical Guru Sahib portrait carousel with smooth panning.
  - Live stream cards (Darbar Sahib, Amritvela, Simran).
  - Daily tracker preview cards (Nitnem checklist, Sehaj Paath progress, Hukamnama card, streak badge).
  - Quick practice cards grid (Naam Abhyas, Khoj, Sadhsangat, Notes).
- **Exit Criteria:** Visual comparison against `index.html` demonstrates identical layout geometry, card radii, color grading, and responsive layout across standard phone widths.
- **Estimated Effort:** 4-5 days (Confidence: High).

### Part 3 — Audio Engine & Authoritative Background Playback
- **Objective:** Port `anhad-audio-singleton.js` to `react-native-track-player` with 100% reliability.
- **Scope:**
  - Install and configure `react-native-track-player` v4.1 with Android foreground service and iOS AVPlayer.
  - Implement `VirtualLiveEngine.ts`: pure UTC timeline mathematics for 40-track Amritvela and 38-track Simran virtual broadcasts.
  - Implement `AudioService.ts`: owns `wantsPlayback` invariant, stream connection, and bounded adaptive reconnect backoff (`[2, 4, 8, 12, 15]s`).
  - Implement `useAudioStore.ts` (Zustand).
  - Build `GlobalMiniPlayer.tsx` floating above bottom navigation.
  - Build full-screen `RadioScreen.tsx` with stream switcher and volume.
  - Build `StreamLibrarySheet.tsx` for 8 curated live gurdwara channels.
  - Wire native lock screen controls, notification actions, and Bluetooth/headphone events.
- **Exit Criteria:** Playback survives app minimization, lock screen, screen shutoff, and screen navigation; network disconnect recovers automatically upon reconnection without user input; zero duplicate audio elements.
- **Estimated Effort:** 5-6 days (Confidence: High).

### Part 4 — Offline Scripture Database & Sacred Bani Reader
- **Objective:** Implement local SQLite scripture database and universal high-performance Bani reader.
- **Scope:**
  - Convert 12 JSON scripture files (11 data files, 93.11 MB, 107 Banis, 25,697 verses) into pre-indexed SQLite database (`anhad_gurbani.db`) with an on-demand `cached_angs` table for Sehaj Paath.
  - Implement `src/database/db.ts` and `baniQueries.ts` via `op-sqlite`.
  - Rebuild `NitnemHubScreen.tsx` with category tabs (Nitnem, SGGS, Dasam, Sarbloh).
  - Build `BaniReaderScreen.tsx` supporting:
    - Custom Gurmukhi font selection (`Riyasti`, `Muskan`, `Noto`).
    - Dynamic font size slider (18pt - 42pt).
    - Native Larivaar mode toggle with syllable-assist colors.
    - Multi-line translations (English & Punjabi) and transliterations.
    - Smooth auto-scroll with speed controls.
    - Screen keep-awake during reading.
  - Build `MyPothiScreen.tsx` with drag-and-drop custom prayer books.
- **Exit Criteria:** Any Bani opens in < 50ms from local SQLite; Larivaar joins words flawlessly; font resizing causes zero layout jitter; auto-scroll operates at 60fps.
- **Estimated Effort:** 6-7 days (Confidence: High).

### Part 5 — Daily Hukamnama Sahib & Social Card Generator
- **Objective:** Port Daily Hukamnama screen, historical date lookup, and Instagram/WhatsApp story card generator.
- **Scope:**
  - Build `HukamnamaScreen.tsx` with TanStack Query caching of `https://api.banidb.com/v2/hukamnamas/today`.
  - Implement author Guru identification and dynamic portrait banner.
  - Historical calendar date picker for browsing past Hukamnamas.
  - Audio recitation playback bar.
  - Rebuild `HukamnamaCardModal.tsx` using `react-native-view-shot` for exporting story cards (1:1 and 9:16 aspect ratios) with theme selection.
- **Exit Criteria:** Hukamnama loads with correct Guru portrait; date picker loads historical records; story card exports as crisp PNG to device share sheet.
- **Estimated Effort:** 3-4 days (Confidence: High).

### Part 6 — Nitnem Tracker, Streaks & Sehaj Paath
- **Objective:** Port daily spiritual habit tracking, streak mathematics, and 1430-Ang Sehaj Paath tracker.
- **Scope:**
  - Build `NitnemTrackerScreen.tsx` with morning, evening, night checklists.
  - Implement daily reset logic, archiving completed days, and calculating consecutive streaks in MMKV.
  - Build `SehajPaathScreen.tsx` tracking Ang 1 to 1430 with progress percentage and completion date estimator.
  - Build `SehajPaathReaderScreen.tsx` with Ang-by-Ang navigation, auto-bookmarking on scroll, and reflection notes.
- **Exit Criteria:** Daily checklist toggles smoothly; midnight rollover preserves streaks; Sehaj Paath bookmarks persist accurately across app restarts.
- **Estimated Effort:** 4-5 days (Confidence: High).

### Part 7 — Naam Abhyas, Search, Sadhsangat & Alarms
- **Objective:** Complete remaining core features and platform integrations.
- **Scope:**
  - Build `NaamAbhyasScreen.tsx` with `react-native-reanimated` breathing circle, Mala counter with haptics, ambient audio loops, Hourly Practice Engine, and 11 achievements tracking.
  - Build `GurbaniKhojScreen.tsx` with full-text search, Gurmukhi on-screen keyboard, and speech-to-text input.
  - Build `SadhsangatScreen.tsx` with YouTube channel live feeds and video embeds (`react-native-youtube-iframe`).
  - Build `CalendarScreen.tsx` with Gurpurab countdowns.
  - Build `NotesScreen.tsx` and `FavoritesScreen.tsx`.
  - Build `RemindersScreen.tsx` using `@notifee/react-native` exact alarms with full-screen intent wake-up for Amritvela.
  - Build `SettingsScreen.tsx` with theme switcher and backup/restore.
- **Exit Criteria:** Simran counter vibrates with each bead; Gurbani search returns results in < 500ms; Sadhsangat streams play cleanly; Amritvela alarm wakes device from sleep.
- **Estimated Effort:** 6-7 days (Confidence: High).

### Part 8 — Comprehensive QA, Optimization & Store Readiness
- **Objective:** Full automated test execution, performance profiling, accessibility review, and release packaging.
- **Scope:**
  - Run complete unit, integration, and visual regression test suites.
  - Memory leak and battery consumption audit during 4-hour background streaming.
  - Android release build verification (AAB signing, ProGuard/R8 optimization).
  - iOS release build verification (IPA signing, privacy manifests, background audio entitlements).
  - Final visual parity audit comparing original against new mobile build.
- **Exit Criteria:** Zero crashes; 60fps scrolling; background audio passes 4-hour endurance test; release builds successfully generate and install.
- **Estimated Effort:** 4-5 days (Confidence: High).
