import React, { useState, useEffect, useCallback } from 'react';
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
  Movie as MovieIconComponent,
  Person as PersonIcon,
  TableRestaurant as TableIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore';
import { useStoreContext } from '../contexts/StoreContext';
import { IS_PHP_BACKEND, resolveProductImageUrl } from '../config/api';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import ShareQRCode from '../components/ShareQRCode';
import MenuManager from '../components/MenuManager';
import CategoriesEditor from '../components/CategoriesEditor';
import Sidebar from '../components/Sidebar';
import ServerStatusIndicator from '../components/ServerStatusIndicator';
import { useThemeTokens } from '../App';
import { generateOrderTrackingUrl, detectLanIP, getLanIP, setLanIP, isDomainName } from '../utils/urlHelper';

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
  const [kioskOrderQrUrl, setKioskOrderQrUrl] = useState('');
  
  // Active orders bar state
  const [activeOrders, setActiveOrders] = useState([]);
  const [activeOrdersLoading, setActiveOrdersLoading] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedActiveOrder, setSelectedActiveOrder] = useState(null);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  // Detect LAN IP on mount for QR code sharing
  useEffect(() => {
    const initLanIP = async () => {
      if (!isDomainName(window.location.hostname) && !getLanIP()) {
        const ip = await detectLanIP();
        if (ip) {
          setLanIP(ip);
          console.log('POSInterface: Detected LAN IP:', ip);
        }
      }
    };
    initLanIP();
  }, []);
  
  // Generate kiosk order QR URL when order is completed
  useEffect(() => {
    if (completedKioskOrder) {
      setKioskOrderQrUrl(generateOrderTrackingUrl({ 
        label, 
        orderNumber: completedKioskOrder.orderNumber 
      }));
    }
  }, [completedKioskOrder, label]);
  
  const cart = useStore((state) => state.cart);
  const addToCart = useStore((state) => state.addToCart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const updateCartItemQuantity = useStore((state) => state.updateCartItemQuantity);
  const clearCart = useStore((state) => state.clearCart);
  const getCartTotal = useStore((state) => state.getCartTotal);
  
  const { products, productsLoading, createOrder, categories: storeCategories } = useStoreContext();
  const { emitOrderUpdate, socket, isConnected } = useSocket();
  
  // Fetch active orders for the order bar
  const fetchActiveOrders = useCallback(async () => {
    if (!storeGuid) return;
    
    try {
      setActiveOrdersLoading(true);
      let response;
      if (IS_PHP_BACKEND) {
        response = await axios.get('/orders/get.php', {
          params: { storeGuid }
        });
      } else {
        response = await axios.get(`/orders/${storeGuid}`);
      }
      
      const { data } = response;
      // Filter for active orders (pending or active status)
      const orders = data.orders.filter(order => 
        order.status === 'pending' || order.status === 'active'
      );
      setActiveOrders(orders);
    } catch (error) {
      console.error('Failed to fetch active orders:', error);
    } finally {
      setActiveOrdersLoading(false);
    }
  }, [storeGuid]);
  
  // Load active orders on mount
  useEffect(() => {
    fetchActiveOrders();
  }, [fetchActiveOrders]);
  
  // WebSocket real-time updates for orders
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const handleOrderCreated = (order) => {
      if (order.status === 'pending' || order.status === 'active') {
        setActiveOrders(prev => [order, ...prev]);
      }
    };
    
    const handleOrderUpdate = ({ action, order }) => {
      if (action === 'statusUpdate') {
        if (order.status === 'pending' || order.status === 'active') {
          setActiveOrders(prev => {
            const idx = prev.findIndex(o => o.id === order.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = order;
              return updated;
            }
            return [order, ...prev];
          });
        } else {
          setActiveOrders(prev => prev.filter(o => o.id !== order.id));
        }
      }
    };
    
    socket.on('order-created', handleOrderCreated);
    socket.on('orderUpdate', handleOrderUpdate);
    
    return () => {
      socket.off('order-created', handleOrderCreated);
      socket.off('orderUpdate', handleOrderUpdate);
    };
  }, [socket, isConnected]);
  
  // Filter active orders based on search
  const filteredActiveOrders = activeOrders.filter(order => {
    if (!orderSearchQuery) return true;
    const searchLower = orderSearchQuery.toLowerCase();
    return (
      order.order_name?.toLowerCase().includes(searchLower) ||
      order.order_id?.toLowerCase().includes(searchLower) ||
      order.kiosk_number?.toString().includes(orderSearchQuery)
    );
  });
  
  // Handle selecting an active order
  const handleSelectActiveOrder = (order) => {
    setSelectedActiveOrder(order);
    // Navigate to active orders page with this order's name in the search
    const searchName = order.order_name || order.kiosk_number?.toString() || '';
    navigate(`/${storeGuid}/${label}/active-orders?search=${encodeURIComponent(searchName)}`);
  };
  
  // Clear order selection
  const handleClearOrderSelection = () => {
    setSelectedActiveOrder(null);
    setOrderSearchQuery('');
  };
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
    const searchKey = (searchQuery || '').toLowerCase();
    const matchesSearch = name.includes(searchKey);
    
    // Use categories array for filtering (supports multi-category)
    const productCategories = Array.isArray(product.categories) 
      ? product.categories.map(c => c.toLowerCase())
      : [product.category?.toLowerCase() || 'all'];
    const matchesCategory = selectedCategory === 'all' || productCategories.includes(selectedCategory?.toLowerCase());
    
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


  // Get extended theme tokens for background modes
  const themeTokens = useThemeTokens();
  
  // Calculate background styles based on theme tokens
  const getMainBackgroundStyles = () => {
    if (!themeTokens) return { bgcolor: 'background.default' };
    
    const { backgroundMode, backgroundImage, glassOpacity } = themeTokens;
    
    if (backgroundMode === 'image' && backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      };
    }
    
    if (backgroundMode === 'gradient') {
      return {
        background: `linear-gradient(135deg, ${themeTokens.primaryColor} 0%, ${themeTokens.backgroundColor} 100%)`
      };
    }
    
    if (backgroundMode === 'glass') {
      return {
        bgcolor: 'background.default',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backdropFilter: 'blur(12px)',
          backgroundColor: `rgba(255, 255, 255, ${glassOpacity})`,
          zIndex: -1
        }
      };
    }
    
    return { bgcolor: 'background.default' };
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Active Orders Bar - Full Width at Top */}
      <Box
        sx={{
          bgcolor: '#1a1a1a',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          px: 1,
          py: 0.5,
          gap: 1,
          minHeight: 48,
          width: '100vw',
          flexShrink: 0,
          zIndex: 1200
        }}
      >
        {/* Close/Clear Button */}
        <IconButton
          size="small"
          onClick={handleClearOrderSelection}
          sx={{
            bgcolor: 'rgba(255,255,255,0.1)',
            color: 'grey.400',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            flexShrink: 0
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        
        {/* Search Filter */}
        <TextField
          size="small"
          placeholder="Search orders..."
          value={orderSearchQuery}
          onChange={(e) => setOrderSearchQuery(e.target.value)}
          sx={{
            width: { xs: 120, sm: 150 },
            flexShrink: 0,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '0.75rem',
              height: 36,
              '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
              '&.Mui-focused fieldset': { borderColor: 'primary.main' }
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'grey.500',
              opacity: 1
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'grey.500', fontSize: 18 }} />
              </InputAdornment>
            )
          }}
        />
        
        {/* Orders Scroll Container */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            py: 0.5,
            '&::-webkit-scrollbar': {
              height: 4
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'rgba(255,255,255,0.1)',
              borderRadius: 2
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'primary.main',
              borderRadius: 2
            }
          }}
        >
          {activeOrdersLoading ? (
            <Typography variant="caption" sx={{ color: 'grey.500', px: 2 }}>
              Loading orders...
            </Typography>
          ) : filteredActiveOrders.length === 0 ? (
            <Typography variant="caption" sx={{ color: 'grey.500', px: 2 }}>
              {orderSearchQuery ? 'No matching orders' : 'No active orders'}
            </Typography>
          ) : (
            filteredActiveOrders.map((order, index) => (
              <Box
                key={order.id || order.order_id}
                onClick={() => handleSelectActiveOrder(order)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 56,
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: 1,
                  bgcolor: selectedActiveOrder?.id === order.id 
                    ? 'primary.main' 
                    : 'rgba(255,255,255,0.05)',
                  border: 2,
                  borderColor: selectedActiveOrder?.id === order.id 
                    ? 'primary.light' 
                    : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: selectedActiveOrder?.id === order.id 
                      ? 'primary.main' 
                      : 'rgba(255,255,255,0.1)',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                {/* Order Icon with Number */}
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <TableIcon sx={{ color: 'grey.400', fontSize: 24 }} />
                </Box>
                {/* Order Name */}
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontSize: '0.6rem',
                    maxWidth: 52,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'center'
                  }}
                >
                  {order.order_name || `#${order.kiosk_number || index + 1}`}
                </Typography>
              </Box>
            ))
          )}
        </Box>
        
        {/* Fullscreen Toggle Button */}
        <IconButton
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(err => {
                toast.error('Fullscreen not supported');
              });
            } else {
              document.exitFullscreen();
            }
          }}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' },
            flexShrink: 0
          }}
        >
          {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      </Box>

      {/* Main Layout Container */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', ...getMainBackgroundStyles() }}>
        {/* Desktop/Tablet Sidebar - narrower on tablets */}
        <Box
          sx={{
            width: { md: 220, lg: 280 },
            minWidth: { md: 180 },
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            flexShrink: 0,
            height: '100%',
            overflow: 'auto'
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
            width: { xs: 280, sm: 300 },
            maxWidth: '85vw',
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
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
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

            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                flexGrow: { xs: 1, sm: 0 }, 
                fontWeight: 'bold',
                fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              My Business
            </Typography>
            <TextField
              size="small"
              placeholder="Search for products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ 
                width: { xs: 0, sm: 180, md: 280, lg: 400 }, 
                mr: { sm: 1, md: 2 },
                display: { xs: 'none', sm: 'block' },
                flexShrink: 1
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
                mr: { md: 1, lg: 2 },
                display: { xs: 'none', md: 'inline-flex' },
                px: { md: 1.5, lg: 2 },
                fontSize: { md: '0.75rem', lg: '0.875rem' },
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
            <Box sx={{ display: 'flex', alignItems: 'center', mr: { xs: 1, sm: 1.5, md: 2 }, minWidth: { xs: 100, sm: 120, md: 150 } }}>
              <ServerStatusIndicator />
            </Box>
            {/* Mobile Cart Button - visible when cart sidebar is hidden */}
            <IconButton
              onClick={() => setCartDrawerOpen(true)}
              sx={{ display: { xs: 'flex', md: 'none' } }}
              aria-label="Open cart"
            >
              <Badge badgeContent={cart.length} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
            {/* Tablet/Desktop Cart Icon - visible when cart sidebar is shown */}
            <IconButton sx={{ display: { xs: 'none', md: 'flex' } }} aria-label="Shopping cart">
              <Badge badgeContent={cart.length} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
            <IconButton sx={{ display: { xs: 'none', sm: 'flex' } }} aria-label="Settings">
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
        
        {/* Products Grid - optimized for iPad (768px portrait, 1024px landscape) */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: { xs: 1.5, sm: 2 },
          '&::-webkit-scrollbar': {
            width: 14,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'action.hover',
            borderRadius: 2,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'grey.500',
            borderRadius: 2,
            border: '3px solid transparent',
            backgroundClip: 'padding-box',
            '&:hover': {
              bgcolor: 'grey.700',
            },
          },
        }}>
          <Grid container spacing={1}>
            {filteredProducts.map((product) => (
              <Grid item xs={4} sm={3} md={2.4} lg={2} key={product.id}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
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
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      overflow: 'hidden',
                      boxShadow: 1,
                      '&:hover': {
                        boxShadow: 3
                      }
                    }}
                    onClick={() => handleProductClick(product)}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        paddingTop: '100%',
                        bgcolor: 'grey.100'
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={resolveProductImageUrl(product.image)}
                        alt={product.name}
                        sx={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                    <Box sx={{ p: 0.75, bgcolor: 'background.paper' }}>
                      <Typography 
                        variant="body2"
                        sx={{
                          fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                          lineHeight: 1.2,
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          minHeight: { xs: '1.5em', sm: '1.7em' },
                          color: 'text.primary'
                        }}
                      >
                        {product.name}
                      </Typography>
                    </Box>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
        
        {/* Persistent Cart Summary Bar - visible on mobile only when cart sidebar is hidden */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            borderTop: 2,
            borderColor: 'primary.main',
            p: { xs: 1, sm: 1.5 },
            gap: 1,
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
            zIndex: 10
          }}
        >
          {/* Cart Items Preview */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <Badge badgeContent={cart.length} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}>
              <ShoppingCartIcon sx={{ color: 'primary.main', fontSize: { xs: 24, sm: 28 } }} />
            </Badge>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              {cart.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                  Cart empty
                </Typography>
              ) : (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cart.slice(0, 3).map(item => `${item.name} x${item.quantity}`).join(', ')}
                  {cart.length > 3 && ` +${cart.length - 3} more`}
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* Total */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, display: 'block' }}>
                Total
              </Typography>
              <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' }, lineHeight: 1 }}>
                ${totals.total}
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => setCartDrawerOpen(true)}
              sx={{ 
                minWidth: { xs: 'auto', sm: 100 },
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.75, sm: 1 },
                fontSize: { xs: '0.7rem', sm: '0.8rem' }
              }}
            >
              {cart.length > 0 ? 'View Cart' : 'Open Cart'}
            </Button>
          </Box>
        </Box>
      </Box>
      
      {/* Right Sidebar - Cart (visible on tablets and desktop) */}
      <Box
        component="aside"
        sx={{
          width: { md: 260, lg: 300, xl: 340 },
          minWidth: { md: 220 },
          bgcolor: 'background.paper',
          borderLeft: 1,
          borderColor: 'divider',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          flexShrink: 0,
          height: '100%',
          maxHeight: '100%',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: { md: 1.5, lg: 2 }, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" component="h2" fontWeight="bold" sx={{ fontSize: { md: '1rem', lg: '1.25rem' } }}>Current Order</Typography>
        </Box>
        
        {/* Cart Items - Scrollable with fat scrollbar */}
        <Box sx={{ 
          flex: '1 1 0',
          overflow: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          maxHeight: { md: 'calc(100% - 280px)', lg: 'calc(100% - 220px)' },
          '&::-webkit-scrollbar': {
            width: { xs: 12, md: 14, lg: 10 },
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'action.hover',
            borderRadius: 2,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'primary.main',
            borderRadius: 2,
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          },
        }}>
          {cart.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <ShoppingCartIcon sx={{ fontSize: { md: 40, lg: 56 }, color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { md: '0.75rem', lg: '0.875rem' } }}>
                Cart is empty
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: { md: 0.5, lg: 1 } }}>
              {cart.map((item) => (
                <ListItem 
                  key={item.id} 
                  sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    py: { md: 0.5, lg: 1 },
                    px: { md: 1, lg: 2 },
                    flexDirection: { md: 'column', lg: 'row' },
                    alignItems: { md: 'stretch', lg: 'center' },
                    gap: { md: 0.5, lg: 0 }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" sx={{ fontSize: { md: '0.75rem', lg: '0.875rem' } }}>
                        {item.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { md: '0.65rem', lg: '0.75rem' } }}>
                        ${parseFloat(item.price).toFixed(2)} each
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { md: 0.5, lg: 1 }, justifyContent: { md: 'space-between', lg: 'flex-end' } }}>
                    <IconButton
                      size="small"
                      onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      sx={{ p: { md: 0.25, lg: 0.5 } }}
                    >
                      <RemoveIcon sx={{ fontSize: { md: 16, lg: 20 } }} />
                    </IconButton>
                    <Typography variant="body1" sx={{ minWidth: { md: 20, lg: 30 }, textAlign: 'center', fontSize: { md: '0.8rem', lg: '1rem' } }}>
                      {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                      sx={{ p: { md: 0.25, lg: 0.5 } }}
                    >
                      <AddIcon sx={{ fontSize: { md: 16, lg: 20 } }} />
                    </IconButton>
                    <Typography variant="subtitle1" sx={{ minWidth: { md: 45, lg: 60 }, textAlign: 'right', fontSize: { md: '0.8rem', lg: '1rem' } }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Remove item"
                      sx={{ p: { md: 0.25, lg: 0.5 } }}
                    >
                      <DeleteIcon sx={{ fontSize: { md: 16, lg: 20 } }} />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
        
        {/* Order Summary - Fixed at bottom */}
        <Box sx={{ 
          p: { md: 1, lg: 1.5 }, 
          borderTop: 3, 
          borderColor: 'primary.main', 
          flexShrink: 0, 
          bgcolor: 'background.paper',
          mt: 'auto',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.15)'
        }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { md: '0.85rem', lg: '1rem' }, mb: { md: 0.25, lg: 0.5 } }}>Order Summary</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { md: 0.25, lg: 0.5 } }}>
            <Typography sx={{ fontSize: { md: '0.7rem', lg: '0.85rem' } }}>Items ({totals.itemCount})</Typography>
            <Typography sx={{ fontSize: { md: '0.7rem', lg: '0.85rem' } }}>${totals.subtotal}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { md: 0.25, lg: 0.5 } }}>
            <Typography sx={{ fontSize: { md: '0.7rem', lg: '0.85rem' } }}>Tax</Typography>
            <Typography sx={{ fontSize: { md: '0.7rem', lg: '0.85rem' } }}>${totals.tax}</Typography>
          </Box>
          <Divider sx={{ my: { md: 0.25, lg: 0.5 } }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { md: 0.5, lg: 1 } }}>
            <Typography variant="h6" sx={{ fontSize: { md: '0.9rem', lg: '1.1rem' } }}>Total</Typography>
            <Typography variant="h6" color="primary" fontWeight="bold" sx={{ fontSize: { md: '0.9rem', lg: '1.1rem' } }}>
              ${totals.total}
            </Typography>
          </Box>
          
          {kioskNumber && (
            <Box sx={{ mb: { md: 0.5, lg: 1 }, p: { md: 1, lg: 1.5 }, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="h6" align="center" fontWeight="bold" sx={{ fontSize: { md: '0.9rem', lg: '1.1rem' } }}>
                Kiosk #{kioskNumber}
              </Typography>
              <Typography variant="caption" align="center" display="block" sx={{ fontSize: { md: '0.6rem', lg: '0.7rem' } }}>
                Order created!
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: { md: 1, lg: 1 }, flexDirection: { md: 'column', lg: 'row' } }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handleKioskCheckout}
              disabled={cart.length === 0}
              startIcon={<ReceiptIcon sx={{ fontSize: { md: 20, lg: 18 } }} />}
              sx={{ 
                py: { md: 1.5, lg: 0.75 },
                fontSize: { md: '1rem', lg: '0.8rem' },
                flex: { lg: 2 },
                minHeight: { md: 48 }
              }}
            >
              Checkout
            </Button>
            <Button
              variant="outlined"
              size="medium"
              fullWidth
              onClick={handleRequestClearCart}
              disabled={cart.length === 0}
              sx={{
                borderColor: 'error.main',
                color: 'error.main',
                py: { md: 1, lg: 0.75 },
                fontSize: { md: '0.85rem', lg: '0.75rem' },
                flex: { lg: 1 },
                minWidth: { md: 'auto' },
                minHeight: { md: 40 },
                '&:hover': {
                  borderColor: 'error.dark',
                  bgcolor: 'action.hover',
                },
              }}
            >
              Clear
            </Button>
          </Box>
        </Box>
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
      
      {/* Order Review Dialog (Finalize Order) - iPad optimized */}
      <Dialog 
        open={orderReviewDialog} 
        onClose={() => setOrderReviewDialog(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderRadius: 2,
            m: { xs: 1, sm: 2 },
            maxHeight: { xs: 'calc(100vh - 16px)', sm: 'calc(100vh - 32px)' },
            width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 32px)' }
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
        <DialogContent sx={{ p: 0, overflow: 'auto' }}>
          <Grid container sx={{ minHeight: { xs: 'auto', md: 500 } }}>
            {/* Left Column - Order Items */}
            <Grid item xs={12} md={7} sx={{ p: { xs: 2, sm: 3 }, borderRight: { md: 1 }, borderBottom: { xs: 1, md: 0 }, borderColor: 'divider' }}>
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
            <Grid item xs={12} md={5} sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default' }}>
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

      {/* Mobile Cart Drawer - only for phones */}
      <Drawer
        anchor="right"
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: '85%' },
            maxWidth: { xs: '100%', sm: 400 }
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
          
          {/* Cart Items - with fat scrollbar for mobile */}
          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: 16,
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'action.hover',
              borderRadius: 2,
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'primary.main',
              borderRadius: 2,
              border: '3px solid transparent',
              backgroundClip: 'padding-box',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            },
          }}>
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
          
          {/* Order Summary - Sticky at bottom */}
          <Box sx={{ 
            p: 2, 
            borderTop: 3, 
            borderColor: 'primary.main',
            flexShrink: 0,
            mt: 'auto',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.15)'
          }}>
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
                  value={kioskOrderQrUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </Box>

              {/* URL Display */}
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary', 
                  wordBreak: 'break-all',
                  display: 'block',
                  mb: 2,
                  fontFamily: 'monospace',
                  bgcolor: 'background.default',
                  p: 1,
                  borderRadius: 1
                }}
              >
                {kioskOrderQrUrl}
              </Typography>

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
