<?php
/**
 * Create Product Endpoint
 * POST /api/products/create.php
 * Add new product
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

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
    
    // Get created product
    $stmt = $conn->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    
    Response::json($product, 201);
    
} catch (Exception $e) {
    error_log("Create product error: " . $e->getMessage());
    Response::serverError('Server error');
}
