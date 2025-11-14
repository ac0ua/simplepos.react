import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { useSocket } from '../contexts/SocketContext';
import ShareQRCode from '../components/ShareQRCode';
import { API_BASE_URL } from '../config/api';

const ActiveOrders = () => {
  const navigate = useNavigate();
  const { storeGuid, label } = useParams();
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashGiven, setCashGiven] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const { socket, isConnected } = useSocket();
  
  // Fetch orders from API
  const fetchOrders = async (showLoadingSpinner = false) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      const { data } = await axios.get(`${API_BASE_URL}/api/orders/${storeGuid}`);
      
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
    if (!createdAt) return '#4caf50';
    
    const now = new Date();
    const created = new Date(createdAt);
    if (isNaN(created.getTime())) return '#4caf50';
    
    const diffMins = Math.floor((now - created) / 60000);
    
    if (diffMins < 5) return '#4caf50';
    if (diffMins < 15) return '#ff9800';
    return '#f44336';
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
      await axios.post(`${API_BASE_URL}/api/orders/${storeGuid}/${selectedOrder.order_id}/payment`, {
        paymentMethod,
        amount: selectedOrder.total,
        cashGiven: paymentMethod === 'cash' ? parseFloat(cashGiven) : null,
        changeAmount: paymentMethod === 'cash' ? parseFloat(cashGiven) - selectedOrder.total : 0
      });
      
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
        await axios.patch(`${API_BASE_URL}/api/orders/${storeGuid}/${order.order_id}/status`, {
          status: 'completed'
        });
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
        await axios.patch(`${API_BASE_URL}/api/orders/${storeGuid}/${order.order_id}/status`, {
          status: 'cancelled'
        });
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
    <Box sx={{ height: '100vh', bgcolor: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#1a1a1a', borderBottom: '1px solid #2d2d2d', px: 3, py: 2, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate(`/${storeGuid}/${label}/order.html`)}
              sx={{ color: '#999' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="caption" sx={{ color: '#ff9800', textTransform: 'uppercase', letterSpacing: 1 }}>
                Kitchen Dashboard
              </Typography>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                Active Orders
              </Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>
                Monitor every open ticket, track prep progress in real-time, and send finished orders straight to history without leaving this view.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<QrCodeIcon />}
              onClick={() => setQrCodeDialogOpen(true)}
              sx={{
                borderColor: '#2d2d2d',
                color: '#ff9800',
                '&:hover': { borderColor: '#ff9800', bgcolor: 'rgba(255, 152, 0, 0.1)' }
              }}
            >
              Share Terminal
            </Button>
            <Chip
              label={`All Orders ${stats.activeOrders}`}
              onClick={() => setFilterStatus('all')}
              sx={{
                bgcolor: filterStatus === 'all' ? '#ff9800' : '#2d2d2d',
                color: 'white',
                cursor: 'pointer',
                '&:hover': { bgcolor: filterStatus === 'all' ? '#f57c00' : '#3d3d3d' }
              }}
            />
            <Chip
              label={`In Progress ${stats.activeOrders - stats.unpaid}`}
              onClick={() => setFilterStatus('in-progress')}
              sx={{
                bgcolor: filterStatus === 'in-progress' ? '#ff9800' : '#2d2d2d',
                color: 'white',
                cursor: 'pointer',
                '&:hover': { bgcolor: filterStatus === 'in-progress' ? '#f57c00' : '#3d3d3d' }
              }}
            />
            <Chip
              label={`Unpaid ${stats.unpaid}`}
              onClick={() => setFilterStatus('unpaid')}
              sx={{
                bgcolor: filterStatus === 'unpaid' ? '#ff9800' : '#2d2d2d',
                color: 'white',
                cursor: 'pointer',
                '&:hover': { bgcolor: filterStatus === 'unpaid' ? '#f57c00' : '#3d3d3d' }
              }}
            />
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => navigate(`/${storeGuid}/${label}/order-history`)}
              sx={{
                borderColor: '#2d2d2d',
                color: '#999',
                '&:hover': { borderColor: '#ff9800', color: '#ff9800', bgcolor: '#1a1a1a' }
              }}
            >
              Order History
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchOrders}
              sx={{
                bgcolor: '#ff9800',
                color: 'white',
                '&:hover': { bgcolor: '#f57c00' }
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
                  <SearchIcon sx={{ color: '#666' }} />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#0a0a0a',
                color: 'white',
                '& fieldset': { borderColor: '#2d2d2d' }
              }
            }}
          />
        </Box>
        
        {/* Statistics Cards - Compact Row */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Paper sx={{ p: 1.5, bgcolor: '#1a1a1a', border: '1px solid #2d2d2d', flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <RestaurantIcon sx={{ fontSize: 28, color: '#ff9800' }} />
              <Box>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {stats.activeOrders}
                </Typography>
                <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>
                  Tickets currently in progress
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Paper sx={{ p: 1.5, bgcolor: '#1a1a1a', border: '1px solid #2d2d2d', flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <FastfoodIcon sx={{ fontSize: 28, color: '#ff9800' }} />
              <Box>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {stats.itemsRemaining}
                </Typography>
                <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>
                  Individual line items awaiting prep
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Paper sx={{ p: 1.5, bgcolor: '#1a1a1a', border: '1px solid #2d2d2d', flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <MoneyIcon sx={{ fontSize: 28, color: '#ff9800' }} />
              <Box>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {stats.unpaid}
                </Typography>
                <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>
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
            <CircularProgress sx={{ color: '#ff9800' }} />
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', bgcolor: '#1a1a1a' }}>
            <ReceiptIcon sx={{ fontSize: 80, color: '#666', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#999' }}>
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
                      bgcolor: order.payment_method ? '#1a2d1a' : '#4a3520',
                      border: order.payment_method ? '1px solid #2d4d2d' : '1px solid #6a5530',
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.4)'
                      }
                    }}
                  >
                    <CardContent>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: order.payment_method ? '#4caf50' : '#ff9800', width: 32, height: 32 }}>
                            {order.payment_method ? <CheckIcon /> : <MoneyIcon />}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {order.order_name || order.orderName || 'Guest'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
                              {order.order_id}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#ff9800', fontWeight: 'bold', display: 'block' }}>
                              Kiosk #{order.kiosk_number || order.kioskNumber}
                            </Typography>
                          </Box>
                        </Box>
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

                      {/* Payment Status */}
                      {!order.payment_method && (
                        <Chip
                          icon={<MoneyIcon />}
                          label="Payment Pending"
                          size="small"
                          sx={{
                            bgcolor: '#ff9800',
                            color: 'white',
                            fontWeight: 'bold',
                            mb: 2
                          }}
                        />
                      )}

                      {/* Items */}
                      <Box sx={{ bgcolor: '#0a0a0a', borderRadius: 1, p: 1.5, mb: 2 }}>
                        {order.items?.map((item, idx) => (
                          <Typography key={idx} variant="body2" sx={{ color: '#ccc', mb: 0.5 }}>
                            {item.quantity}× {item.product_name}
                          </Typography>
                        ))}
                      </Box>

                      {/* Total */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#999' }}>
                          Total
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
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
                              bgcolor: '#ff9800',
                              color: 'white',
                              '&:hover': { bgcolor: '#f57c00' }
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
                              bgcolor: '#4caf50',
                              color: 'white',
                              '&:hover': { bgcolor: '#45a049' }
                            }}
                          >
                            Complete
                          </Button>
                        )}
                        <IconButton
                          onClick={() => cancelOrder(order)}
                          sx={{
                            color: '#f44336',
                            border: '1px solid #f44336',
                            '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' }
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
          sx: { bgcolor: '#1a1a1a', color: 'white' }
        }}
      >
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Customer: <strong>{selectedOrder?.order_name}</strong>
          </Typography>
          <Typography variant="h5" sx={{ color: '#ff9800', mb: 2 }}>
            Total: ${parseFloat(selectedOrder?.total || 0).toFixed(2)}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              variant={paymentMethod === 'cash' ? 'contained' : 'outlined'}
              onClick={() => setPaymentMethod('cash')}
              startIcon={<MoneyIcon />}
              fullWidth
              sx={{
                borderColor: '#ff9800',
                color: paymentMethod === 'cash' ? 'white' : '#ff9800',
                bgcolor: paymentMethod === 'cash' ? '#ff9800' : 'transparent'
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
                borderColor: '#2196f3',
                color: paymentMethod === 'card' ? 'white' : '#2196f3',
                bgcolor: paymentMethod === 'card' ? '#2196f3' : 'transparent'
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
                    color: 'white',
                    '& fieldset': { borderColor: '#2d2d2d' }
                  },
                  '& .MuiInputLabel-root': { color: '#999' }
                }}
              />
              {cashGiven && (
                <Typography variant="h6" sx={{ color: parseFloat(cashGiven) >= selectedOrder?.total ? '#4caf50' : '#f44336' }}>
                  Change: ${calculateChange()}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)} sx={{ color: '#999' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={processPayment}
            disabled={paymentMethod === 'cash' && (!cashGiven || parseFloat(cashGiven) < selectedOrder?.total)}
            sx={{
              bgcolor: '#4caf50',
              '&:hover': { bgcolor: '#45a049' }
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
    </Box>
  );
};

export default ActiveOrders;
