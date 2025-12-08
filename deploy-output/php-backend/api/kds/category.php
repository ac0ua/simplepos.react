<?php
/**
 * KDS Category Endpoint (PHP)
 * GET /php-backend/api/kds/category.php?storeId={id}&category={name}
 * Returns pending and prepared items for a specific category, aggregated
 * by product name, matching the Node.js KDS category API shape.
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

try {
    $storeId = $_GET['storeId'] ?? null;
    $category = $_GET['category'] ?? null;

    if (!$storeId || $category === null) {
        Response::error('Store ID and category are required');
    }

    $db = new Database();
    $conn = $db->connect();

    // Build category filter. We avoid reusing the same named parameter
    // multiple times because native MySQL prepared statements (with
    // ATTR_EMULATE_PREPARES = false) do not support that.
    $categoryFilterSql = '';
    $params = [
        ':storeId' => (int)$storeId,
    ];

    if ($category === 'Uncategorized') {
        // Match items with no product category
        $categoryFilterSql = ' AND (p.category IS NULL OR p.category = "")';
    } else {
        // Normal named category (beverages, snacks, all products, etc.)
        $categoryFilterSql = ' AND p.category = :category';
        $params[':category'] = $category;
    }

    // Fetch all active order items for this store and category
    // Mirrors backend/routes/kds.js category route behaviour.
    $sql = "
        SELECT 
            oi.id AS order_item_id,
            oi.order_id,
            oi.product_id,
            oi.product_name,
            oi.quantity,
            oi.prep_quantity,
            o.order_name,
            o.kiosk_number,
            o.created_at,
            p.category AS product_category
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.store_id = :storeId
          AND o.status IN ('pending', 'active', 'processing')" 
        . $categoryFilterSql;

    $stmt = $conn->prepare($sql);
    foreach ($params as $name => $value) {
        if ($name === ':storeId') {
            $stmt->bindValue($name, $value, PDO::PARAM_INT);
        } else {
            $stmt->bindValue($name, $value, PDO::PARAM_STR);
        }
    }
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $pendingMap = [];
    $preparedMap = [];

    foreach ($rows as $row) {
        $productName = $row['product_name'];
        $quantity = (int)$row['quantity'];
        $prepQuantity = (int)($row['prep_quantity'] ?? 0);
        $pendingQty = $quantity - $prepQuantity;
        $preparedQty = $prepQuantity;

        // Pending items aggregation
        if ($pendingQty > 0) {
            if (!isset($pendingMap[$productName])) {
                $pendingMap[$productName] = [
                    'productName' => $productName,
                    'productId' => $row['product_id'],
                    'totalQuantity' => 0,
                    'orderItems' => []
                ];
            }

            $pendingMap[$productName]['totalQuantity'] += $pendingQty;
            $pendingMap[$productName]['orderItems'][] = [
                'orderItemId' => (int)$row['order_item_id'],
                'orderId' => (int)$row['order_id'],
                'orderName' => $row['order_name'],
                'kioskNumber' => $row['kiosk_number'],
                'quantity' => $pendingQty,
                'createdAt' => $row['created_at']
            ];
        }

        // Prepared items aggregation
        if ($preparedQty > 0) {
            if (!isset($preparedMap[$productName])) {
                $preparedMap[$productName] = [
                    'productName' => $productName,
                    'productId' => $row['product_id'],
                    'totalQuantity' => 0,
                    'orderItems' => []
                ];
            }

            $preparedMap[$productName]['totalQuantity'] += $preparedQty;
            $preparedMap[$productName]['orderItems'][] = [
                'orderItemId' => (int)$row['order_item_id'],
                'orderId' => (int)$row['order_id'],
                'orderName' => $row['order_name'],
                'kioskNumber' => $row['kiosk_number'],
                'quantity' => $preparedQty,
                'createdAt' => $row['created_at']
            ];
        }
    }

    // Convert maps to sorted arrays
    $pendingItems = array_values($pendingMap);
    usort($pendingItems, function ($a, $b) {
        return strcmp($a['productName'], $b['productName']);
    });

    $preparedItems = array_values($preparedMap);
    usort($preparedItems, function ($a, $b) {
        return strcmp($a['productName'], $b['productName']);
    });

    Response::success([
        'storeId' => (int)$storeId,
        'category' => $category,
        'pendingItems' => $pendingItems,
        'preparedItems' => $preparedItems,
        'timestamp' => date('c')
    ]);
} catch (Exception $e) {
    error_log('KDS category error: ' . $e->getMessage());
    Response::serverError('Failed to fetch category items');
}
