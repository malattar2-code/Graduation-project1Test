// models/FundraiserAchievement.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');

const FundraiserAchievement = sequelize.define('FundraiserAchievement', {
// AFTER:
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // ── NEW: public ULID for external-facing URLs/APIs ───────────────────────────
  public_id: {
    type: DataTypes.STRING(26),
    allowNull: false,
    unique: true,
    defaultValue: () => {
        const { ulid } = require('ulid');
        return ulid();
    },
    comment: 'Public-facing ULID for URLs, APIs, and external references'
  },
  fundraiser_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'fundraisers', key: 'fundraiser_id' }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  achievement_type: {
    type: DataTypes.ENUM('milestone', 'final'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { len: [5, 100] }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { len: [10, 5000] }
  },
  main_image: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  sub_image_one: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  sub_image_two: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  sub_image_three: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  video: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  achievement_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  likes_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  shares_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'fundraisers_achievements',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = FundraiserAchievement;