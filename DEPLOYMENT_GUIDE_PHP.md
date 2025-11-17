# Complete Deployment Guide: SimplePOS on Apache + MySQL + PHP

This guide provides step-by-step instructions for deploying your React SimplePOS application to an Apache web server with PHP backend and MySQL database.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Apache Configuration](#apache-configuration)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Apache 2.4+** with mod_rewrite enabled
- **PHP 8.0+** with PDO MySQL extension
- **MySQL 8.0+** or MariaDB 10.5+
- **Node.js 18+** and npm (for building React)
- **Git** (optional, for version control)

### XAMPP Users

If using XAMPP, you already have Apache, PHP, and MySQL. Ensure:
- Apache is running on port 80
- MySQL is running on port 3306
- PHP extensions enabled: `pdo_mysql`, `mbstring`, `json`

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│         Apache Web Server (Port 80)         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │   Frontend   │      │   PHP Backend   │ │
│  │  (React App) │─────▶│   API Endpoints │ │
│  │  /index.html │      │  /php-backend/  │ │
│  └──────────────┘      └─────────────────┘ │
│                               │             │
└───────────────────────────────┼─────────────┘
                                │
                    ┌───────────▼──────────┐
                    │   MySQL Database     │
                    │   (simplepos)        │
                    └──────────────────────┘
```

---

## Database Setup

### Step 1: Create MySQL Database

```sql
-- Login to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE simplepos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional, for production)
CREATE USER 'simplepos_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON simplepos.* TO 'simplepos_user'@'localhost';
FLUSH PRIVILEGES;

