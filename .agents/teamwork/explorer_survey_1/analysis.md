# Survey & Architecture Analysis: Amritvela & Nitnem Tracking, Streak Engine, Recovery Challenge, and My Pothi Missed-Day Completion

**Agent**: Survey Explorer 1  
**Timestamp**: 2026-10-12T02:45:00Z  
**Project Root**: `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL`  
**Reference Request**: `.agents/teamwork/ORIGINAL_REQUEST.md`

---

## 1. Executive Summary

This investigation surveys all existing files, data models, streak calculators, attendance recorders, and storage keys in ANHAD. 

### Core Findings:
1. **Severe Streak State Fragmentation**: There are at least **five separate, conflicting streak engines/writers** operating across the codebase (`StreakManager` in `nitnem-tracker.js`, `UnifiedStats` in `unified-stats.js`, `AnhadStats` in `user-stats.js`, `NitnemSync` in `nitnem-sync.js`, and `calculatePothiStreak` in `my-pothi.html`).
2. **Passive Playback Leakage Violates R1**: `AnhadStats.addListeningTime` (`user-stats.js:214`) calls `updateStreak()` whenever audio is played, and `deferredInit` (`user-stats.js:520`) calls `updateStreak()` on application launch. This creates "phantom" streaks without any actual Amritvela check-in or Nitnem prayer completion.
3. **No Persistent Broken Streak or Previous-Best Tracking**: When a streak lapses, `StreakManager` resets `currentStreak` to 0 or 1 without preserving `brokenStreak.count`, `brokenDate`, or `previousBestStreak`. The existing `StreakSaverManager` handles only an immediate 24-hour "Japtab" punishment with a monthly quota; it does not support an unrecovered lapse recovery window (5–10 days) or a multi-day restoration challenge.
4. **Authentic Gurbani Passages Available Locally**: The repository already includes full SGGS and Nitnem chunk data (`frontend/data/banis-chunks/nitnem-banis.json`, `frontend/NitnemTracker/data/banis.json`, and `frontend/nitnem/data/bani-catalog.json`) with accurate Ang page numbers and authentic Gurmukhi Unicode text suitable for the 5-day challenge.
5. **My Pothi Consistency Grid is Display-Only**: In `frontend/nitnem/my-pothi.html`, clicking a cell in the 35-day monthly grid merely shows a temporary text tooltip. No interactive completion drawer/modal exists to complete missed historical prayers or update historical snapshots.

---

## 2. Inventory of Files, Storage Keys & Subsystems

### 2.1 File Map

| Path | Primary Role | Key Functions / Objects |
|---|---|---|
| `frontend/lib/unified-stats.js` | Unified stats coordinator | `UnifiedStats.recordNitnemBani`, `recordNitnemComplete`, `syncStreak`, `getStreaks` |
| `frontend/NitnemTracker/nitnem-tracker.js` | Nitnem Tracker monolithic controller (13,006 lines) | `StreakManager`, `AmritvelaManager`, `NitnemManager`, `StreakSaverManager`, `DailyResetManager`, `DateHistoryView`, `AmritvelaWeekView`, `StorageManager` |
| `frontend/NitnemTracker/data-persistence-guard.js` | Tri-redundant backup & integrity validator | `validateData`, `safeSave`, `recoverData`, IndexedDB sync |
| `frontend/nitnem/my-pothi.html` | Custom Pothi reader & consistency grid | `loadCompletedBanis`, `saveCompletedBanis`, `syncCompletionToNitnemTracker`, `renderInsights`, `calculatePothiStreak` |
| `frontend/nitnem/js/reader-engine.js` | Gurbani reader page | Fires completion at 90% scroll (`progress >= 90`) via `UnifiedStats.recordNitnemComplete` |
| `frontend/lib/user-stats.js` | Legacy/global user stats (`AnhadStats`) | `updateStreak`, `getStreak`, `addListeningTime`, `addNitnemCompleted`, `addPagesRead` |
| `frontend/reminders/js/nitnem-sync.js` | Smart reminders sync (`NitnemSync`) | `recordResponse`, `updateStreak`, `checkPerfectDay`, cross-tab BroadcastChannel |
| `frontend/Dashboard/dashboard-complete-fix.js` | Dashboard aggregate stats | `initDevotionStreakSync` (forces `Math.max(..., 1)`), updates `anhad_daily_analytics` |
| `frontend/js/trendora-app.js` | App homepage quick-cards | `DataManager.getStreak()`, reads `KEYS.STREAK_SAVER` then `KEYS.NITNEM_STREAK` |
| `frontend/js/homepage-data.js` | Homepage card display | Reads streak from `UnifiedStats.getStreaks()` or `anhad_streak_data` |
| `frontend/data/banis-chunks/nitnem-banis.json` | Authentic Gurbani data source | 15 full banis with Gurmukhi Unicode, English transliteration, BDB English translation, and SGGS Ang references |
| `frontend/NitnemTracker/data/banis.json` | Bani metadata | Category, author, SGGS Ang page citations |
| `tests/nitnem/daily-reset-manager.test.js` | Existing Vitest test | Demonstrates safe evaluation of `nitnem-tracker.js` in Vitest jsdom |

