const express = require("express");
const router = express.Router();

const rankController = require('../../controller/dashbored/rankController');
const adminPanelController = require('../../controller/dashbored/adminPanelController');
const categoriesController = require("../../controller/site/categoriesController");
const imageUploadController = require("../../controller/site/imageUploadController");

const { requireAuth, requireAdmin } = require("../../middelware/requireAuth");

/* ─── Admin Panel ─── */
router.get('/admin', requireAuth, adminPanelController.getAdminPanel);
router.post('/admin/refresh-rank-counts', requireAuth, adminPanelController.refreshRankCounts);

// At the VERY TOP of the router file, after imports
const bindControllerMethods = (controller) => {
    const methods = [
        'getAllForms', 'getAllRequests', 'deleteForm', 'deleteRequest',
        'getAdminPanel', 'deleteCategory', 'deleteRank', 'resetUserPoints',
        'deleteUserRankPoints', 'refreshRankCounts', 'deleteFundraiser',
        'addTrendCategory', 'removeTrendCategory', 'getMe', 'getAdminMe',
        'getFundraiserStats', 'getAdminCounts', 'banUser', 'unbanUser',
        'blockFundraiser', 'unblockFundraiser', 'findAllUsers',
        'requerterUser', 'donorUsers', 'charityUsers', 'deleteUser',
        'getAllFundraisers','getAllUserRankPoints','getAllVerificationRequests',
        'acceptVerificationRequest', 'rejectVerificationRequest',
        'getSelectedBanners', 'getBannersWithSelection', 'toggleBannerSelection',
        'markUrgent', 'unmarkUrgent',
        // NEW: Financial tables
        'getAllLedgerTransactions', 'getAllFundraiserBalances',
        'getAllWithdrawRequests', 'approveWithdrawRequest', 'rejectWithdrawRequest',
        'executeTransfer', 'retryTransfer', 'completeTransfer',
        'getAllTransferLogs', 'mapWithdrawalMethodToProvider',
    ];
    methods.forEach(method => {
        if (typeof controller[method] === 'function') {
            controller[method] = controller[method].bind(controller);
        }
    });
};

bindControllerMethods(adminPanelController);  // ← BIND FIRST

/* ─── Fundraisers ─── */
router.delete('/api/fundraisers/:id', requireAuth, adminPanelController.deleteFundraiser);
router.post('/api/fundraisers/:id/categories/trend', requireAuth, adminPanelController.addTrendCategory);
router.delete('/api/fundraisers/:id/categories/trend', requireAuth, adminPanelController.removeTrendCategory);
router.post('/api/fundraisers/:id/block', requireAuth, adminPanelController.blockFundraiser);
router.post('/api/fundraisers/:id/unblock', requireAuth, adminPanelController.unblockFundraiser);
router.post('/api/fundraisers/:id/urgent', requireAuth, adminPanelController.markUrgent);
router.post('/api/fundraisers/:id/unurgent', requireAuth, adminPanelController.unmarkUrgent);

/* ─── Users ─── */
router.get("/me", requireAuth, adminPanelController.getMe);
router.get("/admin/me", requireAuth, adminPanelController.getAdminMe);
router.post('/users/:id/ban', adminPanelController.banUser);
router.post('/users/:id/unban', adminPanelController.unbanUser);

/* ─── Statistics ─── */
router.get('/api/fundraiser-stats', adminPanelController.getFundraiserStats);
router.get("/admin/counts", requireAuth, adminPanelController.getAdminCounts);

/* ─── Categories ─── */
router.post('/api/categories', requireAuth, categoriesController.addCategory);
router.delete('/api/categories/:id', requireAuth, adminPanelController.deleteCategory);

/* ─── Image Upload ─── */
router.post('/upload-image', requireAuth, 
    imageUploadController.uploadImage, 
    imageUploadController.handleImageUpload
);

/* ─── Ranks ─── */
router.use(requireAuth);
router.post('/admin/ranks', rankController.addRank);
router.get('/admin/ranks', rankController.getRanks);
router.put('/admin/ranks/:rankId', rankController.updateRank);
router.delete('/ranks/:id', adminPanelController.deleteRank);
router.put('/user-rank-points/:id/reset', adminPanelController.resetUserPoints);
router.delete('/user-rank-points/:id', adminPanelController.deleteUserRankPoints);
/* ─── User Rank Points ─── */
router.get('/api/user-rank-points', requireAuth, adminPanelController.getAllUserRankPoints);

/* ─── Users Management (Integrated from UserRequesterOrDonorsController) ─── */
router.get('/users', requireAuth, adminPanelController.findAllUsers);
router.get('/users/requesters', requireAuth, adminPanelController.requerterUser);
router.get('/users/donors', requireAuth, adminPanelController.donorUsers);
router.get('/users/charities', requireAuth, adminPanelController.charityUsers); // NEW
router.delete('/users/delete/:id', requireAuth, adminPanelController.deleteUser);

/* ─── Forms & Requests ─── */
router.get('/api/fundraiser-forms', requireAuth, adminPanelController.getAllForms);
router.get('/api/fundraiser-requests', requireAuth, adminPanelController.getAllRequests);
router.delete('/api/fundraiser-forms/:id', requireAuth, adminPanelController.deleteForm);
router.delete('/api/fundraiser-requests/:id', requireAuth, adminPanelController.deleteRequest);
router.get('/api/fundraisers/admin/all', requireAuth, adminPanelController.getAllFundraisers);

/* ─── Verification Requests ─── */
router.get('/api/fundraiser-verification-requests', requireAuth, adminPanelController.getAllVerificationRequests);
router.post('/api/fundraiser-verification-requests/:id/accept', requireAuth, adminPanelController.acceptVerificationRequest);
router.post('/api/fundraiser-verification-requests/:id/reject', requireAuth, adminPanelController.rejectVerificationRequest);

/* ─── Banner Selection for Home Page ─── */
router.get('/api/admin/banners/selected', requireAuth, adminPanelController.getSelectedBanners);
router.get('/api/admin/banners/all', requireAuth, adminPanelController.getBannersWithSelection);
router.patch('/api/admin/banners/:id/select', requireAuth, adminPanelController.toggleBannerSelection);

/* ─── Ledger Transactions ─── */
router.get('/api/ledger-transactions', requireAuth, adminPanelController.getAllLedgerTransactions);

/* ─── Fundraiser Balances ─── */
router.get('/api/fundraiser-balances', requireAuth, adminPanelController.getAllFundraiserBalances);

/* ─── Withdraw Requests ─── */
router.get('/api/withdraw-requests', requireAuth, adminPanelController.getAllWithdrawRequests);
router.post('/api/withdraw-requests/:id/approve', requireAuth, adminPanelController.approveWithdrawRequest);
router.post('/api/withdraw-requests/:id/reject', requireAuth, adminPanelController.rejectWithdrawRequest);
router.post('/api/withdraw-requests/:id/execute-transfer', requireAuth, adminPanelController.executeTransfer);
router.post('/api/withdraw-requests/:id/retry-transfer', requireAuth, adminPanelController.retryTransfer);
router.post('/api/withdraw-requests/:id/complete-transfer', requireAuth, adminPanelController.completeTransfer);

/* ─── Transfer Logs ─── */
router.get('/api/transfer-logs', requireAuth, adminPanelController.getAllTransferLogs);

module.exports = router;