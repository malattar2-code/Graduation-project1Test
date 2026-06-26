const express = require("express");
const router = express.Router();
const allFundraisersController = require('../../controller/site/allFundraisersController');
const { requireAuth } = require("../../middelware/requireAuth");

router.use(requireAuth);

// Main page
router.get('/all-fundraisers', allFundraisersController.getAllFundraisers);

// AJAX load more
router.get('/all-fundraisers/load-more', allFundraisersController.loadMoreFundraisers);

// Debug route
router.get('/debug/location-parsing', allFundraisersController.debugLocationParsing);

// Hashtag API endpoints
router.get('/api/hashtags/popular', allFundraisersController.getPopularHashtags);
router.post('/api/hashtags/extract', allFundraisersController.extractHashtags);

module.exports = router;