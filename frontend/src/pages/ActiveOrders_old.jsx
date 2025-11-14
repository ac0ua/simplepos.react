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
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Divider,
  Checkbox,
  LinearProgress,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AccessTime as TimeIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CardIcon,
  Print as PrintIcon,
  PlayArrow as PlayArrowIcon,
  Sync as SyncIcon,
  ShoppingBag as ShoppingBagIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';

const ActiveOrders = () => {
  const navigate = useNavigate();
  const { storeGuid, label } = useParams();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashGiven, setCashGiven] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  
  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`http://localhost:5000/api/orders/${storeGuid}`);
      
      // Filter for active orders (pending or active status)
      const activeOrders = data.orders.filter(order => 
        order.status === 'pending' || order.status === 'active'
      );
      
      setOrders(activeOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (storeGuid) {
      fetchOrders();
    }
  }, [storeGuid]);
  
  // Listen for real-time order updates
  useEffect(() => {
    if (socket) {
      socket.on('orderUpdate', (orderData) => {
        fetchOrders(); // Refresh orders when new order comes in
      });
      
      return () => {
        socket.off('orderUpdate');
      };
    }
  }, [socket]);
  
  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Toggle item completion
  const toggleItemCompletion = (orderId, itemId) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          items: order.items.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          )
        };
      }
      return order;
    }));
  };
  
  // Calculate order progress
  const getOrderProgress = (order) => {
    const completedItems = order.items.filter(item => item.completed).length;
    const totalItems = order.items.length;
    return { completed: completedItems, total: totalItems, percentage: (completedItems / totalItems) * 100 };
  };
  
  // Calculate order age (updates every second)
  const getOrderAge = (createdAt) => {
    const created = new Date(createdAt);
    const diffMs = currentTime - created;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMins / 60);
    
    // Always show seconds
    const secs = diffSeconds % 60;
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s`;
    }
    
    if (diffMins < 60) {
      return `${diffMins}m ${secs}s`;
    }
    
    const remainingMins = diffMins % 60;
    return `${diffHours}h ${remainingMins}m ${secs}s`;
  };
  
  // Get age color
  const getAgeColor = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
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
  
  // Process payment (for kiosk orders)
  const processPayment = () => {
    if (paymentMethod === 'cash' && (!cashGiven || parseFloat(cashGiven) < selectedOrder.total)) {
      toast.error('Insufficient cash amount');
      return;
    }
    
    // Update order status to paid and active
    setOrders(orders.map(o => {
      if (o.id === selectedOrder.id) {
        return {
          ...o,
          paymentStatus: 'paid',
          orderStatus: 'active'
        };
      }
      return o;
    }));
    
    toast.success(`Payment received! Order #${selectedOrder.kioskNumber} is now active.`);
    
    setPaymentDialog(false);
    setSelectedOrder(null);
    setCashGiven('');
  };
  
  // Complete order (move to history)
  const completeOrder = (order) => {
    if (window.confirm(`Mark order #${order.kioskNumber} as complete?`)) {
      setOrders(orders.filter(o => o.id !== order.id));
      toast.success(`Order #${order.kioskNumber} completed and moved to history!`);
    }
  };
  
  // Cancel order
  const handleCancelOrder = (order) => {
    if (window.confirm(`Cancel order #${order.kioskNumber} for ${order.orderName}?`)) {
      setOrders(orders.filter(o => o.id !== order.id));
      toast.success('Order cancelled');
    }
  };
  
  // Force complete order
  const forceCompleteOrder = (order) => {
    if (window.confirm(`Force complete order #${order.kioskNumber}?`)) {
      setOrders(orders.filter(o => o.id !== order.id));
      toast.success('Order force completed');
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
  
  // Quick tender
  const quickTenderAmounts = [5, 10, 20, 50, 100];
  const handleQuickTender = (amount) => {
    setCashGiven(amount.toString());
  };
  
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#1a1a1a' }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ bgcolor: '#2d2d2d' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Active Orders
          </Typography>
          <Chip
            label={`${orders.length} Active`}
            sx={{ bgcolor: '#ff9800', color: 'white', fontWeight: 'bold' }}
          />
        </Toolbar>
      </AppBar>
      
      {/* Orders Grid */}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress size={60} sx={{ color: '#ff9800' }} />
          </Box>
        ) : orders.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', bgcolor: '#2d2d2d' }}>
            <ReceiptIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" color="text.secondary">
              No Active Orders
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Orders will appear here when customers check out
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {orders.map((order) => {
              const progress = getOrderProgress(order);
              return (
                <Grid item xs={12} md={6} lg={4} key={order.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      sx={{
                        bgcolor: order.paymentStatus === 'pending' ? '#4a3520' : 
                                (order.paymentMethod === 'card' ? '#1a2d3d' : '#2d2d2d'),
                        color: 'white',
                        borderRadius: 3,
                        border: order.paymentStatus === 'pending' ? '1px solid #6a5530' : 
                               (order.paymentMethod === 'card' ? '1px solid #2d4d6d' : '1px solid #3d3d3d')
                      }}
                    >
                      <CardContent>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ bgcolor: order.paymentStatus === 'pending' ? '#ff9800' : '#4caf50', width: 40, height: 40 }}>
                              {order.paymentStatus === 'pending' ? <MoneyIcon /> : <ShoppingBagIcon />}
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold">
                              {order.orderName}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {order.paymentStatus === 'pending' && (
                              <Chip
                                icon={<MoneyIcon />}
                                label="Payment Pending"
                                sx={{
                                  bgcolor: '#ff9800',
                                  color: 'white',
                                  fontWeight: 'bold'
                                }}
                              />
                            )}
                            <Chip
                              icon={<TimeIcon />}
                              label={getOrderAge(order.createdAt)}
                              sx={{
                                bgcolor: getAgeColor(order.createdAt),
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            />
                          </Box>
                        </Box>
                        
                        {/* Items List */}
                        <Box
                          sx={{
                            bgcolor: '#1a1a1a',
                            borderRadius: 2,
                            p: 1.5,
                            mb: 2,
                            maxHeight: 200,
                            overflowY: 'auto',
                            '&::-webkit-scrollbar': {
                              width: '8px'
                            },
                            '&::-webkit-scrollbar-track': {
                              bgcolor: '#2d2d2d',
                              borderRadius: 1
                            },
                            '&::-webkit-scrollbar-thumb': {
                              bgcolor: '#4d4d4d',
                              borderRadius: 1
                            }
                          }}
                        >
                          {order.items.map((item) => (
                            <Box
                              key={item.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                p: 1,
                                mb: 0.5,
                                bgcolor: '#2d2d2d',
                                borderRadius: 1,
                                '&:last-child': { mb: 0 }
                              }}
                            >
                              <Checkbox
                                checked={item.completed}
                                onChange={() => toggleItemCompletion(order.id, item.id)}
                                sx={{
                                  color: '#666',
                                  '&.Mui-checked': {
                                    color: '#4caf50'
                                  }
                                }}
                              />
                              <Typography
                                sx={{
                                  flexGrow: 1,
                                  textDecoration: item.completed ? 'line-through' : 'none',
                                  opacity: item.completed ? 0.6 : 1
                                }}
                              >
                                {item.quantity} × {item.name}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                        
                        {/* Progress */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <ReceiptIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                              <Typography variant="body2" sx={{ color: '#ff9800' }}>
                                {progress.completed} / {progress.total} items ready
                              </Typography>
                            </Box>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={progress.percentage}
                            sx={{
                              height: 8,
                              borderRadius: 1,
                              bgcolor: '#1a1a1a',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: '#ff9800',
                                borderRadius: 1
                              }
                            }}
                          />
                        </Box>
                        
                        {/* Action Buttons */}
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Button
                              variant="contained"
                              fullWidth
                              onClick={() => handleCancelOrder(order)}
                              startIcon={<CancelIcon />}
                              sx={{
                                bgcolor: '#5d2020',
                                color: '#ff5252',
                                '&:hover': {
                                  bgcolor: '#7d3030'
                                }
                              }}
                            >
                              Cancel Order
                            </Button>
                          </Grid>
                          <Grid item xs={6}>
                            {order.paymentStatus === 'pending' ? (
                              <Button
                                variant="contained"
                                fullWidth
                                onClick={() => handlePayment(order)}
                                startIcon={<MoneyIcon />}
                                sx={{
                                  bgcolor: '#ff9800',
                                  color: 'white',
                                  '&:hover': {
                                    bgcolor: '#f57c00'
                                  }
                                }}
                              >
                                Accept Payment
                              </Button>
                            ) : (
                              <Button
                                variant="contained"
                                fullWidth
                                onClick={() => completeOrder(order)}
                                startIcon={<CheckIcon />}
                                sx={{
                                  bgcolor: '#ff9800',
                                  color: 'white',
                                  '&:hover': {
                                    bgcolor: '#f57c00'
                                  }
                                }}
                              >
                                Complete
                              </Button>
                            )}
                          </Grid>
                          <Grid item xs={12}>
                            <Button
                              variant="outlined"
                              fullWidth
                              onClick={() => forceCompleteOrder(order)}
                              sx={{
                                borderColor: '#4d4d4d',
                                color: '#999',
                                '&:hover': {
                                  borderColor: '#6d6d6d',
                                  bgcolor: '#3d3d3d'
                                }
                              }}
                            >
                              Force Complete This Order
                            </Button>
                          </Grid>
                        </Grid>
                        
                        {/* Footer */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: '1px solid #3d3d3d' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {order.synced ? (
                              <>
                                <CheckIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                                <Typography variant="caption" sx={{ color: '#4caf50' }}>
                                  Synced
                                </Typography>
                              </>
                            ) : (
                              <>
                                <SyncIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                                <Typography variant="caption" sx={{ color: '#ff9800' }}>
                                  Syncing...
                                </Typography>
                              </>
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ color: '#999' }}>
                            #{order.orderNumber}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
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
          sx: {
            bgcolor: '#2d2d2d',
            color: 'white'
          }
        }}
      >
        <DialogTitle>
          Process Payment - Order #{selectedOrder?.kioskNumber}
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Customer: <strong>{selectedOrder?.orderName}</strong>
          </Typography>
          <Typography variant="h5" sx={{ color: '#ff9800', mb: 2 }}>
            Total: ${selectedOrder?.total.toFixed(2)}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, my: 2 }}>
            <Button
              variant={paymentMethod === 'cash' ? 'contained' : 'outlined'}
              onClick={() => setPaymentMethod('cash')}
              startIcon={<MoneyIcon />}
              fullWidth
            >
              Cash
            </Button>
            <Button
              variant={paymentMethod === 'card' ? 'contained' : 'outlined'}
              onClick={() => setPaymentMethod('card')}
              startIcon={<CardIcon />}
              fullWidth
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
                  onClick={() => handleQuickTender(selectedOrder?.total)}
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
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#4d4d4d'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#999'
                  }
                }}
              />
              {cashGiven && (
                <Typography
                  variant="h6"
                  sx={{
                    color: parseFloat(cashGiven) >= selectedOrder?.total ? '#4caf50' : '#f44336'
                  }}
                >
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
              '&:hover': {
                bgcolor: '#45a049'
              }
            }}
          >
            Complete Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActiveOrders;
