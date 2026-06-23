require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

// Cache the connection across serverless invocations (Vercel best practice).
// Without this, each cold start opens a new connection and hits the 500ms timeout.
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectMongo = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is not set. Check Vercel environment variables.');
      return null;
    }
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        dbName: process.env.DB_NAME,
      })
      .then((m) => {
        console.log('✅ MongoDB connected');
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        // Do NOT call process.exit() in serverless — it crashes the function
        console.error('❌ MongoDB connection error:', err.message);
        return null;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = { connectMongo };

