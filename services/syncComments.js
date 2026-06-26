// services/syncComments.js - Fixed version
const { db } = require('../config/firebase-admin');
const admin = require('firebase-admin'); // Import firebase-admin directly for Timestamp
const Comment = require('../models/Comment');
const User = require('../models/User');
const Fundraiser = require('../models/Fundraiser');

class SyncComments {
  constructor() {
    console.log('🔄 Initializing SyncComments...');
    
    try {
      if (!db) {
        throw new Error('Firebase db is not available');
      }
      
      this.firestore = db;
      this.commentsCollection = this.firestore.collection('comments');
      console.log('✅ SyncComments initialized successfully');
    } catch (error) {
      console.error('❌ SyncComments initialization failed:', error);
      throw error;
    }
  }

  async syncSingleCommentToFirebase(comment, isNew = false) {
    let firebaseId = null;
    
    try {
      console.log(`🔄 Starting sync for comment ${comment.comment_id}, isNew: ${isNew}`);

      // Step 1: Fetch comment with associations
      const commentWithAssociations = await Comment.findOne({
        where: { comment_id: comment.comment_id },
        include: [
          { 
            model: User, 
            as: 'user',
            attributes: ['id', 'firebase_uid', 'full_name', 'email', 'user_image', 'user_type'],
            required: false
          },
          { 
            model: Fundraiser, 
            as: 'fundraiser',
            attributes: ['fundraiser_id', 'fundraiser_title', 'firebase_id'],
            required: false
          }
        ]
      });

      if (!commentWithAssociations) {
        throw new Error(`Comment ${comment.comment_id} not found with associations`);
      }

      console.log('✅ Found comment with associations');

      // Step 2: Prepare Firestore data
      const firestoreData = this.prepareFirestoreData(commentWithAssociations);
      console.log('📤 Prepared Firestore data');

      firebaseId = commentWithAssociations.firebase_id;

      if (isNew || !firebaseId) {
        // Step 3: Create new Firestore document
        console.log('🆕 Creating new Firestore document...');
        const docRef = await this.commentsCollection.add(firestoreData);
        firebaseId = docRef.id;
        
        // Step 4: Update PostgreSQL with Firebase ID
        await Comment.update(
          { firebase_id: firebaseId },
          { where: { comment_id: comment.comment_id } }
        );

        // Step 5: Update Firestore with its own ID
        await this.commentsCollection.doc(firebaseId).update({
          firebaseCommentId: firebaseId
        });

        console.log(`✅ Comment ${comment.comment_id} synced to Firestore with ID: ${firebaseId}`);
      } else {
        // Update existing document
        console.log(`📝 Updating existing Firestore document: ${firebaseId}`);
        await this.commentsCollection.doc(firebaseId).update(firestoreData);
        console.log(`✅ Comment ${comment.comment_id} updated in Firestore`);
      }

      return firebaseId;

    } catch (error) {
      console.error(`❌ Error syncing comment ${comment.comment_id} to Firestore:`, error);
      console.error('Error stack:', error.stack);
      return null;
    }
  }

  prepareFirestoreData(commentWithAssociations) {
    const user = commentWithAssociations.user || {};
    const fundraiser = commentWithAssociations.fundraiser || {};
    
    // Use admin.firestore.Timestamp directly
    const Timestamp = admin.firestore.Timestamp;
    const FieldValue = admin.firestore.FieldValue;
    
    // Handle date conversion safely
    const createdAt = commentWithAssociations.created_at || new Date();
    const updatedAt = commentWithAssociations.updated_at || new Date();
    
    return {
      // Core Identifiers
      commentId: commentWithAssociations.comment_id,
      firebaseCommentId: commentWithAssociations.firebase_id || '',
      
      // Relationships
      fundraiserId: commentWithAssociations.fundraiser_id,
      userId: user.firebase_uid || 'unknown-user',
      parentCommentId: commentWithAssociations.parent_comment_id || null,
      
      // Comment Content
      commentText: commentWithAssociations.comment_text || '',
      isDeleted: !!commentWithAssociations.is_deleted,
      
      // User Information
      userName: user.full_name || 'Anonymous User',
      userEmail: user.email || 'no-email@example.com',
      userImage: user.user_image || '',
      userType: user.user_type || 'user',
      
      // Fundraiser Information
      fundraiserTitle: fundraiser.fundraiser_title || 'Unknown Fundraiser',
      fundraiserFirebaseId: fundraiser.firebase_id || '',
      
      // Timestamps - FIXED: Use admin.firestore directly
      createdAt: Timestamp.fromDate(createdAt),
      updatedAt: Timestamp.fromDate(updatedAt),
      syncedAt: FieldValue.serverTimestamp(),
      
      // Metadata
      commentType: commentWithAssociations.parent_comment_id ? 'reply' : 'comment',
      isEdited: commentWithAssociations.created_at && commentWithAssociations.updated_at ?
               commentWithAssociations.created_at.getTime() !== commentWithAssociations.updated_at.getTime() : false
    };
  }

  async syncAllCommentsToFirebase() {
    try {
      console.log('🔄 Starting sync of all comments to Firestore...');
      
      const comments = await Comment.findAll({
        include: [
          { 
            model: User, 
            as: 'user',
            attributes: ['id', 'firebase_uid', 'full_name', 'email', 'user_image', 'user_type'],
            required: false
          },
          { 
            model: Fundraiser, 
            as: 'fundraiser',
            attributes: ['fundraiser_id', 'fundraiser_title', 'firebase_id'],
            required: false
          }
        ]
      });

      console.log(`📝 Found ${comments.length} comments to sync`);

      let successCount = 0;
      let errorCount = 0;

      for (const comment of comments) {
        const result = await this.syncSingleCommentToFirebase(comment, !comment.firebase_id);
        if (result) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      console.log(`✅ Sync completed: ${successCount} successful, ${errorCount} failed`);
      
      return { successCount, errorCount };
    } catch (error) {
      console.error('❌ Error syncing all comments:', error);
      throw error;
    }
  }
}

module.exports = SyncComments;