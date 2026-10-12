# ANHAD Screen Catalog & Route Specifications
**Document:** `ANHAD_MIGRATION/06_SCREEN_CATALOG.md`  
**Version:** 1.0.0  
**Total Screens Audited:** 87 HTML pages consolidated into 24 Native Mobile Screens  

---

## 1. Master Screen Catalog Table

| Screen ID | Original HTML Route | Target React Native Screen | Navigation Stack | User Journey / Primary Purpose |
|---|---|---|---|---|
| **SCR-01** | `index.html` | `HomeScreen` | `HomeStack` (Tab 1) | Flagship entry: hero banner, live audio cards, streak ring, daily hukamnama card, quick launch grid |
| **SCR-02** | `Hukamnama/daily-hukamnama.html` | `HukamnamaScreen` | `HomeStack` / Modal | Daily Hukamnama Sahib from Golden Temple: Gurmukhi, English, Punjabi, author Guru portrait, audio |
| **SCR-03** | `Hukamnama/` (Card Generator modal) | `HukamnamaCardModal` | Root Modal | Generates high-res Instagram Story / WhatsApp status cards for today's Hukamnama with custom themes |
| **SCR-04** | `GurbaniRadio/gurbani-radio.html` | `RadioScreen` | `HomeStack` / Root Modal | Full-screen Gurbani Radio player: 3 fixed core streams (Darbar, Amritvela, Simran), stream switcher |
| **SCR-05** | `GurbaniRadio/stream-library.js` (Sheet) | `StreamLibrarySheet` | Bottom Sheet | Browse & select from 8 curated live streams (Darbar Sahib, Amritvela, Simran, and 5 SikhNet channels: Bangla Sahib, Sis Ganj, Hazur Sahib, Dukh Nivaran, Classical Raag Kirtan) |
| **SCR-06** | `nitnem/index.html`, `index-v2.html` | `NitnemHubScreen` | `HomeStack` | Sacred Bani Library: Nitnem Banis, SGGS Banis, Dasam Granth Banis, Sarbloh Banis, My Pothi creator |
| **SCR-07** | `nitnem/reader.html`, specific Banis | `BaniReaderScreen` | Fullscreen Stack | Universal sacred prayer reader: Larivaar mode, font size, Vishrams, translations, auto-scroll |
| **SCR-08** | `nitnem/my-pothi.html` | `MyPothiScreen` | `HomeStack` | User-curated custom prayer books (Pothis) with custom reordering and offline caching |
| **SCR-09** | `NitnemTracker/nitnem-tracker.html` | `NitnemTrackerScreen` | `HomeStack` | Morning, evening, and night Bani completion checklist, streak tracker, Maryada calendar |
| **SCR-10** | `GurbaniKhoj/gurbani-khoj.html` | `GurbaniKhojScreen` | `HomeStack` | Search Gurbani by first letter, full word, raag, author; custom Gurmukhi keyboard; voice search |
| **SCR-11** | `GurbaniKhoj/shabad-reader.html` | `ShabadReaderScreen` | Fullscreen Stack | View individual Shabad with full context in SGGS, translations, audio recitation, bookmarking |
| **SCR-12** | `SehajPaath/sehaj-paath.html` | `SehajPaathScreen` | `HomeStack` | Continuous reading tracker for 1430 Angs: progress percentage, daily reading targets, pace estimator, and 18 reading achievements |
| **SCR-13** | `SehajPaath/reader.html` | `SehajPaathReaderScreen`| Fullscreen Stack | Full Ang-by-Ang reader with Larivaar toggle, bookmarks, notes, and auto-bookmarking on scroll |
| **SCR-14** | `NaamAbhyas/naam-abhyas.html` | `NaamAbhyasScreen` | `HomeStack` | Waheguru Simran: Mala bead counter, breathing guide ring, ambient soundscapes, haptic feedback, Hourly Practice Engine (5 AM–10 PM), and 11 practice badges (29 total app achievements) |
| **SCR-15** | `sadhsangat-live/index.html` | `SadhsangatScreen` | `SadhsangatStack` (Tab 3)| YouTube live broadcasts from Gurdwaras worldwide, video search, live status, community presence |
| **SCR-16** | `Calendar/GurpurabCalendar-ios.html` | `CalendarScreen` | `HomeStack` | Nanakshahi calendar: Gurpurabs, historical Sikh milestones, countdown timer, notifications |
| **SCR-17** | `Favorites/favorites.html` | `FavoritesScreen` | `FavoritesStack` (Tab 4) | Spiritual Treasury: saved Shabads, favorite Banis, bookmarked Angs, liked audio recordings |
| **SCR-18** | `Notes/notes.html` | `NotesScreen` | `HomeStack` | Personal spiritual journal: reflections on Gurbani verses, searchable tags, sync |
| **SCR-19** | `Insights/insights.html` | `InsightsScreen` | `InsightsStack` (Tab 2) | Khalsa Library: listening hours stats, Guru Sahibaan biographies, Raag details, historical sakhis |
| **SCR-20** | `Companion/companion.html` | `CompanionModeScreen` | Fullscreen Modal | Ambient clock & devotional display for nightstand or desk charging stand |
| **SCR-21** | `reminders/smart-reminders.html` | `RemindersScreen` | `HomeStack` / Settings | Amritvela wake-up alarms, Nitnem prayer reminders, custom audio alarm choices |
| **SCR-22** | `Settings/index.html`, `appearance.html` | `SettingsScreen` | `HomeStack` | Appearance theme toggle (Auto, Light, Dark, Divine Gold), notifications, font sizes, data backup |
| **SCR-23** | `auth/index.html`, `onboarding.html` | `AuthModal` / `ProfileScreen` | Modal / Stack | Firebase user authentication, Google Sign-In, anonymous guest profile, cloud sync |
| **SCR-24** | `Admin/broadcast.html`, `live-dashboard`| `AdminConsoleScreen` | Secret / Hidden Stack | Administrative push broadcast console, live listener monitor, campaign manager (token-protected) |

---

## 2. Reusable Component Overlays & Global Controls

- **`GlobalMiniPlayer`:** Persistent playback control floating above bottom navigation on all tab screens.
- **`AudioSleepTimerModal`:** Sleep timer modal with 15m, 30m, 45m, 1h, End of Track presets.
- **`GurmukhiKeyboardOverlay`:** Built-in mobile Gurmukhi keyboard for devices without native Punjabi keyboards installed.
- **`ComingSoonModal`:** Replaces obsolete or retiring web features (such as removed Gurbani GPT).
