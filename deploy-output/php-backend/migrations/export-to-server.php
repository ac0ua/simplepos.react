<?php
/**
 * Database Export Script
 * Exports local database to SQL file for server migration
 * 
 * Run this locally: php export-to-server.php
 * This generates: server-migration.php
 */

require_once __DIR__ . '/../config/database.php';

echo "=== SimplePOS Database Export Tool ===\n\n";

try {
    $db = new Database();
    $conn = $db->connect();
    
    // Tables to export in order (respecting foreign keys)
    $tables = [
        'stores',
        'store_labels', 
        'store_label_themes',
        'products',
        'product_upcs',
        'product_categories',
        'orders',
        'order_items',
        'users',
        'admin_settings'
    ];
    
    $output = [];
    $output[] = '<?php';
    $output[] = '/**';
    $output[] = ' * SimplePOS Server Migration Script';
    $output[] = ' * Generated: ' . date('Y-m-d H:i:s');
    $output[] = ' * ';
    $output[] = ' * Upload this file to your server and run it once to migrate data.';
    $output[] = ' * URL: https://your-server.com/simplepos.react/php-backend/migrations/server-migration.php';
    $output[] = ' */';
    $output[] = '';
    $output[] = '// Server database configuration';
    $output[] = '$serverConfig = [';
    $output[] = '    "host" => "localhost",';
    $output[] = '    "dbname" => "simplepos_react",';
    $output[] = '    "username" => "simplepos_react",';
    $output[] = '    "password" => "asdf1234"';
    $output[] = '];';
    $output[] = '';
    $output[] = '// Security check - remove this line after running once';
    $output[] = 'if (!isset($_GET["run"]) || $_GET["run"] !== "migrate") {';
    $output[] = '    die("Add ?run=migrate to URL to execute migration. DELETE THIS FILE AFTER USE!");';
    $output[] = '}';
    $output[] = '';
    $output[] = 'error_reporting(E_ALL);';
    $output[] = 'ini_set("display_errors", 1);';
    $output[] = 'set_time_limit(300); // 5 minutes';
    $output[] = '';
    $output[] = 'echo "<pre>";';
    $output[] = 'echo "=== SimplePOS Server Migration ===\n\n";';
    $output[] = '';
    $output[] = 'try {';
    $output[] = '    $dsn = "mysql:host={$serverConfig[\'host\']};dbname={$serverConfig[\'dbname\']};charset=utf8mb4";';
    $output[] = '    $conn = new PDO($dsn, $serverConfig["username"], $serverConfig["password"], [';
    $output[] = '        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,';
    $output[] = '        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC';
    $output[] = '    ]);';
    $output[] = '    echo "✓ Connected to server database\n\n";';
    $output[] = '';
    $output[] = '    // Disable foreign key checks during import';
    $output[] = '    $conn->exec("SET FOREIGN_KEY_CHECKS = 0");';
    $output[] = '';
    
    // Generate CREATE TABLE statements
    $output[] = '    // ========================================';
    $output[] = '    // CREATE TABLES';
    $output[] = '    // ========================================';
    $output[] = '';
    
    foreach ($tables as $table) {
        // Check if table exists
        $checkStmt = $conn->query("SHOW TABLES LIKE '$table'");
        if ($checkStmt->fetch() === false) {
            echo "Skipping table '$table' (does not exist)\n";
            continue;
        }
        
        // Get CREATE TABLE statement
        $createStmt = $conn->query("SHOW CREATE TABLE `$table`");
        $createRow = $createStmt->fetch();
        $createSql = $createRow['Create Table'];
        
        // Modify to use IF NOT EXISTS
        $createSql = str_replace("CREATE TABLE `$table`", "CREATE TABLE IF NOT EXISTS `$table`", $createSql);
        
        $output[] = '    echo "Creating table: ' . $table . '...\n";';
        $output[] = '    $conn->exec(<<<\'SQL\'';
        $output[] = $createSql;
        $output[] = 'SQL);';
        $output[] = '';
        
        echo "Exported table structure: $table\n";
    }
    
    // Generate INSERT statements for each table
    $output[] = '    // ========================================';
    $output[] = '    // INSERT DATA';
    $output[] = '    // ========================================';
    $output[] = '';
    
    $totalRows = 0;
    
    foreach ($tables as $table) {
        // Check if table exists
        $checkStmt = $conn->query("SHOW TABLES LIKE '$table'");
        if ($checkStmt->fetch() === false) {
            continue;
        }
        
        // Get all rows
        $stmt = $conn->query("SELECT * FROM `$table`");
        $rows = $stmt->fetchAll();
        
        if (count($rows) === 0) {
            echo "Skipping data for '$table' (empty)\n";
            continue;
        }
        
        $output[] = '    echo "\nInserting data into: ' . $table . ' (' . count($rows) . ' rows)...\n";';
        $output[] = '    $conn->exec("TRUNCATE TABLE `' . $table . '`");';
        
        // Get column names
        $columns = array_keys($rows[0]);
        $columnList = '`' . implode('`, `', $columns) . '`';
        
        // Build INSERT statements (batch them for efficiency)
        $batchSize = 50;
        $batches = array_chunk($rows, $batchSize);
        $batchNum = 0;
        
        foreach ($batches as $batch) {
            $values = [];
            foreach ($batch as $row) {
                $rowValues = [];
                foreach ($row as $value) {
                    if ($value === null) {
                        $rowValues[] = 'NULL';
                    } else {
                        // Escape for MySQL - use real escaping
                        $escaped = str_replace(
                            ["\\", "\x00", "\n", "\r", "'", '"', "\x1a"],
                            ["\\\\", "\\0", "\\n", "\\r", "\\'", '\\"', "\\Z"],
                            $value
                        );
                        $rowValues[] = "'" . $escaped . "'";
                    }
                }
                $values[] = '(' . implode(', ', $rowValues) . ')';
            }
            
            $insertSql = "INSERT INTO `$table` ($columnList) VALUES " . implode(', ', $values);
            $batchNum++;
            $output[] = '    $conn->exec(<<<\'SQL\'';
            $output[] = $insertSql;
            $output[] = 'SQL);';
        }
        
        $totalRows += count($rows);
        echo "Exported data: $table (" . count($rows) . " rows)\n";
    }
    
    $output[] = '';
    $output[] = '    // Re-enable foreign key checks';
    $output[] = '    $conn->exec("SET FOREIGN_KEY_CHECKS = 1");';
    $output[] = '';
    $output[] = '    echo "\n========================================\n";';
    $output[] = '    echo "✓ Migration complete!\n";';
    $output[] = '    echo "========================================\n";';
    $output[] = '    echo "\n⚠️  IMPORTANT: Delete this file now for security!\n";';
    $output[] = '';
    $output[] = '} catch (PDOException $e) {';
    $output[] = '    echo "ERROR: " . $e->getMessage() . "\n";';
    $output[] = '    exit(1);';
    $output[] = '}';
    $output[] = '';
    $output[] = 'echo "</pre>";';
    
    // Write the migration file
    $migrationFile = __DIR__ . '/server-migration.php';
    file_put_contents($migrationFile, implode("\n", $output));
    
    echo "\n========================================\n";
    echo "✓ Export complete!\n";
    echo "========================================\n";
    echo "Total rows exported: $totalRows\n";
    echo "Migration file created: server-migration.php\n";
    echo "\nNext steps:\n";
    echo "1. Upload server-migration.php to your server's php-backend/migrations/ folder\n";
    echo "2. Visit: https://your-server.com/simplepos.react/php-backend/migrations/server-migration.php?run=migrate\n";
    echo "3. DELETE the file after migration completes!\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
