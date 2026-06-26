const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../middelware/requireAuth");
const fundraiserController = require('../../controller/site/fundraiserController');
const commentsController = require('../../controller/site/commentsController');

// Fundraiser detail page route
router.get('/fundraiser/:fundraiserId', fundraiserController.getFundraiserPage);

// API endpoint for dynamic data loading
router.get('/api/fundraiser-data/:fundraiserId', fundraiserController.getFundraiserDataAPI);

// Comment routes
router.post('/api/fundraiser/:fundraiserId/comment', requireAuth, commentsController.addComment);
router.get('/api/fundraiser/:fundraiserId/comments', commentsController.getFundraiserComments);
router.delete('/api/comment/:commentId', requireAuth, commentsController.deleteComment);

module.exports = router;