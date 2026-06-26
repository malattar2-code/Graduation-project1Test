// models/Notification.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbSQL");
const User = require("./User");

const Notification = sequelize.define("Notification", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Who receives this notification
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "users", key: "id" }
  },
  // Who sent it (form owner / charity)
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "users", key: "id" }
  },
  // In models/Notification.js, add after sender_id:
  sender_type: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
    allowNull: false,
    comment: 'Type of sender: user or admin'
  },
  // Related fundraiser for context
  fundraiser_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "fundraisers", key: "fundraiser_id" }
  },
  // Notification title
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  // The message content
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // Notification type for future expansion
  type: {
    type: DataTypes.ENUM('campaign_complete', 'request_accepted', 'request_rejected', 'general', 'donation_received', 'donation_received_owner', 'withdrawal_requested', 'withdrawal_transferred'),
    defaultValue: 'general',
    allowNull: false
  },
  // Whether user has read it
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  // Soft delete support (optional, but good practice)
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: "notifications",
  underscored: true,
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    { fields: ['user_id', 'is_deleted', 'is_read'], name: 'idx_notifications_user_unread' },
    { fields: ['created_at'], name: 'idx_notifications_created' }
  ]
});


module.exports = Notification;