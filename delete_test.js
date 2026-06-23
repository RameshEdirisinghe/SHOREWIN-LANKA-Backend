require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Product = require('./src/models/product.model');

const testDelete = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
    const p = await Product.findOne({ id: 'cinnamon' }).lean();
    console.log('Cinnamon product before query:', p);
    // Use findOne to avoid actually deleting it yet
    const found = await Product.findOne({ id: 'cinnamon' });
    console.log('Found product using Model.findOne({ id: "cinnamon" }):', found ? 'YES' : 'NO');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

testDelete();
