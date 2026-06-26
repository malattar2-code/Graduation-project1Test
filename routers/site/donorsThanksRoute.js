const express = require('express');
const router = express.Router();
const { requireAuth } = require("../../middelware/requireAuth");
const donorThanksController = require("../../controller/site/donorThanksController");

router.use(requireAuth);

router.get('/my-donors', donorThanksController.getMyDonors);
router.post('/thank-donor', donorThanksController.thankDonor);
router.get('/my-thankers', donorThanksController.getMyThankers);

module.exports = router;