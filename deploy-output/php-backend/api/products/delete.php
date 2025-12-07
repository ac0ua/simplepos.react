<?php
/**
 * Delete Product Endpoint
 * DELETE /api/products/delete.php
 * Soft delete product
 * SEC-007: Requires storeGuid validation
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::error('Method not allowed', 405);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $productId = $data['productId'] ?? null;
    $storeGuid = $data['storeGuid'] ?? null;
    
    // SEC-007: Require storeGuid for authorization
    if (!$productId || !$storeGuid) {
        Response::error('Product ID and Store GUID are required');
    }
    
    $db = new Database();
    $conn = $db->connect();
    
    // SEC-007: Get store first to validate ownership
    $stmt = $conn->prepare("SELECT id FROM stores WHERE guid = ?");
    $stmt->execute([$storeGuid]);
    $store = $stmt->fetch();
    
    if (!$store) {
        Response::notFound('Store not found');
    }
    
    // SEC-007: Get product and verify it belongs to the store
    $stmt = $conn->prepare("SELECT * FROM products WHERE id = ? AND store_id = ?");
    $stmt->execute([$productId, $store['id']]);
    $product = $stmt->fetch();
    
    if (!$product) {
        Response::notFound('Product not found or does not belong to this store');
    }
    
    // Soft delete - only delete if product belongs to the store
    $stmt = $conn->prepare("UPDATE products SET is_active = 0, updated_at = NOW() WHERE id = ? AND store_id = ?");
    $stmt->execute([$productId, $store['id']]);
    
    Response::success([], 'Product deleted successfully');
    
} catch (Exception $e) {
    error_log("Delete product error: " . $e->getMessage());
    Response::serverError('Server error');
}
