# ANHAD Technology Decisions & Architectural Trade-offs
**Document:** `ANHAD_MIGRATION/13_TECHNOLOGY_DECISIONS.md`  
**Version:** 1.0.0  

---

## 1. Core Framework Evaluation: React Native with Expo vs CLI

### Decision: React Native 0.76+ with Expo SDK 52 (Development Builds & Prebuild)
- **Alternatives Considered:**
  1. Pure React Native Community CLI without Expo.
  2. Flutter.
  3. Re-wrapping web app with Capacitor 7.
- **Rationale for Expo Development Builds:**
  - Full access to native Android & iOS code via Expo Prebuild (`npx expo run:android` / `npx expo run:ios`).
  - Native libraries (`react-native-track-player`, `@notifee/react-native`, `op-sqlite`) work seamlessly via existing config plugins or standard native linking.
  - Automatic asset pipeline (`@expo/image`, font loaders, splash screen generation).
  - Modern New Architecture (Fabric & TurboModules) enabled out of the box in React Native 0.76.
  - Zero lock-in: if a custom native module is required for widgets, an Expo Config Plugin or direct `android/` / `ios/` folder modification is supported.

---

## 2. Key Library Evaluations & Justifications

### 2.1 Audio Subsystem
- **Selected:** `react-native-track-player` (v4.1+)
- **Rejected:** `expo-av`, `react-native-sound`, `react-native-video` (audio mode)
- **Justification:** `react-native-track-player` is the industry benchmark for persistent background audio on mobile. It includes built-in Android `MediaBrowserServiceCompat`, `MediaSessionCompat`, lock screen notifications, Bluetooth handling, and audio ducking. `expo-av` lacks production-grade lockscreen controls and audio focus recovery.

### 2.2 Navigation
- **Selected:** `@react-navigation/native` (v7) + `@react-navigation/native-stack` + `@react-navigation/bottom-tabs`
- **Rejected:** `react-native-navigation` (Wix), `expo-router`
- **Justification:** React Navigation v7 provides a mature, battle-tested API with native screen transitions via `react-native-screens`. It cleanly supports persistent floating overlays (like our `GlobalMiniPlayer`) across bottom tab hierarchies without complex route interceptors.

### 2.3 State Management & Persistence
- **Selected:** `zustand` (v5) + `react-native-mmkv` (v3) + `@tanstack/react-query` (v5)
- **Rejected:** Redux Toolkit, MobX, Apollo Client, `AsyncStorage`
- **Justification:**
  - `zustand`: Minimal boilerplate, hooks-based, zero wrapper bloat, perfect for audio and theme state.
  - `react-native-mmkv`: Synchronous, C++ memory-mapped key-value storage. 100x faster than `AsyncStorage`. Eliminates asynchronous storage race conditions.
  - `@tanstack/react-query`: Handles all remote API caching, background polling (Sadhsangat live check), and retry backoff.

### 2.4 Alarms & Notifications
- **Selected:** `@notifee/react-native`
- **Rejected:** `expo-notifications`, `@capacitor/local-notifications`
- **Justification:** `@notifee/react-native` provides first-class support for Android Exact Alarms (`AlarmManager`), Full-Screen Intent activities (for waking the device from sleep like a clock alarm at Amritvela), custom notification action buttons, and background trigger handling.

### 2.5 Scripture Database & Search
- **Selected:** `op-sqlite` (or pre-bundled SQLite database)
- **Rejected:** Raw JSON parsing in memory, Realm, WatermelonDB
- **Justification:** The 90 MB offline Gurbani dataset requires fast index lookup and full-text search (FTS5). `op-sqlite` provides direct C++ SQLite access via TurboModules, executing queries in microseconds with minimal RAM consumption.

### 2.6 Styling & UI Components
- **Selected:** `react-native-unistyles` (v3) or standard `StyleSheet.create` with theme tokens
- **Rejected:** NativeWind / Tailwind CSS, styled-components
- **Justification:** Unistyles provides 100% type-safe theme tokens, dynamic diurnal theme re-computation, zero runtime overhead (compiled to C++ bindings), and native-like performance without CSS specificity conflicts.

### 2.7 Animation & Gesture
- **Selected:** `react-native-reanimated` (v3) + `react-native-gesture-handler` (v2)
- **Justification:** 60/120fps UI thread animations for the breathing ring in Naam Abhyas, mini-player expansion, and smooth bottom sheets.
