@echo off
echo Starting SimplePOS Backend Server...
cd /d "C:\xampp\htdocs\simplepos\backend"
pm2 start server.js --name "simplepos-backend" || echo PM2 failed, trying direct start...
if errorlevel 1 (
    echo PM2 not available, starting directly...
    node server.js
)
echo Server should be running. Check http://localhost:5000/health
pause
