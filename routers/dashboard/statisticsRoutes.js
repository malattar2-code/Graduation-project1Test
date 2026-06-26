// routes/dashboard/statisticsRoutes.js
const express = require('express');
const router = express.Router();
const statisticsController = require('../../controller/dashbored/statisticsController');
const { requireAuth } = require("../../middelware/requireAuth");

// User statistics routes with debug middleware
router.get('/api/statistics/users/monthly', 
    requireAuth, 
    statisticsController.debugRoute.bind(statisticsController),
    statisticsController.getMonthlyUserStatistics
);

router.get('/api/statistics/users/overview', 
    requireAuth, 
    statisticsController.getUserStatistics
);

// Add a test route to verify the route is working
router.get('/api/statistics/test', (req, res) => {
    console.log('✅ Statistics test route hit successfully');
    res.json({
        success: true,
        message: 'Statistics API is working!',
        timestamp: new Date().toISOString(),
        route: req.originalUrl
    });
});
// Add these routes to your statisticsRoutes.js
router.get('/api/statistics/fundraisers/monthly', 
    requireAuth, 
    statisticsController.getMonthlyFundraiserStatistics
);

router.get('/api/statistics/fundraisers/overview', 
    requireAuth, 
    statisticsController.getFundraiserStatistics
);

// Add these routes to your statisticsRoutes.js
router.get('/api/statistics/ranks/overview', 
    requireAuth, 
    statisticsController.getRankStatistics
);

router.get('/api/statistics/forms-requests/monthly', 
    requireAuth, 
    statisticsController.getMonthlyFormsRequestsStatistics
);

router.get('/api/statistics/forms-requests/overview', 
    requireAuth, 
    statisticsController.getFormsRequestsStatistics
);
module.exports = router;