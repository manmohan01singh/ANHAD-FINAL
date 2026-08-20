# Version 1.0.3 Release Notes

## Build Date
August 20, 2026

## Version Information
- **Version Code**: 4
- **Version Name**: 1.0.3
- **Package**: com.anhad.app
- **Web App Version**: 1.0.3 (synced with Android)

## ✅ All Version Files Updated

### Android Version:
- ✅ `android/app/build.gradle` - versionCode: 4, versionName: "1.0.3"

### Web/PWA Version:
- ✅ `scripts/generate-version.js` - version: "1.0.3"
- ✅ `frontend/version.json` - version: "1.0.3"
- ✅ Synced to `android/app/src/main/assets/public/version.json`

## Changes in This Release

### 1. Campaign Announcement Update
- Modified Chaliya 2026 campaign to show "Chaliya Coming Soon" 
- Guru portrait images now remain visible at all times
- Only text below portraits cycles between normal greeting and campaign message
- Removed Gurbani line, subtitle, and pill caption for simplified announcement
- Badge shows "CHALIYA 2026", title shows "Chaliya Coming Soon"

### 2. Groq AI Model Update (Critical Fix) 🔧
- **FIXED**: Replaced deprecated `llama-3.3-70b-versatile` model with `llama-3.1-70b-versatile`
- **Impact**: Sadhsangat new channel additions will now work properly
- **Changed in**: `backend/server.js` (3 occurrences)
- **Reason**: Llama 3.3 70b was removed from Groq API, causing channel validation failures

### 3. Files Synced
- All frontend assets copied to `android/app/src/main/assets/public/`
- Capacitor config updated
- Android plugins updated (7 Capacitor plugins)
- Version.json synced with updated version 1.0.3

## Build Instructions

### To Generate AAB for Google Play Console:

1. **Open Android Studio** (Should already be open):
   ```cmd
   npx cap open android
   ```

2. **Wait for Gradle Sync** (1-3 minutes for first time)

3. **In Android Studio**:
   - Click **Build** → **Generate Signed Bundle / APK**
   - Select **Android App Bundle**
   - Use your existing keystore
   - Select **release** build variant
   - Click **Finish**

4. **AAB Location**:
   ```
   android/app/release/app-release.aab
   ```

5. **Upload to Google Play Console**:
   - Go to [Google Play Console](https://play.google.com/console)
   - Select your app
   - Production → Create new release
   - Upload the AAB file
   - Version will be automatically detected as **1.0.3 (4)**

## Version Files Updated (Complete List)
- ✅ `android/app/build.gradle` - versionCode: 4, versionName: "1.0.3"
- ✅ `scripts/generate-version.js` - version: "1.0.3"
- ✅ `frontend/version.json` - version: "1.0.3", timestamp updated
- ✅ `capacitor.config.ts` - Config verified
- ✅ `frontend/lib/remote-config.js` - Campaign content updated
- ✅ `frontend/js/campaign-renderer.js` - Portrait display logic updated
- ✅ `backend/server.js` - Groq model updated (3 locations)

## Testing Checklist
- [ ] Campaign text cycles correctly
- [ ] Guru portraits always visible
- [ ] Sadhsangat channel addition works
- [ ] App launches without crashes
- [ ] Background audio continues properly
- [ ] Settings page shows version 1.0.3
- [ ] About page shows version 1.0.3

## Known Issues
None identified

## Next Steps
1. ✅ Android Studio opened
2. ⏳ Wait for Gradle sync
3. ⏳ Generate signed AAB
4. ⏳ Upload to Google Play Console
5. ⏳ Submit for review

---
**Ready for deployment** ✅
**All versions aligned to 1.0.3** ✅
