const User = require('../models/User');
const Rank = require('../models/Rank');
const UserRankPoint = require('../models/UserRankPoint');

class AutoRankAssignmentService {
  constructor() {
    this.isRunning = false;
    this.init();
  }

  async init() {
    try {
      console.log('🔄 Initializing Auto Rank Assignment Service...');
      this.startAutoAssignment();
      console.log('✅ Auto Rank Assignment Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Auto Rank Assignment Service:', error);
    }
  }

  startAutoAssignment() {
    if (this.isRunning) {
      console.log('⚠️ Auto rank assignment already running');
      return;
    }

    this.isRunning = true;
    
    this.interval = setInterval(async () => {
      await this.processAutoRankAssignment();
    }, 3000000);

    setTimeout(() => {
      this.processAutoRankAssignment();
    }, 5000000);

    console.log('🔄 Auto rank assignment started (runs every 30 seconds)');
  }

  stopAutoAssignment() {
    if (this.interval) {
      clearInterval(this.interval);
      this.isRunning = false;
      console.log('🛑 Auto rank assignment stopped');
    }
  }

  async processAutoRankAssignment() {
    try {
      console.log('🔄 Starting automatic rank assignment process...');
      
      const donors = await User.findAll({
        where: { user_type: 'donor' }
      });

      console.log(`📊 Found ${donors.length} donors to process`);

      let processedCount = 0;
      let assignedCount = 0;
      let errorCount = 0;

      for (const donor of donors) {
        try {
          const result = await this.processSingleDonor(donor);
          processedCount++;
          
          if (result.rankAssigned) {
            assignedCount++;
          }
        } catch (error) {
          console.error(`❌ Error processing donor ${donor.id}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ Auto rank assignment completed: ${processedCount} processed, ${assignedCount} ranks assigned, ${errorCount} errors`);
      
    } catch (error) {
      console.error('❌ Error in auto rank assignment process:', error);
    }
  }

  async processSingleDonor(donor) {
    try {
      let userRankPoint = await UserRankPoint.findOne({
        where: { userId: donor.id }
      });

      if (!userRankPoint) {
        userRankPoint = await UserRankPoint.create({
          userId: donor.id,
          userEmail: donor.email,
          fullName: donor.full_name,
          userImage: donor.user_image,
          userPoints: 0,
          currentRankId: null,
          rankName: null,
          rankImage: null,
          rewardName: null,
          rewardImage: null,
          rankColor: null
        });
        
        console.log(`📝 Created rank points record for donor ${donor.id}`);
      } else {
        if (userRankPoint.fullName !== donor.full_name || userRankPoint.userImage !== donor.user_image) {
          userRankPoint.fullName = donor.full_name;
          userRankPoint.userImage = donor.user_image;
          await userRankPoint.save();
          console.log(`🔄 Updated profile data for donor ${donor.id}`);
        }
      }

      const assignedRank = await this.assignRankBasedOnPoints(userRankPoint.userPoints);
      
      let rankAssigned = false;

      if (assignedRank) {
        if (userRankPoint.currentRankId !== assignedRank.rankId) {
          userRankPoint.currentRankId = assignedRank.rankId;
          userRankPoint.rankName = assignedRank.rankName;
          userRankPoint.rankImage = assignedRank.rankImage;
          userRankPoint.rewardName = assignedRank.rewardName;
          userRankPoint.rewardImage = assignedRank.rewardImage;
          userRankPoint.rankColor = assignedRank.rankColor;
          await userRankPoint.save();
          
          console.log(`🎯 Assigned rank "${assignedRank.rankName}" to donor ${donor.id} (${userRankPoint.userPoints} points)`);
          rankAssigned = true;

          await this.updateRankUserCount(assignedRank.rankId);
        }
      } else {
        if (userRankPoint.currentRankId !== null) {
          userRankPoint.currentRankId = null;
          userRankPoint.rankName = null;
          userRankPoint.rankImage = null;
          await userRankPoint.save();
          console.log(`⚠️ Removed rank from donor ${donor.id} (no matching rank)`);
        }
      }

      // DISABLED: Firestore sync removed per project requirements
      // await this.syncToFirestore(userRankPoint, assignedRank);

      return {
        donorId: donor.id,
        points: userRankPoint.userPoints,
        rankAssigned,
        rankName: assignedRank ? assignedRank.rankName : null
      };

    } catch (error) {
      console.error(`❌ Error processing donor ${donor.id}:`, error);
      throw error;
    }
  }

  async assignRankBasedOnPoints(points) {
    try {
      const ranks = await Rank.findAll({
        order: [['minimumPoints', 'ASC']]
      });

      console.log(`🔍 Looking for rank for points: ${points}`);
      console.log(`📊 Available ranks:`, ranks.map(r => ({
        id: r.rankId,
        name: r.rankName,
        min: r.minimumPoints,
        max: r.maximumPoints,
        rewardName: r.rewardName,
        rewardImage: r.rewardImage
      })));

      const assignedRank = ranks.find(rank => 
        points >= rank.minimumPoints && points <= rank.maximumPoints
      );

      console.log(`🎯 Found rank:`, assignedRank ? {
        name: assignedRank.rankName,
        rewardName: assignedRank.rewardName,
        rewardImage: assignedRank.rewardImage
      } : 'None');

      return assignedRank || null;
    } catch (error) {
      console.error('❌ Error assigning rank based on points:', error);
      return null;
    }
  }

  async updateRankUserCount(rankId) {
    try {
      const userCount = await UserRankPoint.count({
        where: { currentRankId: rankId }
      });

      await Rank.update(
        { numOfUsersInRank: userCount },
        { where: { rankId: rankId } }
      );

      console.log(`📊 Updated rank ${rankId} user count to ${userCount}`);
    } catch (error) {
      console.error(`❌ Error updating rank ${rankId} user count:`, error);
    }
  }

  // DISABLED: Firestore sync removed per project requirements
  async syncToFirestore(userRankPoint, rank) {
    // Firestore sync disabled - all rank data remains in PostgreSQL only
    return;
  }

  async triggerManualAssignment() {
    console.log('🔄 Manual rank assignment triggered');
    await this.processAutoRankAssignment();
  }

  async triggerSingleUserAssignment(userId) {
    try {
      const donor = await User.findOne({
        where: { 
          id: userId,
          user_type: 'donor' 
        }
      });

      if (!donor) {
        throw new Error(`Donor not found with ID: ${userId}`);
      }

      console.log(`🔄 Manual rank assignment triggered for user ${userId}`);
      return await this.processSingleDonor(donor);
    } catch (error) {
      console.error(`❌ Error in manual assignment for user ${userId}:`, error);
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
        const donor = await User.findOne({
          where: { 
            id: userId,
            user_type: 'donor' 
          }
        });

        if (!donor) {
          throw new Error(`Donor not found with ID: ${userId}`);
        }

        userRankPoint = await UserRankPoint.create({
          userId: donor.id,
          userEmail: donor.email,
          fullName: donor.full_name,
          userImage: donor.user_image,
          userPoints: newPoints,
          currentRankId: null,
          rankName: null,
          rankImage: null,
          rewardName: null,
          rewardImage: null,
        });
      } else {
        userRankPoint.userPoints = parseInt(newPoints);
        await userRankPoint.save();
      }

      const result = await this.processSingleDonor(await User.findByPk(userId));

      console.log(`✅ Updated user ${userId} points to ${newPoints}`);

      return {
        userRankPoint,
        assignmentResult: result
      };
    } catch (error) {
      console.error('❌ Error updating user points:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      service: 'AutoRankAssignmentService',
      lastRun: new Date()
    };
  }
}

const autoRankAssignmentService = new AutoRankAssignmentService();
module.exports = autoRankAssignmentService;