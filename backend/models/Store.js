const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  guid: {
    type: DataTypes.UUID,
    allowNull: false,
    validate: {
      isUUID: 4
    }
  },
  business_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'My Business'
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  currency_symbol: {
    type: DataTypes.STRING(5),
    defaultValue: '$'
  },
  tax_rate: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0.0800
  },
  tax_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'stores',
  indexes: [
    {
      unique: true,
      fields: ['guid']
    }
  ]
});

module.exports = Store;
