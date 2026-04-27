const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log("🔄 Memulai Proses Perbaikan Status Absensi (Seluruh Data)...\n");

  // 1. Parsing .env.local
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

  if (!serviceKey || !supabaseUrl) {
    console.error("❌ ERROR: SUPABASE_SERVICE_ROLE_KEY atau NEXT_PUBLIC_SUPABASE_URL belum disetel!");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // 2. Ambil Settings (Jam Masuk)
  const { data: settings, error: settingsErr } = await supabase
    .from('settings')
    .select('work_start_time')
    .eq('id', 1)
    .single();

  if (settingsErr) {
    console.error("❌ Gagal mengambil settings:", settingsErr.message);
    process.exit(1);
  }

  const workStartTime = settings.work_start_time || '07:00';
  const [targetH, targetM] = workStartTime.split(':').map(Number);
  console.log(`📍 Jam Masuk Sekolah: ${workStartTime}`);

  // 3. Ambil Semua Records Absensi
  const { data: records, error: recErr } = await supabase
    .from('attendance')
    .select('*, profiles(full_name)')
    .order('date', { ascending: false });

  if (recErr) {
    console.error("❌ Gagal mengambil data absensi:", recErr.message);
    process.exit(1);
  }

  if (!records || records.length === 0) {
    console.log("✅ Tidak ada data absensi.");
    return;
  }

  console.log(`🔍 Mengevaluasi ${records.length} records...`);

  let fixCount = 0;
  for (const record of records) {
    if (!record.check_in) continue;

    const checkInDate = new Date(record.check_in);
    const wibString = checkInDate.toLocaleTimeString('en-GB', { 
      timeZone: 'Asia/Jakarta', 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const [h, m] = wibString.split(':').map(Number);

    let newStatus = 'hadir';
    if (h > targetH || (h === targetH && m > targetM)) {
      newStatus = 'telat';
    }

    if (newStatus !== record.status) {
      fixCount++;
      const name = record.profiles?.full_name || 'Unknown';
      console.log(`   [${record.date}] 🔄 ${name.padEnd(25)} | WIB: ${wibString} | ${record.status} -> ${newStatus}`);
      
      await supabase
        .from('attendance')
        .update({ status: newStatus })
        .eq('id', record.id);
    }
  }

  console.log(`\n🎉 Selesai! Berhasil memperbaiki ${fixCount} record.`);
}

run();
