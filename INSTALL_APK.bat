@echo off
echo ========================================
echo    ANHAD Android App Installer
echo    Updated Launcher Icon - Fixed!
echo ========================================
echo.
echo This will install the updated ANHAD app
echo with the new high-quality launcher icon.
echo.
echo Make sure your device is:
echo  - Connected via USB
echo  - USB Debugging is enabled
echo.
pause

cd android

echo.
echo Checking for connected devices...
adb devices
echo.

echo Installing ANHAD APK...
echo Please wait...
adb install -r app\build\outputs\apk\debug\app-debug.apk

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Check your device home screen.
echo The ANHAD icon should now be:
echo  - Sharp and crisp (no blur)
echo  - Properly sized (not tiny)
echo  - Professional looking
echo.
echo If the icon still looks old:
echo  1. Clear app data
echo  2. Restart your device
echo  3. Reinstall
echo.
pause
