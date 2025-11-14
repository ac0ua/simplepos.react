# Siloed Image Gallery System

## Overview
The POS system now features a **siloed image gallery** where each store has its own private image collection, plus access to a shared default gallery that all stores can use.

## Architecture

### Directory Structure
```
uploads/
  gallery/
    default/                    ← Shared gallery (all stores)
      image1.jpg
      image2.png
    {store-guid-1}/            ← Store 1's private gallery
      product-123.jpg
      product-456.png
    {store-guid-2}/            ← Store 2's private gallery
      product-789.jpg
      product-012.png
```

### Privacy Model
- **Store-Specific Images**: Each store's uploads go to `/uploads/gallery/{storeGuid}/`
- **Default Gallery**: Shared images in `/uploads/gallery/default/`
- **Isolation**: Stores cannot see or access other stores' private images
- **Shared Access**: All stores can view and use default gallery images

## Features

### 1. Store-Specific Gallery ("My Images")
- **Private Storage**: Images uploaded by a store are only visible to that store
- **Full Control**: Store can delete their own images
- **Automatic Organization**: Images automatically organized by store GUID
- **Upload & Reuse**: Upload once, use multiple times across products

### 2. Default Gallery
- **Shared Library**: Common images available to all stores
- **Read-Only for Stores**: Stores can use but not delete default images
- **Admin Managed**: Default images should be added manually to `/uploads/gallery/default/`
- **Product Templates**: Perfect for generic product images

### 3. Gallery Browser
- **Tabbed Interface**: Switch between "My Images" and "Default Gallery"
- **Visual Selection**: Click any image to select it for the product
- **Image Count**: Shows number of images in each gallery
- **Delete Option**: Remove images from your private gallery
- **Selected Indicator**: Orange border shows currently selected image

## Usage

### Adding Images to Your Gallery

#### Method 1: Upload During Product Creation
1. Click "Manage Menu" → "Add New Product"
2. Click "Upload New" button
3. Select image file from your device
4. Image is automatically added to your gallery AND used for the product

#### Method 2: Upload Without Product
1. Click "Manage Menu" → "Add New Product"
2. Click "Browse Gallery"
3. Click "Upload New"
4. Image is added to your gallery for future use

### Using Gallery Images
1. In product form, click "Browse Gallery"
2. Switch between "My Images" and "Default Gallery" tabs
3. Click any image to select it
4. Selected image will show orange border
5. Click "Add Product" or "Update Product" to save

### Managing Your Gallery
- **View**: Click "Browse Gallery" to see all your images
- **Delete**: Click red trash icon on any of your images
- **Organize**: Images sorted by upload date (newest first)

## API Endpoints

### Upload Image
```
POST /api/products/:storeGuid/upload-image
Content-Type: multipart/form-data

Response:
{
  "success": true,
  "imageUrl": "/uploads/gallery/{storeGuid}/product-123.jpg",
  "filename": "product-123.jpg",
  "isPrivate": true
}
```

### Get Gallery Images
```
GET /api/products/:storeGuid/gallery

Response:
{
  "storeImages": [
    {
      "filename": "product-123.jpg",
      "url": "/uploads/gallery/{storeGuid}/product-123.jpg",
      "isPrivate": true,
      "uploadedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "defaultImages": [
    {
      "filename": "generic-product.jpg",
      "url": "/uploads/gallery/default/generic-product.jpg",
      "isPrivate": false,
      "uploadedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "totalCount": 2
}
```

### Delete Gallery Image
```
DELETE /api/products/:storeGuid/gallery/:filename

Response:
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## Adding Default Gallery Images

### Manual Method (Recommended)
1. Navigate to `backend/uploads/gallery/default/`
2. Copy your default product images to this directory
3. Images will automatically appear in all stores' "Default Gallery" tab

### Supported Formats
- JPG/JPEG
- PNG
- GIF
- WebP

### Naming Conventions
Use descriptive names for default images:
- `generic-beverage.jpg`
- `generic-snack.png`
- `placeholder-product.jpg`
- `default-automotive.jpg`

## Security & Privacy

### Access Control
- ✅ Stores can only access their own gallery
- ✅ Stores can only delete their own images
- ✅ Store GUID is validated on all operations
- ✅ Path traversal attacks prevented

### File Validation
- ✅ File type validation (images only)
- ✅ File size limit (5MB)
- ✅ Unique filenames prevent conflicts
- ✅ Automatic directory creation

### Best Practices
1. **Regular Cleanup**: Periodically review and delete unused images
2. **Optimize Images**: Compress images before uploading
3. **Descriptive Names**: Use clear names for default gallery images
4. **Backup**: Include uploads directory in backup strategy

## Benefits

### For Store Owners
- **Privacy**: Your product images stay private
- **Reusability**: Upload once, use many times
- **Organization**: All images in one place
- **Quick Access**: Browse and select from gallery

### For System Administrators
- **Scalability**: Each store has isolated storage
- **Maintenance**: Easy to manage per-store images
- **Shared Resources**: Default gallery reduces duplication
- **Clean Structure**: Organized directory hierarchy

## Troubleshooting

### Images Not Showing in Gallery
1. Check that uploads directory exists: `backend/uploads/gallery/`
2. Verify store GUID directory was created
3. Check file permissions on uploads directory
4. Ensure images are valid format (JPG, PNG, GIF, WebP)

### Cannot Delete Images
1. Verify you're trying to delete from "My Images" tab
2. Default gallery images cannot be deleted by stores
3. Check file permissions on store's gallery directory

### Gallery Not Loading
1. Check browser console for errors
2. Verify API endpoint is accessible: `/api/products/{storeGuid}/gallery`
3. Ensure backend server is running
4. Check CORS configuration

## Future Enhancements

Potential improvements:
- **Bulk Upload**: Upload multiple images at once
- **Image Search**: Search gallery by filename or date
- **Image Tags**: Categorize gallery images
- **Usage Tracking**: See which products use which images
- **Image Editing**: Crop/resize images in-browser
- **Cloud Storage**: Integrate with AWS S3 or Cloudinary
- **Admin Panel**: Manage default gallery through UI
- **Image Analytics**: Track most-used images
