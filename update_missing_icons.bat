@echo off
echo 🔄 Updating missing frontend icons...

REM Check if source logo exists
if not exist "anhad_logo_rounded_1024x1024.png" (
    echo ❌ Error: Rounded logo not found, creating from original...
    if exist "anhad_icon_clay3d_1778009424671.png" (
        echo 🎨 Creating rounded version...
        magick "anhad_icon_clay3d_1778009424671.png" -background transparent -gravity center -extent 1024x1024 "anhad_logo_rounded_1024x1024.png"
    ) else (
        echo ❌ Original logo also not found
        pause
        exit /b
    )
)

REM Generate all missing icon sizes
echo 📱 Generating all frontend icon sizes...

if not exist "frontend\assets\icons\icon-72x72.png" (
    echo ✅ Creating 72x72...
    magick "anhad_logo_rounded_1024x1024.png" -resize 72x72 "frontend\assets\icons\icon-72x72.png"
)

if not exist "frontend\assets\icons\icon-96x96.png" (
    echo ✅ Creating 96x96...
    magick "anhad_logo_rounded_1024x1024.png" -resize 96x96 "frontend\assets\icons\icon-96x96.png"
)

if not exist "frontend\assets\icons\icon-128x128.png" (
    echo ✅ Creating 128x128...
    magick "anhad_logo_rounded_1024x1024.png" -resize 128x128 "frontend\assets\icons\icon-128x128.png"
)

if not exist "frontend\assets\icons\icon-144x144.png" (
    echo ✅ Creating 144x144...
    magick "anhad_logo_rounded_1024x1024.png" -resize 144x144 "frontend\assets\icons\icon-144x144.png"
)

if not exist "frontend\assets\icons\icon-152x152.png" (
    echo ✅ Creating 152x152...
    magick "anhad_logo_rounded_1024x1024.png" -resize 152x152 "frontend\assets\icons\icon-152x152.png"
)

if not exist "frontend\assets\icons\icon-180x180.png" (
    echo ✅ Creating 180x180...
    magick "anhad_logo_rounded_1024x1024.png" -resize 180x180 "frontend\assets\icons\icon-180x180.png"
)

if not exist "frontend\assets\icons\icon-192x192.png" (
    echo ✅ Creating 192x192...
    magick "anhad_logo_rounded_1024x1024.png" -resize 192x192 "frontend\assets\icons\icon-192x192.png"
)

if not exist "frontend\assets\icons\icon-256x256.png" (
    echo ✅ Creating 256x256...
    magick "anhad_logo_rounded_1024x1024.png" -resize 256x256 "frontend\assets\icons\icon-256x256.png"
)

if not exist "frontend\assets\icons\icon-384x384.png" (
    echo ✅ Creating 384x384...
    magick "anhad_logo_rounded_1024x1024.png" -resize 384x384 "frontend\assets\icons\icon-384x384.png"
)

if not exist "frontend\assets\icons\icon-512x512.png" (
    echo ✅ Creating 512x512...
    magick "anhad_logo_rounded_1024x1024.png" -resize 512x512 "frontend\assets\icons\icon-512x512.png"
)

if not exist "frontend\assets\icons\icon-1024x1024.png" (
    echo ✅ Creating 1024x1024...
    magick "anhad_logo_rounded_1024x1024.png" -resize 1024x1024 "frontend\assets\icons\icon-1024x1024.png"
)

echo 🎉 All frontend icons updated!
echo Listing all frontend icons:
dir "frontend\assets\icons\icon-*.png" /B
pause
