<?php
/**
 * Order Statistics Endpoint
 * GET /api/orders/stats.php?storeGuid={guid}
 * Get order statistics for a store
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
    
    // Get store
    $stmt = $conn->prepare("SELECT id FROM stores WHERE guid = ?");
    $stmt->execute([$storeGuid]);
    $store = $stmt->fetch();
    
    if (!$store) {
        Response::notFound('Store not found');
    }
    
    $today = date('Y-m-d');
    $tomorrow = date('Y-m-d', strtotime('+1 day'));
    
    // Total orders
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM orders WHERE store_id = ?");
    $stmt->execute([$store['id']]);
    $totalOrders = $stmt->fetch()['count'];
    
    // Today's orders
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM orders WHERE store_id = ? AND created_at >= ? AND created_at < ?");
    $stmt->execute([$store['id'], $today, $tomorrow]);
    $todayOrders = $stmt->fetch()['count'];
    
    // Today's revenue
    $stmt = $conn->prepare("SELECT SUM(total) as revenue FROM orders WHERE store_id = ? AND created_at >= ? AND created_at < ? AND status = 'completed'");
    $stmt->execute([$store['id'], $today, $tomorrow]);
    $todayRevenue = $stmt->fetch()['revenue'] ?? 0;
    
    // Pending orders
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM orders WHERE store_id = ? AND status = 'pending'");
    $stmt->execute([$store['id']]);
    $pendingOrders = $stmt->fetch()['count'];
    
    // Completed orders
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM orders WHERE store_id = ? AND status = 'completed'");
    $stmt->execute([$store['id']]);
    $completedOrders = $stmt->fetch()['count'];
    
    // Average order value
    $stmt = $conn->prepare("SELECT AVG(total) as average FROM orders WHERE store_id = ? AND status = 'completed'");
    $stmt->execute([$store['id']]);
    $avgOrder = $stmt->fetch()['average'] ?? 0;
    
    Response::json([
        'totalOrders' => (int)$totalOrders,
        'todayOrders' => (int)$todayOrders,
        'todayRevenue' => (float)$todayRevenue,
        'pendingOrders' => (int)$pendingOrders,
        'completedOrders' => (int)$completedOrders,
        'averageOrderValue' => (float)$avgOrder
    ]);
    
} catch (Exception $e) {
    error_log("Get stats error: " . $e->getMessage());
    Response::serverError('Server error');
}
