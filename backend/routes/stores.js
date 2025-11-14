const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Store = require('../models/Store');
const StoreLabel = require('../models/StoreLabel');

// In-memory store configuration
const storeConfigs = new Map();

// Get store labels by GUID
router.get('/:storeGuid/labels', async (req, res) => {
  try {
    const { storeGuid } = req.params;
    
    // Find store by GUID
    const store = await Store.findOne({
      where: { guid: storeGuid },
      include: [{
        model: StoreLabel,
        as: 'labels'
      }]
    });
    
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }
    
    res.json({
      success: true,
      store: {
        id: store.id,
        guid: store.guid,
        business_name: store.business_name
      },
      labels: store.labels
    });
  } catch (error) {
    console.error('Error fetching store labels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch store labels',
      message: error.message
    });
  }
});

// Get store configuration
router.get('/:storeGuid/config', (req, res) => {
  const { storeGuid } = req.params;
  
  let config = storeConfigs.get(storeGuid);
  
  if (!config) {
    // Default configuration
    config = {
      storeGuid,
      businessName: 'My Business',
      currency: 'USD',
      currencySymbol: '$',
      taxRate: 0.08,
      taxEnabled: true,
      theme: {
        primaryColor: '#2196F3',
        secondaryColor: '#FF9800',
        mode: 'light'
      },
      receipt: {
        showLogo: true,
        showAddress: true,
        footerText: 'Thank you for your business!'
      },
      features: {
        inventory: true,
        analytics: true,
        multiplePayments: true,
        customerDisplay: true,
        barcode: true
      },
      createdAt: new Date().toISOString()
    };
    storeConfigs.set(storeGuid, config);
  }
  
  res.json(config);
});

// Update store configuration
router.put('/:storeGuid/config', (req, res) => {
  const { storeGuid } = req.params;
  const updates = req.body;
  
  let config = storeConfigs.get(storeGuid);
  
  if (!config) {
    config = {
      storeGuid,
      createdAt: new Date().toISOString()
    };
  }
  
  // Merge updates
  config = {
    ...config,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  storeConfigs.set(storeGuid, config);
  
  res.json({
    success: true,
    config
  });
});

// Get store analytics
router.get('/:storeGuid/analytics', (req, res) => {
  const { storeGuid } = req.params;
  const { period = 'day' } = req.query;
  
  // Mock analytics data
  const analytics = {
    period,
    revenue: {
      current: 2543.82,
      previous: 2187.45,
      change: 16.3
    },
    transactions: {
      current: 47,
      previous: 42,
      change: 11.9
    },
    averageTicket: {
      current: 54.12,
      previous: 52.08,
      change: 3.9
    },
    topProducts: [
      { name: 'Soda', quantity: 87, revenue: 152.25 },
      { name: 'Chips', quantity: 62, revenue: 155.00 },
      { name: 'Candy Bar', quantity: 58, revenue: 89.90 }
    ],
    hourlyTrend: [
      { hour: '9AM', sales: 145.50 },
      { hour: '10AM', sales: 287.25 },
      { hour: '11AM', sales: 412.75 },
      { hour: '12PM', sales: 523.50 },
      { hour: '1PM', sales: 498.25 },
      { hour: '2PM', sales: 376.50 },
      { hour: '3PM', sales: 299.82 }
    ]
  };
  
  res.json(analytics);
});

// Get active sessions for a store
router.get('/:storeGuid/sessions', (req, res) => {
  const { storeGuid } = req.params;
  
  // Mock active sessions
  const sessions = [
    {
      id: uuidv4(),
      label: 'register1',
      status: 'active',
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date().toISOString(),
      totalSales: 523.45,
      transactionCount: 12
    },
    {
      id: uuidv4(),
      label: 'register2',
      status: 'active',
      startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      totalSales: 287.30,
      transactionCount: 8
    }
  ];
  
  res.json(sessions);
});

// Close session
router.post('/:storeGuid/sessions/:sessionId/close', (req, res) => {
  const { storeGuid, sessionId } = req.params;
  
  res.json({
    success: true,
    message: 'Session closed successfully',
    sessionId,
    closedAt: new Date().toISOString()
  });
});

module.exports = router;
