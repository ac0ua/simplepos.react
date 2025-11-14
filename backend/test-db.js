// Quick database connection test
require('dotenv').config();
const { testConnection } = require('./config/database');
const { Store, Product, Order } = require('./models');

async function testDatabase() {
  console.log('🧪 Testing MySQL Database Connection...\n');
  
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    // Count stores
    const storeCount = await Store.count();
    console.log(`📊 Stores in database: ${storeCount}`);
    
    // List stores
    const stores = await Store.findAll({
      attributes: ['guid', 'business_name', 'created_at']
    });
    
    if (stores.length > 0) {
      console.log('\n📋 Store List:');
      stores.forEach(store => {
        console.log(`  - ${store.business_name} (${store.guid})`);
      });
    }
    
    // Count products
    const productCount = await Product.count();
    console.log(`\n📦 Total products: ${productCount}`);
    
    // Count orders
    const orderCount = await Order.count();
    console.log(`🛒 Total orders: ${orderCount}`);
    
    // Get demo store details
    const demoStore = await Store.findOne({
      where: { guid: '6c24c729-3edc-4ada-be8f-96d34b4d8dd3' }
    });
    
    if (demoStore) {
      console.log('\n✅ Demo store found!');
      console.log(`   Name: ${demoStore.business_name}`);
      console.log(`   GUID: ${demoStore.guid}`);
      console.log(`   Tax Rate: ${(demoStore.tax_rate * 100).toFixed(2)}%`);
      
      // Get demo store products
      const demoProducts = await Product.count({
        where: { store_id: demoStore.id }
      });
      console.log(`   Products: ${demoProducts}`);
    } else {
      console.log('\n⚠️  Demo store not found - will be created on first access');
    }
    
    console.log('\n✅ Database test completed successfully!');
    console.log('\n🚀 Your Simple POS system is ready to use!');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Backend: http://localhost:5000');
    console.log('   Database: MySQL on port 3306');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    process.exit(1);
  }
}

testDatabase();
