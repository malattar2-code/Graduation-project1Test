// controllers/userRankPointsController.js
const UserRankPoint = require('../../models/UserRankPoint'); // ADD THIS IMPORT
const User = require('../../models/User');
const Rank = require('../../models/Rank');
const RankAssignmentService = require('../../services/rankAssignmentService');
const AutoRankAssignmentService = require('../../services/autoRankAssignmentService');

class UserRankPointsController {
  // Fix this method - it should be a route handler
  // Add these new methods for automated service

  async startAutoAssignment(req, res) {
    try {
      AutoRankAssignmentService.startAutoAssignment();
      
      res.json({
        success: true,
        message: 'Auto rank assignment started',
        data: AutoRankAssignmentService.getStatus()
      });
    } catch (error) {
      console.error('Error starting auto assignment:', error);
      res.status(500).json({
        success: false,
        message: 'Error starting auto assignment'
      });
    }
  }

  async stopAutoAssignment(req, res) {
    try {
      AutoRankAssignmentService.stopAutoAssignment();
      
      res.json({
        success: true,
        message: 'Auto rank assignment stopped',
        data: AutoRankAssignmentService.getStatus()
      });
    } catch (error) {
      console.error('Error stopping auto assignment:', error);
      res.status(500).json({
        success: false,
        message: 'Error stopping auto assignment'
      });
    }
  }

  async getAutoAssignmentStatus(req, res) {
    try {
      const status = AutoRankAssignmentService.getStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error getting auto assignment status:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting auto assignment status'
      });
    }
  }

  async triggerManualAssignment(req, res) {
    try {
      await AutoRankAssignmentService.triggerManualAssignment();
      
      res.json({
        success: true,
        message: 'Manual rank assignment completed'
      });
    } catch (error) {
      console.error('Error triggering manual assignment:', error);
      res.status(500).json({
        success: false,
        message: 'Error triggering manual assignment'
      });
    }
  }

  async updateUserPointsAuto(req, res) {
    try {
      const { userId } = req.params;
      const { points } = req.body;

      console.log(`🎯 Auto-updating points for user ${userId} to ${points}`);

      if (!points || points < 0) {
        return res.status(400).json({
          success: false,
          message: 'Points must be a positive number'
        });
      }

      const result = await AutoRankAssignmentService.updateUserPoints(parseInt(userId), parseInt(points));
      
      res.json({
        success: true,
        message: `Updated points for user ${userId} and auto-assigned rank`,
        data: result
      });
    } catch (error) {
      console.error('Error auto-updating user points:', error);
      res.status(500).json({
        success: false,
        message: 'Error auto-updating user points'
      });
    }
  }
