import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
  Close as CloseIcon,
  Store as StoreIcon,
  Storefront as StorefrontIcon,
  ShoppingBag as ShoppingBagIcon,
  LocalMall as LocalMallIcon,
  PointOfSale as PointOfSaleIcon,
  Inventory2 as Inventory2Icon,
  LocalCafe as CafeIcon,
  LocalBar as BarIcon,
  Icecream as IcecreamIcon,
  BakeryDining as BakeryIcon,
  RamenDining as RamenIcon,
  LocalPizza as PizzaIcon,
  Liquor as LiquorIcon,
  TwoWheeler as TwoWheelerIcon,
  LocalShipping as ShippingIcon,
  Build as BuildIcon,
  Handyman as HandymanIcon,
  Construction as ConstructionIcon,
  MiscellaneousServices as MiscServicesIcon,
  HealthAndSafety as HealthIcon,
  LocalPharmacy as PharmacyIcon,
  MedicalServices as MedicalServicesIcon,
  Spa as SpaIcon,
  FitnessCenter as FitnessIcon,
  PhoneIphone as PhoneIcon,
  Computer as ComputerIcon,
  Memory as MemoryIcon,
  Headphones as HeadphonesIcon,
  Devices as DevicesIcon,
  Home as HomeIcon,
  Chair as ChairIcon,
  Bed as BedIcon,
  Lightbulb as LightbulbIcon,
  Checkroom as CheckroomIcon,
  DryCleaning as DryCleaningIcon,
  SportsEsports as EsportsIcon,
  MusicNote as MusicNoteIcon,
  Movie as MovieIconComponent
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore';
import { useStoreContext } from '../contexts/StoreContext';
import { useSocket } from '../contexts/SocketContext';
import ShareQRCode from '../components/ShareQRCode';
import MenuManager from '../components/MenuManager';
import CategoriesEditor from '../components/CategoriesEditor';
import Sidebar from '../components/Sidebar';
import ServerStatusIndicator from '../components/ServerStatusIndicator';

const categories = [
  { id: 'all', name: 'All Products', icon: <AppsIcon />, color: 'primary.main' },
  { id: 'beverages', name: 'Beverages', icon: <DrinkIcon />, color: '#0ea5e9' },
  { id: 'snacks', name: 'Snacks', icon: <FoodIcon />, color: '#f97316' },
  { id: 'automotive', name: 'Automotive', icon: <CarIcon />, color: '#6b7280' },
  { id: 'frozen', name: 'Frozen', icon: <FrozenIcon />, color: '#22c55e' },
  { id: 'fuel', name: 'Fuel', icon: <GasIcon />, color: '#eab308' }
];

