# E2E Test Infra: Nitnem & Amritvela Tracking System

## Test Philosophy
- Opaque-box, requirement-driven, deterministic test validation under Vitest + jsdom.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise State Transition + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Authoritative Streak Calculation | ORIGINAL_REQUEST § R1 | 5 | 5 | ✓ |
| 2 | Explicit Attendance Enforcement | ORIGINAL_REQUEST § R1 | 5 | 5 | ✓ |
| 3 | Broken Streak State Preservation | ORIGINAL_REQUEST § R1 | 5 | 5 | ✓ |
| 4 | Previous-Best Recovery Eligibility | ORIGINAL_REQUEST § R2 | 5 | 5 | ✓ |
| 5 | 5-Day Challenge Lifecycle & Reset | ORIGINAL_REQUEST § R2 | 5 | 5 | ✓ |
| 6 | Authentic SGGS Gurbani Passages & Angs | ORIGINAL_REQUEST § R2 | 5 | 5 | ✓ |
| 7 | Atomic Streak Restoration | ORIGINAL_REQUEST § R3 | 5 | 5 | ✓ |
| 8 | Average Wake-Up Time Calculation | ORIGINAL_REQUEST § R3 | 5 | 5 | ✓ |
| 9 | Non-Destructive Gap Backfilling (`restored`) | ORIGINAL_REQUEST § R3 | 5 | 5 | ✓ |
| 10 | Metric Exclusion for Restored Records | ORIGINAL_REQUEST § R3 | 5 | 5 | ✓ |
| 11 | My Pothi Missed-Day Drawer & Interaction | ORIGINAL_REQUEST § R4 | 5 | 5 | ✓ |
| 12 | Missed-Day Persistence & Grid Repaint | ORIGINAL_REQUEST § R4 | 5 | 5 | ✓ |
| 13 | Data Migration & Storage Backward Compatibility | ORIGINAL_REQUEST § R5 | 5 | 5 | ✓ |

## Test Architecture
- Test runner: `npx vitest run` / `npm test`
- Environment: jsdom with mocked localStorage, fake timers (`vi.useFakeTimers`), and export guards.
- Files:
  - `tests/nitnem/authoritative-streak-engine.test.js`
  - `tests/nitnem/recovery-challenge.test.js`
  - `tests/nitnem/streak-restoration-backfill.test.js`
  - `tests/nitnem/my-pothi-missed-day.test.js`
  - `tests/nitnem/streak-data-migration.test.js`
- Regression baseline: 282 existing tests across 30 files must pass 100%.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full Recovery Journey | F1, F3, F4, F5, F6, F7, F8, F9, F10 | High |
| 2 | Missed Day Recovery via My Pothi | F1, F11, F12 | Medium |
| 3 | Challenge Interruption and Retry | F4, F5, F6 | Medium |
| 4 | Offline Attendance Sync | F1, F2, F3 | High |
| 5 | Existing User Data Migration | F1, F13 | Medium |
