<?php
/**
 * Rate Limiting Utility
 * SEC-005: Prevent brute force and DoS attacks
 * 
 * Uses file-based storage for simplicity. For production with high traffic,
 * consider using Redis or Memcached.
 */

class RateLimit {
    private static $cacheDir = null;
    
    /**
     * Get the cache directory for rate limit data
     */
    private static function getCacheDir() {
        if (self::$cacheDir === null) {
            self::$cacheDir = __DIR__ . '/../data/rate-limit';
            if (!is_dir(self::$cacheDir)) {
                mkdir(self::$cacheDir, 0755, true);
            }
        }
        return self::$cacheDir;
    }
    
    /**
     * Get client identifier (IP address)
     */
    private static function getClientId() {
        // Check for forwarded IP (behind proxy/load balancer)
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? 
              $_SERVER['HTTP_X_REAL_IP'] ?? 
              $_SERVER['REMOTE_ADDR'] ?? 
              'unknown';
        
        // If multiple IPs (X-Forwarded-For can have comma-separated list), take the first
        if (strpos($ip, ',') !== false) {
            $ip = trim(explode(',', $ip)[0]);
        }
        
        return $ip;
    }
    
    /**
     * Get rate limit data for a key
     */
    private static function getData($key) {
        $file = self::getCacheDir() . '/' . md5($key) . '.json';
        
        if (!file_exists($file)) {
            return ['count' => 0, 'reset' => time() + 60];
        }
        
        $data = json_decode(file_get_contents($file), true);
        
        // Reset if window has passed
        if ($data['reset'] < time()) {
            return ['count' => 0, 'reset' => time() + 60];
        }
        
        return $data;
    }
    
    /**
     * Save rate limit data for a key
     */
    private static function saveData($key, $data) {
        $file = self::getCacheDir() . '/' . md5($key) . '.json';
        file_put_contents($file, json_encode($data));
    }
    
    /**
     * Check rate limit and increment counter
     * 
     * @param string $endpoint Endpoint identifier
     * @param int $maxRequests Maximum requests per window
     * @param int $windowSeconds Time window in seconds
     * @return bool True if allowed, false if rate limited
     */
    public static function check($endpoint, $maxRequests = 60, $windowSeconds = 60) {
        $clientId = self::getClientId();
        $key = $endpoint . ':' . $clientId;
        
        $data = self::getData($key);
        
        // Check if rate limited
        if ($data['count'] >= $maxRequests) {
            // Set rate limit headers
            header('X-RateLimit-Limit: ' . $maxRequests);
            header('X-RateLimit-Remaining: 0');
            header('X-RateLimit-Reset: ' . $data['reset']);
            header('Retry-After: ' . ($data['reset'] - time()));
            
            return false;
        }
        
        // Increment counter
        $data['count']++;
        if ($data['reset'] < time()) {
            $data['reset'] = time() + $windowSeconds;
            $data['count'] = 1;
        }
        
        self::saveData($key, $data);
        
        // Set rate limit headers
        header('X-RateLimit-Limit: ' . $maxRequests);
        header('X-RateLimit-Remaining: ' . ($maxRequests - $data['count']));
        header('X-RateLimit-Reset: ' . $data['reset']);
        
        return true;
    }
    
    /**
     * Apply rate limit and send error response if exceeded
     * 
     * @param string $endpoint Endpoint identifier
     * @param int $maxRequests Maximum requests per window
     * @param int $windowSeconds Time window in seconds
     */
    public static function apply($endpoint, $maxRequests = 60, $windowSeconds = 60) {
        if (!self::check($endpoint, $maxRequests, $windowSeconds)) {
            require_once __DIR__ . '/response.php';
            Response::error('Rate limit exceeded. Please try again later.', 429);
        }
    }
    
    /**
     * Clean up old rate limit files (call periodically)
     */
    public static function cleanup() {
        $dir = self::getCacheDir();
        $files = glob($dir . '/*.json');
        $now = time();
        
        foreach ($files as $file) {
            $data = json_decode(file_get_contents($file), true);
            if ($data && isset($data['reset']) && $data['reset'] < $now - 3600) {
                unlink($file);
            }
        }
    }
}
