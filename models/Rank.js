const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbSQL');

const Rank = sequelize.define('Rank', {
  rankId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'rank_id'
  },
  rankName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'rank_name'
  },
  rankDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rank_description'
  },
  minimumPoints: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'minimum_points'
  },
  maximumPoints: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'maximum_points'
  },
  rankImage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rank_image'
  },
  // Inside the model definition, add:
  rankColor: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'rank_color'
  },
  rewardName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'reward_name'
  },
  rewardImage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'reward_image'
  },
  numOfUsersInRank: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'num_of_users_in_rank'
  },
  firestoreDocId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'firestore_doc_id',
    unique: true
  }
}, {
  tableName: 'ranks',
  timestamps: true,
  underscored: true
});
Rank.sync({ force: false })
  .then(() => console.log('✅ Rank model synchronized with database'))
  .catch(error => console.error('❌ Error syncing Rank model:', error));
module.exports = Rank;