<?php
/**
 * Save Categories Endpoint
 * POST /api/products/categories-save.php
 * Replace the full list of product categories
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
    $categoriesInput = $data['categories'] ?? null;

    if (!$storeGuid) {
        Response::error('Store GUID is required', 400);
    }

    if (!is_array($categoriesInput)) {
        Response::error('Categories must be an array', 400);
    }

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
        // Ignore if column already exists
    }

    // Resolve store by GUID
    $stmt = $conn->prepare("SELECT id FROM stores WHERE guid = ?");
    $stmt->execute([$storeGuid]);
    $store = $stmt->fetch();

    if (!$store) {
        Response::notFound('Store not found');
    }

    $sanitized = [];

    foreach ($categoriesInput as $cat) {
        $id = isset($cat['id']) ? trim((string) $cat['id']) : '';
        $name = isset($cat['name']) ? trim((string) $cat['name']) : '';
        $icon = isset($cat['icon']) ? trim((string) $cat['icon']) : 'apps';
        $color = isset($cat['color']) ? trim((string) $cat['color']) : null;

        // Frontend sends visible as boolean; store as 0/1
        if (!array_key_exists('visible', $cat)) {
            $visible = 1;
        } else {
            $visible = $cat['visible'] ? 1 : 0;
        }

        if ($id === '' || $name === '') {
            continue;
        }

        $sanitized[] = [
            'id' => $id,
            'name' => $name,
            'icon' => $icon,
            'color' => $color,
            'visible' => $visible,
        ];
    }

    if (empty($sanitized)) {
        Response::error('At least one category is required', 400);
    }

    // Ensure "all" category exists and is first
    $allCategory = null;
    $rest = [];

    foreach ($sanitized as $cat) {
        if ($cat['id'] === 'all') {
            $allCategory = $cat;
        } else {
            $rest[] = $cat;
        }
    }

    if ($allCategory === null) {
        $allCategory = [
            'id' => 'all',
            'name' => 'All Products',
            'icon' => 'apps',
            'color' => '#ff9800',
            'visible' => 1,
        ];
    }

    $finalCategories = array_merge([$allCategory], $rest);

    // Persist categories per store in store_categories table
    $conn->beginTransaction();

    // Delete existing categories for this store
    $stmtDelete = $conn->prepare("DELETE FROM store_categories WHERE store_id = ?");
    $stmtDelete->execute([$store['id']]);

    // Insert new categories with sort order
    $stmtInsert = $conn->prepare("
        INSERT INTO store_categories (store_id, slug, name, icon, color, visible, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    foreach ($finalCategories as $index => $cat) {
        $slug = $cat['id'];
        $name = $cat['name'];
        $icon = $cat['icon'] ?? 'apps';
        $color = isset($cat['color']) && $cat['color'] !== '' ? $cat['color'] : null;
        // $cat['visible'] is already normalized to 0 or 1 in $sanitized above
        $visible = isset($cat['visible']) ? (int)$cat['visible'] : 1;
        $sortOrder = $index;

        $stmtInsert->execute([
            $store['id'],
            $slug,
            $name,
            $icon,
            $color,
            $visible,
            $sortOrder
        ]);
    }

    $conn->commit();

    Response::json($finalCategories);
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    error_log('Save categories error: ' . $e->getMessage());
    Response::serverError('Server error');
}
