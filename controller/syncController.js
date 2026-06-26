// controller/syncController.js
const categorySyncService = require('../services/categorySyncService');

const syncController = {
  /**
   * Sync from PostgreSQL to Firebase
   */
  syncToFirebase: async (req, res) => {
    try {
      const result = await categorySyncService.syncPostgresToFirebase();
      res.status(200).json({
        success: true,
        message: 'PostgreSQL to Firebase sync completed',
        data: result
      });
    } catch (error) {
      console.error('Sync to Firebase error:', error);
      res.status(500).json({
        success: false,
        message: 'Sync failed',
        error: error.message
      });
    }
  },

  /**
   * Sync from Firebase to PostgreSQL
   */
  syncToPostgres: async (req, res) => {
    try {
      const result = await categorySyncService.syncFirebaseToPostgres();
      res.status(200).json({
        success: true,
        message: 'Firebase to PostgreSQL sync completed',
        data: result
      });
    } catch (error) {
      console.error('Sync to PostgreSQL error:', error);
      res.status(500).json({
        success: false,
        message: 'Sync failed',
        error: error.message
      });
    }
  },

  /**
   * Two-way sync
   */
  syncBothWays: async (req, res) => {
    try {
      const result = await categorySyncService.syncBothWays();
      res.status(200).json({
        success: true,
        message: 'Two-way sync completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Two-way sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Two-way sync failed',
        error: error.message
      });
    }
  },

  /**
   * Manual sync for a specific category
   */
  syncSingleCategory: async (req, res) => {
    const { categoryId, source } = req.body;
    
    if (!categoryId || !source) {
      return res.status(400).json({
        success: false,
        message: 'categoryId and source (postgres/firebase) are required'
      });
    }

    try {
      const result = await categorySyncService.syncSingleCategory(categoryId, source);
      
      res.status(200).json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Single category sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Single category sync failed',
        error: error.message
      });
    }
  },

  /**
   * Get synchronization statistics
   */
  getSyncStats: async (req, res) => {
    try {
      const stats = await categorySyncService.getSyncStats();
      
      res.status(200).json({
        success: true,
        message: 'Sync statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Get sync stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve sync statistics',
        error: error.message
      });
    }
  }
};

module.exports = syncController;