### 2.2 Storage Keys & Schema Analysis

| Storage Key | Primary Writer | Primary Schema | Identified Issues / Conflicts |
|---|---|---|---|
| `anhad_streak_data` | Multiple (`StreakManager`, `UnifiedStats`, `AnhadStats`, `NitnemSync`, `Dashboard`) | `{ currentStreak: number, longestStreak: number, lastCheckIn?: string, lastUpdated?: string, freezesUsed?: number, freezesAvailable?: number }` | **Highest conflict key**. Overwritten with incompatible shapes (`current` vs `currentStreak`, `lastCheckIn` vs `lastCompletedDate`). |
| `nitnemTracker_amritvelaLog` | `AmritvelaManager`, `StreakSaverManager` | `{ [YYYY-MM-DD]: { date, time, slot, timestamp, woke: boolean, isStreakSaverPatch?: boolean, usedPunishmentSave?: boolean } }` | Does not currently have `origin: "restored" \| "user"`. Restored/punishment patches lack clean semantic separation. |
| `nitnemTracker_nitnemLog` | `NitnemManager`, `my-pothi.html` | `{ [YYYY-MM-DD]: { amritvela: string[], rehras: string[], sohila: string[], completed: boolean, percentage: number } }` | Array of UIDs per period. `my-pothi.html` syncs to this key by generating/matching UIDs. |
| `anhad_my_pothi` | `my-pothi.html` | `number[]` (e.g. `[2, 4, 6, 9, 10, 21, 23]`) | Defines user's active pothi banis. |
| `anhad_my_pothi_completed` | `my-pothi.html` | `{ [YYYY-MM-DD]: number[] }` (array of numeric bani IDs) | Tracked separately from `nitnemTracker_nitnemLog`. |
| `anhad_pothi_snapshots` | `my-pothi.html` | `{ [YYYY-MM-DD]: { totalBanis: number, updatedAt: number } }` | Locks historical denominator for percentage calculation. |
| `anhad_unified_stats` | `UnifiedStats` | `{ version: "1.0", daily: { [YYYY-MM-DD]: { angRead, nitnemBanis, nitnemComplete, kirtanMinutes } }, streaks: { sehajPath, nitnem, kirtan }, lastActive }` | Disconnected from Amritvela attendance; counts single bani 90% scroll as full `nitnemComplete`. |
| `nitnemTracker_streakSaver` | `StreakSaverManager` | `{ brokenStreak, expiresAt, punishment, completed, context }` | 24-hour Japtab punishment only; deleted when expired or completed. |
| `nitnemTracker_userData` | Legacy | `{ streaks: { current, longest } }` | Legacy fallback read by homepage and UnifiedStats. |

---

## 3. Attendance Recording: Explicit vs Passive Analysis

