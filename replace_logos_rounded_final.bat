@echo off
echo 🔄 Starting logo replacement with rounded corners...

REM Check if source logo exists
if not exist "anhad_icon_clay3d_1778009424671.png" (
    echo ❌ Error: Source logo not found
    pause
    exit /b
)

echo 📱 Creating rounded logo with proper corners...

REM Create SVG to PNG conversion using ImageMagick
echo 🎨 Converting SVG to rounded PNG...
magick "anhad_logo_rounded.svg" -background transparent -resize 1024x1024 "anhad_logo_rounded_1024x1024.png"

REM Generate all icon sizes from the rounded master
echo 📱 Generating all icon sizes...

REM Frontend icons
echo 📱 Updating frontend icons...
magick "anhad_logo_rounded_1024x1024.png" -resize 72x72 "frontend\assets\icons\icon-72x72.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 96x96 "frontend\assets\icons\icon-96x96.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 128x128 "frontend\assets\icons\icon-128x128.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 144x144 "frontend\assets\icons\icon-144x144.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 152x152 "frontend\assets\icons\icon-152x152.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 180x180 "frontend\assets\icons\icon-180x180.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 192x192 "frontend\assets\icons\icon-192x192.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 256x256 "frontend\assets\icons\icon-256x256.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 384x384 "frontend\assets\icons\icon-384x384.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 512x512 "frontend\assets\icons\icon-512x512.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 1024x1024 "frontend\assets\icons\icon-1024x1024.png"

REM Android icons
echo 🤖 Updating Android icons...
magick "anhad_logo_rounded_1024x1024.png" -resize 72x72 "android\app\src\main\assets\public\assets\icons\icon-72x72.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 96x96 "android\app\src\main\assets\public\assets\icons\icon-96x96.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 128x128 "android\app\src\main\assets\public\assets\icons\icon-128x128.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 144x144 "android\app\src\main\assets\public\assets\icons\icon-144x144.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 152x152 "android\app\src\main\assets\public\assets\icons\icon-152x152.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 180x180 "android\app\src\main\assets\public\assets\icons\icon-180x180.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 192x192 "android\app\src\main\assets\public\assets\icons\icon-192x192.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 256x256 "android\app\src\main\assets\public\assets\icons\icon-256x256.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 384x384 "android\app\src\main\assets\public\assets\icons\icon-384x384.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 512x512 "android\app\src\main\assets\public\assets\icons\icon-512x512.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 1024x1024 "android\app\src\main\assets\public\assets\icon-1024x1024.png"

REM iOS icons
echo 🍎 Updating iOS icons...
magick "anhad_logo_rounded_1024x1024.png" -resize 72x72 "ios\App\App\public\assets\icons\icon-72x72.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 96x96 "ios\App\App\public\assets\icons\icon-96x96.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 128x128 "ios\App\App\public\assets\icons\icon-128x128.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 144x144 "ios\App\App\public\assets\icons\icon-144x144.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 152x152 "ios\App\App\public\assets\icons\icon-152x152.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 180x180 "ios\App\App\public\assets\icons\icon-180x180.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 192x192 "ios\App\App\public\assets\icons\icon-192x192.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 256x256 "ios\App\App\public\assets\icons\icon-256x256.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 384x384 "ios\App\App\public\assets\icons\icon-384x384.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 512x512 "ios\App\App\public\assets\icons\icon-512x512.png"
magick "anhad_logo_rounded_1024x1024.png" -resize 1024x1024 "ios\App\App\public\assets\icons\icon-1024x1024.png"

echo 🎉 Logo replacement with rounded corners complete!
echo All app logos have been updated with rounded corners claymorphism design.
pause
