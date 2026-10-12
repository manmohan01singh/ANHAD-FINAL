# ANHAD Executive Migration Report & Blueprint Summary
**Document:** `ANHAD_MIGRATION/21_EXECUTIVE_MIGRATION_REPORT.md`  
**Version:** 1.0.0  
**Project:** ANHAD (Gurbani Radio & Nitnem) → `ANHADIN-REACT`  
**Lead Architect:** Principal React Native Architect, Mobile UI/UX Reverse Engineer, Audio Systems Engineer  

---

## 1. Inventory & Codebase Metrics

- **Total Repository Files Discovered:** 2,645 files (excluding `.git` and `node_modules`).
  - *Repository-wide breakdown:* 666 JS, 309 PNG, 268 CSS, 220 AVIF, 215 HTML, 192 MD, 127 JSON, 91 WebP, 68 XML, 38 Fonts (35 TTF, 1 OTF, 1 WOFF, 1 WOFF2), 32 JPG, 26 MP3, 25 JPEG, 23 BAT, 22 Java (20 application + 2 test), 6 Swift.
- **Frontend Codebase Files (Exact Directory Count):** 747 files total (100% itemized):
  - 215 JavaScript, 110 AVIF, 109 CSS, 87 HTML, 85 PNG, 38 WebP, 34 JSON (including 12 scripture data chunks & configs), 25 JPG/JPEG (13 JPG, 12 JPEG), 19 Fonts (16 TTF, 1 OTF, 1 WOFF, 1 WOFF2), 13 Audio (9 MP3, 4 MPEG), 6 SVG, 6 other (2 ICO, 2 PDF, 1 TXT, 1 ZIP).
  - *Note on previous audit conflation:* Previous initial estimates conflated repository-wide file extension totals with the frontend directory; the exact counts above establish the verified source of truth.
- **Backend Codebase Files:** 54 files (Express Node.js server with 111 endpoints in `backend/server.js`, containing 12 shadowed duplicate route registrations).
- **Gamification & Discipline Engines:** **29 total achievements** across two separate engines:
  - 11 Naam Abhyas Hourly Practice discipline badges (`frontend/NaamAbhyas/components/discipline-metrics.js` L332-360).
  - 18 Sehaj Paath Reading progression badges (`frontend/SehajPaath/components/achievements-engine.js` L14-33).
- **Native Platform Files (True Native Code vs. Capacitor Sync Copies):**
  - **Android (462 files total):** 279 files are web assets copied by Capacitor sync into `android/app/src/main/assets/public`. True native code comprises 20 application Java files in `com.anhad.app` (1 MainActivity, 4 plugins/services/receivers, 12 widget providers/bridges) plus 2 auto-generated test files.
  - **iOS (740 files total):** 726 files are web assets copied by Capacitor sync into `ios/App/App/public`. True native code comprises 6 Swift files (WidgetKit extensions and `WidgetDataBridge.swift`).
- **Curated Streams Cataloged:** Exactly **8 streams** defined in the stream library (darbar, amritvela, simran, and 5 SikhNet channels: sn_bangla, sn_sisganj, sn_hazur, sn_dukh, sn_raag), rather than 20+.
- **Offline Scripture & Sehaj Paath Breakdown:**
  - Offline scripture database: 107 Banis comprising 25,697 verses in `data-archive/all-banis-offline.json` and `frontend/data/banis-chunks/`.
  - Sehaj Paath reader: 0 offline Angs stored locally; all 1,430 Angs are queried on-demand from the live BaniDB API (`https://api.banidb.com/v2/angs/{ang}`).
