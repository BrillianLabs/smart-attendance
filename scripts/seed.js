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

const DUMMY_USERS = [
  { email: 'admin@sekolah.sch.id', pwd: 'User123!', name: 'Administrator', role: 'admin', pos: 'Kepala Sekolah / Admin' },
  { email: 'budi@sekolah.sch.id', pwd: 'User123!', name: 'Budi Santoso', role: 'staff', pos: 'Guru Matematika' },
  { email: 'siti@sekolah.sch.id', pwd: 'User123!', name: 'Siti Rahayu', role: 'staff', pos: 'Guru B. Indonesia' }
];

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
    for (const u of DUMMY_USERS) {
      if (userIds[u.email]) {
        // Karena trigger dihapus, kita INSERT manual dari awal supaya 100% aman
        const { error: insErr } = await supabase.from('profiles').upsert({
          id: userIds[u.email],
          full_name: u.name,
          role: u.role,
          position: u.pos
        });
        if (insErr) console.error("Gagal simpan profil: ", insErr.message);
      }
    }

    // --------------------------------------------------------------------------------
    // 3. SEED SETTINGS AWAL
    // --------------------------------------------------------------------------------
    console.log("\n➡️ Mereset Template Settings...");
    const { error: settingsError } = await supabase
      .from('settings')
      .upsert({
        id: 1,
        school_name: 'SD NEGERI NGUWOK',
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

    const staffEmails = ['budi@sekolah.sch.id', 'siti@sekolah.sch.id'];
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
    if (userIds['budi@sekolah.sch.id']) {
      await supabase.from('leave_requests').insert({
        user_id: userIds['budi@sekolah.sch.id'],
        start_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        leave_type: 'sakit',
        reason: 'Demam tinggi, istirahat dari dokter',
        status: 'pending'
      });
    }
    if (userIds['siti@sekolah.sch.id']) {
      await supabase.from('leave_requests').insert({
        user_id: userIds['siti@sekolah.sch.id'],
        start_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
        end_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
        leave_type: 'izin',
        reason: 'Mengurus dokumen penting keluarga',
        status: 'approved'
      });
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
    console.log("Coba login dengan admin@sekolah.sch.id atau budi@sekolah.sch.id (Password: User123!)");

  } catch (err) {
    console.error("❌ Fatal Error:", err.message);
  }
}

runSeed();
