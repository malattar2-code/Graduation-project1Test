const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');

const DonorsThanks = sequelize.define('DonorsThanks', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_thanked_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  user_grateful_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  user_grateful_full_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  user_grateful_image: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'donors_thanks',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});


module.exports = DonorsThanks;