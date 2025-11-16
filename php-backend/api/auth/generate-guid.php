<?php
/**
 * Generate GUID Endpoint
 * GET /api/auth/generate-guid.php
 * Generate new store GUID
 */

require_once '../../config/cors.php';
require_once '../../utils/response.php';
require_once '../../utils/uuid.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

Response::json(['guid' => UUID::v4()]);
