const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');

const EmergencyReliefBanner = sequelize.define('EmergencyReliefBanner', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  region: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  keyword: {
    type: DataTypes.STRING,
    allowNull: true
  },
  selected_for_home: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'selected_for_home'
  },
}, {
  tableName: 'emergency_relief_banner', // ✅ اسم الجدول بدون مسافات
  timestamps: true,
  underscored: true, // ✅ Add this line
  createdAt: 'created_at', // ✅ Explicitly map createdAt
  updatedAt: 'updated_at'  // ✅ Explicitly map updatedAt
});

module.exports = EmergencyReliefBanner;
