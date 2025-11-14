const express = require('express');
const router = express.Router();
const { v4: uuidv4, validate: validateUuid } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Store, StoreLabel, User, AdminSettings } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'simplepos-secret-key-change-in-production';

// Helper function to get max instances per email
const getMaxInstancesPerEmail = async () => {
  try {
    const setting = await AdminSettings.findOne({
      where: { setting_key: 'max_instances_per_email' }
    });
    return setting ? parseInt(setting.setting_value, 10) : 3; // Default to 3 if not set
  } catch (error) {
    console.warn('Error getting max instances setting:', error);
    return 3; // Default fallback
  }
};

// Create or access store with GUID
router.post('/store/access', async (req, res) => {
  try {
    const { guid, label, email, businessName, emailConsent } = req.body;

    // Validate GUID
    if (!guid || !validateUuid(guid)) {
      return res.status(400).json({ error: 'Invalid GUID format' });
    }

    if (!label || label.trim().length === 0) {
      return res.status(400).json({ error: 'Label is required' });
    }

    // Validate email consent if email is provided
    if (email && emailConsent !== true) {
      return res.status(400).json({ error: 'Email consent is required when email is provided' });
    }

    // Check max instances per email if email is provided
    if (email) {
      const maxInstances = await getMaxInstancesPerEmail();
      const existingInstances = await StoreLabel.count({
        include: [{
          model: Store,
          where: {},
          required: true
        }],
        where: { recovery_email: email }
      });

      if (existingInstances >= maxInstances) {
        return res.status(400).json({
          error: `Maximum number of store instances (${maxInstances}) reached for this email address`
        });
      }
    }

    // Check if store exists
    let store = await Store.findOne({ where: { guid } });

    if (!store) {
      // Create new store
      store = await Store.create({
        guid,
        business_name: businessName || label, // Use businessName if provided, otherwise use label
        currency: 'USD',
        currency_symbol: '$',
        tax_rate: 0.08
      });
    }

    // Check if label exists for this store
    let storeLabel = await StoreLabel.findOne({
      where: {
        store_id: store.id,
        label: label
      }
    });

    if (!storeLabel) {
      // Create new label
      storeLabel = await StoreLabel.create({
        store_id: store.id,
        label: label,
        display_name: businessName || label, // Store the display name separately
        recovery_email: email || null,
        permissions: ['read', 'write']
      });
    } else {
      // Update last access and email if provided
      storeLabel.last_access = new Date();
      if (email) {
        storeLabel.recovery_email = email;
      }
      // Update display name if provided and different
      if (businessName && businessName !== storeLabel.display_name) {
        storeLabel.display_name = businessName;
      }
      await storeLabel.save();
    }

    // Generate session token
    const sessionToken = jwt.sign(
      {
        storeGuid: guid,
        label,
        displayName: businessName || label,
        type: 'guest',
        permissions: ['read', 'write']
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      sessionToken,
      storeGuid: guid,
      label,
      businessName: businessName || label,
      redirectUrl: `/${guid}/${label}/order.html`
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate new store GUID
router.get('/store/generate', (req, res) => {
  const newGuid = uuidv4();
  res.json({ guid: newGuid });
});

// Recover store access by email
router.post('/store/recover', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find all store labels with this email
    const storeLabels = await StoreLabel.findAll({
      where: { recovery_email: email },
      include: [{
        model: Store,
        attributes: ['guid', 'business_name']
      }]
    });
    
    if (storeLabels.length === 0) {
      return res.status(404).json({ error: 'No stores found for this email' });
    }
    
    // Return store information
    const stores = storeLabels.map(sl => ({
      guid: sl.Store.guid,
      label: sl.label,
      businessName: sl.Store.business_name,
      lastAccess: sl.last_access
    }));
    
    res.json({
      success: true,
      stores,
      message: `Found ${stores.length} store(s) associated with this email`
    });
  } catch (error) {
    console.error('Store recovery error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Optional: User signup for payment features
router.post('/signup', async (req, res) => {
  try {
    const { email, password, storeGuid, label } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
      user_id: uuidv4(),
      email,
      password: hashedPassword,
      subscription: 'free',
      payment_enabled: false
    });
    
    // Generate user token
    const token = jwt.sign(
      { 
        userId: user.user_id,
        email,
        type: 'registered',
        permissions: ['read', 'write', 'admin', 'payment']
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        email,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login for registered users
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { 
        userId: user.user_id,
        email,
        type: 'registered',
        permissions: ['read', 'write', 'admin', 'payment']
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        email,
        subscription: user.subscription,
        stores: []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

router.get('/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;
module.exports.verifyToken = verifyToken;
