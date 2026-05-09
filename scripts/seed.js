const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

console.log("🔄 Memulai Proses Seeding Database & Auth...\n");

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

// Gunakan Service Role untuk mendapat mode 'Admin' murni
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const crypto = require('crypto');

// Load Real User Data from JSON
const USERS_DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'users_data.json'), 'utf8'));

// Encryption Utils for Seed (Node.js version)
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

const DUMMY_USERS = USERS_DATA.map(u => ({
  email: u.email || `${u.nip || u.full_name.toLowerCase().replace(/\s/g, '')}@absen.smart`,
  pwd: 'User123!',
  name: u.full_name,
  role: u.role,
  pos: u.position,
  nip: u.nip
}));

// Tambahkan super admin manual
DUMMY_USERS.push({ 
  email: 'admin@sekolah.sch.id', 
  pwd: 'User123!', 
  name: 'Administrator Utama', 
  role: 'admin', 
  pos: 'IT Administrator' 
});

async function runSeed() {
  const userIds = {};

  try {
    // --------------------------------------------------------------------------------
    // 0. BERSIHKAN USER AUTENTIKASI LAMA (YANG MUNGKIN CORRUPT KARENA SQL MENTAH)
    // --------------------------------------------------------------------------------
    console.log("➡️ Memperbaiki Trigger Auth Postgres yang menyebabkan crash...");
    const pgClient = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await pgClient.connect();
    
    // 0a. Drop Trigger yang bikin error Supabase internal
    await pgClient.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    `);

    // 0b. Hapus data kotor
    await pgClient.query(`
      DELETE FROM auth.identities;
      DELETE FROM auth.users;
    `);
    await pgClient.end();
    console.log("   - ✅ Trigger dihapus sementara & Database Auth dibersihkan.");

    // --------------------------------------------------------------------------------
    // 1. BUAT AKUN MENGGUNAKAN ADMIN API
    // --------------------------------------------------------------------------------
    console.log("\n➡️ Menciptakan/Update Pengguna Auth (Aman via API)...");
    for (const u of DUMMY_USERS) {
      // Create User (jika email konflik, asumsikan akun sudah ada)
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.pwd,
        user_metadata: { full_name: u.name, role: u.role },
        email_confirm: true // Otomatis bypass verifikasi email
      });

      let uid;
      if (error && error.message.includes('already exists')) {
        console.log(`   - Akun ${u.email} sudah eksis (di-skip).`);
        // Ambil UUID milik user yang sudah ada (hanya tersedia via RPC custom atau re-query).
        // Sebagai fallback ringan via client admin:
        const { data: qry } = await supabase.from('profiles').select('id').eq('full_name', u.name).single();
        uid = qry?.id;
      } else if (error) {
        throw new Error(`Gagal membuat ${u.email}: ${error.message}`);
      } else {
        console.log(`   - ✅ ${u.email} berhasil dibuat.`);
        uid = data.user.id;
      }
      userIds[u.email] = uid;
    }

    // --------------------------------------------------------------------------------
    // 2. UPDATE PROFIL MENJADI LENGKAP
    // --------------------------------------------------------------------------------
    console.log("\n➡️ Membangun & Memperbarui Profil Database...");
    const pgClient2 = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await pgClient2.connect();
    
    for (const u of DUMMY_USERS) {
      if (userIds[u.email]) {
        const id = userIds[u.email];
        const full_name = u.name;
        const role = u.role;
        const position = u.pos || null;
        const nip = u.nip ? encrypt(u.nip) : null;
        const nip_hash = u.nip ? hashNip(u.nip) : null;

        try {
          await pgClient2.query(`
            INSERT INTO public.profiles (id, full_name, role, position, nip, nip_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET
              full_name = EXCLUDED.full_name,
              role = EXCLUDED.role,
              position = EXCLUDED.position,
              nip = EXCLUDED.nip,
              nip_hash = EXCLUDED.nip_hash;
          `, [id, full_name, role, position, nip, nip_hash]);
        } catch (err) {
          console.error(`Gagal simpan profil untuk ${u.email}:`, err.message);
        }
      }
    }
    await pgClient2.end();

    // --------------------------------------------------------------------------------
    // 3. SEED SETTINGS AWAL
    // --------------------------------------------------------------------------------
    console.log("\n➡️ Mereset Template Settings...");
    const { error: settingsError } = await supabase
      .from('settings')
      .upsert({
        id: 1,
        school_name: 'NAMA SEKOLAH',
        primary_color: '#2563EB',
        allowed_radius_m: 100
      });

    // --------------------------------------------------------------------------------
    // 4. MEMBUAT HISTORI ABSENSI PALSU (30 HARI KE BELAKANG)
    // --------------------------------------------------------------------------------
    console.log("\n➡️ Membersihkan Data Lama & Merakit Histori Absensi (30 Hari)...");
    
    // Wipe old generic ones
    await supabase.from('leave_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const staffEmails = DUMMY_USERS.filter(u => u.role === 'staff').map(u => u.email);
    for (const email of staffEmails) {
      const u_id = userIds[email];
      if (!u_id) continue;

      let records = [];
      for (let day = 1; day <= 30; day++) {
        const d = new Date();
        d.setDate(d.getDate() - day);
        
        // Lewati akhir pekan (Minggu=0, Sabtu=6)
        if (d.getDay() === 0 || d.getDay() === 6) continue;

        const dateStr = d.toISOString().split('T')[0];
        // Asumsi jam masuk acak: ~ 07:25s, jam pulang acak: ~ 15:05s
        const d_in = new Date(d); d_in.setHours(7, 25, 0);
        const d_out= new Date(d); d_out.setHours(15, 5, 0);

        records.push({
          user_id: u_id,
          date: dateStr,
          check_in: d_in.toISOString(),
          check_out: d_out.toISOString(),
          status: Math.random() > 0.1 ? 'hadir' : 'telat',
          check_in_lat: -6.2088 + (Math.random() - 0.5) * 0.001,
          check_in_lng: 106.8456 + (Math.random() - 0.5) * 0.001
        });
      }

      await supabase.from('attendance').insert(records);
    }
    console.log(`   - ✅ Absensi GPS palsu berhasil dijahit!`);

    // --------------------------------------------------------------------------------
    // 5. MEMBUAT DUMMY REQUEST IZIN
    // --------------------------------------------------------------------------------
    console.log("\n➡️ Memasukkan Contoh Tiket Izin Cuti...");
    const someStaff = staffEmails.slice(0, 2);
    if (someStaff[0]) {
      await supabase.from('leave_requests').insert({
        user_id: userIds[someStaff[0]],
        start_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        leave_type: 'sakit',
        reason: 'Demam tinggi, istirahat dari dokter',
        status: 'pending'
      });
    }
    if (someStaff[1]) {
      await supabase.from('leave_requests').insert({
        user_id: userIds[someStaff[1]],
        start_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
        end_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
        leave_type: 'izin',
        reason: 'Mengurus dokumen penting keluarga',
        status: 'approved'
      });
    }

    // --------------------------------------------------------------------------------
    // 5.5 PASTIKAN STORAGE BUCKET EKSIS
    // --------------------------------------------------------------------------------
    console.log("\n➡️ Menyiapkan Storage Buckets...");
    const { data: buckets } = await supabase.storage.listBuckets();
    const neededBuckets = ['school-assets', 'leave-attachments'];
    for (const b of neededBuckets) {
      if (!buckets?.find(bucket => bucket.id === b)) {
        console.log(`   - Membuat bucket: ${b}`);
        await supabase.storage.createBucket(b, { public: true });
      } else {
        console.log(`   - Bucket ${b} sudah ada.`);
      }
    }

    // --------------------------------------------------------------------------------
    // 6. KEMBALIKAN TRIGGER POSTGRES 
    // --------------------------------------------------------------------------------
    console.log("\n➡️ Mengembalikan perlindungan Trigger untuk App...");
    const finPgClient = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await finPgClient.connect();
    await finPgClient.query(`
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
    await finPgClient.end();

    console.log("\n🎉 SELESAI! CLI Seeder Sukses Dieksekusi.");
    console.log("--------------------------------------------------");
    console.log("KREDENSI LOGIN:");
    DUMMY_USERS.forEach(u => {
      console.log(`- ${u.name.padEnd(30)} | ${u.email.padEnd(30)} | Pass: ${u.pwd}`);
    });
    console.log("--------------------------------------------------");
    console.log("Gunakan NIP atau Email di atas untuk login.");

  } catch (err) {
    console.error("❌ Fatal Error:", err.message);
  }
}

runSeed();
