// models/FundraiserForm.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbSQL");
const User = require("./User");

const FundraiserForm = sequelize.define("FundraiserForm", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fundraiser_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "fundraisers", key: "fundraiser_id" }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "users", key: "id" }
  },
  target_requesters_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1 }
  },
  current_requesters_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 }
  },
  schema: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  }
}, {
  tableName: "fundraisers_forms",
  underscored: true,
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});


module.exports = FundraiserForm;