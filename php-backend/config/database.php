<?php
/**
 * Database Configuration and Connection
 * MySQL PDO connection with error handling
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'simplepos';
    private $username = 'root';
    private $password = '';
    private $conn = null;
    
    public function __construct() {
        // Load from environment variables if available
        if (getenv('DB_HOST')) $this->host = getenv('DB_HOST');
        if (getenv('DB_NAME')) $this->db_name = getenv('DB_NAME');
        if (getenv('DB_USER')) $this->username = getenv('DB_USER');
        if (getenv('DB_PASSWORD')) $this->password = getenv('DB_PASSWORD');
    }
    
    public function connect() {
        if ($this->conn !== null) {
            return $this->conn;
        }
        
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            return $this->conn;
            
        } catch(PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }
    
    public function disconnect() {
        $this->conn = null;
    }
}
