# PHP API Endpoints Documentation

Complete mapping of Node.js Express routes to PHP endpoints for the SimplePOS application.

## Base URL
- **Development (Node.js)**: `http://localhost:5000/api`
- **Production (PHP)**: `http://localhost/php-backend/api`

---

## Authentication Endpoints

### Store Access
**Create or access store with GUID**
- **Node.js**: `POST /api/auth/store/access`
- **PHP**: `POST /php-backend/api/auth/store-access.php`
- **Body**: `{ guid, label, email?, businessName?, emailConsent? }`
- **Response**: `{ success, sessionToken, storeGuid, label, businessName, redirectUrl }`

### Generate GUID
**Generate new store GUID**
- **Node.js**: `GET /api/auth/store/generate`
- **PHP**: `GET /php-backend/api/auth/generate-guid.php`
- **Response**: `{ guid }`

### Recover Store
**Recover store access by email**
- **Node.js**: `POST /api/auth/store/recover`
- **PHP**: `POST /php-backend/api/auth/recover.php`
- **Body**: `{ email }`
- **Response**: `{ success, stores[], message }`

### Verify Token
**Verify JWT token**
- **Node.js**: `GET /api/auth/verify`
- **PHP**: `GET /php-backend/api/auth/verify.php`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ valid, user }`

---

## Products Endpoints

### Get Products
**Get all products for a store**
- **Node.js**: `GET /api/products/:storeGuid`
- **PHP**: `GET /php-backend/api/products/get.php?storeGuid={guid}`
- **Response**: `Product[]`

### Search Products
**Search products by name or barcode**
- **Node.js**: `GET /api/products/:storeGuid/search?query=...&category=...`
- **PHP**: `GET /php-backend/api/products/search.php?storeGuid={guid}&query=...&category=...`
- **Response**: `Product[]`

### Create Product
**Add new product**
- **Node.js**: `POST /api/products/:storeGuid`
- **PHP**: `POST /php-backend/api/products/create.php`
- **Body**: `{ storeGuid, name, price, category?, image?, stock?, barcode?, color? }`
- **Response**: `Product`

### Update Product
**Update product details**
- **Node.js**: `PUT /api/products/:storeGuid/:productId`
- **PHP**: `PUT /php-backend/api/products/update.php`
- **Body**: `{ storeGuid, productId, ...updates }`
- **Response**: `Product`

### Delete Product
**Soft delete product**
- **Node.js**: `DELETE /api/products/:productId`
- **PHP**: `DELETE /php-backend/api/products/delete.php`
- **Body**: `{ productId }`
- **Response**: `{ success, message }`

### Upload Image
**Upload product image**
- **Node.js**: `POST /api/products/:storeGuid/upload-image`
- **PHP**: `POST /php-backend/api/products/upload-image.php`
- **Body**: `FormData with 'image' file and 'storeGuid'`
- **Response**: `{ success, imageUrl, filename, isPrivate }`

### Get Categories
**Get product categories**
- **Node.js**: `GET /api/products/:storeGuid/categories`
- **PHP**: `GET /php-backend/api/products/categories.php`
- **Response**: `Category[]`

---

## Orders Endpoints

### Create Order
**Create new order**
- **Node.js**: `POST /api/orders/:storeGuid`
- **PHP**: `POST /php-backend/api/orders/create.php`
- **Body**: `{ storeGuid, items[], subtotal, tax, total, paymentMethod?, orderName?, orderNumber?, kioskNumber?, ... }`
- **Response**: `{ success, order }`

### Get Orders
**Get all orders for a store**
- **Node.js**: `GET /api/orders/:storeGuid?status=...&date=...&limit=...&offset=...`
- **PHP**: `GET /php-backend/api/orders/get.php?storeGuid={guid}&status=...&date=...&limit=...&offset=...`
- **Response**: `{ orders[], total, limit, offset }`

### Get Single Order
**Get order by ID**
- **Node.js**: `GET /api/orders/:storeGuid/:orderId`
- **PHP**: `GET /php-backend/api/orders/get-single.php?storeGuid={guid}&orderId={id}`
- **Response**: `Order with items[]`

### Update Order Status
**Update order status**
- **Node.js**: `PATCH /api/orders/:storeGuid/:orderId/status`
- **PHP**: `PATCH /php-backend/api/orders/update-status.php` (or POST)
- **Body**: `{ storeGuid, orderId, status }`
- **Response**: `{ success, order, message }`

### Process Payment
**Process payment for order**
- **Node.js**: `POST /api/orders/:storeGuid/:orderId/payment`
- **PHP**: `POST /php-backend/api/orders/process-payment.php`
- **Body**: `{ storeGuid, orderId, paymentMethod, amount?, cashGiven?, changeAmount? }`
- **Response**: `{ success, order, message }`

### Track Order
**Public order tracking (QR code)**
- **Node.js**: `GET /api/orders/track/:label/:orderNumber`
- **PHP**: `GET /php-backend/api/orders/track.php?label={label}&orderNumber={number}`
- **Response**: `Order with payment_status`

### Order Statistics
**Get order statistics**
- **Node.js**: `GET /api/orders/:storeGuid/stats`
- **PHP**: `GET /php-backend/api/orders/stats.php?storeGuid={guid}`
- **Response**: `{ totalOrders, todayOrders, todayRevenue, pendingOrders, completedOrders, averageOrderValue }`

---

## Stores Endpoints

### Get Store Labels
**Get store labels by GUID**
- **Node.js**: `GET /api/stores/:storeGuid/labels`
- **PHP**: `GET /php-backend/api/stores/labels.php?storeGuid={guid}`
- **Response**: `{ success, store, labels[] }`

### Store Configuration
**Get or update store configuration**
- **Node.js**: `GET/PUT /api/stores/:storeGuid/config`
- **PHP**: `GET/PUT /php-backend/api/stores/config.php?storeGuid={guid}`
- **Response**: `Configuration object`

---

## Admin Endpoints

### Admin Settings
**Get or update admin settings**
- **Node.js**: `GET/POST /api/admin/settings`
- **PHP**: `GET/POST /php-backend/api/admin/settings.php`
- **Response**: `Settings object`

### Admin Statistics
**Get admin statistics**
- **Node.js**: `GET /api/admin/stats`
- **PHP**: `GET /php-backend/api/admin/stats.php`
- **Response**: `{ totalStores, totalStoreLabels, uniqueEmails }`

---

## KDS (Kitchen Display System) Endpoints

### KDS Summary
**Get aggregated counts by category**
- **Node.js**: `GET /api/kds/:storeId/summary`
- **PHP**: `GET /php-backend/api/kds/summary.php?storeId={id}`
- **Response**: `{ success, storeId, summary[], timestamp }`

---

## Real-time Updates

### WebSocket (Node.js only)
- **URL**: `ws://localhost:5000`
- **Events**: `order-created`, `order-update`, `product-update`, `kds-update`

