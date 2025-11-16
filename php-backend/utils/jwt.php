<?php
/**
 * JWT Token Utilities
 * Simple JWT implementation for authentication
 */

class JWT {
    private static $secret = 'simplepos-secret-key-change-in-production';
    
    public static function encode($payload, $expiresIn = 86400) {
        // Set expiration (default 24 hours)
        $payload['iat'] = time();
        $payload['exp'] = time() + $expiresIn;
        
        // Create token
        $header = self::base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload = self::base64UrlEncode(json_encode($payload));
        $signature = self::base64UrlEncode(hash_hmac('sha256', "$header.$payload", self::$secret, true));
        
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
            hash_hmac('sha256', "$header.$payload", self::$secret, true)
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
