# Test Suite Architecture, Existing Test Setup, Mocks, and Coverage in ANHAD

**Date:** 2026-10-12  
**Author:** Survey Explorer 3 (Test Suite Architect & Quality Explorer)  
**Status:** Comprehensive Analysis Report  
**Target Project:** ANHAD (Gurbani Radio, Nitnem Tracker, My Pothi, Sehaj Paath)  

---

## Executive Summary

ANHAD utilizes **Vitest 4.1.10** configured with a **jsdom 29.1.1** environment and **Node.js** to test a hybrid vanilla JavaScript architecture spanning Desktop (Electron 28), Mobile (Capacitor 6 / Android & iOS), and PWA targets.

The default test run (`npm test`, executing `vitest run`) executes **30 test files** containing **282 individual test cases**:
- **280 tests pass cleanly** across core audio engines, timeline algebra, security rules, notification scheduling, home lifecycle, and devotional UI.
- **2 tests fail** in `tests/features/sangat-cross-account-flow.test.js` due to an uncovered disk-pollution issue (`backend/data/registered-users.json` persisting mock user state across test runs without sandbox isolation).
- Deliberately-failing bug-exploration tests and known unfixed issues are isolated in `vitest.explore.config.js` (`npm run test:explore`) to protect CI/CD gating.

This document inspects the test configuration, mocks, authoring patterns, and provides an end-to-end **Test Architecture Specification for Requirements R1–R5** (Authoritative Streak Engine, Recovery Challenge, Streak Restoration & Backfill, My Pothi Missed-Day Completion, and Data Migration).

---

## 1. Test Suite Configuration & Infrastructure

### 1.1 Package Scripts (`package.json`)

The test command matrix in `package.json` defines:
```json
{
  "test": "vitest run",
  "test:explore": "vitest run --config vitest.explore.config.js",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage",
  "test:jest": "jest",
  "test:jest:watch": "jest --watch",
  "test:jest:coverage": "jest --coverage"
}
```

- **`npm test`**: Standard CI/local execution command. Runs all active suites in single-pass mode.
- **`npm run test:explore`**: Targets quarantined bug-exploration suites documenting known unfixed behavior without failing CI.
- **`npm run test:coverage`**: Executes with the `v8` coverage provider, exporting text, JSON, and HTML reports.

### 1.2 Vitest Configuration (`vitest.config.js`)

Key configuration settings:
- **Environment**: `jsdom` (simulates browser document, window, DOM events).
- **Globals**: `globals: true` (`describe`, `it`, `expect`, `beforeEach`, etc. available globally).
- **Setup File**: `./vitest.setup.js` (runs before each test file).
- **Test Timeout**: `30000ms` (30 seconds, specifically allocated for `fast-check` property-based runs).
- **Coverage Configuration**:
  - Provider: `v8`
  - Reporters: `text`, `json`, `html`
  - Excludes: `node_modules/**`, `backend/**`, `android/**`, `ios/**`, `dist-electron/**`, test folders.
- **File Matching**:
  - Includes: `**/__tests__/**/*.{test,spec}.js`, `**/test/**/*.{test,spec}.js`, `**/*.{test,spec}.js`.
  - Quarantined Excludes (lines 48–60):
    - `**/*bug-exploration*.test.js`
    - `frontend/js/theme-rendering.test.js`
    - `tests/audio/stall-watchdog-recovery.test.js`
    - `tests/campaign-rotation.test.js`
    - `frontend/sadhsangat-live/js/collage-image-loader.test.js`

### 1.3 Vitest Setup File (`vitest.setup.js`)

`vitest.setup.js` initializes the test realm and patches missing browser APIs:
1. **Jest Compatibility**: `global.jest = vi;` enables legacy Jest syntax compatibility.
2. **Global Audio Singleton Preloader**:
   - Reads `frontend/lib/anhad-audio-singleton.js` from disk.
   - Executes via `new Function('window', 'document', ...)` into the jsdom window.
   - Re-attaches `window.AnhadAudio` inside `beforeEach` to guard against test-level realm leakage.
