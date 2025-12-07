<?php
/**
 * Admin Statistics Endpoint
 * GET /api/admin/stats.php
 * Get admin statistics
 * SEC-002: Requires admin authentication
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';
require_once '../../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

// SEC-002: Require admin authentication for all admin endpoints
Auth::requireAdmin();

try {
    $db = new Database();
    $conn = $db->connect();
    
    // Total stores
    $stmt = $conn->query("SELECT COUNT(*) as count FROM stores");
    $totalStores = $stmt->fetch()['count'];
    
    // Total store labels
    $stmt = $conn->query("SELECT COUNT(*) as count FROM store_labels");
    $totalStoreLabels = $stmt->fetch()['count'];
    
    // Unique emails
    $stmt = $conn->query("SELECT COUNT(DISTINCT recovery_email) as count FROM store_labels WHERE recovery_email IS NOT NULL AND recovery_email != ''");
    $uniqueEmails = $stmt->fetch()['count'];
    
    Response::json([
        'totalStores' => (int)$totalStores,
        'totalStoreLabels' => (int)$totalStoreLabels,
        'uniqueEmails' => (int)$uniqueEmails
    ]);
    
} catch (Exception $e) {
    error_log("Admin stats error: " . $e->getMessage());
    Response::serverError('Failed to fetch admin statistics');
}
