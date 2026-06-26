/**
 * Payment & Withdrawal Routes
 * ============================
 * All routes for the payment and withdrawal system.
 * 
 * Payment Routes (Donations):
 *   POST /api/payments/create-intent     - Create Stripe PaymentIntent + pending invoice
 *   POST /api/payments/confirm           - Confirm payment after Stripe success
 *   GET  /api/payments/status/:invoiceId - Get payment status
 *   GET  /api/payments/my-donations      - Get user's donation history
 *   GET  /api/payments/fundraiser/:fundraiserId/donations - Get fundraiser donations (owner/admin)
 *   POST /api/payments/webhook           - Stripe webhook endpoint
 * 
 * Withdrawal Routes:
 *   GET  /api/withdrawals/eligibility/:fundraiserId        - Check withdrawal eligibility
 *   POST /api/withdrawals/request                          - Create withdrawal request
 *   GET  /api/withdrawals/my-requests                      - Get user's withdrawal requests
 *   GET  /api/withdrawals/fundraiser/:fundraiserId         - Get fundraiser withdrawals (owner/admin)
 *   GET  /api/withdrawals/balance/:fundraiserId            - Get fundraiser balance
 * 
 * Admin Routes:
 *   GET  /api/withdrawals/admin/pending                    - List pending requests (admin)
 *   POST /api/withdrawals/admin/:requestId/approve         - Approve request (admin)
 *   POST /api/withdrawals/admin/:requestId/reject          - Reject request (admin)
 *   POST /api/withdrawals/admin/:requestId/execute-transfer - Execute transfer (admin)
 *   POST /api/withdrawals/admin/transfer/:transferId/complete - Complete transfer (admin)
 *   POST /api/withdrawals/admin/transfer/:transferId/fail  - Fail transfer (admin)
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../../controller/dashbored/paymentController');
const withdrawalController = require('../../controller/dashbored/withdrawalController');

// ── Import auth middleware (adjust path as needed) ──────────────────────────
// const { requireAuth } = require('../../middelware/requireAuth');
// const { requireAdmin } = require('../../middelware/requireAdmin');

// For this file, we assume middleware are available. Adjust imports as needed:
let requireAuth, requireAdmin;
try {
  requireAuth = require('../../middelware/requireAuth').requireAuth;
} catch (e) {
  // Fallback: basic auth check using passport
  requireAuth = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    if (req.user) return next();
    res.status(401).json({ success: false, message: 'Authentication required' });
  };
}

try {
  requireAdmin = require('../../middelware/requireAdmin').requireAdmin;
} catch (e) {
  // Fallback admin check
  requireAdmin = (req, res, next) => {
    if (req.user && (req.user.user_type === 'admin' || req.user.isAdmin)) return next();
    res.status(403).json({ success: false, message: 'Admin access required' });
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// PAYMENT ROUTES (Donations)
// ═════════════════════════════════════════════════════════════════════════════

// Create Stripe PaymentIntent + pending invoice
router.post('/create-intent', requireAuth, paymentController.createPaymentIntent);

// Confirm payment (frontend callback after Stripe)
router.post('/confirm', requireAuth, paymentController.confirmPayment);

// Get payment/invoice status
router.get('/status/:invoiceId', requireAuth, paymentController.getPaymentStatus);

// Get my donation history
router.get('/my-donations', requireAuth, paymentController.getMyDonations);

// Get fundraiser donations (owner or admin)
router.get('/fundraiser/:fundraiserId/donations', requireAuth, paymentController.getFundraiserDonations);

// Stripe webhook (must use raw body parser - see setup below)
// router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);

// ═════════════════════════════════════════════════════════════════════════════
// WITHDRAWAL ROUTES (User)
// ═════════════════════════════════════════════════════════════════════════════

// Check withdrawal eligibility for a fundraiser
router.get('/withdrawals/eligibility/:fundraiserId', requireAuth, withdrawalController.getWithdrawalEligibility);

// Create a withdrawal request
router.post('/withdrawals/request', requireAuth, withdrawalController.createWithdrawalRequest);

// Get my withdrawal requests
router.get('/withdrawals/my-requests', requireAuth, withdrawalController.getMyWithdrawalRequests);

// Get withdrawal requests for a specific fundraiser (owner or admin)
router.get('/withdrawals/fundraiser/:fundraiserId', requireAuth, withdrawalController.getFundraiserWithdrawals);

// Get fundraiser balance
router.get('/withdrawals/balance/:fundraiserId', requireAuth, withdrawalController.getBalance);

// ═════════════════════════════════════════════════════════════════════════════
// WITHDRAWAL ADMIN ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// List pending/all withdrawal requests (admin)
router.get('/withdrawals/admin/pending', requireAuth, requireAdmin, withdrawalController.getPendingWithdrawals);

// Approve a withdrawal request (admin)
router.post('/withdrawals/admin/:requestId/approve', requireAuth, requireAdmin, withdrawalController.approveWithdrawal);

// Reject a withdrawal request (admin)
router.post('/withdrawals/admin/:requestId/reject', requireAuth, requireAdmin, withdrawalController.rejectWithdrawal);

// Execute transfer for approved request (admin)
router.post('/withdrawals/admin/:requestId/execute-transfer', requireAuth, requireAdmin, withdrawalController.executeTransfer);

// Complete a transfer (admin)
router.post('/withdrawals/admin/transfer/:transferId/complete', requireAuth, requireAdmin, withdrawalController.completeTransfer);

// Fail a transfer (admin)
router.post('/withdrawals/admin/transfer/:transferId/fail', requireAuth, requireAdmin, withdrawalController.failTransfer);

module.exports = router;
