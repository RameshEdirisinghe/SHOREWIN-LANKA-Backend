const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userDetails: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true }
  },
  items: [
    {
      id: { type: String, required: true },
      key: { type: String },
      name: { type: String, required: true },
      sinhala: { type: String },
      grade: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, default: 'kg' },
      price: { type: Number, required: true }
    }
  ],
  subtotal: { type: Number, required: true },
  shipping: { type: Number, required: true },
  total: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'CONFIRMED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
