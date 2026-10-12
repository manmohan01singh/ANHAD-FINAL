# Comprehensive Analysis: My Pothi, Consistency Grids, Day Drawer, Gurbani Data Sources & Theming

**Explorer**: Survey Explorer 2  
**Date**: 2026-10-12  
**Target Scope**: R2 (Recovery Challenge Gurbani data), R4 (My Pothi missed-day completion), Consistency Grids, Day Drawer/Modal, Theming & Styling patterns

---

## 1. Executive Summary

This investigation provides the architectural foundation for:
1. **Interactive Missed-Day Nitnem Completion in My Pothi (R4)**: Transforming the static 35-day consistency grid and weekly progress bars into an interactive interface with an iOS-style day drawer/modal that lets users complete pending or missed prayers for any historical date, dynamically updating records, grid cell visuals, and consistency statistics.
2. **5-Day Recovery Challenge Gurbani Sources (R2)**: Pinpointing existing data engines (`GurbaniDB`, `BaniDBAPI`, bundled JSON chunks) and establishing 5 authentic Sri Guru Granth Sahib Amritvela passages with verified Gurmukhi Unicode text and Ang citations for offline-first, test-stable execution.
3. **UI Styling & Theme Integration Patterns**: Establishing strict compliance with ANHAD's dual light/dark mode CSS tokens (`--bg-primary`, `--bg-secondary`, `--card-bg`, `--sacred-gold`, `--ios-green`), iOS spring transitions, and zero-FOUC theme switching.

---

## 2. My Pothi & Consistency Grid Components

### 2.1 File Location & Structure
- **Primary View**: `frontend/nitnem/my-pothi.html` (1,988 lines)
- **Container**: `#pothiInsightsCard` (`lines 1530–1578`)
- **Tab State**: `localStorage.getItem('pothi_insights_tab')` (`'week'`, `'month'`, or `'year'`; defaults to `'month'`)

### 2.2 Views Breakdown

| View | Function | Time Window | Rendering Logic | Current Click Handling |
|---|---|---|---|---|
| **Weekly** (ਹਫ਼ਤਾ) | `renderWeeklyView(el, data)` | Past 7 days (today to 6 days ago) | Progress track & fill bar (`width: ${pct}%`, green if 100%, gold if <100%) | **None**. Rows are static `div.weekly-bar-row` elements. |
| **Monthly** (ਮਹੀਨਾ) | `renderMonthlyView(el, data)` | Past 35 days (5 weeks × 7 days) | CSS Grid `repeat(7, 1fr)` with intensity levels (`lvl-0` to `lvl-full`) + glowing `new-bani` animation | **Tooltip only**. `onclick="showInsightsTooltip('${tooltipText}', this)"` updates a text line below the legend. |
| **Yearly** (ਸਾਲ) | `renderYearlyView(el, data)` | Current Calendar Year | 4 stat cards in `.yearly-stats-grid`: Active Days, 100% Completed Days, Total Banis Read, Current Streak | **None**. Stat cards are static summary numbers. |

### 2.3 Data Storage & Completion Percentage Calculation

#### Underlying Storage Keys
1. `anhad_my_pothi`: JSON array of integer bani IDs representing the user's active Pothi order (e.g., `[2, 4, 6, 9, 10, 21, 23]`).
2. `anhad_my_pothi_completed`: JSON map of `{ [dateStr: string]: number[] }` where `dateStr` is `YYYY-MM-DD` (via `toLocaleDateString('en-CA')`). Each array contains completed bani IDs for that day.
3. `anhad_pothi_snapshots`: JSON map of `{ [dateStr: string]: { totalBanis: number, updatedAt: number } }`. Freezes the denominator of historical days so adding banis today does not retroactively penalize past completion percentages.
4. `anhad_pothi_bani_additions`: JSON map of `{ [dateStr: string]: Array<{ id: number, timestamp: number }> }`.
5. `nitnemTracker_nitnemLog`: Nitnem Tracker's log `{ [dateStr]: { amritvela: [uid...], rehras: [uid...], sohila: [uid...] } }`.

#### Percentage Calculation (`getHistoricalPct(dateStr, data)`)
```javascript
function getHistoricalPct(dateStr, data) {
    const completedIds = data[dateStr] || [];
    if (completedIds.length === 0) return 0;
    
    // 1. Snapshot check (historical denominator lock)
    try {
        const snapshots = JSON.parse(localStorage.getItem('anhad_pothi_snapshots') || '{}');
        if (snapshots[dateStr] && snapshots[dateStr].totalBanis > 0) {
            return Math.min(100, Math.round((completedIds.length / snapshots[dateStr].totalBanis) * 100));
        }
    } catch(e) {}

    // 2. Fallback: match completed against current pothiOrder
    const totalForDay = pothiOrder.length || 1;
    const matchingCompleted = completedIds.filter(id => pothiOrder.includes(id));
    return Math.min(100, Math.round((matchingCompleted.length / totalForDay) * 100));
}
```

