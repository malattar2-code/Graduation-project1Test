// site/syncRoutes.js
const express = require('express');
const router = express.Router();
const syncController = require('../../controller/syncController');
const authController = require('../../controller/site/authController'); // Your existing auth controller
const syncRankController = require('../../controller/dashbored/syncRankController');

// Middleware to check if user is admin (optional - add if you want to protect these routes)
const requireAdmin = (req, res, next) => {
  // Implement your admin check logic here
  // For now, we'll just call next() to allow access
  next();
};

// Sync routes
router.post('/sync/to-firebase', requireAdmin, syncController.syncToFirebase);
router.post('/sync/to-postgres', requireAdmin, syncController.syncToPostgres);
router.post('/sync/both-ways', requireAdmin, syncController.syncBothWays);
router.post('/sync/single-category', requireAdmin, syncController.syncSingleCategory);

// Get sync statistics
router.get('/sync/stats', requireAdmin, syncController.getSyncStats);

// Health check endpoint
router.get('/sync/status', (req, res) => {
  res.json({
    success: true,
    message: 'Sync service is running',
    endpoints: {
      toFirebase: 'POST /api/sync/to-firebase',
      toPostgres: 'POST /api/sync/to-postgres',
      bothWays: 'POST /api/sync/both-ways',
      singleCategory: 'POST /api/sync/single-category',
      stats: 'GET /api/sync/stats'
    }
  });
});
router.get('/ranks/sync/manual', syncRankController.manualSyncRanks);
router.get('/ranks/sync/status', syncRankController.getSyncStatus);
module.exports = router;