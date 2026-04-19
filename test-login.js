// test-login.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
// Parse .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const envConfig = Object.fromEntries(envFile.split('\n').filter(Boolean).map(line => line.split('=')));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL.trim();
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('Testing login with admin@sekolah.sch.id / User123!');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@sekolah.sch.id',
    password: 'User123!',
  });

  if (error) {
    console.error('❌ Login failed:', error.message);
  } else {
    console.log('✅ Login success:', data.user.email);
  }
}

runTest();
