/**
 * Supabase Storage client
 * - Uses SERVICE_ROLE_KEY (full admin rights for server-side uploads)
 * - SUPABASE_BUCKET env variable controls the bucket name (default: 'media')
 * - On startup, verifies the bucket exists and is public
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    '[Supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in .env'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/**
 * The bucket name, configurable via env.
 * Exported so every controller uses the same constant — no hardcoding.
 */
const BUCKET = process.env.SUPABASE_BUCKET || 'media';

/**
 * Called once at server startup.
 * Ensures the bucket exists and is PUBLIC.
 * Logs a clear warning if anything is wrong so the engineer sees it immediately.
 */
async function verifyBucket() {
  console.log(`[Supabase] Verifying storage bucket "${BUCKET}"...`);

  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('[Supabase] ❌ Could not list buckets:', error.message);
    console.error('[Supabase]    Check your SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL.');
    return;
  }

  const bucket = (buckets || []).find(b => b.name === BUCKET);

  if (!bucket) {
    console.warn(`[Supabase] ⚠️  Bucket "${BUCKET}" not found — creating it as PUBLIC...`);
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 10 * 1024 * 1024,
    });
    if (createErr) {
      console.error(`[Supabase] ❌ Failed to create bucket: ${createErr.message}`);
    } else {
      console.log(`[Supabase] ✅ Bucket "${BUCKET}" created and set to PUBLIC.`);
    }
    return;
  }

  if (!bucket.public) {
    console.warn(`[Supabase] ⚠️  Bucket "${BUCKET}" is PRIVATE — updating to PUBLIC...`);
    const { error: updateErr } = await supabase.storage.updateBucket(BUCKET, { public: true });
    if (updateErr) {
      console.error(`[Supabase] ❌ Could not make bucket public: ${updateErr.message}`);
    } else {
      console.log(`[Supabase] ✅ Bucket "${BUCKET}" is now PUBLIC.`);
    }
    return;
  }

  console.log(`[Supabase] ✅ Bucket "${BUCKET}" is ready (public=true).`);
}

module.exports = { supabase, BUCKET, verifyBucket };
