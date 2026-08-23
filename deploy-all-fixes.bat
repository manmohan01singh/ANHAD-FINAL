@echo off
echo ================================================
echo DEPLOYING ALL CRITICAL FIXES
echo ================================================
echo.

echo [1/5] Copying desktop sidebar fixes to iOS and Android...
copy /Y "frontend\lib\desktop-sidebar.js" "ios\App\App\public\lib\desktop-sidebar.js"
copy /Y "frontend\lib\desktop-sidebar.js" "android\app\src\main\assets\public\lib\desktop-sidebar.js"

echo [2/5] Copying desktop responsive CSS to iOS and Android...
copy /Y "frontend\css\desktop-responsive.css" "ios\App\App\public\css\desktop-responsive.css"
copy /Y "frontend\css\desktop-responsive.css" "android\app\src\main\assets\public\css\desktop-responsive.css"

echo [3/5] Copying Nitnem reader fixes to iOS and Android...
copy /Y "frontend\nitnem\reader.html" "ios\App\App\public\nitnem\reader.html"
copy /Y "frontend\nitnem\reader.html" "android\app\src\main\assets\public\nitnem\reader.html"
copy /Y "frontend\nitnem\css\reader.css" "ios\App\App\public\nitnem\css\reader.css"
copy /Y "frontend\nitnem\css\reader.css" "android\app\src\main\assets\public\nitnem\css\reader.css"

echo [4/5] Copying Gurbani Khoj fixes to iOS and Android...
copy /Y "frontend\GurbaniKhoj\gurbani-khoj.css" "ios\App\App\public\GurbaniKhoj\gurbani-khoj.css"
copy /Y "frontend\GurbaniKhoj\gurbani-khoj.css" "android\app\src\main\assets\public\GurbaniKhoj\gurbani-khoj.css"

echo [5/5] Copying Sehaj Paath fixes to iOS and Android...
copy /Y "frontend\SehajPaath\reader.css" "ios\App\App\public\SehajPaath\reader.css"
copy /Y "frontend\SehajPaath\reader.css" "android\app\src\main\assets\public\SehajPaath\reader.css"

echo.
echo ================================================
echo DEPLOYMENT COMPLETE!
echo ================================================
echo.
echo NEXT STEPS:
echo 1. Clear browser cache (Ctrl+Shift+Delete)
echo 2. Hard refresh (Ctrl+F5) on each page
echo 3. Or restart your development server
echo.
echo Fixed pages:
echo  - Desktop Sidebar (Dashboard removed)
echo  - Nitnem Reader (Premium fonts)
echo  - Sehaj Paath Reader (Premium fonts)
echo  - Gurbani Khoj (Search bar fixed)
echo  - Sadhsangat + Favorites (Scrolling fixed)
echo.
pause
