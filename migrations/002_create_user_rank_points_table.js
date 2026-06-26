'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_rank_points', {
      user_rank_point_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_points: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      current_rank_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'ranks',
          key: 'rank_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      user_email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      firestore_doc_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('user_rank_points', ['user_id']);
    await queryInterface.addIndex('user_rank_points', ['current_rank_id']);
    await queryInterface.addIndex('user_rank_points', ['user_points']);
    await queryInterface.addIndex('user_rank_points', ['firestore_doc_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_rank_points');
  }
};