const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../middelware/requireAuth"); // Adjust path as needed
const allAchievementsController = require('../../controller/site/allAchievementsController');

// Main page: GET /all-achievements
router.get('/all-achievements', allAchievementsController.getAllAchievements);

// API: Toggle like on an achievement (POST /api/achievement/:achievementId/like)
router.post('/api/achievement/:achievementId/like', requireAuth, allAchievementsController.toggleLike);

// API: Get like status (GET /api/achievement/:achievementId/like-status)
router.get('/api/achievement/:achievementId/like-status', allAchievementsController.getLikeStatus);

module.exports = router;
