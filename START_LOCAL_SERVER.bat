@echo off
echo ========================================
echo   ANHAD Local Server Starter
echo ========================================
echo.
echo This will start a local web server for testing.
echo Audio files will work properly with this server.
echo.

cd /d "%~dp0frontend"

echo Checking for Python...
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Python found! Starting server on port 8000...
    echo.
    echo ========================================
    echo   Server is running!
    echo ========================================
    echo.
    echo Opening browser to test page...
    start http://localhost:8000/test-audio-simple.html
    echo.
    echo You can also visit:
    echo   - Main App: http://localhost:8000/index.html
    echo   - Audio Test: http://localhost:8000/test-audio-simple.html
    echo   - Notification Test: http://localhost:8000/test-notification-system.html
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    python -m http.server 8000
    goto :end
)

echo Python not found. Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Node.js found! Starting server on port 8000...
    echo.
    echo ========================================
    echo   Server is running!
    echo ========================================
    echo.
    echo Opening browser to test page...
    start http://localhost:8000/test-audio-simple.html
    echo.
    echo You can also visit:
    echo   - Main App: http://localhost:8000/index.html
    echo   - Audio Test: http://localhost:8000/test-audio-simple.html
    echo   - Notification Test: http://localhost:8000/test-notification-system.html
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    call npx http-server -p 8000
    goto :end
)

echo.
echo ========================================
echo   ERROR: No server available
echo ========================================
echo.
echo Neither Python nor Node.js is installed.
echo.
echo Please install one of the following:
echo   1. Python: https://www.python.org/downloads/
echo   2. Node.js: https://nodejs.org/
echo.
echo Or use VS Code with Live Server extension:
echo   1. Open VS Code
echo   2. Install "Live Server" extension
echo   3. Right-click index.html
echo   4. Select "Open with Live Server"
echo.
pause
goto :end

:end
