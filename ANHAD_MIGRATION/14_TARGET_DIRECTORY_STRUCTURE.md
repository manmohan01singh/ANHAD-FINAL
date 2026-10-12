# ANHAD Target Directory Structure Specification
**Document:** `ANHAD_MIGRATION/14_TARGET_DIRECTORY_STRUCTURE.md`  
**Version:** 1.0.0  

---

## 1. Destination Project Layout: `ANHADIN-REACT`

```
ANHADIN-REACT/
├── .github/                       # CI/CD workflows (lint, test, build AAB/IPA)
├── android/                       # Native Android project (managed via Prebuild)
│   └── app/src/main/
│       ├── java/com/anhad/app/widgets/  # Native Android AppWidget Providers
│       └── res/raw/               # Alarm sounds (alarm.wav, notification.wav)
├── ios/                           # Native iOS project (managed via Prebuild)
│   └── WidgetsExtension/          # Native iOS WidgetKit extensions
├── assets/                        # Static bundled assets
│   ├── fonts/                     # Gurmukhi & UI fonts (.ttf)
│   │   ├── NotoSansGurmukhi-Regular.ttf
│   │   ├── NotoSansGurmukhi-Bold.ttf
│   │   ├── RiyastiHastlikhat.ttf
│   │   ├── PGMuskan.ttf
│   │   ├── OptimusPrinceps.ttf
│   │   └── Cinzel-Regular.ttf
│   ├── images/                    # Guru Sahib portraits & hero cards (.webp)
│   │   ├── gurus/                 # 10 Guru Sahibs + SGGS portraits
│   │   └── hero/                  # Day, night, morning, evening stream cards
│   ├── audio/                     # Local soundscapes (ambient-waheguru.mp3, bells)
│   └── database/                  # Pre-built SQLite database (anhad_gurbani.db)
├── src/                           # Application source code
│   ├── api/                       # API clients & network definitions
│   │   ├── banidb.ts              # BaniDB REST API client (search, hukamnama)
│   │   ├── anhadBackend.ts        # ANHAD backend client (channels, campaigns)
│   │   └── client.ts              # Axios instance with timeouts & interceptors
│   ├── app/                       # Application bootstrap & providers
│   │   ├── App.tsx                # Root component (SafeAreaProvider, ThemeProvider)
│   │   └── index.ts               # App entry point
│   ├── components/                # Reusable UI component library
│   │   ├── common/                # Core atoms (Button, Card, Icon, Slider, Switch)
│   │   ├── audio/                 # MiniPlayer, SleepTimerModal, EqualizerBars
│   │   ├── gurbani/               # LarivaarText, VishramHighlighter, GurmukhiKeyboard
│   │   └── modals/                # ComingSoonModal, CelebrationModal
│   ├── config/                    # Static configurations & constants
│   │   ├── streams.ts             # Darbar, Amritvela, Simran, and SikhNet stream configs
│   │   ├── durations.ts           # Pre-calibrated track duration constants
│   │   └── maryada.ts             # Nitnem schedule definitions
│   ├── database/                  # Local SQLite database service
│   │   ├── db.ts                  # SQLite initialization & migrations
│   │   └── baniQueries.ts         # Fast verse & Bani retrieval queries
│   ├── features/                  # Distinct functional feature modules
│   │   ├── audio/                 # Audio player logic, stream library
│   │   ├── tracker/               # Nitnem checklist, streak calculator
│   │   ├── reader/                # Scripture reader engine, auto-scroll, settings
│   │   ├── khoj/                  # Search engine, voice recognition adapter
│   │   ├── sehajpaath/            # 1430 Ang tracker, bookmark manager
│   │   ├── naamabhyas/            # Simran mala counter, breathing guide
│   │   ├── hukamnama/             # Daily Hukamnama, card generator engine
│   │   ├── sadhsangat/            # YouTube live streams, presence tracker
│   │   └── calendar/              # Nanakshahi calendar & Gurpurabs
│   ├── hooks/                     # Custom shared React hooks
│   │   ├── useTheme.ts            # Dynamic theme hook (observes time of day)
│   │   ├── useAudioPlayer.ts      # Authoritative audio playback hook
│   │   ├── useNetInfo.ts          # Network connectivity & recovery hook
│   │   └── useHaptics.ts          # Device vibration & haptic patterns
│   ├── navigation/                # React Navigation configuration
│   │   ├── RootNavigator.tsx      # Root Stack (MainTabs + Modals)
│   │   ├── BottomTabNavigator.tsx # Bottom Tabs (Home, Insights, Sangat, Favorites)
│   │   ├── types.ts               # Type-safe navigation routes & params
│   │   └── TabBarContainer.tsx    # Bottom bar wrapper with GlobalMiniPlayer
│   ├── screens/                   # Screen components (24 distinct screens)
│   │   ├── home/HomeScreen.tsx
│   │   ├── radio/RadioScreen.tsx
│   │   ├── nitnem/NitnemHubScreen.tsx
│   │   ├── reader/BaniReaderScreen.tsx
│   │   ├── tracker/NitnemTrackerScreen.tsx
│   │   ├── hukamnama/HukamnamaScreen.tsx
│   │   ├── search/GurbaniKhojScreen.tsx
│   │   ├── sehajpaath/SehajPaathScreen.tsx
│   │   ├── sehajpaath/SehajPaathReaderScreen.tsx
│   │   ├── naamabhyas/NaamAbhyasScreen.tsx
│   │   ├── sadhsangat/SadhsangatScreen.tsx
│   │   ├── calendar/CalendarScreen.tsx
│   │   ├── favorites/FavoritesScreen.tsx
│   │   ├── notes/NotesScreen.tsx
│   │   ├── insights/InsightsScreen.tsx
│   │   └── settings/SettingsScreen.tsx
│   ├── services/                  # Authoritative business services
│   │   ├── audio/                 # AudioService, VirtualLiveEngine, TrackPlayerService
│   │   ├── alarms/                # AlarmService, ExactAlarmCoordinator
│   │   └── notifications/         # NotificationService, PushBroadcastReceiver
│   ├── store/                     # Zustand state stores
│   │   ├── audioStore.ts          # Playback state, track metadata, queue
│   │   ├── themeStore.ts          # Theme mode, diurnal phase, colors
│   │   ├── streakStore.ts         # Nitnem completion streak
│   │   └── readerStore.ts         # Font size, font family, Larivaar toggle
│   ├── theme/                     # Design tokens & Unistyles / StyleSheet themes
│   │   ├── colors.ts              # Light, Dark, Divine Gold, Auto palette
│   │   ├── typography.ts          # Font families, sizes, weights, line heights
│   │   ├── spacing.ts             # Spacing scale & border radii
│   │   └── shadows.ts             # Claymorphic elevation styles
│   ├── types/                     # Shared TypeScript interfaces & types
│   │   ├── audio.ts               # Stream, Track, PlaybackState
│   │   ├── gurbani.ts             # Bani, Verse, Shabad, Translation
│   │   └── user.ts                # Profile, Streak, Settings
│   └── utils/                     # Pure utility functions
│       ├── dateUtils.ts           # Nanakshahi dates, time-of-day calculator
│       ├── gurbaniUtils.ts        # Vishram parser, Larivaar splitter
│       └── storage.ts             # MMKV storage adapter with Zod schemas
├── tests/                         # Automated test suites
│   ├── unit/                      # Unit tests for services & stores
│   │   ├── virtualLive.test.ts    # 100% verification of UTC epoch timeline math
│   │   ├── streak.test.ts         # Daily reset & streak calculations
│   │   └── larivaar.test.ts       # Gurmukhi word-splitting accuracy
│   ├── integration/               # Integration tests for audio & navigation
│   └── e2e/                       # Maestro end-to-end user flows
├── app.json                       # Expo configuration & plugins
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # Strict TypeScript configuration
└── babel.config.js                # Babel configuration (Reanimated plugin)
```
