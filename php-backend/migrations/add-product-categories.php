<?php
/**
 * Migration: Add Product Categories Junction Table
 * Allows products to belong to multiple categories
 * All products must be in 'all' category
 * 
 * Run this migration once: php add-product-categories.php
 */

require_once __DIR__ . '/../config/database.php';

echo "Starting migration: Add Product Categories...\n";

try {
    $db = new Database();
    $conn = $db->connect();
    
    // 1. Create product_categories junction table
    echo "Creating product_categories table...\n";
    $conn->exec("
        CREATE TABLE IF NOT EXISTS product_categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            category_id VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            UNIQUE KEY unique_product_category (product_id, category_id),
            INDEX idx_product (product_id),
            INDEX idx_category (category_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ product_categories table created\n";
    
    // 2. Migrate existing products - add their current category + 'all' category
    echo "Migrating existing products to multi-category system...\n";
    
    $stmt = $conn->query("SELECT id, category FROM products");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $insertStmt = $conn->prepare("
        INSERT IGNORE INTO product_categories (product_id, category_id)
        VALUES (?, ?)
    ");
    
    $migratedCount = 0;
    foreach ($products as $product) {
        // Always add 'all' category
        $insertStmt->execute([$product['id'], 'all']);
        
        // Add existing category if it's not 'all' and not empty
        $existingCategory = strtolower(trim($product['category'] ?? ''));
        if ($existingCategory && $existingCategory !== 'all' && $existingCategory !== 'all products') {
            $insertStmt->execute([$product['id'], $existingCategory]);
        }
        
        $migratedCount++;
    }
    
    echo "✓ Migrated {$migratedCount} products\n";
    
    // 3. Verify migration
    $countStmt = $conn->query("SELECT COUNT(*) as total FROM product_categories");
    $count = $countStmt->fetch(PDO::FETCH_ASSOC);
    echo "✓ Total category assignments: {$count['total']}\n";
    
    echo "\n=== Migration Complete ===\n";
    echo "All products now have 'all' category assigned.\n";
    echo "Products retain their original category as well.\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
