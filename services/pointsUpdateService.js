// services/pointsUpdateService.js
const AutoRankAssignmentService = require('./autoRankAssignmentService');

class PointsUpdateService {
  // Call this method whenever a user earns points (from donations, activities, etc.)
  async addPointsToUser(userId, pointsToAdd, source = 'unknown') {
    try {
      console.log(`💰 Adding ${pointsToAdd} points to user ${userId} from source: ${source}`);
      
      // Get current points
      const UserRankPoint = require('../models/UserRankPoint');
      let userRankPoint = await UserRankPoint.findOne({ where: { userId } });
      
      let currentPoints = 0;
      if (userRankPoint) {
        currentPoints = userRankPoint.userPoints;
      }
      
      const newPoints = currentPoints + parseInt(pointsToAdd);
      
      // Use the auto assignment service to update points and assign rank
      const result = await AutoRankAssignmentService.updateUserPoints(userId, newPoints);
      
      console.log(`✅ Added ${pointsToAdd} points to user ${userId}. Total: ${newPoints} points`);
      
      return result;
    } catch (error) {
      console.error(`❌ Error adding points to user ${userId}:`, error);
      throw error;
    }
  }

  // Example: When a user makes a donation
  async handleDonation(userId, donationAmount) {
    try {
      // Calculate points based on donation amount (1 point per 10 currency units, for example)
      const pointsEarned = Math.floor(donationAmount / 10);
      
      return await this.addPointsToUser(userId, pointsEarned, 'donation');
    } catch (error) {
      console.error(`❌ Error handling donation for user ${userId}:`, error);
      throw error;
    }
  }

  // Example: When a user completes a task
  async handleTaskCompletion(userId, taskType) {
    try {
      const pointsMap = {
        'profile_completion': 50,
        'first_donation': 100,
        'social_share': 25,
        'monthly_challenge': 200
      };
      
      const pointsEarned = pointsMap[taskType] || 10;
      
      return await this.addPointsToUser(userId, pointsEarned, `task_${taskType}`);
    } catch (error) {
      console.error(`❌ Error handling task completion for user ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = new PointsUpdateService();