3. **Browser API Stubs & Mocks**:
   - `ResizeObserver` & `IntersectionObserver`: Empty class mocks with `observe`, `unobserve`, `disconnect`.
   - `window.matchMedia`: Stub returning mock media query lists.
   - `navigator.mediaSession`: Mock metadata, playbackState, and action handlers (`setActionHandler`, `setPositionState`).
   - `Notification`: Static `permission = 'default'`, `requestPermission() -> Promise.resolve('granted')`.
   - `BroadcastChannel`: In-memory event dispatch stub.
   - `navigator.serviceWorker`: Registration, controller, and postMessage stubs.
   - `AudioContext`: Gain node, media source, and audio clock mocks.
   - `Audio` (`HTMLAudioElement`): Full simulation supporting `play()`, `pause()`, `load()`, `addEventListener()`, `_trigger()`, duration, and time states.
   - `requestAnimationFrame` / `cancelAnimationFrame`: Timer-based step emulation.
   - `document.hidden` / `document.visibilityState`: Configurable getters for background tab testing.
   - `localStorage` & `sessionStorage`: In-memory key-value store with standard `getItem`, `setItem`, `removeItem`, `clear`, `length`, `key`.
   - `console`: Silenced `log`, `warn`, `error`, `debug` (with `global.originalConsole` preserved for debugging).
4. **Property-Based Testing**:
   - `fast-check` (`^4.9.0`) and `@fast-check/jest` (`^2.2.0`) installed and verified via `test/setup.test.js`.

---

## 2. Organization and Execution of the 282 Existing Tests

### 2.1 Suite Inventory & Categorization

Running `npm test` executes **30 test files** containing exactly **282 tests**:

| Category | File Path | Tests | Status |
| :--- | :--- | :---: | :---: |
| **Audio & Playback Engine** | `tests/audio/background-kill-protection.test.js` | 4 | Passed |
| | `tests/audio/live-drift-correction.test.js` | 5 | Passed |
| | `tests/audio/live-reconnect-backoff.test.js` | 3 | Passed |
| | `tests/audio/media-session-failure-revert.test.js` | 3 | Passed |
| | `tests/audio/network-interruption-exact-resume.test.js` | 4 | Passed |
| | `tests/audio/network-recovery.test.js` | 7 | Passed |
| | `tests/audio/preservation-basic-playback.test.js` | 15 | Passed |
| | `tests/audio/preservation-darbar-live.test.js` | 10 | Passed |
| | `tests/audio/preservation-other-functionality.test.js` | 17 | Passed |
| | `tests/audio/preservation-playlist-looping.test.js` | 15 | Passed |
| | `tests/audio/state-change-event-bridge.test.js` | 3 | Passed |
| | `tests/audio/task-5.3-verification.test.js` | 10 | Passed |
| | `tests/audio/virtual-live-timeline-algebra.test.js` | 5 | Passed |
| | `tests/audio-autoplay.test.js` | 17 | Passed |
| **Security & Firestore Rules** | `tests/security/emulator-rules.test.js` | 22 | Passed |
| | `tests/security/firebase-security-rules.test.js` | 26 | Passed |
| | `tests/security/security-attacks.test.js` | 17 | Passed |
| | `tests/security/strict-negative-attacks.test.js` | 20 | Passed |
| **Features & User Journeys** | `tests/features/e2e-user-flows.test.js` | 7 | Passed |
| | `tests/features/overhaul-modules.test.js` | 6 | Passed |
| | `tests/features/sangat-admin-companion-e2e.test.js` | 1 | Passed |
| | `tests/features/sangat-cross-account-flow.test.js` | 7 | **2 Failed** |
| **Naam Abhyas Ritual Engine** | `tests/naam-abhyas/ritual-engine.test.js` | 6 | Passed |
| **Nitnem & Reset Management** | `tests/nitnem/daily-reset-manager.test.js` | 5 | Passed |
| **Notifications Engine** | `tests/notifications/rotation-and-broadcast.test.js` | 8 | Passed |
| | `tests/notifications-engine.test.js` | 3 | Passed |
| **Home Lifecycle & Devotional UI** | `tests/home-lifecycle.test.js` | 8 | Passed |
| | `tests/devotional-ui-features.test.js` | 4 | Passed |
| **Setup & Remote Config** | `tests/remote-config.test.js` | 35 | Passed |
| | `test/setup.test.js` | 5 | Passed |
| **TOTAL** | **30 test files** | **282** | **280 Passed / 2 Failed** |