### 3.1 Genuine Amritvela Attendance Flow
- **Entry Point**: User clicks `#presentBtn` in `frontend/NitnemTracker/nitnem-tracker.html`.
- **Implementation**: `AmritvelaManager.markPresent()` (`nitnem-tracker.js:3852`):
  ```javascript
  const now = new Date();
  const entry = {
      date: today,
      time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      slot: slotInfo.label.toLowerCase(),
      timestamp: now.toISOString(),
      woke: true
  };
  log[today] = entry;
  StorageManager.save(CONFIG.STORAGE_KEYS.AMRITVELA_LOG, log);
  ```
- **Evaluation**: This is an explicit, timestamped user action. It assigns slots (`excellent` [00:00-04:00], `good` [04:00-05:00], `okay` [05:00-06:00], `late` [06:00+]).

### 3.2 Genuine Nitnem Completion Flow
- **Nitnem Tracker**: User checks off all selected banis across Amritvela, Rehras, and Sohila. When `completedBanis === totalBanis`, `nitnemLog[today].completed = true` and `percentage = 100`.
- **My Pothi**: User checks off banis for today in `my-pothi.html`. When `completedBanis.length >= pothiOrder.length`, `getHistoricalPct` reaches 100%.

### 3.3 Passive / Erroneous Streak Leakage (Violations of R1)
1. **Passive Audio Playback (`frontend/lib/user-stats.js:200-216`)**:
   ```javascript
   function addListeningTime(minutes) {
       ...
       stats.totalListeningMinutes += minutes;
       saveStats(stats);
       updateStreak(); // <--- INCORRECT: Playing radio stream increments streak!
   }
   ```
2. **App Boot / Initialization (`frontend/lib/user-stats.js:520`)**:
   ```javascript
   function deferredInit() {
       updateStreak(); // <--- INCORRECT: Merely opening app checks in and increments/preserves streak!
   }
   ```
3. **Single Bani Partial Scroll (`frontend/nitnem/js/reader-engine.js:1415-1426`)**:
   Scrolling 90% down any single bani calls `UnifiedStats.recordNitnemComplete()`, which marks the entire day complete and increments `streaks.nitnem`!
4. **Dashboard Fallback (`frontend/Dashboard/dashboard-complete-fix.js:107-112`)**:
   ```javascript
   const nitnemStreak = Math.max(..., 1); // <--- INCORRECT: Forces minimum streak of 1 even with 0 activity!
   ```

**Architectural Requirement**:
The authoritative streak engine must strictly decouple Amritvela and Nitnem streaks from audio listening and passive app launches. Genuine attendance must require verified records in `nitnemTracker_amritvelaLog` and/or complete Nitnem records in `nitnemTracker_nitnemLog` / `anhad_my_pothi_completed`.

---

## 4. Streak Calculation Architecture

### 4.1 How Streak Calculation Works in `StreakManager`
In `nitnem-tracker.js:8043`, `recalculateStreak()`:
1. Gathers all unique date strings from `nitnemTracker_amritvelaLog` and dates from `nitnemTracker_nitnemLog` where `completed === true || percentage === 100`.
2. Passes the array of date strings to `Utils.calculateStreak(dates)` (`nitnem-tracker.js:417`):
   ```javascript
   const toUtcDay = (dateStr) => {
       const parts = String(dateStr).split('-');
       if (parts.length !== 3) return NaN;
       return Date.UTC(+parts[0], +parts[1] - 1, +parts[2]) / 86400000;
   };
   const todayDay = toUtcDay(today);
   const yesterdayDay = todayDay - 1;
   const dayNumbers = [...new Set(dates.map(toUtcDay))].filter(d => !isNaN(d)).sort((a, b) => b - a);
   ```
3. **Liveness Evaluation**:
   - `dayNumbers[0] === todayDay`: Streak active today.
   - `dayNumbers[0] === yesterdayDay`: Streak active (completed yesterday, today still open).
   - If neither: returns `0` (streak broken).
4. **Consecutive Days Count**:
   Iterates through descending `dayNumbers`. As long as `dayNumbers[i] - dayNumbers[i + 1] === 1`, increments streak count. Breaks on first gap.

