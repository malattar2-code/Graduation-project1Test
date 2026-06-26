// routes/dashboard/notificationRoute.js
const express = require("express");
const router = express.Router();
const NotificationController = require("../../controller/dashbored/NotificationController");
const { requireAuth } = require("../../middelware/requireAuth");

router.use(requireAuth);

// Get all notifications for current user
router.get("/api/notifications", NotificationController.getNotifications);

// Get unread count (for badge)
router.get("/api/notifications/unread-count", NotificationController.getUnreadCount);

// Mark notification as read
router.post("/api/notifications/mark-read", NotificationController.markAsRead);

// Send notification to multiple users
router.post("/api/notifications/send", NotificationController.sendNotification);

// Delete (soft delete) notification
router.delete("/api/notifications/:id", NotificationController.deleteNotification);

// Get ALL notifications (for admin panel) — admin only
// Admin-only route (requireAuth already applied via router.use)
router.get("/api/admin/notifications/all", NotificationController.getAllNotifications.bind(NotificationController));

module.exports = router;