const POSInterface = () => {
  const navigate = useNavigate();
  const { storeGuid, label } = useParams();
  const location = useLocation();
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
  
  const { products, productsLoading, createOrder, categories: storeCategories } = useStoreContext();
  const { emitOrderUpdate } = useSocket();
  const [categoriesEditorOpen, setCategoriesEditorOpen] = useState(false);
  
  const pathname = location.pathname || '';
  const isInventoryRoute = pathname.endsWith('/inventory');

  const totals = getCartTotal();
  
  const categoriesSource = (storeCategories && storeCategories.length ? storeCategories : categories);
  const filteredCategories = categoriesSource.filter((cat) =>
    // Always keep "all" visible; otherwise respect the visible flag (default true)
    cat.id === 'all' || cat.visible !== false
  );

  const iconMap = {
    apps: <AppsIcon />,
    category: <CategoryIcon />,
    label: <LabelIcon />,

    store: <StoreIcon />,
    storefront: <StorefrontIcon />,
    shopping_cart: <ShoppingCartIcon />,
    shopping_bag: <ShoppingBagIcon />,
    local_mall: <LocalMallIcon />,
    local_offer: <DiscountIcon />,
    point_of_sale: <PointOfSaleIcon />,
    inventory_2: <Inventory2Icon />,

    restaurant: <RestaurantIcon />,
    local_drink: <DrinkIcon />,
    local_cafe: <CafeIcon />,
    local_bar: <BarIcon />,
    fastfood: <FoodIcon />,
    icecream: <IcecreamIcon />,
    bakery_dining: <BakeryIcon />,
    ramen_dining: <RamenIcon />,
    local_pizza: <PizzaIcon />,
    liquor: <LiquorIcon />,

    directions_car: <CarIcon />,
    two_wheeler: <TwoWheelerIcon />,
    ac_unit: <FrozenIcon />,
    local_gas_station: <GasIcon />,
    local_shipping: <ShippingIcon />,

    build: <BuildIcon />,
    handyman: <HandymanIcon />,
    construction: <ConstructionIcon />,
    miscellaneous_services: <MiscServicesIcon />,

    health_and_safety: <HealthIcon />,
    local_pharmacy: <PharmacyIcon />,
    medical_services: <MedicalServicesIcon />,
    spa: <SpaIcon />,
    fitness_center: <FitnessIcon />,

    phone_iphone: <PhoneIcon />,
    computer: <ComputerIcon />,
    memory: <MemoryIcon />,
    headphones: <HeadphonesIcon />,
    devices: <DevicesIcon />,

    home: <HomeIcon />,
    chair: <ChairIcon />,
    bed: <BedIcon />,
    lightbulb: <LightbulbIcon />,

    checkroom: <CheckroomIcon />,
    dry_cleaning: <DryCleaningIcon />,

    sports_esports: <EsportsIcon />,
    music_note: <MusicNoteIcon />,
    movie: <MovieIconComponent />
  };

  const sidebarCategories = filteredCategories.map((cat) => {
    let iconElement;

    if (typeof cat.icon === 'string') {
      iconElement = iconMap[cat.icon] || <CategoryIcon />;
    } else {
      iconElement = cat.icon || <CategoryIcon />;
    }

    return { ...cat, icon: iconElement };
  });

  const getCategoryForProduct = (product) => {
    const key = (product.category || '').toLowerCase();
    return categoriesSource.find((cat) =>
      (cat.id && cat.id.toLowerCase() === key) ||
      (cat.name && cat.name.toLowerCase() === key)
    );
  };
  
  useEffect(() => {
    console.log('[POSInterface] Mounted', { routeStoreGuid: storeGuid, routeLabel: label });
  }, []);

  useEffect(() => {
    console.log('[POSInterface] Route change detected', { pathname, isInventoryRoute });
    if (isInventoryRoute) {
      console.log('[POSInterface] Inventory route detected, opening MenuManager');
      setMenuManagerOpen(true);
    }
  }, [pathname, isInventoryRoute]);

  useEffect(() => {
    console.log('[POSInterface] Context/store values updated', {
      routeStoreGuid: storeGuid,
      routeLabel: label,
      productsCount: products.length,
      productsLoading,
      storeCategories,
    });
  }, [storeGuid, label, products, productsLoading, storeCategories]);
  
  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const name = (product.name || '').toLowerCase();
    const categoryKey = (product.category || '').toLowerCase();
    const searchKey = (searchQuery || '').toLowerCase();
    const matchesSearch = name.includes(searchKey);
    const matchesCategory = selectedCategory === 'all' || categoryKey === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  useEffect(() => {
    console.log('[POSInterface] Products filtering updated', {
      productsCount: products.length,
      filteredCount: filteredProducts.length,
      searchQuery,
      selectedCategory,
      sampleProducts: products.slice(0, 5),
      sampleFiltered: filteredProducts.slice(0, 5),
    });
  }, [products, filteredProducts, searchQuery, selectedCategory]);
  
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
        <Sidebar
          mobileDrawerOpen={mobileDrawerOpen}
          setMobileDrawerOpen={setMobileDrawerOpen}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={sidebarCategories}
          setCategoriesEditorOpen={setCategoriesEditorOpen}
          setMenuManagerOpen={setMenuManagerOpen}
        />
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
            bgcolor: 'background.paper'
          }
        }}
      >
        <Sidebar
          mobileDrawerOpen={mobileDrawerOpen}
          setMobileDrawerOpen={setMobileDrawerOpen}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={sidebarCategories}
          setCategoriesEditorOpen={setCategoriesEditorOpen}
          setMenuManagerOpen={setMenuManagerOpen}
        />
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
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

            <Typography variant="h5" component="h1" sx={{ flexGrow: { xs: 1, sm: 0 }, fontWeight: 'bold' }}>
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
                'aria-label': 'Search products',
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <Button
              variant="outlined"
              startIcon={<QrCodeIcon />}
              onClick={() => setQrCodeDialogOpen(true)}
              sx={(theme) => ({
                mr: 2,
                display: { xs: 'none', lg: 'inline-flex' },
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: theme.palette.action.hover,
                },
              })}
              aria-label="Share terminal"
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
              aria-label="Open cart"
            >
              <Badge badgeContent={cart.length} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
            <IconButton sx={{ display: { xs: 'none', lg: 'block' } }} aria-label="Shopping cart">
              <Badge badgeContent={cart.length} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
            <IconButton sx={{ display: { xs: 'none', sm: 'block' } }} aria-label="Settings">
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
              'aria-label': 'Search products',
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
                    role="button"
                    tabIndex={0}
                    aria-label={`Add ${product.name} to cart`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleProductClick(product);
                      }
                    }}
                    sx={{
                      cursor: 'pointer',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: product.color || 'background.paper',
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
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mt: 0.5
                        }}
                      >
                        <Typography variant="h6" color="text.primary">
                          ${parseFloat(product.price).toFixed(2)}
                        </Typography>
                        {(() => {
                          const catDef = getCategoryForProduct(product);
                          const chipColor = catDef?.color || 'background.paper';
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
                      {product.stock && (
                        <Chip
                          label={`Stock: ${product.stock}`}
                          size="small"
                          sx={(theme) => {
                            const bg =
                              product.stock > 10
                                ? theme.palette.success.main
                                : theme.palette.warning.main;
                            return {
                              mt: 1,
                              bgcolor: bg,
                              color: theme.palette.getContrastText(bg),
                            };
                          }}
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
        component="aside"
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
          <Typography variant="h6" component="h2" fontWeight="bold">Current Order</Typography>
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
                      aria-label="Decrease quantity"
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="body1" sx={{ minWidth: 30, textAlign: 'center' }}>
                      {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
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
                      aria-label="Remove item"
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
            <Grid item xs={12}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleRequestClearCart}
                disabled={cart.length === 0}
                sx={{
                  borderColor: 'error.main',
                  color: 'error.main',
                  '&:hover': {
                    borderColor: 'error.dark',
                    bgcolor: 'action.hover',
                  },
                }}
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
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="h6" fontWeight="bold">Finalize Order</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Confirm items, capture customer info, and select a payment method.
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Grid container sx={{ minHeight: 500 }}>
            {/* Left Column - Order Items */}
            <Grid item xs={12} md={7} sx={{ p: 3, borderRight: 1, borderColor: 'divider' }}>
              {/* Customer Name */}
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>Customer Name</Typography>
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
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    '& fieldset': { borderColor: 'divider' },
                    '&:hover fieldset': { borderColor: 'divider' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                  }
                }}
              />
              
              {/* Order Items Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Order Items</Typography>
                <Button 
                  size="small" 
                  onClick={handleRequestClearCart}
                  sx={{ color: 'error.main', textTransform: 'none' }}
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
                '&::-webkit-scrollbar-track': { bgcolor: 'background.default' },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'success.main', borderRadius: 1 }
              }}>
                <List sx={{ p: 0 }}>
                  {cart.map((item) => (
                    <ListItem
                      key={item.id}
                      sx={{
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        mb: 1,
                        p: 2,
                        border: 1, borderColor: 'divider'
                      }}
                    >
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">{item.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Qty {item.quantity}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ color: 'primary.main' }}>
                          ${parseFloat(item.price).toFixed(2)}
                        </Typography>
                        {(() => {
                          const catDef = getCategoryForProduct(item);
                          const chipColor = catDef?.color || 'divider';
                          return (
                        <Chip
                          label={item.category}
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
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Grid>
            
            {/* Right Column - Summary & Payment */}
            <Grid item xs={12} md={5} sx={{ p: 3, bgcolor: 'background.default' }}>
              {/* Summary */}
              <Typography variant="h6" fontWeight="bold" gutterBottom>Summary</Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ color: 'text.secondary' }}>Items</Typography>
                  <Typography sx={{ color: 'text.secondary' }}>Items ({totals.itemCount})</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography sx={{ color: 'text.secondary' }}>Subtotal</Typography>
                  <Typography>${totals.subtotal}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h5" sx={{ color: 'primary.main' }}>Total Due</Typography>
                  <Typography variant="h5" sx={{ color: 'primary.main' }}>${totals.total}</Typography>
                </Box>
              </Box>
              
              {/* Cash Tendered */}
              {reviewPaymentMethod === 'cash' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>Cash Tendered</Typography>
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    {[5, 10, 20, 50].map((amount) => (
                      <Grid item xs={3} key={amount}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => handleReviewQuickTender(amount)}
                          sx={{
                            borderColor: 'divider',
                            color: 'text.primary',
                            py: 1,
                            '&:hover': { borderColor: 'divider', bgcolor: 'background.default' }
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
                          bgcolor: 'background.paper',
                          color: 'text.primary',
                          fontSize: '3rem',
                          textAlign: 'center',
                          '& fieldset': { borderColor: 'divider' },
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
                          color: 'error.main',
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
                    bgcolor: parseFloat(reviewCashGiven || 0) >= parseFloat(totals.total) ? 'success.dark' : 'background.default',
                    borderRadius: 1,
                    border: 1,
                    borderColor: parseFloat(reviewCashGiven || 0) >= parseFloat(totals.total) ? 'success.main' : 'error.main',
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ color: parseFloat(reviewCashGiven || 0) >= parseFloat(totals.total) ? 'success.main' : 'error.main' }}>
                        Amount Due
                      </Typography>
                      <Typography sx={{ color: parseFloat(reviewCashGiven || 0) >= parseFloat(totals.total) ? 'success.main' : 'error.main' }}>
                        ${totals.total}
                      </Typography>
                    </Box>
                    {reviewCashGiven && parseFloat(reviewCashGiven) >= parseFloat(totals.total) && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'success.main' }}>
                        <Typography sx={{ color: 'success.main', fontWeight: 'bold' }}>Change</Typography>
                        <Typography sx={{ color: 'success.main', fontWeight: 'bold', fontSize: '1.2rem' }}>
                          ${calculateReviewChange()}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {reviewPaymentMethod === 'card' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>Monies Tendered</Typography>
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
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        fontSize: '2rem',
                        textAlign: 'center',
                        '& fieldset': { borderColor: 'divider' },
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
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      py: 1.5,
                      borderRadius: 3,
                      '&:hover': { bgcolor: 'primary.dark' }
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
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      py: 1.5,
                      borderRadius: 3,
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                  >
                    Finalize w/ Card
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.default', borderTop: 1, borderColor: 'divider', p: 2, justifyContent: 'space-between' }}>
          <Button 
            onClick={() => setOrderReviewDialog(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={createKioskOrder}
            size="large"
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              px: 4,
              '&:hover': { bgcolor: 'primary.dark' }
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
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleRequestClearCart}
                  disabled={cart.length === 0}
                  sx={{
                    borderColor: 'error.main',
                    color: 'error.main',
                    '&:hover': {
                      borderColor: 'error.dark',
                      bgcolor: 'action.hover',
                    },
                  }}
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
        inventoryMode={isInventoryRoute}
      />

      <CategoriesEditor
        open={categoriesEditorOpen}
        onClose={() => setCategoriesEditorOpen(false)}
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
            bgcolor: 'background.default',
            color: 'text.primary',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText', 
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
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Order Number
                </Typography>
                <Typography 
                  variant="h3" 
                  fontWeight="bold" 
                  color="primary.main"
                >
                  {completedKioskOrder.orderNumber}
                </Typography>
              </Box>

              {/* Kiosk Number - Primary Display */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Kiosk Number
                </Typography>
                <Typography 
                  variant="h1" 
                  fontWeight="bold" 
                  color="text.primary"
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
                bgcolor: 'background.paper',
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Scan this QR code to track your order
              </Typography>

              {/* Order Details */}
              <Divider sx={{ my: 3, borderColor: 'divider' }} />
              <Box sx={{ textAlign: 'left', px: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" color="text.secondary">
                    Order Name:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {completedKioskOrder.orderName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" color="text.secondary">
                    Total:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    ${completedKioskOrder.total}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          bgcolor: 'background.default', 
          borderTop: 1, 
          borderColor: 'divider', 
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
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              px: 6,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              '&:hover': { bgcolor: 'primary.dark' }
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
