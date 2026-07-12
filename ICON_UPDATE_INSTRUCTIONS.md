# Android Launcher Icon Update - Instructions

## ✅ What Was Fixed

### Problem 1: Poor Image Quality
- **Before**: Blurry, low-resolution launcher icon
- **After**: Sharp, high-quality icons generated from the original 1024×1024px source logo

### Problem 2: Excessive White Padding
- **Before**: Logo occupied only ~30-40% of icon space, appearing tiny
- **After**: Logo fills 85% of launcher icon space (legacy) and 70% of safe zone (adaptive icons)

## 📦 Generated Assets

All icons have been regenerated in the following locations:

### Legacy Icons (Android 7.1 and below)
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48×48px)
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72×72px)
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96×96px)
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144×144px)
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192×192px)

### Round Icons
- `ic_launcher_round.png` in all density folders (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)

### Adaptive Icons (Android 8.0+)
- `ic_launcher_foreground.png` (logo layer) in all density folders
- `ic_launcher_background.png` (white background) in all density folders
- XML configuration: `mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml`

## 🚀 How to Build & Install

### Option 1: Build Debug APK (Quick Testing)

```bash
cd android
gradlew.bat assembleDebug
```

The APK will be at: `android\app\build\outputs\apk\debug\app-debug.apk`

### Option 2: Build Release APK (For Distribution)

```bash
cd android
gradlew.bat assembleRelease
```

The APK will be at: `android\app\build\outputs\apk\release\app-release.apk`

**Note**: Release builds require signing configuration in `android/app/build.gradle`

### Option 3: Using Android Studio

1. Open `android` folder in Android Studio
2. Click **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Wait for build to complete
4. Click "locate" in the notification to find the APK

## 📱 Install APK on Device

### Via ADB (USB Debugging)

```bash
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

The `-r` flag reinstalls without uninstalling the previous version.

### Manual Installation

1. Transfer the APK to your device
2. Open the APK file on your device
3. Allow "Install from Unknown Sources" if prompted
4. Install the app

## 🔍 Verification Checklist

After installation, verify:

- [ ] Icon appears sharp and crisp (no blurriness)
- [ ] Logo fills icon properly (not tiny with excessive padding)
- [ ] Icon looks balanced next to other apps (WhatsApp, Gmail, etc.)
- [ ] Icon displays correctly on both light and dark wallpapers
- [ ] Round icon variant works on supported launchers
- [ ] Adaptive icon animation works smoothly (Android 8.0+)

## 🎨 Technical Details

### Source Icon Used
- **Path**: `frontend/assets/icon-1024x1024.png`
- **Resolution**: 1024×1024 pixels
- **Format**: PNG with transparency (RGBA)

### Scaling Strategy
- **Legacy Icons**: 85% fill (15% safe margin)
- **Adaptive Icons**: 70% fill of safe zone (respects Android's 66.67% guideline)
- **Resampling**: LANCZOS (highest quality)
- **Optimization**: PNG optimization enabled

### Adaptive Icon Guidelines
- Total size: 108dp × 108dp
- Safe zone: 72dp × 72dp (center 66.67%)
- Maskable area: varies by launcher (circle, squircle, rounded square, etc.)

## 🔄 If You Need to Regenerate

If you ever need to regenerate the icons (e.g., after logo changes):

```bash
python generate_android_icons.py
npx cap sync android
cd android
gradlew.bat assembleDebug
```

## 📝 Notes

- The `generate_android_icons.py` script is saved in the project root
- All icons use white background (#FFFFFF) to match the logo design
- Foreground layers use transparency for adaptive icon support
- Icons are optimized for file size without quality loss

## 🐛 Troubleshooting

### Icon Not Updating
- Clear app data: Settings → Apps → ANHAD → Storage → Clear Data
- Uninstall completely and reinstall
- Restart device after installation

### Build Errors
- Clean the project: `gradlew.bat clean`
- Invalidate caches: Android Studio → File → Invalidate Caches / Restart
- Check Gradle version compatibility

### APK Installation Failed
- Enable "Install from Unknown Sources" in device settings
- Check if app is already installed (uninstall first)
- Verify APK is not corrupted (re-download if transferred)

## ✨ Expected Result

Your ANHAD app icon should now:
- Look **professional and premium**
- Fill the launcher icon **appropriately**
- Appear **crisp and sharp** on all screen densities
- Match the **visual weight** of popular apps
- Work beautifully on **both light and dark wallpapers**
