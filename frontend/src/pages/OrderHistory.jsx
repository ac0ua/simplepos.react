import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Replay as ReplayIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Undo as UndoIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { IS_PHP_BACKEND } from '../config/api';
import { useSocket } from '../contexts/SocketContext';

const OrderHistory = () => {
  const navigate = useNavigate();
  const { storeGuid, label } = useParams();
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { socket, isConnected } = useSocket();

  // Fetch orders from API with retry logic
  const fetchOrders = async (showLoadingSpinner = false, retryCount = 0) => {
    try {
      console.log('🔄 Fetching orders for Order History...', retryCount > 0 ? `(retry ${retryCount})` : '');
      if (showLoadingSpinner) {
        setLoading(true);
      }

      // Use axios defaults (baseURL = API_URL) so this works for both Node and PHP backends
      let response;
      if (IS_PHP_BACKEND) {
        response = await axios.get('/orders/get.php', {
          params: { storeGuid },
          timeout: 10000 // 10 second timeout
        });
      } else {
        response = await axios.get(`/orders/${storeGuid}`, {
          timeout: 10000 // 10 second timeout
        });
      }

      const { data } = response;

      // Filter for completed, cancelled, or refunded orders
      const historyOrders = data.orders.filter(order =>
        order.status === 'completed' || order.status === 'cancelled' || order.status === 'refunded'
      );

      setOrders(historyOrders);
      console.log(`✅ Loaded ${historyOrders.length} order history records`);
    } catch (error) {
      console.error('Failed to fetch orders:', error);

      // If it's a connection error and we haven't retried too many times, wait and retry
      if ((error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message.includes('Network Error')) && retryCount < 3) {
        console.log(`🔄 Retrying order history fetch in 2 seconds... (${retryCount + 1}/3)`);
        setTimeout(() => fetchOrders(showLoadingSpinner, retryCount + 1), 2000);
        return;
      }

      // Only show error toast if not retrying
      if (showLoadingSpinner && retryCount >= 3) {
        toast.error('Failed to load order history - check server connection');
      }
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    if (!storeGuid) return;
    console.log('🔄 Loading order history...');
    fetchOrders(true);
  }, [storeGuid]);

  // WebSocket real-time updates - NO MORE POLLING!
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    console.log('🔌 Setting up WebSocket listeners for Order History');
    
    // Listen for order updates
    const handleOrderUpdate = ({ action, order }) => {
      console.log('🔄 Order update received via WebSocket:', action, order.order_id);
      
      if (action === 'statusUpdate') {
        const isHistoryStatus = order.status === 'completed' || order.status === 'cancelled' || order.status === 'refunded';
        
        if (isHistoryStatus) {
          // Add or update order in history
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
          // Remove from history (reactivated)
          setOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
        }
      }
    };
    
    socket.on('orderUpdate', handleOrderUpdate);
    
    return () => {
      socket.off('orderUpdate', handleOrderUpdate);
    };
  }, [socket, isConnected]);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      order.order_name?.toLowerCase().includes(searchLower) ||
      order.order_id?.toLowerCase().includes(searchLower) ||
      order.payment_method?.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const orderDate = new Date(order.created_at);
    const matchesStartDate = !startDate || orderDate >= new Date(startDate);
    const matchesEndDate = !endDate || orderDate <= new Date(endDate);
    
    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  // Calculate statistics
  const stats = {
    total: filteredOrders.length,
    completed: filteredOrders.filter(o => o.status === 'completed').length,
    cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
    refunded: filteredOrders.filter(o => o.status === 'refunded').length
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success.main';
      case 'cancelled': return 'error.main';
      case 'refunded': return 'warning.main';
      default: return 'text.secondary';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'cancelled': return <CancelIcon />;
      case 'refunded': return <UndoIcon />;
      default: return null;
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  // Reactivate order
  const reactivateOrder = async (order) => {
    if (window.confirm(`Reactivate order ${order.order_id}? This will move it back to Active Orders.`)) {
      try {
        if (IS_PHP_BACKEND) {
          await axios.patch('/orders/update-status.php', {
            storeGuid,
            orderId: order.order_id,
            status: 'pending'
          });
        } else {
          // Use axios defaults (baseURL = API_URL)
          await axios.patch(`/orders/${storeGuid}/${order.order_id}/status`, {
            status: 'pending'
          });
        }
        toast.success('Order reactivated and moved to Active Orders!');
        fetchOrders(false); // Refresh the list
      } catch (error) {
        toast.error('Failed to reactivate order');
        console.error(error);
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box component="main" sx={{ height: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box component="header" sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', px: { xs: 2, sm: 3 }, py: 2, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' } }}>
            <IconButton
              onClick={() => navigate(`/${storeGuid}/${label}/order.html`)}
              sx={{ color: 'text.secondary' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" component="h2" sx={{ color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
                Operations Hub
              </Typography>
              <Typography variant="h5" component="h1" sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Order History
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                Review every completed, cancelled, voided, or refunded ticket. Reactivate mistakes instantly to move them back into your active queue.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, width: { xs: '100%', md: 'auto' } }}>
            {/* Connection Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: isConnected ? 'success.main' : 'error.main',
                  animation: isConnected ? 'none' : 'pulse 2s infinite'
                }}
              />
              <Typography variant="caption" sx={{ color: isConnected ? 'success.main' : 'error.main' }}>
                {isConnected ? 'Connected' : 'Reconnecting...'}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              size="small"
              sx={{
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'background.paper' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => fetchOrders(false)}
              size="small"
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mt: 2 }}>
          <TextField
            placeholder="Search by name, order #, payment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
                color: 'text.primary',
                '& fieldset': { borderColor: 'divider' }
              }
            }}
          />
          <FormControl sx={{ minWidth: { xs: '100%', md: 150 } }} size="small">
            <InputLabel sx={{ color: 'text.secondary' }}>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              sx={{
                bgcolor: 'background.paper',
                color: 'text.primary',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' }
              }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
            </Select>
          </FormControl>
          <TextField
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true, sx: { color: 'text.secondary' } }}
            sx={{
              minWidth: { xs: '100%', md: 'auto' },
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
                color: 'text.primary',
                '& fieldset': { borderColor: 'divider' }
              }
            }}
          />
          <TextField
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true, sx: { color: 'text.secondary' } }}
            sx={{
              minWidth: { xs: '100%', md: 'auto' },
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.default',
                color: 'common.white',
                '& fieldset': { borderColor: 'divider' }
              }
            }}
          />
        </Box>

        {/* Statistics */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mt: 2 }}>
          <Paper sx={{ p: 1.5, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ReplayIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: 'primary.main' }} />
              <Box>
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {stats.total}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                  Total records
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Paper sx={{ p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CheckCircleIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: 'success.main' }} />
              <Box>
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {stats.completed}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                  Completed
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Paper sx={{ p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <UndoIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: 'primary.main' }} />
              <Box>
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {stats.refunded}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                  Refunded
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Paper sx={{ p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CancelIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: 'error.main' }} />
              <Box>
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {stats.cancelled}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                  Cancelled
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 3, flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: 'primary.main' }} />
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'background.paper' }}>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
              😊 No orders match your filters.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Try changing the selected status, clearing search, or adjusting the date range.
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Desktop Table View */}
            <TableContainer component={Paper} sx={{ bgcolor: 'background.paper', display: { xs: 'none', md: 'block' } }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>Order ID</TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>Customer</TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>Payment</TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>Created</TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>Completed/Cancelled</TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow 
                      key={order.id}
                      sx={{ 
                        '&:hover': { bgcolor: 'background.paper' },
                        borderBottom: 1,
                        borderColor: 'divider'
                      }}
                    >
                      <TableCell sx={{ color: 'text.primary' }}>#{order.order_id}</TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>{order.order_name || 'Guest'}</TableCell>
                      <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        ${parseFloat(order.total).toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                        {order.payment_method || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(order.status)}
                          label={order.status}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(order.status),
                            color: 'common.white',
                            fontWeight: 'bold',
                            textTransform: 'capitalize'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {order.completed_at ? formatDate(order.completed_at) : 
                         order.cancelled_at ? formatDate(order.cancelled_at) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<ReplayIcon />}
                          onClick={() => reactivateOrder(order)}
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            '&:hover': { bgcolor: 'primary.dark' },
                            textTransform: 'none'
                          }}
                        >
                          Reactivate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Mobile Card View */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
              {filteredOrders.map((order) => (
                <Paper key={order.id} sx={{ bgcolor: 'background.paper', p: 2, border: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'primary.main', textTransform: 'uppercase' }}>
                        Order ID
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                        #{order.order_id}
                      </Typography>
                    </Box>
                    <Chip
                      icon={getStatusIcon(order.status)}
                      label={order.status}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(order.status),
                        color: 'common.white',
                        fontWeight: 'bold',
                        textTransform: 'capitalize'
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Customer</Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {order.order_name || 'Guest'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total</Typography>
                      <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        ${parseFloat(order.total).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Payment</Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary', textTransform: 'capitalize' }}>
                        {order.payment_method || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Created</Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.75rem' }}>
                        {formatDate(order.created_at)}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    startIcon={<ReplayIcon />}
                    onClick={() => reactivateOrder(order)}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': { bgcolor: 'primary.dark' },
                      textTransform: 'none'
                    }}
                  >
                    Reactivate Order
                  </Button>
                </Paper>
              ))}
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default OrderHistory;
