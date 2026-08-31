@echo off
echo ================================================
echo ANHAD APP - BUILD RELEASE AAB
echo ================================================
echo.
echo Current Version: 1.1.16 (versionCode 7)
echo Features: Android 16 (API 36) + PWA Sync + Size Optimized
echo.

echo [Step 1/5] Syncing Capacitor files to Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ❌ ERROR: Capacitor sync failed!
    pause
    exit /b 1
)
echo ✅ Capacitor sync complete
echo.

echo [Step 2/5] Syncing Gradle dependencies...
cd android
call gradlew --refresh-dependencies
if %errorlevel% neq 0 (
    echo ⚠️ WARNING: Gradle refresh had issues (continuing anyway)
)
echo ✅ Dependencies synced
echo.

echo [Step 3/5] Cleaning previous builds...
call gradlew clean
if %errorlevel% neq 0 (
    echo ❌ ERROR: Clean failed!
    cd ..
    pause
    exit /b 1
)
echo ✅ Clean complete
echo.

echo [Step 4/5] Building Release AAB (Android App Bundle)...
call gradlew bundleRelease
if %errorlevel% neq 0 (
    echo ❌ ERROR: Build failed!
    cd ..
    pause
    exit /b 1
)
echo ✅ Build complete
echo.

cd ..

echo [Step 5/5] Locating AAB file...
set AAB_PATH=android\app\build\outputs\bundle\release\app-release.aab
if exist "%AAB_PATH%" (
    echo ✅ AAB file created successfully!
    echo.
    echo 📦 File location: %AAB_PATH%
    echo 📊 File size:
    dir "%AAB_PATH%" | findstr app-release.aab
    echo.
    echo ================================================
    echo BUILD SUCCESSFUL! 🎉
    echo ================================================
    echo.
    echo ✨ What's included in this build:
    echo  • Version 1.0.3 (versionCode 4)
    echo  • Network error fixes
    echo  • Local fonts for offline support
    echo  • In-App Updates enabled
    echo  • Enhanced user experience
    echo.
    echo Next steps:
    echo 1. Go to Google Play Console
    echo 2. Navigate to your app's release section
    echo 3. Upload: %AAB_PATH%
    echo 4. Set update priority (0-5)
    echo 5. Submit for review
    echo.
    echo 💡 TIP: Set priority 0-3 for flexible updates,
    echo     or 4-5 for immediate (critical) updates
    echo.
) else (
    echo ❌ ERROR: AAB file not found!
    echo Expected location: %AAB_PATH%
    echo.
)

pause
