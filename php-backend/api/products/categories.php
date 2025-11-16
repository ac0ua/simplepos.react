<?php
/**
 * Get Categories Endpoint
 * GET /api/products/categories.php
 * Get product categories
 */

require_once '../../config/cors.php';
require_once '../../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$categories = [
    ['id' => 'all', 'name' => 'All Products', 'icon' => 'apps'],
    ['id' => 'beverages', 'name' => 'Beverages', 'icon' => 'local_drink'],
    ['id' => 'snacks', 'name' => 'Snacks', 'icon' => 'fastfood'],
    ['id' => 'automotive', 'name' => 'Automotive', 'icon' => 'directions_car'],
    ['id' => 'frozen', 'name' => 'Frozen', 'icon' => 'ac_unit'],
    ['id' => 'fuel', 'name' => 'Fuel', 'icon' => 'local_gas_station']
];

Response::json($categories);
