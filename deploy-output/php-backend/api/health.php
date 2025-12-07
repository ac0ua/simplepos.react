<?php
/**
 * PHP Backend Health Check
 * GET /php-backend/api/health.php
 * Lightweight endpoint used by the frontend to determine server status
 */

require_once '../config/cors.php';
require_once '../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

try {
    // Simple health payload – no GUID generation or DB writes
    Response::success([
        'status' => 'healthy',
        'timestamp' => date('c')
    ]);
} catch (Exception $e) {
    error_log('Health check error: ' . $e->getMessage());
    Response::serverError('Health check failed');
}
