import React, { useState, useEffect } from 'react';
import { API_URL, IS_PHP_BACKEND } from '../config/api';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Image as ImageIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useStoreContext } from '../contexts/StoreContext';
import useStore from '../store/useStore';

const MenuManager = ({ open, onClose }) => {
  const { products, productsLoading, refreshProducts, categories: storeCategories } = useStoreContext();
  const storeGuid = useStore((state) => state.storeGuid);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'beverages',
    stock: '',
    image: '',
    color: '#f5f5f5',
    description: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [galleryImages, setGalleryImages] = useState({ storeImages: [], defaultImages: [] });
  const [galleryTab, setGalleryTab] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [gallerySearchQuery, setGallerySearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(20); // Show 20 images initially

  const defaultCategories = [
    { id: 'beverages', name: 'Beverages', color: '#0ea5e9' },
    { id: 'snacks', name: 'Snacks', color: '#f97316' },
    { id: 'automotive', name: 'Automotive', color: '#6b7280' },
    { id: 'frozen', name: 'Frozen', color: '#22c55e' },
    { id: 'fuel', name: 'Fuel', color: '#eab308' }
  ];

  const categories = (storeCategories && storeCategories.length
    ? storeCategories.filter((cat) => cat.id !== 'all')
    : defaultCategories
  );

  const getCategoryForProduct = (product) => {
    const key = (product.category || '').toLowerCase();
    return categories.find((cat) =>
      (cat.id && cat.id.toLowerCase() === key) ||
      (cat.name && cat.name.toLowerCase() === key)
    );
  };

  const colorOptions = [
    { name: 'Light Gray', value: '#f5f5f5' },
    { name: 'Light Blue', value: '#e3f2fd' },
    { name: 'Light Green', value: '#e8f5e9' },
    { name: 'Light Yellow', value: '#fffde7' },
    { name: 'Light Pink', value: '#fce4ec' },
    { name: 'Light Orange', value: '#fff3e0' },
    { name: 'Light Purple', value: '#f3e5f5' }
  ];

  // Filter products by search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeTab === 0 || product.category.toLowerCase() === categories[activeTab - 1]?.id;
    return matchesSearch && matchesCategory;
  });

  // Filter gallery images by search
  const filteredGalleryImages = {
    storeImages: galleryImages.storeImages?.filter(img => 
      img.filename.toLowerCase().includes(gallerySearchQuery.toLowerCase())
    ) || [],
    defaultImages: galleryImages.defaultImages?.filter(img => 
      img.filename.toLowerCase().includes(gallerySearchQuery.toLowerCase())
    ) || []
  };

  // Get current gallery images with display limit
  const currentGalleryImages = galleryTab === 0 
    ? filteredGalleryImages.storeImages.slice(0, displayLimit)
    : filteredGalleryImages.defaultImages.slice(0, displayLimit);

  const hasMoreImages = galleryTab === 0
    ? filteredGalleryImages.storeImages.length > displayLimit
    : filteredGalleryImages.defaultImages.length > displayLimit;

  // Reset pagination when search or tab changes
  useEffect(() => {
    setDisplayLimit(20);
  }, [gallerySearchQuery, galleryTab]);

  // Load gallery images
  const loadGallery = async () => {
    try {
      setLoadingGallery(true);
      const response = await fetch(`${API_URL}/products/gallery.php?storeGuid=${encodeURIComponent(storeGuid)}`);
      if (!response.ok) throw new Error('Failed to load gallery');
      const data = await response.json();
      setGalleryImages(data);
    } catch (error) {
      console.error('Load gallery error:', error);
      toast.error('Failed to load gallery');
    } finally {
      setLoadingGallery(false);
    }
  };

  // Select image from gallery
  const handleSelectFromGallery = (imageUrl) => {
    setFormData({ ...formData, image: imageUrl });
    setImagePreview(imageUrl);
    setImageFile(null);
    setShowGallery(false);
    toast.success('Image selected from gallery');
  };

  // Delete image from gallery
  const handleDeleteGalleryImage = async (filename) => {
    if (!confirm('Delete this image from your gallery?')) return;
    
    try {
      const response = await fetch(`${API_URL}/products/delete-gallery-image.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeGuid, filename })
      });
      
      if (!response.ok) throw new Error('Failed to delete image');
      
      toast.success('Image deleted from gallery');
      loadGallery(); // Reload gallery
    } catch (error) {
      console.error('Delete gallery image error:', error);
      toast.error('Failed to delete image');
    }
  };

  // Handle add new product
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      price: '',
      category: categories[0]?.id || 'beverages',
      stock: '',
      image: '',
      color: '#f5f5f5',
      description: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setShowGallery(false);
    setDisplayLimit(20); // Reset pagination
    setGallerySearchQuery(''); // Clear search
    setEditDialogOpen(true);
    loadGallery(); // Load gallery when opening dialog
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category.toLowerCase(),
      stock: product.stock || '',
      image: product.image || '',
      color: product.color || '#f5f5f5',
      description: product.description || ''
    });
    setImageFile(null);
    setImagePreview(product.image || null);
    setShowGallery(false);
    setDisplayLimit(20); // Reset pagination
    setGallerySearchQuery(''); // Clear search
    setEditDialogOpen(true);
    loadGallery(); // Load gallery when opening dialog
  };

  // Handle delete product
  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  // Handle image file selection
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to server
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('storeGuid', storeGuid);
    
    try {
      setUploadingImage(true);
      const response = await fetch(`${API_URL}/products/upload-image.php`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.error || 'Failed to upload image';
        console.error('Upload error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      return data.imageUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image: '' });
  };

  // Save product (add or update)
  const handleSaveProduct = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    try {
      let imageUrl = formData.image;
      
      // Upload image if a new file was selected
      if (imageFile) {
        try {
          imageUrl = await uploadImage(imageFile);
          toast.success('Image uploaded successfully');
          // Refresh gallery to show new image
          loadGallery();
        } catch (error) {
          const errorMsg = error.message || 'Failed to upload image';
          toast.error(errorMsg);
          console.error('Upload failed:', error);
          return;
        }
      }
      
      // If no image provided, use placeholder
      if (!imageUrl) {
        imageUrl = `https://via.placeholder.com/300x200?text=${encodeURIComponent(formData.name)}`;
      }

      const productData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        stock: formData.stock ? parseInt(formData.stock) : null,
        image: imageUrl,
        color: formData.color,
        description: formData.description.trim()
      };

      // Build payload and URL based on backend type
      const payload = {
        ...productData,
        storeGuid
      };

      let url;
      let method;

      if (IS_PHP_BACKEND) {
        if (selectedProduct) {
          // PHP: update existing product
          url = `${API_URL}/products/update.php`;
          method = 'PUT';
          payload.productId = selectedProduct.id;
        } else {
          // PHP: create new product
          url = `${API_URL}/products/create.php`;
          method = 'POST';
        }
      } else {
        // Node backend: use RESTful /products/:storeGuid routes
        if (!storeGuid) {
          toast.error('Store GUID is missing. Please reload your store and try again.');
          return;
        }
        url = selectedProduct
          ? `${API_URL}/products/${storeGuid}/${selectedProduct.id}`
          : `${API_URL}/products/${storeGuid}`;
        method = selectedProduct ? 'PUT' : 'POST';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save product');
      }

      toast.success(selectedProduct ? 'Product updated successfully' : 'Product added successfully');
      setEditDialogOpen(false);
      refreshProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  // Confirm delete product
  const confirmDeleteProduct = async () => {
    try {
      let url;
      let options;

      if (IS_PHP_BACKEND) {
        // PHP: DELETE /products/delete.php with JSON body
        url = `${API_URL}/products/delete.php`;
        options = {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: selectedProduct.id })
        };
      } else {
        // Node: DELETE /products/:productId
        url = `${API_URL}/products/${selectedProduct.id}`;
        options = { method: 'DELETE' };
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      toast.success('Product deleted successfully');
      setDeleteDialogOpen(false);
      refreshProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  return (
    <>
      {/* Main Menu Manager Dialog */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#2d2d2d', borderBottom: '1px solid #3d3d3d' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CategoryIcon sx={{ color: '#ff9800', fontSize: 32 }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">Menu Manager</Typography>
                <Typography variant="caption" sx={{ color: '#999' }}>
                  Add, edit, or remove products from your menu
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Toolbar */}
            <Box sx={{ p: 2, bgcolor: '#0d1117', borderBottom: '1px solid #3d3d3d' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#999' }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#1a1a1a',
                        color: 'white',
                        '& fieldset': { borderColor: '#3d3d3d' },
                        '&:hover fieldset': { borderColor: '#4d4d4d' },
                        '&.Mui-focused fieldset': { borderColor: '#ff9800' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddProduct}
                    sx={{
                      bgcolor: '#ff9800',
                      color: '#000',
                      fontWeight: 'bold',
                      '&:hover': { bgcolor: '#f57c00' }
                    }}
                  >
                    Add New Product
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Category Tabs */}
            <Box sx={{ borderBottom: '1px solid #3d3d3d', bgcolor: '#0d1117' }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  '& .MuiTab-root': {
                    color: '#999',
                    '&.Mui-selected': { color: '#ff9800' }
                  },
                  '& .MuiTabs-indicator': { bgcolor: '#ff9800' }
                }}
              >
                <Tab label="All Products" />
                {categories.map((cat) => (
                  <Tab key={cat.id} label={cat.name} />
                ))}
              </Tabs>
            </Box>

            {/* Products Grid */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, bgcolor: '#0d1117' }}>
              {productsLoading ? (
                <Typography sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                  Loading products...
                </Typography>
              ) : filteredProducts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CategoryIcon sx={{ fontSize: 64, color: '#3d3d3d', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#999', mb: 1 }}>
                    No products found
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {searchQuery ? 'Try a different search term' : 'Add your first product to get started'}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {filteredProducts.map((product) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                      <Card
                        sx={{
                          bgcolor: '#1a1a1a',
                          border: '1px solid #3d3d3d',
                          '&:hover': {
                            borderColor: '#ff9800',
                            boxShadow: '0 0 10px rgba(255, 152, 0, 0.3)'
                          }
                        }}
                      >
                        <CardMedia
                          component="img"
                          height="160"
                          image={product.image}
                          alt={product.name}
                          sx={{ 
                            objectFit: 'cover',
                            bgcolor: product.color || '#f5f5f5'
                          }}
                        />
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'white', mb: 1 }}>
                            {product.name}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6" sx={{ color: '#ff9800' }}>
                              ${parseFloat(product.price).toFixed(2)}
                            </Typography>
                            {(() => {
                              const catDef = getCategoryForProduct(product);
                              const chipColor = catDef?.color || '#3d3d3d';
                              return (
                            <Chip
                              label={product.category}
                              size="small"
                              sx={{
                                bgcolor: chipColor,
                                color: '#000',
                                fontSize: '0.7rem',
                                borderRadius: 999,
                                px: 1.5,
                                border: '1px solid rgba(0,0,0,0.25)'
                              }}
                            />
                              );
                            })()}
                          </Box>
                          {product.stock && (
                            <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 1 }}>
                              Stock: {product.stock}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => handleEditProduct(product)}
                              sx={{
                                flex: 1,
                                borderColor: '#4d4d4d',
                                color: 'white',
                                '&:hover': { borderColor: '#ff9800', color: '#ff9800' }
                              }}
                            >
                              Edit
                            </Button>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteProduct(product)}
                              sx={{
                                color: '#f44336',
                                border: '1px solid #4d4d4d',
                                '&:hover': { borderColor: '#f44336', bgcolor: 'rgba(244, 67, 54, 0.1)' }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Product Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#2d2d2d', borderBottom: '1px solid #3d3d3d' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedProduct ? <EditIcon sx={{ color: '#ff9800' }} /> : <AddIcon sx={{ color: '#ff9800' }} />}
            <Typography variant="h6" fontWeight="bold">
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#0d1117' }}>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#1a1a1a',
                    color: 'white',
                    '& fieldset': { borderColor: '#3d3d3d' },
                    '&:hover fieldset': { borderColor: '#4d4d4d' },
                    '&.Mui-focused fieldset': { borderColor: '#ff9800' }
                  },
                  '& .MuiInputLabel-root': { color: '#999' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#ff9800' }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#1a1a1a',
                    color: 'white',
                    '& fieldset': { borderColor: '#3d3d3d' },
                    '&:hover fieldset': { borderColor: '#4d4d4d' },
                    '&.Mui-focused fieldset': { borderColor: '#ff9800' }
                  },
                  '& .MuiInputLabel-root': { color: '#999' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#ff9800' }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#999', '&.Mui-focused': { color: '#ff9800' } }}>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                  sx={{
                    bgcolor: '#1a1a1a',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3d3d3d' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4d4d4d' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ff9800' }
                  }}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stock (Optional)"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#1a1a1a',
                    color: 'white',
                    '& fieldset': { borderColor: '#3d3d3d' },
                    '&:hover fieldset': { borderColor: '#4d4d4d' },
                    '&.Mui-focused fieldset': { borderColor: '#ff9800' }
                  },
                  '& .MuiInputLabel-root': { color: '#999' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#ff9800' }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#999', '&.Mui-focused': { color: '#ff9800' } }}>Color</InputLabel>
                <Select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  label="Color"
                  sx={{
                    bgcolor: '#1a1a1a',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3d3d3d' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4d4d4d' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ff9800' }
                  }}
                >
                  {colorOptions.map((color) => (
                    <MenuItem key={color.value} value={color.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 20, height: 20, bgcolor: color.value, border: '1px solid #999', borderRadius: 1 }} />
                        {color.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Image Upload Section */}
            <Grid item xs={12}>
              <Box sx={{ 
                p: 3, 
                border: '2px dashed #3d3d3d', 
                borderRadius: 2, 
                bgcolor: '#0d1117',
                textAlign: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ color: 'white', mb: 2 }}>
                  Product Image
                </Typography>
                
                {imagePreview ? (
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Preview"
                      sx={{
                        width: '100%',
                        maxWidth: 400,
                        maxHeight: 250,
                        objectFit: 'cover',
                        borderRadius: 2,
                        border: '1px solid #3d3d3d'
                      }}
                    />
                    <IconButton
                      onClick={handleRemoveImage}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(244, 67, 54, 0.9)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.9)' }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Box>
                    <ImageIcon sx={{ fontSize: 64, color: '#3d3d3d', mb: 2 }} />
                    <Typography variant="body2" sx={{ color: '#999', mb: 2 }}>
                      Upload an image or enter a URL below
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<ImageIcon />}
                    disabled={uploadingImage}
                    sx={{
                      borderColor: '#4d4d4d',
                      color: 'white',
                      '&:hover': { borderColor: '#ff9800', color: '#ff9800' }
                    }}
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload New'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CategoryIcon />}
                    onClick={() => setShowGallery(!showGallery)}
                    sx={{
                      borderColor: '#4d4d4d',
                      color: 'white',
                      '&:hover': { borderColor: '#ff9800', color: '#ff9800' }
                    }}
                  >
                    {showGallery ? 'Hide Gallery' : 'Browse Gallery'}
                  </Button>
                </Box>
                
                <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 2 }}>
                  Supported: JPG, PNG, GIF (Max 5MB)
                </Typography>
              </Box>
            </Grid>

            {/* Gallery Browser */}
            {showGallery && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid #3d3d3d', 
                  borderRadius: 2, 
                  bgcolor: '#0d1117'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: 'white' }}>
                      Image Gallery
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        placeholder="Search by filename..."
                        value={gallerySearchQuery}
                        onChange={(e) => setGallerySearchQuery(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: '#999', fontSize: 20 }} />
                            </InputAdornment>
                          ),
                          endAdornment: gallerySearchQuery && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => setGallerySearchQuery('')}
                                sx={{ color: '#999' }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          width: 250,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#1a1a1a',
                            color: 'white',
                            '& fieldset': { borderColor: '#3d3d3d' },
                            '&:hover fieldset': { borderColor: '#4d4d4d' },
                            '&.Mui-focused fieldset': { borderColor: '#ff9800' }
                          }
                        }}
                      />
                      <IconButton
                        onClick={loadGallery}
                        disabled={loadingGallery}
                        sx={{
                          color: '#999',
                          '&:hover': { color: '#ff9800' }
                        }}
                        title="Refresh gallery"
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Tabs
                    value={galleryTab}
                    onChange={(e, newValue) => setGalleryTab(newValue)}
                    sx={{
                      mb: 1,
                      '& .MuiTab-root': {
                        color: '#999',
                        '&.Mui-selected': { color: '#ff9800' }
                      },
                      '& .MuiTabs-indicator': { bgcolor: '#ff9800' }
                    }}
                  >
                    <Tab label={`My Images (${filteredGalleryImages.storeImages?.length || 0})`} />
                    <Tab label={`Default Gallery (${filteredGalleryImages.defaultImages?.length || 0})`} />
                  </Tabs>
                  
                  {/* Gallery Info */}
                  {(filteredGalleryImages.storeImages?.length > 0 || filteredGalleryImages.defaultImages?.length > 0) && (
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 2 }}>
                      Showing {currentGalleryImages.length} of {galleryTab === 0 
                        ? filteredGalleryImages.storeImages.length 
                        : filteredGalleryImages.defaultImages.length} images
                      {gallerySearchQuery && ` matching "${gallerySearchQuery}"`}
                    </Typography>
                  )}
                  
                  {loadingGallery ? (
                    <Typography sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                      Loading gallery...
                    </Typography>
                  ) : (
                    <Box sx={{ 
                      maxHeight: 400, 
                      overflowY: 'auto',
                      '&::-webkit-scrollbar': { width: '8px' },
                      '&::-webkit-scrollbar-track': { bgcolor: '#2d2d2d' },
                      '&::-webkit-scrollbar-thumb': { bgcolor: '#4d4d4d', borderRadius: 1 }
                    }}>
                      <Grid container spacing={1}>
                        {galleryTab === 0 ? (
                          // Store-specific images
                          currentGalleryImages?.length > 0 ? (
                            currentGalleryImages.map((img) => (
                              <Grid item xs={4} sm={3} key={img.filename}>
                                <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                                  <Box
                                    component="img"
                                    src={img.url}
                                    alt={img.filename}
                                    onClick={() => handleSelectFromGallery(img.url)}
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      borderRadius: 1,
                                      border: formData.image === img.url ? '3px solid #ff9800' : '1px solid #3d3d3d',
                                      cursor: 'pointer',
                                      '&:hover': { 
                                        borderColor: '#ff9800',
                                        opacity: 0.8
                                      }
                                    }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteGalleryImage(img.filename);
                                    }}
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      right: 4,
                                      bgcolor: 'rgba(244, 67, 54, 0.9)',
                                      color: 'white',
                                      padding: '4px',
                                      '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.9)' }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Grid>
                            ))
                          ) : (
                            <Grid item xs={12}>
                              <Typography sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                                {gallerySearchQuery 
                                  ? `No images found matching "${gallerySearchQuery}"`
                                  : 'No images in your gallery yet. Upload images to build your collection!'}
                              </Typography>
                            </Grid>
                          )
                        ) : (
                          // Default gallery images
                          currentGalleryImages?.length > 0 ? (
                            currentGalleryImages.map((img) => (
                              <Grid item xs={4} sm={3} key={img.filename}>
                                <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                                  <Box
                                    component="img"
                                    src={img.url}
                                    alt={img.filename}
                                    onClick={() => handleSelectFromGallery(img.url)}
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      borderRadius: 1,
                                      border: formData.image === img.url ? '3px solid #ff9800' : '1px solid #3d3d3d',
                                      cursor: 'pointer',
                                      '&:hover': { 
                                        borderColor: '#ff9800',
                                        opacity: 0.8
                                      }
                                    }}
                                  />
                                  <Chip
                                    label="Default"
                                    size="small"
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      right: 4,
                                      bgcolor: 'rgba(33, 150, 243, 0.9)',
                                      color: 'white',
                                      fontSize: '0.65rem',
                                      height: 20
                                    }}
                                  />
                                </Box>
                              </Grid>
                            ))
                          ) : (
                            <Grid item xs={12}>
                              <Typography sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                                {gallerySearchQuery 
                                  ? `No default images found matching "${gallerySearchQuery}"`
                                  : 'No default images available yet. Add images to backend/uploads/gallery/default/'}
                              </Typography>
                            </Grid>
                          )
                        )}
                      </Grid>
                      
                      {/* Load More Button */}
                      {hasMoreImages && (
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                          <Button
                            variant="outlined"
                            onClick={() => setDisplayLimit(prev => prev + 20)}
                            sx={{
                              borderColor: '#4d4d4d',
                              color: 'white',
                              '&:hover': { borderColor: '#ff9800', color: '#ff9800' }
                            }}
                          >
                            Load More ({galleryTab === 0 
                              ? filteredGalleryImages.storeImages.length - displayLimit
                              : filteredGalleryImages.defaultImages.length - displayLimit
                            } remaining)
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Grid>
            )}

            {/* Image URL Alternative */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: '#999', mb: 1, display: 'block', textAlign: 'center' }}>
                — OR —
              </Typography>
              <TextField
                fullWidth
                label="Image URL (Optional)"
                value={formData.image}
                onChange={(e) => {
                  setFormData({ ...formData, image: e.target.value });
                  if (e.target.value) {
                    setImagePreview(e.target.value);
                    setImageFile(null);
                  }
                }}
                placeholder="https://example.com/image.jpg"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ImageIcon sx={{ color: '#999' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#1a1a1a',
                    color: 'white',
                    '& fieldset': { borderColor: '#3d3d3d' },
                    '&:hover fieldset': { borderColor: '#4d4d4d' },
                    '&.Mui-focused fieldset': { borderColor: '#ff9800' }
                  },
                  '& .MuiInputLabel-root': { color: '#999' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#ff9800' }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#1a1a1a',
                    color: 'white',
                    '& fieldset': { borderColor: '#3d3d3d' },
                    '&:hover fieldset': { borderColor: '#4d4d4d' },
                    '&.Mui-focused fieldset': { borderColor: '#ff9800' }
                  },
                  '& .MuiInputLabel-root': { color: '#999' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#ff9800' }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ bgcolor: '#2d2d2d', borderTop: '1px solid #3d3d3d', p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#999' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveProduct}
            sx={{
              bgcolor: '#ff9800',
              color: '#000',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#f57c00' }
            }}
          >
            {selectedProduct ? 'Update Product' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#2d2d2d', borderBottom: '1px solid #3d3d3d' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon sx={{ color: '#f44336' }} />
            <Typography variant="h6" fontWeight="bold">Delete Product</Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#0d1117' }}>
          <Alert severity="warning" sx={{ mb: 2, bgcolor: '#2d1a1a', color: 'white', border: '1px solid #4d3d3d' }}>
            This action cannot be undone!
          </Alert>
          <Typography sx={{ color: '#999' }}>
            Are you sure you want to delete <strong style={{ color: 'white' }}>{selectedProduct?.name}</strong>?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ bgcolor: '#2d2d2d', borderTop: '1px solid #3d3d3d', p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#999' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<DeleteIcon />}
            onClick={confirmDeleteProduct}
            sx={{
              bgcolor: '#f44336',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#d32f2f' }
            }}
          >
            Delete Product
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MenuManager;
