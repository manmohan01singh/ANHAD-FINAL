@echo off
echo ========================================
echo  Deploying Guru Image Fixes
echo ========================================
echo.

REM Copy files to iOS public folder (if using Capacitor)
if exist "ios\App\App\public\" (
    echo Copying index.html to iOS...
    copy /Y "frontend\index.html" "ios\App\App\public\index.html"
    
    echo Copying CSS to iOS...
    if not exist "ios\App\App\public\css\" mkdir "ios\App\App\public\css\"
    copy /Y "frontend\css\responsive-fix.css" "ios\App\App\public\css\responsive-fix.css"
    
    echo.
    echo iOS files updated!
)

REM Copy files to Android assets (if using Capacitor)
if exist "android\app\src\main\assets\public\" (
    echo Copying index.html to Android...
    copy /Y "frontend\index.html" "android\app\src\main\assets\public\index.html"
    
    echo Copying CSS to Android...
    if not exist "android\app\src\main\assets\public\css\" mkdir "android\app\src\main\assets\public\css\"
    copy /Y "frontend\css\responsive-fix.css" "android\app\src\main\assets\public\css\responsive-fix.css"
    
    echo.
    echo Android files updated!
)

echo.
echo ========================================
echo  IMPORTANT: Clear Browser Cache!
echo ========================================
echo.
echo Press Ctrl+Shift+R in your browser
echo OR
echo Open in Incognito/Private mode
echo.
echo Files have been deployed.
pause
