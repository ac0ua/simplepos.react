# SimplePOS - PHP Migration Package

**Complete React POS System for Apache + PHP + MySQL**

This package contains everything you need to deploy SimplePOS on a traditional AMP (Apache, MySQL, PHP) stack.

---

## 🚀 Quick Start (5 Minutes)

### 1. Run Database Setup
```bash
# Import database schema
mysql -u root -p < database-setup.sql
```

### 2. Configure Backend
Edit `php-backend/config/database.php`:
```php
private $host = 'localhost';
private $db_name = 'simplepos';
private $username = 'root';
private $password = 'your_password';
```

### 3. Deploy Files
```bash
# Copy PHP backend
xcopy /E /I php-backend C:\xampp\htdocs\php-backend

# Build and copy frontend
cd frontend
set REACT_APP_USE_PHP_BACKEND=true && npm run build
xcopy /E /I dist C:\xampp\htdocs\simplepos
```

### 4. Start Apache
- Start XAMPP Control Panel
- Start Apache and MySQL services
- Open: http://localhost/simplepos

**That's it!** 🎉

---

## 📁 Package Contents

```
simplepos.react/
├── php-backend/                    # Complete PHP REST API
│   ├── api/                        # 30+ endpoint files
│   ├── config/                     # Database & CORS
│   ├── utils/                      # JWT, UUID, Response
│   └── .htaccess                   # Apache config
│
├── frontend/                       # React application
│   ├── src/
│   └── .htaccess                   # React Router config
│
├── database-setup.sql              # ⭐ One-click database setup
├── DEPLOYMENT_GUIDE_PHP.md         # ⭐ Complete deployment guide
├── PHP_API_ENDPOINTS.md            # ⭐ Full API reference
├── MIGRATION_SUMMARY.md            # ⭐ Migration overview
└── README_PHP_MIGRATION.md         # ⭐ This file
```

---

## 📚 Documentation Quick Links

### Start Here
1. **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - Overview of what was created
2. **[DEPLOYMENT_GUIDE_PHP.md](DEPLOYMENT_GUIDE_PHP.md)** - Step-by-step deployment

### Reference
3. **[PHP_API_ENDPOINTS.md](PHP_API_ENDPOINTS.md)** - Complete API documentation
4. **[database-setup.sql](database-setup.sql)** - Database schema

---

## ✨ Key Features

### Backend (PHP)
- ✅ 30+ REST API endpoints
- ✅ JWT authentication
- ✅ PDO prepared statements (SQL injection safe)
- ✅ File upload handling
- ✅ Server-Sent Events (real-time updates)
- ✅ CORS enabled
- ✅ Comprehensive error handling

### Frontend (React)
- ✅ Auto-detects PHP vs Node.js backend
- ✅ Modern Material-UI interface
- ✅ React Router for SPA navigation
- ✅ Real-time updates (SSE/polling)
- ✅ Responsive design
- ✅ Production-optimized build

### Database (MySQL)
- ✅ 7 normalized tables
- ✅ Foreign key constraints
- ✅ Proper indexing
- ✅ Transaction support
- ✅ UTF-8 encoding

---

## 🎯 What This Solves

### Original Problem
Your React application uses:
- Node.js + Express backend
- Socket.IO for real-time updates
- In-memory data storage
- Development server setup

### New Solution
Now deployable on traditional hosting with:
- Apache web server
- PHP backend API
- MySQL persistent storage
- Server-Sent Events for real-time
- Production-ready configuration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   Browser (React App)               │
│   http://localhost/simplepos        │
└──────────┬──────────────────────────┘
           │ HTTP/AJAX Requests
           ▼
┌─────────────────────────────────────┐
│   Apache Web Server                 │
│   - Serves React static files       │
│   - Handles .htaccess routing       │
└──────────┬──────────────────────────┘
           │
           ├─────────────┬─────────────┐
           ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Static   │  │ PHP API  │  │ Uploads  │
    │ Files    │  │ Backend  │  │ Gallery  │
    └──────────┘  └────┬─────┘  └──────────┘
                       │
                       ▼
                ┌─────────────┐
                │   MySQL     │
                │  Database   │
                └─────────────┘
```

---

## 🔧 System Requirements

### Minimum
- **Apache**: 2.4+
- **PHP**: 7.4+
- **MySQL**: 5.7+
- **Disk**: 100MB
- **RAM**: 512MB

### Recommended
- **Apache**: 2.4.x (latest)
- **PHP**: 8.0+ with OPcache
- **MySQL**: 8.0+
- **Disk**: 1GB (for uploads)
- **RAM**: 2GB+

### Required PHP Extensions
- `pdo_mysql` (database)
- `mbstring` (string handling)
- `json` (API responses)
- `gd` or `imagick` (image processing)

---

## ⚡ Performance Optimizations

### Included
- ✅ Gzip compression
- ✅ Static asset caching
- ✅ Database indexing
- ✅ Prepared statements
- ✅ Connection pooling
- ✅ Minified frontend build

### Recommended (Production)
- Enable OPcache (PHP)
- Use Redis for sessions
- Enable HTTP/2
- Add CDN for static assets
- Enable query caching (MySQL)

---

## 🔐 Security Features

### Implemented
- ✅ SQL injection protection (PDO)
- ✅ XSS protection headers
- ✅ CSRF tokens (JWT)
- ✅ Password hashing (bcrypt)
- ✅ Secure file uploads
- ✅ Input validation
- ✅ CORS configuration
- ✅ Directory listing disabled

### Production Checklist
- [ ] Change default JWT secret
- [ ] Enable HTTPS/SSL
- [ ] Restrict database user privileges
- [ ] Set strong passwords
- [ ] Enable firewall rules
- [ ] Configure rate limiting
- [ ] Set up regular backups
- [ ] Enable error logging (disable display)

---

## 🧪 Testing Your Deployment

### 1. Backend API Test
```bash
# Generate GUID
curl http://localhost/php-backend/api/auth/generate-guid.php

