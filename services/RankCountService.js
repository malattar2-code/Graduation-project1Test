const { Op } = require('sequelize');
const sequelize = require('../config/dbSQL');

class RankCountService {
  constructor() {
    this.isInitialized = false;
    this.Rank = null;
    this.UserRankPoint = null;
    this.init();
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      console.log('🚀 Initializing RankCountService...');
      
      this.Rank = require('../models/Rank');
      this.UserRankPoint = require('../models/UserRankPoint');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await this.initializeAllRankCounts();
      
      this.isInitialized = true;
      console.log('✅ RankCountService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize RankCountService:', error);
    }
  }

  async initializeAllRankCounts() {
    try {
      console.log('🔄 Initializing all rank counts...');
      
      const allRanks = await this.Rank.findAll();
      let updatedCount = 0;
      
      for (const rank of allRanks) {
        const userCount = await this.getUserCountForRank(rank.rankId);
        
        if (rank.numOfUsersInRank !== userCount) {
          await rank.update({ numOfUsersInRank: userCount });
          updatedCount++;
          console.log(`✅ Rank "${rank.rankName}" initialized with ${userCount} users`);
        }
      }
      
      console.log(`🎉 Rank initialization completed: ${updatedCount} ranks updated`);
      return updatedCount;
    } catch (error) {
      console.error('❌ Error initializing rank counts:', error);
      throw error;
    }
  }

  async getUserCountForRank(rankId) {
    try {
      const numericRankId = parseInt(rankId);
      if (isNaN(numericRankId)) {
        console.log(`⚠️ Invalid rankId: ${rankId}`);
        return 0;
      }

      const result = await sequelize.query(
        `SELECT COUNT(*) as user_count 
         FROM user_rank_points 
         WHERE current_rank_id = $1`,
        {
          bind: [numericRankId],
          type: sequelize.QueryTypes.SELECT
        }
      );

      return parseInt(result[0]?.user_count) || 0;
    } catch (error) {
      console.error(`❌ Error getting user count for rank ${rankId}:`, error.message);
      return 0;
    }
  }

  async updateRankUserCount(rankId) {
    try {
      const numericRankId = parseInt(rankId);
      if (isNaN(numericRankId)) {
        console.log(`⚠️ Invalid rankId: ${rankId}`);
        return false;
      }

      const rank = await this.Rank.findByPk(numericRankId);
      if (!rank) {
        console.log(`⚠️ Rank ${numericRankId} not found, skipping count update`);
        return false;
      }

      const userCount = await this.getUserCountForRank(numericRankId);
      
      await this.Rank.update(
        { numOfUsersInRank: userCount },
        { where: { rankId: numericRankId } }
      );

      console.log(`✅ Rank "${rank.rankName}" user count updated to: ${userCount}`);

      // ── Firestore sync disabled ─────────────────────────────────────────
      // if (rank.firestoreDocId) {
      //   try {
      //     await admin.firestore().collection('ranks').doc(rank.firestoreDocId).update({
      //       numOfUsersInRank: userCount,
      //       updatedAt: admin.firestore.FieldValue.serverTimestamp()
      //     });
      //     console.log(`✅ Synced count to Firestore for rank "${rank.rankName}"`);
      //   } catch (firestoreError) {
      //     console.error(`❌ Error syncing to Firestore for rank ${rank.rankName}:`, firestoreError);
      //   }
      // }

      return true;
    } catch (error) {
      console.error(`❌ Error updating user count for rank ${rankId}:`, error.message);
      return false;
    }
  }

  async updateAllRankUserCounts() {
    try {
      console.log('🔄 Updating user counts for all ranks...');
      
      const allRanks = await this.Rank.findAll();
      let updatedCount = 0;
      
      for (const rank of allRanks) {
        const success = await this.updateRankUserCount(rank.rankId);
        if (success) updatedCount++;
      }
      
      console.log(`✅ All rank user counts updated: ${updatedCount}/${allRanks.length} ranks`);
      return updatedCount;
    } catch (error) {
      console.error('❌ Error updating all rank user counts:', error);
      throw error;
    }
  }

  async handleUserRankPointCreated(userRankPoint) {
    try {
      if (!userRankPoint.currentRankId) return;
      
      console.log(`🔄 UserRankPoint created, updating rank count for rank ${userRankPoint.currentRankId}`);
      await this.updateRankUserCount(userRankPoint.currentRankId);
      
      return true;
    } catch (error) {
      console.error('❌ Error handling user rank point creation:', error);
      return false;
    }
  }

  async handleUserRankPointUpdated(previousRankId, newRankId) {
    try {
      console.log(`🔄 User rank changed from ${previousRankId} to ${newRankId}, updating both ranks`);
      
      const updatePromises = [];
      
      if (previousRankId) {
        updatePromises.push(this.updateRankUserCount(previousRankId));
      }
      
      if (newRankId) {
        updatePromises.push(this.updateRankUserCount(newRankId));
      }
      
      await Promise.all(updatePromises);
      console.log(`✅ Updated both rank counts for rank change`);
      
      return true;
    } catch (error) {
      console.error('❌ Error handling user rank point update:', error);
      return false;
    }
  }

  async handleUserRankPointDeleted(userRankPoint) {
    try {
      if (!userRankPoint.currentRankId) return;
      
      console.log(`🔄 UserRankPoint deleted, updating rank count for rank ${userRankPoint.currentRankId}`);
      await this.updateRankUserCount(userRankPoint.currentRankId);
      
      return true;
    } catch (error) {
      console.error('❌ Error handling user rank point deletion:', error);
      return false;
    }
  }

  async getRankStatistics() {
    try {
      const allRanks = await this.Rank.findAll({
        order: [['minimum_points', 'ASC']]
      });

      const statistics = {
        totalRanks: allRanks.length,
        totalUsersInRanks: 0,
        ranks: []
      };

      for (const rank of allRanks) {
        const userCount = rank.numOfUsersInRank;
        statistics.totalUsersInRanks += userCount;
        
        statistics.ranks.push({
          rankId: rank.rankId,
          rankName: rank.rankName,
          userCount: userCount,
          minimumPoints: rank.minimumPoints,
          maximumPoints: rank.maximumPoints
        });
      }

      return statistics;
    } catch (error) {
      console.error('❌ Error getting rank statistics:', error);
      throw error;
    }
  }

  async forceRefreshAllCounts() {
    try {
      console.log('🔄 Force refreshing all rank counts...');
      const updatedCount = await this.updateAllRankUserCounts();
      
      return {
        success: true,
        message: `Force refresh completed: ${updatedCount} ranks updated`,
        updatedCount: updatedCount
      };
    } catch (error) {
      console.error('❌ Error force refreshing rank counts:', error);
      return {
        success: false,
        message: 'Error force refreshing rank counts',
        error: error.message
      };
    }
  }
}

const rankCountService = new RankCountService();
module.exports = rankCountService;