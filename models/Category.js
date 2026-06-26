// models/Category.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');

const Category = sequelize.define('Category', {
  category_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'category_id'
  },
  category_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'category_name'
  },
  category_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'category_image'
  },
  category_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'category_description'
  },
  firebase_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    field: 'firebase_id'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'categories',
  schema: 'public',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = Category;