### 2.2 Investigation of Existing Test Failures

**Failed File:** `tests/features/sangat-cross-account-flow.test.js`
- **Failure 1 (line 40):** `registers two separate accounts and ensures Account 1 cannot find or connect to itself`
  - *Assertion:* `expect(selfInResults).toBeUndefined();`
  - *Received:* `{ uid: "user_acc_1_1791771780742", username: "gursikh_one", ... }`
- **Failure 2 (line 63):** `rejects sending a friend request to oneself`
  - *Assertion:* `expect(() => friendsEngine.sendRequest(uid, 'selftester')).toThrow(...)`
  - *Received:* Error was not thrown because request was routed to an old user.

**Root Cause Analysis:**
`backend/lib/auth-middleware.js` persists registered users to disk at `backend/data/registered-users.json` via `saveUsersToDisk()`. 
When `tests/features/sangat-cross-account-flow.test.js` executes, it registers users with dynamic UIDs (`'user_acc_1_' + Date.now()`) but static usernames (`gursikh_one`, `selftester`). 
Because `backend/data/registered-users.json` retains users from earlier test runs, the in-memory `registeredUsers` Map contains duplicate usernames with different UIDs.
1. `friendsEngine.searchUsers('gursikh', acc1.uid)` filters out `acc1.uid` (the newly generated UID), but matches the older `gursikh_one` entry loaded from the persisted JSON file.
2. `friendsEngine.sendRequest(uid, 'selftester')` looks up the username `'selftester'` via `getUserByUsername('selftester')`, which returns the older persistent record with a different UID, so the self-request check (`target.uid === fromUid`) does not trigger.

**Key Learning for New Suites:**
Any tests touching backend files or services that write to disk MUST either:
- Mock the file system persistence (`fs.writeFileSync`).
- Clean up or isolate the test data directory before/after test suites.
- Use unique, isolated identifiers or purely in-memory data structures.

---

## 3. Unit and Component Test Authoring Methodology in ANHAD

### 3.1 Technology Stack & Architectural Realities

ANHAD is a **vanilla JavaScript, browser-native application** (no React runtime). Components are written as IIFE scripts, ES classes, or plain objects attached to `window`.

Key authoring patterns observed across the codebase:

#### 1. Flat Script & IIFE Loading Pattern via `new Function`
Scripts such as `frontend/NitnemTracker/nitnem-tracker.js` (13,000+ lines), `frontend/js/trendora-app.js`, and `frontend/NaamAbhyas/components/ritual-engine.js` are not standard ES modules.
To test them without running browser startup cascades:
- The script source is loaded via `fs.readFileSync(path, 'utf8')`.
- Conditional export guards in the source expose managers when a mock `module` object is supplied:
  ```javascript
  if (typeof module !== 'undefined' && module.exports) {
      Object.assign(module.exports, { DailyResetManager, StreakSaverManager, ReportsManager });
  }
  ```
- Startup execution is skipped:
  ```javascript
  if (typeof module === 'undefined' || !module.exports) {
      initializeFullApp();
  }
  ```
- Tests execute the script using `new Function`:
  ```javascript
  const moduleObj = { exports: {} };
  const fn = new Function('window', 'document', 'navigator', 'localStorage', 'module', src);
  fn(window, document, navigator, window.localStorage, moduleObj);
  ```

#### 2. DOM Fixture Construction & Teardown
In suites testing UI lifecycle (`tests/home-lifecycle.test.js`, `tests/naam-abhyas/ritual-engine.test.js`):
- HTML fragments are injected directly into `document.body.innerHTML`.
- Global listeners and event bindings are tracked using `vi.spyOn(window.Element.prototype, 'addEventListener')`.
- Clean teardown occurs in `beforeEach` and `afterEach` (`document.body.innerHTML = ''`, `localStorage.clear()`).

