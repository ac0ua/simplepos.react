<?php
/**
 * Store Theme Endpoint
 * GET /api/stores/theme.php?storeGuid={guid}&label={label}
 * POST /api/stores/theme.php
 * Manage per-instance themes for storeGuid + label
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/response.php';

try {
    $db = new Database();
    $conn = $db->connect();

    // Ensure store_label_themes table exists (for existing installations)
    $conn->exec("CREATE TABLE IF NOT EXISTS store_label_themes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_id INT NOT NULL,
        label VARCHAR(100) NOT NULL,
        theme_name VARCHAR(100) NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 0,
        mode VARCHAR(10) NOT NULL DEFAULT 'dark',
        primary_color VARCHAR(20) NOT NULL,
        surface_color VARCHAR(20) NOT NULL,
        sidebar_color VARCHAR(20) NOT NULL,
        tokens_json JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        INDEX idx_store_label (store_id, label),
        UNIQUE KEY uniq_store_label_theme (store_id, label, theme_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $storeGuid = $_GET['storeGuid'] ?? null;
        $label = $_GET['label'] ?? null;

        if (!$storeGuid || !$label) {
            Response::error('Store GUID and label are required', 400);
        }

        // Resolve store
        $stmt = $conn->prepare("SELECT id FROM stores WHERE guid = ?");
        $stmt->execute([$storeGuid]);
        $store = $stmt->fetch();

        if (!$store) {
            Response::notFound('Store not found');
        }

        // Fetch all themes for this instance
        $stmt = $conn->prepare("SELECT theme_name, mode, primary_color, surface_color, sidebar_color, is_active, tokens_json
            FROM store_label_themes
            WHERE store_id = ? AND label = ?
            ORDER BY is_active DESC, updated_at DESC, theme_name ASC");
        $stmt->execute([$store['id'], $label]);
        $rows = $stmt->fetchAll();

        $themes = [];
        $activeTheme = null;

        foreach ($rows as $row) {
            $theme = [
                'themeName' => $row['theme_name'],
                'mode' => $row['mode'],
                'primaryColor' => $row['primary_color'],
                'surfaceColor' => $row['surface_color'],
                'sidebarColor' => $row['sidebar_color'],
                'isActive' => (bool)$row['is_active']
            ];

            if (!empty($row['tokens_json'])) {
                $tokens = json_decode($row['tokens_json'], true);
                if (is_array($tokens)) {
                    $theme['tokens'] = $tokens;
                }
            }
            $themes[] = $theme;
            if ($row['is_active'] && $activeTheme === null) {
                $activeTheme = $theme;
            }
        }

        // Fallback to default theme if none stored yet
        if ($activeTheme === null) {
            $activeTheme = [
                'themeName' => 'Default',
                'mode' => 'dark',
                'primaryColor' => '#f97306',
                'surfaceColor' => '#1f140b',
                'sidebarColor' => '#28180d',
                'isActive' => true
            ];
        }

        Response::success([
            'theme' => $activeTheme,
            'themes' => $themes
        ]);
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        $storeGuid = $data['storeGuid'] ?? null;
        $label = $data['label'] ?? null;
        $themeName = isset($data['themeName']) ? trim((string)$data['themeName']) : 'Default';
        $mode = isset($data['mode']) ? strtolower(trim((string)$data['mode'])) : 'dark';
        $primaryColor = $data['primaryColor'] ?? null;
        $surfaceColor = $data['surfaceColor'] ?? null;
        $sidebarColor = $data['sidebarColor'] ?? null;
        $isActive = !empty($data['isActive']) ? 1 : 0;
        $tokens = $data['tokens'] ?? null; // optional future extension

        if (!$storeGuid || !$label) {
            Response::error('Store GUID and label are required', 400);
        }

        if ($mode !== 'light' && $mode !== 'dark') {
            $mode = 'dark';
        }

        if (!$themeName) {
            $themeName = 'Default';
        }

        // Basic hex color validation (3-8 hex digits with leading #)
        $colorFields = [
            'primaryColor' => $primaryColor,
            'surfaceColor' => $surfaceColor,
            'sidebarColor' => $sidebarColor
        ];

        foreach ($colorFields as $fieldName => $value) {
            if (!$value || !preg_match('/^#[0-9A-Fa-f]{3,8}$/', $value)) {
                Response::error("Invalid {$fieldName} value", 400);
            }
        }

        // Resolve store
        $stmt = $conn->prepare("SELECT id FROM stores WHERE guid = ?");
        $stmt->execute([$storeGuid]);
        $store = $stmt->fetch();

        if (!$store) {
            Response::notFound('Store not found');
        }

        // Ensure label exists for this store
        $stmt = $conn->prepare("SELECT id FROM store_labels WHERE store_id = ? AND label = ?");
        $stmt->execute([$store['id'], $label]);
        $storeLabel = $stmt->fetch();

        if (!$storeLabel) {
            Response::notFound('Store label not found');
        }

        $tokensJson = $tokens ? json_encode($tokens, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;

        $conn->beginTransaction();

        try {
            if ($isActive) {
                // Deactivate other themes for this instance
                $stmt = $conn->prepare("UPDATE store_label_themes SET is_active = 0 WHERE store_id = ? AND label = ?");
                $stmt->execute([$store['id'], $label]);
            }

            // Check if theme already exists
            $stmt = $conn->prepare("SELECT id FROM store_label_themes WHERE store_id = ? AND label = ? AND theme_name = ?");
            $stmt->execute([$store['id'], $label, $themeName]);
            $existing = $stmt->fetch();

            if ($existing) {
                $stmt = $conn->prepare("UPDATE store_label_themes
                    SET mode = ?, primary_color = ?, surface_color = ?, sidebar_color = ?, tokens_json = ?, is_active = ?, updated_at = NOW()
                    WHERE id = ?");
                $stmt->execute([
                    $mode,
                    $primaryColor,
                    $surfaceColor,
                    $sidebarColor,
                    $tokensJson,
                    $isActive,
                    $existing['id']
                ]);
            } else {
                $stmt = $conn->prepare("INSERT INTO store_label_themes
                    (store_id, label, theme_name, is_active, mode, primary_color, surface_color, sidebar_color, tokens_json, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
                $stmt->execute([
                    $store['id'],
                    $label,
                    $themeName,
                    $isActive,
                    $mode,
                    $primaryColor,
                    $surfaceColor,
                    $sidebarColor,
                    $tokensJson
                ]);
            }

            $conn->commit();
        } catch (Exception $e) {
            if ($conn->inTransaction()) {
                $conn->rollBack();
            }
            throw $e;
        }

        $savedTheme = [
            'themeName' => $themeName,
            'mode' => $mode,
            'primaryColor' => $primaryColor,
            'surfaceColor' => $surfaceColor,
            'sidebarColor' => $sidebarColor,
            'isActive' => (bool)$isActive
        ];

        if ($tokens) {
            $savedTheme['tokens'] = $tokens;
        }

        Response::success([
            'theme' => $savedTheme
        ], 'Theme saved');
    } else {
        Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Store theme error: ' . $e->getMessage());
    Response::serverError('Failed to process theme');
}
