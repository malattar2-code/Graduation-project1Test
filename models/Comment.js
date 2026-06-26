// models/Comment.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbSQL");

const Comment = sequelize.define("Comment", {
  comment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fundraiser_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "fundraisers",
      key: "fundraiser_id"
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "users",
      key: "id"
    }
  },
  comment_text: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 500]
    }
  },
  parent_comment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "comments",
      key: "comment_id"
    }
  },
  firebase_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  // models/Comment.js - Add these fields to the model definition
  is_blocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  block_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  blocked_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: "comments",
  underscored: true,
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
    // In Comment model - FIX THE PATH
hooks: {
  afterCreate: async (comment, options) => {
    console.log('🔄 Comment afterCreate hook triggered for ID:', comment.comment_id);

    if (!comment.firebase_id) {
      try {
        // Use relative path that works with your project structure
        const SyncComments = require('../services/syncComments'); // Fixed path
        const syncService = new SyncComments();
        console.log('🔄 Starting auto-sync for new comment...');
        await syncService.syncSingleCommentToFirebase(comment, true);
        console.log('✅ Auto-sync completed for comment:', comment.comment_id);
      } catch (error) {
        console.error('❌ Error auto-syncing new comment to Firestore:', error);
        // Don't throw error to prevent breaking comment creation
      }
    } else {
      console.log('ℹ️ Comment already has Firebase ID, skipping sync');
    }
  },
  afterUpdate: async (comment, options) => {
    console.log('🔄 Comment afterUpdate hook triggered for ID:', comment.comment_id);
    
    try {
      const SyncComments = require('../services/syncComments'); // Fixed path
      const syncService = new SyncComments();
      console.log('🔄 Starting auto-sync for updated comment...');
      await syncService.syncSingleCommentToFirebase(comment, false);
      console.log('✅ Auto-sync completed for updated comment:', comment.comment_id);
    } catch (error) {
      console.error('❌ Error auto-syncing updated comment to Firestore:', error);
      // Don't throw error to prevent breaking comment update
    }
  }
}
});

// Instance method to get Firestore data format
Comment.prototype.toFirestoreData = function(user = null, fundraiser = null) {
  return {
    commentId: this.comment_id,
    fundraiserId: this.fundraiser_id,
    userId: user ? user.firebase_uid : null,
    userEmail: user ? user.email : null,
    userName: user ? user.full_name : 'Anonymous',
    userImage: user ? user.user_image : null,
    commentText: this.comment_text,
    parentCommentId: this.parent_comment_id,
    firebaseCommentId: this.firebase_id,
    createdAt: this.created_at,
    updatedAt: this.updated_at,
    isDeleted: this.is_deleted,
    // Fundraiser info for easier querying
    fundraiserTitle: fundraiser ? fundraiser.fundraiser_title : null,
    fundraiserFirebaseId: fundraiser ? fundraiser.firebase_id : null
  };
};

module.exports = Comment;