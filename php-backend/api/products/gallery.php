<?php
/**
 * Get Gallery Images Endpoint
 * GET /php-backend/api/products/gallery.php?storeGuid={guid}
 * Returns store-specific and default gallery images
 */

require_once '../../config/cors.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

try {
    $storeGuid = $_GET['storeGuid'] ?? null;

    if (!$storeGuid) {
        Response::error('Store GUID is required');
    }

    // Store-specific images live under php-backend/uploads/gallery/{storeGuid}
    $baseDir = __DIR__ . '/../../uploads/gallery';
    $storeDir = $baseDir . '/' . $storeGuid;

    // Default images live under backend/uploads/gallery/default (shared for all stores)
    $appRootDir = dirname(dirname(dirname(__DIR__))); // .../simplepos.react
    $defaultDir = $appRootDir . '/backend/uploads/gallery/default';

    // Derive base web paths for URLs
    // Example scriptName: /simplepos.react/php-backend/api/products/gallery.php
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $apiPos = strpos($scriptName, '/api/');
    $phpBackendBasePath = $apiPos !== false ? substr($scriptName, 0, $apiPos) : dirname(dirname($scriptName));

    // App base path before /php-backend
    $phpBackendPos = strpos($phpBackendBasePath, '/php-backend');
    $appBasePath = $phpBackendPos !== false
        ? substr($phpBackendBasePath, 0, $phpBackendPos)
        : dirname(dirname($phpBackendBasePath));

    $storeImages = [];
    if (is_dir($storeDir)) {
        $files = scandir($storeDir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            $filePath = $storeDir . '/' . $file;
            if (!is_file($filePath)) continue;

            if (!preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $file)) continue;

            $storeImages[] = [
                'filename' => $file,
                'url' => $phpBackendBasePath . '/uploads/gallery/' . $storeGuid . '/' . $file,
                'isPrivate' => true,
                'uploadedAt' => date('c', filemtime($filePath))
            ];
        }

        usort($storeImages, function($a, $b) {
            return strcmp($b['uploadedAt'], $a['uploadedAt']);
        });
    }

    $defaultImages = [];
    if (is_dir($defaultDir)) {
        $files = scandir($defaultDir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            $filePath = $defaultDir . '/' . $file;
            if (!is_file($filePath)) continue;

            if (!preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $file)) continue;

            $defaultImages[] = [
                'filename' => $file,
                'url' => $appBasePath . '/backend/uploads/gallery/default/' . $file,
                'isPrivate' => false,
                'uploadedAt' => date('c', filemtime($filePath))
            ];
        }

        usort($defaultImages, function($a, $b) {
            return strcmp($b['uploadedAt'], $a['uploadedAt']);
        });
    }

    Response::success([
        'storeImages' => $storeImages,
        'defaultImages' => $defaultImages,
        'totalCount' => count($storeImages) + count($defaultImages)
    ]);

} catch (Exception $e) {
    error_log('Get gallery images error: ' . $e->getMessage());
    Response::serverError('Failed to get gallery images');
}
