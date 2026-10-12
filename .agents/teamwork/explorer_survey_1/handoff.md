# Handoff Report: Survey Explorer 1 — Streak Engine, Attendance Tracking & Recovery Architecture

**Target**: Orchestrator (`fc7a5271-f2ee-4be4-998c-de9fdfba7ce8`) & Implementers  
**Type**: Hard Handoff  
**Working Directory**: `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\explorer_survey_1`  
**Full Analysis Report**: `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\explorer_survey_1\analysis.md`  

---

## 1. Observation

1. **Multiple Conflicting Streak Writers**:
   - `frontend/lib/unified-stats.js` (lines 60–71): Writes `legacy.current`, `legacy.currentStreak`, and `legacy.longest` directly into `anhad_streak_data` inside `saveStats(data)`.
   - `frontend/NitnemTracker/nitnem-tracker.js` (lines 8043–8078): `StreakManager.recalculateStreak()` loads `nitnemTracker_amritvelaLog` and `nitnemTracker_nitnemLog`, calculates streak via `Utils.calculateStreak(datesToUse)`, and writes `{ currentStreak, longestStreak, totalDays }` into `anhad_streak_data` via `StreakSaverManager.enqueueSave()`.
   - `frontend/lib/user-stats.js` (lines 268–326): `AnhadStats.updateStreak()` checks `lastCheckIn` in `anhad_streak_data`, decrements `freezesAvailable`, or resets to 1, writing back to `anhad_streak_data`.
   - `frontend/reminders/js/nitnem-sync.js` (lines 315–344): `NitnemSync.updateStreak()` increments `currentStreak` upon alarm response (`alarmSyncUpdate`), writing to `anhad_streak_data`.
   - `frontend/Dashboard/dashboard-complete-fix.js` (lines 107–128): Sets `const nitnemStreak = Math.max(existingUnified.streaks?.nitnem || 0, existingStreak.currentStreak || 0, existingStreak.current || 0, 1);` and writes to `anhad_streak_data`.
   - `frontend/nitnem/my-pothi.html` (lines 1756–1788): `calculatePothiStreak(dates)` computes its own local streak from `anhad_my_pothi_completed`, isolated from all other pages.

2. **Passive Playback and App-Boot Streak Leakage**:
   - `frontend/lib/user-stats.js` line 214: `addListeningTime(minutes)` calls `updateStreak();` whenever kirtan/radio audio is listened to.
   - `frontend/lib/user-stats.js` line 520: `deferredInit()` calls `updateStreak();` unconditionally upon script evaluation / app load.
   - `frontend/nitnem/js/reader-engine.js` lines 1424–1425: Scrolling down 90% of any single bani calls `UnifiedStats.recordNitnemComplete()`, which marks the day complete and increments `streaks.nitnem`.

3. **Current Attendance Recording**:
   - `frontend/NitnemTracker/nitnem-tracker.js` lines 3852–3878: Explicit Amritvela check-in is initiated via `#presentBtn`, writing `{ date, time, slot, timestamp, woke: true }` to `nitnemTracker_amritvelaLog[today]`.
   - Slots are partitioned as: `excellent` (< 4 AM), `good` (4–5 AM), `okay` (5–6 AM), `late` (6 AM+).
   - Streak calculation in `nitnem-tracker.js:417-465` (`Utils.calculateStreak`): Uses UTC day numbers `Date.UTC(+parts[0], +parts[1] - 1, +parts[2]) / 86400000`, checking if `mostRecent === todayDay || mostRecent === yesterdayDay`.

4. **Absence of Persistent Broken Streak & Recovery Challenge**:
   - `frontend/NitnemTracker/nitnem-tracker.js` lines 8487–8548: `StreakSaverManager.checkStreakBreak()` only handles an immediate 24-hour penalty challenge with a monthly cap of 5 saves.
   - When a streak breaks and is not saved within 24 hours, `checkAndCleanupExpired()` resets `StreakManager.state.currentStreak = 0;`.
   - No fields exist in storage for `brokenStreak: { count, brokenDate, lastCompletedDate }`, `previousBestStreak`, or recovery challenge state (`recoveryChallenge`).

5. **My Pothi Consistency Grid Display-Only State**:
   - `frontend/nitnem/my-pothi.html` line 1675: Monthly grid cells have `onclick="showInsightsTooltip('${tooltipText}', this)"`, which merely populates `#insightsTooltip` with text. No interactive drawer or modal exists to allow completing missed banis on past dates.

6. **Local Authentic Gurbani Data**:
   - `frontend/data/banis-chunks/nitnem-banis.json`: Contains 15 banis with authentic Gurmukhi Unicode verses (`verse.verse.unicode`), Ang citations (`source.pageNo`), and English translations.
   - `frontend/NitnemTracker/data/banis.json`: Contains author, Gurmukhi name, and SGGS Ang references (e.g. Japji Sahib: Ang 1–8).

7. **Test Baseline**:
   - `npm test` execution shows 280 passing tests and 2 failing tests in `tests/features/sangat-cross-account-flow.test.js` (unrelated Sangat friends engine self-request assertions).
   - `tests/nitnem/daily-reset-manager.test.js` passes 4/4 tests in 51ms.

