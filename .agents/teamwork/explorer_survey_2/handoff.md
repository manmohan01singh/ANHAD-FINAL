# 5-Component Handoff Report: Survey Explorer 2

**Author**: Survey Explorer 2  
**Date**: 2026-10-12  
**Handoff Type**: Hard (Investigation & Survey Complete)  
**Target File**: `c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL\.agents\teamwork\explorer_survey_2\handoff.md`

---

## 1. Observation

1. **My Pothi Consistency Grid & Insights**:
   - Location: `frontend/nitnem/my-pothi.html` lines 1530–1788.
   - Container `#pothiInsightsCard` toggles between three views (`week`, `month`, `year`) based on `localStorage.getItem('pothi_insights_tab')`.
   - Monthly grid renders last 35 days in a `repeat(7, 1fr)` grid:
     - Line 1675: `<div class="grid-cell ${intensityClass} ${newBaniClass}" title="${tooltipText}" onclick="showInsightsTooltip('${tooltipText}', this)"></div>`
     - Lines 1651–1655: Intensity classes `lvl-0` (0%), `lvl-1` (1-33%), `lvl-2` (34-66%), `lvl-3` (67-99%), and `lvl-full` (100%).
     - Line 1697–1704: Cell click only updates text in `#insightsTooltip` (`tooltip.textContent = text`). There is currently **no drawer or modal** invoked upon cell click.
   - Weekly view (lines 1600–1625): Renders 7 rows of `.weekly-bar-row` displaying day name, bar track/fill, and percentage. Rows currently have **no click handlers**.
   - Yearly view (lines 1706–1754): Displays 4 static stat cards (Active Days, 100% Completed Days, Total Banis Read, Current Streak). Cards currently have **no click handlers**.

2. **My Pothi Data Storage & Sync**:
   - Primary stores:
     - `anhad_my_pothi` (array of bani IDs, e.g. `[2, 4, 6, 9, 10, 21, 23]`).
     - `anhad_my_pothi_completed` (map of `{ [dateStr: string]: number[] }` where dateStr is `YYYY-MM-DD`).
     - `anhad_pothi_snapshots` (map of `{ [dateStr: string]: { totalBanis: number, updatedAt: number } }`).
     - Line 1580–1598: `getHistoricalPct(dateStr, data)` computes percentage using `anhad_pothi_snapshots[dateStr].totalBanis` if present, falling back to `pothiOrder.length`.
   - Line 1009–1034: `syncCompletionToNitnemTracker(baniId, isComplete)` writes to `nitnemTracker_nitnemLog` using `today = new Date().toLocaleDateString('en-CA')`. It does not currently accept an arbitrary historical `targetDateStr`.

3. **Sri Guru Granth Sahib Data Sources in ANHAD**:
   - `frontend/lib/gurbani-db.js` (`GurbaniDB`):
     - IndexedDB database `AnhadGurbaniDB` (Version 4) with stores `angs`, `banis`, `shabads`, `search_index`, `hukamnama`, `meta`.
     - Lines 203–227: `getAng(angNumber)` fetches from local IndexedDB store `angs` first (<20ms); on miss, fetches from `https://api.banidb.com/v2/angs/{angNumber}`.
     - Lines 243–260: Returns standardized line items containing `ang`, `gurmukhi` (Unicode), `larivaar`, `translation` (`en`, `pu`, `hi`), `writer`, and `raag`.
   - `frontend/SehajPaath/services/banidb-api.js` (`BaniDBAPI`):
     - Lines 58–95: CORS-enabled fetch client with 3 retry attempts and Capacitor HTTP native bridge.
   - `frontend/RandomShabad/random-shabad.js`:
     - Lines 176–185: Fetches from `https://api.banidb.com/v2/random/shabad` and renders `verses[i].verse.unicode` and `translation.en`.
   - Bundled Local Files:
     - `frontend/data/banis-chunks/nitnem-banis.json` (9MB): Pre-bundled verses in Unicode Gurmukhi with translation and source page numbers.
     - `frontend/nitnem/data/bani-catalog.json`: Master catalog of Banis across categories.

4. **UI Styling & Theme Integration Patterns**:
   - Dual theme architecture: `[data-theme="light"]` and `[data-theme="dark"]` attribute selectors on `<html>`.
   - System CSS variables in `frontend/css/theme-variables.css`:
     - Light mode: `--bg-primary: #FAF8F5`, `--bg-secondary: #F2F2F7`, `--text-primary: #1C1C1E`, `--text-secondary: #8E8E93`.
     - Dark mode: `--bg-primary: #1C1C1E` / `#0D0D0F`, `--bg-secondary: #2C2C2E`, `--text-primary: #F5F5F7`, `--text-secondary: #8E8E93`.
     - Accents: `--sacred-gold: #D4AF37`, `--sacred-saffron: #FF8C00`, `--ios-green: #34C759`, `--ios-red: #FF3B30`.
   - Drawer pattern in `frontend/nitnem/css/reader.css` (lines 1169–1187):
     - `.settings-drawer`: `position: fixed; bottom: 0; left: 0; right: 0; max-height: 90vh; background: var(--bg-secondary); border-radius: 12px 12px 0 0; z-index: 201; transform: translateY(100%); transition: transform 0.4s var(--ios-spring);`.
     - Handle: `width: 36px; height: 5px; border-radius: 3px; background: var(--fill-primary); margin: 8px auto;`.