#### Heatmap Intensity Classes
- `pct === 100` → `.lvl-full` (Golden gradient `#FFD54F`/`#FFC107`, dark `#FFB300`/`#FFA000`, with golden glow box-shadow)
- `pct > 66` → `.lvl-3` (Rich green gradient `#4CAF50`/`#43A047`)
- `pct > 33` → `.lvl-2` (Medium green gradient `#81C784`/`#66BB6A`)
- `pct > 0` → `.lvl-1` (Soft pastel green `#D4F1D4`/`#C8E6C9`, dark `#2D5A2D`/`#3D6A3D`)
- `pct === 0` → `.lvl-0` (Subtle muted glass `rgba(0,0,0,0.04)`, dark `rgba(255,255,255,0.05)`)

---

## 3. Interactive Day Drawer / Modal Integration (R4)

### 3.1 Deficiencies in Current Implementation
1. In `my-pothi.html`:
   - Cell clicks only show a brief tooltip text string: `"Tap a square to see details"`.
   - There is NO interface allowing users to view which specific banis were completed vs. missed on a selected past date.
   - There is NO way to mark a missed Nitnem prayer as completed on that historical date from My Pothi.
   - Pending banis section (`renderPendingBanis()`) only considers yesterday (`yesterday.setDate(today.getDate() - 1)`), completely missing any days prior to yesterday.
2. In `nitnem-tracker.js`:
   - The calendar view (`renderMonthlyCalendar()`) renders cells with status classes (`complete`, `partial`, `empty`), but has no click handlers attached to `calendarDays`.
   - `dayDetailOverlay` (lines 11283–11309) only displays a read-only checklist of past banis with no toggle capability.

### 3.2 Day Drawer / Modal Design & Specification

To satisfy R4, we design an iOS 26+ bottom sheet drawer in `my-pothi.html`:

#### Visual & DOM Structure
```html
<!-- Backdrop Overlay -->
<div class="day-drawer-backdrop" id="pothiDayDrawerBackdrop" onclick="closePothiDayDrawer()"></div>

<!-- Slide-up Bottom Sheet -->
<div class="day-drawer" id="pothiDayDrawer">
    <div class="drawer-handle"></div>
    <div class="drawer-header">
        <div class="drawer-date-info">
            <h3 class="drawer-date-title" id="pothiDrawerDateTitle">ਐਤਵਾਰ, 11 ਅਕਤੂਬਰ 2026</h3>
            <span class="drawer-date-subtitle" id="pothiDrawerDateSubtitle">Sunday, Oct 11, 2026</span>
        </div>
        <div class="drawer-header-actions">
            <span class="drawer-pct-badge" id="pothiDrawerPctBadge">60% Completed</span>
            <button class="drawer-close-btn" onclick="closePothiDayDrawer()">✕</button>
        </div>
    </div>
    
    <!-- Prayer Checklist for Selected Historical Date -->
    <div class="drawer-body" id="pothiDrawerBody">
        <!-- Rendered list of banis from pothiOrder -->
    </div>
</div>
```

#### Drawer Bani Row Item Layout
Each bani item in the drawer presents:
- **Icon / Guru Image**: `bani.guruImage` with 10px rounded border
- **Gurmukhi & English Name**: `bani.name` + `bani.english`
- **Period Tag**: Amritvela / Rehras / Sohila badge
- **Interactive Checkbox / Toggle**:
  - If completed on that date: shows green check `✓ Complete`
  - If missed/pending: shows gold/amber button `Mark Complete`
- **Reader Quick Link**: Direct reader link `reader.html?id=${bani.id}&date=${dateStr}&from=pothi`

#### State Flow & Bidirectional Synchronization
When a user toggles a bani for `targetDate`:
1. **Update My Pothi Log**:
   ```javascript
   const completed = loadCompletedBanis();
   if (!completed[targetDate]) completed[targetDate] = [];
   const idx = completed[targetDate].indexOf(baniId);
   if (idx > -1) {
       completed[targetDate].splice(idx, 1);
   } else {
       completed[targetDate].push(baniId);
   }
   saveCompletedBanis(completed);
   ```
