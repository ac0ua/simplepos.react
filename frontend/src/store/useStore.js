import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // Store Information
      storeGuid: null,
      label: null,
      sessionToken: null,
      user: null,
      
      // Theme
      theme: 'light',
      themeConfig: null,
      
      // Cart
      cart: [],
      
      // Products
      products: [],
      categories: [],
      selectedCategory: 'All Products',
      
      // Order
      currentOrder: null,
      orders: [],
      
      // UI State
      isLoading: false,
      error: null,
      
      // Actions
      setStoreInfo: (storeGuid, label) => set({ storeGuid, label }),
      setSessionToken: (token) => set({ sessionToken: token }),
      setUser: (user) => set({ user }),
      
      // Theme Actions
      toggleTheme: () => set((state) => {
        const newMode = state.theme === 'light' ? 'dark' : 'light';
        return {
          theme: newMode,
          themeConfig: state.themeConfig
            ? { ...state.themeConfig, mode: newMode }
            : state.themeConfig
        };
      }),
      setThemeConfig: (config) => set((state) => ({
        themeConfig: config,
        theme: config && config.mode ? config.mode : state.theme
      })),
      
      // Cart Actions
      addToCart: (product) => set((state) => {
        const existingItem = state.cart.find(item => item.id === product.id);
        
        if (existingItem) {
          return {
            cart: state.cart.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          };
        }
        
        return {
          cart: [...state.cart, { ...product, quantity: 1 }]
        };
      }),
      
      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter(item => item.id !== productId)
      })),
      
      updateCartItemQuantity: (productId, quantity) => set((state) => {
        if (quantity <= 0) {
          return {
            cart: state.cart.filter(item => item.id !== productId)
          };
        }
        
        return {
          cart: state.cart.map(item =>
            item.id === productId
              ? { ...item, quantity }
              : item
          )
        };
      }),
      
      clearCart: () => set({ cart: [] }),
      
      // Calculate totals
      getCartTotal: () => {
        const state = get();
        const subtotal = state.cart.reduce((total, item) => 
          total + (item.price * item.quantity), 0
        );
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + tax;
        
        return {
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          total: total.toFixed(2),
          itemCount: state.cart.reduce((count, item) => count + item.quantity, 0)
        };
      },
      
      // Product Actions
      setProducts: (products) => set({ products }),
      setCategories: (categories) => set({ categories }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      
      // Order Actions
      createOrder: (orderData) => set((state) => ({
        orders: [...state.orders, orderData],
        currentOrder: orderData,
        cart: [] // Clear cart after order
      })),
      
      setOrders: (orders) => set({ orders }),
      
      // UI Actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'simplepos-storage',
      partialize: (state) => ({
        storeGuid: state.storeGuid,
        label: state.label,
        sessionToken: state.sessionToken,
        user: state.user,
        theme: state.theme,
        themeConfig: state.themeConfig,
        cart: state.cart
      })
    }
  )
);

export default useStore;
