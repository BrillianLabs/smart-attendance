const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Load Env
const envPath = path.join(__dirname, '..', '.env.local');
let envConfig = {};
try {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envConfig = Object.fromEntries(envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim().replace(/['"]/g, '')];
    })
  );
} catch (e) {
  console.error("❌ .env.local not found!");
  process.exit(1);
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("--- Supabase Storage Test ---");
  try {
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket('school-assets');
    if (bucketError) throw bucketError;
    console.log("✅ Bucket 'school-assets' exists and is accessible. Public:", bucket.public);

    console.log("\n--- Sharp Test ---");
    // Create a valid 1x1 black pixel PNG buffer
    const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
    const webp = await sharp(dummyBuffer).webp().toBuffer();
    console.log("✅ Sharp successfully converted buffer to WebP. Size:", webp.length, "bytes");

    console.log("\n--- Upload Test (Dry Run with unique path) ---");
    const testPath = `test/diagnostic-${Date.now()}.webp`;
    const { data, error: uploadError } = await supabase.storage
      .from('school-assets')
      .upload(testPath, webp, { contentType: 'image/webp' });

    if (uploadError) {
      console.error("❌ Upload failed:", uploadError.message);
    } else {
      console.log("✅ Upload successful! Path:", data.path);
      // Delete test file
      await supabase.storage.from('school-assets').remove([testPath]);
      console.log("✅ Test file removed.");
    }

  } catch (err) {
    console.error("❌ Error during diagnostic:", err.message);
  }
}

test();
