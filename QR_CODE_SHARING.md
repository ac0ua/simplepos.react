# QR Code Terminal Sharing

## Overview
Share your POS terminal with other devices instantly using QR codes. Perfect for adding tablets, phones, or additional terminals without manual URL entry.

## Features

### 📱 QR Code Generation
- **Instant QR codes**: Generate scannable QR codes for any terminal
- **High-quality**: Level H error correction for reliable scanning
- **Downloadable**: Save QR codes as PNG images for printing

### 🔗 Direct Link Sharing
- **Copy to clipboard**: One-click URL copying
- **Full URL display**: See exactly what link you're sharing
- **URL-encoded**: Handles special characters in store labels

### 🎯 Access Points

#### 1. POS Interface (Main Order Page)
- Click **"Share Terminal"** button in the top toolbar
- Located next to "Active Orders" button
- Quick access for cashiers to share with customers

#### 2. Active Orders Page
- Click **"Share Terminal"** button in the header
- Share kitchen/prep terminals with staff
- Easy multi-device setup for order management

## How to Use

### Share a Terminal:
1. Open the POS Interface or Active Orders page
2. Click the **"Share Terminal"** button (QR code icon)
3. Choose your sharing method:
   - **Scan QR Code**: Point camera at QR code
   - **Copy Link**: Click "Copy Link" button
   - **Download**: Save QR code as image for printing

### Access Shared Terminal:
1. **On Mobile/Tablet**:
   - Open camera app
   - Point at QR code
   - Tap the notification to open
   
2. **On Computer**:
   - Copy the link
   - Paste in browser
   - Start using the terminal

## Use Cases

### 🏪 Multi-Terminal Setup
- **Main cashier terminal**: Desktop/laptop
- **Secondary terminals**: Tablets for line-busting
- **Kitchen displays**: Tablets showing Active Orders
- **Customer kiosks**: Self-service ordering stations

### 📋 Staff Training
- Share terminals with trainees
- Multiple staff members can access same store
- Real-time sync across all devices

### 🎨 Print & Display
- Download QR codes
- Print on posters/table tents
- Customers scan to place orders
- Perfect for self-service scenarios

## Technical Details

### URL Format
```
http://localhost:5173/{storeGuid}/{label}/order.html
```

Example:
```
http://localhost:5173/f3c21901-c2f8-4a97-a06f-5aa5bdcca62c/Mr%20Coffee/order.html
```

### QR Code Specifications
- **Format**: SVG (scalable)
- **Size**: 256x256 pixels
- **Error Correction**: Level H (30% recovery)
- **Encoding**: UTF-8
- **Download Format**: PNG

### Components

#### ShareQRCode Component
**Location**: `frontend/src/components/ShareQRCode.jsx`

**Props**:
- `open` (boolean): Dialog visibility
- `onClose` (function): Close handler
- `storeGuid` (string): Store GUID
- `label` (string): Store label

**Features**:
- QR code generation with `qrcode.react`
- URL copying to clipboard
- QR code download as PNG
- Responsive Material-UI dialog

### Dependencies
```json
{
  "qrcode.react": "^3.1.0"
}
```

## Security Notes

### ⚠️ Important
- **GUID-based authentication**: No password required
- **Anyone with the link can access the terminal**
- **Share links carefully**: Only with trusted staff/customers
- **Production deployment**: Use HTTPS for secure transmission

### Best Practices
1. **Rotate GUIDs periodically** for sensitive environments
2. **Use different labels** for different terminal types
3. **Monitor access logs** if available
4. **Limit QR code distribution** to authorized personnel

## Troubleshooting

### QR Code Won't Scan
- Ensure good lighting
- Hold camera steady
- Try different camera apps
- Increase QR code size if printed

### Link Not Working
- Check if backend server is running (port 5000)
- Verify frontend server is running (port 5173)
- Confirm GUID and label are correct
- Check network connectivity

### Multiple Devices Not Syncing
- Verify WebSocket connection (check browser console)
- Ensure all devices are on same network
- Restart backend server if needed
- Clear browser cache and reload

## Future Enhancements

- [ ] Add expiring QR codes for temporary access
- [ ] Role-based QR codes (cashier vs kitchen vs customer)
- [ ] QR code customization (colors, logos)
- [ ] Analytics on QR code scans
- [ ] Bulk QR code generation for multiple terminals
- [ ] Email/SMS QR code delivery

---

**Status**: ✅ Implemented
**Version**: 1.0
**Last Updated**: November 11, 2025