2. **Update/Lock Snapshot**: Ensure `anhad_pothi_snapshots[targetDate]` has a recorded `totalBanis` (matching `pothiOrder.length` or existing snapshot).
3. **Synchronize to Nitnem Tracker**:
   Update `nitnemTracker_nitnemLog[targetDate][period]` with the matching UID.
   ```javascript
   function syncHistoricalCompletionToTracker(baniId, isComplete, targetDate) { ... }
   ```
4. **Trigger Unified Events**:
   - `window.dispatchEvent(new StorageEvent('storage', { key: 'anhad_my_pothi_completed', ... }))`
   - `window.dispatchEvent(new CustomEvent('nitnemCompletionUpdated', { detail: { targetDate, baniId, isComplete } }))`
5. **Re-render UI**:
   - Update drawer percentage badge and button state.
   - Re-run `renderInsights()` to immediately repaint weekly tracks, monthly grid cell colors (`lvl-0` → `lvl-full`), and yearly metrics.
   - Trigger `StreakManager.recalculateStreak()` or unified streak engine recalculation.

---

## 4. Sri Guru Granth Sahib Data Sources (R2)

### 4.1 Existing Data Architecture in ANHAD

ANHAD has a multi-tiered Gurbani data stack:

1. **`frontend/lib/gurbani-db.js` (`GurbaniDB`)**:
   - Singleton class attached to `window.GurbaniDB` and `module.exports`.
   - IndexedDB database: `AnhadGurbaniDB` (Version 4).
   - Stores: `angs` (1–1430), `banis`, `shabads`, `search_index`, `hukamnama`, `meta`.
   - API endpoint: `https://api.banidb.com/v2`.
   - Method `getAng(angNumber)`: Reads local IndexedDB store first (<20ms); falls back to `fetch('https://api.banidb.com/v2/angs/' + angNumber)`.
   - Response structure:
     ```json
     {
       "ang": 2,
       "source": "G",
       "lines": [
         {
           "id": 123,
           "shabadId": 45,
           "ang": 2,
           "gurmukhi": "ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਸਚੁ ਨਾਉ ਵਡਿਆਈ ਵੀਚਾਰੁ ॥",
           "larivaar": "ਅੰਮ੍ਰਿਤਵੇਲਾਸਚੁਨਾਉਵਡਿਆਈਵੀਚਾਰੁ॥",
           "translation": {
             "en": "In the Amritvela, the ambrosial hours before dawn, meditate upon the true Name...",
             "pu": "ਅੰਮ੍ਰਿਤ ਵੇਲੇ ਸੱਚੇ ਨਾਮ ਦੀ ਵਡਿਆਈ ਦਾ ਵੀਚਾਰ ਕਰੋ।",
             "hi": "..."
           },
           "writer": "Guru Nanak Dev Ji",
           "raag": "Japji Sahib"
         }
       ]
     }
     ```

2. **`frontend/SehajPaath/services/banidb-api.js` (`BaniDBAPI`)**:
   - Handles network retries (3 attempts), Capacitor native HTTP bypass for mobile CORS, and background prefetching of adjacent 5 Angs.

3. **`frontend/data/banis-chunks/nitnem-banis.json` (9MB bundled file)**:
   - Contains all 15 core Nitnem banis with full verses in Unicode Gurmukhi, English, and line citations.

### 4.2 Recovery Challenge Curated Gurbani Dataset

For Requirement R2 (5-consecutive-day Amritvela recovery challenge), relying solely on live API calls causes test failures in headless Vitest environments (`npm test`) and breaks during offline app launches. 

Therefore, ANHAD should use a deterministic, verified set of 5 Sri Guru Granth Sahib Gurbani passages on Amritvela/spiritual waking, with verified Ang references and authentic Gurmukhi Unicode text, with fallback support for dynamic `GurbaniDB` queries:

