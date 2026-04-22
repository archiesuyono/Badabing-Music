require('dotenv').config();
const { sequelize } = require('../src/models');

const createAndSyncDatabase = async () => {
  try {
    console.log('Connecting to PostgreSQL...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✓ Connection successful');

    console.log('Syncing database models...');
    await sequelize.sync({ alter: true, force: false });
    console.log('✓ Database synchronized successfully');

    console.log('\nDatabase setup complete!');
    console.log('You can now run: npm run seed:spotify');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Database setup failed:', error.message);
    
    if (error.message.includes('does not exist')) {
      console.log('\n⚠️  Database does not exist. Please create it first using:');
      console.log('   psql -U postgres -c "CREATE DATABASE \\"badabing_music\\";"');
    }
    
    process.exit(1);
  }
};

createAndSyncDatabase();
