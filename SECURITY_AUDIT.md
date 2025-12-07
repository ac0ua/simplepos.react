# SimplePOS Security Audit

## Application Structure

### Frontend Pages (React)
| Route | Component | Auth Required | Description |
|-------|-----------|---------------|-------------|
| `/` | Landing.jsx | No | Store access/creation landing page |
| `/health` | HealthStatus.jsx | No | System health check |
| `/admin` | AdminDashboard.jsx | No | **CRITICAL: Admin dashboard** |
| `/login` | Login.jsx | No | User login (Node.js only) |
| `/register` | Register.jsx | No | User registration (Node.js only) |
| `/:storeGuid/:label/order.html` | POSInterface.jsx | Yes (ProtectedRoute) | Main POS interface |
| `/:storeGuid/:label/active-orders` | ActiveOrders.jsx | Yes (ProtectedRoute) | Active orders view |
| `/:storeGuid/:label/order-history` | OrderHistory.jsx | Yes (ProtectedRoute) | Order history |
| `/:storeGuid/:label/theme` | ThemeStudio.jsx | Yes (ProtectedRoute) | Theme customization |
| `/:storeGuid/:label/menu-builder` | MenuBuilder.jsx | Yes (ProtectedRoute) | Menu management |
| `/:storeGuid/:label/inventory` | POSInterface.jsx | Yes (ProtectedRoute) | Inventory management |
| `/kds/:storeGuid/:label` | KDS.jsx | No | Kitchen Display System |
| `/kds/:storeGuid/:label/category/:category` | KDSCategory.jsx | No | KDS by category |
| `/:label/:orderNumber` | OrderTracking.jsx | No | Public order tracking |

### PHP API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/generate-guid.php` | GET | No | Generate new store GUID |
| `/api/auth/store-access.php` | POST | No | Create/access store |
| `/api/auth/verify.php` | GET | Bearer Token | Verify JWT token |
| `/api/auth/recover.php` | POST | No | Recover stores by email |
| `/api/admin/settings.php` | GET/POST | **No** | Admin settings |
| `/api/admin/stats.php` | GET | **No** | Admin statistics |
| `/api/orders/create.php` | POST | No | Create order |
| `/api/orders/get.php` | GET | No | Get orders by storeGuid |
| `/api/orders/get-single.php` | GET | No | Get single order |
| `/api/orders/update-status.php` | PATCH/POST | No | Update order status |
| `/api/orders/process-payment.php` | POST | No | Process payment |
| `/api/orders/stats.php` | GET | No | Order statistics |
| `/api/orders/track.php` | GET | No | Public order tracking |
| `/api/products/get.php` | GET | No | Get products |
| `/api/products/create.php` | POST | No | Create product |
| `/api/products/update.php` | PUT | No | Update product |
| `/api/products/delete.php` | DELETE | No | Delete product |
| `/api/products/search.php` | GET | No | Search products |
| `/api/products/categories.php` | GET | No | Get categories |
| `/api/products/categories-save.php` | POST | No | Save categories |
| `/api/products/update-stock.php` | POST | No | Update stock |
| `/api/products/upload-image.php` | POST | No | Upload image |
| `/api/products/gallery.php` | GET | No | Get gallery images |
| `/api/products/delete-gallery-image.php` | DELETE | No | Delete gallery image |
| `/api/stores/config.php` | GET/PUT | No | Store configuration |
| `/api/stores/theme.php` | GET/POST | No | Store theme |
| `/api/stores/labels.php` | GET | No | Store labels |
| `/api/kds/summary.php` | GET | No | KDS summary |
| `/api/realtime/sse.php` | GET | No | Server-Sent Events |
| `/api/realtime/polling.php` | GET | No | Polling updates |
| `/api/health.php` | GET | No | Health check |

---

## Security Issues Checklist

### CRITICAL ISSUES

- [x] **SEC-001: Hardcoded JWT Secret Key** ✅ FIXED
  - **File**: `php-backend/utils/jwt.php` (line 8)
  - **Issue**: JWT secret is hardcoded as `'simplepos-secret-key-change-in-production'`
  - **Risk**: Anyone can forge valid JWT tokens
  - **Fix**: Moved to environment variable (JWT_SECRET)

