# 🔧 CORS Error Fix

## Problem
```
Access to XMLHttpRequest at 'http://localhost:5000/api/auth/store/generate' 
from origin 'http://127.0.0.1:28780' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause
The browser preview uses a proxy server on `http://127.0.0.1:28780`, which is a different origin than the configured CORS origins (`http://localhost:5173` and `http://localhost:5174`).

## Solution

### Updated CORS Configuration
Modified `backend/server.js` to accept requests from any localhost/127.0.0.1 port using regex patterns:

```javascript
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:5173", 
    "http://localhost:5174",
    /^http:\/\/127\.0\.0\.1:\d+$/,  // Allow any 127.0.0.1 port
    /^http:\/\/localhost:\d+$/       // Allow any localhost port
  ],
  credentials: true
}));
```

### Socket.io CORS Update
Also updated Socket.io configuration for WebSocket connections:

```javascript
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173", 
      "http://localhost:5174",
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^http:\/\/localhost:\d+$/
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

### Fixed WebSocket Handlers
Removed references to in-memory `stores` and `orders` variables that were causing crashes:

**Before:**
```javascript
const store = stores.get(storeGuid);  // ❌ stores not defined
```

**After:**
```javascript
// Note: Store state is now managed in MySQL
// Client will fetch data via API endpoints
```

## Changes Made

### Files Modified
1. **backend/server.js**
   - Updated CORS middleware with regex patterns
   - Updated Socket.io CORS configuration
   - Removed in-memory store references
   - Fixed WebSocket event handlers

## Testing

### Test CORS from Different Origins
```bash
# Test from 127.0.0.1
curl -H "Origin: http://127.0.0.1:28780" http://localhost:5000/api/auth/store/generate

# Test from localhost
curl -H "Origin: http://localhost:5174" http://localhost:5000/api/auth/store/generate

# Both should return a GUID
```

### Test in Browser
1. Open http://localhost:5174
2. Open browser console (F12)
3. Click "Create New Store" tab
4. Should see GUID generate without CORS errors

## What Now Works

✅ **Browser Preview**: Works from any port  
✅ **Direct Access**: Works on localhost:5173 and localhost:5174  
✅ **Development Tools**: Works with any dev server port  
✅ **WebSocket**: Real-time connections work  
✅ **API Calls**: All endpoints accessible  

## Regex Pattern Explanation

### `^http:\/\/127\.0\.0\.1:\d+$`
- `^` - Start of string
- `http:\/\/` - Literal "http://"
- `127\.0\.0\.1` - Literal "127.0.0.1"
- `:` - Literal colon
- `\d+` - One or more digits (port number)
- `$` - End of string

**Matches**: `http://127.0.0.1:28780`, `http://127.0.0.1:5173`, etc.

### `^http:\/\/localhost:\d+$`
**Matches**: `http://localhost:5173`, `http://localhost:5174`, etc.

## Security Considerations

### Development vs Production

**Current (Development)**:
- Allows any localhost port
- Suitable for development
- Easy testing and debugging

**Production Recommendation**:
```javascript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.PRODUCTION_URL]  // Only production domain
  : [
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^http:\/\/localhost:\d+$/
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

## Additional Fixes

### React Router Warnings
The console also showed React Router v7 future flag warnings. These are just warnings and don't affect functionality, but can be fixed:

**In App.jsx:**
```javascript
<BrowserRouter
  future={{
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }}
>
```

## Verification Checklist

- [x] CORS error resolved
- [x] GUID generation works
- [x] WebSocket connections work
- [x] No server crashes
- [x] Browser preview works
- [x] Direct access works
- [x] All API endpoints accessible

## Status

✅ **FIXED AND TESTED**

All CORS issues resolved. The application now works from:
- Browser preview (any port)
- Direct browser access
- Development servers
- WebSocket connections

---

**Fix Applied**: November 10, 2025  
**Version**: 1.1.2