---

## 2. Logic Chain

1. **Step 1 (Source of Truth)**: Observation 1 shows that five different files independently overwrite `anhad_streak_data` and calculate streaks using diverging algorithms. Therefore, a single authoritative streak engine is required that all UI surfaces (`NitnemTracker`, `My Pothi`, `UnifiedStats`, `Homepage`, `Dashboard`) read from and defer to.
2. **Step 2 (Attendance Integrity)**: Observation 2 proves that `AnhadStats.addListeningTime` and `deferredInit` increment `anhad_streak_data` on passive audio playback and app launches. Therefore, the authoritative streak engine must reject passive events and require genuine completion timestamps in `nitnemTracker_amritvelaLog` and complete Nitnem records.
3. **Step 3 (Broken Streak & Recovery Gap)**: Observation 4 proves that once a streak breaks past 24 hours, the lost streak count is discarded and unrecoverable. Therefore, the state model must persist `brokenStreak: { count, brokenDate, lastCompletedDate }` and `previousBestStreak`.
4. **Step 4 (Recovery Window & 5-Day Challenge)**: Requirement R2 mandates offering the recovery challenge only after an unrecovered delay of 5–10 days (default 7). Comparing UTC day numbers between `today` and `brokenStreak.brokenDate` provides a deterministic eligibility trigger.
5. **Step 5 (Authentic Passages & Restored Gap Backfilling)**: Observation 6 shows authentic SGGS verses and Ang citations exist in `frontend/data/banis-chunks/nitnem-banis.json` and `frontend/NitnemTracker/data/banis.json`. When Day 5 is completed, backfilling gap dates with `origin: "restored"` using the previous streak's average wake-up time preserves historical auditability while excluding restored records from genuine wake-up analytics.
6. **Step 6 (Missed-Day Pothi Completion)**: Observation 5 shows the My Pothi consistency grid lacks interaction. Attaching a click handler to open a day drawer/modal, toggling completions for that date in `anhad_my_pothi_completed`, and syncing to `nitnemTracker_nitnemLog` satisfies R4 without modifying existing data format conventions.

---

## 3. Caveats

1. **Pre-existing Vitest Failure**: `tests/features/sangat-cross-account-flow.test.js` has 2 failing tests relating to Sangat self-user exclusion in search/friendsEngine. This is a pre-existing condition and unrelated to Nitnem/Amritvela tracking.
2. **Capacitor Mobile Assets**: Mobile assets in `android/app/src/main/assets/public/` and `ios/App/App/public/` contain copies of frontend files. Implementation changes must be made to `frontend/` source files, and synced to Capacitor via `npm run cap:sync` if native builds are tested.
3. **Legacy Fallbacks**: Several files fall back to `nitnemTracker_userData` if `anhad_streak_data` has a 0 streak. Authoritative state initialization must ensure `anhad_streak_data` is always populated to prevent stale legacy fallbacks from taking precedence.

---

## 4. Conclusion

1. **Authoritative Engine (`AuthoritativeStreakEngine`)**:
   Implement a unified streak engine (accessible globally as `window.AuthoritativeStreakEngine` and exported for Node/Vitest tests) that governs `anhad_streak_data`.
   - Tracks: `currentStreak`, `longestStreak`, `previousBestStreak`, `brokenStreak: { count, brokenDate, lastCompletedDate }`, `lastSuccessfulSession`, and `recoveryChallenge`.
   - Base genuine calculation strictly on verified records in `nitnemTracker_amritvelaLog` and complete records in `nitnemTracker_nitnemLog` / `anhad_my_pothi_completed`.
   - Deprecate or neutralize `AnhadStats.updateStreak()` calls triggered by passive audio playback.
2. **Recovery Challenge & Restoration**:
   - Triggers when `today - brokenDate >= windowDays (default 7)` and `previousBestStreak > currentStreak`.
   - Manages 5 consecutive qualifying days with authentic SGGS passages (Ang 2, Ang 305, Ang 305, Ang 819, Ang 1383).
   - On completion, transactionally restores `previousBestStreak` and populates gap dates with `origin: "restored"` and average genuine wake-up time, without overwriting genuine records.
3. **My Pothi Missed-Day Drawer**:
   - Upgrade consistency grid cells to open an interactive modal/drawer allowing past-date prayer completion and real-time recalculation of consistency stats and streaks.

---

## 5. Verification Method

1. **Inspect Survey Output**:
   - Verify `analysis.md` in `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\explorer_survey_1\analysis.md`.
2. **Verify Existing Nitnem Tests**:
   ```powershell
   npx vitest run tests/nitnem/daily-reset-manager.test.js
   ```
   *Expected*: Passes 4/4 tests cleanly.
3. **Verify Baseline Test Count**:
   ```powershell
   npm test
   ```
   *Expected*: 280 passed, 2 failed (the 2 pre-existing Sangat tests). Total 282 tests.
4. **Invalidation Conditions**:
   - Any claim that passive audio playback does not update streak is refuted by `frontend/lib/user-stats.js:214`.
   - Any claim that `StreakManager` currently tracks previous-best after a lapse is refuted by `nitnem-tracker.js:8860`.
