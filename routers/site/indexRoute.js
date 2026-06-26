// Clean route file - remove duplicate route handlers
const express = require("express");
const router = express.Router();
const indexController = require("../../controller/site/indexController.js");

// Only keep ONE route handler for the index page
router.get('/', indexController.gotoindex);

module.exports = router;