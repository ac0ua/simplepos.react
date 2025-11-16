<?php
/**
 * Update Product Endpoint
 * PUT /api/products/update.php
 * Update product details
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

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
    
    // Get updated product
    $stmt = $conn->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    
    Response::json($product);
    
} catch (Exception $e) {
    error_log("Update product error: " . $e->getMessage());
    Response::serverError('Server error');
}
