import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Checkbox,
  LinearProgress,
  Avatar,
  CircularProgress,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  AccessTime as TimeIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CardIcon,
  Refresh as RefreshIcon,
  ShoppingBag as ShoppingBagIcon,
  Restaurant as RestaurantIcon,
  Fastfood as FastfoodIcon,
  CheckCircleOutline as ReadyIcon,
  History as HistoryIcon,
  QrCode2 as QrCodeIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { IS_PHP_BACKEND } from '../config/api';
import { useSocket } from '../contexts/SocketContext';
import ShareQRCode from '../components/ShareQRCode';
import { QRCodeSVG } from 'qrcode.react';
import { generateOrderTrackingUrl, detectLanIP, getLanIP, setLanIP, isDomainName } from '../utils/urlHelper';

const ActiveOrders = () => {
  const navigate = useNavigate();
  const { storeGuid, label } = useParams();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashGiven, setCashGiven] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [orderQrDialogOpen, setOrderQrDialogOpen] = useState(false);
  const [selectedOrderForQr, setSelectedOrderForQr] = useState(null);
  const [orderQrUrl, setOrderQrUrl] = useState('');
  const { socket, isConnected } = useSocket();
  
  // Detect LAN IP on mount for QR code sharing
  useEffect(() => {
    const initLanIP = async () => {
      if (!isDomainName(window.location.hostname) && !getLanIP()) {
        const ip = await detectLanIP();
        if (ip) {
          setLanIP(ip);
          console.log('ActiveOrders: Detected LAN IP:', ip);
        }
      }
    };
    initLanIP();
  }, []);
  
  // Generate order QR URL when order is selected
  useEffect(() => {
    if (selectedOrderForQr) {
      setOrderQrUrl(generateOrderTrackingUrl({ 
        label, 
        orderNumber: selectedOrderForQr.order_id 
      }));
    }
  }, [selectedOrderForQr, label]);
  
  // Fetch orders from API (uses axios.defaults.baseURL = API_URL from StoreContext)
  const fetchOrders = async (showLoadingSpinner = false) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }

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
      const activeOrders = data.orders.filter(order => 
        order.status === 'pending' || order.status === 'active'
      );
      
      // Debug: Log order data (only on initial load to reduce console spam)
      if (showLoadingSpinner) {
        console.log('📊 Total orders fetched:', data.orders.length);
        console.log('📊 Active/Pending orders:', activeOrders.length);
        if (activeOrders.length > 0) {
          console.log('📊 Sample order:', activeOrders[0]);
          console.log('📊 Order has items?', activeOrders[0].items?.length || 0);
        }
      }
      
      setOrders(activeOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      if (showLoadingSpinner) {
        toast.error('Failed to load orders');
      }
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
      setIsInitialLoad(false);
    }
  };
  
  useEffect(() => {
    if (storeGuid) {
      fetchOrders(true); // Show loading spinner on initial load
    }
  }, [storeGuid]);
  
  // WebSocket real-time updates - NO MORE POLLING!
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    console.log('🔌 Setting up WebSocket listeners for real-time order updates');
    
    // Listen for new orders
    const handleOrderCreated = (order) => {
      console.log('✨ New order received via WebSocket:', order.order_id);
      if (order.status === 'pending' || order.status === 'active') {
        setOrders(prevOrders => [order, ...prevOrders]);
        toast.success(`New order: ${order.order_name || order.order_id}`);
      }
    };
    
    // Listen for order updates
    const handleOrderUpdate = ({ action, order }) => {
      console.log('🔄 Order update received via WebSocket:', action, order.order_id);
      
      if (action === 'statusUpdate') {
        if (order.status === 'pending' || order.status === 'active') {
          // Update or add order to active list
          setOrders(prevOrders => {
            const existingIndex = prevOrders.findIndex(o => o.id === order.id);
            if (existingIndex >= 0) {
              const updated = [...prevOrders];
              updated[existingIndex] = order;
              return updated;
            } else {
              return [order, ...prevOrders];
            }
          });
        } else {
          // Remove from active orders (completed/cancelled)
          setOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
          toast.info(`Order ${order.order_id} ${order.status}`);
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
  
  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Calculate statistics
  const stats = {
    activeOrders: orders.length,
    itemsRemaining: orders.reduce((sum, order) => sum + (order.items?.length || 0), 0),
    readyToServe: orders.filter(order => order.status === 'active' && order.payment_method).length,
    unpaid: orders.filter(order => !order.payment_method).length
  };
  
  // Filter orders
  const filteredOrders = orders.filter(order => {
    // Search across all text on the card
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      order.order_name?.toLowerCase().includes(searchLower) ||
      order.order_id?.toLowerCase().includes(searchLower) ||
      order.kiosk_number?.toString().includes(searchQuery) ||
      order.items?.some(item => 
        item.product_name?.toLowerCase().includes(searchLower) ||
        item.name?.toLowerCase().includes(searchLower)
      ) ||
      order.total?.toString().includes(searchQuery) ||
      order.payment_method?.toLowerCase().includes(searchLower);
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'in-progress') return matchesSearch && order.payment_method;
    if (filterStatus === 'ready') return matchesSearch && order.status === 'completed';
    if (filterStatus === 'unpaid') return matchesSearch && !order.payment_method;
    
    return matchesSearch;
  });
  
  // Calculate order age
  const getOrderAge = (order) => {
    // Try both field names (created_at and createdAt)
    const createdAt = order?.created_at || order?.createdAt;
    
    if (!createdAt) {
      console.log('No timestamp found for order:', order);
      return '0m 0s';
    }
    
    const created = new Date(createdAt);
    if (isNaN(created.getTime())) {
      console.log('Invalid date:', createdAt);
      return '0m 0s';
    }
    
    const diffMs = currentTime - created;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMins / 60);
    
    const secs = diffSeconds % 60;
    
    if (diffMins < 1) return `${diffSeconds}s`;
    if (diffMins < 60) return `${diffMins}m ${secs}s`;
    return `${diffHours}h ${diffMins % 60}m ${secs}s`;
  };
  
  // Get age color
  const getAgeColor = (createdAt) => {
    if (!createdAt) return 'success.main';
    
    const now = new Date();
    const created = new Date(createdAt);
    if (isNaN(created.getTime())) return 'success.main';
    
    const diffMins = Math.floor((now - created) / 60000);
    
    if (diffMins < 5) return 'success.main';
    if (diffMins < 15) return 'warning.main';
    return 'error.main';
  };
  
  // Handle payment
  const handlePayment = (order) => {
    setSelectedOrder(order);
    setPaymentDialog(true);
  };
  
  // Process payment
  const processPayment = async () => {
    if (paymentMethod === 'cash' && (!cashGiven || parseFloat(cashGiven) < selectedOrder.total)) {
      toast.error('Insufficient cash amount');
      return;
    }
    
    try {
      if (IS_PHP_BACKEND) {
        await axios.post('/orders/process-payment.php', {
          storeGuid,
          orderId: selectedOrder.order_id,
          paymentMethod,
          amount: selectedOrder.total,
          cashGiven: paymentMethod === 'cash' ? parseFloat(cashGiven) : null,
          changeAmount: paymentMethod === 'cash' ? parseFloat(cashGiven) - selectedOrder.total : 0
        });
      } else {
        // Use axios baseURL (API_URL)
        await axios.post(`/orders/${storeGuid}/${selectedOrder.order_id}/payment`, {
          paymentMethod,
          amount: selectedOrder.total,
          cashGiven: paymentMethod === 'cash' ? parseFloat(cashGiven) : null,
          changeAmount: paymentMethod === 'cash' ? parseFloat(cashGiven) - selectedOrder.total : 0
        });
      }
      
      toast.success(`Payment received! Order is now active.`);
      fetchOrders();
      setPaymentDialog(false);
      setSelectedOrder(null);
      setCashGiven('');
    } catch (error) {
      toast.error('Payment failed');
      console.error(error);
    }
  };
  
  // Complete order
  const completeOrder = async (order) => {
    if (window.confirm(`Mark order as complete?`)) {
      try {
        if (IS_PHP_BACKEND) {
          await axios.patch('/orders/update-status.php', {
            storeGuid,
            orderId: order.order_id,
            status: 'completed'
          });
        } else {
          // Use axios baseURL (API_URL)
          await axios.patch(`/orders/${storeGuid}/${order.order_id}/status`, {
            status: 'completed'
          });
        }
        toast.success('Order completed!');
        fetchOrders();
      } catch (error) {
        toast.error('Failed to complete order');
      }
    }
  };
  
  // Cancel order
  const cancelOrder = async (order) => {
    if (window.confirm(`Cancel this order?`)) {
      try {
        if (IS_PHP_BACKEND) {
          await axios.patch('/orders/update-status.php', {
            storeGuid,
            orderId: order.order_id,
            status: 'cancelled'
          });
        } else {
          // Use axios baseURL (API_URL)
          await axios.patch(`/orders/${storeGuid}/${order.order_id}/status`, {
            status: 'cancelled'
          });
        }
        toast.success('Order cancelled and moved to history');
        fetchOrders();
      } catch (error) {
        toast.error('Failed to cancel order');
        console.error(error);
      }
    }
  };
  
  // Calculate change
  const calculateChange = () => {
    if (paymentMethod === 'cash' && cashGiven && selectedOrder) {
      const change = parseFloat(cashGiven) - selectedOrder.total;
      return change >= 0 ? change.toFixed(2) : '0.00';
    }
    return '0.00';
  };

  return (
    <Box component="main" sx={{ height: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box component="header" sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', px: 3, py: 2, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate(`/${storeGuid}/${label}/order.html`)}
              sx={{ color: 'text.secondary' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="caption" component="h2" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                Kitchen Dashboard
              </Typography>
              <Typography variant="h5" component="h1" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                Active Orders
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Monitor every open ticket, track prep progress in real-time, and send finished orders straight to history without leaving this view.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<QrCodeIcon />}
              onClick={() => setQrCodeDialogOpen(true)}
              aria-label="Show QR Code"
              sx={{
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
              }}
            >
              Share Terminal
            </Button>
            <Chip
              label={`All Orders ${stats.activeOrders}`}
              onClick={() => setFilterStatus('all')}
              sx={{
                bgcolor: filterStatus === 'all' ? 'primary.main' : 'action.disabledBackground',
                color: filterStatus === 'all' ? 'primary.contrastText' : 'text.secondary',
                cursor: 'pointer',
                '&:hover': { bgcolor: filterStatus === 'all' ? 'primary.dark' : 'action.hover' }
              }}
            />
            <Chip
              label={`In Progress ${stats.activeOrders - stats.unpaid}`}
              onClick={() => setFilterStatus('in-progress')}
              sx={{
                bgcolor: filterStatus === 'in-progress' ? 'primary.main' : 'action.disabledBackground',
                color: filterStatus === 'in-progress' ? 'primary.contrastText' : 'text.secondary',
                cursor: 'pointer',
                '&:hover': { bgcolor: filterStatus === 'in-progress' ? 'primary.dark' : 'action.hover' }
              }}
            />
            <Chip
              label={`Unpaid ${stats.unpaid}`}
              onClick={() => setFilterStatus('unpaid')}
              sx={{
                bgcolor: filterStatus === 'unpaid' ? 'primary.main' : 'action.disabledBackground',
                color: filterStatus === 'unpaid' ? 'primary.contrastText' : 'text.secondary',
                cursor: 'pointer',
                '&:hover': { bgcolor: filterStatus === 'unpaid' ? 'primary.dark' : 'action.hover' }
              }}
            />
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => navigate(`/${storeGuid}/${label}/order-history`)}
              sx={{
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'background.paper' }
              }}
            >
              Order History
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchOrders}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        
        {/* Search Bar */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by name, kiosk #, or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.default',
                color: 'text.primary',
                '& fieldset': { borderColor: 'divider' }
              }
            }}
          />
        </Box>
        
        {/* Statistics Cards - Compact Row */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Paper sx={{ p: 1.5, bgcolor: 'background.paper', border: 1, borderColor: 'divider', flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <RestaurantIcon sx={{ fontSize: 28, color: 'primary.main' }} />
              <Box>
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                  {stats.activeOrders}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  Tickets currently in progress
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Paper sx={{ p: 1.5, bgcolor: 'background.paper', border: 1, borderColor: 'divider', flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <FastfoodIcon sx={{ fontSize: 28, color: 'primary.main' }} />
              <Box>
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                  {stats.itemsRemaining}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  Individual line items awaiting prep
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Paper sx={{ p: 1.5, bgcolor: 'background.paper', border: 1, borderColor: 'divider', flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <MoneyIcon sx={{ fontSize: 28, color: 'primary.main' }} />
              <Box>
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                  {stats.unpaid}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  Orders waiting for pickup
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 3, flexGrow: 1, overflow: 'auto' }}>

        {/* Orders Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: 'primary.main' }} />
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'background.paper' }}>
            <ReceiptIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              No orders found
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {filteredOrders.map((order) => (
              <Grid item xs={12} sm={6} md={4} key={order.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    sx={{
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      border: 1,
                      borderColor: 'divider',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <CardContent>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: order.payment_method ? 'success.main' : 'warning.main', width: 32, height: 32 }}>
                            {order.payment_method ? <CheckIcon /> : <MoneyIcon />}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                              {order.order_name || order.orderName || 'Guest'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {order.order_id}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold', display: 'block' }}>
                              Kiosk #{order.kiosk_number || order.kioskNumber}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {/* Payment Method Icon */}
                          {order.payment_method && (
                            order.payment_method === 'cash' ? (
                              <MoneyIcon sx={{ fontSize: 24, color: 'success.main' }} titleAccess="Paid with Cash" />
                            ) : (
                              <CardIcon sx={{ fontSize: 24, color: 'info.main' }} titleAccess="Paid with Card" />
                            )
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TimeIcon sx={{ 
                              fontSize: 20, 
                              color: getAgeColor(order.created_at || order.createdAt) 
                            }} />
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                color: getAgeColor(order.created_at || order.createdAt),
                                fontWeight: 'bold',
                                fontSize: '1.1rem'
                              }}
                            >
                              {getOrderAge(order)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Payment Status */}
                      {!order.payment_method && (
                        <Chip
                          icon={<MoneyIcon />}
                          label="Payment Pending"
                          size="small"
                          sx={{
                            bgcolor: 'warning.main',
                            color: 'warning.contrastText',
                            fontWeight: 'bold',
                            mb: 2
                          }}
                        />
                      )}

                      {/* Items */}
                      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, p: 1.5, mb: 2 }}>
                        {order.items?.map((item, idx) => (
                          <Typography key={idx} variant="body2" sx={{ color: 'text.primary', mb: 0.5 }}>
                            {item.quantity}× {item.product_name}
                          </Typography>
                        ))}
                      </Box>

                      {/* Total */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Total
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                          ${parseFloat(order.total).toFixed(2)}
                        </Typography>
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!order.payment_method ? (
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<MoneyIcon />}
                            onClick={() => handlePayment(order)}
                            sx={{
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              '&:hover': { bgcolor: 'primary.dark' }
                            }}
                          >
                            Accept Payment
                          </Button>
                        ) : (
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<CheckIcon />}
                            onClick={() => completeOrder(order)}
                            sx={{
                              bgcolor: 'success.main',
                              color: 'success.contrastText',
                              '&:hover': { bgcolor: 'success.dark' }
                            }}
                          >
                            Complete
                          </Button>
                        )}
                        <IconButton
                          onClick={() => {
                            setSelectedOrderForQr(order);
                            setOrderQrDialogOpen(true);
                          }}
                          sx={{
                            color: 'primary.main',
                            border: 1,
                            borderColor: 'primary.main',
                            '&:hover': (theme) => ({
                              bgcolor: alpha(theme.palette.primary.main, 0.1)
                            })
                          }}
                          title="Share Order QR"
                        >
                          <QrCodeIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => cancelOrder(order)}
                          sx={{
                            color: 'error.main',
                            border: 1,
                            borderColor: 'error.main',
                            '&:hover': (theme) => ({
                              bgcolor: alpha(theme.palette.error.main, 0.1)
                            })
                          }}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialog}
        onClose={() => setPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'background.paper', color: 'text.primary' }
        }}
      >
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Customer: <strong>{selectedOrder?.order_name}</strong>
          </Typography>
          <Typography variant="h5" sx={{ color: 'primary.main', mb: 2 }}>
            Total: ${parseFloat(selectedOrder?.total || 0).toFixed(2)}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              variant={paymentMethod === 'cash' ? 'contained' : 'outlined'}
              onClick={() => setPaymentMethod('cash')}
              startIcon={<MoneyIcon />}
              fullWidth
              sx={{
                borderColor: 'primary.main',
                color: paymentMethod === 'cash' ? 'primary.contrastText' : 'primary.main',
                bgcolor: paymentMethod === 'cash' ? 'primary.main' : 'transparent',
                '&:hover': {
                  bgcolor: paymentMethod === 'cash' ? 'primary.dark' : 'action.hover',
                  borderColor: 'primary.dark'
                }
              }}
            >
              Cash
            </Button>
            <Button
              variant={paymentMethod === 'card' ? 'contained' : 'outlined'}
              onClick={() => setPaymentMethod('card')}
              startIcon={<CardIcon />}
              fullWidth
              sx={{
                borderColor: 'divider',
                color: paymentMethod === 'card' ? 'primary.contrastText' : 'text.secondary',
                bgcolor: paymentMethod === 'card' ? 'text.secondary' : 'transparent',
                '&:hover': {
                  bgcolor: paymentMethod === 'card' ? 'text.primary' : 'action.hover',
                  borderColor: 'text.primary'
                }
              }}
            >
              Card
            </Button>
          </Box>
          
          {paymentMethod === 'cash' && (
            <>
              <TextField
                fullWidth
                label="Cash Given"
                type="number"
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: 'text.primary',
                    '& fieldset': { borderColor: 'divider' }
                  },
                  '& .MuiInputLabel-root': { color: 'text.secondary' }
                }}
              />
              {cashGiven && (
                <Typography variant="h6" sx={{ color: parseFloat(cashGiven) >= selectedOrder?.total ? 'success.main' : 'error.main' }}>
                  Change: ${calculateChange()}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={processPayment}
            disabled={paymentMethod === 'cash' && (!cashGiven || parseFloat(cashGiven) < selectedOrder?.total)}
            sx={{
              bgcolor: 'success.main',
              color: 'success.contrastText',
              '&:hover': { bgcolor: 'success.dark' }
            }}
          >
            Complete Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Share Dialog */}
      <ShareQRCode
        open={qrCodeDialogOpen}
        onClose={() => setQrCodeDialogOpen(false)}
        storeGuid={storeGuid}
        label={label}
      />

      {/* Order-Specific QR Code Dialog */}
      <Dialog
        open={orderQrDialogOpen}
        onClose={() => {
          setOrderQrDialogOpen(false);
          setSelectedOrderForQr(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText', 
          textAlign: 'center',
          py: 2
        }}>
          <Typography variant="h5" fontWeight="bold">
            Order QR Code
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 4 }}>
          {selectedOrderForQr && (
            <Box sx={{ textAlign: 'center' }}>
              {/* Order Info */}
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {selectedOrderForQr.order_name || selectedOrderForQr.orderName || 'Guest'}
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ mb: 1 }}>
                {selectedOrderForQr.order_id}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                Kiosk #{selectedOrderForQr.kiosk_number || selectedOrderForQr.kioskNumber}
              </Typography>

              {/* QR Code */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                my: 3,
                p: 3,
                bgcolor: 'background.default',
                borderRadius: 2
              }}>
                <QRCodeSVG
                  value={orderQrUrl}
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
                  bgcolor: 'background.paper',
                  p: 1,
                  borderRadius: 1
                }}
              >
                {orderQrUrl}
              </Typography>

              {/* Instructions */}
              <Typography variant="body2" color="text.secondary">
                Scan this QR code to track order status
              </Typography>

              {/* Total */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body1" color="text.secondary">
                  Total: <strong style={{ color: 'inherit' }}>${parseFloat(selectedOrderForQr.total).toFixed(2)}</strong>
                </Typography>
                {selectedOrderForQr.payment_method && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                    {selectedOrderForQr.payment_method === 'cash' ? (
                      <MoneyIcon sx={{ color: 'success.main' }} />
                    ) : (
                      <CardIcon sx={{ color: 'info.main' }} />
                    )}
                    <Typography variant="body2" color="success.main">
                      Paid with {selectedOrderForQr.payment_method}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          bgcolor: 'background.default', 
          borderTop: 1, 
          borderColor: 'divider', 
          p: 2,
          justifyContent: 'center'
        }}>
          <Button
            variant="contained"
            onClick={() => {
              setOrderQrDialogOpen(false);
              setSelectedOrderForQr(null);
            }}
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActiveOrders;
