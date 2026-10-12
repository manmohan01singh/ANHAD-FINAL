# Project: Nitnem and Amritvela Tracking System in ANHAD

## Architecture
- **Unified Engine**: `frontend/lib/authoritative-streak-engine.js` is the single deterministic source of truth for Amritvela and Nitnem streaks, recovery challenges, and historical restoration.
- **Storage Store**: `anhad_streak_data` (with automatic backward compatibility sync to `anhad_unified_stats` and `nitnemTracker_userData`).
- **Data Model**:
  - `currentStreak`: consecutive active days based strictly on verified attendance.
  - `longestStreak`: all-time peak streak.
  - `previousBestStreak`: user's highest personal streak achieved before the most recent break (persists across lapses).
  - `brokenStreak`: `{ count: number, brokenDate: string, lastCompletedDate: string }`.
  - `lastSuccessfulSession`: `{ date: string, timestamp: number, type: 'amritvela' | 'nitnem', slot: string }`.
  - `recoveryChallenge`: `{ active: boolean, startDay: string, currentDay: number, qualifyingDays: string[], brokenStreakCountToRestore: number, status: 'in_progress' | 'completed' | 'failed' | 'idle' }`.
  - `recoveryConfig`: `{ minDelayDays: number, requiredConsecutiveDays: number }` (default 7 days delay, 5 days challenge).
- **Attendance Verification**:
  - Genuine attendance requires explicit timestamps in `nitnemTracker_amritvelaLog` (`{ woke: true, timestamp, slot }`) or full Nitnem completion in `nitnemTracker_nitnemLog` / `anhad_my_pothi_completed`.
  - Passive audio playback (`user-stats.js:214`) and app launch (`user-stats.js:520`) are decoupled and prohibited from incrementing Amritvela streaks.
- **Recovery Challenge (R2 & R3)**:
  - Eligibility: broken streak exists, elapsed days >= `minDelayDays` (default 7, range 5–10), `previousBestStreak > currentStreak`.
  - 5-Day Challenge with 5 authentic Sri Guru Granth Sahib Gurbani passages (Ang 2, 305, 449, 815, 1383) with original Unicode Gurmukhi text and verified Ang citations.
  - Reset rule: Missing a day resets the challenge with clear spiritual encouragement.
  - Restoration & Backfill: Atomically restores `previousBestStreak` + challenge days; populates gap dates in `nitnemTracker_amritvelaLog` with `origin: "restored"` and user's average historical wake-up time (excluding restored entries from genuine wake-up performance analytics). Never overwrites genuine records.
- **My Pothi Interactive Missed-Day Drawer (R4)**:
  - `frontend/nitnem/my-pothi.html`: consistency grid cells (weekly, monthly, yearly) open `#pothiDayDrawer`.
  - Interactive prayer toggles update `anhad_my_pothi_completed[dateStr]` and sync to `nitnemTracker_nitnemLog[dateStr]`.
  - Dynamically recalculates `getHistoricalPct`, repaints cell intensity classes (`lvl-0` to `lvl-full`), and updates streak and stats.
- **Test Architecture (R5)**:
  - Co-located under `tests/nitnem/` using Vitest + jsdom + fake timers.
  - 5 new test suites covering R1–R5.
  - Clean `backend/data/registered-users.json` disk state to ensure 100% of the 282 existing tests pass alongside new tests.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Authoritative Streak Engine | Deterministic unified engine for Amritvela and Nitnem streaks | M1 | R1 |
