import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Divider,
  Card,
  CardContent,
  CardMedia,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  AppBar,
  Toolbar,
  Drawer,
  Badge,
  InputAdornment,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Menu as MenuIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  AttachMoney as MoneyIcon,
  LocalOffer as DiscountIcon,
  Print as PrintIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Apps as AppsIcon,
  LocalDrink as DrinkIcon,
  Fastfood as FoodIcon,
  DirectionsCar as CarIcon,
  AcUnit as FrozenIcon,
  LocalGasStation as GasIcon,
  Paid as PaidIcon,
  AccountBalanceWallet as WalletIcon,
  QrCode2 as QrCodeIcon,
  Insights as InsightsIcon,
  Inventory as InventoryIcon,
  Palette as PaletteIcon,
  Category as CategoryIcon,
  Restaurant as RestaurantIcon,
  Assignment as AssignmentIcon,
  FileDownload as ExportIcon,
  Label as LabelIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore';
import { useStoreContext } from '../contexts/StoreContext';
import { useSocket } from '../contexts/SocketContext';
import ShareQRCode from '../components/ShareQRCode';
import MenuManager from '../components/MenuManager';
import ServerStatusIndicator from '../components/ServerStatusIndicator';

const categories = [
  { id: 'all', name: 'All Products', icon: <AppsIcon /> },
  { id: 'beverages', name: 'Beverages', icon: <DrinkIcon /> },
  { id: 'snacks', name: 'Snacks', icon: <FoodIcon /> },
  { id: 'automotive', name: 'Automotive', icon: <CarIcon /> },
  { id: 'frozen', name: 'Frozen', icon: <FrozenIcon /> },
  { id: 'fuel', name: 'Fuel', icon: <GasIcon /> }
];

