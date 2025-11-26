const { sequelize, testConnection } = require('../config/database');
const models = require('../models');

const migrate = async () => {
  try {
    console.log('Starting database migration...');

    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Sync all models
    await sequelize.sync({ force: process.argv.includes('--force') });
    
    console.log('✓ Database tables created successfully');
    console.log('✓ Migration completed');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
