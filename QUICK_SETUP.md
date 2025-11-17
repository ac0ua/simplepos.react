# SimplePOS - Quick Setup Guide for Windows/XAMPP

You're seeing the directory listing because the React app hasn't been built yet!

## 🚀 3-Minute Setup

### Prerequisites Checklist
- ✅ XAMPP installed
- ✅ Apache started in XAMPP Control Panel
- ✅ MySQL started in XAMPP Control Panel
- ✅ Node.js installed

---

## Step 1: Fix PowerShell (if needed)

If you get "scripts disabled" error, run PowerShell as **Administrator**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Step 2: Setup Database

**Option A: Using Batch Script (Easiest)**
1. Double-click: `setup-database.bat`
2. Enter MySQL password (default: just press Enter)
3. Done!

**Option B: Using MySQL Command**
```cmd
C:\xampp\mysql\bin\mysql.exe -u root -p < database-setup.sql
```

---

## Step 3: Build & Deploy

**Option A: Using Batch Script (Easiest)**
1. Double-click: `build-and-deploy.bat`
2. Wait for it to complete (~2-3 minutes)
3. Done!

**Option B: Manual Commands**
```cmd
cd frontend
npm install
npm run build
cd ..
xcopy /E /I /Y "frontend\dist\*" "C:\xampp\htdocs\simplepos.react\"
```

---

## Step 4: Access Application

Open your browser: **http://localhost/simplepos.react**



---

## 🎯 What You Should See

✅ **Correct**: SimplePOS landing page with "Create New Store" button  
❌ **Wrong**: Directory listing (means you haven't built/deployed yet)

---

## 🔧 Troubleshooting

### "Directory listing" instead of app
→ Run `build-and-deploy.bat` - you haven't deployed the built React app yet

### "Cannot connect to MySQL"
→ Start MySQL in XAMPP Control Panel

### "npm: scripts disabled"
→ Run PowerShell as Admin and execute: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`

### "404 Not Found" on API calls
→ Make sure Apache is running and `C:\xampp\htdocs\simplepos.react\php-backend` exists

### React routes 404 on refresh
→ Make sure `.htaccess` exists in `C:\xampp\htdocs\simplepos.react\`

---

## 📂 Final Directory Structure

After setup, you should have:

```
C:\xampp\htdocs\
├── simplepos.react\              ← SimplePOS app + PHP backend
│   ├── index.html
│   ├── assets\
│   ├── php-backend\
│   └── .htaccess
```

---

## ✅ Success Checklist

After running the scripts, verify:

1. ✅ `C:\xampp\htdocs\simplepos.react\index.html` exists
2. ✅ `C:\xampp\htdocs\simplepos.react\php-backend\` exists with API files
3. ✅ Apache shows "Running" in XAMPP Control Panel
4. ✅ MySQL shows "Running" in XAMPP Control Panel
5. ✅ Database `simplepos` exists (check phpMyAdmin)
6. ✅ http://localhost/simplepos.react shows the app (not directory listing)
7. ✅ http://localhost/simplepos.react/php-backend/api/auth/generate-guid.php returns JSON

---

## 🆘 Still Having Issues?

### Check Apache Error Log
`C:\xampp\apache\logs\error.log`

### Check if files were copied
- Frontend: `C:\xampp\htdocs\simplepos.react\index.html` should exist
- Backend: `C:\xampp\htdocs\simplepos.react\php-backend\api\auth\` should exist

### Test PHP Backend
Open: http://localhost/simplepos.react/php-backend/api/auth/generate-guid.php  
Should return: `{"guid":"xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx"}`

### Test Database
1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Check if `simplepos` database exists
3. Check if tables exist: `stores`, `products`, `orders`, etc.

---

## 🎉 Next Steps

Once you see the SimplePOS landing page:

1. Click "Create New Store"
2. Enter a store label (e.g., "mystore")
3. Explore the POS interface
4. Add products
5. Create test orders

**Congratulations! You're ready to use SimplePOS!** 🚀

---

## 📞 Quick Reference

**Frontend URL**: http://localhost/simplepos.react  
**Backend URL**: http://localhost/simplepos.react/php-backend/api  
**phpMyAdmin**: http://localhost/phpmyadmin  
**Documentation**: See `README_PHP_MIGRATION.md`
