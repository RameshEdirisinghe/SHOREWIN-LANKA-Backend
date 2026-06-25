const dotenv = require('dotenv');

// IMPORTANT: Load .env BEFORE requiring any module that reads process.env at load time
dotenv.config({ path: __dirname + '/../.env' });

const express = require('express');
const cors = require('cors');
const { connectMongo } = require('./mongo');
const { verifyBucket } = require('./supabase');

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: [
    'https://shorewin-lanka-frontend.vercel.app',
    'http://localhost:5173',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight for all routes (required for CORS on Vercel)
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

// Middleware: ensure MongoDB is connected before every request.
// Uses cached connection — only truly async on the very first cold start.
app.use(async (req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (err) {
    console.error('DB connection middleware error:', err.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Only verify Supabase bucket locally — skip on Vercel (async side-effect can hang cold start)
if (!process.env.VERCEL) {
  verifyBucket().catch(err =>
    console.error('[Supabase] Startup bucket verification failed:', err.message)
  );
}

// Routes
const productRoutes = require('./routes/product.routes');
const orderRoutes   = require('./routes/order.routes');
const authRoutes    = require('./routes/auth.routes');
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Shorewin Lanka Agro Backend is running');
});

// Export app for Vercel serverless; start server only when running locally
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

module.exports = app;

