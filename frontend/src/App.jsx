import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { SocketProvider } from './contexts/SocketContext';
import { StoreProvider } from './contexts/StoreContext';
import useStore from './store/useStore';
import { API_URL, IS_PHP_BACKEND } from './config/api';
import { createBusinessTheme, defaultPosThemeTokens } from './theme';

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
import ThemeStudioPage from './pages/ThemeStudio';
import MenuBuilder from './pages/MenuBuilder';

// Theme creation is centralized in ./theme (Material Design 3 style)

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
      <Box
        component="main"
        role="status"
        aria-live="polite"
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <Typography>Loading store...</Typography>
      </Box>
    );
  }
  
  // If authentication failed, show an inline error instead of redirecting to root
  if (authError) {
    return (
      <Box
        component="main"
        role="alert"
        aria-live="assertive"
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', p: 2 }}
      >
        <Typography color="error">Failed to authenticate this store URL. Please access your store from the main page and verify the GUID and label.</Typography>
      </Box>
    );
  }
  
  return children;
}

function App() {
  const themeMode = useStore((state) => state.theme);
  const themeConfig = useStore((state) => state.themeConfig);

  const themeTokens = themeConfig && themeConfig.tokens ? themeConfig.tokens : null;

  const mergedTokens = {
    ...defaultPosThemeTokens,
    mode: (themeConfig && themeConfig.mode) || themeMode || defaultPosThemeTokens.mode,
    brand: {
      ...defaultPosThemeTokens.brand,
      ...(themeConfig && themeConfig.primaryColor ? { primary: themeConfig.primaryColor } : {}),
      ...(themeConfig && themeConfig.surfaceColor ? { surface: themeConfig.surfaceColor, surfaceVariant: themeConfig.surfaceColor } : {}),
      ...(themeConfig && themeConfig.sidebarColor ? { sidebar: themeConfig.sidebarColor } : {}),
      ...(themeTokens && themeTokens.backgroundColor ? { surface: themeTokens.backgroundColor } : {}),
      ...(themeTokens && themeTokens.sectionColor ? { surfaceVariant: themeTokens.sectionColor } : {}),
      ...(themeTokens && themeTokens.accentColor ? { accent: themeTokens.accentColor } : {}),
      ...(themeTokens && themeTokens.textColor
        ? { onSurface: themeTokens.textColor, onSurfaceVariant: themeTokens.textColor }
        : {})
    },
    typography: {
      ...defaultPosThemeTokens.typography,
      ...(themeTokens && themeTokens.bodyFont ? { fontFamily: themeTokens.bodyFont } : {}),
      ...(themeTokens && themeTokens.headingFont ? { headingFontFamily: themeTokens.headingFont } : {}),
      ...(themeTokens && themeTokens.headingScale ? { headingScale: themeTokens.headingScale } : {}),
      ...(themeTokens && themeTokens.bodySize ? { bodyScale: themeTokens.bodySize } : {})
    },
    shape: {
      ...defaultPosThemeTokens.shape,
      ...(themeTokens && typeof themeTokens.borderRadius === 'number'
        ? {
            baseRadius: themeTokens.borderRadius,
            cardRadius: themeTokens.borderRadius + 4,
            buttonRadius: themeTokens.borderRadius === 32 ? 999 : themeTokens.borderRadius
          }
        : {}),
      ...(themeTokens && typeof themeTokens.shadowProfile === 'string'
        ? { shadowProfile: themeTokens.shadowProfile }
        : {})
    }
  };

  const muiTheme = createBusinessTheme(mergedTokens);
  
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
              {!IS_PHP_BACKEND && (
                <>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </>
              )}
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
                path="/:storeGuid/:label/theme" 
                element={
                  <ProtectedRoute>
                    <ThemeStudioPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/:storeGuid/:label/menu-builder" 
                element={
                  <ProtectedRoute>
                    <MenuBuilder />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/:storeGuid/:label/inventory" 
                element={
                  <ProtectedRoute>
                    <POSInterface />
                  </ProtectedRoute>
                } 
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
