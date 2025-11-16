<?php
/**
 * KDS Summary Endpoint
 * GET /api/kds/summary.php?storeId={id}
 * Get aggregated counts of pending items by category
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

try {
    $storeId = $_GET['storeId'] ?? null;
    
    if (!$storeId) {
        Response::error('Store ID is required');
    }
    
    $db = new Database();
    $conn = $db->connect();
    
    // Get all active orders with items
    $stmt = $conn->prepare("
        SELECT oi.*, p.category, o.status
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.store_id = ? AND o.status IN ('pending', 'active', 'processing')
    ");
    $stmt->execute([$storeId]);
    $items = $stmt->fetchAll();
    
    // Aggregate by category
    $categoryMap = [];
    
    foreach ($items as $item) {
        $category = $item['category'] ?? 'Uncategorized';
        $prepQuantity = $item['prep_quantity'] ?? 0;
        $pendingQty = $item['quantity'] - $prepQuantity;
        
        if (!isset($categoryMap[$category])) {
            $categoryMap[$category] = [
                'category' => $category,
                'totalPending' => 0,
                'totalPrepared' => 0
            ];
        }
        
        $categoryMap[$category]['totalPending'] += $pendingQty;
        $categoryMap[$category]['totalPrepared'] += $prepQuantity;
    }
    
    // Convert to array and sort
    $summary = array_values($categoryMap);
    usort($summary, function($a, $b) {
        return strcmp($a['category'], $b['category']);
    });
    
    Response::success([
        'storeId' => $storeId,
        'summary' => $summary,
        'timestamp' => date('c')
    ]);
    
} catch (Exception $e) {
    error_log("KDS summary error: " . $e->getMessage());
    Response::serverError('Failed to fetch KDS summary');
}
