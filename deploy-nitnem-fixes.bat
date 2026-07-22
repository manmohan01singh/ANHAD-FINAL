@echo off
echo ════════════════════════════════════════════════════════════
echo   NITNEM TRACKER FIXES - DEPLOYMENT SCRIPT
echo ════════════════════════════════════════════════════════════
echo.

echo [1/4] Copying Nitnem Tracker JS to iOS...
xcopy /Y "frontend\NitnemTracker\nitnem-tracker.js" "ios\App\App\public\NitnemTracker\"
if %errorlevel% neq 0 echo ⚠️  iOS JS copy failed

echo [2/4] Copying Nitnem Tracker HTML to iOS...
xcopy /Y "frontend\NitnemTracker\nitnem-tracker.html" "ios\App\App\public\NitnemTracker\"
if %errorlevel% neq 0 echo ⚠️  iOS HTML copy failed

echo [3/4] Copying Homepage Data JS to iOS...
xcopy /Y "frontend\js\homepage-data.js" "ios\App\App\public\js\"
if %errorlevel% neq 0 echo ⚠️  iOS homepage-data copy failed

echo [4/4] Copying to Android assets...
xcopy /Y "frontend\NitnemTracker\nitnem-tracker.js" "android\app\src\main\assets\public\NitnemTracker\"
xcopy /Y "frontend\NitnemTracker\nitnem-tracker.html" "android\app\src\main\assets\public\NitnemTracker\"
xcopy /Y "frontend\js\homepage-data.js" "android\app\src\main\assets\public\js\"
if %errorlevel% neq 0 echo ⚠️  Android copy failed

echo.
echo ════════════════════════════════════════════════════════════
echo   ✅ DEPLOYMENT COMPLETE!
echo ════════════════════════════════════════════════════════════
echo.
echo   Changes Applied:
echo   • Real-time progress updates
echo   • Progress bar recalculation fix
echo   • Improved pending banis UI
echo.
echo   Next Steps:
echo   1. Test in browser: Open frontend/index.html
echo   2. Rebuild iOS: npx cap sync ios
echo   3. Rebuild Android: npx cap sync android
echo.
pause
