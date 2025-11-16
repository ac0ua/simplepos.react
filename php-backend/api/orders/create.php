<?php
/**
 * Create Order Endpoint
 * POST /api/orders/create.php
 * Create new order
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';
require_once '../../utils/uuid.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $storeGuid = $data['storeGuid'] ?? null;
    $items = $data['items'] ?? [];
    $subtotal = $data['subtotal'] ?? 0;
    $tax = $data['tax'] ?? 0;
    $total = $data['total'] ?? 0;
    $paymentMethod = $data['paymentMethod'] ?? null;
    $cashierAction = $data['cashierAction'] ?? null;
    $cashGiven = $data['cashGiven'] ?? null;
    $changeAmount = $data['changeAmount'] ?? null;
    $orderName = $data['orderName'] ?? null;
    $orderNumber = $data['orderNumber'] ?? UUID::v4();
    $kioskNumber = $data['kioskNumber'] ?? null;
    $paymentStatus = $data['paymentStatus'] ?? 'pending';
    $orderStatus = $data['orderStatus'] ?? 'pending';
    
    if (!$storeGuid || empty($items)) {
        Response::error('Store GUID and items are required');
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
    
    // Start transaction
    $conn->beginTransaction();
    
    try {
        // Create order
        $status = ($orderStatus && trim($orderStatus)) ?: (($paymentStatus && trim($paymentStatus)) ?: 'pending');
        
        $stmt = $conn->prepare("
            INSERT INTO orders (order_id, store_id, order_name, kiosk_number, subtotal, tax, total, 
                               payment_method, cash_given, change_amount, status, cashier_action, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $orderNumber, $store['id'], $orderName, $kioskNumber, 
            $subtotal, $tax, $total, $paymentMethod, 
            $cashGiven, $changeAmount, $status, $cashierAction
        ]);
        
        $orderId = $conn->lastInsertId();
        
        // Create order items
        $orderItems = [];
        $stmt = $conn->prepare("
            INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        foreach ($items as $item) {
            $itemSubtotal = $item['price'] * $item['quantity'];
            $stmt->execute([
                $orderId,
                $item['id'],
                $item['name'],
                $item['price'],
                $item['quantity'],
                $itemSubtotal
            ]);
            
            // Update product stock
            $stmtStock = $conn->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
            $stmtStock->execute([$item['quantity'], $item['id']]);
            
            $orderItems[] = [
                'id' => $conn->lastInsertId(),
                'order_id' => $orderId,
                'product_id' => $item['id'],
                'product_name' => $item['name'],
                'price' => $item['price'],
                'quantity' => $item['quantity'],
                'subtotal' => $itemSubtotal
            ];
        }
        
        $conn->commit();
        
        // Get full order
        $stmt = $conn->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();
        $order['items'] = $orderItems;
        
        Response::success(['order' => $order], 'Order created successfully');
        
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Create order error: " . $e->getMessage());
    Response::serverError('Server error');
}
