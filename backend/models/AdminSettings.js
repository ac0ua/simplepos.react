const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AdminSettings = sequelize.define('AdminSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  setting_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  setting_value: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'admin_settings',
  indexes: [
    {
      unique: true,
      fields: ['setting_key']
    }
  ]
});

module.exports = AdminSettings;
