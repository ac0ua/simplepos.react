// API Configuration
// Supports both Node.js backend (development) and PHP backend (production)

// Determine which backend to use
// In development (vite dev server), we talk to the Node backend on port 5000.
// In production (built app served by Apache/XAMPP), we use the PHP backend.
const USE_PHP_BACKEND = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD;

export const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  if (USE_PHP_BACKEND) {
    // When deployed under /simplepos.react (your current setup),
    // point API calls to /simplepos.react/php-backend/... so Apache
    // serves php-backend from inside the simplepos.react folder.
    const pathname = window.location.pathname || '';
    const isUnderSimpleposReact = pathname.startsWith('/simplepos.react');
    const basePath = isUnderSimpleposReact ? '/simplepos.react' : '';
    return `http://${hostname}${basePath}`;
  } else {
    // Node.js Backend (development)
    const port = 5000;
    return `http://${hostname}:${port}`;
  }
};

export const API_BASE_URL = getApiBaseUrl();

// API URL construction based on backend type
export const API_URL = USE_PHP_BACKEND 
  ? `${API_BASE_URL}/php-backend/api`  // PHP: /php-backend/api/...
  : `${API_BASE_URL}/api`;              // Node.js: /api/...

// Export backend type for conditional logic
export const IS_PHP_BACKEND = USE_PHP_BACKEND;

// WebSocket/Real-time configuration
export const getRealtimeConfig = () => {
  if (USE_PHP_BACKEND) {
    // Use SSE for PHP backend
    return {
      type: 'sse',
      url: `${API_BASE_URL}/php-backend/api/realtime/sse.php`,
      pollingUrl: `${API_BASE_URL}/php-backend/api/realtime/polling.php`,
      pollingInterval: 3000 // 3 seconds
    };
  } else {
    // Use WebSocket for Node.js backend
    return {
      type: 'websocket',
      url: `ws://${window.location.hostname}:5000`
    };
  }
};
