const express = require('express');
const router = express.Router();
const invoicesController = require('../../controller/site/invoicesController');
const donationStatsController = require('../../controller/site/donationStatsController');
const invoiceStatisticsController = require('../../controller/site/invoiceStatisticsController');

// Session-based authentication middleware
const authenticateUser = (req, res, next) => {
  console.log('🔐 Checking session authentication...');
  
  if (!req.user) {
    console.log('❌ No user in session');
    return res.status(401).json({ success: false, error: 'Not authenticated. Please log in again.' });
  }

  console.log('✅ User authenticated via session, PostgreSQL ID:', req.user.id);
  next();
};

router.use(authenticateUser);

// Invoice routes
router.get('/my-invoices', invoicesController.getUserInvoices);
router.get('/donation-stats', donationStatsController.getUserDonationStats);
router.delete('/:invoiceId', invoicesController.deleteInvoice);
router.get('/fundraiser-stats', donationStatsController.getUserFundraiserStats);

// Debug routes
router.post('/debug-add-points', invoicesController.debugAddPoints);
router.get('/debug-user-points/:id', invoicesController.debugUserPoints);

// Admin routes
router.get('/admin/all-invoices', invoicesController.getAllInvoices);
router.get('/admin/statistics', invoiceStatisticsController.getInvoiceStatistics);

module.exports = router;