### 4.2 Strengths & Vulnerabilities
- **Strength (Timezone Independence)**: Using UTC midnight day numbers (`Date.UTC(+y, +m-1, +d) / 86400000`) completely eliminates daylight saving and local timezone offset jitter when computing day difference (`dayA - dayB === 1`).
- **Deficiency 1 (Broken State Loss)**: If `dayNumbers[0] < yesterdayDay`, `calculateStreak()` simply returns `0`. It does NOT persist what the streak was before it broke, nor what date it broke on.
- **Deficiency 2 (Cross-Module Inconsistency)**:
  - `My Pothi` calculates streak based ONLY on `anhad_my_pothi_completed`.
  - `UnifiedStats` calculates streak only looking at `stats.daily[yesterdayStr]?.nitnemComplete`.
  - `AnhadStats` calculates streak based on `lastCheckIn` and has streak freezes (`freezesAvailable`).
  - Therefore, the home page, My Pothi, UnifiedStats, and NitnemTracker frequently display conflicting streak counts!

---

## 5. Previous-Best Streak & Recovery Challenge Data Requirements (R2 & R3)

### 5.1 Authoritative State Model
To satisfy R1, R2, and R3, `anhad_streak_data` must be extended into an authoritative state structure:

```json
{
  "currentStreak": 2,
  "longestStreak": 34,
  "previousBestStreak": 34,
  "lastCompletedDate": "2026-10-11",
  "brokenStreak": {
    "count": 34,
    "brokenDate": "2026-10-04",
    "lastCompletedDate": "2026-10-03"
  },
  "recoveryChallenge": {
    "status": "eligible",
    "windowConfigDays": 7,
    "targetStreak": 34,
    "startedDate": null,
    "requiredDays": 5,
    "consecutiveDaysCompleted": 0,
    "completedDates": [],
    "lastChallengeDate": null,
    "gapStartDate": "2026-10-04",
    "gapEndDate": null
  },
  "lastUpdated": "2026-10-12T02:30:00.000Z"
}
```

### 5.2 Eligibility Conditions (R2)
The recovery challenge must be offered **if and only if**:
1. A streak break has occurred (`brokenStreak !== null` or `currentStreak < previousBestStreak`).
2. Elapsed days since the break date >= configured recovery window:
   `elapsedDays = toUtcDay(today) - toUtcDay(brokenStreak.brokenDate)`
   `elapsedDays >= (windowConfigDays || 7)` (configurable between 5 and 10 days).
3. The user has an unrecovered personal best higher than their current streak:
   `previousBestStreak > currentStreak`.
4. The challenge is not already active or completed for this break.

### 5.3 5-Day Challenge Daily Passages from Existing Data Source
Each day of the 5-day challenge presents a verified Gurbani passage from Sri Guru Granth Sahib Ji with Gurmukhi Unicode text, accurate Ang citations, and English translations:

| Day | Gurmukhi Passage | English Translation | Ang Citation & Author |
|---|---|---|---|
| **Day 1** | ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਸਚੁ ਨਾਉ ਵਡਿਆਈ ਵੀਚਾਰੁ ॥ | In the ambrosial hours of the morning, contemplate the True Name and His Glorious Greatness. | **Ang 2** (Guru Nanak Dev Ji, Japji Sahib) |
| **Day 2** | ਗੁਰ ਸਤਿਗੁਰ ਕਾ ਜੋ ਸਿਖੁ ਅਖਾਏ ਸੁ ਭਲਕੇ ਉਠਿ ਹਰਿ ਨਾਮੁ ਧਿਆਵੈ ॥ | One who calls himself a Sikh of the Guru shall rise in the early morning and meditate on the Lord's Name. | **Ang 305** (Guru Ram Das Ji, Raag Gauree) |
| **Day 3** | ਉਦਮੁ ਕਰੇ ਭਲਕੇ ਪਰਭਾਤੀ ਇਸਨਾਨੁ ਕਰੇ ਅੰਮ੍ਰਿਤ ਸਰਿ ਨਾਵੈ ॥ | Upon arising early in the morning, make the effort to bathe and cleanse yourself in the pool of nectar. | **Ang 305** (Guru Ram Das Ji, Raag Gauree) |
| **Day 4** | ਪ੍ਰਭਾਤੇ ਪ੍ਰਭ ਨਾਮੁ ਜਪਿ ਗੁਰ ਕੇ ਚਰਨ ਧਿਆਇ ॥ | In the early morning, chant the Name of God, and meditate on the Guru's feet. | **Ang 819** (Guru Arjan Dev Ji, Raag Bilaaval) |
| **Day 5** | ਫਰੀਦਾ ਪਿਛਲ ਰਾਤਿ ਨ ਜਾਗਿਓਹਿ ਜੀਵਦੜੋ ਮੁਇਓਹਿ ॥ | Fareed: If you do not awaken in the early hours before dawn, you are dead while yet alive. | **Ang 1383** (Bhagat Farid Ji, Salok Farid Ji) |

