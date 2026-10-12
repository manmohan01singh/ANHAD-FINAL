# Dispatch: Worker 3 - Vitest Test Suites & Regression Guard (R5)

## Mandatory Context
Read authoritative user request: `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md`
Read project architecture: `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\orchestrator_1\PROJECT.md`
Read survey analysis: `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\explorer_survey_3\analysis.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Exclusive Write Ownership
You exclusively own and may edit:
- `backend/data/registered-users.json` (Reset to valid clean fixture state to fix pre-existing disk pollution)
- `tests/nitnem/authoritative-streak-engine.test.js` (NEW)
- `tests/nitnem/recovery-challenge.test.js` (NEW)
- `tests/nitnem/streak-restoration-backfill.test.js` (NEW)
- `tests/nitnem/my-pothi-missed-day.test.js` (NEW)
- `tests/nitnem/streak-data-migration.test.js` (NEW)

DO NOT edit any implementation files in `frontend/`.

## Detailed Requirements

### 1. Disk Pollution Remediation
- In `backend/data/registered-users.json`, reset the file to clean initial fixture state (`[]` or clean mock users not colliding with test UIDs `user_acc_1_*` / `selftester`).
- Verify that `npx vitest run tests/features/sangat-cross-account-flow.test.js` passes cleanly.

### 2. Five Comprehensive Test Suites under `tests/nitnem/`
Implement comprehensive test suites following ANHAD Vitest patterns (`vi.useFakeTimers()`, `localStorage` mocking, export guards):

1. **`tests/nitnem/authoritative-streak-engine.test.js` (R1)**:
   - First-time tracker use (initial 0 streak).
   - Regular streak progression on consecutive qualifying days.
   - Passive event rejection: Verify audio playback and app load do NOT increment streak.
   - Broken streak transitions: Streak drops, broken streak count and date are preserved.
   - Deterministic calendar day boundaries and time zones.
   - Multi-surface consistency: `anhad_streak_data` matches `unified-stats` and `nitnemTracker`.

2. **`tests/nitnem/recovery-challenge.test.js` (R2)**:
   - Recovery eligibility: verify challenge triggers only after configured delay (5–10 days, default 7) and when `previousBestStreak > currentStreak`.
   - Challenge persistence across reloads / restarts.
   - 5-consecutive-day challenge lifecycle (Day 1 of 5 to Day 5 of 5).
   - Authentic Gurbani passages: verify Gurmukhi text and exact Ang citations (Ang 2, 305, 449, 815, 1383).
   - Missed day during challenge: resets/cancels challenge with spiritual encouragement.

3. **`tests/nitnem/streak-restoration-backfill.test.js` (R3)**:
   - Atomic streak restoration upon completing Day 5.
   - Calculation of user's average historical wake-up time (with fallback "04:30").
   - Gap date backfilling between broken date and challenge completion with `origin: "restored"` and `systemGenerated: true`.
   - Verification that restored records are distinguished in details and excluded from genuine wake-up performance metrics.
   - Non-destructive integrity: genuine historical records are NEVER overwritten.
   - Idempotent execution (running restoration twice does not double-restore).

4. **`tests/nitnem/my-pothi-missed-day.test.js` (R4)**:
   - Day drawer opens when clicking historical/missed cells in monthly grid and weekly rows.
   - Toggling prayer completions updates `anhad_my_pothi_completed[dateStr]`.
   - Syncs to `nitnemTracker_nitnemLog[dateStr]`.
   - Dynamically recalculates daily completion percentage and repaints grid cell classes (`lvl-0` to `lvl-full`).
   - Recalculates consistency stats and streak.

5. **`tests/nitnem/streak-data-migration.test.js` (R5)**:
   - Legacy stored records migration from older `anhad_streak_data` schemas.
   - Preservation of existing user streak data and graceful fallback.

### 3. Full Suite Verification (`npm test`)
- Run `npm test` and verify all 282 existing tests pass, plus all new test suites pass cleanly.

## Verification
- Run tests and document complete results in `handoff.md`.


## 2026-10-12T02:46:13Z
Message from fc7a5271-f2ee-4be4-998c-de9fdfba7ce8:
You are Test Writer (Vitest Test Suite Specialist).
Working directory: c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\worker_test_suites
Read instructions in DISPATCH.md, ORIGINAL_REQUEST.md, PROJECT.md, TEST_INFRA.md.
Exclusive write files:
- backend/data/registered-users.json (reset test pollution)
- tests/nitnem/authoritative-streak-engine.test.js
- tests/nitnem/recovery-challenge.test.js
- tests/nitnem/streak-restoration-backfill.test.js
- tests/nitnem/my-pothi-missed-day.test.js
- tests/nitnem/streak-data-migration.test.js
Implement R5 comprehensive automated test suites. Clean up disk pollution so tests/features/sangat-cross-account-flow.test.js passes. Verify `npm test` runs and test cases pass.
Write handoff report to c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\worker_test_suites\handoff.md, and send completion message back.
