# Create Windows Scheduled Task for Auto-Startup
param([switch]$Install, [switch]$Remove)

$taskName = "SimplePOS Backend Server"
$scriptPath = "C:\xampp\htdocs\simplepos\start-server.ps1"
$pm2Path = "$env:APPDATA\npm\pm2.cmd"

if ($Install) {
    Write-Host "Installing Windows Scheduled Task for SimplePOS auto-startup..." -ForegroundColor Green

    # Check if PM2 is available
    if (Test-Path $pm2Path) {
        $arguments = "-ExecutionPolicy Bypass -File `"$scriptPath`" -PM2"
    } else {
        $arguments = "-ExecutionPolicy Bypass -File `"$scriptPath`" -Direct"
    }

    try {
        # Create the scheduled task
        $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arguments
        $trigger = New-ScheduledTaskTrigger -AtStartup
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType ServiceAccount

        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Starts the SimplePOS backend server automatically on system boot"

        Write-Host "✓ Scheduled Task created successfully!" -ForegroundColor Green
        Write-Host "The server will now start automatically when Windows boots." -ForegroundColor Green

    } catch {
        Write-Host "✗ Failed to create scheduled task: $_" -ForegroundColor Red
        Write-Host "You can still start the server manually using the scripts." -ForegroundColor Yellow
    }

} elseif ($Remove) {
    Write-Host "Removing Windows Scheduled Task..." -ForegroundColor Yellow
    try {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "✓ Scheduled Task removed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to remove scheduled task: $_" -ForegroundColor Red
    }

} else {
    Write-Host "SimplePOS Auto-Startup Setup" -ForegroundColor Cyan
    Write-Host "Usage:" -ForegroundColor White
    Write-Host "  .\setup-autostart.ps1 -Install    # Install auto-startup" -ForegroundColor White
    Write-Host "  .\setup-autostart.ps1 -Remove     # Remove auto-startup" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "Current status:" -ForegroundColor Yellow
    try {
        $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        if ($task) {
            Write-Host "✓ Auto-startup is configured" -ForegroundColor Green
        } else {
            Write-Host "✗ Auto-startup is not configured" -ForegroundColor Red
        }
    } catch {
        Write-Host "? Unable to check status" -ForegroundColor Yellow
    }
}
