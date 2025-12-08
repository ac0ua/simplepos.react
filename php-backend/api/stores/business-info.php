<?php
/**
 * Business Info API
 * GET: Retrieve business info for a store
 * POST: Save/update business info for a store
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/response.php';

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $pdo = getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get business info
        $storeGuid = $_GET['storeGuid'] ?? null;
        
        if (!$storeGuid) {
            sendError('Store GUID is required', 400);
        }
        
        // First check if store exists
        $stmt = $pdo->prepare("SELECT id FROM stores WHERE guid = ?");
        $stmt->execute([$storeGuid]);
        $store = $stmt->fetch();
        
        if (!$store) {
            sendError('Store not found', 404);
        }
        
        // Get business info from store_settings or a dedicated table
        $stmt = $pdo->prepare("
            SELECT setting_value 
            FROM store_settings 
            WHERE store_id = ? AND setting_key = 'business_info'
        ");
        $stmt->execute([$store['id']]);
        $result = $stmt->fetch();
        
        if ($result && $result['setting_value']) {
            $businessInfo = json_decode($result['setting_value'], true);
            sendSuccess(['businessInfo' => $businessInfo]);
        } else {
            // Return empty/default business info
            sendSuccess(['businessInfo' => null]);
        }
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Save business info
        $input = json_decode(file_get_contents('php://input'), true);
        
        $storeGuid = $input['storeGuid'] ?? null;
        $businessInfo = $input['businessInfo'] ?? null;
        
        if (!$storeGuid) {
            sendError('Store GUID is required', 400);
        }
        
        if (!$businessInfo) {
            sendError('Business info is required', 400);
        }
        
        // Get store ID
        $stmt = $pdo->prepare("SELECT id FROM stores WHERE guid = ?");
        $stmt->execute([$storeGuid]);
        $store = $stmt->fetch();
        
        if (!$store) {
            sendError('Store not found', 404);
        }
        
        // Check if store_settings table exists, create if not
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS store_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                store_id INT NOT NULL,
                setting_key VARCHAR(100) NOT NULL,
                setting_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_store_setting (store_id, setting_key),
                FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
            )
        ");
        
        // Upsert business info
        $stmt = $pdo->prepare("
            INSERT INTO store_settings (store_id, setting_key, setting_value)
            VALUES (?, 'business_info', ?)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        ");
        $stmt->execute([$store['id'], json_encode($businessInfo)]);
        
        sendSuccess(['message' => 'Business info saved successfully']);
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("Business Info API Error: " . $e->getMessage());
    sendError('Server error: ' . $e->getMessage(), 500);
}
