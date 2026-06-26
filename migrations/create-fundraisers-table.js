const { Sequelize } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("fundraisers", {
      fundraiser_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      fundraiser_title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      fundraiser_categories: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false
      },
      fundraiser_target_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      fundraiser_collected_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0
      },
      fundraiser_main_image: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      fundraiser_sub_image_one: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      fundraiser_sub_image_two: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      fundraiser_sub_image_three: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      fundraiser_description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      fundraiser_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      firebase_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      synced_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex("fundraisers", ["fundraiser_user_id"]);
    await queryInterface.addIndex("fundraisers", ["firebase_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("fundraisers");
  }
};