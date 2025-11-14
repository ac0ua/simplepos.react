const { sequelize } = require('../config/database');
const Store = require('./Store');
const StoreLabel = require('./StoreLabel');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const User = require('./User');
const AdminSettings = require('./AdminSettings');

// Define relationships
Store.hasMany(StoreLabel, { foreignKey: 'store_id', as: 'labels' });
StoreLabel.belongsTo(Store, { foreignKey: 'store_id' });

Store.hasMany(Product, { foreignKey: 'store_id', as: 'products' });
Product.belongsTo(Store, { foreignKey: 'store_id' });

Store.hasMany(Order, { foreignKey: 'store_id', as: 'orders' });
Order.belongsTo(Store, { foreignKey: 'store_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

// Sync database
const syncDatabase = async (force = false) => {
  try {
    // In production, use alter: false to avoid schema checks on every startup
    // Set alter: true only during development when you need schema updates
    const shouldAlter = process.env.DB_AUTO_ALTER === 'true' || false;
    await sequelize.sync({ force, alter: force ? false : shouldAlter });
    console.log('✅ Database synchronized successfully');
    
    // Seed default data if force sync
    if (force) {
      await seedDefaultData();
    }
  } catch (error) {
    console.error('❌ Database sync error:', error);
    throw error;
  }
};

// Seed default data
const seedDefaultData = async () => {
  try {
    // Create demo store
    const demoStore = await Store.create({
      guid: '6c24c729-3edc-4ada-be8f-96d34b4d8dd3',
      business_name: 'Happy Days Store',
      currency: 'USD',
      currency_symbol: '$',
      tax_rate: 0.08
    });
    
    // Create demo label
    await StoreLabel.create({
      store_id: demoStore.id,
      label: 'happydays',
      permissions: ['read', 'write', 'admin']
    });
    
    // Create default admin settings
    await AdminSettings.bulkCreate([
      {
        setting_key: 'max_instances_per_email',
        setting_value: '3',
        description: 'Maximum number of store instances allowed per email address'
      }
    ]);
    
    // Create demo products
    const defaultProducts = [
      {
        store_id: demoStore.id,
        name: 'Candy Bar',
        price: 1.55,
        category: 'Snacks',
        image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop',
        stock: 100,
        barcode: '1234567890',
        color: '#FFB6C1'
      },
      {
        store_id: demoStore.id,
        name: 'Chips',
        price: 2.50,
        category: 'Snacks',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop',
        stock: 75,
        barcode: '2345678901',
        color: '#FFD700'
      },
      {
        store_id: demoStore.id,
        name: 'Ice Cream',
        price: 3.50,
        category: 'Frozen',
        image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop',
        stock: 50,
        barcode: '3456789012',
        color: '#87CEEB'
      },
      {
        store_id: demoStore.id,
        name: 'Motor Oil',
        price: 6.09,
        category: 'Automotive',
        image: 'https://images.unsplash.com/photo-1621188988909-fbef0a88dc04?w=300&h=300&fit=crop',
        stock: 30,
        barcode: '4567890123',
        color: '#708090'
      },
      {
        store_id: demoStore.id,
        name: 'Sample Product',
        price: 3.87,
        category: 'All Products',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
        stock: 200,
        barcode: '5678901234',
        color: '#FFD700'
      },
      {
        store_id: demoStore.id,
        name: 'Soda',
        price: 1.75,
        category: 'Beverages',
        image: 'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?w=300&h=300&fit=crop',
        stock: 150,
        barcode: '6789012345',
        color: '#98D8C8'
      },
      {
        store_id: demoStore.id,
        name: 'Water Bottle',
        price: 1.00,
        category: 'Beverages',
        image: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=300&h=300&fit=crop',
        stock: 200,
        barcode: '7890123456',
        color: '#E0F2F1'
      }
    ];
    
    await Product.bulkCreate(defaultProducts);
    
    console.log('✅ Default data seeded successfully');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
};

module.exports = {
  sequelize,
  Store,
  StoreLabel,
  Product,
  Order,
  OrderItem,
  User,
  AdminSettings,
  syncDatabase
};
