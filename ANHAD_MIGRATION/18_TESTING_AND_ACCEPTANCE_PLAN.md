# ANHAD Testing & Acceptance Plan
**Document:** `ANHAD_MIGRATION/18_TESTING_AND_ACCEPTANCE_PLAN.md`  
**Version:** 1.0.0  

---

## 1. Testing Philosophy & Quality Gates

To guarantee that `ANHADIN-REACT` achieves parity with the original application while elevating stability, every phase must satisfy 5 strict Quality Gates:

```
[Quality Gate 1] TypeScript compilation & ESLint zero warnings
       │
       ▼
[Quality Gate 2] Unit tests pass (Jest / React Native Testing Library)
       │
       ▼
[Quality Gate 3] Visual regression snapshot check (< 2% variance)
       │
       ▼
[Quality Gate 4] End-to-end user journey test on real Android/iOS device
       │
       ▼
[Quality Gate 5] Background audio endurance & network interruption recovery test
```

---

## 2. Test Suites to Implement

### 2.1 Audio & Streaming Test Suite (`tests/unit/audio/`)
Ported directly from the existing 18 Vitest specifications in `tests/audio/`:
1. `virtualLiveTimeline.test.ts`: Validates timeline algebra across 100 historical and future timestamps, asserting that track index and position match `tests/audio/virtual-live-timeline-algebra.test.js`.
2. `darbarLiveReconnection.test.ts`: Simulates network failure during Darbar Sahib live streaming; asserts state transitions to `'reconnecting'`; asserts bounded backoff intervals `[2, 4, 8, 12, 15]s`; asserts automatic reconnection when network restores.
3. `wantsPlaybackPersistence.test.ts`: Asserts that `wantsPlayback` remains `true` through simulated network drops, app backgrounding, and lockscreen events, and goes `false` only on explicit user pause.
4. `gaplessTrackAdvance.test.ts`: Simulates playback of track end; asserts queue pre-buffering and advancing to the next shuffled track without audible pop or desync.
5. `audioFocusHandling.test.ts`: Simulates audio ducking during phone calls and GPS announcements.

### 2.2 Scripture Reader & Database Test Suite (`tests/unit/reader/`)
1. `offlineBaniLookup.test.ts`: Queries all 100+ Banis from local SQLite database; verifies verse count and sequence integrity.
2. `larivaarWordJoin.test.ts`: Tests Gurmukhi scripture joining algorithm against known edge cases (matras, halants, bindi, tippi).
3. `fontReactivity.test.ts`: Tests that changing font size from 18pt to 42pt maintains scroll position without jumping.

### 2.3 Nitnem Tracker & Streak Test Suite (`tests/unit/tracker/`)
Ported from `tests/nitnem/daily-reset-manager.test.js`:
1. `dailyChecklistCompletion.test.ts`: Verifies morning, evening, and night Bani completion logic.
2. `midnightRollover.test.ts`: Simulates device clock advancing past midnight (00:00:00); asserts yesterday's completion is archived; asserts streak is preserved if yesterday was complete; asserts streak resets to 0 if yesterday was missed.
3. `timeZoneChange.test.ts`: Simulates traveling across time zones; verifies streak integrity.

### 2.4 End-to-End User Flow Tests (Maestro / Detox)
1. **Flow 1 (Daily Devotion):** Launch app -> view today's Hukamnama -> start Nitnem Japji Sahib reading -> mark Japji complete in tracker -> verify streak flame badge updates.
2. **Flow 2 (Kirtan Listening):** Launch app -> tap Play on Darbar Sahib live card -> verify MiniPlayer appears -> navigate to Settings -> navigate to Nitnem Hub -> lock device screen -> verify audio plays continuously.
3. **Flow 3 (Gurbani Search):** Launch app -> open Gurbani Khoj -> type first letters using Gurmukhi keyboard -> tap matching shabad -> verify full Shabad Reader opens with translations.
4. **Flow 4 (Simran Meditation):** Launch app -> open Naam Abhyas -> tap Mala bead counter 10 times -> verify haptic vibrations -> verify session logged in history.
