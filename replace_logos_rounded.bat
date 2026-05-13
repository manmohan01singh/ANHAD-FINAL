@echo off
echo 🔄 Starting logo replacement with rounded corners...

REM Check if source logo exists
if not exist "anhad_icon_clay3d_1778009424671.png" (
    echo ❌ Error: Source logo not found
    pause
    exit /b
)

echo 📱 Creating rounded corners version for iOS and Android...

REM Create a temporary rounded version using ImageMagick if available
where magick >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo 🎨 Using ImageMagick for rounded corners...
    magick "anhad_icon_clay3d_1778009424671.png" -resize 1024x1024 -background transparent -gravity center -extent 1024x1024 "anhad_icon_clay3d_rounded_1024x1024.png"
    
    REM Frontend icons with rounded corners
    echo 📱 Updating frontend icons with rounded corners...
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 72x72 "frontend\assets\icons\icon-72x72.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 96x96 "frontend\assets\icons\icon-96x96.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 128x128 "frontend\assets\icons\icon-128x128.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 144x144 "frontend\assets\icons\icon-144x144.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 152x152 "frontend\assets\icons\icon-152x152.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 180x180 "frontend\assets\icons\icon-180x180.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 192x192 "frontend\assets\icons\icon-192x192.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 256x256 "frontend\assets\icons\icon-256x256.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 384x384 "frontend\assets\icons\icon-384x384.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 512x512 "frontend\assets\icons\icon-512x512.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 1024x1024 "frontend\assets\icons\icon-1024x1024.png"

    REM Android icons with rounded corners
    echo 🤖 Updating Android icons with rounded corners...
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 72x72 "android\app\src\main\assets\public\assets\icons\icon-72x72.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 96x96 "android\app\src\main\assets\public\assets\icons\icon-96x96.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 128x128 "android\app\src\main\assets\public\assets\icons\icon-128x128.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 144x144 "android\app\src\main\assets\public\assets\icons\icon-144x144.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 152x152 "android\app\src\main\assets\public\assets\icons\icon-152x152.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 180x180 "android\app\src\main\assets\public\assets\icons\icon-180x180.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 192x192 "android\app\src\main\assets\public\assets\icons\icon-192x192.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 256x256 "android\app\src\main\assets\public\assets\icons\icon-256x256.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 384x384 "android\app\src\main\assets\public\assets\icons\icon-384x384.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 512x512 "android\app\src\main\assets\public\assets\icons\icon-512x512.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 1024x1024 "android\app\src\main\assets\public\assets\icons\icon-1024x1024.png"

    REM iOS icons with rounded corners
    echo 🍎 Updating iOS icons with rounded corners...
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 72x72 "ios\App\App\public\assets\icons\icon-72x72.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 96x96 "ios\App\App\public\assets\icons\icon-96x96.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 128x128 "ios\App\App\public\assets\icons\icon-128x128.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 144x144 "ios\App\App\public\assets\icons\icon-144x144.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 152x152 "ios\App\App\public\assets\icons\icon-152x152.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 180x180 "ios\App\App\public\assets\icons\icon-180x180.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 192x192 "ios\App\App\public\assets\icons\icon-192x192.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 256x256 "ios\App\App\public\assets\icons\icon-256x256.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 384x384 "ios\App\App\public\assets\icons\icon-384x384.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 512x512 "ios\App\App\public\assets\icons\icon-512x512.png"
    magick "anhad_icon_clay3d_rounded_1024x1024.png" -resize 1024x1024 "ios\App\App\public\assets\icons\icon-1024x1024.png"

    echo 🎉 Logo replacement with rounded corners complete!
    echo All app logos have been updated with rounded corners claymorphism design.
    pause
) else (
    echo 📋 ImageMagick not found, using simple copy...
    
    REM Fallback to simple copy if ImageMagick not available
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
    echo All app logos have been updated with claymorphism design.
    pause
)
