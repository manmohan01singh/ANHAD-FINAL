@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM GURPURAB CELEBRATION MODE 2026 — Deployment Script
REM Copies Festival Mode files to iOS and Android directories
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ════════════════════════════════════════════════════════════
echo  ANHAD — Gurpurab Celebration Mode Deployment
echo ════════════════════════════════════════════════════════════
echo.

REM Check if frontend files exist
if not exist "frontend\css\gurpurab-celebration-2026.css" (
    echo ❌ ERROR: Frontend CSS file not found!
    echo    Expected: frontend\css\gurpurab-celebration-2026.css
    pause
    exit /b 1
)

if not exist "frontend\js\festival-mode-config.js" (
    echo ❌ ERROR: Festival Mode Config not found!
    echo    Expected: frontend\js\festival-mode-config.js
    pause
    exit /b 1
)

if not exist "frontend\js\festival-mode-integration.js" (
    echo ❌ ERROR: Festival Mode Integration not found!
    echo    Expected: frontend\js\festival-mode-integration.js
    pause
    exit /b 1
)

echo ✓ Source files found in frontend directory
echo.

REM ═══════════════════════════════════════════════════════════════════════════
REM Deploy to iOS
REM ═══════════════════════════════════════════════════════════════════════════
echo 📱 Deploying to iOS...
echo.

if not exist "ios\App\App\public\css" mkdir "ios\App\App\public\css"
if not exist "ios\App\App\public\js" mkdir "ios\App\App\public\js"

copy /Y "frontend\css\gurpurab-celebration-2026.css" "ios\App\App\public\css\" >nul
if errorlevel 1 (
    echo ❌ Failed to copy CSS to iOS
) else (
    echo    ✓ gurpurab-celebration-2026.css
)

copy /Y "frontend\js\festival-mode-config.js" "ios\App\App\public\js\" >nul
if errorlevel 1 (
    echo ❌ Failed to copy config JS to iOS
) else (
    echo    ✓ festival-mode-config.js
)

copy /Y "frontend\js\festival-mode-integration.js" "ios\App\App\public\js\" >nul
if errorlevel 1 (
    echo ❌ Failed to copy integration JS to iOS
) else (
    echo    ✓ festival-mode-integration.js
)

echo.
echo ✅ iOS deployment complete
echo.

REM ═══════════════════════════════════════════════════════════════════════════
REM Deploy to Android
REM ═══════════════════════════════════════════════════════════════════════════
echo 🤖 Deploying to Android...
echo.

if not exist "android\app\src\main\assets\public\css" mkdir "android\app\src\main\assets\public\css"
if not exist "android\app\src\main\assets\public\js" mkdir "android\app\src\main\assets\public\js"

copy /Y "frontend\css\gurpurab-celebration-2026.css" "android\app\src\main\assets\public\css\" >nul
if errorlevel 1 (
    echo ❌ Failed to copy CSS to Android
) else (
    echo    ✓ gurpurab-celebration-2026.css
)

copy /Y "frontend\js\festival-mode-config.js" "android\app\src\main\assets\public\js\" >nul
if errorlevel 1 (
    echo ❌ Failed to copy config JS to Android
) else (
    echo    ✓ festival-mode-config.js
)

copy /Y "frontend\js\festival-mode-integration.js" "android\app\src\main\assets\public\js\" >nul
if errorlevel 1 (
    echo ❌ Failed to copy integration JS to Android
) else (
    echo    ✓ festival-mode-integration.js
)

echo.
echo ✅ Android deployment complete
echo.

REM ═══════════════════════════════════════════════════════════════════════════
REM Summary
REM ═══════════════════════════════════════════════════════════════════════════
echo ════════════════════════════════════════════════════════════
echo  ✅ DEPLOYMENT COMPLETE
echo ════════════════════════════════════════════════════════════
echo.
echo 📄 Files deployed:
echo    - gurpurab-celebration-2026.css
echo    - festival-mode-config.js  
echo    - festival-mode-integration.js
echo.
echo 📱 iOS:   ios\App\App\public\
echo 🤖 Android: android\app\src\main\assets\public\
echo.
echo ⚠️  NEXT STEPS:
echo    1. Update index.html in iOS and Android (if not already done)
echo    2. Test on iOS Simulator/Device
echo    3. Test on Android Emulator/Device
echo    4. Verify animations are smooth
echo    5. Check battery impact
echo.
echo 📖 Full documentation: GURPURAB_CELEBRATION_MODE_2026.md
echo.
pause
