const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../middelware/requireAuth"); // Adjust path as needed
const achievementController = require('../../controller/site/achievementController');
const achievementCommentsController = require('../../controller/site/achievementCommentsController');
const allAchievementsController = require('../../controller/site/allAchievementsController');

// Achievement detail page: GET /achievement/:achievementId
router.get('/achievement/:achievementId', achievementController.getAchievementPage);

// API: Dynamic achievement data (likes, comments count)
router.get('/api/achievement-data/:achievementId', achievementController.getAchievementDataAPI);

// Achievement comment routes
router.post('/api/achievement/:achievementId/comment', requireAuth, achievementCommentsController.addComment);
router.get('/api/achievement/:achievementId/comments', achievementCommentsController.getAchievementComments);
router.delete('/api/achievement-comment/:commentId', requireAuth, achievementCommentsController.deleteComment);

// Like routes (shared from allAchievementsController)
router.post('/api/achievement/:achievementId/like', requireAuth, allAchievementsController.toggleLike);
router.get('/api/achievement/:achievementId/like-status', allAchievementsController.getLikeStatus);

module.exports = router;
