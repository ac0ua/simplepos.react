<?php
/**
 * Get Single Order Endpoint
 * GET /api/orders/get-single.php?storeGuid={guid}&orderId={id}
 * Get single order by ID
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

try {
    $storeGuid = $_GET['storeGuid'] ?? null;
    $orderId = $_GET['orderId'] ?? null;
    
    if (!$storeGuid || !$orderId) {
        Response::error('Store GUID and order ID are required');
    }
    
    $db = new Database();
    $conn = $db->connect();
    
    // Get store
    $stmt = $conn->prepare("SELECT id FROM stores WHERE guid = ?");
    $stmt->execute([$storeGuid]);
    $store = $stmt->fetch();
    
    if (!$store) {
        Response::notFound('Store not found');
    }
    
    // Get order
    $stmt = $conn->prepare("SELECT * FROM orders WHERE order_id = ? AND store_id = ?");
    $stmt->execute([$orderId, $store['id']]);
    $order = $stmt->fetch();
    
    if (!$order) {
        Response::notFound('Order not found');
    }
    
    // Get order items
    $stmt = $conn->prepare("SELECT * FROM order_items WHERE order_id = ?");
    $stmt->execute([$order['id']]);
    $order['items'] = $stmt->fetchAll();
    
    Response::json($order);
    
} catch (Exception $e) {
    error_log("Get order error: " . $e->getMessage());
    Response::serverError('Server error');
}
