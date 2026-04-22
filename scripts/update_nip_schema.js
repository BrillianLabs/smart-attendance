const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function updateSchema() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  const env = Object.fromEntries(envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim().replace(/['"]/g, '')];
    })
  );

  const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log("🔹 Menambahkan kolom nip_hash...");
    await client.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nip_hash TEXT');
    
    console.log("🔹 Membuat index untuk nip_hash...");
    await client.query('CREATE INDEX IF NOT EXISTS idx_profiles_nip_hash ON profiles(nip_hash)');
    
    console.log("✅ Schema updated successfully");
  } catch (err) {
    console.error("❌ Error updating schema:", err.message);
  } finally {
    await client.end();
  }
}

updateSchema();
