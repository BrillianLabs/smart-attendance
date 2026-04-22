const { Client } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  const env = Object.fromEntries(envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim().replace(/['"]/g, '')];
    })
  );

  const ENCRYPTION_KEY = env.NIP_ENCRYPTION_KEY;
  const HASH_SALT = env.NIP_HASH_SALT;

  if (!ENCRYPTION_KEY || !HASH_SALT) {
    console.error("❌ Encryption keys not found in .env.local");
    return;
  }

  function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  function hashNip(nip) {
    if (!nip) return '';
    const cleanNip = nip.trim().replace(/\s/g, '');
    return crypto.createHmac('sha256', HASH_SALT)
      .update(cleanNip)
      .digest('hex');
  }

  const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log("🔹 Membaca data profil...");
    const { rows } = await client.query('SELECT id, nip, nip_hash FROM profiles');
    
    console.log(`🔹 Memproses ${rows.length} baris...`);
    
    for (const row of rows) {
      if (row.nip && !row.nip.includes(':')) {
        console.log(`   ➡️ Mengenkripsi NIP untuk user ID: ${row.id}`);
        const encrypted = encrypt(row.nip);
        const hash = hashNip(row.nip);
        
        await client.query('UPDATE profiles SET nip = $1, nip_hash = $2 WHERE id = $3', [encrypted, hash, row.id]);
      } else if (row.nip && !row.nip_hash) {
        // NIP sudah terenkripsi tapi hash belum ada (kasus edge)
        // Kita tidak bisa hash tanpa dekripsi, tapi abaikan dulu untuk migrasi awal
        console.log(`   ⚠️ Hash kosong untuk NIP terenkripsi (ID: ${row.id}). Lewati.`);
      }
    }
    
    console.log("✅ Migrasi selesai!");
  } catch (err) {
    console.error("❌ Error during migration:", err.message);
  } finally {
    await client.end();
  }
}

migrate();
