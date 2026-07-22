@echo off
echo ================================================
echo ANHAD APP - VERSION BUMP HELPER
echo ================================================
echo.
echo Current Version Info:
echo.

findstr /C:"versionCode" android\app\build.gradle
findstr /C:"versionName" android\app\build.gradle

echo.
echo ================================================
echo To bump version manually:
echo 1. Edit: android\app\build.gradle
echo 2. Find the defaultConfig section
echo 3. Increment versionCode (must be unique)
echo 4. Update versionName (display version)
echo.
echo Example:
echo   versionCode 3  →  versionCode 4
echo   versionName "1.0.2"  →  versionName "1.0.3"
echo.
echo After changing version, run: build-release.bat
echo ================================================
echo.

set /p version="Enter new versionCode number (current is 3): "
if "%version%"=="" (
    echo No version entered. Exiting.
    pause
    exit /b 0
)

set /p versionName="Enter new versionName (e.g., 1.0.3): "
if "%versionName%"=="" (
    echo No versionName entered. Exiting.
    pause
    exit /b 0
)

echo.
echo You entered:
echo   versionCode: %version%
echo   versionName: "%versionName%"
echo.
set /p confirm="Is this correct? (Y/N): "

if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo ⚠️ Manual Edit Required:
echo 1. Open: android\app\build.gradle
echo 2. Change versionCode to: %version%
echo 3. Change versionName to: "%versionName%"
echo 4. Save the file
echo 5. Run: build-release.bat
echo.
echo Opening file in notepad...
notepad android\app\build.gradle

pause
