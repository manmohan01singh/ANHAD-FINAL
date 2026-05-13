@echo off
echo 🔄 Creating all frontend icons from original logo...

REM Check if source logo exists
if not exist "anhad_icon_clay3d_1778009424671.png" (
    echo ❌ Error: Source logo not found
    pause
    exit /b
)

echo 📱 Creating all frontend icon sizes...

REM Create all frontend icons from original logo
echo ✅ Creating 72x72...
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-72x72.png" /Y

echo ✅ Creating 96x96...
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-96x96.png" /Y

echo ✅ Creating 128x128...
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-128x128.png" /Y

echo ✅ Creating 144x144...
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-144x144.png" /Y

echo ✅ Creating 152x152...
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-152x152.png" /Y

echo ✅ Creating 180x180...
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-180x180.png" /Y

echo ✅ Creating 192x192...
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-192x192.png" /Y

echo ✅ Creating 256x256...
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-256x256.png" /Y

echo ✅ Creating 384x384...
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-384x384.png" /Y

echo ✅ Creating 512x512...
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-512x512.png" /Y

echo ✅ Creating 1024x1024...
copy "anhad_icon_clay3d_1778009424671.png" "frontend\assets\icons\icon-1024x1024.png" /Y

echo 🎉 All frontend icons created!
echo Listing all frontend icons:
dir "frontend\assets\icons\icon-*.png" /B
pause
