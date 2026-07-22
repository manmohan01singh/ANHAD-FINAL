@echo off
echo ================================================
echo GURBANI RADIO NETWORK FIXES - VERIFICATION TEST
echo ================================================
echo.

echo [1/5] Checking for Google Fonts references (should be NONE)...
findstr /S /C:"fonts.googleapis.com" frontend\GurbaniRadio\*.html frontend\GurbaniRadio\*.js 2>nul
if %errorlevel% equ 0 (
    echo    ❌ FAILED: Google Fonts still referenced
) else (
    echo    ✅ PASSED: No Google Fonts references
)
echo.

echo [2/5] Checking for wrong khanda.png references (should be NONE)...
findstr /S /C:"khanda.png" frontend\GurbaniRadio\stream-library.js 2>nul
if %errorlevel% equ 0 (
    echo    ❌ FAILED: Old khanda.png still referenced
) else (
    echo    ✅ PASSED: All references use khanda-gold.png
)
echo.

echo [3/5] Verifying khanda-gold.png exists...
if exist "frontend\assets\khanda-gold.png" (
    echo    ✅ PASSED: khanda-gold.png found
) else (
    echo    ❌ FAILED: khanda-gold.png not found
)
echo.

echo [4/5] Checking for enhanced error handling in audio singleton...
findstr /C:"errorType" frontend\lib\anhad-audio-singleton.js >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ PASSED: Enhanced error detection found
) else (
    echo    ❌ FAILED: Error detection not enhanced
)
echo.

echo [5/5] Checking for network monitor in gurbani-radio.js...
findstr /C:"initNetworkMonitor" frontend\GurbaniRadio\gurbani-radio.js >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ PASSED: Network monitoring added
) else (
    echo    ❌ FAILED: Network monitoring not found
)
echo.

echo ================================================
echo VERIFICATION COMPLETE
echo ================================================
echo.
echo To test runtime behavior:
echo 1. Build and deploy app
echo 2. Test with network ON
echo 3. Test with airplane mode ON
echo 4. Toggle network during playback
echo.
pause