### 5.4 Challenge Failure & Reset Handling
- If a user misses a calendar day during the 5-day challenge (`toUtcDay(today) - toUtcDay(lastChallengeDate) > 1`):
  - Reset `consecutiveDaysCompleted = 0` and clear `completedDates = []`.
  - Display an encouraging spiritual message (e.g. *"Spiritual discipline is a lifelong path of grace and effort. Guru Sahib values your sincere yearning. You can restart the 5-day challenge whenever you are ready."*).
  - Challenge remains eligible for restart.

### 5.5 Deterministic Restoration & Transparent Historical Gap Backfilling (R3)
When Day 5 is completed:
1. **Streak Restoration**:
   - `currentStreak` is atomically restored to `targetStreak + 5` (or `targetStreak`).
   - If restored streak > `longestStreak`, update `longestStreak`.
2. **Historical Gap Calculation**:
   - Gap dates span from `gapStartDate` (first missed date) up to the day before challenge Day 1.
3. **Average Wake-Up Time Computation**:
   - Filter genuine attendance entries from `nitnemTracker_amritvelaLog` that belong to the relevant previous streak.
   - Ignore any entries where `origin === "restored"` or `isStreakSaverPatch === true`.
   - Calculate average minutes past midnight across entries:
     `avgMinutes = Math.round(sum(hours * 60 + mins) / count)`.
   - Fallback: If no genuine entries exist with valid timestamps, fallback to `"04:30"` (or `"05:00"`).
4. **Non-Destructive Backfilling**:
   - For each gap date `d`:
     - If `amritvelaLog[d]` already exists (genuine entry), **NEVER OVERWRITE**.
     - If `amritvelaLog[d]` is missing:
       ```javascript
       amritvelaLog[d] = {
           date: d,
           time: avgWakeTimeStr,
           slot: getSlotFromTime(avgWakeTimeStr),
           timestamp: `${d}T${avgWakeTimeStr}:00.000Z`,
           woke: true,
           origin: "restored",
           isSystemGenerated: true
       };
       ```
5. **Analytics Exclusion**:
   - In `DateHistoryView` and `AmritvelaWeekView`, records with `origin === "restored"` must display a distinct `[Restored]` badge.
   - Functions calculating genuine wake-up timing metrics (`getAverageWakeTime`, `getEarliestWake`) MUST filter: `!entry.origin || entry.origin !== 'restored'`.

---

## 6. My Pothi Missed-Day Interactive Completion (R4)

### 6.1 Current Behavior in `my-pothi.html`
- In `renderMonthlyView(el, data)` (`my-pothi.html:1627`), each cell is rendered as:
  `<div class="grid-cell ${intensityClass}" onclick="showInsightsTooltip(...)"></div>`
- Clicking only displays tooltip text in `#insightsTooltip`.
- Weekly view (`renderWeeklyView`) has no click handlers at all.

### 6.2 Required Architecture for Missed-Day Completion
1. **Interactive Day Drawer / Modal (`#pothiDayDrawer`)**:
   - Clicking any cell (weekly, monthly, or yearly) invokes `openMissedDayModal(targetDateStr)`.
   - The modal renders:
     - Header: Formatted date (e.g. *"Thursday, October 8, 2026"*), completion percentage.
     - Bani Checklist: List of banis from `pothiOrder` with Gurmukhi name, English name, and checkbox.
     - Checkbox state reads from `anhad_my_pothi_completed[targetDateStr]`.
