@echo off
echo ========================================
echo SimplePOS - Build and Deploy Script
echo ========================================
echo.

REM Navigate to frontend directory
cd frontend

echo [1/4] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo [2/4] Building React app for PHP backend...
set REACT_APP_USE_PHP_BACKEND=true
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm build failed
    pause
    exit /b 1
)

echo.
echo [3/4] Creating deployment directory...
cd ..
if not exist "C:\xampp\htdocs\simplepos.react" mkdir "C:\xampp\htdocs\simplepos.react"

echo.
echo [4/4] Copying files to htdocs...
xcopy /E /I /Y "frontend\dist\*" "C:\xampp\htdocs\simplepos.react\"
if not exist "C:\xampp\htdocs\simplepos.react\php-backend" mkdir "C:\xampp\htdocs\simplepos.react\php-backend"
xcopy /E /I /Y "php-backend" "C:\xampp\htdocs\simplepos.react\php-backend\"

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Frontend: http://localhost/simplepos.react
echo Backend:  http://localhost/simplepos.react/php-backend/api
echo.
echo Next steps:
echo 1. Make sure Apache and MySQL are running in XAMPP
echo 2. Import database: mysql -u root -p ^< database-setup.sql
echo 3. Open: http://localhost/simplepos.react
echo.
pause
