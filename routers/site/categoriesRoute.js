const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require("../../middelware/requireAuth");
const categoriesController = require("../../controller/site/categoriesController");
const categoryController = require("../../controller/site/categoryController");
const imageUploadController = require("../../controller/site/imageUploadController");

// Image upload route (admin فقط)
router.post('/upload-image', 
  requireAuth, requireAdmin,
  imageUploadController.uploadImage, 
  imageUploadController.handleImageUpload
);

// API endpoints for categories
router.get('/api/categories', categoriesController.getCategoriesAPI);
router.post('/api/categories', requireAuth, requireAdmin, categoriesController.addCategory);

// Category page routes
router.get('/categories', requireAuth, categoriesController.getCategoriesPage);
router.get('/category/:id', categoryController.getCategoryById);
router.get('/categories/:id', categoryController.getCategoryById);
router.get('/categories/:id/load-more', categoryController.getCategoryFundraisersAjax);

module.exports = router;