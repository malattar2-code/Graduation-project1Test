const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../middelware/requireAuth");
const indigentAccountController = require("../../controller/site/indigentAccountController");

router.use(requireAuth);

router.get('/indigent-account/:userId', indigentAccountController.getIndigentAccount);

module.exports = router;