| 2 | Explicit Attendance Enforcement | Require explicit timestamps; neutralize passive audio/boot leakage | M1 | R1 |
| 3 | Broken Streak & Previous Best Tracking | Preserve broken streak count, broken date, and previous-best streak across lapses | M1 | R1 |
| 4 | Recovery Challenge Eligibility Engine | Trigger challenge after configured delay window (default 7 days) if previousBest > current | M2 | R2 |
| 5 | 5-Day Consecutive Challenge Lifecycle | 5-day qualifying flow with failure/reset handling and spiritual retry guidance | M2 | R2 |
| 6 | Authentic SGGS Gurbani Passages | 5 verified Gurbani passages with Unicode Gurmukhi text and Ang citations (Ang 2, 305, 449, 815, 1383) | M2 | R2 |
| 7 | Atomic Streak Restoration | Transactionally restore eligible previous-best streak upon Day 5 completion | M2 | R3 |
| 8 | Historical Gap Backfilling | Backfill missing gap dates with `origin: "restored"` and average historical wake-up time | M2 | R3 |
| 9 | Non-Destructive Integrity & Metric Guard | Prevent overwriting real attendance; exclude restored records from wake-up metrics | M2 | R3 |
| 10 | My Pothi Missed-Day Drawer | Clicking historical grid cells opens interactive iOS-style prayer completion drawer | M3 | R4 |
| 11 | Missed-Day Persistence & Sync | Persist past date completions, sync to Nitnem log, dynamic cell repaints and streak update | M3 | R4 |
| 12 | Comprehensive Test Suite & Regression Guard | 5 Vitest suites for R1-R5; fix disk pollution; all 282 existing + new tests pass | M4 | R5 |
| 13 | Cross-Subsystem Integration & Light/Dark Theme | Verify all UI surfaces, theme tokens, Challenger verification, and Forensic Audit | M5 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Authoritative Streak Engine | `frontend/lib/authoritative-streak-engine.js`, passive event neutralization, integration | none | PLANNED |
| M2 | Recovery Challenge & Historical Restoration | 5-day challenge, SGGS passages, atomic restore, average wake-up time backfill | M1 | PLANNED |
| M3 | My Pothi Missed-Day Interactive Drawer | `my-pothi.html` grid click handlers, bottom drawer, dynamic repaint & recalculation | M1 | PLANNED |
| M4 | Automated Vitest Test Suite & Regression Guard | 5 test suites under `tests/nitnem/`, test isolation, full pass on 282 + new tests | M1, M2, M3 | PLANNED |
| M5 | Challenger Verification & Forensic Audit | Adversarial verification, forensic audit, full regression gate | M4 | PLANNED |

## Interface Contracts
### `AuthoritativeStreakEngine`
- `getState(): StreakState`
- `recordAmritvelaAttendance(dateStr: string, timeStr?: string, slot?: string): StreakState`
- `recordNitnemCompletion(dateStr: string, completedBaniIds: number[]): StreakState`
- `checkStreakBreak(currentDateStr?: string): StreakBreakResult`
- `isRecoveryEligible(currentDateStr?: string): boolean`
- `startRecoveryChallenge(): RecoveryChallengeState`
- `recordRecoveryDayCompletion(dateStr: string, timeStr?: string): RecoveryDayResult`
- `calculateAverageWakeUpTime(): string` (returns "HH:MM" e.g. "03:45", fallback "04:30")
- `restoreStreakAndBackfillGaps(): RestorationResult`
- `syncLegacyStores(state: StreakState): void`

### `My Pothi` ↔ `AuthoritativeStreakEngine`
- `openPothiDayDrawer(dateStr: string): void`
- `toggleMissedDayBani(dateStr: string, baniId: number): void`
- `syncCompletionToNitnemTracker(baniId: number, isComplete: boolean, targetDateStr?: string): void`

## Code Layout
- `frontend/lib/authoritative-streak-engine.js` (Core streak engine, recovery challenge, gap backfilling, SGGS passages)
- `frontend/NitnemTracker/nitnem-tracker.js` (NitnemTracker UI integration, recovery challenge card/modal)
- `frontend/lib/user-stats.js` (Neutralize passive audio and app-boot streak updates)
- `frontend/lib/unified-stats.js` (Bridge to AuthoritativeStreakEngine)
- `frontend/nitnem/my-pothi.html` (Missed-day drawer, consistency grid click handlers, dynamic repaint)
- `backend/data/registered-users.json` (Reset to valid initial test state to clear test pollution)
- `tests/nitnem/authoritative-streak-engine.test.js` (R1 tests)
- `tests/nitnem/recovery-challenge.test.js` (R2 tests)
- `tests/nitnem/streak-restoration-backfill.test.js` (R3 tests)
- `tests/nitnem/my-pothi-missed-day.test.js` (R4 tests)
- `tests/nitnem/streak-data-migration.test.js` (R5 migration tests)
