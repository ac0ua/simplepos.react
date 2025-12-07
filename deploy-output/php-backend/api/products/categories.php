<?php
/**
 * Get Categories Endpoint
 * GET /api/products/categories.php
 * Get product categories
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$storeGuid = $_GET['storeGuid'] ?? null;

if (!$storeGuid) {
    Response::error('Store GUID is required', 400);
}

$defaultCategories = [
    ['id' => 'all', 'name' => 'All Products', 'icon' => 'apps', 'visible' => true, 'color' => '#ff9800'],
    ['id' => 'beverages', 'name' => 'Beverages', 'icon' => 'local_drink', 'visible' => true, 'color' => '#0ea5e9'],
    ['id' => 'snacks', 'name' => 'Snacks', 'icon' => 'fastfood', 'visible' => true, 'color' => '#f97316'],
    ['id' => 'automotive', 'name' => 'Automotive', 'icon' => 'directions_car', 'visible' => true, 'color' => '#6b7280'],
    ['id' => 'frozen', 'name' => 'Frozen', 'icon' => 'ac_unit', 'visible' => true, 'color' => '#22c55e'],
    ['id' => 'fuel', 'name' => 'Fuel', 'icon' => 'local_gas_station', 'visible' => true, 'color' => '#eab308']
];

try {
    $db = new Database();
    $conn = $db->connect();

    // Ensure store_categories table exists (with color column)
    $conn->exec("CREATE TABLE IF NOT EXISTS store_categories (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        store_id INT UNSIGNED NOT NULL,
        slug VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(100) NOT NULL DEFAULT 'apps',
        color VARCHAR(20) DEFAULT NULL,
        visible TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_store_categories_store_id (store_id),
        UNIQUE KEY uniq_store_slug (store_id, slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Backwards-compat: add color column if table pre-existed without it
    try {
        $conn->exec("ALTER TABLE store_categories ADD COLUMN color VARCHAR(20) DEFAULT NULL");
    } catch (Exception $e) {
        // Ignore error if column already exists
    }

    // Find store by GUID
    $stmt = $conn->prepare("SELECT id FROM stores WHERE guid = ?");
    $stmt->execute([$storeGuid]);
    $store = $stmt->fetch();

    if (!$store) {
        Response::notFound('Store not found');
    }

    // Attempt to load categories from database
    $stmt = $conn->prepare("
        SELECT slug, name, icon, color, visible, sort_order
        FROM store_categories
        WHERE store_id = ?
        ORDER BY sort_order ASC, id ASC
    ");
    $stmt->execute([$store['id']]);
    $rows = $stmt->fetchAll();

    $categories = [];

    if ($rows && count($rows) > 0) {
        foreach ($rows as $row) {
            $categories[] = [
                'id' => $row['slug'],
                'name' => $row['name'],
                'icon' => $row['icon'],
                'visible' => isset($row['visible']) ? (bool)$row['visible'] : true,
                'color' => $row['color'] ?? null
            ];
        }
    } else {
        // Fallback to defaults if no custom categories stored yet
        $categories = $defaultCategories;
    }

    Response::json($categories);
} catch (Exception $e) {
    error_log('Error fetching categories: ' . $e->getMessage());
    Response::serverError('Server error');
}
