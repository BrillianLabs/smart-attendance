const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function checkUsers() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  const env = Object.fromEntries(envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim().replace(/['"]/g, '')];
    })
  );

  const pgClient = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await pgClient.connect();
    const res = await pgClient.query('SELECT id, full_name, role, position FROM profiles');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pgClient.end();
  }
}

checkUsers();
