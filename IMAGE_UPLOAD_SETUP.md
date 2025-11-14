# Image Upload Feature Setup

## Overview
The Menu Manager now supports uploading product images directly from your device. Images are stored on the server and served statically.

## Installation Steps

### 1. Install Required Package
Navigate to the backend directory and install multer:

```bash
cd backend
npm install
```

This will install the `multer` package that was added to `package.json`.

### 2. Restart Backend Server
After installing the package, restart your backend server:

```bash
npm run dev
```

Or if running in production:

```bash
npm start
```

## Features

### Image Upload Options
1. **File Upload**: Click "Choose File" to select an image from your device
2. **URL Input**: Alternatively, paste an image URL in the text field
3. **Image Preview**: See a preview of your image before saving
4. **Remove Image**: Delete button to remove selected image

### File Validation
- **Supported Formats**: JPG, JPEG, PNG, GIF, WebP
- **Maximum Size**: 5MB per image
- **Automatic Validation**: Invalid files are rejected with error messages

### Storage
- Images are stored in: `backend/uploads/products/`
- Filenames are automatically generated with timestamps to prevent conflicts
- Images are served via: `http://localhost:5000/uploads/products/[filename]`

## Usage

### Adding a Product with Image
1. Click "Manage Menu" button in the sidebar
2. Click "Add New Product"
3. Fill in product details
4. Either:
   - Click "Choose File" and select an image from your device
   - Paste an image URL in the "Image URL" field
5. Preview will appear automatically
6. Click "Add Product" to save

### Editing Product Image
1. Click "Edit" on any product card
2. Current image will show in preview
3. Click the red delete button to remove current image
4. Upload new image or enter new URL
5. Click "Update Product" to save changes

## Technical Details

### Backend
- **Route**: `POST /api/products/:storeGuid/upload-image`
- **Middleware**: Multer for multipart/form-data handling
- **Storage**: Disk storage with unique filenames
- **Response**: Returns image URL for database storage

### Frontend
- **Component**: `MenuManager.jsx`
- **File Handling**: FileReader API for preview
- **Upload**: Fetch API with FormData
- **State Management**: React hooks for file and preview state

## Troubleshooting

### Images Not Uploading
1. Check that multer is installed: `npm list multer`
2. Verify uploads directory exists: `backend/uploads/products/`
3. Check file permissions on uploads directory
4. Ensure backend server is running on port 5000

### Images Not Displaying
1. Verify image URL in database starts with `/uploads/products/`
2. Check that Express static middleware is configured
3. Ensure CORS is properly configured for image requests
4. Check browser console for 404 errors

### File Size Errors
- Maximum file size is 5MB
- Compress large images before uploading
- Consider using image optimization tools

## Security Notes

- File type validation prevents non-image uploads
- Unique filenames prevent overwriting existing images
- File size limits prevent disk space abuse
- Consider adding authentication middleware for production use

## Future Enhancements

Potential improvements:
- Image compression/optimization on upload
- Multiple image support per product
- Drag-and-drop upload interface
- Image cropping/editing tools
- Cloud storage integration (AWS S3, Cloudinary)
- Thumbnail generation
