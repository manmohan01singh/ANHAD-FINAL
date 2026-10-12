# ANHAD Source-to-Target Traceability Matrix
**Document:** `ANHAD_MIGRATION/16_SOURCE_TO_TARGET_TRACEABILITY.md`  
**Version:** 1.0.0  

---

## 1. Traceability Principle

Every meaningful feature, asset, algorithm, and screen in the source application must trace directly to:
`Original Source File -> Specific Feature -> Target RN Module -> Test Suite -> Acceptance Criteria`

No feature may be silently omitted or simplified without documented justification.

---

## 2. Traceability Chains Table

| Original Source | Feature Name | Target React Native Module | Test Suite Specification | Acceptance Criteria |
|---|---|---|---|---|
| `lib/anhad-audio-singleton.js` (L101-115) | Darbar Sahib Live Stream | `src/services/audio/AudioService.ts`<br>`src/screens/radio/RadioScreen.tsx` | `tests/unit/audioService.test.ts`<br>`tests/integration/playback.test.ts` | 1. Tapping Play connects to SGPC feed within 2s.<br>2. Network disconnect triggers backoff retry.<br>3. Reconnecting resumes playback automatically without user tap.<br>4. Background audio plays uninterrupted when app is minimized. |
| `lib/anhad-audio-singleton.js` (L116-134, L450-490) | Amritvela Virtual Live Broadcast | `src/services/audio/VirtualLiveEngine.ts`<br>`src/services/audio/AudioService.ts` | `tests/unit/virtualLive.test.ts`<br>(ported from `tests/audio/virtual-live-timeline-algebra.test.js`) | 1. Given any timestamp $T$, the calculated track index and offset match the canonical formula with 0s drift.<br>2. Track advances gaplessly when current track completes.<br>3. Two devices running simultaneously play the exact same second worldwide. |
| `lib/anhad-audio-singleton.js` (L135-188) | Waheguru Simran Virtual Broadcast | `src/services/audio/VirtualLiveEngine.ts`<br>`src/services/audio/AudioService.ts` | `tests/unit/virtualLive.test.ts` | 1. Correct track calculated out of 38 MP3 files on R2.<br>2. Advances deterministically across cycles. |
| `lib/overlay-player.js` | Persistent Mini-Player | `src/components/audio/GlobalMiniPlayer.tsx`<br>`src/navigation/TabBarContainer.tsx` | `tests/unit/miniPlayer.test.ts` | 1. Floats above bottom tab bar on all tab screens.<br>2. Displays active stream artwork, title, play/pause.<br>3. Never degrades into an image strip.<br>4. Tap opens full `RadioScreen`. |
| `nitnem/js/reader-engine.js` (L1-1801) | Sacred Bani Reader | `src/screens/reader/BaniReaderScreen.tsx`<br>`src/features/reader/readerEngine.ts` | `tests/unit/readerEngine.test.ts`<br>`tests/unit/larivaar.test.ts` | 1. Renders Gurmukhi text with accurate font ligatures.<br>2. Toggling Larivaar joins words without losing formatting.<br>3. Translation font resize does not cause layout jitter.<br>4. Auto-scroll scrolls smoothly at configurable speed. |
| `data/banis-chunks/*.json` | Offline Gurbani Database | `src/database/db.ts`<br>`src/database/baniQueries.ts` | `tests/unit/baniDatabase.test.ts` | 1. All 100+ Banis queryable offline.<br>2. Query for Japji Sahib returns in < 15ms.<br>3. App startup time is not impacted by dataset size. |
| `NitnemTracker/nitnem-tracker.js` | Nitnem Daily Tracker & Streaks | `src/store/streakStore.ts`<br>`src/screens/tracker/NitnemTrackerScreen.tsx` | `tests/unit/streak.test.ts`<br>(ported from `tests/nitnem/daily-reset-manager.test.js`) | 1. Checklist checks/unchecks reliably.<br>2. Streak increments on completion of daily required Banis.<br>3. Midnight reset archives previous day and resets checklist without losing streak if completed. |
| `Hukamnama/daily-hukamnama.js` | Daily Hukamnama Sahib | `src/screens/hukamnama/HukamnamaScreen.tsx`<br>`src/api/banidb.ts` | `tests/unit/hukamnama.test.ts` | 1. Fetches today's Hukamnama from BaniDB.<br>2. Correct author Guru portrait loaded automatically.<br>3. Gurmukhi, English, and Punjabi translations toggle cleanly. |
| `js/hukamnama-card-generator.js` | Hukamnama Social Story Card | `src/components/hukamnama/HukamnamaCardModal.tsx` | `tests/unit/cardGenerator.test.ts` | 1. Generates 9:16 and 1:1 image cards.<br>2. Text wraps gracefully.<br>3. Native Share sheet opens with generated PNG file. |
| `GurbaniKhoj/gurbani-khoj.js` | Gurbani Khoj (Search) | `src/screens/search/GurbaniKhojScreen.tsx`<br>`src/api/banidb.ts` | `tests/unit/gurbaniKhoj.test.ts` | 1. First-letter search returns matching shabads within 500ms.<br>2. Gurmukhi keyboard modal allows full Punjabi typing.<br>3. Tapping result opens `ShabadReaderScreen`. |
| `SehajPaath/sehaj-paath.js` | Continuous Sehaj Paath | `src/screens/sehajpaath/SehajPaathScreen.tsx`<br>`src/screens/sehajpaath/SehajPaathReaderScreen.tsx` | `tests/unit/sehajPaath.test.ts` | 1. Tracks Ang 1 to 1430.<br>2. Calculates completion estimate based on daily pace.<br>3. Bookmarks persist across sessions in MMKV. |
| `NaamAbhyas/naam-abhyas.js` | Waheguru Simran Mala Counter | `src/screens/naamabhyas/NaamAbhyasScreen.tsx`<br>`src/store/naamAbhyasStore.ts` | `tests/unit/naamAbhyas.test.ts` | 1. Tapping counter triggers subtle haptic pattern.<br>2. Breathing ring expands and contracts in rhythm.<br>3. Ambient soundscapes loop seamlessly. |
| `sadhsangat-live/index.html` | Sadhsangat Live Hub | `src/screens/sadhsangat/SadhsangatScreen.tsx`<br>`src/api/anhadBackend.ts` | `tests/unit/sadhsangat.test.ts` | 1. Shows live status of Gurdwaras from backend.<br>2. Embeds YouTube player cleanly with native controls.<br>3. Player halts when navigating away. |
| `Calendar/GurpurabCalendar-ios.html` | Gurpurab Calendar | `src/screens/calendar/CalendarScreen.tsx`<br>`src/config/calendarEvents.ts` | `tests/unit/calendar.test.ts` | 1. Displays Nanakshahi dates and upcoming Gurpurabs.<br>2. Countdown timer updates in real time.<br>3. Push notification reminder schedules in device calendar / alarm. |
| `reminders/smart-reminders.js` | Amritvela Alarms | `src/services/alarms/AlarmService.ts`<br>`src/screens/reminders/RemindersScreen.tsx` | `tests/unit/alarmService.test.ts` | 1. Schedules exact Android alarm via Notifee.<br>2. Alarm rings at set time even if phone is in deep sleep.<br>3. Full-screen intent wake-up screen displays snooze/dismiss. |
| `lib/global-theme.js` | Diurnal Theme System | `src/store/themeStore.ts`<br>`src/hooks/useTheme.ts` | `tests/unit/theme.test.ts` | 1. In Auto mode, switches to Morning at 5 AM, Day at 9 AM, Evening at 4 PM, Night at 8 PM.<br>2. Manual theme override persists across restarts.<br>3. Zero flash of incorrect theme on launch. |
