const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');

const AchievementComment = sequelize.define('AchievementComment', {
  comment_id: {
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
  },
  comment_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  parent_comment_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_blocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'achievement_comments',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = AchievementComment;