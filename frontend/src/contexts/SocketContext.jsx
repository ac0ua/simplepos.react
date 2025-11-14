import React, { createContext, useContext, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [socket, setSocket] = React.useState(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const storeGuid = useStore((state) => state.storeGuid);
  const label = useStore((state) => state.label);
  const hasShownConnectionIssue = useRef(false);
  
  useEffect(() => {
    if (!storeGuid || !label) return;
    
    // Initialize socket connection - use window.location.hostname to work across devices
    const socketUrl = `http://${window.location.hostname}:5000`;
    console.log('🔌 Connecting to WebSocket:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 50, // Increased from 5 to 50
      timeout: 20000,
      forceNew: false,
      autoConnect: true
    });
    
    const socket = socketRef.current;
    
    // Connection events
    socket.on('connect', () => {
      console.log('Connected to server');
      console.log('🏪 Joining room with storeGuid:', storeGuid, 'label:', label);
      console.log('🏪 Room ID will be:', `${storeGuid}-${label}`);
      toast.success('Connected to server');
      setIsConnected(true);
      setSocket(socketRef.current);
      hasShownConnectionIssue.current = false;
      
      // Join store room
      socket.emit('join-store', { storeGuid, label });
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      if (!hasShownConnectionIssue.current) {
        toast.error('Disconnected from server');
        hasShownConnectionIssue.current = true;
      }
      setIsConnected(false);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      console.log('🔄 Will retry connection...');
      // Don't show toast for every reconnection attempt, only after multiple failures
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected to server after ${attemptNumber} attempts`);
      toast.success('Reconnected to server');
      hasShownConnectionIssue.current = false;
    });

    socket.on('reconnect_error', (error) => {
      console.error('Reconnection failed:', error);
      // Only show error toast after several failed attempts
      if (!hasShownConnectionIssue.current) {
        toast.error('Connection lost - attempting to reconnect...');
        hasShownConnectionIssue.current = true;
      }
    });

    socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after all attempts');
      toast.error('Unable to reconnect. Please check server status.');
    });
    
    // Store events
    socket.on('store-state', (storeData) => {
      console.log('Received store state:', storeData);
    });
    
    socket.on('order-update', ({ orderId, orderData }) => {
      console.log('Order update:', orderId, orderData);
      toast.success(`New order: ${orderId.slice(0, 8)}...`);
    });
    
    socket.on('product-update', ({ action, productData }) => {
      console.log('Product update:', action, productData);
      
      // Handle product updates based on action
      switch (action) {
        case 'stock-update':
          toast.info(`Stock updated for ${productData.name}`);
          break;
        case 'price-change':
          toast.info(`Price updated for ${productData.name}`);
          break;
        case 'new-product':
          toast.success(`New product added: ${productData.name}`);
          break;
        default:
          break;
      }
    });
    
    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [storeGuid, label]);
  
  // Socket methods
  const emitOrderUpdate = (orderData) => {
    if (socketRef.current) {
      socketRef.current.emit('update-order', {
        storeGuid,
        label,
        orderData
      });
    }
  };
  
  const emitProductAction = (action, productData) => {
    if (socketRef.current) {
      socketRef.current.emit('product-action', {
        storeGuid,
        label,
        action,
        productData
      });
    }
  };
  
  const value = {
    socket: socket,
    emitOrderUpdate,
    emitProductAction,
    isConnected: isConnected
  };
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
