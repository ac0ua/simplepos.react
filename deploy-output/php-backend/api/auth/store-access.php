<?php
/**
 * Store Access Endpoint
 * POST /api/auth/store-access.php
 * Create or access store with GUID
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';
require_once '../../utils/jwt.php';
require_once '../../utils/uuid.php';
require_once '../../utils/rate-limit.php';

// SEC-005: Rate limit store access attempts (30 per minute per IP)
RateLimit::apply('store-access', 30, 60);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $guid = $data['guid'] ?? null;
    $label = $data['label'] ?? null;
    $email = $data['email'] ?? null;
    $businessName = $data['businessName'] ?? null;
    $emailConsent = $data['emailConsent'] ?? false;
    
    // SEC-011: Validate email format if provided
    if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('Invalid email format');
    }
    
    // SEC-011: Sanitize email
    if ($email) {
        $email = filter_var($email, FILTER_SANITIZE_EMAIL);
    }
    
    // Validate GUID
    if (!$guid || !UUID::isValid($guid)) {
        Response::error('Invalid GUID format');
    }
    
    if (!$label || trim($label) === '') {
        Response::error('Label is required');
    }
    
    // Validate email consent if email is provided
    if ($email && !$emailConsent) {
        Response::error('Email consent is required when email is provided');
    }
    
    $db = new Database();
    $conn = $db->connect();
    
    // Check max instances per email if email is provided
    if ($email) {
        $stmt = $conn->prepare("SELECT setting_value FROM admin_settings WHERE setting_key = 'max_instances_per_email'");
        $stmt->execute();
        $setting = $stmt->fetch();
        $maxInstances = $setting ? (int)$setting['setting_value'] : 3;
        
        $stmt = $conn->prepare("
            SELECT COUNT(*) as count FROM store_labels sl
            INNER JOIN stores s ON sl.store_id = s.id
            WHERE sl.recovery_email = ?
        ");
        $stmt->execute([$email]);
        $result = $stmt->fetch();
        
        if ($result['count'] >= $maxInstances) {
            Response::error("Maximum number of store instances ($maxInstances) reached for this email address");
        }
    }
    
    // Check if store exists
    $stmt = $conn->prepare("SELECT * FROM stores WHERE guid = ?");
    $stmt->execute([$guid]);
    $store = $stmt->fetch();
    
    if (!$store) {
        // Create new store
        $stmt = $conn->prepare("
            INSERT INTO stores (guid, business_name, currency, currency_symbol, tax_rate, created_at, updated_at)
            VALUES (?, ?, 'USD', '$', 0.08, NOW(), NOW())
        ");
        $stmt->execute([$guid, $businessName ?: $label]);
        $storeId = $conn->lastInsertId();
    } else {
        $storeId = $store['id'];
    }
    
    // Check if label exists for this store
    $stmt = $conn->prepare("SELECT * FROM store_labels WHERE store_id = ? AND label = ?");
    $stmt->execute([$storeId, $label]);
    $storeLabel = $stmt->fetch();
    
    if (!$storeLabel) {
        // Create new label
        $stmt = $conn->prepare("
            INSERT INTO store_labels (store_id, label, display_name, recovery_email, permissions, created_at, updated_at, last_access)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())
        ");
        $permissions = json_encode(['read', 'write']);
        $stmt->execute([$storeId, $label, $businessName ?: $label, $email, $permissions]);
    } else {
        // Update last access and email if provided
        $updateFields = ['last_access = NOW()'];
        $updateParams = [];
        
        if ($email) {
            $updateFields[] = 'recovery_email = ?';
            $updateParams[] = $email;
        }
        
        if ($businessName && $businessName !== $storeLabel['display_name']) {
            $updateFields[] = 'display_name = ?';
            $updateParams[] = $businessName;
        }
        
        $updateParams[] = $storeId;
        $updateParams[] = $label;
        
        $stmt = $conn->prepare("
            UPDATE store_labels 
            SET " . implode(', ', $updateFields) . "
            WHERE store_id = ? AND label = ?
        ");
        $stmt->execute($updateParams);
    }
    
    // Generate session token
    $sessionToken = JWT::encode([
        'storeGuid' => $guid,
        'label' => $label,
        'displayName' => $businessName ?: $label,
        'type' => 'guest',
        'permissions' => ['read', 'write']
    ], 86400); // 24 hours
    
    Response::success([
        'sessionToken' => $sessionToken,
        'storeGuid' => $guid,
        'label' => $label,
        'businessName' => $businessName ?: $label,
        'redirectUrl' => "/$guid/$label/order.html"
    ]);
    
} catch (Exception $e) {
    error_log("Store access error: " . $e->getMessage());
    Response::serverError('Server error');
}
