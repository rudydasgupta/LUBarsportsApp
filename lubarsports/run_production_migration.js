const { Client } = require('pg');

// You'll need to replace this with your actual Neon connection string
const connectionString = process.env.DATABASE_URL || 'postgres://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require';

async function runMigration() {
  const client = new Client({
    connectionString: connectionString
  });

  try {
    await client.connect();
    console.log('Connected to production database');

    // Add adminType column to Captain table
    await client.query('ALTER TABLE "Captain" ADD COLUMN IF NOT EXISTS "adminType" TEXT;');
    console.log('Added adminType column to Captain table');

    // Create Admin table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Admin" (
        "id" SERIAL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "fullName" TEXT,
        "adminType" TEXT NOT NULL
      );
    `);
    console.log('Created Admin table');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
