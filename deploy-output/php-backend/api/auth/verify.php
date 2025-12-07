<?php
/**
 * Token Verification Endpoint
 * GET /api/auth/verify.php
 * Verify JWT token
 */

require_once '../../config/cors.php';
require_once '../../utils/response.php';
require_once '../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

try {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader)) {
        Response::unauthorized('No token provided');
    }
    
    // Extract token from "Bearer <token>"
    $parts = explode(' ', $authHeader);
    if (count($parts) !== 2 || $parts[0] !== 'Bearer') {
        Response::unauthorized('Invalid authorization header format');
    }
    
    $token = $parts[1];
    $decoded = JWT::decode($token);
    
    Response::success([
        'valid' => true,
        'user' => $decoded
    ]);
    
} catch (Exception $e) {
    Response::unauthorized('Invalid token');
}
