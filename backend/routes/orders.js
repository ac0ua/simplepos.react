const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Order, OrderItem, Product, Store } = require('../models');
const { Op } = require('sequelize');

// Get io instance from app
let io;
router.setIO = (ioInstance) => {
  io = ioInstance;
};

// Create new order
router.post('/:storeGuid', async (req, res) => {
  try {
    const { storeGuid } = req.params;
    const { 
      items, 
      subtotal, 
      tax, 
      total, 
      paymentMethod, 
      cashierAction, 
      cashGiven, 
      changeAmount,
      orderName,
      orderNumber,
      kioskNumber,
      paymentStatus,
      orderStatus
    } = req.body;
    
    console.log('📝 Creating order with name:', orderName);
    console.log('📝 Order number:', orderNumber);
    console.log('📝 Kiosk number:', kioskNumber);
    
    const store = await Store.findOne({ where: { guid: storeGuid } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    // Create order
    const order = await Order.create({
      order_id: orderNumber || uuidv4(),
      store_id: store.id,
      order_name: orderName,
      kiosk_number: kioskNumber,
      subtotal,
      tax,
      total,
      payment_method: paymentMethod || null,
      cash_given: cashGiven,
      change_amount: changeAmount,
      status: (orderStatus && orderStatus.trim()) || (paymentStatus && paymentStatus.trim()) || 'pending',
      cashier_action: cashierAction
    });
    
    console.log('✅ Order created:', order.order_id, 'Name:', order.order_name);
    
    // Create order items
    const orderItems = await Promise.all(
      items.map(item =>
        OrderItem.create({
          order_id: order.id,
          product_id: item.id,
          product_name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })
      )
    );
    
    // Update product stock
    for (const item of items) {
      await Product.decrement('stock', {
        by: item.quantity,
        where: { id: item.id }
      });
    }
    
    const fullOrder = {
      ...order.toJSON(),
      items: orderItems
    };
    
    // Emit WebSocket event for real-time update
    if (io) {
      const store = await Store.findByPk(order.store_id, {
        include: [{ association: 'labels' }]
      });
      if (store && store.labels) {
        store.labels.forEach(labelObj => {
          const roomId = `${storeGuid}-${labelObj.label}`;
          console.log('📡 Broadcasting new order to room:', roomId);
          io.to(roomId).emit('order-created', fullOrder);
        });
      }
    }
    
    res.json({
      success: true,
      order: fullOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all orders for a store
router.get('/:storeGuid', async (req, res) => {
  try {
    const { storeGuid } = req.params;
    const { status, date, limit = 50, offset = 0 } = req.query;
    
    const store = await Store.findOne({ where: { guid: storeGuid } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const where = { store_id: store.id };
    
    if (status) {
      where.status = status;
    }
    
    if (date) {
      const targetDate = new Date(date);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      where.created_at = {
        [Op.gte]: targetDate,
        [Op.lt]: nextDate
      };
    }
    
    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [{
        model: OrderItem,
        as: 'items'
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      orders,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Process payment for an order
router.post('/:storeGuid/:orderId/payment', async (req, res) => {
  try {
    const { storeGuid, orderId } = req.params;
    const { paymentMethod, amount, cashGiven, changeAmount } = req.body;
    
    const store = await Store.findOne({ where: { guid: storeGuid } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const order = await Order.findOne({ 
      where: { 
        order_id: orderId,
        store_id: store.id 
      } 
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Update order with payment information
    await order.update({
      payment_method: paymentMethod,
      cash_given: cashGiven,
      change_amount: changeAmount,
      status: 'active'
    });
    
    console.log('💳 Payment processed for order:', orderId, 'Method:', paymentMethod);
    
    res.json({ 
      success: true, 
      order,
      message: 'Payment processed successfully' 
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status
router.patch('/:storeGuid/:orderId/status', async (req, res) => {
  try {
    const { storeGuid, orderId } = req.params;
    const { status } = req.body;
    
    const store = await Store.findOne({ where: { guid: storeGuid } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const order = await Order.findOne({ 
      where: { 
        order_id: orderId,
        store_id: store.id 
      } 
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Update order status and timestamps
    const updateData = { status };
    
    if (status === 'cancelled') {
      updateData.cancelled_at = new Date();
    } else if (status === 'completed') {
      updateData.completed_at = new Date();
    } else if (status === 'active' || status === 'pending') {
      // Clear timestamps when reactivating
      updateData.cancelled_at = null;
      updateData.completed_at = null;
    }
    
    await order.update(updateData);
    
    console.log('📝 Order status updated:', orderId, 'Status:', status);
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      // Get the store to find the label
      const storeWithLabel = await Store.findOne({
        where: { guid: storeGuid },
        include: [{
          model: require('../models/StoreLabel'),
          as: 'labels'
        }]
      });
      
      // Get updated order with items
      const updatedOrder = await Order.findOne({
        where: { order_id: orderId },
        include: [{ model: require('../models/OrderItem'), as: 'items' }]
      });
      
      // Emit to all rooms for this store (all labels)
      if (storeWithLabel && storeWithLabel.labels) {
        console.log('📡 Emitting orderUpdate to labels:', storeWithLabel.labels.map(l => l.label));
        storeWithLabel.labels.forEach(labelObj => {
          const roomId = `${storeGuid}-${labelObj.label}`;
          console.log('📡 Emitting to room:', roomId);
          io.to(roomId).emit('orderUpdate', {
            action: 'statusUpdate',
            order: updatedOrder
          });
        });
      } else {
        console.log('❌ No labels found for store:', storeGuid);
      }
    }
    
    res.json({ 
      success: true, 
      order,
      message: `Order ${status}` 
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single order
router.get('/:storeGuid/:orderId', async (req, res) => {
  try {
    const { storeGuid, orderId } = req.params;
    
    const store = await Store.findOne({ where: { guid: storeGuid } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const order = await Order.findOne({
      where: {
        order_id: orderId,
        store_id: store.id
      },
      include: [{
        model: OrderItem,
        as: 'items'
      }]
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status
router.patch('/:storeGuid/:orderId/status', async (req, res) => {
  try {
    const { storeGuid, orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const store = await Store.findOne({ where: { guid: storeGuid } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const order = await Order.findOne({
      where: {
        order_id: orderId,
        store_id: store.id
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    order.status = status;
    
    if (status === 'completed') {
      order.completed_at = new Date();
    } else if (status === 'cancelled') {
      order.cancelled_at = new Date();
    }
    
    await order.save();
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Process payment
router.post('/:storeGuid/:orderId/payment', async (req, res) => {
  try {
    const { storeGuid, orderId } = req.params;
    const { paymentMethod, amount, cashGiven, changeAmount } = req.body;
    
    const store = await Store.findOne({ where: { guid: storeGuid } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const order = await Order.findOne({
      where: {
        order_id: orderId,
        store_id: store.id
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    order.payment_method = paymentMethod;
    order.cash_given = cashGiven;
    order.change_amount = changeAmount;
    order.status = 'completed';
    order.completed_at = new Date();
    
    await order.save();
    
    res.json({
      success: true,
      order,
      payment: {
        id: uuidv4(),
        orderId: order.order_id,
        method: paymentMethod,
        amount,
        cashGiven,
        changeAmount,
        status: 'completed',
        processedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel order
router.delete('/:storeGuid/:orderId', async (req, res) => {
  try {
    const { storeGuid, orderId } = req.params;
    
    const store = await Store.findOne({ where: { guid: storeGuid } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const order = await Order.findOne({
      where: {
        order_id: orderId,
        store_id: store.id
      },
      include: [{
        model: OrderItem,
        as: 'items'
      }]
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({
        error: 'Only pending orders can be cancelled'
      });
    }
    
    // Restore product stock
    for (const item of order.items) {
      await Product.increment('stock', {
        by: item.quantity,
        where: { id: item.product_id }
      });
    }
    
    order.status = 'cancelled';
    order.cancelled_at = new Date();
    await order.save();
    
    res.json({
      success: true,
      message: 'Order cancelled',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public order tracking - Get order by label and order number (for QR code scanning)
router.get('/track/:label/:orderNumber', async (req, res) => {
  try {
    const { label, orderNumber } = req.params;
    
    console.log('🔍 Tracking order:', orderNumber, 'for label:', label);
    
    // Find store by label
    const { StoreLabel } = require('../models');
    const storeLabel = await StoreLabel.findOne({ 
      where: { label },
      include: [{ model: Store }]
    });
    
    if (!storeLabel || !storeLabel.Store) {
      console.log('❌ Store not found for label:', label);
      return res.status(404).json({ error: 'Store not found' });
    }
    
    console.log('✅ Store found:', storeLabel.Store.id);
    
    // Find order by order number
    console.log('🔍 Looking for order:', orderNumber, 'in store:', storeLabel.Store.id);
    
    const order = await Order.findOne({
      where: {
        order_id: orderNumber,
        store_id: storeLabel.Store.id
      },
      include: [{
        model: OrderItem,
        as: 'items'
      }]
    });
    
    if (!order) {
      console.log('❌ Order not found:', orderNumber);
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Return order with payment status
    const orderData = {
      ...order.toJSON(),
      payment_status: order.payment_method ? 'paid' : 'pending'
    };
    
    console.log('✅ Order found:', orderData.order_id);
    
    res.json(orderData);
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get order statistics
router.get('/:storeGuid/stats', async (req, res) => {
  try {
    const { storeGuid } = req.params;
    
    const store = await Store.findOne({ where: { guid: storeGuid } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [totalOrders, todayOrders, todayRevenue, pendingOrders, completedOrders] = await Promise.all([
      Order.count({ where: { store_id: store.id } }),
      Order.count({
        where: {
          store_id: store.id,
          created_at: { [Op.gte]: today, [Op.lt]: tomorrow }
        }
      }),
      Order.sum('total', {
        where: {
          store_id: store.id,
          created_at: { [Op.gte]: today, [Op.lt]: tomorrow },
          status: 'completed'
        }
      }),
      Order.count({ where: { store_id: store.id, status: 'pending' } }),
      Order.count({ where: { store_id: store.id, status: 'completed' } })
    ]);
    
    const avgOrder = await Order.findOne({
      where: { store_id: store.id, status: 'completed' },
      attributes: [[Order.sequelize.fn('AVG', Order.sequelize.col('total')), 'average']]
    });
    
    const stats = {
      totalOrders,
      todayOrders,
      todayRevenue: todayRevenue || 0,
      pendingOrders,
      completedOrders,
      averageOrderValue: parseFloat(avgOrder?.dataValues?.average || 0)
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
