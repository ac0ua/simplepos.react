<?php
/**
 * Admin Settings Endpoint
 * GET/POST /api/admin/settings.php
 * Get or update admin settings
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

try {
    $db = new Database();
    $conn = $db->connect();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get all settings
        $stmt = $conn->query("SELECT * FROM admin_settings");
        $settings = $stmt->fetchAll();
        
        $settingsObj = [];
        foreach ($settings as $setting) {
            $settingsObj[$setting['setting_key']] = $setting['setting_value'];
        }
        
        Response::json($settingsObj);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Update setting
        $data = json_decode(file_get_contents('php://input'), true);
        
        $settingKey = $data['setting_key'] ?? null;
        $settingValue = $data['setting_value'] ?? null;
        $description = $data['description'] ?? '';
        
        if (!$settingKey || !$settingValue) {
            Response::error('Setting key and value are required');
        }
        
        // Check if setting exists
        $stmt = $conn->prepare("SELECT * FROM admin_settings WHERE setting_key = ?");
        $stmt->execute([$settingKey]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Update
            $stmt = $conn->prepare("
                UPDATE admin_settings 
                SET setting_value = ?, description = ?, updated_at = NOW()
                WHERE setting_key = ?
            ");
            $stmt->execute([$settingValue, $description, $settingKey]);
            $created = false;
        } else {
            // Insert
            $stmt = $conn->prepare("
                INSERT INTO admin_settings (setting_key, setting_value, description, created_at, updated_at)
                VALUES (?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([$settingKey, $settingValue, $description]);
            $created = true;
        }
        
        Response::success(['created' => $created], 'Setting saved');
        
    } else {
        Response::error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("Admin settings error: " . $e->getMessage());
    Response::serverError('Failed to process admin settings');
}
