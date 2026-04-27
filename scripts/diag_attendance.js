const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function run() {
  const envPath = path.join(__dirname, '..', '.env.local');
  let envConfig = {};
  const envFile = fs.readFileSync(envPath, 'utf8');
  envConfig = Object.fromEntries(envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim().replace(/['"]/g, '')];
    })
  );

  const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

  const { data: settings } = await supabase.from('settings').select('work_start_time').eq('id', 1).single();
  const [targetH, targetM] = (settings.work_start_time || '07:00').split(':').map(Number);

  const { data: records } = await supabase
    .from('attendance')
    .select('*, profiles(full_name)')
    .order('date', { ascending: false });

  console.log(`Checking ${records.length} records...`);

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
       console.log(`Mismatch: ${record.date} | ${record.profiles?.full_name} | ${wibString} | DB Status: ${record.status} | Correct Status: ${newStatus}`);
    }
  }
}

run();
