# ANHAD File-by-File Migration Ledger
**Document:** `ANHAD_MIGRATION/15_FILE_BY_FILE_MIGRATION_LEDGER.md`  
**Version:** 1.0.0  

---

## 1. Migration Categories Legend

- **Category A:** Reuse with minimal changes (pure data, static configs, audio/image assets).
- **Category B:** Refactor and reuse (pure TypeScript/JS domain logic, algorithms).
- **Category C:** Convert into React Native components (UI screens, cards, modals).
- **Category D:** Replace with native platform functionality (alarms, haptics, wake locks).
- **Category E:** Split into multiple modules (large monolithic files separated into clean concerns).
- **Category F:** Merge into a shared module (redundant CSS files or duplicated utilities).
- **Category G:** Replace with appropriate third-party integration (audio engine, navigation).
- **Category H:** Retire after documented verification (Capacitor/Electron wrappers, dead code).
- **Category I:** Requires further investigation / approval.

---

## 2. Core Application Files Migration Ledger

| Original Path | File Type | Current Responsibility | Cat | Destination Path(s) in `ANHADIN-REACT` | Planned Implementation Approach |
|---|---|---|---|---|---|
| `frontend/index.html` | HTML (6,978 lines) | Flagship Home screen, hero banner, carousel, daily dashboard, tab bar | **E** | `src/screens/home/HomeScreen.tsx`<br>`src/components/home/HeroBanner.tsx`<br>`src/components/home/GuruCarousel.tsx`<br>`src/components/home/DashboardCards.tsx` | Split into clean modular React Native screen and component tree. |
| `frontend/lib/anhad-audio-singleton.js` | JS (1,907 lines) | Authoritative audio controller, virtual live scheduler, Icecast reconnect | **E, G** | `src/services/audio/AudioService.ts`<br>`src/services/audio/VirtualLiveEngine.ts`<br>`src/store/audioStore.ts` | Separate timeline math into pure TypeScript; delegate native audio to `react-native-track-player`. |
| `frontend/lib/overlay-player.js` | JS (282 lines) | Global persistent mini-player DOM injection & state sync | **C** | `src/components/audio/GlobalMiniPlayer.tsx` | Pure declarative React Native component floating above bottom tab navigation. |
| `frontend/lib/global-theme.js` | JS (320 lines) | Auto time-of-day theme calculations and CSS variable injection | **B** | `src/store/themeStore.ts`<br>`src/hooks/useTheme.ts`<br>`src/theme/colors.ts` | Refactor to reactive Zustand store updating Unistyles / StyleSheet theme tokens. |
| `frontend/lib/smooth-navigation.js` | JS (1,550 lines) | Fake SPA HTML fetch, script eval, and DOM tree swapping | **H, G** | Replaced by `@react-navigation` | Retire completely. Native screen transitions replace web DOM swapping. |
| `frontend/css/theme-variables.css` | CSS (401 lines) | CSS custom properties for Light, Dark, Divine Gold, and Auto phases | **B** | `src/theme/colors.ts`<br>`src/theme/gradients.ts` | Direct conversion of color hex codes and gradient definitions to TypeScript constants. |
| `frontend/css/claymorphism-system.css` | CSS (500+ lines) | Claymorphic bevel highlights and drop shadow styles | **B** | `src/theme/shadows.ts`<br>`src/components/common/Card.tsx` | Convert CSS box-shadow and border rules into React Native view styles. |
| `frontend/css/desktop-responsive.css` | CSS (2,600+ lines) | Desktop and laptop responsive media query overrides | **H** | Handled natively by React Native Flexbox & `useWindowDimensions` | Retire. React Native mobile layouts handle responsive phone/tablet dimensions dynamically. |
| `frontend/GurbaniRadio/gurbani-radio.html` | HTML | Full radio player screen | **C** | `src/screens/radio/RadioScreen.tsx` | Convert HTML player into React Native screen with artwork, track info, and volume. |
| `frontend/GurbaniRadio/stream-library.js` | JS (614 lines) | 8 curated live stream definitions, custom tab slots | **B, C** | `src/config/streams.ts`<br>`src/components/radio/StreamLibrarySheet.tsx` | Move stream configs to TypeScript; convert bottom sheet to `@gorhom/bottom-sheet`. |
| `frontend/nitnem/index.html` | HTML | Sacred Bani Library portal | **C** | `src/screens/nitnem/NitnemHubScreen.tsx` | Convert to React Native FlashList with category filter chips. |
| `frontend/nitnem/js/reader-engine.js` | JS (1,801 lines) | Universal sacred scripture reader, typography, auto-scroll, Larivaar | **E, C** | `src/screens/reader/BaniReaderScreen.tsx`<br>`src/features/reader/readerEngine.ts`<br>`src/components/gurbani/LarivaarText.tsx` | Extract scripture parsing logic into pure TS; render text natively using custom fonts. |
| `frontend/nitnem/js/banidb-api.js` | JS (506 lines) | Offline chunk loader & BaniDB network client | **B** | `src/api/banidb.ts`<br>`src/database/baniQueries.ts` | Combine with local SQLite queries and Axios client. |
| `frontend/data/banis-chunks/*.json` | JSON (10 files, ~90 MB)| Pre-chunked offline Gurbani scriptures: 107 Banis (25,697 verses). (Note: Sehaj Paath stores 0 Angs offline and queries live BaniDB API) | **B, D** | `assets/database/anhad_gurbani.db` | Compile into pre-indexed SQLite database for instant, zero-RAM startup querying. |
| `frontend/nitnem/my-pothi.html` | HTML | Custom Pothi prayer book manager | **C** | `src/screens/nitnem/MyPothiScreen.tsx` | Implement with `react-native-draggable-flatlist` and MMKV storage. |
| `frontend/NitnemTracker/nitnem-tracker.html`| HTML | Nitnem checklist & daily tracker | **C** | `src/screens/tracker/NitnemTrackerScreen.tsx` | Convert to React Native screen with checklist, streak flame badge, and history calendar. |
| `frontend/NitnemTracker/nitnem-tracker.js` | JS (1,800+ lines) | Nitnem tracking logic, Maryada schedule, daily reset | **B** | `src/features/tracker/trackerService.ts`<br>`src/store/streakStore.ts` | Port Maryada schedules and daily reset verification to TypeScript services with Jest tests. |
| `frontend/Hukamnama/daily-hukamnama.html` | HTML | Daily Hukamnama viewer | **C** | `src/screens/hukamnama/HukamnamaScreen.tsx` | Convert to React Native screen with Guru portrait header and translation views. |
| `frontend/Hukamnama/daily-hukamnama.js` | JS (756 lines) | Hukamnama data fetching & author Guru portrait mapping | **B** | `src/features/hukamnama/hukamnamaService.ts` | Port Guru ID portrait lookup and date fetching to TanStack Query service. |
| `frontend/js/hukamnama-card-generator.js` | JS (350+ lines) | HTML5 Canvas card generator for social media stories | **C, D** | `src/components/hukamnama/HukamnamaCardModal.tsx` | Reimplement using `react-native-view-shot` and native Share sheet. |
| `frontend/GurbaniKhoj/gurbani-khoj.html` | HTML | Full-text Gurbani search interface | **C** | `src/screens/search/GurbaniKhojScreen.tsx` | Convert to React Native search screen with filter pills and result list. |
| `frontend/GurbaniKhoj/gurbani-khoj.js` | JS (3,348 lines) | Search API client, virtual keyboard, speech recognition | **E, C** | `src/features/khoj/searchService.ts`<br>`src/components/gurbani/GurmukhiKeyboard.tsx` | Separate search algorithms from UI; replace Web Speech with native Voice API. |
| `frontend/SehajPaath/sehaj-paath.html` | HTML | Continuous reading tracker for 1430 Angs | **C** | `src/screens/sehajpaath/SehajPaathScreen.tsx` | Convert to React Native screen with progress bar, pace targets, and bookmarks list. |
| `frontend/SehajPaath/reader.html` | HTML | Full Ang-by-Ang reader | **C** | `src/screens/sehajpaath/SehajPaathReaderScreen.tsx`| Convert to full-screen reader with auto-bookmarking and Ang picker. |
| `frontend/NaamAbhyas/naam-abhyas.html` | HTML | Waheguru Simran mala counter & breathing guide | **C** | `src/screens/naamabhyas/NaamAbhyasScreen.tsx` | Convert to React Native screen with `react-native-reanimated` breathing ring. |
| `frontend/NaamAbhyas/naam-abhyas.js` | JS (1,689 lines) | Simran timer, haptics, soundscapes, Hourly Practice Engine & 11 achievements | **B, D** | `src/features/naamabhyas/naamAbhyasService.ts`<br>`src/store/naamAbhyasStore.ts` | Port stats calculations to TypeScript; use `expo-haptics` for Mala bead vibration. |
| `frontend/sadhsangat-live/index.html` | HTML (10,819 lines)| YouTube live broadcasts & collage grid | **E, C** | `src/screens/sadhsangat/SadhsangatScreen.tsx`<br>`src/features/sadhsangat/channelService.ts` | Convert to React Native with `react-native-youtube-iframe` and channel list. |
| `frontend/Calendar/GurpurabCalendar-ios.html`| HTML | Nanakshahi calendar & Gurpurab countdowns | **C** | `src/screens/calendar/CalendarScreen.tsx` | Convert to React Native calendar screen with event countdown cards. |
| `frontend/Favorites/favorites.html` | HTML | Spiritual treasury for saved items | **C** | `src/screens/favorites/FavoritesScreen.tsx` | Convert to React Native screen with tabbed filters for Banis, Shabads, Audio. |
| `frontend/Notes/notes.html` | HTML | Spiritual reflections journal | **C** | `src/screens/notes/NotesScreen.tsx` | Convert to React Native screen with note editor modal and tag filtering. |
| `frontend/Insights/insights.html` | HTML | Khalsa Library & listening hours | **C** | `src/screens/insights/InsightsScreen.tsx` | Convert to React Native screen displaying listening stats and Sikh history. |
| `frontend/Settings/index.html` | HTML | Settings & preferences | **C** | `src/screens/settings/SettingsScreen.tsx` | Convert to React Native screen with theme selector and alarm schedule toggles. |
| `frontend/reminders/smart-reminders.html` | HTML | Amritvela alarms & reminder configuration | **C, D** | `src/screens/reminders/RemindersScreen.tsx`<br>`src/services/alarms/AlarmService.ts` | Reimplement using `@notifee/react-native` exact alarms with full-screen intent. |
| `android/app/src/main/java/.../AudioForegroundService.java`| Java | Native foreground audio service for WebView | **G** | Replaced by `react-native-track-player` | Retire custom Java service in favor of battle-tested ExoPlayer service in RNTP. |
| `android/app/src/main/java/.../AlarmReliabilityPlugin.java`| Java | Exact alarm scheduler & battery optimization intent | **D, G** | Replaced by `@notifee/react-native` | Retire custom plugin; use Notifee Android exact alarm APIs. |
| `android/app/src/main/java/.../widgets/*.java` | Java | 10 Android AppWidget Providers | **B, D** | `android/app/src/main/java/.../widgets/*.java` | Preserve widget providers; bridge data via React Native native module / SharedPreferences. |
| `ios/App/WidgetsExtension/*.swift` | Swift | iOS WidgetKit extensions | **B, D** | `ios/WidgetsExtension/*.swift` | Preserve WidgetKit views; bridge data via React Native App Group UserDefaults. |
| `frontend/assets/HERO CARD IMAGES/*` | WebP/AVIF | 4 time-of-day variants for 3 streams | **A** | `assets/images/hero/*` | Direct copy to React Native asset bundle. |
| `frontend/guruimages/*` | WebP/JPEG | Portraits for all 10 Gurus + SGGS | **A** | `assets/images/gurus/*` | Direct copy to React Native asset bundle. |
| `frontend/nitnem/g-fonts/*.ttf` | TTF Fonts | Gurmukhi scripture fonts (Riyasti, Muskan, etc.) | **A** | `assets/fonts/*` | Direct copy and linkage in `app.json` / font configuration. |
| `frontend/NaamAbhyas/assets/sounds/*.mp3`| MP3 Audio | Soundscapes and meditation bells | **A** | `assets/audio/*` | Direct copy to React Native asset bundle. |
| `backend/server.js` | JS (Node.js) | Production Express API server | **A** | Remainder in backend repository | Kept running unchanged in production. Mobile app calls endpoints over HTTPS. |
| `electron-main.js` & `electron-preload.js` | JS | Desktop Electron wrapper | **H** | Replaced by React Native Desktop / Web in future | Excluded from mobile application scope. |
| `capacitor.config.ts` | TS | Capacitor wrapper configuration | **H** | Replaced by `app.json` in `ANHADIN-REACT` | Retire. |
