<?php
/**
 * Create Product Endpoint
 * POST /api/products/create.php
 * Add new product
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

function syncProductUpcs($conn, $storeId, $productId, $upcs)
{
    if (!is_array($upcs) || count($upcs) === 0) {
        return;
    }

    try {
        $checkStmt = $conn->prepare("SHOW TABLES LIKE 'product_upcs'");
        $checkStmt->execute();
        if ($checkStmt->fetch() === false) {
            return;
        }

        $deleteStmt = $conn->prepare('DELETE FROM product_upcs WHERE product_id = ? AND store_id = ?');
        $deleteStmt->execute([$productId, $storeId]);

        $insertStmt = $conn->prepare('
            INSERT INTO product_upcs (store_id, product_id, upc, note, created_at, updated_at)
            VALUES (?, ?, ?, ?, NOW(), NOW())
        ');

        foreach ($upcs as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            $code = isset($entry['upc']) ? $entry['upc'] : (isset($entry['code']) ? $entry['code'] : null);
            if (!$code) {
                continue;
            }
            $note = isset($entry['note']) ? $entry['note'] : null;
            $insertStmt->execute([$storeId, $productId, $code, $note]);
        }
    } catch (Exception $e) {
        error_log('syncProductUpcs (create) error: ' . $e->getMessage());
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $storeGuid = $data['storeGuid'] ?? null;
    $name = $data['name'] ?? null;
    $price = $data['price'] ?? null;
    $category = $data['category'] ?? 'All Products';
    $image = $data['image'] ?? null;
    $stock = $data['stock'] ?? 0;
    $barcode = $data['barcode'] ?? null;
    $color = $data['color'] ?? '#CCCCCC';
    $upcs = $data['upcs'] ?? [];
    
    if (!$storeGuid || !$name || $price === null) {
        Response::error('Store GUID, name, and price are required');
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
    
    // Create product
    $stmt = $conn->prepare("
        INSERT INTO products (store_id, name, price, category, image, stock, barcode, color, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    ");
    $stmt->execute([$store['id'], $name, $price, $category, $image, $stock, $barcode, $color]);
    
    $productId = $conn->lastInsertId();

    syncProductUpcs($conn, $store['id'], $productId, $upcs);
    
    // Get created product
    $stmt = $conn->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    
    Response::json($product, 201);
    
} catch (Exception $e) {
    error_log("Create product error: " . $e->getMessage());
    Response::serverError('Server error');
}