const POSInterface = () => {
  const navigate = useNavigate();
  const { storeGuid, label } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashGiven, setCashGiven] = useState('');
  const [orderReviewDialog, setOrderReviewDialog] = useState(false);
  const [orderName, setOrderName] = useState('');
  const [kioskNumber, setKioskNumber] = useState(null);
  const [reviewPaymentMethod, setReviewPaymentMethod] = useState('cash');
  const [reviewCashGiven, setReviewCashGiven] = useState('');
  const [reviewCardTendered, setReviewCardTendered] = useState('');
  const [clearCartDialogOpen, setClearCartDialogOpen] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [menuManagerOpen, setMenuManagerOpen] = useState(false);
  const [kioskOrderSuccessDialog, setKioskOrderSuccessDialog] = useState(false);
  const [completedKioskOrder, setCompletedKioskOrder] = useState(null);
  
  const cart = useStore((state) => state.cart);
  const addToCart = useStore((state) => state.addToCart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const updateCartItemQuantity = useStore((state) => state.updateCartItemQuantity);
  const clearCart = useStore((state) => state.clearCart);
  const getCartTotal = useStore((state) => state.getCartTotal);
  
  const { products, productsLoading, createOrder } = useStoreContext();
  const { emitOrderUpdate } = useSocket();
  
  const totals = getCartTotal();
  
  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      product.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Handle product click
  const handleProductClick = (product) => {
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };
  
  // Handle checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setPaymentDialog(true);
  };
  
  // Generate random 4-digit kiosk number
  const generateKioskNumber = () => {
    return Math.floor(1000 + Math.random() * 9000);
  };
  
  // Generate order ID based on nomenclature: {K/P}-{MMDD}-{00001-99999}
  const generateOrderId = (orderType) => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const orderCount = Math.floor(1 + Math.random() * 99999).toString().padStart(5, '0');
    
    const type = orderType === 'kiosk' ? 'K' : 'P';
    return `${type}-${month}${day}-${orderCount}`;
  };
  
  // Open order review (Kiosk Checkout)
  const handleKioskCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setOrderReviewDialog(true);
  };

  const confirmClearCart = () => {
    clearCart();
    toast.success('Cart cleared');
    setClearCartDialogOpen(false);
  };

  const handleRequestClearCart = () => {
    if (cart.length === 0) {
      toast('Nothing to clear', { icon: '🗑️' });
      return;
    }
    setClearCartDialogOpen(true);
  };
  
  // Create kiosk order (with or without payment based on method)
  const createKioskOrder = () => {
    if (!orderName.trim()) {
      toast.error('Please enter a name for the order');
      return;
    }
    
    const kiosk = generateKioskNumber();
    const orderId = generateOrderId('kiosk');
    
    // Always create as kiosk order (pending payment) - to be added to Active Orders
    const orderData = {
      items: cart,
      subtotal: parseFloat(totals.subtotal),
      tax: parseFloat(totals.tax),
      total: parseFloat(totals.total),
      orderName: orderName.trim(),
      kioskNumber: kiosk,
      orderNumber: orderId,
      paymentStatus: 'pending',
      orderStatus: 'active', // Add to Active Orders
      paymentMethod: null,
      cashGiven: null,
      cardTendered: null,
      changeAmount: 0,
      cashierAction: 'kiosk_order',
      createdAt: new Date().toISOString()
    };
    
    console.log('🚀 FRONTEND: Sending order with name:', orderData.orderName);
    console.log('🚀 FRONTEND: Full order data:', orderData);
    
    createOrder(orderData);
    emitOrderUpdate(orderData);
    
    // Store order details for success dialog
    setCompletedKioskOrder({
      orderNumber: orderId,
      kioskNumber: kiosk,
      orderName: orderName.trim(),
      total: totals.total
    });
    
    // Clear cart and close order review dialog
    clearCart();
    setOrderReviewDialog(false);
    setOrderName('');
    setReviewCashGiven('');
    setReviewPaymentMethod('cash');
    setReviewCardTendered('');
    
    // Show success dialog
    setKioskOrderSuccessDialog(true);
  };
  
  // Finalize order (with payment)
  const finalizeOrder = (method) => {
    const trimmedName = orderName.trim();
    const totalAmount = parseFloat(totals.total);
    
    if (!trimmedName) {
      toast.error('Please enter a name for the order');
      setReviewPaymentMethod(method);
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (method === 'cash') {
      setReviewPaymentMethod('cash');
      if (!reviewCashGiven) {
        toast.error('Please enter cash tendered');
        return;
      }

      const cashAmount = parseFloat(reviewCashGiven);
      if (Number.isNaN(cashAmount)) {
        toast.error('Cash tendered must be a valid number');
        return;
      }

      if (cashAmount < totalAmount) {
        toast.error('Amount due is still outstanding');
        return;
      }
    }

    if (method === 'card') {
      setReviewPaymentMethod('card');
    }

    const kiosk = generateKioskNumber();
    const orderId = generateOrderId('paid');
    const isCash = method === 'cash';
    const cashAmount = isCash ? parseFloat(reviewCashGiven) : null;

    const orderData = {
      items: cart,
      subtotal: parseFloat(totals.subtotal),
      tax: parseFloat(totals.tax),
      total: totalAmount,
      orderName: trimmedName,
      kioskNumber: kiosk,
      orderNumber: orderId,
      paymentStatus: 'paid',
      orderStatus: 'active',
      paymentMethod: method,
      cashGiven: isCash ? cashAmount : null,
      cardTendered: !isCash ? reviewCardTendered.trim() : null,
      changeAmount: isCash ? Math.max(0, cashAmount - totalAmount) : 0,
      cashierAction: 'finalize_checkout',
      createdAt: new Date().toISOString()
    };

    createOrder(orderData);
    emitOrderUpdate(orderData);

    setKioskNumber(kiosk);

    if (isCash) {
      const change = (cashAmount - totalAmount).toFixed(2);
      toast.success(`Order #${orderId} paid with cash! Change: $${change}`);
    } else {
      toast.success(`Order #${orderId} paid via card!`);
    }

    clearCart();
    setOrderReviewDialog(false);
    setOrderName('');
    setReviewCashGiven('');
    setReviewCardTendered('');
    setReviewPaymentMethod('cash');

    setTimeout(() => setKioskNumber(null), 5000);
  };

  const handleFinalizeCash = () => finalizeOrder('cash');

  const handleFinalizeCard = () => finalizeOrder('card');
  
  // Process payment (for direct payment)
  const processPayment = () => {
    const orderId = generateOrderId('paid');
    const orderData = {
      items: cart,
      subtotal: parseFloat(totals.subtotal),
      tax: parseFloat(totals.tax),
      total: parseFloat(totals.total),
      orderNumber: orderId,
      paymentMethod,
      cashGiven: paymentMethod === 'cash' ? parseFloat(cashGiven) : null,
      changeAmount: paymentMethod === 'cash' ? 
        Math.max(0, parseFloat(cashGiven) - parseFloat(totals.total)) : 0,
      cashierAction: 'sale',
      status: 'completed'
    };
    
    createOrder(orderData);
    emitOrderUpdate(orderData);
    
    toast.success(`Order #${orderId} completed!`);
    clearCart();
    setPaymentDialog(false);
    setCashGiven('');
  };
  
  // Quick tender buttons
  const quickTenderAmounts = [5, 10, 20, 50, 100];
  
  const handleQuickTender = (amount) => {
    setCashGiven(amount.toString());
  };
  
  const handleReviewQuickTender = (amount) => {
    const currentAmount = parseFloat(reviewCashGiven) || 0;
    const newAmount = currentAmount + amount;
    setReviewCashGiven(newAmount.toString());
  };
  
  const clearReviewCashGiven = () => {
    setReviewCashGiven('');
  };
  
  const selectReviewPaymentMethod = (method) => {
    setReviewPaymentMethod(method);
    if (method === 'cash') {
      setReviewCardTendered('');
    } else if (method === 'card') {
      setReviewCashGiven('');
    }
  };
  
  // Calculate change
  const calculateChange = () => {
    if (paymentMethod === 'cash' && cashGiven) {
      const change = parseFloat(cashGiven) - parseFloat(totals.total);
      return change >= 0 ? change.toFixed(2) : 0;
    }
    return 0;
  };

  const calculateReviewChange = () => {
    if (reviewPaymentMethod === 'cash' && reviewCashGiven) {
      const change = parseFloat(reviewCashGiven) - parseFloat(totals.total);
      return change >= 0 ? change.toFixed(2) : 0;
    }
    return 0;
  };

  // Sidebar content component
  const SidebarContent = () => (
    <Box
      sx={{
        height: '100%',
        bgcolor: '#2d2416',
        display: 'flex',
        flexDirection: 'column',
        color: 'white'
      }}
    >
      {/* Mobile Close Button */}
      <Box sx={{ 
        display: { xs: 'flex', md: 'none' }, 
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2, 
        borderBottom: '1px solid rgba(255, 152, 0, 0.2)' 
      }}>
        <Typography variant="h6" fontWeight="bold" sx={{ color: '#ff9800' }}>Menu</Typography>
        <IconButton onClick={() => setMobileDrawerOpen(false)} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 152, 0, 0.2)' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>Categories</Typography>
      </Box>
      
      <List sx={{ flexGrow: 1, p: 2 }}>
        {categories.map((category) => (
          <ListItem
            key={category.id}
            component="button"
            selected={selectedCategory === category.id}
            onClick={() => {
              setSelectedCategory(category.id);
              setMobileDrawerOpen(false);
            }}
            sx={{
              borderRadius: 2,
              mb: 1,
              bgcolor: selectedCategory === category.id ? '#ff9800' : 'transparent',
              color: selectedCategory === category.id ? '#000' : 'white',
              border: 'none',
              '&:hover': {
                bgcolor: selectedCategory === category.id ? '#f57c00' : 'rgba(255, 152, 0, 0.1)'
              },
              '&.Mui-selected': {
                bgcolor: '#ff9800',
                color: '#000',
                '&:hover': {
                  bgcolor: '#f57c00'
                }
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              {category.icon}
              <Typography variant="body2" fontWeight={selectedCategory === category.id ? 'bold' : 'normal'}>
                {category.name}
              </Typography>
            </Box>
          </ListItem>
        ))}
      </List>
      
      {/* Cashier Actions */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 152, 0, 0.2)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'white' }}>Cashier Actions</Typography>
          <Box sx={{ 
            width: 12, 
            height: 12, 
            borderRadius: '50%', 
            bgcolor: '#4caf50',
            boxShadow: '0 0 8px #4caf50'
          }} />
        </Box>
        <Grid container spacing={1.5}>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                bgcolor: '#3d3426',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#4d4436' }
              }}
            >
              <InsightsIcon sx={{ color: '#ff9800', fontSize: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>Insights</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                bgcolor: '#3d3426',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#4d4436' }
              }}
            >
              <SettingsIcon sx={{ color: 'white', fontSize: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>Settings</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                bgcolor: '#3d3426',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#4d4436' }
              }}
            >
              <InventoryIcon sx={{ color: 'white', fontSize: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>Inventory</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                bgcolor: '#3d3426',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#4d4436' }
              }}
            >
              <PaletteIcon sx={{ color: 'white', fontSize: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>Theme</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                bgcolor: '#3d3426',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#4d4436' }
              }}
            >
              <CategoryIcon sx={{ color: 'white', fontSize: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>Category</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                bgcolor: '#3d3426',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#4d4436' }
              }}
            >
              <RestaurantIcon sx={{ color: 'white', fontSize: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>Menu</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                bgcolor: '#3d3426',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#4d4436' }
              }}
              onClick={() => navigate(`/${storeGuid}/${label}/active-orders`)}
            >
              <AssignmentIcon sx={{ color: 'white', fontSize: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>Active</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                bgcolor: '#3d3426',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#4d4436' }
              }}
            >
              <ReceiptIcon sx={{ color: 'white', fontSize: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>Order</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                bgcolor: '#3d3426',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#4d4436' }
              }}
            >
              <ExportIcon sx={{ color: 'white', fontSize: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>Export</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      <Button
        variant="contained"
        startIcon={<RestaurantIcon />}
        onClick={() => setMenuManagerOpen(true)}
        sx={{ 
          m: 2, 
          bgcolor: '#ff9800',
          color: '#000',
          fontWeight: 'bold',
          '&:hover': { bgcolor: '#f57c00' }
        }}
      >
        Manage Menu
      </Button>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Desktop Sidebar */}
      <Box
        sx={{
          width: 280,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column'
        }}
      >
        <SidebarContent />
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            bgcolor: '#2d2416'
          }
        }}
      >
        <SidebarContent />
      </Drawer>

      {/* Old Sidebar - Categories - REMOVED */}
      <Box
        sx={{
          width: 200,
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          display: 'none',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">Categories</Typography>
        </Box>
        
        <List sx={{ flexGrow: 1, p: 1 }}>
          {categories.map((category) => (
            <ListItem
              key={category.id}
              component="button"
              selected={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  }
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {category.icon}
                <Typography variant="body2">{category.name}</Typography>
              </Box>
            </ListItem>
          ))}
        </List>
        
        {/* Cashier Actions */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>Cashier Actions</Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Button
                size="small"
                variant="outlined"
                fullWidth
                startIcon={<WalletIcon />}
                sx={{ fontSize: '0.75rem' }}
              >
                Open
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                size="small"
                variant="outlined"
                fullWidth
                startIcon={<PaidIcon />}
                sx={{ fontSize: '0.75rem' }}
              >
                Labels
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                size="small"
                variant="outlined"
                fullWidth
                startIcon={<ReceiptIcon />}
                sx={{ fontSize: '0.75rem' }}
              >
                Sale
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                size="small"
                variant="outlined"
                fullWidth
                startIcon={<PrintIcon />}
                sx={{ fontSize: '0.75rem' }}
              >
                Print
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                size="small"
                variant="outlined"
                fullWidth
                startIcon={<DiscountIcon />}
                sx={{ fontSize: '0.75rem' }}
              >
                Return
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                size="small"
                variant="outlined"
                fullWidth
                startIcon={<MoneyIcon />}
                sx={{ fontSize: '0.75rem' }}
              >
                Payout
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        <Button
          variant="contained"
          color="warning"
          startIcon={<MenuIcon />}
          sx={{ m: 2 }}
        >
          Manage Menu
        </Button>
      </Box>
      
      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar>
            {/* Mobile Menu Button */}
            <IconButton
              edge="start"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 2, display: { xs: 'block', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography variant="h5" sx={{ flexGrow: { xs: 1, sm: 0 }, fontWeight: 'bold' }}>
              My Business
            </Typography>
            <TextField
              size="small"
              placeholder="Search for products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ 
                width: { xs: 0, sm: 300, md: 400 }, 
                mr: 2,
                display: { xs: 'none', sm: 'block' }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <Button
              variant="outlined"
              startIcon={<ReceiptIcon />}
              onClick={() => navigate(`/${storeGuid}/${label}/active-orders`)}
              sx={{ mr: 2, display: { xs: 'none', md: 'inline-flex' } }}
            >
              Active Orders
            </Button>
            <Button
              variant="outlined"
              startIcon={<QrCodeIcon />}
              onClick={() => setQrCodeDialogOpen(true)}
              sx={{ mr: 2, display: { xs: 'none', lg: 'inline-flex' } }}
            >
              Share Terminal
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: { xs: 1.5, sm: 2 }, minWidth: 150 }}>
              <ServerStatusIndicator />
            </Box>
            {/* Mobile Cart Button */}
            <IconButton
              onClick={() => setCartDrawerOpen(true)}
              sx={{ display: { xs: 'block', lg: 'none' } }}
            >
              <Badge badgeContent={cart.length} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
            <IconButton sx={{ display: { xs: 'none', lg: 'block' } }}>
              <Badge badgeContent={cart.length} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
            <IconButton sx={{ display: { xs: 'none', sm: 'block' } }}>
              <SettingsIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        {/* Mobile Search Bar */}
        <Box sx={{ p: 2, display: { xs: 'block', sm: 'none' } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search for products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>
        
        {/* Products Grid */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          <Grid container spacing={2}>
            {filteredProducts.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    sx={{
                      cursor: 'pointer',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: product.color || '#f5f5f5',
                      '&:hover': {
                        boxShadow: 6
                      }
                    }}
                    onClick={() => handleProductClick(product)}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={product.image}
                      alt={product.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {product.name}
                      </Typography>
                      <Typography variant="h6" color="text.primary">
                        ${parseFloat(product.price).toFixed(2)}
                      </Typography>
                      {product.stock && (
                        <Chip
                          label={`Stock: ${product.stock}`}
                          size="small"
                          color={product.stock > 10 ? 'success' : 'warning'}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
      
      {/* Desktop Right Sidebar - Cart */}
      <Box
        sx={{
          width: 380,
          bgcolor: 'background.paper',
          borderLeft: 1,
          borderColor: 'divider',
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column'
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">Current Order</Typography>
        </Box>
        
        {/* Cart Items */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {cart.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary">
                Cart is empty
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 1 }}>
              {cart.map((item) => (
                <ListItem key={item.id} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2">
                        {item.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        ${parseFloat(item.price).toFixed(2)} each
                      </Typography>
                    }
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="body1" sx={{ minWidth: 30, textAlign: 'center' }}>
                      {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="subtitle1" sx={{ minWidth: 60, textAlign: 'right' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
        
        {/* Order Summary */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>Order Summary</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Items ({totals.itemCount})</Typography>
            <Typography>${totals.subtotal}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Tax</Typography>
            <Typography>${totals.tax}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6" color="primary">
              ${totals.total}
            </Typography>
          </Box>
          
          {kioskNumber && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="h5" align="center" fontWeight="bold">
                Kiosk #{kioskNumber}
              </Typography>
              <Typography variant="caption" align="center" display="block">
                Order created successfully!
              </Typography>
            </Box>
          )}
          
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleKioskCheckout}
                disabled={cart.length === 0}
                startIcon={<ReceiptIcon />}
              >
                Finalize Checkout
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                color="warning"
                fullWidth
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Direct Payment
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleRequestClearCart}
                disabled={cart.length === 0}
              >
                Yes, Clear Cart
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
      
      {/* Clear Cart Dialog */}
      <Dialog
        open={clearCartDialogOpen}
        onClose={() => setClearCartDialogOpen(false)}
        aria-labelledby="confirm-clear-cart"
      >
        <DialogTitle id="confirm-clear-cart">Clear cart?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will remove all items from the cart. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearCartDialogOpen(false)}>Cancel</Button>
          <Button color="error" onClick={confirmClearCart} autoFocus>
           Yes, Clear Cart
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialog}
        onClose={() => setPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Total: ${totals.total}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              variant={paymentMethod === 'cash' ? 'contained' : 'outlined'}
              onClick={() => setPaymentMethod('cash')}
              startIcon={<MoneyIcon />}
            >
              Cash
            </Button>
            <Button
              variant={paymentMethod === 'card' ? 'contained' : 'outlined'}
              onClick={() => setPaymentMethod('card')}
              startIcon={<CreditCardIcon />}
            >
              Card
            </Button>
          </Box>
          
          {paymentMethod === 'cash' && (
            <>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {quickTenderAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outlined"
                    size="small"
                    onClick={() => handleQuickTender(amount)}
                  >
                    ${amount}
                  </Button>
                ))}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleQuickTender(parseFloat(totals.total))}
                >
                  Exact
                </Button>
              </Box>
              
              <TextField
                fullWidth
                label="Cash Given"
                type="number"
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                sx={{ mb: 2 }}
              />
              {cashGiven && (
                <Typography variant="h6" color={parseFloat(cashGiven) >= parseFloat(totals.total) ? 'success.main' : 'error.main'}>
                  Change: ${calculateChange()}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={processPayment}
            disabled={paymentMethod === 'cash' && (!cashGiven || parseFloat(cashGiven) < parseFloat(totals.total))}
          >
            Complete Payment
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Order Review Dialog (Finalize Order) */}
      <Dialog 
        open={orderReviewDialog} 
        onClose={() => setOrderReviewDialog(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            color: 'white',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#2d2d2d', borderBottom: '1px solid #3d3d3d' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon sx={{ color: '#ff9800' }} />
            <Box>
              <Typography variant="h6" fontWeight="bold">Finalize Order</Typography>
              <Typography variant="caption" sx={{ color: '#999' }}>
                Confirm items, capture customer info, and select a payment method.
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Grid container sx={{ minHeight: 500 }}>
            {/* Left Column - Order Items */}
            <Grid item xs={12} md={7} sx={{ p: 3, borderRight: '1px solid #3d3d3d' }}>
              {/* Customer Name */}
              <Typography variant="subtitle2" sx={{ color: '#999', mb: 1 }}>Customer Name</Typography>
              <TextField
                fullWidth
                placeholder="Enter customer name"
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
                required
                autoFocus
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#0d1117',
                    color: 'white',
                    '& fieldset': { borderColor: '#3d3d3d' },
                    '&:hover fieldset': { borderColor: '#4d4d4d' },
                    '&.Mui-focused fieldset': { borderColor: '#ff9800' }
                  }
                }}
              />
              
              {/* Order Items Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#999' }}>Order Items</Typography>
                <Button 
                  size="small" 
                  onClick={handleRequestClearCart}
                  sx={{ color: '#f44336', textTransform: 'none' }}
                  startIcon={<DeleteIcon />}
                >
                  CLEAR ALL
                </Button>
              </Box>
              
              {/* Items List */}
              <Box sx={{ 
                maxHeight: 300, 
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: '8px' },
                '&::-webkit-scrollbar-track': { bgcolor: '#2d2d2d' },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#4d4d4d', borderRadius: 1 }
              }}>
                <List sx={{ p: 0 }}>
                  {cart.map((item) => (
                    <ListItem
                      key={item.id}
                      sx={{
                        bgcolor: '#0d1117',
                        borderRadius: 1,
                        mb: 1,
                        p: 2,
                        border: '1px solid #3d3d3d'
                      }}
                    >
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">{item.name}</Typography>
                        <Typography variant="caption" sx={{ color: '#999' }}>Qty {item.quantity}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ color: '#ff9800', minWidth: 80, textAlign: 'right' }}>
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => removeFromCart(item.id)}
                          sx={{ color: '#666', '&:hover': { color: '#f44336' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Grid>
            
            {/* Right Column - Summary & Payment */}
            <Grid item xs={12} md={5} sx={{ p: 3, bgcolor: '#0d1117' }}>
              {/* Summary */}
              <Typography variant="h6" fontWeight="bold" gutterBottom>Summary</Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ color: '#999' }}>Items</Typography>
                  <Typography sx={{ color: '#999' }}>Items ({totals.itemCount})</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography sx={{ color: '#999' }}>Subtotal</Typography>
                  <Typography>${totals.subtotal}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h5" sx={{ color: '#ff9800' }}>Total Due</Typography>
                  <Typography variant="h5" sx={{ color: '#ff9800' }}>${totals.total}</Typography>
                </Box>
              </Box>
              
              {/* Cash Tendered */}
              {reviewPaymentMethod === 'cash' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: '#999', mb: 1 }}>Cash Tendered</Typography>
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    {[5, 10, 20, 50].map((amount) => (
                      <Grid item xs={3} key={amount}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => handleReviewQuickTender(amount)}
                          sx={{
                            borderColor: '#4d4d4d',
                            color: 'white',
                            py: 1,
                            '&:hover': { borderColor: '#6d6d6d', bgcolor: '#2d2d2d' }
                          }}
                        >
                          ${amount}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    <TextField
                      fullWidth
                      type="number"
                      value={reviewCashGiven}
                      onChange={(e) => setReviewCashGiven(e.target.value)}
                      placeholder="0"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#1a1a1a',
                          color: 'white',
                          fontSize: '3rem',
                          textAlign: 'center',
                          '& fieldset': { borderColor: '#3d3d3d' },
                          '& input': { textAlign: 'center' }
                        }
                      }}
                    />
                    {reviewCashGiven && (
                      <Button
                        size="small"
                        onClick={clearReviewCashGiven}
                        sx={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#f44336',
                          minWidth: 'auto',
                          px: 1
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </Box>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: parseFloat(reviewCashGiven || 0) >= parseFloat(totals.total) ? '#1a2d1a' : '#2d1a1a',
                    borderRadius: 1,
                    border: parseFloat(reviewCashGiven || 0) >= parseFloat(totals.total) ? '1px solid #4d6d4d' : '1px solid #4d3d3d',
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ color: parseFloat(reviewCashGiven || 0) >= parseFloat(totals.total) ? '#99ff99' : '#ff9999' }}>
                        Amount Due
                      </Typography>
                      <Typography sx={{ color: parseFloat(reviewCashGiven || 0) >= parseFloat(totals.total) ? '#99ff99' : '#ff9999' }}>
                        ${totals.total}
                      </Typography>
                    </Box>
                    {reviewCashGiven && parseFloat(reviewCashGiven) >= parseFloat(totals.total) && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #4d6d4d' }}>
                        <Typography sx={{ color: '#4caf50', fontWeight: 'bold' }}>Change</Typography>
                        <Typography sx={{ color: '#4caf50', fontWeight: 'bold', fontSize: '1.2rem' }}>
                          ${calculateReviewChange()}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {reviewPaymentMethod === 'card' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: '#999', mb: 1 }}>Monies Tendered</Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={reviewCardTendered}
                    onChange={(e) => setReviewCardTendered(e.target.value)}
                    placeholder="Enter amount tendered"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#1a1a1a',
                        color: 'white',
                        fontSize: '2rem',
                        textAlign: 'center',
                        '& fieldset': { borderColor: '#3d3d3d' },
                        '& input': { textAlign: 'center' }
                      }
                    }}
                  />
                </Box>
              )}
              
              {/* Payment Buttons */}
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleFinalizeCash}
                    startIcon={<MoneyIcon />}
                    sx={{
                      bgcolor: '#ff9800',
                      color: 'white',
                      py: 1.5,
                      borderRadius: 3,
                      '&:hover': { bgcolor: '#f57c00' }
                    }}
                  >
                    Finalize w/ Cash
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleFinalizeCard}
                    startIcon={<CreditCardIcon />}
                    sx={{
                      bgcolor: '#2196f3',
                      color: 'white',
                      py: 1.5,
                      borderRadius: 3,
                      '&:hover': { bgcolor: '#1976d2' }
                    }}
                  >
                    Finalize w/ Card
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#2d2d2d', borderTop: '1px solid #3d3d3d', p: 2, justifyContent: 'space-between' }}>
          <Button 
            onClick={() => setOrderReviewDialog(false)}
            sx={{ color: '#999' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={createKioskOrder}
            size="large"
            sx={{
              bgcolor: '#ff9800',
              color: 'white',
              px: 4,
              '&:hover': { bgcolor: '#f57c00' }
            }}
          >
            Add as Kiosk Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mobile Cart Drawer */}
      <Drawer
        anchor="right"
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: '100%',
            maxWidth: 400
          }
        }}
      >
        <Box
          sx={{
            width: '100%',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">Current Order</Typography>
            <IconButton onClick={() => setCartDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* Cart Items */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {cart.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary">
                  Cart is empty
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 1 }}>
                {cart.map((item) => (
                  <ListItem key={item.id} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2">
                          {item.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          ${parseFloat(item.price).toFixed(2)} each
                        </Typography>
                      }
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body1" sx={{ minWidth: 30, textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="subtitle1" sx={{ minWidth: 60, textAlign: 'right' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
          
          {/* Order Summary */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>Order Summary</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Items ({totals.itemCount})</Typography>
              <Typography>${totals.subtotal}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Tax</Typography>
              <Typography>${totals.tax}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="primary">
                ${totals.total}
              </Typography>
            </Box>
            
            {kioskNumber && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="h5" align="center" fontWeight="bold">
                  Kiosk #{kioskNumber}
                </Typography>
                <Typography variant="caption" align="center" display="block">
                  Order created successfully!
                </Typography>
              </Box>
            )}
            
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={handleKioskCheckout}
                  disabled={cart.length === 0}
                  startIcon={<ReceiptIcon />}
                >
                  Finalize Checkout
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  color="warning"
                  fullWidth
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                >
                  Direct Payment
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleRequestClearCart}
                  disabled={cart.length === 0}
                >
                  Clear Cart
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Drawer>

      {/* QR Code Share Dialog */}
      <ShareQRCode
        open={qrCodeDialogOpen}
        onClose={() => setQrCodeDialogOpen(false)}
        storeGuid={storeGuid}
        label={label}
      />

      {/* Menu Manager Dialog */}
      <MenuManager
        open={menuManagerOpen}
        onClose={() => setMenuManagerOpen(false)}
      />

      {/* Kiosk Order Success Dialog */}
      <Dialog
        open={kioskOrderSuccessDialog}
        onClose={() => {
          setKioskOrderSuccessDialog(false);
          setCompletedKioskOrder(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1e1e1e',
            color: 'white',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#ff9800', 
          color: 'white', 
          textAlign: 'center',
          py: 3
        }}>
          <Typography variant="h4" fontWeight="bold">
            🎉 Order Created!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 4 }}>
          {completedKioskOrder && (
            <Box sx={{ textAlign: 'center' }}>
              {/* Order ID */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" color="#999" gutterBottom>
                  Order Number
                </Typography>
                <Typography 
                  variant="h3" 
                  fontWeight="bold" 
                  color="#ff9800"
                >
                  {completedKioskOrder.orderNumber}
                </Typography>
              </Box>

              {/* Kiosk Number - Primary Display */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" color="#999" gutterBottom>
                  Kiosk Number
                </Typography>
                <Typography 
                  variant="h1" 
                  fontWeight="bold" 
                  color="white"
                  sx={{ fontSize: '4rem' }}
                >
                  #{completedKioskOrder.kioskNumber}
                </Typography>
              </Box>

              {/* QR Code */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                my: 3,
                p: 3,
                bgcolor: 'white',
                borderRadius: 2
              }}>
                <QRCodeSVG
                  value={`${window.location.origin}/${label}/${completedKioskOrder.orderNumber}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </Box>

              {/* QR Code Instructions */}
              <Typography variant="body2" color="#999" sx={{ mb: 2 }}>
                Scan this QR code to track your order
              </Typography>

              {/* Order Details */}
              <Divider sx={{ my: 3, borderColor: '#3d3d3d' }} />
              <Box sx={{ textAlign: 'left', px: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" color="#999">
                    Order Name:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {completedKioskOrder.orderName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" color="#999">
                    Total:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="#4caf50">
                    ${completedKioskOrder.total}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          bgcolor: '#2d2d2d', 
          borderTop: '1px solid #3d3d3d', 
          p: 3,
          justifyContent: 'center'
        }}>
          <Button
            variant="contained"
            onClick={() => {
              setKioskOrderSuccessDialog(false);
              setCompletedKioskOrder(null);
            }}
            size="large"
            sx={{
              bgcolor: '#ff9800',
              color: 'white',
              px: 6,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#f57c00' }
            }}
          >
            Got It!
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default POSInterface;