async initializeSingleDonor(req, res) {
  try {
    const { userId } = req.params;
    console.log(`🔄 Initializing single donor for user ID: ${userId}`);

    // Get the user from the database
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${userId} not found`
      });
    }

    if (user.user_type !== 'donor') {
      return res.status(400).json({
        success: false,
        message: `User ${userId} is not a donor`
      });
    }

    // Check if user already has a rank record
    const existingRecord = await UserRankPoint.findOne({ 
      where: { userId: user.id } 
    });
    
    if (existingRecord) {
      return res.json({
        success: true,
        message: `User ${user.id} already has rank points record`,
        data: existingRecord
      });
    }

    // Create new rank points record with 0 points - WITHOUT RANK DATA
    const userRankPoint = await UserRankPoint.create({
      userId: user.id,
      userEmail: user.email,
      fullName: user.full_name,
      userImage: user.user_image,
      userPoints: 0,
      currentRankId: null,  // Will be set by assignRankToUser
      rankName: null,       // Will be set by assignRankToUser
      rankImage: null,      // Will be set by assignRankToUser
      rewardName: null,     // Will be set by assignRankToUser
      rewardImage: null     // Will be set by assignRankToUser
    });

    console.log(`✅ Initialized rank points for donor ${user.id}`);
    
    // Assign initial rank based on 0 points - THIS WILL POPULATE RANK AND REWARD FIELDS
    await RankAssignmentService.assignRankToUser(user.id);
    
    // Fetch the updated record with rank data
    const updatedUserRankPoint = await UserRankPoint.findByPk(userRankPoint.userRankPointId);
    
    res.json({
      success: true,
      message: `Successfully initialized rank points for donor ${user.full_name}`,
      data: updatedUserRankPoint
    });
    
  } catch (error) {
    console.error(`❌ Error initializing donor:`, error);
    res.status(500).json({
      success: false,
      message: 'Error initializing donor: ' + error.message
    });
  }
}
  // Initialize all donors (one-time operation)
  async initializeAllDonors(req, res) {
    try {
      console.log('🔄 Starting initialization of all donors...');
      
      const result = await RankAssignmentService.initializeAllDonors();
      
      res.json({
        success: true,
        message: `Initialized ${result.initializedCount} donors, ${result.skippedCount} already existed`,
        data: result
      });
    } catch (error) {
      console.error('Error initializing donors:', error);
      res.status(500).json({
        success: false,
        message: 'Error initializing donors: ' + error.message
      });
    }
  }

  // Update user points manually
  async updateUserPoints(req, res) {
    try {
      const { userId } = req.params;
      const { points } = req.body;

      console.log(`🔄 Updating points for user ${userId} to ${points}`);

      if (!points || points < 0) {
        return res.status(400).json({
          success: false,
          message: 'Points must be a positive number'
        });
      }

      const result = await RankAssignmentService.updateUserPoints(parseInt(userId), parseInt(points));
      
      res.json({
        success: true,
        message: `Updated points for user ${userId}`,
        data: result
      });
    } catch (error) {
      console.error('Error updating user points:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user points: ' + error.message
      });
    }
  }

  // Get all user rank points
  async getAllUserRankPoints(req, res) {
    try {
      console.log('🔄 Fetching all user rank points...');
      const userRankPoints = await RankAssignmentService.getAllUserRankPoints();
      
      res.json({
        success: true,
        data: userRankPoints
      });
    } catch (error) {
      console.error('Error getting user rank points:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting user rank points: ' + error.message
      });
    }
  }

  // Get specific user's rank info
  async getUserRankInfo(req, res) {
    try {
      const { userId } = req.params;
      console.log(`🔄 Fetching rank info for user ${userId}`);
      
      const userRankInfo = await RankAssignmentService.getUserRankInfo(parseInt(userId));
      
      if (!userRankInfo) {
        return res.status(404).json({
          success: false,
          message: 'User rank information not found'
        });
      }
      
      res.json({
        success: true,
        data: userRankInfo
      });
    } catch (error) {
      console.error('Error getting user rank info:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting user rank info: ' + error.message
      });
    }
  }

  // ADD THIS METHOD - Re-assign all ranks
  async reassignAllRanks(req, res) {
    try {
      console.log('🔄 Re-assigning ranks for all users based on current points...');
      
      // Get all user rank points
      const allUserRankPoints = await UserRankPoint.findAll();
      
      let updatedCount = 0;
      let errorCount = 0;

      for (const userRankPoint of allUserRankPoints) {
        try {
          // Re-assign rank based on current points
          await RankAssignmentService.assignRankToUser(userRankPoint.userId);
          updatedCount++;
          console.log(`✅ Re-assigned rank for user ${userRankPoint.userId}`);
        } catch (error) {
          console.error(`❌ Error re-assigning rank for user ${userRankPoint.userId}:`, error);
          errorCount++;
        }
      }

      res.json({
        success: true,
        message: `Re-assigned ranks for ${updatedCount} users, ${errorCount} errors`,
        data: { updatedCount, errorCount }
      });
    } catch (error) {
      console.error('Error re-assigning ranks:', error);
      res.status(500).json({
        success: false,
        message: 'Error re-assigning ranks: ' + error.message
      });
    }
  }

  // ADD THIS METHOD - Update points with rank assignment
  async updateUserPointsWithRank(req, res) {
    try {
      const { userId } = req.params;
      const { points } = req.body;

      console.log(`🎯 Manually updating points for user ${userId} to ${points}`);

      if (!points || points < 0) {
        return res.status(400).json({
          success: false,
          message: 'Points must be a positive number'
        });
      }

      // This will update points AND assign rank
      const result = await RankAssignmentService.updateUserPoints(parseInt(userId), parseInt(points));
      
      res.json({
        success: true,
        message: `Updated points for user ${userId} and assigned rank`,
        data: result
      });
    } catch (error) {
      console.error('Error updating user points:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user points: ' + error.message
      });
    }
  }
  // In controllers/userRankPointsController.js - Add this method
    async getCurrentUserRankInfo(req, res) {
        try {
            // Get the current user ID from the authenticated request
            // If you're using Firebase auth, you might get it from req.user.uid
            // If you're using session auth, adjust accordingly
            const userId = req.user.id; // Adjust this based on your auth system
            
            console.log(`🔄 Fetching rank info for current user ${userId}`);
            
            const userRankInfo = await RankAssignmentService.getUserRankInfo(parseInt(userId));
            
            if (!userRankInfo) {
            return res.status(404).json({
                success: false,
                message: 'User rank information not found'
            });
            }
            
            res.json({
            success: true,
            data: userRankInfo
            });
        } catch (error) {
            console.error('Error getting current user rank info:', error);
            res.status(500).json({
            success: false,
            message: 'Error getting user rank info: ' + error.message
            });
        }
    }
    async updateUserProfileData(req, res) {
  try {
    const { userId } = req.params;
    
    const result = await RankAssignmentService.updateUserProfileData(parseInt(userId));
    
    res.json({
      success: true,
      message: `Updated profile data for user ${userId}`,
      data: result
    });
  } catch (error) {
    console.error('Error updating user profile data:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile data: ' + error.message
    });
  }
}

async updateAllUsersProfileData(req, res) {
  try {
    const result = await RankAssignmentService.updateAllUsersProfileData();
    
    res.json({
      success: true,
      message: `Updated profile data for ${result.updatedCount} users, ${result.errorCount} errors`,
      data: result
    });
  } catch (error) {
    console.error('Error updating all users profile data:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating all users profile data: ' + error.message
    });
  }
}
}

module.exports = new UserRankPointsController();