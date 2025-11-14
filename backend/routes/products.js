const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Product, Store } = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure base uploads directory exists
const uploadsBaseDir = path.join(__dirname, '../uploads');
const defaultGalleryDir = path.join(uploadsBaseDir, 'gallery', 'default');

if (!fs.existsSync(uploadsBaseDir)) {
  fs.mkdirSync(uploadsBaseDir, { recursive: true });
}
if (!fs.existsSync(defaultGalleryDir)) {
  fs.mkdirSync(defaultGalleryDir, { recursive: true });
}

// Log paths for debugging
console.log('📁 Uploads base directory:', uploadsBaseDir);
console.log('📁 Default gallery directory:', defaultGalleryDir);
console.log('✅ Default gallery exists:', fs.existsSync(defaultGalleryDir));
if (fs.existsSync(defaultGalleryDir)) {
  const files = fs.readdirSync(defaultGalleryDir);
  console.log(`📸 Found ${files.length} files in default gallery`);
}

// Configure multer for image uploads (store-specific)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create store-specific directory
    const storeGuid = req.params.storeGuid;
    const storeDir = path.join(uploadsBaseDir, 'gallery', storeGuid);
    
    if (!fs.existsSync(storeDir)) {
      fs.mkdirSync(storeDir, { recursive: true });
    }
    
    cb(null, storeDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Default products based on the image (for seeding new stores)
const defaultProducts = [
  {
    name: 'Candy Bar',
    price: 1.55,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop',
    stock: 100,
    barcode: '1234567890',
    color: '#FFB6C1'
  },
  {
    name: 'Chips',
    price: 2.50,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop',
    stock: 75,
    barcode: '2345678901',
    color: '#FFD700'
  },
  {
    name: 'Ice Cream',
    price: 3.50,
    category: 'Frozen',
    image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop',
    stock: 50,
    barcode: '3456789012',
    color: '#87CEEB'
  },
  {
    name: 'Motor Oil',
    price: 6.09,
    category: 'Automotive',
    image: 'https://images.unsplash.com/photo-1621188988909-fbef0a88dc04?w=300&h=300&fit=crop',
    stock: 30,
    barcode: '4567890123',
    color: '#708090'
  },
  {
    name: 'Sample Product',
    price: 3.87,
    category: 'All Products',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    stock: 200,
    barcode: '5678901234',
    color: '#FFD700'
  },
  {
    name: 'Soda',
    price: 1.75,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?w=300&h=300&fit=crop',
    stock: 150,
    barcode: '6789012345',
    color: '#98D8C8'
  },
  {
    name: 'Water Bottle',
    price: 1.00,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=300&h=300&fit=crop',
    stock: 200,
    barcode: '7890123456',
    color: '#E0F2F1'
  }
];

// Upload product image to store-specific gallery
router.post('/:storeGuid/upload-image', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds 5MB limit' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(500).json({ error: err.message || 'Failed to upload image' });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }
      
      const { storeGuid } = req.params;
      
      // Generate URL for the uploaded image (store-specific)
      const imageUrl = `/uploads/gallery/${storeGuid}/${req.file.filename}`;
      
      console.log('✅ Image uploaded successfully:', imageUrl);
      
      res.json({ 
        success: true, 
        imageUrl,
        filename: req.file.filename,
        isPrivate: true
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });
});

// Get store-specific gallery images
router.get('/:storeGuid/gallery', async (req, res) => {
  try {
    const { storeGuid } = req.params;
    const storeDir = path.join(uploadsBaseDir, 'gallery', storeGuid);
    
    // Get store-specific images
    let storeImages = [];
    if (fs.existsSync(storeDir)) {
      const files = fs.readdirSync(storeDir);
      storeImages = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(file => ({
          filename: file,
          url: `/uploads/gallery/${storeGuid}/${file}`,
          isPrivate: true,
          uploadedAt: fs.statSync(path.join(storeDir, file)).mtime
        }))
        .sort((a, b) => b.uploadedAt - a.uploadedAt);
    }
    
    // Get default gallery images (shared across all stores)
    let defaultImages = [];
    if (fs.existsSync(defaultGalleryDir)) {
      const files = fs.readdirSync(defaultGalleryDir);
      defaultImages = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(file => ({
          filename: file,
          url: `/uploads/gallery/default/${file}`,
          isPrivate: false,
          uploadedAt: fs.statSync(path.join(defaultGalleryDir, file)).mtime
        }))
        .sort((a, b) => b.uploadedAt - a.uploadedAt);
    }
    
    res.json({
      storeImages,
      defaultImages,
      totalCount: storeImages.length + defaultImages.length
    });
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({ error: 'Failed to get gallery images' });
  }
});

