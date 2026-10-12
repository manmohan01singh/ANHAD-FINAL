# ANHAD Technical Debt & Migration Risk Analysis
**Document:** ANHAD_MIGRATION/04_TECHNICAL_DEBT_AND_RISKS.md  
**Version:** 1.0.0  

---

## 1. Top Technical Debt Findings

### 1.1 Fake SPA Navigation Architecture (smooth-navigation.js)
- **Severity:** Critical
- **Evidence:** frontend/lib/smooth-navigation.js contains 1,550 lines of complex string-based URL normalization, regex script scraping, dynamic script tag evaluation, and DOM tree swapping.
- **Problem:** Because scripts are evaluated dynamically, event listeners are frequently registered multiple times upon repeated visits to the same screen, leading to memory leaks and erratic button responses.
- **Resolution in RN:** Completely eliminate smooth-navigation.js. Use @react-navigation/native with @react-navigation/native-stack and @react-navigation/bottom-tabs.

### 1.2 Fragmented & Duplicated Mini-Player Logic (overlay-player.js)
- **Severity:** High
- **Evidence:** frontend/lib/overlay-player.js checks isMiniPlayerPage() via pathname parsing (lines 32-56) and imperatively creates and destroys <aside id="gmp">. On reader pages, CSS conflicts frequently reduce the player to an unreadable 10px strip or cause it to overlap prayer text.
- **Problem:** DOM-based z-index wars and race conditions between page CSS files.
- **Resolution in RN:** Single global MiniPlayer component rendered in the Root Navigation hierarchy right above the bottom tab bar, driven by a reactive Zustand store.

### 1.3 Massive Redundant CSS Files with Conflicting Overrides
- **Severity:** High
- **Evidence:** frontend/css/ contains 34 CSS files totaling ~700 KB, including desktop-responsive.css (110 KB), 	rendora-premium.css (108 KB), ios-override.css (87 KB), anhad-core.css (33 KB), and 5 different scroll fix stylesheets (scroll-engine.css, scroll-fix-simple.css, scroll-performance-fix.css, 
esponsive-fix.css, mobile-lock.css).
- **Problem:** Specificity escalation, extensive use of !important, and unmaintainable cascades.
- **Resolution in RN:** Unified TypeScript design token theme system with strictly scoped React Native components (StyleSheet.create or Unistyles). Zero global cascading conflicts.

### 1.4 Unstructured & Fragile localStorage Access
- **Severity:** High
- **Evidence:** More than 200 raw localStorage.getItem and localStorage.setItem calls scattered across 50+ JS files without type checking or JSON parsing guards. If an unexpected character is written, subsequent page visits crash with JSON parse errors.
- **Resolution in RN:** Centralized, type-safe persistence using react-native-mmkv with Zod schema validation and migration adapters.

### 1.5 WebView Background Audio Constraints & Kill Protection Hacks
- **Severity:** High
- **Evidence:** In frontend/lib/anhad-audio-singleton.js and android/app/src/main/java/com/anhad/app/AudioForegroundService.java, complex bidirectional IPC was written to keep Android from killing the WebView during background playback.
- **Problem:** Android aggressively throttles WebView timers and audio after 5-10 minutes in background or screen-off state.
- **Resolution in RN:** react-native-track-player runs on native background services (MediaSessionCompat and ExoPlayer), guaranteeing uninterrupted 24/7 background playback without WebView workarounds.

---


### 1.6 Client Alarm Architecture Fragmentation
- **Severity:** High
- **Evidence:** 11 overlapping client JavaScript alarm scripts exist in frontend/ (NaamAbhyas/naam-alarm.js, NitnemTracker/auto-alarm-sync.js, lib/alarm-coordinator.js, lib/alarm-persistence.js, lib/fallback-alarm-system.js, lib/global-alarm-system.js, lib/guaranteed-alarm-system.js, 
eminders/js/alarm-controller.js, 
eminders/js/alarm.js, 
eminders/js/bg-alarm.js, 
eminders/js/reliable-alarm.js).
- **Problem:** Competing interval timers, duplicate notification triggers, and unreliable background firing.
- **Resolution in RN:** Consolidate all 11 alarm scripts into a single unified @notifee/react-native exact trigger notification service with an Android BOOT_COMPLETED rescheduling receiver (StreakSaverBootReceiver parity).

### 1.7 Shadowed Express Routes in backend/server.js
- **Severity:** Medium
- **Evidence:** 12 duplicate route registrations in backend/server.js: /api/simran/live (lines 1212 & 1656), /api/simran/durations (1260 & 1716), /api/simran/heartbeat (1280 & 1740), /api/simran/listeners (1306 & 1769), /api/simran/status (1316 & 1781), /api/sehaj-paath/progress (1472 & 1885), /api/sehaj-paath/bookmarks (1523 & 1936), /reader.html (1566 & 5628), /sehaj-reader.html (1573 & 5633).
- **Resolution in RN:** React Native API client directly invokes canonical route signatures.

### 1.8 Dead & Abandoned Code
- **Severity:** Low
- **Evidence:** worker/src/index.js (unreferenced Cloudflare Worker serverless code) and #liveKirtanCard (referenced in gurbani-khoj.js and live-kirtan-tracker.js, but missing from gurbani-khoj.html).
- **Resolution in RN:** Exclude dead modules from migration scope.

### 1.9 Google Fonts CDN Dependency
- **Severity:** Medium
- **Evidence:** 120 references in HTML/CSS to fonts.googleapis.com for primary fonts Cinzel and Noto Sans Gurmukhi. Neither is present in frontend's 19 local fonts.
- **Resolution in RN:** Bundle Cinzel and Noto Sans Gurmukhi directly as local .ttf assets in React Native.

---

## 2. High-Risk Migration Areas & Mitigation Strategies

| High-Risk Area | Nature of Risk | Impact | Concrete Mitigation Strategy |
|---|---|---|---|
| **Virtual Live Broadcast Engine** | Drift in calculated track or seek position across app lifecycles | Listeners desync from worldwide virtual live kirtan timeline | Port VirtualLiveBroadcastEngine mathematics to a pure, isolated TypeScript module with 100% unit test coverage comparing against existing test vectors in 	ests/audio/virtual-live-timeline-algebra.test.js. |
| **Offline Gurbani Library (90 MB)** | Massive JSON bundle size causing startup lag or memory overflow | App launch delay, out-of-memory crashes on low-end devices | Move offline Bani chunks from raw JSON into an indexed SQLite database (op-sqlite or WatermelonDB) with pre-built indices on baniID and verseId. |
| **Amritvela Alarms & Exact Alarms** | Android 12+ (API 31+) restricts SCHEDULE_EXACT_ALARM; background alarms silenced | Users miss Amritvela morning prayer wake-up call | Use @notifee/react-native or custom Native Module requesting SCHEDULE_EXACT_ALARM and REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, with full-screen intent activity. |
| **Gurmukhi Typography & Ligatures** | Gurmukhi Unicode rendering bugs, broken Sihaari/Bihaari matras, or missing font weights | Sacred scripture rendered incorrectly or disrespectfully | Bundle high-quality Gurmukhi fonts (RiyastiHastlikhat.ttf, NotoSansGurmukhi-Regular.ttf, NotoSansGurmukhi-Bold.ttf) and test complex Gurbani ligatures across Android & iOS text engines. |
| **Sadhsangat Live YouTube Embeds** | Incompatible YouTube IFrame API or WebView crashes | Video streams fail to render or consume excessive CPU | Use react-native-youtube-iframe (optimized lightweight native webview wrapper) with active playback suspension when scrolled out of view. |
