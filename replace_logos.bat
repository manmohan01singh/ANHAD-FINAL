@echo off
echo 🔄 Starting logo replacement...

REM Check if source logo exists
if not exist "anhad_icon_clay3d_1778009424671.png" (
    echo ❌ Error: Source logo not found
    pause
    exit /b
)

REM Frontend icons
echo 📱 Updating frontend icons...
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-72x72.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-96x96.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-128x128.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-144x144.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-152x152.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-180x180.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-192x192.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-256x256.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-384x384.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-512x512.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-1024x1024.png" /Y

REM Android icons
echo 🤖 Updating Android icons...
copy "anhad_icon_clay3d_1778009424671.png" "android\app\src\main\assets\public\assets\icons\icon-72x72.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "android\app\src\main\assets\public\assets\icons\icon-96x96.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "android\app\src\main\assets\public\assets\icons\icon-128x128.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "android\app\src\main\assets\public\assets\icons\icon-144x144.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "android\app\src\main\assets\public\assets\icons\icon-152x152.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "android\app\src\main\assets\public\assets\icons\icon-180x180.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "android\app\src\main\assets\public\assets\icons\icon-192x192.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "android\app\src\main\assets\public\assets\icons\icon-256x256.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "android\app\src\main\assets\public\assets\icons\icon-384x384.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "android\app\src\main\assets\public\assets\icons\icon-512x512.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "android\app\src\main\assets\public\assets\icons\icon-1024x1024.png" /Y

REM iOS icons
echo 🍎 Updating iOS icons...
copy "anhad_icon_clay3d_1778009424671.png" "ios\App\App\public\assets\icons\icon-72x72.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "ios\App\App\public\assets\icons\icon-96x96.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "ios\App\App\public\assets\icons\icon-128x128.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "ios\App\App\public\assets\icons\icon-144x144.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "ios\App\App\public\assets\icons\icon-152x152.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "ios\App\App\public\assets\icons\icon-180x180.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "ios\App\App\public\assets\icons\icon-192x192.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "ios\App\App\public\assets\icons\icon-256x256.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "ios\App\App\public\assets\icons\icon-384x384.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "ios\App\App\public\assets\icons\icon-512x512.png" /Y
copy "anhad_icon_clay3d_1778009424671.png" "ios\App\App\public\assets\icons\icon-1024x1024.png" /Y

echo 🎉 Logo replacement complete!
echo All app logos have been updated with the new claymorphism design.
pause
