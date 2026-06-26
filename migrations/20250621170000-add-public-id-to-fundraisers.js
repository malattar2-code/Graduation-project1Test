'use strict';

const { ulid } = require('ulid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add public_id column
    await queryInterface.addColumn('fundraisers', 'public_id', {
      type: Sequelize.STRING(26),
      allowNull: true,
      unique: true,
      comment: 'Public-facing ULID for URLs, APIs, and external references'
    });

    // Generate ULIDs for existing records
    const [fundraisers] = await queryInterface.sequelize.query(
      'SELECT fundraiser_id FROM fundraisers WHERE public_id IS NULL'
    );

    for (const fundraiser of fundraisers) {
      await queryInterface.sequelize.query(
        'UPDATE fundraisers SET public_id = ? WHERE fundraiser_id = ?',
        { replacements: [ulid(), fundraiser.fundraiser_id] }
      );
    }

    // Make column non-nullable after populating
    await queryInterface.changeColumn('fundraisers', 'public_id', {
      type: Sequelize.STRING(26),
      allowNull: false,
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('fundraisers', 'public_id');
  }
};