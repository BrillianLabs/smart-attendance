const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log("🔄 Memulai Proses Update User dan Staff...\n");

// 1. Parsing manual file .env.local
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
  console.error("❌ File .env.local tidak ditemukan di root project!");
  process.exit(1);
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey  = envConfig.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl       = envConfig.DATABASE_URL;

if (!serviceKey || !dbUrl) {
  console.error("❌ ERROR: SUPABASE_SERVICE_ROLE_KEY atau DATABASE_URL belum disetel!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Load User Data from JSON
const USERS_DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'users_data.json'), 'utf8'));

// Encryption Utils
const ENCRYPTION_KEY = envConfig.NIP_ENCRYPTION_KEY || '';
const HASH_SALT = envConfig.NIP_HASH_SALT || '';

function encrypt(text) {
  if (!text || !ENCRYPTION_KEY) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function hashNip(nip) {
  if (!nip || !HASH_SALT) return '';
  const cleanNip = nip.trim().replace(/\s/g, '');
  return crypto.createHmac('sha256', HASH_SALT).update(cleanNip).digest('hex');
}

async function runUpdate() {
  const pgClient = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  
  try {
    await pgClient.connect();
    console.log("✅ Terhubung ke database.");

    // Add columns if not exists
    console.log("🔹 Menyiapkan skema database...");
    await pgClient.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nip TEXT;`);
    await pgClient.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nip_hash TEXT;`);

    // DROP TRIGGER temporarily to avoid Supabase Auth errors
    console.log("🔹 Menonaktifkan trigger auth sementara...");
    await pgClient.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    `);

    for (const u of USERS_DATA) {
      console.log(`\n➡️ Memproses: ${u.full_name} (${u.email})`);

      let uid;
      
      // Try to create user
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: 'User123!', // Default password
        user_metadata: { full_name: u.full_name, role: u.role },
        email_confirm: true
      });

      if (error) {
        console.log(`   - Gagal membuat via API (${error.message}). Mencari di database...`);
        // Cari UUID di auth.users
        const res = await pgClient.query('SELECT id FROM auth.users WHERE email = $1', [u.email]);
        if (res.rows.length > 0) {
          uid = res.rows[0].id;
          console.log(`   - ✅ Ditemukan user ${u.email} di database.`);
        } else {
          console.log(`   - ❌ User ${u.email} tidak ditemukan. Lewati.`);
          continue;
        }
      } else {
        console.log(`   - ✅ ${u.email} berhasil dibuat.`);
        uid = data.user.id;
      }

      // Update Profile via PG Client (bypassing RLS/permission issues)
      const encryptedNip = u.nip ? encrypt(u.nip) : null;
      const hashedNip = u.nip ? hashNip(u.nip) : null;

      try {
        await pgClient.query(`
          INSERT INTO profiles (id, full_name, role, position, nip, nip_hash, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            position = EXCLUDED.position,
            nip = EXCLUDED.nip,
            nip_hash = EXCLUDED.nip_hash,
            updated_at = EXCLUDED.updated_at;
        `, [uid, u.full_name, u.role, u.position, encryptedNip, hashedNip, new Date().toISOString()]);
        
        console.log(`   - ✅ Profil diperbarui via DB.`);
      } catch (profErr) {
        console.error(`   - ❌ Gagal simpan profil via DB: ${profErr.message}`);
      }
    }

    // RESTORE TRIGGER
    console.log("\n🔹 Mengembalikan trigger auth...");
    await pgClient.query(`
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO profiles (id, full_name, role)
        VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'staff')::user_role
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    `);

    console.log("\n🎉 SELESAI! Update data user dan staff sukses.");

  } catch (err) {
    console.error("❌ Fatal Error:", err.message);
  } finally {
    await pgClient.end();
  }
}

runUpdate();
