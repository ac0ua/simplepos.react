<?php
/**
 * Update Order Status Endpoint
 * PATCH /api/orders/update-status.php
 * Update order status
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $storeGuid = $data['storeGuid'] ?? null;
    $orderId = $data['orderId'] ?? null;
    $status = $data['status'] ?? null;
    
    $validStatuses = ['pending', 'active', 'processing', 'completed', 'cancelled', 'refunded'];
    
    if (!$storeGuid || !$orderId || !$status) {
        Response::error('Store GUID, order ID, and status are required');
    }
    
    if (!in_array($status, $validStatuses)) {
        Response::error('Invalid status');
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
    
    // Build update query
    $updateFields = ['status = ?', 'updated_at = NOW()'];
    $params = [$status];
    
    if ($status === 'cancelled') {
        $updateFields[] = 'cancelled_at = NOW()';
    } elseif ($status === 'completed') {
        $updateFields[] = 'completed_at = NOW()';
    } elseif ($status === 'active' || $status === 'pending') {
        $updateFields[] = 'cancelled_at = NULL';
        $updateFields[] = 'completed_at = NULL';
    }
    
    $params[] = $order['id'];
    
    $stmt = $conn->prepare("
        UPDATE orders 
        SET " . implode(', ', $updateFields) . "
        WHERE id = ?
    ");
    $stmt->execute($params);
    
    // Get updated order
    $stmt = $conn->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$order['id']]);
    $updatedOrder = $stmt->fetch();
    
    Response::success(['order' => $updatedOrder], "Order $status");
    
} catch (Exception $e) {
    error_log("Update order status error: " . $e->getMessage());
    Response::serverError('Server error');
}
