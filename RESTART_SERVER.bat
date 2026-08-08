@echo off
echo ====================================
echo RESTART DEVELOPMENT SERVER
echo ====================================
echo.
echo Fixes are confirmed in code!
echo But server needs restart to load them.
echo.
echo Steps:
echo 1. Press Ctrl+C in your server terminal
echo 2. Run this batch file again, OR
echo 3. Run: npm run dev
echo.
echo After server restarts:
echo - Hard refresh browser: Ctrl+Shift+R
echo - Check Guru image (should be SGGS)
echo - Check Export (should show modal)
echo.
pause
cd /d "c:\Users\Manmohan Singh\OneDrive\Desktop\APP\ANHAD-FINAL\frontend"
npm run dev
