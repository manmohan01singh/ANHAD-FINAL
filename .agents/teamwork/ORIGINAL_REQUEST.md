# Original User Request

## 2026-10-12T02:26:42Z

Requested team: Full multi-agent team (parallel implementers and reviewers across tracker, streak engine, recovery challenge, and My Pothi)

Implement an end-to-end Nitnem and Amritvela tracking system in ANHAD with accurate streak calculation, previous-best streak recovery challenge (5-consecutive-day challenge with authentic Gurbani passages), transparent historical backfilling with distinct audit origin, and interactive missed-day Nitnem completion in My Pothi.

Working directory: c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL
Integrity mode: development

## Requirements

### R1. Authoritative Amritvela & Nitnem Streak Engine
Implement a unified, deterministic source of truth for Amritvela and Nitnem streaks. The engine must track actual persisted attendance timestamps (not audio opens or passive app sessions), current streak, previous-best/longest streak, the most recent broken streak, and the last recorded successful session. UI surfaces must always read from this authoritative state without diverging.

### R2. Previous-Best Streak Recovery Challenge
When a streak has been broken and remains unrecovered past a configurable recovery window (default 7 days, configurable 5–10 days), offer an eligible recovery challenge if the user has a prior personal best streak higher than their current streak. The challenge requires 5 consecutive qualifying Amritvela completions. Daily tasks must feature authentic Sri Guru Granth Sahib Gurbani passages preserving original Gurmukhi text and accurate Ang citations from the application's existing data source. Missing a required day applies documented cancellation/reset rules with clear spiritual encouragement and retry explanations.

### R3. Deterministic Streak Restoration & Transparent Historical Gap Backfilling
Upon completing the 5-day challenge, transactionally restore the eligible previous-best streak. Populate historical gap dates in attendance and consistency views using the user's average recorded Amritvela wake-up time from the relevant previous streak (with a defined fallback if no timestamps exist). Mark backfilled records as `restored`/`system-generated` so they remain distinct in history details, prevent overwriting real attendance, and are excluded from actual wake-up performance metrics.

### R4. My Pothi Missed-Day Interactive Completion
Enable users to click any past or missed day in the My Pothi consistency grid (weekly, monthly, or yearly view). Clicking opens an interactive day drawer/modal allowing completion of pending or missed Nitnem prayers for that specific historical date, dynamically persisting the completion, updating day completion percentages, and recalculating consistency stats and streaks.

### R5. Comprehensive Automated Test Suite & Regression Guard
Provide automated tests in the existing Vitest suite (`npm test`) verifying: first-time tracker use, regular streak progression, broken streak transitions, recovery eligibility triggering after the configured delay, the 5-day challenge lifecycle, challenge failure/reset handling, average wake-up time calculations, non-destructive historical backfilling, idempotent/duplicate completion handling, missed-day completion in My Pothi, and data migration for existing stored records.

## Acceptance Criteria

### Streak Calculation & State
- [ ] Streak calculations produce identical results across NitnemTracker, My Pothi, UnifiedStats, and background services.
- [ ] Genuine attendance records require explicit completion timestamps; app launches or passive audio playback do not increment Amritvela streak.
- [ ] Broken streak timestamp and previous personal-best streak are preserved when a streak lapses.
- [ ] Calendar day boundaries, time zones, and offline completions are handled deterministically without resetting or skipping days erroneously.

### Recovery Challenge
- [ ] Recovery challenge button appears only when the streak is broken, elapsed days meet the configured delay window (5–10 days, default 7), and previous best streak > current streak.
- [ ] Challenge state persists across app reloads, restarts, and offline sessions.
- [ ] Daily challenge presents Day 1 of 5 through Day 5 of 5 progress, incorporating authentic Gurbani passages with verified Gurmukhi text and Ang references from existing Sri Guru Granth Sahib data.
- [ ] Missing a day during the challenge resets or cancels the challenge with clear explanation and retry guidance.

### Restoration & Historical Integrity
- [ ] Completing Day 5 restores the eligible previous-best streak atomically without race conditions or double counting.
- [ ] Gap dates between the broken streak and challenge completion are populated with `origin: "restored"` and the user's average historical wake-up time.
- [ ] Restored gap records are visually distinguishable in record details and excluded from genuine wake-up timing analytics.
- [ ] Genuine historical attendance records are never overwritten or modified by the restoration process.

### My Pothi Missed-Day Completion
- [ ] Clicking any historical/missed cell in the My Pothi consistency grid opens a day view allowing completion of Nitnem banis for that date.
- [ ] Completing banis for a missed day updates stored daily records, visual grid cells, and recalculates consistency statistics.

### Verification & Quality
- [ ] All new tests in Vitest pass cleanly with `npm test`.
- [ ] All existing 282 test cases pass without regressions.
- [ ] UI components render and function properly across both light and dark themes.
