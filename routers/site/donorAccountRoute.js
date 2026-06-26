const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../middelware/requireAuth");
const donorAccountController = require("../../controller/site/donorAccountController");

router.use(requireAuth);

router.get('/donor-account/:userId', donorAccountController.getDonorAccount);
router.get('/api/donor-data/:userId', donorAccountController.getDonorDataAPI);

module.exports = router;