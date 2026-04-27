const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function restoreFromExcel() {
  console.log("🛠️ Memulai Pemulihan Data dari Laporan Excel...");

  const excelPath = 'C:\\Users\\DATA-PSDKP\\Downloads\\Documents\\Laporan-Presensi-2026-04_2.xlsx';
  if (!fs.existsSync(excelPath)) {
    console.error("❌ File Excel tidak ditemukan di path:", excelPath);
    return;
  }

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

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // 2. Ambil Semua Profile untuk mapping Nama -> ID
  const { data: profiles } = await supabase.from('profiles').select('id, full_name');
  const nameToId = {};
  profiles.forEach(p => {
    nameToId[p.full_name.trim().toLowerCase()] = p.id;
  });

  // 3. Baca Excel
  const workbook = XLSX.readFile(excelPath);
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

  console.log(`🔍 Memproses ${data.length} baris dari Excel...`);

  let restored = 0;
  for (const row of data) {
    const name = row['Nama Lengkap'];
    const dateStr = row['Tanggal']; // Format: DD/MM/YYYY
    const timeIn = row['Jam Masuk']; // Format: HH:mm
    const timeOut = row['Jam Pulang']; // Format: HH:mm or '-'
    
    const userId = nameToId[name?.trim().toLowerCase()];
    if (!userId) {
      console.warn(`   - ⚠️ User tidak ditemukan: ${name}`);
      continue;
    }

    // Convert date DD/MM/YYYY to YYYY-MM-DD
    const [d, m, y] = dateStr.split('/');
    const isoDate = `${y}-${m}-${d}`;

    // Convert time to ISO Timestamp (WIB)
    const createIso = (time) => {
      if (!time || time === '-') return null;
      // We assume date is local. We'll create a Date object in Jakarta time.
      // But simpler: just use the string and let Supabase handle it or use a library.
      return `${isoDate}T${time}:00+07:00`;
    };

    const checkInIso = createIso(timeIn);
    const checkOutIso = createIso(timeOut);

    // Re-evaluate status based on rules
    // Rule: < 07:00 -> datang_awal, > 07:00 -> telat
    const [h, min] = timeIn.split(':').map(Number);
    const status = (h < 7 || (h === 7 && min === 0)) ? 'datang_awal' : 'telat';

    // Rule checkout: < 12:10 -> pulang_awal, >= 12:10 -> pulang_sesuai
    let checkoutStatus = null;
    if (timeOut && timeOut !== '-') {
      const [coh, com] = timeOut.split(':').map(Number);
      const isEarly = coh < 12 || (coh === 12 && com < 10);
      checkoutStatus = isEarly ? 'pulang_awal' : 'pulang_sesuai';
    }

    const { error: upsertErr } = await supabase.from('attendance').upsert({
      user_id: userId,
      date: isoDate,
      check_in: checkInIso,
      check_out: checkOutIso,
      status: status,
      checkout_status: checkoutStatus,
      created_at: checkInIso || new Date().toISOString()
    }, { onConflict: 'user_id, date' });

    if (upsertErr) {
      console.error(`   - ❌ Gagal restore [${isoDate}] ${name}:`, upsertErr.message);
    } else {
      restored++;
    }
  }

  console.log(`\n🎉 SELESAI! Berhasil memulihkan ${restored} data absensi dari Excel.`);
}

restoreFromExcel();
