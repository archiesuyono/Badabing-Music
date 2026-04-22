require('dotenv').config();
const { Client } = require('pg');

const resetDatabase = async () => {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres'
  });

  try {
    console.log('Connecting to PostgreSQL server...');
    await client.connect();
    console.log('✓ Connected');

    const dbName = process.env.DB_NAME || 'badabing_music';
    
    console.log(`Dropping database "${dbName}"...`);
    
    try {
      // Terminate existing connections
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid()
      `, [dbName]);

      // Drop database
      await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
      console.log(`✓ Database "${dbName}" dropped`);
    } catch (error) {
      console.log(`Database "${dbName}" doesn't exist or couldn't be dropped`);
    }

    console.log(`Creating database "${dbName}"...`);
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✓ Database "${dbName}" created successfully`);

    await client.end();
    console.log('\nNext step: npm run db:setup');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

resetDatabase();
