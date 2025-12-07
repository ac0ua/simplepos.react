<?php
/**
 * SimplePOS Server Migration Script
 * Generated: 2025-12-07 06:24:53
 * 
 * Upload this file to your server and run it once to migrate data.
 * URL: https://your-server.com/simplepos.react/php-backend/migrations/server-migration.php
 */

// Server database configuration
$serverConfig = [
    "host" => "jamesboy63533.ipagemysql.com",
    "dbname" => "simplepos_react",
    "username" => "admin_simplepos",
    "password" => "XycJrdA123\$%^"
];

// Security check - remove this line after running once
if (!isset($_GET["run"]) || $_GET["run"] !== "migrate") {
    die("Add ?run=migrate to URL to execute migration. DELETE THIS FILE AFTER USE!");
}

error_reporting(E_ALL);
ini_set("display_errors", 1);
set_time_limit(300); // 5 minutes

echo "<pre>";
echo "=== SimplePOS Server Migration ===\n\n";

try {
    $dsn = "mysql:host={$serverConfig['host']};dbname={$serverConfig['dbname']};charset=utf8mb4";
    $conn = new PDO($dsn, $serverConfig["username"], $serverConfig["password"], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    echo "✓ Connected to server database\n\n";

    // Disable foreign key checks during import
    $conn->exec("SET FOREIGN_KEY_CHECKS = 0");

    // ========================================
    // CREATE TABLES
    // ========================================

    echo "Creating table: stores...\n";
    $conn->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS `stores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guid` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `business_name` varchar(255) NOT NULL DEFAULT 'My Business',
  `currency` varchar(3) DEFAULT 'USD',
  `currency_symbol` varchar(5) DEFAULT '$',
  `tax_rate` decimal(5,4) DEFAULT 0.0800,
  `tax_enabled` tinyint(1) DEFAULT 1,
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `guid` (`guid`),
  UNIQUE KEY `stores_guid` (`guid`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
SQL);

    echo "Creating table: store_labels...\n";
    $conn->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS `store_labels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `store_id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `last_access` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `recovery_email` varchar(255) DEFAULT NULL,
  `display_name` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_labels_store_id_label` (`store_id`,`label`),
  KEY `store_labels_recovery_email` (`recovery_email`),
  CONSTRAINT `store_labels_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
SQL);

    echo "Creating table: store_label_themes...\n";
    $conn->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS `store_label_themes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `store_id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `theme_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `mode` varchar(10) NOT NULL DEFAULT 'dark',
  `primary_color` varchar(20) NOT NULL,
  `surface_color` varchar(20) NOT NULL,
  `sidebar_color` varchar(20) NOT NULL,
  `tokens_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tokens_json`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_store_label_theme` (`store_id`,`label`,`theme_name`),
  KEY `idx_store_label` (`store_id`,`label`),
  CONSTRAINT `store_label_themes_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

    echo "Creating table: products...\n";
    $conn->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `store_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(100) DEFAULT 'All Products',
  `image` text DEFAULT NULL,
  `stock` int(11) DEFAULT 0,
  `barcode` varchar(50) DEFAULT NULL,
  `color` varchar(20) DEFAULT NULL,
  `sku` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `products_store_id` (`store_id`),
  KEY `products_category` (`category`),
  KEY `products_barcode` (`barcode`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
SQL);

    echo "Creating table: product_upcs...\n";
    $conn->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS `product_upcs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `store_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `upc` varchar(100) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_store_upc` (`store_id`,`upc`),
  KEY `idx_product` (`product_id`),
  CONSTRAINT `product_upcs_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_upcs_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

    echo "Creating table: product_categories...\n";
    $conn->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS `product_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `category_id` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_product_category` (`product_id`,`category_id`),
  KEY `idx_product` (`product_id`),
  KEY `idx_category` (`category_id`),
  CONSTRAINT `product_categories_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

    echo "Creating table: orders...\n";
    $conn->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(50) DEFAULT NULL,
  `store_id` int(11) NOT NULL,
  `order_name` varchar(100) DEFAULT NULL,
  `kiosk_number` int(11) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','card','other') DEFAULT 'cash',
  `cash_given` decimal(10,2) DEFAULT NULL,
  `change_amount` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','active','processing','completed','cancelled','refunded') DEFAULT 'pending',
  `cashier_action` varchar(50) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  UNIQUE KEY `orders_order_id` (`order_id`),
  UNIQUE KEY `order_id_2` (`order_id`),
  UNIQUE KEY `order_id_3` (`order_id`),
  UNIQUE KEY `order_id_4` (`order_id`),
  UNIQUE KEY `order_id_5` (`order_id`),
  UNIQUE KEY `order_id_6` (`order_id`),
  UNIQUE KEY `order_id_7` (`order_id`),
  UNIQUE KEY `order_id_8` (`order_id`),
  UNIQUE KEY `order_id_9` (`order_id`),
  UNIQUE KEY `order_id_10` (`order_id`),
  UNIQUE KEY `order_id_11` (`order_id`),
  UNIQUE KEY `order_id_12` (`order_id`),
  UNIQUE KEY `order_id_13` (`order_id`),
  UNIQUE KEY `order_id_14` (`order_id`),
  UNIQUE KEY `order_id_15` (`order_id`),
  KEY `orders_store_id` (`store_id`),
  KEY `orders_status` (`status`),
  KEY `orders_created_at` (`created_at`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
SQL);

    echo "Creating table: order_items...\n";
    $conn->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `prep_status` enum('pending','prepared') NOT NULL DEFAULT 'pending',
  `prep_quantity` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id` (`order_id`),
  KEY `order_items_product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_29` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_ibfk_30` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
SQL);

    echo "Creating table: users...\n";
    $conn->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `subscription` enum('free','basic','premium','enterprise') DEFAULT 'free',
  `payment_enabled` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `users_email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `email_25` (`email`),
  UNIQUE KEY `email_26` (`email`),
  UNIQUE KEY `email_27` (`email`),
  UNIQUE KEY `email_28` (`email`),
  UNIQUE KEY `email_29` (`email`),
  UNIQUE KEY `email_30` (`email`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `users_user_id` (`user_id`),
  UNIQUE KEY `user_id_2` (`user_id`),
  UNIQUE KEY `user_id_3` (`user_id`),
  UNIQUE KEY `user_id_4` (`user_id`),
  UNIQUE KEY `user_id_5` (`user_id`),
  UNIQUE KEY `user_id_6` (`user_id`),
  UNIQUE KEY `user_id_7` (`user_id`),
  UNIQUE KEY `user_id_8` (`user_id`),
  UNIQUE KEY `user_id_9` (`user_id`),
  UNIQUE KEY `user_id_10` (`user_id`),
  UNIQUE KEY `user_id_11` (`user_id`),
  UNIQUE KEY `user_id_12` (`user_id`),
  UNIQUE KEY `user_id_13` (`user_id`),
  UNIQUE KEY `user_id_14` (`user_id`),
  UNIQUE KEY `user_id_15` (`user_id`),
  UNIQUE KEY `user_id_16` (`user_id`),
  UNIQUE KEY `user_id_17` (`user_id`),
  UNIQUE KEY `user_id_18` (`user_id`),
  UNIQUE KEY `user_id_19` (`user_id`),
  UNIQUE KEY `user_id_20` (`user_id`),
  UNIQUE KEY `user_id_21` (`user_id`),
  UNIQUE KEY `user_id_22` (`user_id`),
  UNIQUE KEY `user_id_23` (`user_id`),
  UNIQUE KEY `user_id_24` (`user_id`),
  UNIQUE KEY `user_id_25` (`user_id`),
  UNIQUE KEY `user_id_26` (`user_id`),
  UNIQUE KEY `user_id_27` (`user_id`),
  UNIQUE KEY `user_id_28` (`user_id`),
  UNIQUE KEY `user_id_29` (`user_id`),
  UNIQUE KEY `user_id_30` (`user_id`),
  UNIQUE KEY `user_id_31` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
SQL);

    echo "Creating table: admin_settings...\n";
    $conn->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS `admin_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  UNIQUE KEY `setting_key_2` (`setting_key`),
  UNIQUE KEY `admin_settings_setting_key` (`setting_key`),
  UNIQUE KEY `setting_key_3` (`setting_key`),
  UNIQUE KEY `setting_key_4` (`setting_key`),
  UNIQUE KEY `setting_key_5` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
SQL);

    // ========================================
    // INSERT DATA
    // ========================================

    echo "\nInserting data into: stores (3 rows)...\n";
    $conn->exec("TRUNCATE TABLE `stores`");
    $conn->exec(<<<'SQL'
INSERT INTO `stores` (`id`, `guid`, `business_name`, `currency`, `currency_symbol`, `tax_rate`, `tax_enabled`, `settings`, `is_active`, `created_at`, `updated_at`) VALUES ('1', 'f3c21901-c2f8-4a97-a06f-5aa5bdcca62c', 'Mr Coffee', 'USD', '$', '0.0800', '1', '{}', '1', '2025-11-11 02:22:26', '2025-11-11 02:22:26'), ('2', 'a2c2ea89-d2c0-477d-b3a8-8d0a7094c898', 'Happy Days', 'USD', '$', '0.0800', '1', NULL, '1', '2025-11-16 09:04:06', '2025-11-16 09:04:06'), ('3', 'b4c0b758-bd68-45f4-8038-c13a18f5276b', 'normCafe', 'USD', '$', '0.0800', '1', NULL, '1', '2025-11-27 22:14:42', '2025-11-27 22:14:42')
SQL);
    echo "\nInserting data into: store_labels (3 rows)...\n";
    $conn->exec("TRUNCATE TABLE `store_labels`");
    $conn->exec(<<<'SQL'
INSERT INTO `store_labels` (`id`, `store_id`, `label`, `permissions`, `last_access`, `is_active`, `created_at`, `updated_at`, `recovery_email`, `display_name`) VALUES ('1', '1', 'Mr Coffee', '[\"read\",\"write\"]', '2025-12-05 05:35:12', '1', '2025-11-11 02:22:26', '2025-11-15 03:01:26', 'james.boy@gmail.com', 'Mr Coffee'), ('2', '2', 'happydays', '[\"read\",\"write\"]', '2025-11-28 19:11:30', '1', '2025-11-16 09:04:06', '2025-11-16 09:04:06', 'james.boy@gmail.com', 'happydays'), ('3', '3', 'normcafe', '[\"read\",\"write\"]', '2025-11-30 18:26:09', '1', '2025-11-27 22:14:42', '2025-11-27 22:14:42', 'james.boyy@gmail.com', 'normcafe')
SQL);
    echo "\nInserting data into: store_label_themes (3 rows)...\n";
    $conn->exec("TRUNCATE TABLE `store_label_themes`");
    $conn->exec(<<<'SQL'
INSERT INTO `store_label_themes` (`id`, `store_id`, `label`, `theme_name`, `is_active`, `mode`, `primary_color`, `surface_color`, `sidebar_color`, `tokens_json`, `created_at`, `updated_at`) VALUES ('1', '1', 'Mr Coffee', 'Default', '0', 'light', '#15291d', '#b3b3b3', '#ff6200', '{\"accentColor\":\"#ffb347\",\"backgroundColor\":\"#f8f7f5\",\"textColor\":\"#1f1b16\",\"headingFont\":\"Open Sans, sans-serif\",\"bodyFont\":\"Merriweather, serif\",\"headingScale\":1.3,\"bodySize\":1.15,\"backgroundMode\":\"gradient\",\"backgroundImage\":\"\",\"notes\":\"\"}', '2025-11-17 21:59:50', '2025-11-18 16:27:22'), ('2', '1', 'Mr Coffee', 'Default2', '1', 'dark', '#e5fad1', '#2e3725', '#0f130b', '{\"accentColor\":\"#b0f075\",\"textColor\":\"#ffffff\",\"borderRadius\":28,\"backgroundMode\":\"glass\",\"backgroundImage\":\"https://www.transparenttextures.com/patterns/purty-wood.png\",\"glassOpacity\":0.3,\"headingFont\":\"Open Sans, sans-serif\",\"bodyFont\":\"Space Grotesk, sans-serif\",\"headingScale\":1.3,\"bodySize\":1.1,\"backgroundColor\":\"#191d16\",\"autoMode\":false,\"shadowProfile\":\"subtle\"}', '2025-11-18 16:27:22', '2025-12-06 22:53:03'), ('3', '3', 'normcafe', 'Default', '1', 'dark', '#ccfdff', '#253637', '#0b1313', '{\"accentColor\":\"#66f8ff\",\"textColor\":\"#ffffff\",\"borderRadius\":12,\"backgroundMode\":\"solid\",\"backgroundImage\":\"\",\"glassOpacity\":0.8,\"headingFont\":\"Space Grotesk, sans-serif\",\"bodyFont\":\"Space Grotesk, sans-serif\",\"headingScale\":1.3,\"bodySize\":1,\"backgroundColor\":\"#161d1d\",\"autoMode\":true,\"shadowProfile\":\"max\"}', '2025-11-29 21:00:42', '2025-11-29 21:01:36')
SQL);
    echo "\nInserting data into: products (65 rows)...\n";
    $conn->exec("TRUNCATE TABLE `products`");
    $conn->exec(<<<'SQL'
INSERT INTO `products` (`id`, `store_id`, `name`, `price`, `category`, `image`, `stock`, `barcode`, `color`, `sku`, `description`, `is_active`, `created_at`, `updated_at`) VALUES ('1', '1', 'Candy Bar', '1.55', 'snacks', 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop', '80', '1234567890', '#FFB6C1', NULL, NULL, '0', '2025-11-11 02:22:26', '2025-12-06 20:01:41'), ('2', '1', 'Chips', '2.50', 'snacks', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop', '59', '2345678901', '#FFD700', NULL, NULL, '0', '2025-11-11 02:22:26', '2025-12-06 20:01:46'), ('3', '1', 'Ice Cream', '3.50', 'frozen', '/simplepos.react/backend/uploads/gallery/default/ice-cream-vanilla.png', '-1', '3456789012', '#87CEEB', NULL, NULL, '0', '2025-11-11 02:22:26', '2025-12-06 20:01:49'), ('4', '1', 'Motor Oil', '6.09', 'automotive', 'https://images.unsplash.com/photo-1621188988909-fbef0a88dc04?w=300&h=300&fit=crop', '12', '4567890123', '#708090', NULL, NULL, '0', '2025-11-11 02:22:26', '2025-12-06 20:01:51'), ('5', '1', 'Sample Product', '3.87', 'all products', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop', '193', '5678901234', '#FFD700', NULL, NULL, '0', '2025-11-11 02:22:26', '2025-12-06 20:01:54'), ('6', '1', 'Soda', '1.75', 'beverages', 'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?w=300&h=300&fit=crop', '137', '6789012345', '#98D8C8', NULL, NULL, '0', '2025-11-11 02:22:26', '2025-12-06 20:01:56'), ('7', '1', 'Water Bottle', '1.00', 'beverages', 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=300&h=300&fit=crop', '189', '7890123456', '#E0F2F1', NULL, NULL, '0', '2025-11-11 02:22:26', '2025-12-06 20:01:59'), ('8', '2', 'Candy Bar', '1.55', 'Snacks', 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop', '100', '1234567890', '#FFB6C1', NULL, NULL, '1', '2025-11-17 06:32:19', '2025-11-17 06:32:19'), ('9', '2', 'Chips', '2.50', 'Snacks', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop', '75', '2345678901', '#FFD700', NULL, NULL, '1', '2025-11-17 06:32:19', '2025-11-17 06:32:19'), ('10', '2', 'Ice Cream', '3.50', 'Frozen', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop', '50', '3456789012', '#87CEEB', NULL, NULL, '1', '2025-11-17 06:32:19', '2025-11-17 06:32:19'), ('11', '2', 'Motor Oil', '6.09', 'Automotive', 'https://images.unsplash.com/photo-1621188988909-fbef0a88dc04?w=300&h=300&fit=crop', '30', '4567890123', '#708090', NULL, NULL, '1', '2025-11-17 06:32:19', '2025-11-17 06:32:19'), ('12', '2', 'Sample Product', '3.87', 'All Products', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop', '200', '5678901234', '#FFD700', NULL, NULL, '1', '2025-11-17 06:32:19', '2025-11-17 06:32:19'), ('13', '2', 'Soda', '1.75', 'Beverages', 'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?w=300&h=300&fit=crop', '150', '6789012345', '#98D8C8', NULL, NULL, '1', '2025-11-17 06:32:19', '2025-11-17 06:32:19'), ('14', '2', 'Water Bottle', '1.00', 'Beverages', 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=300&h=300&fit=crop', '200', '7890123456', '#E0F2F1', NULL, NULL, '1', '2025-11-17 06:32:19', '2025-11-17 06:32:19'), ('15', '2', 'coffee', '1.25', 'beverages', '/simplepos.react/backend/uploads/gallery/default/coffee.png', '20', NULL, '#f5f5f5', NULL, NULL, '1', '2025-11-17 06:32:54', '2025-11-17 06:32:54'), ('16', '3', 'Candy Bar', '1.55', 'Snacks', 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop', '97', '1234567890', '#FFB6C1', NULL, NULL, '1', '2025-11-27 22:14:42', '2025-11-27 22:14:42'), ('17', '3', 'Chips', '2.50', 'Snacks', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop', '71', '2345678901', '#FFD700', NULL, NULL, '1', '2025-11-27 22:14:42', '2025-11-27 22:14:42'), ('18', '3', 'Ice Cream', '3.50', 'Frozen', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop', '47', '3456789012', '#87CEEB', NULL, NULL, '1', '2025-11-27 22:14:42', '2025-11-27 22:14:42'), ('19', '3', 'Motor Oil', '6.09', 'Automotive', 'https://images.unsplash.com/photo-1621188988909-fbef0a88dc04?w=300&h=300&fit=crop', '27', '4567890123', '#708090', NULL, NULL, '1', '2025-11-27 22:14:42', '2025-11-27 22:14:42'), ('20', '3', 'Sample Product', '3.87', 'All Products', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop', '199', '5678901234', '#FFD700', NULL, NULL, '1', '2025-11-27 22:14:42', '2025-11-27 22:14:42'), ('21', '3', 'Soda', '1.75', 'Beverages', 'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?w=300&h=300&fit=crop', '149', '6789012345', '#98D8C8', NULL, NULL, '1', '2025-11-27 22:14:42', '2025-11-27 22:14:42'), ('22', '3', 'Water Bottle', '1.00', 'Beverages', 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=300&h=300&fit=crop', '200', '7890123456', '#E0F2F1', NULL, NULL, '1', '2025-11-27 22:14:42', '2025-11-27 22:14:42'), ('23', '1', 'Candy Bar', '1.55', 'Snacks', 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop', '100', '1234567890', '#FFB6C1', NULL, NULL, '0', '2025-12-06 20:01:59', '2025-12-06 20:02:04'), ('24', '1', 'Chips', '2.50', 'Snacks', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop', '75', '2345678901', '#FFD700', NULL, NULL, '0', '2025-12-06 20:01:59', '2025-12-06 20:02:07'), ('25', '1', 'Ice Cream', '3.50', 'Frozen', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop', '50', '3456789012', '#87CEEB', NULL, NULL, '0', '2025-12-06 20:01:59', '2025-12-06 20:02:10'), ('26', '1', 'Motor Oil', '6.09', 'Automotive', 'https://images.unsplash.com/photo-1621188988909-fbef0a88dc04?w=300&h=300&fit=crop', '30', '4567890123', '#708090', NULL, NULL, '0', '2025-12-06 20:01:59', '2025-12-06 20:02:14'), ('27', '1', 'Sample Product', '3.87', 'All Products', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop', '200', '5678901234', '#FFD700', NULL, NULL, '0', '2025-12-06 20:01:59', '2025-12-06 20:06:50'), ('28', '1', 'Soda', '1.75', 'Beverages', 'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?w=300&h=300&fit=crop', '150', '6789012345', '#98D8C8', NULL, NULL, '0', '2025-12-06 20:01:59', '2025-12-06 20:06:55'), ('29', '1', 'Water Bottle', '1.00', 'Beverages', 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=300&h=300&fit=crop', '200', '7890123456', '#E0F2F1', NULL, NULL, '0', '2025-12-06 20:01:59', '2025-12-06 20:06:59'), ('30', '1', 'Candy Bar', '1.55', 'Snacks', 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop', '100', '1234567890', '#FFB6C1', NULL, NULL, '0', '2025-12-06 20:07:02', '2025-12-06 20:08:52'), ('31', '1', 'Chips', '2.50', 'Snacks', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop', '75', '2345678901', '#FFD700', NULL, NULL, '0', '2025-12-06 20:07:03', '2025-12-06 20:08:56'), ('32', '1', 'Ice Cream', '3.50', 'Frozen', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop', '50', '3456789012', '#87CEEB', NULL, NULL, '0', '2025-12-06 20:07:03', '2025-12-06 20:09:53'), ('33', '1', 'Motor Oil', '6.09', 'Automotive', 'https://images.unsplash.com/photo-1621188988909-fbef0a88dc04?w=300&h=300&fit=crop', '30', '4567890123', '#708090', NULL, NULL, '0', '2025-12-06 20:07:03', '2025-12-06 20:13:18'), ('34', '1', 'Sample Product', '3.87', 'All Products', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop', '200', '5678901234', '#FFD700', NULL, NULL, '0', '2025-12-06 20:07:03', '2025-12-06 20:13:21'), ('35', '1', 'Soda', '1.75', 'Beverages', 'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?w=300&h=300&fit=crop', '150', '6789012345', '#98D8C8', NULL, NULL, '0', '2025-12-06 20:07:03', '2025-12-06 20:13:24'), ('36', '1', 'Water Bottle', '1.00', 'Beverages', 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=300&h=300&fit=crop', '200', '7890123456', '#E0F2F1', NULL, NULL, '0', '2025-12-06 20:07:03', '2025-12-06 20:13:27'), ('37', '1', 'Hot Coffee', '1.24', 'beverages', '/simplepos.react/backend/uploads/gallery/default/coffee.png', '11', NULL, '#f3e5f5', NULL, NULL, '0', '2025-12-06 20:20:55', '2025-12-07 00:04:12'), ('38', '1', 'Hot Dog', '4.00', 'snacks', '/simplepos.react/backend/uploads/gallery/default/hot-dog.png', '100', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:41', '2025-12-06 22:37:41'), ('39', '1', 'Chili Dog', '5.00', 'snacks', '/simplepos.react/backend/uploads/gallery/default/hot-dog.png', '95', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:41', '2025-12-06 22:37:41'), ('40', '1', 'Cheese Dog', '5.00', 'snacks', '/simplepos.react/backend/uploads/gallery/default/hot-dog.png', '99', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:41', '2025-12-06 22:37:41'), ('41', '1', 'Chili Cheese Dog', '6.00', 'snacks', '/simplepos.react/backend/uploads/gallery/default/hot-dog.png', '96', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:41', '2025-12-06 22:37:41'), ('42', '1', 'Cheese Burger', '6.00', 'snacks', '/simplepos.react/backend/uploads/gallery/default/cheesburger.png', '99', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:41', '2025-12-06 22:37:41'), ('43', '1', 'Hamburger', '5.00', 'snacks', '/simplepos.react/backend/uploads/gallery/default/cheesburger.png', '97', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:41', '2025-12-06 22:37:41'), ('44', '1', 'Double Cheese Burger', '10.00', 'snacks', '/simplepos.react/backend/uploads/gallery/default/cheesburger.png', '32', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:41', '2025-12-06 22:37:41'), ('45', '1', 'Chili Cheese Burger', '8.00', 'snacks', '/simplepos.react/backend/uploads/gallery/default/cheesburger.png', '97', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:41', '2025-12-06 22:37:41'), ('46', '1', 'Hot Dog Baskets', '9.00', 'frozen', '/simplepos.react/backend/uploads/gallery/default/baskets_combo_hot_dog.png', '99', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:41', '2025-12-06 23:49:22'), ('47', '1', 'Chili Dog Baskets', '10.00', 'frozen', '/simplepos.react/backend/uploads/gallery/default/baskets_combo_chili_dog.png', '95', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:41', '2025-12-06 23:49:16'), ('48', '1', 'Chili Cheese Dog Baskets', '11.00', 'frozen', '/simplepos.react/backend/uploads/gallery/default/baskets_combo_chili_cheese_dog .png', '99', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:41', '2025-12-06 23:49:08'), ('49', '1', 'Cheeseburger Basket', '11.00', 'fuel', '/simplepos.react/backend/uploads/gallery/default/baskets_combo_cheesburger.png', '99', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:41', '2025-12-06 23:58:15'), ('50', '1', 'Hamburger Basket', '10.00', 'snacks', '/simplepos.react/backend/uploads/gallery/default/cheesburger.png', '96', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-06 22:37:42')
SQL);
    $conn->exec(<<<'SQL'
INSERT INTO `products` (`id`, `store_id`, `name`, `price`, `category`, `image`, `stock`, `barcode`, `color`, `sku`, `description`, `is_active`, `created_at`, `updated_at`) VALUES ('51', '1', 'Chili Cheeseburger Baskets', '13.00', 'fuel', '/simplepos.react/backend/uploads/gallery/default/baskets_combo_chili_cheeseburger.png', '95', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-06 23:49:41'), ('52', '1', 'Double Cheeseburger Basket', '15.00', 'snacks', '/simplepos.react/backend/uploads/gallery/default/cheesburger.png', '61', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-06 22:37:42'), ('53', '1', 'Nachos', '5.00', 'snacks', '/simplepos.react/backend/uploads/gallery/default/nachos.png', '99', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-06 22:40:07'), ('54', '1', 'Chili & Cheese Nachos', '8.00', 'snacks', '/simplepos.react/backend/uploads/gallery/default/chips.png', '99', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-06 22:37:42'), ('55', '1', 'Chips', '2.00', 'snacks', '/simplepos.react/backend/uploads/gallery/default/chips.png', '91', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-06 22:37:42'), ('56', '1', 'Candy Bars', '2.00', 'snacks', '/simplepos.react/backend/uploads/gallery/default/chocolate.png', '99', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-06 22:37:42'), ('57', '1', 'Fountain Pop 24oz', '4.00', 'beverages', '/simplepos.react/backend/uploads/gallery/default/cup-large.png', '98', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-06 22:37:42'), ('58', '1', 'Coffee', '2.00', 'beverages', '/simplepos.react/backend/uploads/gallery/default/hot_drink_small_coffee_tea.png', '98', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-07 00:03:04'), ('59', '1', 'Coffee', '3.00', 'beverages', '/simplepos.react/backend/uploads/gallery/default/hot_drink_large_coffee_tea.png', '98', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-07 00:03:34'), ('60', '1', 'French Vanilla or White Chocolate Caramel Cappucino', '3.00', 'beverages', '/simplepos.react/backend/uploads/gallery/default/coffee.png', '97', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-06 22:37:42'), ('61', '1', 'Bottled Drinks', '4.00', 'beverages', '/simplepos.react/backend/uploads/gallery/default/bottaled-drinks.png', '98', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-06 22:37:42'), ('62', '1', 'Hot Chocolate', '3.00', 'beverages', '/simplepos.react/backend/uploads/gallery/default/hot-chocolate.png', '100', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-06 22:37:42'), ('63', '1', 'Bottled Water', '3.00', 'beverages', '/simplepos.react/backend/uploads/gallery/default/sparkling-water.png', '99', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-06 22:38:41'), ('64', '1', 'Energy Drinks', '5.00', 'beverages', '/simplepos.react/backend/uploads/gallery/default/energy-drink.png', '95', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-06 22:37:42'), ('65', '1', 'Cup of Ice', '1.00', 'beverages', '/simplepos.react/backend/uploads/gallery/default/cup-small.png', '91', NULL, '#f5f5f5', NULL, NULL, '1', '2025-12-06 22:37:42', '2025-12-06 22:37:42')
SQL);
    echo "\nInserting data into: product_upcs (8 rows)...\n";
    $conn->exec("TRUNCATE TABLE `product_upcs`");
    $conn->exec(<<<'SQL'
INSERT INTO `product_upcs` (`id`, `store_id`, `product_id`, `upc`, `note`, `created_at`, `updated_at`) VALUES ('1', '1', '1', '1234567890', 'Gulf bar', '2025-11-23 19:31:17', '2025-11-23 19:32:21'), ('2', '1', '1', '12345678901', 'Snickers', '2025-11-23 19:31:17', '2025-11-23 19:31:17'), ('3', '1', '2', '2345678901', 'Cheeetos', '2025-11-23 19:32:26', '2025-11-23 19:33:20'), ('5', '1', '4', '4567890123', 'MoPar', '2025-11-23 19:32:31', '2025-11-23 19:33:50'), ('9', '1', '5', '5678901234', 'Headphones', '2025-11-23 19:34:17', '2025-11-23 19:34:17'), ('10', '1', '6', '6789012345', 'pop', '2025-11-23 19:34:29', '2025-11-23 19:34:29'), ('11', '1', '7', '7890123456', 'water', '2025-11-23 19:34:36', '2025-11-23 19:34:36'), ('12', '1', '3', '3456789012', 'Vanilla Ice Cream', '2025-11-23 22:30:37', '2025-11-23 22:30:37')
SQL);
    echo "\nInserting data into: product_categories (130 rows)...\n";
    $conn->exec("TRUNCATE TABLE `product_categories`");
    $conn->exec(<<<'SQL'
INSERT INTO `product_categories` (`id`, `product_id`, `category_id`, `created_at`) VALUES ('1', '5', 'all', '2025-12-06 23:41:45'), ('2', '12', 'all', '2025-12-06 23:41:45'), ('3', '20', 'all', '2025-12-06 23:41:45'), ('4', '27', 'all', '2025-12-06 23:41:45'), ('5', '34', 'all', '2025-12-06 23:41:45'), ('6', '4', 'all', '2025-12-06 23:41:45'), ('7', '4', 'automotive', '2025-12-06 23:41:45'), ('8', '11', 'all', '2025-12-06 23:41:45'), ('9', '11', 'automotive', '2025-12-06 23:41:45'), ('10', '19', 'all', '2025-12-06 23:41:45'), ('11', '19', 'automotive', '2025-12-06 23:41:45'), ('12', '26', 'all', '2025-12-06 23:41:45'), ('13', '26', 'automotive', '2025-12-06 23:41:45'), ('14', '33', 'all', '2025-12-06 23:41:45'), ('15', '33', 'automotive', '2025-12-06 23:41:45'), ('16', '6', 'all', '2025-12-06 23:41:45'), ('17', '6', 'beverages', '2025-12-06 23:41:45'), ('18', '7', 'all', '2025-12-06 23:41:45'), ('19', '7', 'beverages', '2025-12-06 23:41:45'), ('20', '13', 'all', '2025-12-06 23:41:45'), ('21', '13', 'beverages', '2025-12-06 23:41:45'), ('22', '14', 'all', '2025-12-06 23:41:45'), ('23', '14', 'beverages', '2025-12-06 23:41:45'), ('24', '15', 'all', '2025-12-06 23:41:45'), ('25', '15', 'beverages', '2025-12-06 23:41:45'), ('26', '21', 'all', '2025-12-06 23:41:45'), ('27', '21', 'beverages', '2025-12-06 23:41:45'), ('28', '22', 'all', '2025-12-06 23:41:45'), ('29', '22', 'beverages', '2025-12-06 23:41:45'), ('30', '28', 'all', '2025-12-06 23:41:45'), ('31', '28', 'beverages', '2025-12-06 23:41:45'), ('32', '29', 'all', '2025-12-06 23:41:45'), ('33', '29', 'beverages', '2025-12-06 23:41:45'), ('34', '35', 'all', '2025-12-06 23:41:45'), ('35', '35', 'beverages', '2025-12-06 23:41:45'), ('36', '36', 'all', '2025-12-06 23:41:45'), ('37', '36', 'beverages', '2025-12-06 23:41:45'), ('38', '37', 'all', '2025-12-06 23:41:45'), ('39', '37', 'beverages', '2025-12-06 23:41:45'), ('40', '57', 'all', '2025-12-06 23:41:45'), ('41', '57', 'beverages', '2025-12-06 23:41:45'), ('46', '60', 'all', '2025-12-06 23:41:45'), ('47', '60', 'beverages', '2025-12-06 23:41:45'), ('48', '61', 'all', '2025-12-06 23:41:45'), ('49', '61', 'beverages', '2025-12-06 23:41:45'), ('50', '62', 'all', '2025-12-06 23:41:45'), ('51', '62', 'beverages', '2025-12-06 23:41:45'), ('52', '63', 'all', '2025-12-06 23:41:45'), ('53', '63', 'beverages', '2025-12-06 23:41:45'), ('54', '64', 'all', '2025-12-06 23:41:45')
SQL);
    $conn->exec(<<<'SQL'
INSERT INTO `product_categories` (`id`, `product_id`, `category_id`, `created_at`) VALUES ('55', '64', 'beverages', '2025-12-06 23:41:45'), ('56', '65', 'all', '2025-12-06 23:41:45'), ('57', '65', 'beverages', '2025-12-06 23:41:45'), ('58', '3', 'all', '2025-12-06 23:41:45'), ('59', '3', 'frozen', '2025-12-06 23:41:45'), ('60', '10', 'all', '2025-12-06 23:41:45'), ('61', '10', 'frozen', '2025-12-06 23:41:45'), ('62', '18', 'all', '2025-12-06 23:41:45'), ('63', '18', 'frozen', '2025-12-06 23:41:45'), ('64', '25', 'all', '2025-12-06 23:41:45'), ('65', '25', 'frozen', '2025-12-06 23:41:45'), ('66', '32', 'all', '2025-12-06 23:41:45'), ('67', '32', 'frozen', '2025-12-06 23:41:45'), ('78', '1', 'all', '2025-12-06 23:41:45'), ('79', '1', 'snacks', '2025-12-06 23:41:45'), ('80', '2', 'all', '2025-12-06 23:41:45'), ('81', '2', 'snacks', '2025-12-06 23:41:45'), ('82', '8', 'all', '2025-12-06 23:41:45'), ('83', '8', 'snacks', '2025-12-06 23:41:45'), ('84', '9', 'all', '2025-12-06 23:41:45'), ('85', '9', 'snacks', '2025-12-06 23:41:45'), ('86', '16', 'all', '2025-12-06 23:41:45'), ('87', '16', 'snacks', '2025-12-06 23:41:45'), ('88', '17', 'all', '2025-12-06 23:41:45'), ('89', '17', 'snacks', '2025-12-06 23:41:45'), ('90', '23', 'all', '2025-12-06 23:41:45'), ('91', '23', 'snacks', '2025-12-06 23:41:45'), ('92', '24', 'all', '2025-12-06 23:41:45'), ('93', '24', 'snacks', '2025-12-06 23:41:45'), ('94', '30', 'all', '2025-12-06 23:41:45'), ('95', '30', 'snacks', '2025-12-06 23:41:45'), ('96', '31', 'all', '2025-12-06 23:41:45'), ('97', '31', 'snacks', '2025-12-06 23:41:45'), ('98', '38', 'all', '2025-12-06 23:41:45'), ('99', '38', 'snacks', '2025-12-06 23:41:45'), ('100', '39', 'all', '2025-12-06 23:41:45'), ('101', '39', 'snacks', '2025-12-06 23:41:45'), ('102', '40', 'all', '2025-12-06 23:41:45'), ('103', '40', 'snacks', '2025-12-06 23:41:45'), ('104', '41', 'all', '2025-12-06 23:41:45'), ('105', '41', 'snacks', '2025-12-06 23:41:45'), ('106', '42', 'all', '2025-12-06 23:41:45'), ('107', '42', 'snacks', '2025-12-06 23:41:45'), ('108', '43', 'all', '2025-12-06 23:41:45'), ('109', '43', 'snacks', '2025-12-06 23:41:45'), ('110', '44', 'all', '2025-12-06 23:41:45'), ('111', '44', 'snacks', '2025-12-06 23:41:45'), ('112', '45', 'all', '2025-12-06 23:41:45'), ('113', '45', 'snacks', '2025-12-06 23:41:45'), ('114', '50', 'all', '2025-12-06 23:41:45')
SQL);
    $conn->exec(<<<'SQL'
INSERT INTO `product_categories` (`id`, `product_id`, `category_id`, `created_at`) VALUES ('115', '50', 'snacks', '2025-12-06 23:41:45'), ('116', '52', 'all', '2025-12-06 23:41:45'), ('117', '52', 'snacks', '2025-12-06 23:41:45'), ('118', '53', 'all', '2025-12-06 23:41:45'), ('119', '53', 'snacks', '2025-12-06 23:41:45'), ('120', '54', 'all', '2025-12-06 23:41:45'), ('121', '54', 'snacks', '2025-12-06 23:41:45'), ('122', '55', 'all', '2025-12-06 23:41:45'), ('123', '55', 'snacks', '2025-12-06 23:41:45'), ('124', '56', 'all', '2025-12-06 23:41:45'), ('125', '56', 'snacks', '2025-12-06 23:41:45'), ('126', '48', 'all', '2025-12-06 23:49:08'), ('127', '48', 'frozen', '2025-12-06 23:49:08'), ('128', '48', 'automotive', '2025-12-06 23:49:08'), ('129', '47', 'all', '2025-12-06 23:49:16'), ('130', '47', 'frozen', '2025-12-06 23:49:16'), ('131', '47', 'automotive', '2025-12-06 23:49:16'), ('132', '46', 'all', '2025-12-06 23:49:22'), ('133', '46', 'frozen', '2025-12-06 23:49:22'), ('134', '46', 'automotive', '2025-12-06 23:49:22'), ('138', '51', 'all', '2025-12-06 23:49:41'), ('139', '51', 'fuel', '2025-12-06 23:49:41'), ('140', '51', 'automotive', '2025-12-06 23:49:41'), ('144', '49', 'all', '2025-12-06 23:58:15'), ('145', '49', 'fuel', '2025-12-06 23:58:15'), ('146', '49', 'automotive', '2025-12-06 23:58:15'), ('147', '58', 'all', '2025-12-07 00:03:04'), ('148', '58', 'beverages', '2025-12-07 00:03:04'), ('149', '59', 'all', '2025-12-07 00:03:34'), ('150', '59', 'beverages', '2025-12-07 00:03:34')
SQL);
    echo "\nInserting data into: orders (18 rows)...\n";
    $conn->exec("TRUNCATE TABLE `orders`");
    $conn->exec(<<<'SQL'
INSERT INTO `orders` (`id`, `order_id`, `store_id`, `order_name`, `kiosk_number`, `subtotal`, `tax`, `total`, `payment_method`, `cash_given`, `change_amount`, `status`, `cashier_action`, `completed_at`, `cancelled_at`, `created_at`, `updated_at`) VALUES ('1', 'P-1111-95977', '1', 'James1', '7113', '10.30', '0.82', '11.12', 'cash', '50.00', '38.88', 'completed', 'finalize_checkout', '2025-11-11 22:14:27', NULL, '2025-11-11 21:21:59', '2025-11-11 22:14:27'), ('2', 'P-1111-62446', '1', 'James 2', '3466', '14.12', '1.13', '15.25', 'cash', '20.00', '4.75', 'completed', 'finalize_checkout', '2025-11-11 22:13:26', NULL, '2025-11-11 21:27:20', '2025-11-11 22:13:26'), ('3', 'K-1112-62273', '1', 'James 3', '4067', '14.99', '1.20', '16.19', 'cash', '20.00', '3.81', 'pending', 'kiosk_order', NULL, NULL, '2025-11-13 02:22:05', '2025-11-15 03:08:26'), ('4', 'K-1112-73312', '1', 'James 4', '7886', '6.55', '0.52', '7.07', NULL, NULL, '0.00', 'active', 'kiosk_order', NULL, NULL, '2025-11-13 02:23:22', '2025-11-13 02:23:22'), ('5', 'P-1112-11012', '1', 'James5', '3721', '6.55', '0.52', '7.07', 'cash', '50.00', '42.93', 'completed', 'finalize_checkout', '2025-11-15 03:08:45', NULL, '2025-11-13 03:03:44', '2025-11-15 03:08:45'), ('6', 'K-1113-62374', '1', 'James 6', '7586', '13.18', '1.05', '14.23', NULL, NULL, '0.00', 'active', 'kiosk_order', NULL, NULL, '2025-11-13 17:10:46', '2025-11-13 17:10:46'), ('7', 'K-1113-38300', '1', 'james 7', '7428', '5.60', '0.45', '6.05', 'cash', '10.00', '3.95', 'completed', 'kiosk_order', '2025-11-15 03:09:16', NULL, '2025-11-13 21:39:32', '2025-11-15 03:09:16'), ('8', 'K-1113-37119', '1', 'bob', '3422', '10.59', '0.85', '11.44', 'cash', '65.00', '53.56', 'completed', 'kiosk_order', '2025-12-06 22:04:28', NULL, '2025-11-13 22:28:12', '2025-12-06 22:04:28'), ('9', 'K-1113-18442', '1', 'bob-bob', '2550', '3.10', '0.25', '3.35', 'cash', '20.00', '16.65', 'completed', 'kiosk_order', '2025-11-15 03:05:00', NULL, '2025-11-13 22:31:42', '2025-11-15 03:05:00'), ('10', 'K-1113-12135', '1', 'James 7', '9548', '58.09', '4.65', '62.74', 'cash', '70.00', '7.26', 'completed', 'kiosk_order', '2025-11-15 03:07:46', NULL, '2025-11-14 00:42:00', '2025-11-15 03:07:46'), ('11', 'P-1129-48012', '3', 'Tony', '6625', '7.35', '0.59', '7.94', 'cash', '20.00', '12.06', 'pending', 'finalize_checkout', NULL, NULL, '2025-11-29 20:32:50', '2025-11-29 20:32:50'), ('12', 'P-1129-09762', '3', 'ccnum', '9493', '9.50', '0.76', '10.26', 'card', NULL, '0.00', 'pending', 'finalize_checkout', NULL, NULL, '2025-11-29 20:33:38', '2025-11-29 20:33:38'), ('13', 'K-1129-54066', '3', 'test kiosk', '4918', '14.68', '1.17', '15.85', NULL, NULL, '0.00', 'pending', 'kiosk_order', NULL, NULL, '2025-11-29 20:34:08', '2025-11-29 20:34:08'), ('14', 'K-1129-40848', '3', 'Bob bob', '4381', '17.51', '1.40', '18.91', NULL, NULL, '0.00', 'pending', 'kiosk_order', NULL, NULL, '2025-11-29 20:52:36', '2025-11-29 20:52:36'), ('15', 'P-1206-71141', '1', 'James', '6418', '56.26', '4.50', '60.76', 'cash', '70.00', '9.24', 'pending', 'finalize_checkout', NULL, NULL, '2025-12-06 21:36:34', '2025-12-06 21:36:34'), ('16', 'P-1206-11948', '1', 'James', '3784', '22.32', '1.79', '24.11', 'cash', '65.00', '40.89', 'pending', 'finalize_checkout', NULL, NULL, '2025-12-06 22:03:29', '2025-12-06 22:03:29'), ('17', 'P-1206-74721', '1', 'Bobobob', '9533', '7.00', '0.56', '7.56', 'cash', '10.00', '2.44', 'pending', 'finalize_checkout', NULL, NULL, '2025-12-06 22:45:43', '2025-12-06 22:45:43'), ('18', 'K-1206-04122', '1', 'Hxfgfhvb', '7702', '1649.24', '131.94', '1781.18', NULL, NULL, '0.00', 'pending', 'kiosk_order', NULL, NULL, '2025-12-06 22:50:46', '2025-12-06 22:50:46')
SQL);
    echo "\nInserting data into: order_items (78 rows)...\n";
    $conn->exec("TRUNCATE TABLE `order_items`");
    $conn->exec(<<<'SQL'
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `price`, `quantity`, `subtotal`, `created_at`, `updated_at`, `prep_status`, `prep_quantity`) VALUES ('1', '1', '3', 'Ice Cream', '3.50', '2', '7.00', '2025-11-11 21:21:59', '2025-11-11 21:21:59', 'pending', '0'), ('2', '1', '6', 'Soda', '1.75', '1', '1.75', '2025-11-11 21:21:59', '2025-11-11 21:21:59', 'pending', '0'), ('3', '1', '1', 'Candy Bar', '1.55', '1', '1.55', '2025-11-11 21:21:59', '2025-11-11 21:21:59', 'pending', '0'), ('4', '2', '5', 'Sample Product', '3.87', '1', '3.87', '2025-11-11 21:27:20', '2025-11-11 21:27:20', 'pending', '0'), ('5', '2', '2', 'Chips', '2.50', '1', '2.50', '2025-11-11 21:27:20', '2025-11-11 21:27:20', 'pending', '0'), ('6', '2', '1', 'Candy Bar', '1.55', '5', '7.75', '2025-11-11 21:27:20', '2025-11-11 21:27:20', 'pending', '0'), ('7', '3', '1', 'Candy Bar', '1.55', '3', '4.65', '2025-11-13 02:22:05', '2025-11-13 02:22:05', 'pending', '0'), ('8', '3', '2', 'Chips', '2.50', '1', '2.50', '2025-11-13 02:22:05', '2025-11-13 02:22:05', 'pending', '0'), ('9', '3', '4', 'Motor Oil', '6.09', '1', '6.09', '2025-11-13 02:22:05', '2025-11-13 02:22:05', 'pending', '0'), ('10', '3', '6', 'Soda', '1.75', '1', '1.75', '2025-11-13 02:22:05', '2025-11-13 02:22:05', 'pending', '0'), ('11', '4', '1', 'Candy Bar', '1.55', '1', '1.55', '2025-11-13 02:23:22', '2025-11-14 03:45:27', 'prepared', '1'), ('12', '4', '2', 'Chips', '2.50', '2', '5.00', '2025-11-13 02:23:22', '2025-11-14 03:45:50', 'prepared', '2'), ('13', '5', '1', 'Candy Bar', '1.55', '1', '1.55', '2025-11-13 03:03:44', '2025-11-14 03:45:29', 'prepared', '1'), ('14', '5', '2', 'Chips', '2.50', '2', '5.00', '2025-11-13 03:03:44', '2025-11-14 03:45:58', 'prepared', '2'), ('15', '6', '4', 'Motor Oil', '6.09', '2', '12.18', '2025-11-13 17:10:46', '2025-11-13 17:10:46', 'pending', '0'), ('16', '6', '7', 'Water Bottle', '1.00', '1', '1.00', '2025-11-13 17:10:46', '2025-11-13 17:10:46', 'pending', '0'), ('17', '7', '1', 'Candy Bar', '1.55', '2', '3.10', '2025-11-13 21:39:32', '2025-11-14 03:45:31', 'prepared', '2'), ('18', '7', '2', 'Chips', '2.50', '1', '2.50', '2025-11-13 21:39:32', '2025-11-13 21:39:32', 'pending', '0'), ('19', '8', '3', 'Ice Cream', '3.50', '1', '3.50', '2025-11-13 22:28:12', '2025-11-13 22:28:12', 'pending', '0'), ('20', '8', '4', 'Motor Oil', '6.09', '1', '6.09', '2025-11-13 22:28:12', '2025-11-13 22:28:12', 'pending', '0'), ('21', '8', '7', 'Water Bottle', '1.00', '1', '1.00', '2025-11-13 22:28:12', '2025-11-13 22:28:12', 'pending', '0'), ('22', '9', '1', 'Candy Bar', '1.55', '2', '3.10', '2025-11-13 22:31:43', '2025-11-14 03:45:37', 'prepared', '2'), ('23', '10', '7', 'Water Bottle', '1.00', '2', '2.00', '2025-11-14 00:42:00', '2025-11-14 00:42:00', 'pending', '0'), ('24', '10', '6', 'Soda', '1.75', '1', '1.75', '2025-11-14 00:42:00', '2025-11-14 00:42:00', 'pending', '0'), ('25', '10', '3', 'Ice Cream', '3.50', '6', '21.00', '2025-11-14 00:42:00', '2025-11-14 00:42:00', 'pending', '0'), ('26', '10', '2', 'Chips', '2.50', '2', '5.00', '2025-11-14 00:42:00', '2025-11-14 00:42:00', 'pending', '0'), ('27', '10', '5', 'Sample Product', '3.87', '1', '3.87', '2025-11-14 00:42:00', '2025-11-14 03:45:11', 'prepared', '1'), ('28', '10', '4', 'Motor Oil', '6.09', '3', '18.27', '2025-11-14 00:42:00', '2025-11-14 00:42:00', 'pending', '0'), ('29', '10', '1', 'Candy Bar', '1.55', '4', '6.20', '2025-11-14 00:42:00', '2025-11-14 03:45:44', 'prepared', '4'), ('30', '11', '21', 'Soda', '1.75', '1', '1.75', '2025-11-29 20:32:50', '2025-11-29 20:32:50', 'pending', '0'), ('31', '11', '17', 'Chips', '2.50', '1', '2.50', '2025-11-29 20:32:50', '2025-11-29 20:32:50', 'pending', '0'), ('32', '11', '16', 'Candy Bar', '1.55', '2', '3.10', '2025-11-29 20:32:50', '2025-11-29 20:32:50', 'pending', '0'), ('33', '12', '18', 'Ice Cream', '3.50', '2', '7.00', '2025-11-29 20:33:38', '2025-11-29 20:33:38', 'pending', '0'), ('34', '12', '17', 'Chips', '2.50', '1', '2.50', '2025-11-29 20:33:38', '2025-11-29 20:33:38', 'pending', '0'), ('35', '13', '19', 'Motor Oil', '6.09', '2', '12.18', '2025-11-29 20:34:08', '2025-11-29 20:34:08', 'pending', '0'), ('36', '13', '17', 'Chips', '2.50', '1', '2.50', '2025-11-29 20:34:08', '2025-11-29 20:34:08', 'pending', '0'), ('37', '14', '18', 'Ice Cream', '3.50', '1', '3.50', '2025-11-29 20:52:36', '2025-11-29 20:52:36', 'pending', '0'), ('38', '14', '17', 'Chips', '2.50', '1', '2.50', '2025-11-29 20:52:36', '2025-11-29 20:52:36', 'pending', '0'), ('39', '14', '20', 'Sample Product', '3.87', '1', '3.87', '2025-11-29 20:52:36', '2025-11-29 20:52:36', 'pending', '0'), ('40', '14', '16', 'Candy Bar', '1.55', '1', '1.55', '2025-11-29 20:52:36', '2025-11-29 20:52:36', 'pending', '0'), ('41', '14', '19', 'Motor Oil', '6.09', '1', '6.09', '2025-11-29 20:52:36', '2025-11-29 20:52:36', 'pending', '0'), ('42', '15', '3', 'Ice Cream', '3.50', '3', '10.50', '2025-12-06 21:36:34', '2025-12-06 21:36:34', 'pending', '0'), ('43', '15', '6', 'Soda', '1.75', '4', '7.00', '2025-12-06 21:36:34', '2025-12-06 21:36:34', 'pending', '0'), ('44', '15', '5', 'Sample Product', '3.87', '4', '15.48', '2025-12-06 21:36:34', '2025-12-06 21:36:34', 'pending', '0'), ('45', '15', '2', 'Chips', '2.50', '2', '5.00', '2025-12-06 21:36:34', '2025-12-06 21:36:34', 'pending', '0'), ('46', '15', '1', 'Candy Bar', '1.55', '2', '3.10', '2025-12-06 21:36:34', '2025-12-06 21:36:34', 'pending', '0'), ('47', '15', '4', 'Motor Oil', '6.09', '2', '12.18', '2025-12-06 21:36:34', '2025-12-06 21:36:34', 'pending', '0'), ('48', '15', '7', 'Water Bottle', '1.00', '3', '3.00', '2025-12-06 21:36:34', '2025-12-06 21:36:34', 'pending', '0'), ('49', '16', '37', 'Hot Coffee', '1.24', '18', '22.32', '2025-12-06 22:03:29', '2025-12-06 22:03:29', 'pending', '0'), ('50', '17', '60', 'French Vanilla or White Chocolate Caramel Cappucino', '3.00', '1', '3.00', '2025-12-06 22:45:43', '2025-12-06 22:45:43', 'pending', '0')
SQL);
    $conn->exec(<<<'SQL'
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `price`, `quantity`, `subtotal`, `created_at`, `updated_at`, `prep_status`, `prep_quantity`) VALUES ('51', '17', '61', 'Bottled Drinks', '4.00', '1', '4.00', '2025-12-06 22:45:43', '2025-12-06 22:45:43', 'pending', '0'), ('52', '18', '64', 'Energy Drinks', '5.00', '5', '25.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('53', '18', '59', 'Coffee', '3.00', '2', '6.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('54', '18', '65', 'Cup of Ice', '1.00', '9', '9.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('55', '18', '44', 'Double Cheese Burger', '10.00', '68', '680.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('56', '18', '47', 'Chili Dog Baskets', '10.00', '5', '50.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('57', '18', '51', 'Chili Cheeseburger Baskets', '13.00', '5', '65.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('58', '18', '60', 'French Vanilla or White Chocolate Caramel Cappucino', '3.00', '2', '6.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('59', '18', '46', 'Hot Dog Baskets', '9.00', '1', '9.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('60', '18', '37', 'Hot Coffee', '1.24', '1', '1.24', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('61', '18', '53', 'Nachos', '5.00', '1', '5.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('62', '18', '43', 'Hamburger', '5.00', '3', '15.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('63', '18', '57', 'Fountain Pop 24oz', '4.00', '2', '8.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('64', '18', '55', 'Chips', '2.00', '9', '18.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('65', '18', '52', 'Double Cheeseburger Basket', '15.00', '39', '585.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('66', '18', '39', 'Chili Dog', '5.00', '5', '25.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('67', '18', '50', 'Hamburger Basket', '10.00', '4', '40.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('68', '18', '58', 'Coffee', '2.00', '2', '4.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('69', '18', '41', 'Chili Cheese Dog', '6.00', '4', '24.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('70', '18', '54', 'Chili & Cheese Nachos', '8.00', '1', '8.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('71', '18', '49', 'Cheeseburger Basket', '11.00', '1', '11.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('72', '18', '45', 'Chili Cheese Burger', '8.00', '3', '24.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('73', '18', '63', 'Bottled Water', '3.00', '1', '3.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('74', '18', '61', 'Bottled Drinks', '4.00', '1', '4.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('75', '18', '56', 'Candy Bars', '2.00', '1', '2.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('76', '18', '42', 'Cheese Burger', '6.00', '1', '6.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('77', '18', '40', 'Cheese Dog', '5.00', '1', '5.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0'), ('78', '18', '48', 'Chili Cheese Dog Baskets', '11.00', '1', '11.00', '2025-12-06 22:50:46', '2025-12-06 22:50:46', 'pending', '0')
SQL);
    echo "\nInserting data into: admin_settings (1 rows)...\n";
    $conn->exec("TRUNCATE TABLE `admin_settings`");
    $conn->exec(<<<'SQL'
INSERT INTO `admin_settings` (`id`, `setting_key`, `setting_value`, `description`, `created_at`, `updated_at`) VALUES ('1', 'max_instances_per_email', '3', 'Maximum number of store instances allowed per email address', '0000-00-00 00:00:00', '0000-00-00 00:00:00')
SQL);

    // Re-enable foreign key checks
    $conn->exec("SET FOREIGN_KEY_CHECKS = 1");

    echo "\n========================================\n";
    echo "✓ Migration complete!\n";
    echo "========================================\n";
    echo "\n⚠️  IMPORTANT: Delete this file now for security!\n";

} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

echo "</pre>";