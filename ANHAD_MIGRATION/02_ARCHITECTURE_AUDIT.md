# ANHAD Architecture Audit: Execution Flow, Lifecycle & Hidden Dependencies
**Document:** ANHAD_MIGRATION/02_ARCHITECTURE_AUDIT.md  
**Version:** 1.0.0  

---

## 1. Application Execution Flow & Entry Points

### 1.1 Web/Capacitor Entry Point
The application starts at frontend/index.html. Before any HTML element is parsed or rendered, two inline blocking <script> tags execute in <head>:

1. **Theme Blocker (index.html Lines 6-109):**
   - Reads localStorage.getItem('anhad_theme') and localStorage.getItem('anhad_forced_time_of_day').
   - Computes effective theme (dark vs light) and time-of-day phase (morning: 5-9 AM, day: 9 AM - 4 PM, evening: 4-8 PM, 
ight: 8 PM - 5 AM).
   - Injects a dynamic <style> tag into <head> setting :root and [data-anhad-home] CSS custom properties to prevent Flash of Unstyled Content (FOUC).
   - Sets data-theme, data-theme-mode, and data-time-of-day attributes on <html>.

2. **Session Initializer (index.html Lines 111-135):**
   - Initializes memory cache for _anhadSessionCache to reduce localStorage reads.

3. **DOM Content Loaded & Core Script Execution:**
   - Scripts are loaded in sequence: global-theme.js, home-state-manager.js, scroll-engine.js, anhad-core.js, desktop-sidebar.js, smooth-navigation.js, page-lifecycle.js, capacitor-bridge.js, anhad-audio-singleton.js, overlay-player.js.
   - anhad-core.js initializes common UI controls, modal managers, and touch ripple effects.
   - anhad-audio-singleton.js initializes audio state from localStorage.getItem('anhad_audio_state_v4'), binds MediaSession handlers, and listens for native commands.
   - overlay-player.js checks isMiniPlayerPage() and injects <aside id="gmp"> if on Home, Favorites, or Insights.

---

## 2. Navigation Architecture: The Fake SPA Engine

Because ANHAD was originally built as a multi-page website with 87 distinct HTML files, moving between pages normally causes a full browser page refresh, terminating audio playback.

To circumvent this, the authors built **frontend/lib/smooth-navigation.js** (1,550 lines):
- Intercepts all link clicks (<a href="...">).
- Executes fetch(targetUrl) with an in-memory HTML page cache (PAGE_CACHE_MAX = 8).
- Uses DOMParser to parse the fetched HTML document.
- Extracts <main id="app"> and replaces the current DOM node.
- Scans and executes newly loaded <script> tags by dynamically creating <script> elements and appending them to document.body.
- Manages data-spa-page tags on stylesheets to dynamically add and remove page-specific CSS files.
- Fires lifecycle events (window.__anhadPageInit and window.__anhadPageCleanup).

### Architectural Assessment for React Native:
This entire 1,550-line mechanism is a fragile browser-only workaround. In React Native:
- Screens do not reload documents or parse HTML.
- React Navigation maintains an in-memory stack/tab tree.
- Component mounting and unmounting naturally execute useEffect cleanup.
- Audio playback runs continuously on native background threads completely independent of screen transitions.

---

## 3. Data Flow & Persistence Architecture

### 3.1 Local Storage Layers
1. **localStorage (Direct Key-Value):**
   - anhad_theme: Selected theme (auto, light, dark, divineGold).
   - anhad_audio_state_v4: Current stream, volume, playback state, and timestamp.
   - anhad_audio_track_durations_v4: Cached durations of audio files.
   - gr_custom_slots: Active radio tab slots.
   - 
itnem_tracker_data: Completion checklist and streak counts.
   - sehaj_paath_progress: Current Ang (1-1430), daily target, and reading history.
   - 
aam_abhyas_config, 
aam_abhyas_history: Simran timer settings and logs.
   - anhad_notes: Array of user reflection notes.
   - anhad_favorites: Bookmarked Banis, Shabads, and tracks.
2. **sessionStorage:** Temporary UI state (e.g. gurbaniKhoj_state).
3. **Storage Guards (lib/unified-storage.js, lib/storage-lock.js):** Mutex locks implemented via storage event polling to avoid race conditions between tabs/pages.