#### 3. Time Manipulation & Fake Timers
Given that Nitnem tracking and streaks are time-critical (Amritvela 00:00–06:00, midnight reset 00:00:05, 5-day challenges):
- `vi.useFakeTimers()` and `vi.setSystemTime(new Date('YYYY-MM-DDTHH:mm:ss'))` are used extensively.
- Midnight crossings are stepped forward via `vi.advanceTimersByTime(...)`.
- Microtask queue resolution is handled via `await vi.advanceTimersByTimeAsync(0)`.
- Always restored via `vi.useRealTimers()` in `afterEach`.

#### 4. Property-Based Testing
Mathematical algorithms (such as volume decay, bead counting, or timeline algebra) leverage `fast-check` to assert invariants across thousands of pseudo-random inputs.

---

## 4. Proposed Test Architecture for Requirements R1–R5

To satisfy requirements R1 through R5 while maintaining zero regression against the existing 282 tests, we propose a modular test suite under `tests/nitnem/`:

```
tests/nitnem/
├── daily-reset-manager.test.js          (existing - 5 tests)
├── authoritative-streak-engine.test.js  (R1 - Authoritative streak engine & deterministic state)
├── recovery-challenge.test.js           (R2 - 5-day Amritvela recovery challenge lifecycle & Gurbani)
├── streak-restoration-backfill.test.js  (R3 - Atomic streak restoration & transparent backfill)
├── my-pothi-missed-day.test.js          (R4 - Missed-day completion & consistency grid sync)
└── streak-data-migration.test.js        (R5 - Storage schemas, legacy migration & regression guard)
```

### 4.1 Test Suite Specifications & Test Matrices

---

### Requirement R1: Authoritative Amritvela & Nitnem Streak Engine
**File:** `tests/nitnem/authoritative-streak-engine.test.js`  
**Focus:** Unified, deterministic source of truth for Amritvela and Nitnem streaks.

```
                    ┌───────────────────────────────────────────┐
                    │       Authoritative Streak Engine         │
                    │   (Single Deterministic Source of Truth)   │
                    └─────────────────────┬─────────────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              ▼                           ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
    │  NitnemTracker    │       │     My Pothi      │       │   UnifiedStats    │
    │  (nitnem-tracker) │       │  (my-pothi.html)  │       │ (unified-stats.js)│
    └───────────────────┘       └───────────────────┘       └───────────────────┘
```

#### Test Matrix:
| ID | Test Case | Inputs / State | Expected Invariant |
| :--- | :--- | :--- | :--- |
| **TC-R1-01** | First-time user initialization | Empty `localStorage` | `currentStreak: 0`, `previousBest: 0`, `brokenStreakTimestamp: null`, `lastRecordedSession: null`. |
| **TC-R1-02** | Genuine attendance validation | App open, audio play, vs. explicit `markPresent()` | Audio playback or page view does NOT increment streak. Only explicit attendance record with valid timestamp increments streak. |
| **TC-R1-03** | Consecutive day progression | Attendance on Day 1 (04:15), Day 2 (05:00), Day 3 (03:45) | `currentStreak` increments: 1 -> 2 -> 3; `previousBest` updates to 3. |
| **TC-R1-04** | Same-day duplicate idempotency | Calling `markPresent()` multiple times on same date | Streak remains unchanged (no double count); original timestamp and metadata preserved. |
| **TC-R1-05** | Streak break transition | Attendance on Day 1, Day 2; Day 3 omitted; Day 4 opened | Day 3 transition marks `brokenStreakTimestamp = Day 3 timestamp`; `previousBest = 2`; `currentStreak = 0` (or 1 if Day 4 attended). |
| **TC-R1-06** | Midnight & calendar boundary handling | Local date shift 23:59:58 -> 00:00:05 across month/leap year boundaries | Streak evaluates strictly on calendar day boundaries without skipping or premature resets. |
| **TC-R1-07** | Timezone offset shift | User logs session in UTC-8, next in UTC+5:30 | Attendance respects canonical local date string (`YYYY-MM-DD`), preventing false break or double increment. |
| **TC-R1-08** | Offline session reconciliation | 2 offline attendance entries queued with historical timestamps | Offline entries merge into authoritative state deterministically; streak recalculates correctly. |
| **TC-R1-09** | Multi-surface consistency | Read state from NitnemTracker, My Pothi, UnifiedStats | All surfaces return identical `currentStreak` and `previousBest` without divergence. |

