// routes/userRankPointsOpen.js
const express = require('express');
const router = express.Router();
const userRankPointsController = require('../../controller/dashbored/userRankPointsController');

// NO AUTHENTICATION REQUIRED - FOR TESTING

// Initialize all donors
router.post('/user-rank-points-open/initialize-donors', userRankPointsController.initializeAllDonors);
router.post('/user-rank-points-open/:userId/initialize-One-donor', userRankPointsController.initializeSingleDonor);
// Update user points (original)
router.put('/user-rank-points-open/:userId/points', userRankPointsController.updateUserPoints);

// Update user points with rank assignment (new)
router.put('/user-rank-points-open/:userId/update-points', userRankPointsController.updateUserPointsWithRank);

// Get all user rank points
router.get('/user-rank-points-open', userRankPointsController.getAllUserRankPoints);

// Get specific user's rank info
router.get('/user-rank-points-open/:userId', userRankPointsController.getUserRankInfo);

// Re-assign all ranks (new)
router.post('/user-rank-points-open/reassign-all-ranks', userRankPointsController.reassignAllRanks);

router.get('/user-rank-points-open/current-user', userRankPointsController.getCurrentUserRankInfo);
router.put('/user-rank-points-open/:userId/update-profile', userRankPointsController.updateUserProfileData);

// Update profile data for all users
router.post('/user-rank-points-open/update-all-profiles', userRankPointsController.updateAllUsersProfileData);

router.post('/user-rank-points-open/auto/start', userRankPointsController.startAutoAssignment);
router.post('/user-rank-points-open/auto/stop', userRankPointsController.stopAutoAssignment);
router.get('/user-rank-points-open/auto/status', userRankPointsController.getAutoAssignmentStatus);
router.post('/user-rank-points-open/auto/trigger', userRankPointsController.triggerManualAssignment);
router.put('/user-rank-points-open/:userId/auto-points', userRankPointsController.updateUserPointsAuto);
module.exports = router;