# Network Access Configuration

## Problem
The POS system was hardcoded to use `localhost` for all API and WebSocket connections, which prevented access from other devices on the network (phones, tablets, etc.).

## Solution
Implemented dynamic hostname detection using `window.location.hostname` to automatically use the correct IP address based on how the page is accessed.

## Changes Made

### 1. Vite Configuration (`frontend/vite.config.js`)
```javascript
server: {
  host: '0.0.0.0', // Listen on all network interfaces
  port: 5173,
  // ...
}
```
**Effect**: Frontend server now accepts connections from any device on the network.

### 2. API Configuration (`frontend/src/config/api.js`)
**New file** - Centralized API URL configuration:
```javascript
export const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:5000`;
};
```

### 3. WebSocket Context (`frontend/src/contexts/SocketContext.jsx`)
**Before**:
```javascript
socketRef.current = io('http://localhost:5000', { ... });
```

**After**:
```javascript
const socketUrl = `http://${window.location.hostname}:5000`;
socketRef.current = io(socketUrl, { ... });
```

### 4. Axios Configuration (`frontend/src/contexts/StoreContext.jsx`)
**Before**:
```javascript
axios.defaults.baseURL = 'http://localhost:5000/api';
```

**After**:
```javascript
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:5000/api`;
};
axios.defaults.baseURL = getApiBaseUrl();
```

### 5. Page Components
Updated all hardcoded `http://localhost:5000` URLs in:
- `ActiveOrders.jsx`
- `OrderHistory.jsx`

Now using:
```javascript
import { API_BASE_URL } from '../config/api';
// ...
axios.get(`${API_BASE_URL}/api/orders/${storeGuid}`)
```

## How It Works

### Localhost Access (Computer)
When accessing via `http://localhost:5173`:
- Frontend: `localhost:5173`
- Backend API: `localhost:5000`
- WebSocket: `localhost:5000`

### Network Access (Phone/Tablet)
When accessing via `http://192.168.0.66:5173`:
- Frontend: `192.168.0.66:5173`
- Backend API: `192.168.0.66:5000`
- WebSocket: `192.168.0.66:5000`

**The system automatically detects which hostname to use!**

## Network Requirements

### Server Configuration
✅ **Frontend**: Vite dev server listening on `0.0.0.0:5173`
✅ **Backend**: Express server listening on `0.0.0.0:5000` (default)
✅ **MySQL**: Running on `localhost:3306`

### Network Setup
- All devices must be on the **same WiFi network**
- Server IP address: `192.168.0.66` (from ipconfig)
- Firewall must allow incoming connections on ports **5173** and **5000**

### Windows Firewall (if needed)
If connections are blocked, add firewall rules:
```powershell
# Allow Vite dev server
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173

# Allow Node.js backend
netsh advfirewall firewall add rule name="Node.js Backend" dir=in action=allow protocol=TCP localport=5000
```

## Testing

### From Computer (localhost)
```
http://localhost:5173/f3c21901-c2f8-4a97-a06f-5aa5bdcca62c/Mr%20Coffee/order.html
```

### From Phone/Tablet (network)
```
http://192.168.0.66:5173/f3c21901-c2f8-4a97-a06f-5aa5bdcca62c/Mr%20Coffee/order.html
```

### Verify WebSocket Connection
Open browser console and look for:
```
🔌 Connecting to WebSocket: http://192.168.0.66:5000
Connected to server
🏪 Joining room with storeGuid: ...
```

## QR Code Sharing
The QR code component automatically uses the network IP when generating codes:
- On localhost → QR code contains `localhost`
- On network → QR code contains `192.168.0.66`

Perfect for sharing terminals across devices!

## Troubleshooting

### "Connection error" toast on phone
**Cause**: WebSocket can't connect to backend
**Fix**: 
1. Verify backend is running: `http://192.168.0.66:5000/health`
2. Check firewall allows port 5000
3. Ensure phone is on same WiFi network

### "This site can't be reached"
**Cause**: Frontend server not accessible
**Fix**:
1. Verify Vite is running with `host: '0.0.0.0'`
2. Check firewall allows port 5173
3. Confirm IP address is correct (run `ipconfig`)

### Products not loading
**Cause**: API requests failing
**Fix**:
1. Open browser console (F12)
2. Check Network tab for failed requests
3. Verify API base URL is correct
4. Test API directly: `http://192.168.0.66:5000/api/products/{guid}`

### WebSocket disconnects frequently
**Cause**: Network instability or firewall
**Fix**:
1. Use stable WiFi connection
2. Disable VPN if active
3. Check router settings for connection limits
4. Increase reconnection attempts in SocketContext

## Production Deployment

For production, replace dynamic hostname detection with environment variables:

```javascript
// .env.production
VITE_API_URL=https://your-domain.com/api
VITE_WS_URL=https://your-domain.com

// config/api.js
export const API_BASE_URL = import.meta.env.VITE_API_URL || getApiBaseUrl();
```

Use HTTPS for secure connections in production!

---

**Status**: ✅ Fixed and tested
**Date**: November 11, 2025
**Impact**: Full multi-device support across local network
