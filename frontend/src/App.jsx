import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { SocketProvider } from './contexts/SocketContext';
import { StoreProvider } from './contexts/StoreContext';
import useStore from './store/useStore';
import { API_URL, IS_PHP_BACKEND } from './config/api';

// Pages
import Landing from './pages/Landing';
import POSInterface from './pages/POSInterface';
import ActiveOrders from './pages/ActiveOrders';
import OrderHistory from './pages/OrderHistory';
import OrderTracking from './pages/OrderTracking';
import Login from './pages/Login';
import Register from './pages/Register';
import HealthStatus from './pages/HealthStatus';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import KDS from './pages/KDS';
import KDSCategory from './pages/KDSCategory';

// Create Material Design 3 theme
const createMaterial3Theme = (mode = 'light') => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#2196F3',
        light: '#64B5F6',
        dark: '#1976D2',
        contrastText: '#fff',
      },
      secondary: {
        main: '#FF9800',
        light: '#FFB74D',
        dark: '#F57C00',
        contrastText: '#000',
      },
      error: {
        main: '#f44336',
      },
      warning: {
        main: '#ff9800',
      },
      info: {
        main: '#2196f3',
      },
      success: {
        main: '#4caf50',
      },
      background: {
        default: mode === 'light' ? '#fafafa' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.6,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            padding: '10px 24px',
            fontSize: '0.95rem',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: '0px 4px 8px rgba(0,0,0,0.2)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)',
            '&:hover': {
              boxShadow: '0px 4px 8px rgba(0,0,0,0.15), 0px 2px 4px rgba(0,0,0,0.25)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          rounded: {
            borderRadius: 16,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: '0px 3px 5px rgba(0,0,0,0.2), 0px 1px 2px rgba(0,0,0,0.24)',
            '&:hover': {
              boxShadow: '0px 5px 10px rgba(0,0,0,0.25), 0px 2px 4px rgba(0,0,0,0.25)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: '1px solid rgba(0,0,0,0.12)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRadius: 0,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 24,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });
};

// Protected Route Component
function ProtectedRoute({ children }) {
  const { storeGuid, label } = useParams();
  const navigate = useNavigate();
  const setStoreInfo = useStore((state) => state.setStoreInfo);
  const setSessionToken = useStore((state) => state.setSessionToken);
  const sessionToken = useStore((state) => state.sessionToken);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState(false);
  
  useEffect(() => {
    const authenticateStore = async () => {
      if (!storeGuid || !label) {
        setAuthError(true);
        setIsAuthenticating(false);
        return;
      }
      
      // If we already have a valid session for this store, skip authentication
      const currentStoreGuid = useStore.getState().storeGuid;
      const currentLabel = useStore.getState().label;
      
      if (currentStoreGuid === storeGuid && currentLabel === label && sessionToken) {
        setIsAuthenticating(false);
        return;
      }
      
      try {
        // Authenticate with backend
        const endpoint = IS_PHP_BACKEND
          ? `${API_URL}/auth/store-access.php`
          : `${API_URL}/auth/store/access`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guid: storeGuid, label })
        });
        
        if (!response.ok) {
          throw new Error('Authentication failed');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setStoreInfo(storeGuid, label);
          setSessionToken(data.sessionToken);
          setIsAuthenticating(false);
        } else {
          setAuthError(true);
          setIsAuthenticating(false);
        }
      } catch (error) {
        console.error('Store authentication error:', error);
        setAuthError(true);
        setIsAuthenticating(false);
      }
    };
    
    authenticateStore();
  }, [storeGuid, label]);
  
  // If route params are missing entirely, go back to landing
  if (!storeGuid || !label) {
    return <Navigate to="/" replace />;
  }

  if (isAuthenticating) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading store...</Typography>
      </Box>
    );
  }
  
  // If authentication failed, show an inline error instead of redirecting to root
  if (authError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', p: 2 }}>
        <Typography color="error">Failed to authenticate this store URL. Please access your store from the main page and verify the GUID and label.</Typography>
      </Box>
    );
  }
  
  return children;
}

function App() {
  const theme = useStore((state) => state.theme);
  const muiTheme = createMaterial3Theme(theme);
  
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <StoreProvider>
          <SocketProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/health" element={<HealthStatus />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/:storeGuid/:label/order.html" 
                element={
                  <ProtectedRoute>
                    <POSInterface />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/:storeGuid/:label/active-orders" 
                element={
                  <ProtectedRoute>
                    <ActiveOrders />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/:storeGuid/:label/order-history" 
                element={
                  <ProtectedRoute>
                    <OrderHistory />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/kds/:storeGuid/:label" 
                element={<KDS />} 
              />
              <Route 
                path="/kds/:storeGuid/:label/category/:category" 
                element={<KDSCategory />} 
              />
              <Route 
                path="/:storeGuid/:label/*" 
                element={
                  <ProtectedRoute>
                    <POSInterface />
                  </ProtectedRoute>
                } 
              />
              {/* Order tracking - matches URLs like /Mr%20Coffee/K-1113-38300 */}
              <Route path="/:label/:orderNumber" element={<OrderTracking />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SocketProvider>
        </StoreProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
