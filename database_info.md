# Simple POS - MySQL Database Information

## Database Configuration

**Database Name:** `simplepos`  
**Host:** localhost  
**Port:** 3306  
**User:** root  
**Password:** (empty)

## Database Tables

### 1. stores
Stores the main store information with GUID-based access.

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, Auto) | Primary key |
| guid | UUID | Unique store identifier |
| business_name | VARCHAR(255) | Store business name |
| currency | VARCHAR(3) | Currency code (USD, EUR, etc.) |
| currency_symbol | VARCHAR(5) | Currency symbol ($, €, etc.) |
| tax_rate | DECIMAL(5,4) | Tax rate (e.g., 0.0800 for 8%) |
| tax_enabled | BOOLEAN | Whether tax is enabled |
| settings | JSON | Additional store settings |
| is_active | BOOLEAN | Store active status |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

### 2. store_labels
Manages access labels for each store (e.g., "happydays", "register1").

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, Auto) | Primary key |
| store_id | INT (FK) | Reference to stores table |
| label | VARCHAR(100) | Access label name |
| recovery_email | VARCHAR(255) | Email for GUID/Label recovery (optional) |
| permissions | JSON | Array of permissions |
| last_access | DATETIME | Last access timestamp |
| is_active | BOOLEAN | Label active status |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

### 3. products
Product catalog for each store.

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, Auto) | Primary key |
| store_id | INT (FK) | Reference to stores table |
| name | VARCHAR(255) | Product name |
| price | DECIMAL(10,2) | Product price |
| category | VARCHAR(100) | Product category |
| image | TEXT | Product image URL |
| stock | INT | Current stock quantity |
| barcode | VARCHAR(50) | Product barcode |
| color | VARCHAR(20) | Display color |
| sku | VARCHAR(50) | Stock keeping unit |
| description | TEXT | Product description |
| is_active | BOOLEAN | Product active status |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

### 4. orders
Customer orders and transactions.

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, Auto) | Primary key |
| order_id | UUID | Unique order identifier |
| store_id | INT (FK) | Reference to stores table |
| subtotal | DECIMAL(10,2) | Order subtotal |
| tax | DECIMAL(10,2) | Tax amount |
| total | DECIMAL(10,2) | Total amount |
| payment_method | ENUM | 'cash', 'card', 'other' |
| cash_given | DECIMAL(10,2) | Cash amount given (if cash) |
| change_amount | DECIMAL(10,2) | Change returned |
| status | ENUM | 'pending', 'processing', 'completed', 'cancelled', 'refunded' |
| cashier_action | VARCHAR(50) | Cashier action type |
| completed_at | DATETIME | Completion timestamp |
| cancelled_at | DATETIME | Cancellation timestamp |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

### 5. order_items
Individual items within each order.

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, Auto) | Primary key |
| order_id | INT (FK) | Reference to orders table |
| product_id | INT (FK) | Reference to products table |
| product_name | VARCHAR(255) | Product name (snapshot) |
| price | DECIMAL(10,2) | Price at time of sale |
| quantity | INT | Quantity ordered |
| subtotal | DECIMAL(10,2) | Line item subtotal |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

### 6. users
Registered users for advanced features (optional).

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, Auto) | Primary key |
| user_id | UUID | Unique user identifier |
| email | VARCHAR(255) | User email (unique) |
| password | VARCHAR(255) | Hashed password |
| subscription | ENUM | 'free', 'basic', 'premium', 'enterprise' |
| payment_enabled | BOOLEAN | Payment features enabled |
| is_active | BOOLEAN | User active status |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

## Relationships

```
stores (1) ──< (N) store_labels
stores (1) ──< (N) products
stores (1) ──< (N) orders
orders (1) ──< (N) order_items
products (1) ──< (N) order_items
```

## Demo Data

The system automatically seeds demo data on first run:

**Demo Store:**
- GUID: `6c24c729-3edc-4ada-be8f-96d34b4d8dd3`
- Label: `happydays`
- Business Name: Happy Days Store
- Includes 7 sample products

## Accessing the Database

### Via phpMyAdmin
1. Open http://localhost/phpmyadmin
2. Select `simplepos` database
3. Browse tables and data

### Via MySQL Command Line
```bash
mysql -u root -p
USE simplepos;
SHOW TABLES;
SELECT * FROM stores;
```

### Via Application
The application automatically:
- Creates tables if they don't exist
- Seeds demo data on first access
- Handles all CRUD operations

## Performance Indexes

The following indexes are created for optimal performance:

- `stores.guid` (UNIQUE)
- `store_labels.store_id + label` (UNIQUE)
- `products.store_id`
- `products.category`
- `products.barcode`
- `orders.store_id`
- `orders.status`
- `orders.created_at`
- `orders.order_id` (UNIQUE)
- `order_items.order_id`
- `order_items.product_id`
- `users.email` (UNIQUE)
- `users.user_id` (UNIQUE)

## Backup & Restore

### Backup
```bash
mysqldump -u root simplepos > simplepos_backup.sql
```

### Restore
```bash
mysql -u root simplepos < simplepos_backup.sql
```

## Migration Notes

- All timestamps use MySQL DATETIME format
- JSON columns store complex data (settings, permissions)
- UUIDs are stored as CHAR(36) for compatibility
- Decimal precision: (10,2) for currency, (5,4) for tax rates
- Foreign keys maintain referential integrity
- Soft deletes via `is_active` flags
