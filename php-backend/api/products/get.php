<?php
/**
 * Get Products Endpoint
 * GET /api/products/get.php?storeGuid={guid}
 * Get all products for a store
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

function attachProductUpcs($conn, $products) {
    if (!is_array($products) || count($products) === 0) {
        return $products;
    }

    try {
        $checkStmt = $conn->prepare("SHOW TABLES LIKE 'product_upcs'");
        $checkStmt->execute();
        if ($checkStmt->fetch() === false) {
            return $products;
        }

        $productIds = [];
        foreach ($products as $product) {
            if (isset($product['id'])) {
                $productIds[] = (int)$product['id'];
            }
        }

        if (count($productIds) === 0) {
            return $products;
        }

        $placeholders = implode(',', array_fill(0, count($productIds), '?'));
        $sql = "SELECT product_id, upc, note FROM product_upcs WHERE product_id IN ($placeholders)";
        $stmt = $conn->prepare($sql);
        $stmt->execute($productIds);
        $rows = $stmt->fetchAll();

        $upcMap = [];
        foreach ($rows as $row) {
            $pid = (int)$row['product_id'];
            if (!isset($upcMap[$pid])) {
                $upcMap[$pid] = [];
            }
            $upcMap[$pid][] = [
                'upc' => $row['upc'],
                'note' => $row['note']
            ];
        }

        foreach ($products as &$product) {
            $pid = isset($product['id']) ? (int)$product['id'] : null;
            $product['upcs'] = $pid !== null && isset($upcMap[$pid]) ? $upcMap[$pid] : [];
        }
        unset($product);

        return $products;
    } catch (Exception $e) {
        error_log('attachProductUpcs error: ' . $e->getMessage());
        return $products;
    }
}

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
    
    // Get products
    $stmt = $conn->prepare("
        SELECT * FROM products 
        WHERE store_id = ? AND is_active = 1 
        ORDER BY name ASC
    ");
    $stmt->execute([$store['id']]);
    $products = $stmt->fetchAll();
    
    // If no products, seed with defaults
    if (count($products) === 0) {
        $defaultProducts = [
            ['Candy Bar', 1.55, 'Snacks', 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop', 100, '1234567890', '#FFB6C1'],
            ['Chips', 2.50, 'Snacks', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop', 75, '2345678901', '#FFD700'],
            ['Ice Cream', 3.50, 'Frozen', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop', 50, '3456789012', '#87CEEB'],
            ['Motor Oil', 6.09, 'Automotive', 'https://images.unsplash.com/photo-1621188988909-fbef0a88dc04?w=300&h=300&fit=crop', 30, '4567890123', '#708090'],
            ['Sample Product', 3.87, 'All Products', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop', 200, '5678901234', '#FFD700'],
            ['Soda', 1.75, 'Beverages', 'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?w=300&h=300&fit=crop', 150, '6789012345', '#98D8C8'],
            ['Water Bottle', 1.00, 'Beverages', 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=300&h=300&fit=crop', 200, '7890123456', '#E0F2F1']
        ];
        
        $stmt = $conn->prepare("
            INSERT INTO products (store_id, name, price, category, image, stock, barcode, color, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
        ");
        
        foreach ($defaultProducts as $product) {
            $stmt->execute(array_merge([$store['id']], $product));
        }
        
        // Re-fetch products
        $stmt = $conn->prepare("SELECT * FROM products WHERE store_id = ? AND is_active = 1 ORDER BY name ASC");
        $stmt->execute([$store['id']]);
        $products = $stmt->fetchAll();
    }
    
    $products = attachProductUpcs($conn, $products);
    
    Response::json($products);
    
} catch (Exception $e) {
    error_log("Get products error: " . $e->getMessage());
    Response::serverError('Server error');
}
