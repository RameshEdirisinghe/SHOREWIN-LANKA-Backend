/**
 * seed-admin.js — One-time script to create the admin account in MongoDB.
 *
 * Usage:
 *   node seed-admin.js
 *
 * The script reads ADMIN_USERNAME and ADMIN_PASSWORD from the .env file,
 * hashes the password with bcrypt, and upserts the admin record in MongoDB.
 * Run this once after setting up the project — never hardcode credentials.
 */

const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGO_URI      = process.env.MONGO_URI;
const DB_NAME        = process.env.DB_NAME || 'spiceShop';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGO_URI || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error('[Seed] ❌ Missing required environment variables: MONGO_URI, ADMIN_USERNAME, ADMIN_PASSWORD');
  process.exit(1);
}

const adminSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

async function seed() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    console.log('[Seed] ✅ Connected to MongoDB');

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await Admin.findOneAndUpdate(
      { username: ADMIN_USERNAME.toLowerCase().trim() },
      { username: ADMIN_USERNAME.toLowerCase().trim(), passwordHash },
      { upsert: true, new: true }
    );

    console.log(`[Seed] ✅ Admin account "${ADMIN_USERNAME}" created / updated successfully.`);
    console.log('[Seed] ℹ️  Credentials are stored hashed — never as plaintext.');
  } catch (err) {
    console.error('[Seed] ❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] 🔌 Disconnected from MongoDB.');
  }
}

seed();
