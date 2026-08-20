# Quick Guide: Generate AAB for Version 1.0.3

## Current Status ✅
- Version updated to **1.0.3 (versionCode 4)**
- All files synced via `npx cap sync`
- Android Studio opened
- Groq AI model fixed (llama-3.1-70b-versatile)
- Campaign announcement updated

## Steps to Generate AAB

### 1. In Android Studio (Should be open now):

#### Wait for Gradle Sync
- Let Android Studio finish "Gradle Build" (bottom status bar)
- This may take 1-3 minutes on first open

#### Generate Signed Bundle
1. Click **Build** menu → **Generate Signed Bundle / APK**
2. Select **Android App Bundle** → Click **Next**
3. Enter your keystore details:
   - **Key store path**: Browse to your `.jks` file
   - **Key store password**: Enter password
   - **Key alias**: Enter alias
   - **Key password**: Enter password
   - ✅ Check "Remember passwords"
4. Click **Next**
5. Select **release** build variant
6. ✅ Check both signature versions (V1 and V2)
7. Click **Finish**

### 2. Build Output Location
After build completes (watch bottom-right notifications):
```
android\app\release\app-release.aab
```

### 3. Upload to Google Play Console

1. Go to: https://play.google.com/console
2. Select **Anhad** app
3. Left sidebar → **Production**
4. Click **Create new release**
5. Click **Upload** → Select `app-release.aab`
6. Google Play will automatically detect:
   - Version Code: **4**
   - Version Name: **1.0.3**
7. Add release notes:
   ```
   - Fixed channel addition feature (updated AI model)
   - Improved campaign announcement display
   - Bug fixes and performance improvements
   ```
8. Click **Review release**
9. Click **Start rollout to Production**

## What's Fixed in This Version

### Critical Fix: Sadhsangat Channel Addition
- **Problem**: llama-3.3-70b-versatile model was deprecated by Groq
- **Solution**: Switched to llama-3.1-70b-versatile
- **Result**: New channels can now be added successfully

### Campaign Improvement
- Guru portraits always visible (never hidden)
- Text cycles between greeting and "Chaliya Coming Soon"
- Cleaner, less intrusive announcement

## Verification After Upload
- Check Google Play Console shows version 1.0.3
- Status will be "Pending review" initially
- Review typically takes 1-3 days

## Troubleshooting

### If Gradle Sync Fails:
```
File → Invalidate Caches → Invalidate and Restart
```

### If Signing Fails:
- Verify keystore path is correct
- Ensure passwords are correct
- Check keystore file is not corrupted

### If Build Takes Too Long:
- First build after sync can take 5-10 minutes
- Check bottom status bar for progress

## Next Build (Future Reference)
When ready for next update:
1. Update version in `android/app/build.gradle`
2. Run `npx cap sync`
3. Run `npx cap open android`
4. Generate signed AAB
5. Upload to Play Console

---
**Current Build Ready**: Version 1.0.3 (versionCode 4) ✅
