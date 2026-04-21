const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

console.log("🚀 Memulai Import Data GTK dari Excel...\n");

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

const EXCEL_PATH = "C:\\Users\\DATA-PSDKP\\Downloads\\DATA GTK SDN NGUWOK.xlsx";
const DEFAULT_PASSWORD = "User123!";
const EMAIL_SUFFIX = "@absen.smart";

async function runImport() {
  try {
    // --------------------------------------------------------------------------------
    // A. BACA DATA DARI EXCEL
    // --------------------------------------------------------------------------------
    console.log(`➡️ Membaca file: ${EXCEL_PATH}`);
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Header ada di baris 5 (index 4)
    // Format: ["NO", "NAMA ", "NIP ", "JABATAN "]
    const usersToImport = [];
    for (let i = 5; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length < 4 || !row[1]) continue;

        const name = String(row[1]).trim();
        const nip = String(row[2] || '').trim().replace(/\s/g, ''); // Hilangkan spasi di NIP
        const position = String(row[3] || '').trim();
        
        if (!name) continue;

        // Tentukan role
        const role = position.toLowerCase().includes('kepala sekolah') ? 'admin' : 'staff';
        // Email placeholder
        const email = nip ? `${nip}${EMAIL_SUFFIX}` : `${name.toLowerCase().replace(/\s/g, '')}${EMAIL_SUFFIX}`;

        usersToImport.push({ name, nip, position, role, email });
    }

    console.log(`   - Ditemukan ${usersToImport.length} data pegawai.`);

    // --------------------------------------------------------------------------------
    // B. RESET DATABASE (CLEAN SLATE)
    // --------------------------------------------------------------------------------
    console.log("\n➡️ Membersihkan database (Authentication & Profiles)...");
    const pgClient = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await pgClient.connect();
    
    // Drop trigger sementara agar tidak error saat delete bulk
    await pgClient.query(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);
    
    // Bersihkan semua data
    await pgClient.query(`DELETE FROM auth.identities;`);
    await pgClient.query(`DELETE FROM auth.users;`);
    // Profiles akan terhapus jika ada CASCADE, tapi kita pastikan bersih
    await pgClient.query(`DELETE FROM profiles;`);
    await pgClient.query(`DELETE FROM attendance;`);
    await pgClient.query(`DELETE FROM leave_requests;`);

    // Tambahkan kolom nip jika belum ada (safety check)
    await pgClient.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nip TEXT;`);
    
    await pgClient.end();
    console.log("   - ✅ Database bersih.");

    // --------------------------------------------------------------------------------
    // C. IMPOR PEGAWAI KE AUTH & PROFILES
    // --------------------------------------------------------------------------------
    console.log("\n➡️ Mengimpor pegawai ke Supabase Auth...");
    const userIds = {};

    for (const u of usersToImport) {
        const { data, error } = await supabase.auth.admin.createUser({
            email: u.email,
            password: DEFAULT_PASSWORD,
            user_metadata: { full_name: u.name, role: u.role },
            email_confirm: true
        });

        if (error) {
            console.error(`   - ❌ Gagal membuat ${u.name}: ${error.message}`);
            continue;
        }

        const uid = data.user.id;
        userIds[u.email] = uid;

        // Insert ke profiles secara manual (karena trigger di-disable)
        const { error: profErr } = await supabase.from('profiles').insert({
            id: uid,
            full_name: u.name,
            role: u.role,
            position: u.position,
            nip: u.nip
        });

        if (profErr) {
            console.error(`   - ❌ Gagal simpan profil ${u.name}: ${profErr.message}`);
        } else {
            console.log(`   - ✅ ${u.name} (${u.role}) berhasil diimpor.`);
        }
    }

    // --------------------------------------------------------------------------------
    // D. GENERATE DUMMY ATTENDANCE (30 HARI)
    // --------------------------------------------------------------------------------
    console.log("\n➡️ Membuat histori absensi palsu untuk 30 hari...");
    for (const u of usersToImport) {
        const u_id = userIds[u.email];
        if (!u_id || u.role === 'admin') continue; // Hanya staff yang diabsenkan

        let records = [];
        for (let day = 1; day <= 30; day++) {
            const d = new Date();
            d.setDate(d.getDate() - day);
            if (d.getDay() === 0 || d.getDay() === 6) continue;

            const dateStr = d.toISOString().split('T')[0];
            const d_in = new Date(d); d_in.setHours(7, Math.floor(Math.random() * 30), 0);
            const d_out= new Date(d); d_out.setHours(15, Math.floor(Math.random() * 20), 0);

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
    console.log("   - ✅ Histori absensi berhasil dibuat.");

    // --------------------------------------------------------------------------------
    // E. RESTORE TRIGGER & SETTINGS
    // --------------------------------------------------------------------------------
    console.log("\n➡️ Mengembalikan Settings & Trigger...");
    await supabase.from('settings').upsert({
        id: 1,
        school_name: 'SD NEGERI NGUWOK',
        primary_color: '#006a61',
        allowed_radius_m: 100
    });

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

    console.log("\n🎉 SELESAI! Seluruh data GTK berhasil diimpor.");
    console.log("Login menggunakan NIP (atau Email) dengan Password: User123!");

  } catch (error) {
    console.error("\n❌ FATAL ERROR:", error.message);
  }
}

runImport();
