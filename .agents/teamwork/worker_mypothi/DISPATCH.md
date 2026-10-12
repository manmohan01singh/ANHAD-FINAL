# Dispatch: Worker 2 - My Pothi Missed-Day Interactive Completion (R4)

## Mandatory Context
Read authoritative user request: `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md`
Read project architecture: `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\orchestrator_1\PROJECT.md`
Read survey analysis: `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\explorer_survey_2\analysis.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Exclusive Write Ownership
You exclusively own and may edit:
- `frontend/nitnem/my-pothi.html`

DO NOT edit any files in `frontend/lib/`, `frontend/NitnemTracker/`, or `tests/`.

## Detailed Requirements

### 1. Interactive Day Drawer / Modal (`#pothiDayDrawer`)
- In `frontend/nitnem/my-pothi.html`:
  - Implement an iOS-style bottom sheet / drawer (`#pothiDayDrawer`) with backdrop overlay (`#pothiDrawerBackdrop`).
  - Drawer shows:
    - Formatted target date (e.g., "Monday, 6 Oct 2026").
    - Daily completion percentage badge.
    - Interactive prayer list with checkboxes/toggles for each bani configured in the user's Pothi (`anhad_my_pothi`).
    - Quick actions: "Mark All Read" / "Clear All" / "Close".
  - Theme styling: Use `--bg-secondary`, `--card-bg`, `--text-primary`, `--sacred-gold`, `--ios-green` from `frontend/css/theme-variables.css`. Parity across light and dark themes.

### 2. Consistency Grid Click Handling
- Upgrade cell click handlers in `renderMonthlyView()`:
  - Add `onclick="openPothiDayDrawer('${dateStr}')"` (or event listener) to each `.grid-cell`.
- Upgrade row click handlers in `renderWeeklyView()`:
  - Make weekly bar rows clickable: `onclick="openPothiDayDrawer('${dateStr}')"`.
- Upgrade yearly view:
  - Provide interactive date selection or link to missed dates.

### 3. Historical Date Completion & Real-Time Sync
- When a user toggles a bani for a historical date:
  - Update `anhad_my_pothi_completed[dateStr]`.
  - Update `syncCompletionToNitnemTracker(baniId, isComplete, targetDateStr)`:
    - Update `nitnemTracker_nitnemLog[dateStr]`.
  - Update `AuthoritativeStreakEngine` if available on `window` to record Nitnem completion for that date.
  - Dynamically recalculate `getHistoricalPct(dateStr, data)`.
  - Immediately repaint grid cells (`lvl-0` through `lvl-full`) without requiring full page reload.
  - Recalculate and update consistency stats and streak display.

## Verification
- Test interactive drawer, date click, completion toggle, and theme rendering.
- Document all changes and tests in `handoff.md`.


## 2026-10-12T02:46:13Z
You are Worker 2 (My Pothi Missed-Day Completion Specialist).

Working directory: c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\worker_mypothi
Read your instructions in: c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\worker_mypothi\DISPATCH.md
Read authoritative user request: c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\ORIGINAL_REQUEST.md
Read project architecture: c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\orchestrator_1\PROJECT.md
Project root: c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write file:
- frontend/nitnem/my-pothi.html

Implement R4 per specifications (iOS-style day drawer, consistency grid cell & row click handlers, missed-day prayer completion, real-time sync and repaint, light & dark theme styling).
Write your handoff report to c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\worker_mypothi\handoff.md, and send a completion message back.
