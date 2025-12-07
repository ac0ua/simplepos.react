<?php
/**
 * Server-Sent Events (SSE) Endpoint
 * GET /api/realtime/sse.php?storeGuid={guid}&label={label}
 * Real-time updates alternative to WebSocket
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';

// Set headers for SSE
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no'); // Disable nginx buffering

// Disable output buffering
if (ob_get_level()) ob_end_clean();

$storeGuid = $_GET['storeGuid'] ?? null;
$label = $_GET['label'] ?? null;

if (!$storeGuid || !$label) {
    echo "event: error\n";
    echo "data: " . json_encode(['error' => 'Store GUID and label are required']) . "\n\n";
    flush();
    exit();
}

$db = new Database();
$conn = $db->connect();

// Get store ID
$stmt = $conn->prepare("SELECT id FROM stores WHERE guid = ?");
$stmt->execute([$storeGuid]);
$store = $stmt->fetch();

if (!$store) {
    echo "event: error\n";
    echo "data: " . json_encode(['error' => 'Store not found']) . "\n\n";
    flush();
    exit();
}

$lastOrderCheck = time();
$lastProductCheck = time();

// Keep connection alive and check for updates
while (true) {
    // Check for new orders every 2 seconds
    if (time() - $lastOrderCheck >= 2) {
        $stmt = $conn->prepare("
            SELECT o.*, 
                   (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
            FROM orders o
            WHERE o.store_id = ? 
            AND o.updated_at >= DATE_SUB(NOW(), INTERVAL 5 SECOND)
            ORDER BY o.updated_at DESC
            LIMIT 5
        ");
        $stmt->execute([$store['id']]);
        $recentOrders = $stmt->fetchAll();
        
        if (!empty($recentOrders)) {
            foreach ($recentOrders as $order) {
                echo "event: order-update\n";
                echo "data: " . json_encode([
                    'action' => 'statusUpdate',
                    'order' => $order
                ]) . "\n\n";
            }
            flush();
        }
        
        $lastOrderCheck = time();
    }
    
    // Send heartbeat every 15 seconds
    echo "event: heartbeat\n";
    echo "data: " . json_encode(['timestamp' => time()]) . "\n\n";
    flush();
    
    // Sleep for 1 second before next check
    sleep(1);
    
    // Break if connection closed
    if (connection_aborted()) break;
}
