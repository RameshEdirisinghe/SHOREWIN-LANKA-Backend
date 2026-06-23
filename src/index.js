const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectMongo } = require('./mongo');
const { verifyBucket } = require('./supabase');

// Load environment variables from backend/.env
dotenv.config({ path: __dirname + '/../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'https://shorewin-lanka-frontend.vercel.app',
    'http://localhost:5173',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }));

// Connect to MongoDB
connectMongo();

// Verify Supabase bucket is public on every startup — catches misconfiguration early
verifyBucket().catch(err =>
  console.error('[Supabase] Startup bucket verification failed:', err.message)
);

// Routes
const productRoutes = require('./routes/product.routes');
const orderRoutes   = require('./routes/order.routes');
const authRoutes    = require('./routes/auth.routes');
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Spice Shop Backend is running');
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
