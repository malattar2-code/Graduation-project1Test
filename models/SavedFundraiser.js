// models/SavedFundraiser.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbSQL");

const SavedFundraiser = sequelize.define("SavedFundraiser", {
  saved_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "users",
      key: "id"
    }
  },
  fundraiser_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "fundraisers",
      key: "fundraiser_id"
    }
  },
  saved_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: "saved_fundraisers",
  underscored: true,
  timestamps: true,
  createdAt: "saved_at",
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'fundraiser_id']
    }
  ]
});

module.exports = SavedFundraiser;