require('dotenv').config();
const { sequelize } = require('../src/models');

const initDatabase = async () => {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✓ Database connection successful');

    console.log('Syncing database models...');
    await sequelize.sync({ alter: true });
    console.log('✓ Database synchronized');

    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

initDatabase();
