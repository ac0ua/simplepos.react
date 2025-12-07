<?php
/**
 * Track Order Endpoint
 * GET /api/orders/track.php?label={label}&orderNumber={number}
 * Public order tracking by label and order number (for QR code scanning)
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

try {
    $label = $_GET['label'] ?? null;
    $orderNumber = $_GET['orderNumber'] ?? null;
    
    if (!$label || !$orderNumber) {
        Response::error('Label and order number are required');
    }
    
    $db = new Database();
    $conn = $db->connect();
    
    // Find store by label
    $stmt = $conn->prepare("
        SELECT sl.*, s.id as store_id, s.guid, s.business_name
        FROM store_labels sl
        INNER JOIN stores s ON sl.store_id = s.id
        WHERE sl.label = ?
    ");
    $stmt->execute([$label]);
    $storeLabel = $stmt->fetch();
    
    if (!$storeLabel) {
        Response::notFound('Store not found');
    }
    
    // Find order by order number
    $stmt = $conn->prepare("
        SELECT * FROM orders 
        WHERE order_id = ? AND store_id = ?
    ");
    $stmt->execute([$orderNumber, $storeLabel['store_id']]);
    $order = $stmt->fetch();
    
    if (!$order) {
        Response::notFound('Order not found');
    }
    
    // Get order items
    $stmt = $conn->prepare("SELECT product_name, price, quantity, subtotal FROM order_items WHERE order_id = ?");
    $stmt->execute([$order['id']]);
    $items = $stmt->fetchAll();
    
    // Return order information for tracking display
    $publicOrder = [
        'order_id' => $order['order_id'],
        'orderNumber' => $order['order_id'],
        'order_name' => $order['order_name'],
        'orderName' => $order['order_name'],
        'kiosk_number' => $order['kiosk_number'],
        'kioskNumber' => $order['kiosk_number'],
        'status' => $order['status'],
        'payment_status' => $order['payment_method'] ? 'paid' : 'pending',
        'payment_method' => $order['payment_method'],
        'subtotal' => $order['subtotal'],
        'tax' => $order['tax'],
        'total' => $order['total'],
        'itemCount' => count($items),
        'items' => array_map(function($item) {
            return [
                'product_name' => $item['product_name'],
                'name' => $item['product_name'],
                'price' => $item['price'],
                'quantity' => $item['quantity'],
                'subtotal' => $item['subtotal']
            ];
        }, $items),
        'created_at' => $order['created_at'],
        'createdAt' => $order['created_at'],
        'storeName' => $storeLabel['business_name']
    ];
    
    Response::success(['order' => $publicOrder]);
    
} catch (Exception $e) {
    error_log("Track order error: " . $e->getMessage());
    Response::serverError('Server error');
}
