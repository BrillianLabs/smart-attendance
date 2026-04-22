const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function addSuperuserRole() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  const env = Object.fromEntries(envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim().replace(/['"]/g, '')];
    })
  );

  const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log("🔹 Menambahkan role superuser ke enum user_role...");
    // Note: ADD VALUE IF NOT EXISTS is only available in Postgres 13+
    // If not, we can use a DO block or just handle the error.
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type t 
           JOIN pg_enum e ON t.oid = e.enumtypid 
           WHERE t.typname = 'user_role' AND e.enumlabel = 'superuser') THEN
          ALTER TYPE user_role ADD VALUE 'superuser';
        END IF;
      END $$;
    `);
    
    console.log("✅ Success: superuser role added to enum.");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.end();
  }
}

addSuperuserRole();