```javascript
const RECOVERY_CHALLENGE_GURBANI = [
  {
    day: 1,
    ang: 2,
    source: "ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ (Sri Guru Granth Sahib Ji)",
    raag: "ਜਪੁਜੀ ਸਾਹਿਬ (Japji Sahib)",
    writer: "ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ (Guru Nanak Dev Ji)",
    gurmukhi: "ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਸਚੁ ਨਾਉ ਵਡਿਆਈ ਵੀਚਾਰੁ ॥",
    translation: "In the ambrosial hours before dawn, chant the True Name, and contemplate His glorious greatness.",
    transliteration: "Amrit velaa sach naao vadiaaee veechaar ||",
    theme: "Sacred Awakening (ਸੱਚੀ ਜਾਗ੍ਰਿਤੀ)"
  },
  {
    day: 2,
    ang: 305,
    source: "ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ (Sri Guru Granth Sahib Ji)",
    raag: "ਗਉੜੀ ਕੀ ਵਾਰ (Raag Gauri)",
    writer: "ਗੁਰੂ ਰਾਮ ਦਾਸ ਜੀ (Guru Ram Das Ji)",
    gurmukhi: "ਗੁਰ ਸਤਿਗੁਰ ਕਾ ਜੋ ਸਿਖੁ ਅਖਾਏ ਸੁ ਭਲਕੇ ਉਠਿ ਹਰਿ ਨਾਮੁ ਧਿਆਵੈ ॥ ਉਦਮੁ ਕਰੇ ਭਲਕੇ ਪਰਭਾਤੀ ਇਸਨਾਨੁ ਕਰੇ ਅੰਮ੍ਰਿਤ ਸਰਿ ਨਾਵੈ ॥",
    translation: "One who calls themselves a disciple of the True Guru shall rise in the early morning hours and meditate on the Lord's Name. Arising early at dawn, make the sacred effort to bathe in the pool of nectar.",
    transliteration: "Gur satgur kaa jo sikh akhaae su bhalke uth har naam dhiaavai || Udam kare bhalke parbhaatee isnaan kare amrit sar naavai ||",
    theme: "Devotional Effort (ਸਤਿਗੁਰ ਦਾ ਉੱਦਮ)"
  },
  {
    day: 3,
    ang: 449,
    source: "ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ (Sri Guru Granth Sahib Ji)",
    raag: "ਆਸਾ (Raag Asa)",
    writer: "ਗੁਰੂ ਰਾਮ ਦਾਸ ਜੀ (Guru Ram Das Ji)",
    gurmukhi: "ਹਰਿ ਧਿਆਵਹਿ ਸੰਤ ਪਰਸਤਿ ਮਨੁ ਮੇਰੇ ਹਰਿ ਖੋਜਤ ਢੂਢਿ ਢੁਢੇਈ ॥ ਭਲਕੇ ਉਠਿ ਹਰਿ ਨਾਮੁ ਧਿਆਵਹਿ ਰਸਨਾ ਹਰਿ ਰਸੁ ਲੇਈ ॥",
    translation: "O my mind, meditate on the Lord and meet the Saints. Seek and search for the Lord. Rise early at dawn, meditate on the Lord's Name, and taste the sublime divine nectar.",
    transliteration: "Har dhiaavahi sant parsat man mere har khojat dhoodh dhudheee || Bhalke uth har naam dhiaavahi rasnaa har ras leee ||",
    theme: "Divine Elixir (ਰਸਨਾ ਹਰਿ ਰਸੁ)"
  },
  {
    day: 4,
    ang: 1383,
    source: "ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ (Sri Guru Granth Sahib Ji)",
    raag: "ਸਲੋਕ ਭਗਤ ਫਰੀਦ ਜੀ (Salok Bhagat Farid Ji)",
    writer: "ਭਗਤ ਫਰੀਦ ਜੀ (Bhagat Farid Ji)",
    gurmukhi: "ਫਰੀਦਾ ਪਿਛਲ ਰਾਤਿ ਨ ਜਾਗਿਓਹਿ ਜੀਵਦੜੋ ਮੁਇਓਹਿ ॥ ਜੇ ਤੂ ਰਬੁ ਵਿਸਾਰਿਆ ਤ ਰਬਿ ਨ ਵਿਸਾਰਿਓਹਿ ॥",
    translation: "Fareed, if you do not awaken in the early hours of the night, you are dead while yet alive. Even if you have forgotten God, God has not forgotten you.",
    transliteration: "Fareedaa pichhal raat na jaagiohi jeevadro muiohi || Je too rab visaariaa ta rab na visaariohi ||",
    theme: "Soul Awakening (ਰੱਬੀ ਯਾਦ)"
  },
  {
    day: 5,
    ang: 815,
    source: "ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ (Sri Guru Granth Sahib Ji)",
    raag: "ਬਿਲਾਵਲੁ (Raag Bilaval)",
    writer: "ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ (Guru Arjan Dev Ji)",
    gurmukhi: "ਪ੍ਰਭਾਤੇ ਪ੍ਰਭ ਨਾਮੁ ਜਪਿ ਗੁਰ ਕੇ ਚਰਨ ਧਿਆਇ ॥ ਜਨਮ ਮਰਨ ਮਲੁ ਉਤਰੈ ਸਚੇ ਕੇ ਗੁਣ ਗਾਇ ॥",
    translation: "At dawn, chant the Name of God, and meditate on the Guru's lotus feet. The filth of cycles of life and death is washed away by singing the praises of the True One.",
    transliteration: "Prabhaate prabh naam jap gur ke charan dhiaae || Janam maran mal utrai sache ke gun gaae ||",
    theme: "Complete Restoration (ਸਦੀਵੀ ਮਿਲਾਪ)"
  }
];
```

