# Products Not Showing - Issue Resolved

## Root Cause
The products weren't showing because:
1. **Backend server was not running** - The backend on port 5000 was not started
2. **Wrong store GUID** - You were trying to access a store that doesn't exist in the database

## What Was Fixed
1. ✅ Installed missing `multer` dependency in backend
2. ✅ Started the backend server on port 5000
3. ✅ Identified the correct store GUID in the database

## Current Store Information
- **Store GUID**: `f3c21901-c2f8-4a97-a06f-5aa5bdcca62c`
- **Store Label**: `Mr Coffee`
- **Business Name**: `Mr Coffee`

## Correct URLs to Access Your Store

### Desktop/Mobile Access:
```
http://localhost:5173/f3c21901-c2f8-4a97-a06f-5aa5bdcca62c/Mr Coffee/order.html
```

### For Network Access (from other devices on same network):
Replace `localhost` with your computer's IP address:
```
http://YOUR_IP_ADDRESS:5173/f3c21901-c2f8-4a97-a06f-5aa5bdcca62c/Mr Coffee/order.html
```

To find your IP address, run:
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

## Products Available
Your store has 7 default products:
1. Candy Bar - $1.55
2. Chips - $2.50
3. Ice Cream - $3.50
4. Motor Oil - $6.09
5. Sample Product - $3.87
6. Soda - $1.75
7. Water Bottle - $1.00

## How to Start the Servers

### Backend (Port 5000):
```bash
cd c:\xampp\htdocs\simplepos\backend
node server.js
```

### Frontend (Port 5173):
```bash
cd c:\xampp\htdocs\simplepos\frontend
npm run dev
```

## Creating a New Store
If you want to create a new store with a different GUID:
1. Go to: `http://localhost:5173/`
2. The landing page will allow you to generate a new GUID
3. Access the new store URL: `http://localhost:5173/{NEW_GUID}/{YOUR_LABEL}/order.html`

## Troubleshooting

### If products still don't show:
1. Check backend is running: `http://localhost:5000/health`
2. Check frontend is running: `http://localhost:5173/`
3. Check MySQL is running (XAMPP Control Panel)
4. Check browser console for errors (F12)

### If you get "Store not found":
- Make sure you're using the correct GUID from the database
- The store is automatically created when you first access it via the frontend

### To check what stores exist in database:
```bash
cd c:\xampp\mysql\bin
mysql -u root -e "USE simplepos; SELECT guid, business_name FROM stores;"
```
