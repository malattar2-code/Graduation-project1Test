// controllers/dashboard/NotificationController.js
const { Op } = require('sequelize');
const Notification = require("../../models/Notification");
const User = require("../../models/User");

class NotificationController {
  // ═════════════════════════════════════════════════════════════
  // GET /api/notifications  →  Get current user's notifications
  // ═════════════════════════════════════════════════════════════
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;

        const notifications = await Notification.findAll({
        where: { 
          user_id: userId,
          is_deleted: false 
        },
        include: [
          { 
            model: User, 
            as: "senderUser", 
            attributes: ["full_name", "email", "user_image"] 
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 50
      });

      // Format for frontend
      const formatted = notifications.map(n => {
        const isAdminSender = n.sender_type === 'admin';
        return {
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.is_read,
          createdAt: n.created_at,
          sender: {
            name: isAdminSender ? 'Najdah Platform Admins' : (n.senderUser?.full_name || 'System'),
            email: isAdminSender ? 'Najdah Platform Admins' : (n.senderUser?.email || ''),
            image: n.senderUser?.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png',
            isAdmin: isAdminSender
          }
        };
      });

      // Count unread
      const unreadCount = notifications.filter(n => !n.is_read).length;

      res.json({ 
        success: true, 
        notifications: formatted,
        unreadCount 
      });

    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // POST /api/notifications/mark-read  →  Mark notification as read
  // ═════════════════════════════════════════════════════════════
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.body;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        where: { id: notificationId, user_id: userId }
      });

      if (!notification) {
        return res.status(404).json({ success: false, error: "Notification not found" });
      }

      notification.is_read = true;
      await notification.save();

      res.json({ success: true, message: "Marked as read" });

    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // DELETE /api/notifications/:id  →  Soft delete notification
  // ═════════════════════════════════════════════════════════════
  async deleteNotification(req, res) {
    try {
      const notificationId = req.params.id;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        where: { id: notificationId, user_id: userId }
      });

      if (!notification) {
        return res.status(404).json({ success: false, error: "Notification not found" });
      }

      notification.is_deleted = true;
      await notification.save();

      res.json({ success: true, message: "Notification deleted" });

    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // POST /api/notifications/send  →  Send notification to users
  // (Called internally by other controllers, or directly)
  // ═════════════════════════════════════════════════════════════
  async sendNotification(req, res) {
    try {
      const { userIds, title, message, type, fundraiserId } = req.body;
      
      // Determine sender: admin or regular user
      const isAdmin = req.user.user_type === 'admin' || req.user.role === 'admin';
      const senderId = req.user.id;
      const senderType = isAdmin ? 'admin' : 'user';
      // Admin notifications use a special display name
      const senderDisplayName = isAdmin ? 'Najdah Platform Admins' : (req.user.email || '');

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ success: false, error: "No recipients specified" });
      }

      if (!title || !message) {
        return res.status(400).json({ success: false, error: "Title and message are required" });
      }

      // Bulk create notifications
      const notificationsData = userIds.map(userId => ({
        user_id: userId,
        sender_id: senderId,
        sender_type: senderType,  // ← NEW: stores 'admin' or 'user'
        fundraiser_id: fundraiserId || null,
        title,
        message,
        type: type || 'general',
        is_read: false,
        is_deleted: false
      }));

      await Notification.bulkCreate(notificationsData);

      res.json({ 
        success: true, 
        message: `Notification sent to ${userIds.length} user(s)`,
        senderType: senderType
      });

    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // GET /api/notifications/unread-count  →  Get unread count (for badge)
  // ═════════════════════════════════════════════════════════════
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      
      const count = await Notification.count({
        where: { 
          user_id: userId, 
          is_read: false,
          is_deleted: false 
        }
      });

      res.json({ success: true, count });

    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }


getAllNotifications = async (req, res) => {
    try {
      if (req.user.user_type !== 'admin' && req.user.role !== 'admin') {
          return res.status(403).json({ success: false, error: "Admin access required" });
      }

      const notifications = await Notification.findAll({
          where: { is_deleted: false },
          order: [['created_at', 'DESC']],
          limit: 1000
      });

      // Format notifications for admin panel with sender display
      const formatted = notifications.map(n => ({
        ...n.toJSON(),
        sender_display: n.sender_type === 'admin' ? 'Najdah Platform Admins' : 'User'
      }));

      res.json({ 
        success: true, 
        data: formatted 
      });

    } catch (error) {
      console.error("Error fetching all notifications:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  };
  // ═════════════════════════════════════════════════════════════
  // INTERNAL: Create system notification (used by other controllers)
  // ═════════════════════════════════════════════════════════════
  async createSystemNotification({ userId, title, message, type = 'general', fundraiserId = null }) {
    try {
      await Notification.create({
        user_id: userId,
        sender_id: 1, // System/Admin sender ID (adjust if your admin ID differs)
        sender_type: 'admin',
        fundraiser_id: fundraiserId,
        title,
        message,
        type,
        is_read: false,
        is_deleted: false
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating system notification:', error);
      return { success: false, error: error.message };
    }
  }
}   

// Export instance and class for internal usage
const notificationControllerInstance = new NotificationController();
module.exports = notificationControllerInstance;
module.exports.NotificationControllerClass = NotificationController;