# ANHAD Target React Native Architecture
**Document:** `ANHAD_MIGRATION/12_TARGET_ARCHITECTURE.md`  
**Version:** 1.0.0  

---

## 1. Architectural Philosophy & Layered Separation

`ANHADIN-REACT` will be built as a modular, maintainable, high-performance mobile application adhering to Clean Architecture principles:

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER (UI)                     │
│  Screens · Components · Navigation · Modals · Bottom Sheets     │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Observes state / Dispatches actions
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   APPLICATION & STATE LAYER                     │
│  Zustand Stores (Audio, Theme, Streaks, Reader Settings)        │
│  TanStack Query (BaniDB Cache, Hukamnama, Live Channels)        │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Calls domain & business services
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DOMAIN & BUSINESS LOGIC                     │
│  VirtualLiveEngine · MaryadaScheduler · StreakCalculator        │
│  LarivaarSplitter · CardGeneratorEngine · AlarmCoordinator      │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Reads/Writes data & platform APIs
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE & DATA LAYER                   │
│  Local SQLite DB (Banis) · MMKV (Fast KV) · HTTP Client (Axios) │
│  react-native-track-player · @notifee/react-native · NetInfo    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Navigation Architecture (`@react-navigation`)

We structure navigation with a **Root Stack** hosting a **Bottom Tab Navigator** and standalone modal/fullscreen stack screens:

```
RootStackNavigator
├── MainTabs (BottomTabNavigator)
│   ├── HomeTab (HomeStack: HomeScreen, HukamnamaScreen, RadioScreen, etc.)
│   ├── InsightsTab (InsightsStack: InsightsScreen, SakhiDetailScreen)
│   ├── SadhsangatTab (SadhsangatStack: SadhsangatScreen, ChannelDetailScreen)
│   └── FavoritesTab (FavoritesStack: FavoritesScreen)
├── BaniReaderScreen (Fullscreen, hiding bottom tabs)
├── SehajPaathReaderScreen (Fullscreen, hiding bottom tabs)
├── ShabadReaderScreen (Fullscreen, hiding bottom tabs)
├── HukamnamaCardModal (Transparent Modal)
├── StreamLibraryModal (Bottom Sheet Modal)
└── AudioSleepTimerModal (Bottom Sheet Modal)
```

### Persistent Mini-Player Placement:
In `MainTabs`, a custom container component wraps the `<BottomTabBar />`. When `currentStream` is active in `useAudioStore`, `<GlobalMiniPlayer />` is rendered directly above the tab bar. It animates in smoothly using `react-native-reanimated`.

---

## 3. State Management & Persistence Strategy

### 3.1 Synchronous Key-Value Storage (MMKV)
Replacing raw `localStorage`:
- Library: `react-native-mmkv`
- Benefits: C++ based memory-mapped files; synchronous reads; 100x faster than AsyncStorage.
- Use cases: User theme preference, reader font settings, checklist completion state, audio volume, last-played timestamps.

### 3.2 Global Client State (Zustand)
- `useAudioStore`: Playback status (`idle`, `loading`, `playing`, `paused`, `reconnecting`), current stream ID, track title, artist, artwork URL, duration, position, wantsPlayback intent.
- `useThemeStore`: Active theme (`light`, `dark`, `divineGold`, `auto`), calculated time-of-day phase (`morning`, `day`, `evening`, `night`).
- `useStreakStore`: Daily Nitnem streak count, completed Banis today, last completion date.
- `useReaderSettingsStore`: Font family, font size (pt), Larivaar toggle, Vishram colors toggle, translation language flags.

### 3.3 Server Cache & Remote Data (TanStack Query v5)
- Automatic caching, deduplication, background revalidation, and retry backoff.
- Queries:
  - `hukamnamaToday`: Cached for 24 hours.
  - `gurbaniSearch(query, type)`: Cached indefinitely with stale-time 1 hour.
  - `sadhsangatLiveStatus`: Refreshed every 2 minutes while on screen.
  - `campaignConfig`: Checked once per app launch.

---

## 4. Offline Scripture Database (SQLite / WatermelonDB)

To prevent loading 90 MB of JSON chunks into memory on startup:
1. Pre-compile the 10 JSON chunks from `frontend/data/banis-chunks/` into a compressed SQLite database file (`anhad_gurbani.db`).
2. Ship the pre-built `.db` file within app assets.
3. Access via `op-sqlite` (extremely fast TurboModule SQLite binding) with full-text search (FTS5).
4. Any verse or Ang is queried in < 5 milliseconds with minimal RAM consumption.
