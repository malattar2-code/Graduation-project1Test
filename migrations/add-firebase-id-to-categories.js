// migrations/add-firebase-id-to-categories.js
// Run this migration to add firebase_id column to your categories table

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('categories');
    
    if (!tableDescription.firebase_id) {
      await queryInterface.addColumn('categories', 'firebase_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true
      });
      
      // Add index for better performance
      await queryInterface.addIndex('categories', ['firebase_id'], {
        name: 'idx_categories_firebase_id',
        unique: true
      });
      
      console.log('✅ Added firebase_id column to categories table');
    } else {
      console.log('ℹ️ firebase_id column already exists');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('categories', 'idx_categories_firebase_id');
    await queryInterface.removeColumn('categories', 'firebase_id');
    console.log('✅ Removed firebase_id column from categories table');
  }
};

// Alternative: Direct SQL execution (if not using Sequelize migrations)
// Run this SQL directly in your PostgreSQL database:
/*
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS firebase_id VARCHAR(255) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_categories_firebase_id 
ON public.categories(firebase_id);
*/