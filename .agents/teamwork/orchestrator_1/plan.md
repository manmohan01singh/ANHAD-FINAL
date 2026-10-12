# Execution Plan: Nitnem & Amritvela Tracking System in ANHAD

## Overview
Implement an end-to-end Nitnem and Amritvela tracking system with authoritative streak calculation, previous-best streak recovery challenge (5-consecutive-day challenge with authentic Gurbani passages), transparent historical backfilling with distinct audit origin, and interactive missed-day Nitnem completion in My Pothi.

## Plan & Execution Milestones

### Milestone 1 (M1): Authoritative Streak Engine (R1)
- Dispatch Worker 1:
  - Create `frontend/lib/authoritative-streak-engine.js`.
  - Implement deterministic state machine: `currentStreak`, `longestStreak`, `previousBestStreak`, `brokenStreak`, `lastSuccessfulSession`.
  - Neutralize passive audio playback and boot update in `frontend/lib/user-stats.js` (streaks require explicit attendance).
  - Integrate with `NitnemTracker` (`nitnem-tracker.js`), `UnifiedStats` (`unified-stats.js`), and `user-stats.js`.
  - Ensure export guard for both browser `window.AuthoritativeStreakEngine` and CommonJS `module.exports`.

### Milestone 2 (M2): Previous-Best Recovery Challenge & Deterministic Restoration (R2, R3)
- Dispatch Worker 2:
  - In `frontend/lib/authoritative-streak-engine.js` (or companion recovery module):
    - Implement eligibility check (streak broken, elapsed >= 7 days, previousBest > current).
    - Implement 5-day challenge lifecycle with Day 1–5 progression and reset/retry rules.
    - Embed 5 authentic Sri Guru Granth Sahib Gurbani passages with verified Unicode Gurmukhi text and Ang citations (Ang 2, 305, 449, 815, 1383).
    - Implement average wake-up time calculation from previous streak (fallback "04:30").
    - Implement transactional restoration and non-destructive gap backfilling with `origin: "restored"`.
    - Ensure restored entries are excluded from genuine wake-up performance metrics and genuine records are never overwritten.
  - In `frontend/NitnemTracker/nitnem-tracker.js`:
    - Add recovery challenge banner/card and daily challenge modal with authentic Gurbani text, progress indicator, and retry guidance.

### Milestone 3 (M3): My Pothi Interactive Missed-Day Drawer (R4)
- Dispatch Worker 3:
  - In `frontend/nitnem/my-pothi.html`:
    - Add iOS-style bottom drawer (`#pothiDayDrawer`) with backdrop blur.
    - Attach click handlers to weekly rows, monthly grid cells, and yearly view.
    - Enable interactive toggling of missed prayers for any historical date.
    - Update `anhad_my_pothi_completed[dateStr]`, sync to `nitnemTracker_nitnemLog[dateStr]` with parameterized `targetDateStr`.
    - Dynamically recalculate `getHistoricalPct`, repaint cell classes (`lvl-0` to `lvl-full`), and recalculate streaks.
    - Ensure light and dark mode styling parity using CSS theme variables.

### Milestone 4 (M4): Automated Vitest Test Suites & Regression Guard (R5)
- Dispatch Test Writer / Worker 4:
  - Clean up disk pollution in `backend/data/registered-users.json` to ensure `sangat-cross-account-flow.test.js` passes.
  - Create 5 comprehensive test suites under `tests/nitnem/`:
    1. `tests/nitnem/authoritative-streak-engine.test.js`
    2. `tests/nitnem/recovery-challenge.test.js`
    3. `tests/nitnem/streak-restoration-backfill.test.js`
    4. `tests/nitnem/my-pothi-missed-day.test.js`
    5. `tests/nitnem/streak-data-migration.test.js`
  - Run full test suite (`npm test`) and ensure all 282 existing tests + new tests pass cleanly with 0 errors.

### Milestone 5 (M5): Verification, Challenger Stress Test, and Forensic Audit
- Dispatch Reviewers (2 independent reviewers).
- Dispatch Challengers (2 adversarial verifiers).
- Dispatch Forensic Auditor (`teamwork_preview_auditor`).
- Gate verification (strict AND: builds pass, tests pass, reviewers approve, challengers approve, auditor clean).
- Synthesize completion report and notify Sentinel.
