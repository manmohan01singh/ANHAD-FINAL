# ANHAD Complete File Inventory & Classification
**Document:** ANHAD_MIGRATION/01_FILE_INVENTORY.md  
**Version:** 1.0.0  
**Total Repository Files Audited:** 2,621 files  

---

## 1. Inventory Summary by File Type

| File Extension | Count | Primary Responsibilities | Target Disposition |
|---|---|---|---|
| .js | 666 | Application logic, audio engine, readers, trackers, tests, automation | Refactor to React Native components, hooks, services |
| .css | 268 | Styling, responsive queries, claymorphism, theme variables | Convert to React Native StyleSheet / Unistyles design system |
| .html | 215 | Page entry points, reader views, admin forms, tests | Consolidate into 24 React Native Screens |
| .png | 309 | Icons, splash screens, Guru portraits, UI thumbnails | Audit, compress, port required assets to RN asset pipeline |
| .avif | 220 | Modern compressed artwork (Guru portraits, backgrounds) | Convert/fallback to WebP/PNG for universal RN support |
| .json | 125 | Offline Bani data chunks, prayer configs, calendars, package manifests | Port prayer data, configs, and Maryada schedules |
| .webp | 91 | High-res Guru Sahib artwork & live stream hero cards | Direct reuse in React Native Image pipeline |
| .xml | 68 | Android manifest, layout resources, vector drawables | Replace with React Native native Android project setup |
| .ttf / .otf / .woff / .woff2 | 38 | Sacred Gurmukhi fonts (Riyasti, Muskan, Khanna, Noto) & display serif | Embed directly in React Native custom font bundle |
| .mp3 / .mpeg / .wav | 39 | Naam Abhyas soundscapes, bell chimes, local audio fallbacks | Copy to target app bundle for local playback |
| .java | 22 | Custom Capacitor plugins (Foreground audio, exact alarms, widgets) | Replace with React Native Track Player, Notifee, & Native Modules |
| .swift | 6 | iOS Capacitor widget extensions | Reimplement via React Native iOS WidgetKit extensions |
| .md / .txt | 183 | Historical engineering docs, fix notes, instructions | Reference documentation; retained in repository archive |
| .bat / .ps1 / .py | 54 | Automation scripts, icon generators, deploy helpers | Adapt build scripts for React Native / Fastlane |

---

## 2. Directory-Level Breakdown & Dispositions

### 2.1 frontend/ (747 files) ? Core Application Client
The single source of truth for the entire product UI, interaction models, and religious algorithms:
- frontend/index.html (317 KB, 6,978 lines): Flagship home screen, dynamic time-of-day hero, dark carousel, streak tracker, quick launch cards, and audio sheet overlay.
- frontend/lib/ (68 files): Core business logic, singletons, and storage managers:
  - anhad-audio-singleton.js (78.7 KB): Central authoritative playback controller.
  - global-theme.js (11.4 KB): Dynamic auto-theme system based on time of day.
  - overlay-player.js (11.3 KB): Persistent global mini-player.
  - smooth-navigation.js (64.8 KB): Vanilla JS fake SPA navigation engine.
  - unified-storage.js, storage-manager.js, storage-lock.js: Storage wrappers.
  - capacitor-notifications-global.js, global-alarm-system.js: Alarms & notifications (part of 11 overlapping alarm scripts across frontend to be unified via @notifee/react-native).
  - anhad-widget-bridge.js: Native widget synchronization.
  - anhad-auth.js, firebase-client.js: User authentication and synchronization.
- frontend/GurbaniRadio/ (4 files): Radio UI, stream library bottom sheet, 8 curated live streams (Darbar Sahib Live, Amritvela Virtual Live, Waheguru Simran Virtual Live, and 5 SikhNet channels: Gurdwara Bangla Sahib, Gurdwara Sis Ganj Sahib, Takhat Sachkhand Sri Hazur Sahib, Gurdwara Dukh Nivaran Sahib, Classical Raag Kirtan).
- frontend/nitnem/ (24 files + subdirs): Sacred Bani Library, category pages, universal dynamic reader engine (
eader-engine.js, 80.5 KB).
- frontend/NitnemTracker/ (8 files): Nitnem tracker UI, Maryada schedules, streaks, daily resets.
- frontend/Hukamnama/ (4 files): Daily Hukamnama viewer, author detection, dynamic portraits, Instagram story card generator.
- frontend/GurbaniKhoj/ (5 files): Full-text Gurbani search, Gurmukhi keyboard overlay, speech recognition, live kirtan tracker.
- frontend/SehajPaath/ (9 files): 1430 Ang reader, progress tracker, bookmarks, smart pace reminders.
- frontend/NaamAbhyas/ & NaamAbhyas-V2/ (15 files): Waheguru Simran mala counter, breathing guide, ambient soundscapes, Hourly Practice Engine, and 11 achievements.
- frontend/sadhsangat-live/ (15 files): YouTube live channels, video playlists, collage canvas renderer.
- frontend/Calendar/ (2 files): Gurpurab calendar, historical Sikh events countdown.
- frontend/Favorites/ (2 files): Spiritual treasury (Banis, Shabads, Pothis, Hukamnamas).
- frontend/Notes/ (4 files): Spiritual reflections and Vichar notes.
- frontend/Insights/ (8 files): Listening statistics, Khalsa library, Sikh history.
- frontend/Settings/ (4 files): Themes, typography, font size, notification schedules.
- frontend/data/banis-chunks/ (12 files, ~90 MB): Pre-chunked offline Gurbani JSON database containing 107 Banis (25,697 verses) across chunks/archive. (Note: Sehaj Paath stores 0 Angs offline and retrieves Angs on-demand from the live BaniDB API).
- frontend/assets/: Guru Sahib artwork, icons, vector graphics, fonts, audio files.

### 2.2 backend/ (54 files) ? Node.js Express Server
- backend/server.js (263 KB): 111 API endpoints handling campaign configs, live listener heartbeats, community presence, YouTube video/channel metadata, Cloudflare R2 streaming proxies, and Firebase Admin authorization.
- **Disposition:** Kept as-is running on Render/production. React Native app connects directly to https://anhad-final.onrender.com.

### 2.3 android/ (462 files) & ios/ (740 files) ? Native Wrappers
- Native platform wrappers generated by Capacitor.
- Android total is 462 files, inflated by 279 Capacitor sync assets in android/app/src/main/assets/public; true native code is 20 application Java files in com.anhad.app (plus 2 auto-generated test files).
- iOS total is 740 files, inflated by 726 Capacitor sync assets in ios/App/App/public; true native code is 6 Swift files (ANHADWidgets.swift, WidgetDataBridge.swift, and widget components).
- Custom Java code includes AudioForegroundService.java, AlarmReliabilityPlugin.java, FullScreenAlarmActivity.java, StreakSaverPlugin.java, StreakSaverBootReceiver.java, WidgetDataBridgePlugin.java, and 12 Android Widget Providers.
- **Disposition:** Retire Capacitor wrappers. Reimplement native capabilities cleanly in React Native using battle-tested libraries (react-native-track-player, @notifee/react-native, MMKV) and custom React Native native modules/config plugins for widgets.

### 2.4 	ests/ (41 files) ? Devotional Test Suites
- Comprehensive Vitest specifications for audio state transitions, virtual live timeline calculations, reconnect backoff, daily reset logic, and security rules.
- **Disposition:** Port test logic and test vectors directly to Jest / React Native Testing Library.
