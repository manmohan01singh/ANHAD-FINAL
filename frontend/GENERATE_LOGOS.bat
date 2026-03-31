@echo off
echo ========================================
echo ANHAD Logo Generator
echo ========================================
echo.

cd /d "%~dp0"

echo Checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python not found! Please install Python first.
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo.
echo Checking for Pillow library...
python -c "import PIL" >nul 2>&1
if %errorlevel% neq 0 (
    echo Pillow not found. Installing...
    pip install Pillow
    if %errorlevel% neq 0 (
        echo Failed to install Pillow!
        pause
        exit /b 1
    )
)

echo.
echo Generating logos from newlogo-removebg-preview.png...
echo.
python generate-logos-simple.py

echo.
echo ========================================
echo Done! Check the assets folder.
echo ========================================
pause
