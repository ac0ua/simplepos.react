import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore';
import { API_URL, IS_PHP_BACKEND } from '../config/api';

const StoreContext = createContext(null);

console.log('[StoreContext] Initializing StoreContext. API_URL:', API_URL, 'IS_PHP_BACKEND:', IS_PHP_BACKEND);

// Configure axios defaults based on backend type (Node or PHP)
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add auth token to requests
axios.interceptors.request.use((config) => {
  const token = useStore.getState().sessionToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreContext must be used within a StoreProvider');
  }
  return context;
};

export const StoreProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const storeGuid = useStore((state) => state.storeGuid);
  const label = useStore((state) => state.label);
  const setProducts = useStore((state) => state.setProducts);
  const setCategories = useStore((state) => state.setCategories);
  const setThemeConfig = useStore((state) => state.setThemeConfig);

  useEffect(() => {
    console.log('[StoreProvider] storeGuid or label changed', { storeGuid, label });
  }, [storeGuid, label]);

  const { data: themeData } = useQuery({
    queryKey: ['theme', storeGuid, label],
    queryFn: async () => {
      if (!storeGuid || !label) {
        console.log('[StoreProvider][themeQuery] Skipping theme fetch because storeGuid or label is missing', { storeGuid, label });
        return null;
      }

      try {
        if (IS_PHP_BACKEND) {
          console.log('[StoreProvider][themeQuery] Fetching theme from PHP backend', {
            url: '/stores/theme.php',
            params: { storeGuid, label },
            baseURL: API_URL
          });
          const { data } = await axios.get('/stores/theme.php', {
            params: { storeGuid, label }
          });
          console.log('[StoreProvider][themeQuery] Theme response data', data);
          return data.theme || null;
        } else {
          console.log('[StoreProvider][themeQuery] Skipping theme fetch for non-PHP backend');
          return null;
        }
      } catch (error) {
        console.error('[StoreProvider][themeQuery] Error fetching theme', {
          storeGuid,
          label,
          apiUrl: API_URL,
          isPhpBackend: IS_PHP_BACKEND,
          error
        });
        throw error;
      }
    },
    enabled: !!storeGuid && !!label,
    onSuccess: (theme) => {
      console.log('[StoreProvider][themeQuery] onSuccess with theme', theme);
      if (theme) {
        setThemeConfig(theme);
      }
    }
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', storeGuid],
    queryFn: async () => {
      if (!storeGuid) {
        console.log('[StoreProvider][productsQuery] No storeGuid, returning empty products array');
        return [];
      }

      try {
        if (IS_PHP_BACKEND) {
          // PHP: GET /products/get.php?storeGuid={guid}
          console.log('[StoreProvider][productsQuery] Fetching products from PHP backend', {
            url: '/products/get.php',
            params: { storeGuid },
            baseURL: API_URL
          });
          const { data } = await axios.get('/products/get.php', {
            params: { storeGuid }
          });
          console.log('[StoreProvider][productsQuery] PHP products response data', data);
          return data;
        } else {
          // Node: GET /products/:storeGuid
          console.log('[StoreProvider][productsQuery] Fetching products from Node backend', {
            url: `/products/${storeGuid}`,
            baseURL: API_URL
          });
          const { data } = await axios.get(`/products/${storeGuid}`);
          console.log('[StoreProvider][productsQuery] Node products response data', data);
          return data;
        }
      } catch (error) {
        console.error('[StoreProvider][productsQuery] Error fetching products', {
          storeGuid,
          apiUrl: API_URL,
          isPhpBackend: IS_PHP_BACKEND,
          error
        });
        throw error;
      }
    },
    enabled: !!storeGuid,
    onSuccess: (data) => {
      console.log('[StoreProvider][productsQuery] onSuccess with data', data);
      setProducts(data);
    },
    onError: (error) => {
      console.error('[StoreProvider][productsQuery] onError', error);
    }
  });
  
  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories', storeGuid],
    queryFn: async () => {
      if (!storeGuid) {
        console.log('[StoreProvider][categoriesQuery] No storeGuid, returning empty categories array');
        return [];
      }

      try {
        if (IS_PHP_BACKEND) {
          // PHP: GET /products/categories.php?storeGuid={guid}
          console.log('[StoreProvider][categoriesQuery] Fetching categories from PHP backend', {
            url: '/products/categories.php',
            params: { storeGuid },
            baseURL: API_URL
          });
          const { data } = await axios.get('/products/categories.php', {
            params: { storeGuid }
          });
          console.log('[StoreProvider][categoriesQuery] PHP categories response data', data);
          return data;
        } else {
          // Node: GET /products/:storeGuid/categories
          console.log('[StoreProvider][categoriesQuery] Fetching categories from Node backend', {
            url: `/products/${storeGuid}/categories`,
            baseURL: API_URL
          });
          const { data } = await axios.get(`/products/${storeGuid}/categories`);
          console.log('[StoreProvider][categoriesQuery] Node categories response data', data);
          return data;
        }
      } catch (error) {
        console.error('[StoreProvider][categoriesQuery] Error fetching categories', {
          storeGuid,
          apiUrl: API_URL,
          isPhpBackend: IS_PHP_BACKEND,
          error
        });
        throw error;
      }
    },
    enabled: !!storeGuid,
    onSuccess: (data) => {
      console.log('[StoreProvider][categoriesQuery] onSuccess with data', data);
      setCategories(data);
    },
    onError: (error) => {
      console.error('[StoreProvider][categoriesQuery] onError', error);
    }
  });
 
  useEffect(() => {
    console.log('[StoreProvider] Query results updated', {
      productsCount: (products || []).length,
      categoriesCount: (categories || []).length,
      productsLoading
    });
  }, [products, categories, productsLoading]);
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const { data } = await axios.post(`/orders/${storeGuid}`, orderData);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Order created successfully!');
      queryClient.invalidateQueries(['orders', storeGuid]);
    },
    onError: (error) => {
      toast.error('Failed to create order');
      console.error('Order creation error:', error);
    }
  });
  
  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async ({ orderId, paymentData }) => {
      const { data } = await axios.post(
        `/orders/${storeGuid}/${orderId}/payment`,
        paymentData
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success('Payment processed successfully!');
      queryClient.invalidateQueries(['orders', storeGuid]);
    },
    onError: (error) => {
      toast.error('Payment failed');
      console.error('Payment error:', error);
    }
  });
  
  // Update product stock
  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, quantity, operation }) => {
      if (!storeGuid) {
        console.error('[StoreProvider][updateStock] Missing storeGuid', { productId, quantity, operation });
        throw new Error('Store GUID is missing');
      }

      try {
        if (IS_PHP_BACKEND) {
          console.log('[StoreProvider][updateStock] Updating stock via PHP backend', {
            url: '/products/update-stock.php',
            payload: { storeGuid, productId, quantity, operation },
            baseURL: API_URL
          });
          const { data } = await axios.post('/products/update-stock.php', {
            storeGuid,
            productId,
            quantity,
            operation
          });
          console.log('[StoreProvider][updateStock] PHP stock update response', data);
          return data;
        }

        console.log('[StoreProvider][updateStock] Updating stock via Node backend', {
          url: `/products/${storeGuid}/${productId}/stock`,
          payload: { quantity, operation },
          baseURL: API_URL
        });
        const { data } = await axios.patch(
          `/products/${storeGuid}/${productId}/stock`,
          { quantity, operation }
        );
        console.log('[StoreProvider][updateStock] Node stock update response', data);
        return data;
      } catch (error) {
        console.error('[StoreProvider][updateStock] Error updating stock', {
          storeGuid,
          productId,
          quantity,
          operation,
          apiUrl: API_URL,
          isPhpBackend: IS_PHP_BACKEND,
          error
        });
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[StoreProvider][updateStock] onSuccess, invalidating products query', { storeGuid });
      queryClient.invalidateQueries(['products', storeGuid]);
    },
    onError: (error) => {
      console.error('[StoreProvider][updateStock] onError', error);
    }
  });
  
  // Store access
  const accessStore = async (guid, label, email = null, businessName = null, emailConsent = false) => {
    try {
      const endpoint = IS_PHP_BACKEND
        ? `${API_URL}/auth/store-access.php`
        : `${API_URL}/auth/store/access`;

      console.log('[StoreProvider][accessStore] Requesting store access', {
        endpoint,
        guid,
        label,
        email,
        businessName,
        emailConsent,
        apiUrl: API_URL,
        isPhpBackend: IS_PHP_BACKEND
      });

      const { data } = await axios.post(endpoint, {
        guid,
        label,
        email,
        businessName: businessName || label, // Use businessName if provided, otherwise use label
        emailConsent
      });

      console.log('[StoreProvider][accessStore] Response data', data);

      if (data.success) {
        useStore.getState().setStoreInfo(guid, label);
        useStore.getState().setSessionToken(data.sessionToken);
        console.log('[StoreProvider][accessStore] Store info and session token set in store', {
          guid,
          label
        });
        return data;
      } else {
        console.warn('[StoreProvider][accessStore] Store access not successful', data);
      }
    } catch (error) {
      console.error('Store access error:', error);
      throw error;
    }
  };
  
  // Generate new GUID
  const generateGuid = async () => {
    try {
      const endpoint = IS_PHP_BACKEND
        ? `${API_URL}/auth/generate-guid.php`
        : `${API_URL}/auth/store/generate`;
      const { data } = await axios.get(endpoint);
      return data.guid;
    } catch (error) {
      console.error('GUID generation error:', error);
      throw error;
    }
  };
  
  // Recover store by email
  const recoverStore = async (email) => {
    try {
      const endpoint = IS_PHP_BACKEND
        ? `${API_URL}/auth/recover.php`
        : `${API_URL}/auth/store/recover`;
      const { data } = await axios.post(endpoint, { email });
      return data;
    } catch (error) {
      console.error('Store recovery error:', error);
      throw error;
    }
  };
  
  // Refresh products
  const refreshProducts = () => {
    queryClient.invalidateQueries(['products', storeGuid]);
  };
  
  // Refresh categories
  const refreshCategories = () => {
    queryClient.invalidateQueries(['categories', storeGuid]);
  };

  const value = {
    products: products || [],
    categories: categories || [],
    productsLoading,
    createOrder: createOrderMutation.mutate,
    processPayment: processPaymentMutation.mutate,
    updateStock: updateStockMutation.mutate,
    refreshProducts,
    refreshCategories,
    accessStore,
    generateGuid,
    recoverStore
  };
  
  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