2. **Dynamic Persistence**:
   - Toggling a bani updates `anhad_my_pothi_completed[targetDateStr]`.
   - Updates `anhad_pothi_snapshots[targetDateStr] = { totalBanis: pothiOrder.length, updatedAt: Date.now() }`.
   - Syncs completion to `nitnemTracker_nitnemLog[targetDateStr]` (matching by UID).
3. **Stat Recalculation**:
   - Recalculates `getHistoricalPct(targetDateStr)`.
   - Triggers authoritative streak recalculation.
   - Refreshes visual grid cells, weekly progress bars, and yearly statistics immediately.

---

## 7. Data Migration & Backward-Compatibility Architecture

### 7.1 Existing Stored Records Compatibility
Existing users have stored data in varying formats:
1. `anhad_streak_data` may have `{ current: N, longest: M }` or `{ currentStreak: N, longestStreak: M }`.
2. `nitnemTracker_amritvelaLog` contains entries without `origin`.
3. `nitnemTracker_streakSaver` might contain an active or past `brokenStreak`.

### 7.2 Migration Rules
1. **Key Preservation**: Always preserve `current`, `currentStreak`, `longest`, and `longestStreak` on `anhad_streak_data` so legacy consumers (`trendora-app.js`, `dashboard-complete-fix.js`) continue to function without crashing.
2. **Implicit Origin**: Any record in `nitnemTracker_amritvelaLog` lacking `origin` should be treated as `origin: "user"`, unless `isStreakSaverPatch === true` (which was a previous penalty patch).
3. **Streak Derivation**:
   - If `previousBestStreak` is missing, initialize:
     `previousBestStreak = Math.max(saved.longestStreak || 0, saved.longest || 0, saved.currentStreak || 0, saved.current || 0)`.
   - If current streak is 0 or 1, and `previousBestStreak > currentStreak`, detect broken streak from historical logs or `nitnemTracker_streakSaver`.
4. **Guard Compliance**: `data-persistence-guard.js` expects `typeof data.currentStreak === 'number'`. Migration must never remove `currentStreak`.

---

## 8. Vitest Baseline & Test Strategy (R5)

### 8.1 Current Test Suite Status
- Baseline run of `npm test`: **280 passed, 2 failed** across 30 test files (282 total tests).
- The 2 failing tests are in `tests/features/sangat-cross-account-flow.test.js` (unrelated Sangat friends engine self-exclusion feature).
- All new tests must pass cleanly. Existing 280 tests must not regress.

### 8.2 Proposed Test Cases for `tests/nitnem/streak-recovery-engine.test.js`
1. **First-time tracker use**: Fresh state initializes streak = 0, longest = 0, no recovery challenge.
2. **Regular streak progression**: Marking Amritvela on consecutive days increments currentStreak (1 -> 2 -> 3).
3. **Idempotent completion**: Marking twice on the same day does not double-count streak.
4. **Broken streak transition**: Missing a day detects broken streak, records `brokenStreak = { count, brokenDate }`, and updates `previousBestStreak`.
5. **Passive isolation**: Audio playback (`addListeningTime`) and app open do NOT increment Amritvela/Nitnem streak.
6. **Recovery eligibility trigger**:
   - Not eligible if `currentStreak >= previousBestStreak`.
   - Not eligible if elapsed days < 7 (or configured window).
   - Eligible when `elapsedDays >= window` and `previousBestStreak > currentStreak`.
7. **5-day challenge lifecycle**:
   - Progressing day 1 to day 5 tracks consecutive days.
   - Authentic Gurbani text & Ang citations present for all 5 days.
8. **Challenge failure / reset handling**: Missing a day resets progress to day 0 with encouragement message.
9. **Average wake-up time calculation**: Genuine wake-up timestamps from previous streak are averaged; fallback used if absent; restored records excluded.
10. **Atomic restoration & gap backfilling**: Completing day 5 restores previous-best streak, fills gap days with `origin: "restored"`, never overwrites genuine records.
11. **My Pothi missed-day completion**: Completing past day in My Pothi persists completion, updates percentage, and recalculates streaks.
12. **Data migration**: Existing legacy streak data is safely migrated without data loss.