# Expected: {"guid":"xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx"}
```

### 2. Frontend Test
Open: `http://localhost/simplepos`
- Should see landing page
- Click "Create New Store"
- Enter a label
- Should redirect to POS interface

### 3. Database Test
```sql
USE simplepos;
SELECT COUNT(*) FROM stores;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM orders;
```

### 4. End-to-End Test
1. Create new store
2. Add products to inventory
3. Create an order
4. Process payment
5. View order history
6. Check database for saved data

---

## 📊 API Endpoints Summary

### Authentication (4)
- Store access/creation
- GUID generation
- Store recovery
- Token verification

### Products (7)
- List, search, create, update, delete
- Image upload
- Categories

### Orders (7)
- Create, retrieve, update, track
- Payment processing
- Statistics

### Stores (2)
- Labels, configuration

### Admin (2)
- Settings, statistics

### KDS (1)
- Kitchen display summary

### Real-time (2)
- Server-Sent Events
- Polling fallback

**Total: 25 core endpoints + utilities**

---

## 🗄️ Database Schema

**7 Tables:**
1. `stores` - Store information
2. `store_labels` - Multi-terminal access
3. `products` - Inventory management
4. `orders` - Order records
5. `order_items` - Order line items
6. `users` - Registered users (optional)
7. `admin_settings` - System configuration

**Relationships:**
- Store → Labels (1:many)
- Store → Products (1:many)
- Store → Orders (1:many)
- Order → Items (1:many)
- Product → Items (1:many)

---

## 🚦 Deployment Checklist

### Pre-Deployment
- [ ] Apache & MySQL installed
- [ ] PHP 7.4+ verified
- [ ] Required extensions enabled
- [ ] Database created

### Backend Setup
- [ ] PHP files copied to `/php-backend`
- [ ] Database credentials configured
- [ ] Upload directory created with permissions
- [ ] `.htaccess` configured
- [ ] Test API endpoints

### Frontend Setup
- [ ] React app built with PHP flag
- [ ] Static files copied to web root
- [ ] `.htaccess` configured for routing
- [ ] Test SPA navigation

### Verification
- [ ] Create test store
- [ ] Add products
- [ ] Create order
- [ ] Verify database entries
- [ ] Test on mobile device
- [ ] Check real-time updates

---

## 🆘 Common Issues & Solutions

### "Cannot connect to database"
→ Check credentials in `php-backend/config/database.php`

### "404 on API calls"
→ Enable `mod_rewrite`: `sudo a2enmod rewrite`

### "React routes 404 on refresh"
→ Verify `.htaccess` in frontend directory

### "CORS errors"
→ Enable `mod_headers`: `sudo a2enmod headers`

### "Image upload fails"
→ Check directory permissions: `chmod 775 uploads/`

### "Real-time not working"
→ SSE requires persistent connections; use polling fallback

**Full troubleshooting**: See DEPLOYMENT_GUIDE_PHP.md

---

## 📈 Next Steps

### Immediate
1. Follow DEPLOYMENT_GUIDE_PHP.md
2. Run database-setup.sql
3. Configure backend credentials
4. Build and deploy frontend
5. Test all features

### Optional Enhancements
- Set up SSL certificate
- Configure backup automation
- Add email notifications
- Implement analytics
- Create staging environment
- Add monitoring tools

### Production Hardening
- Restrict database access
- Enable rate limiting
- Set up logging
- Configure firewalls
- Regular security updates
- Performance optimization

---

## 💡 Development vs Production

### Development (Node.js)
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run dev
```

### Production (PHP)
```bash
# One-time build
cd frontend
set REACT_APP_USE_PHP_BACKEND=true && npm run build

# Deploy to Apache
# No server process needed - Apache serves everything
```

---

## 🎓 Learning Resources

### Included Documentation
- Complete deployment guide
- API endpoint reference
- Database schema
- Migration summary

### External Resources
- [Apache Docs](https://httpd.apache.org/docs/)
- [PHP PDO Manual](https://www.php.net/manual/en/book.pdo.php)
- [MySQL Reference](https://dev.mysql.com/doc/)
- [React Deployment](https://create-react-app.dev/docs/deployment/)

---

## 📞 Support

### Self-Service
1. Check DEPLOYMENT_GUIDE_PHP.md troubleshooting section
2. Verify PHP_API_ENDPOINTS.md for API usage
3. Review Apache error logs
4. Enable PHP error reporting (dev only)

### Log Locations
- **Apache**: `C:\xampp\apache\logs\error.log`
- **PHP**: Check `php.ini` error_log setting
- **MySQL**: `C:\xampp\mysql\data\*.err`

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Frontend loads without errors
2. ✅ Can create and access stores
3. ✅ Products CRUD works
4. ✅ Orders can be created
5. ✅ Database stores all data
6. ✅ Real-time updates function
7. ✅ Image uploads work
8. ✅ No console errors

---

## 🎉 You're Ready!

Everything you need is in this package:

1. **Read**: MIGRATION_SUMMARY.md (overview)
2. **Follow**: DEPLOYMENT_GUIDE_PHP.md (step-by-step)
3. **Reference**: PHP_API_ENDPOINTS.md (API docs)
4. **Run**: database-setup.sql (database)

**Time to deploy**: ~15-30 minutes for first-time setup

Good luck with your deployment! 🚀

---

**Package Version**: 1.0.0  
**Last Updated**: 2024  
**License**: MIT  
**Status**: Production Ready ✅
