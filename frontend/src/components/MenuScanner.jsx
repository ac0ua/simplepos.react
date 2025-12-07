import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Checkbox,
  FormControlLabel,
  Chip,
  LinearProgress,
  Collapse,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  PhotoCamera as PhotoCameraIcon,
  CloudUpload as UploadIcon,
  Add as AddIcon,
  Restaurant as RestaurantIcon,
  LocalOffer as ComboIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config/api';

const MenuScanner = ({ open, onClose, storeGuid, onItemsScanned, categories }) => {
  const [scanning, setScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [addingItems, setAddingItems] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Start camera
  const startCamera = useCallback(async () => {
    setError('');
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access or upload an image instead.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please upload an image instead.');
      } else {
        setError('Failed to start camera. Please upload an image instead.');
      }
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Capture photo from camera
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    await scanMenuImage(imageData);
  }, [storeGuid]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large. Maximum size is 10MB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target.result;
      await scanMenuImage(imageData);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [storeGuid]);

  // Scan menu image with AI
  const scanMenuImage = async (imageData) => {
    setScanning(true);
    setError('');
    setScannedItems([]);
    setSelectedItems({});
    
    try {
      // Extract base64 data
      const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!base64Match) {
        throw new Error('Invalid image data');
      }
      
      const mimeType = `image/${base64Match[1]}`;
      const base64Data = base64Match[2];
      
      const response = await fetch(`${API_URL}/products/scan-menu.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeGuid,
          image: base64Data,
          mimeType
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Show more detailed error message
        const errorMsg = data.error || data.message || 'Failed to scan menu';
        if (errorMsg.includes('quota') || errorMsg.includes('429')) {
          throw new Error('AI service quota exceeded. Please try again later or contact support.');
        }
        throw new Error(errorMsg);
      }
      
      if (data.items && data.items.length > 0) {
        setScannedItems(data.items);
        // Select all items by default
        const selected = {};
        data.items.forEach((item, index) => {
          selected[index] = true;
        });
        setSelectedItems(selected);
        toast.success(`Found ${data.items.length} menu items!`);
      } else {
        setError('No menu items found in the image. Try a clearer photo.');
      }
      
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to scan menu. Please try again.');
      toast.error('Failed to scan menu');
    } finally {
      setScanning(false);
    }
  };

  // Toggle item selection
  const toggleItemSelection = (index) => {
    setSelectedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Toggle item expansion
  const toggleItemExpansion = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Select/deselect all items
  const toggleSelectAll = () => {
    const allSelected = Object.values(selectedItems).every(v => v);
    const newSelected = {};
    scannedItems.forEach((_, index) => {
      newSelected[index] = !allSelected;
    });
    setSelectedItems(newSelected);
  };

  // Add selected items to menu
  const addSelectedItems = async () => {
    const itemsToAdd = scannedItems.filter((_, index) => selectedItems[index]);
    
    if (itemsToAdd.length === 0) {
      toast.error('Please select at least one item to add');
      return;
    }
    
    setAddingItems(true);
    
    try {
      const results = [];
      
      for (const item of itemsToAdd) {
        const productData = {
          storeGuid,
          name: item.name,
          price: item.price,
          category: item.category || 'snacks',
          image: item.imageUrl || '',
          stock: 100,
          description: item.description || (item.isCombo ? `Combo includes: ${item.comboIncludes}` : ''),
          color: '#f5f5f5',
          upcs: []
        };
        
        const response = await fetch(`${API_URL}/products/create.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          results.push({ success: true, item: item.name });
        } else {
          results.push({ success: false, item: item.name, error: data.message });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        toast.success(`Added ${successCount} items to menu!`);
      }
      if (failCount > 0) {
        toast.error(`Failed to add ${failCount} items`);
      }
      
      // Notify parent to refresh products
      if (onItemsScanned) {
        onItemsScanned(results);
      }
      
      // Close dialog on success
      if (successCount > 0) {
        handleClose();
      }
      
    } catch (err) {
      console.error('Add items error:', err);
      toast.error('Failed to add items to menu');
    } finally {
      setAddingItems(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    stopCamera();
    setScannedItems([]);
    setSelectedItems({});
    setError('');
    setExpandedItems({});
    onClose();
  };

  // Get category color
  const getCategoryColor = (categoryId) => {
    const cat = categories?.find(c => c.id === categoryId);
    return cat?.color || '#6b7280';
  };

  const selectedCount = Object.values(selectedItems).filter(v => v).length;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          color: 'text.primary',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RestaurantIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="bold">
              Scan Menu with AI
            </Typography>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: 'text.primary' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2, bgcolor: 'background.default' }}>
        {/* Camera/Upload Section */}
        {scannedItems.length === 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Take a photo of a menu or upload an image. Our AI will automatically detect menu items,
              prices, and combos, then match them with images from your gallery.
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {scanning && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="info" sx={{ mb: 1 }}>
                  Analyzing menu image with AI... This may take a few seconds.
                </Alert>
                <LinearProgress />
              </Box>
            )}
            
            {/* Camera View */}
            {cameraActive && (
              <Box sx={{ 
                position: 'relative', 
                mb: 2, 
                borderRadius: 2, 
                overflow: 'hidden',
                bgcolor: 'black'
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain'
                  }}
                />
                <Box sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 2
                }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<PhotoCameraIcon />}
                    onClick={capturePhoto}
                    disabled={scanning}
                    sx={{ borderRadius: 3 }}
                  >
                    Capture
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={stopCamera}
                    sx={{ 
                      borderRadius: 3,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
            
            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {/* Action Buttons */}
            {!cameraActive && !scanning && (
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CameraIcon />}
                  onClick={startCamera}
                  sx={{ 
                    minWidth: 200,
                    py: 2,
                    borderRadius: 2
                  }}
                >
                  Use Camera
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<UploadIcon />}
                  component="label"
                  sx={{ 
                    minWidth: 200,
                    py: 2,
                    borderRadius: 2,
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                >
                  Upload Image
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Scanned Items Section */}
        {scannedItems.length > 0 && (
          <Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Found {scannedItems.length} Menu Items
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedCount === scannedItems.length}
                    indeterminate={selectedCount > 0 && selectedCount < scannedItems.length}
                    onChange={toggleSelectAll}
                  />
                }
                label={`Select All (${selectedCount}/${scannedItems.length})`}
              />
            </Box>
            
            <Box sx={{ 
              maxHeight: '50vh', 
              overflowY: 'auto',
              pr: 1
            }}>
              <Grid container spacing={2}>
                {scannedItems.map((item, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card 
                      sx={{ 
                        border: selectedItems[index] ? 2 : 1,
                        borderColor: selectedItems[index] ? 'primary.main' : 'divider',
                        bgcolor: selectedItems[index] ? 'action.selected' : 'background.paper',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Box sx={{ display: 'flex' }}>
                        {/* Checkbox */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'flex-start',
                          p: 1
                        }}>
                          <Checkbox
                            checked={selectedItems[index] || false}
                            onChange={() => toggleItemSelection(index)}
                          />
                        </Box>
                        
                        {/* Image */}
                        {item.imageUrl ? (
                          <CardMedia
                            component="img"
                            sx={{ 
                              width: 80, 
                              height: 80,
                              objectFit: 'cover',
                              m: 1,
                              borderRadius: 1
                            }}
                            image={item.imageUrl}
                            alt={item.name}
                          />
                        ) : (
                          <Box sx={{
                            width: 80,
                            height: 80,
                            m: 1,
                            borderRadius: 1,
                            bgcolor: 'action.hover',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <ImageIcon sx={{ color: 'text.disabled', fontSize: 32 }} />
                          </Box>
                        )}
                        
                        {/* Content */}
                        <CardContent sx={{ flex: 1, py: 1, px: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ pr: 1 }}>
                              {item.name}
                            </Typography>
                            <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                              ${item.price?.toFixed(2)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              label={item.category}
                              size="small"
                              sx={{
                                bgcolor: getCategoryColor(item.category),
                                color: 'white',
                                fontSize: '0.65rem',
                                height: 20
                              }}
                            />
                            {item.isCombo && (
                              <Chip
                                icon={<ComboIcon sx={{ fontSize: 14 }} />}
                                label="Combo"
                                size="small"
                                color="secondary"
                                sx={{ fontSize: '0.65rem', height: 20 }}
                              />
                            )}
                          </Box>
                          
                          {/* Expandable details */}
                          {(item.description || item.comboIncludes) && (
                            <>
                              <Button
                                size="small"
                                onClick={() => toggleItemExpansion(index)}
                                endIcon={expandedItems[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                sx={{ 
                                  mt: 0.5, 
                                  p: 0, 
                                  minWidth: 0,
                                  fontSize: '0.7rem',
                                  color: 'text.secondary'
                                }}
                              >
                                Details
                              </Button>
                              <Collapse in={expandedItems[index]}>
                                <Box sx={{ mt: 0.5 }}>
                                  {item.description && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                      {item.description}
                                    </Typography>
                                  )}
                                  {item.comboIncludes && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                      <strong>Includes:</strong> {item.comboIncludes}
                                    </Typography>
                                  )}
                                </Box>
                              </Collapse>
                            </>
                          )}
                        </CardContent>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            {/* Scan Again Button */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="text"
                startIcon={<CameraIcon />}
                onClick={() => {
                  setScannedItems([]);
                  setSelectedItems({});
                  setError('');
                }}
                sx={{ color: 'text.secondary' }}
              >
                Scan Another Menu
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', p: 2 }}>
        <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        {scannedItems.length > 0 && (
          <Button
            variant="contained"
            startIcon={addingItems ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            onClick={addSelectedItems}
            disabled={selectedCount === 0 || addingItems}
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 'bold',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            {addingItems ? 'Adding...' : `Add ${selectedCount} Items to Menu`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MenuScanner;
