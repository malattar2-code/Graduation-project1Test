const express = require("express");
const router = express.Router();
const userPanelDonorController = require('../../controller/dashbored/userPanelDonorController');
const { requireAuth } = require("../../middelware/requireAuth");

router.use(requireAuth);

router.get('/userPanelDonor', userPanelDonorController.getDonorPanel);

router.post('/userPanelDonor/update-profile', userPanelDonorController.updateProfile);

router.get('/api/user-rank-points-open/current-user', userPanelDonorController.getCurrentUserRank);

router.get('/debug/user-rank/:userId', userPanelDonorController.debugUserRank);

router.get('/debug/current-user-rank', userPanelDonorController.debugCurrentUserRank);

module.exports = router;