@echo off
echo ========================================
echo SimplePOS - Database Setup
echo ========================================
echo.

REM Check if XAMPP MySQL is in PATH, if not use full path
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe

if not exist "%MYSQL_PATH%" (
    echo ERROR: MySQL not found at %MYSQL_PATH%
    echo Please make sure XAMPP is installed correctly
    pause
    exit /b 1
)

echo This will create the SimplePOS database and tables.
echo.
echo Please enter your MySQL root password when prompted.
echo (Default XAMPP installation has no password - just press Enter)
echo.

"%MYSQL_PATH%" -u root -p < database-setup.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Database setup completed successfully!
    echo ========================================
) else (
    echo.
    echo ERROR: Database setup failed
    echo Please check that:
    echo 1. MySQL is running in XAMPP Control Panel
    echo 2. You entered the correct password
    echo 3. The database-setup.sql file exists
)

echo.
pause
