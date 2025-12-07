<?php
/**
 * JWT Token Utilities
 * Simple JWT implementation for authentication
 */

class JWT {
    private static $secret = null;
    
    /**
     * Get the JWT secret from environment or use a secure default
     * IMPORTANT: Set JWT_SECRET environment variable in production!
     */
    private static function getSecret() {
        if (self::$secret === null) {
            self::$secret = getenv('JWT_SECRET');
            if (!self::$secret) {
                // Generate a random secret if not set (will change on restart - for dev only)
                // In production, ALWAYS set JWT_SECRET environment variable
                error_log('WARNING: JWT_SECRET not set in environment. Using generated secret. Set JWT_SECRET for production!');
                self::$secret = bin2hex(random_bytes(32));
            }
        }
        return self::$secret;
    }
    
    public static function encode($payload, $expiresIn = 86400) {
        // Set expiration (default 24 hours)
        $payload['iat'] = time();
        $payload['exp'] = time() + $expiresIn;
        
        // Create token
        $header = self::base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload = self::base64UrlEncode(json_encode($payload));
        $signature = self::base64UrlEncode(hash_hmac('sha256', "$header.$payload", self::getSecret(), true));
        
        return "$header.$payload.$signature";
    }
    
    public static function decode($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new Exception('Invalid token format');
        }
        
        list($header, $payload, $signature) = $parts;
        
        // Verify signature
        $validSignature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", self::getSecret(), true)
        );
        
        if ($signature !== $validSignature) {
            throw new Exception('Invalid token signature');
        }
        
        $payload = json_decode(self::base64UrlDecode($payload), true);
        
        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token expired');
        }
        
        return $payload;
    }
    
    public static function verify($token) {
        try {
            return self::decode($token);
        } catch (Exception $e) {
            return false;
        }
    }
    
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
