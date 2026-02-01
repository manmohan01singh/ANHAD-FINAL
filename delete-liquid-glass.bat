@echo off
echo Deleting liquid-glass-app folder...
timeout /t 3
rd /s /q "%~dp0frontend\liquid-glass-app"
if exist "%~dp0frontend\liquid-glass-app" (
    echo Failed to delete. Please close all programs and try again.
) else (
    echo Successfully deleted!
)
pause
