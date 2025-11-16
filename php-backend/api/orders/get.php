<?php
/**
 * Get Orders Endpoint
 * GET /api/orders/get.php?storeGuid={guid}&status={status}&date={date}&limit={limit}&offset={offset}
 * Get all orders for a store
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

try {
    $storeGuid = $_GET['storeGuid'] ?? null;
    $status = $_GET['status'] ?? null;
    $date = $_GET['date'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    if (!$storeGuid) {
        Response::error('Store GUID is required');
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
    
    // Build query
    $sql = "SELECT * FROM orders WHERE store_id = ?";
    $params = [$store['id']];
    
    if ($status) {
        $sql .= " AND status = ?";
        $params[] = $status;
    }
    
    if ($date) {
        $targetDate = date('Y-m-d', strtotime($date));
        $nextDate = date('Y-m-d', strtotime($date . ' +1 day'));
        $sql .= " AND created_at >= ? AND created_at < ?";
        $params[] = $targetDate;
        $params[] = $nextDate;
    }
    
    // Count total
    $countStmt = $conn->prepare(str_replace('*', 'COUNT(*) as count', $sql));
    $countStmt->execute($params);
    $countResult = $countStmt->fetch();
    $total = $countResult['count'];
    
    // Get orders with pagination
    $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();
    
    // Get items for each order
    foreach ($orders as &$order) {
        $stmt = $conn->prepare("SELECT * FROM order_items WHERE order_id = ?");
        $stmt->execute([$order['id']]);
        $order['items'] = $stmt->fetchAll();
    }
    
    Response::json([
        'orders' => $orders,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset
    ]);
    
} catch (Exception $e) {
    error_log("Get orders error: " . $e->getMessage());
    Response::serverError('Server error');
}
