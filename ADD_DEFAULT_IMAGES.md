# Adding Default Gallery Images

## Quick Guide

The default gallery allows you to provide a shared collection of product images that all stores can access and use.

## Steps to Add Default Images

### 1. Locate the Default Gallery Directory

Navigate to:
```
c:\xampp\htdocs\simplepos\uploads\gallery\default\
```

If this directory doesn't exist, it will be created automatically when the backend server starts.

### 2. Add Your Images

Simply copy your product images into this directory. For example:

```
uploads/
  gallery/
    default/
      generic-beverage.jpg
      generic-snack.png
      placeholder-coffee.jpg
      default-automotive-oil.jpg
      frozen-food-placeholder.png
      fuel-icon.jpg
```

### 3. Supported Image Formats

- **JPG/JPEG** - Most common, good compression
- **PNG** - Supports transparency
- **GIF** - Animated or static
- **WebP** - Modern format, excellent compression

### 4. Naming Best Practices

Use descriptive, lowercase names with hyphens:

✅ **Good Examples:**
- `generic-beverage.jpg`
- `placeholder-snack.png`
- `default-coffee-cup.jpg`
- `automotive-oil-bottle.png`

❌ **Avoid:**
- `IMG_1234.jpg` (not descriptive)
- `Product Image.png` (spaces)
- `BEVERAGE.JPG` (all caps)

### 5. Image Requirements

- **Max Size:** 5MB per image (recommended: under 500KB)
- **Recommended Dimensions:** 300x300px to 800x800px
- **Aspect Ratio:** Square (1:1) works best for product cards

### 6. Verify Images Appear

1. Open Menu Manager in any store
2. Click "Browse Gallery"
3. Switch to "Default Gallery" tab
4. Your images should appear immediately
5. If not, click the refresh button (🔄) next to the search bar

## Example: Adding Sample Images

### Using File Explorer (Windows)

1. Open File Explorer
2. Navigate to: `c:\xampp\htdocs\simplepos\uploads\gallery\default\`
3. Copy your product images into this folder
4. Done! Images are now available to all stores

### Using Command Line

```bash
# Navigate to default gallery directory
cd c:\xampp\htdocs\simplepos\uploads\gallery\default

# Copy images from another location
copy "C:\Users\YourName\Pictures\product-images\*.jpg" .
```

## Organizing Default Images

### By Category

Consider organizing your default images by product category:

```
default/
  beverage-cola.jpg
  beverage-water.jpg
  beverage-juice.jpg
  snack-chips.jpg
  snack-candy.jpg
  snack-cookies.jpg
  automotive-oil.jpg
  automotive-filter.jpg
  frozen-pizza.jpg
  frozen-icecream.jpg
```

### Generic Placeholders

Create generic placeholders for each category:

```
default/
  placeholder-beverage.png
  placeholder-snack.png
  placeholder-automotive.png
  placeholder-frozen.png
  placeholder-fuel.png
  placeholder-product.png
```

## Tips for Best Results

### 1. Optimize Images Before Adding

Use image optimization tools to reduce file size:
- **TinyPNG** (https://tinypng.com/)
- **ImageOptim** (Mac)
- **RIOT** (Windows)

### 2. Use Consistent Styling

- Same background color/style
- Consistent lighting
- Similar framing/composition
- Uniform dimensions

### 3. Create a Backup

Keep a backup of your default gallery images:

```bash
# Create a backup
xcopy "c:\xampp\htdocs\simplepos\uploads\gallery\default" "c:\backup\default-gallery\" /E /I
```

### 4. Update Regularly

- Add new products as they become available
- Remove outdated images
- Replace low-quality images with better ones

## Troubleshooting

### Images Not Showing

**Problem:** Added images but they don't appear in the gallery

**Solutions:**
1. Check file format (must be JPG, PNG, GIF, or WebP)
2. Verify file is in correct directory: `uploads/gallery/default/`
3. Click refresh button (🔄) in gallery
4. Check browser console for errors
5. Restart backend server

### Images Too Large

**Problem:** Images take long to load or upload fails

**Solutions:**
1. Compress images before adding
2. Resize to max 800x800px
3. Use JPG format with 80% quality
4. Keep under 500KB per image

### Wrong Directory

**Problem:** Put images in wrong location

**Correct Location:**
```
✅ c:\xampp\htdocs\simplepos\uploads\gallery\default\
```

**NOT:**
```
❌ c:\xampp\htdocs\simplepos\backend\uploads\gallery\default\
❌ c:\xampp\htdocs\simplepos\uploads\products\
❌ c:\xampp\htdocs\simplepos\frontend\public\
```

## Advanced: Bulk Import

### PowerShell Script

Create a script to import multiple images:

```powershell
# import-default-images.ps1
$sourceDir = "C:\path\to\your\images"
$destDir = "c:\xampp\htdocs\simplepos\uploads\gallery\default"

# Copy all image files
Get-ChildItem -Path $sourceDir -Include *.jpg,*.jpeg,*.png,*.gif,*.webp -Recurse | 
    Copy-Item -Destination $destDir -Force

Write-Host "Images imported successfully!"
```

Run with:
```powershell
.\import-default-images.ps1
```

## Maintenance

### Regular Cleanup

Periodically review and clean up default gallery:

1. Remove unused images
2. Replace low-quality images
3. Update outdated product images
4. Consolidate duplicate images

### Monitoring Usage

Track which default images are most used:
- Check product database for image URLs
- Remove images that are never used
- Add more of popular image types

## Security Note

Default gallery images are **publicly accessible** to all stores. Do not add:
- Sensitive information
- Copyrighted images without permission
- Personal photos
- Confidential product information

## Summary

1. **Add images** to: `c:\xampp\htdocs\simplepos\uploads\gallery\default\`
2. **Use descriptive names**: `generic-beverage.jpg`
3. **Optimize size**: Under 500KB recommended
4. **Refresh gallery**: Click 🔄 button to see new images
5. **All stores can access**: Images appear in "Default Gallery" tab

That's it! Your default gallery images are now available to all stores in the POS system.
