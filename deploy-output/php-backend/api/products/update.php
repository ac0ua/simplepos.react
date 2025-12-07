<?php
/**
 * Update Product Endpoint
 * PUT /api/products/update.php
 * Update product details
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

function syncProductCategories($conn, $productId, $categories)
{
    try {
        $checkStmt = $conn->prepare("SHOW TABLES LIKE 'product_categories'");
        $checkStmt->execute();
        if ($checkStmt->fetch() === false) {
            return;
        }

        // Delete existing categories
        $deleteStmt = $conn->prepare('DELETE FROM product_categories WHERE product_id = ?');
        $deleteStmt->execute([$productId]);

        // Always include 'all' category
        $categoriesToInsert = ['all'];
        
        if (is_array($categories)) {
            foreach ($categories as $cat) {
                $catId = strtolower(trim($cat));
                if ($catId && $catId !== 'all' && $catId !== 'all products') {
                    $categoriesToInsert[] = $catId;
                }
            }
        } elseif (is_string($categories) && !empty($categories)) {
            $catId = strtolower(trim($categories));
            if ($catId !== 'all' && $catId !== 'all products') {
                $categoriesToInsert[] = $catId;
            }
        }

        $categoriesToInsert = array_unique($categoriesToInsert);

        $insertStmt = $conn->prepare('
            INSERT INTO product_categories (product_id, category_id)
            VALUES (?, ?)
        ');

        foreach ($categoriesToInsert as $catId) {
            $insertStmt->execute([$productId, $catId]);
        }
    } catch (Exception $e) {
        error_log('syncProductCategories (update) error: ' . $e->getMessage());
    }
}

function syncProductUpcs($conn, $storeId, $productId, $upcs)
{
    if (!is_array($upcs)) {
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

        if (count($upcs) === 0) {
            return;
        }

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
        error_log('syncProductUpcs (update) error: ' . $e->getMessage());
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error('Method not allowed', 405);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $storeGuid = $data['storeGuid'] ?? null;
    $productId = $data['productId'] ?? null;
    
    if (!$storeGuid || !$productId) {
        Response::error('Store GUID and product ID are required');
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
    
    // Get product
    $stmt = $conn->prepare("SELECT * FROM products WHERE id = ? AND store_id = ?");
    $stmt->execute([$productId, $store['id']]);
    $product = $stmt->fetch();
    
    if (!$product) {
        Response::notFound('Product not found');
    }
    
    // Build update query
    $updateFields = [];
    $params = [];
    
    if (isset($data['name'])) {
        $updateFields[] = 'name = ?';
        $params[] = $data['name'];
    }
    if (isset($data['price'])) {
        $updateFields[] = 'price = ?';
        $params[] = $data['price'];
    }
    if (isset($data['category'])) {
        $updateFields[] = 'category = ?';
        $params[] = $data['category'];
    }
    if (isset($data['image'])) {
        $updateFields[] = 'image = ?';
        $params[] = $data['image'];
    }
    if (isset($data['stock'])) {
        $updateFields[] = 'stock = ?';
        $params[] = $data['stock'];
    }
    if (isset($data['barcode'])) {
        $updateFields[] = 'barcode = ?';
        $params[] = $data['barcode'];
    }
    if (isset($data['color'])) {
        $updateFields[] = 'color = ?';
        $params[] = $data['color'];
    }
    $upcs = isset($data['upcs']) ? $data['upcs'] : null;
    $categories = isset($data['categories']) ? $data['categories'] : null;
    
    if (count($updateFields) === 0) {
        Response::error('No fields to update');
    }
    
    $updateFields[] = 'updated_at = NOW()';
    $params[] = $productId;
    $params[] = $store['id'];
    
    $stmt = $conn->prepare("
        UPDATE products 
        SET " . implode(', ', $updateFields) . "
        WHERE id = ? AND store_id = ?
    ");
    $stmt->execute($params);

    if ($upcs !== null) {
        syncProductUpcs($conn, $store['id'], $productId, $upcs);
    }
    
    // Sync categories if provided
    if ($categories !== null) {
        syncProductCategories($conn, $productId, $categories);
    }
    
    // Get updated product
    $stmt = $conn->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    
    Response::json($product);
    
} catch (Exception $e) {
    error_log("Update product error: " . $e->getMessage());
    Response::serverError('Server error');
}
