<?php
/**
 * Store Recovery Endpoint
 * POST /api/auth/recover.php
 * Recover store access by email
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';
require_once '../../utils/rate-limit.php';

// SEC-005: Rate limit recovery attempts (10 per minute per IP - stricter to prevent email enumeration)
RateLimit::apply('recover', 10, 60);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? null;
    
    if (!$email) {
        Response::error('Email is required');
    }
    
    // SEC-011: Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('Invalid email format');
    }
    
    // SEC-011: Sanitize email
    $email = filter_var($email, FILTER_SANITIZE_EMAIL);
    
    $db = new Database();
    $conn = $db->connect();
    
    // Find all store labels with this email
    $stmt = $conn->prepare("
        SELECT sl.label, sl.last_access, s.guid, s.business_name
        FROM store_labels sl
        INNER JOIN stores s ON sl.store_id = s.id
        WHERE sl.recovery_email = ?
        ORDER BY sl.last_access DESC
    ");
    $stmt->execute([$email]);
    $storeLabels = $stmt->fetchAll();
    
    if (count($storeLabels) === 0) {
        Response::notFound('No stores found for this email');
    }
    
    $stores = array_map(function($sl) {
        return [
            'guid' => $sl['guid'],
            'label' => $sl['label'],
            'businessName' => $sl['business_name'],
            'lastAccess' => $sl['last_access']
        ];
    }, $storeLabels);
    
    Response::success([
        'stores' => $stores,
        'message' => 'Found ' . count($stores) . ' store(s) associated with this email'
    ]);
    
} catch (Exception $e) {
    error_log("Store recovery error: " . $e->getMessage());
    Response::serverError('Server error');
}
