# ANHAD Home Screen Widgets - Setup Guide

## Overview
This implementation adds iOS 14+ style home screen widgets for Android and iOS.

## Widgets Included
1. **Nitnem Tracker** - Shows daily progress, streak, and completed banis
2. **Naam Abhyas** - Hourly reminder progress with circular indicator
3. **Gurpurab Calendar** - Countdown to next event + Hukamnama preview
4. **Live Kirtan** - Current track and playback status

---

## Android Setup

### Files Created
- `android/app/src/main/java/com/gurbaniradio/app/widgets/`
  - `WidgetDataBridgePlugin.java` - Capacitor plugin for data sync
  - `BaseWidgetProvider.java` - Base widget functionality
  - `NitnemWidgetProvider.java` - Nitnem widget logic
  - `NaamAbhyasWidgetProvider.java` - Naam Abhyas widget logic
  - `CalendarWidgetProvider.java` - Calendar widget logic
  - `KirtanWidgetProvider.java` - Kirtan widget logic

- `android/app/src/main/res/layout/`
  - `nitnem_widget.xml` - Nitnem widget layout
  - `naam_abhyas_widget.xml` - Naam Abhyas layout
  - `calendar_widget.xml` - Calendar layout
  - `kirtan_widget.xml` - Kirtan layout

- `android/app/src/main/res/xml/`
  - `nitnem_widget_info.xml` - Widget configuration
  - `naam_abhyas_widget_info.xml` - Widget configuration
  - `calendar_widget_info.xml` - Widget configuration
  - `kirtan_widget_info.xml` - Widget configuration

- `android/app/src/main/res/drawable/`
  - `widget_background.xml` - iOS-style background
  - `widget_progress_orange.xml` - Progress bar style
  - `circle_progress_bg.xml` - Circular progress background
  - `circle_accent_bg.xml` - Accent circle background

### AndroidManifest.xml Updated
Added 4 widget receivers with proper intent filters and metadata.

### Build Steps
1. Run `npx cap sync android` to sync changes
2. Open Android Studio: `npx cap open android`
3. Build the project

---

## iOS Setup

### Files Created
- `ios/App/App/widgets/`
  - `WidgetDataBridge.swift` - Shared data bridge
  - `NitnemWidget.swift` - Nitnem widget
  - `NaamAbhyasWidget.swift` - Naam Abhyas widget
  - `CalendarWidget.swift` - Calendar widget
  - `KirtanWidget.swift` - Kirtan widget

- `ios/App/WidgetsExtension/ANHADWidgets.swift` - Widget bundle
- `ios/App/App/App.entitlements` - App Groups configuration

### Xcode Setup Required

1. **Add App Groups Capability:**
   - Open project in Xcode
   - Select the main app target
   - Go to "Signing & Capabilities"
   - Click "+ Capability"
   - Add "App Groups"
   - Create group: `group.com.gurbaniradio.app`

2. **Create Widget Extension:**
   - File → New → Target
   - Select "Widget Extension"
   - Name it "WidgetsExtension"
   - Replace generated code with `ANHADWidgets.swift` content
   - Add all widget files to the extension target

3. **Add Widget Files to Extension:**
   - Select all widget files in widgets folder
   - Check "WidgetsExtension" in target membership

4. **Build Extension:**
   - Build the widget extension target first
   - Then build the main app

---

## Frontend Integration

### Script Include
Add to `frontend/index.html` and other main pages:
```html
<script src="widgets/widget-bridge.js"></script>
```

### Automatic Sync
The widget bridge auto-syncs:
- On page visibility change
- Every 5 minutes when app is active
- Manual sync via `WidgetBridge.syncAllWidgets()`

### Data Flow
1. App stores data in `localStorage`
2. Widget bridge reads from `localStorage`
3. Sends to native via `WidgetDataBridge` plugin
4. Native widgets read from SharedPreferences (Android) / AppGroups (iOS)
5. Widgets update automatically

---

## Testing

### Android
1. Long press home screen
2. Select "Widgets"
3. Find "ANHAD" widgets
4. Add widgets to home screen
5. Open app, complete some nitnem
6. Verify widget updates

### iOS
1. Long press home screen
2. Tap "+" to add widgets
3. Search for "ANHAD"
4. Select widget size
5. Add to home screen

---

## Troubleshooting

### Widgets Not Updating
- Check Capacitor plugin is registered
- Verify data is in localStorage
- Check Android Studio / Xcode logs

### iOS App Groups Not Working
- Verify `group.com.gurbaniradio.app` is exact match
- Check both app and widget extension have App Groups enabled
- Clean build folder and rebuild

### Android Widget Not Showing
- Verify `AndroidManifest.xml` has receivers
- Check widget provider class names are correct
- Run `npx cap sync android` again

---

## Notes
- Widgets update every 15 minutes (system minimum)
- Data syncs when app is opened or becomes active
- Widgets work offline - data is cached locally
- Tap widgets to open corresponding app page
