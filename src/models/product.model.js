const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sinhala: { type: String },
  tagline: { type: String },
  description: {
    EN: { type: String },
    SI: { type: String }
  },
  image: { type: String },    // Supabase public URL (primary)
  imageUrl: { type: String }, // Supabase public URL (alias / redundant — kept in sync with image)
  color: { type: String },
  grades: [
    {
      name: { type: String },
      desc: {
        EN: { type: String },
        SI: { type: String }
      },
      basePriceUSD: { type: Number }
    }
  ],
  certifications: [{ type: String }],
  active: { type: Boolean, default: true },
  inStock: { type: Boolean, default: true },
  pitch: {
    title: { EN: { type: String }, SI: { type: String } },
    text: { EN: { type: String }, SI: { type: String } }
  },
  specifications: [
    {
      label: { EN: { type: String }, SI: { type: String } },
      value: { EN: { type: String }, SI: { type: String } }
    }
  ]
});

module.exports = mongoose.model('Product', ProductSchema);
