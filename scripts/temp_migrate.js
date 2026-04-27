const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  const env = Object.fromEntries(envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim().replace(/['"]/g, '')];
    })
  );

  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to DB");

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE checkout_status AS ENUM ('pulang_awal', 'pulang_sesuai');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS checkout_status checkout_status`);

    // Add new values to enum if they don't exist
    // Note: ALTER TYPE ADD VALUE cannot run in a transaction block
    try {
      await client.query(`ALTER TYPE attendance_status ADD VALUE 'datang_awal'`);
    } catch (e) {
      if (!e.message.includes('already exists')) console.log(e.message);
    }
    
    try {
      await client.query(`ALTER TYPE attendance_status ADD VALUE 'tidak_masuk'`);
    } catch (e) {
      if (!e.message.includes('already exists')) console.log(e.message);
    }

    console.log("Migration successful");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
