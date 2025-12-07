<?php

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    $storeGuid = $data['storeGuid'] ?? null;
    $productId = $data['productId'] ?? null;
    $quantity = isset($data['quantity']) ? (int)$data['quantity'] : null;
    $operation = $data['operation'] ?? null;

    if (!$storeGuid || !$productId || $quantity === null || $operation === null) {
        Response::error('Store GUID, product ID, quantity, and operation are required');
    }

    if ($quantity < 0) {
        Response::error('Quantity must be zero or positive');
    }

    $allowedOperations = ['add', 'subtract', 'set'];
    if (!in_array($operation, $allowedOperations, true)) {
        Response::error('Invalid operation');
    }

    $db = new Database();
    $conn = $db->connect();

    $stmt = $conn->prepare('SELECT id FROM stores WHERE guid = ?');
    $stmt->execute([$storeGuid]);
    $store = $stmt->fetch();

    if (!$store) {
        Response::notFound('Store not found');
    }

    $stmt = $conn->prepare('SELECT id, stock FROM products WHERE id = ? AND store_id = ?');
    $stmt->execute([$productId, $store['id']]);
    $product = $stmt->fetch();

    if (!$product) {
        Response::notFound('Product not found');
    }

    $currentStock = (int)$product['stock'];

    switch ($operation) {
        case 'add':
            $newStock = $currentStock + $quantity;
            break;
        case 'subtract':
            $newStock = $currentStock - $quantity;
            break;
        case 'set':
            $newStock = $quantity;
            break;
        default:
            Response::error('Invalid operation');
    }

    $stmt = $conn->prepare('UPDATE products SET stock = ?, updated_at = NOW() WHERE id = ? AND store_id = ?');
    $stmt->execute([$newStock, $productId, $store['id']]);

    $stmt = $conn->prepare('SELECT * FROM products WHERE id = ?');
    $stmt->execute([$productId]);
    $updatedProduct = $stmt->fetch();

    Response::json($updatedProduct);
} catch (Exception $e) {
    error_log('Update stock error: ' . $e->getMessage());
    Response::serverError('Server error');
}
