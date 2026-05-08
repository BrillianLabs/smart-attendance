/**
 * run_migration.js - Jalankan satu file migrasi incremental ke Supabase
 *
 * Usage:
 *   node scripts/run_migration.js supabase/migrations/001_20260510_deskripsi.sql
 *
 * PENTING: Hanya gunakan ini untuk UPDATE schema di sekolah yang sudah produksi.
 * Untuk instalasi fresh, gunakan: npm run migrate  (yang menjalankan schema.sql penuh)
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Usage: node scripts/run_migration.js <migration-file>');
  console.error('   Contoh: node scripts/run_migration.js supabase/migrations/001_20260510_add_face_id.sql');
  process.exit(1);
}

const migrationPath = path.join(__dirname, '..', migrationFile);
if (!fs.existsSync(migrationPath)) {
  console.error(`❌ File tidak ditemukan: ${migrationPath}`);
  process.exit(1);
}

// Parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let envConfig = {};
try {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envConfig = Object.fromEntries(
    envFile.split('\n')
      .filter(l => l.includes('=') && !l.startsWith('#'))
      .map(l => {
        const [k, ...v] = l.split('=');
        return [k.trim(), v.join('=').trim().replace(/['"]/g, '')];
      })
  );
} catch (e) {
  console.error('❌ File .env.local tidak ditemukan!');
  process.exit(1);
}

if (!envConfig.DATABASE_URL) {
  console.error('❌ DATABASE_URL belum disetel di .env.local!');
  process.exit(1);
}

async function run() {
  const client = new Client({
    connectionString: envConfig.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`▶ Menjalankan migrasi: ${migrationFile}`);
    console.log('─'.repeat(50));
    await client.query(sql);
    console.log('─'.repeat(50));
    console.log('✅ Migrasi berhasil dijalankan!');
    console.log('');
    console.log('Jangan lupa: jalankan migrasi yang sama untuk setiap sekolah lain jika diperlukan.');
  } catch (err) {
    console.error('❌ Gagal menjalankan migrasi:');
    console.error(err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