-- Use the database
USE simplepos;
```

### Step 2: Create Database Tables

```sql
-- Stores table
CREATE TABLE stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guid VARCHAR(36) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    currency_symbol VARCHAR(5) DEFAULT '$',
    tax_rate DECIMAL(5,4) DEFAULT 0.0800,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_guid (guid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Store labels table
CREATE TABLE store_labels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    label VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    recovery_email VARCHAR(255),
    permissions JSON,
    last_access TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    UNIQUE KEY unique_store_label (store_id, label),
    INDEX idx_label (label),
    INDEX idx_email (recovery_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    image TEXT,
    stock INT DEFAULT 0,
    barcode VARCHAR(100),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    INDEX idx_store (store_id),
    INDEX idx_category (category),
    INDEX idx_barcode (barcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(36) UNIQUE NOT NULL,
    store_id INT NOT NULL,
    order_name VARCHAR(255),
    kiosk_number VARCHAR(50),
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    cash_given DECIMAL(10,2),
    change_amount DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    cashier_action VARCHAR(100),
    completed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_store (store_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order items table
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    prep_quantity INT DEFAULT 0,
    prep_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table (optional, for registered users)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    subscription VARCHAR(50) DEFAULT 'free',
    payment_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin settings table
CREATE TABLE admin_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('max_instances_per_email', '3', 'Maximum number of store instances allowed per email address');
```

---

## Backend Deployment

### Step 1: Ensure PHP Backend is Web-Accessible

In this repo, the PHP backend already lives inside the `simplepos.react` folder:

```text
c:\xampp\htdocs\simplepos.react\php-backend
```

When Apache serves `c:\xampp\htdocs\simplepos.react` at `http://localhost/simplepos.react`,
the PHP API will be available at:

```text
http://localhost/simplepos.react/php-backend/api/...
```

If you deploy to another server, copy the entire `simplepos.react` directory into
your web root so the React app and `php-backend` stay together.

### Step 2: Configure Database Connection

Edit `php-backend/config/database.php`:

```php
<?php
class Database {
    private $host = 'localhost';      // Your MySQL host
    private $db_name = 'simplepos';   // Your database name
    private $username = 'root';        // Your MySQL username
    private $password = '';            // Your MySQL password
    
    // ... rest of the class
}
```

**For production**, use environment variables or a separate config file:

```php
// Load from .env or config file
$this->host = getenv('DB_HOST') ?: 'localhost';
$this->db_name = getenv('DB_NAME') ?: 'simplepos';
$this->username = getenv('DB_USER') ?: 'root';
$this->password = getenv('DB_PASSWORD') ?: '';
```

### Step 3: Set Permissions

```bash
# Create uploads directory
mkdir -p /var/www/html/php-backend/uploads/gallery/default
chmod -R 775 /var/www/html/php-backend/uploads
chown -R www-data:www-data /var/www/html/php-backend/uploads

# For XAMPP (Windows), no special permissions needed
# For XAMPP (macOS/Linux)
sudo mkdir -p /Applications/XAMPP/htdocs/php-backend/uploads/gallery/default
sudo chmod -R 775 /Applications/XAMPP/htdocs/php-backend/uploads
```

### Step 4: Configure PHP Backend .htaccess

Create/update `php-backend/.htaccess`:

```apache
# Enable CORS
<IfModule mod_headers.c>
  Header always set Access-Control-Allow-Origin "*"
  Header always set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
  Header always set Access-Control-Max-Age "86400"
</IfModule>

# Handle OPTIONS preflight
RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

Options -Indexes
```

---

## Frontend Deployment

### Step 1: Build React Application

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Build for production with PHP backend flag
REACT_APP_USE_PHP_BACKEND=true npm run build

# Or for Windows PowerShell
$env:REACT_APP_USE_PHP_BACKEND="true"; npm run build

# Or for Windows CMD
set REACT_APP_USE_PHP_BACKEND=true && npm run build
```

This creates an optimized production build in the `frontend/dist` folder.

### Step 2: Deploy Frontend to Apache

```bash
# For XAMPP on Windows (PowerShell)
xcopy /E /I /Y "frontend\dist\*" "c:\xampp\htdocs\simplepos.react"

# For XAMPP on macOS/Linux
cp -r frontend/dist/* /Applications/XAMPP/htdocs/simplepos.react/

# For Ubuntu/Debian
sudo cp -r frontend/dist/* /var/www/html/simplepos.react/
sudo chown -R www-data:www-data /var/www/html/simplepos.react
```

### Step 3: Configure Frontend .htaccess

Create `simplepos.react/.htaccess` (or wherever you deployed frontend):

```apache
# React Router configuration
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /simplepos.react/
  
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  
  # Redirect all requests to index.html
  RewriteRule . /simplepos.react/index.html [L]
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType image/x-icon "access plus 1 year"
</IfModule>
```

**Note**: Adjust `RewriteBase` if deploying to root:
- Root deployment: `RewriteBase /`
- Subdirectory: `RewriteBase /simplepos.react/`

---

## Apache Configuration

### Step 1: Enable Required Modules

```bash
# Ubuntu/Debian
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod deflate
sudo a2enmod expires
sudo systemctl restart apache2

# For XAMPP, these modules are typically enabled by default
# Check httpd.conf and uncomment these lines if needed:
# LoadModule rewrite_module modules/mod_rewrite.so
# LoadModule headers_module modules/mod_headers.so
```

### Step 2: Configure Virtual Host (Optional)

For a production setup, create a virtual host:

```apache
<VirtualHost *:80>
    ServerName simplepos.local
    DocumentRoot "/var/www/html/simplepos"
    
    <Directory "/var/www/html/simplepos">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # PHP Backend alias
    Alias /php-backend "/var/www/html/php-backend"
    <Directory "/var/www/html/php-backend">
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/simplepos-error.log
    CustomLog ${APACHE_LOG_DIR}/simplepos-access.log combined
</VirtualHost>
```

Save to `/etc/apache2/sites-available/simplepos.conf` and enable:

```bash
sudo a2ensite simplepos
sudo systemctl reload apache2
```

### Step 3: Update hosts file (for local testing)

```bash
# Linux/macOS
sudo nano /etc/hosts

# Windows
notepad C:\Windows\System32\drivers\etc\hosts
```

Add line:
```
127.0.0.1   simplepos.local
```

---

## Testing & Verification

### Step 1: Test PHP Backend

```bash
# Test database connection
curl http://localhost/php-backend/api/auth/generate-guid.php

# Should return: {"guid":"..."}
```

### Step 2: Test Frontend

Open browser and navigate to:
- XAMPP: `http://localhost/simplepos.react`
- Virtual host: `http://simplepos.local`

### Step 3: Create Test Store

1. Click "Create New Store"
2. Enter a label (e.g., "test")
3. System should redirect to POS interface
4. Add test products and create an order

### Step 4: Verify Database

```sql
USE simplepos;

-- Check created stores
SELECT * FROM stores;

-- Check store labels
SELECT * FROM store_labels;

-- Check products
SELECT * FROM products;

-- Check orders
SELECT * FROM orders;
```

---

## Troubleshooting

### Issue: "404 Not Found" for API endpoints

**Solution**:
- Ensure mod_rewrite is enabled
- Check .htaccess files are present
- Verify AllowOverride is set to "All" in Apache config

```bash
# Check Apache error log
tail -f /var/log/apache2/error.log  # Linux
tail -f /Applications/XAMPP/logs/error_log  # macOS XAMPP
# Windows: C:\xampp\apache\logs\error.log
```

### Issue: "Database connection failed"

**Solution**:
- Verify MySQL is running
- Check database credentials in `php-backend/config/database.php`
- Ensure database and tables exist

```bash
# Test MySQL connection
mysql -u root -p -e "SHOW DATABASES;"
```

### Issue: React routing not working (404 on refresh)

**Solution**:
- Ensure .htaccess exists in frontend directory
- Verify RewriteBase matches your deployment path
- Check mod_rewrite is enabled

### Issue: CORS errors in browser console

**Solution**:
- Verify CORS headers in `php-backend/config/cors.php`
- Check .htaccess CORS configuration
- Ensure mod_headers is enabled

### Issue: Image uploads failing

**Solution**:
- Check upload directory permissions
- Verify directory exists: `php-backend/uploads/gallery/`
- Ensure PHP has write permissions

```bash
sudo chmod -R 775 /var/www/html/php-backend/uploads
sudo chown -R www-data:www-data /var/www/html/php-backend/uploads
```

### Issue: Real-time updates not working

**Solution**:
- PHP backend uses Server-Sent Events (SSE), not WebSocket
- Check browser supports SSE
- Verify polling endpoint works as fallback
- Check firewall/proxy settings

---

## Production Considerations

### Security

1. **Change JWT Secret**: Update in `php-backend/utils/jwt.php`
2. **Use Environment Variables**: Store credentials securely
3. **Enable HTTPS**: Use SSL/TLS certificates
4. **Restrict Database Access**: Create dedicated MySQL user with limited privileges
5. **Disable Directory Listing**: Ensure `.htaccess` has `Options -Indexes`
6. **Update PHP**: Keep PHP and Apache up to date

### Performance

1. **Enable OPcache**: PHP opcode caching
2. **Use CDN**: For static assets
3. **Database Indexing**: Ensure all foreign keys are indexed
4. **Connection Pooling**: Configure MySQL connection pool
5. **Gzip Compression**: Enable in Apache

### Monitoring

1. **Error Logging**: Configure PHP error logging
2. **Access Logs**: Monitor Apache access logs
3. **Database Monitoring**: Track slow queries
4. **Uptime Monitoring**: Use external service

---

## Directory Structure (Final)

```
/var/www/html/  (or C:\xampp\htdocs\)
└── simplepos.react/               # SimplePOS app + PHP backend
    ├── index.html                 # React entry
    ├── assets/                    # Built JS/CSS bundles
    ├── php-backend/               # PHP Backend API
    │   ├── api/
    │   │   ├── auth/
    │   │   ├── products/
    │   │   ├── orders/
    │   │   ├── stores/
    │   │   ├── admin/
    │   │   ├── kds/
    │   │   └── realtime/
    │   ├── config/
    │   │   ├── database.php
    │   │   └── cors.php
    │   ├── utils/
    │   │   ├── response.php
    │   │   ├── jwt.php
    │   │   └── uuid.php
    │   ├── uploads/
    │   │   └── gallery/
    │   │       ├── default/
    │   │       └── [store-guid]/
    │   └── .htaccess
    └── .htaccess                  # React Router + caching
    │   │   ├── labels.php
    │   │   └── config.php
    │   ├── admin/
    │   │   ├── settings.php
    │   │   └── stats.php
    │   ├── kds/
    │   │   └── summary.php
    │   └── realtime/
    │       ├── sse.php
    │       └── polling.php
    ├── config/
    │   ├── database.php
    │   └── cors.php
    ├── utils/
    │   ├── response.php
    │   ├── jwt.php
    │   └── uuid.php
    ├── uploads/
    │   └── gallery/
    │       ├── default/
    │       └── [store-guid]/
    └── .htaccess
```

---

## Support & Additional Resources

- **PHP API Endpoints**: See `PHP_API_ENDPOINTS.md` for complete API documentation
- **Database Schema**: All CREATE TABLE statements above
- **Apache Documentation**: https://httpd.apache.org/docs/
- **PHP PDO**: https://www.php.net/manual/en/book.pdo.php

---

## Migration from Node.js

If you're currently running the Node.js backend:

1. Keep Node.js backend running during transition
2. Build frontend with PHP flag: `REACT_APP_USE_PHP_BACKEND=true`
3. Deploy PHP backend and test alongside Node.js
4. Update DNS/routing to point to Apache
5. Monitor for 24-48 hours
6. Decommission Node.js backend

Both backends can run simultaneously for testing purposes.

---

**Deployment Complete!** 🎉

Your SimplePOS application is now running on Apache with PHP backend and MySQL database.