### 3.2 Remote Data Flow
- **BaniDB REST API (https://api.banidb.com/v2):**
  - Full-text search queries (/search/{query}).
  - Shabad details (/shabads/{id}).
  - Daily Hukamnama (/hukamnamas/today and /hukamnamas/{year}/{month}/{day}).
- **Pre-bundled JSON Chunks (frontend/data/banis-chunks/):**
  - Offline-first cache containing 107 Banis (25,697 verses) across pre-chunked JSON files in data/banis-chunks/. Note: Sehaj Paath has 0 offline Angs stored locally; all 1,430 Angs are fetched dynamically via https://api.banidb.com/v2/angs/{ang}.
- **Backend API (https://anhad-final.onrender.com):**
  - /api/radio/*, /api/simran/*: Heartbeats and active listener counts.
  - /api/sadhsangat/*: YouTube live stream feeds and channel metadata.
  - /api/config/*: Campaign remote configs and broadcast messages.

---

## 4. Hidden Browser Dependencies

The repository exhibits heavy coupling to browser globals across 215 JS files:
1. **window and document DOM manipulation:** Over 3,200 instances of document.getElementById, document.querySelector, innerHTML, classList.add.
2. **localStorage and sessionStorage:** Synchronous string storage scattered throughout feature files without strict schemas.
3. **HTMLAudioElement and Web Audio API:** Direct instantiation of nnew Audio(), binding to DOM events (ended, stalled, 	imeupdate, canplay).
4. **
avigator.onLine and window.addEventListener('online'):** Fragile network listeners.
5. **MediaSession (
avigator.mediaSession):** Browser-only lock screen integration.
6. **IntersectionObserver & MutationObserver:** Used heavily in smooth-navigation.js, lazy images, and infinite scroll lists.
7. **window.innerWidth & CSS Media Queries:** Hard-coded desktop vs mobile threshold logic (1024px).

Each of these must be systematically replaced with its corresponding React Native primitive (React State/Props, MMKV, react-native-track-player, @react-native-community/netinfo, useWindowDimensions, and FlashList).

---

## 5. Backend Routes & Code Quality Findings

1. **Shadowed Express Routes in backend/server.js:**
   - A deep audit revealed 12 duplicate route registrations in backend/server.js. Because Express matches the first registered handler, subsequent duplicates are shadowed:
     - GET /api/simran/live (registered at lines 1212 and 1656)
     - POST /api/simran/durations (registered at lines 1260 and 1716)
     - POST /api/simran/heartbeat (registered at lines 1280 and 1740)
     - GET /api/simran/listeners (registered at lines 1306 and 1769)
     - GET /api/simran/status (registered at lines 1316 and 1781)
     - GET /api/sehaj-paath/progress (registered at lines 1472 and 1885)
     - PUT /api/sehaj-paath/progress (registered at lines 1485 and 1898)
     - POST /api/sehaj-paath/progress (registered at lines 1503 and 1916)
     - POST /api/sehaj-paath/bookmarks (registered at lines 1523 and 1936)
     - DELETE /api/sehaj-paath/bookmarks/:id (registered at lines 1549 and 1962)
     - GET /reader.html (registered at lines 1566 and 5628)
     - GET /sehaj-reader.html (registered at lines 1573 and 5633)
   - *Impact on React Native:* The React Native client API client must connect directly to the canonical route definitions.

2. **Dead & Abandoned Code:**
   - worker/src/index.js (21 KB): A Cloudflare Worker edge proxy implementation completely disconnected from project npm scripts and deployment pipeline (which use Express on Render).
   - #liveKirtanCard in frontend/GurbaniKhoj/gurbani-khoj.js (line 81) and live-kirtan-tracker.js (lines 67, 104-119): Attaches click and speech recognition listeners to #liveKirtanCard, but the element is completely absent from frontend/GurbaniKhoj/gurbani-khoj.html DOM (always resolves to 
ull).

3. **Alarm Script Fragmentation:**
   - 11 overlapping client JavaScript alarm scripts exist in frontend/: NaamAbhyas/naam-alarm.js, NitnemTracker/auto-alarm-sync.js, lib/alarm-coordinator.js, lib/alarm-persistence.js, lib/fallback-alarm-system.js, lib/global-alarm-system.js, lib/guaranteed-alarm-system.js, 
eminders/js/alarm-controller.js, 
eminders/js/alarm.js, 
eminders/js/bg-alarm.js, 
eminders/js/reliable-alarm.js (plus sw-alarm.js).
   - In ANHADIN-REACT, all 11 scripts are replaced and consolidated into a unified @notifee/react-native exact trigger notification service with BOOT_COMPLETED rescheduling receiver (StreakSaverBootReceiver parity).
