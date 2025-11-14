import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore';

const StoreContext = createContext(null);

// Configure axios defaults - use window.location.hostname for cross-device support
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:5000/api`;
};

axios.defaults.baseURL = getApiBaseUrl();
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
  const setProducts = useStore((state) => state.setProducts);
  const setCategories = useStore((state) => state.setCategories);
  
  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', storeGuid],
    queryFn: async () => {
      if (!storeGuid) return [];
      const { data } = await axios.get(`/products/${storeGuid}`);
      return data;
    },
    enabled: !!storeGuid,
    onSuccess: (data) => {
      setProducts(data);
    }
  });
  
  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories', storeGuid],
    queryFn: async () => {
      if (!storeGuid) return [];
      const { data } = await axios.get(`/products/${storeGuid}/categories`);
      return data;
    },
    enabled: !!storeGuid,
    onSuccess: (data) => {
      setCategories(data);
    }
  });
  
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
      const { data } = await axios.patch(
        `/products/${storeGuid}/${productId}/stock`,
        { quantity, operation }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products', storeGuid]);
    }
  });
  
  // Store access
  const accessStore = async (guid, label, email = null, businessName = null, emailConsent = false) => {
    try {
      const { data } = await axios.post('/auth/store/access', {
        guid,
        label,
        email,
        businessName: businessName || label, // Use businessName if provided, otherwise use label
        emailConsent
      });

      if (data.success) {
        useStore.getState().setStoreInfo(guid, label);
        useStore.getState().setSessionToken(data.sessionToken);
        return data;
      }
    } catch (error) {
      console.error('Store access error:', error);
      throw error;
    }
  };
  
  // Generate new GUID
  const generateGuid = async () => {
    try {
      const { data } = await axios.get('/auth/store/generate');
      return data.guid;
    } catch (error) {
      console.error('GUID generation error:', error);
      throw error;
    }
  };
  
  // Refresh products
  const refreshProducts = () => {
    queryClient.invalidateQueries(['products', storeGuid]);
  };

  const value = {
    products: products || [],
    categories: categories || [],
    productsLoading,
    createOrder: createOrderMutation.mutate,
    processPayment: processPaymentMutation.mutate,
    updateStock: updateStockMutation.mutate,
    refreshProducts,
    accessStore,
    generateGuid
  };
  
  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
