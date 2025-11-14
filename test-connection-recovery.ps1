# Test Sleep/Wake Connection Recovery
Write-Host "🧪 Testing Sleep/Wake Connection Recovery..." -ForegroundColor Cyan
Write-Host "This script simulates the sleep/wake cycle issue" -ForegroundColor Yellow
Write-Host ""

# Function to check server status
function Test-ServerConnection {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Server is running and responding" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ Server is not responding: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    return $false
}

# Function to check frontend connection
function Test-FrontendConnection {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend is accessible" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ Frontend is not accessible: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    return $false
}

# Initial status check
Write-Host "📊 Initial Status Check:" -ForegroundColor White
Test-ServerConnection
Test-FrontendConnection
Write-Host ""

# Check PM2 status
Write-Host "🔧 PM2 Process Status:" -ForegroundColor White
try {
    pm2 list 2>$null
} catch {
    Write-Host "PM2 not available or no processes running" -ForegroundColor Yellow
}
Write-Host ""

# Test reconnection
Write-Host "🔄 Testing Connection Recovery..." -ForegroundColor White
Write-Host "1. Stop the server manually (Ctrl+C in the backend terminal)" -ForegroundColor Yellow
Write-Host "2. Wait 10 seconds..." -ForegroundColor Yellow
Read-Host "Press Enter after stopping the server"

Write-Host "Checking if server recovers..." -ForegroundColor Yellow
for ($i = 1; $i -le 5; $i++) {
    Write-Host "Attempt $i/5..." -ForegroundColor Gray
    if (Test-ServerConnection) {
        Write-Host "✅ Server recovered automatically!" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 3
}

if (-not (Test-ServerConnection)) {
    Write-Host "❌ Server did not recover automatically" -ForegroundColor Red
    Write-Host "Try running: .\ServerConsole.bat" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💡 Tips for Sleep/Wake Issues:" -ForegroundColor Cyan
Write-Host "• Use PM2 for auto-restart: pm2 start backend/server.js --name 'simplepos-backend'" -ForegroundColor White
Write-Host "• Setup auto-startup: .\setup-autostart.ps1 -Install" -ForegroundColor White
Write-Host "• Check Windows Firewall isn't blocking port 5000" -ForegroundColor White
Write-Host "• The app now waits for connection before loading data" -ForegroundColor White

Read-Host "Press Enter to exit"
