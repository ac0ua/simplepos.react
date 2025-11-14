const express = require('express');
const router = express.Router();
const { AdminSettings, Store, StoreLabel } = require('../models');

// Get admin settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await AdminSettings.findAll();
    const settingsObj = {};

    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ error: 'Failed to fetch admin settings' });
  }
});

// Update admin setting
router.post('/settings', async (req, res) => {
  try {
    const { setting_key, setting_value, description } = req.body;

    if (!setting_key || !setting_value) {
      return res.status(400).json({ error: 'Setting key and value are required' });
    }

    // Upsert the setting
    const [setting, created] = await AdminSettings.upsert({
      setting_key,
      setting_value,
      description: description || ''
    });

    res.json({
      success: true,
      setting,
      created
    });
  } catch (error) {
    console.error('Error updating admin setting:', error);
    res.status(500).json({ error: 'Failed to update admin setting' });
  }
});

// Get admin statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalStoresResult] = await Store.sequelize.query('SELECT COUNT(*) as count FROM stores');
    const [totalStoreLabelsResult] = await StoreLabel.sequelize.query('SELECT COUNT(*) as count FROM store_labels');
    const [uniqueEmailsResult] = await StoreLabel.sequelize.query('SELECT COUNT(DISTINCT recovery_email) as count FROM store_labels WHERE recovery_email IS NOT NULL AND recovery_email != ""');

    res.json({
      totalStores: parseInt(totalStoresResult[0].count, 10),
      totalStoreLabels: parseInt(totalStoreLabelsResult[0].count, 10),
      uniqueEmails: parseInt(uniqueEmailsResult[0].count, 10)
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

module.exports = router;