- [x] **SEC-002: Admin Endpoints Have No Authentication** ✅ FIXED
  - **Files**: `php-backend/api/admin/settings.php`, `php-backend/api/admin/stats.php`
  - **Issue**: Anyone can read/modify admin settings without authentication
  - **Risk**: Complete system compromise, data manipulation
  - **Fix**: Added Auth::requireAdmin() check with API key/Basic Auth support

- [x] **SEC-003: CORS Allows All Origins** ✅ FIXED
  - **File**: `php-backend/config/cors.php` (line 7)
  - **Issue**: `Access-Control-Allow-Origin: *` allows any website to make requests
  - **Risk**: Cross-site request forgery, data theft
  - **Fix**: Restricted to specific allowed origins, configurable via CORS_ALLOWED_ORIGINS env var

- [ ] **SEC-004: Database Credentials Hardcoded**
  - **File**: `php-backend/config/database.php` (lines 8-11)
  - **Issue**: Default credentials `root` with empty password
  - **Risk**: Database compromise if file is exposed
  - **Fix**: Already uses environment variables if set, but defaults remain for dev

### HIGH PRIORITY ISSUES

- [x] **SEC-005: No Rate Limiting on API Endpoints** ✅ FIXED
  - **Files**: All PHP API endpoints
  - **Issue**: No rate limiting on any endpoint
  - **Risk**: Brute force attacks, DoS attacks
  - **Fix**: Added RateLimit utility, applied to auth, recovery, and upload endpoints

- [ ] **SEC-006: Store Access Without Proper Authorization**
  - **Files**: Most API endpoints
  - **Issue**: Only storeGuid is required to access store data, no session validation
  - **Risk**: Anyone with a GUID can access/modify store data
  - **Fix**: Auth utility created with validateStoreAccess(), needs gradual rollout

- [x] **SEC-007: Product Delete Missing Store Authorization** ✅ FIXED
  - **File**: `php-backend/api/products/delete.php`
  - **Issue**: Only productId required, no storeGuid validation
  - **Risk**: Any user can delete any product from any store
  - **Fix**: Added storeGuid requirement and store ownership validation

- [ ] **SEC-008: KDS Endpoints Have No Authentication**
  - **Files**: `php-backend/api/kds/summary.php`, KDS.jsx, KDSCategory.jsx
  - **Issue**: KDS pages and API use storeId without authentication
  - **Risk**: Anyone can view kitchen orders
  - **Fix**: Consider adding access token for KDS displays

- [x] **SEC-009: Image Upload Path Traversal Risk** ✅ FIXED
  - **File**: `php-backend/api/products/upload-image.php`
  - **Issue**: storeGuid used directly in path without sanitization
  - **Risk**: Path traversal attacks
  - **Fix**: Added UUID validation and path traversal checks

- [x] **SEC-010: Gallery Listing Exposes File System Info** ✅ FIXED
  - **File**: `php-backend/api/products/gallery.php`
  - **Issue**: Uses scandir and exposes file modification times
  - **Risk**: Information disclosure
  - **Fix**: Added UUID validation and path traversal protection

### MEDIUM PRIORITY ISSUES

- [x] **SEC-011: No Input Validation on Email Fields** ✅ FIXED
  - **Files**: `php-backend/api/auth/store-access.php`, `php-backend/api/auth/recover.php`
  - **Issue**: Email format not validated
  - **Risk**: Invalid data storage, potential injection
  - **Fix**: Added filter_var email validation and sanitization

- [ ] **SEC-012: No CSRF Protection**
  - **Files**: All POST/PUT/DELETE endpoints
  - **Issue**: No CSRF tokens implemented
  - **Risk**: Cross-site request forgery attacks
  - **Fix**: Consider implementing CSRF tokens for state-changing operations

- [ ] **SEC-013: Session Token Stored in localStorage**
  - **File**: `frontend/src/store/useStore.js`
  - **Issue**: JWT stored in localStorage via zustand persist
  - **Risk**: XSS attacks can steal tokens
  - **Fix**: Consider httpOnly cookies for sensitive data (requires backend changes)

