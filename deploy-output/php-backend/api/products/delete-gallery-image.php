<?php
/**
 * Delete Gallery Image Endpoint
 * DELETE /php-backend/api/products/delete-gallery-image.php
 * Body: { "storeGuid": "...", "filename": "..." }
 */

require_once '../../config/cors.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::error('Method not allowed', 405);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $storeGuid = $data['storeGuid'] ?? null;
    $filename = $data['filename'] ?? null;

    if (!$storeGuid || !$filename) {
        Response::error('Store GUID and filename are required');
    }

    // Basic security check against path traversal
    if (strpos($filename, '..') !== false || strpos($filename, '/') !== false || strpos($filename, '\\') !== false) {
        Response::error('Invalid filename');
    }

    $filePath = __DIR__ . '/../../uploads/gallery/' . $storeGuid . '/' . $filename;

    if (!file_exists($filePath)) {
        Response::notFound('Image not found');
    }

    if (!unlink($filePath)) {
        Response::serverError('Failed to delete image');
    }

    Response::success([], 'Image deleted successfully');

} catch (Exception $e) {
    error_log('Delete gallery image error: ' . $e->getMessage());
    Response::serverError('Failed to delete image');
}
