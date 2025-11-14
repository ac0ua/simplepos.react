const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.STRING(50),
    defaultValue: DataTypes.UUIDV4,
    unique: true
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  order_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  kiosk_number: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'card', 'other'),
    defaultValue: 'cash'
  },
  cash_given: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  change_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'processing', 'completed', 'cancelled', 'refunded'),
    defaultValue: 'pending'
  },
  cashier_action: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'orders',
  indexes: [
    {
      fields: ['store_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    },
    {
      unique: true,
      fields: ['order_id']
    }
  ]
});

module.exports = Order;