---

### Requirement R2: Previous-Best Streak Recovery Challenge
**File:** `tests/nitnem/recovery-challenge.test.js`  
**Focus:** Recovery challenge triggering, 5-day lifecycle, authentic Gurbani passages, failure/reset rules.

#### Test Matrix:
| ID | Test Case | Inputs / State | Expected Invariant |
| :--- | :--- | :--- | :--- |
| **TC-R2-01** | Eligibility gate: Active streak | `currentStreak = 5`, `previousBest = 10`, 0 days broken | Recovery button is hidden (`isEligible === false`). |
| **TC-R2-02** | Eligibility gate: No prior best | `previousBest <= currentStreak` | Recovery button is hidden. |
| **TC-R2-03** | Configurable delay window | Broken streak with previousBest=15. Config delay = 7 days (range 5–10) | Day 1–6 broken: ineligible. Day 7 broken: `isEligible === true`; recovery offer visible. |
| **TC-R2-04** | Challenge initiation & persistence | User accepts recovery challenge | Challenge state initialized: `challengeActive: true`, `challengeDay: 1`, `completedDays: []`. Persists across reloads. |
| **TC-R2-05** | 5-Day sequential progression | Completing qualifying Amritvela (00:00–06:00) on 5 consecutive days | Day 1 complete -> Day 2 unlocked -> Day 3 -> Day 4 -> Day 5 complete. Progress indicator tracks 1/5 to 5/5. |
| **TC-R2-06** | Authentic Gurbani passages citation | Inspect Day 1–5 challenge content | Each day features authentic Sri Guru Granth Sahib verses from `gurbani-quotes.js` with exact Gurmukhi text and verified Ang references (e.g., Ang 185, 386, 263, 10, 319). |
| **TC-R2-07** | Challenge reset on missed day | Challenge Day 3 reached; Day 4 missed | Challenge state transitions to reset/cancelled. Displays spiritual encouragement message and retry terms. |
| **TC-R2-08** | Non-qualifying time rejection | Attempting completion outside Amritvela hours (> 06:00) | Completion rejected for challenge day; streak challenge does not advance. |

---

### Requirement R3: Deterministic Streak Restoration & Historical Gap Backfilling
**File:** `tests/nitnem/streak-restoration-backfill.test.js`  
**Focus:** Streak restoration upon Day 5 completion, average wake-up time calculation, non-destructive backfill with `origin: "restored"`.

#### Test Matrix:
| ID | Test Case | Inputs / State | Expected Invariant |
| :--- | :--- | :--- | :--- |
| **TC-R3-01** | Atomic streak restoration | Day 5 completed; prior best was 15 | Current streak restored to `15 + 5 = 20` (or `15` + challenge days) atomically without race conditions or double restoration. |
| **TC-R3-02** | Historical average wake-up calculation | Prior streak timestamps: 03:45, 04:15, 04:00 (avg = 04:00) | Calculated average wake-up time is exactly `04:00`. |
| **TC-R3-03** | Average wake-up fallback | No recorded historical timestamps exist | Falls back deterministically to default Amritvela midpoint `04:30 AM`. |
| **TC-R3-04** | Non-destructive gap backfill | 7 gap days between break and challenge start | Exactly 7 records created in attendance history with average wake-up time. |
| **TC-R3-05** | Audit origin distinctness | Inspect backfilled records in storage and history view | Every backfilled record has `origin: "restored"` / `systemGenerated: true`. History UI renders distinctive badge/styling. |
| **TC-R3-06** | Performance metrics isolation | Calculate user average wake-up time for reports | Genuine attendance calculations strictly filter out `origin: "restored"` records. |
| **TC-R3-07** | Preservation of existing genuine records | Gap range contains 1 genuine partial record (e.g., afternoon prayer) | Existing genuine record is NEVER overwritten or replaced by restoration. |

---

### Requirement R4: My Pothi Missed-Day Interactive Completion
**File:** `tests/nitnem/my-pothi-missed-day.test.js`  
**Focus:** Interactive grid cell clicking, day modal/drawer, historical bani completion, bidirectional synchronization.

