<?php
/**
 * Get Store Labels Endpoint
 * GET /api/stores/labels.php?storeGuid={guid}
 * Get store labels by GUID
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

try {
    $storeGuid = $_GET['storeGuid'] ?? null;
    
    if (!$storeGuid) {
        Response::error('Store GUID is required');
    }
    
    $db = new Database();
    $conn = $db->connect();
    
    // Find store by GUID
    $stmt = $conn->prepare("SELECT * FROM stores WHERE guid = ?");
    $stmt->execute([$storeGuid]);
    $store = $stmt->fetch();
    
    if (!$store) {
        Response::notFound('Store not found');
    }
    
    // Get labels
    $stmt = $conn->prepare("SELECT * FROM store_labels WHERE store_id = ?");
    $stmt->execute([$store['id']]);
    $labels = $stmt->fetchAll();
    
    Response::success([
        'store' => [
            'id' => $store['id'],
            'guid' => $store['guid'],
            'business_name' => $store['business_name']
        ],
        'labels' => $labels
    ]);
    
} catch (Exception $e) {
    error_log("Get store labels error: " . $e->getMessage());
    Response::serverError('Failed to fetch store labels');
}
