const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

console.log("🛠️ Memulai Proses Migrasi Schema Database (Ala-Laravel)...\n");

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

const dbUrl = envConfig.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ ERROR: DATABASE_URL belum disetel di .env.local!");
  console.log("\nSupaya bisa migrasi via CLI persis seperti Laravel (tanpa lewat Dasbor web),");
  console.log("Anda harus menambahkan string koneksi langsung ke Postgres.");
  console.log("Di Supabase Dashboard pergi ke: Settings -> Database -> Connection string -> URI");
  console.log("Lalu tambahkan ke .env.local milik Anda:");
  console.log("DATABASE_URL=\"postgres://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres\"\n");
  process.exit(1);
}

// 2. Baca file schema.sql
const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
let schemaSQL = '';
try {
  schemaSQL = fs.readFileSync(schemaPath, 'utf8');
} catch (e) {
  console.error("❌ File supabase/schema.sql tidak ditemukan!");
  process.exit(1);
}

async function runMigrate() {
  const client = new Client({
    connectionString: dbUrl,
    // Diperlukan jika menggunakan SSL pada cloud db
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("⏳ Menyambungkan ke Database...");
    await client.connect();
    
    console.log("⏳ Menjalankan eksekusi Schema SQL (Migrating)...");
    await client.query(schemaSQL);
    console.log("   - ✅ Seluruh tabel, fungsi, dan kebijakan RLS telah terpasang.");

    console.log("\n🎉 SELESAI! Struktur Database siap dipakai.");
    console.log("\nSelanjutnya Anda bisa mengisi data dengan:");
    console.log("npm run seed");
  } catch (err) {
    console.error("\n❌ Gagal Mengeksekusi Migrasi:");
    console.error(err.message);
  } finally {
    await client.end();
  }
}

runMigrate();
