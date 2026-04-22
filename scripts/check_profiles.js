const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function checkProfiles() {
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
  const { data, error } = await supabase.from('profiles').select('id, nip, full_name');
  
  if (error) {
    console.error('Error fetching profiles:', error.message);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

checkProfiles();