---

## 5. UI Styling & Theme Integration Patterns

### 5.1 System Tokens & Hierarchy
ANHAD enforces a dual-mode styling architecture via `frontend/css/theme-variables.css` and `frontend/lib/global-theme.js`.

#### Theme Variables Reference

| CSS Token | Light Mode (`[data-theme="light"]`) | Dark Mode (`[data-theme="dark"]`) | Usage |
|---|---|---|---|
| `--bg-primary` | `#FAF8F5` | `#0D0D0F` / `#1C1C1E` | Full page body background |
| `--bg-secondary` | `#F2F2F7` | `#1C1C1E` / `#2C2C2E` | Drawers, modals, card backgrounds |
| `--bg-tertiary` | `#E5E5EA` | `#2C2C2E` / `#3A3A3C` | Input fields, inner chip backgrounds |
| `--text-primary` | `#1C1C1E` / `#000000` | `#FFFFFF` / `#F5F5F7` | Headings, primary titles |
| `--text-secondary`| `#8E8E93` / `rgba(0,0,0,0.5)`| `rgba(255,255,255,0.6)`| Subtitles, timestamps, metadata |
| `--separator` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` | Thin divider lines |
| `--sacred-gold` | `#D4AF37` | `#D4AF37` / `#FFD700` | Spiritual accents, badges, highlights |
| `--sacred-saffron`| `#FF8C00` | `#FF9500` | Primary action buttons, flames |
| `--ios-green` | `#34C759` | `#30D158` | Completed checkboxes, 100% badges |
| `--ios-red` | `#FF3B30` | `#FF453A` | Missed day badges, warnings |
| `--glass-bg` | `rgba(255, 255, 255, 0.8)` | `rgba(28, 28, 30, 0.7)` | Headers, navigation bars |

### 5.2 Drawer & Modal Styling Pattern
To match the rest of the application (e.g. `frontend/nitnem/css/reader.css` `.settings-drawer` and `frontend/reminders/smart-reminders-v7.css` `.drawer`):
- Backdrop overlay: `position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(8px); z-index: 200;`
- Drawer container:
  ```css
  .day-drawer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      max-height: 85vh;
      background: var(--bg-secondary);
      border-radius: 20px 20px 0 0;
      z-index: 201;
      transform: translateY(100%);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.25);
      border-top: 1px solid var(--separator);
      display: flex;
      flex-direction: column;
  }
  .day-drawer.visible {
      transform: translateY(0);
  }
  ```
- Drawer handle:
  ```css
  .drawer-handle {
      width: 36px;
      height: 5px;
      background: rgba(128, 128, 128, 0.35);
      border-radius: 3px;
      margin: 10px auto 4px;
      flex-shrink: 0;
  }
  ```

---

## 6. Synthesis: Recommended Implementation Architecture

1. **For My Pothi (R4)**:
   - Enhance `frontend/nitnem/my-pothi.html`:
     - Add `data-date="${dateStr}"` and click handler `onclick="openPothiDayDrawer('${dateStr}')"` to weekly bar rows, monthly grid cells, and yearly view.
     - Add the `#pothiDayDrawerBackdrop` and `#pothiDayDrawer` markup and CSS matching ANHAD's iOS glass style.
     - Implement `openPothiDayDrawer(dateStr)`, `closePothiDayDrawer()`, and `toggleHistoricalBani(dateStr, baniId)`.
     - Update `syncCompletionToNitnemTracker(baniId, isComplete, targetDate)` so it supports arbitrary past dates instead of hardcoding `today`.
     - Ensure dynamic UI refresh: toggling immediately recalculates `getHistoricalPct`, updates grid cell classes, and fires sync events.

2. **For Recovery Challenge (R2 & R3)**:
   - Provide an authoritative `StreakRecoveryChallengeEngine` with:
     - 5-consecutive-day Amritvela validation.
     - Curated 5 authentic Gurbani passages from Sri Guru Granth Sahib Ji (Ang 2, 305, 449, 1383, 815).
     - Deterministic gap backfilling using historical average Amritvela wake time, marking records with `origin: "restored"`, `systemGenerated: true`.
     - Cancellation/reset logic upon missing a challenge day with encouraging spiritual retry messages.

3. **For Automated Testing (R5)**:
   - Export all new/enhanced managers via `module.exports` guards in `nitnem-tracker.js` and `my-pothi.html` (or separate helper module) so Vitest tests run fast and deterministically.
