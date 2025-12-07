<?php
/**
 * Polling Endpoint
 * GET /api/realtime/polling.php?storeGuid={guid}&lastCheck={timestamp}
 * Alternative to SSE for older browsers
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

try {
    $storeGuid = $_GET['storeGuid'] ?? null;
    $lastCheck = $_GET['lastCheck'] ?? null;
    
    if (!$storeGuid) {
        Response::error('Store GUID is required');
    }
    
    $db = new Database();
    $conn = $db->connect();
    
    // Get store ID
    $stmt = $conn->prepare("SELECT id FROM stores WHERE guid = ?");
    $stmt->execute([$storeGuid]);
    $store = $stmt->fetch();
    
    if (!$store) {
        Response::notFound('Store not found');
    }
    
    // Get updates since last check
    $updates = [
        'orders' => [],
        'products' => [],
        'timestamp' => time()
    ];
    
    if ($lastCheck) {
        $checkDate = date('Y-m-d H:i:s', $lastCheck);
        
        // Get updated orders
        $stmt = $conn->prepare("
            SELECT * FROM orders 
            WHERE store_id = ? AND updated_at > ?
            ORDER BY updated_at DESC
            LIMIT 10
        ");
        $stmt->execute([$store['id'], $checkDate]);
        $updates['orders'] = $stmt->fetchAll();
        
        // Get updated products (stock changes)
        $stmt = $conn->prepare("
            SELECT * FROM products 
            WHERE store_id = ? AND updated_at > ? AND is_active = 1
            ORDER BY updated_at DESC
            LIMIT 10
        ");
        $stmt->execute([$store['id'], $checkDate]);
        $updates['products'] = $stmt->fetchAll();
    }
    
    Response::json($updates);
    
} catch (Exception $e) {
    error_log("Polling error: " . $e->getMessage());
    Response::serverError('Server error');
}
