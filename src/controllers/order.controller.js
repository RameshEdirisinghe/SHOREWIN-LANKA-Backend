const Order = require('../models/order.model');

// Helper to generate a unique random order ID format LSR-XXXXX
const generateOrderId = async () => {
  let isUnique = false;
  let orderId = '';
  while (!isUnique) {
    const num = Math.floor(10000 + Math.random() * 90000);
    orderId = `LSR-${num}`;
    const exists = await Order.findOne({ id: orderId });
    if (!exists) {
      isUnique = true;
    }
  }
  return orderId;
};

// POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { userDetails, items, subtotal, shipping, total, currency } = req.body;

    if (!userDetails || !userDetails.name || !userDetails.address || !userDetails.phone) {
      return res.status(400).json({ error: 'Missing mandatory user details (name, address, phone)' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const orderId = await generateOrderId();

    const orderData = {
      id: orderId,
      userDetails,
      items,
      subtotal,
      shipping,
      total,
      currency,
      status: 'PENDING'
    };

    const newOrder = await Order.create(orderData);
    console.log(`[Order] ✅ Order "${orderId}" created successfully.`);
    res.status(201).json(newOrder);
  } catch (err) {
    console.error('[Order] POST /api/orders error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) {
    console.error('[Order] GET /api/orders error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/orders/:id/confirm
const confirmOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { id: req.params.id },
      { status: 'CONFIRMED' },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    console.log(`[Order] ✅ Order "${req.params.id}" confirmed.`);
    res.json(order);
  } catch (err) {
    console.error('[Order] PUT /api/orders/:id/confirm error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  confirmOrder
};