5. **Test Suite Baseline**:
   - Command: `npm test` runs Vitest with `vitest.config.js`.
   - Test execution completed with:
     `Test Files: 1 failed | 29 passed (30)`
     `Tests: 2 failed | 280 passed (282)`
   - The 2 pre-existing failures are in `tests/features/sangat-cross-account-flow.test.js` (unrelated Sangat friend request self-exclusion test), establishing that all other 280 test cases are healthy and passing.

---

## 2. Logic Chain

1. **R4 (My Pothi Missed-Day Completion)**:
   - *Observation 1* shows that `frontend/nitnem/my-pothi.html` already renders 35-day grid cells and 7-day weekly bars, but cell clicks only trigger `showInsightsTooltip` with static text.
   - *Observation 2* shows that `anhad_my_pothi_completed` is stored as `{ [dateStr]: [baniId, ...] }`, but `syncCompletionToNitnemTracker` is hardcoded to today's date.
   - *Therefore*, integrating an interactive day drawer requires:
     1. Binding click events on cells (`onclick="openPothiDayDrawer('${dateStr}')"`).
     2. Rendering a slide-up iOS sheet showing that specific historical date's banis with completion checkmarks.
     3. Updating `anhad_my_pothi_completed[dateStr]` upon toggling and passing `dateStr` through `syncCompletionToNitnemTracker(baniId, isComplete, dateStr)`.
     4. Calling `renderInsights()` immediately to recalculate `getHistoricalPct` and repaint grid cell CSS classes (`lvl-0` → `lvl-full`).

2. **R2 & R3 (5-Day Recovery Challenge & SGGS Data)**:
   - *Observation 3* proves that ANHAD already has API clients (`GurbaniDB`, `BaniDBAPI`) to fetch Angs from `https://api.banidb.com/v2/angs/{ang}` and local cached JSONs.
   - However, in automated test environments (`npm test` in Vitest, *Observation 5*) and offline device sessions, external network requests will fail or produce latency.
   - *Therefore*, the 5-day recovery challenge must incorporate 5 curated authentic Amritvela Gurbani passages with exact Ang citations (Ang 2, 305, 449, 1383, 815) and authentic Unicode Gurmukhi text bundled into the recovery engine, while allowing dynamic `GurbaniDB.getAng()` augmentation.

3. **Theme & UI Styling Compliance**:
   - *Observation 4* demonstrates that all modern UI elements in ANHAD use CSS custom properties (`--bg-secondary`, `--text-primary`, `--sacred-gold`, `--ios-green`) and iOS spring bezier transitions.
   - *Therefore*, both the My Pothi day drawer and the 5-day recovery challenge UI components must use these exact CSS variables and transition tokens to achieve seamless light/dark mode parity without regressions.

---

## 3. Caveats

1. The 2 failing tests in `tests/features/sangat-cross-account-flow.test.js` predate this survey and belong to an unrelated multi-user social module; they should not be conflated with the streak or Nitnem tracker test suites.
2. In `my-pothi.html`, the Yearly view currently only renders 4 stat cards. Adding date clicks to the yearly view will either require a mini-month calendar picker or linking the cards to missed dates.
3. Network calls to `api.banidb.com` require active internet; offline fallback to bundled Gurbani verses is mandatory for resilience.

---

## 4. Conclusion

- **My Pothi Missed-Day Completion (R4)** is fully achievable by introducing a lightweight iOS-style bottom drawer (`#pothiDayDrawer`) in `frontend/nitnem/my-pothi.html`, attaching date click handlers to weekly rows and monthly grid cells, parameterizing `syncCompletionToNitnemTracker` with `targetDate`, and dynamically refreshing `renderInsights()`.
- **Sri Guru Granth Sahib Data (R2)** is thoroughly addressed by bundling 5 verified Amritvela passages (Ang 2, 305, 449, 1383, 815) in the recovery engine with fallback to `GurbaniDB.getAng()`.
- **UI Styling & Theming** must utilize `[data-theme="light"]` / `[data-theme="dark"]` tokens (`--bg-secondary`, `--sacred-gold`, `--ios-green`, `--card-bg`) to ensure 100% aesthetic and functional compliance.

---

## 5. Verification Method

1. **File Inspection**:
   - Inspect `frontend/nitnem/my-pothi.html` lines 1530–1788 to verify `renderInsights()`, `renderWeeklyView()`, and `renderMonthlyView()`.
   - Inspect `frontend/lib/gurbani-db.js` lines 200–260 to verify `getAng()` format.
   - Inspect `frontend/css/theme-variables.css` lines 20–180 to verify theme token definitions.
2. **Automated Test Run**:
   - Run `npm test` using PowerShell.
   - Verify that 280 tests pass across all test suites, and that no new regressions are introduced.
3. **Invalidation Conditions**:
   - If `anhad_my_pothi_completed` keys do not follow `YYYY-MM-DD` string format.
   - If toggling a bani on a historical date fails to update `getHistoricalPct` or fails to repaint the corresponding `.grid-cell` intensity class.
