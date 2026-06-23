/**
 * POST /api/products/upload-image
 * Accepts: multipart/form-data with a single file field named "file"
 * Returns: { url: "https://...supabase.co/storage/v1/object/public/media/..." }
 */
const { supabase, BUCKET } = require('../supabase');

module.exports.uploadImage = async (req, res) => {
  // multer populates req.file
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const file = req.file;
  const ext  = file.originalname.split('.').pop().toLowerCase() || 'jpg';
  const fileName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  console.log(`[Upload] Uploading "${fileName}" to bucket "${BUCKET}" (size: ${file.size} bytes, type: ${file.mimetype})`);

  // 1. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    console.error(`[Upload] ❌ Supabase upload error:`, error.message, '| status:', error.status);
    return res.status(500).json({ error: `Upload failed: ${error.message}` });
  }

  console.log(`[Upload] ✅ File stored at path: "${data.path}"`);

  // 2. Generate public URL
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  const publicURL = urlData?.publicUrl;

  if (!publicURL || !publicURL.startsWith('https://')) {
    console.error(`[Upload] ❌ getPublicUrl returned invalid URL:`, publicURL);
    return res.status(500).json({ error: 'Failed to generate a valid public URL after upload.' });
  }

  console.log(`[Upload] ✅ Public URL: ${publicURL}`);

  // 3. Return only the verified Supabase public URL
  return res.json({ url: publicURL });
};
