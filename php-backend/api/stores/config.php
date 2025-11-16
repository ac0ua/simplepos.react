<?php
/**
 * Store Configuration Endpoint
 * GET/PUT /api/stores/config.php?storeGuid={guid}
 * Get or update store configuration
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

try {
    $storeGuid = $_GET['storeGuid'] ?? null;
    
    if (!$storeGuid) {
        Response::error('Store GUID is required');
    }
    
    $db = new Database();
    $conn = $db->connect();
    
    // Get store
    $stmt = $conn->prepare("SELECT * FROM stores WHERE guid = ?");
    $stmt->execute([$storeGuid]);
    $store = $stmt->fetch();
    
    if (!$store) {
        Response::notFound('Store not found');
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Return store configuration
        $config = [
            'storeGuid' => $store['guid'],
            'businessName' => $store['business_name'],
            'currency' => $store['currency'],
            'currencySymbol' => $store['currency_symbol'],
            'taxRate' => (float)$store['tax_rate'],
            'taxEnabled' => true,
            'theme' => [
                'primaryColor' => '#2196F3',
                'secondaryColor' => '#FF9800',
                'mode' => 'light'
            ],
            'receipt' => [
                'showLogo' => true,
                'showAddress' => true,
                'footerText' => 'Thank you for your business!'
            ],
            'features' => [
                'inventory' => true,
                'analytics' => true,
                'multiplePayments' => true,
                'customerDisplay' => true,
                'barcode' => true
            ],
            'createdAt' => $store['created_at']
        ];
        
        Response::json($config);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Update store configuration
        $data = json_decode(file_get_contents('php://input'), true);
        
        $updateFields = [];
        $params = [];
        
        if (isset($data['businessName'])) {
            $updateFields[] = 'business_name = ?';
            $params[] = $data['businessName'];
        }
        if (isset($data['currency'])) {
            $updateFields[] = 'currency = ?';
            $params[] = $data['currency'];
        }
        if (isset($data['currencySymbol'])) {
            $updateFields[] = 'currency_symbol = ?';
            $params[] = $data['currencySymbol'];
        }
        if (isset($data['taxRate'])) {
            $updateFields[] = 'tax_rate = ?';
            $params[] = $data['taxRate'];
        }
        
        if (count($updateFields) > 0) {
            $updateFields[] = 'updated_at = NOW()';
            $params[] = $store['id'];
            
            $stmt = $conn->prepare("
                UPDATE stores 
                SET " . implode(', ', $updateFields) . "
                WHERE id = ?
            ");
            $stmt->execute($params);
        }
        
        // Get updated store
        $stmt = $conn->prepare("SELECT * FROM stores WHERE id = ?");
        $stmt->execute([$store['id']]);
        $updatedStore = $stmt->fetch();
        
        Response::success(['config' => $updatedStore], 'Configuration updated');
        
    } else {
        Response::error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("Store config error: " . $e->getMessage());
    Response::serverError('Server error');
}
