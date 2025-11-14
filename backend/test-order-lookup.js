// Test script to check order lookup
const { Store, StoreLabel, Order, OrderItem } = require('./models');

async function testOrderLookup() {
  try {
    console.log('\n=== Testing Order Lookup ===\n');
    
    // 1. List all store labels
    console.log('📋 All Store Labels:');
    const labels = await StoreLabel.findAll({
      include: [{ model: Store }]
    });
    
    labels.forEach(label => {
      console.log(`  - Label: "${label.label}" (Store ID: ${label.store_id}, Store: ${label.Store?.business_name})`);
    });
    
    // 2. List recent orders
    console.log('\n📋 Recent Orders (last 10):');
    const orders = await Order.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [{ model: OrderItem, as: 'items' }]
    });
    
    orders.forEach(order => {
      console.log(`  - Order ID: "${order.order_id}" | Kiosk: #${order.kiosk_number} | Name: ${order.order_name} | Store ID: ${order.store_id} | Status: ${order.status}`);
    });
    
    // 3. Test lookup with specific values
    console.log('\n🔍 Testing lookup for: Label="Mr Coffee", Order="K-1113-38300"');
    
    const testLabel = 'Mr Coffee';
    const testOrderId = 'K-1113-38300';
    
    const storeLabel = await StoreLabel.findOne({ 
      where: { label: testLabel },
      include: [{ model: Store }]
    });
    
    if (!storeLabel) {
      console.log(`  ❌ Store label "${testLabel}" not found`);
      console.log(`  💡 Try one of these labels instead: ${labels.map(l => `"${l.label}"`).join(', ')}`);
    } else {
      console.log(`  ✅ Store label found: "${storeLabel.label}" (Store ID: ${storeLabel.Store.id})`);
      
      const order = await Order.findOne({
        where: {
          order_id: testOrderId,
          store_id: storeLabel.Store.id
        },
        include: [{ model: OrderItem, as: 'items' }]
      });
      
      if (!order) {
        console.log(`  ❌ Order "${testOrderId}" not found in this store`);
        console.log(`  💡 Recent orders in this store:`);
        const storeOrders = await Order.findAll({
          where: { store_id: storeLabel.Store.id },
          limit: 5,
          order: [['created_at', 'DESC']]
        });
        storeOrders.forEach(o => {
          console.log(`     - "${o.order_id}" | Kiosk: #${o.kiosk_number}`);
        });
      } else {
        console.log(`  ✅ Order found!`);
        console.log(`     Order ID: ${order.order_id}`);
        console.log(`     Kiosk #: ${order.kiosk_number}`);
        console.log(`     Name: ${order.order_name}`);
        console.log(`     Total: $${order.total}`);
        console.log(`     Items: ${order.items.length}`);
      }
    }
    
    console.log('\n=== Test Complete ===\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testOrderLookup();
