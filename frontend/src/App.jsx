import React, { useEffect, useState, useMemo, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box, Typography, GlobalStyles } from '@mui/material';
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
// ThemeStudio removed - now using ThemeSettingsModal in POSInterface
import MenuBuilder from './pages/MenuBuilder';
import InsightsDashboard from './pages/InsightsDashboard';
import BusinessInfo from './pages/BusinessInfo';

// Theme creation is centralized in ./theme (Material Design 3 style)

// Theme Tokens Context - provides extended theme tokens to all components
export const ThemeTokensContext = createContext(null);
export const useThemeTokens = () => useContext(ThemeTokensContext);

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

  // Extended theme tokens including background modes for consistent styling
  const extendedTokens = useMemo(() => ({
    backgroundMode: (themeTokens && themeTokens.backgroundMode) || 'solid',
    backgroundImage: (themeTokens && themeTokens.backgroundImage) || '',
    glassOpacity: (themeTokens && typeof themeTokens.glassOpacity === 'number') ? themeTokens.glassOpacity : 0.8,
    borderRadius: (themeTokens && typeof themeTokens.borderRadius === 'number') ? themeTokens.borderRadius : 16,
    shadowProfile: (themeTokens && themeTokens.shadowProfile) || 'dramatic',
    headingFont: (themeTokens && themeTokens.headingFont) || 'Space Grotesk, sans-serif',
    bodyFont: (themeTokens && themeTokens.bodyFont) || 'Space Grotesk, sans-serif',
    headingScale: (themeTokens && themeTokens.headingScale) || 1.3,
    bodySize: (themeTokens && themeTokens.bodySize) || 1,
    primaryColor: (themeConfig && themeConfig.primaryColor) || '#f97306',
    backgroundColor: (themeTokens && themeTokens.backgroundColor) || '#1f140b',
    surfaceColor: (themeConfig && themeConfig.surfaceColor) || '#3a2818',
    sidebarColor: (themeConfig && themeConfig.sidebarColor) || '#28180d',
    textColor: (themeTokens && themeTokens.textColor) || '#f9fafb',
    sidebarTextColor: (themeTokens && themeTokens.sidebarTextColor) || '#f9fafb',
    surfaceTextColor: (themeTokens && themeTokens.surfaceTextColor) || '#f9fafb',
    accentColor: (themeTokens && themeTokens.accentColor) || '#ffb347',
    // Gradient settings
    gradientColor1: (themeTokens && themeTokens.gradientColor1) || '#1a1410',
    gradientColor2: (themeTokens && themeTokens.gradientColor2) || '#2a1f18',
    gradientAngle: (themeTokens && typeof themeTokens.gradientAngle === 'number') ? themeTokens.gradientAngle : 135,
    gradientType: (themeTokens && themeTokens.gradientType) || 'linear'
  }), [themeTokens, themeConfig]);

  const mergedTokens = useMemo(() => ({
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
  }), [themeConfig, themeMode, themeTokens]);

  const muiTheme = useMemo(() => createBusinessTheme(mergedTokens), [mergedTokens]);

  // Generate CSS custom properties for theme tokens
  const getBackgroundStyle = () => {
    const mode = extendedTokens.backgroundMode;
    if (mode === 'gradient') {
      const { gradientType, gradientAngle, gradientColor1, gradientColor2 } = extendedTokens;
      return gradientType === 'linear'
        ? `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`
        : `radial-gradient(circle, ${gradientColor1}, ${gradientColor2})`;
    }
    if (mode === 'image' && extendedTokens.backgroundImage) {
      return `url(${extendedTokens.backgroundImage})`;
    }
    return extendedTokens.backgroundColor;
  };

  const globalStyles = useMemo(() => ({
    ':root': {
      '--theme-background-mode': extendedTokens.backgroundMode,
      '--theme-background-image': extendedTokens.backgroundImage ? `url(${extendedTokens.backgroundImage})` : 'none',
      '--theme-glass-opacity': extendedTokens.glassOpacity,
      '--theme-border-radius': `${extendedTokens.borderRadius}px`,
      '--theme-primary-color': extendedTokens.primaryColor,
      '--theme-background-color': extendedTokens.backgroundColor,
      '--theme-surface-color': extendedTokens.surfaceColor,
      '--theme-sidebar-color': extendedTokens.sidebarColor,
      '--theme-text-color': extendedTokens.textColor,
      '--theme-sidebar-text-color': extendedTokens.sidebarTextColor,
      '--theme-surface-text-color': extendedTokens.surfaceTextColor,
      '--theme-accent-color': extendedTokens.accentColor,
      '--theme-heading-font': extendedTokens.headingFont,
      '--theme-body-font': extendedTokens.bodyFont,
      '--theme-gradient-color1': extendedTokens.gradientColor1,
      '--theme-gradient-color2': extendedTokens.gradientColor2,
      '--theme-gradient-angle': `${extendedTokens.gradientAngle}deg`,
      '--theme-gradient-type': extendedTokens.gradientType
    },
    'body': {
      background: getBackgroundStyle(),
      backgroundSize: extendedTokens.backgroundMode === 'image' ? 'cover' : 'auto',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh'
    }
  }), [extendedTokens]);
  
  return (
    <ThemeTokensContext.Provider value={extendedTokens}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <GlobalStyles styles={globalStyles} />
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
              {/* Theme route removed - now using ThemeSettingsModal in POSInterface */}
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
                path="/:storeGuid/:label/insights" 
                element={
                  <ProtectedRoute>
                    <InsightsDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/:storeGuid/:label/business-info" 
                element={
                  <ProtectedRoute>
                    <BusinessInfo />
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
    </ThemeTokensContext.Provider>
  );
}

export default App;
