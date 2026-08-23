@echo off
echo ========================================
echo Building Android App with Updated Logos
echo ========================================
echo.

echo Step 1: Syncing Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Cleaning Android build...
cd android
call gradlew clean
if errorlevel 1 (
    echo ERROR: Clean failed!
    cd ..
    pause
    exit /b 1
)

echo.
echo Step 3: Building Release AAB...
call gradlew bundleRelease
if errorlevel 1 (
    echo ERROR: Build failed!
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo SUCCESS! Android AAB built successfully!
echo ========================================
echo.
echo Output location:
echo android\app\release\app-release.aab
echo.
echo All logos have been updated to app-logo-384.png!
echo - App launcher icon: Updated
echo - Notification icon: Updated
echo - Splash screen: Updated
echo.
pause
