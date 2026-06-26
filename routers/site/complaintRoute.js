const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require("../../middelware/requireAuth");
const complaintController = require('../../controller/site/complaintController');

// Submit complaint (authenticated users only)
router.post('/api/complaints', requireAuth, complaintController.submitComplaint);

// Get user's complaints (authenticated users only)
router.get('/api/complaints/my-complaints', requireAuth, complaintController.getUserComplaints);

// Get all complaints (admin)
router.get('/api/complaints', requireAuth, requireAdmin, complaintController.getAllComplaints);

// Update complaint status (admin)
router.patch('/api/complaints/:id/status', requireAuth, requireAdmin, complaintController.updateComplaintStatus);

// Admin complaint routes
router.get('/api/admin/complaints', requireAuth, requireAdmin, complaintController.getAdminComplaints);
router.patch('/api/admin/complaints/:id/resolve', requireAuth, requireAdmin, complaintController.resolveComplaint);
router.delete('/api/admin/complaints/:id', requireAuth, requireAdmin, complaintController.deleteComplaint);

// Debug routes (admin فقط — لا تُستخدم في الإنتاج)
router.get('/api/debug/complaints', requireAuth, requireAdmin, complaintController.debugComplaints);
router.get('/api/debug/model-check', requireAuth, requireAdmin, complaintController.debugModelCheck);

module.exports = router;