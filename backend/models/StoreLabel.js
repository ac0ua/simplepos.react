const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StoreLabel = sequelize.define('StoreLabel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  label: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  display_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: ''
  },
  recovery_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: ['read', 'write']
  },
  last_access: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'store_labels',
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'label']
    },
    {
      fields: ['recovery_email']
    }
  ]
});

module.exports = StoreLabel;
