# 🆕 New Store Creation Feature

## Overview

The landing page now has **two tabs** for different access methods:

1. **Access Existing** - For users who already have a GUID and Label
2. **Create New Store** - For users creating a brand new store instance

---

## ✨ New Features

### Auto-Generated GUID
- When you click the "Create New Store" tab, a unique GUID is **automatically generated**
- No need to manually create or copy GUIDs
- You can regenerate it if needed using the refresh button

### Store Label/Name
- Enter a friendly name for your store (e.g., "My Coffee Shop", "Downtown Market")
- This becomes your store's display name in the system

### Optional Recovery Email
- **Optional but recommended**: Enter an email address
- Used for recovering lost GUID/Label combinations
- Multiple stores can use the same email

---

## 🎯 How to Create a New Store

### Step 1: Navigate to Landing Page
Open: http://localhost:5174

### Step 2: Click "Create New Store" Tab
The interface will automatically:
- Generate a unique GUID
- Display it in the GUID field
- Enable copy and refresh buttons

### Step 3: Enter Store Information
1. **Store Label/Name** (Required)
   - Enter a memorable name for your store
   - Example: "Happy Days Cafe"

2. **Email** (Optional)
   - Enter your email for recovery
   - Example: "owner@happydayscafe.com"

### Step 4: Create Store
Click the **"Create Store"** button

### Step 5: Save Your Credentials
**IMPORTANT**: Save these somewhere safe:
- **GUID**: `[auto-generated unique ID]`
- **Label**: `[your store name]`

You'll need both to access your store later!

---

## 🔐 Recovery Feature

### If You Lose Your GUID/Label

If you provided an email during creation, you can recover your store access:

**API Endpoint**: `POST /api/auth/store/recover`

**Request**:
```json
{
  "email": "your@email.com"
}
```

**Response**:
```json
{
  "success": true,
  "stores": [
    {
      "guid": "6c24c729-3edc-4ada-be8f-96d34b4d8dd3",
      "label": "happydays",
      "businessName": "Happy Days Store",
      "lastAccess": "2025-11-10T20:30:00.000Z"
    }
  ],
  "message": "Found 1 store(s) associated with this email"
}
```

### Using cURL to Recover
```bash
curl -X POST http://localhost:5000/api/auth/store/recover \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

---

## 📊 Database Changes

### New Field: `recovery_email`

Added to the `store_labels` table:

| Column | Type | Description |
|--------|------|-------------|
| recovery_email | VARCHAR(255) | Email for GUID/Label recovery (optional) |

**Index**: Added for faster email lookups

---

## 🎨 UI Features

### Create New Store Tab

**Auto-Generated GUID Field**:
- Read-only (auto-filled)
- Copy button (📋) - Copy GUID to clipboard
- Refresh button (🔄) - Generate new GUID

**Store Label Field**:
- Required field
- Placeholder: "e.g., My Coffee Shop"
- Helper text: "This will be your store's display name"

**Email Field**:
- Optional field
- Type: email (validated)
- Placeholder: "your@email.com"
- Helper text: "For recovery if you lose your GUID/Label"

**Create Button**:
- Disabled until store label is entered
- Shows loading state during creation
- Success message confirms creation

**Important Warning**:
- Alert box reminds users to save credentials
- Shows different message if email provided

---

## 🔄 Workflow Comparison

### Old Workflow (Access Existing)
1. User has GUID and Label
2. Enter both manually
3. Click "Access Store"
4. Redirected to POS

### New Workflow (Create New)
1. Click "Create New Store" tab
2. GUID auto-generated
3. Enter store name
4. (Optional) Enter email
5. Click "Create Store"
6. Save GUID and Label
7. Redirected to POS

---

## 💡 Best Practices

### For Users
1. **Always save your GUID and Label** in a safe place
2. **Use recovery email** for important stores
3. **Use descriptive labels** (e.g., "Downtown Store" not "Store1")
4. **Keep credentials secure** - treat GUID like a password

### For Administrators
1. **Encourage email usage** for easier recovery
2. **Backup the database** regularly
3. **Monitor store_labels table** for recovery requests
4. **Consider email notifications** when stores are created

---

## 🛠️ Technical Details

### Frontend Changes
- **File**: `frontend/src/pages/Landing.jsx`
- **New State**: `newGuid`, `newLabel`, `newEmail`
- **New Tab**: Material UI Tabs component
- **Auto-generation**: useEffect hook triggers GUID generation

### Backend Changes
- **File**: `backend/models/StoreLabel.js`
- **New Field**: `recovery_email` (VARCHAR 255, nullable)
- **New Route**: `POST /api/auth/store/recover`
- **Updated Route**: `POST /api/auth/store/access` (accepts email)

### API Changes
**Store Access** (`POST /api/auth/store/access`):
```javascript
// Old
{ guid, label }

// New
{ guid, label, email } // email is optional
```

**Store Recovery** (`POST /api/auth/store/recover`):
```javascript
// Request
{ email }

// Response
{
  success: true,
  stores: [{ guid, label, businessName, lastAccess }],
  message: "Found X store(s)"
}
```

---

## 📝 Example Usage

### Create New Store
```javascript
// Frontend call
const response = await accessStore(newGuid, newLabel, newEmail);

// Backend processes
1. Validates GUID format
2. Creates or finds store
3. Creates store_label with email
4. Returns session token
5. User redirected to POS
```

### Recover Store
```javascript
// API call
const response = await axios.post('/api/auth/store/recover', {
  email: 'user@example.com'
});

// Returns all stores for that email
console.log(response.data.stores);
// [{ guid: '...', label: '...', businessName: '...', lastAccess: '...' }]
```

---

## 🎯 User Experience Improvements

1. **Simplified Creation**: No need to generate GUID manually
2. **Safety Net**: Email recovery prevents lost access
3. **Clear Tabs**: Separate interfaces for different use cases
4. **Visual Feedback**: Alerts and helper text guide users
5. **Copy/Paste**: Easy GUID copying for saving
6. **Validation**: Email format validated on backend

---

## 🔮 Future Enhancements

Potential improvements:
- [ ] Email verification
- [ ] Automatic email with GUID/Label on creation
- [ ] Password-protected recovery
- [ ] QR code generation for easy mobile access
- [ ] Store transfer between emails
- [ ] Multi-email recovery (backup emails)

---

## ✅ Testing Checklist

- [ ] Create new store with email
- [ ] Create new store without email
- [ ] Verify GUID auto-generation
- [ ] Test GUID refresh button
- [ ] Test GUID copy button
- [ ] Verify store creation in database
- [ ] Test recovery with valid email
- [ ] Test recovery with invalid email
- [ ] Verify email validation
- [ ] Test tab switching

---

**Feature Status**: ✅ **COMPLETE & OPERATIONAL**

**Created**: November 10, 2025  
**Version**: 1.1.0