// Delete image from store gallery
router.delete('/:storeGuid/gallery/:filename', async (req, res) => {
  try {
    const { storeGuid, filename } = req.params;
    const filePath = path.join(uploadsBaseDir, 'gallery', storeGuid, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Delete the file
    fs.unlinkSync(filePath);
    
    res.json({ 
      success: true, 
      message: 'Image deleted successfully' 
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Get all products for a store
router.get('/:storeGuid', async (req, res) => {
  try {
    const { storeGuid } = req.params;
    
    const store = await Store.findOne({ where: { guid: storeGuid } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    let products = await Product.findAll({
      where: { store_id: store.id, is_active: true },
      order: [['name', 'ASC']]
    });
    
    // If no products, seed with defaults
    if (products.length === 0) {
      const productsToCreate = defaultProducts.map(p => ({
        ...p,
        store_id: store.id
      }));
      
      products = await Product.bulkCreate(productsToCreate);
    }
    
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search products
router.get('/:storeGuid/search', async (req, res) => {
  try {
    const { storeGuid } = req.params;
    const { query, category } = req.query;
    
    const store = await Store.findOne({ where: { guid: storeGuid } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const where = { store_id: store.id, is_active: true };
    
    if (query) {
      where[Op.or] = [
        { name: { [Op.like]: `%${query}%` } },
        { barcode: { [Op.like]: `%${query}%` } }
      ];
    }
    
    if (category && category !== 'All Products') {
      where.category = category;
    }
    
    const products = await Product.findAll({ where });
    res.json(products);
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new product
router.post('/:storeGuid', async (req, res) => {
  try {
    const { storeGuid } = req.params;
    const productData = req.body;
    
    const store = await Store.findOne({ where: { guid: storeGuid } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const newProduct = await Product.create({
      ...productData,
      store_id: store.id
    });
    
    res.json(newProduct);
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product
router.put('/:storeGuid/:productId', async (req, res) => {
  try {
    const { storeGuid, productId } = req.params;
    const updates = req.body;
    
    const store = await Store.findOne({ where: { guid: storeGuid } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const product = await Product.findOne({
      where: { id: productId, store_id: store.id }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await product.update(updates);
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update stock
router.patch('/:storeGuid/:productId/stock', async (req, res) => {
  try {
    const { storeGuid, productId } = req.params;
    const { quantity, operation } = req.body;
    
    const store = await Store.findOne({ where: { guid: storeGuid } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const product = await Product.findOne({
      where: { id: productId, store_id: store.id }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    switch (operation) {
      case 'add':
        product.stock += quantity;
        break;
      case 'subtract':
        product.stock = Math.max(0, product.stock - quantity);
        break;
      case 'set':
        product.stock = quantity;
        break;
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }
    
    await product.save();
    res.json({ productId, newStock: product.stock });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete product (soft delete)
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Soft delete by setting is_active to false
    await product.update({ is_active: false });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get categories
router.get('/:storeGuid/categories', (req, res) => {
  const categories = [
    { id: 'all', name: 'All Products', icon: 'apps' },
    { id: 'beverages', name: 'Beverages', icon: 'local_drink' },
    { id: 'snacks', name: 'Snacks', icon: 'fastfood' },
    { id: 'automotive', name: 'Automotive', icon: 'directions_car' },
    { id: 'frozen', name: 'Frozen', icon: 'ac_unit' },
    { id: 'fuel', name: 'Fuel', icon: 'local_gas_station' }
  ];
  
  res.json(categories);
});

module.exports = router;