### Server-Sent Events (PHP)
- **URL**: `GET /php-backend/api/realtime/sse.php?storeGuid={guid}&label={label}`
- **Events**: `order-update`, `heartbeat`, `error`

### Polling (PHP fallback)
- **URL**: `GET /php-backend/api/realtime/polling.php?storeGuid={guid}&lastCheck={timestamp}`
- **Response**: `{ orders[], products[], timestamp }`

---

## Migration Notes

### Key Differences

1. **URL Structure**:
   - Node.js uses REST parameters: `/api/products/:storeGuid`
   - PHP uses query strings: `/api/products/get.php?storeGuid=...`

2. **Real-time Updates**:
   - Node.js uses WebSocket (Socket.IO)
   - PHP uses Server-Sent Events (SSE) or polling

3. **File Structure**:
   - Node.js: Single server.js with route files
   - PHP: Individual endpoint files

4. **CORS**:
   - Node.js: Configured in middleware
   - PHP: Configured in .htaccess and individual files

### Frontend Adaptation Required

The React frontend needs to detect which backend is in use and adjust API calls accordingly. The `api.js` configuration file has been updated to handle both backends automatically.

**Environment Variable**:
```bash
# Use PHP backend
REACT_APP_USE_PHP_BACKEND=true npm run build
```

Or detect automatically based on deployment path.
