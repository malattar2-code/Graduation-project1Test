// models/UserRankPoint.js
const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/dbSQL');
// models/UserRankPoint.js - Update hooks section
const rankCountService = require('../services/RankCountService');
const UserRankPoint = sequelize.define('UserRankPoint', {
  userRankPointId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'user_rank_point_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  userEmail: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'user_email'
  },
  fullName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'full_name'
  },
  userImage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_image'
  },
  userPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'user_points'
  },
  currentRankId: {
    type: DataTypes.INTEGER, // This should be INTEGER to match ranks.rank_id
    allowNull: true,
    field: 'current_rank_id',
    references: {
      model: 'ranks',
      key: 'rank_id'
    }
  },
  rankName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'rank_name'
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
  // ADD THESE NEW FIELDS
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
  firestoreDocId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'firestore_doc_id',
    unique: true
  }
}, {
  tableName: 'user_rank_points',
  timestamps: true,
  underscored: true,
  hooks: {
    afterCreate: async (userRankPoint, options) => {
      await rankCountService.handleUserRankPointCreated(userRankPoint);
    },
    
    afterUpdate: async (userRankPoint, options) => {
      if (userRankPoint.changed('currentRankId')) {
        const previousRankId = userRankPoint.previous('currentRankId');
        const newRankId = userRankPoint.currentRankId;
        
        await rankCountService.handleUserRankPointUpdated(previousRankId, newRankId);
      }
    },
    
    afterDestroy: async (userRankPoint, options) => {
      await rankCountService.handleUserRankPointDeleted(userRankPoint);
    }
  }
});

// Helper function to update a single rank's user count with proper type handling
async function updateRankUserCount(rankId) {
  try {
    if (!rankId || isNaN(rankId)) {
      console.log(`⚠️ Invalid rankId: ${rankId}, skipping update`);
      return;
    }
    
    // Ensure rankId is integer
    const numericRankId = parseInt(rankId);
    if (isNaN(numericRankId)) {
      console.log(`⚠️ Cannot parse rankId to integer: ${rankId}`);
      return;
    }
    
    const Rank = require('./Rank');
    
    // First check if the rank exists
    const rank = await Rank.findByPk(numericRankId);
    if (!rank) {
      console.log(`⚠️ Rank ${numericRankId} not found, skipping count update`);
      return;
    }
    
    // Count users with this rank - ensure proper type comparison
    const userCount = await UserRankPoint.count({
      where: { 
        currentRankId: numericRankId 
      }
    });
    
    // Update the rank count
    await Rank.update(
      { numOfUsersInRank: userCount },
      { where: { rankId: numericRankId } }
    );
    
    console.log(`✅ Updated rank ${numericRankId} (${rank.rankName}) user count to: ${userCount}`);
  } catch (error) {
    console.error(`❌ Error updating rank ${rankId} user count:`, error.message);
  }
}


module.exports = UserRankPoint;