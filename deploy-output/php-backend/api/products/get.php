<?php
/**
 * Get Products Endpoint
 * GET /api/products/get.php?storeGuid={guid}
 * Get all products for a store
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

function attachProductCategories($conn, $products) {
    if (!is_array($products) || count($products) === 0) {
        return $products;
    }

    try {
        $checkStmt = $conn->prepare("SHOW TABLES LIKE 'product_categories'");
        $checkStmt->execute();
        if ($checkStmt->fetch() === false) {
            // Table doesn't exist, use legacy single category
            foreach ($products as &$product) {
                $cat = strtolower(trim($product['category'] ?? 'all'));
                $product['categories'] = array_unique(['all', $cat]);
            }
            unset($product);
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
        $sql = "SELECT product_id, category_id FROM product_categories WHERE product_id IN ($placeholders)";
        $stmt = $conn->prepare($sql);
        $stmt->execute($productIds);
        $rows = $stmt->fetchAll();

        $categoryMap = [];
        foreach ($rows as $row) {
            $pid = (int)$row['product_id'];
            if (!isset($categoryMap[$pid])) {
                $categoryMap[$pid] = [];
            }
            $categoryMap[$pid][] = $row['category_id'];
        }

        foreach ($products as &$product) {
            $pid = isset($product['id']) ? (int)$product['id'] : null;
            if ($pid !== null && isset($categoryMap[$pid])) {
                // Use array_values to re-index and ensure proper JSON array encoding
                $product['categories'] = array_values(array_unique(array_merge(['all'], $categoryMap[$pid])));
            } else {
                // Fallback to legacy category field
                $cat = strtolower(trim($product['category'] ?? 'all'));
                $product['categories'] = array_values(array_unique(['all', $cat]));
            }
        }
        unset($product);

        return $products;
    } catch (Exception $e) {
        error_log('attachProductCategories error: ' . $e->getMessage());
        return $products;
    }
}

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
    
    $products = attachProductUpcs($conn, $products);
    $products = attachProductCategories($conn, $products);
    
    Response::json($products);
    
} catch (Exception $e) {
    error_log("Get products error: " . $e->getMessage());
    Response::serverError('Server error');
}
