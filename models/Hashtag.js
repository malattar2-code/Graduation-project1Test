const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');

const Hashtag = sequelize.define('Hashtag', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tag_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'hashtags',
  timestamps: false,
  underscored: true
});

module.exports = Hashtag;