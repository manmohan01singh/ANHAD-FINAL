@echo off
echo ========================================
echo ANHAD Logo Verification
echo ========================================
echo.

cd /d "%~dp0"

echo Checking generated logos...
echo.
python verify-logos.py

echo.
pause
