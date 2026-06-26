// routes/dashboard/statisticsRoutes.js
const express = require('express');
const router = express.Router();
const statisticsController = require('../../controller/dashbored/statisticsController');
const { requireAuth, requireAdmin } = require("../../middelware/requireAuth");

// حماية جميع routes الإحصائيات — admin فقط
router.use(requireAuth, requireAdmin);

// User statistics routes with debug middleware
router.get('/api/statistics/users/monthly', 
    statisticsController.debugRoute.bind(statisticsController),
    statisticsController.getMonthlyUserStatistics
);

router.get('/api/statistics/users/overview', 
    statisticsController.getUserStatistics
);

// Fundraiser statistics
router.get('/api/statistics/fundraisers/monthly', 
    statisticsController.getMonthlyFundraiserStatistics
);

router.get('/api/statistics/fundraisers/overview', 
    statisticsController.getFundraiserStatistics
);

// Rank statistics
router.get('/api/statistics/ranks/overview', 
    statisticsController.getRankStatistics
);

// Forms & Requests statistics
router.get('/api/statistics/forms-requests/monthly', 
    statisticsController.getMonthlyFormsRequestsStatistics
);

router.get('/api/statistics/forms-requests/overview', 
    statisticsController.getFormsRequestsStatistics
);
module.exports = router;