<?php
/**
 * Delete Product Endpoint
 * DELETE /api/products/delete.php
 * Soft delete product
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
    
    if (!$productId) {
        Response::error('Product ID is required');
    }
    
    $db = new Database();
    $conn = $db->connect();
    
    // Get product
    $stmt = $conn->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    
    if (!$product) {
        Response::notFound('Product not found');
    }
    
    // Soft delete
    $stmt = $conn->prepare("UPDATE products SET is_active = 0, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$productId]);
    
    Response::success([], 'Product deleted successfully');
    
} catch (Exception $e) {
    error_log("Delete product error: " . $e->getMessage());
    Response::serverError('Server error');
}
