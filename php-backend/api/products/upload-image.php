<?php
/**
 * Upload Image Endpoint
 * POST /api/products/upload-image.php
 * Upload product image to store-specific gallery
 */

require_once '../../config/cors.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

try {
    $storeGuid = $_POST['storeGuid'] ?? null;
    
    if (!$storeGuid) {
        Response::error('Store GUID is required');
    }
    
    if (!isset($_FILES['image'])) {
        Response::error('No image file provided');
    }
    
    $file = $_FILES['image'];
    
    // Validate file
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowedTypes)) {
        Response::error('Only image files are allowed');
    }
    
    // Check file size (5MB limit)
    if ($file['size'] > 5 * 1024 * 1024) {
        Response::error('File size exceeds 5MB limit');
    }
    
    // Create upload directory
    $uploadDir = __DIR__ . '/../../uploads/gallery/' . $storeGuid;
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'product-' . time() . '-' . rand(100000000, 999999999) . '.' . $extension;
    $filepath = $uploadDir . '/' . $filename;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        Response::serverError('Failed to upload image');
    }
    
    // Derive base web path for php-backend (works for /php-backend or /simplepos.react/php-backend)
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $apiPos = strpos($scriptName, '/api/');
    $basePath = $apiPos !== false ? substr($scriptName, 0, $apiPos) : dirname(dirname($scriptName));

    $imageUrl = $basePath . '/uploads/gallery/' . $storeGuid . '/' . $filename;
    
    Response::success([
        'imageUrl' => $imageUrl,
        'filename' => $filename,
        'isPrivate' => true
    ]);
    
} catch (Exception $e) {
    error_log("Image upload error: " . $e->getMessage());
    Response::serverError('Failed to upload image');
}
