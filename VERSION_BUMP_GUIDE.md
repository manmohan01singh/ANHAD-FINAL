# 📦 ANHAD App - Version Bump & Build Guide

## ✅ Version Already Updated!

Your app version has been updated to:
- **versionCode**: 3 (was 2)
- **versionName**: "1.0.2" (was "1.0.1")

---

## 🚀 Quick Build Guide

### Option 1: Use Build Script (Recommended)
```bash
# Simply run this script:
build-release.bat
```

This will:
1. ✅ Sync Capacitor files
2. ✅ Clean previous builds
3. ✅ Build release AAB
4. ✅ Show you where the AAB file is located

### Option 2: Manual Commands
```bash
# 1. Sync Capacitor
npx cap sync android

# 2. Build AAB
cd android
gradlew bundleRelease
cd ..

# 3. Find AAB at:
# android\app\build\outputs\bundle\release\app-release.aab
```

---

## 📊 Version History

| Version Code | Version Name | Date | Changes |
|--------------|--------------|------|---------|
| 1 | 1.0.0 | Initial | First release |
| 2 | 1.0.1 | Previous | Previous update |
| **3** | **1.0.2** | **Current** | **Network error fixes, local fonts** |

---

## 🔄 Next Version Bump (When Needed)

### When to Bump Version?
- Before uploading to Google Play Console
- After making significant changes
- For bug fixes or new features

### How to Bump Version?

#### Quick Method:
```bash
# Run this helper script:
bump-version.bat
```

#### Manual Method:
1. **Open**: `android\app\build.gradle`
2. **Find** the `defaultConfig` section:
   ```gradle
   defaultConfig {
       applicationId "com.anhad.app"
       minSdkVersion rootProject.ext.minSdkVersion
       targetSdkVersion rootProject.ext.targetSdkVersion
       versionCode 3        ← Change this
       versionName "1.0.2"  ← Change this
       ...
   ```

3. **Increment** the numbers:
   ```gradle
   versionCode 4        ← Next version
   versionName "1.0.3"  ← Next version name
   ```

4. **Save** the file

5. **Build** the app:
   ```bash
   build-release.bat
   ```

---

## 📱 Version Naming Convention

### Version Code (Integer - Must be unique)
- Increments by 1 each release
- **Never reuse** a version code
- Google Play uses this to determine which version is newer

Example progression:
```
1 → 2 → 3 → 4 → 5 → ...
```

### Version Name (String - User-facing)
- Follows semantic versioning: `MAJOR.MINOR.PATCH`
- Users see this in the app store

Examples:
```
1.0.0  →  Initial release
1.0.1  →  Bug fixes
1.0.2  →  Current (network fixes)
1.0.3  →  Next bug fix
1.1.0  →  New feature
2.0.0  →  Major update
```

---

## 🎯 Upload to Google Play Console

### Step-by-Step:

1. **Build the AAB**:
   ```bash
   build-release.bat
   ```

2. **Locate the AAB file**:
   ```
   android\app\build\outputs\bundle\release\app-release.aab
   ```

3. **Go to Google Play Console**:
   - https://play.google.com/console
   - Select your app "Anhad"

4. **Navigate to Release**:
   - Production > Releases
   - OR Internal Testing > Releases
   - Click "Create new release"

5. **Upload AAB**:
   - Click "Upload"
   - Select `app-release.aab`
   - Wait for upload and processing

6. **Add Release Notes** (optional):
   ```
   Version 1.0.2
   - Fixed network error handling
   - Added local fonts for offline support
   - Improved error messages
   - Enhanced user experience
   ```

7. **Review and Roll Out**:
   - Review the release
   - Click "Review release"
   - Click "Start rollout to Production"

---

## ⚠️ Common Errors & Solutions

### Error: "Version code 3 has already been used"
**Solution**: Increment to version code 4
```gradle
versionCode 4
versionName "1.0.3"
```

### Error: "You need to use a different version code"
**Solution**: Check what versions you've already uploaded to Play Console, then use a higher number.

### Error: "Failed to build"
**Solution**:
1. Clean the project:
   ```bash
   cd android
   gradlew clean
   cd ..
   ```
2. Try building again

### Error: "Capacitor sync failed"
**Solution**:
1. Check internet connection
2. Run:
   ```bash
   npm install
   npx cap sync android
   ```

---

## 📝 Build Checklist

Before building:
- [ ] Version code incremented
- [ ] Version name updated
- [ ] All changes tested locally
- [ ] No console errors
- [ ] App works on test device

After building:
- [ ] AAB file created successfully
- [ ] File size is reasonable (not too large)
- [ ] Ready to upload to Play Console

---

## 🛠️ Helper Scripts

### `build-release.bat`
Automated build script that:
- Syncs Capacitor
- Cleans previous builds
- Builds release AAB
- Shows file location

### `bump-version.bat`
Interactive version bump helper that:
- Shows current version
- Helps you choose new version
- Opens build.gradle for editing

### `test-gurbani-radio-fixes.bat`
Tests the Gurbani Radio fixes:
- Checks for Google Fonts references
- Verifies image paths
- Confirms error handling

---

## 📞 Quick Reference

**Current Version**: 3 (1.0.2)  
**Next Version**: 4 (1.0.3)  
**Build Command**: `build-release.bat`  
**AAB Location**: `android\app\build\outputs\bundle\release\app-release.aab`  
**Play Console**: https://play.google.com/console

---

## 🎉 Summary

You're all set! Your app is now at version **1.0.2 (versionCode 3)** with:
- ✅ Network error fixes
- ✅ Local fonts
- ✅ Better error messages
- ✅ Enhanced user experience

To build and upload:
1. Run `build-release.bat`
2. Upload the AAB to Google Play Console
3. Enjoy your updated app! 🚀
