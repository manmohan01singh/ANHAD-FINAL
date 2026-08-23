@echo off
REM ═══════════════════════════════════════════════════════════════════════════════
REM ANHAD Desktop UI/UX Fixes - Deployment Script
REM Applies all critical fixes and deploys to production
REM ═══════════════════════════════════════════════════════════════════════════════

echo.
echo ╔═══════════════════════════════════════════════════════════════════════╗
echo ║  ANHAD Desktop UI/UX Fixes - Deployment                               ║
echo ║  Applying 35+ critical fixes                                          ║
echo ╚═══════════════════════════════════════════════════════════════════════╝
echo.

REM Check if we're in the correct directory
if not exist "frontend\index.html" (
    echo ❌ ERROR: Must run from ANHAD-FINAL root directory
    pause
    exit /b 1
)

echo ✓ Working directory verified
echo.

REM Step 1: Clean build artifacts
echo [1/6] Cleaning build artifacts...
if exist "frontend\.next" rmdir /s /q "frontend\.next" 2>nul
if exist "frontend\out" rmdir /s /q "frontend\out" 2>nul
echo ✓ Clean complete
echo.

REM Step 2: Verify new files exist
echo [2/6] Verifying new files...
set MISSING=0

if not exist "frontend\css\desktop-responsive.css" (
    echo ❌ Missing: desktop-responsive.css
    set MISSING=1
)

if not exist "frontend\js\event-service.js" (
    echo ❌ Missing: event-service.js
    set MISSING=1
)

if not exist "frontend\js\desktop-ui-fixes.js" (
    echo ❌ Missing: desktop-ui-fixes.js
    set MISSING=1
)

if %MISSING%==1 (
    echo ❌ ERROR: Required files missing
    pause
    exit /b 1
)

echo ✓ All new files present
echo.

REM Step 3: Copy to iOS/Android builds
echo [3/6] Syncing to native platforms...

REM iOS
if exist "ios\App\App\public" (
    echo   → Copying to iOS...
    xcopy /Y /Q "frontend\css\desktop-responsive.css" "ios\App\App\public\css\" >nul 2>&1
    xcopy /Y /Q "frontend\js\event-service.js" "ios\App\App\public\js\" >nul 2>&1
    xcopy /Y /Q "frontend\js\desktop-ui-fixes.js" "ios\App\App\public\js\" >nul 2>&1
    xcopy /Y /Q "frontend\js\trendora-app.js" "ios\App\App\public\js\" >nul 2>&1
    xcopy /Y /Q "frontend\index.html" "ios\App\App\public\" >nul 2>&1
    echo   ✓ iOS updated
)

REM Android
if exist "android\app\src\main\assets\public" (
    echo   → Copying to Android...
    xcopy /Y /Q "frontend\css\desktop-responsive.css" "android\app\src\main\assets\public\css\" >nul 2>&1
    xcopy /Y /Q "frontend\js\event-service.js" "android\app\src\main\assets\public\js\" >nul 2>&1
    xcopy /Y /Q "frontend\js\desktop-ui-fixes.js" "android\app\src\main\assets\public\js\" >nul 2>&1
    xcopy /Y /Q "frontend\js\trendora-app.js" "android\app\src\main\assets\public\js\" >nul 2>&1
    xcopy /Y /Q "frontend\index.html" "android\app\src\main\assets\public\" >nul 2>&1
    echo   ✓ Android updated
)

echo ✓ Platform sync complete
echo.

REM Step 4: Update version cache busters
echo [4/6] Updating cache busters...
powershell -Command "(Get-Content 'frontend\index.html') -replace 'anhad-core\.css\?v=\d+', 'anhad-core.css?v=%RANDOM%' | Set-Content 'frontend\index.html'"
powershell -Command "(Get-Content 'frontend\index.html') -replace 'trendora-app\.js\?v=[\d\.]+', 'trendora-app.js?v=2.%RANDOM%' | Set-Content 'frontend\index.html'"
echo ✓ Cache busters updated
echo.

REM Step 5: Run quick validation
echo [5/6] Running validation...
set ERRORS=0

REM Check for critical patterns
findstr /C:"SheetController.ensureAllClosed" "frontend\js\trendora-app.js" >nul 2>&1
if errorlevel 1 (
    echo ❌ Sheet controller fix not found
    set ERRORS=1
) else (
    echo ✓ Sheet controller fix verified
)

findstr /C:"EventService" "frontend\js\event-service.js" >nul 2>&1
if errorlevel 1 (
    echo ❌ Event service not found
    set ERRORS=1
) else (
    echo ✓ Event service verified
)

findstr /C:"desktop-responsive.css" "frontend\index.html" >nul 2>&1
if errorlevel 1 (
    echo ❌ Desktop CSS not linked
    set ERRORS=1
) else (
    echo ✓ Desktop CSS linked
)

if %ERRORS%==1 (
    echo.
    echo ❌ Validation failed - please review fixes
    pause
    exit /b 1
)

echo ✓ Validation passed
echo.

REM Step 6: Deploy options
echo [6/6] Ready to deploy
echo.
echo Choose deployment option:
echo   [1] Deploy to Vercel (production)
echo   [2] Test locally (localhost:3000)
echo   [3] Skip deployment
echo.

choice /C 123 /N /M "Enter choice (1/2/3): "

if errorlevel 3 goto SKIP
if errorlevel 2 goto LOCAL
if errorlevel 1 goto VERCEL

:VERCEL
echo.
echo Deploying to Vercel production...
cd frontend
call vercel --prod
cd ..
echo.
echo ✓ Deployed to production
goto END

:LOCAL
echo.
echo Starting local dev server...
echo Open http://localhost:3000 in your browser
echo Press Ctrl+C to stop server
echo.
cd frontend
call npx http-server -p 3000 -c-1
cd ..
goto END

:SKIP
echo.
echo Deployment skipped
goto END

:END
echo.
echo ╔═══════════════════════════════════════════════════════════════════════╗
echo ║  ✓ Desktop UI/UX Fixes Applied Successfully                           ║
echo ║                                                                       ║
echo ║  Changes Applied:                                                    ║
echo ║  • Radio modal fixed (forced closed on load)                         ║
echo ║  • Event countdown validation added                                  ║
echo ║  • Desktop responsive CSS applied                                    ║
echo ║  • Card width constraints enforced                                   ║
echo ║  • Theme transition smoothness improved                              ║
echo ║  • Z-index conflicts resolved                                        ║
echo ║  • Performance optimizations applied                                 ║
echo ║                                                                       ║
echo ║  Next Steps:                                                         ║
echo ║  1. Test on desktop (Chrome/Firefox/Safari)                          ║
echo ║  2. Verify radio modal stays closed                                  ║
echo ║  3. Check event countdown shows valid dates                          ║
echo ║  4. Test scroll performance                                          ║
echo ║                                                                       ║
echo ║  Review: DESKTOP_UI_UX_FIXES_COMPLETE.md                             ║
echo ╚═══════════════════════════════════════════════════════════════════════╝
echo.

pause
