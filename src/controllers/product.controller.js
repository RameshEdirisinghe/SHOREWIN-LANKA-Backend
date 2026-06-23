const Product = require('../models/product.model');
const { supabase, BUCKET } = require('../supabase');
const { productSchema } = require('../dtos/product.dto');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns true only for a real Supabase Storage public URL.
 * Rejects blob:, data:, localhost, and any http:// URL.
 */
const isValidSupabaseUrl = (url) =>
  typeof url === 'string' &&
  url.startsWith('https://') &&
  url.includes('.supabase.co/storage/');

/**
 * Inspects the incoming product payload and ensures `image` and `imageUrl`
 * both hold a valid Supabase public URL.
 *
 * Priority order:
 *   1. imageUrl field   (frontend sends the pre-uploaded Supabase URL here)
 *   2. image field      (same URL also sent here for backward compat)
 *   3. Base64 data URL  (legacy fallback — uploads to Supabase on the fly)
 *
 * If none of the above yield a valid URL the function throws so the caller
 * can return a 400 before touching MongoDB.
 */
const resolveImageUrl = async (product) => {
  // --- Case 1 & 2: already a valid Supabase URL sent by the frontend ---
  const candidate = isValidSupabaseUrl(product.imageUrl)
    ? product.imageUrl
    : isValidSupabaseUrl(product.image)
      ? product.image
      : null;

  if (candidate) {
    console.log(`[Product] Using pre-uploaded Supabase URL: ${candidate}`);
    product.image    = candidate;
    product.imageUrl = candidate;
    return product;
  }

  // --- Case 3: Base64 data URL (legacy / fallback) ---
  if (product.image && product.image.startsWith('data:image')) {
    console.log(`[Product] Base64 image detected — uploading to Supabase bucket "${BUCKET}"...`);
    const base64Data = product.image.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${product.id}-${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, { contentType: 'image/png', upsert: false });

    if (error) {
      console.error(`[Product] ❌ Supabase upload error:`, error.message);
      throw new Error(`Image upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    const publicUrl = urlData?.publicUrl;

    if (!isValidSupabaseUrl(publicUrl)) {
      throw new Error('Supabase returned an invalid public URL after upload.');
    }

    console.log(`[Product] ✅ Base64 image uploaded. URL: ${publicUrl}`);
    product.image    = publicUrl;
    product.imageUrl = publicUrl;
    return product;
  }

  // --- No valid image ---
  console.warn(`[Product] ⚠️  No valid image URL found in payload.`);
  console.warn(`[Product]    image    = ${String(product.image).slice(0, 80)}`);
  console.warn(`[Product]    imageUrl = ${String(product.imageUrl).slice(0, 80)}`);
  // Don't throw — allow saving without image (admin may add image later)
  return product;
};

// ─── Controllers ────────────────────────────────────────────────────────────

// GET /api/products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.json(products);
  } catch (err) {
    console.error('[Product] GET /api/products error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id }).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('[Product] GET /api/products/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  const { error, value } = productSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details });

  console.log(`[Product] Creating product "${value.id}" | imageUrl: ${value.imageUrl || '(none)'}`);

  try {
    const withImage = await resolveImageUrl(value);

    // Final guard: never write a blob/localhost URL to MongoDB
    if (withImage.image && !isValidSupabaseUrl(withImage.image)) {
      console.error('[Product] ❌ Refusing to save — image field is not a valid Supabase URL:', withImage.image);
      return res.status(400).json({ error: 'Invalid image URL. Please upload the image via Store Image first.' });
    }

    // Strip MongoDB metadata from the root payload
    const finalData = { ...withImage };
    delete finalData._id;
    delete finalData.__v;

    console.log(`[Product] Saving to MongoDB | image: ${finalData.image}`);
    const product = await Product.create(finalData);
    console.log(`[Product] ✅ Product "${value.id}" saved.`);
    res.status(201).json(product);
  } catch (err) {
    console.error('[Product] POST /api/products error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  const { error, value } = productSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details });

  console.log(`[Product] Updating product "${req.params.id}" | imageUrl: ${value.imageUrl || '(none)'}`);

  try {
    const withImage = await resolveImageUrl(value);

    // Final guard: never write a blob/localhost URL to MongoDB
    if (withImage.image && !isValidSupabaseUrl(withImage.image)) {
      console.error('[Product] ❌ Refusing to update — image field is not a valid Supabase URL:', withImage.image);
      return res.status(400).json({ error: 'Invalid image URL. Please upload the image via Store Image first.' });
    }

    // Strip MongoDB metadata from the root payload to prevent immutable field errors
    const finalData = { ...withImage };
    delete finalData._id;
    delete finalData.__v;

    console.log(`[Product] Updating MongoDB | image: ${finalData.image}`);
    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      finalData,
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    console.log(`[Product] ✅ Product "${req.params.id}" updated.`);
    res.json(product);
  } catch (err) {
    console.error('[Product] PUT /api/products/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const result = await Product.findOneAndDelete({ id: req.params.id });
    if (!result) return res.status(404).json({ error: 'Product not found' });
    console.log(`[Product] ✅ Product "${req.params.id}" deleted.`);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('[Product] DELETE /api/products/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
