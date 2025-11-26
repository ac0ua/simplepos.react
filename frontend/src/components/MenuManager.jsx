import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Drawer
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
  Refresh as RefreshIcon,
  CameraAlt as CameraIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useStoreContext } from '../contexts/StoreContext';
import useStore from '../store/useStore';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const MenuManager = ({ open, onClose, inventoryMode = false }) => {
  const { products, productsLoading, refreshProducts, categories: storeCategories } = useStoreContext();
  const storeGuid = useStore((state) => state.storeGuid);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inventoryUpc, setInventoryUpc] = useState('');
  const [inventoryQuantity, setInventoryQuantity] = useState(1);
  const [inventoryOperation, setInventoryOperation] = useState('add');
  const [updatingInventory, setUpdatingInventory] = useState(false);
  const [scanEvents, setScanEvents] = useState([]);
  const [lastScanStatus, setLastScanStatus] = useState(null);
  const LOW_STOCK_THRESHOLD = 10;
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'beverages',
    stock: '',
    image: '',
    color: '#f5f5f5',
    description: '',
    upcs: []
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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    console.log('[MenuManager] Mounted', { open, storeGuid });
  }, []);

  useEffect(() => {
    console.log('[MenuManager] Open state changed', { open });
  }, [open]);

  useEffect(() => {
    console.log('[MenuManager] Context values updated', {
      storeGuid,
      productsCount: products.length,
      productsLoading,
      storeCategories,
    });
  }, [storeGuid, products, productsLoading, storeCategories]);

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

  useEffect(() => {
    console.log('[MenuManager] Resolved categories', {
      storeCategories,
      categories,
    });
  }, [storeCategories, categories]);
  const startScanner = () => {
    console.log('[MenuManager][scanner] startScanner clicked');
    setScannerError('');
    setScannerOpen(true);
  };

  const closeScanner = () => {
    setScannerOpen(false);
  };

  useEffect(() => {
    console.log('[MenuManager][scanner] effect fired', { scannerOpen });

    if (!scannerOpen) {
      if (scannerRef.current) {
        console.log('[MenuManager][scanner] scannerOpen=false, clearing existing scanner');
        scannerRef.current.clear().catch((error) => {
          console.error('[MenuManager][scanner] clear error', error);
        });
        scannerRef.current = null;
      }
      return;
    }

    if (typeof window === 'undefined') {
      console.log('[MenuManager][scanner] window is undefined, skipping init');
      return;
    }

    const elementId = 'inventory-scanner-element';
    let cancelled = false;
    let retryTimeoutId = null;

    function initScanner() {
      if (cancelled) {
        console.log('[MenuManager][scanner] initScanner called after cancel, skipping');
        return;
      }

      const targetElement = document.getElementById(elementId);
      console.log('[MenuManager][scanner] element lookup', {
        elementId,
        found: !!targetElement,
      });

      if (!targetElement) {
        console.warn('[MenuManager][scanner] target element not found yet, scheduling retry');
        if (!retryTimeoutId) {
          retryTimeoutId = window.setTimeout(() => {
            console.log('[MenuManager][scanner] retrying element lookup');
            initScanner();
          }, 150);
        }
        return;
      }

      try {
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
        ];

        const config = { fps: 10, qrbox: 250, formatsToSupport };
        const verbose = false;

        const onScanSuccess = (decodedText, decodedResult) => {
          const code = String(decodedText || '').trim();
          console.log('[MenuManager][scanner] onScanSuccess', {
            decodedText,
            code,
            decodedResult,
          });
          if (!code) {
            return;
          }
          setInventoryUpc(code);
          handleUpcScanSubmit(code);
        };

        const onScanFailure = (error) => {
          if (error && typeof error !== 'string') {
            console.error('[MenuManager][scanner] scan error', error);
          }
        };

        console.log('[MenuManager][scanner] initializing Html5QrcodeScanner', { config });
        const scanner = new Html5QrcodeScanner(elementId, config, verbose);
        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
        console.log('[MenuManager][scanner] Html5QrcodeScanner initialized');
      } catch (error) {
        console.error('[MenuManager][scanner] init error', error);
        setScannerError('Unable to start camera scanner. Check browser permissions or try manual entry.');
      }
    }

    initScanner();

    return () => {
      cancelled = true;
      if (retryTimeoutId) {
        window.clearTimeout(retryTimeoutId);
        retryTimeoutId = null;
      }
      if (scannerRef.current) {
        console.log('[MenuManager][scanner] cleanup, clearing scanner');
        scannerRef.current.clear().catch((err) => {
          console.error('[MenuManager][scanner] clear error on unmount', err);
        });
        scannerRef.current = null;
      }
    };
  }, [scannerOpen]);

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

  const normalizeProductUpcs = (product) => {
    if (!product) {
      return [];
    }

    const rawUpcs = Array.isArray(product.upcs) ? product.upcs : [];
    const normalized = rawUpcs
      .map((entry) => {
        const code = (entry.upc || entry.code || entry.barcode || '').trim();
        const note = (entry.note || '').trim();
        return code ? { upc: code, note } : null;
      })
      .filter(Boolean);

    if (normalized.length === 0 && product.barcode) {
      normalized.push({ upc: String(product.barcode), note: '' });
    }

    return normalized;
  };

  // Filter products by search and category
  const filteredProducts = products.filter((product) => {
    const name = (product.name || '').toLowerCase();
    const categoryKey = (product.category || '').toLowerCase();
    const searchKey = (searchQuery || '').toLowerCase();
    const matchesSearch = name.includes(searchKey);
    const activeCategory = activeTab === 0 ? 'all' : categories[activeTab - 1]?.id;
    const matchesCategory = activeTab === 0 || categoryKey === activeCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    console.log('[MenuManager] Products filtering updated', {
      productsCount: products.length,
      filteredCount: filteredProducts.length,
      searchQuery,
      activeTab,
      activeCategory: activeTab === 0 ? 'all' : categories[activeTab - 1]?.id,
      sampleProducts: products.slice(0, 5),
      sampleFiltered: filteredProducts.slice(0, 5),
    });
  }, [products, filteredProducts, searchQuery, activeTab, categories]);

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
      const url = `${API_URL}/products/gallery.php?storeGuid=${encodeURIComponent(storeGuid || '')}`;
      console.log('[MenuManager][loadGallery] Fetching gallery images', { url, storeGuid, API_URL });
      const response = await fetch(url);
      console.log('[MenuManager][loadGallery] Response status', { status: response.status, ok: response.ok });
      if (!response.ok) throw new Error('Failed to load gallery');
      const data = await response.json();
      console.log('[MenuManager][loadGallery] Parsed gallery data', {
        storeImagesCount: Array.isArray(data.storeImages) ? data.storeImages.length : null,
        defaultImagesCount: Array.isArray(data.defaultImages) ? data.defaultImages.length : null,
      });
      setGalleryImages(data);
    } catch (error) {
      console.error('[MenuManager][loadGallery] Error', error);
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
      const url = `${API_URL}/products/delete-gallery-image.php`;
      console.log('[MenuManager][deleteGalleryImage] Deleting gallery image', { url, storeGuid, filename });
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeGuid, filename })
      });
      
      console.log('[MenuManager][deleteGalleryImage] Response status', { status: response.status, ok: response.ok });
      if (!response.ok) throw new Error('Failed to delete image');
      
      toast.success('Image deleted from gallery');
      loadGallery(); // Reload gallery
    } catch (error) {
      console.error('[MenuManager][deleteGalleryImage] Error', error);
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
      description: '',
      upcs: []
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
      description: product.description || '',
      upcs: normalizeProductUpcs(product)
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

  const handleUpcScanSubmit = async (scannedValue) => {
    const rawInput = typeof scannedValue === 'string' ? scannedValue : inventoryUpc;
    const upc = String(rawInput || '').trim();
    const qty = parseInt(inventoryQuantity, 10) || 1;

    if (!upc) {
      toast.error('Please scan or enter a UPC first');
      return;
    }

    if (qty <= 0) {
      toast.error('Quantity must be at least 1');
      return;
    }

    if (!storeGuid) {
      toast.error('Store GUID is missing. Please reload your store and try again.');
      return;
    }

    try {
      setUpdatingInventory(true);
      console.log('[MenuManager][handleUpcScanSubmit] Starting UPC inventory update', {
        upc,
        qty,
        inventoryOperation,
        storeGuid,
        API_URL,
        IS_PHP_BACKEND,
      });

      const allProducts = Array.isArray(products) ? products : [];
      let matchedProduct = null;
      let matchedNote = '';

      for (const product of allProducts) {
        const primaryMatch = product.barcode && String(product.barcode) === upc;
        let aliasMatch = false;
        let aliasNote = '';
        const upcEntries = Array.isArray(product.upcs) ? product.upcs : [];
        for (const entry of upcEntries) {
          const entryCode = (entry.upc || entry.code || entry.barcode || '').trim();
          if (entryCode && entryCode === upc) {
            aliasMatch = true;
            aliasNote = (entry.note || '').trim();
            break;
          }
        }

        if (primaryMatch || aliasMatch) {
          matchedProduct = product;
          matchedNote = aliasMatch ? aliasNote : '';
          break;
        }
      }

      if (!matchedProduct) {
        const errorMessage = 'No product found for this UPC';
        toast.error(errorMessage);
        setLastScanStatus({ type: 'error', message: errorMessage });
        return;
      }

      const payload = {
        storeGuid,
        productId: matchedProduct.id,
        quantity: qty,
        operation: inventoryOperation
      };

      const stockUrl = `${API_URL}/products/update-stock.php`;
      console.log('[MenuManager][handleUpcScanSubmit] Updating stock', { stockUrl, payload, upc, matchedNote });
      const stockResponse = await fetch(stockUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('[MenuManager][handleUpcScanSubmit] Stock response status', {
        status: stockResponse.status,
        ok: stockResponse.ok,
      });

      const data = await stockResponse.json().catch(() => null);
      console.log('[MenuManager][handleUpcScanSubmit] Stock response body', data);

      if (!stockResponse.ok) {
        const message = data && data.error ? data.error : 'Failed to update stock';
        throw new Error(message);
      }

      const categoryLabel = matchedProduct.category || 'All Products';
      const operationLabel = inventoryOperation === 'set'
        ? 'Set stock to'
        : inventoryOperation === 'subtract'
          ? 'Subtract quantity of'
          : 'Add quantity of';
      const noteText = matchedNote ? ` ${matchedNote}` : '';
      const toastMessage = `${operationLabel} ${qty}${noteText ? ` ${noteText}` : ''} to ${matchedProduct.name} in ${categoryLabel}`;

      toast.success(toastMessage);
      setLastScanStatus({ type: 'success', message: toastMessage });

      const event = {
        id: `${Date.now()}-${upc}`,
        timestamp: new Date().toISOString(),
        upc,
        note: matchedNote,
        productName: matchedProduct.name,
        category: categoryLabel,
        quantity: qty,
        operation: inventoryOperation
      };

      setScanEvents((prev) => [event, ...prev].slice(0, 50));
      setInventoryUpc('');
      setInventoryQuantity(1);
      refreshProducts();
    } catch (error) {
      console.error('[MenuManager][handleUpcScanSubmit] UPC inventory update error', error);
      const errorMessage = error.message || 'Failed to update inventory';
      toast.error(errorMessage);
      setLastScanStatus({ type: 'error', message: errorMessage });
    } finally {
      setUpdatingInventory(false);
    }
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
      
      const cleanedUpcs = (Array.isArray(formData.upcs) ? formData.upcs : [])
        .map((entry) => ({
          upc: (entry.upc || '').trim(),
          note: (entry.note || '').trim(),
        }))
        .filter((entry) => entry.upc);

      if (cleanedUpcs.length > 0 && Array.isArray(products) && products.length > 0) {
        const duplicateSummaries = [];

        cleanedUpcs.forEach((entry) => {
          const code = entry.upc;
          const conflictingProducts = products.filter((product) => {
            if (selectedProduct && product.id === selectedProduct.id) {
              return false;
            }

            const primaryMatch = product.barcode && String(product.barcode) === code;
            const aliasEntries = Array.isArray(product.upcs) ? product.upcs : [];
            const aliasMatch = aliasEntries.some((alias) => {
              const aliasCode = (alias.upc || alias.code || alias.barcode || '').trim();
              return aliasCode && aliasCode === code;
            });

            return primaryMatch || aliasMatch;
          });

          if (conflictingProducts.length > 0) {
            duplicateSummaries.push({
              upc: code,
              products: conflictingProducts.map((p) => p.name || `Product #${p.id}`),
            });
          }
        });

        if (duplicateSummaries.length > 0) {
          const messageLines = duplicateSummaries.map((item) => {
            const names = item.products.join(', ');
            return `UPC ${item.upc} is already assigned to: ${names}`;
          });
          const confirmMessage = `${messageLines.join('\n')}` + '\n\nDo you want to add it anyway?';
          const proceed = window.confirm(confirmMessage);
          if (!proceed) {
            return;
          }
        }
      }

      const productData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        stock: formData.stock ? parseInt(formData.stock) : null,
        image: imageUrl,
        color: formData.color,
        description: formData.description.trim(),
        upcs: cleanedUpcs,
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

      console.log('[MenuManager][handleSaveProduct] Saving product', {
        url,
        method,
        payload,
        hasImageFile: !!imageFile,
      });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('[MenuManager][handleSaveProduct] Response status', {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => null);
        console.error('[MenuManager][handleSaveProduct] Error response body', errorText);
        throw new Error('Failed to save product');
      }

      toast.success(selectedProduct ? 'Product updated successfully' : 'Product added successfully');
      setEditDialogOpen(false);
      refreshProducts();
    } catch (error) {
      console.error('[MenuManager][handleSaveProduct] Error saving product', error);
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

      console.log('[MenuManager][confirmDeleteProduct] Deleting product', {
        url,
        options,
        selectedProduct,
      });

      const response = await fetch(url, options);
      console.log('[MenuManager][confirmDeleteProduct] Response status', {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => null);
        console.error('[MenuManager][confirmDeleteProduct] Error response body', errorText);
        throw new Error('Failed to delete product');
      }

      toast.success('Product deleted successfully');
      setDeleteDialogOpen(false);
      refreshProducts();
    } catch (error) {
      console.error('[MenuManager][confirmDeleteProduct] Error deleting product', error);
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
        aria-labelledby="menu-manager-title"
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
            color: 'text.primary'
          }
        }}
      >
        <DialogTitle id="menu-manager-title" component="h2" sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CategoryIcon sx={{ color: 'primary.main', fontSize: 32 }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {inventoryMode ? 'Manage All Inventory Items' : 'Menu Manager'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Add, edit, or remove products from your menu
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={onClose} sx={{ color: 'text.primary' }} aria-label="Close menu manager">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Toolbar */}
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
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
                          <SearchIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      )
                    }}
                    inputProps={{ 'aria-label': 'Search products' }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.default',
                        color: 'text.primary',
                        '& fieldset': { borderColor: 'divider' },
                        '&:hover fieldset': { borderColor: 'text.secondary' },
                        '&.Mui-focused fieldset': { borderColor: 'primary.main' }
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
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      fontWeight: 'bold',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                  >
                    Add New Product
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      mt: 1,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'background.default',
                      border: 1,
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: 1.5,
                      alignItems: { xs: 'flex-start', md: 'center' },
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InventoryIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Inventory tools (scan UPC and apply stock changes)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <TextField
                        size="small"
                        label="UPC / Barcode"
                        value={inventoryUpc}
                        onChange={(e) => setInventoryUpc(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleUpcScanSubmit();
                          }
                        }}
                        sx={{ minWidth: 180 }}
                      />
                      <TextField
                        size="small"
                        label="Qty"
                        type="number"
                        value={inventoryQuantity}
                        onChange={(e) => setInventoryQuantity(e.target.value)}
                        sx={{ width: 90 }}
                        inputProps={{ min: 1 }}
                      />
                      <FormControl size="small" sx={{ minWidth: 130 }}>
                        <InputLabel>Operation</InputLabel>
                        <Select
                          label="Operation"
                          value={inventoryOperation}
                          onChange={(e) => setInventoryOperation(e.target.value)}
                        >
                          <MenuItem value="add">Add</MenuItem>
                          <MenuItem value="subtract">Subtract</MenuItem>
                          <MenuItem value="set">Set</MenuItem>
                        </Select>
                      </FormControl>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<InventoryIcon />}
                        onClick={handleUpcScanSubmit}
                        disabled={updatingInventory || !inventoryUpc.trim()}
                        sx={{
                          borderColor: 'divider',
                          color: 'text.primary',
                          '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                        }}
                      >
                        Apply Stock
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CameraIcon />}
                        onClick={startScanner}
                        sx={{
                          borderColor: 'divider',
                          color: 'text.primary',
                          '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                        }}
                      >
                        Scan with Camera
                      </Button>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  {lastScanStatus && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'background.default',
                        border: 1,
                        borderColor: 'divider'
                      }}
                    >
                      <Alert
                        severity={lastScanStatus.type === 'error' ? 'error' : 'success'}
                        sx={{
                          py: 0.5,
                          '& .MuiAlert-message': { fontSize: '0.8rem' }
                        }}
                      >
                        {lastScanStatus.message}
                      </Alert>
                    </Box>
                  )}
                  <Box
                    sx={{
                      mt: 1,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'background.default',
                      border: 1,
                      borderColor: 'divider'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Scan log (most recent first)
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => setScanEvents([])}
                        sx={{ color: 'text.secondary', textTransform: 'none' }}
                        disabled={scanEvents.length === 0}
                      >
                        Clear
                      </Button>
                    </Box>
                    {scanEvents.length === 0 ? (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        No scans yet. Scan a UPC using the inventory tools above to record activity here.
                      </Typography>
                    ) : (
                      <List dense sx={{ maxHeight: 160, overflow: 'auto', pt: 0 }}>
                        {scanEvents.map((event) => (
                          <ListItem key={event.id} sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={
                                <Typography variant="caption" sx={{ color: 'text.primary' }}>
                                  [{new Date(event.timestamp).toLocaleTimeString()}] {event.productName} ({event.category}) – {event.operation} {event.quantity}{event.note ? ` - ${event.note}` : ''}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  UPC: {event.upc}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Category Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  '& .MuiTab-root': {
                    color: 'text.secondary',
                    '&.Mui-selected': { color: 'primary.main' }
                  },
                  '& .MuiTabs-indicator': { bgcolor: 'primary.main' }
                }}
              >
                <Tab label="All Products" />
                {categories.map((cat) => (
                  <Tab key={cat.id} label={cat.name} />
                ))}
              </Tabs>
            </Box>

            {/* Products Grid */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, bgcolor: 'background.default' }}>
              {productsLoading ? (
                <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  Loading products...
                </Typography>
              ) : filteredProducts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CategoryIcon sx={{ fontSize: 64, color: 'divider', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                    No products found
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {searchQuery ? 'Try a different search term' : 'Add your first product to get started'}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {filteredProducts.map((product) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                      <Card
                        sx={{
                          bgcolor: 'background.paper',
                          border: 1,
                          borderColor: 'divider',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: 4
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
                            bgcolor: product.color || 'background.default'
                          }}
                        />
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.primary', mb: 1 }}>
                            {product.name}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6" sx={{ color: 'primary.main' }}>
                              ${parseFloat(product.price).toFixed(2)}
                            </Typography>
                            {(() => {
                              const catDef = getCategoryForProduct(product);
                              const chipColor = catDef?.color || 'divider';
                              return (
                            <Chip
                              label={product.category}
                              size="small"
                              sx={{
                                bgcolor: chipColor,
                                color: 'text.primary',
                                fontSize: '0.7rem',
                                borderRadius: 999,
                                px: 1.5,
                                border: 1,
                                borderColor: 'divider'
                              }}
                            />
                              );
                            })()}
                          </Box>
                          {product.stock !== null && product.stock !== undefined && (
                            <Chip
                              label={`Stock: ${product.stock}`}
                              size="small"
                              sx={(theme) => {
                                const stockValue = Number(product.stock) || 0;
                                let bg;
                                if (stockValue <= 0) {
                                  bg = theme.palette.error.main;
                                } else if (stockValue <= LOW_STOCK_THRESHOLD) {
                                  bg = theme.palette.warning.main;
                                } else {
                                  bg = theme.palette.success.main;
                                }
                                return {
                                  mt: 0.5,
                                  bgcolor: bg,
                                  color: theme.palette.getContrastText(bg),
                                  fontSize: '0.7rem',
                                  borderRadius: 999,
                                  px: 1.5
                                };
                              }}
                            />
                          )}
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => handleEditProduct(product)}
                              sx={{
                                flex: 1,
                                borderColor: 'divider',
                                color: 'text.primary',
                                '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                              }}
                            >
                              Edit
                            </Button>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteProduct(product)}
                              sx={{
                                color: 'error.main',
                                border: 1,
                                borderColor: 'divider',
                                '&:hover': { borderColor: 'error.main', bgcolor: 'error.light', opacity: 0.1 }
                              }}
                              aria-label={`Delete ${product.name}`}
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

      <Drawer
        anchor="right"
        open={scannerOpen}
        onClose={closeScanner}
        ModalProps={{ keepMounted: true }}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 1,
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 420, md: 480 },
            maxWidth: '100%',
          },
        }}
      >
        <Box sx={{ width: '100%', p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6">Inventory Scanner</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Point your camera at a barcode. When detected, it will be applied using the current quantity and operation.
          </Typography>
          {scannerError && (
            <Alert severity="error">
              {scannerError}
            </Alert>
          )}
          <Box sx={{ mt: 1, flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <Box id="inventory-scanner-element" sx={{ width: '100%', minHeight: 260 }} />
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Current UPC: {inventoryUpc || 'None yet'}
            </Typography>
          </Box>
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setScannerError('');
                setScannerOpen(false);
                setTimeout(() => setScannerOpen(true), 0);
              }}
              sx={{
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
              }}
            >
              Restart
            </Button>
            <Button
              variant="contained"
              onClick={closeScanner}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Add/Edit Product Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="menu-manager-edit-product-title"
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary'
          }
        }}
      >
        <DialogTitle id="menu-manager-edit-product-title" component="h2" sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedProduct ? <EditIcon sx={{ color: 'primary.main' }} /> : <AddIcon sx={{ color: 'primary.main' }} />}
            <Typography variant="h6" fontWeight="bold">
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: 'background.default' }}>
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
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    '& fieldset': { borderColor: 'divider' },
                    '&:hover fieldset': { borderColor: 'text.secondary' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                  },
                  '& .MuiInputLabel-root': { color: 'text.secondary' },
                  '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' }
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
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    '& fieldset': { borderColor: 'divider' },
                    '&:hover fieldset': { borderColor: 'text.secondary' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                  },
                  '& .MuiInputLabel-root': { color: 'text.secondary' },
                  '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary', '&.Mui-focused': { color: 'primary.main' } }}>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                  sx={{
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'text.secondary' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
                  }}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: 'background.paper', 
                border: 1, 
                borderColor: 'divider'
              }}>
                <Typography variant="subtitle2" sx={{ color: 'text.primary', mb: 1 }}>
                  UPCs / Barcodes
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                  Add one or more UPCs with optional notes. These will be used when scanning inventory.
                </Typography>
                {(!formData.upcs || formData.upcs.length === 0) && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                    No UPCs added yet.
                  </Typography>
                )}
                <Grid container spacing={1}>
                  {Array.isArray(formData.upcs) && formData.upcs.map((entry, index) => (
                    <React.Fragment key={index}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="UPC"
                          value={entry.upc || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => {
                              const upcs = Array.isArray(prev.upcs) ? [...prev.upcs] : [];
                              upcs[index] = { ...upcs[index], upc: value };
                              return { ...prev, upcs };
                            });
                          }}
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: 'background.default',
                              color: 'text.primary',
                              '& fieldset': { borderColor: 'divider' },
                              '&:hover fieldset': { borderColor: 'text.secondary' },
                              '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                            },
                            '& .MuiInputLabel-root': { color: 'text.secondary' },
                            '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={7}>
                        <TextField
                          fullWidth
                          label="Note (Optional)"
                          value={entry.note || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => {
                              const upcs = Array.isArray(prev.upcs) ? [...prev.upcs] : [];
                              upcs[index] = { ...upcs[index], note: value };
                              return { ...prev, upcs };
                            });
                          }}
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: 'background.default',
                              color: 'text.primary',
                              '& fieldset': { borderColor: 'divider' },
                              '&:hover fieldset': { borderColor: 'text.secondary' },
                              '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                            },
                            '& .MuiInputLabel-root': { color: 'text.secondary' },
                            '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setFormData((prev) => {
                              const upcs = Array.isArray(prev.upcs) ? prev.upcs.filter((_, i) => i !== index) : [];
                              return { ...prev, upcs };
                            });
                          }}
                          sx={{ color: 'error.main' }}
                          aria-label="Remove UPC"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    </React.Fragment>
                  ))}
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        upcs: [...(Array.isArray(prev.upcs) ? prev.upcs : []), { upc: '', note: '' }]
                      }));
                    }}
                    sx={{
                      borderColor: 'divider',
                      color: 'text.primary',
                      '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                    }}
                  >
                    Add UPC
                  </Button>
                </Box>
              </Box>
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
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    '& fieldset': { borderColor: 'divider' },
                    '&:hover fieldset': { borderColor: 'text.secondary' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                  },
                  '& .MuiInputLabel-root': { color: 'text.secondary' },
                  '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary', '&.Mui-focused': { color: 'primary.main' } }}>Color</InputLabel>
                <Select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  label="Color"
                  sx={{
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'text.secondary' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
                  }}
                >
                  {colorOptions.map((color) => (
                    <MenuItem key={color.value} value={color.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 20, height: 20, bgcolor: color.value, border: 1, borderColor: 'divider', borderRadius: 1 }} />
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
                border: '2px dashed',
                borderColor: 'divider', 
                borderRadius: 2, 
                bgcolor: 'background.default',
                textAlign: 'center'
              }}>
                <Typography variant="subtitle2" component="h3" sx={{ color: 'text.primary', mb: 2 }}>
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
                        border: 1,
                        borderColor: 'divider'
                      }}
                    />
                    <IconButton
                      onClick={handleRemoveImage}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'error.main',
                        color: 'error.contrastText',
                        '&:hover': { bgcolor: 'error.dark' }
                      }}
                      aria-label="Remove selected image"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Box>
                    <ImageIcon sx={{ fontSize: 64, color: 'divider', mb: 2 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
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
                      borderColor: 'divider',
                      color: 'text.primary',
                      '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
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
                      borderColor: 'divider',
                      color: 'text.primary',
                      '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                    }}
                  >
                    {showGallery ? 'Hide Gallery' : 'Browse Gallery'}
                  </Button>
                </Box>
                
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 2 }}>
                  Supported: JPG, PNG, GIF (Max 5MB)
                </Typography>
              </Box>
            </Grid>

            {/* Gallery Browser */}
            {showGallery && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  border: 1,
                  borderColor: 'divider', 
                  borderRadius: 2, 
                  bgcolor: 'background.default'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
                    <Typography variant="h4" component="h2" sx={{ color: 'text.primary' }}>
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
                              <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            </InputAdornment>
                          ),
                          endAdornment: gallerySearchQuery && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => setGallerySearchQuery('')}
                                sx={{ color: 'text.secondary' }}
                                aria-label="Clear gallery search"
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                        inputProps={{ 'aria-label': 'Search gallery by filename' }}
                        sx={{
                          width: 250,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'background.paper',
                            color: 'text.primary',
                            '& fieldset': { borderColor: 'divider' },
                            '&:hover fieldset': { borderColor: 'text.secondary' },
                            '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                          }
                        }}
                      />
                      <IconButton
                        onClick={loadGallery}
                        disabled={loadingGallery}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': { color: 'primary.main' }
                        }}
                        title="Refresh gallery"
                        aria-label="Refresh gallery"
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
                        color: 'text.secondary',
                        '&.Mui-selected': { color: 'primary.main' }
                      },
                      '& .MuiTabs-indicator': { bgcolor: 'primary.main' }
                    }}
                  >
                    <Tab label={`My Images (${filteredGalleryImages.storeImages?.length || 0})`} />
                    <Tab label={`Default Gallery (${filteredGalleryImages.defaultImages?.length || 0})`} />
                  </Tabs>
                  
                  {/* Gallery Info */}
                  {(filteredGalleryImages.storeImages?.length > 0 || filteredGalleryImages.defaultImages?.length > 0) && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                      Showing {currentGalleryImages.length} of {galleryTab === 0 
                        ? filteredGalleryImages.storeImages.length 
                        : filteredGalleryImages.defaultImages.length} images
                      {gallerySearchQuery && ` matching "${gallerySearchQuery}"`}
                    </Typography>
                  )}
                  
                  {loadingGallery ? (
                    <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                      Loading gallery...
                    </Typography>
                  ) : (
                    <Box sx={{ 
                      maxHeight: 400, 
                      overflowY: 'auto',
                      '&::-webkit-scrollbar': { width: '8px' },
                      '&::-webkit-scrollbar-track': { bgcolor: 'background.paper' },
                      '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 1 }
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
                                      border: 1,
                                      borderColor: formData.image === img.url ? 'primary.main' : 'divider',
                                      borderWidth: formData.image === img.url ? 3 : 1,
                                      cursor: 'pointer',
                                      '&:hover': { 
                                        borderColor: 'primary.main',
                                        opacity: 0.8
                                      }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Select image ${img.filename}`}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleSelectFromGallery(img.url);
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
                                      bgcolor: 'error.main',
                                      color: 'error.contrastText',
                                      padding: '4px',
                                      '&:hover': { bgcolor: 'error.dark' }
                                    }}
                                    aria-label="Delete image from gallery"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Grid>
                            ))
                          ) : (
                            <Grid item xs={12}>
                              <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
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
                                      border: 1,
                                      borderColor: formData.image === img.url ? 'primary.main' : 'divider',
                                      borderWidth: formData.image === img.url ? 3 : 1,
                                      cursor: 'pointer',
                                      '&:hover': { 
                                        borderColor: 'primary.main',
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
                                      bgcolor: 'info.main',
                                      color: 'info.contrastText',
                                      fontSize: '0.65rem',
                                      height: 20
                                    }}
                                  />
                                </Box>
                              </Grid>
                            ))
                          ) : (
                            <Grid item xs={12}>
                              <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
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
                              borderColor: 'divider',
                              color: 'text.primary',
                              '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
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
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block', textAlign: 'center' }}>
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
                      <ImageIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    '& fieldset': { borderColor: 'divider' },
                    '&:hover fieldset': { borderColor: 'text.secondary' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                  },
                  '& .MuiInputLabel-root': { color: 'text.secondary' },
                  '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' }
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
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    '& fieldset': { borderColor: 'divider' },
                    '&:hover fieldset': { borderColor: 'text.secondary' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                  },
                  '& .MuiInputLabel-root': { color: 'text.secondary' },
                  '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveProduct}
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 'bold',
              '&:hover': { bgcolor: 'primary.dark' }
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
        aria-labelledby="menu-manager-delete-product-title"
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary'
          }
        }}
      >
        <DialogTitle id="menu-manager-delete-product-title" component="h2" sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon sx={{ color: 'error.main' }} />
            <Typography variant="h6" fontWeight="bold">Delete Product</Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: 'background.default' }}>
          <Alert severity="warning" sx={{ mb: 2, bgcolor: 'warning.dark', color: 'warning.contrastText', border: 1, borderColor: 'warning.main' }}>
            This action cannot be undone!
          </Alert>
          <Typography sx={{ color: 'text.secondary' }}>
            Are you sure you want to delete <strong style={{ color: 'inherit' }}>{selectedProduct?.name}</strong>?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<DeleteIcon />}
            onClick={confirmDeleteProduct}
            sx={{
              bgcolor: 'error.main',
              color: 'error.contrastText',
              fontWeight: 'bold',
              '&:hover': { bgcolor: 'error.dark' }
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
