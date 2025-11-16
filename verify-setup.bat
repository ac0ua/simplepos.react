@echo off
echo ========================================
echo SimplePOS - Setup Verification
echo ========================================
echo.

set ERRORS=0

echo Checking installation...
echo.

REM Check XAMPP directories
echo [1] Checking XAMPP...
if exist "C:\xampp\" (
    echo    [OK] XAMPP found
) else (
    echo    [ERROR] XAMPP not found at C:\xampp\
    set /a ERRORS+=1
)

REM Check MySQL
echo [2] Checking MySQL...
if exist "C:\xampp\mysql\bin\mysql.exe" (
    echo    [OK] MySQL found
) else (
    echo    [ERROR] MySQL not found
    set /a ERRORS+=1
)

REM Check Apache
echo [3] Checking Apache...
if exist "C:\xampp\apache\bin\httpd.exe" (
    echo    [OK] Apache found
) else (
    echo    [ERROR] Apache not found
    set /a ERRORS+=1
)

REM Check Node.js
echo [4] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    [OK] Node.js found
    node --version
) else (
    echo    [ERROR] Node.js not found - Install from https://nodejs.org
    set /a ERRORS+=1
)

REM Check if frontend built
echo [5] Checking frontend build...
if exist "frontend\dist\index.html" (
    echo    [OK] React app built
) else (
    echo    [WARN] React app not built yet - Run build-and-deploy.bat
    set /a ERRORS+=1
)

REM Check deployment
echo [6] Checking deployment...
if exist "C:\xampp\htdocs\simplepos\index.html" (
    echo    [OK] Frontend deployed to htdocs
) else (
    echo    [WARN] Frontend not deployed - Run build-and-deploy.bat
    set /a ERRORS+=1
)

if exist "C:\xampp\htdocs\php-backend\api\" (
    echo    [OK] Backend deployed to htdocs
) else (
    echo    [WARN] Backend not deployed - Run build-and-deploy.bat
    set /a ERRORS+=1
)

REM Check .htaccess files
echo [7] Checking .htaccess files...
if exist "C:\xampp\htdocs\simplepos\.htaccess" (
    echo    [OK] Frontend .htaccess exists
) else (
    echo    [WARN] Frontend .htaccess missing - React routing may not work
)

if exist "C:\xampp\htdocs\php-backend\.htaccess" (
    echo    [OK] Backend .htaccess exists
) else (
    echo    [WARN] Backend .htaccess missing - CORS may not work
)

REM Check database file
echo [8] Checking database setup file...
if exist "database-setup.sql" (
    echo    [OK] Database setup file found
) else (
    echo    [ERROR] database-setup.sql not found
    set /a ERRORS+=1
)

echo.
echo ========================================
if %ERRORS% EQU 0 (
    echo    ALL CHECKS PASSED! ✓
    echo ========================================
    echo.
    echo You're ready to go! Try:
    echo   http://localhost/simplepos
) else (
    echo    %ERRORS% ISSUE(S) FOUND
    echo ========================================
    echo.
    echo Please fix the issues above and try again.
    echo.
    echo Quick fixes:
    echo - Install XAMPP from https://www.apachefriends.org
    echo - Install Node.js from https://nodejs.org
    echo - Run build-and-deploy.bat to build and deploy
    echo - Run setup-database.bat to create database
)

echo.
pause
