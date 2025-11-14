# SimplePOS Server Management

## 🚀 Quick Start

### Option 1: PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start server
pm2 start backend/server.js --name "simplepos-backend"

# Setup auto-start on boot
pm2 startup
pm2 save

# Check status
pm2 list
pm2 logs simplepos-backend
```

### Option 2: Windows Scripts (Easy)
```bash
# Double-click these files in Windows Explorer:
# start-server.bat     (starts server)
# start-server.ps1     (PowerShell script with options)
```

### Option 3: PowerShell Commands
```powershell
# Start server
.\start-server.ps1

# Start with PM2
.\start-server.ps1 -PM2

# Start directly
.\start-server.ps1 -Direct

# Check status
.\start-server.ps1 -Status

# Stop server
.\start-server.ps1 -Stop
```

### Option 4: Auto-Startup on Windows Boot
```powershell
# Install auto-startup (run as Administrator)
.\setup-autostart.ps1 -Install

# Remove auto-startup
.\setup-autostart.ps1 -Remove
```

## 📊 Monitoring

### Health Check
Visit: `http://localhost:5000/health`

### PM2 Commands
```bash
pm2 list                    # Show all processes
pm2 logs simplepos-backend  # View logs
pm2 restart simplepos-backend  # Restart server
pm2 stop simplepos-backend  # Stop server
pm2 delete simplepos-backend # Remove from PM2
```

### Windows Services (Alternative)
1. Download NSSM (Non-Sucking Service Manager)
2. Install as service: `nssm install SimplePOS "node.exe" "C:\path\to\server.js"`
3. Start service: `nssm start SimplePOS`

## 🔧 Troubleshooting

### Sleep/Wake Connection Issues
**Problem:** After computer wakes from sleep, you see "Connection error" and "Failed to load order history"

**✅ FIXED:** The app now:
- **Retries connections** automatically (up to 50 attempts with increasing delays)
- **Waits for connection** before loading order history
- **Shows connection status** in the UI (green dot = connected, red pulsing = reconnecting)
- **Retries API calls** 3 times with 2-second delays when connection fails

**Solutions:**
1. **Use PM2** for auto-restart: `pm2 start backend/server.js --name "simplepos-backend"`
2. **Setup auto-startup:** `.\setup-autostart.ps1 -Install`
3. **Test recovery:** `.\test-connection-recovery.ps1`

### Server Won't Start
1. Check if port 5000 is available: `netstat -ano | findstr :5000`
2. Kill conflicting processes: `taskkill /PID <PID> /F`
3. Check MySQL is running (XAMPP Control Panel)

### PM2 Issues
1. Reinstall PM2: `npm uninstall -g pm2 && npm install -g pm2`
2. Clear PM2: `pm2 kill && pm2 resurrect`

### Auto-Startup Issues
1. Run PowerShell as Administrator for scheduled tasks
2. Check Task Scheduler: Search "Task Scheduler" → Check for "SimplePOS Backend Server"

## 🔄 Connection Recovery Features

### WebSocket Auto-Reconnection
- **50 reconnection attempts** (vs. 5 before)
- **10-second max delay** (vs. 5 seconds)
- **20-second timeout** for initial connections
- **Detailed logging** for troubleshooting

### API Retry Logic
- **3 automatic retries** for failed API calls
- **2-second delays** between retries
- **Connection-aware loading** (waits for WebSocket connection)
- **User-friendly error messages**

### UI Indicators
- **Connection status dot** (green = connected, red = reconnecting)
- **"Reconnecting..." text** when connection is lost
- **Toast notifications** for connection events
- **Loading states** that respect connection status

## 📝 Notes
- Backend runs on port 5000
- Frontend runs on port 5173
- MySQL runs on port 3306 (XAMPP)
- All scripts are in the project root directory
