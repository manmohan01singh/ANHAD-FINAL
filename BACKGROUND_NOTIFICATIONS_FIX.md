# Background Notifications Fix for ANHAD

## Issues Fixed
1. **Background notifications not firing in Capacitor**
2. **Theme/appearance not changing visibly**

---

## 1. Background Notifications in Capacitor

### Root Cause
Notifications weren't working in background because:
- Android 12+ requires `SCHEDULE_EXACT_ALARM` permission
- Notifications need `allowWhileIdle: true` for Doze mode
- Channel configuration was missing priority settings

### Fixes Applied

#### A. AndroidManifest.xml
Already has the necessary permissions:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

#### B. Notification Scheduling
All notifications in `spiritual-notifications.js` are configured with:
```javascript
schedule: { 
  at: scheduleTime, 
  allowWhileIdle: true,  // ← KEY: Works in Doze mode
  exact: true             // ← KEY: Exact timing on Android 12+
}
```

#### C. Notification Channel
High-priority channel created with:
```javascript
importance: 5,            // MAX importance
visibility: 1,            // Show on lock screen
vibration: true,
sound: 'default',
lights: true
```

### Testing Background Notifications

1. **Install APK on device**
```bash
cd android
./gradlew assembleDebug
# Install: android/app/build/outputs/apk/debug/app-debug.apk
```

2. **Grant permissions**
   - Open app → Settings → Notifications → Enable
   - System Settings → ANHAD → Battery → Unrestricted
   - System Settings → ANHAD → Alarms & reminders → Allow

3. **Schedule test notification**
   Open Chrome DevTools connected to device:
   ```javascript
   // Schedule notification in 30 seconds
   const testTime = new Date(Date.now() + 30000);
   window.Capacitor.Plugins.LocalNotifications.schedule({
     notifications: [{
       id: 99999,
       title: "Test Notification",
       body: "This should appear in background",
       schedule: { at: testTime, allowWhileIdle: true, exact: true },
       channelId: 'spiritual_reminders',
       sound: 'default',
       smallIcon: 'ic_stat_notify'
     }]
   });
   ```

