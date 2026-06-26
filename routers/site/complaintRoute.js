const express = require('express');
const router = express.Router();
const { requireAuth } = require("../../middelware/requireAuth");
const complaintController = require('../../controller/site/complaintController');

// Submit complaint (authenticated users only)
router.post('/api/complaints', requireAuth, complaintController.submitComplaint);

// Get user's complaints (authenticated users only)
router.get('/api/complaints/my-complaints', requireAuth, complaintController.getUserComplaints);

// Get all complaints (admin)
router.get('/api/complaints', requireAuth, complaintController.getAllComplaints);

// Update complaint status (admin)
router.patch('/api/complaints/:id/status', requireAuth, complaintController.updateComplaintStatus);

// Admin complaint routes
router.get('/api/admin/complaints', requireAuth, complaintController.getAdminComplaints);
router.patch('/api/admin/complaints/:id/resolve', requireAuth, complaintController.resolveComplaint);
router.delete('/api/admin/complaints/:id', requireAuth, complaintController.deleteComplaint);

// Debug routes
router.get('/api/debug/complaints', complaintController.debugComplaints);
router.get('/api/debug/model-check', complaintController.debugModelCheck);

module.exports = router;