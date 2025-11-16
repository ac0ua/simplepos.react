<?php
/**
 * Search Products Endpoint
 * GET /api/products/search.php?storeGuid={guid}&query={q}&category={cat}
 * Search products by name or barcode
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

try {
    $storeGuid = $_GET['storeGuid'] ?? null;
    $query = $_GET['query'] ?? null;
    $category = $_GET['category'] ?? null;
    
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
    
    // Build query
    $sql = "SELECT * FROM products WHERE store_id = ? AND is_active = 1";
    $params = [$store['id']];
    
    if ($query) {
        $sql .= " AND (name LIKE ? OR barcode LIKE ?)";
        $params[] = "%$query%";
        $params[] = "%$query%";
    }
    
    if ($category && $category !== 'All Products') {
        $sql .= " AND category = ?";
        $params[] = $category;
    }
    
    $sql .= " ORDER BY name ASC";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll();
    
    Response::json($products);
    
} catch (Exception $e) {
    error_log("Search products error: " . $e->getMessage());
    Response::serverError('Server error');
}
