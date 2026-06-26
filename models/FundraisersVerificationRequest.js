const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbSQL");
const User = require("./User");
const Fundraiser = require("./Fundraiser");

const FundraisersVerificationRequest = sequelize.define("FundraisersVerificationRequest", {
  request_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "users", key: "id" }
  },
  user_email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  user_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  fundraiser_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "fundraisers", key: "fundraiser_id" },
    unique: true
  },
  fundraiser_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  user_full_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  user_identity_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  user_current_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  charity_full_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  // ── Document to prove need (for requesters) ──
  need_document: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  // ── Charity license number ──
  charity_license_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  // ── Charity license certificate upload ──
  charity_license_certificate: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  charity_current_address: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  request_status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  }
}, {
  tableName: "fundraisers_verification_requests",
  underscored: true,
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

module.exports = FundraisersVerificationRequest;