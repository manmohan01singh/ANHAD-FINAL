@echo off
echo 🔄 Creating missing frontend icons...

REM Source logo
set "sourceLogo=anhad_icon_clay3d_1778009424671.png"

if not exist "%sourceLogo%" (
    echo ❌ Error: Source logo not found
    pause
    exit /b
)

echo 📱 Creating missing frontend icon sizes...

REM Create missing sizes
if not exist "frontend\assets\icons\icon-96x96.png" (
    echo ✅ Creating 96x96...
    copy "%sourceLogo%" "frontend\assets\icons\icon-96x96.png" /Y
)

if not exist "frontend\assets\icons\icon-128x128.png" (
    echo ✅ Creating 128x128...
    copy "%sourceLogo%" "frontend\assets\icons\icon-128x128.png" /Y
)

if not exist "frontend\assets\icons\icon-144x144.png" (
    echo ✅ Creating 144x144...
    copy "%sourceLogo%" "frontend\assets\icons\icon-144x144.png" /Y
)

if not exist "frontend\assets\icons\icon-180x180.png" (
    echo ✅ Creating 180x180...
    copy "%sourceLogo%" "frontend\assets\icons\icon-180x180.png" /Y
)

if not exist "frontend\assets\icons\icon-256x256.png" (
    echo ✅ Creating 256x256...
    copy "%sourceLogo%" "frontend\assets\icons\icon-256x256.png" /Y
)

if not exist "frontend\assets\icons\icon-384x384.png" (
    echo ✅ Creating 384x384...
    copy "%sourceLogo%" "frontend\assets\icons\icon-384x384.png" /Y
)

echo 🎉 Missing frontend icons created!
echo Listing all frontend icons:
Get-ChildItem "frontend\assets\icons\icon-*.png" | Select-Object Name, Length
pause
