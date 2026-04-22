require('dotenv').config();
const { Client } = require('pg');

const createDatabase = async () => {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres' // Connect to default database first
  });

  try {
    console.log('Connecting to PostgreSQL server...');
    await client.connect();
    console.log('✓ Connected');

    const dbName = process.env.DB_NAME || 'badabing_music';
    
    console.log(`Creating database "${dbName}"...`);
    
    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length > 0) {
      console.log(`✓ Database "${dbName}" already exists`);
    } else {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✓ Database "${dbName}" created successfully`);
    }

    await client.end();
    console.log('\nNext step: npm run db:setup');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Cannot connect to PostgreSQL!');
      console.log('Make sure PostgreSQL is installed and running.');
      console.log('Windows: Start PostgreSQL from Services or Command Prompt');
      console.log('Mac: brew services start postgresql');
      console.log('Linux: sudo service postgresql start');
    }
    
    process.exit(1);
  }
};

createDatabase();