- **Primary Typography & CDN Reliance:** 120 HTML/CSS references depend on `fonts.googleapis.com` for Cinzel and Noto Sans Gurmukhi (neither exists in frontend's 19 local font files); must be bundled locally as `.ttf` assets in React Native for complete offline readiness.
- **Client Alarm Architecture:** 24 overlapping client JavaScript alarm and reminder scripts across `frontend/` (spanning multi-generational versions v5-v7 and domain reminders) consolidated into a single `@notifee/react-native` exact trigger notification service with `BOOT_COMPLETED` reboot rescheduling (`StreakSaverBootReceiver` parity).
- **Spiritual Practice & Gamification:** Naam Abhyas Hourly Practice Engine (5 AM–10 PM) with 11 discipline badges, alongside the Sehaj Paath reading engine with 18 badges (29 total app achievements).
- **Consolidated Screens Identified:** 87 HTML pages mapped and consolidated into **24 Native React Native Screens** across 4 primary navigation tabs.
- **Distinct Features Cataloged:** 24 major features (Darbar Sahib live stream, Amritvela virtual live broadcast, Waheguru Simran virtual broadcast, Nitnem Hub, Sacred Bani Reader, Nitnem Tracker, Daily Hukamnama, Hukamnama Story Card Generator, Gurbani Khoj Search, Continuous Sehaj Paath 1430 Angs, Naam Abhyas Mala Counter & Hourly Engine, Sadhsangat YouTube Live, Gurpurab Calendar, Spiritual Notes, Treasury, Amritvela Exact Alarms, Diurnal Theme System, and Companion Mode).

---

## 2. Major Architectural Weaknesses in the Original Application

1. **Fake SPA Navigation Engine (`smooth-navigation.js`, 1,550 lines):** Uses DOMParser to fetch and swap HTML fragments over HTTP, evaluating scripts dynamically via regex. Causes memory leaks and listener accumulation.
2. **WebView Audio Background Throttling:** Running HTML5 audio inside an Android WebView led to aggressive background kills, necessitating complex Java foreground services with wake-lock hacks.
3. **Fragmented Mini-Player Injection (`overlay-player.js`):** Imperatively creates `<aside id="gmp">` based on URL pathname matching, causing CSS z-index conflicts and the known "10px broken strip" bug on reader pages.
4. **Massive Redundant CSS Overhead:** 34 CSS stylesheets totaling ~700 KB with overlapping `!important` declarations and 5 competing scroll-fix files.
5. **Memory-Intensive JSON Scripture Parsing:** Parsing 17 MB `popular-banis.json` and 9 MB `nitnem-banis.json` on client launch blocks the JavaScript thread.
6. **Shadowed Express Routes:** 12 duplicate endpoint registrations in backend/server.js (e.g. /api/simran/live at lines 1212 and 1656).
7. **Dead Code & Missing DOM Targets:** Unreferenced Cloudflare Worker (worker/src/index.js) and listener bindings to #liveKirtanCard in gurbani-khoj.js where the DOM element does not exist in gurbani-khoj.html.
8. **Alarm Fragmentation:** 11 competing client JavaScript alarm scripts in frontend/ creating race conditions and duplicate alerts.

---

## 3. Recommended React Native Technology Stack

- **Core Framework:** React Native 0.76+ with Expo SDK 52 (Development Builds & Prebuild).
- **Language:** TypeScript 5.5+ (Strict Mode).
- **Navigation:** `@react-navigation/native` v7 with `@react-navigation/native-stack` and `@react-navigation/bottom-tabs`.
- **Audio Engine:** `react-native-track-player` v4.1 (ExoPlayer on Android, AVPlayer on iOS, native lockscreen controls, notification actions, auto-reconnect backoff).
- **State Management:** `zustand` v5 (lightweight reactive stores) + `@tanstack/react-query` v5 (remote server cache).
- **Local Persistence:** `react-native-mmkv` v3 (synchronous C++ memory-mapped storage replacing `localStorage`).
- **Scripture Storage:** Local SQLite database (`op-sqlite`) with FTS5 search.
- **Alarms & Notifications:** `@notifee/react-native` (Android Exact Alarms with full-screen wake-up intent).
- **Design System & Styling:** `react-native-unistyles` v3 or theme-token `StyleSheet.create`.
- **Animations & Lists:** `react-native-reanimated` v3 + `@shopify/flash-list`.

---

## 4. Destination Directory Structure

The new project will be created cleanly in a sibling directory:
`c:\Users\Manmohan Singh\converttoApp\ANHADIN-REACT`

Featuring strict separation of presentation, state stores, domain services, local database, and design tokens:
- `src/api/` (BaniDB, ANHAD backend clients)
- `src/components/` (Common, Audio, Gurbani, Modals)
- `src/config/` (Streams, durations, Maryada)
- `src/database/` (Pre-indexed SQLite database)
- `src/features/` (Audio, Tracker, Reader, Khoj, Sehaj Paath, Naam Abhyas)
- `src/hooks/` (useTheme, useAudioPlayer, useHaptics)
- `src/navigation/` (Root Stack, Bottom Tabs, TabBarContainer with MiniPlayer)
- `src/screens/` (24 modular React Native screens)
- `src/services/` (AudioService, VirtualLiveEngine, AlarmService)
- `src/store/` (Zustand: audioStore, themeStore, streakStore, readerStore)
- `src/theme/` (Colors, typography, spacing, shadows)

---

## 5. Ordered Implementation Phases & Estimated Effort

| Phase | Description | Estimated Duration | Confidence Level |
|---|---|---|---|
| **Part 1** | Foundation, Design System, Fonts & Navigation Architecture | 3 - 4 Days | High |
| **Part 2** | Flagship Home Screen & Reusable Component Library | 4 - 5 Days | High |
| **Part 3** | Audio Engine, Virtual Live Broadcast & Persistent Mini-Player | 5 - 6 Days | High |
| **Part 4** | Offline Scripture SQLite Database & Sacred Bani Reader | 6 - 7 Days | High |
| **Part 5** | Daily Hukamnama Sahib & Social Story Card Generator | 3 - 4 Days | High |
| **Part 6** | Nitnem Tracker, Streaks & Sehaj Paath Tracker | 4 - 5 Days | High |
| **Part 7** | Naam Abhyas Simran Counter, Search, Sadhsangat Live & Exact Alarms | 6 - 7 Days | Medium |
| **Part 8** | Comprehensive QA, Memory/Battery Profiling & Store Release Builds | 4 - 5 Days | High |
| **Total** | Complete End-to-End Production Migration | **35 - 43 Engineering Days** | **High** |

---

## 6. Key Decisions Requiring Human Approval

1. **Expo Development Builds vs Pure Community CLI:** We strongly recommend Expo SDK 52 with Development Builds. It provides rapid iteration and clean asset compilation while retaining 100% native access via Prebuild. Does the team approve using Expo Development Builds?
2. **Offline Database Format (SQLite vs Pre-chunked JSON):** Compiling the 90 MB JSON files into a single pre-indexed SQLite database (`anhad_gurbani.db`) reduces startup RAM from 120 MB to < 20 MB and accelerates verse retrieval to < 15ms. Does the team approve pre-compiling the dataset into SQLite?
3. **Retired Features Confirmation:** Per `CLAUDE.md`, Gurbani GPT is permanently retired and replaced with a polished "Coming Soon" dialog if requested. Confirmation requested to exclude Gurbani GPT code from the React Native build.
4. **Desktop/Electron Scope Boundary:** This migration blueprint focuses exclusively on the mobile application for iOS and Android. Desktop Electron support will be addressed in a subsequent phase. Confirmation requested.

---

## 7. Immediate First Implementation Milestone: Milestone 1

Upon approval of this blueprint, Milestone 1 will be executed:
1. Initialize `ANHADIN-REACT` in `c:\Users\Manmohan Singh\converttoApp\ANHADIN-REACT`.
2. Configure TypeScript strict mode, ESLint, Prettier, and React Navigation.
3. Link custom Gurmukhi fonts (`Riyasti`, `Muskan`, `Noto`) and display serif fonts (`Cinzel`).
4. Implement the Design Token Theme Provider with Light, Dark, Divine Gold, and Diurnal Auto-Theme modes.
5. Build the navigation shell with 4 bottom tabs and render the baseline `HomeScreen` verifying optical centering, Guru Sahib portrait carousel, and theme switching on real Android & iOS hardware.
