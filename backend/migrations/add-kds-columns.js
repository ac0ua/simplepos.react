const { sequelize } = require('../config/database');

async function addKDSColumns() {
  try {
    console.log('Adding KDS columns to order_items table...');
    
    // Add prep_status column
    await sequelize.query(`
      ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS prep_status ENUM('pending', 'prepared') DEFAULT 'pending' NOT NULL
    `);
    console.log('✓ Added prep_status column');
    
    // Add prep_quantity column
    await sequelize.query(`
      ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS prep_quantity INT DEFAULT 0 NOT NULL
    `);
    console.log('✓ Added prep_quantity column');
    
    console.log('✅ KDS columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding KDS columns:', error);
    process.exit(1);
  }
}

addKDSColumns();
