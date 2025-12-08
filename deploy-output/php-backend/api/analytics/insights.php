<?php
/**
 * Comprehensive Insights/Analytics Endpoint
 * GET /api/analytics/insights.php?storeGuid={guid}&startDate={date}&endDate={date}
 * Returns comprehensive analytics data for the insights dashboard
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

try {
    $storeGuid = $_GET['storeGuid'] ?? null;
    $startDate = $_GET['startDate'] ?? date('Y-m-d', strtotime('-30 days'));
    $endDate = $_GET['endDate'] ?? date('Y-m-d');
    
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
    
    $storeId = $store['id'];
    $startDateTime = $startDate . ' 00:00:00';
    $endDateTime = $endDate . ' 23:59:59';
    
    // ============================================
    // ORDER STATISTICS
    // ============================================
    
    // Total orders in period
    $stmt = $conn->prepare("
        SELECT COUNT(*) as count, 
               SUM(total) as revenue,
               AVG(total) as avg_order,
               MIN(total) as min_order,
               MAX(total) as max_order
        FROM orders 
        WHERE store_id = ? AND created_at BETWEEN ? AND ?
    ");
    $stmt->execute([$storeId, $startDateTime, $endDateTime]);
    $orderStats = $stmt->fetch();
    
    // Orders by status
    $stmt = $conn->prepare("
        SELECT status, COUNT(*) as count, SUM(total) as revenue
        FROM orders 
        WHERE store_id = ? AND created_at BETWEEN ? AND ?
        GROUP BY status
    ");
    $stmt->execute([$storeId, $startDateTime, $endDateTime]);
    $ordersByStatus = $stmt->fetchAll();
    
    // Orders by payment method
    $stmt = $conn->prepare("
        SELECT COALESCE(payment_method, 'unpaid') as payment_method, 
               COUNT(*) as count, 
               SUM(total) as revenue
        FROM orders 
        WHERE store_id = ? AND created_at BETWEEN ? AND ?
        GROUP BY payment_method
    ");
    $stmt->execute([$storeId, $startDateTime, $endDateTime]);
    $ordersByPayment = $stmt->fetchAll();
    
    // Daily order trends
    $stmt = $conn->prepare("
        SELECT DATE(created_at) as date, 
               COUNT(*) as orders, 
               SUM(total) as revenue,
               AVG(total) as avg_order
        FROM orders 
        WHERE store_id = ? AND created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ");
    $stmt->execute([$storeId, $startDateTime, $endDateTime]);
    $dailyTrends = $stmt->fetchAll();
    
    // Hourly distribution (for bell curve)
    $stmt = $conn->prepare("
        SELECT HOUR(created_at) as hour, 
               COUNT(*) as orders,
               SUM(total) as revenue
        FROM orders 
        WHERE store_id = ? AND created_at BETWEEN ? AND ?
        GROUP BY HOUR(created_at)
        ORDER BY hour ASC
    ");
    $stmt->execute([$storeId, $startDateTime, $endDateTime]);
    $hourlyDistribution = $stmt->fetchAll();
    
    // ============================================
    // PRODUCT STATISTICS
    // ============================================
    
    // Top selling products
    $stmt = $conn->prepare("
        SELECT oi.product_name, 
               SUM(oi.quantity) as total_quantity,
               SUM(oi.quantity * oi.price) as total_revenue,
               COUNT(DISTINCT oi.order_id) as order_count
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.store_id = ? AND o.created_at BETWEEN ? AND ?
        GROUP BY oi.product_name
        ORDER BY total_quantity DESC
        LIMIT 10
    ");
    $stmt->execute([$storeId, $startDateTime, $endDateTime]);
    $topProducts = $stmt->fetchAll();
    
    // Lowest selling products
    $stmt = $conn->prepare("
        SELECT oi.product_name, 
               SUM(oi.quantity) as total_quantity,
               SUM(oi.quantity * oi.price) as total_revenue,
               COUNT(DISTINCT oi.order_id) as order_count
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.store_id = ? AND o.created_at BETWEEN ? AND ?
        GROUP BY oi.product_name
        ORDER BY total_quantity ASC
        LIMIT 10
    ");
    $stmt->execute([$storeId, $startDateTime, $endDateTime]);
    $lowestProducts = $stmt->fetchAll();
    
    // ============================================
    // CATEGORY STATISTICS
    // ============================================
    
    // Sales by category
    $stmt = $conn->prepare("
        SELECT COALESCE(oi.category, 'Uncategorized') as category,
               SUM(oi.quantity) as total_quantity,
               SUM(oi.quantity * oi.price) as total_revenue,
               COUNT(DISTINCT oi.order_id) as order_count
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.store_id = ? AND o.created_at BETWEEN ? AND ?
        GROUP BY oi.category
        ORDER BY total_revenue DESC
    ");
    $stmt->execute([$storeId, $startDateTime, $endDateTime]);
    $categoryStats = $stmt->fetchAll();
    
    // ============================================
    // INVENTORY / PRODUCT LEVELS
    // ============================================
    
    // Get products with stock levels
    $stmt = $conn->prepare("
        SELECT id, name, price, category, 
               COALESCE(stock_quantity, 0) as stock_quantity,
               COALESCE(low_stock_threshold, 10) as low_stock_threshold
        FROM products 
        WHERE store_id = ?
        ORDER BY stock_quantity ASC
    ");
    $stmt->execute([$storeId]);
    $inventoryLevels = $stmt->fetchAll();
    
    // Low stock items
    $lowStockItems = array_filter($inventoryLevels, function($item) {
        return $item['stock_quantity'] <= $item['low_stock_threshold'];
    });
    
    // Out of stock items
    $outOfStockItems = array_filter($inventoryLevels, function($item) {
        return $item['stock_quantity'] <= 0;
    });
    
    // ============================================
    // OUTLIER DETECTION
    // ============================================
    
    // Calculate order value distribution for outliers
    $stmt = $conn->prepare("
        SELECT total FROM orders 
        WHERE store_id = ? AND created_at BETWEEN ? AND ?
        ORDER BY total ASC
    ");
    $stmt->execute([$storeId, $startDateTime, $endDateTime]);
    $allOrderTotals = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $outliers = [];
    if (count($allOrderTotals) > 4) {
        $count = count($allOrderTotals);
        $q1Index = floor($count * 0.25);
        $q3Index = floor($count * 0.75);
        $q1 = $allOrderTotals[$q1Index];
        $q3 = $allOrderTotals[$q3Index];
        $iqr = $q3 - $q1;
        $lowerBound = $q1 - (1.5 * $iqr);
        $upperBound = $q3 + (1.5 * $iqr);
        
        // Get outlier orders
        $stmt = $conn->prepare("
            SELECT id, order_id, order_name, total, created_at, status
            FROM orders 
            WHERE store_id = ? AND created_at BETWEEN ? AND ?
            AND (total < ? OR total > ?)
            ORDER BY total DESC
            LIMIT 20
        ");
        $stmt->execute([$storeId, $startDateTime, $endDateTime, $lowerBound, $upperBound]);
        $outliers = $stmt->fetchAll();
    }
    
    // ============================================
    // ORDER VALUE DISTRIBUTION (for bell curve)
    // ============================================
    
    $orderValueBuckets = [];
    if (count($allOrderTotals) > 0) {
        $minVal = min($allOrderTotals);
        $maxVal = max($allOrderTotals);
        $range = $maxVal - $minVal;
        $bucketSize = $range > 0 ? $range / 10 : 1;
        
        for ($i = 0; $i < 10; $i++) {
            $bucketMin = $minVal + ($i * $bucketSize);
            $bucketMax = $bucketMin + $bucketSize;
            $count = count(array_filter($allOrderTotals, function($val) use ($bucketMin, $bucketMax) {
                return $val >= $bucketMin && $val < $bucketMax;
            }));
            $orderValueBuckets[] = [
                'range' => '$' . number_format($bucketMin, 0) . '-$' . number_format($bucketMax, 0),
                'min' => $bucketMin,
                'max' => $bucketMax,
                'count' => $count
            ];
        }
    }
    
    // ============================================
    // COMPARISON STATS (vs previous period)
    // ============================================
    
    $periodDays = (strtotime($endDate) - strtotime($startDate)) / 86400;
    $prevStartDate = date('Y-m-d', strtotime($startDate . " - {$periodDays} days"));
    $prevEndDate = date('Y-m-d', strtotime($startDate . " - 1 day"));
    $prevStartDateTime = $prevStartDate . ' 00:00:00';
    $prevEndDateTime = $prevEndDate . ' 23:59:59';
    
    $stmt = $conn->prepare("
        SELECT COUNT(*) as count, 
               SUM(total) as revenue,
               AVG(total) as avg_order
        FROM orders 
        WHERE store_id = ? AND created_at BETWEEN ? AND ?
    ");
    $stmt->execute([$storeId, $prevStartDateTime, $prevEndDateTime]);
    $prevPeriodStats = $stmt->fetch();
    
    // Calculate percentage changes
    $orderChange = $prevPeriodStats['count'] > 0 
        ? (($orderStats['count'] - $prevPeriodStats['count']) / $prevPeriodStats['count']) * 100 
        : 0;
    $revenueChange = $prevPeriodStats['revenue'] > 0 
        ? (($orderStats['revenue'] - $prevPeriodStats['revenue']) / $prevPeriodStats['revenue']) * 100 
        : 0;
    $avgOrderChange = $prevPeriodStats['avg_order'] > 0 
        ? (($orderStats['avg_order'] - $prevPeriodStats['avg_order']) / $prevPeriodStats['avg_order']) * 100 
        : 0;
    
    // ============================================
    // RECENT ORDERS (for tabular data)
    // ============================================
    
    $stmt = $conn->prepare("
        SELECT o.id, o.order_id, o.order_name, o.total, o.status, 
               o.payment_method, o.created_at, o.completed_at,
               COUNT(oi.id) as item_count,
               SUM(oi.quantity) as total_items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.store_id = ? AND o.created_at BETWEEN ? AND ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 100
    ");
    $stmt->execute([$storeId, $startDateTime, $endDateTime]);
    $recentOrders = $stmt->fetchAll();
    
    // ============================================
    // RESPONSE
    // ============================================
    
    Response::json([
        'period' => [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'days' => $periodDays
        ],
        'summary' => [
            'totalOrders' => (int)$orderStats['count'],
            'totalRevenue' => (float)($orderStats['revenue'] ?? 0),
            'averageOrderValue' => (float)($orderStats['avg_order'] ?? 0),
            'minOrderValue' => (float)($orderStats['min_order'] ?? 0),
            'maxOrderValue' => (float)($orderStats['max_order'] ?? 0),
            'orderChange' => round($orderChange, 1),
            'revenueChange' => round($revenueChange, 1),
            'avgOrderChange' => round($avgOrderChange, 1)
        ],
        'ordersByStatus' => array_map(function($row) {
            return [
                'status' => $row['status'],
                'count' => (int)$row['count'],
                'revenue' => (float)$row['revenue']
            ];
        }, $ordersByStatus),
        'ordersByPayment' => array_map(function($row) {
            return [
                'paymentMethod' => $row['payment_method'],
                'count' => (int)$row['count'],
                'revenue' => (float)$row['revenue']
            ];
        }, $ordersByPayment),
        'dailyTrends' => array_map(function($row) {
            return [
                'date' => $row['date'],
                'orders' => (int)$row['orders'],
                'revenue' => (float)$row['revenue'],
                'avgOrder' => (float)$row['avg_order']
            ];
        }, $dailyTrends),
        'hourlyDistribution' => array_map(function($row) {
            return [
                'hour' => (int)$row['hour'],
                'orders' => (int)$row['orders'],
                'revenue' => (float)$row['revenue']
            ];
        }, $hourlyDistribution),
        'topProducts' => array_map(function($row) {
            return [
                'name' => $row['product_name'],
                'quantity' => (int)$row['total_quantity'],
                'revenue' => (float)$row['total_revenue'],
                'orderCount' => (int)$row['order_count']
            ];
        }, $topProducts),
        'lowestProducts' => array_map(function($row) {
            return [
                'name' => $row['product_name'],
                'quantity' => (int)$row['total_quantity'],
                'revenue' => (float)$row['total_revenue'],
                'orderCount' => (int)$row['order_count']
            ];
        }, $lowestProducts),
        'categoryStats' => array_map(function($row) {
            return [
                'category' => $row['category'],
                'quantity' => (int)$row['total_quantity'],
                'revenue' => (float)$row['total_revenue'],
                'orderCount' => (int)$row['order_count']
            ];
        }, $categoryStats),
        'inventory' => [
            'totalProducts' => count($inventoryLevels),
            'lowStockCount' => count($lowStockItems),
            'outOfStockCount' => count($outOfStockItems),
            'lowStockItems' => array_values(array_map(function($item) {
                return [
                    'id' => $item['id'],
                    'name' => $item['name'],
                    'category' => $item['category'],
                    'stockQuantity' => (int)$item['stock_quantity'],
                    'threshold' => (int)$item['low_stock_threshold']
                ];
            }, array_slice($lowStockItems, 0, 10)))
        ],
        'outliers' => array_map(function($row) {
            return [
                'id' => $row['id'],
                'orderId' => $row['order_id'],
                'orderName' => $row['order_name'],
                'total' => (float)$row['total'],
                'status' => $row['status'],
                'createdAt' => $row['created_at']
            ];
        }, $outliers),
        'orderValueDistribution' => $orderValueBuckets,
        'recentOrders' => array_map(function($row) {
            return [
                'id' => $row['id'],
                'orderId' => $row['order_id'],
                'orderName' => $row['order_name'],
                'total' => (float)$row['total'],
                'status' => $row['status'],
                'paymentMethod' => $row['payment_method'],
                'itemCount' => (int)$row['item_count'],
                'totalItems' => (int)$row['total_items'],
                'createdAt' => $row['created_at'],
                'completedAt' => $row['completed_at']
            ];
        }, $recentOrders)
    ]);
    
} catch (Exception $e) {
    error_log("Insights API error: " . $e->getMessage());
    Response::serverError('Server error: ' . $e->getMessage());
}
