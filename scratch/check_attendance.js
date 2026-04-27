
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

async function checkGlobalMisdates() {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Checking for ALL misdated records in the last 7 days...');

  // Kita cari yang check_in di pagi hari (00:00 - 06:59 WIB)
  // WIB = UTC + 7. Jadi 00:00 - 06:59 WIB adalah 17:00 - 23:59 UTC hari sebelumnya.
  // Jika check_in di jam tersebut, 'date' harusnya adalah hari H (WIB), bukan H-1.
  
  const { data, error } = await supabase
    .from('attendance')
    .select('id, date, check_in')
    .gte('check_in', '2026-04-20T00:00:00Z'); // Last week

  if (error) {
    console.error('Error:', error);
    return;
  }

  const misdated = data.filter(row => {
    const utcDate = new Date(row.check_in);
    // Convert to WIB manually for comparison
    const wibDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
    const expectedDate = wibDate.toISOString().split('T')[0];
    return row.date !== expectedDate;
  });

  console.log(`Found ${misdated.length} misdated records total.`);
  for (const row of misdated) {
    const utcDate = new Date(row.check_in);
    const wibDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
    const expectedDate = wibDate.toISOString().split('T')[0];
    
    console.log(`Fixing ID: ${row.id} | DB Date: ${row.date} -> Expected: ${expectedDate} (Check-in WIB: ${wibDate.toISOString()})`);
    await supabase.from('attendance').update({ date: expectedDate }).eq('id', row.id);
  }
}

checkGlobalMisdates();
