// routes/userRankPoints.js
const express = require('express');
const router = express.Router();
const userRankPointsController = require('../../controller/dashbored/userRankPointsController');
const requireAuthAPI = require('../../middelware/requireAuthAPI');

// Apply auth middleware
router.use(requireAuthAPI);

// Initialize all donors (one-time operation)
router.post('/user-rank-points/initialize-donors', userRankPointsController.initializeAllDonors);

// Update user points manually
router.put('/user-rank-points/:userId/points', userRankPointsController.updateUserPoints);

// Get all user rank points
router.get('/user-rank-points', userRankPointsController.getAllUserRankPoints);

// Get specific user's rank info
router.get('/user-rank-points/:userId', userRankPointsController.getUserRankInfo);

module.exports = router;