const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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
  console.error("❌ File .env.local tidak ditemukan!");
  process.exit(1);
}

const dbUrl = envConfig.DATABASE_URL;

async function fixProfiles() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log("🔍 Memeriksa sinkronisasi auth.users dan public.profiles...\n");

    // Ambil semua user dari auth.users
    const { rows: users } = await client.query('SELECT id, email, raw_user_meta_data FROM auth.users');
    
    for (const user of users) {
      // Cek apakah profilnya ada di public.profiles
      const { rows: profiles } = await client.query('SELECT id FROM public.profiles WHERE id = $1', [user.id]);
      
      if (profiles.length === 0) {
        console.log(`❌ Profil hilang untuk: ${user.email}. Sedang membuatkan...`);
        
        // Ambil nama dari metadata atau email
        let fullName = user.email.split('@')[0];
        let role = 'staff';
        
        if (user.raw_user_meta_data) {
          const meta = typeof user.raw_user_meta_data === 'string' 
            ? JSON.parse(user.raw_user_meta_data) 
            : user.raw_user_meta_data;
          fullName = meta.full_name || fullName;
          role = meta.role || role;
        }

        // Insert ke profiles
        await client.query(`
          INSERT INTO public.profiles (id, full_name, role, position)
          VALUES ($1, $2, $3, $4)
        `, [user.id, fullName, role, role === 'admin' ? 'Kepala Sekolah' : 'Guru Kelas']);
        
        console.log(`   - ✅ Profil berhasil dibuat untuk ${fullName} (${role})`);
      } else {
        console.log(`   - ✅ Profil sudah ada untuk ${user.email}`);
      }
    }

    console.log("\n🎉 Semua profil sudah sinkron!");
  } catch (err) {
    console.error("❌ Terjadi error:", err.message);
  } finally {
    await client.end();
  }
}

fixProfiles();