#### Test Matrix:
| ID | Test Case | Inputs / State | Expected Invariant |
| :--- | :--- | :--- | :--- |
| **TC-R4-01** | Grid cell interactive click binding | Weekly bar, 35-day monthly grid cell, or yearly cell clicked | Clicking cell opens Missed-Day Completion Drawer/Modal for that date instead of merely showing tooltip. |
| **TC-R4-02** | Modal presentation & state | Date `2026-02-10` selected with 2 of 5 banis completed | Modal displays correct date, 2 completed banis checked, 3 pending banis actionable. |
| **TC-R4-03** | Historical completion persistence | User marks pending Japji Sahib on `2026-02-10` | `anhad_my_pothi_completed['2026-02-10']` includes Japji Sahib ID (`2`). Snapshot and timestamp updated. |
| **TC-R4-04** | Sync to Nitnem Tracker | Historical completion in My Pothi | Synced to `nitnemTracker_nitnemLog['2026-02-10']` with appropriate period (`amritvela`). |
| **TC-R4-05** | Dynamic grid cell rerendering | Bani completed in drawer | Grid cell updates fill percentage and intensity class (`lvl-0` -> `lvl-full`) dynamically without full page reload. |
| **TC-R4-06** | Retroactive streak recalculation | Completing missed banis transforms a missed day into 100% complete | Authoritative streak engine recalculates; streak unbroken if gap is resolved. |
| **TC-R4-07** | Future date guard | Attempting to click or complete date > today | Future date cells are non-interactive or disabled with message. |

---

### Requirement R5: Data Migration, Storage Compatibility, & Regression Guard
**File:** `tests/nitnem/streak-data-migration.test.js`  
**Focus:** Migration of legacy keys, corrupt JSON recovery, schema normalization, zero regression.

#### Test Matrix:
| ID | Test Case | Inputs / State | Expected Invariant |
| :--- | :--- | :--- | :--- |
| **TC-R5-01** | Legacy storage migration | Legacy `nitnemTracker_userData` (`streaks.current = 12`) and `anhad_streak_data` (`currentStreak = 10`) | Engine migrates higher valid streak (`12`), initializes unified schema, and maintains backward compatibility. |
| **TC-R5-02** | Corrupted / partial JSON resilience | `localStorage.getItem('anhad_unified_stats')` contains malformed JSON `"{ bad json "` | Engine handles error gracefully, logs warning, falls back to safe default state without crashing. |
| **TC-R5-03** | Idempotent migration runs | Migration runs 10 consecutive times | State remains identical after first pass; no duplicate records or increment loops. |
| **TC-R5-04** | Existing 282 tests regression guard | Run entire test suite (`npm test`) alongside new suites | All existing 282 tests continue to pass; 0 regressions in audio, security, or notifications. |
| **TC-R5-05** | Theme resilience | Render recovery challenge UI and day drawer under light (`data-theme="light"`) and dark (`data-theme="dark"`) | All elements possess appropriate theme contrast variables (`--bg-primary`, `--card-bg`, `--sacred-gold`). |

---

## 5. Implementation Recommendations for Builders

1. **Create Unified Engine Module (`frontend/lib/streak-engine.js`):**
   - Provide clean CommonJS / browser UMD export so that both the browser (`window.StreakEngine`) and Vitest (`module.exports = StreakEngine`) can import without `new Function` wrappers where possible.
   - Maintain a single authoritative state schema in `localStorage.getItem('anhad_authoritative_streak')`.
2. **Add Test Isolation in `backend/` or Mock Disk I/O:**
   - In `tests/features/sangat-cross-account-flow.test.js`, mock `fs.writeFileSync` or clear `backend/data/registered-users.json` in a test fixture to ensure test idempotency across runs.
3. **Use Dedicated Test Harness (`tests/test-utils/streak-engine-harness.js`):**
   - Provide helper utilities for seeding attendance logs, mocking date clocks, and verifying backfill records across test suites.

---

## 6. Verification Method

To verify the test suite and future additions:
```bash
# 1. Run full Vitest suite
npm test

# 2. Run specific new test suites (when created)
npx vitest run tests/nitnem/

# 3. Check coverage
npm run test:coverage
```
