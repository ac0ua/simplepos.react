@echo off
REM SimplePOS Admin Settings Update Script for Windows
REM This script calls the BASH script using Git Bash or WSL

echo SimplePOS Admin Database Update Script for Windows
echo.

REM Check if Git Bash is available
where bash >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git Bash not found. Please install Git for Windows.
    echo You can download it from: https://gitforwindows.org/
    pause
    exit /b 1
)

REM Run the BASH script with all arguments passed through
bash "%~dp0update-admin-settings.sh" %*

pause
