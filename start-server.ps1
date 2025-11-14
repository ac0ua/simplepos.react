# SimplePOS Server Startup Script
param(
    [switch]$PM2,
    [switch]$Direct,
    [switch]$Status,
    [switch]$Stop
)

$backendPath = "C:\xampp\htdocs\simplepos\backend"
$serverFile = "$backendPath\server.js"

function Start-WithPM2 {
    Write-Host "Starting server with PM2..." -ForegroundColor Green
    try {
        cd $backendPath
        pm2 start server.js --name "simplepos-backend"
        pm2 save
        Write-Host "Server started with PM2. Will auto-restart on boot." -ForegroundColor Green
    } catch {
        Write-Host "PM2 failed, falling back to direct start..." -ForegroundColor Yellow
        Start-Direct
    }
}

function Start-Direct {
    Write-Host "Starting server directly..." -ForegroundColor Green
    try {
        cd $backendPath
        Start-Process -FilePath "node.exe" -ArgumentList $serverFile -NoNewWindow
        Write-Host "Server started directly. Check http://localhost:5000/health" -ForegroundColor Green
    } catch {
        Write-Host "Failed to start server: $_" -ForegroundColor Red
    }
}

function Show-Status {
    Write-Host "Checking server status..." -ForegroundColor Yellow
    try {
        pm2 list
    } catch {
        Write-Host "PM2 not available. Checking if server is running on port 5000..." -ForegroundColor Yellow
        $connection = Test-NetConnection -ComputerName localhost -Port 5000
        if ($connection.TcpTestSucceeded) {
            Write-Host "✓ Server appears to be running on port 5000" -ForegroundColor Green
        } else {
            Write-Host "✗ Server does not appear to be running on port 5000" -ForegroundColor Red
        }
    }
}

function Stop-Server {
    Write-Host "Stopping server..." -ForegroundColor Yellow
    try {
        pm2 stop "simplepos-backend"
        pm2 delete "simplepos-backend"
        Write-Host "Server stopped." -ForegroundColor Green
    } catch {
        Write-Host "PM2 stop failed, trying taskkill..." -ForegroundColor Yellow
        taskkill /F /IM node.exe /FI "WINDOWTITLE eq server.js" 2>$null
        Write-Host "Attempted to kill Node.js processes." -ForegroundColor Yellow
    }
}

# Main logic
if ($Status) {
    Show-Status
} elseif ($Stop) {
    Stop-Server
} elseif ($PM2) {
    Start-WithPM2
} elseif ($Direct) {
    Start-Direct
} else {
    # Default: try PM2 first, fallback to direct
    Write-Host "No specific mode selected. Trying PM2 first..." -ForegroundColor Yellow
    Start-WithPM2
}

Write-Host "Press any key to exit..."
$null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
