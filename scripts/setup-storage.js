const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setup() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const envConfig = Object.fromEntries(envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim().replace(/['"]/g, '')];
    })
  );

  const client = new Client({
    connectionString: envConfig.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    // Create Bucket
    await client.query(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('attendance-photos', 'attendance-photos', true)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('Bucket created.');

    // Policies
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects' AND schemaname = 'storage'
        ) THEN
          CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'attendance-photos');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE policyname = 'Individual Upload' AND tablename = 'objects' AND schemaname = 'storage'
        ) THEN
          CREATE POLICY "Individual Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attendance-photos');
        END IF;
      END
      $$;
    `);
    console.log('Policies applied.');

  } catch (err) {
    console.error('Setup failed:', err);
  } finally {
    await client.end();
  }
}

setup();
