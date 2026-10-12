# ANHAD Screen-to-Component Mapping Matrix
**Document:** `ANHAD_MIGRATION/08_SCREEN_COMPONENT_MAPPING.md`  
**Version:** 1.0.0  

---

## 1. Screen Architecture & Component Decomposition Matrix

| Original Screen & Files | Target React Native Screen | Shared Components Used | Data Requirements | Native APIs Required |
|---|---|---|---|---|
| **Home Screen**<br>`frontend/index.html`<br>`js/homepage-data.js`<br>`js/trendora-app.js` | `src/screens/home/HomeScreen.tsx` | - `Header`<br>- `HeroBanner`<br>- `GuruCarousel`<br>- `LiveStreamCard`<br>- `NitnemProgressRing`<br>- `SehajPaathPreviewCard`<br>- `HukamnamaPreviewCard`<br>- `QuickActionGrid`<br>- `GlobalMiniPlayer` | - `useThemeStore`<br>- `useAudioStore`<br>- `useStreakStore`<br>- `useHukamnamaQuery`<br>- `useCampaignQuery` | - `NetInfo`<br>- `Haptics` |
| **Daily Hukamnama**<br>`frontend/Hukamnama/daily-hukamnama.html`<br>`daily-hukamnama.js` | `src/screens/hukamnama/HukamnamaScreen.tsx` | - `ScreenHeader`<br>- `GuruPortraitHeader`<br>- `GurbaniVerseList`<br>- `TranslationView`<br>- `AudioRecitationBar`<br>- `HukamnamaShareButton` | - `useHukamnamaQuery(date)`<br>- `useAudioStore` | - `Share`<br>- `ViewShot` (for card generation) |
| **Gurbani Radio**<br>`frontend/GurbaniRadio/gurbani-radio.html`<br>`lib/anhad-audio-singleton.js` | `src/screens/radio/RadioScreen.tsx` | - `RadioPlayerArtwork`<br>- `StreamTabBar`<br>- `PlaybackControls`<br>- `VolumeSlider`<br>- `SleepTimerButton`<br>- `StreamInfoCard` | - `useAudioStore`<br>- `useRadioStatusQuery`<br>- `useListenerCountQuery` | - `react-native-track-player`<br>- Lock screen metadata |
| **Nitnem Hub**<br>`frontend/nitnem/index.html`<br>`nitnem/js/hub-app.js` | `src/screens/nitnem/NitnemHubScreen.tsx` | - `CategoryTabBar`<br>- `BaniCard`<br>- `SearchBar`<br>- `MyPothiFloatingButton` | - `useBaniCatalogQuery`<br>- `useOfflineBaniStore` | - `MMKV` |
| **Bani Reader**<br>`frontend/nitnem/reader.html`<br>`nitnem/js/reader-engine.js` | `src/screens/reader/BaniReaderScreen.tsx` | - `ImmersiveHeader`<br>- `VerseRow`<br>- `LarivaarText`<br>- `TranslationText`<br>- `ReadingSettingsSheet`<br>- `AutoScrollController` | - `useBaniData(id)`<br>- `useReaderSettingsStore` | - `KeepAwake`<br>- `Haptics` |
| **Nitnem Tracker**<br>`frontend/NitnemTracker/nitnem-tracker.html`<br>`nitnem-tracker.js` | `src/screens/tracker/NitnemTrackerScreen.tsx` | - `DailyStreakBadge`<br>- `BaniChecklist`<br>- `MaryadaTimeline`<br>- `WeekCalendarStrip`<br>- `CelebrationModal` | - `useStreakStore`<br>- `useNitnemChecklistStore` | - `@notifee/react-native`<br>- `Haptics` |
| **Gurbani Khoj**<br>`frontend/GurbaniKhoj/gurbani-khoj.html`<br>`gurbani-khoj.js` | `src/screens/search/GurbaniKhojScreen.tsx` | - `SearchInputHeader`<br>- `FilterPills`<br>- `GurmukhiKeyboard`<br>- `SearchResultCard`<br>- `SearchHistoryList` | - `useGurbaniSearchQuery`<br>- `useSearchHistoryStore` | - `Voice / SpeechRecognition`<br>- `Haptics` |
| **Sehaj Paath**<br>`frontend/SehajPaath/sehaj-paath.html`<br>`sehaj-paath.js` | `src/screens/sehajpaath/SehajPaathScreen.tsx` | - `AngProgressBar`<br>- `DailyTargetCard`<br>- `EstimatedCompletionCard`<br>- `BookmarkList`<br>- `ContinueReadingCTA` | - `useSehajPaathStore`<br>- `useAngDataQuery` | - `MMKV` |
| **Naam Abhyas**<br>`frontend/NaamAbhyas/naam-abhyas.html`<br>`naam-abhyas.js` | `src/screens/naamabhyas/NaamAbhyasScreen.tsx` | - `BreathingRing`<br>- `MalaCounterButton`<br>- `SoundscapeSelector`<br>- `SessionTimer`<br>- `CompletionModal` | - `useNaamAbhyasStore`<br>- `useAudioStore` | - `Haptics`<br>- `KeepAwake`<br>- Sound player |
| **Sadhsangat Live**<br>`frontend/sadhsangat-live/index.html`<br>`sadhsangat-live/` | `src/screens/sadhsangat/SadhsangatScreen.tsx` | - `ChannelListHeader`<br>- `LiveBroadcastCard`<br>- `YouTubePlayerContainer`<br>- `CollageGrid`<br>- `PresenceIndicator` | - `useSadhsangatChannelsQuery`<br>- `useLiveCheckQuery` | - `react-native-youtube-iframe` |
| **Gurpurab Calendar**<br>`frontend/Calendar/GurpurabCalendar-ios.html` | `src/screens/calendar/CalendarScreen.tsx` | - `MonthViewHeader`<br>- `GurpurabEventCard`<br>- `CountdownTimer`<br>- `ReminderBellButton` | - `useCalendarEventsQuery` | - `@notifee/react-native` |
| **Spiritual Notes**<br>`frontend/Notes/notes.html`<br>`notes-manager.js` | `src/screens/notes/NotesScreen.tsx` | - `NoteCard`<br>- `TagFilterList`<br>- `NoteEditorModal`<br>- `SearchBar` | - `useNotesStore` | - `MMKV` |
| **Khalsa Library & Insights**<br>`frontend/Insights/insights.html`<br>`insights.js` | `src/screens/insights/InsightsScreen.tsx` | - `ListeningHoursCard`<br>- `GuruHistoryCard`<br>- `RaagDirectoryList`<br>- `SakhiReaderModal` | - `useUserStatsStore`<br>- `useKhalsaLibraryQuery` | - `MMKV` |
| **Settings & Appearance**<br>`frontend/Settings/index.html`<br>`appearance.html` | `src/screens/settings/SettingsScreen.tsx` | - `ThemeModePicker`<br>- `FontSizePreviewSlider`<br>- `FontFamilyRadioGroup`<br>- `NotificationToggles`<br>- `BackupRestoreSection` | - `useThemeStore`<br>- `useReaderSettingsStore`<br>- `useNotificationSettingsStore` | - `MMKV`<br>- `DocumentPicker` |

---

## 2. Reusable Atomic & Molecule Component Catalog

1. **`src/components/common/`:**
   - `Button.tsx`: Claymorphic primary/secondary button with haptic feedback.
   - `Card.tsx`: Elevated container supporting gradient backgrounds and glass bevels.
   - `Icon.tsx`: Type-safe SVG icon renderer replacing `anhad-svg-sprite.js`.
   - `Slider.tsx`: Smooth typography and volume slider.
   - `Switch.tsx`: iOS-style animated toggle.
2. **`src/components/audio/`:**
   - `GlobalMiniPlayer.tsx`: Persistent audio bar.
   - `SleepTimerModal.tsx`: Timer modal with countdown.
   - `EqualizerBars.tsx`: Animated live kirtan sound bars.
3. **`src/components/gurbani/`:**
   - `LarivaarText.tsx`: Continuous Gurmukhi scripture component.
   - `VishramHighlighter.tsx`: Sacred pause highlighter.
   - `GurmukhiKeyboard.tsx`: On-screen Gurmukhi keyboard modal.
