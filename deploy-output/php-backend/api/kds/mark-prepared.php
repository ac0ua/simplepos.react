<?php
/**
 * KDS Mark Prepared Endpoint (PHP)
 * POST /php-backend/api/kds/mark-prepared.php
 * Body: { storeId, orderItemId, quantity }
 * Updates prep_quantity and prep_status for an order item.
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        Response::error('Invalid JSON payload');
    }

    $storeId = $input['storeId'] ?? null;
    $orderItemId = $input['orderItemId'] ?? null;
    $quantity = $input['quantity'] ?? null;

    if (!$storeId || !$orderItemId || !$quantity) {
        Response::error('Missing required fields: storeId, orderItemId, quantity');
    }

    $quantity = (int)$quantity;
    if ($quantity <= 0) {
        Response::error('Quantity must be greater than zero');
    }

    $db = new Database();
    $conn = $db->connect();

    // Ensure the order item belongs to the given store
    $sql = "
        SELECT oi.*
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        WHERE oi.id = :orderItemId
          AND o.store_id = :storeId
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':orderItemId', (int)$orderItemId, PDO::PARAM_INT);
    $stmt->bindValue(':storeId', (int)$storeId, PDO::PARAM_INT);
    $stmt->execute();
    $item = $stmt->fetch();

    if (!$item) {
        Response::notFound('Order item not found');
    }

    $currentPrep = (int)($item['prep_quantity'] ?? 0);
    $totalQuantity = (int)$item['quantity'];
    $newPrep = min($currentPrep + $quantity, $totalQuantity);
    $prepStatus = $newPrep >= $totalQuantity ? 'prepared' : 'pending';

    $update = $conn->prepare('
        UPDATE order_items
        SET prep_quantity = :prepQty, prep_status = :prepStatus
        WHERE id = :orderItemId
    ');
    $update->bindValue(':prepQty', $newPrep, PDO::PARAM_INT);
    $update->bindValue(':prepStatus', $prepStatus, PDO::PARAM_STR);
    $update->bindValue(':orderItemId', (int)$orderItemId, PDO::PARAM_INT);
    $update->execute();

    Response::success([
        'orderItem' => [
            'id' => (int)$item['id'],
            'productName' => $item['product_name'],
            'quantity' => $totalQuantity,
            'prepQuantity' => $newPrep,
            'prepStatus' => $prepStatus
        ]
    ]);
} catch (Exception $e) {
    error_log('KDS mark-prepared error: ' . $e->getMessage());
    Response::serverError('Failed to mark item as prepared');
}
