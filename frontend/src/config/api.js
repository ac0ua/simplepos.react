// API Configuration
// Supports both Node.js backend (development) and PHP backend (production)

// Determine which backend to use
// In development (vite dev server), we talk to the Node backend on port 5000.
// In production (built app served by Apache/XAMPP or any subfolder), we use the PHP backend.
const USE_PHP_BACKEND = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD;

/**
 * Detect the app's base path from the current URL.
 * Examples:
 *   - /simplepos.react/...        -> /simplepos.react
 *   - /tools/simplepos/...        -> /tools/simplepos
 *   - /something/else/...         -> /something/else
 *   - /                           -> '' (root)
 */
export const getAppBasePath = () => {
  if (typeof window === 'undefined') return '';
  const pathname = window.location.pathname || '';

  if (pathname.startsWith('/simplepos.react')) return '/simplepos.react';
  if (pathname.startsWith('/tools/simplepos')) return '/tools/simplepos';

  // Try to extract first one or two segments as app base
  const match = pathname.match(/^(\/[^/]+(?:\/[^/]+)?)/);
  if (match && !pathname.startsWith('/php-backend')) {
    return match[1];
  }
  return '';
};

export const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  if (USE_PHP_BACKEND) {
    const protocol = window.location.protocol || 'http:';
    const basePath = getAppBasePath();
    return `${protocol}//${hostname}${basePath}`;
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

// Helpful runtime log to understand which backend is active and which base URL is used
if (typeof window !== 'undefined') {
  // This will run once in the browser when the config module is loaded
  // and helps debug any URL/base path issues.
  console.info('[SimplePOS] Backend:', IS_PHP_BACKEND ? 'PHP' : 'Node', 'API_URL:', API_URL);
}

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

/**
 * Normalize a product image URL so it works regardless of deployment base path.
 *
 * Handles cases like:
 *   - /simplepos.react/backend/uploads/...
 *   - /tools/simplepos/backend/uploads/...
 *   - /backend/uploads/...
 *   - Absolute http(s):// URLs (returned as-is)
 */
export const resolveProductImageUrl = (image) => {
  if (!image) return '';

  // Leave absolute URLs untouched
  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) {
    return image;
  }

  const basePath = getAppBasePath();

  // If already includes the current base path, return as-is
  if (basePath && image.startsWith(basePath)) {
    return image;
  }

  // Strip any old hard-coded prefixes
  let normalized = image
    .replace(/^\/simplepos\.react\//, '/')
    .replace(/^\/tools\/simplepos\//, '/');

  // Ensure it starts with a single leading slash
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  // If it already starts with /backend or /php-backend, prefix with basePath
  if (normalized.startsWith('/backend/') || normalized.startsWith('/php-backend/')) {
    return `${basePath}${normalized}`;
  }

  // Fallback: treat as under backend/uploads
  return `${basePath}/backend/uploads${normalized}`;
};
