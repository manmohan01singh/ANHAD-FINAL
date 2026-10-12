# Dispatch: Worker 1 - Authoritative Streak Engine & Recovery Challenge (R1, R2, R3)

## Mandatory Context
Read authoritative user request: `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md`
Read project architecture: `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\orchestrator_1\PROJECT.md`
Read survey analysis: `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\explorer_survey_1\analysis.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Exclusive Write Ownership
You exclusively own and may edit:
- `frontend/lib/authoritative-streak-engine.js` (NEW)
- `frontend/lib/user-stats.js`
- `frontend/lib/unified-stats.js`
- `frontend/NitnemTracker/nitnem-tracker.js`

DO NOT edit `frontend/nitnem/my-pothi.html` or any test files.

## Detailed Requirements

### 1. Authoritative Streak Engine (`frontend/lib/authoritative-streak-engine.js`)
- Implement a robust, unified, deterministic source of truth for Amritvela and Nitnem streaks.
- Expose as `window.AuthoritativeStreakEngine` in browser and `module.exports` when in Node/CommonJS.
- State Schema in `anhad_streak_data` (with sync to `anhad_unified_stats` and `nitnemTracker_userData`):
  - `currentStreak`: integer
  - `longestStreak`: integer
  - `previousBestStreak`: integer (preserves previous personal best across streak lapses)
  - `brokenStreak`: `{ count: number, brokenDate: string, lastCompletedDate: string }`
  - `lastSuccessfulSession`: `{ date: string, timestamp: number, type: 'amritvela'|'nitnem', slot: string }`
  - `recoveryChallenge`: `{ active: boolean, startDay: string, currentDay: number, qualifyingDays: string[], brokenStreakCountToRestore: number, status: 'in_progress'|'completed'|'failed'|'idle', lastCompletedDate: string }`
  - `recoveryConfig`: `{ minDelayDays: 7, requiredConsecutiveDays: 5 }`
- Attendance Rules:
  - Must require explicit completion timestamps (e.g. `nitnemTracker_amritvelaLog` entries with `{ woke: true, timestamp, slot }` or full Nitnem completions).
  - Passive app boots (`user-stats.js:520`) and passive audio playback (`user-stats.js:214`) must NEVER increment Amritvela streak. Neutralize/decouple these calls.
  - Handle calendar boundaries (UTC / local dates) deterministically.

### 2. Previous-Best Streak Recovery Challenge (R2)
- Eligibility:
  - Streak is broken (`currentStreak < previousBestStreak` and `brokenStreak.count > 0`).
  - Elapsed days since break >= `minDelayDays` (default 7, configurable 5–10 days).
  - `previousBestStreak > currentStreak`.
- 5-Day Consecutive Challenge Lifecycle:
  - Day 1 through Day 5 qualifying Amritvela completions.
  - Missing a day cancels/resets the challenge with clear spiritual encouragement and retry guidance.
  - Authentic Sri Guru Granth Sahib Gurbani passages for each day:
    * Day 1: Ang 2 (Japji Sahib): "ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਸਚੁ ਨਾਉ ਵਡਿਆਈ ਵੀਚਾਰੁ ॥" / "In the Amrit Vela, the ambrosial hours before dawn, chant the True Name, and contemplate His Glorious Greatness."
    * Day 2: Ang 305 (Gauri Ki Var): "ਗੁਰ ਸਤਿਗੁਰ ਕਾ ਜੋ ਸਿਖੁ ਅਖਾਏ ਸੁ ਭਲਕੇ ਉਠਿ ਹਰਿ ਨਾਮੁ ਧਿਆਵੈ ॥" / "One who calls himself a Sikh of the Guru, the True Guru, shall rise in the early morning hours and meditate on the Lord's Name."
    * Day 3: Ang 449 (Asa M:4): "ਹਰਿ ਜਪੇ ਹਰਿ ਮੰਦਰੁ ਸਾਜਿਆ ਸੰਤ ਭਗਤ ਗੁਣ ਗਾਵਹਿ ਰਾਮ ॥" / "Meditating on the Lord, the temple of the Lord is constructed; the Saints and devotees sing His Glorious Praises."
    * Day 4: Ang 815 (Bilawal M:5): "ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਆਮੀ ਪ੍ਰਭੁ ਅਪਨਾ ਸੀਤਲ ਤਨੁ ਮਨੁ ਛਾਤੀ ॥" / "Meditating, meditating on my Lord and Master God, my body, mind and heart are cooled and soothed."
    * Day 5: Ang 1383 (Salok Farid Ji): "ਫਰੀਦਾ ਰਾਤਿ ਕਥੂਰੀ ਵੰਡੀਐ ਸੁਤਿਆ ਮਿਲੈ ਨ ਭਾਉ ॥" / "Fareed: musk is released at night. Those who are asleep do not receive their share."

### 3. Deterministic Streak Restoration & Historical Gap Backfilling (R3)
- Upon completing Day 5:
  - Atomically restore `previousBestStreak` into `currentStreak` (e.g. `previousBestStreak + 5`).
  - Calculate average wake-up time from historical previous streak genuine attendance timestamps (convert minutes from midnight; default "04:30" if none).
  - Backfill gap dates between `brokenStreak.brokenDate` and challenge start in `nitnemTracker_amritvelaLog`.
  - Mark backfilled records with `origin: "restored"`, `systemGenerated: true`.
  - Exclude restored records from actual wake-up performance metrics (e.g., average wake time, on-time percentage).
  - NEVER overwrite genuine attendance records.

### 4. NitnemTracker UI Integration
- In `frontend/NitnemTracker/nitnem-tracker.js`:
  - Connect streak displays to `AuthoritativeStreakEngine`.
  - Display Recovery Challenge card/banner when eligible.
  - Include Day 1–5 progress, Gurbani passage display, and reset/retry guidance.
  - Ensure light/dark theme styling using existing CSS tokens.

## Verification
- Test implementation with unit checks.
- Document all changes and tests in `handoff.md`.


## 2026-10-12T02:46:13Z
You are Worker 1 (Authoritative Streak Engine & Recovery Challenge Specialist).

Working directory: c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\worker_streak_recovery
Read your instructions in: c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\worker_streak_recovery\DISPATCH.md
Read authoritative user request: c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md
Read project architecture: c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\orchestrator_1\PROJECT.md
Project root: c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write files:
- frontend/lib/authoritative-streak-engine.js (create new)
- frontend/lib/user-stats.js
- frontend/lib/unified-stats.js
- frontend/NitnemTracker/nitnem-tracker.js

Implement R1, R2, R3 per specifications. Run local validation if needed, write your handoff report to c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\worker_streak_recovery\handoff.md, and send a completion message back.
