const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function recover() {
  console.log("🛠️ Memulai Proses Pemulihan Data dari Storage...");

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
  const supabase = createClient(supabaseUrl, serviceKey);

  // 2. Ambil Settings (Jam Masuk)
  const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single();
  const workStart = settings?.work_start_time || '07:00';
  const [targetH, targetM] = workStart.split(':').map(Number);

  // 3. List User Folders
  const { data: userFolders, error: folderErr } = await supabase.storage.from('attendance-photos').list();
  if (folderErr) {
    console.error("❌ Gagal list storage:", folderErr.message);
    return;
  }

  console.log(`🔍 Ditemukan ${userFolders.length} folder user.`);

  let totalRecovered = 0;

  for (const folder of userFolders) {
    if (folder.name === '.emptyFolderPlaceholder') continue;
    
    const userId = folder.name;
    console.log(`\n📂 Memproses User ID: ${userId}`);

    const { data: files } = await supabase.storage.from('attendance-photos').list(userId, { limit: 1000 });
    if (!files) continue;

    // Group files by date
    const dateGroups = {};
    files.forEach(f => {
      const match = f.name.match(/^(\d{4}-\d{2}-\d{2})-(check_in|check_out)\.webp$/);
      if (match) {
        const date = match[1];
        const type = match[2];
        if (!dateGroups[date]) dateGroups[date] = {};
        dateGroups[date][type] = f;
      }
    });

    for (const [date, types] of Object.entries(dateGroups)) {
      const check_in_file = types.check_in;
      const check_out_file = types.check_out;

      if (!check_in_file) continue;

      const checkInTime = new Date(check_in_file.created_at);
      const checkOutTime = check_out_file ? new Date(check_out_file.created_at) : null;

      // Calculate status
      // Use WIB logic
      const wibString = checkInTime.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour12: false });
      const [h, m] = wibString.split(':').map(Number);
      
      let status = 'datang_awal';
      if (h > targetH || (h === targetH && m > targetM)) {
        status = 'telat';
      }

      // Calculate checkout_status
      let checkout_status = null;
      if (checkOutTime) {
        const coWibString = checkOutTime.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour12: false });
        const [coH, coM] = coWibString.split(':').map(Number);
        const isEarly = coH < 12 || (coH === 12 && coM < 10);
        checkout_status = isEarly ? 'pulang_awal' : 'pulang_sesuai';
      }

      const photo_in_url = `${supabaseUrl}/storage/v1/object/public/attendance-photos/${userId}/${check_in_file.name}`;
      const photo_out_url = check_out_file ? `${supabaseUrl}/storage/v1/object/public/attendance-photos/${userId}/${check_out_file.name}` : null;

      const { error: insErr } = await supabase.from('attendance').upsert({
        user_id: userId,
        date: date,
        check_in: checkInTime.toISOString(),
        check_out: checkOutTime ? checkOutTime.toISOString() : null,
        status: status,
        checkout_status: checkout_status,
        check_in_photo_url: photo_in_url,
        check_out_photo_url: photo_out_url,
        created_at: checkInTime.toISOString()
      });

      if (insErr) {
        console.error(`   - ❌ Gagal restore [${date}]:`, insErr.message);
      } else {
        totalRecovered++;
        console.log(`   - ✅ Restored [${date}] | In: ${wibString} | Status: ${status}`);
      }
    }
  }

  console.log(`\n🎉 PEMULIHAN SELESAI! Berhasil mengembalikan ${totalRecovered} data absensi.`);
}

recover();
