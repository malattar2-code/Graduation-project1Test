const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');

const AchievementLike = sequelize.define('AchievementLike', {
  like_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  achievement_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'achievement_likes',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = AchievementLike;