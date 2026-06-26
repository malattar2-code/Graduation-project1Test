// routes/site/categoriesRoute.js
const express = require('express');
const router = express.Router();
const categoryController = require("../../controller/site/categoryController");

// Individual category page
router.get('/category/:id', categoryController.getCategoryById);
// AJAX endpoint for pagination
router.get('/categories/:id/load-more', categoryController.getCategoryFundraisersAjax);

// The original route for full page
router.get('/categories/:id', categoryController.getCategoryById);
module.exports = router;