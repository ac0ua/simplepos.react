<?php
/**
 * Process Payment Endpoint
 * POST /api/orders/process-payment.php
 * Process payment for an order
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
    $orderId = $data['orderId'] ?? null;
    $paymentMethod = $data['paymentMethod'] ?? null;
    $amount = $data['amount'] ?? null;
    $cashGiven = $data['cashGiven'] ?? null;
    $changeAmount = $data['changeAmount'] ?? null;
    
    if (!$storeGuid || !$orderId || !$paymentMethod) {
        Response::error('Store GUID, order ID, and payment method are required');
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
    
    // Get order
    $stmt = $conn->prepare("SELECT * FROM orders WHERE order_id = ? AND store_id = ?");
    $stmt->execute([$orderId, $store['id']]);
    $order = $stmt->fetch();
    
    if (!$order) {
        Response::notFound('Order not found');
    }
    
    // Update order with payment information
    $stmt = $conn->prepare("
        UPDATE orders 
        SET payment_method = ?, 
            cash_given = ?, 
            change_amount = ?, 
            status = 'active',
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$paymentMethod, $cashGiven, $changeAmount, $order['id']]);
    
    // Get updated order
    $stmt = $conn->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$order['id']]);
    $updatedOrder = $stmt->fetch();
    
    Response::success(['order' => $updatedOrder], 'Payment processed successfully');
    
} catch (Exception $e) {
    error_log("Process payment error: " . $e->getMessage());
    Response::serverError('Server error');
}
