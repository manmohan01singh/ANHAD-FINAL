@echo off
echo ================================
echo INSTANT NAVIGATION - DEPLOYMENT
echo ================================
echo.
echo This script will sync the instant navigation optimizations
echo to your Capacitor Android and iOS projects.
echo.
pause

echo.
echo [1/3] Syncing Capacitor projects...
call npx cap sync
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed
    pause
    exit /b 1
)

echo.
echo [2/3] Copying web assets...
call npx cap copy
if %errorlevel% neq 0 (
    echo ERROR: Asset copy failed
    pause
    exit /b 1
)

echo.
echo [3/3] Opening projects for testing...
echo.
echo Choose platform to test:
echo [1] Android
echo [2] iOS  
echo [3] Both
echo [4] Skip
echo.
set /p choice="Enter choice (1-4): "

if "%choice%"=="1" (
    echo Opening Android Studio...
    call npx cap open android
)
if "%choice%"=="2" (
    echo Opening Xcode...
    call npx cap open ios
)
if "%choice%"=="3" (
    echo Opening Android Studio...
    start npx cap open android
    timeout /t 3 >nul
    echo Opening Xcode...
    call npx cap open ios
)

echo.
echo ================================
echo DEPLOYMENT COMPLETE! 
echo ================================
echo.
echo Next steps:
echo 1. Test the instant navigation in the app
echo 2. Navigate: Home -^> Any Page -^> Back to Home
echo 3. Verify ^< 16ms instant response (no delay)
echo.
echo For detailed testing instructions, see:
echo TEST_INSTANT_NAVIGATION.md
echo.
pause
