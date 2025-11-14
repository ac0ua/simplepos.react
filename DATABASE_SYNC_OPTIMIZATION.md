# Database Sync Optimization

## Problem
The server was running extensive SQL `ALTER TABLE` queries on every startup, causing slow startup times. This happened because Sequelize was set to `alter: true` mode, which checks and modifies the database schema on every server start.

## Solution Implemented
Changed the database sync behavior to be controlled by an environment variable.

### Configuration

**File: `backend/.env`**
```env
# Set to 'true' to auto-alter database schema on startup (slower startup, useful during development)
# Set to 'false' or omit for faster startup (recommended for production)
DB_AUTO_ALTER=false
```

### Behavior

#### When `DB_AUTO_ALTER=false` (Default - Recommended)
- ✅ **Fast startup** - No schema checks or alterations
- ✅ Tables are created if they don't exist
- ✅ Existing tables are left unchanged
- ✅ Best for production and stable development

**Startup output:**
```
✅ Database synchronized successfully
[INFO] Database tables synchronized
🚀 Server running on port 5000
```

#### When `DB_AUTO_ALTER=true` (Development Mode)
- ⚠️ **Slower startup** - Checks and alters schema on every start
- ✅ Automatically updates table structure when models change
- ✅ Useful when actively developing and changing models
- ⚠️ Can cause issues if multiple developers have different model versions

**Startup output:**
```
Executing (default): ALTER TABLE `stores` CHANGE `guid` `guid` CHAR(36)...
Executing (default): ALTER TABLE `products` CHANGE `name` `name` VARCHAR(255)...
[... many more ALTER TABLE queries ...]
✅ Database synchronized successfully
```

## When to Use Each Mode

### Use `DB_AUTO_ALTER=false` when:
- ✅ Running in production
- ✅ Database schema is stable
- ✅ You want fast server restarts
- ✅ Multiple servers connecting to same database

### Use `DB_AUTO_ALTER=true` when:
- ⚠️ Actively developing and changing model definitions
- ⚠️ Need automatic schema updates during development
- ⚠️ Working alone on a development database

## Manual Schema Updates

If you need to update the schema manually:

### Option 1: Temporarily enable auto-alter
```bash
# In backend/.env
DB_AUTO_ALTER=true
```
Then restart the server once, then set it back to `false`.

### Option 2: Force reset (WARNING: Deletes all data)
```javascript
// In backend/server.js, line 839
await syncDatabase(true); // true = force reset
```

### Option 3: Use migrations (Recommended for production)
Consider implementing Sequelize migrations for controlled schema changes:
```bash
npm install --save-dev sequelize-cli
npx sequelize-cli migration:generate --name add-new-column
```

## Performance Impact

### Before (with auto-alter):
- Startup time: ~3-5 seconds
- 100+ SQL queries executed on startup
- Network overhead checking every column

### After (without auto-alter):
- Startup time: ~0.5-1 second
- Only essential queries executed
- Minimal database overhead

## Current Database Tables
- `stores` - Store information
- `store_labels` - Store access labels
- `products` - Product catalog
- `orders` - Order records
- `order_items` - Order line items
- `users` - User accounts
- `admin_settings` - System settings

## Troubleshooting

### If you get "Column doesn't exist" errors:
1. Set `DB_AUTO_ALTER=true` in `.env`
2. Restart the server once
3. Set `DB_AUTO_ALTER=false` again
4. Restart the server

### If tables don't exist:
The sync will still create tables even with `alter: false`, so new installations work fine.

### If you need to reset everything:
```bash
# Stop the server
# Drop the database
mysql -u root -e "DROP DATABASE simplepos; CREATE DATABASE simplepos;"

# Start the server (tables will be recreated)
node server.js
```
