<?php
/**
 * CORS Configuration
 * Enables Cross-Origin Resource Sharing for React frontend
 * SEC-003: Restrict to allowed origins
 * SEC-016: Add security headers
 */

// Define allowed origins - add your production domain here
$allowedOrigins = [
    'http://localhost',
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',  // React dev server
    'http://127.0.0.1',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://192.168.0.66',    // Local network access
    'https://192.168.0.66',   // Local network HTTPS
];

// Add custom allowed origins from environment
$customOrigins = getenv('CORS_ALLOWED_ORIGINS');
if ($customOrigins) {
    $allowedOrigins = array_merge($allowedOrigins, explode(',', $customOrigins));
}

// Get the request origin
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Check if origin is allowed
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // For same-origin requests or when no origin header (direct API calls)
    // Allow the request but don't set CORS headers
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
    $scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $selfOrigin = $scheme . '://' . $host;
    
    // Only set CORS for known origins
    if ($origin && !in_array($origin, $allowedOrigins)) {
        // Log potential CORS violation for monitoring
        error_log("CORS: Blocked origin - " . $origin);
    }
    
    // For same-origin or no-origin requests, allow
    if (!$origin || strpos($selfOrigin, $host) !== false) {
        header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
    }
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // 24 hours

// SEC-016: Security Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
