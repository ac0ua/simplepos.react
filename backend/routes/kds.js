const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');

let io;

// Set the Socket.IO instance
const setIO = (socketIO) => {
  io = socketIO;
};

/**
 * GET /api/kds/:storeId/summary
 * Get aggregated counts of pending items by category
 */
router.get('/:storeId/summary', async (req, res) => {
  try {
    const { storeId } = req.params;

    // Get all active orders (pending, active, processing) for this store
    const activeOrders = await Order.findAll({
      where: {
        store_id: storeId,
        status: {
          [Op.in]: ['pending', 'active', 'processing']
        }
      },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'Product',
          attributes: ['category']
        }]
      }]
    });

    // Aggregate items by category
    const categoryMap = new Map();

    activeOrders.forEach(order => {
      order.items.forEach(item => {
        const category = item.Product?.category || 'Uncategorized';
        const pendingQty = item.quantity - item.prep_quantity;

        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category,
            totalPending: 0,
            totalPrepared: 0,
            items: []
          });
        }

        const categoryData = categoryMap.get(category);
        categoryData.totalPending += pendingQty;
        categoryData.totalPrepared += item.prep_quantity;
      });
    });

    // Convert to array and sort by category name
    const summary = Array.from(categoryMap.values())
      .sort((a, b) => a.category.localeCompare(b.category));

    res.json({
      success: true,
      storeId,
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching KDS summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch KDS summary',
      message: error.message
    });
  }
});

/**
 * GET /api/kds/:storeId/category/:category
 * Get detailed items for a specific category
 */
router.get('/:storeId/category/:category', async (req, res) => {
  try {
    const { storeId, category } = req.params;

    // Get all active orders for this store
    const activeOrders = await Order.findAll({
      where: {
        store_id: storeId,
        status: {
          [Op.in]: ['pending', 'active', 'processing']
        }
      },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'Product',
          attributes: ['id', 'name', 'category']
        }]
      }],
      order: [['created_at', 'ASC']]
    });

    // Filter and aggregate items by product name for this category
    const itemsMap = new Map();
    const preparedItemsMap = new Map();

    activeOrders.forEach(order => {
      order.items.forEach(item => {
        const itemCategory = item.Product?.category || 'Uncategorized';
        
        if (itemCategory === category) {
          const productName = item.product_name;
          const pendingQty = item.quantity - item.prep_quantity;
          const preparedQty = item.prep_quantity;

          // Pending items
          if (pendingQty > 0) {
            if (!itemsMap.has(productName)) {
              itemsMap.set(productName, {
                productName,
                productId: item.product_id,
                totalQuantity: 0,
                orderItems: []
              });
            }
            const itemData = itemsMap.get(productName);
            itemData.totalQuantity += pendingQty;
            itemData.orderItems.push({
              orderItemId: item.id,
              orderId: order.id,
              orderName: order.order_name,
              kioskNumber: order.kiosk_number,
              quantity: pendingQty,
              createdAt: order.created_at
            });
          }

          // Prepared items
          if (preparedQty > 0) {
            if (!preparedItemsMap.has(productName)) {
              preparedItemsMap.set(productName, {
                productName,
                productId: item.product_id,
                totalQuantity: 0,
                orderItems: []
              });
            }
            const preparedData = preparedItemsMap.get(productName);
            preparedData.totalQuantity += preparedQty;
            preparedData.orderItems.push({
              orderItemId: item.id,
              orderId: order.id,
              orderName: order.order_name,
              kioskNumber: order.kiosk_number,
              quantity: preparedQty,
              createdAt: order.created_at
            });
          }
        }
      });
    });

    // Convert to arrays
    const pendingItems = Array.from(itemsMap.values())
      .sort((a, b) => a.productName.localeCompare(b.productName));
    
    const preparedItems = Array.from(preparedItemsMap.values())
      .sort((a, b) => a.productName.localeCompare(b.productName));

    res.json({
      success: true,
      storeId,
      category,
      pendingItems,
      preparedItems,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching category items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category items',
      message: error.message
    });
  }
});

/**
 * POST /api/kds/:storeId/mark-prepared
 * Mark items as prepared
 */
router.post('/:storeId/mark-prepared', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { orderItemId, quantity } = req.body;

    if (!orderItemId || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderItemId and quantity'
      });
    }

    // Find the order item
    const orderItem = await OrderItem.findByPk(orderItemId, {
      include: [{
        model: Order,
        where: { store_id: storeId }
      }, {
        model: Product,
        as: 'Product'
      }]
    });

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        error: 'Order item not found'
      });
    }

    // Calculate new prep_quantity
    const newPrepQty = Math.min(
      orderItem.prep_quantity + quantity,
      orderItem.quantity
    );

    // Update prep_quantity
    orderItem.prep_quantity = newPrepQty;
    
    // Update prep_status based on whether all items are prepared
    if (newPrepQty >= orderItem.quantity) {
      orderItem.prep_status = 'prepared';
    }

    await orderItem.save();

    // Emit WebSocket event for real-time update
    if (io) {
      const storeGuid = orderItem.Order?.store_id; // Access Order with capital O
      io.emit('kds-update', {
        storeId,
        action: 'item-prepared',
        orderItemId,
        category: orderItem.Product?.category,
        prepQuantity: newPrepQty,
        totalQuantity: orderItem.quantity
      });
    }

    res.json({
      success: true,
      orderItem: {
        id: orderItem.id,
        productName: orderItem.product_name,
        quantity: orderItem.quantity,
        prepQuantity: orderItem.prep_quantity,
        prepStatus: orderItem.prep_status
      }
    });

  } catch (error) {
    console.error('Error marking item as prepared:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark item as prepared',
      message: error.message
    });
  }
});

/**
 * POST /api/kds/:storeId/unprepare
 * Reduce prepared quantity (undo preparation)
 */
router.post('/:storeId/unprepare', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { orderItemId, quantity } = req.body;

    if (!orderItemId || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderItemId and quantity'
      });
    }

    // Find the order item
    const orderItem = await OrderItem.findByPk(orderItemId, {
      include: [{
        model: Order,
        where: { store_id: storeId }
      }, {
        model: Product,
        as: 'Product'
      }]
    });

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        error: 'Order item not found'
      });
    }

    // Calculate new prep_quantity (can't go below 0)
    const newPrepQty = Math.max(orderItem.prep_quantity - quantity, 0);

    // Update prep_quantity
    orderItem.prep_quantity = newPrepQty;
    
    // Update prep_status
    orderItem.prep_status = newPrepQty >= orderItem.quantity ? 'prepared' : 'pending';

    await orderItem.save();

    // Emit WebSocket event for real-time update
    if (io) {
      io.emit('kds-update', {
        storeId,
        action: 'item-unprepared',
        orderItemId,
        category: orderItem.Product?.category,
        prepQuantity: newPrepQty,
        totalQuantity: orderItem.quantity
      });
    }

    res.json({
      success: true,
      orderItem: {
        id: orderItem.id,
        productName: orderItem.product_name,
        quantity: orderItem.quantity,
        prepQuantity: orderItem.prep_quantity,
        prepStatus: orderItem.prep_status
      }
    });

  } catch (error) {
    console.error('Error unpreparing item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unprepare item',
      message: error.message
    });
  }
});

module.exports = router;
module.exports.setIO = setIO;
