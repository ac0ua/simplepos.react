<?php
/**
 * Authentication Utilities
 * SEC-002: Admin authentication
 * SEC-006: Session validation for protected endpoints
 */

require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';

class Auth {
    /**
     * Get the admin password from environment
     * IMPORTANT: Set ADMIN_PASSWORD environment variable in production!
     */
    private static function getAdminPassword() {
        $password = getenv('ADMIN_PASSWORD');
        if (!$password) {
            // Default password for development only
            // In production, ALWAYS set ADMIN_PASSWORD environment variable
            error_log('WARNING: ADMIN_PASSWORD not set in environment. Using default. Set ADMIN_PASSWORD for production!');
            $password = 'admin123'; // Change this in production!
        }
        return $password;
    }
    
    /**
     * Get the admin API key from environment
     */
    private static function getAdminApiKey() {
        $apiKey = getenv('ADMIN_API_KEY');
        if (!$apiKey) {
            error_log('WARNING: ADMIN_API_KEY not set in environment. Admin API access may be limited.');
            return null;
        }
        return $apiKey;
    }
    
    /**
     * Check if request has valid admin authentication
     * Supports: API Key header, Basic Auth, or session-based admin token
     */
    public static function requireAdmin() {
        $headers = getallheaders();
        
        // Method 1: API Key authentication
        $apiKey = $headers['X-Admin-Api-Key'] ?? $headers['x-admin-api-key'] ?? null;
        $expectedApiKey = self::getAdminApiKey();
        
        if ($apiKey && $expectedApiKey && hash_equals($expectedApiKey, $apiKey)) {
            return true;
        }
        
        // Method 2: Basic Authentication
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (strpos($authHeader, 'Basic ') === 0) {
            $credentials = base64_decode(substr($authHeader, 6));
            list($username, $password) = explode(':', $credentials, 2);
            
            if ($username === 'admin' && hash_equals(self::getAdminPassword(), $password)) {
                return true;
            }
        }
        
        // Method 3: Bearer token with admin claim
        if (strpos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
            try {
                $decoded = JWT::decode($token);
                if (isset($decoded['isAdmin']) && $decoded['isAdmin'] === true) {
                    return true;
                }
            } catch (Exception $e) {
                // Token invalid, continue to deny
            }
        }
        
        // No valid authentication found
        Response::unauthorized('Admin authentication required. Use X-Admin-Api-Key header or Basic Auth.');
        return false;
    }
    
    /**
     * Validate session token and return decoded payload
     * SEC-006: Session validation for protected endpoints
     */
    public static function validateSession() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (empty($authHeader)) {
            return null;
        }
        
        if (strpos($authHeader, 'Bearer ') !== 0) {
            return null;
        }
        
        $token = substr($authHeader, 7);
        
        try {
            return JWT::decode($token);
        } catch (Exception $e) {
            return null;
        }
    }
    
    /**
     * Require valid session and optionally check store access
     */
    public static function requireSession($storeGuid = null) {
        $session = self::validateSession();
        
        if (!$session) {
            Response::unauthorized('Valid session token required');
            return null;
        }
        
        // If storeGuid provided, verify session has access to this store
        if ($storeGuid !== null) {
            $sessionStoreGuid = $session['storeGuid'] ?? null;
            if ($sessionStoreGuid !== $storeGuid) {
                Response::unauthorized('Session does not have access to this store');
                return null;
            }
        }
        
        return $session;
    }
    
    /**
     * Validate that the request has access to a specific store
     * Returns true if valid, sends error response and returns false otherwise
     */
    public static function validateStoreAccess($storeGuid) {
        $session = self::validateSession();
        
        // If no session, allow access (for backwards compatibility with GUID-only access)
        // But log a warning for monitoring
        if (!$session) {
            error_log("WARNING: Store access without session token for GUID: " . $storeGuid);
            return true; // Allow for now, but this should be tightened in production
        }
        
        $sessionStoreGuid = $session['storeGuid'] ?? null;
        if ($sessionStoreGuid !== $storeGuid) {
            Response::unauthorized('Session does not have access to this store');
            return false;
        }
        
        return true;
    }
}
