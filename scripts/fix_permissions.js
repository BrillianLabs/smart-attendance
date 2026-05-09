const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Parsing manual file .env.local
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
  console.error("Gagal membaca .env.local", e);
}

const dbUrl = envConfig.DATABASE_URL;

async function fixPermissions() {
  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    console.log('Granting permissions...');
    await client.query('GRANT USAGE ON SCHEMA public TO anon, authenticated;');
    await client.query('GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;');
    await client.query('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;');
    
    console.log('✅ Permissions granted successfully!');
  } catch (err) {
    console.error('❌ Error granting permissions:', err.message);
  } finally {
    await client.end();
  }
}

fixPermissions();
