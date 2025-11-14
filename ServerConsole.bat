@echo off
echo ============================================
echo    SimplePOS Server Management Console
echo ============================================
echo.
echo Choose an option:
echo [1] Start Server (PM2)
echo [2] Start Server (Direct)
echo [3] Check Server Status
echo [4] Stop Server
echo [5] View Server Logs
echo [6] Setup Auto-Startup
echo [7] Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto start_pm2
if "%choice%"=="2" goto start_direct
if "%choice%"=="3" goto status
if "%choice%"=="4" goto stop
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto autostart
if "%choice%"=="7" goto exit

echo Invalid choice. Please try again.
pause
goto start

:start_pm2
echo Starting server with PM2...
cd /d "%~dp0backend"
pm2 start server.js --name "simplepos-backend" 2>nul
if errorlevel 1 (
    echo PM2 not found. Installing PM2...
    npm install -g pm2
    pm2 start server.js --name "simplepos-backend"
)
echo Server started! Check http://localhost:5000/health
pause
goto start

:start_direct
echo Starting server directly...
cd /d "%~dp0backend"
start "SimplePOS Backend" node server.js
echo Server started! Check http://localhost:5000/health
pause
goto start

:status
echo Checking server status...
pm2 list 2>nul
if errorlevel 1 (
    echo PM2 not available. Checking port 5000...
    netstat -ano | findstr :5000 >nul 2>&1
    if errorlevel 1 (
        echo Server does NOT appear to be running.
    ) else (
        echo Server appears to be RUNNING on port 5000.
    )
)
pause
goto start

:stop
echo Stopping server...
pm2 stop "simplepos-backend" 2>nul
pm2 delete "simplepos-backend" 2>nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq server.js" 2>nul
echo Server stopped.
pause
goto start

:logs
echo Opening server logs...
pm2 logs "simplepos-backend" 2>nul
if errorlevel 1 (
    echo PM2 not available or no logs found.
)
pause
goto start

:autostart
echo Setting up auto-startup...
powershell -ExecutionPolicy Bypass -File "%~dp0setup-autostart.ps1" -Install
pause
goto start

:exit
echo Goodbye!
exit
