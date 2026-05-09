const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function checkUsers() {
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

  const dbUrl = envConfig.DATABASE_URL;

  if (!dbUrl) {
    console.error("❌ ERROR: DATABASE_URL belum disetel!");
    process.exit(1);
  }

  const pgClient = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await pgClient.connect();
    console.log("✅ Terhubung ke database.\n");

    const res = await pgClient.query(`
      SELECT p.id, p.full_name, p.role, p.position, u.email 
      FROM profiles p 
      JOIN auth.users u ON p.id = u.id 
      ORDER BY p.full_name ASC
    `);
    
    console.log(`Ditemukan ${res.rows.length} user di tabel profiles:\n`);
    console.table(res.rows);

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await pgClient.end();
  }
}

checkUsers();
