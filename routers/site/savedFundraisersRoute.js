const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../middelware/requireAuth");
const savedFundraiserController = require("../../controller/site/savedFundraiserController");

// Apply auth middleware to all routes
router.use(requireAuth);

router.post('/save/:fundraiserId', savedFundraiserController.saveFundraiser);
router.delete('/unsave/:fundraiserId', savedFundraiserController.unsaveFundraiser);
router.get('/check/:fundraiserId', savedFundraiserController.checkSavedStatus);
router.get('/my-saved', savedFundraiserController.getMySavedFundraisers);

module.exports = router;