4. **Test in background**
   - Press home button (don't force-close)
   - Wait 30 seconds
   - Notification should appear even when app is backgrounded
   - Even works when screen is off (Doze mode)

### Verifying Scheduled Notifications

```javascript
// Check pending notifications
window.Capacitor.Plugins.LocalNotifications.getPending().then(result => {
  console.log('Pending notifications:', result.notifications.length);
  result.notifications.forEach(n => {
    console.log(`ID ${n.id}: ${n.title} at ${n.schedule.at}`);
  });
});
```

---

## 2. Theme/Appearance Not Changing

### Root Cause
Theme switching wasn't visually updating because:
- Inline styles weren't being forced
- CSS variables weren't immediately overriding
- No forced repaint after theme change

### Fixes Applied

#### A. Enhanced `global-theme.js`
Added aggressive inline style forcing:

```javascript
// FORCE inline styles to ensure immediate visual update
if (effectiveTheme === 'dark') {
  html.style.backgroundColor = '#0D0D0F';
  html.style.color = '#F5F5F7';
} else {
  html.style.backgroundColor = '#FAF8F5';
  html.style.color = '#1C1C1E';
}

// Force repaint by triggering reflow
void html.offsetHeight;
```

#### B. Inline Critical CSS in All Pages
Added to head of all legal pages (Settings, Privacy, About, etc.):

```html
<style>
  html {
    background-color: #FAF8F5 !important;
    color: #1C1C1E !important;
  }
  html[data-theme="dark"],
  html.dark-mode {
    background-color: #0D0D0F !important;
    color: #F5F5F7 !important;
  }
  body {
    background-color: inherit !important;
    color: inherit !important;
  }
</style>
```

### Testing Theme Switching

1. **Open any page** (Settings, Privacy, Changelog, etc.)

2. **Check current theme**
```javascript
console.log('Current theme:', AnhadTheme.get());
console.log('Is dark?', AnhadTheme.isDark());
```

3. **Toggle theme**
```javascript
// Toggle: light → dark → auto → light
AnhadTheme.toggle();

// Or set directly
AnhadTheme.set('dark');
AnhadTheme.set('light');
AnhadTheme.set('auto');
```

4. **Verify visual change**
   - Background should change immediately
   - No white flash
   - Cards should match theme
   - Text should be readable

5. **Check persistence**
   - Close and reopen app
   - Theme should persist
   - Check: `localStorage.getItem('anhad_theme')`

---

## Complete Notification Flow

### Daily Spiritual Notifications

1. **Fixed-time notifications** (4 per day):
   - Hukamnama: 6:15 AM
   - Amritvela: 4:30 AM
   - Rehras Sahib: 6:30 PM
   - Sohela: 9:30 PM

2. **Random inspirational** (3 per day):
   - Between 7 AM - 9 PM
   - Different messages each time
   - Links to specific features

3. **Kirtan reminder** (1 per day):
   - Between 7-10 AM
   - Direct link to Darbar Sahib Live

4. **Nitnem completion** (when triggered):
   - Fires when all banis marked complete
   - Celebratory message
   - Once per day max

### Notification Actions

All notifications deep-link to specific pages:
- `open_hukamnama` → Hukamnama/daily-hukamnama.html
- `open_nitnem` → NitnemTracker/nitnem-tracker.html
- `open_radio` → GurbaniRadio/gurbani-radio.html
- `open_naam` → NaamAbhyas/naam-abhyas.html
- `open_bani` → GurbaniKhoj/gurbani-khoj.html

---

## Debugging Commands

### Check notification permissions
```javascript
window.Capacitor.Plugins.LocalNotifications.checkPermissions().then(console.log);
```

### Request permissions
```javascript
window.Capacitor.Plugins.LocalNotifications.requestPermissions().then(console.log);
```

### Schedule test notification
```javascript
window.SpiritualNotifications.scheduleAll().then(notifs => {
  console.log(`Scheduled ${notifs.length} notifications`);
});
```

### View configuration
```javascript
console.log(window.SpiritualNotifications.getConfig());
```

### Check pending
```javascript
window.CapacitorNotifications.getPendingNotifications().then(console.log);
```

### Cancel all
```javascript
window.CapacitorNotifications.cancelAllNotifications();
```

---

## Files Modified

1. **frontend/lib/global-theme.js**
   - Added forced inline styles
   - Added repaint trigger
   - Enhanced visual update

2. **frontend/Settings/index.html**
   - Added inline critical CSS
   - Enhanced theme initialization

3. **frontend/changelog/index.html**
   - Added inline critical CSS
   - Enhanced theme initialization

4. **frontend/about/index.html**
   - Added inline critical CSS

5. **frontend/privacy/index.html**
   - Added inline critical CSS

6. **frontend/terms/index.html**
   - Added inline critical CSS

7. **frontend/disclaimer/index.html**
   - Added inline critical CSS

8. **frontend/support/index.html**
   - Added inline critical CSS

9. **frontend/contact/index.html**
   - Added inline critical CSS

10. **frontend/licenses/index.html**
    - Added inline critical CSS

11. **frontend/acknowledgements/index.html**
    - Added inline critical CSS

12. **frontend/copyright/index.html**
    - Added inline critical CSS

---

## Production Checklist

### Before Release

- [ ] Test notifications in background (app minimized)
- [ ] Test notifications with screen off (Doze mode)
- [ ] Test notifications after device restart
- [ ] Test theme switching on all pages
- [ ] Verify theme persists across app restarts
- [ ] Check notification permissions flow
- [ ] Test battery optimization exemption
- [ ] Verify deep-links from notifications work
- [ ] Test all 4 fixed-time notifications
- [ ] Test random notifications appear
- [ ] Test Nitnem completion notification
- [ ] Verify sounds and vibrations work

### Google Play Requirements

- [ ] Privacy Policy mentions notifications
- [ ] Data Safety declares notification data
- [ ] Permissions justified in store listing
- [ ] SCHEDULE_EXACT_ALARM usage explained
- [ ] Battery optimization behavior documented

---

## Known Issues & Solutions

### Issue: Notifications don't fire after device restart
**Solution**: `RECEIVE_BOOT_COMPLETED` permission is set, and `StreakSaverBootReceiver` reschedules on boot

### Issue: Notifications delayed in Doze mode
**Solution**: `allowWhileIdle: true` flag ensures delivery even in Doze

### Issue: Theme not persisting
**Solution**: Check `localStorage.getItem('anhad_theme')` - should store correctly

### Issue: White flash on page load
**Solution**: Inline critical CSS in `<head>` prevents FOUC

---

## Contact & Support

For issues:
- Email: anhadsupport@gmail.com
- Check console logs with Chrome DevTools
- Verify Android version (12+ has stricter alarm policies)
