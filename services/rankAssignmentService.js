const User = require('../models/User');
const Rank = require('../models/Rank');
const UserRankPoint = require('../models/UserRankPoint');
const { Op } = require('sequelize');

class RankAssignmentService {
  async assignRankToUser(userId) {
    try {
      const userRankPoint = await UserRankPoint.findOne({ where: { userId } });
      if (!userRankPoint) {
        throw new Error(`User rank points record not found for user ${userId}`);
      }

      const assignedRank = await Rank.findOne({
        where: {
          minimumPoints: { [Op.lte]: userRankPoint.userPoints },
          maximumPoints: { [Op.gte]: userRankPoint.userPoints }
        }
      });

      await userRankPoint.update({
        currentRankId: assignedRank ? assignedRank.rankId : null,
        rankName: assignedRank ? assignedRank.rankName : null,
        rankImage: assignedRank ? assignedRank.rankImage : null,
        rewardName: assignedRank ? assignedRank.rewardName : null,
        rewardImage: assignedRank ? assignedRank.rewardImage : null,
        rankColor: assignedRank ? assignedRank.rankColor : null
      });

      // DISABLED: Firestore sync removed per project requirements
      // await this.syncToFirestore(userRankPoint, assignedRank);

      console.log(`✅ Assigned rank to user ${userId}: ${assignedRank?.rankName || 'None'}`);
      return assignedRank;
    } catch (error) {
      console.error(`❌ Error assigning rank to user ${userId}:`, error);
      throw error;
    }
  }

  async initializeSingleDonor(donor) {
    try {
      const existingRecord = await UserRankPoint.findOne({ 
        where: { userId: donor.id } 
      });
      
      if (existingRecord) {
        console.log(`⏩ User ${donor.id} (${donor.email}) already has rank points record`);
        return null;
      }

      const userRankPoint = await UserRankPoint.create({
        userId: donor.id,
        userEmail: donor.email,
        fullName: donor.full_name,
        userImage: donor.user_image,
        userPoints: 0,
        currentRankId: null,
        rankName: null,
        rankImage: null,
        rewardName: null,
        rewardImage: null
      });

      console.log(`✅ Initialized rank points for donor ${donor.id} (${donor.email})`);
      
      await this.assignRankToUser(donor.id);
      
      return userRankPoint;
    } catch (error) {
      console.error(`❌ Error initializing donor ${donor.id}:`, error);
      throw error;
    }
  }
  
  async updateUserPoints(userId, newPoints) {
    try {
      console.log(`🎯 Updating points for user ${userId} to ${newPoints}`);
      
      let userRankPoint = await UserRankPoint.findOne({ 
        where: { userId }
      });

      if (!userRankPoint) {
        const user = await User.findByPk(userId);
        if (!user) {
          throw new Error(`User not found with ID: ${userId}`);
        }
        
        if (user.user_type !== 'donor') {
          throw new Error(`User ${userId} is not a donor`);
        }

        userRankPoint = await UserRankPoint.create({
          userId: userId,
          userEmail: user.email,
          fullName: user.full_name,
          userImage: user.user_image,
          userPoints: 0,
          currentRankId: null,
          rankName: null,
          rankImage: null,
          rewardName: null,
          rewardImage: null
        });
        
        console.log(`📝 Created new rank points record for user ${userId}`);
      }

      userRankPoint.userPoints = parseInt(newPoints);
      await userRankPoint.save();
      
      const assignedRank = await this.assignRankToUser(userId);
      
      console.log(`✅ Updated user ${userId} points to ${newPoints}, assigned rank: ${assignedRank?.rankName || 'None'}`);
      
      return {
        userRankPoint,
        assignedRank
      };
    } catch (error) {
      console.error('❌ Error updating user points:', error);
      throw error;
    }
  }

  // DISABLED: Firestore sync removed per project requirements
  async syncToFirestore(userRankPoint, rank) {
    // Firestore sync disabled - all rank data remains in PostgreSQL only
    return;
  }

  async updateUserProfileData(userId) {
    try {
      console.log(`🔄 Updating profile data for user ${userId} in rank points table`);
      
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error(`User not found with ID: ${userId}`);
      }

      const userRankPoint = await UserRankPoint.findOne({ where: { userId } });
      
      if (userRankPoint) {
        userRankPoint.fullName = user.full_name;
        userRankPoint.userImage = user.user_image;
        await userRankPoint.save();
        
        console.log(`✅ Updated profile data for user ${userId}`);
        
        // DISABLED: Firestore sync removed per project requirements
        // const currentRank = await Rank.findByPk(userRankPoint.currentRankId);
        // await this.syncToFirestore(userRankPoint, currentRank);
      }
      
      return userRankPoint;
    } catch (error) {
      console.error('❌ Error updating user profile data:', error);
      throw error;
    }
  }

  async updateAllUsersProfileData() {
    try {
      console.log('🔄 Updating profile data for all users in rank points table...');
      
      const allUserRankPoints = await UserRankPoint.findAll();
      let updatedCount = 0;
      let errorCount = 0;

      for (const userRankPoint of allUserRankPoints) {
        try {
          const user = await User.findByPk(userRankPoint.userId);
          if (user) {
            userRankPoint.fullName = user.full_name;
            userRankPoint.userImage = user.user_image;
            await userRankPoint.save();
            updatedCount++;
            console.log(`✅ Updated profile data for user ${userRankPoint.userId}`);
          }
        } catch (error) {
          console.error(`❌ Error updating profile for user ${userRankPoint.userId}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ Profile update completed: ${updatedCount} updated, ${errorCount} errors`);
      return { updatedCount, errorCount };
    } catch (error) {
      console.error('❌ Error in updateAllUsersProfileData:', error);
      throw error;
    }
  }

  async getAllUserRankPoints() {
    try {
      return await UserRankPoint.findAll({
        include: [
          {
            model: User,
            attributes: ['id', 'full_name', 'email', 'user_type']
          },
          {
            model: Rank,
            attributes: ['rankId', 'rankName', 'minimumPoints', 'maximumPoints']
          }
        ],
        order: [['userPoints', 'DESC']]
      });
    } catch (error) {
      console.error('❌ Error getting all user rank points:', error);
      return [];
    }
  }

  async getUserRankInfo(userId) {
    try {
      return await UserRankPoint.findOne({
        where: { userId },
        include: [
          {
            model: User,
            attributes: ['id', 'full_name', 'email', 'user_type']
          },
          {
            model: Rank,
            attributes: ['rankId', 'rankName', 'minimumPoints', 'maximumPoints', 'rankImage', 'rewardImage']
          }
        ]
      });
    } catch (error) {
      console.error('❌ Error getting user rank info:', error);
      return null;
    }
  }
}

module.exports = new RankAssignmentService();