- [ ] **SEC-014: No Password Hashing (Node.js backend)**
  - **Files**: Login.jsx, Register.jsx (if used)
  - **Issue**: Password handling not visible but needs verification
  - **Risk**: Password exposure
  - **Fix**: Ensure bcrypt or similar is used (Node.js backend only)

- [x] **SEC-015: Order Tracking Exposes Order Details Publicly** ✅ FIXED
  - **File**: `php-backend/api/orders/track.php`
  - **Issue**: Anyone with label and order number can see full order details
  - **Risk**: Privacy violation
  - **Fix**: Limited to public-safe info (order name, status, items, no prices/payment)

- [x] **SEC-016: No Content Security Policy Headers** ✅ FIXED
  - **Files**: All PHP endpoints
  - **Issue**: No CSP headers set
  - **Risk**: XSS attacks, clickjacking
  - **Fix**: Added CSP, X-Frame-Options, X-Content-Type-Options, etc. in cors.php

- [ ] **SEC-017: Error Messages May Leak Information**
  - **Files**: All PHP endpoints
  - **Issue**: Generic error messages but stack traces logged
  - **Risk**: Information disclosure in logs
  - **Fix**: Current implementation is acceptable (generic responses, detailed logs)

### LOW PRIORITY ISSUES

- [ ] **SEC-018: No Request Size Limits**
  - **Files**: All POST endpoints
  - **Issue**: No explicit request body size limits
  - **Risk**: Memory exhaustion attacks
  - **Fix**: Add request size validation

- [ ] **SEC-019: SQL Queries Use Dynamic Table Creation**
  - **Files**: `categories.php`, `categories-save.php`, `theme.php`
  - **Issue**: CREATE TABLE IF NOT EXISTS in request handlers
  - **Risk**: Performance issues, potential race conditions
  - **Fix**: Move to migration scripts

- [ ] **SEC-020: No Audit Logging**
  - **Files**: All endpoints
  - **Issue**: No audit trail for sensitive operations
  - **Risk**: Cannot track malicious activity
  - **Fix**: Implement audit logging

---

## Fix Implementation Plan

### Phase 1: Critical Fixes (Immediate)
1. SEC-001: Move JWT secret to environment variable
2. SEC-002: Add admin authentication
3. SEC-003: Restrict CORS origins
4. SEC-004: Environment-based database config

### Phase 2: High Priority Fixes
5. SEC-005: Add rate limiting
6. SEC-006: Implement session validation on all endpoints
7. SEC-007: Fix product delete authorization
8. SEC-008: Add KDS authentication
9. SEC-009: Sanitize file paths
10. SEC-010: Limit gallery metadata

### Phase 3: Medium Priority Fixes
11. SEC-011: Email validation
12. SEC-012: CSRF protection
13. SEC-013: Secure token storage
14. SEC-015: Limit order tracking exposure
15. SEC-016: Add security headers
16. SEC-017: Secure error handling

### Phase 4: Low Priority Fixes
17. SEC-018: Request size limits
18. SEC-019: Move DDL to migrations
19. SEC-020: Audit logging

---

## Files Requiring Changes

| File | Issues |
|------|--------|
| `php-backend/utils/jwt.php` | SEC-001 |
| `php-backend/config/cors.php` | SEC-003, SEC-016 |
| `php-backend/config/database.php` | SEC-004 |
| `php-backend/api/admin/settings.php` | SEC-002, SEC-005 |
| `php-backend/api/admin/stats.php` | SEC-002, SEC-005 |
| `php-backend/api/products/delete.php` | SEC-007 |
| `php-backend/api/products/upload-image.php` | SEC-009 |
| `php-backend/api/products/gallery.php` | SEC-010 |
| `php-backend/api/auth/store-access.php` | SEC-011 |
| `php-backend/api/auth/recover.php` | SEC-011 |
| `php-backend/api/orders/track.php` | SEC-015 |
| `php-backend/api/kds/summary.php` | SEC-008 |
| All API endpoints | SEC-005, SEC-006, SEC-012, SEC-016, SEC-017, SEC-018 |
