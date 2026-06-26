const express = require('express');
const router = express.Router();
const { requireAuth } = require("../../middelware/requireAuth");
const faqController = require("../../controller/site/faqController");

// Page route - returns HTML
router.get('/faq', faqController.getFAQPage);

// API route - returns JSON
router.get('/api/faqs', faqController.getFAQsAPI);

// Add FAQ
router.post('/api/faqs', requireAuth, faqController.addFAQ);

// Get FAQs by type
router.get('/faqs/type/:type', faqController.getFAQsByType);

// Get recent FAQs
router.get('/api/faqs/recent', faqController.getRecentFAQs);

// Delete FAQ
router.delete('/api/faqs/:id', requireAuth, faqController.deleteFAQ);

module.exports = router;