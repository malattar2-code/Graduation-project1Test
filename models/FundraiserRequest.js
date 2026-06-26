// models/FundraiserRequest.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbSQL");
const FundraiserForm = require("./FundraiserForm");
const Fundraiser = require("./Fundraiser");
const User = require("./User");

const FundraiserRequest = sequelize.define("FundraiserRequest", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  form_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "fundraisers_forms", key: "id" }
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
  requests: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  request_status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      defaultValue: 'accepted',  // ← CHANGE from 'pending'
      allowNull: false
  },
  request_rejected_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "fundraisers_requests",
  underscored: true,
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});


module.exports = FundraiserRequest;