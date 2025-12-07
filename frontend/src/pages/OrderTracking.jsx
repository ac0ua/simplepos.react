import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Button,
  Card,
  CardContent
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  Receipt as ReceiptIcon,
  Store as StoreIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { API_URL, IS_PHP_BACKEND } from '../config/api';

const OrderTracking = () => {
  const { label, orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate that orderNumber looks like an order ID (K-MMDD-XXXXX or P-MMDD-XXXXX)
  const isValidOrderNumber = orderNumber && /^[KP]-\d{4}-\d{5}$/.test(orderNumber);

  useEffect(() => {
    if (!isValidOrderNumber) {
      setError('Invalid order number format');
      setLoading(false);
      return;
    }
    
    fetchOrderDetails();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchOrderDetails, 10000);
    return () => clearInterval(interval);
  }, [label, orderNumber, isValidOrderNumber]);

  const fetchOrderDetails = async (retryCount = 0) => {
    try {
      let url;
      if (IS_PHP_BACKEND) {
        // PHP: GET /orders/track.php?label={label}&orderNumber={orderNumber}
        url = `${API_URL}/orders/track.php?label=${encodeURIComponent(label)}&orderNumber=${encodeURIComponent(orderNumber)}`;
      } else {
        // Node: GET /api/orders/track/:label/:orderNumber
        url = `${API_URL}/orders/track/${label}/${orderNumber}`;
      }
      
      console.log('🔍 Fetching order with params:', { label, orderNumber, retryCount });
      console.log('🔍 API URL:', url);
      
      // Fetch order by order number
      const { data } = await axios.get(url);
      console.log('✅ Order data received:', data);
      
      // Handle PHP response format
      const orderData = IS_PHP_BACKEND ? data.order : data;
      setOrder(orderData);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching order:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      
      // Retry up to 3 times with 1 second delay for newly created orders
      if (retryCount < 3 && err.response?.status === 404) {
        console.log(`⏳ Retrying in 1 second... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => fetchOrderDetails(retryCount + 1), 1000);
      } else {
        setError('Order not found');
        setLoading(false);
      }
    }
  };

  const getStatusColor = () => {
    if (!order) return 'text.secondary';
    if (order.status === 'completed' || order.payment_status === 'paid') return 'success.main';
    if (order.payment_status === 'pending') return 'warning.main';
    return 'info.main';
  };

  const getStatusText = () => {
    if (!order) return 'Loading...';
    if (order.status === 'completed') return 'Order Completed';
    if (order.payment_status === 'paid') return 'Order In Progress';
    if (order.payment_status === 'pending') return 'Payment Pending';
    return 'Processing';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 3
      }}>
        <Typography variant="h4" color="error" gutterBottom>
          Order Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          We couldn't find an order with number: {orderNumber}
        </Typography>
        <Button
          variant="contained"
          startIcon={<BackIcon />}
          onClick={() => navigate('/')}
        >
          Go to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Toaster position="top-center" />
      <Container maxWidth="md">
        {/* Header with Status */}
        <Paper 
          component="header"
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: getStatusColor(),
            color: 'white',
            borderRadius: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <StoreIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h5" component="h1" fontWeight="bold">
                {label}
              </Typography>
              <Typography variant="body2" component="h2" sx={{ opacity: 0.9 }}>
                Order Tracking
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.3)' }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              #{order.kiosk_number || order.kioskNumber}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {getStatusText()}
            </Typography>
          </Box>
        </Paper>

        {/* Single Card with All Order Information */}
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {/* Order Details Section */}
          <CardContent sx={{ p: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
              📋 Order Details
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Order Number
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {order.order_id || order.orderNumber}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Order Time
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {formatTime(order.created_at || order.createdAt)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Customer Name
              </Typography>
              <Typography variant="h6" fontWeight="500">
                {order.order_name || order.orderName || 'Guest'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={order.payment_status === 'paid' ? <CheckIcon /> : <TimeIcon />}
                label={order.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
                color={order.payment_status === 'paid' ? 'success' : 'warning'}
                sx={{ fontWeight: 'bold' }}
              />
              {order.payment_method && (
                <Chip
                  label={order.payment_method.toUpperCase()}
                  variant="outlined"
                />
              )}
            </Box>
          </CardContent>

          <Divider />

          {/* Order Items Section */}
          <CardContent sx={{ p: 3, bgcolor: 'action.hover' }}>
            <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
              🛒 Items Ordered
            </Typography>
            
            <List sx={{ p: 0 }}>
              {(order.items || []).map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem 
                    sx={{ 
                      px: 0,
                      py: 2,
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" fontWeight="600">
                        {item.product_name || item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${parseFloat(item.price).toFixed(2)} × {item.quantity}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </Typography>
                  </ListItem>
                  {index < order.items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>

          <Divider />

          {/* Order Summary Section */}
          <CardContent sx={{ p: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
              💰 Order Summary
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body1" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  ${parseFloat(order.subtotal || 0).toFixed(2)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body1" color="text.secondary">
                  Tax
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  ${parseFloat(order.tax || 0).toFixed(2)}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold">
                  Total
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  ${parseFloat(order.total || 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </CardContent>

          <Divider />

          {/* Footer Section */}
          <CardContent sx={{ p: 3, bgcolor: 'background.default', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              ⏱️ This page updates automatically every 10 seconds
            </Typography>
            <Typography variant="body1" fontWeight="500" color="primary" sx={{ mt: 1 }}>
              Thank you for your order! 🎉
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default OrderTracking;
