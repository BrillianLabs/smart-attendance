const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function syncData() {
  console.log("🚀 Memulai Sinkronisasi Data dari Excel...");

  // 1. Parsing .env.local
  const envPath = path.join(__dirname, '..', '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  const env = Object.fromEntries(envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim().replace(/['"]/g, '')];
    })
  );

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl       = env.DATABASE_URL;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const pgClient = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await pgClient.connect();
    
    // 2. Tambahkan kolom email ke profiles jika belum ada
    console.log("🔹 Menyiapkan skema database...");
    await pgClient.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT');

    // DISABLE TRIGGER sementara (mencegah error internal supabase auth saat insert profiles)
    await pgClient.query('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users');
    
    // 3. Baca Excel
    console.log("🔹 Membaca file Excel...");
    const excelPath = 'C:\\Users\\DATA-PSDKP\\Downloads\\DATA GTK SDN NGUWOK (1).xlsx';
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Data mulai baris index 3 (baris 4 di excel)
    const usersToSync = data.slice(3).map(row => ({
      name: row['__EMPTY'],
      nip: row['__EMPTY_1'].toString().replace(/\s/g, ''),
      position: row['__EMPTY_2'],
      email: row['__EMPTY_3'].trim()
    })).filter(u => u.nip && u.email);

    console.log(`🔹 Ditemukan ${usersToSync.length} data guru untuk disinkronkan.`);

    for (const u of usersToSync) {
      console.log(`\n➡️ Memproses: ${u.name} (${u.nip})`);

      // A. Cek/Update Auth User
      // Kita coba cari user berdasarkan NIP (email internal lama: nip@absen.smart)
      const internalEmail = `${u.nip}@absen.smart`;
      
      // Ambil user auth
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      let authUser = users.find(user => 
        user.email === internalEmail || user.email === u.email || user.user_metadata?.nip === u.nip
      );

      if (authUser) {
        console.log(`   - Mengupdate akun auth existing: ${authUser.email} -> ${u.email}`);
        const { error: updAuthErr } = await supabase.auth.admin.updateUserById(authUser.id, {
          email: u.email,
          user_metadata: { ...authUser.user_metadata, nip: u.nip, full_name: u.name },
          email_confirm: true
        });
        if (updAuthErr) console.error(`   - ❌ Gagal update auth: ${updAuthErr.message}`);
      } else {
        console.log(`   - Membuat akun auth baru: ${u.email}`);
        const { data: newAuth, error: createAuthErr } = await supabase.auth.admin.createUser({
          email: u.email,
          password: 'User123!', // Password default
          user_metadata: { full_name: u.name, role: 'staff', nip: u.nip },
          email_confirm: true
        });
        if (createAuthErr) {
          console.error(`   - ❌ Gagal buat auth: ${createAuthErr.message}`);
          continue;
        }
        authUser = newAuth.user;
      }

      // B. Update Profile di Database
      const { error: profErr } = await supabase.from('profiles').upsert({
        id: authUser.id,
        full_name: u.name,
        nip: u.nip,
        email: u.email,
        position: u.position,
        role: 'staff',
        updated_at: new Date().toISOString()
      });

      if (profErr) {
        console.error(`   - ❌ Gagal update profil: ${profErr.message}`);
      } else {
        console.log(`   - ✅ Profil & Auth sinkron.`);
      }
    }

    // 4. RESTORE TRIGGER
    console.log("\n🔹 Mengembalikan trigger auth...");
    await pgClient.query(`
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO profiles (id, full_name, role, nip, email)
        VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'staff')::user_role,
          NEW.raw_user_meta_data->>'nip',
          NEW.email
        )
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          nip = EXCLUDED.nip,
          email = EXCLUDED.email;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    `);

    console.log("\n✨ Sinkronisasi selesai!");
  } catch (err) {
    console.error("\n❌ Fatal Error:", err.message);
  } finally {
    await pgClient.end();
  }
}

syncData();
